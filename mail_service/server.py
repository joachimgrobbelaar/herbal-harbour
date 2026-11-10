"""Unified daemon runner launching both the SMTP daemon (port 2525) and FastAPI (port 8025)."""

import argparse
import asyncio
import logging
import os
import signal
import sys
from typing import Optional

import uvicorn

from mail_service.smtp_daemon import SMTPDaemon
from mail_service.storage import MailStorage
from mail_service.webmail_api import create_app

logger = logging.getLogger("mail_service.server")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class UnifiedMailServer:
    """Orchestrates concurrent execution of the SMTP listener and FastAPI webmail application."""

    def __init__(
        self,
        smtp_host: str = "0.0.0.0",
        smtp_port: int = 2525,
        web_host: str = "0.0.0.0",
        web_port: int = 8025,
        db_path: Optional[str] = None,
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.web_host = web_host
        self.web_port = web_port
        self.storage = MailStorage(db_path=db_path)
        self.smtp_daemon = SMTPDaemon(
            host=self.smtp_host, port=self.smtp_port, storage=self.storage
        )
        self.app = create_app(storage=self.storage)
        self.uvicorn_server: Optional[uvicorn.Server] = None
        self._shutdown_event = asyncio.Event()

    async def start(self) -> None:
        """Start both services asynchronously."""
        logger.info(
            f"Starting Herbal Harbour Email Suite: SMTP on port {self.smtp_port}, Webmail on port {self.web_port}"
        )

        # 1. Start SMTP Daemon
        await self.smtp_daemon.start()

        # 2. Configure and run Uvicorn
        config = uvicorn.Config(
            app=self.app,
            host=self.web_host,
            port=self.web_port,
            log_level="info",
            access_log=False,
        )
        self.uvicorn_server = uvicorn.Server(config)

        # Run both tasks concurrently
        smtp_task = asyncio.create_task(self._monitor_smtp())
        web_task = asyncio.create_task(self.uvicorn_server.serve())

        logger.info("Herbal Harbour Email Service & Webmail are fully ONLINE.")

        # Wait for shutdown event or either task completion
        done, pending = await asyncio.wait(
            [smtp_task, web_task, asyncio.create_task(self._shutdown_event.wait())],
            return_when=asyncio.FIRST_COMPLETED,
        )

        for task in pending:
            task.cancel()

        await self.stop()

    async def _monitor_smtp(self) -> None:
        if self.smtp_daemon.server:
            async with self.smtp_daemon.server:
                await self.smtp_daemon.server.serve_forever()

    async def stop(self) -> None:
        """Stop both services cleanly."""
        logger.info("Stopping Herbal Harbour Email Suite...")
        if self.uvicorn_server:
            self.uvicorn_server.should_exit = True
        await self.smtp_daemon.stop()
        self._shutdown_event.set()
        logger.info("All email services shut down cleanly.")


def main():
    parser = argparse.ArgumentParser(description="Herbal Harbour Unified Mail Server")
    parser.add_argument(
        "--smtp-host",
        default=os.environ.get("HH_SMTP_HOST", "0.0.0.0"),
        help="Host for SMTP listener (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--smtp-port",
        type=int,
        default=int(os.environ.get("HH_SMTP_PORT", "2525")),
        help="Port for SMTP listener (default: 2525)",
    )
    parser.add_argument(
        "--web-host",
        default=os.environ.get("HH_WEBMAIL_HOST", "0.0.0.0"),
        help="Host for Webmail portal (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--web-port",
        type=int,
        default=int(os.environ.get("HH_WEBMAIL_PORT", "8025")),
        help="Port for Webmail portal (default: 8025)",
    )
    parser.add_argument(
        "--db",
        default=os.environ.get("HH_EMAIL_DB", None),
        help="Path to SQLite emails database",
    )
    args = parser.parse_args()

    server = UnifiedMailServer(
        smtp_host=args.smtp_host,
        smtp_port=args.smtp_port,
        web_host=args.web_host,
        web_port=args.web_port,
        db_path=args.db,
    )

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, lambda: asyncio.create_task(server.stop()))
        except (NotImplementedError, RuntimeError):
            pass

    try:
        loop.run_until_complete(server.start())
    except (KeyboardInterrupt, SystemExit):
        pass
    finally:
        loop.run_until_complete(server.stop())
        loop.close()


if __name__ == "__main__":
    main()
