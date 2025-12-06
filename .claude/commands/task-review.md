---
name: task-review
description: Reviews production-ready PRs in archiving status with thorough validation and incremental reporting.
color: cyan
model: sonnet
---

# Task Review Command

Reviews PRs in archiving status (all CI/CD passed) with thorough validation for merge readiness.

## Purpose

Identify and validate PRs that are:
1. **Archiving status** - All CI/CD checks passed
2. **Assigned to configured GitHub user**
3. **Production ready** - Pass all validation checks

## Usage

```bash
# Review all archiving-ready PRs
/task-review

# Review with specific assignee
/task-review mayanksethi-turing
```

## Workflow

### Step 1: Initialize Report

```bash
# Create reports directory
mkdir -p .claude/reports

# Set report file path
REPORT_DATE=$(date +%Y-%m-%d)
REPORT_FILE=".claude/reports/report-${REPORT_DATE}.json"
ASSIGNEE="${1:-mayanksethi-turing}"

# Initialize empty report (will be updated incrementally)
cat > "$REPORT_FILE" <<EOF
{
  "generated_at": "$(date -Iseconds)",
  "assignee": "$ASSIGNEE",
  "repository": "TuringGpt/iac-test-automations",
  "reviews": [],
  "summary": {
    "total_reviewed": 0,
    "ready_to_merge": 0,
    "not_ready": 0
  }
}
EOF

echo "📊 Task Review - $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Assignee: $ASSIGNEE"
echo "Report:   $REPORT_FILE"
echo ""
```

### Step 2: Fetch Archiving-Ready PRs

```bash
echo "🔍 Fetching PRs in archiving status..."

# Make script executable if needed
chmod +x .claude/scripts/fetch-archiving-prs.sh

# Fetch PRs where ALL CI/CD checks have passed
ARCHIVING_PRS=$(bash .claude/scripts/fetch-archiving-prs.sh "$ASSIGNEE")

# Check for errors
if echo "$ARCHIVING_PRS" | jq -e '.error' &>/dev/null; then
  echo "❌ Error: $(echo "$ARCHIVING_PRS" | jq -r '.error')"
  exit 1
fi

PR_COUNT=$(echo "$ARCHIVING_PRS" | jq 'length')

if [ "$PR_COUNT" -eq 0 ]; then
  echo "ℹ️  No PRs in archiving status found"
  echo "   All open PRs either have failing checks or are in progress."
  
  # Update report with empty result
  jq '.summary.total_reviewed = 0' "$REPORT_FILE" > "${REPORT_FILE}.tmp"
  mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
  
  exit 0
fi

echo "✅ Found $PR_COUNT PRs in archiving status"
echo ""

# Display list
echo "PRs to review:"
echo "$ARCHIVING_PRS" | jq -r '.[] | "  • PR #\(.pr_number): \(.branch)"'
echo ""
```

### Step 3: Review Each PR (Incremental)

For each PR, invoke `iac-task-review` agent:

```bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Starting Reviews"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REVIEW_COUNT=0
READY_COUNT=0
NOT_READY_COUNT=0

# Process each PR
echo "$ARCHIVING_PRS" | jq -c '.[]' | while read -r PR_JSON; do
  PR_NUM=$(echo "$PR_JSON" | jq -r '.pr_number')
  BRANCH=$(echo "$PR_JSON" | jq -r '.branch')
  
  REVIEW_COUNT=$((REVIEW_COUNT + 1))
  
  echo ""
  echo "[$REVIEW_COUNT/$PR_COUNT] PR #$PR_NUM"
  echo "Branch: $BRANCH"
  echo "────────────────────────────────────────────────"
  
  # Invoke iac-task-review agent for this PR
  # The agent will:
  # 1. Validate metadata.json thoroughly
  # 2. Validate files/folders per restrictions
  # 3. Check for emojis in lib/*.md
  # 4. Check Claude review from PR comments or CI/CD logs
  # 5. Update report IMMEDIATELY after review
  
  # Agent receives:
  # - PR_NUMBER: $PR_NUM
  # - BRANCH: $BRANCH
  # - REPORT_FILE: $REPORT_FILE
  # - ASSIGNEE: $ASSIGNEE
  
done
```

### Step 4: Display Final Summary

