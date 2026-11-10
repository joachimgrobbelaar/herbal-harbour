"""
Instagram Graph API post detector and Rule 6 Mock Adapter for Herbal Harbour.
Polls for new Instagram posts and filters video content (Reels) from static images.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests

from .config import CrosspostConfig, load_config
from .models import SocialPost

logger = logging.getLogger(__name__)


class InstagramAPIError(Exception):
    """Raised when the Instagram Graph API request fails."""


class InstagramDetector:
    def __init__(
        self,
        config: Optional[CrosspostConfig] = None,
        access_token: Optional[str] = None,
        account_id: Optional[str] = None,
        standby_mode: Optional[str] = None,
    ):
        self.config = config or load_config()
        self.access_token = access_token or self.config.instagram_access_token
        self.account_id = account_id or self.config.instagram_account_id

        if standby_mode is not None:
            self._force_standby: Optional[bool] = standby_mode.lower() in ("mock", "true", "1")
        else:
            self._force_standby = None

    @property
    def is_standby(self) -> bool:
        if self._force_standby is not None:
            return self._force_standby
        if self.config.standby_mode.lower() == "mock":
            return True
        if self.config.standby_mode.lower() == "live":
            return False
        return not bool(self.access_token and self.account_id)

    def fetch_recent_posts(self, limit: int = 5) -> List[SocialPost]:
        """
        Fetch recent posts from Instagram.
        Under Rule 6 Graceful Standby: returns synthetic mock posts if live credentials are not set.
        """
        if self.is_standby:
            logger.info("[STANDBY] Instagram detector running in mock mode. Returning synthetic posts.")
            return self._get_mock_posts()[:limit]

        url = f"https://graph.facebook.com/v19.0/{self.account_id}/media"
        params = {
            "fields": "id,caption,media_type,media_url,permalink,timestamp",
            "limit": limit,
            "access_token": self.access_token,
        }

        try:
            resp = requests.get(url, params=params, timeout=15)
        except requests.RequestException as err:
            logger.error(
                "[Instagram] Network failure connecting to Meta Graph API: %s. Action: Check internet connection or DNS.",
                err,
            )
            raise InstagramAPIError(f"Network error connecting to Instagram: {err}") from err

        if resp.status_code != 200:
            msg = f"Meta Graph API error (status {resp.status_code}): {resp.text}"
            logger.error("[Instagram] %s. Action: Refresh Meta User Token or check permissions.", msg)
            raise InstagramAPIError(msg)

        data = resp.json()
        raw_items = data.get("data", [])
        posts: List[SocialPost] = []
        for item in raw_items:
            posts.append(
                SocialPost(
                    post_id=item.get("id", ""),
                    caption=item.get("caption", ""),
                    media_url=item.get("media_url", ""),
                    media_type=item.get("media_type", "IMAGE"),
                    permalink=item.get("permalink", ""),
                    timestamp=item.get("timestamp", ""),
                )
            )
        return posts

    def _get_mock_posts(self) -> List[SocialPost]:
        """Synthetic posts for Graceful Standby and test suites."""
        return [
            SocialPost(
                post_id="ig_reel_83749201",
                caption="Experience holistic wellness with Herbal Harbour Karoo botanicals! 🌿 Handcrafted with organic care in the Western Cape. #HerbalHarbour #Wellness #KarooBotanicals",
                media_url="https://herbalharbour.co.za/assets/video/sample_reel.mp4",
                media_type="VIDEO",
                permalink="https://www.instagram.com/reel/C3xY9zA/",
                timestamp="2026-11-10T12:00:00+00:00",
                tags=["HerbalHarbour", "Wellness", "KarooBotanicals"],
            ),
            SocialPost(
                post_id="ig_img_10293847",
                caption="New Karoo CBD drops available in store! 🌿 Clean, organic, pure. #HerbalHarbour #KarooDrops",
                media_url="https://herbalharbour.co.za/assets/images/cbd_drops.jpg",
                media_type="IMAGE",
                permalink="https://www.instagram.com/p/C3xY9zB/",
                timestamp="2026-11-10T11:30:00+00:00",
                tags=["HerbalHarbour", "KarooDrops"],
            ),
        ]

    def download_media(self, post: SocialPost, target_dir: Optional[str] = None) -> str:
        """
        Download media file to target_dir. In standby mode, generates a valid simulated video file.
        """
        destination_dir = Path(target_dir or self.config.media_dir)
        destination_dir.mkdir(parents=True, exist_ok=True)
        local_path = destination_dir / f"{post.post_id}.mp4"

        if self.is_standby:
            if not local_path.exists():
                local_path.write_bytes(b"\x00\x00\x00 ftypisom\x00\x00\x02\x00isomiso2mp41")
            post.local_video_path = str(local_path)
            return str(local_path)

        if not post.media_url:
            raise ValueError(f"Post {post.post_id} has no media_url to download.")

        try:
            with requests.get(post.media_url, stream=True, timeout=30) as r:
                r.raise_for_status()
                with open(local_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=65536):
                        f.write(chunk)
            post.local_video_path = str(local_path)
            return str(local_path)
        except requests.RequestException as exc:
            logger.error("[Instagram] Failed to download media for post %s: %s", post.post_id, exc)
            raise


class MockInstagramDetector(InstagramDetector):
    """
    Explicit test adapter for injecting custom mock posts or simulating network faults.
    """

    def __init__(
        self,
        custom_posts: Optional[List[SocialPost]] = None,
        should_raise: Optional[Exception] = None,
    ):
        super().__init__(standby_mode="mock")
        self.custom_posts = custom_posts
        self.should_raise = should_raise

    def fetch_recent_posts(self, limit: int = 5) -> List[SocialPost]:
        if self.should_raise:
            raise self.should_raise
        if self.custom_posts is not None:
            return self.custom_posts[:limit]
        return super().fetch_recent_posts(limit)
