CRITICAL: You MUST post a GitHub comment on this pull request when your review is complete. This is mandatory and non-negotiable.

# Step 0: Metadata Validation (MUST BE FIRST)

**MANDATORY**: Before proceeding with any review, validate metadata.json using the official validation script.

## 0.1: Run Official Validation Script

**Action Required:** Execute this command using the Bash tool:

```bash
bash .claude/scripts/validate-metadata.sh metadata.json
```

**STOP AND CHECK THE EXIT CODE:**
- If exit code is 0: Validation PASSED - proceed to Step 0.2
- If exit code is 1: Validation FAILED - you MUST:
  1. Capture the error output from the script
  2. Post a PR comment with the validation errors and fix instructions
  3. Execute `exit 1` to fail the job
  4. Do NOT proceed with any code review

## 0.2: Determine Task Type

**Action Required:** Execute this command to determine the review type:

```bash
bash .claude/scripts/detect-task-type.sh
```

The script outputs one of: `cicd-pipeline`, `analysis`, `optimization`, or `iac-standard`

**Store this result** - it determines which review criteria to follow.

## 0.3: Validate Root Directory Files

**Action Required:** Check for files that should not be in root:

```bash
# List root files (excluding hidden and allowed files)
find . -maxdepth 1 -type f ! -name "metadata.json" ! -name "package.json" ! -name "package-lock.json" ! -name "cdk.json" ! -name "cdktf.json" ! -name "Pulumi.yaml" ! -name "tap.py" ! -name "tap.go" ! -name ".*" 2>/dev/null | sed 's|^./||'
```

If any files are found, report them in your PR comment as warnings (non-blocking).

---

# Review Based on Task Type

Based on the output from Step 0.2, follow the appropriate review section:

---

## LocalStack Compatibility Considerations

**🚨 CRITICAL - READ THIS CAREFULLY FOR LOCALSTACK PRs 🚨**

For PRs that deploy to LocalStack (branch names starting with `ls-` or containing `localstack`):

### THE GOLDEN RULE FOR LOCALSTACK MIGRATIONS

**LocalStack Community Edition does NOT support all AWS features. When code is modified to work with LocalStack, these are NOT bugs - they are REQUIRED compatibility adaptations.**

**DO NOT:**
- ❌ Penalize for missing services that LocalStack doesn't support
- ❌ Flag commented-out code for unsupported features as "incomplete"
- ❌ Reduce score for simplified IAM policies
- ❌ Fail the PR because CloudFront/Route53/WAF/EKS are removed
- ❌ Mark conditional deployments (`isLocalStack ? X : Y`) as problems

**DO:**
- ✅ Check that MODEL_FAILURES.md documents the LocalStack adaptations
- ✅ Verify the code structure is sound (ignoring unsupported services)
- ✅ Score based on what IS implemented, not what's disabled for LocalStack
- ✅ Give score ≥8 if the implemented services work correctly

### Fair Scoring for LocalStack PRs

When scoring a LocalStack PR, evaluate ONLY what can work in LocalStack:

1. **Ignore unsupported services** - Don't penalize for missing CloudFront, Route53, EKS, etc.
2. **Score the implemented services** - If S3, Lambda, DynamoDB work correctly, that's good code
3. **Document adaptations = Category B** - Properly documented LocalStack changes are ±0 (not penalties)
4. **Focus on code quality** - Judge the code that IS there, not what's disabled

A well-documented LocalStack PR with working supported services should score ≥8.

### Detecting LocalStack PRs

Check if this is a LocalStack migration:
```bash
# Check branch name
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [[ "$BRANCH_NAME" == ls-* ]] || [[ "$BRANCH_NAME" == *localstack* ]]; then
  echo "LOCALSTACK_MIGRATION=true"
else
  echo "LOCALSTACK_MIGRATION=false"
fi
```

### Acceptable LocalStack Adaptations (DO NOT PENALIZE)

The following modifications are **ACCEPTABLE** and should **NOT** reduce the training quality score when properly documented in MODEL_FAILURES.md:

