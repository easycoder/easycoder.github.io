# EasyCoder Shared Specification

This folder defines the implementation-agnostic EasyCoder language contract.

Goals:
- Keep one canonical description of language behavior.
- Let multiple runtimes (browser JS, Python CLI) target the same behavior.
- Drive conformance tests from spec statements.

Structure:
- `easycoder-language-contract.md`: normative behavior and compatibility policy.
- `easycoder-plugin-contract.md`: shared plugin/domain interface contract and JS/Python mapping.
- `easycoder-versioning-policy.md`: shared versioning and release-note rules across runtimes.

Versioning:
- Spec versions use `MAJOR.MINOR`.
- Runtimes declare which spec version they implement.
