from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.core.legal_governance import (
    ACCEPTABLE_USE_POLICY,
    PRIVACY_POLICY,
    LEGAL_METADATA
)
from app.core.storage import storage

router = APIRouter(prefix="/api/legal", tags=["legal"])

@router.get("/terms")
async def get_acceptable_use_policy() -> Dict[str, Any]:
    """Returns the complete Acceptable Use Policy and Terms of Service."""
    return ACCEPTABLE_USE_POLICY

@router.get("/privacy")
async def get_privacy_policy() -> Dict[str, Any]:
    """Returns the complete Privacy Policy and Data Retention Schedule."""
    return PRIVACY_POLICY

@router.get("/metadata")
async def get_legal_metadata() -> Dict[str, Any]:
    """Returns the legal compliance version and review dates."""
    return LEGAL_METADATA

@router.post("/privacy/export")
async def export_personal_and_test_data() -> Dict[str, Any]:
    """
    Self-service data export: returns all stored test reports and audit events.
    """
    return storage.export_all_records()

class DeletionRequest(BaseModel):
    confirmation: bool = False
    reason: str = "USER_REQUESTED"

@router.post("/privacy/delete")
async def delete_personal_and_test_data(req: DeletionRequest) -> Dict[str, Any]:
    """
    Self-service data purge: permanently deletes historical test reports and telemetry.
    """
    if not req.confirmation:
        raise HTTPException(
            status_code=400,
            detail="Confirmation flag must be set to true to execute data deletion."
        )
    return storage.purge_eligible_data()
