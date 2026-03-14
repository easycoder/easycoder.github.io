#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
sync_script="$script_dir/sync-shared-to-py.sh"

target_repo="$repo_root/../easycoder-py"
push_after_commit=0
message=""

while [[ $# -gt 0 ]]; do
	case "$1" in
		--target)
			target_repo="$2"
			shift 2
			;;
		--message)
			message="$2"
			shift 2
			;;
		--push)
			push_after_commit=1
			shift
			;;
		*)
			echo "Unknown argument: $1" >&2
			exit 1
			;;
	esac
done

if [[ ! -x "$sync_script" ]]; then
	echo "Sync script missing or not executable: $sync_script" >&2
	exit 1
fi

if [[ ! -d "$target_repo/.git" ]]; then
	echo "Target is not a git repo: $target_repo" >&2
	exit 1
fi

if [[ -n "$(git -C "$target_repo" status --short)" ]]; then
	echo "Target repo has uncommitted changes. Commit/stash first:" >&2
	git -C "$target_repo" status --short >&2
	exit 1
fi

"$sync_script" "$target_repo"

git -C "$target_repo" add spec conformance
if git -C "$target_repo" diff --cached --quiet; then
	echo "No shared artifact changes to commit in $target_repo"
	exit 0
fi

if [[ -z "$message" ]]; then
	source_sha="$(git -C "$repo_root" rev-parse --short HEAD)"
	message="Sync shared artifacts from easycoder.github.io @ ${source_sha}"
fi

git -C "$target_repo" commit -m "$message"

echo "Committed shared artifact sync in $target_repo"

if [[ "$push_after_commit" -eq 1 ]]; then
	branch="$(git -C "$target_repo" rev-parse --abbrev-ref HEAD)"
	git -C "$target_repo" push origin "$branch"
	echo "Pushed $branch to origin"
fi
