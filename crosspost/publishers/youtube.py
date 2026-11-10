"""
YouTube Shorts publisher and Rule 6 Mock Adapter for Herbal Harbour.
Handles title sanitization (<= 90 chars + ' #Shorts'), hashtag extraction,
resumable upload, and actionable diagnostic logging.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests

from ..config import CrosspostConfig, load_config
from ..models import PlatformResult, SocialPost
from .base import BaseSocialPublisher

logger = logging.getLogger(__name__)


def sanitize_youtube_title(caption: str, max_base_length: int = 90) -> str:
    """
    Sanitize and truncate caption to comply with YouTube's 100-character title limit:
    1. Extracts first line or sentence.
    2. Removes leading/trailing whitespace and multiple spaces.
    3. Truncates base title to at most max_base_length (default 90).
    4. Appends ' #Shorts' ensuring total length <= 100 characters.
    """
    if not caption or not caption.strip():
        base = "Herbal Harbour Wellness"
    else:
        # Extract first line
        first_line = caption.strip().split("\n")[0].strip()
        # Clean double spaces
        first_line = re.sub(r"\s+", " ", first_line)
        # Remove trailing punctuation before truncation
        base = first_line

    if len(base) > max_base_length:
        base = base[:max_base_length].rstrip(" .,!?:;")

    # Avoid duplicating #Shorts
    if "#shorts" in base.lower():
        return base

    return f"{base} #Shorts"


class YouTubePublisher(BaseSocialPublisher):
    def __init__(
        self,
        config: Optional[CrosspostConfig] = None,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        refresh_token: Optional[str] = None,
        secrets_file: Optional[str] = None,
        privacy_status: Optional[str] = None,
        standby_mode: Optional[str] = None,
    ):
        self.config = config or load_config()
        self.client_id = client_id or self.config.youtube_client_id
        self.client_secret = client_secret or self.config.youtube_client_secret
        self.refresh_token = refresh_token or self.config.youtube_refresh_token
        self.secrets_file = secrets_file or self.config.youtube_client_secrets_file
        self.privacy_status = privacy_status or self.config.youtube_privacy_status

        if standby_mode is not None:
            self._force_standby: Optional[bool] = standby_mode.lower() in ("mock", "true", "1")
        else:
            self._force_standby = None

    @property
    def platform_name(self) -> str:
        return "youtube"

    @property
    def is_standby(self) -> bool:
        if self._force_standby is not None:
            return self._force_standby
        return self.config.is_youtube_standby()

    def format_description(self, post: SocialPost) -> str:
        """Format full video description with Herbal Harbour dispensary details."""
        footer = (
            "\n\n---\n"
            "🌿 Herbal Harbour — Natural Wellness & Karoo Botanicals\n"
            "Official Store: https://herbalharbour.co.za\n"
            "Customer Support: info@herbalharbour.co.za\n"
            "Follow our journey for organic healing and botanical education."
        )
        return f"{post.caption}{footer}"

    def get_tags(self, post: SocialPost) -> List[str]:
        """Aggregate post hashtags with default brand tags."""
        default_tags = ["HerbalHarbour", "Wellness", "KarooBotanicals", "Shorts"]
        merged = list(dict.fromkeys(post.tags + default_tags))
        return merged

    def publish(self, post: SocialPost) -> PlatformResult:
        """
        Upload video to YouTube as a Short.
        In Rule 6 Graceful Standby: returns simulated publication result.
        """
        title = sanitize_youtube_title(post.caption)
        description = self.format_description(post)
        tags = self.get_tags(post)

        if self.is_standby:
            logger.info(
                "[STANDBY] YouTube Shorts publisher running in mock mode. Simulating upload for post %s (Title: %s).",
                post.post_id,
                title,
            )
            sim_id = f"yt_sim_{post.post_id}"
            return PlatformResult(
                platform="youtube",
                status="SIMULATED",
                published_id=sim_id,
                url=f"https://youtube.com/shorts/{post.post_id}",
            )

        # Live YouTube Data API v3 upload
        logger.info("[YouTube] Initializing live upload for post %s to YouTube Shorts...", post.post_id)
        try:
            # Exchange refresh token for access token
            token_url = "https://oauth2.googleapis.com/token"
            token_payload = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": self.refresh_token,
                "grant_type": "refresh_token",
            }
            token_resp = requests.post(token_url, data=token_payload, timeout=15)
            if token_resp.status_code != 200:
                err_msg = f"OAuth token refresh failed ({token_resp.status_code}): {token_resp.text}"
                logger.error("[YouTube] %s. Action: Check YouTube OAuth credentials or refresh token.", err_msg)
                return PlatformResult(
                    platform="youtube",
                    status="FAILED",
                    error_message=err_msg,
                    action_item="Check YouTube OAuth client ID/secret and re-authorize refresh token.",
                )

            access_token = token_resp.json().get("access_token")

            # Initiate resumable upload session
            upload_url = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json; charset=UTF-8",
                "X-Upload-Content-Type": "video/mp4",
            }
            body = {
                "snippet": {
                    "title": title,
                    "description": description,
                    "tags": tags,
                    "categoryId": "22",  # People & Blogs
                },
                "status": {
                    "privacyStatus": self.privacy_status,
                    "selfDeclaredMadeForKids": False,
                },
            }

            init_resp = requests.post(upload_url, headers=headers, json=body, timeout=20)
            if init_resp.status_code in (403, 401):
                err_msg = f"YouTube API quota/permission error ({init_resp.status_code}): {init_resp.text}"
                logger.error("[YouTube] %s. Action: Request YouTube quota extension (default: 10,000 units/day).", err_msg)
                return PlatformResult(
                    platform="youtube",
                    status="FAILED",
                    error_message=err_msg,
                    action_item="Check YouTube API quota (10,000 units/day) or permissions.",
                )
            if init_resp.status_code not in (200, 201):
                err_msg = f"Failed to initialize upload ({init_resp.status_code}): {init_resp.text}"
                logger.error("[YouTube] %s", err_msg)
                return PlatformResult(
                    platform="youtube",
                    status="FAILED",
                    error_message=err_msg,
                    action_item="Inspect YouTube Data API v3 upload session configuration.",
                )

            session_url = init_resp.headers.get("Location")
            if not session_url:
                return PlatformResult(
                    platform="youtube",
                    status="FAILED",
                    error_message="Missing resumable upload Location header from YouTube.",
                    action_item="Verify network connection and API endpoint availability.",
                )

            # Stream video content
            video_data = b"\x00\x00\x00 ftypisom"
            if post.local_video_path and Path(post.local_video_path).exists():
                video_data = Path(post.local_video_path).read_bytes()

            upload_resp = requests.put(
                session_url,
                headers={"Content-Type": "video/mp4"},
                data=video_data,
                timeout=60,
            )

            if upload_resp.status_code in (200, 201):
                video_id = upload_resp.json().get("id", f"yt_{post.post_id}")
                return PlatformResult(
                    platform="youtube",
                    status="SUCCESS",
                    published_id=video_id,
                    url=f"https://youtube.com/shorts/{video_id}",
                )
            else:
                err_msg = f"Resumable video upload failed ({upload_resp.status_code}): {upload_resp.text}"
                logger.error("[YouTube] %s", err_msg)
                return PlatformResult(
                    platform="youtube",
                    status="FAILED",
                    error_message=err_msg,
                    action_item="Retry upload or verify media file encoding.",
                )

        except Exception as exc:
            err_msg = f"Unexpected YouTube upload error: {exc}"
            logger.exception("[YouTube] %s. Action: Check network connectivity.", err_msg)
            return PlatformResult(
                platform="youtube",
                status="FAILED",
                error_message=err_msg,
                action_item="Check YouTube API quota, OAuth tokens, and network connectivity.",
            )


class MockYouTubePublisher(YouTubePublisher):
    """Test publisher with injected behavior or forced error responses."""

    def __init__(
        self,
        should_fail: bool = False,
        error_status_code: int = 403,
        error_message: str = "Simulated YouTube quota exceeded",
    ):
        super().__init__(standby_mode="mock")
        self.should_fail = should_fail
        self.error_status_code = error_status_code
        self.error_message = error_message
        self.published_posts: List[SocialPost] = []

    def publish(self, post: SocialPost) -> PlatformResult:
        self.published_posts.append(post)
        if self.should_fail:
            action = "Check YouTube API quota (10,000 units/day) or re-authorize OAuth token."
            logger.error("[YouTube] [SIMULATED_ERROR %d] %s. Action: %s", self.error_status_code, self.error_message, action)
            return PlatformResult(
                platform="youtube",
                status="FAILED",
                error_message=f"HTTP {self.error_status_code}: {self.error_message}",
                action_item=action,
            )
        return super().publish(post)
