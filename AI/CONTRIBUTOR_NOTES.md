# Contributor Notes

- 2026-03-14: Shared language contract and conformance baseline added under `spec/` and `conformance/`.
- Canonical test set starts at `conformance/tests/EC-0001` through `EC-0005` with JSON expectations and manifest at `conformance/tests/index.json`.
- Prefer extending this test set before changing runtime behavior across implementations.
- 2026-03-14: Added `spec/easycoder-plugin-contract.md` to normalize plugin interface expectations between JS and Python runtimes.
- 2026-03-14: Use `scripts/easycoder/sync-shared-to-py.sh` to mirror shared `spec/` and `conformance/` artifacts into a sibling `easycoder-py` checkout instead of copying files by hand.
- 2026-03-14: `RELEASE_NOTES.md` is repo-specific and should not be mirrored by the sync script.
