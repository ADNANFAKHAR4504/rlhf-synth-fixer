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

1. **Phase 0 - Pre-Execution Validation**: Review documentation, verify scripts, validate readiness
2. **Phase 1 - PR Selection**: Check availability, atomically select next PR (prevents duplicates)
3. **Phase 2.0 - Pre-Fix Analysis**: Document root cause, fix plan, and solution approach
4. **Phase 2.2 - Worktree Setup**: Create isolated worktree, validate location
5. **Phase 2.4 - Failure Analysis**: Analyze GitHub pipeline failures in detail
6. **Phase 2.5 - Pre-Deployment Validation**: Run pre-validate-iac.sh before deployment (cost optimization)
7. **Phase 2.5+ - Apply Fixes**: Fix issues stage by stage (Detect → Lint → Build → Deploy → Test)
8. **Phase 2.6 - Local Validation**: Validate all fixes locally (lint, build, test, deploy)
9. **Phase 2.6.5 - Quality Gates**: Verify all quality gates pass before marking fixed
10. **Phase 2.7 - Commit & Push**: Commit fixes and push to PR branch
11. **Phase 2.8 - Monitor Pipeline**: Wait for ALL GitHub pipeline stages to pass
12. **Phase 2.11 - Update Status**: Mark as fixed/failed with detailed progress tracking
13. **Phase 2.10 - Cleanup**: Remove worktrees after completion

## Parallel Execution Support

**NEW**: Multiple agents can now work on different PRs simultaneously!

- ✅ **Thread-safe PR selection** using file locking
- ✅ **No duplicate work** - each agent gets a unique PR
- ✅ **Real-time visibility** - see what other agents are doing
- ✅ **Automatic coordination** - agents skip PRs in progress

### How to Run Multiple Agents

```bash
# Terminal 1 - Start first agent
/task-fix

# Terminal 2 - Start second agent (in parallel)
/task-fix

# Terminal 3 - Check status of both agents
bash .claude/scripts/pr-status.sh active
```

Each agent will:
1. Atomically select the next available PR
2. Mark it as "in_progress" (other agents skip it)
3. Fix it independently in isolated worktrees
4. Update progress in real-time

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

## Visibility & Monitoring

### Check Agent Activity

```bash
# Quick overview of all PRs
bash .claude/scripts/pr-status.sh summary

# See what agents are currently working on
bash .claude/scripts/pr-status.sh active

# View available PRs for fixing
bash .claude/scripts/pr-status.sh available

# Get detailed info about specific PR (including root cause & plan)
bash .claude/scripts/pr-status.sh pr 6323

# View statistics
bash .claude/scripts/pr-status.sh stats
```

### Understanding PR Status

PRs can have these **agent_status** values:

- **pending**: Available for agents to work on
- **in_progress**: Currently being fixed by an agent
- **fixed**: Successfully fixed (all pipeline stages passed)
- **failed**: Could not be fixed automatically
- **skipped**: Intentionally skipped

### What's Tracked

For each PR being fixed, the system tracks:

- **Root Cause Analysis**: Why the PR failed (specific issues)
- **Fix Plan**: Step-by-step approach to fix it
- **Solution Approach**: Why this is the best solution
- **Progress Updates**: Current step in the fix process
- **Agent Assignment**: Which agent is working on it
- **Timestamps**: When started, when completed
- **Iterations**: How many fix attempts were made

### Example: Viewing Active Work

```bash
$ bash .claude/scripts/pr-status.sh active

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Active Agent Activity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Active agents: 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PR #6323: Lint, Deploy

🤖 Agent: agent-12345-hostname
⏰ Started: 2024-01-01T10:00:00Z
📊 Progress: Applying deploy fixes

🔍 Root Cause:
Missing environmentSuffix in S3 bucket name at line 45

📋 Fix Plan:
1. Add environmentSuffix to S3 bucket name
2. Update RemovalPolicy to DESTROY
3. Redeploy and validate

💡 Solution Approach:
Systematic resource name updates following lessons_learnt.md
```

## Workflow

The PR fixer agent follows a structured workflow with validation checkpoints and quality gates at each stage:

