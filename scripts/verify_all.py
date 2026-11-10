#!/usr/bin/env python3
"""
Consolidated Test Suite and Documentation Verification Runner for Herbal Harbour.

Executes:
1. Mail Service Component Tests (`mail_service/tests/test_mail_e2e.py`)
2. Social Cross-Posting Pipeline Tests (`tests/test_crosspost.py`)
3. Comprehensive 4-Tier E2E Integration Suite (`tests/test_e2e_integration.py`)
4. Markdown Documentation & Architecture Linting (`docs/`, `TEST_INFRA.md`, `README.md`)

Emits a structured report and exits with 0 on 100% success or non-zero on failure.
"""

from __future__ import annotations

import os
from pathlib import Path
import re
import subprocess
import sys
import time
from typing import Dict, List, Tuple

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def run_pytest_suite(suite_rel_path: str) -> Tuple[bool, int, int, float, str]:
    """Run a pytest test suite and extract passed/failed counts and duration."""
    suite_path = PROJECT_ROOT / suite_rel_path
    if not suite_path.exists():
        return False, 0, 1, 0.0, f"Suite file not found: {suite_rel_path}"

    env = os.environ.copy()
    env["PYTHONPATH"] = str(PROJECT_ROOT)

    cmd = [
        sys.executable,
        "-m",
        "pytest",
        str(suite_path),
        "-v",
        "--tb=short",
    ]

    start_time = time.time()
    proc = subprocess.run(cmd, env=env, cwd=str(PROJECT_ROOT), capture_output=True, text=True)
    duration = time.time() - start_time

    output = proc.stdout + proc.stderr

    # Parse passed/failed counts from pytest output
    passed = 0
    failed = 0

    pass_match = re.search(r"(\d+)\s+passed", output)
    if pass_match:
        passed = int(pass_match.group(1))

    fail_match = re.search(r"(\d+)\s+failed", output)
    if fail_match:
        failed = int(fail_match.group(1))

    success = (proc.returncode == 0) and (failed == 0) and (passed > 0)
    return success, passed, failed, duration, output


def lint_markdown_documents() -> Tuple[bool, int, int, float, List[str]]:
    """Validate documentation structure, chapter headings, and syntax."""
    start_time = time.time()
    logs: List[str] = []
    checks_passed = 0
    checks_failed = 0

    docs_to_check = [
        ("docs/ACCOUNT_REGISTRATION_GUIDE.md", 15000, 400),
        ("TEST_INFRA.md", 5000, 100),
        ("README.md", 100, 5),
    ]

    for rel_path, min_bytes, min_lines in docs_to_check:
        p = PROJECT_ROOT / rel_path
        if not p.is_file():
            logs.append(f"❌ Missing file: {rel_path}")
            checks_failed += 1
            continue

        content = p.read_text(encoding="utf-8")
        size_bytes = len(content.encode("utf-8"))
        line_count = len(content.splitlines())

        if size_bytes < min_bytes or line_count < min_lines:
            logs.append(
                f"❌ {rel_path} size below threshold: {size_bytes}B/{min_bytes}B, {line_count}/{min_lines} lines"
            )
            checks_failed += 1
        else:
            logs.append(f"✅ {rel_path}: Verified ({line_count} lines, {size_bytes} bytes)")
            checks_passed += 1

        # Check code fence balance (```)
        code_fence_count = content.count("```")
        if code_fence_count % 2 != 0:
            logs.append(f"❌ {rel_path}: Unbalanced Markdown code fences (found {code_fence_count} markers)")
            checks_failed += 1
        else:
            checks_passed += 1

    # Check specific required chapters in ACCOUNT_REGISTRATION_GUIDE.md
    guide_p = PROJECT_ROOT / "docs" / "ACCOUNT_REGISTRATION_GUIDE.md"
    if guide_p.is_file():
        guide_text = guide_p.read_text(encoding="utf-8")
        for ch_idx in range(1, 8):
            ch_str = f"## {ch_idx}."
            if ch_str in guide_text:
                checks_passed += 1
            else:
                logs.append(f"❌ docs/ACCOUNT_REGISTRATION_GUIDE.md: Missing Chapter {ch_idx}")
                checks_failed += 1

        # Check 14 AC checkpoints
        for ac_idx in range(1, 15):
            ac_str = f"AC-{ac_idx}"
            if ac_str in guide_text:
                checks_passed += 1
            else:
                logs.append(f"❌ docs/ACCOUNT_REGISTRATION_GUIDE.md: Missing Checkpoint {ac_str}")
                checks_failed += 1

    duration = time.time() - start_time
    success = checks_failed == 0
    return success, checks_passed, checks_failed, duration, logs


