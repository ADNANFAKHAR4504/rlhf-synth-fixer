#!/usr/bin/env python3
"""
Safely update task status in .claude/tasks.csv following the CSV safety guidelines
"""
import csv
import shutil
import sys
import os
from datetime import datetime
from pathlib import Path

# Get paths
script_dir = Path(__file__).parent
claude_dir = script_dir.parent
csv_path = claude_dir / "tasks.csv"
backup_path = claude_dir / "tasks.csv.backup"

# Configuration
task_id = "7343579531"
new_status = "in_progress"

try:
    # STEP 1: BACKUP
    backup_name = f'{backup_path}.{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    shutil.copy2(csv_path, backup_name)
    print(f"Created backup: {backup_name}")

    # STEP 2: READ ALL ROWS
    rows = []
    original_count = 0
    task_found = False
    with open(csv_path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            original_count += 1
            # Modify specific row
            if row['task_id'] == task_id:
                row['status'] = new_status
                task_found = True
                print(f"Found task {task_id}, updating status to '{new_status}'")
            rows.append(row)  # CRITICAL: append ALL rows

    if not task_found:
        print(f"ERROR: Task {task_id} not found in CSV")
        sys.exit(1)

    # STEP 3: VALIDATE BEFORE WRITE
    if len(rows) != original_count:
        print(f"ERROR: Row count mismatch. Original: {original_count}, Current: {len(rows)}")
        print("Restoring from backup...")
        shutil.copy2(backup_name, csv_path)
        sys.exit(1)

    if not fieldnames or len(fieldnames) == 0:
        print("ERROR: No fieldnames found in CSV")
        print("Restoring from backup...")
        shutil.copy2(backup_name, csv_path)
        sys.exit(1)

    # STEP 4: WRITE ALL ROWS
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)  # Write ALL rows

    # STEP 5: VERIFY WRITE
    verify_count = 0
    with open(csv_path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            verify_count += 1

    if verify_count != original_count:
        print(f"ERROR: Write verification failed. Expected {original_count} rows, found {verify_count}")
        print("Restoring from backup...")
        shutil.copy2(backup_name, csv_path)
        sys.exit(1)

    print(f"Successfully updated task {task_id} status to '{new_status}' ({verify_count} total rows preserved)")

except Exception as e:
    print(f"ERROR: {e}")
    print("Restoring from backup...")
    if os.path.exists(backup_name):
        shutil.copy2(backup_name, csv_path)
    sys.exit(1)
