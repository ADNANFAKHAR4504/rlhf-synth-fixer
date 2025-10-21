# Training Quality Scoring Guide

## Purpose

Training quality measures **learning value for model improvement**, not code quality. A score of 8+ indicates the task provides sufficient training data.

## Core Principle

**What matters**: The gap between MODEL_RESPONSE and IDEAL_RESPONSE
- Large gap with significant fixes = High training value (8-10)
- Small gap with minor fixes = Low training value (4-7)
- Minimal/no gap = Insufficient training value (0-3)

**Note**: Production-ready MODEL_RESPONSE with few fixes = low training value (model already competent)

---

## Simplified Scoring System

### Step 1: Start with Base Score

**Default**: 8 points (threshold for PR creation)

### Step 2: Apply Critical Blockers (Automatic Fail)

These issues drop score below 8 immediately:

| Blocker | Score Impact | Example |
|---------|--------------|---------|
| Platform/language mismatch | Set to 3 | Task requires Pulumi+Go, code is CDK+TypeScript |
| Wrong region (if specified) | Set to 5 | Task requires eu-west-1, deployed to us-east-1 |
| Wrong AWS account | Set to 3 | Deployed to wrong account |
| Missing ≥50% required services | Set to 4 | Task needs 4 services, only 2 implemented |

**If any blocker present**: Score is set to blocker value, skip to Step 5.

### Step 3: Adjust for MODEL_FAILURES Quality

Review MODEL_FAILURES.md and categorize the fixes made:

#### Category A: Significant Improvements (+1 to +2)
- **Security vulnerabilities fixed** (IAM permissions, encryption, secrets)
- **Architecture changes** (added services, multi-AZ, scaling)
- **Complete features added** (monitoring, logging, error handling)
- **Complex integrations fixed** (service-to-service connections)

**Examples**:
- Added KMS encryption where MODEL_RESPONSE had none
- Implemented CloudWatch monitoring/alerting
- Fixed Lambda-RDS connection security
- Added auto-scaling configuration

**Adjustment**: If ≥2 Category A fixes → +2 points; if 1 Category A fix → +1 point

#### Category B: Moderate Improvements (±0)
- **Configuration adjustments** (resource sizes, timeouts, regions)
- **Standard patterns applied** (naming conventions, tagging)
- **Best practices added** (VPC endpoints, private subnets)
- **Minor service additions** (CloudWatch Logs, parameter store)

**Examples**:
- Changed RDS instance size from db.t2.micro to db.t3.small
- Added resource tags for cost tracking
- Used VPC endpoints instead of NAT Gateway
- Fixed resource naming to include environmentSuffix

**Adjustment**: Maintain score at 8 (±0 points)

#### Category C: Minor/Tactical Fixes (-1 to -2)
- **Linting/formatting** (code style, syntax errors)
- **Simple bug fixes** (typos, missing commas, wrong property names)
- **Configuration tweaks** (environment variables, hardcoded values)
- **Output additions** (missing stack outputs for tests)

**Examples**:
- Fixed Python linting errors (E501, W291)
- Corrected typo in resource name
- Changed hardcoded "us-east-1" to variable
- Added missing stack output for S3 bucket name

**Adjustment**: If ≥4 Category C fixes (only) → -1 point; if ≥6 → -2 points

#### Category D: Minimal Changes (-2 to -4)
- **Almost no fixes needed** (MODEL_RESPONSE was 95%+ correct)
- **Trivial changes only** (whitespace, comments, formatting)
- **Single-digit bug count** (<5 total fixes)

**Examples**:
- 3 minor linting fixes, 1 missing output
- Changed 2 hardcoded values to variables
- Added 1 missing import statement

**Adjustment**: -2 to -4 points (model already too competent for this task)

### Step 4: Adjust for Task Complexity

Evaluate IDEAL_RESPONSE.md complexity:

| Complexity Factor | Adjustment |
|-------------------|------------|
| Single AWS service, basic config | -1 |
| Multiple services (3+) with integrations | +1 |
| Security best practices (KMS, IAM policies, encryption) | +1 |
| High availability (multi-AZ, auto-scaling, failover) | +1 |
| Advanced patterns (event-driven, serverless, microservices) | +1 |

**Maximum complexity bonus**: +2 points (prevents score inflation)

### Step 5: Calculate Final Score

```
Final Score = Base (8) + MODEL_FAILURES Adjustment + Complexity Adjustment
```

**Constraints**:
- Minimum: 0
- Maximum: 10
- Round to nearest integer

---

## Score Interpretation

| Score | Meaning | Action |
|-------|---------|--------|
| **9-10** | Excellent training value - significant model improvements demonstrated | ✅ Approve PR |
| **8** | Good training value - meets threshold with solid fixes | ✅ Approve PR |
| **6-7** | Fair training value - below threshold | ❌ Block PR, improve task |
| **4-5** | Poor training value - minimal learning opportunity | ❌ Block PR, consider skip |
| **0-3** | Insufficient - critical issues or model already perfect | ❌ Block PR, mark as error |