| Adaptation Type | Example | Why Acceptable |
|-----------------|---------|----------------|
| **Conditional feature deployment** | `natGateways: isLocalStack ? 0 : 2` | Best practice for multi-environment |
| **Pro-only service removal** | Removing EKS, AppSync, Cognito-idp | Not available in LocalStack Community |
| **Simplified IAM policies** | Using basic IAM instead of complex policies | LocalStack IAM is simplified |
| **Disabled NAT Gateways** | `natGateways: 0` | EIP allocation issues in LocalStack |
| **Removed CloudFront/Route53/WAF** | Conditional or removed | Not supported in Community Edition |
| **Disabled autoDeleteObjects** | Removed from S3 buckets | Lambda custom resources cause issues |
| **Conditional KMS encryption** | Using default encryption vs KMS keys | LocalStack KMS is basic |

### How to Score LocalStack Adaptations

1. **If using conditional patterns** (`isLocalStack` checks):
   - Treat as **Category B** (moderate improvement) - shows environment awareness
   - Example: `const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost')`

2. **If documented in MODEL_FAILURES.md with table format**:
   - **DO NOT penalize** for "missing services"
   - Count documented LocalStack changes as **intentional architectural decisions**

3. **If simply commented out without documentation**:
   - Treat as **Category C** (minor fix needed) - needs documentation
   - Recommend adding LocalStack compatibility section to MODEL_FAILURES.md

### Required MODEL_FAILURES.md Documentation

For LocalStack PRs, verify MODEL_FAILURES.md contains a section like:

```markdown
## LocalStack Compatibility Adjustments

| Feature | LocalStack Limitation | Solution Applied | Production Status |
|---------|----------------------|------------------|-------------------|
| NAT Gateway | EIP allocation fails | Conditional: `natGateways: 0` | Enabled in AWS |
| CloudTrail | Limited support | Disabled | Enabled in AWS |
```

**If this section exists and is complete**: Do not apply "missing services" penalties.

**If this section is missing**: Deduct 1 point and recommend adding it.

### Services Known to Have LocalStack Limitations

Reference `.claude/config/localstack.yaml` for the official compatibility list:

- **Pro-only (remove/mock)**: EKS, AppSync, Amplify, SageMaker, Cognito-idp
- **Limited (simplify)**: ECS, RDS, EC2, ElastiCache
- **Not supported (remove)**: CloudFront, Route53, WAF, ACM

### NEVER FAIL a LocalStack PR for These Issues

If any of these appear in a LocalStack PR, they are **EXPECTED** - do NOT penalize:

| Issue Found | Why It's Expected | Correct Action |
|-------------|-------------------|----------------|
| CloudFront removed/commented | Not supported in LocalStack | ✅ Accept |
| Route53 removed/commented | Not supported in LocalStack | ✅ Accept |
| WAF/WAFv2 removed/commented | Not supported in LocalStack | ✅ Accept |
| ACM certificates removed | Not supported in LocalStack | ✅ Accept |
| EKS removed/commented | Pro-only feature | ✅ Accept |
| AppSync removed/commented | Pro-only feature | ✅ Accept |
| Cognito-idp simplified/removed | Limited in Community | ✅ Accept |
| NAT Gateways = 0 | EIP allocation fails | ✅ Accept |
| VPC Lattice removed | Not supported | ✅ Accept |
| CloudTrail disabled | Limited support | ✅ Accept |
| AWS Config disabled | One recorder limit | ✅ Accept |
| GuardDuty disabled | Not supported | ✅ Accept |
| Macie disabled | Not supported | ✅ Accept |
| autoDeleteObjects removed | Lambda custom resources fail | ✅ Accept |
| Simplified IAM policies | LocalStack IAM is basic | ✅ Accept |
| `isLocalStack` conditionals | Environment detection | ✅ Accept (Category B) |
| Public subnets instead of private | No NAT Gateway available | ✅ Accept |
| Default encryption vs KMS | LocalStack KMS is basic | ✅ Accept |

