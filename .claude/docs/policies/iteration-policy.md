# Iteration and Regeneration Policy

## Problem Statement

Conflicting guidance exists across multiple files about when to iterate/regenerate:
- iac-code-reviewer: "Do NOT proceed if training_quality < 8"
- task-coordinator: "Maximum 1 additional iteration if score < 6"
- lessons_learnt.md: Score 5 marked as error

This creates confusion about thresholds (6 vs 8) and iteration limits.

## Unified Policy

This document provides the single source of truth for iteration decisions.

---

## Core Principles

1. **Training Quality Threshold**: ≥8 required for PR creation (NON-NEGOTIABLE)
2. **Iteration Purpose**: Increase training value, not fix minor issues
3. **Iteration Limit**: Maximum 1 additional iteration per task
4. **Cost Optimization**: Avoid excessive regeneration cycles

---

## Decision Matrix (UPDATED)

| Training Quality Score | Action | Rationale |
|------------------------|--------|-----------|
| **9-10** | ✅ Approve PR | Excellent training value |
| **8** | ✅ Approve PR | Meets threshold |
| **6-7** | ⚠️ Conditional Iteration | Only if simple improvements possible |
| **4-5** | ⚠️ Conditional Iteration (NEW) | Only if fixable gaps identified |
| **0-3** | ❌ Mark as Error | Critical failure OR model too good |

---

## Detailed Decision Tree

```
START: training_quality score calculated
  ↓
Score ≥ 8?
  YES → ✅ APPROVE PR → END
  NO → Continue
  ↓
Score ≥ 6?
  YES → Evaluate iteration potential
  NO → Check if score 4-5 with fixable gaps
    ↓
    Score 4-5?
    ├─ NO → ❌ MARK AS ERROR → END
    └─ YES → Evaluate iteration for 4-5
      ↓
      Check MODEL_FAILURES.md:
      ↓
      Are fixes Category A/B (significant/moderate)?
      ├─ NO (only Category C/D) → ❌ ERROR ("Model already competent") → END
      └─ YES → Continue
        ↓
        Can 2+ significant features be added?
        ├─ NO → ❌ ERROR ("Cannot improve sufficiently") → END
        └─ YES → Continue
          ↓
          Expected score after iteration ≥ 8?
          ├─ NO → ❌ ERROR ("Unlikely to reach threshold") → END
          └─ YES → ⚠️ ITERATE (1/1)
            ↓
            After iteration, recalculate score:
            ↓
            New score ≥ 8?
            ├─ YES → ✅ APPROVE PR → END
            └─ NO → ❌ ERROR ("Still insufficient after iteration") → END
  ↓
Iteration Evaluation (Score 6-7):
  ↓
Is this first iteration?
  NO → ❌ MARK AS ERROR (max 1 iteration reached) → END
  YES → Continue
  ↓
Check MODEL_FAILURES.md:
  ↓
Are fixes Category C/D (minor/minimal)?
  YES → ❌ MARK AS ERROR ("Model already competent") → END
  NO → Continue
  ↓
Can 1-2 significant features be added?
  NO → ❌ MARK AS ERROR ("Cannot improve") → END
  YES → ♻️ ITERATE → Add features → Regenerate
  ↓
After iteration, recalculate score:
  ↓
New score ≥ 8?
  YES → ✅ APPROVE PR → END
  NO → ❌ MARK AS ERROR ("Still insufficient") → END
```

---

## Iteration Criteria (Score 6-7 Only)

### Must Meet ALL Criteria to Iterate:

1. **✅ First iteration** (not already iterated)
2. **✅ Fixable gap** (MODEL_FAILURES shows Category A/B fixes, not C/D)
3. **✅ Feature addition possible** (1-2 significant AWS services or patterns can be added)
4. **✅ Clear path to ≥8** (realistic that additions will increase score by 2+ points)

### Examples

#### ✅ ITERATE (Score 7, can improve)
- **Current**: Basic Lambda + DynamoDB (no monitoring)
- **Gap**: Missing CloudWatch, no error handling
- **Action**: Add CloudWatch Logs/Alarms + error handling → Expected score: 9
- **Iteration**: YES

#### ❌ DO NOT ITERATE (Score 7, cannot improve)
- **Current**: Complete infrastructure, all features present
- **Gap**: 6 linting errors, 2 config typos
- **Action**: Fixes are trivial, no features to add
- **Mark as**: ERROR ("Minor fixes only, cannot reach 8")

