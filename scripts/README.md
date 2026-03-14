 # EasyCoder scripts
 
 Miscellaneous scripts that may mean little out of context.

Notable helper:
- `easycoder/sync-shared-to-py.sh`: sync shared `spec/` and `conformance/` artifacts from `easycoder.github.io` into a sibling `easycoder-py` checkout. Repo-specific files such as `RELEASE_NOTES.md` are intentionally excluded.
- `easycoder/publish-shared-to-py.sh`: run sync, create a commit in `easycoder-py` for changed shared artifacts, and optionally push.

Suggested single-home workflow:
- Make shared contract/conformance edits in `easycoder.github.io`.
- Run `./scripts/easycoder/publish-shared-to-py.sh`.
- Use `--push` when ready to publish the mirror commit.
