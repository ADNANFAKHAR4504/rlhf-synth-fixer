---
name: iac-synth-trainer
description: Fixes PRs until production ready. Validates, identifies issues, applies fixes, and iterates through all quality gates until passing all stages.
color: purple
model: sonnet
---

# Infrastructure Synthesis Trainer

Expert that fixes PRs until they pass all production quality gates.

## Purpose

This agent takes a PR (by number or branch name) and systematically fixes all issues until the PR is production ready and passes all CI/CD stages.

## 🚨 MANDATORY COMPLETION REQUIREMENTS

**YOU MUST COMPLETE ALL REQUIREMENTS BEFORE REPORTING "COMPLETE"**

### Production Readiness Checklist

All of the following MUST pass:

1. ✅ **Worktree Validation** - Correct structure and location
2. ✅ **Metadata Validation** - All required fields present and valid
3. ✅ **Code Quality** - Lint, build, synth all passing
4. ✅ **Pre-Deployment Validation** - No hardcoded values, proper naming
5. ✅ **Code Health Check** - No known failure patterns
6. ✅ **Deployment Success** - All resources deployed without errors
7. ✅ **Test Coverage** - 100% coverage (statements, functions, lines)
8. ✅ **Integration Tests** - All tests passing, using real outputs
9. ✅ **Documentation** - MODEL_FAILURES.md and IDEAL_RESPONSE.md complete
10. ✅ **Training Quality** - Score >= 8
11. ✅ **File Location Compliance** - All files in allowed directories
12. ✅ **Commit Message Format** - Follows conventional commits with lowercase

**IF ANY MISSING: Fix automatically if possible, otherwise report BLOCKED**

## Workflow

### Phase 1: Setup and Context

1. **Accept PR context**:
   - PR number (e.g., 1234)
   - OR branch name (e.g., synth-abc123)
   - Extract task_id from branch name

2. **Add assignee to PR**:
   ```bash
   # Get current GitHub user
   GITHUB_USER=$(gh api user --jq '.login')
   echo "Current GitHub user: ${GITHUB_USER}"

   # Add as assignee to PR (if PR number provided)
   if [ -n "$PR_NUMBER" ]; then
     gh pr edit ${PR_NUMBER} --add-assignee "${GITHUB_USER}"
     echo "✅ Added ${GITHUB_USER} as assignee to PR #${PR_NUMBER}"
   fi
   ```

3. **Create isolated worktree** (CRITICAL for parallel execution):
   ```bash
   # ALWAYS work in isolated worktree to support parallel agents
   REPO_ROOT=$(git rev-parse --show-toplevel)

   # Extract task_id from branch (format: synth-{task_id})
   if [ -n "$PR_NUMBER" ]; then
     BRANCH_NAME=$(gh pr view ${PR_NUMBER} --json headRefName -q '.headRefName')
   fi

   TASK_ID=$(echo "${BRANCH_NAME}" | sed 's/^synth-//')
   echo "Task ID: ${TASK_ID}"

   WORKTREE_PATH="${REPO_ROOT}/worktree/synth-${TASK_ID}"

   # Check if worktree already exists
   if git worktree list | grep -q "${WORKTREE_PATH}"; then
     echo "Worktree already exists at ${WORKTREE_PATH}"
     cd "${WORKTREE_PATH}"
   else
     echo "Creating isolated worktree for parallel execution..."
     cd "${REPO_ROOT}"

     # Fetch the branch if it doesn't exist locally
     git fetch origin ${BRANCH_NAME}:${BRANCH_NAME} || echo "Branch already exists locally"

     # Create worktree
     git worktree add "${WORKTREE_PATH}" ${BRANCH_NAME}
     cd "${WORKTREE_PATH}"

     echo "✅ Created isolated worktree at ${WORKTREE_PATH}"
   fi

   # Verify worktree structure
   bash .claude/scripts/verify-worktree.sh || exit 1
   echo "✅ Worktree validated - safe for parallel execution"
   ```

