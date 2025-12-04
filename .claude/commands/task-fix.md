---
name: task-fix
description: Fixes a specific PR until production ready. Accepts PR number or branch name as argument and orchestrates comprehensive fix workflow.
color: purple
model: sonnet
---

# Task Fix Command

Orchestrates the complete PR fixing workflow using the iac-synth-trainer agent.

## Purpose

This command provides a simple interface to fix PRs until they are **100% PRODUCTION READY**. It accepts a PR number or branch name and coordinates the fixing process, iterating until ALL quality gates pass and ALL CI/CD jobs succeed.

**Mission**: Fix PR until production ready - NO PARTIAL SUCCESS

## Usage

```bash
# Fix PR by number
/task-fix 1234

# Fix PR by branch name
/task-fix synth-abc123

# Fix current branch
/task-fix
```

## Arguments

- `PR_IDENTIFIER` (optional): Either a PR number (e.g., 1234) or branch name (e.g., synth-abc123)
  - If not provided, uses current branch
  - If number provided, fetches PR details from GitHub
  - If branch name provided, checks out that branch

## Workflow

### Step 1: Parse Arguments and Validate

```bash
# Extract PR identifier from command arguments
PR_IDENTIFIER="${1:-}"

if [ -z "$PR_IDENTIFIER" ]; then
  # No argument provided, use current branch
  BRANCH_NAME=$(git branch --show-current)

  if [[ "$BRANCH_NAME" == "main" ]] || [[ "$BRANCH_NAME" == "master" ]]; then
    echo "ERROR: Cannot fix main/master branch"
    echo "Usage: /task-fix <pr-number|branch-name>"
    exit 1
  fi

  echo "Using current branch: ${BRANCH_NAME}"

  # Try to find PR number for this branch
  PR_NUMBER=$(gh pr list --head "${BRANCH_NAME}" --json number -q '.[0].number')

  if [ -z "$PR_NUMBER" ]; then
    echo "WARNING: No PR found for branch ${BRANCH_NAME}"
    echo "Will work on branch directly without PR context"
  else
    echo "Found PR #${PR_NUMBER} for branch ${BRANCH_NAME}"
  fi

elif [[ "$PR_IDENTIFIER" =~ ^[0-9]+$ ]]; then
  # Argument is a PR number
  PR_NUMBER="$PR_IDENTIFIER"
  echo "Fetching PR #${PR_NUMBER} details..."

  # Get branch name for this PR
  BRANCH_NAME=$(gh pr view "${PR_NUMBER}" --json headRefName -q '.headRefName')

  if [ -z "$BRANCH_NAME" ]; then
    echo "ERROR: Could not find PR #${PR_NUMBER}"
    exit 1
  fi

  echo "PR #${PR_NUMBER} is on branch: ${BRANCH_NAME}"

else
  # Argument is a branch name
  BRANCH_NAME="$PR_IDENTIFIER"
  echo "Using branch: ${BRANCH_NAME}"

  # Try to find PR number for this branch
  PR_NUMBER=$(gh pr list --head "${BRANCH_NAME}" --json number -q '.[0].number')

  if [ -z "$PR_NUMBER" ]; then
    echo "WARNING: No PR found for branch ${BRANCH_NAME}"
    echo "Will work on branch directly without PR context"
  else
    echo "Found PR #${PR_NUMBER} for branch ${BRANCH_NAME}"
  fi
fi

# Extract task_id from branch name (format: synth-{task_id})
if [[ "$BRANCH_NAME" =~ ^synth-(.+)$ ]]; then
  TASK_ID="${BASH_REMATCH[1]}"
  echo "Task ID: ${TASK_ID}"
else
  echo "ERROR: Branch name must follow format 'synth-{task_id}'"
  echo "Found: ${BRANCH_NAME}"
  exit 1
fi
```

### Step 2: Validate Prerequisites

```bash
# Check GitHub CLI is authenticated
if ! gh auth status &>/dev/null; then
  echo "ERROR: GitHub CLI not authenticated"
  echo "Run: gh auth login"
  exit 1
fi

# Check we're in the correct repository
REPO_ROOT=$(git rev-parse --show-toplevel)
if [ ! -f "${REPO_ROOT}/.claude/agents/iac-synth-trainer.md" ]; then
  echo "ERROR: Not in iac-test-automations repository"
  exit 1
fi

echo "✅ Prerequisites validated"
```

