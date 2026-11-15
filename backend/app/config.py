from typing import Dict
from app.models import IntensityPresetEnum, PresetConfig

# Presets configured according to explicit enterprise numerical RPS specifications
# Each profile defines the requested workload target, connection budget, and cluster sizing.
PRESET_CONFIGS: Dict[IntensityPresetEnum, PresetConfig] = {
    IntensityPresetEnum.LOW: PresetConfig(
        name="LOW",
        label="Low (80K RPS)",
        target_rps=80000,
        description="Enterprise baseline connectivity check at 80,000 requests/sec.",
        max_conns=500,
        bandwidth_cap_mbps=100,       # 100 Mbps
        default_duration_sec=30,
        max_duration_sec=60,
        recommended_cluster_nodes=1
    ),
    IntensityPresetEnum.MEDIUM: PresetConfig(
        name="MEDIUM",
        label="Medium (200K RPS)",
        target_rps=200000,
        description="Normal enterprise player traffic at 200,000 requests/sec.",
        max_conns=1500,
        bandwidth_cap_mbps=250,       # 250 Mbps
        default_duration_sec=45,
        max_duration_sec=120,
        recommended_cluster_nodes=2
    ),
    IntensityPresetEnum.HIGH: PresetConfig(
        name="HIGH",
        label="High (500K RPS)",
        target_rps=500000,
        description="High-concurrency peak traffic simulating evening surges at 500,000 requests/sec.",
        max_conns=3000,
        bandwidth_cap_mbps=600,       # 600 Mbps
        default_duration_sec=60,
        max_duration_sec=180,
        recommended_cluster_nodes=5
    ),
    IntensityPresetEnum.LARGE: PresetConfig(
        name="LARGE",
        label="Large (750K RPS)",
        target_rps=750000,
        description="Heavy enterprise launch workload testing cluster ingress at 750,000 requests/sec.",
        max_conns=5000,
        bandwidth_cap_mbps=1000,      # 1 Gbps
        default_duration_sec=60,
        max_duration_sec=240,
        recommended_cluster_nodes=8
    ),
    IntensityPresetEnum.MASSIVE: PresetConfig(
        name="MASSIVE",
        label="Massive (1.0M RPS)",
        target_rps=1000000,
        description="Seven-figure mega-scale stress workload at 1,000,000 requests/sec.",
        max_conns=10000,
        bandwidth_cap_mbps=1500,      # 1.5 Gbps
        default_duration_sec=60,
        max_duration_sec=300,
        recommended_cluster_nodes=10
    ),
    IntensityPresetEnum.ULTRA_MASSIVE: PresetConfig(
        name="ULTRA_MASSIVE",
        label="Ultra Massive (2.0M RPS)",
        target_rps=2000000,
        description="Multi-million tournament load testing gateway capacity at 2,000,000 requests/sec.",
        max_conns=20000,
        bandwidth_cap_mbps=3000,      # 3.0 Gbps
        default_duration_sec=60,
        max_duration_sec=300,
        recommended_cluster_nodes=20
    ),
    IntensityPresetEnum.SUPER_MASSIVE: PresetConfig(
        name="SUPER_MASSIVE",
        label="Super Massive (3.0M RPS)",
        target_rps=3000000,
        description="Hyper-scale distributed stress test evaluating global failover at 3,000,000 requests/sec.",
        max_conns=35000,
        bandwidth_cap_mbps=5000,      # 5.0 Gbps
        default_duration_sec=60,
        max_duration_sec=300,
        recommended_cluster_nodes=30
    ),
    IntensityPresetEnum.SUPER_ULTRA_MASSIVE: PresetConfig(
        name="SUPER_ULTRA_MASSIVE",
        label="Super Ultra Massive (5.0M RPS)",
        target_rps=5000000,
        description="Enterprise apex capacity benchmark testing extreme limits at 5,000,000 requests/sec.",
        max_conns=50000,
        bandwidth_cap_mbps=8000,      # 8.0 Gbps
        default_duration_sec=60,
        max_duration_sec=300,
        recommended_cluster_nodes=50
    )
}

# Safety Ceilings
GLOBAL_SAFETY_LIMITS = {
    "MAX_TARGET_RPS": 5000000,
    "MAX_CONCURRENT_CONNS": 50000,
    "MAX_DURATION_SEC": 600,
    "HIGH_INTENSITY_CONFIRMATION_THRESHOLD_RPS": 500000,
    "EMERGENCY_ERROR_THRESHOLD_PCT": 60.0,
    "EMERGENCY_LATENCY_THRESHOLD_MS": 8000.0,
    "EMERGENCY_CPU_THRESHOLD_PCT": 95.0,
}

# Local & Demo Mock Target Ports
MOCK_PORTS = {
    "UDP_TICK": 9001,
    "TCP_ECHO": 9002,
    "HTTP_AUTH": 9003,
    "WS_LOBBY": 9004,
    "GAME_SERVER": 9005
}

SERVER_HOST = "127.0.0.1"
API_PORT = 8000
FRONTEND_PORT = 5173
