# PR Fix Validation Checkpoints

Standardized validation checkpoints for PR fixing workflow used by the `iac-synth-trainer` agent. These checkpoints ensure systematic validation at each stage of the PR fix process.

## Overview

These checkpoints are specifically designed for the PR fixing workflow (task-fix command) and complement the standard validation checkpoints used for new task creation.

**Key Differences from Standard Checkpoints:**
- PR-specific: Focus on analyzing, fixing, and validating failed PRs
- Iterative: Support multiple fix iterations with validation
- GitHub-centric: Include pipeline monitoring and status validation
- Cost-optimized: Include pre-deployment validation to reduce unnecessary AWS deployments

---

## Checkpoint PR-A: Pre-Execution Validation

**When**: Before selecting any PR to fix (Phase 0)
**Who**: iac-synth-trainer (Phase 0)
**Purpose**: Ensure agent has all required context, scripts, and knowledge to fix PRs effectively

### Validation Steps

```bash
echo "🔍 Running Checkpoint PR-A: Pre-Execution Validation"

# 1. Review Required Documentation
DOCS_REVIEWED=true

if [ -f ".claude/lessons_learnt.md" ]; then
  echo "✅ Reviewing lessons_learnt.md for common patterns..."
else
  echo "⚠️ WARNING: .claude/lessons_learnt.md not found"
  DOCS_REVIEWED=false
fi

if [ -f ".claude/docs/references/pre-submission-checklist.md" ]; then
  echo "✅ Reviewing pre-submission-checklist.md for quality gates..."
else
  echo "⚠️ WARNING: pre-submission-checklist.md not found"
  DOCS_REVIEWED=false
fi

if [ -f ".claude/docs/references/cicd-file-restrictions.md" ]; then
  echo "✅ Reviewing cicd-file-restrictions.md for file location rules..."
else
  echo "⚠️ WARNING: cicd-file-restrictions.md not found"
  DOCS_REVIEWED=false
fi

# 2. Verify Required Scripts Exist
REQUIRED_SCRIPTS=(
  ".claude/scripts/pr-manager.sh"
  ".claude/scripts/pr-status.sh"
  "scripts/pre-validate-iac.sh"
)

SCRIPTS_VALID=true
for script in "${REQUIRED_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    echo "✅ Found: $script"
    chmod +x "$script" 2>/dev/null || true
  else
    echo "❌ Missing: $script"
    SCRIPTS_VALID=false
  fi
done

# 3. Test Script Functionality
if [ "$SCRIPTS_VALID" = true ]; then
  bash .claude/scripts/pr-manager.sh help > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ pr-manager.sh is functional"
  else
    echo "❌ BLOCKED: pr-manager.sh not working"
    SCRIPTS_VALID=false
  fi
  
  bash .claude/scripts/pr-status.sh help > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ pr-status.sh is functional"
  else
    echo "❌ BLOCKED: pr-status.sh not working"
    SCRIPTS_VALID=false
  fi
fi
```

### Pass Criteria
- ✅ All required documentation reviewed
- ✅ All required scripts exist and are executable
- ✅ Scripts are functional (help commands work)
- ✅ Agent ready to proceed with PR selection

### Fail Action
- **Report**: `❌ BLOCKED: Pre-execution validation failed`
- **Impact**: Cannot proceed to PR selection
- **Recovery**: Install missing scripts, review documentation, re-validate
- **Reference**: See error-handling.md Standard Error Response

### Success Output
```markdown
**CHECKPOINT PR-A**: ✅ PASSED
- Documentation reviewed: lessons_learnt.md, pre-submission-checklist.md, cicd-file-restrictions.md
- Scripts verified: pr-manager.sh, pr-status.sh, pre-validate-iac.sh
- Ready to proceed with PR selection
```

---

## Checkpoint PR-B: PR Worktree Validation

**When**: After creating isolated worktree (Phase 2.2)
**Who**: iac-synth-trainer (Phase 2.2)
**Purpose**: Verify worktree is correctly set up and ready for fixes

### Validation Steps

