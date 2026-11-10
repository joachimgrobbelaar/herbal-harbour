"""
Command-line interface (CLI) for Herbal Harbour Social Media Cross-Posting Pipeline.
Provides commands for on-demand synchronization, background polling, status audits, and dry-runs.
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from typing import List, Optional

from .config import load_config
from .detector import InstagramDetector
from .pipeline import CrossPostingPipeline
from .publishers.tiktok import TikTokPublisher
from .publishers.youtube import YouTubePublisher
from .storage import CrosspostStore

logger = logging.getLogger("crosspost")


def configure_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def handle_status(store: CrosspostStore, limit: int = 10) -> int:
    """Print cross-posting database statistics and recent records."""
    stats = store.get_stats()
    print("=" * 60)
    print("🌿 Herbal Harbour Social Cross-Posting Status Audit")
    print("=" * 60)
    print(f"Total Processed:         {stats.get('TOTAL', 0)}")
    print(f"Fully Published:         {stats.get('PUBLISHED', 0)}")
    print(f"Partially Published:     {stats.get('PARTIALLY_PUBLISHED', 0)}")
    print(f"Failed:                  {stats.get('FAILED', 0)}")
    print(f"Skipped (Non-Video):     {stats.get('SKIPPED_NOT_A_VIDEO', 0)}")
    print(f"Detected / In Flight:    {stats.get('DETECTED', 0)}")
    print("-" * 60)
    print(f"Recent Records (up to {limit}):")

    records = store.list_records(limit=limit)
    if not records:
        print("  (No records in database yet)")
    else:
        for r in records:
            print(
                f"  [{r.get('detected_at', '')}] Post {r.get('instagram_post_id')}: "
                f"status={r.get('status')} | YT={r.get('youtube_status')} | TT={r.get('tiktok_status')}"
            )
            if r.get("youtube_error"):
                print(f"    └─ YouTube Error: {r.get('youtube_error')}")
            if r.get("tiktok_error"):
                print(f"    └─ TikTok Error:  {r.get('tiktok_error')}")
    print("=" * 60)
    return 0


def main(args: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        prog="crosspost",
        description="Herbal Harbour Social Media Cross-Posting Automation CLI",
    )
    parser.add_argument(
        "--sync",
        action="store_true",
        help="Execute a single synchronization cycle and exit.",
    )
    parser.add_argument(
        "--poll",
        action="store_true",
        help="Run as a continuous polling background worker daemon.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Force Rule 6 Graceful Standby mock mode for simulation without modifying live accounts.",
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Display SQLite tracking database audit summary and recent records.",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=None,
        help="Override polling interval in seconds (default from config: 300s).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="Maximum number of Instagram posts to inspect per cycle (default: 5).",
    )
    parser.add_argument(
        "--db-path",
        type=str,
        default=None,
        help="Custom path to SQLite database file.",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable detailed DEBUG level logging output.",
    )

    parsed = parser.parse_args(args)
    configure_logging(parsed.verbose)

    # Load configuration
    overrides = {}
    if parsed.dry_run:
        overrides["standby_mode"] = "mock"
    if parsed.db_path:
        overrides["db_path"] = parsed.db_path
    if parsed.interval:
        overrides["poll_interval"] = parsed.interval

    config = load_config(**overrides)
    store = CrosspostStore(db_path=config.db_path)

    if parsed.status:
        return handle_status(store, limit=parsed.limit)

    pipeline = CrossPostingPipeline(config=config, store=store)

    if parsed.poll:
        logger.info("Starting continuous polling mode (Ctrl+C to stop)...")
        try:
            pipeline.run_poll_loop(interval=parsed.interval)
        except KeyboardInterrupt:
            logger.info("Polling loop interrupted by user. Exiting cleanly.")
        return 0

    # Default action: single sync cycle
    logger.info("Executing cross-posting synchronization cycle (dry_run=%s)...", parsed.dry_run)
    summary = pipeline.sync_new_posts(limit=parsed.limit)
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
