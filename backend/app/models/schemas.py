"""Pydantic schemas for API requests/responses."""

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


# --- Status ---

class AgentStatus(BaseModel):
    """Agent status information."""
    busy: bool = False
    current_session: Optional[str] = None
    last_activity: Optional[datetime] = None
    active_sessions: int = 0


class GatewayHealth(BaseModel):
    """Gateway health information."""
    ok: bool
    uptime_seconds: Optional[float] = None
    channels: dict[str, Any] = Field(default_factory=dict)


# --- Sessions ---

class Session(BaseModel):
    """Session information."""
    key: str
    session_id: str
    updated_at: Optional[datetime] = None
    channel: Optional[str] = None
    display_name: Optional[str] = None
    input_tokens: int = 0
    output_tokens: int = 0


class SessionMessage(BaseModel):
    """A message in a session."""
    role: str
    content: str
    timestamp: Optional[datetime] = None


# --- Commands ---

class CommandRequest(BaseModel):
    """Request to send a command to the agent."""
    message: str
    session_key: Optional[str] = None
    stream: bool = False


class CommandResponse(BaseModel):
    """Response from a command."""
    ok: bool
    response: Optional[str] = None
    error: Optional[str] = None


# --- Files ---

class FileContent(BaseModel):
    """File content response."""
    path: str
    content: str
    exists: bool = True


class FileWriteRequest(BaseModel):
    """Request to write a file."""
    content: str


class FileListItem(BaseModel):
    """File or directory listing item."""
    name: str
    path: str
    is_dir: bool
    size: Optional[int] = None
    modified: Optional[datetime] = None


# --- Config ---

class ConfigResponse(BaseModel):
    """Gateway config response."""
    config: dict[str, Any]
    hash: str


class ConfigPatchRequest(BaseModel):
    """Request to patch config."""
    patch: dict[str, Any]
    base_hash: str


# --- Memory ---

class MemoryEntry(BaseModel):
    """A memory file entry."""
    path: str
    name: str
    date: Optional[str] = None
    preview: Optional[str] = None
    size: int = 0