```bash
echo "🔍 Running Checkpoint PR-B: PR Worktree Validation"

# 1. Verify Worktree Location
CURRENT_DIR=$(pwd)
if [[ ! "$CURRENT_DIR" =~ worktree/pr-fix-[^/]+$ ]]; then
  echo "❌ BLOCKED: Not in expected worktree directory"
  echo "Current: $CURRENT_DIR"
  echo "Expected: */worktree/pr-fix-${PR_NUMBER}"
  exit 1
fi
echo "✅ Worktree location: $CURRENT_DIR"

# 2. Verify Branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$PR_BRANCH" ]; then
  echo "❌ BLOCKED: Branch mismatch"
  echo "Expected: $PR_BRANCH"
  echo "Got: $CURRENT_BRANCH"
  exit 1
fi
echo "✅ Branch verified: $CURRENT_BRANCH"

# 3. Verify Metadata
if [ ! -f "metadata.json" ]; then
  echo "⚠️ WARNING: metadata.json not found (will handle in Fix 1)"
else
  PLATFORM=$(jq -r '.platform' metadata.json)
  LANGUAGE=$(jq -r '.language' metadata.json)
  echo "✅ Metadata found: Platform=$PLATFORM, Language=$LANGUAGE"
fi

# 4. Verify No Uncommitted Changes
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ WARNING: Worktree has uncommitted changes from PR"
  echo "This is expected - will be fixed during PR processing"
fi

echo "✅ Checkpoint PR-B: Worktree validation passed"
```

### Pass Criteria
- ✅ Worktree created at correct location (`worktree/pr-fix-<PR_NUMBER>`)
- ✅ Branch matches PR branch
- ✅ Metadata exists (or marked for fixing)
- ✅ Ready to begin fixes

### Fail Action
- **Report**: `❌ BLOCKED: Worktree validation failed`
- **Impact**: Cannot proceed with fixes
- **Recovery**: Remove worktree, recreate, re-validate
- **Reference**: See iac-synth-trainer.md Phase 2.2

### Success Output
```markdown
**CHECKPOINT PR-B**: ✅ PASSED
- Worktree location: worktree/pr-fix-<PR_NUMBER>
- Branch: <PR_BRANCH>
- Metadata: <Platform>-<Language>
- Ready for failure analysis
```

---

## Checkpoint PR-C: Failure Analysis Completeness

**When**: After root cause analysis (Phase 2.0)
**Who**: iac-synth-trainer (Phase 2.0)
**Purpose**: Ensure comprehensive analysis is documented before applying fixes

### Validation Steps

```bash
echo "🔍 Running Checkpoint PR-C: Failure Analysis Completeness"

# 1. Verify Root Cause Documented
if [ -z "$ROOT_CAUSE" ]; then
  echo "❌ BLOCKED: Root cause analysis not documented"
  exit 1
fi

# Check root cause structure
if ! echo "$ROOT_CAUSE" | grep -q "Failure Category:"; then
  echo "⚠️ WARNING: Root cause missing failure category"
fi

if ! echo "$ROOT_CAUSE" | grep -q "Specific Issues Identified"; then
  echo "⚠️ WARNING: Root cause missing specific issues"
fi

if ! echo "$ROOT_CAUSE" | grep -q "Evidence:"; then
  echo "⚠️ WARNING: Root cause missing evidence"
fi

echo "✅ Root cause analysis documented"

# 2. Verify Fix Plan Exists
if [ -z "$FIX_PLAN" ]; then
  echo "❌ BLOCKED: Fix plan not documented"
  exit 1
fi

# Check fix plan structure
if ! echo "$FIX_PLAN" | grep -q "Step"; then
  echo "⚠️ WARNING: Fix plan missing step-by-step approach"
fi

if ! echo "$FIX_PLAN" | grep -q "Validation:"; then
  echo "⚠️ WARNING: Fix plan missing validation steps"
fi

echo "✅ Fix plan documented"

# 3. Verify Solution Approach Justified
if [ -z "$SOLUTION_APPROACH" ]; then
  echo "❌ BLOCKED: Solution approach not documented"
  exit 1
fi

# Check solution approach structure
if ! echo "$SOLUTION_APPROACH" | grep -q "Why This Approach:"; then
  echo "⚠️ WARNING: Solution approach missing justification"
fi

echo "✅ Solution approach documented"

# 4. Verify Analysis Saved to Status File
PR_STATUS=$(bash .claude/scripts/pr-status.sh pr $PR_NUMBER 2>/dev/null || echo "")
if [ -z "$PR_STATUS" ]; then
  echo "⚠️ WARNING: Analysis not saved to status file"
else
  echo "✅ Analysis saved to status file"
fi

echo "✅ Checkpoint PR-C: Failure analysis complete"
```

