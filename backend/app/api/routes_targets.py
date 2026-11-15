from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.models import (
    TargetVerificationRequest,
    TargetVerificationResponse,
    ApprovedScope,
    RegisterScopeRequest
)
from app.config import PRESET_CONFIGS, MOCK_PORTS
from app.core.safety_governor import safety_governor
from app.mock_targets.mock_manager import mock_manager
from app.core.cluster_manager import cluster_manager

router = APIRouter(prefix="/api/targets", tags=["targets"])

@router.post("/verify", response_model=TargetVerificationResponse)
async def verify_target(req: TargetVerificationRequest):
    return await safety_governor.verify_target_authorization(req.host, req.port)

@router.get("/scopes", response_model=List[ApprovedScope])
async def list_authorized_scopes():
    return safety_governor.get_all_scopes()

@router.post("/scopes", response_model=ApprovedScope)
async def register_authorized_scope(req: RegisterScopeRequest):
    if not req.terms_acknowledged:
        raise HTTPException(
            status_code=400,
            detail="Scope registration requires explicit confirmation of the Acceptable Use Policy."
        )
    return safety_governor.register_scope(req)

@router.delete("/scopes/{scope_id}")
async def revoke_authorized_scope(scope_id: str):
    revoked = safety_governor.revoke_scope(scope_id)
    if not revoked:
        raise HTTPException(status_code=404, detail="Scope not found")
    return {"status": "REVOKED", "scope_id": scope_id}

@router.get("/presets")
async def get_presets():
    return {k.value: v.model_dump() for k, v in PRESET_CONFIGS.items()}

@router.get("/mock-status")
async def get_mock_status():
    return {
        "is_running": mock_manager.is_running,
        "ports": MOCK_PORTS
    }

@router.post("/mock-start")
async def start_mock_environment():
    res = await mock_manager.start_all()
    return res

@router.post("/mock-stop")
async def stop_mock_environment():
    await mock_manager.stop_all()
    return {"status": "STOPPED"}

@router.get("/cluster/nodes")
async def get_cluster_nodes():
    return {
        "nodes": [n.model_dump() for n in cluster_manager.get_all_nodes()],
        "total_capacity_rps": cluster_manager.get_cluster_capacity_rps()
    }

@router.post("/cluster/benchmark")
async def benchmark_local_node():
    measured = cluster_manager.benchmark_local_capacity()
    return {
        "status": "COMPLETED",
        "node_id": cluster_manager.local_node.node_id,
        "measured_max_rps": measured,
        "total_cluster_capacity_rps": cluster_manager.get_cluster_capacity_rps()
    }

class WorkerRegistrationRequest(BaseModel):
    name: str
    ip_address: str
    cpu_cores: int = 4
    measured_max_rps: int = 150000

@router.post("/cluster/register")
async def register_remote_worker(req: WorkerRegistrationRequest):
    node = cluster_manager.register_remote_worker(
        name=req.name,
        ip_address=req.ip_address,
        cpu_cores=req.cpu_cores,
        measured_max_rps=req.measured_max_rps
    )
    return {
        "status": "REGISTERED",
        "node": node.model_dump(),
        "total_cluster_capacity_rps": cluster_manager.get_cluster_capacity_rps()
    }