**CRITICAL THRESHOLD**: ≥8 required for PR creation

---

## Special Cases

### Case 1: Model Already Too Good
**Symptom**: MODEL_RESPONSE is 95%+ correct, only 3-5 trivial fixes needed

**Example**: Task 5962726542
- MODEL_RESPONSE: Production-ready, all services correct, PCI DSS compliant
- Fixes: 5 minor bugs (duplicate URN, linting, config tweaks)
- Result: Score = 5/10

**Why Low Score is Correct**:
- Training quality measures **learning value**, not code quality
- Minimal gap = minimal training data
- Model has already mastered this pattern
- **This is a POSITIVE signal** about model capability

**Action**: Mark task as "error" per policy (score < 8). Document: "Model already competent, insufficient training value."

### Case 2: Platform/Language Mismatch
**Symptom**: metadata.json says "pulumi + go" but code is "cdk + typescript"

**Score**: Set to 3 (critical blocker)

**Why**: This is a data quality failure, not a training opportunity. The task output is invalid.

**Action**: Block PR, regenerate with correct platform/language

### Case 3: All Requirements Met but Basic Implementation
**Symptom**: Task requirements satisfied, but implementation is basic (single-AZ, no monitoring, minimal security)

**Example**:
- Task: "Deploy web application with database"
- MODEL_RESPONSE: EC2 + RDS, basic setup, works correctly
- Fixes: Added CloudWatch, multi-AZ, KMS encryption, IAM policies
- Result: Score = 8/10 (Base 8 + Category A fixes +2 + Single service -1 = 9, capped complexity bonus)

**Score Calculation**:
- Base: 8
- MODEL_FAILURES: Category A fixes (+2)
- Complexity: Basic before, advanced after (+1)
- Final: 8 + 2 + 1 = 11 → capped at 10

**Action**: Approve PR (score ≥ 8)

### Case 4: Wrong Region Deployment
**Symptom**: Task specifies "eu-west-1" but deployed to "us-east-1"

**Score**: Set to 5 (critical blocker)

**Why**: Task requirements not followed, even if code otherwise good

**Action**: Block PR, redeploy to correct region, re-assess

---

## Decision Tree

```
START
  ↓
Critical Blocker? (Platform mismatch, wrong region, wrong account, missing 50%+ services)
  YES → Set score to blocker value (3-5) → BLOCK PR → END
  NO → Continue
  ↓
Base Score: 8
  ↓
Review MODEL_FAILURES.md
  ↓
Category A (significant)? → +1 to +2
Category B (moderate)? → ±0
Category C (minor, 4+ fixes)? → -1 to -2
Category D (minimal, <5 fixes)? → -2 to -4
  ↓
Review IDEAL_RESPONSE.md complexity
  ↓
Single service, basic? → -1
Multiple services (3+)? → +1
Security best practices? → +1
High availability? → +1
Advanced patterns? → +1
(max complexity bonus: +2)
  ↓
Calculate: Base + MODEL_FAILURES + Complexity (capped 0-10)
  ↓
Score ≥ 8? → APPROVE PR
Score < 8? → BLOCK PR → Provide improvement recommendations
```

---

## Examples

### Example 1: High Training Value (Score: 9)

**Task**: Deploy serverless API with DynamoDB

**MODEL_RESPONSE issues**:
- Missing IAM permissions (Category A)
- No DynamoDB encryption (Category A)
- Hardcoded table name (Category C)
- Missing CloudWatch Logs (Category B)

**IDEAL_RESPONSE**:
- 3 AWS services (Lambda, DynamoDB, API Gateway)
- Proper IAM least-privilege policies
- KMS encryption for DynamoDB
- CloudWatch monitoring

**Calculation**:
- Base: 8
- MODEL_FAILURES: 2 Category A fixes (+2)
- Complexity: Multiple services (+1), security (+1), max bonus (+2) = +2
- Final: 8 + 2 + 2 = 12 → capped at 10
- **Adjusted Final: 9** (apply slight discount for single Category C fix)

**Result**: ✅ APPROVE (score ≥ 8)

### Example 2: Borderline (Score: 8)

**Task**: Deploy web application with load balancer

**MODEL_RESPONSE issues**:
- Wrong instance type (Category B)
- Missing health checks (Category B)
- Hardcoded availability zones (Category C)
- Resource naming inconsistent (Category C)

**IDEAL_RESPONSE**:
- 2 AWS services (EC2, ALB)
- Standard configuration
- No advanced patterns

**Calculation**:
- Base: 8
- MODEL_FAILURES: 2 Category B fixes (±0), 2 Category C fixes (not enough for penalty) = ±0
- Complexity: Basic setup (neutral) = ±0
- Final: 8 + 0 + 0 = 8

