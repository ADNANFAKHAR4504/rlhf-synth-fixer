#!/bin/bash
# Test script to verify parallel execution with file locking
# This simulates multiple agents selecting tasks simultaneously

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$CLAUDE_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Test configuration
NUM_AGENTS=${1:-3}
TEST_CSV=".claude/tasks.csv.test"
TEST_BACKUP=".claude/tasks.csv.backup.test"
TEST_LOCK=".claude/tasks.csv.lock.test"

log_info "Parallel Locking Test - Starting $NUM_AGENTS agents"

# Cleanup function
cleanup() {
    rm -f "$TEST_CSV" "$TEST_BACKUP" "$TEST_LOCK" test_agent_*.log
    log_info "Cleaned up test files"
}

# Set up test environment
setup_test() {
    log_info "Setting up test environment..."
    
    # Create a minimal test CSV with some pending tasks
    cat > "$TEST_CSV" <<'EOF'
task_id,status,platform,language,difficulty,category,subcategory,subtask
test-task-001,pending,cdk,ts,hard,monitoring,health-checks,Test task 1
test-task-002,pending,cdk,ts,medium,monitoring,health-checks,Test task 2
test-task-003,pending,cdk,ts,hard,monitoring,health-checks,Test task 3
test-task-004,pending,cdk,ts,medium,monitoring,health-checks,Test task 4
test-task-005,pending,cdk,ts,hard,monitoring,health-checks,Test task 5
EOF
    
    log_info "Created test CSV with 5 pending tasks"
}

# Run a single agent
run_agent() {
    local agent_id=$1
    local log_file="test_agent_${agent_id}.log"
    
    {
        echo "Agent $agent_id: Starting at $(date +%H:%M:%S.%N)"
        
        # Use test CSV files and capture output properly
        TASK_JSON=$(CSV_FILE="$TEST_CSV" BACKUP_FILE="$TEST_BACKUP" LOCK_FILE="$TEST_LOCK" LOCK_TIMEOUT=10 ./.claude/scripts/task-manager.sh select-and-update 2>&1)
        
        local exit_code=$?
        
        if [ $exit_code -eq 0 ]; then
            TASK_ID=$(echo "$TASK_JSON" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)
            echo "Agent $agent_id: Selected task $TASK_ID at $(date +%H:%M:%S.%N)"
            
            # Simulate some work
            sleep 0.1
            
            # Mark as done
            CSV_FILE="$TEST_CSV" BACKUP_FILE="$TEST_BACKUP" LOCK_FILE="$TEST_LOCK" ./.claude/scripts/task-manager.sh update "$TASK_ID" "done" "Agent $agent_id" 2>&1
            
            echo "Agent $agent_id: Completed task $TASK_ID at $(date +%H:%M:%S.%N)"
        else
            echo "Agent $agent_id: Failed to select task (exit code: $exit_code)"
        fi
    } > "$log_file" 2>&1
}

# Main test execution
main() {
    # Trap to cleanup on exit
    trap cleanup EXIT
    
    # Setup test environment
    setup_test
    
    log_info "Launching $NUM_AGENTS agents in parallel..."
    
    # Launch agents in background
    local pids=()
    for i in $(seq 1 $NUM_AGENTS); do
        run_agent "$i" &
        pids+=($!)
        log_info "Started agent $i (PID: ${pids[$((i-1))]})"
    done
    
    # Wait for all agents to complete
    log_info "Waiting for all agents to complete..."
    for pid in "${pids[@]}"; do
        wait "$pid"
    done
    
    log_info "All agents completed"
    echo ""
    
    # Analyze results
    log_info "=== Test Results ==="
    echo ""
    
    # Show what each agent selected
    log_info "Agent Task Selection:"
    for i in $(seq 1 $NUM_AGENTS); do
        if [ -f "test_agent_${i}.log" ]; then
            selected=$(grep "Selected task" "test_agent_${i}.log" || echo "No task selected")
            echo "  Agent $i: $selected"
        fi
    done
    echo ""
    
    # Check for duplicates (field 5 is the task ID)
    selected_tasks=$(grep "Selected task" test_agent_*.log | awk '{print $5}' | sort)
    duplicate_count=$(echo "$selected_tasks" | uniq -d | wc -l | tr -d ' ')
    
    if [ "$duplicate_count" -eq 0 ]; then
        log_info "✅ NO DUPLICATES - Each agent selected a unique task!"
    else
        log_error "❌ DUPLICATES FOUND - Multiple agents selected the same task:"
        echo "$selected_tasks" | uniq -d
        return 1
    fi
    echo ""
    
    # Show final CSV state
    log_info "Final Task Status:"
    CSV_FILE="$TEST_CSV" ./.claude/scripts/task-manager.sh status 2>/dev/null | head -20
    echo ""
    
    # Verify row count
    original_count=5
    final_count=$(tail -n +2 "$TEST_CSV" | wc -l | tr -d ' ')
    
    if [ "$final_count" -eq "$original_count" ]; then
        log_info "✅ ROW COUNT PRESERVED - No data loss (5 tasks)"
    else
        log_error "❌ DATA LOSS - Expected $original_count rows, found $final_count"
        return 1
    fi
    echo ""
    
    # Count tasks by status
    in_progress=$(grep -c ",in_progress," "$TEST_CSV" || echo "0")
    done=$(grep -c ",done," "$TEST_CSV" || echo "0")
    pending=$(grep -c ",pending," "$TEST_CSV" || echo "0")
    
    log_info "Task Status Distribution:"
    echo "  Pending: $pending"
    echo "  In Progress: $in_progress"
    echo "  Done: $done"
    echo ""
    
    # Verify all agents got different tasks
    if [ "$done" -eq "$NUM_AGENTS" ]; then
        log_info "✅ ALL AGENTS SUCCESSFUL - $NUM_AGENTS tasks completed"
    else
        log_warn "⚠️  Only $done tasks completed (expected $NUM_AGENTS)"
    fi
    echo ""
    
    # Show timing information
    log_info "Timing Analysis:"
    echo "Agent Start/Complete Times:"
    for i in $(seq 1 $NUM_AGENTS); do
        if [ -f "test_agent_${i}.log" ]; then
            cat "test_agent_${i}.log" | grep -E "(Starting|Selected|Completed)" | sed "s/^/  /"
        fi
    done
    echo ""
    
    log_info "🎉 Parallel execution test completed successfully!"
}

# Run the test
main