#### ❌ DO NOT ITERATE (Score 6, already iterated)
- **Current**: Second review after adding features
- **Gap**: Still slightly below threshold
- **Action**: Max iteration limit reached
- **Mark as**: ERROR ("Max 1 iteration reached")

---

## Actions by Score Range

### Score 9-10: Approve Immediately

**Action**: Approve PR

**Reporting**:
```markdown
✅ Training quality: {SCORE}/10 (Excellent)
Status: APPROVED
```

**No further action needed**

---

### Score 8: Approve at Threshold

**Action**: Approve PR

**Reporting**:
```markdown
✅ Training quality: 8/10 (Meets threshold)
Status: APPROVED
```

**Note**: Score 8 is acceptable. Do NOT try to improve to 9-10.

---

### Score 6-7: Conditional Iteration

**Step 1: Check Iteration Count**

```bash
# Check if already iterated
if [ -f lib/PROMPT2.md ] || [ -f lib/MODEL_RESPONSE2.md ]; then
    echo "❌ Already iterated once (max reached)"
    echo "Action: Mark as ERROR"
    exit 1
fi
```

**Step 2: Evaluate Fix Categories**

Read MODEL_FAILURES.md and categorize:
- If mostly Category C/D (minor/minimal) → ❌ Cannot iterate
- If mostly Category A/B (significant/moderate) → ✅ Can iterate

**Step 3: Identify Feature Additions**

Can 1-2 significant features be added?

**Examples of significant features**:
- CloudWatch Logs/Alarms (monitoring)
- KMS encryption (security)
- Auto-scaling (performance)
- Multi-AZ deployment (reliability)
- VPC endpoints (networking)
- Lambda error handling (resilience)
- IAM least-privilege policies (security)

**If YES → Iterate**:
```markdown
⚠️ Training quality: {SCORE}/10 (Below threshold)
Gap Analysis: {List missing features}
Action: Adding {FEATURE_1} and {FEATURE_2}
Expected new score: ≥8
Status: ITERATING (1/1)
```

**Iteration Process**:
1. Document features to add
2. Update PROMPT.md → PROMPT2.md with additional requirements
3. Regenerate code → MODEL_RESPONSE2.md
4. Continue QA pipeline
5. Recalculate training_quality

**If NO → Mark as Error**:
```markdown
❌ Training quality: {SCORE}/10 (Below threshold)
Gap Analysis: Only minor fixes, no significant features to add
Action: Cannot improve to ≥8
Status: ERROR - "Insufficient training value"
```

---

### Score 4-5: Conditional Iteration (UPDATED)

**Previous Behavior**: Mark as ERROR immediately

**New Behavior**: Evaluate if iteration can improve score

**Iteration Criteria for Score 4-5** (must meet ALL):

1. **✅ Fixable gap identified**: 
   - Missing services can be added
   - Wrong region can be corrected
   - Architecture improvements possible
   
2. **✅ Clear improvement path**: 
   - Can add 2+ significant features
   - Expected score increase: +3 to +4 points
   - Realistic to reach ≥8
   
3. **✅ Not "model too good"**: 
   - MODEL_FAILURES shows Category A/B fixes (not just C/D)
   - Significant gaps exist, not just minor tweaks

**Decision Tree for Score 4-5**:

```
Score 4-5 detected
  ↓
Check MODEL_FAILURES.md:
  ↓
Are fixes Category A/B (significant/moderate)?
  ├─ NO (only Category C/D) → ❌ ERROR ("Model already competent")
  └─ YES → Continue
    ↓
Can 2+ significant features be added?
  ├─ NO → ❌ ERROR ("Cannot improve sufficiently")
  └─ YES → Continue
    ↓
Expected score after iteration ≥ 8?
  ├─ NO → ❌ ERROR ("Unlikely to reach threshold")
  └─ YES → ⚠️ ITERATE (1/1)
    ↓
After iteration, recalculate score:
  ↓
New score ≥ 8?
  ├─ YES → ✅ APPROVE PR
  └─ NO → ❌ ERROR ("Still insufficient after iteration")
```

**Examples**:

