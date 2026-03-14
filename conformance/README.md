# EasyCoder Conformance Tests

This folder contains implementation-neutral language tests.

Layout:
- `tests/`: canonical test scripts (`.ecs`) and metadata (`.json`).
- `runner-contract.md`: shared runner input/output expectations.
- `parity-report-template.json`: report schema template.
- `parity-report.initial.json`: starter report before first execution.
- `run_conformance.py`: parity report generator from test metadata + optional actuals.
- `plugin-interface-matrix.json`: JS/Python plugin interface capability mapping.

Quick usage:
- `python3 conformance/run_conformance.py --implementation js-browser`
- `python3 conformance/run_conformance.py --implementation python-cli --actuals my-actuals.json`

Actuals file format:
- JSON object keyed by test id.
- Value shape: `{ "logs": ["..."], "error": null }`.

Execution model:
- Each implementation runs the same `.ecs` scripts.
- Harness compares actual output/errors against each `.json` expectation.

Result categories:
- `pass`: behavior matches expected result.
- `fail`: behavior differs from expected result.
- `skip`: unsupported by current implementation target (must be justified).

Future work:
- Add plugin behavior conformance tests on top of interface mapping.
- Promote plugin contract from Draft 0.1 after behavior tests exist.
