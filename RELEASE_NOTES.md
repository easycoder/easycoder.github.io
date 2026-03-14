# Release Notes

This file tracks cross-repo convergence milestones for EasyCoder JS and Python
implementations.

## 2026-03-14
- Repo: easycoder.github.io
- Runtime: EasyCoder.version `250824` (unchanged in this workstream)
- Spec: `0.1`
- Conformance: pass 5, fail 0, skip 0 (`js-browser`)
- Notes:
  - Added shared language contract and canonical conformance suite (`EC-0001` to `EC-0005`).
  - Added JS-browser conformance runner (`conformance/ec_js_runner.js`) and CI integration.
  - Added shared plugin interface contract and plugin interface matrix artifact.
  - Added shared versioning and release policy under `spec/`.