### Step 3: Prepare Context for Agent

```bash
# Gather current PR status if available
if [ -n "$PR_NUMBER" ]; then
  echo "Gathering PR context..."

  PR_TITLE=$(gh pr view "${PR_NUMBER}" --json title -q '.title')
  PR_STATE=$(gh pr view "${PR_NUMBER}" --json state -q '.state')
  PR_URL=$(gh pr view "${PR_NUMBER}" --json url -q '.url')

  # Get PR checks status
  CHECKS_STATUS=$(gh pr checks "${PR_NUMBER}" --json state,conclusion 2>/dev/null || echo "No checks")

  echo "PR #${PR_NUMBER}: ${PR_TITLE}"
  echo "State: ${PR_STATE}"
  echo "URL: ${PR_URL}"
  echo "Checks: ${CHECKS_STATUS}"
fi

# Check if PR has failing checks
if [ -n "$PR_NUMBER" ]; then
  FAILING_CHECKS=$(gh pr checks "${PR_NUMBER}" --json name,state,conclusion \
    --jq '.[] | select(.conclusion == "failure" or .state == "failure") | .name' 2>/dev/null || echo "")

  if [ -n "$FAILING_CHECKS" ]; then
    echo "⚠️ Failing checks detected:"
    echo "$FAILING_CHECKS"
  fi
fi
```

### Step 4: Invoke iac-synth-trainer Agent

Now invoke the `iac-synth-trainer` agent with full context:

**Agent Context**:
```markdown
You are fixing PR #${PR_NUMBER:-"(working on branch directly)"} on branch ${BRANCH_NAME}.

Task ID: ${TASK_ID}

${PR_TITLE:+PR Title: ${PR_TITLE}}
${PR_URL:+PR URL: ${PR_URL}}

${FAILING_CHECKS:+
**Failing Checks**:
${FAILING_CHECKS}
}

**CRITICAL INSTRUCTIONS**:

1. **Add yourself as assignee**: Add your GitHub user as assignee to PR #${PR_NUMBER}
   - Command: \`gh pr edit ${PR_NUMBER} --add-assignee \$(gh api user --jq '.login')\`

2. **Create isolated worktree and sync with main**: MUST work in isolated worktree at \`worktree/synth-${TASK_ID}\`
   - This enables parallel execution of multiple PR fixes
   - Do NOT work directly on the branch
   - Worktree path: \`$(git rev-parse --show-toplevel)/worktree/synth-${TASK_ID}\`
   - **Automatically sync branch with main** (fetch, rebase if behind)
   - **Automatically resolve merge conflicts** (accept main's version for scripts/configs)
   - If unresolvable conflicts: Exit with instructions for manual resolution

3. **Fetch and analyze CI/CD job status**:
   - Create complete checklist of all CI/CD pipeline jobs
   - Identify which jobs passed, failed, or are pending
   - For each failed job, fetch logs and identify failure reasons
   - Use this to prioritize fixes

4. **Apply fixes based on CI/CD failures**:
   - Fix issues in priority order based on CI/CD job failures
   - Re-run local validations to verify fixes
   - Push changes and monitor CI/CD re-runs
   - Iterate until all jobs pass

**Your Mission**:
1. Add assignee to PR #${PR_NUMBER}
2. Create isolated worktree at \`worktree/synth-${TASK_ID}\`
3. **CRITICAL: Sync branch with latest main** (rebase if behind)
4. Fetch CI/CD pipeline status and create job checklist
5. Analyze failed jobs and identify failure reasons
6. Apply fixes systematically based on CI/CD failures
7. Iterate until all CI/CD jobs pass
8. Update the PR with fixes and summary
9. Report completion status

**Expected Outcome**:
- ✅ Assignee added to PR
- ✅ Working in isolated worktree (enables parallel execution)
- ✅ **Branch synced with latest main** (no merge conflicts)
- ✅ Complete CI/CD job checklist created
- ✅ All CI/CD jobs passing
- ✅ All 12 quality gates passing
- ✅ 100% test coverage achieved
- ✅ Training quality >= 8
- ✅ PR ready for merge

**Constraints**:
- Maximum 10 fix iterations (will iterate until production ready)
- Maximum 5 deployment attempts per iteration
- MUST work in isolated worktree (never directly on branch)
- Must follow all production requirements
- MUST continue until ALL CI/CD jobs pass OR escalate

**Critical Success Criteria**:
You MUST iterate until BOTH conditions are true:
1. ✅ Local validation: pre-submission-check.sh exits with code 0
2. ✅ CI/CD validation: ready_for_merge = true (all jobs passing)

If after 10 iterations ANY condition is false:
- Post escalation comment to PR
- Document remaining issues
- Exit with code 2 (BLOCKED - manual intervention)

**Exit Codes** (agent will use):
- 0 = SUCCESS (production ready)
- 1 = ERROR (unrecoverable error, can retry)
- 2 = BLOCKED (manual intervention required)

**NO PARTIAL SUCCESS** - Either production ready or escalate

Begin the fix workflow now.
```

