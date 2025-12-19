---
name: localstack-fix
description: Fixes a specific LocalStack PR until production ready. Accepts PR number and orchestrates the localstack-fixer agent to resolve all CI/CD failures.
color: orange
model: sonnet
---

# LocalStack Fix Command

Orchestrates the complete LocalStack PR fixing workflow using the localstack-fixer agent.

## Purpose

This command provides a simple interface to fix LocalStack PRs until they are **100% PRODUCTION READY**. It accepts a PR number or branch name and coordinates the fixing process, iterating until ALL quality gates pass and ALL CI/CD jobs succeed.

**Mission**: Fix LocalStack PR until production ready - NO PARTIAL SUCCESS

## Usage

```bash
# Fix PR by number (various formats supported)
/localstack-fix 7179
/localstack-fix Pr7179
/localstack-fix #7179
/localstack-fix LS-7179

# Fix PR by branch name
/localstack-fix localstack-Pr7179

# Fix current branch (if on a LocalStack branch)
/localstack-fix

# Check status only (no fixes)
/localstack-fix --status 7179

# Force retry all failed jobs
/localstack-fix --retry-all 7179
```

## Arguments

- `PR_IDENTIFIER` (optional): Either a PR number (e.g., 7179, Pr7179, LS-7179) or branch name (e.g., localstack-Pr7179)
  - If not provided, uses current branch
  - If number provided, fetches PR details from GitHub
  - If branch name provided, checks out that branch
- `--status`: Only show current CI/CD status, don't apply fixes
- `--retry-all`: Force retry all failed CI/CD jobs after pushing fixes

## Workflow

### Step 1: Parse Arguments and Validate

```bash
# Extract PR identifier from command arguments
PR_IDENTIFIER="${1:-}"
STATUS_ONLY=false
RETRY_ALL=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --status)
      STATUS_ONLY=true
      shift
      ;;
    --retry-all)
      RETRY_ALL=true
      shift
      ;;
    *)
      if [[ -z "$PR_IDENTIFIER" ]] || [[ "$PR_IDENTIFIER" == "--"* ]]; then
        PR_IDENTIFIER="$1"
      fi
      shift
      ;;
  esac
done

# Normalize PR identifier - extract just the number
# Supports: 7179, Pr7179, #7179, LS-7179, LS-Pr7179
PR_NUMBER="${PR_IDENTIFIER#LS-}"
PR_NUMBER="${PR_NUMBER#Pr}"
PR_NUMBER="${PR_NUMBER#\#}"

if [ -z "$PR_NUMBER" ]; then
  # No argument provided, use current branch
  BRANCH_NAME=$(git branch --show-current)

  if [[ "$BRANCH_NAME" == "main" ]] || [[ "$BRANCH_NAME" == "master" ]]; then
    echo "ERROR: Cannot fix main/master branch"
    echo "Usage: /localstack-fix <pr-number|branch-name>"
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

elif [[ "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
  # Argument is a PR number
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

echo ""
echo "═══════════════════════════════════════════════════"
echo "🔧 LOCALSTACK FIX COMMAND"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📋 Target PR: #${PR_NUMBER:-N/A}"
echo "📋 Branch: ${BRANCH_NAME}"
echo ""
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
if [ ! -f "${REPO_ROOT}/.claude/agents/localstack-fixer.md" ]; then
  echo "ERROR: Not in iac-test-automations repository"
  exit 1
fi

# Check LocalStack configuration exists
if [ ! -f "${REPO_ROOT}/.claude/config/localstack.yaml" ]; then
  echo "WARNING: LocalStack config not found, using defaults"
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

# Check provider in metadata if available
if [ -n "$PR_NUMBER" ]; then
  # Fetch metadata from PR branch
  PROVIDER=$(gh api repos/TuringGpt/iac-test-automations/contents/metadata.json?ref=${BRANCH_NAME} \
    --jq '.content | @base64d | fromjson | .provider // "unknown"' 2>/dev/null || echo "unknown")

  if [ "$PROVIDER" != "localstack" ] && [ "$PROVIDER" != "unknown" ]; then
    echo "⚠️ Warning: PR provider is '${PROVIDER}', not 'localstack'"
    echo "This command is intended for LocalStack PRs"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 0
    fi
  fi
fi
```

