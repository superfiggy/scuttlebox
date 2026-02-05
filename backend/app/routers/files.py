"""File management endpoints."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..services.files import get_file_service
from ..models.schemas import FileContent, FileWriteRequest, FileListItem, MemoryEntry

router = APIRouter(prefix="/api/files", tags=["files"])


@router.get("")
async def list_files(path: str = Query("", description="Directory path relative to workspace")):
    """List files in a directory."""
    service = get_file_service()
    
    try:
        items = await service.list_directory(path)
        return {"path": path, "items": items}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/read/{path:path}", response_model=FileContent)
async def read_file(path: str):
    """Read a file from the workspace."""
    service = get_file_service()
    
    try:
        content = await service.read_file(path)
        return content
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/write/{path:path}")
async def write_file(path: str, request: FileWriteRequest):
    """Write a file to the workspace."""
    service = get_file_service()
    
    try:
        await service.write_file(path, request.content)
        return {"ok": True, "path": path}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/delete/{path:path}")
async def delete_file(path: str):
    """Delete a file from the workspace."""
    service = get_file_service()
    
    try:
        success = await service.delete_file(path)
        if not success:
            raise HTTPException(status_code=404, detail="File not found")
        return {"ok": True, "path": path}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Convenience endpoints for common files

@router.get("/soul", response_model=FileContent)
async def get_soul():
    """Get SOUL.md content."""
    service = get_file_service()
    return await service.read_file("SOUL.md")


@router.put("/soul")
async def update_soul(request: FileWriteRequest):
    """Update SOUL.md content."""
    service = get_file_service()
    await service.write_file("SOUL.md", request.content)
    return {"ok": True}


@router.get("/user", response_model=FileContent)
async def get_user():
    """Get USER.md content."""
    service = get_file_service()
    return await service.read_file("USER.md")


@router.put("/user")
async def update_user(request: FileWriteRequest):
    """Update USER.md content."""
    service = get_file_service()
    await service.write_file("USER.md", request.content)
    return {"ok": True}


@router.get("/agents", response_model=FileContent)
async def get_agents():
    """Get AGENTS.md content."""
    service = get_file_service()
    return await service.read_file("AGENTS.md")


@router.put("/agents")
async def update_agents(request: FileWriteRequest):
    """Update AGENTS.md content."""
    service = get_file_service()
    await service.write_file("AGENTS.md", request.content)
    return {"ok": True}


@router.get("/memory", response_model=list[MemoryEntry])
async def get_memory_files():
    """Get list of memory files."""
    service = get_file_service()
    return await service.get_memory_files()