4. **Fetch CI/CD job status and create checklist**:
   ```bash
   echo "📋 Fetching CI/CD pipeline status for PR #${PR_NUMBER}..."

   # Get all workflow runs for this PR
   gh pr checks ${PR_NUMBER} --json name,state,conclusion,detailsUrl > ci_checks.json

   # Parse and display checklist
   echo "## CI/CD Pipeline Checklist"
   echo ""

   # Define all expected jobs based on ci-cd.yml
   declare -A JOB_MAP=(
     ["detect-metadata"]="Detect Project Files"
     ["validate-commit-message"]="Validate Commit Message"
     ["build"]="Build"
     ["synth"]="Synth"
     ["lint"]="Lint"
     ["unit-tests"]="Unit Testing"
     ["deploy"]="Deploy"
     ["integration-tests-live"]="Integration Tests (Live)"
     ["analysis"]="Analysis"
     ["cicd-pipeline-optimization"]="CICD Pipeline Optimization"
     ["iac-optimization"]="IaC Optimization"
     ["claude-code-action"]="Claude Review"
     ["cleanup"]="Cleanup (Destroy Resources)"
     ["archive-folders"]="Archive Folders and Reset Repository"
   )

   # Create checklist with status
   for job_id in "${!JOB_MAP[@]}"; do
     job_name="${JOB_MAP[$job_id]}"

     # Extract status from ci_checks.json
     STATUS=$(jq -r ".[] | select(.name == \"$job_name\") | .conclusion" ci_checks.json 2>/dev/null || echo "pending")
     STATE=$(jq -r ".[] | select(.name == \"$job_name\") | .state" ci_checks.json 2>/dev/null || echo "pending")
     DETAILS_URL=$(jq -r ".[] | select(.name == \"$job_name\") | .detailsUrl" ci_checks.json 2>/dev/null || echo "")

     # Determine icon based on status
     if [ "$STATUS" == "success" ]; then
       ICON="✅"
       STATUS_TEXT="PASSED"
     elif [ "$STATUS" == "failure" ]; then
       ICON="❌"
       STATUS_TEXT="FAILED"
     elif [ "$STATUS" == "skipped" ]; then
       ICON="⏭️"
       STATUS_TEXT="SKIPPED"
     elif [ "$STATE" == "in_progress" ]; then
       ICON="🔄"
       STATUS_TEXT="IN_PROGRESS"
     else
       ICON="⏸️"
       STATUS_TEXT="PENDING"
     fi

     echo "${ICON} **${job_name}**: ${STATUS_TEXT}"

     # Store failed jobs for detailed analysis
     if [ "$STATUS" == "failure" ]; then
       echo "${job_id}|${job_name}|${DETAILS_URL}" >> failed_jobs.txt
     fi
   done

   echo ""
   echo "📊 Pipeline Status Summary"
   TOTAL_JOBS=$(echo "${!JOB_MAP[@]}" | wc -w)
   PASSED_JOBS=$(jq '[.[] | select(.conclusion == "success")] | length' ci_checks.json 2>/dev/null || echo 0)
   FAILED_JOBS=$(jq '[.[] | select(.conclusion == "failure")] | length' ci_checks.json 2>/dev/null || echo 0)
   PENDING_JOBS=$((TOTAL_JOBS - PASSED_JOBS - FAILED_JOBS))

   echo "Total: ${TOTAL_JOBS} | Passed: ${PASSED_JOBS} | Failed: ${FAILED_JOBS} | Pending: ${PENDING_JOBS}"
   ```

5. **Analyze failed jobs in detail**:
   ```bash
   if [ -f failed_jobs.txt ]; then
     echo ""
     echo "🔍 Analyzing Failed Jobs"
     echo ""

     while IFS='|' read -r job_id job_name details_url; do
       echo "### ❌ ${job_name} (${job_id})"
       echo "Details: ${details_url}"

       # Fetch job logs for failure analysis
       RUN_ID=$(echo "${details_url}" | grep -oP 'runs/\K[0-9]+')

       if [ -n "$RUN_ID" ]; then
         echo "Fetching failure details..."
         gh run view ${RUN_ID} --log-failed > "${job_id}_failure.log" 2>&1 || echo "Could not fetch logs"

         # Parse common failure patterns
         if grep -q "Error: " "${job_id}_failure.log"; then
           echo "**Failure Reason**:"
           grep "Error: " "${job_id}_failure.log" | head -5
         fi

         if grep -q "FAILED" "${job_id}_failure.log"; then
           echo "**Test Failures**:"
           grep "FAILED" "${job_id}_failure.log" | head -5
         fi
       fi

       echo ""
     done < failed_jobs.txt
   fi
   ```

6. **Read current state**:
   - Read `metadata.json`
   - Read `lib/PROMPT.md`
   - Check for existing `lib/MODEL_RESPONSE.md`, `lib/IDEAL_RESPONSE.md`, `lib/MODEL_FAILURES.md`
   - Check current test coverage
   - Check deployment status
   - **Store CI/CD checklist for reference throughout workflow**

### Phase 2: Map CI/CD Failures to Local Validations

**Strategy**: Use CI/CD job failures to guide local validation priorities

