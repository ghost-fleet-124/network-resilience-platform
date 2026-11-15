import ipaddress
import secrets
import hashlib
import time
from typing import Dict, Tuple, Optional
import aiohttp
from app.config import GLOBAL_SAFETY_LIMITS, PRESET_CONFIGS
from app.models import (
    IntensityPresetEnum,
    TestStartRequest,
    PresetConfig,
    TargetVerificationResponse
)
from app.core.cluster_manager import cluster_manager

class SafetyGovernor:
    def __init__(self):
        self._verified_targets: Dict[str, Dict] = {}
        self._approved_local_hosts = {"127.0.0.1", "localhost", "::1", "0.0.0.0"}
        self._circuit_violations: Dict[str, int] = {}

    def generate_challenge_token(self, host: str, port: int) -> str:
        raw = f"{host}:{port}:{time.time()}:{secrets.token_hex(16)}"
        return f"resilience-auth-{hashlib.sha256(raw.encode()).hexdigest()[:24]}"

    async def verify_target_authorization(self, host: str, port: int, challenge_token: Optional[str] = None) -> TargetVerificationResponse:
        host_clean = host.strip().lower()
        target_key = f"{host_clean}:{port}"

        # 1. Localhost check
        if host_clean in self._approved_local_hosts:
            self._verified_targets[target_key] = {
                "token": "local-bypass",
                "verified_at": time.time(),
                "scope": "LOCAL_SANDBOX"
            }
            return TargetVerificationResponse(
                host=host_clean,
                port=port,
                is_authorized=True,
                scope="LOCAL_SANDBOX",
                message="Target is a verified local testing endpoint.",
                verification_method="LOCAL_LOOPBACK"
            )

        # 2. Check if host is an RFC1918 private network IP
        try:
            ip_obj = ipaddress.ip_address(host_clean)
            if ip_obj.is_private:
                self._verified_targets[target_key] = {
                    "token": "private-net",
                    "verified_at": time.time(),
                    "scope": "RFC1918_PRIVATE_NET"
                }
                return TargetVerificationResponse(
                    host=host_clean,
                    port=port,
                    is_authorized=True,
                    scope="PRIVATE_NETWORK",
                    message="Target is an RFC1918 internal private network host (authorized for lab testing).",
                    verification_method="PRIVATE_IP_AFFIRMATION"
                )
        except ValueError:
            pass

        # 3. Check already verified cache
        if target_key in self._verified_targets:
            entry = self._verified_targets[target_key]
            if time.time() - entry["verified_at"] < 86400:
                return TargetVerificationResponse(
                    host=host_clean,
                    port=port,
                    is_authorized=True,
                    scope=entry.get("scope", "VERIFIED_PUBLIC"),
                    message="Target authorization active from cached verification challenge.",
                    verification_method="CACHED_TOKEN"
                )

        # 4. If challenge token is provided, attempt HTTP challenge check
        token = challenge_token or self.generate_challenge_token(host_clean, port)
        if challenge_token:
            challenge_url = f"http://{host_clean}:{port}/.well-known/resilience-challenge.txt"
            try:
                timeout = aiohttp.ClientTimeout(total=4)
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.get(challenge_url) as resp:
                        if resp.status == 200:
                            body = (await resp.text()).strip()
                            if challenge_token in body:
                                self._verified_targets[target_key] = {
                                    "token": challenge_token,
                                    "verified_at": time.time(),
                                    "scope": "VERIFIED_PUBLIC"
                                }
                                return TargetVerificationResponse(
                                    host=host_clean,
                                    port=port,
                                    is_authorized=True,
                                    scope="VERIFIED_PUBLIC",
                                    message="Ownership verified via HTTP challenge token.",
                                    challenge_token=challenge_token,
                                    verification_method="HTTP_WELL_KNOWN"
                                )
            except Exception:
                pass

        return TargetVerificationResponse(
            host=host_clean,
            port=port,
            is_authorized=False,
            scope="UNVERIFIED",
            message=f"External target requires explicit authorization. Please place this token at http://{host_clean}:{port}/.well-known/resilience-challenge.txt, or use local/lab targets.",
            challenge_token=token,
            verification_method="PENDING_CHALLENGE"
        )

    def enforce_traffic_budget(self, req: TestStartRequest) -> Tuple[PresetConfig, int, int]:
        """
        Enforces that the test parameters do not exceed preset limits or global safety ceilings.
        Returns: (PresetConfig, effective_target_rps, effective_conns)
        """
        preset_cfg = PRESET_CONFIGS.get(req.intensity, PRESET_CONFIGS[IntensityPresetEnum.LOW])
        target_rps = req.target_rps_override or preset_cfg.target_rps

        # Enforce High-Intensity Safety Confirmation check (>= 500k RPS)
        if target_rps >= GLOBAL_SAFETY_LIMITS["HIGH_INTENSITY_CONFIRMATION_THRESHOLD_RPS"]:
            if not req.safety_confirmation_acknowledged:
                # If local sandbox, auto-permit, otherwise require explicit acknowledgment
                if req.host not in self._approved_local_hosts:
                    raise PermissionError(
                        f"High-intensity workload of {target_rps:,} RPS requires explicit operator safety confirmation."
                    )

        # Enforce rate clamp
        effective_rate = min(target_rps, GLOBAL_SAFETY_LIMITS["MAX_TARGET_RPS"])
        
        # Enforce connections clamp
        effective_conns = min(preset_cfg.max_conns, GLOBAL_SAFETY_LIMITS["MAX_CONCURRENT_CONNS"])

        # Enforce duration clamp
        effective_duration = req.duration_sec or preset_cfg.default_duration_sec
        effective_duration = min(effective_duration, preset_cfg.max_duration_sec, GLOBAL_SAFETY_LIMITS["MAX_DURATION_SEC"])
        req.duration_sec = effective_duration

        # Shard / allocate with cluster manager
        cluster_manager.distribute_workload(effective_rate)

        return preset_cfg, effective_rate, effective_conns

    def check_circuit_breaker(
        self,
        test_id: str,
        error_rate_pct: float,
        avg_latency_ms: float,
        cpu_usage_pct: float,
        total_ops: int = 0,
        threshold_error_pct: float = 50.0,
        threshold_latency_ms: float = 5000.0
    ) -> Tuple[bool, Optional[str]]:
        # Prevent cold-start false positives before statistically meaningful sample size
        if total_ops < 25:
            self._circuit_violations[test_id] = 0
            return False, None

        reasons = []
        if error_rate_pct >= threshold_error_pct:
            reasons.append(f"Error rate ({error_rate_pct:.1f}%) exceeded safe ceiling ({threshold_error_pct:.1f}%)")
        if avg_latency_ms >= threshold_latency_ms:
            reasons.append(f"Average latency ({avg_latency_ms:.1f}ms) exceeded safety threshold ({threshold_latency_ms:.1f}ms)")
        if cpu_usage_pct >= GLOBAL_SAFETY_LIMITS["EMERGENCY_CPU_THRESHOLD_PCT"]:
            reasons.append(f"Generator CPU load ({cpu_usage_pct:.1f}%) critically high")

        if reasons:
            count = self._circuit_violations.get(test_id, 0) + 1
            self._circuit_violations[test_id] = count
            if count >= 3:
                return True, " & ".join(reasons)
        else:
            self._circuit_violations[test_id] = 0

        return False, None

safety_governor = SafetyGovernor()