```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 FINAL SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Calculate final counts from report
TOTAL=$(jq '.reviews | length' "$REPORT_FILE")
READY=$(jq '[.reviews[] | select(.ready_to_merge == true)] | length' "$REPORT_FILE")
NOT_READY=$(jq '[.reviews[] | select(.ready_to_merge == false)] | length' "$REPORT_FILE")

# Build ready PRs list
READY_PRS=$(jq '[.reviews[] | select(.ready_to_merge == true) | {pr_number: .pr_number, branch: .branch}]' "$REPORT_FILE")

# Build not ready PRs list with failure reasons
NOT_READY_PRS=$(jq '[.reviews[] | select(.ready_to_merge == false) | {pr_number: .pr_number, branch: .branch, reason: .failure_reason}]' "$REPORT_FILE")

# Reorganize report: summary at top (before reviews), with ready/not_ready lists
jq --argjson total "$TOTAL" \
   --argjson ready "$READY" \
   --argjson not_ready "$NOT_READY" \
   --argjson ready_prs "$READY_PRS" \
   --argjson not_ready_prs "$NOT_READY_PRS" \
  '{
    generated_at: .generated_at,
    assignee: .assignee,
    repository: .repository,
    summary: {
      total_reviewed: $total,
      ready_to_merge: $ready,
      not_ready: $not_ready,
      ready_prs: $ready_prs,
      not_ready_prs: $not_ready_prs
    },
    reviews: .reviews
  }' "$REPORT_FILE" > "${REPORT_FILE}.tmp"
mv "${REPORT_FILE}.tmp" "$REPORT_FILE"

echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│ Review Results                              │"
echo "├─────────────────────────────────────────────┤"
echo "│ Total Reviewed:    $TOTAL"
echo "│ ✅ Ready to Merge: $READY"
echo "│ ❌ Not Ready:      $NOT_READY"
echo "└─────────────────────────────────────────────┘"
echo ""

# List ready PRs
if [ "$READY" -gt 0 ]; then
  echo "✅ PRs Ready to Merge:"
  jq -r '.summary.ready_prs[] | "   PR #\(.pr_number) (\(.branch))"' "$REPORT_FILE"
  echo ""
fi

# List not ready PRs with failure reasons
if [ "$NOT_READY" -gt 0 ]; then
  echo "❌ PRs Not Ready (need attention):"
  jq -r '.summary.not_ready_prs[] | "   PR #\(.pr_number): \(.reason // "unknown")"' "$REPORT_FILE"
  echo ""
fi

echo "📁 Full report: $REPORT_FILE"
```

## Validation Checks Performed

The `iac-task-review` agent performs these validations:

| Check | Description | Pass Criteria |
|-------|-------------|---------------|
| **Metadata** | Validates metadata.json structure | All required fields, valid values, correct types |
| **Files** | Validates file locations | Only allowed folders/files per cicd-file-restrictions.md |
| **Emojis** | Checks lib/*.md for emojis | No emojis found |
| **Claude Review** | Validates Claude review exists | SCORE >= 8 in PR comments or CI/CD logs |

## Report Schema

Summary section is placed **before** reviews section, and includes lists of ready/not-ready PRs with reasons:

```json
{
  "generated_at": "2025-12-07T10:30:00+05:30",
  "assignee": "mayanksethi-turing",
  "repository": "TuringGpt/iac-test-automations",
  "summary": {
    "total_reviewed": 5,
    "ready_to_merge": 3,
    "not_ready": 2,
    "ready_prs": [
      { "pr_number": 8002, "branch": "synth-h7s0j9j7" },
      { "pr_number": 7995, "branch": "synth-b5b1b7x5" },
      { "pr_number": 7889, "branch": "synth-u2d4b6f8" }
    ],
    "not_ready_prs": [
      { "pr_number": 7950, "branch": "synth-abc123", "reason": "metadata: invalid platform; emojis: found in lib/PROMPT.md" },
      { "pr_number": 7920, "branch": "synth-xyz789", "reason": "claude_review: score 6 < 8" }
    ]
  },
  "reviews": [
    {
      "pr_number": 8002,
      "pr_url": "https://github.com/TuringGpt/iac-test-automations/pull/8002",
      "branch": "synth-h7s0j9j7",
      "task_id": "h7s0j9j7",
      "assignee": "mayanksethi-turing",
      "validations": {
        "metadata": { "valid": true, "issues": [], "platform": "cicd", "training_quality": 9 },
        "files": { "valid": true, "issues": [] },
        "emojis": { "valid": true, "issues": [] },
        "claude_review": { "valid": true, "score": 9 }
      },
      "ready_to_merge": true,
      "failure_reason": null,
      "reviewed_at": "2025-12-07T10:30:00+05:30"
    }
  ]
}
```

## Related Files

- `.claude/agents/iac-task-review.md` - Agent for detailed validation
- `.claude/scripts/fetch-archiving-prs.sh` - PR fetching script
- `.claude/docs/references/metadata-requirements.md` - Metadata validation rules
- `.claude/docs/references/cicd-file-restrictions.md` - File location rules
