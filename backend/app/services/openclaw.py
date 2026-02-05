"""OpenClaw Gateway client service."""

import httpx
from typing import Any, Optional
from ..config import get_settings


class OpenClawClient:
    """Client for interacting with OpenClaw Gateway HTTP APIs."""
    
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.openclaw_gateway_url
        self.token = self.settings.openclaw_gateway_token
    
    def _headers(self) -> dict[str, str]:
        """Get auth headers."""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    async def invoke_tool(
        self,
        tool: str,
        args: dict[str, Any] = None,
        action: str = None,
        session_key: str = "main",
    ) -> dict[str, Any]:
        """Invoke an OpenClaw tool via HTTP API."""
        payload = {
            "tool": tool,
            "args": args or {},
            "sessionKey": session_key,
        }
        if action:
            payload["action"] = action
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.base_url}/tools/invoke",
                headers=self._headers(),
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()
    
    async def chat_completion(
        self,
        message: str,
        user: str = "figgy-portal",
    ) -> dict:
        """Send a chat completion request via the OpenAI-compatible endpoint."""
        payload = {
            "model": "openclaw:main",
            "messages": [{"role": "user", "content": message}],
            "stream": False,
            "user": user,  # Creates a stable session key from this user string
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/v1/chat/completions",
                headers=self._headers(),
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()
    
    async def get_sessions(self, active_minutes: int = None) -> list[dict]:
        """Get list of sessions."""
        args = {}
        if active_minutes:
            args["activeMinutes"] = active_minutes
        
        result = await self.invoke_tool("sessions_list", args)
        if result.get("ok"):
            # Sessions can be in result.details.sessions or result.sessions
            res = result.get("result", {})
            details = res.get("details", {})
            return details.get("sessions", res.get("sessions", []))
        return []
    
    async def get_session_status(self, session_key: str = None) -> dict:
        """Get session status."""
        args = {}
        if session_key:
            args["sessionKey"] = session_key
        
        result = await self.invoke_tool("session_status", args)
        if result.get("ok"):
            return result.get("result", {})
        return {}
    
    async def send_to_session(
        self,
        message: str,
        session_key: str = None,
        label: str = None,
    ) -> dict:
        """Send message to a session."""
        args = {"message": message}
        if session_key:
            args["sessionKey"] = session_key
        if label:
            args["label"] = label
        
        result = await self.invoke_tool("sessions_send", args)
        return result
    
    async def get_config(self) -> dict:
        """Get gateway config."""
        result = await self.invoke_tool("gateway", action="config.get")
        if result.get("ok"):
            # Structure: result.result.details.result.{config, hash, ...}
            details = result.get("result", {}).get("details", {})
            inner_result = details.get("result", details)  # Fallback for different structures
            return {
                "config": inner_result.get("config", {}),
                "hash": inner_result.get("hash", ""),
            }
        return {"config": {}, "hash": ""}
    
    async def patch_config(self, patch: dict, base_hash: str) -> dict:
        """Patch gateway config."""
        import json
        result = await self.invoke_tool(
            "gateway",
            args={"raw": json.dumps(patch), "baseHash": base_hash},
            action="config.patch",
        )
        return result
    
    async def get_config_schema(self) -> dict:
        """Get config schema."""
        result = await self.invoke_tool("gateway", action="config.schema")
        if result.get("ok"):
            details = result.get("result", {}).get("details", {})
            inner_result = details.get("result", details)
            return {
                "schema": inner_result.get("schema", {}),
                "uiHints": inner_result.get("uiHints", {}),
            }
        return {"schema": {}, "uiHints": {}}
    
    async def restart_gateway(self) -> dict:
        """Restart the gateway."""
        result = await self.invoke_tool("gateway", action="restart")
        return result
    
    # --- Cron methods ---
    
    async def cron_status(self) -> dict:
        """Get cron scheduler status."""
        result = await self.invoke_tool("cron", args={"action": "status"})
        if result.get("ok"):
            return result.get("result", {}).get("details", {})
        return {"ok": False}
    
    async def cron_list(self, include_disabled: bool = False) -> dict:
        """List cron jobs."""
        args = {"action": "list"}
        if include_disabled:
            args["includeDisabled"] = True
        result = await self.invoke_tool("cron", args=args)
        if result.get("ok"):
            details = result.get("result", {}).get("details", {})
            return details.get("result", details)
        return {"jobs": []}
    
    async def cron_add(self, job: dict) -> dict:
        """Add a new cron job."""
        args = {"action": "add", "job": job}
        result = await self.invoke_tool("cron", args=args)
        if result.get("ok"):
            details = result.get("result", {}).get("details", {})
            return details.get("result", details)
        raise Exception(result.get("error", "Failed to create job"))
    
    async def cron_update(self, job_id: str, patch: dict) -> dict:
        """Update a cron job."""
        args = {"action": "update", "jobId": job_id, "patch": patch}
        result = await self.invoke_tool("cron", args=args)
        if result.get("ok"):
            details = result.get("result", {}).get("details", {})
            return details.get("result", details)
        raise Exception(result.get("error", "Failed to update job"))
    
    async def cron_remove(self, job_id: str) -> dict:
        """Remove a cron job."""
        args = {"action": "remove", "jobId": job_id}
        result = await self.invoke_tool("cron", args=args)
        if result.get("ok"):
            details = result.get("result", {}).get("details", {})
            return details.get("result", details)
        raise Exception(result.get("error", "Failed to remove job"))
    
    async def cron_run(self, job_id: str) -> dict:
        """Trigger a job to run immediately."""
        args = {"action": "run", "jobId": job_id}
        result = await self.invoke_tool("cron", args=args)
        if result.get("ok"):
            details = result.get("result", {}).get("details", {})
            return details.get("result", details)
        raise Exception(result.get("error", "Failed to run job"))
    
    async def cron_runs(self, job_id: str) -> dict:
        """Get run history for a job."""
        args = {"action": "runs", "jobId": job_id}
        result = await self.invoke_tool("cron", args=args)
        if result.get("ok"):
            details = result.get("result", {}).get("details", {})
            return details.get("result", details)
        return {"runs": []}
    
    async def health_check(self) -> dict:
        """Check gateway health by trying to invoke a simple tool."""
        try:
            # Try to get session status as a health check
            result = await self.invoke_tool("session_status", args={})
            if result.get("ok"):
                return {
                    "ok": True,
                    "data": result.get("result", {}),
                }
            return {"ok": False, "error": "Tool invoke failed"}
        except httpx.ConnectError:
            return {"ok": False, "error": "Cannot connect to gateway"}
        except httpx.TimeoutException:
            return {"ok": False, "error": "Gateway timeout"}
        except Exception as e:
            return {"ok": False, "error": str(e)}


# Singleton instance
_client: Optional[OpenClawClient] = None


def get_openclaw_client() -> OpenClawClient:
    """Get or create OpenClaw client instance."""
    global _client
    if _client is None:
        _client = OpenClawClient()
    return _client
