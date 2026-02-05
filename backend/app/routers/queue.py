"""Queue status and configuration endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.openclaw import get_openclaw_client

router = APIRouter(prefix="/api/queue", tags=["queue"])


class QueueConfigUpdate(BaseModel):
    """Request to update queue configuration."""
    mode: Optional[str] = None  # steer, followup, collect, steer-backlog, queue, interrupt
    debounceMs: Optional[int] = None
    cap: Optional[int] = None
    drop: Optional[str] = None  # old, new, summarize


@router.get("/status")
async def get_queue_status():
    """Get queue status including active sessions and their queue info."""
    client = get_openclaw_client()
    
    try:
        # Get current config for queue settings
        config_result = await client.get_config()
        config = config_result.get("config", {})
        
        # Extract queue config
        messages_config = config.get("messages", {})
        queue_config = messages_config.get("queue", {})
        
        # Get sessions to show queue depth info
        sessions = await client.get_sessions()
        
        # Build queue status
        session_queue_info = []
        for session in sessions[:20]:  # Limit to 20 sessions
            session_key = session.get("key", "")
            session_queue_info.append({
                "sessionKey": session_key,
                "displayName": session.get("displayName") or session_key[:40],
                "channel": session.get("channel"),
                "updatedAt": session.get("updatedAt"),
                "model": session.get("model"),
            })
        
        return {
            "config": {
                "mode": queue_config.get("mode", "collect"),
                "debounceMs": queue_config.get("debounceMs", 1000),
                "cap": queue_config.get("cap", 20),
                "drop": queue_config.get("drop", "summarize"),
                "byChannel": queue_config.get("byChannel", {}),
            },
            "sessions": session_queue_info,
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.patch("/config")
async def update_queue_config(request: QueueConfigUpdate):
    """Update queue configuration."""
    client = get_openclaw_client()
    
    try:
        # Build the patch for messages.queue
        queue_patch = {}
        if request.mode is not None:
            queue_patch["mode"] = request.mode
        if request.debounceMs is not None:
            queue_patch["debounceMs"] = request.debounceMs
        if request.cap is not None:
            queue_patch["cap"] = request.cap
        if request.drop is not None:
            queue_patch["drop"] = request.drop
        
        if not queue_patch:
            return {"ok": True, "message": "No changes"}
        
        # Get current config hash
        config_result = await client.get_config()
        base_hash = config_result.get("hash", "")
        
        # Apply patch
        patch = {"messages": {"queue": queue_patch}}
        result = await client.patch_config(patch, base_hash)
        
        return {"ok": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")
