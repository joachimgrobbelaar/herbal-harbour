"""FastAPI Webmail Application providing REST endpoints and UI portal."""

import logging
import os
import smtplib
from email.message import EmailMessage
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, ConfigDict, Field

from mail_service.storage import (
    MailStorage,
    PRIMARY_ACCOUNTS,
    VALID_FOLDERS,
)

logger = logging.getLogger("mail_service.api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Environment / Relay configuration
SMTP_PORT = int(os.environ.get("HH_SMTP_PORT", "2525"))
WEBMAIL_PORT = int(os.environ.get("HH_WEBMAIL_PORT", "8025"))
RELAY_HOST = os.environ.get("SMTP_RELAY_HOST", "")
RELAY_PORT = int(os.environ.get("SMTP_RELAY_PORT", "587"))
RELAY_USER = os.environ.get("SMTP_RELAY_USER", "")
RELAY_PASS = os.environ.get("SMTP_RELAY_PASS", "")


class SendEmailRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_address: Optional[str] = Field(None, alias="from")
    to_address: Optional[str] = Field(None, alias="to")
    subject: Optional[str] = "(No Subject)"
    body_plain: Optional[str] = ""
    body_html: Optional[str] = None


class ReadStatusRequest(BaseModel):
    is_read: int = 1


def create_app(storage: Optional[MailStorage] = None) -> FastAPI:
    """Application factory for Herbal Harbour Webmail API."""
    app = FastAPI(
        title="Herbal Harbour Webmail Portal",
        description="Self-hosted email API and responsive webmail for herbalharbour.co.za",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    mail_storage = storage or MailStorage()
    app.state.storage = mail_storage

    if os.path.isdir(STATIC_DIR):
        app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    templates = Jinja2Templates(directory=TEMPLATES_DIR) if os.path.isdir(TEMPLATES_DIR) else None

    @app.get("/health")
    async def health_check():
        """Health check endpoint confirming active ports and status."""
        return {
            "status": "ok",
            "service": "herbal-harbour-mail",
            "version": "1.0.0",
            "smtp_port": SMTP_PORT,
            "web_port": WEBMAIL_PORT,
            "accounts": PRIMARY_ACCOUNTS,
            "relay_configured": bool(RELAY_HOST),
        }

    @app.get("/", response_class=HTMLResponse)
    async def webmail_portal(request: Request):
        """Render the Webmail UI portal."""
        html_path = os.path.join(TEMPLATES_DIR, "webmail.html")
        if os.path.isfile(html_path):
            with open(html_path, "r", encoding="utf-8") as f:
                return HTMLResponse(f.read())
        return HTMLResponse("<h1>Herbal Harbour Webmail</h1><p>UI loading...</p>")

    @app.get("/api/accounts")
    async def list_accounts():
        """List supported mail accounts with unread counts and summary stats."""
        summary = mail_storage.get_accounts_summary()
        return {"accounts": summary}

    @app.get("/api/messages")
    async def list_messages(
        account: str = Query("admin@herbalharbour.co.za", description="Mailbox account"),
        folder: str = Query("inbox", description="Folder (inbox, sent, drafts, trash, all)"),
        search: Optional[str] = Query(None, description="Search term in subject, body, or sender"),
        limit: int = Query(50, ge=1, le=200),
        offset: int = Query(0, ge=0),
    ):
        """List messages in account/folder with pagination and search."""
        messages, total = mail_storage.list_messages(
            account=account,
            folder=folder,
            search=search,
            limit=limit,
            offset=offset,
        )
        return {
            "account": account,
            "folder": folder,
            "total": total,
            "limit": limit,
            "offset": offset,
            "messages": messages,
        }

    @app.get("/api/messages/{message_id}")
    async def get_message_detail(message_id: str, mark_read: bool = False):
        """Retrieve full details of a single message."""
        msg = mail_storage.get_message(message_id)
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        if mark_read and msg.get("is_read") == 0:
            mail_storage.mark_as_read(message_id, 1)
            msg["is_read"] = 1
        return msg

    @app.post("/api/send")
    async def send_message(req: SendEmailRequest):
        """Compose and dispatch a message. Saves to Sent folder and delivers locally if matching."""
        sender = req.from_address or req.__dict__.get("from") or PRIMARY_ACCOUNTS[0]
        recipient = req.to_address or req.__dict__.get("to")
        if not recipient or not recipient.strip():
            raise HTTPException(status_code=400, detail="Recipient address ('to') is required")

        sender = sender.strip().lower()
        recipient = recipient.strip().lower()
        subject = req.subject or "(No Subject)"
        body_plain = req.body_plain or ""
        body_html = req.body_html or ""

        # 1. Save in sender's 'sent' folder
        sent_record = mail_storage.save_message(
            account=sender,
            folder="sent",
            from_address=sender,
            to_address=recipient,
            subject=subject,
            body_plain=body_plain,
            body_html=body_html,
            is_read=1,
        )

        # 2. Check if recipient is a local account (e.g. admin or info or local domain)
        delivered_locally = False
        local_target = None
        if recipient in PRIMARY_ACCOUNTS:
            local_target = recipient
        elif "admin@" in recipient and "herbalharbour" in recipient:
            local_target = "admin@herbalharbour.co.za"
        elif "info@" in recipient and "herbalharbour" in recipient:
            local_target = "info@herbalharbour.co.za"
        elif recipient.endswith("@herbalharbour.co.za"):
            local_target = recipient

        if local_target:
            mail_storage.save_message(
                account=local_target,
                folder="inbox",
                from_address=sender,
                to_address=recipient,
                subject=subject,
                body_plain=body_plain,
                body_html=body_html,
                is_read=0,
            )
            delivered_locally = True
            logger.info(f"Delivered local email copy to {local_target} inbox")

        # 3. Optional outbound relay via SMTP_RELAY_HOST
        relayed = False
        relay_error = None
        if RELAY_HOST:
            try:
                mime_msg = EmailMessage()
                mime_msg["From"] = sender
                mime_msg["To"] = recipient
                mime_msg["Subject"] = subject
                mime_msg.set_content(body_plain)
                if body_html:
                    mime_msg.add_alternative(body_html, subtype="html")

                with smtplib.SMTP(RELAY_HOST, RELAY_PORT, timeout=10) as s:
                    s.starttls()
                    if RELAY_USER and RELAY_PASS:
                        s.login(RELAY_USER, RELAY_PASS)
                    s.send_message(mime_msg)
                relayed = True
                logger.info(f"Relayed outbound email to {recipient} via {RELAY_HOST}")
            except Exception as e:
                relay_error = str(e)
                logger.warning(f"Outbound relay delivery failed: {e}")

        return {
            "status": "sent",
            "message_id": sent_record["id"],
            "from": sender,
            "to": recipient,
            "delivered_locally": delivered_locally,
            "relayed": relayed,
            "relay_error": relay_error,
        }

    @app.post("/api/messages/{message_id}/read")
    @app.put("/api/messages/{message_id}/read")
    async def mark_read(message_id: str, payload: Optional[ReadStatusRequest] = None):
        """Mark message as read or unread."""
        status_val = payload.is_read if payload else 1
        success = mail_storage.mark_as_read(message_id, status_val)
        if not success:
            raise HTTPException(status_code=404, detail="Message not found")
        return {"status": "ok", "id": message_id, "is_read": status_val}

    @app.delete("/api/messages/{message_id}")
    async def delete_message(message_id: str, permanent: bool = False):
        """Move message to trash or permanently delete."""
        success = mail_storage.delete_message(message_id, permanent=permanent)
        if not success:
            raise HTTPException(status_code=404, detail="Message not found")
        return {"status": "deleted", "id": message_id, "permanent": permanent}

    @app.post("/api/messages/{message_id}/trash")
    async def move_to_trash(message_id: str):
        """Move message to trash folder."""
        success = mail_storage.move_to_folder(message_id, "trash")
        if not success:
            raise HTTPException(status_code=404, detail="Message not found")
        return {"status": "ok", "id": message_id, "folder": "trash"}

    return app


app = create_app()
