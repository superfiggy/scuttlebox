"""Cron/scheduled tasks endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..services.openclaw import get_openclaw_client

router = APIRouter(prefix="/api/cron", tags=["cron"])


# --- Schemas ---

class ScheduleAt(BaseModel):
    """One-shot schedule at a specific time."""
    kind: str = "at"
    atMs: int


class ScheduleEvery(BaseModel):
    """Recurring interval schedule."""
    kind: str = "every"
    everyMs: int
    anchorMs: Optional[int] = None


class ScheduleCron(BaseModel):
    """Cron expression schedule."""
    kind: str = "cron"
    expr: str
    tz: Optional[str] = None


class PayloadSystemEvent(BaseModel):
    """System event payload (for main session)."""
    kind: str = "systemEvent"
    text: str


class PayloadAgentTurn(BaseModel):
    """Agent turn payload (for isolated session)."""
    kind: str = "agentTurn"
    message: str
    model: Optional[str] = None
    thinking: Optional[str] = None
    timeoutSeconds: Optional[int] = None
    deliver: Optional[bool] = None
    channel: Optional[str] = None
    to: Optional[str] = None


class CreateJobRequest(BaseModel):
    """Request to create a cron job."""
    name: Optional[str] = None
    schedule: dict  # ScheduleAt | ScheduleEvery | ScheduleCron
    payload: dict   # PayloadSystemEvent | PayloadAgentTurn
    sessionTarget: str = Field(..., pattern="^(main|isolated)$")
    enabled: bool = True


class UpdateJobRequest(BaseModel):
    """Request to update a cron job."""
    name: Optional[str] = None
    schedule: Optional[dict] = None
    payload: Optional[dict] = None
    enabled: Optional[bool] = None


# --- Endpoints ---

@router.get("/status")
async def cron_status():
    """Get cron scheduler status."""
    client = get_openclaw_client()
    
    try:
        result = await client.cron_status()
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.get("/jobs")
async def list_jobs(include_disabled: bool = False):
    """List all cron jobs."""
    client = get_openclaw_client()
    
    try:
        result = await client.cron_list(include_disabled=include_disabled)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.post("/jobs")
async def create_job(request: CreateJobRequest):
    """Create a new cron job."""
    client = get_openclaw_client()
    
    # Validate sessionTarget/payload combination
    payload_kind = request.payload.get("kind")
    if request.sessionTarget == "main" and payload_kind != "systemEvent":
        raise HTTPException(
            status_code=400,
            detail="sessionTarget 'main' requires payload.kind 'systemEvent'"
        )
    if request.sessionTarget == "isolated" and payload_kind != "agentTurn":
        raise HTTPException(
            status_code=400,
            detail="sessionTarget 'isolated' requires payload.kind 'agentTurn'"
        )
    
    try:
        job = {
            "name": request.name,
            "schedule": request.schedule,
            "payload": request.payload,
            "sessionTarget": request.sessionTarget,
            "enabled": request.enabled,
        }
        result = await client.cron_add(job)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """Get a specific job's details."""
    client = get_openclaw_client()
    
    try:
        # List and find the job
        result = await client.cron_list(include_disabled=True)
        jobs = result.get("jobs", [])
        for job in jobs:
            if job.get("id") == job_id or job.get("jobId") == job_id:
                return job
        raise HTTPException(status_code=404, detail="Job not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.patch("/jobs/{job_id}")
async def update_job(job_id: str, request: UpdateJobRequest):
    """Update a cron job."""
    client = get_openclaw_client()
    
    try:
        patch = {}
        if request.name is not None:
            patch["name"] = request.name
        if request.schedule is not None:
            patch["schedule"] = request.schedule
        if request.payload is not None:
            patch["payload"] = request.payload
        if request.enabled is not None:
            patch["enabled"] = request.enabled
        
        result = await client.cron_update(job_id, patch)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a cron job."""
    client = get_openclaw_client()
    
    try:
        result = await client.cron_remove(job_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.post("/jobs/{job_id}/run")
async def run_job(job_id: str):
    """Trigger a job to run immediately."""
    client = get_openclaw_client()
    
    try:
        result = await client.cron_run(job_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.post("/jobs/{job_id}/pause")
async def pause_job(job_id: str):
    """Pause (disable) a job."""
    client = get_openclaw_client()
    
    try:
        result = await client.cron_update(job_id, {"enabled": False})
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.post("/jobs/{job_id}/resume")
async def resume_job(job_id: str):
    """Resume (enable) a job."""
    client = get_openclaw_client()
    
    try:
        result = await client.cron_update(job_id, {"enabled": True})
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.get("/jobs/{job_id}/runs")
async def get_job_runs(job_id: str):
    """Get run history for a job."""
    client = get_openclaw_client()
    
    try:
        result = await client.cron_runs(job_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")