**Result**: ✅ APPROVE (score = 8)

### Example 3: Model Too Good (Score: 5)

**Task**: S3 bucket with CloudFront distribution

**MODEL_RESPONSE issues**:
- 1 typo in bucket policy (Category C)
- 2 linting errors (Category C)
- Missing 1 stack output (Category C)

**IDEAL_RESPONSE**:
- 2 AWS services (S3, CloudFront)
- Standard configuration
- Correctly implemented from start

**Calculation**:
- Base: 8
- MODEL_FAILURES: 3 Category C fixes only, but minimal count = -3 (Category D penalty)
- Complexity: Basic setup = -1
- Final: 8 - 3 - 1 = 4
- **Adjusted to 5** (recognize it's working code)

**Result**: ❌ BLOCK (score < 8) - "Model already competent, insufficient training value"

### Example 4: Critical Blocker (Score: 3)

**Task**: Deploy Pulumi infrastructure in Go

**MODEL_RESPONSE**:
- Generates CDK TypeScript code instead

**Calculation**:
- Critical Blocker: Platform/language mismatch
- Set score: 3
- Skip other adjustments

**Result**: ❌ BLOCK (critical failure) - "Regenerate with correct platform"

---

## Usage for Agents

### iac-code-reviewer Step 7: Training Quality Scoring

```markdown
1. Check for Critical Blockers (Step 2)
   - Platform/language mismatch? → Score = 3, BLOCK
   - Wrong region? → Score = 5, BLOCK
   - Missing 50%+ services? → Score = 4, BLOCK

2. If no blockers, start at Base Score: 8

3. Read MODEL_FAILURES.md:
   - Count Category A, B, C, D fixes
   - Apply adjustment per training-quality-guide.md Step 3

4. Read IDEAL_RESPONSE.md:
   - Evaluate complexity factors
   - Apply adjustment per training-quality-guide.md Step 4
   - Cap complexity bonus at +2

5. Calculate Final Score (0-10 range)

6. If score < 8:
   - Report: "Training quality below threshold: {SCORE}/10"
   - List specific improvements needed
   - BLOCK PR creation

7. If score ≥ 8:
   - Report: "Training quality meets threshold: {SCORE}/10"
   - Proceed to Phase 2
```

### Reporting Template

```markdown
## Training Quality Assessment

**Final Score**: {SCORE}/10

### Scoring Breakdown
- Base Score: 8
- MODEL_FAILURES Adjustment: {+X or -Y} ({Category A/B/C/D})
- Complexity Adjustment: {+X or -Y}
- Critical Blockers: {None or BLOCKER_TYPE}

### Justification
{2-3 sentences explaining the score}

### Category A Fixes (Significant)
- {List if any}

### Category B Fixes (Moderate)
- {List if any}

### Category C/D Fixes (Minor/Minimal)
- {List if any}

### Status: {✅ APPROVED (≥8) or ❌ BLOCKED (<8)}

{If blocked: Specific recommendations to reach ≥8}
```

---

## Frequently Asked Questions

**Q: Why did my production-ready code get score 5?**
A: Training quality measures learning value, not code quality. If MODEL_RESPONSE was 95% correct, there's minimal training data. This means the model has already mastered this pattern.

**Q: Should I try to make MODEL_RESPONSE worse to increase training value?**
A: No. This would corrupt training data. If model generates excellent code, that's success. Mark task as "error" with note "insufficient training value" and move on.

**Q: Can score be > 10?**
A: No, capped at 10. Exceptional tasks max out at 10.

**Q: What if I disagree with the category classification?**
A: Use judgment. The categories are guidelines. Focus on: "Did this fix teach the model something significant?"

**Q: Score is 7.8, should I round up to 8?**
A: No. Threshold is strict ≥8. Score 7 means improvements needed.

**Q: Can I override the scoring system?**
A: No. Consistency is critical for training data quality. If system seems wrong, document in lessons_learnt.md for future adjustment.

**Q: Task has 10 AWS services but all basic config. What's the score?**
A: Multiple services (+1), but basic implementation. Likely 8-9 depending on MODEL_FAILURES. Service count alone doesn't guarantee high score.

**Q: MODEL_RESPONSE had perfect architecture but wrong region. Score?**
A: 5 (wrong region blocker). Region is a requirement, not optional.

---

## Changelog

**v2.0** (Current): Simplified scoring system
- Removed conflicting "target 9" vs "minimum 8" guidance
- Clarified "Model Already Too Good" edge case
- Reduced penalty calculations from 8 factors to 4 critical blockers + 2 adjustment categories
- Added decision tree and clear examples
- Aligned with lessons_learnt.md edge case documentation

**v1.0**: Original complex rubric with 8+ penalty factors (deprecated)
