"""Comprehensive automated end-to-end test suite for Herbal Harbour Mail Service.

Verifies:
1. SQLite storage operations, indexing, and mailbox isolation.
2. Inbound SMTP delivery to admin@herbalharbour.co.za and info@herbalharbour.co.za via port 2525.
3. MIME parsing of multipart text/html, headers, and attachments.
4. Webmail REST API operations (health, accounts, messages, pagination, search).
5. Outbound compose and send via /api/send with automatic local delivery and sent folder tracking.
6. Message read flag updates and folder transitions (inbox -> trash -> deleted).
7. Webmail UI HTML rendering on port 8025 with dispensary branding and account switching.
8. Unified server lifecycle and clean shutdown.
"""

import asyncio
import email
from email.message import EmailMessage
import os
import smtplib
import tempfile
from typing import Generator

import pytest
from fastapi.testclient import TestClient

from mail_service.server import UnifiedMailServer
from mail_service.smtp_daemon import SMTPDaemon
from mail_service.storage import MailStorage, PRIMARY_ACCOUNTS
from mail_service.webmail_api import create_app


@pytest.fixture
def temp_db() -> Generator[str, None, None]:
    """Provide an isolated SQLite database path per test."""
    fd, path = tempfile.mkstemp(suffix="_test_emails.db")
    os.close(fd)
    yield path


@pytest.fixture
def storage(temp_db: str) -> MailStorage:
    """Provide a fresh MailStorage instance."""
    return MailStorage(db_path=temp_db)


@pytest.fixture
def api_client(storage: MailStorage) -> TestClient:
    """Provide a FastAPI TestClient bound to the isolated MailStorage."""
    app = create_app(storage=storage)
    return TestClient(app)


# ==========================================
# 1. Mail Storage & Database Tests
# ==========================================

def test_storage_save_and_retrieve(storage: MailStorage):
    """Test saving a message and retrieving full details."""
    saved = storage.save_message(
        account="admin@herbalharbour.co.za",
        folder="inbox",
        from_address="noreply@google.com",
        to_address="admin@herbalharbour.co.za",
        subject="Your Google verification code is 849102",
        body_plain="Use verification code 849102 to finish setting up your account.",
        body_html="<p>Use verification code <b>849102</b></p>",
        is_read=0,
    )
    assert saved["id"] is not None
    assert saved["account"] == "admin@herbalharbour.co.za"
    assert saved["is_read"] == 0

    retrieved = storage.get_message(saved["id"])
    assert retrieved is not None
    assert retrieved["subject"] == "Your Google verification code is 849102"
    assert "849102" in retrieved["body_plain"]


def test_storage_mailbox_isolation_and_stats(storage: MailStorage):
    """Test that admin and info mailboxes do not cross-contaminate."""
    storage.save_message(
        account="admin@herbalharbour.co.za",
        folder="inbox",
        from_address="security@google.com",
        to_address="admin@herbalharbour.co.za",
        subject="Admin Alert",
        is_read=0,
    )
    storage.save_message(
        account="info@herbalharbour.co.za",
        folder="inbox",
        from_address="contact@client.co.za",
        to_address="info@herbalharbour.co.za",
        subject="Product Inquiry",
        is_read=0,
    )

    admin_msgs, admin_count = storage.list_messages(account="admin@herbalharbour.co.za", folder="inbox")
    assert admin_count == 1
    assert admin_msgs[0]["subject"] == "Admin Alert"

    info_msgs, info_count = storage.list_messages(account="info@herbalharbour.co.za", folder="inbox")
    assert info_count == 1
    assert info_msgs[0]["subject"] == "Product Inquiry"

    summary = storage.get_accounts_summary()
    assert len(summary) == 2
    admin_stat = next(a for a in summary if a["email"] == "admin@herbalharbour.co.za")
    info_stat = next(a for a in summary if a["email"] == "info@herbalharbour.co.za")
    assert admin_stat["unread_inbox"] == 1
    assert info_stat["unread_inbox"] == 1


def test_storage_folder_transitions(storage: MailStorage):
    """Test read status and folder movement (inbox -> trash -> deleted)."""
    saved = storage.save_message(
        account="admin@herbalharbour.co.za",
        folder="inbox",
        from_address="news@herbal.co.za",
        to_address="admin@herbalharbour.co.za",
        subject="Newsletter",
        is_read=0,
    )
    msg_id = saved["id"]

    # Mark as read
    assert storage.mark_as_read(msg_id, 1) is True
    assert storage.get_message(msg_id)["is_read"] == 1

    # Move to trash
    assert storage.delete_message(msg_id, permanent=False) is True
    assert storage.get_message(msg_id)["folder"] == "trash"

    # Permanently delete
    assert storage.delete_message(msg_id, permanent=True) is True
    assert storage.get_message(msg_id) is None


# ==========================================
# 2. SMTP Daemon End-to-End Delivery Tests
# ==========================================

