#!/bin/bash
# run-tasks.sh
# Pre-selects tasks, then launches n parallel Claude sessions with task-coordinator
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
echo -e "${CYAN}🚀 Pre-selecting $NUM_TASKS tasks, then launching Claude sessions${NC}"
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

if [ "$PENDING_COUNT" -lt "$NUM_TASKS" ]; then
    echo -e "${YELLOW}⚠️  Only $PENDING_COUNT pending tasks available (need $NUM_TASKS)${NC}"
    "$REPO_ROOT/.claude/scripts/task-manager.sh" status
    exit 1
fi

echo -e "${GREEN}✅ Found $PENDING_COUNT pending tasks${NC}"
echo ""

# Create logs directory
mkdir -p .claude/logs

# Pre-select all tasks BEFORE launching Claude sessions
echo -e "${CYAN}🔒 Pre-selecting $NUM_TASKS tasks (thread-safe)...${NC}"
echo ""

TASK_IDS=()
FAILED_SELECTIONS=0

for i in $(seq 1 $NUM_TASKS); do
    echo -e "${BLUE}  → Selecting task $i/$NUM_TASKS...${NC}"
    
    # Select task atomically (thread-safe with file locking)
    TASK_JSON=$("$REPO_ROOT/.claude/scripts/task-manager.sh" select-and-update 2>&1)
    SELECT_EXIT_CODE=$?
    
    if [ $SELECT_EXIT_CODE -ne 0 ] || [ -z "$TASK_JSON" ]; then
        echo -e "${RED}    ❌ Failed to select task $i${NC}"
        echo "    Error: $TASK_JSON"
        FAILED_SELECTIONS=$((FAILED_SELECTIONS + 1))
        continue
    fi
    
    # Extract task ID
    TASK_ID=$(echo "$TASK_JSON" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$TASK_ID" ]; then
        echo -e "${RED}    ❌ Failed to parse task ID${NC}"
        FAILED_SELECTIONS=$((FAILED_SELECTIONS + 1))
        continue
    fi
    
    # Store task ID
    TASK_IDS+=("$TASK_ID")
    echo "$TASK_ID" > ".claude/logs/task-${i}.id"
    
    # Extract other info for display
    PLATFORM=$(echo "$TASK_JSON" | grep -o '"platform":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    LANGUAGE=$(echo "$TASK_JSON" | grep -o '"language":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    
    echo -e "${GREEN}    ✅ Selected task $i: ${TASK_ID} (${PLATFORM}-${LANGUAGE})${NC}"
    
    # Small delay between selections to ensure lock release
    if [ $i -lt $NUM_TASKS ]; then
        sleep 1
    fi
done

echo ""

# Check if we got enough tasks
SELECTED_COUNT=${#TASK_IDS[@]}
if [ $SELECTED_COUNT -lt $NUM_TASKS ]; then
    echo -e "${RED}❌ Only selected $SELECTED_COUNT out of $NUM_TASKS tasks${NC}"
    echo -e "${YELLOW}⚠️  Will launch only $SELECTED_COUNT sessions${NC}"
    NUM_TASKS=$SELECTED_COUNT
fi

if [ $SELECTED_COUNT -eq 0 ]; then
    echo -e "${RED}❌ Failed to select any tasks${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Successfully pre-selected $SELECTED_COUNT tasks${NC}"
echo ""
echo -e "${CYAN}📋 Selected Tasks:${NC}"
for i in $(seq 1 $SELECTED_COUNT); do
    TASK_ID="${TASK_IDS[$((i-1))]}"
    echo -e "   ${i}. ${TASK_ID}"
done
echo ""

# Detect terminal type
if command -v osascript &> /dev/null; then
    TERMINAL_TYPE="macos"
elif [ -n "${ITERM_SESSION_ID:-}" ]; then
    TERMINAL_TYPE="iterm2"
else
    TERMINAL_TYPE="unknown"
fi

# Function to open new terminal tab (macOS Terminal.app) - same window
open_terminal_tab() {
    local task_num=$1
    local task_id=$2
    local log_file="$REPO_ROOT/.claude/logs/task-${task_num}.log"
    local runner_script="$REPO_ROOT/.claude/scripts/run-single-task-with-selection.sh"
    
    osascript <<EOF
tell application "Terminal"
    activate
    if (count of windows) = 0 then
        do script "cd '$REPO_ROOT' && TASK_ID='$task_id' '$runner_script' $task_num 2>&1 | tee '$log_file'"
    else
        tell front window
            do script "cd '$REPO_ROOT' && TASK_ID='$task_id' '$runner_script' $task_num 2>&1 | tee '$log_file'"
        end tell
    end if
end tell
EOF
}

# Function to open new iTerm2 tab - same window
open_iterm2_tab() {
    local task_num=$1
    local task_id=$2
    local log_file="$REPO_ROOT/.claude/logs/task-${task_num}.log"
    local runner_script="$REPO_ROOT/.claude/scripts/run-single-task-with-selection.sh"
    
    osascript <<EOF
tell application "iTerm2"
    activate
    tell current window
        create tab with default profile
        tell current session of current tab
            write text "cd '$REPO_ROOT' && TASK_ID='$task_id' '$runner_script' $task_num 2>&1 | tee '$log_file'"
        end tell
    end tell
end tell
EOF
}

# Launch tasks with pre-selected task IDs
echo -e "${BLUE}📂 Launching $SELECTED_COUNT Claude sessions...${NC}"
echo ""

for i in $(seq 1 $SELECTED_COUNT); do
    TASK_ID="${TASK_IDS[$((i-1))]}"
    echo -e "${CYAN}  → Launching session $i with task ${TASK_ID}...${NC}"
    
    if [ "$TERMINAL_TYPE" = "macos" ]; then
        if [ -n "${ITERM_SESSION_ID:-}" ] || command -v iterm2 &> /dev/null; then
            open_iterm2_tab "$i" "$TASK_ID" 2>/dev/null || open_terminal_tab "$i" "$TASK_ID"
        else
            open_terminal_tab "$i" "$TASK_ID"
        fi
    else
        echo -e "${YELLOW}⚠️  Auto-tab opening not supported${NC}"
        echo "   Run: cd '$REPO_ROOT' && TASK_ID='$TASK_ID' ./.claude/scripts/run-single-task-with-selection.sh $i"
    fi
    
    sleep 2  # Stagger launches
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
echo -e "${BLUE}Watch status:${NC}"
echo "   ./.claude/scripts/status.sh --watch"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