### Step 4: Invoke localstack-fixer Agent

Now invoke the `localstack-fixer` agent with full context:

**Agent Context**:

```markdown
You are fixing LocalStack PR #${PR_NUMBER:-"(working on branch directly)"} on branch ${BRANCH_NAME}.

${PR_TITLE:+PR Title: ${PR_TITLE}}
${PR_URL:+PR URL: ${PR_URL}}

${FAILING_CHECKS:+
**Failing Checks**:
${FAILING_CHECKS}
}

**MODE**: PR MODE (standalone fix command)

**CRITICAL INSTRUCTIONS**:

1. **Add yourself as assignee**: Add your GitHub user as assignee to PR #${PR_NUMBER}
   - Command: \`gh pr edit ${PR_NUMBER} --add-assignee \$(gh api user --jq '.login')\`

2. **Create isolated worktree**: MUST work in isolated worktree at `worktree/localstack-Pr${PR_NUMBER}`
   - This enables parallel execution of multiple PR fixes
   - Do NOT work directly on the branch
   - Worktree path: `$(git rev-parse --show-toplevel)/worktree/localstack-Pr${PR_NUMBER}`

3. **Sync with main**: Automatically sync branch with main (fetch, rebase if behind)
   - Automatically resolve merge conflicts (accept main's version for scripts/configs)
   - If unresolvable conflicts: Exit with instructions for manual resolution

4. **Fetch and analyze CI/CD job status**:
   - Create complete checklist of all CI/CD pipeline jobs
   - Identify which jobs passed, failed, or are pending
   - For each failed job, fetch logs and identify failure reasons
   - Use this to prioritize fixes

5. **Apply batch fixes based on CI/CD failures**:
   - Identify ALL errors from failed job logs
   - Map errors to known LocalStack fixes (metadata, endpoints, S3 path-style, etc.)
   - Apply ALL fixes in ONE batch commit
   - Re-deploy to LocalStack to verify fixes
   - Iterate if still failing (max 3 iterations per config)

**Your Mission**:

1. Add assignee to PR #${PR_NUMBER}
2. Create isolated worktree at `worktree/localstack-Pr${PR_NUMBER}`
3. **CRITICAL: Sync branch with latest main** (rebase if behind)
4. Fetch CI/CD pipeline status and create job checklist
5. Analyze failed jobs and extract ALL error patterns
6. Map errors to LocalStack-specific fixes
7. Apply ALL fixes in batch (single commit)
8. Push changes and monitor CI/CD re-runs
9. Iterate until all CI/CD jobs pass (max 3 iterations)
10. Report completion status

**Expected Outcome**:

- ✅ Working in isolated worktree (enables parallel execution)
- ✅ **Branch synced with latest main** (no merge conflicts)
- ✅ Complete CI/CD job checklist created
- ✅ All LocalStack-specific issues fixed (endpoints, S3, metadata, etc.)
- ✅ All CI/CD jobs passing
- ✅ 100% test coverage achieved
- ✅ Training quality >= 8
- ✅ PR ready for merge

**Constraints**:

- Maximum 3 fix iterations (batch approach reduces iterations needed)
- MUST work in isolated worktree (never directly on branch)
- Must follow all LocalStack-specific requirements
- MUST continue until ALL CI/CD jobs pass OR escalate

**LocalStack-Specific Fixes to Consider**:

1. **metadata_fix**: Validate/sanitize metadata.json (subtask, subject_labels, provider)
2. **endpoint_config**: Add LocalStack endpoint configuration
3. **s3_path_style**: Configure S3 path-style access
4. **iam_simplify**: Simplify IAM policies for LocalStack
5. **removal_policy**: Add RemovalPolicy.DESTROY for cleanup
6. **jest_config**: Fix Jest test configuration
7. **lint_fix**: Run lint auto-fix
8. **test_fix**: Configure tests for LocalStack endpoints

**Critical Success Criteria**:
You MUST iterate until BOTH conditions are true:

1. ✅ Local validation: All LocalStack deployments succeed
2. ✅ CI/CD validation: ready_for_merge = true (all jobs passing)

If after 3 iterations ANY condition is false:

- Post escalation comment to PR
- Document remaining issues
- Exit with code 2 (BLOCKED - manual intervention)

**Exit Codes** (agent will use):

- 0 = SUCCESS (production ready)
- 1 = ERROR (unrecoverable error, can retry)
- 2 = BLOCKED (manual intervention required)
- 3 = Uses unsupported LocalStack services

**NO PARTIAL SUCCESS** - Either production ready or escalate

Begin the LocalStack fix workflow now.
```

