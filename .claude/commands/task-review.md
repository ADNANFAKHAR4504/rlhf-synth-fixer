---
name: task-review
description: Reviews all open PRs for configured GitHub account, identifies production-ready PRs in archiving status, and generates comprehensive review reports.
color: cyan
model: sonnet
---

# Task Review Command

Reviews all archiving-ready PRs for production readiness and generates a report.

## Workflow

### Step 1: Initialize

```bash
REPORT_DIR=".claude/reports"
REPORT_FILE="$REPORT_DIR/report-$(date +%Y-%m-%d).json"
ASSIGNEE="mayanksethi-turing"

mkdir -p "$REPORT_DIR"

# Initialize or update existing report
if [ -f "$REPORT_FILE" ]; then
  echo "Updating existing report: $REPORT_FILE"
  jq --arg ts "$(date -Iseconds)" '.generated_at = $ts' "$REPORT_FILE" > "${REPORT_FILE}.tmp"
  mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
  EXISTING_REVIEWS=$(jq '.reviews | length' "$REPORT_FILE")
  echo "Existing reviews in report: $EXISTING_REVIEWS"
else
  echo "Creating new report: $REPORT_FILE"
  cat > "$REPORT_FILE" << EOF
{
  "generated_at": "$(date -Iseconds)",
  "assignee": "$ASSIGNEE",
  "repository": "TuringGpt/iac-test-automations",
  "reviews": []
}
EOF
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "TASK REVIEW"
echo "═══════════════════════════════════════════════════"
echo "Report: $REPORT_FILE"
echo ""
```

### Step 2: Fetch Branches

```bash
echo "Fetching remote branches..."
git fetch origin --prune --quiet 2>/dev/null || echo "Fetch skipped (lock issue)"
echo "Done"
echo ""
```

### Step 3: Get Archiving-Ready PRs

```bash
echo "Fetching archiving-ready PRs..."

ARCHIVING_PRS=$(bash .claude/scripts/batch-fetch-pr-data.sh "$ASSIGNEE" 2>/dev/null || \
                bash .claude/scripts/fetch-archiving-prs.sh "$ASSIGNEE")

PR_COUNT=$(echo "$ARCHIVING_PRS" | jq 'length')

echo "Found $PR_COUNT archiving-ready PRs"
echo ""

if [ "$PR_COUNT" -gt 0 ]; then
  echo "PRs to review:"
  echo "$ARCHIVING_PRS" | jq -r '.[] | "  #\(.pr_number) \(.branch)"'
  echo ""
fi
```

### Step 4: Review Each PR

```bash
if [ "$PR_COUNT" -eq 0 ]; then
  echo "No archiving-ready PRs found."
else
  echo "═══════════════════════════════════════════════════"
  echo "REVIEWING PRs"
  echo "═══════════════════════════════════════════════════"
  echo ""

  # Review each PR sequentially for reliability
  for PR_JSON in $(echo "$ARCHIVING_PRS" | jq -c '.[]'); do
    PR_NUM=$(echo "$PR_JSON" | jq -r '.pr_number')
    BRANCH=$(echo "$PR_JSON" | jq -r '.branch')

    bash .claude/scripts/review-pr.sh "$PR_NUM" "$BRANCH" "$REPORT_FILE" "$ASSIGNEE"
  done

  echo ""
  echo "All reviews complete"
fi
```

### Step 5: Generate Final Summary

```bash
echo ""
echo "═══════════════════════════════════════════════════"
echo "FINAL SUMMARY"
echo "═══════════════════════════════════════════════════"

TOTAL=$(jq '.reviews | length' "$REPORT_FILE")
READY=$(jq '[.reviews[] | select(.ready_to_merge == true)] | length' "$REPORT_FILE")
NOT_READY=$((TOTAL - READY))

READY_PRS=$(jq '[.reviews[] | select(.ready_to_merge == true) | {pr_number: .pr_number, branch: .branch}]' "$REPORT_FILE")
NOT_READY_PRS=$(jq '[.reviews[] | select(.ready_to_merge == false) | {pr_number: .pr_number, branch: .branch, reason: .failure_reason}]' "$REPORT_FILE")

# Update report with summary
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

rm -rf "${REPORT_FILE}.lockdir" 2>/dev/null

echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│ SUMMARY                                         │"
echo "├─────────────────────────────────────────────────┤"
printf "│ %-30s %16s │\n" "Total PRs Reviewed:" "$TOTAL"
printf "│ %-30s %16s │\n" "Ready to Merge:" "$READY"
printf "│ %-30s %16s │\n" "Not Ready:" "$NOT_READY"
echo "└─────────────────────────────────────────────────┘"
echo ""

if [ "$READY" -gt 0 ]; then
  echo "✅ READY TO MERGE:"
  echo "$READY_PRS" | jq -r '.[] | "   PR #\(.pr_number) (\(.branch))"'
fi

if [ "$NOT_READY" -gt 0 ]; then
  echo ""
  echo "❌ NOT READY:"
  echo "$NOT_READY_PRS" | jq -r '.[] | "   PR #\(.pr_number) - \(.reason)"'
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "Report saved: $REPORT_FILE"
echo "═══════════════════════════════════════════════════"
```

## Validations (11 checks)

| #   | Validation                                   | Blocks Merge |
| --- | -------------------------------------------- | ------------ |
| 1   | Metadata (fields, platform, language, TQ>=8) | ✅           |
| 2   | Subtask ↔ Subject Label mapping              | ✅           |
| 3   | File locations (strict patterns)             | ✅           |
| 4   | Required files (platform-specific)           | ✅           |
| 5   | No emojis in lib/\*.md                       | ✅           |
| 6   | PROMPT.md style                              | ⚠️           |
| 7   | MODEL_FAILURES quality                       | ⚠️           |
| 8   | No Retain/DeletionProtection                 | ✅           |
| 9   | environmentSuffix usage                      | ⚠️           |
| 10  | Integration tests (no mocks)                 | ⚠️           |
| 11  | Claude review score >= 8                     | ✅           |

✅ = Blocks merge | ⚠️ = Warning only