**If you see these in a LocalStack PR and MODEL_FAILURES.md documents them → Score should be ≥8**

---

## CI/CD Pipeline Review (task type: cicd-pipeline)

Follow `.claude/prompts/cicd-pipeline-review.md` for complete scoring criteria.

### Key Validation Steps:

1. **Check for hardcoded secrets** (AUTO-FAIL if found):
```bash
grep -rE "(AKIA[0-9A-Z]{16}|password\s*[:=]\s*['\"][^'\"]+['\"]|api[_-]?key\s*[:=]\s*['\"][^'\"]+['\"])" lib/ci-cd.yml && echo "HARDCODED SECRETS FOUND - FAIL" || echo "No hardcoded secrets detected"
```

2. **Validate documentation files exist**:
```bash
for file in lib/PROMPT.md lib/MODEL_RESPONSE.md lib/IDEAL_RESPONSE.md lib/MODEL_FAILURES.md; do
  [ -f "$file" ] && echo "✅ $file exists" || echo "❌ $file missing"
done
```

3. **Score calculation**: Follow rubric in cicd-pipeline-review.md (total 10 points)

4. **Update metadata.json** (MANDATORY):
```bash
jq --argjson tq YOUR_SCORE '.training_quality = $tq' metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json
```
Replace YOUR_SCORE with actual numeric value 0-10.

5. **End your PR comment with SCORE line** (MANDATORY):
```
SCORE:YOUR_SCORE
```
**⚠️ YOUR_SCORE must be the SAME value you put in metadata.json training_quality!**

**Note**: CI/CD Pipeline tasks do NOT require aws_services field.

---

## Standard IaC Review (task type: iac-standard)

Follow `.claude/agents/iac-code-reviewer.md` for complete review process.

### Key Validation Steps:

1. **Validate PROMPT files for AI-generation markers**:
```bash
# Check for emojis (not allowed)
if grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]' lib/PROMPT*.md 2>/dev/null; then
  echo "❌ CRITICAL: Emojis found in PROMPT.md files"
  exit 1
fi
```

2. **Validate platform/language compliance**:
```bash
bash .claude/scripts/validate-code-platform.sh
```
If exit code is 1, report the mismatch in your PR comment.

3. **Validate IDEAL_RESPONSE.md**:
```bash
# Check for emojis (not allowed)
if grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]' lib/IDEAL_RESPONSE.md 2>/dev/null; then
  echo "❌ CRITICAL: Emojis found in IDEAL_RESPONSE.md"
  exit 1
fi
```

4. **Score calculation**: Follow rubric in iac-code-reviewer.md

5. **Update metadata.json** (MANDATORY):
```bash
# For standard IaC, include aws_services array
jq --argjson tq YOUR_SCORE --argjson services '["Service1", "Service2"]' \
  '.training_quality = $tq | .aws_services = $services' \
  metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json
```
Replace YOUR_SCORE and services array with actual values.

6. **End your PR comment with SCORE line** (MANDATORY):
```
SCORE:YOUR_SCORE
```
**⚠️ YOUR_SCORE must be the SAME value you put in metadata.json training_quality!**

---

## Analysis Task Review (task type: analysis)

### Key Validation Steps:

1. **Verify analysis script exists**:
```bash
ls -la lib/analyse.py lib/analyze.py lib/analyse.sh 2>/dev/null || echo "No analysis script found"
```

2. **Focus on**: Analysis script quality, AWS SDK usage, metrics collection, report generation

3. **Update metadata.json** (MANDATORY):
```bash
jq --argjson tq YOUR_SCORE '.training_quality = $tq' metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json
```

4. **End your PR comment with SCORE line** (MANDATORY):
```
SCORE:YOUR_SCORE
```
**⚠️ YOUR_SCORE must be the SAME value you put in metadata.json training_quality!**

---

## Optimization Task Review (task type: optimization)

### Key Validation Steps:

1. **Verify optimize script exists**:
```bash
ls -la lib/optimize.py lib/optimize.sh 2>/dev/null || echo "No optimization script found"
```