### Step 5: Monitor Agent Progress

The agent will report status at each phase. Monitor for exit codes:

- Exit code `0` = SUCCESS (production ready)
- Exit code `1` = ERROR (unrecoverable, can retry)
- Exit code `2` = BLOCKED (manual intervention)
- Exit code `3` = Unsupported services (cannot fix automatically)

### Step 6: Post-Completion Actions and Verification

After agent completes:

1. **If SUCCESS (100% Production Ready)**:

   ```bash
   echo "✅ LocalStack PR #${PR_NUMBER} is 100% PRODUCTION READY"
   echo ""

   # Verify final status
   echo "🔍 Verifying production readiness..."

   # Check CI/CD status
   CICD_READY=$(gh pr checks "${PR_NUMBER}" --json conclusion \
     --jq 'all(.[]; .conclusion == "success" or .conclusion == "skipped")')

   # Final verification
   if [ "$CICD_READY" == "true" ]; then
     echo ""
     echo "✅ VERIFICATION PASSED"
     echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
     echo "✅ LocalStack Deployment: PASSED"
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
     echo "Agent reported SUCCESS but some checks are not passing"
     echo "CI/CD Ready: ${CICD_READY}"
     echo ""
     echo "Please review the PR and CI/CD logs"
   fi
   ```

2. **If BLOCKED (Manual Intervention Required)**:

   ```bash
   echo "⚠️ LocalStack PR #${PR_NUMBER} BLOCKED - Manual Intervention Required"
   echo ""
   echo "Agent completed maximum iterations (3) but PR is not production ready"
   echo ""
   echo "📋 Common LocalStack Blockers:"
   echo "  - Unsupported AWS services (AppSync, Amplify, EKS - Pro only)"
   echo "  - Complex IAM policies not supported by LocalStack Community"
   echo "  - Service-specific features not implemented in LocalStack"
   echo "  - Metadata validation issues requiring manual review"
   echo ""
   echo "🔍 Review Required:"
   echo "1. Check PR comments for escalation details"
   echo "2. Review remaining issues documented in PR"
   echo "3. Check if services used are supported by LocalStack"
   echo "4. Manual fixes may be required"
   echo ""
   echo "PR URL: ${PR_URL}"
   echo ""
   echo "🚨 Remaining issues require human review and intervention"
   ```

3. **If ERROR (Unrecoverable)**:
   ```bash
   echo "❌ LocalStack PR #${PR_NUMBER} FIX FAILED - Unrecoverable Error"
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
   echo "🔧 Try to resolve the error and run /localstack-fix ${PR_NUMBER} again"
   ```

## Error Handling

### Invalid PR Number

```
ERROR: Could not find PR #<number>
Please verify PR exists: gh pr list
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
WARNING: Agent reached maximum iterations (3)
Some issues may remain unresolved
Review agent report for details
Manual intervention may be required
```