### Pass Criteria
- ✅ Root cause documented with:
  - Failure category (Critical/High/Medium/Low)
  - Specific issues with evidence
  - Impact assessment
  - Root cause explanation (WHY, not just WHAT)
- ✅ Fix plan created with:
  - Step-by-step actions
  - File paths and line numbers
  - Validation method for each step
- ✅ Solution approach justified with:
  - Chosen strategy explanation
  - Why this is best approach
  - Alternatives considered
  - Success criteria
- ✅ Analysis saved to status file

### Fail Action
- **Report**: `❌ BLOCKED: Failure analysis incomplete`
- **Impact**: Cannot proceed with fixes (no clear plan)
- **Recovery**: Complete missing analysis sections, re-validate
- **Reference**: See iac-synth-trainer.md Phase 2.0

### Success Output
```markdown
**CHECKPOINT PR-C**: ✅ PASSED
- Root cause: Documented with evidence
- Fix plan: Step-by-step with validation
- Solution approach: Justified with alternatives
- Status file: Analysis saved
```

---

## Checkpoint PR-D: Fix Plan Validation

**When**: After fix plan creation (Phase 2.0)
**Who**: iac-synth-trainer (Phase 2.0)
**Purpose**: Ensure fix plan is actionable and complete before execution

### Validation Steps

```bash
echo "🔍 Running Checkpoint PR-D: Fix Plan Validation"

# 1. Verify Plan Has Specific File Paths
if ! echo "$FIX_PLAN" | grep -E "lib/[a-zA-Z0-9_-]+\.(ts|py|js|go|java)"; then
  echo "⚠️ WARNING: Fix plan missing specific file paths"
fi

# 2. Verify Plan Has Line Numbers (when applicable)
if ! echo "$FIX_PLAN" | grep -E "line [0-9]+"; then
  echo "⚠️ INFO: Fix plan may benefit from specific line numbers"
fi

# 3. Verify Plan Includes Validation Steps
if ! echo "$FIX_PLAN" | grep -i "validation:"; then
  echo "❌ BLOCKED: Fix plan missing validation steps"
  exit 1
fi

# 4. Verify Plan Addresses All Failed Stages
for stage in $FAILED_STAGES; do
  if ! echo "$FIX_PLAN" | grep -iq "$stage"; then
    echo "⚠️ WARNING: Fix plan may not address failed stage: $stage"
  fi
done

# 5. Verify Plan Is Executable
if ! echo "$FIX_PLAN" | grep -E "Step [0-9]+:"; then
  echo "⚠️ WARNING: Fix plan should have numbered steps for clarity"
fi

echo "✅ Checkpoint PR-D: Fix plan is actionable"
```

### Pass Criteria
- ✅ Plan has specific file paths (not generic descriptions)
- ✅ Plan includes validation steps for each fix
- ✅ Plan addresses all failed pipeline stages
- ✅ Plan is executable (clear, actionable steps)
- ✅ Plan has reasonable complexity (not overly complex or too simple)

### Fail Action
- **Report**: `❌ BLOCKED: Fix plan not actionable`
- **Impact**: Cannot execute fixes effectively
- **Recovery**: Improve plan specificity, add validation steps, re-validate
- **Reference**: See iac-synth-trainer.md Phase 2.0

### Success Output
```markdown
**CHECKPOINT PR-D**: ✅ PASSED
- File paths: Specific (lib/*.ts, etc.)
- Validation steps: Included for each fix
- Failed stages: All addressed
- Executability: Clear, actionable steps
```

---

## Checkpoint PR-D2: Pre-Fix Build Validation (Baseline Assessment)

**When**: Before applying any fixes (Phase 2.4.5)
**Who**: iac-synth-trainer (Phase 2.4.5)
**Purpose**: Establish baseline state before fixes to measure improvement

### Validation Steps

