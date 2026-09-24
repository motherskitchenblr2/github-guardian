#!/usr/bin/env python3
"""
GitHub Guardian - High-performance, zero-dependency GitHub API Client.
Handles authentication, rate limits, pagination, and error recovery.
"""

import os
import json
import time
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional, Tuple


class GitHubClient:
    def __init__(self, token: Optional[str] = None):
        self.token = token or self._find_token()
        if not self.token:
            raise ValueError(
                "GitHub Personal Access Token not found. "
                "Set GITHUB_TOKEN or ensure ~/.gemini/config/mcp_config.json contains it."
            )
        self.base_url = "https://api.github.com"
        self._user_cache: Optional[Dict[str, Any]] = None

    def _find_token(self) -> Optional[str]:
        # 1. Environment variable
        env_token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN")
        if env_token:
            return env_token.strip()

        # 2. Antigravity MCP config
        mcp_path = os.path.expanduser("~/.gemini/config/mcp_config.json")
        if os.path.exists(mcp_path):
            try:
                with open(mcp_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                    tok = cfg.get("mcpServers", {}).get("github", {}).get("env", {}).get("GITHUB_PERSONAL_ACCESS_TOKEN")
                    if tok:
                        return tok.strip()
            except Exception:
                pass

        # 3. Dedicated guardian config
        guardian_tok_path = os.path.expanduser("~/.config/github-guardian/token")
        if os.path.exists(guardian_tok_path):
            try:
                with open(guardian_tok_path, "r", encoding="utf-8") as f:
                    tok = f.read().strip()
                    if tok:
                        return tok
            except Exception:
                pass

        return None

    def _request(
        self,
        endpoint: str,
        method: str = "GET",
        data: Optional[Dict[str, Any]] = None,
        max_retries: int = 3,
    ) -> Tuple[int, Any, Dict[str, str]]:
        url = endpoint if endpoint.startswith("http") else f"{self.base_url}{endpoint}"
        payload = json.dumps(data).encode("utf-8") if data is not None else None

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub-Guardian-Agent/1.0",
        }
        if payload is not None:
            headers["Content-Type"] = "application/json"

        for attempt in range(max_retries):
            req = urllib.request.Request(url, data=payload, headers=headers, method=method)
            try:
                with urllib.request.urlopen(req) as resp:
                    status = resp.status
                    resp_headers = {k.lower(): v for k, v in resp.headers.items()}
                    raw = resp.read().decode("utf-8")
                    content = json.loads(raw) if raw and resp_headers.get("content-type", "").startswith("application/json") else raw
                    return status, content, resp_headers
            except urllib.error.HTTPError as e:
                resp_headers = {k.lower(): v for k, v in e.headers.items()}
                raw = e.read().decode("utf-8")
                try:
                    content = json.loads(raw)
                except Exception:
                    content = raw

                # Handle Rate Limit (403 with X-RateLimit-Remaining == 0)
                if e.code == 403 and resp_headers.get("x-ratelimit-remaining") == "0":
                    reset_time = int(resp_headers.get("x-ratelimit-reset", time.time() + 60))
                    sleep_seconds = max(reset_time - int(time.time()), 5)
                    print(f"[RateLimit] Rate limit reached. Sleeping for {sleep_seconds}s...")
                    time.sleep(min(sleep_seconds, 60))
                    continue

                # Server error retry
                if e.code in (500, 502, 503, 504) and attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue

                return e.code, content, resp_headers
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise e

        return 500, {"message": "Max retries exceeded"}, {}

    def get(self, endpoint: str) -> Tuple[int, Any]:
        status, body, _ = self._request(endpoint, method="GET")
        return status, body

    def post(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Tuple[int, Any]:
        status, body, _ = self._request(endpoint, method="POST", data=data)
        return status, body

    def put(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Tuple[int, Any]:
        status, body, _ = self._request(endpoint, method="PUT", data=data)
        return status, body

    def patch(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Tuple[int, Any]:
        status, body, _ = self._request(endpoint, method="PATCH", data=data)
        return status, body

    def delete(self, endpoint: str) -> Tuple[int, Any]:
        status, body, _ = self._request(endpoint, method="DELETE")
        return status, body

    def paginate(self, endpoint: str, per_page: int = 100, max_pages: int = 50) -> List[Dict[str, Any]]:
        results = []
        page = 1
        sep = "&" if "?" in endpoint else "?"
        while page <= max_pages:
            paginated_url = f"{endpoint}{sep}per_page={per_page}&page={page}"
            status, data = self.get(paginated_url)
            if status != 200 or not isinstance(data, list) or not data:
                break
            results.extend(data)
            if len(data) < per_page:
                break
            page += 1
        return results

    def get_authenticated_user(self) -> Dict[str, Any]:
        if self._user_cache is None:
            status, user = self.get("/user")
            if status != 200:
                raise RuntimeError(f"Failed to fetch authenticated user profile: {user}")
            self._user_cache = user
        return self._user_cache

    def get_user_login(self) -> str:
        return self.get_authenticated_user()["login"]
