---
name: task-review
description: Reviews all open PRs for configured GitHub account, identifies production-ready PRs in archiving status, and generates comprehensive review reports.
color: cyan
model: sonnet
---

# Task Review Command

Reviews all archiving-ready PRs for production readiness.

**Fast Mode**: Uses `git show` instead of worktrees + parallel processing (5-10x faster)

## Workflow

### Step 1: Initialize

```bash
REPORT_DIR=".claude/reports"
REPORT_FILE="$REPORT_DIR/report-$(date +%Y-%m-%d).json"
ASSIGNEE="mayanksethi-turing"
PARALLEL_JOBS=4  # Number of parallel reviews

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

echo "═══════════════════════════════════════════════════"
echo "TASK REVIEW - FAST MODE"
echo "═══════════════════════════════════════════════════"
echo "Report: $REPORT_FILE"
echo "Parallel jobs: $PARALLEL_JOBS"
echo ""
```

### Step 2: Fetch All Branches (Single Fetch)

```bash
echo "Fetching all remote branches..."
git fetch origin --prune --quiet
echo "Done"
echo ""
```

### Step 3: Get Archiving-Ready PRs (Batch API)

```bash
echo "Fetching archiving-ready PRs..."

# Use batch script for single API call
ARCHIVING_PRS=$(bash .claude/scripts/batch-fetch-pr-data.sh "$ASSIGNEE" 2>/dev/null || \
                bash .claude/scripts/fetch-archiving-prs.sh "$ASSIGNEE")

PR_COUNT=$(echo "$ARCHIVING_PRS" | jq 'length')

echo "Found $PR_COUNT archiving-ready PRs"
echo ""

# Display PR list
echo "PRs to review:"
echo "$ARCHIVING_PRS" | jq -r '.[] | "  #\(.pr_number) \(.branch) - \(.title[:50])..."'
echo ""
```

### Step 4: Review PRs in Parallel

```bash
if [ "$PR_COUNT" -eq 0 ]; then
  echo "No archiving-ready PRs found."
else
  echo "═══════════════════════════════════════════════════"
  echo "REVIEWING PRs (parallel: $PARALLEL_JOBS)"
  echo "═══════════════════════════════════════════════════"
  echo ""
  
  # Create temp file for parallel processing
  TEMP_PR_LIST=$(mktemp)
  echo "$ARCHIVING_PRS" | jq -c '.[]' > "$TEMP_PR_LIST"
  
  # Process PRs in parallel using xargs
  cat "$TEMP_PR_LIST" | xargs -P"$PARALLEL_JOBS" -I{} bash -c '
    PR_JSON="{}"
    PR_NUM=$(echo "$PR_JSON" | jq -r ".pr_number")
    BRANCH=$(echo "$PR_JSON" | jq -r ".branch")
    CLAUDE_SCORE=$(echo "$PR_JSON" | jq -r ".claude_score // empty")
    
    bash .claude/scripts/review-pr-fast.sh "$PR_NUM" "$BRANCH" "'"$REPORT_FILE"'" "'"$ASSIGNEE"'" "$CLAUDE_SCORE"
  '
  
  rm -f "$TEMP_PR_LIST"
  
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

# Clean up lock file
rm -f "${REPORT_FILE}.lock"

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

## Performance Comparison

| Mode | Per PR | 10 PRs | Bottleneck |
|------|--------|--------|------------|
| **Standard** | ~30s | ~5 min | Worktrees, sequential |
| **Fast** | ~3-5s | ~15-30s | Parallel git show |

## Validations (11 checks)

| # | Validation | Blocks Merge |
|---|------------|--------------|
| 1 | Metadata (fields, platform, language, TQ>=8) | ✅ |
| 2 | Subtask ↔ Subject Label mapping | ✅ |
| 3 | File locations (strict patterns) | ✅ |
| 4 | Required files (platform-specific) | ✅ |
| 5 | No emojis in lib/*.md | ✅ |
| 6 | PROMPT.md style | ⚠️ |
| 7 | MODEL_FAILURES quality | ⚠️ |
| 8 | No Retain/DeletionProtection | ✅ |
| 9 | environmentSuffix usage | ⚠️ |
| 10 | Integration tests (no mocks) | ⚠️ |
| 11 | Claude review score >= 8 | ✅ |

✅ = Blocks merge | ⚠️ = Warning only
