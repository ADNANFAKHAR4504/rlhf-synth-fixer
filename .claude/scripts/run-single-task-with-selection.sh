#!/bin/bash
# run-single-task-with-selection.sh
# Runs Claude with pre-selected task ID
# Usage: TASK_ID=<task_id> ./run-single-task-with-selection.sh <task_number>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

TASK_NUM=${1:-1}
ASSIGNED_TASK_ID="${TASK_ID:-}"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 Task Session $TASK_NUM${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if task ID was provided
if [ -z "$ASSIGNED_TASK_ID" ]; then
    # Try to read from file
    TASK_ID_FILE=".claude/logs/task-${TASK_NUM}.id"
    if [ -f "$TASK_ID_FILE" ]; then
        ASSIGNED_TASK_ID=$(cat "$TASK_ID_FILE")
        echo -e "${GREEN}📋 Using pre-selected task from file: ${ASSIGNED_TASK_ID}${NC}"
    else
        echo -e "${YELLOW}⚠️  No task ID provided - will auto-select${NC}"
    fi
else
    echo -e "${GREEN}📋 Using pre-selected task: ${ASSIGNED_TASK_ID}${NC}"
fi

echo ""
echo -e "${GREEN}Starting Claude with /task-coordinator...${NC}"
echo ""

# Export task ID so iac-task-selector can use it
export CLAUDE_TASK_ID="$ASSIGNED_TASK_ID"

# Check if expect is available
if ! command -v expect &> /dev/null; then
    echo -e "${YELLOW}⚠️  expect not found. Running interactively...${NC}"
    echo "   Task: ${ASSIGNED_TASK_ID:-<will be selected>}"
    echo "   Please type '/task-coordinator' when Claude starts"
    echo ""
    claude
    exit 0
fi

# Create expect script with improved prompt detection
EXPECT_SCRIPT=$(mktemp)
cat > "$EXPECT_SCRIPT" <<'EXPECT_EOF'
#!/usr/bin/expect -f

set timeout 60
set task_coordinator "/task-coordinator"

# Start Claude
spawn claude

# Wait for Claude prompt - try multiple patterns
expect {
    timeout {
        puts "Timeout waiting for Claude prompt (60s)"
        puts "Sending command anyway..."
        sleep 2
        send "$task_coordinator\r"
    }
    -re ".*>" {
        puts "Detected '>' prompt"
        sleep 1
        send "$task_coordinator\r"
    }
    -re ".*\\$" {
        puts "Detected '$' prompt"
        sleep 1
        send "$task_coordinator\r"
    }
    -re ".*:" {
        puts "Detected ':' prompt"
        sleep 1
        send "$task_coordinator\r"
    }
    -re ".*\\]" {
        puts "Detected ']' prompt"
        sleep 1
        send "$task_coordinator\r"
    }
    -re ".*\\?" {
        puts "Detected '?' prompt"
        sleep 1
        send "$task_coordinator\r"
    }
    eof {
        puts "Claude exited unexpectedly"
        exit 1
    }
}

# Wait for command to be sent
sleep 2

# Keep session interactive so user can see output
interact {
    \003 {
        # Ctrl+C - exit gracefully
        send "\003"
        exit 0
    }
    eof {
        exit 0
    }
}
EXPECT_EOF

chmod +x "$EXPECT_SCRIPT"

# Run expect
"$EXPECT_SCRIPT"

# Cleanup
rm -f "$EXPECT_SCRIPT"