### Phase 0: Pre-Execution Validation
**Checkpoint PR-A**: Pre-Execution Validation
- Review required documentation:
  - `lessons_learnt.md` - Common failure patterns and fixes
  - `pre-submission-checklist.md` - Quality requirements
  - `cicd-file-restrictions.md` - File location rules
  - `error-handling.md` - Error handling patterns (if available)
- Verify required scripts exist and are functional:
  - `.claude/scripts/pr-manager.sh` - PR locking and status management
  - `.claude/scripts/pr-status.sh` - Visibility and monitoring
  - `scripts/pre-validate-iac.sh` - Pre-deployment validation
- Validate agent readiness
- **Pass criteria**: All documentation reviewed, all scripts functional
- **Fail action**: Report BLOCKED, install missing scripts, re-validate

### Phase 1: PR Selection & Analysis
- Check PR availability
- Atomically select next PR (with locking)
- Load PR details and failure information

### Phase 2: PR Fixing Process

#### 2.0 Pre-Fix Analysis
**Checkpoint PR-C**: Failure Analysis Completeness
**Checkpoint PR-D**: Fix Plan Validation
**Quality Gate 1**: Pre-Fix Analysis Gate

- Root cause analysis with evidence:
  - Failure category (Critical/High/Medium/Low)
  - Specific issues with file paths and line numbers
  - Evidence from GitHub logs and code inspection
  - WHY it happened (not just WHAT)
- Fix plan development (step-by-step):
  - Specific actions with file paths
  - Validation method for each step
  - Addresses all failed stages
- Solution approach justification:
  - Why this is the best approach
  - Alternatives considered
  - Risks and mitigations
  - Success criteria
- Document analysis in status file

**Pass criteria**: All analysis documented, plan is actionable, saved to status file
**Fail action**: Re-analyze, improve documentation, re-validate

#### 2.2 Worktree Setup
**Checkpoint PR-B**: PR Worktree Validation

- Create isolated worktree at `worktree/pr-fix-<PR_NUMBER>`
- Validate worktree location and branch match
- Extract metadata and platform info
- Verify ready for fixes

**Pass criteria**: Worktree at correct location, branch matches, metadata available
**Fail action**: Remove worktree, recreate, re-validate

#### 2.4 Failure Analysis
- Fetch GitHub pipeline logs
- Identify specific failed stages
- Extract error details and error messages
- Reference lessons_learnt.md for common patterns

#### 2.4.5 Pre-Fix Build Validation (Baseline)
**Checkpoint PR-D2**: Pre-Fix Build Validation

- Establish baseline before fixes:
  - Lint baseline (errors/warnings count)
  - Build baseline (errors count)
  - Synth baseline (errors count, if applicable)
- Document baseline for comparison
- Purpose: Measure improvement after fixes

**Note**: This is informational only - does not block fixes

#### 2.5 Pre-Deployment Validation
**Checkpoint PR-E**: Pre-Deployment Validation
**Quality Gate 2**: Pre-Deployment Gate

- Run `scripts/pre-validate-iac.sh`
- Fix common errors automatically:
  - Add environmentSuffix to resource names
  - Change RemovalPolicy.RETAIN to RemovalPolicy.DESTROY
  - Disable DeletionProtection
  - Remove hardcoded environment values
- Re-validate after fixes
- **Cost optimization**: Saves 2-3 deployment attempts (~15% token reduction)

**Pass criteria**: Pre-validation passes OR common errors fixed
**Fail action**: Fix issues, re-run validation, continue after pass

#### 2.5+ Apply Fixes
- Fix each failed stage in order:
  1. Detect Project Files (if metadata.json missing)
  2. Lint (auto-fix, then manual if needed)
  3. Build (fix compilation errors)
  4. Synth (fix template generation, if applicable)
  5. Deploy (with environmentSuffix, no Retain policies)
  6. Unit Testing (achieve 100% coverage)
  7. Integration Testing (use real AWS outputs)
- Validate fixes locally after each stage
- Reference lessons_learnt.md for common fixes

#### 2.6 Local Validation
**Checkpoint PR-F**: Post-Fix Validation

