# EasyCoder Versioning And Release Policy (Draft 0.1)

Status: Draft
Version: 0.1
Applies to:
- EasyCoder JS browser runtime (`easycoder.github.io`)
- EasyCoder Python CLI runtime (`easycoder-py`)

## Purpose

Define a single versioning model so language-spec changes, runtime changes, and
conformance changes are tracked consistently across both repositories.

## Version Streams

EasyCoder uses three version streams that must be recorded together in release
notes.

1. Language spec version
- Format: `MAJOR.MINOR`
- Source of truth: `spec/easycoder-language-contract.md`
- Bump `MINOR` for backward-compatible additions.
- Bump `MAJOR` for breaking semantic changes.

2. Runtime version
- JS browser runtime: `EasyCoder.version` in `dist/easycoder.js`.
- Python CLI runtime: package version (for example from wheel metadata / flit).
- Runtime versioning scheme may remain implementation-specific.

3. Conformance suite version
- Tied to language spec version for required tests.
- Required tests for a spec revision must be listed in `conformance/tests/index.json`.

## Compatibility Declaration

An implementation can declare compatibility with spec `X.Y` only when:
- all `required` conformance tests targeting `X.Y` pass, and
- any optional gaps are documented in release notes.

## Release Note Requirements

Each release note entry should include:
- Date (UTC)
- Repository (`easycoder.github.io` or `easycoder-py`)
- Runtime version (if changed)
- Target spec version
- Conformance summary (`pass/fail/skip`)
- Notable behavior or interface changes

## Minimal Entry Template

```text
## YYYY-MM-DD
- Repo: <repo-name>
- Runtime: <runtime-version or unchanged>
- Spec: <major.minor>
- Conformance: pass <n>, fail <n>, skip <n>
- Notes:
  - <change 1>
  - <change 2>
```

## Cross-Repo Alignment Rule

When a spec or conformance contract changes in one repo, mirror the same change
in the other repo in the same workstream.
