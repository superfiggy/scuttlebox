"""Status and health endpoints."""

from fastapi import APIRouter, HTTPException
from ..services.openclaw import get_openclaw_client
from ..models.schemas import AgentStatus, GatewayHealth

router = APIRouter(prefix="/api/status", tags=["status"])


@router.get("")
async def get_agent_status():
    """Get current agent status (busy/idle) with active session info."""
    client = get_openclaw_client()
    
    try:
        # Get session status
        status = await client.get_session_status()
        sessions = await client.get_sessions(active_minutes=5)
        
        # Find busy sessions - check for running/busy status
        busy_sessions = []
        for session in sessions:
            # Sessions might have a 'busy' or 'running' flag
            # For now, track the current session from status
            pass
        
        current_session_key = status.get("sessionKey")
        current_session_name = None
        current_session_channel = None
        
        # Find the display name for current session
        if current_session_key:
            for session in sessions:
                if session.get("key") == current_session_key:
                    current_session_name = session.get("displayName") or current_session_key[:40]
                    current_session_channel = session.get("channel")
                    break
        
        return {
            "busy": status.get("busy", False),
            "current_session": current_session_key,
            "current_session_name": current_session_name,
            "current_session_channel": current_session_channel,
            "last_activity": status.get("lastActivity"),
            "active_sessions": len(sessions),
            "model": status.get("model"),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.get("/health", response_model=GatewayHealth)
async def get_gateway_health():
    """Get gateway health information."""
    client = get_openclaw_client()
    
    try:
        health = await client.health_check()
        
        if health.get("ok"):
            data = health.get("data", {})
            return GatewayHealth(
                ok=True,
                uptime_seconds=data.get("uptimeSeconds") or data.get("uptime_seconds"),
                channels=data.get("channels", {}),
            )
        else:
            return GatewayHealth(
                ok=False,
                channels={"error": health.get("error", "Unknown error")},
            )
    except Exception as e:
        return GatewayHealth(ok=False, channels={"error": str(e)})