```bash
echo "🔍 Running Checkpoint PR-D2: Pre-Fix Build Validation"

BASELINE_ISSUES=()

# 1. Lint Baseline
case "$LANGUAGE" in
  "ts"|"js")
    npm run lint > /tmp/baseline-lint.txt 2>&1 || true
    LINT_BASELINE_STATUS=${PIPESTATUS[0]}
    ;;
  "py")
    pipenv run lint > /tmp/baseline-lint.txt 2>&1 || true
    LINT_BASELINE_STATUS=${PIPESTATUS[0]}
    ;;
  *)
    LINT_BASELINE_STATUS=0
    ;;
esac

if [ $LINT_BASELINE_STATUS -ne 0 ]; then
  LINT_ISSUES=$(grep -c "error\|warning" /tmp/baseline-lint.txt || echo 0)
  BASELINE_ISSUES+=("Lint: $LINT_ISSUES issues")
  echo "⚠️ Baseline lint: $LINT_ISSUES issues"
else
  echo "✅ Baseline lint: Clean"
fi

# 2. Build Baseline
case "$LANGUAGE" in
  "ts"|"js")
    npm run build > /tmp/baseline-build.txt 2>&1 || true
    BUILD_BASELINE_STATUS=${PIPESTATUS[0]}
    ;;
  "py")
    python -m py_compile lib/**/*.py test/**/*.py > /tmp/baseline-build.txt 2>&1 || true
    BUILD_BASELINE_STATUS=${PIPESTATUS[0]}
    ;;
  *)
    BUILD_BASELINE_STATUS=0
    ;;
esac

if [ $BUILD_BASELINE_STATUS -ne 0 ]; then
  BUILD_ERRORS=$(grep -c "error" /tmp/baseline-build.txt || echo 0)
  BASELINE_ISSUES+=("Build: $BUILD_ERRORS errors")
  echo "⚠️ Baseline build: $BUILD_ERRORS errors"
else
  echo "✅ Baseline build: Clean"
fi

# 3. Synth Baseline (if applicable)
if [ "$PLATFORM" = "cdk" ] || [ "$PLATFORM" = "cdktf" ] || [ "$PLATFORM" = "pulumi" ]; then
  npm run synth > /tmp/baseline-synth.txt 2>&1 || true
  SYNTH_BASELINE_STATUS=${PIPESTATUS[0]}
  
  if [ $SYNTH_BASELINE_STATUS -ne 0 ]; then
    SYNTH_ERRORS=$(grep -c "error" /tmp/baseline-synth.txt || echo 0)
    BASELINE_ISSUES+=("Synth: $SYNTH_ERRORS errors")
    echo "⚠️ Baseline synth: $SYNTH_ERRORS errors"
  else
    echo "✅ Baseline synth: Clean"
  fi
fi

# Report baseline assessment
if [ ${#BASELINE_ISSUES[@]} -gt 0 ]; then
  echo "Baseline issues identified:"
  printf '  - %s\n' "${BASELINE_ISSUES[@]}"
  echo "These will be addressed in the fix stages"
else
  echo "✅ Baseline: All checks passed (PR may have other failures)"
fi

echo "✅ Checkpoint PR-D2: Baseline assessment complete"
```

### Pass Criteria
- ✅ Baseline lint status assessed and documented
- ✅ Baseline build status assessed and documented
- ✅ Baseline synth status assessed (if applicable)
- ✅ Baseline issues documented for comparison
- ✅ Ready to apply targeted fixes

### Fail Action
- **Note**: This checkpoint cannot fail - it's for baseline assessment only
- **Purpose**: Establish "before" state to measure "after" improvement
- **Recovery**: N/A (continue to fixes regardless of baseline state)

### Success Output
```markdown
**CHECKPOINT PR-D2**: ✅ PASSED (Baseline Assessment)
- Lint baseline: <X issues or Clean>
- Build baseline: <Y errors or Clean>
- Synth baseline: <Z errors or Clean>
- Documented for comparison after fixes
```

---

## Checkpoint PR-E: Pre-Deployment Validation

**When**: Before any deployment attempt (Phase 2.5)
**Who**: iac-synth-trainer (Phase 2.5)
**Purpose**: Catch common deployment errors early to avoid unnecessary AWS costs

### Validation Steps

