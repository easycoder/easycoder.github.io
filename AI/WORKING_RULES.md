# Working Rules for AI Contributors

## Primary goal
Fix or implement requested behavior with minimal collateral change.

## Repo-specific rules
- Use Webson for UI structure updates in `doclets.json`
- Use EasyCoder scripts for behavior and flow updates
- Keep IDs stable unless all attach/click references are updated
- Prefer explicit state handling over hidden side effects

## Build/update rules
If you edit EasyCoder component JS files used in build-easycoder:
1. update file(s)
2. run `build-easycoder` in easycoder repo
3. verify doclets uses the intended dist file (minified vs unminified)

## Symlink workflow
This repo may use local symlinks to EasyCoder sources and dist files.
Use `relink-easycoder.sh` to refresh links.

## Debug checklist
- UI glyphs/text appearing unexpectedly: inspect literal HTML around script tags
- "engine not loaded": verify corresponding script include is active
- startup state issues: verify initialization order plus post-load recompute

## Document as you go
Add short notes for any non-obvious fix that would save another AI 15+ minutes.
