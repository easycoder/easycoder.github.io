#!/usr/bin/env python3
"""Generate an EasyCoder conformance parity report from test metadata.

This runner is implementation-agnostic. It can:
- Emit a full `skip` report from the canonical test manifest.
- Compare provided actual results to expected outcomes and emit pass/fail/skip.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def normalize_logs(items: list[Any]) -> list[str]:
    return [str(item) for item in items]


def evaluate_test(meta: dict[str, Any], actual: dict[str, Any] | None) -> dict[str, Any]:
    test_id = meta["id"]

    if actual is None:
        return {"id": test_id, "status": "skip", "details": "No actual result provided"}

    expected = meta.get("expect", {})
    expected_logs = normalize_logs(expected.get("logs", []))
    expected_error = expected.get("error")

    actual_logs = normalize_logs(actual.get("logs", []))
    actual_error = actual.get("error")

    pass_logs = actual_logs == expected_logs
    pass_error = actual_error == expected_error

    if pass_logs and pass_error:
        return {"id": test_id, "status": "pass", "actual": {"logs": actual_logs, "error": actual_error}}

    return {
        "id": test_id,
        "status": "fail",
        "actual": {"logs": actual_logs, "error": actual_error},
        "details": {
            "expected": {"logs": expected_logs, "error": expected_error},
            "reason": "Output mismatch",
        },
    }


def build_report(
    conformance_root: Path,
    implementation: str,
    runtime_version: str,
    actuals: dict[str, Any],
) -> dict[str, Any]:
    manifest = load_json(conformance_root / "tests" / "index.json")
    test_files = manifest.get("tests", [])

    results: list[dict[str, Any]] = []
    for test_file in test_files:
        meta = load_json(conformance_root / "tests" / test_file)
        test_id = meta["id"]
        result = evaluate_test(meta, actuals.get(test_id))
        results.append(result)

    summary = {"pass": 0, "fail": 0, "skip": 0}
    for item in results:
        summary[item["status"]] += 1

    return {
        "specVersion": manifest.get("specVersion", "unknown"),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "implementations": {
            implementation: {
                "runtimeVersion": runtime_version,
                "summary": summary,
                "results": results,
            }
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate EasyCoder conformance report")
    parser.add_argument(
        "--conformance-root",
        default="conformance",
        help="Path to conformance folder (default: conformance)",
    )
    parser.add_argument(
        "--implementation",
        required=True,
        help="Implementation key, e.g. js-browser or python-cli",
    )
    parser.add_argument(
        "--runtime-version",
        default="unknown",
        help="Runtime version label",
    )
    parser.add_argument(
        "--actuals",
        default="",
        help="Optional JSON file mapping test id to actual result",
    )
    parser.add_argument(
        "--output",
        default="conformance/parity-report.generated.json",
        help="Output report path",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    conformance_root = Path(args.conformance_root)
    output_path = Path(args.output)

    actuals: dict[str, Any] = {}
    if args.actuals:
        actuals = load_json(Path(args.actuals))

    report = build_report(
        conformance_root=conformance_root,
        implementation=args.implementation,
        runtime_version=args.runtime_version,
        actuals=actuals,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")


if __name__ == "__main__":
    main()
