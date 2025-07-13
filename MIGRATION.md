# Migration Guide - Repository History Cleanup

## Overview

This repository recently underwent a history rewrite to remove accidentally committed files and improve repository hygiene. This guide explains the changes made and the actions required by all collaborators.

## Changes Made

### 1. Updated `.gitignore` Rules

The following rules have been added or updated in the `.gitignore` file:

```gitignore
# dependencies
/node_modules
/.pnp
.pnp.js

# production build
/build
/dist

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE folders
.vscode

# Test coverage
/coverage
```

### 2. History Rewrite

The repository history has been rewritten to:
- Remove the `node_modules` directory from all commits
- Remove the `build` directory from all commits
- Clean up any other files that should have been ignored

## Required Actions for Collaborators

### Option 1: Re-clone the Repository (Recommended)

This is the cleanest approach if you don't have local changes:

```bash
# 1. Backup any local changes you want to keep
cp -r monopolytracker monopolytracker-backup

# 2. Remove the old repository
rm -rf monopolytracker

# 3. Clone the repository fresh
git clone [repository-url]
cd monopolytracker

# 4. Reinstall dependencies
npm install
```

### Option 2: Update Existing Clone

If you have local changes you want to preserve:

```bash
# 1. Stash any uncommitted changes
git stash

# 2. Fetch the latest changes
git fetch origin

# 3. Reset your branch to match the remote
git reset --hard origin/main

# 4. If you have other local branches, update them:
git checkout [branch-name]
git rebase origin/main

# 5. Apply your stashed changes (if any)
git stash pop

# 6. Clean up any untracked files
git clean -fd

# 7. Reinstall dependencies (in case node_modules was affected)
rm -rf node_modules
npm install
```

### Option 3: Force Pull (Alternative Method)

If the above doesn't work:

```bash
# 1. Backup your local changes
git stash

# 2. Force pull from remote
git fetch --all
git reset --hard origin/main

# 3. Clean untracked files
git clean -fd

# 4. Reinstall dependencies
rm -rf node_modules
npm install

# 5. Apply your stashed changes
git stash pop
```

## Important Notes

⚠️ **Warning**: These operations will overwrite your local history. Make sure to:
- Back up any important local changes before proceeding
- Communicate with your team before pushing any changes
- Ensure all team members have migrated before continuing development

## Why This Was Necessary

1. **Repository Size**: The `node_modules` and `build` directories were making the repository unnecessarily large
2. **Performance**: Cloning and fetching were slow due to these large directories
3. **Best Practices**: These directories should never be committed to version control

## Going Forward

To prevent this issue in the future:
1. Always check `.gitignore` before committing
2. Use `git status` to review files before committing
3. Never force-add ignored files unless absolutely necessary
4. Run `npm install` after cloning instead of relying on committed dependencies

## Questions or Issues?

If you encounter any problems during migration:
1. Make sure you've backed up your local changes
2. Try re-cloning the repository as a last resort
3. Contact the repository maintainer if issues persist

---

Last Updated: July 14, 2025