- Run all validations:
  - Lint: Zero errors
  - Build: Successful compilation
  - Synth: Successful template generation (if applicable)
  - Unit tests: All passing with 100% coverage
  - Integration tests: All passing (if deployed)
- Verify 100% test coverage (statements, functions, lines)
- Ensure all checks pass

**Pass criteria**: All validations passed, 100% coverage achieved
**Fail action**: Report BLOCKED, fix failures, re-run validations

#### 2.6.5 Quality Gates
**Quality Gates 1-5**: All quality gates validation

Run all quality gates systematically:
1. **Pre-Fix Analysis Gate**: Analysis complete and documented
2. **Pre-Deployment Gate**: Pre-validation passed, common errors fixed
3. **File Location Compliance Gate**: All files in allowed directories
4. **Pre-Submission Check Gate**: Pre-submission check passed (if available)
5. **Post-Fix Local Validation Gate**: All local validations passed

**Pass criteria**: ALL 5 gates passed
**Fail action**: Report BLOCKED, list failed gates, fix issues, re-validate

**Critical**: Cannot proceed to commit if ANY gate fails

#### 2.7 Commit & Push
- Commit fixes with descriptive conventional commit message
- Include fix details, validation results, iteration count
- Push to PR branch
- Update status: Changes pushed

#### 2.8 Monitor Pipeline
**Checkpoint PR-G**: GitHub Pipeline Validation

- Wait for GitHub Actions to start and complete
- Monitor all pipeline stages:
  - Detect Project Files
  - Lint
  - Build
  - Deploy
  - Unit Testing
  - Integration Testing
  - Claude Review (if applicable)
- Verify ALL stages pass (green checkmarks)
- Iterate if needed (max 5 iterations)

**Pass criteria**: All GitHub pipeline stages passed
**Fail action**: If iteration < 5, analyze new failures and iterate; if iteration >= 5, mark as needs-manual-review

#### 2.10 Cleanup
- Return to main repository
- Remove worktree: `git worktree remove worktree/pr-fix-<PR_NUMBER> --force`
- Verify cleanup successful

#### 2.11 Update Status
- Mark PR as fixed (if all stages passed) or failed (if max iterations reached)
- Update status file with:
  - Final status
  - Iterations count
  - Fix details
  - Timestamp
- Add GitHub comment with results
- Add labels (auto-fixed or needs-manual-review)

### Phase 3: Final Summary
- Report summary of all PRs processed
- Statistics and failure patterns
- Recommendations

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

## Validation Checkpoints

The agent uses structured validation checkpoints throughout the process to ensure systematic validation at each stage. These are documented in detail in `.claude/docs/references/pr-fix-checkpoints.md`.

### Critical Checkpoints

- **Checkpoint PR-A**: Pre-Execution Validation (Phase 0)
  - Documentation reviewed (lessons_learnt.md, pre-submission-checklist.md, cicd-file-restrictions.md)
  - Required scripts verified (pr-manager.sh, pr-status.sh, pre-validate-iac.sh)
  - Agent readiness confirmed

- **Checkpoint PR-B**: PR Worktree Validation (Phase 2.2)
  - Worktree location verified (worktree/pr-fix-<PR_NUMBER>)
  - Branch matches PR branch
  - Metadata available

- **Checkpoint PR-C**: Failure Analysis Completeness (Phase 2.0)
  - Root cause documented with evidence
  - Fix plan created with actionable steps
  - Solution approach justified
  - Analysis saved to status file

- **Checkpoint PR-D**: Fix Plan Validation (Phase 2.0)
  - Plan has specific file paths and line numbers
  - Plan includes validation steps
  - Plan addresses all failed stages
  - Plan is executable

- **Checkpoint PR-D2**: Pre-Fix Build Validation (Phase 2.4.5)
  - Baseline lint status assessed
  - Baseline build status assessed
  - Baseline synth status assessed (if applicable)
  - Baseline documented for comparison