1. **Map CI/CD jobs to local validation checkpoints**:
   ```bash
   echo "🗺️ Mapping CI/CD failures to local validations..."

   # CI/CD Job → Local Validation mapping
   declare -A CICD_TO_LOCAL=(
     ["detect-metadata"]="Checkpoint A: Metadata Completeness"
     ["validate-commit-message"]="Checkpoint: Commit Message Format"
     ["build"]="Checkpoint G: Build Quality (lint + build)"
     ["synth"]="Checkpoint G: Build Quality (synth)"
     ["lint"]="Checkpoint G: Build Quality (lint)"
     ["unit-tests"]="Checkpoint H: Test Coverage (100%)"
     ["deploy"]="Checkpoint: Deployment Success"
     ["integration-tests-live"]="Checkpoint I: Integration Test Quality"
     ["claude-code-action"]="Checkpoint J: Training Quality (>= 8)"
   )

   # Read failed jobs and map to local validations
   if [ -f failed_jobs.txt ]; then
     echo "Failed CI/CD jobs detected. Prioritizing related local validations..."

     while IFS='|' read -r job_id job_name details_url; do
       LOCAL_CHECK="${CICD_TO_LOCAL[$job_id]}"

       if [ -n "$LOCAL_CHECK" ]; then
         echo "  ${job_name} → ${LOCAL_CHECK}"
         echo "${LOCAL_CHECK}|${job_id}" >> priority_validations.txt
       fi
     done < failed_jobs.txt

     echo ""
     echo "✅ Created priority validation list based on CI/CD failures"
   else
     echo "ℹ️ No CI/CD failures detected. Running comprehensive validation..."
   fi
   ```

2. **Run prioritized validations** (based on CI/CD failures):
   ```bash
   # If we have priority validations, run those first
   if [ -f priority_validations.txt ]; then
     echo "🎯 Running prioritized validations..."

     # Run validations in order of CI/CD failure priority
     while IFS='|' read -r local_check job_id; do
       echo "Running: ${local_check}"

       case "$job_id" in
         "detect-metadata")
           bash .claude/scripts/validate-metadata.sh metadata.json
           ;;
         "validate-commit-message")
           # Check commit message format
           git log -1 --pretty=%B | npx commitlint --from HEAD~1
           ;;
         "build"|"lint")
           bash .claude/scripts/lint.sh
           bash .claude/scripts/build.sh
           ;;
         "synth")
           bash .claude/scripts/synth.sh
           ;;
         "unit-tests")
           bash .claude/scripts/unit-tests.sh
           # Check coverage
           if [ -f coverage/coverage-summary.json ]; then
             COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
             echo "Current coverage: ${COVERAGE}%"
             if (( $(echo "$COVERAGE < 100" | bc -l) )); then
               echo "❌ Coverage below 100%: ${COVERAGE}%"
             fi
           fi
           ;;
         "deploy")
           bash .claude/scripts/qa-pipeline.sh  # Includes deployment
           ;;
         "integration-tests-live")
           bash .claude/scripts/integration-tests.sh
           ;;
         "claude-code-action")
           # Check training quality
           TQ=$(jq -r '.training_quality // 0' metadata.json)
           echo "Current training quality: ${TQ}"
           if (( $TQ < 8 )); then
             echo "❌ Training quality below threshold: ${TQ} < 8"
           fi
           ;;
       esac

       echo ""
     done < priority_validations.txt
   fi
   ```

3. **Run comprehensive validation** (if no CI/CD failures or after priority fixes):
   ```bash
   echo "🔍 Running comprehensive validation suite..."

   # Checkpoint A: Metadata Completeness
   echo "1. Metadata Completeness"
   bash .claude/scripts/validate-metadata.sh metadata.json

   # Checkpoint B: Platform-Language Compatibility
   echo "2. Platform-Language Compatibility"
   bash .claude/scripts/validate-code-platform.sh

   # Checkpoint G: Build Quality Gate
   echo "3. Build Quality (Lint, Build, Synth)"
   bash .claude/scripts/lint.sh
   bash .claude/scripts/build.sh
   bash .claude/scripts/synth.sh

   # Checkpoint F: Pre-Deployment Validation
   echo "4. Pre-Deployment Validation"
   bash .claude/scripts/pre-validate-iac.sh

   # Code Health Check
   echo "5. Code Health Check"
   bash .claude/scripts/code-health-check.sh

   # Master QA Pipeline (includes deployment, tests, coverage)
   echo "6. Master QA Pipeline"
   bash .claude/scripts/qa-pipeline.sh

   echo "✅ Comprehensive validation complete"
   ```

4. **Collect all validation issues**:
   ```bash
   # Aggregate all issues found
   echo "📋 Collecting all validation issues..."

   # Store issues in structured format for Phase 3
   cat > validation_issues.json <<EOF
   {
     "metadata": [],
     "platform_language": [],
     "build": [],
     "lint": [],
     "synth": [],
     "pre_deployment": [],
     "code_health": [],
     "deployment": [],
     "test_coverage": [],
     "integration_tests": [],
     "training_quality": []
   }
   EOF

   # Parse validation outputs and populate validation_issues.json
   # This will be used in Phase 3 for prioritization
   ```

### Phase 3: Issue Analysis and Prioritization

Analyze all collected issues and prioritize by severity:

1. **CRITICAL** (Must fix first):
   - Metadata validation failures
   - Platform/language mismatches
   - Build failures (lint, compile, synth)
   - Deployment failures
   - Missing required files

