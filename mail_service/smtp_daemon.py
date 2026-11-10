"""Asynchronous SMTP Daemon listening on unprivileged port 2525 with MIME parsing."""

import asyncio
import email
from email import policy
from email.parser import BytesParser
import logging
import os
import re
from typing import List, Optional, Tuple

from mail_service.storage import MailStorage, PRIMARY_ACCOUNTS

logger = logging.getLogger("mail_service.smtp")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

DEFAULT_SMTP_HOST = os.environ.get("HH_SMTP_HOST", "0.0.0.0")
DEFAULT_SMTP_PORT = int(os.environ.get("HH_SMTP_PORT", "2525"))
EMAIL_REGEX = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")


class SMTPSession:
    """Handles a single incoming SMTP connection lifecycle."""

    def __init__(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter, storage: MailStorage):
        self.reader = reader
        self.writer = writer
        self.storage = storage
        self.client_peer = writer.get_extra_info("peername")
        self.helo_name: Optional[str] = None
        self.mail_from: Optional[str] = None
        self.rcpt_to: List[str] = []

    async def send_response(self, code: int, message: str) -> None:
        raw = f"{code} {message}\r\n".encode("utf-8")
        self.writer.write(raw)
        await self.writer.drain()

    async def send_multiline_response(self, code: int, lines: List[str]) -> None:
        for idx, line in enumerate(lines):
            sep = "-" if idx < len(lines) - 1 else " "
            self.writer.write(f"{code}{sep}{line}\r\n".encode("utf-8"))
        await self.writer.drain()

    def _extract_email(self, raw_arg: str) -> str:
        match = EMAIL_REGEX.search(raw_arg)
        if match:
            return match.group(0).lower().strip()
        cleaned = raw_arg.strip().strip("<>").strip()
        return cleaned.lower()

    async def handle(self) -> None:
        logger.info(f"Incoming SMTP connection from {self.client_peer}")
        await self.send_response(220, "herbalharbour.co.za Herbal Harbour SMTP Mail Gateway Ready")

        while not self.reader.at_eof():
            try:
                line_bytes = await self.reader.readline()
                if not line_bytes:
                    break

                line = line_bytes.decode("utf-8", errors="replace").rstrip("\r\n")
                if not line:
                    continue

                parts = line.split(maxsplit=1)
                cmd = parts[0].upper()
                arg = parts[1] if len(parts) > 1 else ""

                if cmd in ("HELO", "EHLO"):
                    self.helo_name = arg or "client"
                    if cmd == "EHLO":
                        await self.send_multiline_response(
                            250,
                            [
                                f"herbalharbour.co.za Hello {self.helo_name}",
                                "8BITMIME",
                                "SIZE 35882570",
                                "OK",
                            ],
                        )
                    else:
                        await self.send_response(250, f"herbalharbour.co.za Hello {self.helo_name}")

                elif cmd == "MAIL":
                    # Expecting MAIL FROM:<addr>
                    if not arg.upper().startswith("FROM:"):
                        await self.send_response(501, "Syntax: MAIL FROM:<address>")
                        continue
                    from_raw = arg[5:].strip()
                    self.mail_from = self._extract_email(from_raw)
                    self.rcpt_to = []
                    await self.send_response(250, f"2.1.0 Sender {self.mail_from} OK")

                elif cmd == "RCPT":
                    # Expecting RCPT TO:<addr>
                    if not arg.upper().startswith("TO:"):
                        await self.send_response(501, "Syntax: RCPT TO:<address>")
                        continue
                    to_raw = arg[3:].strip()
                    rcpt = self._extract_email(to_raw)
                    self.rcpt_to.append(rcpt)
                    await self.send_response(250, f"2.1.5 Recipient {rcpt} OK")

                elif cmd == "DATA":
                    if not self.rcpt_to:
                        await self.send_response(503, "5.5.1 Error: need valid RCPT command before DATA")
                        continue

                    await self.send_response(354, "Start mail input; end with <CR><LF>.<CR><LF>")
                    data_buffer = bytearray()

                    while True:
                        data_line = await self.reader.readline()
                        if not data_line:
                            break
                        if data_line in (b".\r\n", b".\n", b"."):
                            break
                        # RFC 5321 Dot unstuffing
                        if data_line.startswith(b".."):
                            data_line = data_line[1:]
                        data_buffer.extend(data_line)

                    # Process MIME payload
                    msg_id = await self._process_and_store_message(bytes(data_buffer))
                    await self.send_response(250, f"2.0.0 OK: queued as {msg_id}")

                    # Reset session parameters for next potential mail transaction
                    self.mail_from = None
                    self.rcpt_to = []

                elif cmd == "RSET":
                    self.mail_from = None
                    self.rcpt_to = []
                    await self.send_response(250, "2.0.0 Reset state OK")

                elif cmd == "NOOP":
                    await self.send_response(250, "2.0.0 OK")

                elif cmd == "QUIT":
                    await self.send_response(221, "2.0.0 herbalharbour.co.za closing connection")
                    break

                else:
                    await self.send_response(500, f"5.5.1 Command unrecognized: {cmd}")

            except Exception as e:
                logger.error(f"Error in SMTP session {self.client_peer}: {e}", exc_info=True)
                try:
                    await self.send_response(451, "4.3.0 Local error in processing")
                except Exception:
                    pass
                break

        try:
            self.writer.close()
            await self.writer.wait_closed()
        except Exception:
            pass
        logger.info(f"Closed SMTP connection from {self.client_peer}")

    async def _process_and_store_message(self, raw_bytes: bytes) -> str:
        """Parse raw MIME bytes and store message in appropriate recipient mailboxes."""
        parser = BytesParser(policy=policy.default)
        parsed_msg = parser.parsebytes(raw_bytes)

        subject = str(parsed_msg.get("subject", "(No Subject)"))
        from_hdr = str(parsed_msg.get("from", self.mail_from or "unknown@sender.com"))
        to_hdr = str(parsed_msg.get("to", ", ".join(self.rcpt_to)))

        body_plain = ""
        body_html = ""
        attachments = []

        if parsed_msg.is_multipart():
            for part in parsed_msg.walk():
                content_type = part.get_content_type()
                filename = part.get_filename()

                if filename:
                    # Attachment
                    payload = part.get_payload(decode=True) or b""
                    attachments.append(
                        {
                            "filename": filename,
                            "content_type": content_type,
                            "size_bytes": len(payload),
                            "file_path": "",
                        }
                    )
                else:
                    if content_type == "text/plain" and not body_plain:
                        try:
                            body_plain = part.get_content()
                        except Exception:
                            body_plain = part.get_payload(decode=True).decode("utf-8", errors="replace")
                    elif content_type == "text/html" and not body_html:
                        try:
                            body_html = part.get_content()
                        except Exception:
                            body_html = part.get_payload(decode=True).decode("utf-8", errors="replace")
        else:
            content_type = parsed_msg.get_content_type()
            try:
                content = parsed_msg.get_content()
            except Exception:
                content = parsed_msg.get_payload(decode=True).decode("utf-8", errors="replace")

            if content_type == "text/html":
                body_html = content
            else:
                body_plain = content

        raw_mime_str = raw_bytes.decode("utf-8", errors="replace")

        # Determine target mailboxes based on recipients
        target_accounts = set()
        for r in self.rcpt_to:
            r_clean = r.lower().strip()
            if r_clean in PRIMARY_ACCOUNTS:
                target_accounts.add(r_clean)
            elif "admin@" in r_clean:
                target_accounts.add("admin@herbalharbour.co.za")
            elif "info@" in r_clean:
                target_accounts.add("info@herbalharbour.co.za")
            elif r_clean.endswith("@herbalharbour.co.za"):
                target_accounts.add(r_clean)
            else:
                # If recipient is unknown, route to admin as catch-all
                target_accounts.add("admin@herbalharbour.co.za")

        if not target_accounts:
            target_accounts.add("admin@herbalharbour.co.za")

        first_id = ""
        for acc in target_accounts:
            saved = self.storage.save_message(
                account=acc,
                folder="inbox",
                from_address=from_hdr,
                to_address=to_hdr,
                subject=subject,
                body_plain=body_plain,
                body_html=body_html,
                raw_mime=raw_mime_str,
                has_attachments=len(attachments),
                is_read=0,
                attachments=attachments,
            )
            if not first_id:
                first_id = saved["id"]
            logger.info(f"Delivered message {saved['id']} to mailbox {acc} (Subject: {subject})")

        return first_id


