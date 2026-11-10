"""
Cross-posting pipeline orchestrator for Herbal Harbour.
Coordinates detection, deduplication, video filtering, and decoupled platform publishing
with strict fault isolation and daemon stability.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional

from .config import CrosspostConfig, load_config
from .detector import InstagramDetector
from .models import PlatformResult, PostStatus, SocialPost
from .publishers.base import BaseSocialPublisher
from .publishers.tiktok import TikTokPublisher
from .publishers.youtube import YouTubePublisher
from .storage import CrosspostStore

logger = logging.getLogger(__name__)


class CrossPostingPipeline:
    def __init__(
        self,
        detector: Optional[InstagramDetector] = None,
        youtube_pub: Optional[BaseSocialPublisher] = None,
        tiktok_pub: Optional[BaseSocialPublisher] = None,
        store: Optional[CrosspostStore] = None,
        config: Optional[CrosspostConfig] = None,
    ):
        self.config = config or load_config()
        self.store = store or CrosspostStore(db_path=self.config.db_path)
        self.detector = detector or InstagramDetector(config=self.config)
        self.youtube_pub = youtube_pub or YouTubePublisher(config=self.config)
        self.tiktok_pub = tiktok_pub or TikTokPublisher(config=self.config)

    def sync_new_posts(self, limit: int = 5) -> Dict[str, Any]:
        """
        Poll for new Instagram posts and cross-post new video Reels to YouTube and TikTok.
        Implements strict platform fault isolation so failure on one platform does not
        block publishing to the other.
        """
        summary: Dict[str, Any] = {
            "detected": 0,
            "published": 0,
            "partially_published": 0,
            "failed": 0,
            "skipped": 0,
            "items": [],
            "errors": [],
        }

        # 1. Fetch recent posts with top-level error shield
        try:
            posts = self.detector.fetch_recent_posts(limit=limit)
        except Exception as exc:
            err_msg = f"Failed to fetch posts from Instagram detector: {exc}"
            logger.error("[CrossPost Pipeline] %s. Action: Check Instagram Graph API credentials or network.", err_msg)
            summary["errors"].append(err_msg)
            return summary

        # 2. Process each post sequentially with item and platform isolation
        for post in posts:
            post_id = post.post_id

            # Deduplication check
            if self.store.is_processed(post_id):
                logger.info("[CrossPost Pipeline] Post %s already processed. Skipping duplicate.", post_id)
                continue

            summary["detected"] += 1
            self.store.record_detected(post)

            # Filter non-video posts (static images, carousels)
            if not post.is_video:
                logger.info(
                    "[CrossPost Pipeline] Post %s is '%s', not VIDEO. Skipping video cross-posting.",
                    post_id,
                    post.media_type,
                )
                self.store.record_skipped(
                    instagram_post_id=post_id,
                    media_type=post.media_type,
                    caption=post.caption,
                    media_url=post.media_url,
                )
                summary["skipped"] += 1
                continue

            # Attempt media asset download / validation (graceful if fails)
            try:
                self.detector.download_media(post, target_dir=self.config.media_dir)
            except Exception as dl_err:
                logger.warning(
                    "[CrossPost Pipeline] Media download notice for post %s: %s. Continuing with remote URL.",
                    post_id,
                    dl_err,
                )

            # Fault-isolated YouTube publishing
            yt_res = self._safe_publish(self.youtube_pub, post, "youtube")

            # Fault-isolated TikTok publishing (MUST run even if YouTube failed!)
            tt_res = self._safe_publish(self.tiktok_pub, post, "tiktok")

            # Record aggregated status in database
            self.store.record_results(post, yt_res, tt_res)

            # Evaluate outcome
            if yt_res.is_success and tt_res.is_success:
                summary["published"] += 1
            elif yt_res.is_success or tt_res.is_success:
                summary["partially_published"] += 1
            else:
                summary["failed"] += 1

            summary["items"].append(
                {
                    "post_id": post_id,
                    "caption": post.caption,
                    "media_type": post.media_type,
                    "youtube": yt_res.to_dict(),
                    "tiktok": tt_res.to_dict(),
                }
            )

        return summary

    def _safe_publish(
        self,
        publisher: BaseSocialPublisher,
        post: SocialPost,
        platform_name: str,
    ) -> PlatformResult:
        """
        Safely execute a platform publisher call, catching all exceptions
        to enforce fault isolation.
        """
        try:
            return publisher.publish(post)
        except Exception as exc:
            action_item = (
                "Check YouTube API quota (10,000 units/day) or OAuth tokens."
                if platform_name == "youtube"
                else "Verify TikTok Content Posting API access token and permissions."
            )
            logger.exception(
                "[CrossPost Pipeline] Unexpected failure in %s publisher for post %s: %s. Action: %s",
                platform_name,
                post.post_id,
                exc,
                action_item,
            )
            return PlatformResult(
                platform=platform_name,
                status="FAILED",
                error_message=f"Unhandled {platform_name} publisher exception: {exc}",
                action_item=action_item,
            )

    def run_poll_loop(
        self,
        interval: Optional[int] = None,
        once: bool = False,
        max_cycles: Optional[int] = None,
    ) -> None:
        """
        Continuous polling loop protected by a top-level error shield.
        Never crashes on transient network errors or malformed payloads.
        """
        sleep_sec = interval if interval is not None else self.config.poll_interval
        logger.info(
            "[CrossPost Pipeline] Starting polling worker (interval: %ds, standby_mode: %s)...",
            sleep_sec,
            self.config.standby_mode,
        )

        cycles = 0
        while True:
            try:
                cycles += 1
                logger.info("[CrossPost Pipeline] Running sync cycle #%d...", cycles)
                summary = self.sync_new_posts()
                logger.info(
                    "[CrossPost Pipeline] Cycle #%d finished: detected=%d, published=%d, partial=%d, failed=%d, skipped=%d",
                    cycles,
                    summary["detected"],
                    summary["published"],
                    summary["partially_published"],
                    summary["failed"],
                    summary["skipped"],
                )
            except Exception as loop_err:
                logger.exception(
                    "[CrossPost Pipeline] Top-level daemon shield caught error: %s. Continuing...",
                    loop_err,
                )

            if once or (max_cycles is not None and cycles >= max_cycles):
                break

            time.sleep(sleep_sec)