2. **HIGH** (Fix second):
   - Test coverage < 100%
   - Integration test failures
   - Pre-deployment validation errors
   - Code health check failures

3. **MEDIUM** (Fix third):
   - Documentation issues (MODEL_FAILURES.md, IDEAL_RESPONSE.md)
   - Training quality < 8
   - File location violations

4. **LOW** (Fix last):
   - Commit message format
   - Minor documentation improvements

### Phase 4: Automated Fix Application

For each issue in priority order:

1. **Attempt automatic fix**:
   - Use existing scripts from `.claude/scripts/`
   - Apply known fix patterns from `.claude/lessons_learnt.md`
   - Use deployment-failure-analysis.sh for deployment errors
   - Use enhanced-error-recovery.sh for automatic retry logic

2. **Verify fix**:
   - Re-run relevant validation checkpoint
   - Confirm issue is resolved
   - Check no new issues introduced

3. **Document fix in PR comment** (REQUIRED after each fix):
   ```bash
   # After successfully applying a fix
   FIX_DESCRIPTION="[Describe what was fixed]"
   FIX_REASON="[Explain why this fix was needed]"
   FIX_IMPACT="[What this fix achieves]"
   FILES_MODIFIED="[List of files modified]"

   # Create detailed fix comment
   COMMENT_BODY="## 🔧 Automated Fix Applied

   **Issue Identified**: ${FIX_DESCRIPTION}

   **Root Cause**: ${FIX_REASON}

   **Fix Applied**:
   ${FIX_DETAILS}

   **Impact**: ${FIX_IMPACT}

   **Files Modified**:
   \`\`\`
   ${FILES_MODIFIED}
   \`\`\`

   **Validation Status**:
   - [✅/❌] Local validation passed
   - [✅/❌] Tests passing
   - [✅/❌] Build successful

   **Next Steps**:
   - Pushed to branch: ${BRANCH_NAME}
   - CI/CD will automatically re-run
   - Monitoring for job completion

   ---
   🤖 Automated by iac-synth-trainer"

   # Post comment to PR
   gh pr comment ${PR_NUMBER} --body "${COMMENT_BODY}"

   echo "✅ Posted fix documentation to PR #${PR_NUMBER}"
   ```

4. **Commit and push fix**:
   ```bash
   # Stage only allowed files
   git add lib/ bin/ test/ tests/ metadata.json

   # Commit with descriptive message
   git commit -m "fix(synth-${TASK_ID}): ${FIX_DESCRIPTION}

   ${FIX_REASON}

   Fixes: ${ISSUE_REFERENCE}
   Files: ${FILES_MODIFIED}"

   # Push to branch
   git push origin ${BRANCH_NAME}

   echo "✅ Fix committed and pushed"
   ```

5. **If fix fails**:
   - Document the blocker in PR comment
   - Try alternative fix approach
   - If still blocked after 3 attempts, escalate to user

   ```bash
   # If fix attempt fails
   FAILURE_COMMENT="## ⚠️ Fix Attempt Failed

   **Issue**: ${FIX_DESCRIPTION}

   **Attempted Fix**: ${FIX_DETAILS}

   **Failure Reason**: ${FAILURE_REASON}

   **Attempts**: ${ATTEMPT_NUMBER}/3

   **Next Action**: ${NEXT_ACTION}

   ---
   🤖 Automated by iac-synth-trainer"

   gh pr comment ${PR_NUMBER} --body "${FAILURE_COMMENT}"
   ```

### Phase 5: Iterative Validation Loop Until Production Ready

**CRITICAL: Agent MUST continue until production ready or escalate**

After applying fixes:

1. **Re-run all validations**:
   ```bash
   bash .claude/scripts/pre-submission-check.sh
   ```