def main() -> int:
    print("=" * 75)
    print("🌿 Herbal Harbour Platform — Unified Verification Runner")
    print(f"Workspace: {PROJECT_ROOT}")
    print("=" * 75)

    suites = [
        ("Mail Service E2E Suite", "mail_service/tests/test_mail_e2e.py"),
        ("Social Cross-Posting Suite", "tests/test_crosspost.py"),
        ("4-Tier E2E Integration Suite", "tests/test_e2e_integration.py"),
    ]

    results: List[Dict[str, any]] = []
    total_passed = 0
    total_failed = 0
    total_duration = 0.0

    # 1. Run Pytest Suites
    for name, path in suites:
        print(f"\n[RUNNING] {name} ({path})...")
        success, passed, failed, duration, raw_output = run_pytest_suite(path)
        total_passed += passed
        total_failed += failed
        total_duration += duration

        status_str = "PASS ✅" if success else "FAIL ❌"
        print(f"[{status_str}] {passed} passed, {failed} failed in {duration:.2f}s")
        if not success:
            print("-" * 50)
            print(raw_output[-1500:])  # Print tail of error output
            print("-" * 50)

        results.append({
            "name": name,
            "path": path,
            "success": success,
            "passed": passed,
            "failed": failed,
            "duration": duration,
        })

    # 2. Run Documentation Linting
    print("\n[RUNNING] Documentation & Architecture Markdown Linting...")
    doc_success, doc_passed, doc_failed, doc_dur, doc_logs = lint_markdown_documents()
    total_duration += doc_dur

    for log in doc_logs:
        print(f"  {log}")

    doc_status = "PASS ✅" if doc_success else "FAIL ❌"
    print(f"[{doc_status}] {doc_passed} checks passed, {doc_failed} failed in {doc_dur:.3f}s")

    # 3. Consolidated Summary Report
    print("\n" + "=" * 75)
    print("📊 Consolidated Verification Summary Report")
    print("=" * 75)
    print(f"{'Component Suite':<35} | {'Passed':<8} | {'Failed':<8} | {'Time (s)':<10} | {'Status'}")
    print("-" * 75)

    all_suites_ok = True
    for r in results:
        status_icon = "PASS ✅" if r["success"] else "FAIL ❌"
        if not r["success"]:
            all_suites_ok = False
        print(f"{r['name']:<35} | {r['passed']:<8} | {r['failed']:<8} | {r['duration']:<10.2f} | {status_icon}")

    doc_icon = "PASS ✅" if doc_success else "FAIL ❌"
    if not doc_success:
        all_suites_ok = False
    print(f"{'Markdown Architecture Linting':<35} | {doc_passed:<8} | {doc_failed:<8} | {doc_dur:<10.3f} | {doc_icon}")

    print("-" * 75)
    overall_status = "ALL SUITES PASSED (100% PASS RATE) 🚀" if all_suites_ok else "VERIFICATION FAILED ❌"
    print(f"Total Automated Tests: {total_passed} passed, {total_failed} failed")
    print(f"Total Doc Checks:      {doc_passed} passed, {doc_failed} failed")
    print(f"Total Wall Clock Time: {total_duration:.2f} seconds")
    print(f"Final Verdict:         {overall_status}")
    print("=" * 75)

    return 0 if all_suites_ok else 1


if __name__ == "__main__":
    sys.exit(main())
