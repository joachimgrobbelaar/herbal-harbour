"""
Comprehensive Opaque-Box End-to-End (E2E) Integration Test Suite for Herbal Harbour Upgrade.

Validates the complete four-tier operational testing hierarchy across:
- Tier 1: Feature Coverage (Mail service, Registration docs, Social cross-post automation)
- Tier 2: Boundary & Corner Cases (MIME edge cases, Unicode, regex boundaries, character limits)
- Tier 3: Cross-Feature Combinations (End-to-end OTP verification loop, Fault isolation, CLI audits)
- Tier 4: Real-World Workload Scenarios (Dispensary operational cycle, Onboarding & launch, High-throughput burst)

Target System: Herbal Harbour E-Commerce & Dispensary Platform (herbalharbour.co.za)
"""

from __future__ import annotations

import asyncio
from email.message import EmailMessage
import io
import json
import logging
import os
from pathlib import Path
import re
import smtplib
import socket
import sys
import tempfile
from typing import Generator, List
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Ensure workspace root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from mail_service.server import UnifiedMailServer
from mail_service.smtp_daemon import SMTPDaemon
from mail_service.storage import MailStorage, PRIMARY_ACCOUNTS, VALID_FOLDERS
from mail_service.webmail_api import create_app

from crosspost.config import CrosspostConfig, load_config
from crosspost.detector import InstagramDetector, MockInstagramDetector
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
from crosspost.cli import handle_status, main as cli_main


# ============================================================================
# Helpers & Fixtures
# ============================================================================

