"""
SQLite storage and state store for Herbal Harbour cross-posting pipeline.
Provides deduplication, idempotency tracking, and platform status auditing.
"""

from __future__ import annotations

import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .models import PlatformResult, PostStatus, SocialPost

logger = logging.getLogger(__name__)


class CrosspostStore:
    def __init__(self, db_path: str = "data/crosspost.db"):
        self.db_path = db_path
        self._ensure_dir()
        self._init_db()

    def _ensure_dir(self) -> None:
        """Ensure parent directory for SQLite database exists."""
        p = Path(self.db_path)
        if p.parent and not p.parent.exists():
            p.parent.mkdir(parents=True, exist_ok=True)

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn

    def _init_db(self) -> None:
        """Initialize the crosspost_records schema."""
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS crosspost_records (
                    instagram_post_id TEXT PRIMARY KEY,
                    caption TEXT,
                    media_url TEXT,
                    media_type TEXT,
                    status TEXT,
                    youtube_status TEXT,
                    youtube_id TEXT,
                    youtube_error TEXT,
                    tiktok_status TEXT,
                    tiktok_id TEXT,
                    tiktok_error TEXT,
                    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            conn.commit()

    def is_processed(self, instagram_post_id: str) -> bool:
        """
        Check if a post has already been processed successfully, partially published,
        or deliberately skipped (e.g. image).
        """
        with self._get_connection() as conn:
            cur = conn.execute(
                "SELECT status FROM crosspost_records WHERE instagram_post_id = ?",
                (instagram_post_id,),
            )
            row = cur.fetchone()
            if not row:
                return False
            status = row["status"]
            return status in (
                PostStatus.PUBLISHED.value,
                PostStatus.PARTIALLY_PUBLISHED.value,
                PostStatus.SKIPPED_NOT_A_VIDEO.value,
            )

    def record_detected(self, post: SocialPost) -> None:
        """Record initial detection of an Instagram post."""
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT OR IGNORE INTO crosspost_records (
                    instagram_post_id, caption, media_url, media_type, status,
                    detected_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    post.post_id,
                    post.caption,
                    post.media_url,
                    post.media_type,
                    PostStatus.DETECTED.value,
                    now,
                    now,
                ),
            )
            conn.commit()

    def record_skipped(
        self,
        instagram_post_id: str,
        media_type: str,
        reason: str = "Not a video",
        caption: str = "",
        media_url: str = "",
    ) -> None:
        """Mark a post as skipped (e.g., static image or carousel)."""
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO crosspost_records (
                    instagram_post_id, caption, media_url, media_type, status,
                    youtube_status, tiktok_status, detected_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, 'SKIPPED', 'SKIPPED', ?, ?)
                ON CONFLICT(instagram_post_id) DO UPDATE SET
                    status = excluded.status,
                    media_type = excluded.media_type,
                    youtube_status = 'SKIPPED',
                    tiktok_status = 'SKIPPED',
                    updated_at = excluded.updated_at;
                """,
                (
                    instagram_post_id,
                    caption,
                    media_url,
                    media_type,
                    PostStatus.SKIPPED_NOT_A_VIDEO.value,
                    now,
                    now,
                ),
            )
            conn.commit()

    def record_results(
        self,
        post: SocialPost,
        youtube_res: PlatformResult,
        tiktok_res: PlatformResult,
    ) -> None:
        """
        Record the upload results for YouTube and TikTok.
        Computes overall status with platform fault isolation.
        """
        now = datetime.now(timezone.utc).isoformat()

        yt_ok = youtube_res.is_success
        tt_ok = tiktok_res.is_success

        if yt_ok and tt_ok:
            overall_status = PostStatus.PUBLISHED.value
        elif yt_ok or tt_ok:
            overall_status = PostStatus.PARTIALLY_PUBLISHED.value
        else:
            overall_status = PostStatus.FAILED.value

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO crosspost_records (
                    instagram_post_id, caption, media_url, media_type, status,
                    youtube_status, youtube_id, youtube_error,
                    tiktok_status, tiktok_id, tiktok_error,
                    detected_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(instagram_post_id) DO UPDATE SET
                    caption = excluded.caption,
                    media_url = excluded.media_url,
                    media_type = excluded.media_type,
                    status = excluded.status,
                    youtube_status = excluded.youtube_status,
                    youtube_id = excluded.youtube_id,
                    youtube_error = excluded.youtube_error,
                    tiktok_status = excluded.tiktok_status,
                    tiktok_id = excluded.tiktok_id,
                    tiktok_error = excluded.tiktok_error,
                    updated_at = excluded.updated_at;
                """,
                (
                    post.post_id,
                    post.caption,
                    post.media_url,
                    post.media_type,
                    overall_status,
                    youtube_res.status,
                    youtube_res.published_id,
                    youtube_res.error_message,
                    tiktok_res.status,
                    tiktok_res.published_id,
                    tiktok_res.error_message,
                    now,
                    now,
                ),
            )
            conn.commit()

    def get_record(self, instagram_post_id: str) -> Optional[Dict[str, Any]]:
        """Fetch record by Instagram post ID."""
        with self._get_connection() as conn:
            cur = conn.execute(
                "SELECT * FROM crosspost_records WHERE instagram_post_id = ?",
                (instagram_post_id,),
            )
            row = cur.fetchone()
            if row:
                return dict(row)
            return None

    def list_records(
        self, limit: int = 50, status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List recent records, optionally filtered by status."""
        query = "SELECT * FROM crosspost_records"
        params: List[Any] = []
        if status:
            query += " WHERE status = ?"
            params.append(status)
        query += " ORDER BY detected_at DESC LIMIT ?"
        params.append(limit)

        with self._get_connection() as conn:
            cur = conn.execute(query, params)
            return [dict(row) for row in cur.fetchall()]

    def get_stats(self) -> Dict[str, int]:
        """Aggregate counts by status."""
        with self._get_connection() as conn:
            cur = conn.execute(
                "SELECT status, COUNT(*) as count FROM crosspost_records GROUP BY status"
            )
            stats = {
                "TOTAL": 0,
                PostStatus.PUBLISHED.value: 0,
                PostStatus.PARTIALLY_PUBLISHED.value: 0,
                PostStatus.FAILED.value: 0,
                PostStatus.SKIPPED_NOT_A_VIDEO.value: 0,
                PostStatus.DETECTED.value: 0,
            }
            total = 0
            for row in cur.fetchall():
                st = row["status"]
                cnt = row["count"]
                stats[st] = cnt
                total += cnt
            stats["TOTAL"] = total
            return stats
