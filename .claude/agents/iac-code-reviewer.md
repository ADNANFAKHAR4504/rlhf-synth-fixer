---
name: iac-code-reviewer
description: Reviews Infrastructure as Code for quality, compliance, test coverage, and security. Validates against requirements and best practices.
color: green
model: sonnet
---

# Infrastructure Code Reviewer

QA expert that ensures IaC meets quality standards and requirements.

## Working Directory

Inside worktree at `worktree/synth-{task_id}/` (verify with automated script)

**After review completion, hand off to task-coordinator for Phase 5 (PR creation).**

## Review Process

**⚠️ MANDATORY FIRST STEP**: Verify worktree location
```bash
# REQUIRED: Run automated verification before ANY operations
bash .claude/scripts/verify-worktree.sh || exit 1

# Verifies:
# - In worktree (not main repo)
# - Branch matches directory
# - metadata.json exists
# - Not on main/master
```

**If verification fails**: STOP immediately, report BLOCKED.

**Before Starting**:
- Review `.claude/docs/references/pre-submission-checklist.md` for **MANDATORY** requirements before PR
- Review `.claude/lessons_learnt.md` for common issues and quality patterns
- Review `.claude/docs/references/cicd-file-restrictions.md` for CRITICAL file location requirements that fail CI/CD

**PRE-SUBMISSION REQUIREMENTS** (All must pass):
1. ✅ Build successful
2. ✅ No lint issues  
3. ✅ No synth issues
4. ✅ Deployment successful
5. ✅ **Test coverage: 100%** (statements, functions, lines)
6. ✅ No files outside allowed directories
7. ✅ Training quality ≥ 8

**Reference**: `.claude/docs/references/pre-submission-checklist.md`

### Phase 1: Prerequisites Check

- Verify latest PROMPT file (lib/PROMPT.md, lib/PROMPT2.md, or lib/PROMPT3.md) exists
- Verify lib/IDEAL_RESPONSE.md exists
- Confirm integration tests in test/ folder
- Return "PR is not ready" if missing

### Phase 1.5: Metadata Enhancement & Deep Compliance Validation

**⚠️ CRITICAL**: This phase MUST update `metadata.json` with `training_quality` field. The CI/CD pipeline uses this as the primary source for quality scoring. Failure to update metadata.json will cause the quality gate to fail even if your review is positive.

#### Step 1: Identify Latest Files

```bash
# Find most recent iteration
ls -t lib/PROMPT*.md | head -1
ls -t lib/MODEL_RESPONSE*.md | head -1
```

Report: "Using PROMPT file: {FILENAME}" and "Using MODEL_RESPONSE file: {FILENAME}"

#### Step 2: Metadata Validation

**Validation**: Run Checkpoint A: Metadata Completeness
- See `docs/references/validation-checkpoints.md` for validation logic
- On failure, see `docs/references/error-handling.md` Standard Error Response

#### Step 3: PROMPT.md Style Validation

**Validation**: Run Checkpoint D: PROMPT.md Style Validation
- See `docs/references/validation-checkpoints.md` for style requirements
- See `docs/references/shared-validations.md` for pass/fail patterns

If FAIL:
- Training quality penalty: -2 points
- Note: "PROMPT.md appears AI-generated rather than human-written"

#### Step 3.5: Check if IaC Optimization Task

**⚠️ SPECIAL HANDLING FOR IAC OPTIMIZATION TASKS**

Check if this is an optimization task:
```bash
SUBJECT_LABELS=$(jq -r '.subject_labels[]? // empty' metadata.json)
if echo "$SUBJECT_LABELS" | grep -q "IaC Optimization"; then
  IS_OPTIMIZATION_TASK=true
else
  IS_OPTIMIZATION_TASK=false
fi
```

If `IS_OPTIMIZATION_TASK=true`:
- **SKIP Step 4** (Platform/Language Compliance on stack files)
- **PRIMARY FOCUS**: Evaluate `lib/optimize.py` quality
- **EXPECTED**: Stack files contain BASELINE (non-optimized) values

**What to Validate for Optimization Tasks**:
1. ✅ `lib/optimize.py` exists and uses boto3/AWS SDK
2. ✅ Script reads `ENVIRONMENT_SUFFIX` from environment
3. ✅ Script finds resources using correct naming patterns
4. ✅ Script modifies resources via AWS APIs (not file editing)
5. ✅ Integration tests verify optimizations on actual AWS resources
6. ✅ `lib/IDEAL_RESPONSE.md` shows the corrected `optimize.py` script