```bash
echo "🔍 Running Checkpoint PR-E: Pre-Deployment Validation"

# Set environment suffix
export ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-fix${PR_NUMBER}}"
echo "Using ENVIRONMENT_SUFFIX=$ENVIRONMENT_SUFFIX"

# Run pre-deployment validation script
if [ -f "scripts/pre-validate-iac.sh" ]; then
  bash scripts/pre-validate-iac.sh 2>&1 | tee /tmp/pre-validate-output.txt
  PRE_VALIDATE_STATUS=${PIPESTATUS[0]}
else
  echo "⚠️ WARNING: scripts/pre-validate-iac.sh not found"
  echo "Skipping pre-validation (may miss common errors)"
  PRE_VALIDATE_STATUS=0
fi

if [ $PRE_VALIDATE_STATUS -ne 0 ]; then
  echo "❌ Pre-deployment validation FAILED"
  echo "Errors found:"
  grep -i "error\|failed" /tmp/pre-validate-output.txt | head -20
  
  # Common fixes
  echo "🔧 Applying common fixes..."
  
  # Fix 1: Missing environmentSuffix
  if grep -qi "environmentSuffix\|environment suffix" /tmp/pre-validate-output.txt; then
    echo "  → Fixing environmentSuffix issues..."
    # Fixes will be applied in deployment fix section
  fi
  
  # Fix 2: Retain policies
  if grep -qi "retain\|RETAIN" /tmp/pre-validate-output.txt; then
    echo "  → Changing RemovalPolicy from RETAIN to DESTROY..."
    find lib/ -type f \( -name "*.ts" -o -name "*.py" -o -name "*.js" \) -exec sed -i.bak 's/RemovalPolicy\.RETAIN/RemovalPolicy.DESTROY/g' {} \;
  fi
  
  # Fix 3: DeletionProtection
  if grep -qi "deletionProtection\|deletion_protection" /tmp/pre-validate-output.txt; then
    echo "  → Disabling DeletionProtection..."
    find lib/ -type f -exec sed -i.bak 's/deletionProtection.*true/deletionProtection: false/g' {} \;
  fi
  
  # Re-run validation
  echo "🔄 Re-running validation after fixes..."
  bash scripts/pre-validate-iac.sh 2>&1 | tee /tmp/pre-validate-output-2.txt
  PRE_VALIDATE_STATUS=${PIPESTATUS[0]}
  
  if [ $PRE_VALIDATE_STATUS -eq 0 ]; then
    echo "✅ Pre-deployment validation PASSED after fixes"
  else
    echo "⚠️ Some validation issues remain (will handle in deployment)"
  fi
else
  echo "✅ Pre-deployment validation PASSED"
fi

echo "✅ Checkpoint PR-E: Pre-deployment validation complete"
```

### Pass Criteria
- ✅ Pre-validation script executed successfully OR
- ✅ Common errors fixed (environmentSuffix, Retain policies, DeletionProtection)
- ✅ Ready for deployment attempts
- ⚠️ Note: This is a soft checkpoint - warnings don't block deployment, but errors should be fixed

### Fail Action
- **Report**: `⚠️ WARNING: Pre-deployment validation had issues`
- **Impact**: May encounter deployment failures (but proceed anyway)
- **Recovery**: Fix common issues, re-validate, proceed with deployment
- **Cost Impact**: Saves 2-3 deployment attempts (~15% token reduction)

### Success Output
```markdown
**CHECKPOINT PR-E**: ✅ PASSED
- Pre-validation: Executed successfully
- Common errors: Fixed (if any)
- environmentSuffix: Validated
- Retain policies: None found (or fixed)
- DeletionProtection: Disabled (if found)
- Ready for deployment
```

---

## Checkpoint PR-F: Post-Fix Validation

**When**: After applying all fixes, before commit (Phase 2.6)
**Who**: iac-synth-trainer (Phase 2.6)
**Purpose**: Ensure all local validations pass before pushing changes

### Validation Steps

