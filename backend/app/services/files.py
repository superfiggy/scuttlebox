"""File service for workspace operations."""

import os
import aiofiles
from datetime import datetime
from pathlib import Path
from typing import Optional
from ..config import get_settings
from ..models.schemas import FileContent, FileListItem, MemoryEntry


class FileService:
    """Service for reading/writing workspace files."""
    
    def __init__(self):
        self.settings = get_settings()
        self.workspace = Path(self.settings.openclaw_workspace).expanduser()
    
    def _resolve_path(self, relative_path: str) -> Path:
        """Resolve a relative path within the workspace."""
        # Normalize and prevent directory traversal
        clean = Path(relative_path).as_posix().lstrip("/")
        resolved = (self.workspace / clean).resolve()
        
        # Ensure it's within workspace
        if not str(resolved).startswith(str(self.workspace.resolve())):
            raise ValueError(f"Path {relative_path} is outside workspace")
        
        return resolved
    
    async def read_file(self, path: str) -> FileContent:
        """Read a file from the workspace."""
        try:
            resolved = self._resolve_path(path)
            if not resolved.exists():
                return FileContent(path=path, content="", exists=False)
            
            async with aiofiles.open(resolved, "r", encoding="utf-8") as f:
                content = await f.read()
            
            return FileContent(path=path, content=content, exists=True)
        except Exception as e:
            return FileContent(path=path, content=f"Error: {e}", exists=False)
    
    async def write_file(self, path: str, content: str) -> bool:
        """Write a file to the workspace."""
        try:
            resolved = self._resolve_path(path)
            resolved.parent.mkdir(parents=True, exist_ok=True)
            
            async with aiofiles.open(resolved, "w", encoding="utf-8") as f:
                await f.write(content)
            
            return True
        except Exception as e:
            raise ValueError(f"Failed to write file: {e}")
    
    async def list_directory(self, path: str = "") -> list[FileListItem]:
        """List files in a directory."""
        resolved = self._resolve_path(path) if path else self.workspace
        
        if not resolved.exists() or not resolved.is_dir():
            return []
        
        items = []
        for entry in sorted(resolved.iterdir()):
            stat = entry.stat()
            items.append(FileListItem(
                name=entry.name,
                path=str(entry.relative_to(self.workspace)),
                is_dir=entry.is_dir(),
                size=stat.st_size if entry.is_file() else None,
                modified=datetime.fromtimestamp(stat.st_mtime),
            ))
        
        return items
    
    async def delete_file(self, path: str) -> bool:
        """Delete a file from the workspace."""
        resolved = self._resolve_path(path)
        if resolved.exists() and resolved.is_file():
            resolved.unlink()
            return True
        return False
    
    async def get_memory_files(self) -> list[MemoryEntry]:
        """Get list of memory files."""
        memory_dir = self.workspace / "memory"
        entries = []
        
        # Add MEMORY.md if it exists
        memory_md = self.workspace / "MEMORY.md"
        if memory_md.exists():
            stat = memory_md.stat()
            async with aiofiles.open(memory_md, "r", encoding="utf-8") as f:
                content = await f.read()
            preview = content[:200] + "..." if len(content) > 200 else content
            entries.append(MemoryEntry(
                path="MEMORY.md",
                name="MEMORY.md",
                date=None,
                preview=preview,
                size=stat.st_size,
            ))
        
        # Add daily memory files
        if memory_dir.exists():
            for f in sorted(memory_dir.glob("*.md"), reverse=True):
                stat = f.stat()
                # Try to extract date from filename
                date_str = f.stem if f.stem.count("-") == 2 else None
                
                async with aiofiles.open(f, "r", encoding="utf-8") as file:
                    content = await file.read()
                preview = content[:200] + "..." if len(content) > 200 else content
                
                entries.append(MemoryEntry(
                    path=f"memory/{f.name}",
                    name=f.name,
                    date=date_str,
                    preview=preview,
                    size=stat.st_size,
                ))
        
        return entries


# Singleton instance
_service: Optional[FileService] = None


def get_file_service() -> FileService:
    """Get or create file service instance."""
    global _service
    if _service is None:
        _service = FileService()
    return _service