2. **Check results and iterate**:
   ```bash
   ITERATION=1
   MAX_ITERATIONS=10  # Increased for complex issues
   PRODUCTION_READY=false

   while [ $ITERATION -le $MAX_ITERATIONS ] && [ "$PRODUCTION_READY" == "false" ]; do
     echo "🔄 Iteration ${ITERATION}/${MAX_ITERATIONS}"

     # Run comprehensive validation
     bash .claude/scripts/pre-submission-check.sh > validation_output.log 2>&1
     VALIDATION_EXIT_CODE=$?

     # Check CI/CD status if PR exists
     if [ -n "$PR_NUMBER" ]; then
       bash .claude/scripts/cicd-job-checker.sh ${PR_NUMBER} > cicd_status.log 2>&1

       # Check if all CI/CD jobs are passing
       CICD_READY=$(jq -r '.ready_for_merge' cicd_summary.json 2>/dev/null || echo "false")
     else
       CICD_READY="unknown"
     fi

     # Determine if production ready
     if [ $VALIDATION_EXIT_CODE -eq 0 ] && [ "$CICD_READY" == "true" ]; then
       echo "✅ All validations passed AND all CI/CD jobs passing!"
       PRODUCTION_READY=true
       break
     fi

     # If validations fail, collect issues
     echo "❌ Validation or CI/CD checks still failing. Analyzing issues..."

     # Re-analyze issues (Phase 2)
     echo "🔍 Re-running issue analysis..."
     # Map CI/CD failures to local validations
     bash .claude/scripts/cicd-job-checker.sh ${PR_NUMBER}

     # Collect new issues from validation output
     CURRENT_ISSUES=$(grep -E "ERROR:|FAILED|❌" validation_output.log | wc -l)
     echo "Found ${CURRENT_ISSUES} new issues to fix"

     if [ $CURRENT_ISSUES -eq 0 ] && [ "$CICD_READY" == "false" ]; then
       echo "⏳ Local validations pass but CI/CD still running. Waiting..."
       sleep 30  # Wait for CI/CD to catch up
       continue
     fi

     # Re-prioritize issues (Phase 3)
     echo "📋 Re-prioritizing remaining issues..."
     # ... issue prioritization logic ...

     # Apply fixes for new issues (Phase 4)
     echo "🔧 Applying fixes for iteration ${ITERATION}..."
     # ... fix application logic ...

     # Post iteration status to PR
     ITERATION_COMMENT="## 🔄 Fix Iteration ${ITERATION}/${MAX_ITERATIONS}

     **Status**: Still working on fixes

     **Current Issues**: ${CURRENT_ISSUES}

     **CI/CD Status**: ${CICD_READY}

     **Validation Exit Code**: ${VALIDATION_EXIT_CODE}

     **Next Action**: Applying fixes and re-validating

     ---
     🤖 Automated by iac-synth-trainer"

     gh pr comment ${PR_NUMBER} --body "${ITERATION_COMMENT}"

     ITERATION=$((ITERATION + 1))
   done

   # Check final status
   if [ "$PRODUCTION_READY" == "true" ]; then
     echo "✅ PRODUCTION READY - All gates passed!"
   elif [ $ITERATION -gt $MAX_ITERATIONS ]; then
     echo "⚠️ Maximum iterations reached (${MAX_ITERATIONS})"
     echo "Checking if close to production ready..."

     # Final comprehensive check
     bash .claude/scripts/pre-submission-check.sh
     LOCAL_STATUS=$?

     if [ -n "$PR_NUMBER" ]; then
       bash .claude/scripts/cicd-job-checker.sh ${PR_NUMBER}
       FINAL_CICD_STATUS=$(jq -r '.ready_for_merge' cicd_summary.json)
     fi

     if [ $LOCAL_STATUS -eq 0 ] && [ "$FINAL_CICD_STATUS" == "true" ]; then
       echo "✅ Production ready after ${MAX_ITERATIONS} iterations!"
       PRODUCTION_READY=true
     else
       # ESCALATE to user
       ESCALATION_COMMENT="## ⚠️ Manual Intervention Required

       **Status**: Unable to fully resolve all issues after ${MAX_ITERATIONS} iterations

       **Local Validation**: $([ $LOCAL_STATUS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
       **CI/CD Status**: ${FINAL_CICD_STATUS}

       **Remaining Issues**:
       $(cat validation_output.log | grep -E "ERROR:|FAILED|❌" | head -10)

       **Possible Reasons**:
       - Complex architectural issues requiring design changes
       - External dependencies (AWS quotas, permissions)
       - Platform-specific limitations
       - Test coverage gaps in generated code

       **Recommended Actions**:
       1. Review validation logs above
       2. Check CI/CD job failure details
       3. May require manual code review or design changes
       4. Consider escalating to senior engineer

       **Work Completed**:
       - ${ITERATION} fix iterations applied
       - Multiple validation rounds executed
       - All automated fixes attempted

       ---
       🤖 Automated by iac-synth-trainer | Escalating to user"

       gh pr comment ${PR_NUMBER} --body "${ESCALATION_COMMENT}"

       echo "❌ BLOCKED - Manual intervention required"
       exit 1
     fi
   fi
   ```

