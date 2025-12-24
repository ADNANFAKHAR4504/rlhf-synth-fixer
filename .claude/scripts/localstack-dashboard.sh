#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# LocalStack Migration Dashboard (Enhancement #6)
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Real-time monitoring of parallel migrations
#
# Usage:
#   ./localstack-dashboard.sh              # Live dashboard
#   ./localstack-dashboard.sh --status     # One-time status
#   ./localstack-dashboard.sh --history    # Show history
#   ./localstack-dashboard.sh --stats      # Show statistics
#
# Exit codes:
#   0 = Success
#   1 = Error
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Dashboard directories
DASHBOARD_DIR="$PROJECT_ROOT/.claude/reports/dashboard"
ACTIVE_FILE="$DASHBOARD_DIR/active.json"
HISTORY_FILE="$DASHBOARD_DIR/history.json"
STATS_FILE="$DASHBOARD_DIR/stats.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'

# Status icons
declare -A STATUS_ICONS
STATUS_ICONS=(
  ["pending"]="⏳"
  ["initializing"]="🔄"
  ["deploying"]="🚀"
  ["testing"]="🧪"
  ["fixing"]="🔧"
  ["pushing"]="📤"
  ["completed"]="✅"
  ["failed"]="❌"
  ["blocked"]="🚫"
  ["cancelled"]="⛔"
)

# Refresh interval
REFRESH_INTERVAL=5

# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

setup_directories() {
  mkdir -p "$DASHBOARD_DIR"
  
  # Initialize files if they don't exist
  if [[ ! -f "$ACTIVE_FILE" ]]; then
    echo '{"migrations": [], "updated_at": null}' > "$ACTIVE_FILE"
  fi
  
  if [[ ! -f "$HISTORY_FILE" ]]; then
    echo '{"migrations": [], "updated_at": null}' > "$HISTORY_FILE"
  fi
  
  if [[ ! -f "$STATS_FILE" ]]; then
    cat > "$STATS_FILE" << 'EOF'
{
  "total_migrations": 0,
  "successful": 0,
  "failed": 0,
  "avg_duration_minutes": 0,
  "by_platform": {},
  "by_day": {},
  "common_failures": []
}
EOF
  fi
}

clear_screen() {
  printf '\033[2J\033[H'
}

draw_header() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  echo -e "${BOLD}${CYAN}"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "                    📊 LOCALSTACK MIGRATION DASHBOARD"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo -e "${NC}"
  echo -e "${DIM}Last updated: $timestamp | Press Ctrl+C to exit${NC}"
  echo ""
}

draw_progress_bar() {
  local progress=$1
  local width=30
  local filled=$((progress * width / 100))
  local empty=$((width - filled))
  
  printf "["
  printf "%${filled}s" | tr ' ' '█'
  printf "%${empty}s" | tr ' ' '░'
  printf "] %3d%%" "$progress"
}

format_duration() {
  local seconds=$1
  local minutes=$((seconds / 60))
  local secs=$((seconds % 60))
  
  if [[ $minutes -gt 0 ]]; then
    printf "%dm %02ds" $minutes $secs
  else
    printf "%ds" $secs
  fi
}

get_status_color() {
  local status=$1
  case "$status" in
    "completed") echo -e "${GREEN}" ;;
    "failed"|"blocked") echo -e "${RED}" ;;
    "pending") echo -e "${GRAY}" ;;
    "fixing") echo -e "${YELLOW}" ;;
    *) echo -e "${BLUE}" ;;
  esac
}

# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARD FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

# Register a new migration
register_migration() {
  local pr_id="$1"
  local platform="${2:-unknown}"
  local status="${3:-pending}"
  
  setup_directories
  
  local timestamp=$(date -Iseconds)
  local entry=$(cat << EOF
{
  "pr_id": "$pr_id",
  "platform": "$platform",
  "status": "$status",
  "progress": 0,
  "current_step": "initializing",
  "started_at": "$timestamp",
  "updated_at": "$timestamp",
  "fixes_applied": [],
  "errors": []
}
EOF
)
  
  # Add to active migrations
  jq --argjson entry "$entry" '.migrations += [$entry] | .updated_at = now | tostring' "$ACTIVE_FILE" > "${ACTIVE_FILE}.tmp"
  mv "${ACTIVE_FILE}.tmp" "$ACTIVE_FILE"
  
  echo "Registered migration: $pr_id"
}

# Update migration status
update_migration() {
  local pr_id="$1"
  local status="${2:-}"
  local progress="${3:-}"
  local current_step="${4:-}"
  local error="${5:-}"
  
  setup_directories
  
  local timestamp=$(date -Iseconds)
  
  # Build jq update expression
  local jq_expr=".migrations |= map(if .pr_id == \"$pr_id\" then .updated_at = \"$timestamp\""
  
  [[ -n "$status" ]] && jq_expr+=" | .status = \"$status\""
  [[ -n "$progress" ]] && jq_expr+=" | .progress = $progress"
  [[ -n "$current_step" ]] && jq_expr+=" | .current_step = \"$current_step\""
  [[ -n "$error" ]] && jq_expr+=" | .errors += [\"$error\"]"
  
  jq_expr+=" else . end)"
  
  jq "$jq_expr" "$ACTIVE_FILE" > "${ACTIVE_FILE}.tmp"
  mv "${ACTIVE_FILE}.tmp" "$ACTIVE_FILE"
}