### Step 5: Monitor Agent Progress

The agent will report status at each phase. Monitor for exit codes:
- Exit code `0` = SUCCESS (production ready)
- Exit code `1` = ERROR (unrecoverable, can retry)
- Exit code `2` = BLOCKED (manual intervention)

### Step 6: Post-Completion Actions and Verification

After agent completes:

1. **If SUCCESS (100% Production Ready)**:
   ```bash
   echo "✅ PR #${PR_NUMBER} is 100% PRODUCTION READY"
   echo ""

   # Verify final status
   echo "🔍 Verifying production readiness..."

   # Check local validations
   cd worktree/synth-${TASK_ID}
   bash .claude/scripts/pre-submission-check.sh
   LOCAL_STATUS=$?

   # Check CI/CD status
   bash .claude/scripts/cicd-job-checker.sh ${PR_NUMBER}
   CICD_READY=$(jq -r '.ready_for_merge' cicd_summary.json)

   # Final verification
   if [ $LOCAL_STATUS -eq 0 ] && [ "$CICD_READY" == "true" ]; then
     echo ""
     echo "✅ VERIFICATION PASSED"
     echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
     echo "✅ Local Validations: PASSED"
     echo "✅ CI/CD Pipeline: ALL JOBS PASSING"
     echo "✅ Test Coverage: 100%"
     echo "✅ Training Quality: >= 8"
     echo "✅ Ready for Merge: TRUE"
     echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
     echo ""
     echo "PR URL: ${PR_URL}"
     echo ""
     echo "🎯 Next Steps:"
     echo "1. Review PR comments for all fixes applied"
     echo "2. Request reviews: gh pr ready ${PR_NUMBER}"
     echo "3. Merge when approved: gh pr merge ${PR_NUMBER}"
   else
     echo ""
     echo "⚠️ VERIFICATION FAILED"
     echo "Agent reported SUCCESS but verification shows issues"
     echo "Local Status: ${LOCAL_STATUS}"
     echo "CI/CD Ready: ${CICD_READY}"
     echo ""
     echo "This should not happen - please review agent logs"
     exit 1
   fi
   ```

2. **If BLOCKED (Manual Intervention Required)**:
   ```bash
   echo "⚠️ PR #${PR_NUMBER} BLOCKED - Manual Intervention Required"
   echo ""
   echo "Agent completed maximum iterations (10) but PR is not production ready"
   echo ""
   echo "📋 Status:"

   # Show what's passing and what's failing
   cd worktree/synth-${TASK_ID}
   bash .claude/scripts/pre-submission-check.sh 2>&1 | grep -E "✅|❌"

   echo ""
   echo "🔍 Review Required:"
   echo "1. Check PR comments for escalation details"
   echo "2. Review remaining issues documented in PR"
   echo "3. Review validation logs"
   echo "4. Manual fixes may be required"
   echo ""
   echo "PR URL: ${PR_URL}"
   echo ""
   echo "🚨 Remaining issues require human review and intervention"
   ```