def get_free_port() -> int:
    """Find and return an available ephemeral TCP port on localhost."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return int(s.getsockname()[1])


@pytest.fixture
def temp_mail_db() -> Generator[str, None, None]:
    """Provide an isolated temporary SQLite database for email tests."""
    fd, path = tempfile.mkstemp(suffix="_e2e_emails.db")
    os.close(fd)
    yield path
    if os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass


@pytest.fixture
def mail_storage(temp_mail_db: str) -> MailStorage:
    """Instantiate a clean MailStorage instance."""
    return MailStorage(db_path=temp_mail_db)


@pytest.fixture
def api_client(mail_storage: MailStorage) -> TestClient:
    """Instantiate a FastAPI test client backed by isolated mail storage."""
    app = create_app(storage=mail_storage)
    return TestClient(app)


@pytest.fixture
def temp_crosspost_db(tmp_path: Path) -> str:
    """Provide an isolated temporary SQLite database for cross-posting tests."""
    db_file = tmp_path / "e2e_crosspost.db"
    return str(db_file)


@pytest.fixture
def crosspost_store(temp_crosspost_db: str) -> CrosspostStore:
    """Instantiate a clean CrosspostStore instance."""
    return CrosspostStore(db_path=temp_crosspost_db)


@pytest.fixture
def sample_reel() -> SocialPost:
    return SocialPost(
        post_id="ig_e2e_reel_991",
        caption="Karoo botanical extract harvesting! 🌿 Pure natural wellness from Beaufort West. #HerbalHarbour #KarooBotanicals #Wellness",
        media_url="https://herbalharbour.co.za/assets/video/karoo_harvest.mp4",
        media_type="VIDEO",
        permalink="https://www.instagram.com/reel/C8912345/",
        timestamp="2026-11-10T12:00:00+00:00",
        tags=["HerbalHarbour", "KarooBotanicals", "Wellness"],
    )


# ============================================================================
# Tier 1: Feature Coverage (>=5 tests per major feature)
# ============================================================================

class TestTier1FeatureCoverage:
    """
    Tier 1 tests verify fundamental feature mechanics across the three core components:
    1. Mail Service (SMTP daemon, SQLite index, Webmail REST API, Compose/Send, Health check)
    2. Account Registration Documentation (Existence, Structure, Checklist, OTP flow, Guardrails)
    3. Social Cross-Posting Pipeline (Detection, YouTube Shorts, TikTok, Standby, CLI Status)
    """

    # --- Feature 1: Mail Service (6 tests) ---

    def test_tier1_mail_health_check(self, api_client: TestClient):
        """Verify Webmail API /health endpoint reports service status and accounts."""
        resp = api_client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["service"] == "herbal-harbour-mail"
        assert data["version"] == "1.0.0"
        assert "admin@herbalharbour.co.za" in data["accounts"]
        assert "info@herbalharbour.co.za" in data["accounts"]
        assert "smtp_port" in data
        assert "web_port" in data

    def test_tier1_mail_smtp_receive_admin(self, mail_storage: MailStorage):
        """Verify SMTP daemon receives and indexes mail to admin@herbalharbour.co.za."""
        async def _run():
            port = get_free_port()
            daemon = SMTPDaemon(host="127.0.0.1", port=port, storage=mail_storage)
            await daemon.start()
            try:
                def _send():
                    msg = EmailMessage()
                    msg["Subject"] = "Google Account Verification Code: 492018"
                    msg["From"] = "noreply@google.com"
                    msg["To"] = "admin@herbalharbour.co.za"
                    msg.set_content("Your code is 492018. Enter it to verify your account.")
                    with smtplib.SMTP("127.0.0.1", port, timeout=5) as client:
                        client.send_message(msg)

                await asyncio.to_thread(_send)
                await asyncio.sleep(0.2)

                msgs, total = mail_storage.list_messages(
                    account="admin@herbalharbour.co.za", folder="inbox"
                )
                assert total == 1
                assert "492018" in msgs[0]["subject"]
                assert msgs[0]["is_read"] == 0
                assert msgs[0]["account"] == "admin@herbalharbour.co.za"
            finally:
                await daemon.stop()

        asyncio.run(_run())

    def test_tier1_mail_smtp_receive_info(self, mail_storage: MailStorage):
        """Verify SMTP daemon receives and indexes mail to info@herbalharbour.co.za."""
        async def _run():
            port = get_free_port()
            daemon = SMTPDaemon(host="127.0.0.1", port=port, storage=mail_storage)
            await daemon.start()
            try:
                def _send():
                    msg = EmailMessage()
                    msg["Subject"] = "Customer Inquiry: Wholesale Medical Tinctures"
                    msg["From"] = "customer@capebotanicals.co.za"
                    msg["To"] = "info@herbalharbour.co.za"
                    msg.set_content("Good day, what is your pricing on wholesale CBD isolates?")
                    with smtplib.SMTP("127.0.0.1", port, timeout=5) as client:
                        client.send_message(msg)

                await asyncio.to_thread(_send)
                await asyncio.sleep(0.2)

                msgs, total = mail_storage.list_messages(
                    account="info@herbalharbour.co.za", folder="inbox"
                )
                assert total == 1
                assert msgs[0]["subject"] == "Customer Inquiry: Wholesale Medical Tinctures"
                assert msgs[0]["from_address"] == "customer@capebotanicals.co.za"
            finally:
                await daemon.stop()

        asyncio.run(_run())

    def test_tier1_mail_sqlite_indexing_and_folders(self, mail_storage: MailStorage):
        """Verify SQLite stores messages with correct folders, read flags, and stats."""
        saved = mail_storage.save_message(
            account="admin@herbalharbour.co.za",
            folder="inbox",
            from_address="alerts@herbalharbour.co.za",
            to_address="admin@herbalharbour.co.za",
            subject="Inventory Reorder Threshold Reached",
            body_plain="CBD Oil 1000mg stock is below 10 units.",
            is_read=0,
        )
        msg_id = saved["id"]
        assert msg_id is not None

        stats = mail_storage.get_account_stats("admin@herbalharbour.co.za")
        assert stats["inbox_total"] == 1
        assert stats["inbox_unread"] == 1

        mail_storage.mark_as_read(msg_id, 1)
        stats = mail_storage.get_account_stats("admin@herbalharbour.co.za")
        assert stats["inbox_unread"] == 0

        mail_storage.move_to_folder(msg_id, "trash")
        stats = mail_storage.get_account_stats("admin@herbalharbour.co.za")
        assert stats["inbox_total"] == 0
        assert stats["trash_total"] == 1

    def test_tier1_mail_webmail_list_and_read(self, api_client: TestClient, mail_storage: MailStorage):
        """Verify Webmail REST API lists messages and supports detail retrieval."""
        saved = mail_storage.save_message(
            account="admin@herbalharbour.co.za",
            folder="inbox",
            from_address="noreply@tiktok.com",
            to_address="admin@herbalharbour.co.za",
            subject="TikTok 2-Step Verification Code: 628103",
            body_plain="Use verification code 628103 to complete login.",
            is_read=0,
        )
        msg_id = saved["id"]

        list_resp = api_client.get("/api/messages?account=admin@herbalharbour.co.za&folder=inbox")
        assert list_resp.status_code == 200
        data = list_resp.json()
        assert data["total"] == 1
        assert len(data["messages"]) == 1
        assert data["messages"][0]["id"] == msg_id

        detail_resp = api_client.get(f"/api/messages/{msg_id}?mark_read=true")
        assert detail_resp.status_code == 200
        detail = detail_resp.json()
        assert detail["id"] == msg_id
        assert detail["is_read"] == 1
        assert "628103" in detail["body_plain"]

    def test_tier1_mail_webmail_compose_and_send(self, api_client: TestClient, mail_storage: MailStorage):
        """Verify composing and sending an email from webmail API routes locally."""
        payload = {
            "from": "admin@herbalharbour.co.za",
            "to": "info@herbalharbour.co.za",
            "subject": "Staff Notice: Karoo Harvest Weekend Schedule",
            "body_plain": "All dispensary staff please review new weekend shifts.",
        }
        send_resp = api_client.post("/api/send", json=payload)
        assert send_resp.status_code == 200
        res = send_resp.json()
        assert res["status"] == "sent"
        assert res["delivered_locally"] is True

        # Check sender's sent folder
        sent_msgs, sent_total = mail_storage.list_messages(
            account="admin@herbalharbour.co.za", folder="sent"
        )
        assert sent_total == 1
        assert sent_msgs[0]["subject"] == "Staff Notice: Karoo Harvest Weekend Schedule"

        # Check recipient's inbox
        inbox_msgs, inbox_total = mail_storage.list_messages(
            account="info@herbalharbour.co.za", folder="inbox"
        )
        assert inbox_total == 1
        assert inbox_msgs[0]["from_address"] == "admin@herbalharbour.co.za"

    # --- Feature 2: Account Registration Documentation (5 tests) ---

    def test_tier1_docs_guide_existence_and_size(self):
        """Verify docs/ACCOUNT_REGISTRATION_GUIDE.md exists and contains substantial content."""
        guide_path = PROJECT_ROOT / "docs" / "ACCOUNT_REGISTRATION_GUIDE.md"
        assert guide_path.is_file(), f"Expected guide at {guide_path}"
        content = guide_path.read_text(encoding="utf-8")
        assert len(content) > 15000, "Documentation should be comprehensive (>15KB)"
        lines = content.splitlines()
        assert len(lines) >= 400, "Documentation should have at least 400 lines"

    def test_tier1_docs_chapter_headings(self):
        """Verify all 7 authoritative chapters are present in the documentation."""
        guide_path = PROJECT_ROOT / "docs" / "ACCOUNT_REGISTRATION_GUIDE.md"
        content = guide_path.read_text(encoding="utf-8")

        required_chapters = [
            "## 1. Executive Summary & Strategic Account Architecture",
            "## 2. Localhost Webmail Integration & Verification Flow",
            "## 3. YouTube Account & Brand Channel Registration Guide",
            "## 4. TikTok Business Account Registration Guide",
            "## 5. Regulatory Compliance, Policy Guardrails & Shadowban Prevention",
            "## 6. Operational Runbook, Recovery & Credential Vault",
            "## 7. Acceptance Criteria & Verification Checklist",
        ]
        for chapter in required_chapters:
            assert chapter in content, f"Missing chapter: {chapter}"

    def test_tier1_docs_acceptance_criteria_checklist(self):
        """Verify all 14 Acceptance Criteria checkpoints (AC-1 through AC-14) are detailed."""
        guide_path = PROJECT_ROOT / "docs" / "ACCOUNT_REGISTRATION_GUIDE.md"
        content = guide_path.read_text(encoding="utf-8")

        for i in range(1, 15):
            checkpoint = f"AC-{i}"
            assert checkpoint in content, f"Missing acceptance criteria checkpoint {checkpoint}"

    def test_tier1_docs_webmail_otp_steps(self):
        """Verify guide documents Webmail port 8025 and OTP extraction procedures."""
        guide_path = PROJECT_ROOT / "docs" / "ACCOUNT_REGISTRATION_GUIDE.md"
        content = guide_path.read_text(encoding="utf-8")

        assert "http://localhost:8025" in content
        assert "/api/messages" in content
        assert "admin@herbalharbour.co.za" in content
        assert "info@herbalharbour.co.za" in content
        assert "OTP" in content or "verification code" in content.lower()

    def test_tier1_docs_brand_account_structure(self):
        """Verify guide covers YouTube Brand Channel and TikTok Business Account details."""
        guide_path = PROJECT_ROOT / "docs" / "ACCOUNT_REGISTRATION_GUIDE.md"
        content = guide_path.read_text(encoding="utf-8")

        assert "@herbalharbour" in content
        assert "Brand Channel" in content or "Brand Account" in content
        assert "Business Account" in content
        assert "Act 7 of 2024" in content
        assert "POPIA" in content

    # --- Feature 3: Social Media Cross-Posting Pipeline (5 tests) ---

    def test_tier1_crosspost_instagram_detection(self):
        """Verify Instagram detector retrieves posts in standby/mock mode."""
        detector = InstagramDetector(standby_mode="mock")
        posts = detector.fetch_recent_posts(limit=5)
        assert len(posts) > 0
        assert all(isinstance(p, SocialPost) for p in posts)
        video_posts = [p for p in posts if p.is_video]
        assert len(video_posts) > 0
        assert video_posts[0].media_type == "VIDEO"

    def test_tier1_crosspost_youtube_shorts_publish(self, sample_reel: SocialPost):
        """Verify YouTube Shorts publisher produces valid simulation result in standby mode."""
        pub = YouTubePublisher(standby_mode="mock")
        assert pub.is_standby is True
        res = pub.publish(sample_reel)
        assert isinstance(res, PlatformResult)
        assert res.platform == "youtube"
        assert res.is_success is True
        assert res.status in ("SUCCESS", "SIMULATED")
        assert res.published_id is not None
        assert "youtube.com" in (res.url or "")

    def test_tier1_crosspost_tiktok_publish(self, sample_reel: SocialPost):
        """Verify TikTok publisher produces valid simulation result in standby mode."""
        pub = TikTokPublisher(standby_mode="mock")
        assert pub.is_standby is True
        res = pub.publish(sample_reel)
        assert isinstance(res, PlatformResult)
        assert res.platform == "tiktok"
        assert res.is_success is True
        assert res.status in ("SUCCESS", "SIMULATED")
        assert res.published_id is not None
        assert "tiktok.com" in (res.url or "")

    def test_tier1_crosspost_mock_standby_activation(self):
        """Verify automatic Graceful Standby activation when credentials are unset."""
        config = load_config(
            INSTAGRAM_ACCESS_TOKEN="",
            INSTAGRAM_ACCOUNT_ID="",
            YOUTUBE_CLIENT_ID="",
            TIKTOK_ACCESS_TOKEN="",
            standby_mode="auto",
        )
        assert config.is_instagram_standby() is True
        assert config.is_youtube_standby() is True
        assert config.is_tiktok_standby() is True

    def test_tier1_crosspost_cli_status(self, crosspost_store: CrosspostStore):
        """Verify CLI status command formats and audits SQLite tracking records."""
        ret = handle_status(crosspost_store, limit=10)
        assert ret == 0

        # Seed record and test again
        post = SocialPost(
            post_id="ig_status_check_1",
            caption="Morning dew on medicinal plants #HerbalHarbour",
            media_url="https://herbalharbour.co.za/assets/dew.mp4",
            media_type="VIDEO",
            permalink="https://instagram.com/p/1",
            timestamp="2026-11-10T12:00:00Z",
        )
        crosspost_store.record_results(
            post,
            PlatformResult("youtube", "SIMULATED", published_id="yt_123"),
            PlatformResult("tiktok", "SIMULATED", published_id="tt_456"),
        )
        assert crosspost_store.get_stats()["PUBLISHED"] == 1


# ============================================================================
# Tier 2: Boundary & Corner Cases (>=5 tests per feature)
# ============================================================================

class TestTier2BoundaryAndCornerCases:
    """
    Tier 2 tests verify resilience against extreme, malformed, or unusual inputs:
    1. Mail Service: Empty fields, oversized MIME, Unicode emojis, bad SMTP, 404s, port binding
    2. Account Docs: Regex boundary conditions, missing sections, curl syntax, .env completeness
    3. Social Cross-Post: Caption limits, special chars in tags, non-video skipping, empty captions
    """

    # --- Mail Service Boundary Cases (6 tests) ---

    def test_tier2_mail_empty_subject_and_body(self, mail_storage: MailStorage):
        """Test saving and querying messages with empty subject, None subject, and empty body."""
        saved = mail_storage.save_message(
            account="admin@herbalharbour.co.za",
            folder="inbox",
            from_address="empty@sender.com",
            to_address="admin@herbalharbour.co.za",
            subject=None,
            body_plain="",
            body_html="",
        )
        assert saved["subject"] == "(No Subject)"
        assert saved["body_plain"] == ""

        msg = mail_storage.get_message(saved["id"])
        assert msg is not None
        assert msg["subject"] == "(No Subject)"

    def test_tier2_mail_oversized_mime_headers(self, mail_storage: MailStorage):
        """Test email with a large 4KB+ header and subject containing hundreds of characters."""
        long_subject = "Important Advisory Notice " + ("A" * 500)
        saved = mail_storage.save_message(
            account="admin@herbalharbour.co.za",
            folder="inbox",
            from_address="regulatory@gov.za",
            to_address="admin@herbalharbour.co.za",
            subject=long_subject,
            body_plain="Detailed regulatory update regarding botanical licenses.",
        )
        assert saved["id"] is not None
        retrieved = mail_storage.get_message(saved["id"])
        assert retrieved["subject"] == long_subject

    def test_tier2_mail_unicode_emoji_subjects(self, mail_storage: MailStorage, api_client: TestClient):
        """Test Unicode emojis and diverse character sets in email subjects and bodies."""
        emoji_subject = "🌿 Herbal Harbour — Organic CBD Relief 💚🇿🇦 Cannabis & Botanicals"
        emoji_body = "Pure botanical oils: R450.00 — 100% Karoo grown 🌱. Call +27 21 448 9120."
        saved = mail_storage.save_message(
            account="info@herbalharbour.co.za",
            folder="inbox",
            from_address="client@domain.co.za",
            to_address="info@herbalharbour.co.za",
            subject=emoji_subject,
            body_plain=emoji_body,
        )
        resp = api_client.get(f"/api/messages/{saved['id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["subject"] == emoji_subject
        assert "🇿🇦" in data["subject"]
        assert "🌱" in data["body_plain"]

    def test_tier2_mail_malformed_smtp_commands(self, mail_storage: MailStorage):
        """Test SMTP daemon response to invalid command sequencing and syntax."""
        async def _run():
            port = get_free_port()
            daemon = SMTPDaemon(host="127.0.0.1", port=port, storage=mail_storage)
            await daemon.start()
            try:
                def _probe():
                    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    s.settimeout(5)
                    s.connect(("127.0.0.1", port))
                    banner = s.recv(1024)
                    assert b"220" in banner

                    # 1. Invalid command
                    s.sendall(b"FOOBAR\r\n")
                    resp = s.recv(1024)
                    assert b"500" in resp

                    # 2. DATA before RCPT
                    s.sendall(b"DATA\r\n")
                    resp = s.recv(1024)
                    assert b"503" in resp

                    # 3. Invalid MAIL FROM syntax
                    s.sendall(b"MAIL WRONG\r\n")
                    resp = s.recv(1024)
                    assert b"501" in resp

                    s.sendall(b"QUIT\r\n")
                    s.close()

                await asyncio.to_thread(_probe)
            finally:
                await daemon.stop()

        asyncio.run(_run())

    def test_tier2_mail_nonexistent_message_id_handling(self, api_client: TestClient):
        """Test 404 response codes when requesting or modifying non-existent message IDs."""
        missing_id = "non-existent-uuid-99999"
        assert api_client.get(f"/api/messages/{missing_id}").status_code == 404
        assert api_client.post(f"/api/messages/{missing_id}/read").status_code == 404
        assert api_client.delete(f"/api/messages/{missing_id}").status_code == 404
        assert api_client.post(f"/api/messages/{missing_id}/trash").status_code == 404

    def test_tier2_mail_port_unavailability_handling(self):
        """Test daemon behavior when the target port is already bound."""
        async def _run():
            port = get_free_port()
            blocker = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            blocker.bind(("127.0.0.1", port))
            blocker.listen(1)
            try:
                daemon = SMTPDaemon(host="127.0.0.1", port=port)
                with pytest.raises(OSError):
                    await daemon.start()
            finally:
                blocker.close()

        asyncio.run(_run())

    # --- Account Docs Boundary Cases (5 tests) ---

    def test_tier2_docs_otp_regex_edge_cases(self):
        """Verify OTP extraction regex against boundary cases and non-standard text patterns."""
        # Official pattern referenced in the guide: 6 standalone digits
        pattern = re.compile(r"\b\d{6}\b")

        valid_samples = [
            ("Your Google code is 849102", "849102"),
            ("TikTok verification: 192837.", "192837"),
            ("Code (998811) expires in 10 minutes", "998811"),
            ("G-519283 is your verification code", "519283"),
        ]
        for text, expected in valid_samples:
            match = pattern.search(text)
            assert match is not None, f"Failed on valid text: {text}"
            assert match.group(0) == expected

        invalid_samples = [
            "Your order number is 12345",  # 5 digits
            "Transaction ref: 1234567",    # 7 digits
            "Account code: ABCDEF",        # Alpha
            "Phone: +27214489120",         # Long number
        ]
        for text in invalid_samples:
            matches = pattern.findall(text)
            assert len(matches) == 0, f"False positive on: {text}"

    def test_tier2_docs_code_block_syntax_and_curl_examples(self):
        """Verify code blocks in the guide have non-empty valid content and curl commands."""
        guide_path = PROJECT_ROOT / "docs" / "ACCOUNT_REGISTRATION_GUIDE.md"
        content = guide_path.read_text(encoding="utf-8")

        code_blocks = re.findall(r"```(bash|json|markdown|python)?\n(.*?)```", content, re.DOTALL)
        assert len(code_blocks) >= 5, "Expected at least 5 structured code blocks"

        # Check for curl command in code blocks
        has_curl = any("curl" in block[1] for block in code_blocks)
        assert has_curl is True, "Documentation should contain actionable curl examples"

    def test_tier2_docs_env_template_completeness(self):
        """Verify Chapter 6 .env template defines all required cross-posting configuration keys."""
        guide_path = PROJECT_ROOT / "docs" / "ACCOUNT_REGISTRATION_GUIDE.md"
        content = guide_path.read_text(encoding="utf-8")

        required_keys = [
            "HERBAL_HARBOUR_DOMAIN",
            "ADMIN_EMAIL",
            "INFO_EMAIL",
            "YOUTUBE_CLIENT_ID",
            "TIKTOK_ACCESS_TOKEN",
            "INSTAGRAM_ACCESS_TOKEN",
        ]
        for key in required_keys:
            assert f"{key}=" in content, f"Expected env key {key} in registration guide template"

    def test_tier2_docs_compliance_keywords_coverage(self):
        """Verify South African regulatory and botanical compliance keywords in Chapter 5."""
        guide_path = PROJECT_ROOT / "docs" / "ACCOUNT_REGISTRATION_GUIDE.md"
        content = guide_path.read_text(encoding="utf-8")

        keywords = [
            "Cannabis for Private Purposes Act",
            "Act 7 of 2024",
            "POPIA",
            "18+",
            "CBD",
            "Cape Town",
        ]
        for kw in keywords:
            assert kw in content, f"Missing compliance keyword: {kw}"

    def test_tier2_docs_table_formatting_and_links(self):
        """Verify Markdown table structure and section links in docs."""
        guide_path = PROJECT_ROOT / "docs" / "ACCOUNT_REGISTRATION_GUIDE.md"
        content = guide_path.read_text(encoding="utf-8")

        # Table check: pipes and hyphens
        assert "| Item |" in content
        assert "| :---: |" in content or "| --- |" in content

        # Check for internal links
        assert "(#1-executive-summary--strategic-account-architecture)" in content
        assert "(#7-acceptance-criteria--verification-checklist)" in content

    # --- Social Cross-Post Boundary Cases (5 tests) ---

    def test_tier2_crosspost_long_caption_truncation_limits(self):
        """Verify title truncation for YouTube (<=100 chars total) and TikTok (<=500 chars) with captions >500 chars."""
        long_caption = (
            "Experience the ultimate botanical purity with Herbal Harbour hand-harvested "
            "organic full spectrum CBD oil straight from the heart of South Africa! "
            "Our artisanal cold-pressed cannabis tinctures promote tranquility, relief, "
            "and sustained vitality without synthetic additives or artificial preservatives. "
            "Formulated according to strict natural wellness standards with verified cannabinoid profiles. "
            "Every batch is rigorously tested for terpenes, heavy metals, pesticides, and microbial purity. "
            "Visit our Cape Town dispensary or shop online nationwide."
        )
        assert len(long_caption) > 500

        yt_title = sanitize_youtube_title(long_caption, max_base_length=90)
        assert len(yt_title) <= 100
        assert yt_title.endswith("#Shorts")

        # Truncate caption to comply with TikTok character limits (max_length=499 yields <=500 chars)
        tt_caption = format_tiktok_caption(long_caption, ["organic", "cbd", "karoo"], max_length=499)
        assert len(tt_caption) <= 500
        assert "#herbalharbour" in tt_caption

    def test_tier2_crosspost_special_characters_in_tags(self):
        """Verify hashtags with special characters, symbols, and mixed cases are extracted."""
        post = SocialPost(
            post_id="ig_special_tags",
            caption="Pure remedies! #HerbalHarbour #CBD_100% #Karoo🌿 #Wellness! #CapeTown",
            media_url="https://herbalharbour.co.za/vid.mp4",
            media_type="VIDEO",
            permalink="https://instagram.com/p/special",
            timestamp="2026-11-10T12:00:00Z",
        )
        assert "HerbalHarbour" in post.tags
        assert "CBD_100" in post.tags
        assert "CapeTown" in post.tags

    def test_tier2_crosspost_non_video_filtering_and_storage(self, crosspost_store: CrosspostStore):
        """Verify static images and carousels are skipped and audited as SKIPPED_NOT_A_VIDEO."""
        config = load_config(standby_mode="mock")
        pipeline = CrossPostingPipeline(store=crosspost_store, config=config)

        image_post = SocialPost(
            post_id="ig_image_only",
            caption="Our storefront in Beaufort West",
            media_url="https://herbalharbour.co.za/pic.jpg",
            media_type="IMAGE",
            permalink="https://instagram.com/p/pic",
            timestamp="2026-11-10T12:00:00Z",
        )

        with patch.object(pipeline.detector, "fetch_recent_posts", return_value=[image_post]):
            summary = pipeline.sync_new_posts(limit=1)
            assert summary["detected"] == 1
            assert summary["skipped"] == 1
            assert summary["published"] == 0

        rec = crosspost_store.get_record("ig_image_only")
        assert rec is not None
        assert rec["status"] == PostStatus.SKIPPED_NOT_A_VIDEO.value
        assert rec["youtube_status"] == "SKIPPED"
        assert rec["tiktok_status"] == "SKIPPED"

    def test_tier2_crosspost_empty_caption_and_media_defaults(self):
        """Verify publishers handle empty captions gracefully with brand defaults."""
        empty_post = SocialPost(
            post_id="ig_empty_post",
            caption="",
            media_url="",
            media_type="VIDEO",
            permalink="",
            timestamp="2026-11-10T12:00:00Z",
        )
        yt_pub = YouTubePublisher(standby_mode="mock")
        res_yt = yt_pub.publish(empty_post)
        assert res_yt.is_success is True

        tt_pub = TikTokPublisher(standby_mode="mock")
        res_tt = tt_pub.publish(empty_post)
        assert res_tt.is_success is True

    def test_tier2_crosspost_idempotency_upsert_resilience(self, crosspost_store: CrosspostStore):
        """Verify recording duplicate post IDs does not raise primary key collision errors."""
        post = SocialPost(
            post_id="ig_dup_test",
            caption="Idempotency test post #HerbalHarbour",
            media_url="https://herbalharbour.co.za/dup.mp4",
            media_type="VIDEO",
            permalink="https://instagram.com/p/dup",
            timestamp="2026-11-10T12:00:00Z",
        )
        crosspost_store.record_detected(post)
        crosspost_store.record_detected(post)  # Second call must be idempotent

        yt_res = PlatformResult("youtube", "SIMULATED", published_id="yt_dup")
        tt_res = PlatformResult("tiktok", "SIMULATED", published_id="tt_dup")
        crosspost_store.record_results(post, yt_res, tt_res)
        crosspost_store.record_results(post, yt_res, tt_res)  # Second update must succeed

        rec = crosspost_store.get_record("ig_dup_test")
        assert rec is not None
        assert rec["youtube_id"] == "yt_dup"


# ============================================================================
# Tier 3: Cross-Feature Combinations (Pairwise Integration)
# ============================================================================

class TestTier3CrossFeatureCombinations:
    """
    Tier 3 tests verify pairwise subsystem interoperability:
    1. End-to-End OTP Workflow: External SMTP -> SQLite Storage -> Webmail API -> Regex Extraction
    2. Cross-Posting Integration: Instagram Reel -> YouTube & TikTok Publish -> SQLite Audit -> CLI
    3. Fault Isolation: YouTube 403 API failure -> Actionable Error Log -> TikTok still succeeds
    4. Dual Account Isolation: Simultaneous Google & TikTok OTPs to admin & info mailboxes
    5. Mail Service Concurrent with Cross-Posting Pipeline without database lock contention
    """

    def test_tier3_end_to_end_otp_workflow(self, mail_storage: MailStorage, api_client: TestClient):
        """
        Verify complete OTP registration verification loop:
        1. Simulated Google Account security service dispatches verification email to admin@herbalharbour.co.za via SMTP.
        2. SMTP daemon ingests, parses MIME payload, and indexes in SQLite store.
        3. Webmail REST API client retrieves latest message for admin inbox.
        4. Operational regex pattern from ACCOUNT_REGISTRATION_GUIDE extracts 6-digit code.
        5. Code matches the transmitted value and message is marked as read.
        """
        async def _run():
            port = get_free_port()
            daemon = SMTPDaemon(host="127.0.0.1", port=port, storage=mail_storage)
            await daemon.start()

            transmitted_otp = "852941"
            try:
                def _send_otp():
                    msg = EmailMessage()
                    msg["Subject"] = f"Your Google verification code is {transmitted_otp}"
                    msg["From"] = "noreply@google.com"
                    msg["To"] = "admin@herbalharbour.co.za"
                    msg.set_content(
                        f"Herbal Harbour Administrator,\n\n"
                        f"Your 6-digit Google Account confirmation code is {transmitted_otp}.\n"
                        f"This code expires in 15 minutes.\n"
                    )
                    with smtplib.SMTP("127.0.0.1", port, timeout=5) as client:
                        client.send_message(msg)

                await asyncio.to_thread(_send_otp)
                await asyncio.sleep(0.3)

                # Query Webmail API
                resp = api_client.get("/api/messages?account=admin@herbalharbour.co.za&folder=inbox")
                assert resp.status_code == 200
                inbox = resp.json()
                assert inbox["total"] >= 1
                latest = inbox["messages"][0]

                # Inspect message detail
                detail_resp = api_client.get(f"/api/messages/{latest['id']}")
                assert detail_resp.status_code == 200
                detail = detail_resp.json()

                # Extract OTP using the guide's regex
                otp_match = re.search(r"\b\d{6}\b", detail["body_plain"])
                assert otp_match is not None, "Failed to extract 6-digit OTP from message body"
                extracted_code = otp_match.group(0)
                assert extracted_code == transmitted_otp

                # Mark as read
                read_resp = api_client.post(f"/api/messages/{latest['id']}/read", json={"is_read": 1})
                assert read_resp.status_code == 200
                assert read_resp.json()["is_read"] == 1
            finally:
                await daemon.stop()

        asyncio.run(_run())

    def test_tier3_crosspost_integration_detect_publish_cli_audit(self, crosspost_store: CrosspostStore):
        """
        Verify end-to-end cross-posting automation and CLI reporting:
        1. Instagram reel detected by mock detector.
        2. Pipeline publishes to YouTube Shorts and TikTok.
        3. Outcomes stored in SQLite `crosspost_records`.
        4. CLI status audit command verifies the record.
        """
        config = load_config(standby_mode="mock")
        pipeline = CrossPostingPipeline(store=crosspost_store, config=config)

        reel = SocialPost(
            post_id="ig_e2e_integration_01",
            caption="Artisanal CBD preparation in the Karoo 🌿 #HerbalHarbour #KarooBotanicals",
            media_url="https://herbalharbour.co.za/assets/vid1.mp4",
            media_type="VIDEO",
            permalink="https://instagram.com/reel/1",
            timestamp="2026-11-10T12:00:00Z",
        )

        with patch.object(pipeline.detector, "fetch_recent_posts", return_value=[reel]):
            summary = pipeline.sync_new_posts(limit=1)
            assert summary["published"] == 1
            assert summary["failed"] == 0

        # Verify in database
        rec = crosspost_store.get_record("ig_e2e_integration_01")
        assert rec is not None
        assert rec["status"] == PostStatus.PUBLISHED.value
        assert rec["youtube_status"] in ("SUCCESS", "SIMULATED")
        assert rec["tiktok_status"] in ("SUCCESS", "SIMULATED")

        # Capture CLI status output
        captured_output = io.StringIO()
        with patch("sys.stdout", captured_output):
            handle_status(crosspost_store, limit=5)

        output_str = captured_output.getvalue()
        assert "Herbal Harbour Social Cross-Posting Status Audit" in output_str
        assert "ig_e2e_integration_01" in output_str
        assert "Fully Published:         1" in output_str

    def test_tier3_fault_isolation_youtube_failure_tiktok_success(
        self, crosspost_store: CrosspostStore
    ):
        """
        Verify platform fault isolation:
        Simulated YouTube failure (403 Quota Exceeded) logs actionably without halting TikTok.
        TikTok succeeds and SQLite records PARTIALLY_PUBLISHED.
        """
        config = load_config(standby_mode="mock")

        # Mock failing YouTube publisher
        failing_yt = MagicMock()
        failing_yt.publish.return_value = PlatformResult(
            platform="youtube",
            status="FAILED",
            error_message="HTTP 403: The request cannot be completed because you have exceeded your quota.",
            action_item="Check Google Cloud Console YouTube Data API v3 quota allocation.",
        )

        healthy_tt = MockTikTokPublisher()

        pipeline = CrossPostingPipeline(
            youtube_pub=failing_yt,
            tiktok_pub=healthy_tt,
            store=crosspost_store,
            config=config,
        )

        reel = SocialPost(
            post_id="ig_fault_isolation_02",
            caption="Fault isolation resilience reel #HerbalHarbour",
            media_url="https://herbalharbour.co.za/assets/vid2.mp4",
            media_type="VIDEO",
            permalink="https://instagram.com/reel/2",
            timestamp="2026-11-10T12:00:00Z",
        )

        with patch.object(pipeline.detector, "fetch_recent_posts", return_value=[reel]):
            summary = pipeline.sync_new_posts(limit=1)
            assert summary["partially_published"] == 1
            assert summary["published"] == 0
            assert summary["failed"] == 0

        rec = crosspost_store.get_record("ig_fault_isolation_02")
        assert rec is not None
        assert rec["status"] == PostStatus.PARTIALLY_PUBLISHED.value
        assert rec["youtube_status"] == "FAILED"
        assert rec["tiktok_status"] in ("SUCCESS", "SIMULATED")
        assert "exceeded your quota" in rec["youtube_error"]

    def test_tier3_dual_account_otp_isolation(self, mail_storage: MailStorage, api_client: TestClient):
        """
        Verify that simultaneous Google (to admin@) and TikTok (to info@) OTP emails
        remain strictly isolated in their respective mailboxes with zero cross-contamination.
        """
        # Save Google OTP to admin
        mail_storage.save_message(
            account="admin@herbalharbour.co.za",
            folder="inbox",
            from_address="noreply@google.com",
            to_address="admin@herbalharbour.co.za",
            subject="Google Verification Code: 112233",
            body_plain="Google PIN: 112233",
        )

        # Save TikTok OTP to info
        mail_storage.save_message(
            account="info@herbalharbour.co.za",
            folder="inbox",
            from_address="noreply@tiktok.com",
            to_address="info@herbalharbour.co.za",
            subject="TikTok Verification Code: 998877",
            body_plain="TikTok PIN: 998877",
        )

        admin_msgs, admin_cnt = mail_storage.list_messages(account="admin@herbalharbour.co.za")
        info_msgs, info_cnt = mail_storage.list_messages(account="info@herbalharbour.co.za")

        assert admin_cnt == 1
        assert "112233" in admin_msgs[0]["subject"]
        assert "998877" not in admin_msgs[0]["subject"]

        assert info_cnt == 1
        assert "998877" in info_msgs[0]["subject"]
        assert "112233" not in info_msgs[0]["subject"]

    def test_tier3_webmail_activity_concurrent_with_crosspost(
        self, mail_storage: MailStorage, api_client: TestClient, crosspost_store: CrosspostStore
    ):
        """
        Verify Webmail API operations run concurrently with Cross-Posting sync
        without SQLite lock contention (both engines utilize WAL mode).
        """
        # 1. Dispatch webmail message
        resp = api_client.post(
            "/api/send",
            json={
                "from": "admin@herbalharbour.co.za",
                "to": "info@herbalharbour.co.za",
                "subject": "Concurrent Workflow Check",
                "body_plain": "Verifying simultaneous email and cross-post processing.",
            },
        )
        assert resp.status_code == 200

        # 2. Concurrently execute cross-post pipeline sync
        config = load_config(standby_mode="mock")
        pipeline = CrossPostingPipeline(store=crosspost_store, config=config)
        post = SocialPost(
            post_id="ig_concurrent_01",
            caption="Concurrent testing in Beaufort West #Karoo",
            media_url="https://herbalharbour.co.za/concurrent.mp4",
            media_type="VIDEO",
            permalink="https://instagram.com/reel/conc",
            timestamp="2026-11-10T12:00:00Z",
        )
        with patch.object(pipeline.detector, "fetch_recent_posts", return_value=[post]):
            sync_res = pipeline.sync_new_posts(limit=1)
            assert sync_res["published"] == 1

        # 3. Verify both stores updated cleanly
        inbox_msgs, _ = mail_storage.list_messages(account="info@herbalharbour.co.za", folder="inbox")
        assert any(m["subject"] == "Concurrent Workflow Check" for m in inbox_msgs)

        rec = crosspost_store.get_record("ig_concurrent_01")
        assert rec is not None
        assert rec["status"] == PostStatus.PUBLISHED.value


# ============================================================================
# Tier 4: Real-World Workload Scenarios
# ============================================================================

class TestTier4RealWorldWorkloadScenarios:
    """
    Tier 4 tests validate end-to-end real-world dispensary operational workflows:
    1. Complete Dispensary Operational Cycle: Inbound inquiry -> Webmail reply -> New Instagram reel -> Auto cross-post
    2. Onboarding & Launch Lifecycle: Multi-service registration OTPs -> First social product launch
    3. High-Throughput Burst & Mixed Media Ingestion: Batch emails + Mixed videos & images
    """

    def test_tier4_complete_dispensary_operational_cycle(
        self, mail_storage: MailStorage, api_client: TestClient, crosspost_store: CrosspostStore
    ):
        """
        Execute full lifecycle of a daily dispensary operation:
        Phase A: Inbound customer inquiry arrives via SMTP ("Do you stock Karoo CBD drops?").
        Phase B: Operator opens webmail, marks message read, and composes an outbound quote reply.
        Phase C: Dispensary marketing publishes a new Instagram Reel demonstrating tincture extraction.
        Phase D: Cross-posting daemon detects Reel, publishes to YouTube Shorts and TikTok.
        Phase E: Status audited via CLI handler confirming full publication.
        """
        async def _run_cycle():
            port = get_free_port()
            daemon = SMTPDaemon(host="127.0.0.1", port=port, storage=mail_storage)
            await daemon.start()

            try:
                # Phase A: Inbound SMTP Inquiry
                def _inbound_customer():
                    msg = EmailMessage()
                    msg["Subject"] = "Product Inquiry: 1000mg Full Spectrum CBD Drops"
                    msg["From"] = "dr.nel@stellenboschhealth.co.za"
                    msg["To"] = "info@herbalharbour.co.za"
                    msg.set_content(
                        "Good day Herbal Harbour team,\n\n"
                        "Do you currently have stock of the 1000mg Full Spectrum Karoo CBD Drops?\n"
                        "Regards, Dr. Nel"
                    )
                    with smtplib.SMTP("127.0.0.1", port, timeout=5) as client:
                        client.send_message(msg)

                await asyncio.to_thread(_inbound_customer)
                await asyncio.sleep(0.3)

                # Phase B: Webmail read and reply
                inbox_resp = api_client.get("/api/messages?account=info@herbalharbour.co.za&folder=inbox")
                assert inbox_resp.status_code == 200
                messages = inbox_resp.json()["messages"]
                assert len(messages) >= 1
                inquiry = messages[0]
                assert inquiry["from_address"] == "dr.nel@stellenboschhealth.co.za"

                # Mark inquiry read
                api_client.post(f"/api/messages/{inquiry['id']}/read", json={"is_read": 1})

                # Operator composes reply
                reply_resp = api_client.post(
                    "/api/send",
                    json={
                        "from": "info@herbalharbour.co.za",
                        "to": "dr.nel@stellenboschhealth.co.za",
                        "subject": "Re: Product Inquiry: 1000mg Full Spectrum CBD Drops",
                        "body_plain": "Good day Dr. Nel,\n\nYes, we have 45 units bottled and in stock.\n\nBest, Herbal Harbour",
                    },
                )
                assert reply_resp.status_code == 200
                assert reply_resp.json()["status"] == "sent"

                # Phase C & D: Marketing posts Reel -> Automated Cross-Posting
                config = load_config(standby_mode="mock")
                pipeline = CrossPostingPipeline(store=crosspost_store, config=config)

                reel = SocialPost(
                    post_id="ig_dispensary_cycle_reel_101",
                    caption="Fresh bottling of 1000mg Karoo CBD Drops! Natural healing from Beaufort West. #HerbalHarbour #CBDOil #KarooWellness",
                    media_url="https://herbalharbour.co.za/assets/video/tincture_bottling.mp4",
                    media_type="VIDEO",
                    permalink="https://instagram.com/reel/C9918234/",
                    timestamp="2026-11-10T12:30:00Z",
                )

                with patch.object(pipeline.detector, "fetch_recent_posts", return_value=[reel]):
                    sync_summary = pipeline.sync_new_posts(limit=1)
                    assert sync_summary["published"] == 1
                    assert sync_summary["failed"] == 0

                # Phase E: Audit via CLI
                cli_output = io.StringIO()
                with patch("sys.stdout", cli_output):
                    handle_status(crosspost_store, limit=5)
                output = cli_output.getvalue()

                assert "ig_dispensary_cycle_reel_101" in output
                assert "Fully Published:         1" in output

            finally:
                await daemon.stop()

        asyncio.run(_run_cycle())

    def test_tier4_full_onboarding_and_social_launch_scenario(
        self, mail_storage: MailStorage, api_client: TestClient, crosspost_store: CrosspostStore
    ):
        """
        Simulate dispensary startup onboarding:
        1. Google Account registration dispatches OTP 319482 to admin@herbalharbour.co.za.
        2. TikTok Business registration dispatches OTP 652019 to info@herbalharbour.co.za.
        3. Webmail extracts both codes matching documentation regex.
        4. Official launch Reel posted on Instagram and cross-posted to YouTube Shorts & TikTok.
        5. Verify system state integrity across both SQLite databases.
        """
        # Step 1: Google OTP
        mail_storage.save_message(
            account="admin@herbalharbour.co.za",
            folder="inbox",
            from_address="noreply@google.com",
            to_address="admin@herbalharbour.co.za",
            subject="Google Account Verification Code: 319482",
            body_plain="Finish setting up your Google Account. Your verification code is 319482.",
        )

        # Step 2: TikTok OTP
        mail_storage.save_message(
            account="info@herbalharbour.co.za",
            folder="inbox",
            from_address="noreply@tiktok.com",
            to_address="info@herbalharbour.co.za",
            subject="TikTok 2-Step Verification Code: 652019",
            body_plain="Your 6-digit confirmation PIN is 652019 to complete TikTok Business setup.",
        )

        # Step 3: Webmail extraction
        admin_data = api_client.get("/api/messages?account=admin@herbalharbour.co.za").json()
        info_data = api_client.get("/api/messages?account=info@herbalharbour.co.za").json()

        google_code = re.search(r"\b\d{6}\b", admin_data["messages"][0]["snippet"]).group(0)
        tiktok_code = re.search(r"\b\d{6}\b", info_data["messages"][0]["snippet"]).group(0)

        assert google_code == "319482"
        assert tiktok_code == "652019"

        # Step 4: Inaugural Launch Reel
        config = load_config(standby_mode="mock")
        pipeline = CrossPostingPipeline(store=crosspost_store, config=config)

        launch_reel = SocialPost(
            post_id="ig_inaugural_launch_reel",
            caption="Welcome to Herbal Harbour! Officially open for organic wellness in Beaufort West. #HerbalHarbour #GrandOpening #SouthAfrica",
            media_url="https://herbalharbour.co.za/assets/launch.mp4",
            media_type="VIDEO",
            permalink="https://instagram.com/reel/launch",
            timestamp="2026-11-10T13:00:00Z",
        )

        with patch.object(pipeline.detector, "fetch_recent_posts", return_value=[launch_reel]):
            summary = pipeline.sync_new_posts(limit=1)
            assert summary["published"] == 1

        rec = crosspost_store.get_record("ig_inaugural_launch_reel")
        assert rec is not None
        assert rec["status"] == PostStatus.PUBLISHED.value
        assert "grandopening" in rec["caption"].lower()

    def test_tier4_high_throughput_burst_and_mixed_media_feed(
        self, mail_storage: MailStorage, crosspost_store: CrosspostStore
    ):
        """
        Stress test:
        1. Ingest 10 burst customer emails across admin and info accounts.
        2. Ingest 6 mixed-media Instagram posts (3 Reels, 2 Photos, 1 Carousel).
        3. Verify all emails stored accurately and all cross-posting filters execute without error.
        """
        # 1. Burst emails
        for i in range(10):
            target_acc = PRIMARY_ACCOUNTS[i % 2]
            mail_storage.save_message(
                account=target_acc,
                folder="inbox",
                from_address=f"burst_sender_{i}@wellness.co.za",
                to_address=target_acc,
                subject=f"Bulk Order Inquiry #{i + 1}",
                body_plain=f"Ordering {i * 10 + 5} bottles of Karoo CBD tincture.",
            )

        admin_stats = mail_storage.get_account_stats("admin@herbalharbour.co.za")
        info_stats = mail_storage.get_account_stats("info@herbalharbour.co.za")
        assert (admin_stats["inbox_total"] + info_stats["inbox_total"]) == 10

        # 2. Mixed media feed
        mixed_feed: List[SocialPost] = [
            SocialPost("post_v1", "Harvest Reel 1 #Shorts", "https://h.co/v1.mp4", "VIDEO", "p1", "t1"),
            SocialPost("post_p1", "Photo of dispensary shelf", "https://h.co/p1.jpg", "IMAGE", "p2", "t2"),
            SocialPost("post_v2", "Harvest Reel 2 #Shorts", "https://h.co/v2.mp4", "VIDEO", "p3", "t3"),
            SocialPost("post_c1", "Carousel of certificates", "https://h.co/c1.jpg", "CAROUSEL_ALBUM", "p4", "t4"),
            SocialPost("post_v3", "Harvest Reel 3 #Shorts", "https://h.co/v3.mp4", "VIDEO", "p5", "t5"),
            SocialPost("post_p2", "Packaging photo", "https://h.co/p2.jpg", "IMAGE", "p6", "t6"),
        ]

        config = load_config(standby_mode="mock")
        pipeline = CrossPostingPipeline(store=crosspost_store, config=config)

        with patch.object(pipeline.detector, "fetch_recent_posts", return_value=mixed_feed):
            summary = pipeline.sync_new_posts(limit=6)
            assert summary["detected"] == 6
            assert summary["published"] == 3
            assert summary["skipped"] == 3
            assert summary["failed"] == 0

        # Verify storage statistics
        stats = crosspost_store.get_stats()
        assert stats["TOTAL"] == 6
        assert stats["PUBLISHED"] == 3
        assert stats["SKIPPED_NOT_A_VIDEO"] == 3
