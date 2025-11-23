#!/bin/bash
# status.sh
# Monitor task status across all running sessions
# Usage: ./status.sh [--watch] [--detailed]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

WATCH_MODE=false
DETAILED=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --watch)
            WATCH_MODE=true
            ;;
        --detailed)
            DETAILED=true
            ;;
    esac
done

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to display status
show_status() {
    clear
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}📊 Task Status Dashboard${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}Last updated: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
    
    # Get status from task-manager
    TASK_STATUS=$("$REPO_ROOT/.claude/scripts/task-manager.sh" status 2>/dev/null || echo '{}')
    
    # Extract counts (handling different JSON formats)
    PENDING=$(echo "$TASK_STATUS" | grep -o '"pending":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
    IN_PROGRESS=$(echo "$TASK_STATUS" | grep -o '"in_progress":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
    DONE=$(echo "$TASK_STATUS" | grep -o '"done":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
    ERROR=$(echo "$TASK_STATUS" | grep -o '"error":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
    
    # Display summary
    echo -e "${CYAN}📈 Summary:${NC}"
    echo ""
    echo -e "   ${YELLOW}⏳ Pending:    ${PENDING}${NC}"
    echo -e "   ${BLUE}🔄 In Progress: ${IN_PROGRESS}${NC}"
    echo -e "   ${GREEN}✅ Done:       ${DONE}${NC}"
    echo -e "   ${RED}❌ Error:      ${ERROR}${NC}"
    echo ""
    
    # Show in-progress tasks
    if [ "$IN_PROGRESS" -gt 0 ]; then
        echo -e "${CYAN}🔄 Currently Processing:${NC}"
        echo ""
        
        # Get in-progress tasks from CSV
        if [ -f ".claude/tasks.csv" ]; then
            while IFS=',' read -r task_id status platform language difficulty rest; do
                if [ "$status" = "in_progress" ]; then
                    echo -e "   ${BLUE}• Task: ${task_id}${NC}"
                    echo -e "     Platform: ${platform} | Language: ${language}"
                    echo ""
                fi
            done < <(tail -n +2 .claude/tasks.csv | grep ",in_progress," || true)
        fi
    fi
    
    # Detailed view
    if [ "$DETAILED" = true ]; then
        echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${CYAN}📋 Detailed Status:${NC}"
        echo ""
        "$REPO_ROOT/.claude/scripts/task-manager.sh" status | head -30
        echo ""
    fi
    
    # Show recent logs
    if [ -d ".claude/logs" ]; then
        echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${CYAN}📝 Recent Activity:${NC}"
        echo ""
        find .claude/logs -name "task-*.log" -type f -mmin -10 2>/dev/null | while read -r logfile; do
            task_num=$(basename "$logfile" | sed 's/task-\(.*\)\.log/\1/')
            if [ -s "$logfile" ]; then
                last_line=$(tail -1 "$logfile" 2>/dev/null | head -c 80)
                echo -e "   ${BLUE}Task $task_num:${NC} ${last_line}..."
            fi
        done
        echo ""
    fi
    
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    
    if [ "$WATCH_MODE" = true ]; then
        echo -e "${YELLOW}Press Ctrl+C to stop watching${NC}"
        sleep 5
    fi
}

# Main
if [ "$WATCH_MODE" = true ]; then
    # Watch mode - auto-refresh
    while true; do
        show_status
    done
else
    # Single display
    show_status
fi