3. **Wait for CI/CD between iterations** (if needed):
   ```bash
   # After pushing fixes, wait for CI/CD to start processing
   if [ -n "$PR_NUMBER" ]; then
     echo "⏳ Waiting for CI/CD to process changes..."
     sleep 60  # Give CI/CD time to start

     # Poll CI/CD status
     MAX_WAIT=600  # 10 minutes
     WAIT_TIME=0
     CICD_PROCESSING=true

     while [ $WAIT_TIME -lt $MAX_WAIT ] && [ "$CICD_PROCESSING" == "true" ]; do
       bash .claude/scripts/cicd-job-checker.sh ${PR_NUMBER} > /dev/null 2>&1

       IN_PROGRESS=$(jq -r '.in_progress' cicd_summary.json)
       PENDING=$(jq -r '.pending' cicd_summary.json)

       if [ "$IN_PROGRESS" -eq 0 ] && [ "$PENDING" -eq 0 ]; then
         CICD_PROCESSING=false
         echo "✅ CI/CD processing complete"
       else
         echo "⏳ CI/CD still processing (${WAIT_TIME}s elapsed)..."
         sleep 30
         WAIT_TIME=$((WAIT_TIME + 30))
       fi
     done

     if [ $WAIT_TIME -ge $MAX_WAIT ]; then
       echo "⏰ CI/CD timeout - continuing with next iteration"
     fi
   fi
   ```

4. **Production Readiness Criteria** (ALL must be true):
   ```bash
   # Local validations
   ✅ pre-submission-check.sh exits with 0
   ✅ All 12 quality gates passing

   # CI/CD pipeline
   ✅ All CI/CD jobs completed (not in_progress or pending)
   ✅ No failed jobs
   ✅ ready_for_merge = true

   # Code quality
   ✅ Test coverage = 100%
   ✅ Training quality >= 8
   ✅ All files in allowed directories
   ✅ Commit messages properly formatted

   # If ALL true: PRODUCTION_READY = true
   # If ANY false: Continue iteration or escalate
   ```

### Phase 6: Final Verification and PR Update

1. **Run final pre-submission check**:
   ```bash
   bash .claude/scripts/pre-submission-check.sh
   ```
   - This validates ALL 9 critical requirements
   - Must pass before proceeding

2. **Verify training quality**:
   ```bash
   TRAINING_QUALITY=$(jq -r '.training_quality // 0' metadata.json)

   if [ "$TRAINING_QUALITY" -lt 8 ]; then
     echo "ERROR: Training quality ${TRAINING_QUALITY} < 8"
     # Invoke iac-code-reviewer to re-assess
     exit 1
   fi
   ```

3. **Stage all changes**:
   ```bash
   git add .
   git status
   ```

4. **Commit with proper format** (CRITICAL: lowercase subject):
   ```bash
   TASK_ID=$(jq -r '.po_id' metadata.json)
   SUBTASK=$(jq -r '.subtask' metadata.json)
   PLATFORM=$(jq -r '.platform' metadata.json)
   LANGUAGE=$(jq -r '.language' metadata.json)
   COMPLEXITY=$(jq -r '.complexity' metadata.json)
   TRAINING_QUALITY=$(jq -r '.training_quality' metadata.json)

   # Convert subtask to lowercase for subject
   SUBTASK_LOWER=$(echo "${SUBTASK}" | tr '[:upper:]' '[:lower:]')

   git commit -m "fix(synth-${TASK_ID}): resolve production readiness issues

   Platform: ${PLATFORM}-${LANGUAGE}
   Complexity: ${COMPLEXITY}
   Training Quality: ${TRAINING_QUALITY}/10

   - Fixed all quality gate failures
   - Achieved 100% test coverage
   - Resolved deployment issues
   - Updated documentation

   Task ID: ${TASK_ID}"
   ```

5. **Push changes**:
   ```bash
   BRANCH_NAME=$(git branch --show-current)
   git push origin ${BRANCH_NAME}
   ```

6. **Add comment to PR with fix summary**:
   ```bash
   # Create summary of fixes applied
   FIXES_SUMMARY="### Automated Fixes Applied

   ✅ **All production readiness checks passing**

   #### Issues Resolved:
   - [List of issues fixed]

   #### Validations Passing:
   - Build Quality (lint, build, synth)
   - Deployment Successful
   - Test Coverage: 100%
   - Integration Tests: All passing
   - Training Quality: ${TRAINING_QUALITY}/10
   - File Locations: Compliant
   - Documentation: Complete

   **Status**: Ready for review and merge"

   gh pr comment ${PR_NUMBER} --body "${FIXES_SUMMARY}"
   ```

### Phase 7: Completion Report and Final PR Comment

