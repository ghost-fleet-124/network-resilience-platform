import time
import math
import psutil
from collections import deque
from typing import Dict, List, Optional
from app.models import MetricSnapshot, TestStatusEnum, TestReport, ProtocolEnum, IntensityPresetEnum
from app.core.cluster_manager import cluster_manager

class RollingRateBucket:
    __slots__ = ('slot_id', 'dispatched', 'received', 'successful', 'failed', 'bytes', 'packets_sent', 'packets_recv')
    def __init__(self):
        self.slot_id = -1
        self.dispatched = 0
        self.received = 0
        self.successful = 0
        self.failed = 0
        self.bytes = 0
        self.packets_sent = 0
        self.packets_recv = 0

    def get_or_reset(self, slot_id: int):
        if self.slot_id != slot_id:
            self.slot_id = slot_id
            self.dispatched = 0
            self.received = 0
            self.successful = 0
            self.failed = 0
            self.bytes = 0
            self.packets_sent = 0
            self.packets_recv = 0
        return self

class MetricsCollector:
    def __init__(
        self,
        test_id: str,
        protocol: ProtocolEnum,
        intensity: IntensityPresetEnum,
        target_rps: int,
        host: str,
        port: int,
        ramp_up_sec: int = 5,
        sustained_sec: int = 30,
        ramp_down_sec: int = 5
    ):
        self.test_id = test_id
        self.protocol = protocol
        self.intensity = intensity
        self.target_rps = target_rps
        self.host = host
        self.port = port
        self.start_time = time.time()
        self.end_time: Optional[float] = None
        self.status = TestStatusEnum.INITIALIZING
        self.abort_reason: Optional[str] = None

        # Workload Curve Configuration
        self.ramp_up_sec = ramp_up_sec
        self.sustained_sec = sustained_sec
        self.ramp_down_sec = ramp_down_sec

        # Cumulative counters (Authoritative source of truth)
        self.total_generated_requests = 0
        self.total_received_requests = 0
        self.total_successful_requests = 0
        self.total_failed_requests = 0
        
        self.total_packets_sent = 0
        self.total_packets_received = 0
        self.total_bytes_transferred = 0

        # Connection counts
        self.active_conns = 0
        self.successful_conns = 0
        self.failed_conns = 0
        self.connection_errors = 0

        # Unbounded time-bucketed rolling rate calculator (20 slots of 50ms = 1.0s window)
        self._bucket_interval = 0.05
        self._buckets = [RollingRateBucket() for _ in range(20)]

        # Latency statistics reservoir (2000 samples for accurate P50/P95/P99)
        self._latencies_window: deque = deque(maxlen=2000)
        self._all_latencies_sample: List[float] = []
        self._max_sample_size = 10000

        # RFC 3550 Jitter calculation state
        self._last_latency_ms: Optional[float] = None
        self._jitter_accumulator: float = 0.0

        # Status code breakdown
        self.status_codes: Dict[str, int] = {}
        self.snapshots_history: List[MetricSnapshot] = []

    def get_current_workload_multiplier(self) -> float:
        """
        Calculates the workload multiplier based on the curve:
        - 0 to ramp_up_sec: linearly scales from 0.1 to 1.0
        - ramp_up_sec to ramp_up + sustained: 1.0 (peak sustained)
        - ramp_up + sustained to end: linearly scales from 1.0 to 0.1
        """
        elapsed = time.time() - self.start_time
        if self.ramp_up_sec > 0 and elapsed < self.ramp_up_sec:
            return max(0.1, min(1.0, elapsed / self.ramp_up_sec))
        
        sustained_end = self.ramp_up_sec + self.sustained_sec
        if elapsed < sustained_end:
            return 1.0
        
        total_time = sustained_end + self.ramp_down_sec
        if self.ramp_down_sec > 0 and elapsed < total_time:
            remaining = total_time - elapsed
            return max(0.05, min(1.0, remaining / self.ramp_down_sec))
        
        return 1.0

    def record_request_generated(self, count: int = 1, bytes_transferred: int = 64):
        """Records traffic emitted by the generator workers."""
        now = time.time()
        self.total_generated_requests += count
        self.total_bytes_transferred += bytes_transferred

        slot_id = int(now / self._bucket_interval)
        b = self._buckets[slot_id % 20].get_or_reset(slot_id)
        b.dispatched += count
        b.bytes += bytes_transferred

    def record_request_result(self, latency_ms: float, success: bool, bytes_transferred: int, status_code: Optional[int] = None):
        """Records a response received from the target."""
        now = time.time()
        self.total_received_requests += 1
        self.total_bytes_transferred += bytes_transferred

        slot_id = int(now / self._bucket_interval)
        b = self._buckets[slot_id % 20].get_or_reset(slot_id)
        b.received += 1
        b.bytes += bytes_transferred

        if success:
            self.total_successful_requests += 1
            b.successful += 1
        else:
            self.total_failed_requests += 1
            b.failed += 1

        if status_code:
            code_str = str(status_code)
            self.status_codes[code_str] = self.status_codes.get(code_str, 0) + 1

        self._record_latency(latency_ms)

    def record_packet_sent(self, bytes_transferred: int):
        """Records a UDP transport packet."""
        now = time.time()
        self.total_packets_sent += 1
        self.total_bytes_transferred += bytes_transferred
        self.total_generated_requests += 1

        slot_id = int(now / self._bucket_interval)
        b = self._buckets[slot_id % 20].get_or_reset(slot_id)
        b.packets_sent += 1
        b.dispatched += 1
        b.bytes += bytes_transferred

    def record_packet_received(self, latency_ms: float, bytes_transferred: int):
        """Records a UDP datagram received & verified."""
        now = time.time()
        self.total_packets_received += 1
        self.total_received_requests += 1
        self.total_successful_requests += 1
        self.total_bytes_transferred += bytes_transferred

        slot_id = int(now / self._bucket_interval)
        b = self._buckets[slot_id % 20].get_or_reset(slot_id)
        b.packets_recv += 1
        b.received += 1
        b.successful += 1
        b.bytes += bytes_transferred

        self._record_latency(latency_ms)

    def record_packet_lost(self):
        now = time.time()
        self.total_failed_requests += 1
        slot_id = int(now / self._bucket_interval)
        b = self._buckets[slot_id % 20].get_or_reset(slot_id)
        b.failed += 1

    def _record_latency(self, latency_ms: float):
        self._latencies_window.append(latency_ms)
        if len(self._all_latencies_sample) < self._max_sample_size:
            self._all_latencies_sample.append(latency_ms)

        # RFC 3550 Jitter algorithm
        if self._last_latency_ms is not None:
            diff = abs(latency_ms - self._last_latency_ms)
            self._jitter_accumulator += (diff - self._jitter_accumulator) / 16.0
        self._last_latency_ms = latency_ms

    def record_connection_change(self, delta_active: int, successful: bool = True):
        self.active_conns = max(0, self.active_conns + delta_active)
        if delta_active > 0:
            if successful:
                self.successful_conns += 1
            else:
                self.failed_conns += 1

    def record_connection_error(self):
        """Records socket connection failures, resets, or unreachable hosts."""
        self.connection_errors += 1
        self.failed_conns += 1

    def calculate_scheduled_requests(self, elapsed: float) -> int:
        """
        Integrates total workload requests planned across the configured ramp curve.
        Ensures scheduled count is mathematically distinct from actual dispatched and completed counts.
        """
        if elapsed <= 0 or self.target_rps <= 0:
            return 0
        total_time = self.ramp_up_sec + self.sustained_sec + self.ramp_down_sec
        effective_elapsed = min(elapsed, float(total_time))
        
        # 1. Ramp-up segment
        ramp_up = min(effective_elapsed, float(self.ramp_up_sec))
        reqs_ramp_up = self.target_rps * (0.55 * ramp_up) if self.ramp_up_sec > 0 else 0.0
        
        # 2. Sustained segment
        if effective_elapsed > self.ramp_up_sec:
            sustained_elapsed = min(effective_elapsed - self.ramp_up_sec, float(self.sustained_sec))
            reqs_sustained = self.target_rps * 1.0 * sustained_elapsed
        else:
            reqs_sustained = 0.0
            
        # 3. Ramp-down segment
        sustained_end = float(self.ramp_up_sec + self.sustained_sec)
        if effective_elapsed > sustained_end:
            ramp_down_elapsed = min(effective_elapsed - sustained_end, float(self.ramp_down_sec))
            reqs_ramp_down = self.target_rps * (0.525 * ramp_down_elapsed) if self.ramp_down_sec > 0 else 0.0
        else:
            reqs_ramp_down = 0.0
            
        return int(round(reqs_ramp_up + reqs_sustained + reqs_ramp_down))

    def compute_percentiles(self, sample_list) -> Dict[str, float]:
        if not sample_list:
            return {"min": 0.0, "max": 0.0, "avg": 0.0, "p50": 0.0, "p95": 0.0, "p99": 0.0}
        
        sorted_vals = sorted(sample_list)
        n = len(sorted_vals)
        p50 = sorted_vals[min(int(n * 0.50), n - 1)]
        p95 = sorted_vals[min(int(n * 0.95), n - 1)]
        p99 = sorted_vals[min(int(n * 0.99), n - 1)]
        avg = sum(sorted_vals) / n

        return {
            "min": round(sorted_vals[0], 2),
            "max": round(sorted_vals[-1], 2),
            "avg": round(avg, 2),
            "p50": round(p50, 2),
            "p95": round(p95, 2),
            "p99": round(p99, 2)
        }

    def get_snapshot(self) -> MetricSnapshot:
        now = time.time()
        elapsed = max(0.05, now - self.start_time)
        cur_slot = int(now / self._bucket_interval)
        min_slot = cur_slot - 19  # Last 20 slots = last 1.0 second

        active_buckets = [b for b in self._buckets if min_slot <= b.slot_id <= cur_slot]
        time_factor = 1.0 if elapsed >= 1.0 else (1.0 / elapsed)

        generated_rps = round(sum(b.dispatched for b in active_buckets) * time_factor, 1)
        received_rps = round(sum(b.received for b in active_buckets) * time_factor, 1)
        successful_rps = round(sum(b.successful for b in active_buckets) * time_factor, 1)
        failed_rps = round(sum(b.failed for b in active_buckets) * time_factor, 1)
        pps = round(sum(b.packets_sent for b in active_buckets) * time_factor, 1)

        bytes_1s = sum(b.bytes for b in active_buckets) * time_factor
        throughput_kbps = round((bytes_1s * 8) / 1024, 2)

        lat_stats = self.compute_percentiles(list(self._latencies_window))

        # Packet loss calculation
        packet_loss_pct = 0.0
        if self.total_packets_sent > 0:
            if self.total_packets_received <= self.total_packets_sent:
                packet_loss_pct = round(((self.total_packets_sent - self.total_packets_received) / self.total_packets_sent) * 100, 2)

        # Error rate
        total_ops = self.total_successful_requests + self.total_failed_requests
        error_rate_pct = round((self.total_failed_requests / total_ops * 100), 2) if total_ops > 0 else 0.0

        # Cluster and node capacity analysis
        cluster_capacity = cluster_manager.get_cluster_capacity_rps()
        cluster_manager.update_node_telemetry(generated_rps)
        
        # Generator capacity utilization %
        generator_cap_pct = round(min(100.0, (generated_rps / max(1, cluster_capacity)) * 100), 1) if cluster_capacity > 0 else 0.0
        
        # Nodes needed to achieve target
        avg_node_cap = cluster_capacity // max(1, len(cluster_manager.get_all_nodes()))
        nodes_needed = max(1, math.ceil(self.target_rps / max(1, avg_node_cap)))

        capacity_warning = None
        if self.target_rps > cluster_capacity and generated_rps >= cluster_capacity * 0.85:
            capacity_warning = f"Current generator nodes saturated ({generated_rps:,.0f} RPS / {cluster_capacity:,.0f} cap). Cluster expansion of {nodes_needed} machines required to reach requested {self.target_rps:,} RPS."

        # Host resource metrics
        cpu_pct = psutil.cpu_percent()
        ram_pct = psutil.virtual_memory().percent

        requests_scheduled = self.calculate_scheduled_requests(elapsed)
        requests_dispatched = self.total_generated_requests
        requests_completed = self.total_received_requests

        snapshot = MetricSnapshot(
            timestamp=now,
            test_id=self.test_id,
            elapsed_sec=round(elapsed, 1),
            status=self.status,
            target_rps=self.target_rps,
            generated_rps=generated_rps,
            received_rps=received_rps,
            successful_rps=successful_rps,
            failed_rps=failed_rps,
            req_per_sec=received_rps,
            packets_per_sec=pps,
            active_conns=self.active_conns,
            successful_conns=self.successful_conns,
            failed_conns=self.failed_conns,
            total_requests=max(self.total_generated_requests, self.total_successful_requests + self.total_failed_requests),
            requests_scheduled=requests_scheduled,
            requests_dispatched=requests_dispatched,
            requests_completed=requests_completed,
            connection_errors=self.connection_errors,
            total_packets_sent=self.total_packets_sent,
            total_packets_received=self.total_packets_received,
            packet_loss_pct=packet_loss_pct,
            throughput_kbps=throughput_kbps,
            avg_latency_ms=lat_stats["avg"],
            min_latency_ms=lat_stats["min"],
            max_latency_ms=lat_stats["max"],
            p50_latency_ms=lat_stats["p50"],
            p95_latency_ms=lat_stats["p95"],
            p99_latency_ms=lat_stats["p99"],
            jitter_ms=round(self._jitter_accumulator, 2),
            success_count=self.total_successful_requests,
            error_count=self.total_failed_requests,
            error_rate_pct=error_rate_pct,
            cpu_usage_pct=cpu_pct,
            ram_usage_pct=ram_pct,
            generator_capacity_pct=generator_cap_pct,
            active_cluster_nodes=len(cluster_manager.get_all_nodes()),
            cluster_max_achievable_rps=cluster_capacity,
            nodes_needed_for_target=nodes_needed,
            capacity_warning=capacity_warning,
            status_codes=dict(self.status_codes),
            timeouts_count=self.status_codes.get("504", 0),
            avg_response_bytes=round(self.total_bytes_transferred / max(1, self.total_successful_requests), 1),
            safety_circuit_status="TRIPPED" if self.status == TestStatusEnum.CIRCUIT_BROKEN else "NORMAL"
        )
        self.snapshots_history.append(snapshot)
        return snapshot

    def generate_final_report(self) -> TestReport:
        end = self.end_time or time.time()
        duration = round(end - self.start_time, 2)
        all_stats = self.compute_percentiles(self._all_latencies_sample)

        peak_gen_rps = max([s.generated_rps for s in self.snapshots_history], default=0.0)
        peak_recv_rps = max([s.received_rps for s in self.snapshots_history], default=0.0)
        peak_succ_rps = max([s.successful_rps for s in self.snapshots_history], default=0.0)
        
        peak_throughput = max([s.throughput_kbps for s in self.snapshots_history], default=0.0)
        avg_throughput = round((self.total_bytes_transferred * 8) / (max(duration, 0.1) * 1024), 2)
        peak_cpu = max([s.cpu_usage_pct for s in self.snapshots_history], default=0.0)
        peak_ram = max([s.ram_usage_pct for s in self.snapshots_history], default=0.0)

        # Packet loss
        loss_pct = 0.0
        if self.total_packets_sent > 0:
            loss_pct = round(max(0, (self.total_packets_sent - self.total_packets_received) / self.total_packets_sent) * 100, 2)

        total_ops = self.total_successful_requests + self.total_failed_requests
        error_rate = (self.total_failed_requests / total_ops * 100) if total_ops > 0 else 0.0
        success_pct = (self.total_successful_requests / total_ops * 100) if total_ops > 0 else 0.0
        timeouts = self.status_codes.get("504", 0)

        # Maximum sustainable request rate: highest generated RPS where error rate was < 5%
        healthy_snaps = [s for s in self.snapshots_history if s.error_rate_pct < 5.0 and s.p95_latency_ms < 1000.0]
        max_sustainable_rps = max([s.generated_rps for s in healthy_snaps], default=peak_succ_rps)

        # Performance degradation under increased load
        early_snaps = self.snapshots_history[:max(1, len(self.snapshots_history) // 3)]
        early_lat = (sum(s.avg_latency_ms for s in early_snaps) / len(early_snaps)) if early_snaps else all_stats["avg"]
        degradation_pct = round(((all_stats["p95"] - early_lat) / max(0.1, early_lat)) * 100, 1) if early_lat > 0 else 0.0

        website_analysis = {
            "successful_request_pct": round(success_pct, 2),
            "max_sustainable_rps": round(max_sustainable_rps, 1),
            "status_code_breakdown": dict(self.status_codes),
            "timeouts_count": timeouts,
            "avg_latency_ms": all_stats["avg"],
            "p50_latency_ms": all_stats["p50"],
            "p95_latency_ms": all_stats["p95"],
            "p99_latency_ms": all_stats["p99"],
            "throughput_kbps": avg_throughput,
            "degradation_under_load_pct": max(0.0, degradation_pct),
            "objective_met": (success_pct >= 95.0 and all_stats["p95"] < 250.0),
            "summary": (
                f"Website processed {self.total_successful_requests:,} successful requests ({success_pct:.1f}% success rate) "
                f"with peak throughput of {peak_throughput:,.1f} Kbps. Maximum sustainable throughput was {max_sustainable_rps:,.0f} RPS "
                f"with P95 response time of {all_stats['p95']:.1f}ms."
            )
        }

        # Cluster capacity analysis
        cluster_capacity = cluster_manager.get_cluster_capacity_rps()
        avg_node_cap = cluster_capacity // max(1, len(cluster_manager.get_all_nodes()))
        nodes_needed = max(1, math.ceil(self.target_rps / max(1, avg_node_cap)))

        recommendations = []
        if self.target_rps > cluster_capacity:
            recommendations.append(
                f"Cluster Capacity Bottleneck: Requested target was {self.target_rps:,} RPS, but active generator nodes maxed out at {peak_gen_rps:,.0f} RPS ({int((peak_gen_rps/self.target_rps)*100)}% of target). Deploy {nodes_needed} generator worker machines to reach full target."
            )

        if self.protocol in (ProtocolEnum.HTTP, ProtocolEnum.HTTPS, ProtocolEnum.HTTP_WEBSITE):
            if timeouts > 0:
                recommendations.append(f"Gateway Timeouts Detected: {timeouts} requests timed out (HTTP 504). Increase backend worker concurrency and database connection pool limits.")
            if self.status_codes.get("502", 0) > 0:
                recommendations.append("Reverse Proxy Gateway Errors (HTTP 502): Web server socket backlog filled up. Increase somaxconn and keep-alive pool size.")
            if degradation_pct > 100.0:
                recommendations.append(f"High Latency Degradation: Response times degraded by +{degradation_pct}% under sustained load. Implement page caching, CDN offloading, or read replicas.")

        if error_rate == 0.0 and all_stats["p95"] < 50.0 and loss_pct < 0.5:
            sla_verdict = "EXCELLENT"
            recommendations.append("Target infrastructure maintained zero packet loss and sub-50ms P95 latency under tested workload.")
        elif error_rate < 5.0 and all_stats["p95"] < 150.0 and loss_pct < 2.0:
            sla_verdict = "HEALTHY"
            recommendations.append("Target system handled high-volume traffic within acceptable latency SLAs.")
        elif error_rate < 25.0 or all_stats["p99"] > 500.0 or loss_pct < 10.0:
            sla_verdict = "DEGRADED"
            recommendations.append("Target server entered degraded performance zone with noticeable tail latency elevation.")
        else:
            sla_verdict = "SATURATED / FAILED"
            recommendations.append("Target infrastructure exceeded operational capacity; severe drops and socket resets observed.")

        return TestReport(
            test_id=self.test_id,
            target_host=self.host,
            target_port=self.port,
            protocol=self.protocol,
            intensity=self.intensity,
            target_rps=self.target_rps,
            started_at=time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(self.start_time)),
            finished_at=time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(end)),
            duration_sec=duration,
            status=self.status,
            abort_reason=self.abort_reason,
            peak_generated_rps=peak_gen_rps,
            peak_received_rps=peak_recv_rps,
            peak_successful_rps=peak_succ_rps,
            avg_generated_rps=round(self.total_generated_requests / max(duration, 0.1), 1),
            successful_request_pct=round(success_pct, 2),
            max_sustainable_rps=round(max_sustainable_rps, 1),
            timeouts_count=timeouts,
            website_analysis=website_analysis,
            total_packets_sent=self.total_packets_sent,
            total_packets_received=self.total_packets_received,
            packet_loss_pct=loss_pct,
            total_requests=max(self.total_generated_requests, self.total_successful_requests + self.total_failed_requests),
            requests_scheduled=self.calculate_scheduled_requests(duration),
            requests_dispatched=self.total_generated_requests,
            requests_completed=self.total_received_requests,
            connection_errors=self.connection_errors,
            successful_operations=self.total_successful_requests,
            failed_operations=self.total_failed_requests,
            peak_throughput_kbps=peak_throughput,
            avg_throughput_kbps=avg_throughput,
            avg_latency_ms=all_stats["avg"],
            p50_latency_ms=all_stats["p50"],
            p95_latency_ms=all_stats["p95"],
            p99_latency_ms=all_stats["p99"],
            max_latency_ms=all_stats["max"],
            avg_jitter_ms=round(self._jitter_accumulator, 2),
            status_codes=dict(self.status_codes),
            peak_cpu_pct=peak_cpu,
            peak_ram_pct=peak_ram,
            cluster_analysis={
                "target_rps": self.target_rps,
                "achieved_generated_rps": peak_gen_rps,
                "cluster_nodes_active": len(cluster_manager.get_all_nodes()),
                "measured_cluster_capacity_rps": cluster_capacity,
                "nodes_needed_for_target": nodes_needed,
                "cluster_utilization_pct": round(min(100.0, (peak_gen_rps / max(1, cluster_capacity)) * 100), 1)
            },
            sla_verdict=sla_verdict,
            recommendations=recommendations
        )