```bash
echo "🔍 Running Checkpoint PR-F: Post-Fix Validation"

VALIDATION_PASSED=true
VALIDATION_FAILURES=()

# 1. Lint
echo "1. Running lint..."
case "$LANGUAGE" in
  "ts"|"js") npm run lint || VALIDATION_PASSED=false ;;
  "py") pipenv run lint || VALIDATION_PASSED=false ;;
  "go") go vet ./... || VALIDATION_PASSED=false ;;
esac

if [ "$VALIDATION_PASSED" = false ]; then
  VALIDATION_FAILURES+=("Lint validation failed")
  echo "❌ Lint failed"
else
  echo "✅ Lint passed"
fi

# 2. Build
echo "2. Running build..."
VALIDATION_PASSED=true
case "$LANGUAGE" in
  "ts"|"js") npm run build || VALIDATION_PASSED=false ;;
  "py") python -m py_compile lib/**/*.py test/**/*.py || VALIDATION_PASSED=false ;;
  "go") go build ./... || VALIDATION_PASSED=false ;;
esac

if [ "$VALIDATION_PASSED" = false ]; then
  VALIDATION_FAILURES+=("Build validation failed")
  echo "❌ Build failed"
else
  echo "✅ Build passed"
fi

# 3. Synth (if applicable)
if [ "$PLATFORM" = "cdk" ] || [ "$PLATFORM" = "cdktf" ]; then
  echo "3. Running synth..."
  npm run synth || VALIDATION_PASSED=false
  
  if [ "$VALIDATION_PASSED" = false ]; then
    VALIDATION_FAILURES+=("Synth validation failed")
    echo "❌ Synth failed"
  else
    echo "✅ Synth passed"
  fi
fi

# 4. Unit Tests with Coverage
echo "4. Running unit tests..."
case "$LANGUAGE" in
  "ts"|"js") npm run test:unit || VALIDATION_PASSED=false ;;
  "py") pipenv run test:unit || VALIDATION_PASSED=false ;;
esac

# Verify 100% coverage
if [ -f "coverage/coverage-summary.json" ]; then
  STMT_COV=$(jq -r '.total.statements.pct' coverage/coverage-summary.json)
  FUNC_COV=$(jq -r '.total.functions.pct' coverage/coverage-summary.json)
  LINE_COV=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
  
  if [ "$STMT_COV" != "100" ] || [ "$FUNC_COV" != "100" ] || [ "$LINE_COV" != "100" ]; then
    VALIDATION_FAILURES+=("Coverage below 100%: Stmt=$STMT_COV%, Func=$FUNC_COV%, Line=$LINE_COV%")
    echo "❌ Coverage: Stmt=$STMT_COV%, Func=$FUNC_COV%, Line=$LINE_COV%"
    VALIDATION_PASSED=false
  else
    echo "✅ Unit tests passed with 100% coverage"
  fi
else
  VALIDATION_FAILURES+=("Coverage report not found")
  echo "❌ Coverage report not found"
  VALIDATION_PASSED=false
fi

# 5. Integration Tests (if deployment successful)
if [ -f "cfn-outputs/flat-outputs.json" ]; then
  echo "5. Running integration tests..."
  case "$LANGUAGE" in
    "ts"|"js") npm run test:integration || VALIDATION_PASSED=false ;;
    "py") pipenv run test:integration || VALIDATION_PASSED=false ;;
  esac
  
  if [ "$VALIDATION_PASSED" = false ]; then
    VALIDATION_FAILURES+=("Integration tests failed")
    echo "❌ Integration tests failed"
  else
    echo "✅ Integration tests passed"
  fi
else
  echo "⚠️ Skipping integration tests (no deployment outputs)"
fi

# Final result
if [ ${#VALIDATION_FAILURES[@]} -gt 0 ]; then
  echo "❌ BLOCKED: Local validation failures:"
  printf '  - %s\n' "${VALIDATION_FAILURES[@]}"
  exit 1
else
  echo "✅ Checkpoint PR-F: All local validations passed"
fi
```

### Pass Criteria
- ✅ Lint: Zero errors
- ✅ Build: Successful compilation
- ✅ Synth: Successful template generation (if applicable)
- ✅ Unit tests: All passing with 100% coverage (statements, functions, lines)
- ✅ Integration tests: All passing (if deployment succeeded)

### Fail Action
- **Report**: `❌ BLOCKED: Local validation failed`
- **Impact**: Cannot commit and push changes
- **Recovery**: Fix failing validations, re-run, re-validate
- **Reference**: See iac-synth-trainer.md Phase 2.6

### Success Output
```markdown
**CHECKPOINT PR-F**: ✅ PASSED
- Lint: ✅ Passed
- Build: ✅ Passed
- Synth: ✅ Passed (if applicable)
- Unit tests: ✅ 100% coverage
- Integration tests: ✅ Passed (if applicable)
- Ready for quality gates
```