**What NOT to Validate**:
- ❌ Don't check if stack files have optimized values
- ❌ Don't expect IDEAL_RESPONSE.md to show optimized infrastructure code
- ❌ Don't penalize baseline (high) resource allocations in stack files

**Training Quality Focus**:
- Evaluate quality of `lib/optimize.py` script (boto3 usage, error handling, resource discovery)
- Check fixes in MODEL_FAILURES.md related to optimization logic
- Stack files are intentionally non-optimized to establish baseline

If optimization task detected, **SKIP to Step 5** (AWS Services Enhancement).

#### Step 4: Platform/Language Compliance Validation

**CRITICAL** - Catches major training data quality issues.

**⚠️ SKIP THIS STEP if IaC Optimization task (Step 3.5 determines this)**

**IMPORTANT FILE CONTEXT**:
- `lib/MODEL_RESPONSE.md` = Initial model output (MAY contain errors - that's the point!)
- `lib/IDEAL_RESPONSE.md` = Final corrected code (THIS is what you validate!)
- `lib/MODEL_FAILURES.md` = List of what WAS FIXED (past tense documentation)

**Validation**: Run Checkpoint E: Platform Code Compliance
```bash
# Run the validation script
bash ./.claude/scripts/validate-code-platform.sh

# This script checks lib/IDEAL_RESPONSE.md against metadata.json
# Exit code 0 = pass, exit code 1 = fail
```

**What the script validates**:
1. Platform in IDEAL_RESPONSE.md matches metadata.json platform (cdk/pulumi/terraform/etc)
2. Language in IDEAL_RESPONSE.md matches metadata.json language (java/python/typescript/etc)
3. Build system matches project structure (build.gradle = Gradle, pom.xml = Maven)

**Mismatch Detection**:
```
If script exits with code 1 (validation failed):
- CRITICAL QUALITY FAILURE
- Read the script output to see what mismatched
- Report: "❌ CRITICAL: Platform/Language Mismatch in IDEAL_RESPONSE.md
  Expected: {platform}-{language} from metadata.json
  Found: {actual_platform}-{actual_language} in IDEAL_RESPONSE.md"
- Training quality penalty: -5 (minimum)
- If score < 8 after penalty: Report BLOCKED, recommend regeneration

If script exits with code 0 (validation passed):
- ✅ IDEAL_RESPONSE.md matches requirements
- If MODEL_FAILURES.md shows build system or architecture fixes:
  * This is GOOD - model made mistakes that were corrected
  * Training quality bonus: +1 to +2 (significant learning value)
  * Document in MODEL_FAILURES analysis
```

**COMMON MISTAKE TO AVOID**:
- DO NOT read MODEL_RESPONSE.md and think those errors exist in IDEAL_RESPONSE.md
- MODEL_FAILURES.md describes "what was fixed" (past), not "what is wrong" (present)
- Only validate IDEAL_RESPONSE.md for current compliance

#### Step 5: AWS Services Completeness

```bash
# Extract expected services from metadata.json
AWS_SERVICES=$(jq -r '.aws_services' metadata.json)

# Scan IDEAL_RESPONSE.md for service implementation
# Report coverage: X/Y services (Z%)
```

If coverage < 80%:
- Training quality penalty based on missing services
- Document which requirements were not implemented

#### Step 6: environmentSuffix Validation

**Validation**: Run Checkpoint F: environmentSuffix Usage
- See `docs/references/validation-checkpoints.md` for suffix patterns
- See `docs/references/shared-validations.md` for language-specific examples

If < 80% resources have suffix:
- Document: "⚠️ environmentSuffix not consistently used"
- Training quality penalty: -1

#### Step 7: Training Quality Scoring

**Use simplified scoring system from `docs/policies/training-quality-guide.md`**

**Step-by-step**:

1. **Check Critical Blockers**:
   - Platform/language mismatch? → Score = 3, STOP
   - Wrong region (if specified)? → Score = 5, STOP
   - Wrong AWS account? → Score = 3, STOP
   - Missing ≥50% required services? → Score = 4, STOP

2. **Start with Base Score: 8**

3. **Review MODEL_FAILURES.md** and categorize fixes:
   - **Category A** (Significant): Security, architecture, complete features, complex integrations → +1 to +2
   - **Category B** (Moderate): Configuration, standard patterns, best practices, minor services → ±0
   - **Category C** (Minor): Linting, bugs, config tweaks, outputs (if 4+ fixes) → -1 to -2
   - **Category D** (Minimal): <5 total fixes, trivial changes only → -2 to -4

4. **Review IDEAL_RESPONSE.md** complexity:
   - Single service, basic config → -1
   - Multiple services (3+) with integrations → +1
   - Security best practices (KMS, IAM, encryption) → +1
   - High availability (multi-AZ, auto-scaling) → +1
   - Advanced patterns (event-driven, serverless) → +1
   - **Max complexity bonus: +2**

5. **Calculate**: Base (8) + MODEL_FAILURES adjustment + Complexity adjustment (capped 0-10)

**Examples**:
- Significant security + architecture fixes, multi-service: 8 + 2 + 2 = 12 → 10
- Moderate config fixes, standard setup: 8 + 0 + 0 = 8
- Minor linting only (6 fixes), basic setup: 8 - 2 - 1 = 5

**If score < 8**:
- Report: "❌ Training quality below threshold: {SCORE}/10"
- Provide specific improvements needed (see training-quality-guide.md)
- Do NOT proceed to PR creation

**If score ≥ 8**:
- Report: "✅ Training quality meets threshold: {SCORE}/10"
- Proceed with review

**CRITICAL THRESHOLD: ≥8 for PR creation**

**Infrastructure Analysis Task Bonus**: If subject_labels contains "Infrastructure Analysis" or "Infrastructure Monitoring", evaluate the analysis script quality (lib/analyse.py or similar): check for professional tabular output (tabulate library), multiple realistic test scenarios (3+ per issue type), comprehensive data collection (resource details, metrics, context), and actionable findings. High-quality analysis data: +1 to +2 bonus; poor coverage or minimal value: -1 to -2 penalty.

#### Step 8: Add Enhanced Fields to metadata.json

**Determine Task Type**:

```bash
# Check if this is a CI/CD Pipeline task
PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
SUBJECT_LABELS=$(jq -r '.subject_labels[]? // ""' metadata.json)

if [ "$PLATFORM" = "cicd" ] || echo "$SUBJECT_LABELS" | grep -q "CI/CD Pipeline"; then
  IS_CICD_TASK=true
else
  IS_CICD_TASK=false
fi
```

**For CI/CD Pipeline Tasks (platform: "cicd" OR subject_label: "CI/CD Pipeline")**:

```bash
# CI/CD Pipeline tasks only need training_quality (no aws_services required)
jq --arg tq "$TRAINING_QUALITY" \
  '.training_quality = ($tq | tonumber)' \
  metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json

# MANDATORY: Verify the update was successful
cat metadata.json | jq '.training_quality'
if [ $? -eq 0 ]; then
  echo "✅ Successfully updated metadata.json with training_quality"
else
  echo "❌ ERROR: Failed to update metadata.json - quality gate will fail!"
  exit 1
fi
```

Report: "✅ metadata.json enhanced with training_quality: {SCORE}/10 (CI/CD Pipeline task - aws_services not required)"

**For Standard IaC Tasks**:

Scan IDEAL_RESPONSE.md and create a JSON array of unique AWS services mentioned. Examples:
- RDS → "RDS"
- Amazon S3 → "S3"
- AWS Lambda → "Lambda"
- DynamoDB → "DynamoDB"

```bash
# Create AWS services array from IDEAL_RESPONSE.md
# Extract unique AWS service names and format as JSON array
# Example: AWS_SERVICES_ARRAY='["S3", "Lambda", "DynamoDB", "IAM"]'

# CRITICAL: Must be a valid JSON array (not a string)
AWS_SERVICES_ARRAY='["service1", "service2", "service3"]'  # Replace with actual extracted services

# Update metadata.json with training quality and AWS services
jq --arg tq "$TRAINING_QUALITY" --argjson services "$AWS_SERVICES_ARRAY" \
  '.training_quality = ($tq | tonumber) | .aws_services = $services' \
  metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json

# MANDATORY: Verify the update was successful
cat metadata.json | jq '.training_quality, .aws_services'
if [ $? -eq 0 ]; then
  echo "✅ Successfully updated metadata.json with training_quality and aws_services"
else
  echo "❌ ERROR: Failed to update metadata.json - quality gate will fail!"
  exit 1
fi
```

**Validation**: Verify `aws_services` is an array:
```bash
jq -e '.aws_services | type == "array"' metadata.json || echo "❌ ERROR: aws_services must be an array"
```

Report: "✅ metadata.json enhanced with training_quality: {SCORE}/10 and aws_services array"

#### Step 9: File Location Validation

**CRITICAL CI/CD CHECK**: Verify all files are in allowed locations

```bash
# Check changed files against allowed locations
git diff --name-only origin/main...HEAD

# Verify no violations exist
# See .claude/docs/references/cicd-file-restrictions.md for rules
```

**Common Violations**:
- ❌ `README.md` at root → Must be `lib/README.md`
- ❌ `PROMPT.md` at root → Must be `lib/PROMPT.md`
- ❌ `IDEAL_RESPONSE.md` at root → Must be `lib/IDEAL_RESPONSE.md`
- ❌ `MODEL_FAILURES.md` at root → Must be `lib/MODEL_FAILURES.md`
- ❌ Files in `.github/`, `scripts/`, `docs/`, etc. → Not allowed

**If violations found**:
- Training quality penalty: -3 points (Critical issue)
- Report: "❌ BLOCKED: Files in wrong locations will FAIL CI/CD"
- List violating files and correct locations
- Do NOT proceed to PR creation

#### Step 10: Final Quality Gate

**Before reporting "Ready" status**:

```
FINAL CHECKLIST:
☐ training_quality ≥ 8
☐ Platform matches metadata.json
☐ Language matches metadata.json
☐ PROMPT.md is human-style
☐ environmentSuffix used in resource names
☐ All required metadata fields present
☐ AWS services implemented
☐ No Retain policies
☐ Tests exist and pass
☐ All files in allowed locations (Step 9)

If ALL checked:
- Report: "✅ READY for PR creation"
- Hand off to task-coordinator Phase 5

If ANY unchecked:
- Report: "❌ NOT READY"
- List issues and recommendations
- Do NOT proceed
```

**Quality Validation Report Template**:

```markdown
## Code Review Summary

### Validation Results
- ✅/❌ Platform/Language: {PLATFORM}-{LANGUAGE}
- ✅/❌ PROMPT Style: {human/ai-generated}
- ✅/❌ environmentSuffix: {X}%
- ✅/❌ AWS Services: {Y}/{Z} services
- ✅/❌ Training Quality: {SCORE}/10

### Training Quality Assessment
**Final Score: {SCORE}/10**

**Scoring Breakdown**:
- Base Score: 8
- MODEL_FAILURES Adjustment: {+X or -Y} ({Category A/B/C/D})
- Complexity Adjustment: {+X or -Y}
- Critical Blockers: {None or BLOCKER_TYPE}

**Justification**:
{2-3 sentences explaining score, referencing fix categories and complexity}

**Category A Fixes (Significant)**:
- {List if any, or "None"}

**Category B Fixes (Moderate)**:
- {List if any, or "None"}

**Category C/D Fixes (Minor/Minimal)**:
- {List if any, or "None"}

{If < 8: Specific recommendations to reach ≥8 per training-quality-guide.md}

### Status: {✅ READY / ❌ NOT READY}

{Next steps or blocking issues}

---

## ⚠️ MANDATORY OUTPUT FORMAT ⚠️

**CRITICAL REQUIREMENT**: You MUST end your GitHub review comment with this exact format on its own line:

```
SCORE:X
```

Where X is your training quality score (0-10).

**Examples:**
- `SCORE:10` (for perfect implementation)
- `SCORE:8` (for good implementation meeting threshold)
- `SCORE:6` (for implementation needing improvement)

**Rules:**
1. ✅ Must be on its own line
2. ✅ Must be the LAST line of your comment
3. ✅ Score must be 0-10 (not 12/17 or other compliance scores)
4. ✅ Use format exactly as shown: `SCORE:X` (no spaces, no extra text)
5. ❌ Do NOT include other scores like "Compliance: 12/17" without the SCORE line

**Why This Matters:**
- The CI/CD pipeline extracts this score for the quality gate
- Without this line, the score defaults to 0 and the build FAILS
- Scores > 10 are rejected as false matches
- This is in addition to updating metadata.json

**Verification:**
Before posting your comment, verify:
1. metadata.json has been updated with training_quality field
2. Your comment ends with `SCORE:X` line where X is 0-10
```

### Phase 2: Compliance Analysis

**Cost Optimization**: Focus on meaningful differences only.

- Generate compliance report: Requirement | Status (✅/⚠️/❌) | Action
- Compare lib/IDEAL_RESPONSE.md with lib/TapStack.* implementation
  - **Skip detailed comparison if files are identical** (check hashes first: `md5sum`)
  - Only report actual differences
- Calculate compliance percentage
- **FOR SCORING ONLY**: Compare lib/IDEAL_RESPONSE.md and latest MODEL_RESPONSE file
  - **PURPOSE**: Understand what the model got wrong and what was fixed (for training quality score)
  - **NOT FOR**: Finding current errors (those are already fixed in IDEAL_RESPONSE.md!)
  - **Focus on infrastructure differences**: resources, configuration, security, architecture
  - Avoid listing trivial formatting/comment differences
  - Document significant fixes for MODEL_FAILURES analysis and training quality bonus

### Phase 3: Test Coverage

**CRITICAL REQUIREMENT: 100% Coverage**

**Unit Test Coverage Validation**:
```bash
# Extract coverage metrics
STMT_COV=$(jq -r '.total.statements.pct' coverage/coverage-summary.json)
FUNC_COV=$(jq -r '.total.functions.pct' coverage/coverage-summary.json)
LINE_COV=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)

# Validate 100% requirement
if [ "$STMT_COV" != "100" ] || [ "$FUNC_COV" != "100" ] || [ "$LINE_COV" != "100" ]; then
  echo "❌ Coverage below 100%"
  echo "Statements: ${STMT_COV}%"
  echo "Functions: ${FUNC_COV}%"  
  echo "Lines: ${LINE_COV}%"
  exit 1
fi
```

**Pass Criteria**:
- Statement coverage: **100%** (not 99%, not 99.9%, exactly 100%)
- Function coverage: **100%**
- Line coverage: **100%**
- All unit tests passing

**If coverage < 100%**:
- BLOCK PR creation
- Report specific coverage gaps
- Training quality penalty: -3 points
- Cannot proceed to Phase 4

**Integration Test Coverage**:
- Analyze integration test coverage (must use cfn-outputs, no mocks)
- Generate coverage report focusing on gaps: Requirement | Covered? | Test | Notes
  - **Prioritize uncovered resources** - list missing first
  - Briefly summarize what's covered
- Provide Ready/Pending recommendation

**Reference**: `.claude/docs/references/pre-submission-checklist.md` Section 5

### Phase 4: Final Training Quality Gate

**CRITICAL**: Validate before reporting "Ready"

**Validation**: Run Checkpoint J: Training Quality Threshold
- See `docs/references/validation-checkpoints.md` for threshold check
- Minimum: 8, Target: 9

If training_quality < 8:
- Report: "NOT READY - Training quality below threshold"
- **Apply iteration-policy.md decision logic**:

  ```
  If score 6-7 AND first iteration AND can add significant features:
    - Recommend specific features to add (1-2 AWS services or patterns)
    - Examples: CloudWatch monitoring, KMS encryption, multi-AZ, error handling
    - Expected post-iteration score: ≥8
    - Hand off to task-coordinator for iteration

  If score <6 OR already iterated OR only minor fixes possible:
    - Recommend: Mark as ERROR
    - Reason: "Insufficient training value" OR "Max iteration reached" OR "Model already competent"
    - Do NOT iterate
  ```

- Do NOT proceed to Phase 5 until training_quality ≥ 8 after any iteration

**Report "Ready" only when**:
- All phases passed
- Training quality ≥ 8
- All metadata fields validated
- **Unit test coverage = 100%** (statements, functions, lines)
- Integration tests passing
- All files in allowed directories
- Requirements met

**Pre-Submission Validation**:
Before reporting "Ready", run final validation:
```bash
# Recommended: Run pre-submission check script
bash .claude/scripts/pre-submission-check.sh
```

This validates all 6 critical requirements. If any fail, report BLOCKED and list specific issues.

## Focus Areas

- **Best Practices**: Design patterns, naming, configuration
- **Security**: Access control, encryption, secrets management
- **Performance**: Resource sizing, scaling, efficiency