#### ✅ ITERATE (Score 5, fixable)
- **Current**: Missing 3 required AWS services (Score 4)
- **Gap**: Services not implemented
- **Action**: Add missing services → Expected score: 8-9
- **Iteration**: YES

#### ❌ DO NOT ITERATE (Score 5, not fixable)
- **Current**: All services present, only 2 linting errors
- **Gap**: Minor fixes only (Category C)
- **Action**: Cannot add features, only fix linting
- **Mark as**: ERROR ("Model already competent")

**If iteration criteria NOT met**: Mark as ERROR with reason

---

### Score 0-3: Mark as Error (Critical OR Model Perfect)

**Action**: Mark task as ERROR

**Reporting**:
```markdown
❌ Training quality: {SCORE}/10 (Critical failure OR model perfect)
Reason: {SPECIFIC_REASON}
Status: ERROR
```

**Reasons**:
- **Score 3**: Platform/language mismatch (critical blocker)
- **Score 3**: Wrong AWS account (critical blocker)
- **Score 4**: Missing ≥50% required services (critical blocker)
- **Score 5**: Wrong region (critical blocker)
- **Score 0-3**: Model generated perfect code with 0-2 trivial fixes

**CSV Update**:
```bash
./.claude/scripts/task-manager.sh mark-error "${TASK_ID}" \
    "Critical: {SPECIFIC_REASON}" \
    "code-review"
```

---

## Iteration Process (When Approved)

### Step 1: Document Intent

```markdown
## Iteration Plan

**Current Score**: {CURRENT_SCORE}/10
**Target Score**: ≥8/10

**Gap Analysis**:
- Current implementation: {WHAT_EXISTS}
- Missing for training value: {WHAT'S_MISSING}

**Features to Add**:
1. {FEATURE_1}: {DESCRIPTION}
   - Expected complexity boost: +1
2. {FEATURE_2}: {DESCRIPTION}
   - Expected improvement value: +1

**Expected Score After Iteration**: {ESTIMATED_SCORE}/10
```

### Step 2: Update PROMPT

Create PROMPT2.md (or PROMPT3.md if PROMPT2.md exists):

```bash
# Copy original prompt
cp lib/PROMPT.md lib/PROMPT2.md

# Add new requirements at end
cat >> lib/PROMPT2.md << EOF

## Additional Requirements (Iteration 1)

Based on initial implementation review, please also include:

### {FEATURE_1}
- {Specific requirement}
- {Specific requirement}

### {FEATURE_2}
- {Specific requirement}
- {Specific requirement}

These additions will improve {aspect} and provide {benefit}.
EOF
```

### Step 3: Regenerate Code

Hand off to iac-infra-generator:
- Input: PROMPT2.md
- Output: MODEL_RESPONSE2.md
- Extract code as usual

### Step 4: Continue Pipeline

- iac-infra-qa-trainer: Test MODEL_RESPONSE2.md → IDEAL_RESPONSE2.md (or keep IDEAL_RESPONSE.md)
- iac-code-reviewer: Recalculate training_quality

### Step 5: Final Decision

After iteration, score MUST be ≥8 or task fails:

```markdown
## Post-Iteration Review

**Original Score**: {OLD_SCORE}/10
**New Score**: {NEW_SCORE}/10
**Improvement**: {DELTA}

Status: {NEW_SCORE ≥ 8 ? "✅ APPROVED" : "❌ ERROR (still insufficient)"}
```

---

## Why No Iteration for Score <6?

**Reason 1: Cost Efficiency**
- Score <6 indicates fundamental issue (model too good OR task too basic)
- Iteration unlikely to improve by 2+ points
- Better to skip task than waste resources

**Reason 2: Training Quality Philosophy**
- Score 4-5 often means model is already competent (positive signal)
- Adding features artificially inflates training value
- Better to accept model has mastered pattern

**Reason 3: Clear Threshold**
- Score 6-7: "Close to threshold, iteration might help"
- Score 4-5: "Too far from threshold, iteration won't help"
- Clear decision boundary prevents endless iterations

---

## Exception: Never Iterate For

Even if score is 6-7, **do NOT iterate** if:

1. **Platform/Language Mismatch** (Score 3)
   - Action: Regenerate with correct platform (not iteration)

2. **Wrong Region** (Score 5)
   - Action: Redeploy to correct region (not iteration)