- **Checkpoint PR-E**: Pre-Deployment Validation (Phase 2.5)
  - Pre-validate-iac.sh executed
  - Common errors fixed (environmentSuffix, Retain policies, DeletionProtection)
  - Ready for deployment attempts
  - **Cost Impact**: Saves 2-3 deployment attempts (~15% token reduction)

- **Checkpoint PR-F**: Post-Fix Validation (Phase 2.6)
  - All local validations passed (lint, build, synth, test, deploy)
  - Test coverage: 100% (statements, functions, lines)
  - Ready for quality gates

- **Checkpoint PR-G**: GitHub Pipeline Validation (Phase 2.8)
  - All GitHub pipeline stages passed (Detect, Lint, Build, Deploy, Unit Testing, Integration Testing)
  - PR marked as fixed or failed appropriately
  - Status file updated

### Checkpoint Details

For detailed validation steps, pass criteria, and failure actions for each checkpoint, see:
- **`.claude/docs/references/pr-fix-checkpoints.md`** - Complete PR fix checkpoint documentation

Each checkpoint must pass before proceeding to the next phase.

## Quality Gates

Before marking a PR as fixed, ALL quality gates must pass. These gates ensure fixes meet production standards and will pass GitHub pipeline.

### Gate 1: Pre-Fix Analysis Gate
**When**: After Phase 2.0 (Root Cause Analysis)
**Requirements**:
- ✅ Root cause documented with evidence
  - Failure category (Critical/High/Medium/Low)
  - Specific issues with file paths and line numbers
  - Impact assessment
  - WHY it happened (not just WHAT)
- ✅ Fix plan created with actionable steps
  - Step-by-step actions
  - Validation method for each step
  - Addresses all failed stages
- ✅ Solution approach justified
  - Why this is the best approach
  - Alternatives considered
  - Success criteria defined
- ✅ Analysis saved to status file

**If gate fails**: Report BLOCKED, complete missing analysis, re-validate

### Gate 2: Pre-Deployment Gate
**When**: Phase 2.5 (Before any deployment attempt)
**Requirements**:
- ✅ Pre-deployment validation executed (scripts/pre-validate-iac.sh)
- ✅ Common errors fixed:
  - Resource naming includes environmentSuffix
  - No hardcoded environment values (prod-, dev-, stage-)
  - No Retain policies (changed to DESTROY)
  - No DeletionProtection enabled
  - No expensive configurations flagged
- ✅ Valid cross-resource references

**If gate fails**: Fix common issues, re-run pre-validation, proceed only after pass

**Impact**: Saves 2-3 deployment attempts per PR (~15% cost reduction)

### Gate 3: File Location Compliance Gate
**When**: Phase 2.6.5 (Before commit)
**Requirements**:
- ✅ All files in allowed directories:
  - Infrastructure code: `lib/`
  - Tests: `test/` or `tests/`
  - Entry points: `bin/`
  - Documentation: `lib/` (NOT root)
- ✅ No files in forbidden locations:
  - NOT in `.github/`, `scripts/`, `docs/`, `.claude/`
  - NOT at root (except allowed: metadata.json, cdk.json, package.json, etc.)
- ✅ Documentation files in lib/:
  - `lib/PROMPT.md` (NOT `/PROMPT.md`)
  - `lib/README.md` (NOT `/README.md`)
  - Lambda functions in `lib/lambda/` (NOT `/lambda/`)

**If gate fails**: 
- Report BLOCKED with specific violations
- Move files to correct locations
- Re-validate
- **Impact**: -3 training quality points per violation

**Reference**: `.claude/docs/references/cicd-file-restrictions.md`

### Gate 4: Pre-Submission Check Gate (Optional)
**When**: Phase 2.6.5 (Before commit)
**Requirements**:
- ✅ Pre-submission check script exists and passes
- ✅ All checks from pre-submission-checklist.md validated

**If gate fails**: Fix issues identified by check, re-run, re-validate

**If script not found**: Log warning, skip gate (not blocking)

**Reference**: `.claude/docs/references/pre-submission-checklist.md`

