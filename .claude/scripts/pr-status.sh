#!/bin/bash
# PR Status Viewer - Show detailed PR fix status and agent activity
# Provides visibility into what agents are doing

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

PR_STATUS_FILE="${PR_STATUS_FILE:-$REPO_ROOT/.claude/synth_pr_status.json}"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; 
CYAN='\033[0;36m'; MAGENTA='\033[0;35m'; NC='\033[0m'

print_header() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_section() {
    echo -e "\n${BLUE}### $1${NC}"
}

# Check if status file exists
if [ ! -f "$PR_STATUS_FILE" ]; then
    echo -e "${RED}❌ Status file not found: $PR_STATUS_FILE${NC}"
    echo ""
    echo "Generate it with:"
    echo "  python .claude/scripts/fetch_all_prs.py --assignee mayanksethi-turing --output $PR_STATUS_FILE"
    exit 1
fi

# Validate JSON
if ! jq empty "$PR_STATUS_FILE" 2>/dev/null; then
    echo -e "${RED}❌ Invalid JSON in status file${NC}"
    exit 1
fi

# Parse command
COMMAND="${1:-summary}"

case "$COMMAND" in
    summary)
        print_header "PR Fix Status Summary"
        
        # Get metadata
        GENERATED_AT=$(jq -r '.metadata.generated_at // "unknown"' "$PR_STATUS_FILE")
        ASSIGNEE=$(jq -r '.metadata.assignee // "unknown"' "$PR_STATUS_FILE")
        TOTAL_OPEN=$(jq -r '.metadata.total_open_prs // 0' "$PR_STATUS_FILE")
        
        echo -e "Generated: $GENERATED_AT"
        echo -e "Assignee: $ASSIGNEE"
        echo -e "Total Open PRs: $TOTAL_OPEN"
        
        # Count by agent_status
        PENDING=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == null or .agent_status == "pending")] | length' "$PR_STATUS_FILE")
        IN_PROGRESS=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "in_progress")] | length' "$PR_STATUS_FILE")
        FIXED=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "fixed")] | length' "$PR_STATUS_FILE")
        FAILED=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "failed")] | length' "$PR_STATUS_FILE")
        TOTAL_FAILED=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[]] | length' "$PR_STATUS_FILE")
        
        print_section "Agent Status Distribution"
        echo -e "  ${YELLOW}Pending:${NC}      $PENDING (available for agents)"
        echo -e "  ${BLUE}In Progress:${NC}  $IN_PROGRESS (being fixed now)"
        echo -e "  ${GREEN}Fixed:${NC}        $FIXED (successfully completed)"
        echo -e "  ${RED}Failed:${NC}       $FAILED (could not be fixed)"
        echo -e "  ${CYAN}Total:${NC}        $TOTAL_FAILED"
        
        # Show in-progress details
        if [ "$IN_PROGRESS" -gt 0 ]; then
            print_section "Currently Being Fixed"
            jq -r '.pull_requests_by_status.FAILED.by_failure_reason 
                | to_entries[] 
                | .value[] 
                | select(.agent_status == "in_progress")
                | "  🔧 PR #\(.pr_number) - \(.assigned_agent // "unknown agent")
    Progress: \(.fix_progress // "no update")
    Started: \(.started_at // "unknown")
    Failure: \(.failure_reason // "unknown")"' "$PR_STATUS_FILE"
        fi
        
        # Show recently fixed
        RECENT_FIXED=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "fixed")] | sort_by(.completed_at) | reverse | .[0:5]' "$PR_STATUS_FILE")
        if [ "$(echo "$RECENT_FIXED" | jq 'length')" -gt 0 ]; then
            print_section "Recently Fixed (last 5)"
            echo "$RECENT_FIXED" | jq -r '.[] | "  ✅ PR #\(.pr_number) - \(.completed_at // "unknown time")"'
        fi
        
        echo ""
        ;;
        
    active)
        print_header "Active Agent Activity"
        
        IN_PROGRESS=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "in_progress")] | length' "$PR_STATUS_FILE")
        
        if [ "$IN_PROGRESS" -eq 0 ]; then
            echo -e "${YELLOW}No agents currently working on PRs${NC}"
            echo ""
            echo "Start fixing PRs with:"
            echo "  /task-fix"
            exit 0
        fi
        
        echo -e "Active agents: $IN_PROGRESS\n"
        
        jq -r '.pull_requests_by_status.FAILED.by_failure_reason 
            | to_entries[] 
            | .value[] 
            | select(.agent_status == "in_progress")
            | "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PR #\(.pr_number): \(.failure_reason // "Unknown failure")