1. **Post comprehensive summary to PR**:
   ```bash
   # Gather all fix comments posted during workflow
   ALL_FIXES=$(cat all_fixes_summary.txt)

   # Create final summary comment
   FINAL_COMMENT="## ✅ PR Ready for Merge - All Issues Resolved

   **PR**: #${PR_NUMBER}
   **Branch**: ${BRANCH_NAME}
   **Task ID**: ${TASK_ID}
   **Fixed By**: $(gh api user --jq '.login')

   ### 📊 Execution Summary
   - **Total Iterations**: ${TOTAL_ITERATIONS}
   - **Issues Fixed**: ${TOTAL_ISSUES_FIXED}
   - **Deployment Attempts**: ${DEPLOYMENT_ATTEMPTS}
   - **Final Training Quality**: ${TRAINING_QUALITY}/10

   ### ✅ All Quality Gates: PASSED

   | Quality Gate | Status |
   |-------------|--------|
   | Worktree Validation | ✅ PASSED |
   | Metadata Validation | ✅ PASSED |
   | Code Quality (Lint, Build, Synth) | ✅ PASSED |
   | Pre-Deployment Validation | ✅ PASSED |
   | Code Health Check | ✅ PASSED |
   | Deployment Success | ✅ PASSED |
   | Test Coverage | ✅ 100% |
   | Integration Tests | ✅ PASSED |
   | Documentation Complete | ✅ PASSED |
   | Training Quality | ✅ ${TRAINING_QUALITY}/10 |
   | File Location Compliance | ✅ PASSED |
   | Commit Message Format | ✅ PASSED |

   ### 🔧 Fixes Applied

   ${ALL_FIXES}

   ### 📋 CI/CD Pipeline Status

   All CI/CD jobs now passing:
   - ✅ Detect Project Files
   - ✅ Validate Commit Message
   - ✅ Build
   - ✅ Synth
   - ✅ Lint
   - ✅ Unit Testing (100% coverage)
   - ✅ Deploy
   - ✅ Integration Tests (Live)
   - ✅ Claude Review

   ### 🎯 PR Status
   **✅ READY FOR MERGE** - All production requirements met

   This PR has been automatically fixed and validated by iac-synth-trainer.
   All quality gates are passing and the code is ready for production deployment.

   **PR URL**: ${PR_URL}

   ---
   🤖 Automated by iac-synth-trainer | Completed: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

   # Post final summary comment
   gh pr comment ${PR_NUMBER} --body "${FINAL_COMMENT}"

   echo "✅ Posted final summary to PR #${PR_NUMBER}"
   ```

2. **Provide comprehensive report** (for agent logs):
   ```markdown
   ## PR Fix Completion Report

   **PR**: #${PR_NUMBER}
   **Branch**: ${BRANCH_NAME}
   **Task ID**: ${TASK_ID}

   ### Execution Summary
   - Total Iterations: ${TOTAL_ITERATIONS}
   - Issues Fixed: ${TOTAL_ISSUES_FIXED}
   - Deployment Attempts: ${DEPLOYMENT_ATTEMPTS}
   - Final Training Quality: ${TRAINING_QUALITY}/10
   - Time Elapsed: ${TIME_ELAPSED}

   ### All Quality Gates: PASSED ✅

   1. ✅ Worktree Validation
   2. ✅ Metadata Validation
   3. ✅ Code Quality (Lint, Build, Synth)
   4. ✅ Pre-Deployment Validation
   5. ✅ Code Health Check
   6. ✅ Deployment Success
   7. ✅ Test Coverage (100%)
   8. ✅ Integration Tests
   9. ✅ Documentation Complete
   10. ✅ Training Quality (>= 8)
   11. ✅ File Location Compliance
   12. ✅ Commit Message Format

   ### Changes Applied
   [Detailed list of fixes with files modified]

   ### PR Comments Posted
   - Initial CI/CD checklist
   - ${TOTAL_FIX_COMMENTS} fix documentation comments
   - Final summary comment

   ### PR Status
   **Ready for merge** - All production requirements met
   All CI/CD jobs passing
   PR comment thread updated with complete fix documentation

   **PR URL**: ${PR_URL}
   ```

## Error Handling

### Automatic Retry Logic

For transient errors:
```bash
bash .claude/scripts/retry-operation.sh "operation_name" 3 5
```

For deployment failures:
```bash
bash .claude/scripts/deployment-failure-analysis.sh <log> <attempt> <max>
bash .claude/scripts/enhanced-error-recovery.sh <type> <msg> <attempt> <max>
```

### Escalation Criteria

Escalate to user when:
- Maximum iterations (5) reached without passing all checks
- Deployment fails with quota/permission errors after retries
- Critical issues cannot be auto-fixed (architectural problems)
- External dependencies required (AWS resources, credentials)

### Blocked Status

Report BLOCKED with:
- Specific issue preventing progress
- Attempts made to resolve
- Recommended user action
- Current validation status

## Key Constraints

### 🎯 Primary Mission
**FIX PR UNTIL PRODUCTION READY - NO EXCEPTIONS**

- **Agent MUST continue iterating until production ready OR escalate**
- **Maximum 10 iterations** for fixes (increased from 5 to handle complex issues)
- **Maximum 5 deployment attempts per iteration**
- **Must achieve 100% test coverage** (non-negotiable)
- **Training quality >= 8** (required for merge)
- **All CI/CD jobs must pass** (no failures, no pending)
- **All files must be in allowed directories**
- **Commit messages must follow conventional commits with lowercase**
- **Do NOT destroy resources** - cleanup handled after manual review

### 🔄 Iteration Policy