# Complete migration (move to history)
complete_migration() {
  local pr_id="$1"
  local status="${2:-completed}"
  local duration="${3:-0}"
  
  setup_directories
  
  local timestamp=$(date -Iseconds)
  
  # Get migration from active
  local migration=$(jq -r ".migrations[] | select(.pr_id == \"$pr_id\")" "$ACTIVE_FILE")
  
  if [[ -n "$migration" ]]; then
    # Update final status
    migration=$(echo "$migration" | jq ". + {\"status\": \"$status\", \"completed_at\": \"$timestamp\", \"duration_seconds\": $duration}")
    
    # Add to history
    jq --argjson entry "$migration" '.migrations = [$entry] + .migrations | .updated_at = now | tostring' "$HISTORY_FILE" > "${HISTORY_FILE}.tmp"
    mv "${HISTORY_FILE}.tmp" "$HISTORY_FILE"
    
    # Remove from active
    jq ".migrations |= map(select(.pr_id != \"$pr_id\"))" "$ACTIVE_FILE" > "${ACTIVE_FILE}.tmp"
    mv "${ACTIVE_FILE}.tmp" "$ACTIVE_FILE"
    
    # Update stats
    update_stats "$status" "$duration"
  fi
}

# Update statistics
update_stats() {
  local status="$1"
  local duration="$2"
  
  local today=$(date '+%Y-%m-%d')
  
  jq --arg status "$status" --arg duration "$duration" --arg today "$today" '
    .total_migrations += 1 |
    (if $status == "completed" then .successful += 1 else .failed += 1 end) |
    .avg_duration_minutes = ((.avg_duration_minutes * (.total_migrations - 1) + ($duration | tonumber / 60)) / .total_migrations) |
    .by_day[$today] = ((.by_day[$today] // 0) + 1)
  ' "$STATS_FILE" > "${STATS_FILE}.tmp"
  mv "${STATS_FILE}.tmp" "$STATS_FILE"
}

# Draw active migrations
draw_active_migrations() {
  if [[ ! -f "$ACTIVE_FILE" ]]; then
    echo -e "${DIM}No active migrations${NC}"
    return
  fi
  
  local count=$(jq '.migrations | length' "$ACTIVE_FILE")
  
  if [[ "$count" -eq 0 ]]; then
    echo -e "${DIM}No active migrations${NC}"
    echo ""
    return
  fi
  
  echo -e "${BOLD}Active Migrations ($count):${NC}"
  echo -e "${DIM}─────────────────────────────────────────────────────────────${NC}"
  
  jq -r '.migrations[] | "\(.pr_id)|\(.platform)|\(.status)|\(.progress)|\(.current_step)|\(.started_at)"' "$ACTIVE_FILE" | \
  while IFS='|' read -r pr_id platform status progress current_step started_at; do
    local icon="${STATUS_ICONS[$status]:-❓}"
    local color=$(get_status_color "$status")
    
    # Calculate elapsed time
    local start_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${started_at:0:19}" "+%s" 2>/dev/null || date "+%s")
    local now_epoch=$(date "+%s")
    local elapsed=$((now_epoch - start_epoch))
    local elapsed_str=$(format_duration $elapsed)
    
    # Draw migration row
    printf "${color}%s ${WHITE}%-12s${NC} " "$icon" "$pr_id"
    draw_progress_bar "$progress"
    printf " ${DIM}%s${NC}" "$current_step"
    printf " ${GRAY}(%s)${NC}\n" "$elapsed_str"
  done
  
  echo ""
}

# Draw summary stats
draw_summary() {
  echo -e "${BOLD}Today's Summary:${NC}"
  echo -e "${DIM}─────────────────────────────────────────────────────────────${NC}"
  
  local today=$(date '+%Y-%m-%d')
  
  if [[ -f "$STATS_FILE" ]]; then
    local total=$(jq '.total_migrations' "$STATS_FILE")
    local successful=$(jq '.successful' "$STATS_FILE")
    local failed=$(jq '.failed' "$STATS_FILE")
    local avg_duration=$(jq '.avg_duration_minutes | floor' "$STATS_FILE")
    local today_count=$(jq --arg today "$today" '.by_day[$today] // 0' "$STATS_FILE")
    
    local success_rate=0
    if [[ $total -gt 0 ]]; then
      success_rate=$((successful * 100 / total))
    fi
    
    printf "  ${GREEN}✅ Completed:${NC}  %d\n" "$successful"
    printf "  ${RED}❌ Failed:${NC}     %d\n" "$failed"
    printf "  📊 Success Rate: %d%%\n" "$success_rate"
    printf "  ⏱️  Avg Duration: %d min\n" "$avg_duration"
    printf "  📅 Today:        %d migrations\n" "$today_count"
  else
    echo -e "  ${DIM}No statistics available${NC}"
  fi
  
  echo ""
}

# Draw recent history
draw_history() {
  local limit="${1:-5}"
  
  echo -e "${BOLD}Recent Migrations:${NC}"
  echo -e "${DIM}─────────────────────────────────────────────────────────────${NC}"
  
  if [[ ! -f "$HISTORY_FILE" ]]; then
    echo -e "  ${DIM}No history available${NC}"
    return
  fi
  
  local count=$(jq '.migrations | length' "$HISTORY_FILE")
  
  if [[ "$count" -eq 0 ]]; then
    echo -e "  ${DIM}No history available${NC}"
    return
  fi
  
  jq -r ".migrations[:$limit][] | \"\(.pr_id)|\(.status)|\(.platform)|\(.duration_seconds)|\(.completed_at)\"" "$HISTORY_FILE" | \
  while IFS='|' read -r pr_id status platform duration completed_at; do
    local icon="${STATUS_ICONS[$status]:-❓}"
    local color=$(get_status_color "$status")
    local duration_str=$(format_duration "$duration")
    local time_str="${completed_at:11:8}"
    
    printf "  ${color}%s${NC} %-12s %-10s %8s  ${DIM}%s${NC}\n" "$icon" "$pr_id" "$platform" "$duration_str" "$time_str"
  done
  
  echo ""
}

# Draw full statistics
draw_full_stats() {
  echo -e "${BOLD}${CYAN}"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "                         📈 MIGRATION STATISTICS"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo -e "${NC}"
  
  if [[ ! -f "$STATS_FILE" ]]; then
    echo -e "${DIM}No statistics available${NC}"
    return
  fi
  
  local total=$(jq '.total_migrations' "$STATS_FILE")
  local successful=$(jq '.successful' "$STATS_FILE")
  local failed=$(jq '.failed' "$STATS_FILE")
  local avg_duration=$(jq '.avg_duration_minutes' "$STATS_FILE")
  
  echo -e "${BOLD}Overall Statistics:${NC}"
  echo ""
  printf "  Total Migrations:  %d\n" "$total"
  printf "  Successful:        ${GREEN}%d${NC}\n" "$successful"
  printf "  Failed:            ${RED}%d${NC}\n" "$failed"
  
  if [[ $total -gt 0 ]]; then
    local success_rate=$((successful * 100 / total))
    printf "  Success Rate:      %d%%\n" "$success_rate"
  fi
  
  printf "  Avg Duration:      %.1f minutes\n" "$avg_duration"
  echo ""
  
  echo -e "${BOLD}Migrations by Day:${NC}"
  echo ""
  jq -r '.by_day | to_entries | sort_by(.key) | reverse | .[:7][] | "  \(.key): \(.value)"' "$STATS_FILE"
  echo ""
  
  echo -e "${BOLD}Migrations by Platform:${NC}"
  echo ""
  jq -r '.by_platform | to_entries | sort_by(.value) | reverse | .[] | "  \(.key): \(.value)"' "$STATS_FILE" 2>/dev/null || echo "  No platform data"
  echo ""
}

# Live dashboard mode
live_dashboard() {
  trap 'clear_screen; echo "Dashboard closed."; exit 0' INT
  
  while true; do
    clear_screen
    draw_header
    draw_active_migrations
    draw_summary
    draw_history 5
    
    echo -e "${DIM}Refreshing in ${REFRESH_INTERVAL}s...${NC}"
    sleep $REFRESH_INTERVAL
  done
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

setup_directories

# Parse arguments
MODE="live"
MIGRATION_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --status|-s)
      MODE="status"
      shift
      ;;
    --history|-h)
      MODE="history"
      shift
      ;;
    --stats)
      MODE="stats"
      shift
      ;;
    --register)
      MODE="register"
      MIGRATION_ID="$2"
      shift 2
      ;;
    --update)
      MODE="update"
      MIGRATION_ID="$2"
      shift 2
      ;;
    --complete)
      MODE="complete"
      MIGRATION_ID="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --status, -s    Show current status (one-time)"
      echo "  --history, -h   Show migration history"
      echo "  --stats         Show detailed statistics"
      echo "  --register ID   Register a new migration"
      echo "  --update ID     Update migration status"
      echo "  --complete ID   Complete a migration"
      echo "  --help          Show this help"
      echo ""
      echo "Without options, runs live dashboard mode."
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

case "$MODE" in
  "live")
    live_dashboard
    ;;
  "status")
    draw_header
    draw_active_migrations
    draw_summary
    ;;
  "history")
    draw_header
    draw_history 20
    ;;
  "stats")
    draw_full_stats
    ;;
  "register")
    register_migration "$MIGRATION_ID" "${2:-unknown}" "pending"
    ;;
  "update")
    update_migration "$MIGRATION_ID" "${2:-}" "${3:-}" "${4:-}"
    ;;
  "complete")
    complete_migration "$MIGRATION_ID" "${2:-completed}" "${3:-0}"
    ;;
esac