3. **Model Already Too Good** (Score 4-5 with <5 fixes)
   - Action: Mark as error "Model competent"

4. **Already Iterated** (Second review)
   - Action: Mark as error "Max iteration reached"

---

## Agent Responsibilities

### iac-code-reviewer

**Calculates score** using training-quality-guide.md

**Makes iteration decision**:

```python
if score >= 8:
    return "APPROVED"
elif score >= 6 and can_iterate() and worth_iterating():
    return "ITERATE" with feature_recommendations
else:
    return "ERROR" with reason
```

**Reports clearly**:
- Score and breakdown
- Decision (APPROVED / ITERATE / ERROR)
- If ITERATE: specific features to add
- If ERROR: specific reason

### task-coordinator

**Receives decision** from iac-code-reviewer

**Takes action**:

```python
if decision == "APPROVED":
    proceed_to_phase_5()  # PR creation
elif decision == "ITERATE":
    if iteration_count < 1:
        invoke_generator_with_additions()
        repeat_qa_pipeline()
    else:
        mark_as_error("Max iteration reached")
elif decision == "ERROR":
    mark_as_error(reason)
```

**Enforces iteration limit**:
- Tracks iteration count
- Blocks >1 iteration
- Reports to user if limit reached

---

## Reporting Templates

### Template 1: Approved (Score ≥8)

```markdown
## Training Quality Decision

**Score**: {SCORE}/10
**Status**: ✅ APPROVED

**Breakdown**:
- Base: 8
- MODEL_FAILURES: {adjustment}
- Complexity: {adjustment}

**Justification**: {reason}

**Next Step**: Proceed to PR creation (Phase 5)
```

### Template 2: Iteration Required (Score 6-7)

```markdown
## Training Quality Decision

**Score**: {SCORE}/10 (Below threshold)
**Status**: ⚠️ REQUIRES ITERATION

**Gap Analysis**:
- Current: {summary}
- Missing: {features}

**Iteration Plan**:
1. Add {FEATURE_1} - Expected boost: +{X}
2. Add {FEATURE_2} - Expected boost: +{Y}

**Expected Post-Iteration Score**: ≥8/10

**Next Step**: Update PROMPT2.md and regenerate (Iteration 1/1)
```

### Template 3: Error (Score <6 or Cannot Iterate)

```markdown
## Training Quality Decision

**Score**: {SCORE}/10 (Insufficient)
**Status**: ❌ ERROR

**Reason**: {specific_reason}

**Options Considered**:
- Iteration? {why_not_possible}
- Feature additions? {why_not_possible}

**Decision**: Task does not provide sufficient training value

**Next Step**: Mark as ERROR in CSV, move to next task
```

---

## FAQ

**Q: Score is 7.9, should I round up to 8?**
A: No. Threshold is strict ≥8.0. Score 7.9 requires iteration or error.

**Q: Can I iterate twice to reach ≥8?**
A: No. Maximum 1 iteration per task. Cost optimization policy.

**Q: Score improved from 6 to 7 after iteration, is that OK?**
A: No. Post-iteration score must be ≥8. Mark as ERROR ("still insufficient").

**Q: Score is 6 but fixes are all linting errors. Iterate?**
A: No. Linting errors are Category C (minor). Cannot iterate for minor fixes. Mark as ERROR.

**Q: Score is 7 and I can add 3 AWS services. Should I?**
A: Add 1-2 significant services, not all 3. Avoid over-engineering. Target score ≥8, not ≥10.

**Q: What if iac-code-reviewer says "ITERATE" but task-coordinator disagrees?**
A: task-coordinator has final authority. If already iterated or cannot identify features, override with ERROR.

**Q: Model generated wrong platform (score 3). Is this iteration or regeneration?**
A: Regeneration. Critical failure requires starting over with correct platform, not iterating current code.

---

## Summary

**Threshold**: ≥8 for PR approval (strict)

**Iteration**:
- Only for scores 6-7
- Maximum 1 iteration
- Only if significant features can be added
- Post-iteration score must be ≥8

**Error Cases**:
- Score <6: Insufficient, cannot iterate
- Score 6-7 but already iterated: Max reached
- Score 6-7 but only minor fixes: Cannot improve
- Score 0-3: Critical failure OR model perfect

**Key Principle**: "Iterate to add training value, not to fix minor issues."