---

## Checkpoint PR-G: GitHub Pipeline Validation

**When**: After pushing changes, monitoring GitHub Actions (Phase 2.8)
**Who**: iac-synth-trainer (Phase 2.8)
**Purpose**: Ensure ALL GitHub pipeline stages pass before marking PR as fixed

### Validation Steps

```bash
echo "🔍 Running Checkpoint PR-G: GitHub Pipeline Validation"

# Wait for pipeline to start
echo "⏳ Waiting for GitHub Actions to start..."
sleep 10

# Get latest workflow run
RUN_ID=$(gh pr view $PR_NUMBER --json statusCheckRollup -q '.statusCheckRollup[0].workflowRun.databaseId')

if [ -z "$RUN_ID" ]; then
  echo "⚠️ Could not find workflow run, waiting..."
  sleep 20
  RUN_ID=$(gh pr view $PR_NUMBER --json statusCheckRollup -q '.statusCheckRollup[0].workflowRun.databaseId')
fi

echo "Monitoring workflow run: $RUN_ID"

# Monitor until completion (max 30 minutes)
MAX_WAIT_MINUTES=30
WAIT_SECONDS=0
MAX_WAIT_SECONDS=$((MAX_WAIT_MINUTES * 60))
PR_FIXED=false

while [ $WAIT_SECONDS -lt $MAX_WAIT_SECONDS ]; do
  RUN_STATUS=$(gh run view $RUN_ID --json status,conclusion -q '.status')
  RUN_CONCLUSION=$(gh run view $RUN_ID --json conclusion -q '.conclusion')
  
  echo "[$((WAIT_SECONDS / 60))m] Status: $RUN_STATUS, Conclusion: $RUN_CONCLUSION"
  
  if [ "$RUN_STATUS" = "completed" ]; then
    echo "Workflow completed with: $RUN_CONCLUSION"
    
    # Get detailed check results
    gh pr checks $PR_NUMBER --json name,conclusion > /tmp/pr-${PR_NUMBER}-final-checks.json
    
    echo "Pipeline stages:"
    cat /tmp/pr-${PR_NUMBER}-final-checks.json | jq -r '.[] | "\(.name): \(.conclusion)"'
    
    # Check if ALL stages passed
    FAILED_CHECKS=$(cat /tmp/pr-${PR_NUMBER}-final-checks.json | jq -r '.[] | select(.conclusion != "success") | .name')
    
    if [ -z "$FAILED_CHECKS" ]; then
      echo "✅ SUCCESS: ALL PIPELINE STAGES PASSED!"
      PR_FIXED=true
    else
      echo "❌ Some stages failed:"
      echo "$FAILED_CHECKS"
      PR_FIXED=false
    fi
    break
  fi
  
  sleep 30
  WAIT_SECONDS=$((WAIT_SECONDS + 30))
done

if [ $WAIT_SECONDS -ge $MAX_WAIT_SECONDS ]; then
  echo "⏱️ Timeout waiting for workflow (${MAX_WAIT_MINUTES} minutes)"
  PR_FIXED=false
fi

if [ "$PR_FIXED" = true ]; then
  echo "✅ Checkpoint PR-G: GitHub pipeline validation passed"
else
  echo "❌ Checkpoint PR-G: GitHub pipeline validation failed"
  exit 1
fi
```

### Pass Criteria
- ✅ GitHub Actions workflow completed
- ✅ ALL pipeline stages show "success" (green checkmarks)
- ✅ No failed stages
- ✅ No timeout (completed within 30 minutes)

### Pipeline Stages to Verify
- ✅ Detect Project Files
- ✅ Lint
- ✅ Build
- ✅ Deploy
- ✅ Unit Testing
- ✅ Integration Testing
- ✅ Claude Review (if applicable)

### Fail Action
- **Report**: `❌ GitHub pipeline validation failed`
- **Impact**: PR not marked as fixed
- **Recovery Options**:
  - If iteration < 5: Analyze new failures, apply fixes, iterate
  - If iteration >= 5: Mark PR as needs-manual-review
- **Reference**: See iac-synth-trainer.md Phase 2.8

