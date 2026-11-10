"""
Comprehensive automated test suite for Herbal Harbour Social Media Cross-Posting Pipeline.
Validates:
1. Credential configuration loading and Graceful Standby detection (Rule 6).
2. Instagram post detection triggering corresponding upload calls to YouTube and TikTok.
3. Deduplication and idempotency preventing re-uploading already processed posts.
4. Platform fault isolation (simulated YouTube 403 quota / network error never blocks TikTok).
5. Network failure and transient exception resilience without crashing the service.
6. Non-video post filtering (images/carousels gracefully skipped).
7. Title sanitization (<= 90 chars + #Shorts) and caption formatting.
8. SQLite storage schema, WAL mode, and state auditing.
9. CLI commands (--sync, --status, --dry-run).
"""

from __future__ import annotations

import logging
import os
import sqlite3
import sys
from pathlib import Path

# Ensure repository root is in sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from unittest.mock import MagicMock, patch
import pytest

from crosspost.config import CrosspostConfig, load_config
from crosspost.detector import (
    InstagramAPIError,
    InstagramDetector,
    MockInstagramDetector,
)
from crosspost.models import PlatformResult, PostStatus, SocialPost
from crosspost.pipeline import CrossPostingPipeline
from crosspost.publishers.tiktok import (
    MockTikTokPublisher,
    TikTokPublisher,
    format_tiktok_caption,
)
from crosspost.publishers.youtube import (
    MockYouTubePublisher,
    YouTubePublisher,
    sanitize_youtube_title,
)
from crosspost.storage import CrosspostStore
from crosspost.cli import main as cli_main


@pytest.fixture
def temp_db(tmp_path: Path) -> str:
    """Fixture providing an isolated temporary SQLite database path."""
    db_file = tmp_path / "test_crosspost.db"
    return str(db_file)


@pytest.fixture
def sample_video_post() -> SocialPost:
    return SocialPost(
        post_id="ig_test_reel_001",
        caption="Experience natural Karoo botanical healing! Handcrafted organic CBD oils. #HerbalHarbour #Wellness #Karoo",
        media_url="https://herbalharbour.co.za/assets/video/sample_reel.mp4",
        media_type="VIDEO",
        permalink="https://www.instagram.com/reel/C1234567/",
        timestamp="2026-11-10T12:00:00+00:00",
        tags=["HerbalHarbour", "Wellness", "Karoo"],
    )


@pytest.fixture
def sample_image_post() -> SocialPost:
    return SocialPost(
        post_id="ig_test_img_002",
        caption="Herbal Harbour store front in Beaufort West! #Dispensary #Karoo",
        media_url="https://herbalharbour.co.za/assets/images/store.jpg",
        media_type="IMAGE",
        permalink="https://www.instagram.com/p/C7654321/",
        timestamp="2026-11-10T11:00:00+00:00",
        tags=["Dispensary", "Karoo"],
    )


# ==============================================================================
# 1. Configuration & Standby Detection Tests (Rule 6 Graceful Standby)
# ==============================================================================