3. **If ERROR (Unrecoverable)**:
   ```bash
   echo "❌ PR #${PR_NUMBER} FIX FAILED - Unrecoverable Error"
   echo ""
   echo "Agent encountered critical errors preventing completion"
   echo ""
   echo "Review agent report above for details"
   echo "Common causes:"
   echo "  - Git/GitHub authentication issues"
   echo "  - Worktree creation failures"
   echo "  - Permission issues"
   echo "  - Repository access problems"
   echo ""
   echo "PR URL: ${PR_URL}"
   echo ""
   echo "🔧 Try to resolve the error and run /task-fix ${PR_NUMBER} again"
   ```

## Error Handling

### Invalid PR Number
```
ERROR: Could not find PR #<number>
Please verify PR exists: gh pr list
```

### Invalid Branch Name
```
ERROR: Branch name must follow format 'synth-{task_id}'
Found: <branch-name>
```

### Not Authenticated
```
ERROR: GitHub CLI not authenticated
Run: gh auth login
```

### PR Already Merged
```
ERROR: PR #<number> is already merged
Cannot apply fixes to merged PR
```

### Maximum Iterations Reached
```
WARNING: Agent reached maximum iterations (10)
Some issues may remain unresolved
Review agent report for details
Manual intervention may be required
```

## Integration with CI/CD

This command respects all CI/CD requirements:
- File location restrictions (`.claude/docs/references/cicd-file-restrictions.md`)
- Commit message format (conventional commits with lowercase)
- Quality gates (build, test, deployment, coverage)
- Training quality threshold (>= 8)

## Common Use Cases

### 1. Fix Failing CI/CD Checks
```bash
/task-fix 1234
```
Agent will identify failing checks and apply fixes.

### 2. Improve Test Coverage
```bash
/task-fix synth-abc123
```
Agent will add tests to reach 100% coverage.

### 3. Fix Deployment Issues
```bash
/task-fix 1234
```
Agent will analyze deployment failures and apply fixes.

### 4. Improve Training Quality Score
```bash
/task-fix 1234
```
Agent will review code and improve quality to reach >= 8.

### 5. Fix File Location Violations
```bash
/task-fix synth-abc123
```
Agent will move files to correct directories.

## Best Practices

1. **Run on Draft PRs First**: Test fixes on draft PRs before final PRs
2. **Review Changes**: Always review agent's changes before merging
3. **Check PR Comments**: Agent adds detailed fix summary as PR comment
4. **Monitor Iterations**: If agent reaches max iterations, manual review needed
5. **Escalate Blockers**: If agent reports BLOCKED, address the issue promptly

## Limitations

- Cannot fix PRs on main/master branch
- Cannot fix merged PRs
- Maximum 10 fix iterations per run (configurable in `.claude/config/synth-trainer.yaml`)
- Maximum 5 deployment attempts per iteration
- Requires GitHub CLI authentication
- Requires repository write permissions
- Run `/synth-trainer-health` to verify prerequisites before use

## Troubleshooting

### Agent Stuck in Loop
```bash
# Check agent status
# If looping, review validation failures
# May need manual intervention for architectural issues
```

### Deployment Keeps Failing
```bash
# Check AWS credentials
# Review .claude/lessons_learnt.md for known issues
# May need quota increase or permission changes
```

### Test Coverage Not Reaching 100%
```bash
# Agent will add tests automatically
# If still failing, check for untestable code (platform limitations)
# May need code refactoring
```

## Related Documentation

- `.claude/agents/iac-synth-trainer.md` - Agent detailed workflow
- `.claude/docs/references/validation-checkpoints.md` - All validation checks
- `.claude/docs/references/pre-submission-checklist.md` - Requirements before PR merge
- `.claude/docs/policies/iteration-policy.md` - Fix iteration rules
- `.claude/lessons_learnt.md` - Common issues and solutions

## Success Metrics

A successful fix workflow results in:
- ✅ All CI/CD checks passing
- ✅ 100% test coverage
- ✅ Training quality >= 8
- ✅ All files in correct locations
- ✅ Documentation complete
- ✅ PR ready for merge

---

**Note**: This command is designed for automated PR fixing. Always review changes before merging to production.