### Gate 5: Post-Fix Local Validation Gate
**When**: Phase 2.6 (After all fixes applied)
**Requirements**:
- ✅ Lint: Zero errors
- ✅ Build: Successful compilation
- ✅ Synth: Successful template generation (if applicable)
- ✅ Unit tests: All passing with **100% coverage**
  - Statement coverage: 100%
  - Function coverage: 100%
  - Line coverage: 100%
  - Branch coverage: ≥95%
- ✅ Integration tests: All passing (if deployment succeeded)
  - Use real AWS outputs (cfn-outputs/flat-outputs.json)
  - No mocking libraries
  - No hardcoded values

**If gate fails**: Report BLOCKED, fix issues, re-run validations, re-validate

**Critical**: 100% test coverage is MANDATORY, not optional

### Quality Gates Summary

If ANY gate fails, the agent will:
1. Report BLOCKED status with specific failures
2. List what needs to be fixed
3. Stop execution until fixes applied
4. Re-validate after fixes
5. Only proceed when ALL gates pass

### Quality Gate Validation Script

The agent runs all quality gates systematically in Phase 2.6.5 before committing changes. See `.claude/agents/iac-synth-trainer.md` Phase 2.6.5 for the complete validation script.

### Cost Optimization Impact

**Pre-Deployment Gate (Gate 2)**:
- Prevents unnecessary AWS deployment attempts
- Catches common errors before deployment
- Saves 2-3 deployment attempts per PR
- Reduces token usage by ~15%
- Saves 10-15 minutes per PR

### References

- **Quality Gate Details**: `.claude/agents/iac-synth-trainer.md` Phase 2.6.5
- **Checkpoint Details**: `.claude/docs/references/pr-fix-checkpoints.md`
- **File Restrictions**: `.claude/docs/references/cicd-file-restrictions.md`
- **Pre-Submission Checklist**: `.claude/docs/references/pre-submission-checklist.md`

## Safety & Constraints

1. **No Force Push**: Always create new commits, never rewrite history
2. **Preserve Authorship**: Maintain original commit authors
3. **Branch Protection**: Never modify main/master directly
4. **Resource Limits**: 
   - Max 5 deployment attempts per PR
   - Max 5 fix iterations per PR
   - Max 3 retries for critical blockers
5. **Commit Convention**: Follow conventional commits format (lowercase subject)
6. **File Restrictions**: Only modify files in allowed directories (lib/, test/, bin/)
7. **Pre-Deployment Validation**: Mandatory before deployment attempts (saves costs)
8. **Quality Gates**: All gates must pass before marking PR as fixed
9. **Test Coverage**: 100% coverage required (statements, functions, lines)
10. **Error Handling**: Standard error response format, blocking vs non-blocking classification

## Integration with Existing Workflow

This command integrates with your existing IaC workflow:

- Uses same validation scripts as `/task-coordinator`
- Follows same quality gates (lint, build, test, deploy)
- Respects same file restrictions
- Uses same reporting format
- Updates same tracking files

## Error Handling

The agent uses standardized error handling patterns:

### Error Categories

**Blocking Errors** (Stop Execution):
- Missing required files or scripts
- GitHub authentication failure
- Pre-deployment validation failures (critical)
- Quality gate failures
- File location violations
- Test coverage below 100%

**Non-Blocking Errors** (Log and Continue):
- AWS credentials not configured (skip deployment fixes)
- Pre-validation warnings (non-critical)
- Minor code style issues

### Error Response Format

When errors occur:
1. Report status: `❌ BLOCKED: {specific_error}` or `⚠️ WARNING: {non_blocking_issue}`
2. List issues: Specific problems with details
3. Explain context: Why this blocks progress
4. Provide fix: Reference to resolution steps
5. Stop execution: Do NOT proceed past blocking errors

### Recovery Actions

- **Validation Errors**: Fix missing/invalid items, re-validate
- **Deployment Errors**: Retry with fixes (max 5 attempts)
- **Test Errors**: Add tests until 100% coverage achieved
- **Pipeline Errors**: Analyze failures, apply fixes, iterate

### If PR Cannot Be Fixed

After max iterations or critical blockers:
- Document failure reason in PR comment
- Add "needs-manual-review" label
- Update status file with failure details
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

## PR Management Scripts

