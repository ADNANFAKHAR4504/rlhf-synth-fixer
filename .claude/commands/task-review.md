---
name: task-review
description: Reviews all open PRs for configured GitHub account, identifies production-ready PRs in archiving status, and generates comprehensive review reports.
color: cyan
model: sonnet
---

# Task Review Command

Reviews all archiving-ready PRs for production readiness.

## Workflow

### Step 1: Initialize Report

```bash
REPORT_DIR=".claude/reports"
REPORT_FILE="$REPORT_DIR/report-$(date +%Y-%m-%d).json"
ASSIGNEE="mayanksethi-turing"

mkdir -p "$REPORT_DIR"

# Initialize empty report
cat > "$REPORT_FILE" << EOF
{
  "generated_at": "$(date -Iseconds)",
  "assignee": "$ASSIGNEE",
  "repository": "TuringGpt/iac-test-automations",
  "reviews": []
}
EOF

echo "Report initialized: $REPORT_FILE"
```

### Step 2: Fetch Archiving-Ready PRs

```bash
echo ""
echo "═══════════════════════════════════════════════════"
echo "FETCHING ARCHIVING-READY PRs"
echo "═══════════════════════════════════════════════════"

ARCHIVING_PRS=$(bash .claude/scripts/fetch-archiving-prs.sh "$ASSIGNEE")

PR_COUNT=$(echo "$ARCHIVING_PRS" | jq 'length')

echo ""
echo "Found $PR_COUNT archiving-ready PRs"
echo ""
```

### Step 3: Review Each PR

```bash
if [ "$PR_COUNT" -eq 0 ]; then
  echo "No archiving-ready PRs found."
else
  echo "═══════════════════════════════════════════════════"
  echo "REVIEWING PRs"
  echo "═══════════════════════════════════════════════════"
  
  for PR_JSON in $(echo "$ARCHIVING_PRS" | jq -c '.[]'); do
    PR_NUM=$(echo "$PR_JSON" | jq -r '.pr_number')
    BRANCH=$(echo "$PR_JSON" | jq -r '.branch')
    TITLE=$(echo "$PR_JSON" | jq -r '.title')
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "PR #$PR_NUM: $TITLE"
    echo "Branch: $BRANCH"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Run review script (updates report incrementally)
    bash .claude/scripts/review-pr.sh "$PR_NUM" "$BRANCH" "$REPORT_FILE" "$ASSIGNEE"
  done
fi
```

### Step 4: Generate Final Summary

```bash
echo ""
echo "═══════════════════════════════════════════════════"
echo "FINAL SUMMARY"
echo "═══════════════════════════════════════════════════"

TOTAL=$(jq '.reviews | length' "$REPORT_FILE")
READY=$(jq '[.reviews[] | select(.ready_to_merge == true)] | length' "$REPORT_FILE")
NOT_READY=$((TOTAL - READY))

# Build ready PRs list
READY_PRS=$(jq '[.reviews[] | select(.ready_to_merge == true) | {pr_number: .pr_number, branch: .branch}]' "$REPORT_FILE")

# Build not-ready PRs list with reasons
NOT_READY_PRS=$(jq '[.reviews[] | select(.ready_to_merge == false) | {pr_number: .pr_number, branch: .branch, reason: .failure_reason}]' "$REPORT_FILE")

# Update report with summary at the top
jq --argjson total "$TOTAL" --argjson ready "$READY" --argjson not_ready "$NOT_READY" \
   --argjson ready_prs "$READY_PRS" --argjson not_ready_prs "$NOT_READY_PRS" \
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
echo "Total PRs Reviewed: $TOTAL"
echo "Ready to Merge:     $READY"
echo "Not Ready:          $NOT_READY"
echo ""

if [ "$READY" -gt 0 ]; then
  echo "✅ Ready PRs:"
  echo "$READY_PRS" | jq -r '.[] | "   PR #\(.pr_number) (\(.branch))"'
fi

if [ "$NOT_READY" -gt 0 ]; then
  echo ""
  echo "❌ Not Ready PRs:"
  echo "$NOT_READY_PRS" | jq -r '.[] | "   PR #\(.pr_number) - \(.reason)"'
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "Report saved: $REPORT_FILE"
echo "═══════════════════════════════════════════════════"
```

## Validations Performed (11 checks)

| # | Validation | Description | Critical |
|---|------------|-------------|----------|
| 1 | **Metadata** | Required fields, platform, language, complexity, subtask, TQ>=8 | ✅ |
| 2 | **Subtask Mapping** | Subject labels match subtask, platform requirements | ✅ |
| 3 | **File Locations** | All files in allowed folders/patterns only | ✅ |
| 4 | **Required Files** | PROMPT.md, MODEL_RESPONSE.md, etc. present | ✅ |
| 5 | **No Emojis** | No emojis in lib/*.md files | ✅ |
| 6 | **PROMPT Style** | Human-style, conversational, no AI patterns | ⚠️ |
| 7 | **MODEL_FAILURES** | Quality assessment (count, Category A fixes) | ⚠️ |
| 8 | **No Retain Policies** | No RemovalPolicy.RETAIN in code | ✅ |
| 9 | **environmentSuffix** | Props passed to resources correctly | ⚠️ |
| 10 | **Integration Tests** | No mocks, uses cfn-outputs | ⚠️ |
| 11 | **Claude Review** | Score >= 8 from comments or CI/CD | ✅ |

✅ = Blocks merge | ⚠️ = Warning only
