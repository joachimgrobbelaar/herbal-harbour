"""
Data models and status enumerations for Herbal Harbour cross-posting pipeline.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


class PostStatus(str, Enum):
    DETECTED = "DETECTED"
    PROCESSING = "PROCESSING"
    PUBLISHED = "PUBLISHED"
    PARTIALLY_PUBLISHED = "PARTIALLY_PUBLISHED"
    FAILED = "FAILED"
    SKIPPED_NOT_A_VIDEO = "SKIPPED_NOT_A_VIDEO"


@dataclass
class SocialPost:
    post_id: str
    caption: str
    media_url: str
    media_type: str  # "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM"
    permalink: str
    timestamp: str
    local_video_path: Optional[str] = None
    tags: List[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.tags and self.caption:
            # Auto-extract hashtags without the leading '#'
            found = re.findall(r"#(\w+)", self.caption)
            if found:
                self.tags = list(dict.fromkeys(found))  # Preserve order, unique

    @property
    def is_video(self) -> bool:
        return self.media_type.strip().upper() == "VIDEO"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "post_id": self.post_id,
            "caption": self.caption,
            "media_url": self.media_url,
            "media_type": self.media_type,
            "permalink": self.permalink,
            "timestamp": self.timestamp,
            "local_video_path": self.local_video_path,
            "tags": self.tags,
            "is_video": self.is_video,
        }


@dataclass
class PlatformResult:
    platform: str  # "youtube" | "tiktok"
    status: str  # "SUCCESS" | "FAILED" | "SIMULATED"
    published_id: Optional[str] = None
    url: Optional[str] = None
    error_message: Optional[str] = None
    action_item: Optional[str] = None
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    @property
    def is_success(self) -> bool:
        return self.status.upper() in ("SUCCESS", "SIMULATED")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "platform": self.platform,
            "status": self.status,
            "published_id": self.published_id,
            "url": self.url,
            "error_message": self.error_message,
            "action_item": self.action_item,
            "timestamp": self.timestamp,
            "is_success": self.is_success,
        }
