#!/usr/bin/env python3
"""EasyCoder Python-CLI conformance adapter.

Runs each canonical .ecs test using the installed easycoder runtime, captures log
output and errors, and writes an actuals JSON file suitable for use with
run_conformance.py --actuals.

Usage:
    python3 conformance/ec_py_runner.py \
        --conformance-root conformance \
        --output conformance/actuals-python-cli.json
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path
from typing import Any


# Pattern for log output:  HH:MM:SS.fraction:scriptname:lino->value
_LOG_RE = re.compile(r"^\d{2}:\d{2}:\d{2}\.\d+:[^:]+:\d+->(.*)")
# Pattern for compile error
_COMPILE_ERR_RE = re.compile(r"^Compile error in (.+?) at line (\d+)")
# Pattern for runtime error (broad)
_RUNTIME_ERR_RE = re.compile(r"^(RuntimeError|FatalError|Error during execution)")


def run_script(script_path: Path) -> dict[str, Any]:
    """Invoke the EasyCoder runtime on script_path and capture output.

    A temp file with `exit` appended is used so the Python CLI runtime
    terminates without hanging. The canonical .ecs scripts do not include exit
    so they remain implementation-neutral.
    """
    import tempfile, os
    buf = io.StringIO()
    try:
        from easycoder import Main as ECMain  # local import to keep module-level clean
    except ImportError:
        return {"logs": [], "error": {"category": "setup", "message": "easycoder package not installed"}}

    # Build a temporary script with `exit` appended for CLI termination
    source = script_path.read_text(encoding="utf-8")
    with tempfile.NamedTemporaryFile(mode="w", suffix=".ecs", delete=False, encoding="utf-8") as tmp:
        tmp.write(source)
        if not source.rstrip().endswith("exit"):
            tmp.write("\nexit\n")
        tmp_path = tmp.name

    saved_argv = sys.argv[:]
    sys.argv = ["ec", tmp_path]

    try:
        with redirect_stdout(buf), redirect_stderr(buf):
            ECMain()
    except SystemExit:
        pass
    except Exception as exc:
        sys.argv = saved_argv
        os.unlink(tmp_path)
        return {"logs": [], "error": {"category": "runtime", "message": str(exc)}}
    finally:
        sys.argv = saved_argv
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    raw = buf.getvalue()
    return parse_output(raw)



def parse_output(raw: str) -> dict[str, Any]:
    logs: list[str] = []
    error: dict[str, Any] | None = None

    for line in raw.splitlines():
        log_m = _LOG_RE.match(line)
        if log_m:
            logs.append(log_m.group(1))
            continue
        compile_m = _COMPILE_ERR_RE.match(line)
        if compile_m:
            error = {"category": "compile", "message": line}
            continue
        runtime_m = _RUNTIME_ERR_RE.match(line)
        if runtime_m:
            error = {"category": "runtime", "message": line}

    return {"logs": logs, "error": error}


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    parser = argparse.ArgumentParser(description="EasyCoder Python-CLI conformance adapter")
    parser.add_argument("--conformance-root", default="conformance")
    parser.add_argument("--output", default="conformance/actuals-python-cli.json")
    args = parser.parse_args()

    root = Path(args.conformance_root)
    manifest = load_json(root / "tests" / "index.json")

    actuals: dict[str, Any] = {}
    for test_file in manifest.get("tests", []):
        meta = load_json(root / "tests" / test_file)
        test_id = meta["id"]
        script_path = root / "tests" / meta["script"]

        print(f"  Running {test_id} ({meta['script']}) ...", end=" ")
        if not script_path.exists():
            print("SKIP (script not found)")
            continue

        result = run_script(script_path)
        actuals[test_id] = result

        status = "error" if result["error"] else f"{len(result['logs'])} log(s)"
        print(status)

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as f:
        json.dump(actuals, f, indent=2)
        f.write("\n")

    print(f"\nActuals written to: {output}")


if __name__ == "__main__":
    main()