### Unsupported LocalStack Services

```
WARNING: PR uses services not supported by LocalStack Community
Consider upgrading to LocalStack Pro or migrating to supported services
```

## Integration with CI/CD

This command respects all CI/CD requirements:

- LocalStack-specific deployment scripts (`localstack-ci-deploy.sh`, `localstack-ci-test.sh`)
- File location restrictions (`.claude/docs/references/cicd-file-restrictions.md`)
- Commit message format (conventional commits with lowercase)
- Quality gates (build, test, deployment, coverage)
- Training quality threshold (>= 8)

## Common Use Cases

### 1. Fix Failing LocalStack Deployment

```bash
/localstack-fix 7179
```

Agent will identify LocalStack-specific issues and apply fixes.

### 2. Fix LocalStack Endpoint Configuration

```bash
/localstack-fix Pr7179
```

Agent will add proper endpoint configuration for LocalStack.

### 3. Fix S3 Path-Style Issues

```bash
/localstack-fix LS-7179
```

Agent will configure S3 clients to use path-style access.

### 4. Fix Metadata Validation

```bash
/localstack-fix 7179
```

Agent will sanitize metadata.json to pass validation.

### 5. Check Status Only

```bash
/localstack-fix --status 7179
```

Shows current CI/CD status without applying fixes.

## Best Practices

1. **Run on LocalStack PRs**: This command is optimized for LocalStack provider PRs
2. **Review Changes**: Always review agent's changes before merging
3. **Check PR Comments**: Agent adds detailed fix summary as PR comment
4. **Monitor Iterations**: If agent reaches max iterations, manual review needed
5. **Escalate Blockers**: If agent reports BLOCKED, address the issue promptly

## Limitations

- Cannot fix PRs on main/master branch
- Cannot fix merged PRs
- Maximum 3 fix iterations per run (batch approach)
- Some AWS services are not supported by LocalStack Community
- Requires GitHub CLI authentication
- Requires repository write permissions

## Comparison with task-fix

| Feature           | `/task-fix`        | `/localstack-fix`     |
| ----------------- | ------------------ | --------------------- |
| Agent Used        | iac-synth-trainer  | localstack-fixer      |
| Target            | AWS production PRs | LocalStack PRs        |
| Max Iterations    | 10                 | 3 (batch mode)        |
| Deployment Target | Real AWS           | LocalStack            |
| Special Fixes     | Generic IaC        | LocalStack-specific   |
| Branch Format     | synth-{task_id}    | localstack-Pr{number} |

## Troubleshooting

### Agent Stuck in Loop

```bash
# Check agent status
# If looping, review LocalStack logs for unsupported services
# May need to mark as using Pro-only features
```

### LocalStack Deployment Keeps Failing

```bash
# Check if LocalStack is running locally
curl http://localhost:4566/_localstack/health

# Check for unsupported services
# Review .claude/lessons_learnt.md for known LocalStack issues
```

### S3 Bucket Name Errors

```bash
# Ensure S3 path-style access is configured
# Agent should add: forcePathStyle: true
```

## Related Documentation

- `.claude/agents/localstack-fixer.md` - Agent detailed workflow
- `.claude/config/localstack.yaml` - LocalStack configuration
- `.claude/docs/guides/localstack-migration-guide.md` - Migration guide
- `.claude/docs/references/validation-checkpoints.md` - All validation checks
- `.claude/lessons_learnt.md` - Common issues and solutions

## Success Metrics

A successful LocalStack fix workflow results in:

- ✅ All CI/CD checks passing
- ✅ LocalStack deployment successful
- ✅ 100% test coverage
- ✅ Training quality >= 8
- ✅ All files in correct locations
- ✅ Documentation complete
- ✅ PR ready for merge

---

**Note**: This command is designed for automated LocalStack PR fixing. Always review changes before merging to production.
