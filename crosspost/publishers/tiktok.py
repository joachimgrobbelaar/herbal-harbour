"""
TikTok Content Posting API v2 publisher and Rule 6 Mock Adapter for Herbal Harbour.
Handles caption formatting, video initialization, and actionable diagnostic logging.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
import requests

from ..config import CrosspostConfig, load_config
from ..models import PlatformResult, SocialPost
from .base import BaseSocialPublisher

logger = logging.getLogger(__name__)


def format_tiktok_caption(caption: str, tags: List[str], max_length: int = 500) -> str:
    """Format caption and append brand hashtags within TikTok's character limit."""
    base_text = caption.strip() if caption else "Herbal Harbour Karoo Botanicals"
    brand_tags = ["#herbalharbour", "#wellness", "#karoo", "#botanicals"]

    # Normalize existing tags
    tag_set = {f"#{t.lower().lstrip('#')}" for t in tags}
    for bt in brand_tags:
        tag_set.add(bt)

    tag_str = " ".join(sorted(tag_set))
    full = f"{base_text}\n\n{tag_str}"

    if len(full) <= max_length:
        return full

    # Truncate base text if needed
    allowed_base = max(20, max_length - len(tag_str) - 4)
    truncated_base = base_text[:allowed_base].rstrip() + "..."
    return f"{truncated_base}\n\n{tag_str}"


class TikTokPublisher(BaseSocialPublisher):
    def __init__(
        self,
        config: Optional[CrosspostConfig] = None,
        client_key: Optional[str] = None,
        client_secret: Optional[str] = None,
        access_token: Optional[str] = None,
        privacy_level: Optional[str] = None,
        standby_mode: Optional[str] = None,
    ):
        self.config = config or load_config()
        self.client_key = client_key or self.config.tiktok_client_key
        self.client_secret = client_secret or self.config.tiktok_client_secret
        self.access_token = access_token or self.config.tiktok_access_token
        self.privacy_level = privacy_level or self.config.tiktok_privacy_level

        if standby_mode is not None:
            self._force_standby: Optional[bool] = standby_mode.lower() in ("mock", "true", "1")
        else:
            self._force_standby = None

    @property
    def platform_name(self) -> str:
        return "tiktok"

    @property
    def is_standby(self) -> bool:
        if self._force_standby is not None:
            return self._force_standby
        return self.config.is_tiktok_standby()

    def publish(self, post: SocialPost) -> PlatformResult:
        """
        Publish video to TikTok using Content Posting API v2.
        In Rule 6 Graceful Standby: returns simulated publication result.
        """
        caption = format_tiktok_caption(post.caption, post.tags)

        if self.is_standby:
            logger.info(
                "[STANDBY] TikTok Content Posting API publisher running in mock mode. Simulating upload for post %s.",
                post.post_id,
            )
            sim_id = f"tt_sim_{post.post_id}"
            return PlatformResult(
                platform="tiktok",
                status="SIMULATED",
                published_id=sim_id,
                url=f"https://www.tiktok.com/@herbalharbour/video/{post.post_id}",
            )

        # Live TikTok Content Posting API v2 request
        logger.info("[TikTok] Initializing live video upload for post %s...", post.post_id)
        endpoint = "https://open.tiktokapis.com/v2/post/publish/video/init/"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json; charset=UTF-8",
        }
        payload = {
            "post_info": {
                "title": caption,
                "privacy_level": self.privacy_level,
                "disable_duet": False,
                "disable_stitch": False,
                "disable_comment": False,
                "video_cover_timestamp_ms": 1000,
            },
            "source_info": {
                "source": "PULL_FROM_URL",
                "video_url": post.media_url,
            },
        }

        try:
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=25)
            if resp.status_code in (401, 403):
                err_msg = f"TikTok API authentication/permission error ({resp.status_code}): {resp.text}"
                logger.error("[TikTok] %s. Action: Refresh TikTok user access token or verify video.publish scope.", err_msg)
                return PlatformResult(
                    platform="tiktok",
                    status="FAILED",
                    error_message=err_msg,
                    action_item="Verify TikTok Content Posting API access token and permissions (video.publish).",
                )

            if resp.status_code != 200:
                err_msg = f"TikTok publish initialization failed ({resp.status_code}): {resp.text}"
                logger.error("[TikTok] %s", err_msg)
                return PlatformResult(
                    platform="tiktok",
                    status="FAILED",
                    error_message=err_msg,
                    action_item="Verify TikTok video format, resolution, and API limits.",
                )

            data = resp.json().get("data", {})
            publish_id = data.get("publish_id", f"tt_pub_{post.post_id}")
            return PlatformResult(
                platform="tiktok",
                status="SUCCESS",
                published_id=publish_id,
                url=f"https://www.tiktok.com/@herbalharbour/video/{publish_id}",
            )

        except requests.RequestException as exc:
            err_msg = f"Network failure communicating with TikTok API: {exc}"
            logger.error("[TikTok] %s. Action: Check network connectivity.", err_msg)
            return PlatformResult(
                platform="tiktok",
                status="FAILED",
                error_message=err_msg,
                action_item="Check network connectivity and TikTok API status.",
            )
        except Exception as exc:
            err_msg = f"Unexpected TikTok publisher error: {exc}"
            logger.exception("[TikTok] %s", err_msg)
            return PlatformResult(
                platform="tiktok",
                status="FAILED",
                error_message=err_msg,
                action_item="Check server logs and TikTok API configuration.",
            )


class MockTikTokPublisher(TikTokPublisher):
    """Test publisher with injected behavior or forced error responses."""

    def __init__(
        self,
        should_fail: bool = False,
        error_status_code: int = 500,
        error_message: str = "Simulated TikTok API failure",
    ):
        super().__init__(standby_mode="mock")
        self.should_fail = should_fail
        self.error_status_code = error_status_code
        self.error_message = error_message
        self.published_posts: List[SocialPost] = []

    def publish(self, post: SocialPost) -> PlatformResult:
        self.published_posts.append(post)
        if self.should_fail:
            action = "Verify TikTok Content Posting API access token and permissions."
            logger.error("[TikTok] [SIMULATED_ERROR %d] %s. Action: %s", self.error_status_code, self.error_message, action)
            return PlatformResult(
                platform="tiktok",
                status="FAILED",
                error_message=f"HTTP {self.error_status_code}: {self.error_message}",
                action_item=action,
            )
        return super().publish(post)
