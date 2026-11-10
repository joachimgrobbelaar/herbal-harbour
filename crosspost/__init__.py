"""
Herbal Harbour Social Media Cross-Posting Package.
Connects Instagram Reels to YouTube Shorts and TikTok Content Posting API v2
with Rule 6 Graceful Standby and platform fault isolation.
"""

from .config import CrosspostConfig, load_config
from .detector import InstagramAPIError, InstagramDetector, MockInstagramDetector
from .models import PlatformResult, PostStatus, SocialPost
from .pipeline import CrossPostingPipeline
from .publishers import (
    BaseSocialPublisher,
    MockTikTokPublisher,
    MockYouTubePublisher,
    TikTokPublisher,
    YouTubePublisher,
    format_tiktok_caption,
    sanitize_youtube_title,
)
from .storage import CrosspostStore

__version__ = "1.0.0"

__all__ = [
    "CrosspostConfig",
    "load_config",
    "PostStatus",
    "SocialPost",
    "PlatformResult",
    "CrosspostStore",
    "InstagramDetector",
    "MockInstagramDetector",
    "InstagramAPIError",
    "BaseSocialPublisher",
    "YouTubePublisher",
    "MockYouTubePublisher",
    "sanitize_youtube_title",
    "TikTokPublisher",
    "MockTikTokPublisher",
    "format_tiktok_caption",
    "CrossPostingPipeline",
]