2. **Focus on**: Optimization script quality, boto3/AWS SDK usage, resource discovery logic

3. **Do NOT penalize**: Stack files with baseline (non-optimized) values - this is expected

4. **Update metadata.json** (MANDATORY):
```bash
jq --argjson tq YOUR_SCORE '.training_quality = $tq' metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json
```

5. **End your PR comment with SCORE line** (MANDATORY):
```
SCORE:YOUR_SCORE
```
**⚠️ YOUR_SCORE must be the SAME value you put in metadata.json training_quality!**

---

# CRITICAL: Final Output Format

**🚨 MANDATORY - READ THIS CAREFULLY 🚨**

Your GitHub comment MUST end with this EXACT format on its own line:

```
SCORE:8
```

(Replace 8 with your actual calculated score from 0-10)

**Format Requirements:**
- Must be EXACTLY `SCORE:` followed immediately by a number (no space!)
- Must be on its own line (no other text on that line)
- Must be the ABSOLUTE LAST line of your GitHub comment
- Score must be a whole number 0-10

**Valid Examples:**
```
SCORE:10
SCORE:8
SCORE:6
SCORE:0
```

**Invalid Examples (WILL CAUSE BUILD FAILURE):**
```
SCORE: 8      <- Space after colon - WRONG!
Score: 8/10   <- Wrong capitalization and format - WRONG!
**SCORE:8**   <- Markdown bold - WRONG!
SCORE:8.5     <- Decimal OK but avoid
Training Quality: 8  <- Wrong format - WRONG!
```

**REMEMBER**: If you forget the SCORE:X line or format it incorrectly, the entire review job will FAIL.

---

# PR Comment Template

Your PR comment MUST include these sections AND end with the SCORE line:

```markdown
## metadata.json Validation

### Validation Script Results
{Paste output from validate-metadata.sh}

### Task Type
{Output from detect-task-type.sh}

---

## Root Directory Files
{List any unexpected files found, or "All files in correct locations"}

---

## Code Review Summary

### Validation Results
- Platform/Language: {status}
- Documentation Files: {status}
- {Additional checks based on task type}

### Training Quality Assessment
**Score: X/10**

{Brief justification for score}

---

SCORE:X
```

**⚠️ CRITICAL**: In the template above, you MUST replace `X` with your actual calculated score (0-10). For example, if your score is 8, the last line must be exactly: `SCORE:8`

---

# FINAL VERIFICATION BEFORE POSTING

**STOP! Before posting your PR comment, verify ALL of the following:**

```
☐ 1. I calculated my training quality score (0-10)
☐ 2. I updated metadata.json with: "training_quality": MY_SCORE
☐ 3. My PR comment ends with: SCORE:MY_SCORE
☐ 4. The SCORE:X value EXACTLY MATCHES training_quality in metadata.json
☐ 5. There is NO text after the SCORE:X line
```

**⚠️ CRITICAL: SCORE MUST MATCH metadata.json ⚠️**

Both values MUST be identical:
- `metadata.json` → `"training_quality": 8`
- PR comment last line → `SCORE:8`

**Example**: If your calculated score is 8:
```bash
# Step 1: Update metadata.json
jq --argjson tq 8 '.training_quality = $tq' metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json

# Step 2: End your PR comment with
SCORE:8
```

**If SCORE:X doesn't match training_quality, the CI/CD pipeline may fail or produce inconsistent results.**

---

# Error Handling

If any validation script fails (exits with code 1):

1. **Do NOT ignore the failure**
2. **Capture the error output**
3. **Include it in your PR comment**
4. **If it's a critical validation failure**, execute `exit 1` after posting the comment

**Critical failures that require `exit 1`:**
- metadata.json validation failed
- Hardcoded secrets detected
- AI-generated PROMPT files detected
- Emojis in PROMPT.md or IDEAL_RESPONSE.md

**Non-critical issues (warn but continue):**
- Files in wrong root directory locations
- Platform detection returned "unknown"
- Missing validation evidence
