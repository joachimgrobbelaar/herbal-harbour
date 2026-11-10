"""SQLite mailbox store and repository for Herbal Harbour email service."""

import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "emails.db")

PRIMARY_ACCOUNTS = [
    "admin@herbalharbour.co.za",
    "info@herbalharbour.co.za",
]

VALID_FOLDERS = ["inbox", "sent", "drafts", "trash"]


class MailStorage:
    """Manages SQLite persistence for mailboxes, folders, and message MIME parts."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or os.environ.get("HH_EMAIL_DB", DEFAULT_DB_PATH)
        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        self.init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA journal_mode = WAL;")
        return conn

    def init_db(self) -> None:
        """Create tables, indexes, and initial schema."""
        with self._get_connection() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    account TEXT NOT NULL,
                    folder TEXT NOT NULL DEFAULT 'inbox',
                    from_address TEXT NOT NULL,
                    to_address TEXT NOT NULL,
                    subject TEXT,
                    body_plain TEXT,
                    body_html TEXT,
                    raw_mime TEXT,
                    has_attachments INTEGER DEFAULT 0,
                    is_read INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS attachments (
                    id TEXT PRIMARY KEY,
                    message_id TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    content_type TEXT NOT NULL,
                    size_bytes INTEGER NOT NULL,
                    file_path TEXT,
                    FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_messages_account_folder 
                    ON messages(account, folder);
                CREATE INDEX IF NOT EXISTS idx_messages_created 
                    ON messages(created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_messages_unread 
                    ON messages(account, folder, is_read);
                """
            )
            conn.commit()

    def save_message(
        self,
        account: str,
        folder: str,
        from_address: str,
        to_address: str,
        subject: Optional[str] = None,
        body_plain: Optional[str] = None,
        body_html: Optional[str] = None,
        raw_mime: Optional[str] = None,
        has_attachments: int = 0,
        is_read: int = 0,
        msg_id: Optional[str] = None,
        created_at: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Save a new email message and any associated attachments."""
        msg_id = msg_id or str(uuid.uuid4())
        created_at = created_at or datetime.now(timezone.utc).isoformat()
        folder = folder.lower() if folder.lower() in VALID_FOLDERS else "inbox"
        account = account.strip().lower()
        has_att = 1 if (has_attachments or (attachments and len(attachments) > 0)) else 0

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO messages (
                    id, account, folder, from_address, to_address,
                    subject, body_plain, body_html, raw_mime,
                    has_attachments, is_read, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    msg_id,
                    account,
                    folder,
                    from_address,
                    to_address,
                    subject or "(No Subject)",
                    body_plain or "",
                    body_html or "",
                    raw_mime or "",
                    has_att,
                    int(is_read),
                    created_at,
                ),
            )

            if attachments:
                for att in attachments:
                    att_id = att.get("id") or str(uuid.uuid4())
                    conn.execute(
                        """
                        INSERT INTO attachments (
                            id, message_id, filename, content_type, size_bytes, file_path
                        ) VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (
                            att_id,
                            msg_id,
                            att.get("filename", "attachment"),
                            att.get("content_type", "application/octet-stream"),
                            int(att.get("size_bytes", 0)),
                            att.get("file_path", ""),
                        ),
                    )

            conn.commit()

        return self.get_message(msg_id)  # type: ignore

    def get_message(self, msg_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single message by ID including its attachments."""
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT * FROM messages WHERE id = ?", (msg_id,))
            row = cursor.fetchone()
            if not row:
                return None

            msg = dict(row)
            att_cursor = conn.execute(
                "SELECT * FROM attachments WHERE message_id = ?", (msg_id,)
            )
            msg["attachments"] = [dict(r) for r in att_cursor.fetchall()]
            return msg

    def list_messages(
        self,
        account: Optional[str] = None,
        folder: Optional[str] = "inbox",
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """List messages filtered by account, folder, and optional search query."""
        params: List[Any] = []
        conditions: List[str] = []

        if account:
            conditions.append("account = ?")
            params.append(account.strip().lower())

        if folder and folder.lower() != "all":
            conditions.append("folder = ?")
            params.append(folder.strip().lower())

        if search and search.strip():
            query_str = f"%{search.strip().lower()}%"
            conditions.append(
                "(LOWER(subject) LIKE ? OR LOWER(from_address) LIKE ? OR LOWER(body_plain) LIKE ? OR LOWER(to_address) LIKE ?)"
            )
            params.extend([query_str, query_str, query_str, query_str])

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        with self._get_connection() as conn:
            count_sql = f"SELECT COUNT(*) FROM messages {where_clause}"
            total_count = conn.execute(count_sql, params).fetchone()[0]

            list_sql = f"""
                SELECT id, account, folder, from_address, to_address, subject, 
                       SUBSTR(body_plain, 1, 150) as snippet,
                       has_attachments, is_read, created_at
                FROM messages
                {where_clause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            """
            rows = conn.execute(list_sql, params + [limit, offset]).fetchall()
            return [dict(r) for r in rows], total_count

    def mark_as_read(self, msg_id: str, is_read: int = 1) -> bool:
        """Mark a message as read (1) or unread (0)."""
        with self._get_connection() as conn:
            cursor = conn.execute(
                "UPDATE messages SET is_read = ? WHERE id = ?", (int(is_read), msg_id)
            )
            conn.commit()
            return cursor.rowcount > 0

    def move_to_folder(self, msg_id: str, folder: str) -> bool:
        """Move a message to a different folder (e.g. trash, archive)."""
        target_folder = folder.lower() if folder.lower() in VALID_FOLDERS else "trash"
        with self._get_connection() as conn:
            cursor = conn.execute(
                "UPDATE messages SET folder = ? WHERE id = ?", (target_folder, msg_id)
            )
            conn.commit()
            return cursor.rowcount > 0

    def delete_message(self, msg_id: str, permanent: bool = False) -> bool:
        """Move to trash or permanently delete if already in trash / requested."""
        with self._get_connection() as conn:
            msg = conn.execute("SELECT folder FROM messages WHERE id = ?", (msg_id,)).fetchone()
            if not msg:
                return False

            if permanent or msg["folder"] == "trash":
                cursor = conn.execute("DELETE FROM messages WHERE id = ?", (msg_id,))
                conn.commit()
                return cursor.rowcount > 0
            else:
                cursor = conn.execute(
                    "UPDATE messages SET folder = 'trash' WHERE id = ?", (msg_id,)
                )
                conn.commit()
                return cursor.rowcount > 0

    def get_account_stats(self, account: str) -> Dict[str, int]:
        """Get total and unread message statistics for a given account."""
        acc = account.strip().lower()
        stats = {
            "inbox_total": 0,
            "inbox_unread": 0,
            "sent_total": 0,
            "trash_total": 0,
            "drafts_total": 0,
        }
        with self._get_connection() as conn:
            rows = conn.execute(
                """
                SELECT folder, is_read, COUNT(*) as cnt
                FROM messages
                WHERE account = ?
                GROUP BY folder, is_read
                """,
                (acc,),
            ).fetchall()

            for r in rows:
                folder = r["folder"]
                is_read = r["is_read"]
                cnt = r["cnt"]

                if folder == "inbox":
                    stats["inbox_total"] += cnt
                    if is_read == 0:
                        stats["inbox_unread"] += cnt
                elif folder == "sent":
                    stats["sent_total"] += cnt
                elif folder == "trash":
                    stats["trash_total"] += cnt
                elif folder == "drafts":
                    stats["drafts_total"] += cnt

        return stats

    def get_accounts_summary(self) -> List[Dict[str, Any]]:
        """Return list of supported accounts with their current inbox statistics."""
        summary = []
        for email in PRIMARY_ACCOUNTS:
            stats = self.get_account_stats(email)
            label = "Dispensary Administrator" if "admin" in email else "Customer Service & Info"
            summary.append(
                {
                    "email": email,
                    "label": label,
                    "unread_inbox": stats["inbox_unread"],
                    "total_inbox": stats["inbox_total"],
                    "stats": stats,
                }
            )
        return summary

    def clear_all(self) -> None:
        """Utility for test suites to purge messages."""
        with self._get_connection() as conn:
            conn.execute("DELETE FROM attachments;")
            conn.execute("DELETE FROM messages;")
            conn.commit()
