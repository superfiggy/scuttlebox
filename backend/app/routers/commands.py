"""Command/chat endpoints."""

from fastapi import APIRouter, HTTPException
from ..services.openclaw import get_openclaw_client
from ..models.schemas import CommandRequest, CommandResponse

router = APIRouter(prefix="/api/command", tags=["commands"])


@router.post("", response_model=CommandResponse)
async def send_command(request: CommandRequest):
    """Send a command to the agent."""
    client = get_openclaw_client()
    
    try:
        result = await client.chat_completion(
            message=request.message,
            user=request.session_key or "figgy-portal",
        )
        
        # Extract response from OpenAI-style response
        choices = result.get("choices", [])
        if choices:
            content = choices[0].get("message", {}).get("content", "")
            return CommandResponse(ok=True, response=content)
        
        return CommandResponse(ok=False, error="No response received")
    
    except Exception as e:
        return CommandResponse(ok=False, error=str(e))


@router.post("/send")
async def send_to_session(
    message: str,
    session_key: str = None,
    label: str = None,
):
    """Send a message to a specific session (async, no response waiting)."""
    client = get_openclaw_client()
    
    try:
        result = await client.send_to_session(
            message=message,
            session_key=session_key,
            label=label,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")
