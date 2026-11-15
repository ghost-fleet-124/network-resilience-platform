from fastapi import APIRouter, HTTPException, Request
from app.models import TestStartRequest
from app.core.orchestrator import orchestrator

router = APIRouter(prefix="/api/tests", tags=["tests"])

@router.post("/start")
async def start_test(req: TestStartRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        res = await orchestrator.start_test(req, operator_ip=client_ip)
        return res
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start test: {str(e)}")

@router.post("/pause")
async def pause_test():
    return await orchestrator.pause_test()

@router.post("/resume")
async def resume_test():
    return await orchestrator.resume_test()

@router.post("/stop")
async def stop_test():
    report = await orchestrator.stop_test(reason="USER_STOPPED", is_completed=False)
    return {
        "status": "STOPPED",
        "report": report.model_dump() if report else None
    }

@router.post("/emergency-stop")
async def emergency_stop():
    report = await orchestrator.emergency_stop(reason="MANUAL_EMERGENCY_STOP")
    return {
        "status": "EMERGENCY_ABORTED",
        "report": report.model_dump() if report else None
    }

@router.get("/status")
async def get_test_status():
    return orchestrator.get_current_status()
