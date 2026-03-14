#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
target_repo="${1:-$repo_root/../easycoder-py}"

if [[ ! -d "$target_repo" ]]; then
	echo "Target repo not found: $target_repo" >&2
	exit 1
fi

if [[ ! -d "$target_repo/.git" ]]; then
	echo "Target is not a git repo: $target_repo" >&2
	exit 1
fi

copy_file() {
	local source="$1"
	local target="$2"
	mkdir -p "$(dirname "$target")"
	cp "$source" "$target"
	echo "Synced $(realpath --relative-to="$repo_root" "$source")"
}

copy_tree() {
	local source="$1"
	local target="$2"
	rm -rf "$target"
	mkdir -p "$target"
	cp -r "$source"/. "$target"/
	echo "Synced $(realpath --relative-to="$repo_root" "$source")/"
}

copy_file "$repo_root/spec/README.md" "$target_repo/spec/README.md"
copy_file "$repo_root/spec/easycoder-language-contract.md" "$target_repo/spec/easycoder-language-contract.md"
copy_file "$repo_root/spec/easycoder-plugin-contract.md" "$target_repo/spec/easycoder-plugin-contract.md"
copy_file "$repo_root/spec/easycoder-versioning-policy.md" "$target_repo/spec/easycoder-versioning-policy.md"

copy_file "$repo_root/conformance/README.md" "$target_repo/conformance/README.md"
copy_file "$repo_root/conformance/runner-contract.md" "$target_repo/conformance/runner-contract.md"
copy_file "$repo_root/conformance/run_conformance.py" "$target_repo/conformance/run_conformance.py"
copy_file "$repo_root/conformance/parity-report-template.json" "$target_repo/conformance/parity-report-template.json"
copy_file "$repo_root/conformance/parity-report.initial.json" "$target_repo/conformance/parity-report.initial.json"
copy_file "$repo_root/conformance/plugin-interface-matrix.json" "$target_repo/conformance/plugin-interface-matrix.json"
copy_tree "$repo_root/conformance/tests" "$target_repo/conformance/tests"

echo "Shared EasyCoder artifacts synced to $target_repo"