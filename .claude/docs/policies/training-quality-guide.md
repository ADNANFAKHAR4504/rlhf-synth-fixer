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

**If any blocker present**: 
- Score is set to blocker value (3, 4, or 5)
- Skip MODEL_FAILURES and Complexity adjustments
- Proceed directly to Step 5 (Final Score calculation)
- Apply cap (0-10) and rounding

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

**When to Apply Category C Penalty**:
- Apply **ONLY** if ALL fixes are Category C (no Category A/B fixes present)
- If Category A/B fixes exist, ignore Category C penalties (Category A dominates)

**Penalty Rules**:
- If ≥6 Category C fixes (only) → -2 points
- If 4-5 Category C fixes (only) → -1 point
- If <4 Category C fixes (only) → See Category D below

#### Category D: Minimal Changes (-2 to -4)
- **Almost no fixes needed** (MODEL_RESPONSE was 95%+ correct)
- **Trivial changes only** (whitespace, comments, formatting)
- **Total fixes < 5 AND all fixes are Category C**

**Examples**:
- 3 minor linting fixes, 1 missing output
- Changed 2 hardcoded values to variables
- Added 1 missing import statement

**When to Apply Category D Penalty**:
- Total fixes < 5 AND all fixes are Category C (trivial)
- No Category A/B fixes exist
- MODEL_RESPONSE was 95%+ correct