### Success Output
```markdown
**CHECKPOINT PR-G**: ✅ PASSED
- Workflow run: <RUN_ID>
- All stages: ✅ PASSED
- Detect Project Files: ✅
- Lint: ✅
- Build: ✅
- Deploy: ✅
- Unit Testing: ✅
- Integration Testing: ✅
- Claude Review: ✅
- PR marked as FIXED
```

---

## Quick Reference Table

| Checkpoint | Phase | When | What | Critical? |
|------------|-------|------|------|-----------|
| PR-A | 0 | Before PR selection | Pre-execution validation | YES |
| PR-B | 2.2 | After worktree creation | Worktree validation | YES |
| PR-C | 2.0 | After root cause analysis | Failure analysis completeness | YES |
| PR-D | 2.0 | After fix plan | Fix plan validation | YES |
| PR-D2 | 2.4.5 | Before fixes | Pre-fix build baseline | INFO |
| PR-E | 2.5 | Before deployment | Pre-deployment validation | SOFT |
| PR-F | 2.6 | After all fixes | Post-fix local validation | YES |
| PR-G | 2.8 | After GitHub push | GitHub pipeline validation | YES |

**Legend:**
- **YES**: Critical checkpoint - must pass to proceed
- **SOFT**: Soft checkpoint - warnings don't block, but errors should be addressed
- **INFO**: Informational checkpoint - for baseline/comparison only

---

## Checkpoint Failure Escalation

### Level 1: Automatic Recovery
- **Checkpoints**: PR-E, PR-D2
- **Action**: Apply common fixes, re-validate, continue
- **Example**: Fix environmentSuffix, Retain policies

### Level 2: Retry with Iteration
- **Checkpoints**: PR-F, PR-G
- **Action**: Analyze failures, apply targeted fixes, re-run (max 5 iterations)
- **Example**: Fix failing tests, add missing coverage

### Level 3: Block and Report
- **Checkpoints**: PR-A, PR-B, PR-C, PR-D
- **Action**: Report BLOCKED status, require intervention
- **Example**: Missing required scripts, invalid worktree

### Level 4: Mark as Failed
- **Condition**: Max iterations reached (5) or critical blocker
- **Action**: Add comment, label "needs-manual-review", move to next PR
- **Example**: AWS quota limits, unfixable errors

---

## Usage Pattern in iac-synth-trainer.md

Replace detailed validation blocks with:

```markdown
**Validation**: Run Checkpoint PR-X: [Name]
- See pr-fix-checkpoints.md for details
- On failure, see error-handling.md
```

---

## Integration with Standard Checkpoints

PR-fix checkpoints complement (not replace) standard validation checkpoints:

| Standard Checkpoint | PR-Fix Equivalent | Notes |
|---------------------|-------------------|-------|
| Checkpoint A (Metadata) | PR-B (Worktree) | PR-B also validates metadata |
| Checkpoint B (Platform-Lang) | PR-B (Worktree) | Validated during metadata check |
| Checkpoint G (Build Quality) | PR-D2, PR-F | Pre/post fix comparison |
| Checkpoint H (Test Coverage) | PR-F | 100% coverage required |
| Checkpoint K (File Locations) | Quality Gates | Validated in Phase 2.6.5 |

---

## Cost Optimization Impact

### Pre-Deployment Validation (Checkpoint PR-E)
- **Saves**: 2-3 deployment attempts per PR
- **Cost reduction**: ~15% token reduction
- **Common errors caught**: environmentSuffix, Retain policies, DeletionProtection
- **Deployment time saved**: 10-15 minutes per PR

### Baseline Assessment (Checkpoint PR-D2)
- **Benefit**: Measure improvement before/after fixes
- **Cost**: Minimal (single validation run)
- **Value**: Objective evidence of fix effectiveness

---

## References

- **Agent Documentation**: `.claude/agents/iac-synth-trainer.md`
- **Command Documentation**: `.claude/commands/task-fix.md`
- **Standard Checkpoints**: `.claude/docs/references/validation-checkpoints.md`
- **Error Handling**: `.claude/docs/references/error-handling.md`
- **Pre-Submission Checklist**: `.claude/docs/references/pre-submission-checklist.md`

---

*Last Updated: 2025-11-13*
*These checkpoints ensure systematic validation at each stage of PR fixing*