### pr-manager.sh - PR Locking & Selection

Thread-safe PR management with file locking:

```bash
# Atomically select next PR (used by agent internally)
bash .claude/scripts/pr-manager.sh select-and-update mayanksethi-turing

# Manually update PR status
bash .claude/scripts/pr-manager.sh update-status 6323 in_progress "Fixing lint issues"

# Document analysis (used by agent)
bash .claude/scripts/pr-manager.sh update-analysis 6323 \
  "Root cause..." "Fix plan..." "Solution approach..."

# Check status distribution
bash .claude/scripts/pr-manager.sh status
```

### pr-status.sh - Visibility & Monitoring

View agent activity and PR details:

```bash
# All commands
bash .claude/scripts/pr-status.sh summary      # Overview
bash .claude/scripts/pr-status.sh active       # Active agents
bash .claude/scripts/pr-status.sh available    # Available PRs
bash .claude/scripts/pr-status.sh pr 6323      # Detailed PR info
bash .claude/scripts/pr-status.sh fixed        # Successfully fixed
bash .claude/scripts/pr-status.sh failed-fix   # Could not fix
bash .claude/scripts/pr-status.sh stats        # Statistics
```

## Troubleshooting Parallel Execution

### Problem: Agent says "no PRs available" but I see failed PRs

**Cause**: Other agents may have already claimed those PRs

**Solution**: Check active agents
```bash
bash .claude/scripts/pr-status.sh active
```

### Problem: Agent is stuck or crashed, PR still marked "in_progress"

**Cause**: Agent didn't clean up properly

**Solution**: Manually reset PR status
```bash
# Reset to pending
bash .claude/scripts/pr-manager.sh update-status 6323 pending "Reset after agent crash"
```

### Problem: Lock timeout after 120 seconds

**Cause**: Another agent holds the lock (still selecting/updating)

**Solution**: Wait and retry, or check for stale locks
```bash
# Check if lock file exists
ls -la .claude/synth_pr_status.json.lock

# If stale (>5 minutes old), the script will auto-remove it
# Or manually remove: rm -rf .claude/synth_pr_status.json.lock
```

### Problem: Want to see root cause/plan for a specific PR

**Solution**: Use detailed PR view
```bash
bash .claude/scripts/pr-status.sh pr 6323
```

This shows:
- Root cause analysis
- Fix plan
- Solution approach
- Current progress
- Agent assignment

## Best Practices

### For Parallel Execution

1. **Check before starting**: Run `pr-status.sh summary` to see available PRs
2. **Monitor progress**: Use `pr-status.sh active` to see what's happening
3. **Don't force**: If no PRs available, other agents are working on them
4. **Review analysis**: Check `pr-status.sh pr <number>` to understand fixes

### For Single Agent

1. **Generate fresh status**: Run `fetch_all_prs.py` before starting
2. **Review analysis**: The agent documents root cause before fixing
3. **Check progress**: Status updates show which stage the agent is on
4. **Trust the process**: Agent validates everything locally before pushing

## Related Commands and Documentation

### Commands
- `/task-coordinator`: Create new IaC tasks
- `bash .claude/scripts/fetch_all_prs.py`: Generate/update PR status file
- `bash .claude/scripts/pr-status.sh`: Monitor agent activity
- `bash .claude/scripts/pr-manager.sh`: Manage PR status (advanced)

### Documentation References
- **Agent Documentation**: `.claude/agents/iac-synth-trainer.md` - Complete agent behavior
- **Validation Checkpoints**: `.claude/docs/references/pr-fix-checkpoints.md` - PR-specific checkpoints
- **Standard Checkpoints**: `.claude/docs/references/validation-checkpoints.md` - Standard validation checkpoints
- **Quality Requirements**: `.claude/docs/references/pre-submission-checklist.md` - Quality gates and requirements
- **File Restrictions**: `.claude/docs/references/cicd-file-restrictions.md` - File location rules
- **Error Handling**: `.claude/docs/references/error-handling.md` - Error patterns and recovery (if available)
- **Known Issues**: `.claude/lessons_learnt.md` - Common failure patterns and fixes (if available)
