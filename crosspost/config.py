"""
Configuration loader and Graceful Standby detector for Herbal Harbour cross-posting pipeline.
Follows Rule 6: Automatically decouples external services when credentials are unset.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional


def _is_placeholder(val: Optional[str]) -> bool:
    """Check if a credential value is empty, unset, or an unconfigured placeholder."""
    if not val:
        return True
    cleaned = val.strip().strip("\"'").strip()
    if not cleaned:
        return True
    # Common placeholder markers
    lower = cleaned.lower()
    if lower.startswith("my_") or "placeholder" in lower or lower in ("none", "null", "your_token_here"):
        return True
    return False


def _parse_bool(val: Any, default: bool = True) -> bool:
    if val is None:
        return default
    if isinstance(val, bool):
        return val
    s = str(val).strip().lower()
    return s in ("1", "true", "yes", "on")


@dataclass
class CrosspostConfig:
    enabled: bool = True
    poll_interval: int = 300
    standby_mode: str = "auto"  # "auto" | "live" | "mock"

    # Instagram Graph API
    instagram_app_id: Optional[str] = None
    instagram_app_secret: Optional[str] = None
    instagram_access_token: Optional[str] = None
    instagram_account_id: Optional[str] = None
    instagram_verify_token: str = "herbal_harbour_ig_verify_2026"

    # YouTube Data API v3
    youtube_client_id: Optional[str] = None
    youtube_client_secret: Optional[str] = None
    youtube_refresh_token: Optional[str] = None
    youtube_client_secrets_file: Optional[str] = None
    youtube_privacy_status: str = "public"  # "public" | "unlisted" | "private"

    # TikTok Content Posting API v2
    tiktok_client_key: Optional[str] = None
    tiktok_client_secret: Optional[str] = None
    tiktok_access_token: Optional[str] = None
    tiktok_privacy_level: str = "PUBLIC_TO_EVERYONE"

    # Storage and Cache
    db_path: str = "data/crosspost.db"
    media_dir: str = "/tmp/herbal_harbour_crosspost"

    def is_instagram_standby(self) -> bool:
        mode = self.standby_mode.lower()
        if mode == "mock":
            return True
        if mode == "live":
            return False
        # auto mode: standby if token or account_id is missing/placeholder
        return _is_placeholder(self.instagram_access_token) or _is_placeholder(self.instagram_account_id)

    def is_youtube_standby(self) -> bool:
        mode = self.standby_mode.lower()
        if mode == "mock":
            return True
        if mode == "live":
            return False
        # auto mode: standby if client_id or client_secrets_file missing
        has_secrets_file = bool(
            self.youtube_client_secrets_file
            and not _is_placeholder(self.youtube_client_secrets_file)
            and Path(self.youtube_client_secrets_file).exists()
        )
        has_direct_creds = not _is_placeholder(self.youtube_client_id) and not _is_placeholder(self.youtube_client_secret)
        return not (has_secrets_file or has_direct_creds)

    def is_tiktok_standby(self) -> bool:
        mode = self.standby_mode.lower()
        if mode == "mock":
            return True
        if mode == "live":
            return False
        # auto mode: standby if access token is missing/placeholder
        return _is_placeholder(self.tiktok_access_token)


def load_env_file(filepath: Path | str) -> Dict[str, str]:
    """Parse a .env formatted file safely without external dependencies."""
    p = Path(filepath)
    env_vars: Dict[str, str] = {}
    if not p.exists() or not p.is_file():
        return env_vars

    with open(p, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, val = line.partition("=")
                key = key.strip()
                val = val.strip()
                if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                    val = val[1:-1]
                env_vars[key] = val
    return env_vars


def load_config(env_file: Optional[str | Path] = None, **overrides: Any) -> CrosspostConfig:
    """
    Load configuration from environment variables, optional .env file, and keyword overrides.
    """
    file_vars: Dict[str, str] = {}
    if env_file:
        file_vars = load_env_file(env_file)
    else:
        # Check standard default locations
        default_env = Path(".env")
        if default_env.exists():
            file_vars = load_env_file(default_env)

    def get_var(key: str, default: Optional[str] = None) -> Optional[str]:
        if key in overrides and overrides[key] is not None:
            return str(overrides[key])
        if key in os.environ:
            return os.environ[key]
        if key in file_vars:
            return file_vars[key]
        return default

    enabled = _parse_bool(get_var("CROSSPOST_ENABLED", "true"))
    try:
        poll_interval = int(get_var("CROSSPOST_POLL_INTERVAL", "300") or 300)
    except ValueError:
        poll_interval = 300

    standby_mode = get_var("CROSSPOST_STANDBY_MODE", "auto") or "auto"

    config = CrosspostConfig(
        enabled=enabled,
        poll_interval=poll_interval,
        standby_mode=standby_mode,
        instagram_app_id=get_var("INSTAGRAM_APP_ID"),
        instagram_app_secret=get_var("INSTAGRAM_APP_SECRET"),
        instagram_access_token=get_var("INSTAGRAM_ACCESS_TOKEN"),
        instagram_account_id=get_var("INSTAGRAM_ACCOUNT_ID"),
        instagram_verify_token=get_var("INSTAGRAM_VERIFY_TOKEN", "herbal_harbour_ig_verify_2026") or "herbal_harbour_ig_verify_2026",
        youtube_client_id=get_var("YOUTUBE_CLIENT_ID"),
        youtube_client_secret=get_var("YOUTUBE_CLIENT_SECRET"),
        youtube_refresh_token=get_var("YOUTUBE_REFRESH_TOKEN"),
        youtube_client_secrets_file=get_var("YOUTUBE_CLIENT_SECRETS_FILE"),
        youtube_privacy_status=get_var("YOUTUBE_PRIVACY_STATUS", "public") or "public",
        tiktok_client_key=get_var("TIKTOK_CLIENT_KEY"),
        tiktok_client_secret=get_var("TIKTOK_CLIENT_SECRET"),
        tiktok_access_token=get_var("TIKTOK_ACCESS_TOKEN"),
        tiktok_privacy_level=get_var("TIKTOK_PRIVACY_LEVEL", "PUBLIC_TO_EVERYONE") or "PUBLIC_TO_EVERYONE",
        db_path=get_var("CROSSPOST_DB_PATH", "data/crosspost.db") or "data/crosspost.db",
        media_dir=get_var("CROSSPOST_MEDIA_DIR", "/tmp/herbal_harbour_crosspost") or "/tmp/herbal_harbour_crosspost",
    )

    # Apply direct field overrides if provided
    for field_name, value in overrides.items():
        if hasattr(config, field_name) and value is not None:
            setattr(config, field_name, value)

    return config