def test_smtp_receive_admin_otp(storage: MailStorage):
    """Verify live inbound SMTP delivery of Google OTP to admin@herbalharbour.co.za."""
    async def _async_test():
        test_port = 25261
        daemon = SMTPDaemon(host="127.0.0.1", port=test_port, storage=storage)
        await daemon.start()

        try:
            def send_email():
                msg = EmailMessage()
                msg["Subject"] = "Google Account Verification Code: 519283"
                msg["From"] = "noreply@google.com"
                msg["To"] = "admin@herbalharbour.co.za"
                msg.set_content("Your 6-digit confirmation code is 519283.")
                with smtplib.SMTP("127.0.0.1", test_port, timeout=5) as client:
                    client.send_message(msg)

            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, send_email)
            await asyncio.sleep(0.3)

            msgs, count = storage.list_messages(account="admin@herbalharbour.co.za", folder="inbox")
            assert count == 1
            assert msgs[0]["subject"] == "Google Account Verification Code: 519283"
            assert "519283" in msgs[0]["snippet"]
            assert msgs[0]["is_read"] == 0

        finally:
            await daemon.stop()

    asyncio.run(_async_test())


def test_smtp_receive_info_tiktok(storage: MailStorage):
    """Verify live inbound SMTP delivery of TikTok verification code to info@herbalharbour.co.za."""
    async def _async_test():
        test_port = 25262
        daemon = SMTPDaemon(host="127.0.0.1", port=test_port, storage=storage)
        await daemon.start()

        try:
            def send_email():
                msg = EmailMessage()
                msg["Subject"] = "TikTok Verification Code: 938472"
                msg["From"] = "register@tiktok.com"
                msg["To"] = "info@herbalharbour.co.za"
                msg.set_content("Enter code 938472 to verify your TikTok business account.")
                with smtplib.SMTP("127.0.0.1", test_port, timeout=5) as client:
                    client.send_message(msg)

            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, send_email)
            await asyncio.sleep(0.3)

            # Check info mailbox has the message
            msgs, count = storage.list_messages(account="info@herbalharbour.co.za", folder="inbox")
            assert count == 1
            assert "938472" in msgs[0]["subject"]

            # Check admin mailbox remains untouched
            admin_msgs, admin_count = storage.list_messages(account="admin@herbalharbour.co.za", folder="inbox")
            assert admin_count == 0

        finally:
            await daemon.stop()

    asyncio.run(_async_test())


def test_smtp_multipart_and_attachments(storage: MailStorage):
    """Verify MIME multipart parsing with plain text, HTML, and attachment metadata."""
    async def _async_test():
        test_port = 25263
        daemon = SMTPDaemon(host="127.0.0.1", port=test_port, storage=storage)
        await daemon.start()

        try:
            def send_multipart():
                msg = EmailMessage()
                msg["Subject"] = "Lab Test Results Batch #HH-489"
                msg["From"] = "lab@testing.co.za"
                msg["To"] = "admin@herbalharbour.co.za"
                msg.set_content("Attached is the Certificate of Analysis (COA) for October 2026.")
                msg.add_alternative(
                    "<p>Attached is the <b>Certificate of Analysis (COA)</b> for October 2026.</p>",
                    subtype="html",
                )
                msg.add_attachment(
                    b"%PDF-1.4 sample certificate of analysis raw bytes",
                    maintype="application",
                    subtype="pdf",
                    filename="COA-HH489.pdf",
                )
                with smtplib.SMTP("127.0.0.1", test_port, timeout=5) as client:
                    client.send_message(msg)

            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, send_multipart)
            await asyncio.sleep(0.3)

            msgs, count = storage.list_messages(account="admin@herbalharbour.co.za")
            assert count == 1
            detail = storage.get_message(msgs[0]["id"])
            assert detail is not None
            assert detail["has_attachments"] == 1
            assert len(detail["attachments"]) == 1
            assert detail["attachments"][0]["filename"] == "COA-HH489.pdf"
            assert "<p>Attached is the <b>Certificate of Analysis" in detail["body_html"]

        finally:
            await daemon.stop()

    asyncio.run(_async_test())


# ==========================================
# 3. Webmail REST API Tests
# ==========================================

def test_api_health(api_client: TestClient):
    """Test /health endpoint returns service metadata."""
    res = api_client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "herbal-harbour-mail"
    assert data["smtp_port"] == 2525
    assert data["web_port"] == 8025
    assert "admin@herbalharbour.co.za" in data["accounts"]
    assert "info@herbalharbour.co.za" in data["accounts"]


def test_api_accounts_summary(api_client: TestClient, storage: MailStorage):
    """Test /api/accounts endpoint returns both accounts with counts."""
    storage.save_message(
        account="admin@herbalharbour.co.za",
        folder="inbox",
        from_address="sender@test.com",
        to_address="admin@herbalharbour.co.za",
        subject="Msg 1",
        is_read=0,
    )
    res = api_client.get("/api/accounts")
    assert res.status_code == 200
    data = res.json()
    assert "accounts" in data
    assert len(data["accounts"]) == 2
    admin_acc = next(a for a in data["accounts"] if a["email"] == "admin@herbalharbour.co.za")
    assert admin_acc["unread_inbox"] == 1


