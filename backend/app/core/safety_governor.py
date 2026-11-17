import os
import json
import time
import ipaddress
import uuid
from typing import Dict, List, Tuple, Optional
from app.config import GLOBAL_SAFETY_LIMITS, PRESET_CONFIGS
from app.models import (
    IntensityPresetEnum,
    ProtocolEnum,
    TestStartRequest,
    PresetConfig,
    TargetVerificationResponse,
    ApprovedScope,
    RegisterScopeRequest,
    ScopeStatusEnum
)
from app.core.cluster_manager import cluster_manager
from app.core.storage import storage

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
SCOPES_FILE = os.path.join(DATA_DIR, "approved_scopes.json")

class SafetyGovernor:
    """
    Enterprise Safety, Traffic Budgeting, and Target Scope Authorization Governor.
    - Manages approved organization testing scopes (wildcards, domains, CIDRs, IPs).
    - Enforces legal acceptable-use boundaries and explicit permissions.
    - Enforces numerical RPS limits, connection budgets, and safety circuit breakers.
    - Rejects expired, revoked, or unauthorized testing targets.
    """

    def __init__(self):
        self._approved_local_hosts = {"127.0.0.1", "localhost", "::1", "0.0.0.0"}
        self._circuit_violations: Dict[str, int] = {}
        self._scopes: Dict[str, ApprovedScope] = {}
        self._load_scopes()

    def _load_scopes(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        if os.path.exists(SCOPES_FILE):
            try:
                with open(SCOPES_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        scope = ApprovedScope(**item)
                        # Check dynamic expiration
                        if scope.status == ScopeStatusEnum.ACTIVE and time.time() > scope.valid_until:
                            scope.status = ScopeStatusEnum.EXPIRED
                        self._scopes[scope.scope_id] = scope
                return
            except Exception as e:
                print(f"[SafetyGovernor] Error loading scopes: {e}")

        # Seed initial enterprise organization scopes
        now = time.time()
        seed_scopes = [
            ApprovedScope(
                scope_id="scope_apex_staging",
                name="Apex Championship Staging & Internal Services",
                organization="Apex Interactive Corp",
                authorized_by="ciso-security@apexgaming.net",
                target_pattern="*.staging.apexgaming.net",
                allowed_ports=[80, 443, 8000, 8080, 9000, 9001, 9002, 9003, 9004, 9005],
                max_rps_allowed=5000000,
                valid_from=now - 86400,
                valid_until=now + (180 * 86400), # 180 days valid
                terms_acknowledged=True,
                status=ScopeStatusEnum.ACTIVE,
                notes="Authorized scope covering all staging tournament nodes and internal microservices."
            ),
            ApprovedScope(
                scope_id="scope_tournament_subnet",
                name="Dedicated Tournament Ingress Subnet",
                organization="Apex Global Infrastructure",
                authorized_by="infra-lead@apexgaming.net",
                target_pattern="198.51.100.0/24",
                allowed_ports=[80, 443, 9001, 9002, 9003, 9004, 9005],
                max_rps_allowed=3000000,
                valid_from=now - 86400,
                valid_until=now + (90 * 86400),
                terms_acknowledged=True,
                status=ScopeStatusEnum.ACTIVE,
                notes="Dedicated bare-metal tournament game server ingress pool."
            ),
            ApprovedScope(
                scope_id="scope_legacy_game_2025",
                name="Legacy Tournament 2025 Test Bed (Expired)",
                organization="Legacy Tournament Ops",
                authorized_by="ops-2025@apexgaming.net",
                target_pattern="legacy.tournament-2025.com",
                allowed_ports=[80, 443],
                max_rps_allowed=100000,
                valid_from=now - (120 * 86400),
                valid_until=now - (30 * 86400), # Expired 30 days ago
                terms_acknowledged=True,
                status=ScopeStatusEnum.EXPIRED,
                notes="Historical testing scope for concluded 2025 tournament. Permission expired."
            )
        ]
        for s in seed_scopes:
            self._scopes[s.scope_id] = s
        self._save_scopes()

    def _save_scopes(self):
        try:
            with open(SCOPES_FILE, "w", encoding="utf-8") as f:
                json.dump([s.model_dump() for s in self._scopes.values()], f, indent=2)
        except Exception as e:
            print(f"[SafetyGovernor] Error saving scopes: {e}")

    def get_all_scopes(self) -> List[ApprovedScope]:
        now = time.time()
        for s in self._scopes.values():
            if s.status == ScopeStatusEnum.ACTIVE and now > s.valid_until:
                s.status = ScopeStatusEnum.EXPIRED
        return list(self._scopes.values())

    def _normalize_host_or_pattern(self, raw: str) -> Tuple[str, Optional[int]]:
        """
        Normalizes user-entered targets (URLs, domains, IPs, patterns) into a clean
        comparable hostname/pattern and optional extracted port.
        """
        raw = raw.strip().lower()
        if not raw:
            return ("", None)

        # If it contains scheme, parse URL
        if raw.startswith("http://") or raw.startswith("https://"):
            from urllib.parse import urlparse
            try:
                p = urlparse(raw)
                h = p.hostname or ""
                port = p.port or (443 if p.scheme == "https" else 80)
                return (h, port)
            except Exception:
                pass

        # Strip any paths or queries if not CIDR
        if "/" in raw and not any(raw.endswith(m) for m in ("/8", "/16", "/24", "/32")):
            raw = raw.split("/")[0]

        # Strip port if present (and not IPv6 or CIDR)
        if ":" in raw and not raw.startswith("["):
            parts = raw.split(":")
            if len(parts) == 2 and parts[1].isdigit():
                return (parts[0], int(parts[1]))

        return (raw, None)

    def _matches_pattern(self, host: str, pattern: str) -> bool:
        h_clean, _ = self._normalize_host_or_pattern(host)
        p_clean, _ = self._normalize_host_or_pattern(pattern)

        if not h_clean or not p_clean:
            return False

        # Exact match
        if h_clean == p_clean:
            return True

        # Wildcard match (*.apexgaming.net matches sub.apexgaming.net and apexgaming.net)
        if p_clean.startswith("*."):
            root = p_clean[2:]
            return h_clean.endswith("." + root) or h_clean == root

        # Apex / www equivalence (e.g. abes.ac.in matches www.abes.ac.in)
        if h_clean == f"www.{p_clean}" or p_clean == f"www.{h_clean}":
            return True

        # CIDR IP subnet match (e.g. 198.51.100.0/24)
        if "/" in p_clean:
            try:
                target_ip = ipaddress.ip_address(h_clean)
                network = ipaddress.ip_network(p_clean, strict=False)
                return target_ip in network
            except ValueError:
                return False

        # Direct IP string match
        try:
            target_ip = ipaddress.ip_address(h_clean)
            pat_ip = ipaddress.ip_address(p_clean)
            return target_ip == pat_ip
        except ValueError:
            return False

    def register_scope(self, req: RegisterScopeRequest) -> ApprovedScope:
        scope_id = f"target_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        now = time.time()
        valid_until = now + (max(1, req.valid_days) * 86400)
        
        # Cleanly extract normalized pattern and port
        cleaned_pattern, extracted_port = self._normalize_host_or_pattern(req.target_pattern)
        if not cleaned_pattern:
            cleaned_pattern = req.target_pattern.strip().lower()

        allowed_ports = list(req.allowed_ports) if req.allowed_ports else []
        if extracted_port and extracted_port not in allowed_ports:
            allowed_ports.append(extracted_port)
            
        # Default to standard ports if none provided to avoid accidental user blockages
        if not allowed_ports:
            allowed_ports = [80, 443, 8000, 8080, 8443, 9000, 9001, 9002, 9003, 9004, 9005]

        scope = ApprovedScope(
            scope_id=scope_id,
            target_id=scope_id,
            name=req.name.strip(),
            organization=req.organization.strip(),
            authorized_by=req.authorized_by.strip(),
            target_pattern=cleaned_pattern,
            host=cleaned_pattern,
            target_url=req.target_url or (f"http://{cleaned_pattern}/" if not cleaned_pattern.startswith("*") else None),
            allowed_ports=allowed_ports,
            max_rps_allowed=req.max_rps_allowed,
            valid_from=now,
            valid_until=valid_until,
            terms_acknowledged=req.terms_acknowledged,
            status=ScopeStatusEnum.ACTIVE,
            notes=req.notes
        )
        self._scopes[scope_id] = scope
        self._save_scopes()

        storage.log_audit_event("REGISTER_SCOPE", scope_id, {
            "name": scope.name,
            "organization": scope.organization,
            "authorized_by": scope.authorized_by,
            "pattern": scope.target_pattern,
            "valid_until": valid_until,
            "max_rps": scope.max_rps_allowed
        })

        return scope

    def revoke_scope(self, scope_id: str) -> Optional[ApprovedScope]:
        if scope_id in self._scopes:
            scope = self._scopes[scope_id]
            scope.status = ScopeStatusEnum.REVOKED
            self._save_scopes()
            storage.log_audit_event("REVOKE_SCOPE", scope_id, {
                "name": scope.name,
                "reason": "ADMIN_REVOCATION"
            })
            return scope
        return None

    async def verify_target_authorization(
        self,
        host: str,
        port: int,
        target_id: Optional[str] = None,
        protocol: Optional[ProtocolEnum] = None
    ) -> TargetVerificationResponse:
        """
        Evaluates whether a target is approved for resilience testing.
        1. Local loopback / sandbox -> Always authorized.
        2. Explicit Target ID lookup -> Matches registered target record directly.
        3. Pattern matching against registered organization scopes.
        4. Expired / revoked / port-restricted targets -> Explicitly rejected with clear reason.
        5. RFC1918 private network -> Authorized for internal laboratory testing.
        6. Unmatched external targets -> Clearly rejected with actionable guidance.
        """
        host_clean, extracted_port = self._normalize_host_or_pattern(host)
        effective_port = port or extracted_port or 80
        now = time.time()

        # 1. Local loopback sandbox check
        if host_clean in self._approved_local_hosts or not host_clean:
            return TargetVerificationResponse(
                host=host_clean or "127.0.0.1",
                port=effective_port,
                is_authorized=True,
                scope="LOCAL_SANDBOX",
                target_id="LOCAL_SANDBOX",
                scope_name="Local Loopback Sandbox",
                message="Target is a verified local testing endpoint (safe for offline testing).",
                verification_method="LOCAL_LOOPBACK"
            )

        # 2. Check if a specific target_id (or scope_id) was provided by the user
        if target_id and target_id in self._scopes:
            target = self._scopes[target_id]
            if target.status == ScopeStatusEnum.REVOKED:
                return TargetVerificationResponse(
                    host=host_clean,
                    port=effective_port,
                    is_authorized=False,
                    scope=target.scope_id,
                    target_id=target.scope_id,
                    scope_name=target.name,
                    authorized_by=target.authorized_by,
                    expires_at=target.valid_until,
                    message=f"Target '{target.name}' has been administratively REVOKED.",
                    rejection_reason="This target was revoked. Reactivate or register a new target in Authorized Targets.",
                    verification_method="REVOKED_TARGET"
                )
            if target.status == ScopeStatusEnum.EXPIRED or now > target.valid_until:
                expiry_str = time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime(target.valid_until))
                return TargetVerificationResponse(
                    host=host_clean,
                    port=effective_port,
                    is_authorized=False,
                    scope=target.scope_id,
                    target_id=target.scope_id,
                    scope_name=target.name,
                    authorized_by=target.authorized_by,
                    expires_at=target.valid_until,
                    message=f"Target '{target.name}' authorization EXPIRED on {expiry_str}.",
                    rejection_reason="Testing authorization for this target has expired. An administrator must renew the target.",
                    verification_method="EXPIRED_SCOPE"
                )
            if target.allowed_ports and effective_port not in target.allowed_ports:
                return TargetVerificationResponse(
                    host=host_clean,
                    port=effective_port,
                    is_authorized=False,
                    scope=target.scope_id,
                    target_id=target.scope_id,
                    scope_name=target.name,
                    authorized_by=target.authorized_by,
                    expires_at=target.valid_until,
                    message=f"Port {effective_port} is not in the approved ports list for target '{target.name}'.",
                    rejection_reason=f"Target port {effective_port} is restricted. Scope allowed ports: {target.allowed_ports}.",
                    verification_method="PORT_DISALLOWED"
                )
            # Target ID matches and is active!
            expiry_str = time.strftime("%Y-%m-%d", time.gmtime(target.valid_until))
            return TargetVerificationResponse(
                host=host_clean,
                port=effective_port,
                is_authorized=True,
                scope=target.scope_id,
                target_id=target.scope_id,
                scope_name=target.name,
                authorized_by=target.authorized_by,
                expires_at=target.valid_until,
                message=f"Target covered by authorized target: '{target.name}' (Authorized by {target.authorized_by}, valid through {expiry_str}).",
                verification_method="TARGET_ID_MATCH"
            )

        # 3. Match against registered organization scopes (by pattern / domain / IP)
        matched_scope: Optional[ApprovedScope] = None
        expired_scope: Optional[ApprovedScope] = None
        port_disallowed_scope: Optional[ApprovedScope] = None

        for scope in self._scopes.values():
            if self._matches_pattern(host_clean, scope.target_pattern):
                if scope.status == ScopeStatusEnum.REVOKED:
                    continue
                
                if scope.status == ScopeStatusEnum.EXPIRED or now > scope.valid_until:
                    scope.status = ScopeStatusEnum.EXPIRED
                    expired_scope = scope
                    continue

                if scope.allowed_ports and effective_port not in scope.allowed_ports:
                    port_disallowed_scope = scope
                    continue

                matched_scope = scope
                break

        if matched_scope:
            expiry_str = time.strftime("%Y-%m-%d", time.gmtime(matched_scope.valid_until))
            return TargetVerificationResponse(
                host=host_clean,
                port=effective_port,
                is_authorized=True,
                scope=matched_scope.scope_id,
                target_id=matched_scope.scope_id,
                scope_name=matched_scope.name,
                authorized_by=matched_scope.authorized_by,
                expires_at=matched_scope.valid_until,
                message=f"Target covered by approved scope: '{matched_scope.name}' (Authorized by {matched_scope.authorized_by}, valid through {expiry_str}).",
                verification_method="ORGANIZATION_SCOPE"
            )

        # 3. Handle expired scope match
        if expired_scope:
            expiry_str = time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime(expired_scope.valid_until))
            return TargetVerificationResponse(
                host=host_clean,
                port=port,
                is_authorized=False,
                scope=expired_scope.scope_id,
                scope_name=expired_scope.name,
                authorized_by=expired_scope.authorized_by,
                expires_at=expired_scope.valid_until,
                message=f"Target matches organization scope '{expired_scope.name}', but authorization EXPIRED on {expiry_str}.",
                rejection_reason="The testing window for this target has expired. An organization administrator must renew or register a new scope.",
                verification_method="EXPIRED_SCOPE"
            )

        # 4. Handle port restriction failure
        if port_disallowed_scope:
            return TargetVerificationResponse(
                host=host_clean,
                port=port,
                is_authorized=False,
                scope=port_disallowed_scope.scope_id,
                scope_name=port_disallowed_scope.name,
                authorized_by=port_disallowed_scope.authorized_by,
                expires_at=port_disallowed_scope.valid_until,
                message=f"Port {port} is not in the allowed ports list for scope '{port_disallowed_scope.name}'.",
                rejection_reason=f"Target port {port} is restricted. Scope allowed ports: {port_disallowed_scope.allowed_ports}.",
                verification_method="PORT_DISALLOWED"
            )

        # 5. Check if host is an RFC1918 / RFC4193 private network IP (Fallback for internal lab environments)
        try:
            ip_obj = ipaddress.ip_address(host_clean)
            if ip_obj.is_private:
                return TargetVerificationResponse(
                    host=host_clean,
                    port=port,
                    is_authorized=True,
                    scope="PRIVATE_NETWORK",
                    scope_name="RFC1918 Private Network",
                    message="Target is an RFC1918 internal private IP address (authorized for lab testing).",
                    verification_method="PRIVATE_NETWORK"
                )
        except ValueError:
            pass

        # 6. Unmatched external target rejection
        return TargetVerificationResponse(
            host=host_clean,
            port=port,
            is_authorized=False,
            scope="UNAUTHORIZED_EXTERNAL_TARGET",
            message=f"External target '{host_clean}' is not covered by any active authorized testing scope.",
            rejection_reason="External target domain or IP is not registered in the organization's approved scopes. Register a scope in Scope Manager.",
            verification_method="UNAUTHORIZED"
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
