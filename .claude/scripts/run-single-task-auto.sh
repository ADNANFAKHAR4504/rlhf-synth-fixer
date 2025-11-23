#!/bin/bash
# run-single-task-auto.sh
# Automatically runs Claude with /task-coordinator
# Usage: ./run-single-task-auto.sh <task_number>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

TASK_NUM=${1:-1}

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 Task Session $TASK_NUM${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Starting Claude with /task-coordinator...${NC}"
echo -e "${GREEN}This will automatically select and process a task${NC}"
echo ""

# Check if expect is available
if ! command -v expect &> /dev/null; then
    echo -e "${YELLOW}⚠️  expect not found. Running interactively...${NC}"
    echo "   Please type '/task-coordinator' when Claude starts"
    echo ""
    claude
    exit 0
fi

# Create expect script
EXPECT_SCRIPT=$(mktemp)
cat > "$EXPECT_SCRIPT" <<'EXPECT_EOF'
#!/usr/bin/expect -f

set timeout 3600
set task_coordinator "/task-coordinator"

# Start Claude
spawn claude

# Wait for Claude to be ready (look for various prompt patterns)
expect {
    timeout {
        puts "Timeout waiting for Claude to start"
        exit 1
    }
    -re ".*>" {
        sleep 1
        send "$task_coordinator\r"
    }
    -re ".*\\$" {
        sleep 1
        send "$task_coordinator\r"
    }
    -re ".*:" {
        sleep 1
        send "$task_coordinator\r"
    }
    eof {
        puts "Claude exited unexpectedly"
        exit 1
    }
}

# Wait a moment for command to be processed
sleep 1

# Keep session interactive so user can see output
# This allows the session to continue running and be visible
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

