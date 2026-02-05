"""Logs and chat history endpoints with search and filtering."""

import re
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from ..services.openclaw import get_openclaw_client

router = APIRouter(prefix="/api/logs", tags=["logs"])


class LogMessage(BaseModel):
    """A single log/chat message."""
    session_key: str
    session_name: Optional[str] = None
    channel: Optional[str] = None
    role: str  # user, assistant, system, tool
    content: str
    timestamp: Optional[int] = None
    model: Optional[str] = None
    tool_name: Optional[str] = None
    tokens_in: Optional[int] = None
    tokens_out: Optional[int] = None


class LogsResponse(BaseModel):
    """Paginated logs response."""
    messages: List[LogMessage]
    total: int
    has_more: bool


@router.get("", response_model=LogsResponse)
async def get_logs(
    session_key: Optional[str] = Query(None, description="Filter by session key"),
    channel: Optional[str] = Query(None, description="Filter by channel"),
    role: Optional[str] = Query(None, description="Filter by role (user/assistant/system/tool)"),
    search: Optional[str] = Query(None, description="Search in message content"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    include_tools: bool = Query(False, description="Include tool call messages"),
):
    """Get aggregated logs from all sessions with search and filtering."""
    client = get_openclaw_client()
    
    try:
        all_messages: List[LogMessage] = []
        
        # Get sessions
        sessions = await client.get_sessions()
        
        for session in sessions[:50]:  # Limit to 50 sessions for performance
            sess_key = session.get("key", "")
            sess_channel = session.get("channel")
            sess_name = session.get("displayName") or sess_key[:40]
            sess_model = session.get("model")
            
            # Apply session/channel filters early
            if session_key and session_key not in sess_key:
                continue
            if channel and channel != sess_channel:
                continue
            
            # Get history for this session
            try:
                result = await client.invoke_tool(
                    "sessions_history",
                    args={
                        "sessionKey": sess_key,
                        "limit": 50,
                        "includeTools": include_tools,
                    },
                )
                
                if not result.get("ok"):
                    continue
                
                history = result.get("result", {})
                details = history.get("details", history)
                messages = details.get("messages", details.get("history", []))
                
                for msg in messages:
                    msg_role = msg.get("role", "unknown")
                    msg_content = ""
                    msg_tool_name = None
                    msg_timestamp = msg.get("timestamp")
                    
                    # Extract content based on message structure
                    content_field = msg.get("content")
                    if isinstance(content_field, str):
                        msg_content = content_field
                    elif isinstance(content_field, list):
                        # Handle content blocks
                        for block in content_field:
                            if isinstance(block, dict):
                                if block.get("type") == "text":
                                    msg_content += block.get("text", "")
                                elif block.get("type") == "toolCall":
                                    msg_tool_name = block.get("name")
                                    msg_content += f"[Tool: {msg_tool_name}]"
                                elif block.get("type") == "toolResult":
                                    msg_content += f"[Tool Result]"
                    
                    # Skip if no content
                    if not msg_content.strip():
                        continue
                    
                    # Apply role filter
                    if role and role != msg_role:
                        continue
                    
                    # Apply search filter
                    if search and search.lower() not in msg_content.lower():
                        continue
                    
                    # Get usage info if available
                    usage = msg.get("usage", {})
                    
                    all_messages.append(LogMessage(
                        session_key=sess_key,
                        session_name=sess_name,
                        channel=sess_channel,
                        role=msg_role,
                        content=msg_content[:2000],  # Truncate long messages
                        timestamp=msg_timestamp,
                        model=msg.get("model") or sess_model,
                        tool_name=msg_tool_name,
                        tokens_in=usage.get("input"),
                        tokens_out=usage.get("output"),
                    ))
            except Exception:
                # Skip sessions that fail to load
                continue
        
        # Sort by timestamp (newest first)
        all_messages.sort(key=lambda m: m.timestamp or 0, reverse=True)
        
        # Apply pagination
        total = len(all_messages)
        paginated = all_messages[offset:offset + limit]
        
        return LogsResponse(
            messages=paginated,
            total=total,
            has_more=(offset + limit) < total,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.get("/sessions")
async def get_log_sessions():
    """Get list of sessions with message counts for log filtering."""
    client = get_openclaw_client()
    
    try:
        sessions = await client.get_sessions()
        
        session_info = []
        for session in sessions:
            session_info.append({
                "key": session.get("key"),
                "displayName": session.get("displayName") or session.get("key", "")[:40],
                "channel": session.get("channel"),
                "model": session.get("model"),
                "updatedAt": session.get("updatedAt"),
            })
        
        # Sort by most recent
        session_info.sort(key=lambda s: s.get("updatedAt") or 0, reverse=True)
        
        return {"sessions": session_info}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.get("/channels")
async def get_log_channels():
    """Get unique channels for filtering."""
    client = get_openclaw_client()
    
    try:
        sessions = await client.get_sessions()
        channels = set()
        
        for session in sessions:
            ch = session.get("channel")
            if ch:
                channels.add(ch)
        
        return {"channels": sorted(list(channels))}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")
