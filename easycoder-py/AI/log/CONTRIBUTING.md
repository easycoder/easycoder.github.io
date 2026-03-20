# Contributing to EasyCoder-py

Thank you for your interest in contributing to EasyCoder-py! This guide will help you get started with the development workflow, including how to work with Git branches and merge changes.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [How to Merge Branches](#how-to-merge-branches)
- [Resolving Merge Conflicts](#resolving-merge-conflicts)
- [Testing Your Changes](#testing-your-changes)
- [Submitting a Pull Request](#submitting-a-pull-request)

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/easycoder-py.git
   cd easycoder-py
   ```
3. **Add upstream remote** to keep your fork synchronized:
   ```bash
   git remote add upstream https://github.com/easycoder/easycoder-py.git
   ```
4. **Install dependencies** (in development mode, allowing you to modify code without reinstalling):
   ```bash
   pip install -e .
   ```
   
   This will install all required dependencies from `pyproject.toml` and make the `easycoder` command available.

## Development Workflow

1. **Keep your main branch up to date**:
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

2. **Create a feature branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and commit them:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

4. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

## Branching Strategy

We follow a simple branching strategy:

- **`main`**: The main development branch, always stable
- **`feature/*`**: Feature branches for new functionality
- **`bugfix/*`**: Branches for bug fixes
- **`hotfix/*`**: Urgent fixes that need immediate attention

## How to Merge Branches

### Merging Main into Your Feature Branch

Before submitting a pull request, you should merge the latest changes from `main` into your feature branch to ensure compatibility:

#### Method 1: Using Merge (Recommended for beginners)

```bash
# Switch to your feature branch
git checkout feature/your-feature-name

# Fetch the latest changes from upstream
git fetch upstream

# Merge main into your feature branch
git merge upstream/main

# If there are conflicts, resolve them (see below)

# Push the merged changes
git push origin feature/your-feature-name
```

#### Method 2: Using Rebase (For cleaner history)

```bash
# Switch to your feature branch
git checkout feature/your-feature-name

# Fetch the latest changes from upstream
git fetch upstream

# Rebase your feature branch onto main
git rebase upstream/main

# If there are conflicts, resolve them (see below)

# Force push the rebased branch (only if you haven't shared this branch)
git push origin feature/your-feature-name --force-with-lease
```

**Note**: Only use `--force-with-lease` if you're sure no one else is working on this branch. It's safer than `--force` as it checks if the remote branch has been updated by someone else.

### Merging Your Feature Branch into Main

This is typically done via a Pull Request on GitHub, but if you're maintaining the repository:

```bash
# Switch to main branch
git checkout main

# Ensure main is up to date
git pull upstream main

# Merge your feature branch
git merge feature/your-feature-name

# Push to main
git push upstream main
```

### Fast-Forward vs. Non-Fast-Forward Merges

- **Fast-forward merge** (default when possible): Moves the branch pointer forward without creating a merge commit
  ```bash
  git merge feature/your-feature-name
  ```

- **Non-fast-forward merge** (creates a merge commit): Preserves branch history
  ```bash
  git merge --no-ff feature/your-feature-name
  ```

## Resolving Merge Conflicts

Conflicts occur when the same lines of code have been modified in both branches. Here's how to resolve them:

1. **Identify conflicted files**:
   ```bash
   git status
   ```
   Look for files marked as "both modified"

2. **Open each conflicted file** and look for conflict markers:
   ```
   <<<<<<< HEAD
   Your changes
   =======
   Changes from the branch being merged
   >>>>>>> feature/your-feature-name
   ```

3. **Resolve the conflict** by:
   - Keeping your changes
   - Keeping their changes
   - Combining both changes
   - Writing something entirely new

4. **Remove the conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`)

5. **Mark the conflict as resolved**:
   ```bash
   git add resolved-file.py
   ```

6. **Complete the merge**:
   - If merging: `git commit`
   - If rebasing: `git rebase --continue`

7. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Example Conflict Resolution

Before resolution:
```python
<<<<<<< HEAD
def greet():
    print("Hello, world!")
=======
def greet():
    print("Hi there!")
>>>>>>> feature/new-greeting
```

After resolution:
```python
def greet():
    print("Hello, world! Hi there!")
```

### Using Merge Tools

You can also use graphical merge tools:

```bash
# Configure your preferred merge tool (e.g., meld, kdiff3, vimdiff)
git config --global merge.tool meld

# Launch the merge tool
git mergetool
```

## Testing Your Changes

Before submitting your changes, always test them:

1. **Run the test suite**:
   
   If you have EasyCoder installed:
   ```bash
   easycoder scripts/tests.ecs
   ```
   
   Or in development mode (without installing):
   ```bash
   python -m easycoder scripts/tests.ecs
   ```

2. **Test your specific changes** with custom scripts

3. **Verify no regressions** by running existing sample scripts:
   
   If you have EasyCoder installed:
   ```bash
   easycoder scripts/fizzbuzz.ecs
   easycoder scripts/benchmark.ecs
   ```
   
   Or in development mode:
   ```bash
   python -m easycoder scripts/fizzbuzz.ecs
   python -m easycoder scripts/benchmark.ecs
   ```

## Submitting a Pull Request

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Go to GitHub** and create a Pull Request from your branch to `easycoder:main`

3. **Fill out the PR template** with:
   - Description of changes
   - Related issues (if any)
   - Testing performed
   - Screenshots (if UI changes)

4. **Respond to review comments** and make requested changes

5. **Once approved**, a maintainer will merge your PR

## Best Practices

- **Commit often** with descriptive messages
- **Keep commits focused** on a single logical change
- **Write clear commit messages**: 
  ```
  Short summary (50 chars or less)
  
  More detailed explanation if needed (wrap at 72 chars).
  Explain what and why, not how.
  ```
- **Test before committing**: Ensure your code works
- **Keep your branch up to date**: Regularly merge main into your feature branch
- **Don't commit generated files**: Use `.gitignore` for build artifacts
- **Document your changes**: Update documentation if you add/change features

## Common Git Commands

### Viewing Changes
```bash
git status              # See modified files
git diff                # See unstaged changes
git diff --staged       # See staged changes
git log                 # View commit history
git log --oneline       # Compact commit history
```

### Branch Management
```bash
git branch              # List local branches
git branch -a           # List all branches (local and remote)
git branch -d branch    # Delete a branch (safe)
git branch -D branch    # Force delete a branch
```

### Undoing Changes
```bash
git checkout -- file    # Discard changes to a file
git reset HEAD file     # Unstage a file
git reset --soft HEAD~1 # Undo last commit, keep changes staged
git reset --hard HEAD~1 # Undo last commit, discard changes
```

### Stashing Changes
```bash
git stash               # Save changes temporarily
git stash list          # List all stashes
git stash apply         # Apply most recent stash
git stash pop           # Apply and remove most recent stash
```

## Getting Help

- **Documentation**: Check the [doc/](doc/) directory for language reference
- **Issues**: Search existing issues or create a new one
- **Questions**: Open a discussion on GitHub

## Code Style

- Follow existing code patterns in the repository
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and concise

## License

By contributing to EasyCoder-py, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to EasyCoder-py! Your efforts help make this project better for everyone.
