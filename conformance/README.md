# EasyCoder Conformance Tests

This folder contains implementation-neutral language tests.

Layout:
- `tests/`: canonical test scripts (`.ecs`) and metadata (`.json`).
- `runner-contract.md`: shared runner input/output expectations.
- `parity-report-template.json`: report schema template.
- `parity-report.initial.json`: starter report before first execution.

Execution model:
- Each implementation runs the same `.ecs` scripts.
- Harness compares actual output/errors against each `.json` expectation.

Result categories:
- `pass`: behavior matches expected result.
- `fail`: behavior differs from expected result.
- `skip`: unsupported by current implementation target (must be justified).

Future work:
- Add JS-browser runner.
- Add Python CLI runner.
- Publish parity report in CI.
