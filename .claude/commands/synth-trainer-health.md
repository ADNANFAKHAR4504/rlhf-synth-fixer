---
name: synth-trainer-health
description: Validates synth-trainer configuration and dependencies before running fixes
color: green
model: sonnet
---

# Synth Trainer Health Check

Validates all dependencies, configuration, and prerequisites before running PR fixes.

## Purpose

Run this command before using `/task-fix` to ensure your environment is properly configured and all required components are available.

## Usage

```bash
/synth-trainer-health
```

## Health Check Workflow

### Step 1: Check Required Scripts

```bash
echo "🏥 Running Synth Trainer Health Check..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0
WARNINGS=0

echo "📋 Checking required scripts..."

REQUIRED_SCRIPTS=(
    ".claude/scripts/verify-worktree.sh"
    ".claude/scripts/validate-metadata.sh"
    ".claude/scripts/validate-code-platform.sh"
    ".claude/scripts/pre-submission-check.sh"
    ".claude/scripts/cicd-job-checker.sh"
    ".claude/scripts/code-health-check.sh"
    ".claude/scripts/retry-operation.sh"
    ".claude/scripts/setup-worktree.sh"
    ".claude/scripts/add-assignee.sh"
    ".claude/scripts/wait-for-cicd.sh"
    ".claude/scripts/validate-file-path.sh"
    ".claude/scripts/post-fix-comment.sh"
    ".claude/scripts/logger.sh"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        # Check if script is executable or can be run with bash
        if bash -n "$script" 2>/dev/null; then
            echo "  ✅ $script"
        else
            echo "  ⚠️  $script (syntax error)"
            ((WARNINGS++))
        fi
    else
        echo "  ❌ Missing: $script"
        ((ERRORS++))
    fi
done
```

### Step 2: Check Configuration Files

```bash
echo ""
echo "📋 Checking configuration files..."

CONFIG_FILES=(
    ".claude/config/synth-trainer.yaml"
    ".claude/agents/iac-synth-trainer.md"
    ".claude/commands/task-fix.md"
    ".claude/docs/policies/iteration-policy.md"
    ".claude/docs/references/validation-checkpoints.md"
    ".claude/lessons_learnt.md"
)

for config in "${CONFIG_FILES[@]}"; do
    if [ -f "$config" ]; then
        echo "  ✅ $config"
    else
        echo "  ⚠️  Missing: $config"
        ((WARNINGS++))
    fi
done

# Validate YAML config if it exists
if [ -f ".claude/config/synth-trainer.yaml" ]; then
    if command -v yq &>/dev/null; then
        if yq '.' ".claude/config/synth-trainer.yaml" &>/dev/null; then
            echo "  ✅ Configuration YAML is valid"
        else
            echo "  ❌ Configuration YAML has syntax errors"
            ((ERRORS++))
        fi
    else
        echo "  ⚠️  yq not installed, skipping YAML validation"
    fi
fi
```

### Step 3: Check Required Tools

```bash
echo ""
echo "📋 Checking required tools..."

declare -A REQUIRED_TOOLS=(
    ["git"]="Version control"
    ["gh"]="GitHub CLI"
    ["jq"]="JSON processor"
    ["node"]="Node.js runtime"
    ["npm"]="Node package manager"
)

for tool in "${!REQUIRED_TOOLS[@]}"; do
    if command -v "$tool" &>/dev/null; then
        version=$("$tool" --version 2>/dev/null | head -1 || echo "installed")
        echo "  ✅ $tool - $version"
    else
        echo "  ❌ $tool not found (${REQUIRED_TOOLS[$tool]})"
        ((ERRORS++))
    fi
done

# Optional but recommended tools
OPTIONAL_TOOLS=(
    "yq:YAML processor"
    "aws:AWS CLI"
    "pulumi:Pulumi CLI"
    "cdk:AWS CDK CLI"
)

echo ""
echo "📋 Checking optional tools..."

for tool_info in "${OPTIONAL_TOOLS[@]}"; do
    tool="${tool_info%%:*}"
    description="${tool_info#*:}"
    if command -v "$tool" &>/dev/null; then
        echo "  ✅ $tool ($description)"
    else
        echo "  ⚠️  $tool not found ($description) - may be needed for some tasks"
    fi
done
```

### Step 4: Check GitHub CLI Authentication

