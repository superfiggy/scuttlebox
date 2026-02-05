"""Gateway configuration endpoints."""

import json
from fastapi import APIRouter, HTTPException
from ..services.openclaw import get_openclaw_client
from ..models.schemas import ConfigResponse, ConfigPatchRequest

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("", response_model=ConfigResponse)
async def get_config():
    """Get current gateway configuration."""
    client = get_openclaw_client()
    
    try:
        result = await client.get_config()
        return ConfigResponse(
            config=result.get("config", {}),
            hash=result.get("hash", ""),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.patch("")
async def patch_config(request: ConfigPatchRequest):
    """Patch gateway configuration."""
    client = get_openclaw_client()
    
    try:
        result = await client.patch_config(request.patch, request.base_hash)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.post("/restart")
async def restart_gateway():
    """Restart the gateway."""
    client = get_openclaw_client()
    
    try:
        result = await client.restart_gateway()
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")


@router.get("/schema")
async def get_config_schema():
    """Get the configuration schema."""
    client = get_openclaw_client()
    
    try:
        result = await client.get_config_schema()
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {e}")
