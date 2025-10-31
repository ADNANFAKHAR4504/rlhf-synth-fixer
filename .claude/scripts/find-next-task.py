#!/usr/bin/env python3
"""
⚠️ DEPRECATED: This script is NOT thread-safe for parallel execution!
⚠️ Use ./.claude/scripts/task-manager.sh select-and-update instead

This script lacks file locking and will cause race conditions when multiple
agents run in parallel. The task-manager.sh script provides:
- Atomic select-and-update operations
- File locking to prevent race conditions  
- 3-5x better performance
- Thread-safe parallel execution

Find the next available task with hard or medium difficulty from .claude/tasks.csv
Tasks with empty status, or status not in ['in_progress', 'done'] are considered available
"""
import csv
import sys
import json
from pathlib import Path

# Print deprecation warning to stderr
print("⚠️  WARNING: find-next-task.py is deprecated for parallel execution!", file=sys.stderr)
print("⚠️  Use: ./.claude/scripts/task-manager.sh select-and-update", file=sys.stderr)
print("", file=sys.stderr)

def find_next_task():
    # Get path to .claude/tasks.csv
    script_dir = Path(__file__).parent
    claude_dir = script_dir.parent
    csv_path = claude_dir / "tasks.csv"
    
    try:
        with open(csv_path, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            for row in reader:
                # Check status and difficulty
                status = row.get('status', '').strip().lower()
                difficulty = row.get('difficulty', '').strip().lower()

                # Task is available if status is not in_progress or done
                # Empty status is also considered available
                is_available = status not in ['in_progress', 'done']
                is_right_difficulty = difficulty in ['hard', 'medium']

                if is_available and is_right_difficulty:
                    # Print the task as JSON for easy parsing
                    print(json.dumps(row, indent=2))
                    return 0

        print("ERROR: No available tasks with medium or hard difficulty found")
        return 1

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(find_next_task())
