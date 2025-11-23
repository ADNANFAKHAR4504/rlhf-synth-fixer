#!/bin/bash
# run-tasks.sh
# Single command to launch n parallel Claude sessions with task-coordinator
# Usage: ./run-tasks.sh <n>
# Example: ./run-tasks.sh 3

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

NUM_TASKS=${1:-2}

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}🚀 Launching $NUM_TASKS Parallel Claude Task Sessions${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check prerequisites
if ! command -v claude &> /dev/null; then
    echo -e "${RED}❌ Error: 'claude' command not found${NC}"
    echo "   Please install Claude CLI first"
    exit 1
fi

# Check available tasks
echo -e "${BLUE}📋 Checking available tasks...${NC}"
TASK_STATUS=$("$REPO_ROOT/.claude/scripts/task-manager.sh" status 2>/dev/null || echo '{}')
PENDING_COUNT=$(echo "$TASK_STATUS" | grep -o '"pending":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")

if [ "$PENDING_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No pending tasks found${NC}"
    "$REPO_ROOT/.claude/scripts/task-manager.sh" status
    exit 1
fi

echo -e "${GREEN}✅ Found $PENDING_COUNT pending tasks${NC}"
echo ""

# Create logs directory
mkdir -p .claude/logs

# Detect terminal type
if command -v osascript &> /dev/null; then
    # macOS - use AppleScript to open tabs
    TERMINAL_TYPE="macos"
elif [ -n "${ITERM_SESSION_ID:-}" ]; then
    TERMINAL_TYPE="iterm2"
else
    TERMINAL_TYPE="unknown"
fi

# Function to open new terminal tab (macOS Terminal.app)
# Uses the expect-based runner for reliable automation
open_terminal_tab() {
    local task_num=$1
    local log_file="$REPO_ROOT/.claude/logs/task-${task_num}.log"
    local runner_script="$REPO_ROOT/.claude/scripts/run-single-task-auto.sh"
    
    osascript <<EOF
tell application "Terminal"
    activate
    tell front window
        do script "cd '$REPO_ROOT' && '$runner_script' $task_num 2>&1 | tee '$log_file'"
    end tell
end tell
EOF
}

# Function to open new iTerm2 tab
# Uses the expect-based runner for reliable automation
open_iterm2_tab() {
    local task_num=$1
    local log_file="$REPO_ROOT/.claude/logs/task-${task_num}.log"
    local runner_script="$REPO_ROOT/.claude/scripts/run-single-task-auto.sh"
    
    osascript <<EOF
tell application "iTerm2"
    activate
    tell current window
        create tab with default profile
        tell current session of current tab
            write text "cd '$REPO_ROOT' && '$runner_script' $task_num 2>&1 | tee '$log_file'"
        end tell
    end tell
end tell
EOF
}

# Launch tasks
echo -e "${BLUE}📂 Opening $NUM_TASKS terminal tabs...${NC}"
echo ""

for i in $(seq 1 $NUM_TASKS); do
    echo -e "${CYAN}  → Launching task session $i...${NC}"
    
    if [ "$TERMINAL_TYPE" = "macos" ]; then
        if [ -n "${ITERM_SESSION_ID:-}" ] || command -v iterm2 &> /dev/null; then
            open_iterm2_tab "$i" 2>/dev/null || open_terminal_tab "$i"
        else
            open_terminal_tab "$i"
        fi
    else
        echo -e "${YELLOW}⚠️  Auto-tab opening not supported. Please open tabs manually.${NC}"
        echo "   Run in each tab: cd '$REPO_ROOT' && claude"
        echo "   Then type: /task-coordinator"
    fi
    
    sleep 1  # Stagger launches
done

echo ""
echo -e "${GREEN}✅ All sessions launched!${NC}"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📊 Monitoring Commands${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}View status:${NC}"
echo "   ./.claude/scripts/status.sh"
echo ""
echo -e "${BLUE}View detailed status:${NC}"
echo "   ./.claude/scripts/status.sh --detailed"
echo ""
echo -e "${BLUE}Watch status (auto-refresh):${NC}"
echo "   ./.claude/scripts/status.sh --watch"
echo ""
echo -e "${BLUE}View task logs:${NC}"
echo "   tail -f .claude/logs/task-*.log"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}💡 Tip: Each Claude session will automatically:${NC}"
echo "   1. Select next pending task from tasks.csv"
echo "   2. Mark it as 'in_progress'"
echo "   3. Process it through all phases"
echo "   4. Update status when complete"
echo ""
echo -e "${YELLOW}👀 Watch the terminal tabs to see real-time progress!${NC}"