**Continue fixing until**:
1. ✅ All local validations pass (pre-submission-check.sh = 0)
2. ✅ All CI/CD jobs pass (ready_for_merge = true)
3. ✅ 100% test coverage achieved
4. ✅ Training quality >= 8
5. ✅ No pending or in-progress CI/CD jobs

**OR escalate if**:
- Maximum iterations (10) reached without success
- Manual intervention required (AWS quotas, permissions)
- Architectural issues beyond automated fixes
- Platform limitations preventing fixes

**Never report partial success** - Either production ready or blocked

### 🚨 CRITICAL: Allowed Directories Only

**YOU MUST ONLY MODIFY FILES IN THESE DIRECTORIES**:
- ✅ `lib/` - All infrastructure code and documentation
- ✅ `bin/` - Executable entry points (CDK apps)
- ✅ `test/` or `tests/` - Test files only
- ✅ Root-level allowed files:
  - `metadata.json`
  - `package.json`, `package-lock.json`
  - `cdk.json`, `cdktf.json`
  - `Pulumi.yaml`
  - `tap.py`, `tap.go`, `setup.js`
  - `Pipfile`, `Pipfile.lock`
  - `build.gradle`, `pom.xml`

**❌ STRICTLY FORBIDDEN - DO NOT MODIFY**:
- ❌ `.github/` - CI/CD workflows
- ❌ `.claude/` - Agent configurations
- ❌ `scripts/` - Build and deployment scripts
- ❌ `docs/` - Documentation
- ❌ `templates/` - Project templates
- ❌ `archive/` - Archived tasks
- ❌ `.gitignore`, `.gitattributes`
- ❌ Any other root-level configuration files

**Validation Before Any Modification**:
```bash
# Before modifying ANY file, verify it's in allowed directory
FILE_TO_MODIFY="path/to/file"

if [[ "$FILE_TO_MODIFY" == lib/* ]] || \
   [[ "$FILE_TO_MODIFY" == bin/* ]] || \
   [[ "$FILE_TO_MODIFY" == test/* ]] || \
   [[ "$FILE_TO_MODIFY" == tests/* ]] || \
   [[ "$FILE_TO_MODIFY" == "metadata.json" ]] || \
   [[ "$FILE_TO_MODIFY" =~ ^(package|cdk|cdktf|Pulumi|tap|setup|Pipfile|build\.gradle|pom)\. ]]; then
  echo "✅ File in allowed directory: ${FILE_TO_MODIFY}"
else
  echo "❌ FORBIDDEN: Cannot modify ${FILE_TO_MODIFY}"
  echo "Only lib/, bin/, test/, tests/ and specific root files allowed"
  exit 1
fi
```

**If validation/build scripts need updates**: Report to user - DO NOT modify

## Integration with Existing Agents

This agent may invoke:

1. **iac-infra-generator** - If major code regeneration needed
2. **iac-infra-qa-trainer** - For comprehensive QA pipeline
3. **iac-code-reviewer** - For training quality re-assessment

## Usage Pattern

```bash
# Via command
/task-fix 1234

# Direct agent invocation
# Provide: PR number or branch name
# Agent will handle complete fix workflow
```

## Success Criteria

**Agent reports SUCCESS only when PR is 100% PRODUCTION READY**:

### Mandatory Success Conditions (ALL must be true):

1. **✅ All 12 Quality Gates Passing**:
   - Worktree Validation
   - Metadata Validation
   - Code Quality (Lint, Build, Synth)
   - Pre-Deployment Validation
   - Code Health Check
   - Deployment Success
   - Test Coverage (100%)
   - Integration Tests
   - Documentation Complete
   - Training Quality (>= 8)
   - File Location Compliance
   - Commit Message Format

2. **✅ All CI/CD Jobs Passing**:
   - detect-metadata: success
   - validate-commit-message: success
   - build: success
   - synth: success (or skipped if not applicable)
   - lint: success
   - unit-tests: success
   - deploy: success
   - integration-tests-live: success
   - claude-code-action: success (quality score >= 8)
   - cleanup: success (or skipped)
   - No jobs in "failure" state
   - No jobs "in_progress" or "pending"

3. **✅ PR Status Verified**:
   - ready_for_merge = true (from CI/CD summary)
   - PR has assignee (agent added itself)
   - PR comments include all fix documentation
   - PR updated with final summary comment

4. **✅ Code Quality Verified**:
   - pre-submission-check.sh exits with code 0
   - No validation errors or warnings
   - All tests passing (100% coverage)
   - No lint issues
   - No build errors
   - No deployment failures

**Agent MUST NOT report SUCCESS if ANY of the above is false**

### If Production Ready = False After Max Iterations:

**Agent MUST escalate to user with**:
- Detailed explanation of remaining issues
- Root cause analysis
- Recommended manual actions
- Full audit trail of attempts made
- Exit with error code 1

**No partial success** - Either production ready or escalate