def test_config_loading_and_standby_detection(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Verify configuration loads environment variables and detects mock/standby mode."""
    # Clean relevant env vars
    for key in [
        "INSTAGRAM_ACCESS_TOKEN",
        "INSTAGRAM_ACCOUNT_ID",
        "YOUTUBE_CLIENT_ID",
        "YOUTUBE_CLIENT_SECRET",
        "TIKTOK_ACCESS_TOKEN",
        "CROSSPOST_STANDBY_MODE",
    ]:
        monkeypatch.delenv(key, raising=False)

    cfg = load_config(standby_mode="auto", db_path=str(tmp_path / "test.db"))

    # When credentials are missing, standby must be True for all platforms
    assert cfg.is_instagram_standby() is True
    assert cfg.is_youtube_standby() is True
    assert cfg.is_tiktok_standby() is True

    # When explicit mock mode is set
    cfg_mock = load_config(standby_mode="mock")
    assert cfg_mock.is_instagram_standby() is True
    assert cfg_mock.is_youtube_standby() is True
    assert cfg_mock.is_tiktok_standby() is True

    # When placeholder credentials exist (e.g. "MY_KEY" or empty)
    cfg_placeholder = load_config(
        standby_mode="auto",
        instagram_access_token="MY_INSTAGRAM_TOKEN",
        instagram_account_id="placeholder_123",
        youtube_client_id="YOUR_TOKEN_HERE",
        tiktok_access_token="",
    )
    assert cfg_placeholder.is_instagram_standby() is True
    assert cfg_placeholder.is_youtube_standby() is True
    assert cfg_placeholder.is_tiktok_standby() is True

    # When live credentials are provided
    cfg_live = load_config(
        standby_mode="auto",
        instagram_access_token="valid_live_ig_token_abc123",
        instagram_account_id="178414000123456",
        youtube_client_id="valid_yt_client_id_456",
        youtube_client_secret="valid_yt_secret_789",
        tiktok_access_token="valid_tiktok_token_xyz987",
    )
    assert cfg_live.is_instagram_standby() is False
    assert cfg_live.is_youtube_standby() is False
    assert cfg_live.is_tiktok_standby() is False


# ==============================================================================
# 2. Instagram Detection Triggers Upload Calls
# ==============================================================================


def test_instagram_detection_triggers_youtube_and_tiktok_uploads(
    temp_db: str, sample_video_post: SocialPost
) -> None:
    """
    Acceptance Criterion: Detecting a new Instagram post triggers upload calls
    to YouTube and TikTok.
    """
    store = CrosspostStore(db_path=temp_db)
    detector = MockInstagramDetector(custom_posts=[sample_video_post])
    yt_publisher = MockYouTubePublisher()
    tt_publisher = MockTikTokPublisher()

    pipeline = CrossPostingPipeline(
        detector=detector,
        youtube_pub=yt_publisher,
        tiktok_pub=tt_publisher,
        store=store,
    )

    summary = pipeline.sync_new_posts()

    # Verify both uploaders were called with the detected post
    assert len(yt_publisher.published_posts) == 1
    assert yt_publisher.published_posts[0].post_id == sample_video_post.post_id

    assert len(tt_publisher.published_posts) == 1
    assert tt_publisher.published_posts[0].post_id == sample_video_post.post_id

    # Verify summary metrics
    assert summary["detected"] == 1
    assert summary["published"] == 1
    assert summary["failed"] == 0
    assert summary["skipped"] == 0

    # Verify persistence in SQLite store
    record = store.get_record(sample_video_post.post_id)
    assert record is not None
    assert record["status"] == PostStatus.PUBLISHED.value
    assert record["youtube_status"] == "SIMULATED"
    assert record["tiktok_status"] == "SIMULATED"
    assert "yt_sim_" in record["youtube_id"]
    assert "tt_sim_" in record["tiktok_id"]


# ==============================================================================
# 3. Deduplication & Idempotency Tests
# ==============================================================================


def test_idempotency_prevents_duplicate_uploads(
    temp_db: str, sample_video_post: SocialPost
) -> None:
    """
    Verify that an already processed post is not re-uploaded on subsequent sync cycles.
    """
    store = CrosspostStore(db_path=temp_db)
    detector = MockInstagramDetector(custom_posts=[sample_video_post])
    yt_publisher = MockYouTubePublisher()
    tt_publisher = MockTikTokPublisher()

    pipeline = CrossPostingPipeline(
        detector=detector,
        youtube_pub=yt_publisher,
        tiktok_pub=tt_publisher,
        store=store,
    )

    # First sync: processes the post
    res1 = pipeline.sync_new_posts()
    assert res1["detected"] == 1
    assert res1["published"] == 1
    assert len(yt_publisher.published_posts) == 1
    assert len(tt_publisher.published_posts) == 1

    # Second sync: same post detected, must be skipped
    res2 = pipeline.sync_new_posts()
    assert res2["detected"] == 0
    assert res2["published"] == 0
    assert len(yt_publisher.published_posts) == 1  # No additional calls
    assert len(tt_publisher.published_posts) == 1


# ==============================================================================
# 4. Fault Isolation Tests (YouTube failure does not block TikTok)
# ==============================================================================


def test_youtube_failure_does_not_block_tiktok(
    temp_db: str, sample_video_post: SocialPost, caplog: pytest.LogCaptureFixture
) -> None:
    """
    Acceptance Criterion: If YouTube publishing fails (e.g. simulated 403 quota error),
    actionable diagnostics are logged and it does NOT block TikTok publishing.
    """
    caplog.set_level(logging.ERROR)
    store = CrosspostStore(db_path=temp_db)
    detector = MockInstagramDetector(custom_posts=[sample_video_post])

    # Simulate YouTube failure (HTTP 403 quota limit reached)
    yt_publisher = MockYouTubePublisher(
        should_fail=True,
        error_status_code=403,
        error_message="Daily quota exceeded for project 987654321",
    )
    # TikTok publisher succeeds normally
    tt_publisher = MockTikTokPublisher(should_fail=False)

    pipeline = CrossPostingPipeline(
        detector=detector,
        youtube_pub=yt_publisher,
        tiktok_pub=tt_publisher,
        store=store,
    )

    summary = pipeline.sync_new_posts()

    # YouTube failed, but TikTok MUST still be called and succeed
    assert len(yt_publisher.published_posts) == 1
    assert len(tt_publisher.published_posts) == 1
    assert summary["detected"] == 1
    assert summary["partially_published"] == 1
    assert summary["published"] == 0

    # Verify SQLite tracking shows PARTIALLY_PUBLISHED with actionable diagnostics
    record = store.get_record(sample_video_post.post_id)
    assert record is not None
    assert record["status"] == PostStatus.PARTIALLY_PUBLISHED.value
    assert record["youtube_status"] == "FAILED"
    assert "403" in record["youtube_error"]
    assert record["tiktok_status"] == "SIMULATED"
    assert record["tiktok_id"] is not None

    # Verify actionable logging appeared
    assert any("Action:" in record_text.message for record_text in caplog.records)


def test_tiktok_failure_does_not_block_youtube(
    temp_db: str, sample_video_post: SocialPost
) -> None:
    """
    Verify symmetrical fault isolation: TikTok failure does not invalidate YouTube success.
    """
    store = CrosspostStore(db_path=temp_db)
    detector = MockInstagramDetector(custom_posts=[sample_video_post])

    yt_publisher = MockYouTubePublisher(should_fail=False)
    tt_publisher = MockTikTokPublisher(
        should_fail=True,
        error_status_code=500,
        error_message="TikTok server temporary outage",
    )

    pipeline = CrossPostingPipeline(
        detector=detector,
        youtube_pub=yt_publisher,
        tiktok_pub=tt_publisher,
        store=store,
    )

    summary = pipeline.sync_new_posts()

    assert summary["partially_published"] == 1
    record = store.get_record(sample_video_post.post_id)
    assert record is not None
    assert record["status"] == PostStatus.PARTIALLY_PUBLISHED.value
    assert record["youtube_status"] == "SIMULATED"
    assert record["tiktok_status"] == "FAILED"


def test_unhandled_publisher_exception_handled_gracefully(
    temp_db: str, sample_video_post: SocialPost
) -> None:
    """
    Verify that if a publisher throws an unexpected unhandled exception,
    the pipeline catches it via the fault isolation layer without crashing.
    """
    store = CrosspostStore(db_path=temp_db)
    detector = MockInstagramDetector(custom_posts=[sample_video_post])

    # Publisher that raises a raw runtime exception
    broken_yt = MagicMock()
    broken_yt.publish.side_effect = RuntimeError("Low-level socket reset by peer")
    broken_yt.platform_name = "youtube"

    working_tt = MockTikTokPublisher()

    pipeline = CrossPostingPipeline(
        detector=detector,
        youtube_pub=broken_yt,
        tiktok_pub=working_tt,
        store=store,
    )

    summary = pipeline.sync_new_posts()
    assert summary["detected"] == 1
    assert summary["partially_published"] == 1
    assert len(working_tt.published_posts) == 1

    record = store.get_record(sample_video_post.post_id)
    assert record["youtube_status"] == "FAILED"
    assert "socket reset" in record["youtube_error"]


# ==============================================================================
# 5. Network Failure & Exception Handling Without Crash
# ==============================================================================


def test_detector_network_failure_handled_without_crash(temp_db: str) -> None:
    """
    Acceptance Criterion: Failed cross-posting operations log actionable error
    messages without crashing the service.
    """
    store = CrosspostStore(db_path=temp_db)
    # Simulate DNS failure or timeout connecting to Instagram Graph API
    detector = MockInstagramDetector(
        should_raise=InstagramAPIError("Failed to resolve graph.facebook.com: [Errno -3] Temporary failure in name resolution")
    )
    yt_publisher = MockYouTubePublisher()
    tt_publisher = MockTikTokPublisher()

    pipeline = CrossPostingPipeline(
        detector=detector,
        youtube_pub=yt_publisher,
        tiktok_pub=tt_publisher,
        store=store,
    )

    summary = pipeline.sync_new_posts()

    # The pipeline should cleanly handle the network error, populate errors, and return
    assert len(summary["errors"]) == 1
    assert "Failed to resolve graph.facebook.com" in summary["errors"][0]
    assert summary["detected"] == 0
    assert len(yt_publisher.published_posts) == 0
    assert len(tt_publisher.published_posts) == 0


def test_poll_loop_daemon_shield(temp_db: str) -> None:
    """Verify continuous polling loop survives sync cycle errors when once=True."""
    store = CrosspostStore(db_path=temp_db)
    detector = MockInstagramDetector(
        should_raise=RuntimeError("Simulated intermittent connection drop")
    )
    pipeline = CrossPostingPipeline(detector=detector, store=store)

    # Calling run_poll_loop with once=True must not crash despite error
    pipeline.run_poll_loop(once=True)


# ==============================================================================
# 6. Non-Video Post Filtering Tests
# ==============================================================================


def test_non_video_posts_skipped_gracefully(
    temp_db: str, sample_video_post: SocialPost, sample_image_post: SocialPost
) -> None:
    """
    Verify that static images and carousels are logged and recorded as
    SKIPPED_NOT_A_VIDEO without triggering YouTube or TikTok publishing.
    """
    store = CrosspostStore(db_path=temp_db)
    # Detector returns both an image and a video
    detector = MockInstagramDetector(
        custom_posts=[sample_image_post, sample_video_post]
    )
    yt_publisher = MockYouTubePublisher()
    tt_publisher = MockTikTokPublisher()

    pipeline = CrossPostingPipeline(
        detector=detector,
        youtube_pub=yt_publisher,
        tiktok_pub=tt_publisher,
        store=store,
    )

    summary = pipeline.sync_new_posts()

    assert summary["detected"] == 2
    assert summary["skipped"] == 1
    assert summary["published"] == 1

    # Image was skipped in database
    img_rec = store.get_record(sample_image_post.post_id)
    assert img_rec is not None
    assert img_rec["status"] == PostStatus.SKIPPED_NOT_A_VIDEO.value
    assert img_rec["youtube_status"] == "SKIPPED"
    assert img_rec["tiktok_status"] == "SKIPPED"

    # Video was published
    vid_rec = store.get_record(sample_video_post.post_id)
    assert vid_rec["status"] == PostStatus.PUBLISHED.value

    # Publishers only received the video post
    assert len(yt_publisher.published_posts) == 1
    assert yt_publisher.published_posts[0].post_id == sample_video_post.post_id


# ==============================================================================
# 7. Title Sanitization & Caption Formatting Tests
# ==============================================================================


def test_youtube_title_sanitization() -> None:
    """Verify YouTube title truncation to <= 90 chars + ' #Shorts' (total <= 100)."""
    # Short caption
    short_cap = "Discover Karoo Botanicals!"
    title1 = sanitize_youtube_title(short_cap)
    assert title1 == "Discover Karoo Botanicals! #Shorts"
    assert len(title1) <= 100

    # Very long paragraph
    long_cap = (
        "Herbal Harbour is thrilled to announce our newly expanded medicinal cannabis "
        "and botanical dispensary line featuring organic tinctures, full-spectrum extracts, "
        "and therapeutic topicals sourced directly from the pristine Great Karoo."
    )
    title2 = sanitize_youtube_title(long_cap, max_base_length=90)
    assert title2.endswith(" #Shorts")
    assert len(title2) <= 100
    assert not title2.startswith(" ")

    # Caption that already has #Shorts
    already_tagged = "Quick wellness tip for today #Shorts"
    title3 = sanitize_youtube_title(already_tagged)
    assert title3.count("#Shorts") + title3.count("#shorts") == 1

    # Empty caption fallback
    title4 = sanitize_youtube_title("")
    assert title4 == "Herbal Harbour Wellness #Shorts"


def test_tiktok_caption_formatting() -> None:
    """Verify TikTok caption formatting within 500 characters with brand tags."""
    cap = "Pure organic CBD oil made with Karoo sunshine."
    tags = ["cbd", "organic", "wellness"]
    formatted = format_tiktok_caption(cap, tags, max_length=500)

    assert "Pure organic CBD oil" in formatted
    assert "#herbalharbour" in formatted
    assert "#karoo" in formatted
    assert len(formatted) <= 500


# ==============================================================================
# 8. Storage, WAL Mode & Aggregation Stats Tests
# ==============================================================================


def test_storage_wal_mode_and_stats(temp_db: str, sample_video_post: SocialPost) -> None:
    """Verify SQLite WAL mode, record queries, and stats calculation."""
    store = CrosspostStore(db_path=temp_db)

    # Check WAL mode
    with sqlite3.connect(temp_db) as conn:
        cur = conn.execute("PRAGMA journal_mode;")
        row = cur.fetchone()
        assert row[0].lower() == "wal"

    # Initial stats should be 0
    stats = store.get_stats()
    assert stats["TOTAL"] == 0

    # Record detection
    store.record_detected(sample_video_post)
    assert store.get_record(sample_video_post.post_id) is not None

    # Record publication results
    yt_res = PlatformResult(platform="youtube", status="SUCCESS", published_id="yt_123")
    tt_res = PlatformResult(platform="tiktok", status="SUCCESS", published_id="tt_456")
    store.record_results(sample_video_post, yt_res, tt_res)

    updated_stats = store.get_stats()
    assert updated_stats["TOTAL"] == 1
    assert updated_stats[PostStatus.PUBLISHED.value] == 1


# ==============================================================================
# 9. CLI Runner Tests
# ==============================================================================


def test_cli_dry_run_and_status(temp_db: str, capsys: pytest.CaptureFixture) -> None:
    """Test CLI commands --dry-run and --status."""
    # Test --dry-run
    exit_code = cli_main(["--dry-run", "--db-path", temp_db, "--limit", "1"])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert "detected" in captured.out or "items" in captured.out

    # Test --status
    exit_code_status = cli_main(["--status", "--db-path", temp_db])
    assert exit_code_status == 0
    captured_status = capsys.readouterr()
    assert "Herbal Harbour Social Cross-Posting Status Audit" in captured_status.out
    assert "Total Processed:" in captured_status.out