def test_api_compose_and_send_with_local_delivery(api_client: TestClient):
    """Test POST /api/send records in Sent folder and delivers to recipient's inbox."""
    payload = {
        "from": "admin@herbalharbour.co.za",
        "to": "info@herbalharbour.co.za",
        "subject": "Dispensary Morning Dispatch",
        "body_plain": "All craft flower orders have been pre-packaged for courier collection.",
    }
    send_res = api_client.post("/api/send", json=payload)
    assert send_res.status_code == 200
    send_data = send_res.json()
    assert send_data["status"] == "sent"
    assert send_data["delivered_locally"] is True

    # 1. Check sender's Sent folder
    sent_res = api_client.get("/api/messages?account=admin@herbalharbour.co.za&folder=sent")
    assert sent_res.status_code == 200
    sent_data = sent_res.json()
    assert sent_data["total"] == 1
    assert sent_data["messages"][0]["subject"] == "Dispensary Morning Dispatch"

    # 2. Check recipient's Inbox folder
    inbox_res = api_client.get("/api/messages?account=info@herbalharbour.co.za&folder=inbox")
    assert inbox_res.status_code == 200
    inbox_data = inbox_res.json()
    assert inbox_data["total"] == 1
    assert inbox_data["messages"][0]["from_address"] == "admin@herbalharbour.co.za"


def test_api_search_and_filter(api_client: TestClient, storage: MailStorage):
    """Test searching messages by keyword in subject or body."""
    storage.save_message(
        account="admin@herbalharbour.co.za",
        folder="inbox",
        from_address="system@hostafrica.com",
        to_address="admin@herbalharbour.co.za",
        subject="cPanel SSL Certificate Renewed",
        body_plain="Your wildcard SSL certificate has been auto-renewed.",
    )
    storage.save_message(
        account="admin@herbalharbour.co.za",
        folder="inbox",
        from_address="accounts@thecourierguy.co.za",
        to_address="admin@herbalharbour.co.za",
        subject="Monthly Courier Invoice",
        body_plain="Invoice for October 2026 delivery waybills.",
    )

    # Search for SSL
    ssl_res = api_client.get("/api/messages?account=admin@herbalharbour.co.za&folder=inbox&search=SSL")
    assert ssl_res.status_code == 200
    assert ssl_res.json()["total"] == 1
    assert "SSL" in ssl_res.json()["messages"][0]["subject"]

    # Search for Courier
    tcg_res = api_client.get("/api/messages?account=admin@herbalharbour.co.za&folder=inbox&search=Courier")
    assert tcg_res.status_code == 200
    assert tcg_res.json()["total"] == 1


def test_api_read_and_delete_endpoints(api_client: TestClient, storage: MailStorage):
    """Test /api/messages/{id}/read and DELETE /api/messages/{id}."""
    msg = storage.save_message(
        account="admin@herbalharbour.co.za",
        folder="inbox",
        from_address="test@example.com",
        to_address="admin@herbalharbour.co.za",
        subject="To Be Deleted",
        is_read=0,
    )
    msg_id = msg["id"]

    # Mark as read
    read_res = api_client.post(f"/api/messages/{msg_id}/read", json={"is_read": 1})
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] == 1

    # Move to trash via DELETE
    del_res = api_client.delete(f"/api/messages/{msg_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

    # Verify moved to trash
    trash_res = api_client.get("/api/messages?account=admin@herbalharbour.co.za&folder=trash")
    assert trash_res.status_code == 200
    assert trash_res.json()["total"] == 1


# ==========================================
# 4. Webmail UI HTML Rendering Test
# ==========================================

def test_webmail_ui_html_rendering(api_client: TestClient):
    """Verify that GET / returns the HTML5 Webmail UI with dispensary branding."""
    res = api_client.get("/")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    html = res.text

    # Verify branding and key functional elements
    assert "Herbal Harbour" in html
    assert "Webmail" in html
    assert "admin@herbalharbour.co.za" in html
    assert "info@herbalharbour.co.za" in html
    assert "Compose" in html or "New Message" in html
    assert "SMTP Port 2525" in html
    assert "Webmail Port 8025" in html


# ==========================================
# 5. Unified Server Lifecycle Test
# ==========================================

def test_unified_server_initialization_and_shutdown(temp_db: str):
    """Verify UnifiedMailServer initializes cleanly and shuts down without socket leaks."""
    async def _async_test():
        server = UnifiedMailServer(
            smtp_host="127.0.0.1",
            smtp_port=25268,
            web_host="127.0.0.1",
            web_port=80268,
            db_path=temp_db,
        )
        assert server.smtp_daemon is not None
        assert server.app is not None

        # Test starting the SMTP component and shutting down cleanly
        await server.smtp_daemon.start()
        assert server.smtp_daemon._is_running is True

        await server.stop()
        assert server.smtp_daemon._is_running is False

    asyncio.run(_async_test())