🤖 Agent: \(.assigned_agent // "unknown")
⏰ Started: \(.started_at // "unknown")
📊 Progress: \(.fix_progress // "no update")

🔍 Root Cause:
\(.root_cause_analysis // "Not yet analyzed")

📋 Fix Plan:
\(.fix_plan // "Not yet documented")

💡 Solution Approach:
\(.solution_approach // "Not yet documented")
"' "$PR_STATUS_FILE"
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;
        
    available)
        print_header "Available PRs (Pending)"
        
        PENDING=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == null or .agent_status == "pending")] | length' "$PR_STATUS_FILE")
        
        if [ "$PENDING" -eq 0 ]; then
            echo -e "${GREEN}All PRs are either in progress or completed!${NC}"
            exit 0
        fi
        
        echo -e "Available for fixing: $PENDING PRs\n"
        
        # Group by failure reason
        echo "By Failure Type:"
        jq -r '.pull_requests_by_status.FAILED.by_failure_reason 
            | to_entries[] 
            | .key as $reason 
            | .value 
            | map(select(.agent_status == null or .agent_status == "pending")) 
            | select(length > 0)
            | "\n  \($reason): \(length) PRs
\(map("    - PR #\(.pr_number)") | join("\n"))"' "$PR_STATUS_FILE"
        
        echo ""
        ;;
        
    pr)
        if [ -z "${2:-}" ]; then
            echo -e "${RED}❌ PR number required${NC}"
            echo "Usage: $0 pr <pr_number>"
            exit 1
        fi
        
        PR_NUMBER="$2"
        
        print_header "PR #${PR_NUMBER} Details"
        
        PR_DATA=$(jq -r --arg pr "$PR_NUMBER" '
            .pull_requests_by_status.FAILED.by_failure_reason 
            | to_entries[] 
            | .value[] 
            | select(.pr_number == ($pr | tonumber))' "$PR_STATUS_FILE" | head -1)
        
        if [ -z "$PR_DATA" ] || [ "$PR_DATA" = "null" ]; then
            echo -e "${RED}❌ PR #${PR_NUMBER} not found in status file${NC}"
            exit 1
        fi
        
        echo "$PR_DATA" | jq -r '"
📋 Basic Information:
   PR Number: \(.pr_number)
   URL: \(.pr_link // "unknown")
   Assignee: \(.assignee // "unknown")
   Last Updated: \(.last_updated_at // "unknown")

🚨 Failure Information:
   Status: \(.status // "unknown")
   Failure Reason: \(.failure_reason // "unknown")

🤖 Agent Status:
   Agent Status: \(.agent_status // "pending")
   Assigned Agent: \(.assigned_agent // "none")
   Started At: \(.started_at // "not started")
   Completed At: \(.completed_at // "not completed")
   Current Progress: \(.fix_progress // "no progress")

🔍 Root Cause Analysis:
\(.root_cause_analysis // "Not yet analyzed")

📋 Fix Plan:
\(.fix_plan // "Not yet documented")

💡 Solution Approach:
\(.solution_approach // "Not yet documented")

📊 Fix Iterations: \(.fix_iterations // 0)
✅ GitHub Checks Passed: \(.github_checks_passed // false)
"'
        ;;
        
    fixed)
        print_header "Fixed PRs"
        
        FIXED=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "fixed")] | length' "$PR_STATUS_FILE")
        
        if [ "$FIXED" -eq 0 ]; then
            echo -e "${YELLOW}No PRs have been fixed yet${NC}"
            exit 0
        fi
        
        echo -e "Total fixed: $FIXED PRs\n"
        
        jq -r '.pull_requests_by_status.FAILED.by_failure_reason 
            | to_entries[] 
            | .value[] 
            | select(.agent_status == "fixed")
            | "✅ PR #\(.pr_number) - \(.failure_reason // "unknown")
   Agent: \(.assigned_agent // "unknown")
   Completed: \(.completed_at // "unknown")
   Iterations: \(.fix_iterations // 0)
   GitHub Checks: \(if .github_checks_passed then "✅ PASSED" else "⚠️  Check manually" end)
"' "$PR_STATUS_FILE" | sort -t'#' -k2 -n -r
        ;;
        
    failed-fix)
        print_header "Failed to Fix"
        
        FAILED=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "failed")] | length' "$PR_STATUS_FILE")
        
        if [ "$FAILED" -eq 0 ]; then
            echo -e "${GREEN}No failed fix attempts!${NC}"
            exit 0
        fi
        
        echo -e "Could not fix: $FAILED PRs\n"
        
        jq -r '.pull_requests_by_status.FAILED.by_failure_reason 
            | to_entries[] 
            | .value[] 
            | select(.agent_status == "failed")
            | "❌ PR #\(.pr_number) - \(.failure_reason // "unknown")
   Root Cause: \(.root_cause_analysis // "not analyzed")
   Attempted Solution: \(.solution_approach // "not documented")
   Progress: \(.fix_progress // "unknown")
"' "$PR_STATUS_FILE"
        ;;
        
    stats)
        print_header "Fix Statistics"
        
        # Overall stats
        TOTAL=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[]] | length' "$PR_STATUS_FILE")
        PENDING=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == null or .agent_status == "pending")] | length' "$PR_STATUS_FILE")
        IN_PROGRESS=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "in_progress")] | length' "$PR_STATUS_FILE")
        FIXED=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "fixed")] | length' "$PR_STATUS_FILE")
        FAILED=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "failed")] | length' "$PR_STATUS_FILE")
        
        COMPLETED=$((FIXED + FAILED))
        
        if [ "$COMPLETED" -gt 0 ]; then
            SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($FIXED / $COMPLETED) * 100}")
        else
            SUCCESS_RATE="N/A"
        fi
        
        echo "Total Failed PRs: $TOTAL"
        echo ""
        echo "Status Breakdown:"
        echo "  ⏳ Pending:      $PENDING ($(awk "BEGIN {printf \"%.1f\", ($PENDING / $TOTAL) * 100}")%)"
        echo "  🔧 In Progress:  $IN_PROGRESS ($(awk "BEGIN {printf \"%.1f\", ($IN_PROGRESS / $TOTAL) * 100}")%)"
        echo "  ✅ Fixed:        $FIXED ($(awk "BEGIN {printf \"%.1f\", ($FIXED / $TOTAL) * 100}")%)"
        echo "  ❌ Failed:       $FAILED ($(awk "BEGIN {printf \"%.1f\", ($FAILED / $TOTAL) * 100}")%)"
        echo ""
        echo "Fix Success Rate: $SUCCESS_RATE%"
        echo ""
        
        # Average iterations for fixed PRs
        if [ "$FIXED" -gt 0 ]; then
            AVG_ITERATIONS=$(jq '[.pull_requests_by_status.FAILED.by_failure_reason | to_entries[] | .value[] | select(.agent_status == "fixed") | .fix_iterations // 1] | add / length' "$PR_STATUS_FILE")
            echo "Average Fix Iterations: $(printf "%.1f" "$AVG_ITERATIONS")"
        fi
        
        # Failure type breakdown
        echo ""
        print_section "Original Failure Types"
        jq -r '.summary.failure_breakdown.by_failure_reason | to_entries | sort_by(.value) | reverse | .[] | "  \(.key): \(.value) PRs"' "$PR_STATUS_FILE"
        
        echo ""
        ;;
        
    help|*)
        cat <<'EOF'
PR Status Viewer - Monitor agent activity and PR fix progress

Usage: ./scripts/pr-status.sh <command> [args]

Commands:
    summary         Show overall status summary (default)
    active          Show active agents and what they're working on
    available       List PRs available for fixing (pending)
    pr <number>     Show detailed info for specific PR
    fixed           List successfully fixed PRs
    failed-fix      List PRs that could not be fixed
    stats           Show detailed statistics
    help            Show this help message

Examples:
    # Quick overview
    ./scripts/pr-status.sh summary
    
    # See what agents are currently doing
    ./scripts/pr-status.sh active
    
    # Check available PRs to work on
    ./scripts/pr-status.sh available
    
    # Get detailed info about a specific PR
    ./scripts/pr-status.sh pr 6323
    
    # View all fixed PRs
    ./scripts/pr-status.sh fixed
    
    # See comprehensive statistics
    ./scripts/pr-status.sh stats

Tips:
    - Run 'summary' before starting new agent to see available PRs
    - Use 'active' to check if other agents are already working
    - Check 'pr <number>' for detailed root cause and fix plan
    - Review 'stats' to track overall fix progress

Status File: .claude/synth_pr_status.json
EOF
        ;;
esac

