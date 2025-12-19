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