class SMTPDaemon:
    """Asynchronous SMTP Server Daemon service."""

    def __init__(
        self,
        host: str = DEFAULT_SMTP_HOST,
        port: int = DEFAULT_SMTP_PORT,
        storage: Optional[MailStorage] = None,
    ):
        self.host = host
        self.port = port
        self.storage = storage or MailStorage()
        self.server: Optional[asyncio.Server] = None
        self._is_running = False

    async def _client_connected_cb(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        session = SMTPSession(reader, writer, self.storage)
        await session.handle()

    async def start(self) -> None:
        """Start listening on SMTP port."""
        if self._is_running:
            return
        self.server = await asyncio.start_server(
            self._client_connected_cb, self.host, self.port
        )
        self._is_running = True
        addrs = ", ".join(str(sock.getsockname()) for sock in self.server.sockets)
        logger.info(f"Herbal Harbour SMTP daemon listening on {addrs} (Port {self.port})")

    async def stop(self) -> None:
        """Gracefully close the SMTP server."""
        if self.server:
            self.server.close()
            await self.server.wait_closed()
            self._is_running = False
            logger.info("Herbal Harbour SMTP daemon stopped.")

    async def serve_forever(self) -> None:
        await self.start()
        if self.server:
            async with self.server:
                await self.server.serve_forever()


if __name__ == "__main__":
    daemon = SMTPDaemon()
    try:
        asyncio.run(daemon.serve_forever())
    except KeyboardInterrupt:
        logger.info("Shutting down SMTP daemon...")