**Penalty Selection**:
- 1-2 trivial fixes → -4 points
- 3-4 trivial fixes → -3 points
- 5+ trivial fixes → Use Category C penalty instead (shouldn't happen - would be Category C)

**Decision Tree**:
```
All fixes are Category C?
  YES → Count total fixes
    ├─ <4 fixes → Category D penalty (-2 to -4)
    ├─ 4-5 fixes → Category C penalty (-1)
    └─ ≥6 fixes → Category C penalty (-2)
  NO → Category A/B exist → Ignore Category C penalties
```

### Mixed Category Handling

**Rule**: Category A bonuses override Category C penalties

**Decision Logic**:
1. **If Category A fixes exist**:
   - Apply Category A bonus (+1 or +2)
   - Category B fixes: Ignore (already ±0)
   - Category C fixes: Ignore penalties (Category A dominates)
   - Category D: Does not apply (Category A exists)

2. **If only Category B fixes**:
   - Apply ±0 (no change)
   - Category C/D penalties: Do not apply

3. **If only Category C fixes**:
   - Apply Category C penalty rules (see above)
   - Category D: Check if <5 fixes total

4. **If only Category D (minimal fixes)**:
   - Apply Category D penalty (-2 to -4)

**Examples**:

**Example A: Mixed A + C**
- 2 Category A fixes, 4 Category C fixes
- Calculation: Base 8 + Category A (+2) + Complexity
- Result: Category C penalties ignored

**Example B: Only C**
- 5 Category C fixes, no A/B
- Calculation: Base 8 + Category C (-1) + Complexity
- Result: Category C penalty applies

### Step 4: Adjust for Task Complexity

Evaluate IDEAL_RESPONSE.md complexity:

| Complexity Factor | Adjustment | Priority |
|-------------------|------------|----------|
| Multiple services (3+) with integrations | +1 | 1 (highest) |
| Security best practices (KMS, IAM policies, encryption) | +1 | 2 |
| High availability (multi-AZ, auto-scaling, failover) | +1 | 3 |
| Advanced patterns (event-driven, serverless, microservices) | +1 | 4 |
| Single AWS service, basic config | -1 | (applies if only 1 service) |

**Priority Rules**:
- Apply factors in priority order (1 → 2 → 3 → 4)
- Stop when reaching +2 bonus cap
- If all positive factors apply, take first 2 = +2 total
- Single service penalty (-1) applies independently (can result in net +1 if other factors exist)

**Maximum complexity bonus**: +2 points (prevents score inflation)

**Examples**:

**Example A: All factors apply**
- Multiple services (+1), Security (+1), HA (+1), Advanced patterns (+1)
- Apply priority: Multiple services (+1), Security (+1) = +2 total
- Result: +2 (HA and Advanced patterns ignored due to cap)

**Example B: Single service with security**
- Single service (-1), Security (+1)
- Net: -1 + 1 = 0
- Result: ±0 (neutral)

**Example C: 2 services (not 3+)**
- 2 services → 0 (not "multiple services" which requires 3+)
- Security (+1)
- Result: +1

### Step 5: Calculate Final Score

```
Final Score = Base (8) + MODEL_FAILURES Adjustment + Complexity Adjustment
```

**Calculation Order**:
1. Calculate: Base + MODEL_FAILURES + Complexity
2. Apply cap: min(max(calculated, 0), 10)
3. Round to nearest integer (0.5 rounds up)
4. **NO manual adjustments** - use formula only

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

**Score Calculation**:
- Base: 8
- MODEL_FAILURES: 2 Category A fixes (CloudWatch + KMS) → +2
- Complexity: Multiple services (EC2, RDS, CloudWatch = 3+) → +1 (priority 1), Security practices (KMS, IAM) → +1 (priority 2)
  - Total complexity factors: +2 (capped)
- Final: 8 + 2 + 2 = 12 → capped at 10
- Result: Score = 10/10

**Action**: Approve PR (score ≥ 8)

### Case 4: Wrong Region Deployment
**Symptom**: Task specifies "eu-west-1" but deployed to "us-east-1"

**Score**: Set to 5 (critical blocker)

**Why**: Task requirements not followed, even if code otherwise good

**Action**: Block PR, redeploy to correct region, re-assess

### Case 5: LocalStack Migration PR
**Symptom**: PR is a LocalStack migration (branch starts with `ls-` or contains `localstack`)

**Key Principle**: LocalStack compatibility modifications are **intentional architectural decisions**, not defects.

**What to Expect**:
- Conditional code using `isLocalStack` environment detection
- Disabled/removed pro-only services (EKS, AppSync, Cognito-idp)
- Simplified IAM policies
- Removed NAT Gateways, CloudFront, Route53, WAF
- Conditional KMS encryption

**How to Categorize LocalStack Changes**:

| LocalStack Change Type | Category | Score Impact | Condition |
|------------------------|----------|--------------|-----------|
| Conditional deployment (`isLocalStack` pattern) | Category B | ±0 | Shows environment awareness |
| Documented service removal with table | Category B | ±0 | Valid architectural decision |
| `isLocalStack` detection + conditional logic | Category A | +1 | Security-conscious pattern |
| Undocumented commenting-out | Category C | -1 | Needs documentation |

**Critical Rule**: Do NOT apply "missing services" penalty if:
1. MODEL_FAILURES.md has a "LocalStack Compatibility Adjustments" section
2. Removed services are documented with justification
3. Services are in the pro-only or unsupported list (see `.claude/config/localstack.yaml`)

**Score Calculation Example**:
- Task requires: S3, Lambda, DynamoDB, CloudFront, Route53
- LocalStack PR implements: S3, Lambda, DynamoDB (CloudFront/Route53 documented as unsupported)
- MODEL_FAILURES.md includes LocalStack compatibility table
- Result: Do NOT penalize for "missing 40% of services" - these are documented limitations
- Base: 8, apply normal Category A/B/C adjustments for actual code fixes

**Action**: Verify MODEL_FAILURES.md contains LocalStack section, then score based on actual code quality improvements (not LocalStack adaptations)

---

## Decision Tree

```
START
  ↓
LocalStack Migration? (branch starts with ls- or contains localstack)
  YES → Check MODEL_FAILURES.md for LocalStack Compatibility section
    ├─ Has section → Exclude documented LocalStack changes from "missing services" check
    └─ No section → Warn: recommend adding LocalStack documentation (-1 if missing)
  NO → Continue normal evaluation
  ↓
Critical Blocker? (Platform mismatch, wrong region, wrong account, missing 50%+ services*)
  * For LocalStack PRs: Only count services NOT documented as LocalStack limitations
  YES → Set score to blocker value (3-5) → BLOCK PR → END
  NO → Continue
  ↓
Base Score: 8
  ↓
Review MODEL_FAILURES.md
  ↓
Category A (significant)? → +1 to +2
  └─ If Category A exists → Ignore Category C penalties
Category B (moderate)? → ±0
Category C (minor, only if no A/B)? → -1 to -2
  └─ <4 fixes → Category D instead
Category D (minimal, <4 fixes, all C)? → -2 to -4
  ↓
Review IDEAL_RESPONSE.md complexity
  ↓
Apply in priority order (stop at +2):
1. Multiple services (3+)? → +1
2. Security best practices? → +1
3. High availability? → +1
4. Advanced patterns? → +1
5. Single service (only 1)? → -1 (independent)
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
- MODEL_FAILURES: 2 Category A fixes (+2), 1 Category C fix (ignored due to Category A)
- Complexity: Multiple services (+1, priority 1), security (+1, priority 2) = +2 (capped)
- Final: 8 + 2 + 2 = 12 → capped at 10
- Result: Score = 10/10

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
- MODEL_FAILURES: 2 Category B fixes (±0), 2 Category C fixes (not enough for penalty, <4 fixes) = ±0
- Complexity: 2 services (EC2, ALB) → 0 (neutral, not single service and not 3+), no other factors = ±0
- Final: 8 + 0 + 0 = 8
- Result: Score = 8/10

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
- MODEL_FAILURES: 3 Category C fixes only, <4 fixes total → Category D penalty (-3)
- Complexity: 2 services (S3, CloudFront) → 0 (neutral, not single service and not 3+)
- Final: 8 - 3 + 0 = 5
- Result: Score = 5/10

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

### Example 5: Mixed Category A + C (Score: 10)

**Task**: Deploy serverless data processing pipeline

**MODEL_RESPONSE issues**:
- Missing KMS encryption (Category A)
- No CloudWatch alarms (Category A)
- 5 linting errors (Category C)
- Missing stack output (Category C)

**IDEAL_RESPONSE**:
- 4 AWS services (Lambda, S3, DynamoDB, EventBridge)
- KMS encryption enabled
- CloudWatch alarms configured
- Clean code (linting fixed)

**Calculation**:
- Base: 8
- MODEL_FAILURES: 2 Category A fixes (+2), 6 Category C fixes (ignored due to Category A)
- Complexity: Multiple services (+1, priority 1), Security (+1, priority 2) = +2
- Final: 8 + 2 + 2 = 12 → capped at 10
- Result: Score = 10/10

**Key Learning**: Category A bonuses override Category C penalties

**Result**: ✅ APPROVE (score ≥ 8)

### Example 6: Only Category C Fixes (Score: 7)

**Task**: Deploy S3 bucket with lifecycle policies

**MODEL_RESPONSE issues**:
- 4 linting errors (Category C)
- 1 typo in resource name (Category C)
- Missing stack output (Category C)

**IDEAL_RESPONSE**:
- 1 AWS service (S3)
- Standard configuration

**Calculation**:
- Base: 8
- MODEL_FAILURES: 6 Category C fixes (only) → -2 points
- Complexity: Single service (-1)
- Final: 8 - 2 - 1 = 5
- Result: Score = 5/10

**Action**: ❌ BLOCK (score < 8) - "Only minor fixes, insufficient training value"

### Example 7: Complexity Prioritization (Score: 10)

**Task**: Deploy multi-region application

**MODEL_RESPONSE issues**:
- Missing multi-AZ configuration (Category A)
- No encryption at rest (Category A)

**IDEAL_RESPONSE**:
- 5 AWS services (EC2, RDS, ALB, S3, CloudFront)
- Multi-AZ deployment
- KMS encryption
- Event-driven architecture
- Auto-scaling

**Calculation**:
- Base: 8
- MODEL_FAILURES: 2 Category A fixes (+2)
- Complexity: Multiple services (+1, priority 1), Security (+1, priority 2) = +2
  - HA (+1) and Advanced patterns (+1) ignored due to cap
- Final: 8 + 2 + 2 = 12 → capped at 10
- Result: Score = 10/10

**Key Learning**: Complexity factors applied in priority order, capped at +2

**Result**: ✅ APPROVE (score ≥ 8)

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

**v2.1** (Current): Clarified ambiguous rules
- Clarified Category C vs Category D transition rules with decision tree
- Added mixed category handling rules (Category A overrides Category C)
- Removed manual adjustments (formula-only scoring)
- Fixed Case 3 calculation error
- Added complexity bonus prioritization rules
- Clarified calculation order and rounding rules
- Fixed all examples to use formula-only calculations

**v2.0**: Simplified scoring system
- Removed conflicting "target 9" vs "minimum 8" guidance
- Clarified "Model Already Too Good" edge case
- Reduced penalty calculations from 8 factors to 4 critical blockers + 2 adjustment categories
- Added decision tree and clear examples
- Aligned with lessons_learnt.md edge case documentation

**v1.0**: Original complex rubric with 8+ penalty factors (deprecated)
