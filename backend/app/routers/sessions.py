"""Session management endpoints."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..services.openclaw import get_openclaw_client
from ..models.schemas import Session

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("")
async def list_sessions(
    active_minutes: Optional[int] = Query(None, description="Filter to recently active sessions"),
):
    """List all sessions."""
    client = get_openclaw_client()
    
    try:
        sessions = await client.get_sessions(active_minutes=active_minutes)
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.get("/{session_key:path}/status")
async def get_session_status(session_key: str):
    """Get status for a specific session."""
    client = get_openclaw_client()
    
    try:
        status = await client.get_session_status(session_key)
        return status
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.get("/{session_key:path}/history")
async def get_session_history(
    session_key: str,
    limit: int = Query(50, ge=1, le=500),
    include_tools: bool = Query(False),
):
    """Get message history for a session."""
    client = get_openclaw_client()
    
    try:
        result = await client.invoke_tool(
            "sessions_history",
            args={
                "sessionKey": session_key,
                "limit": limit,
                "includeTools": include_tools,
            },
        )
        if result.get("ok"):
            return result.get("result", {})
        raise HTTPException(status_code=404, detail="Session not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")