```bash
echo ""
echo "📋 Checking GitHub CLI authentication..."

if command -v gh &>/dev/null; then
    if gh auth status &>/dev/null; then
        GH_USER=$(gh api user --jq '.login' 2>/dev/null || echo "unknown")
        echo "  ✅ GitHub CLI authenticated as: $GH_USER"
        
        # Check repository access
        if gh repo view &>/dev/null; then
            REPO_NAME=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)
            echo "  ✅ Repository access: $REPO_NAME"
        else
            echo "  ⚠️  Cannot access repository (check permissions)"
            ((WARNINGS++))
        fi
    else
        echo "  ❌ GitHub CLI not authenticated"
        echo "     Run: gh auth login"
        ((ERRORS++))
    fi
else
    echo "  ❌ GitHub CLI not installed"
    ((ERRORS++))
fi
```

### Step 5: Check Git Repository State

```bash
echo ""
echo "📋 Checking Git repository state..."

if git rev-parse --is-inside-work-tree &>/dev/null; then
    BRANCH=$(git branch --show-current)
    echo "  ✅ Inside Git repository"
    echo "  ✅ Current branch: $BRANCH"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "  ⚠️  Uncommitted changes detected"
        ((WARNINGS++))
    else
        echo "  ✅ Working directory clean"
    fi
    
    # Check if main/master exists
    if git show-ref --verify --quiet refs/heads/main; then
        echo "  ✅ Main branch exists"
    elif git show-ref --verify --quiet refs/heads/master; then
        echo "  ✅ Master branch exists"
    else
        echo "  ⚠️  No main/master branch found"
        ((WARNINGS++))
    fi
    
    # Check remote
    if git remote get-url origin &>/dev/null; then
        REMOTE=$(git remote get-url origin)
        echo "  ✅ Remote origin: $REMOTE"
    else
        echo "  ❌ No remote origin configured"
        ((ERRORS++))
    fi
else
    echo "  ❌ Not inside a Git repository"
    ((ERRORS++))
fi
```

### Step 6: Check Worktree Directory

```bash
echo ""
echo "📋 Checking worktree directory..."

WORKTREE_DIR="worktree"

if [ -d "$WORKTREE_DIR" ]; then
    WORKTREE_COUNT=$(ls -1 "$WORKTREE_DIR" 2>/dev/null | wc -l)
    echo "  ✅ Worktree directory exists"
    echo "  ℹ️  Active worktrees: $WORKTREE_COUNT"
    
    # List active worktrees
    if [ "$WORKTREE_COUNT" -gt 0 ]; then
        echo ""
        echo "     Active worktrees:"
        for wt in "$WORKTREE_DIR"/*; do
            if [ -d "$wt" ]; then
                WT_NAME=$(basename "$wt")
                WT_BRANCH=$(cd "$wt" && git branch --show-current 2>/dev/null || echo "unknown")
                echo "       - $WT_NAME (branch: $WT_BRANCH)"
            fi
        done
    fi
else
    echo "  ℹ️  Worktree directory doesn't exist (will be created on first use)"
fi

# Check git worktree list
echo ""
echo "  Git worktree status:"
git worktree list 2>/dev/null | while read line; do
    echo "     $line"
done
```

### Step 7: Summary

```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Health Check Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed!"
    echo ""
    echo "🎯 Ready to fix PRs with /task-fix <PR_NUMBER>"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Passed with $WARNINGS warning(s)"
    echo ""
    echo "🎯 Can proceed with /task-fix <PR_NUMBER>"
    echo "   Review warnings above for optimal experience"
    exit 0
else
    echo "❌ Health check failed with $ERRORS error(s) and $WARNINGS warning(s)"
    echo ""
    echo "🔧 Fix the errors above before running /task-fix"
    echo ""
    echo "Common fixes:"
    echo "  - GitHub auth: gh auth login"
    echo "  - Missing tools: brew install <tool> or npm install -g <tool>"
    echo "  - Repository issues: git remote add origin <url>"
    exit 1
fi
```

## Quick Fixes for Common Issues

### GitHub CLI Not Authenticated
```bash
gh auth login
```

### Missing jq
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

### Missing yq (optional)
```bash
# macOS
brew install yq

# pip
pip install yq
```

### Stale Worktrees
```bash
# List all worktrees
git worktree list

# Remove stale worktree
git worktree remove worktree/synth-<task_id> --force

# Prune stale worktree references
git worktree prune
```

## Related Commands

- `/task-fix <PR_NUMBER>` - Fix a PR until production ready
- `/task-coordinator` - Full task generation workflow

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed (ready to proceed) |
| 1 | Errors found (fix before proceeding) |

