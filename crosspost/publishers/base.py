"""
Abstract base class for social media publishers.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from ..models import PlatformResult, SocialPost


class BaseSocialPublisher(ABC):
    """Abstract interface for social media platform publishers."""

    @property
    @abstractmethod
    def platform_name(self) -> str:
        """Name of the platform (e.g. 'youtube', 'tiktok')."""
        pass

    @property
    @abstractmethod
    def is_standby(self) -> bool:
        """Indicates whether publisher is currently operating in Rule 6 Standby/Mock mode."""
        pass

    @abstractmethod
    def publish(self, post: SocialPost) -> PlatformResult:
        """Publish a post to the target platform."""
        pass
