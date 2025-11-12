# Task Fix - Synthetic PR Auto-Fixer

Automatically fixes failed PRs assigned to you by analyzing GitHub pipeline failures and applying targeted corrections.

## Overview

This command launches the `iac-synth-trainer` agent to automatically fix your assigned PRs that have failed CI/CD checks. It creates a worktree for each PR, analyzes the specific GitHub pipeline failure, applies fixes, validates the solution, and only marks the PR as complete when ALL pipeline stages pass.

## Quick Start

```bash
# 1. Generate your PR status file
python .claude/scripts/fetch_all_prs.py --assignee mayanksethi-turing --output .claude/synth_pr_status.json

# 2. Run the fixer
/task-fix
```

## Command Behavior

When you run `/task-fix`, the agent will:

1. **Load your PRs**: Read from `.claude/synth_pr_status.json`
2. **Filter failed PRs**: Only process PRs with FAILED status assigned to you
3. **Process sequentially**: Fix one PR at a time in worktrees
4. **Validate completely**: Ensure ALL GitHub pipeline stages pass
5. **Clean up**: Remove worktrees after completion
6. **Track progress**: Update `synth_pr_status.json` with results

## Prerequisites

Before running `/task-fix`:

### 1. GitHub Authentication
```bash
gh auth status
# If not authenticated:
gh auth login
```

### 2. AWS Credentials (for deployment fixes)
```bash
aws sts get-caller-identity
# Should show your AWS account
```

### 3. Clean Workspace
```bash
git status
# Should show clean working tree
# If not:
git stash  # or commit changes
```

### 4. Generate Status File
```bash
# Create your personal PR status file
python .claude/scripts/fetch_all_prs.py --assignee mayanksethi-turing --output .claude/synth_pr_status.json

# Verify it was created
cat .claude/synth_pr_status.json | jq '.summary'
```

## Options

```bash
/task-fix [options]
```

### Available Options

- **No arguments**: Fix ALL your failed PRs sequentially
- `--pr <number>`: Fix specific PR number only
- `--type <failure_type>`: Fix only PRs with specific failure (Deploy, Lint, Unit Testing, Build, etc.)
- `--limit <n>`: Process only first N failed PRs
- `--dry-run`: Analyze PRs and show fix plan without making changes

### Examples

```bash
# Fix all your failed PRs
/task-fix

# Fix specific PR
/task-fix --pr 6323

# Fix only deployment failures
/task-fix --type Deploy

# Fix first 3 failed PRs
/task-fix --limit 3

# See what would be fixed without making changes
/task-fix --dry-run
```

## Workflow

The PR fixer agent will:

1. **Analyze**: Read `open_pr_status.json` and identify target PRs
2. **Prioritize**: Group PRs by failure type and complexity
3. **Process Each PR**:
   - Fetch PR branch
   - Identify specific failure reasons
   - Apply targeted fixes
   - Run validation (lint/build/test/deploy)
   - Push fixes if successful
   - Update PR with fix summary
4. **Report**: Summary of fixed, failed, and skipped PRs

## Failure Type Handling

### Deploy Failures
- Check AWS credentials and permissions
- Validate resource naming conventions
- Fix environmentSuffix issues
- Resolve resource conflicts
- Fix template syntax errors
- Address quota/limit issues

### Unit Testing Failures
- Fix test assertions
- Update mocks and fixtures
- Achieve 100% code coverage
- Fix import/module issues
- Address async/timing issues

### Lint Failures
- Run platform-specific linters
- Fix formatting issues
- Resolve type errors
- Fix import ordering
- Address unused variables/imports

### Build Failures
- Fix compilation errors
- Resolve dependency issues
- Fix type mismatches
- Address module resolution

### Detect Project Files Failures
- Ensure metadata.json exists
- Validate platform detection
- Fix missing configuration files

## Safety & Constraints

1. **No Force Push**: Always create new commits, never rewrite history
2. **Preserve Authorship**: Maintain original commit authors
3. **Branch Protection**: Never modify main/master directly
4. **Resource Limits**: Max 5 deployment attempts per PR
5. **Commit Convention**: Follow conventional commits format
6. **File Restrictions**: Only modify files in allowed directories (lib/, test/, bin/)

## Integration with Existing Workflow

This command integrates with your existing IaC workflow:

- Uses same validation scripts as `/task-coordinator`
- Follows same quality gates (lint, build, test, deploy)
- Respects same file restrictions
- Uses same reporting format
- Updates same tracking files

## Error Handling

If a PR cannot be fixed:
- Document failure reason in PR comment
- Add "needs-manual-review" label
- Update assignee notification
- Continue to next PR

## Post-Fix Actions

After successful fix:
- Push commits to PR branch
- Add comment with fix summary
- Request re-review if needed
- Trigger CI/CD re-run

## Reporting

Final report includes:
- Total PRs analyzed
- Successfully fixed (with PR numbers)
- Failed to fix (with reasons)
- Skipped (with reasons)
- Time taken per PR
- Common failure patterns identified
- Recommendations for preventing future failures

## Related Commands

- `/task-coordinator`: Create new IaC tasks
- See `.claude/scripts/fetch_all_prs.py`: Update PR status
- See `.claude/docs/references/error-handling.md`: Error patterns
- See `.claude/lessons_learnt.md`: Known issues and fixes
