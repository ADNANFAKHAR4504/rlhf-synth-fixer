# CSV Data Safety Guide

## Overview

The `.claude/tasks.csv` file is a critical data file that contains all task information for the IaC test automation system. **Loss or corruption of this file means loss of all task tracking data.**

## Critical Rules for CSV Operations

### Rule 1: ALWAYS Create Backups

Before ANY modification to `.claude/tasks.csv`:
```python
import shutil
shutil.copy2('.claude/tasks.csv', '.claude/.claude/tasks.csv.backup')
```

### Rule 2: ALWAYS Read ALL Rows

**WRONG** ❌ (will lose data):
```python
# This only processes matching rows and loses others!
with open('.claude/tasks.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['task_id'] == target_id:
            row['status'] = 'new_status'
            # Write only this row - WRONG!
```

**CORRECT** ✅:
```python
rows = []  # Collect ALL rows
with open('.claude/tasks.csv', 'r', newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        if row['task_id'] == target_id:
            row['status'] = 'new_status'
        rows.append(row)  # Append EVERY row

# Write ALL rows back
with open('.claude/tasks.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)  # Write ALL rows
```

### Rule 3: ALWAYS Validate

Before and after writing:
```python
# Before write
if len(rows) != original_count or not fieldnames:
    print("ERROR: Validation failed")
    shutil.copy2('.claude/.claude/tasks.csv.backup', '.claude/tasks.csv')
    sys.exit(1)

# After write
verify_count = sum(1 for _ in csv.DictReader(open('.claude/tasks.csv', 'r')))
if verify_count != original_count:
    print("ERROR: Write failed")
    shutil.copy2('.claude/.claude/tasks.csv.backup', '.claude/tasks.csv')
    sys.exit(1)
```

### Rule 4: ALWAYS Use Error Handling

```python
try:
    # ... CSV operations ...
except Exception as e:
    print(f"ERROR: {e}")
    if os.path.exists('.claude/.claude/tasks.csv.backup'):
        shutil.copy2('.claude/.claude/tasks.csv.backup', '.claude/tasks.csv')
    sys.exit(1)
```

## Complete Safe CSV Update Template

Use this template for ALL CSV modifications:

```python
import csv
import shutil
import sys
import os

# Configuration
task_id = "target_task_id"
new_status = "new_status_value"

try:
    # STEP 1: BACKUP
    shutil.copy2('.claude/tasks.csv', '.claude/.claude/tasks.csv.backup')
    
    # STEP 2: READ ALL ROWS
    rows = []
    original_count = 0
    with open('.claude/tasks.csv', 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            original_count += 1
            # Modify specific row(s)
            if row['task_id'] == task_id:
                row['status'] = new_status
            rows.append(row)  # CRITICAL: append ALL rows
    
    # STEP 3: VALIDATE BEFORE WRITE
    if len(rows) != original_count:
        print(f"❌ ERROR: Row count mismatch. Original: {original_count}, Current: {len(rows)}")
        print("Restoring from backup...")
        shutil.copy2('.claude/.claude/tasks.csv.backup', '.claude/tasks.csv')
        sys.exit(1)
    
    if not fieldnames or len(fieldnames) == 0:
        print("❌ ERROR: No fieldnames found in CSV")
        print("Restoring from backup...")
        shutil.copy2('.claude/.claude/tasks.csv.backup', '.claude/tasks.csv')
        sys.exit(1)
    
    # STEP 4: WRITE ALL ROWS
    with open('.claude/tasks.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)  # Write ALL rows
    
    # STEP 5: VERIFY WRITE
    verify_count = 0
    with open('.claude/tasks.csv', 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            verify_count += 1
    
    if verify_count != original_count:
        print(f"❌ ERROR: Write verification failed. Expected {original_count} rows, found {verify_count}")
        print("Restoring from backup...")
        shutil.copy2('.claude/.claude/tasks.csv.backup', '.claude/tasks.csv')
        sys.exit(1)
    
    print(f"✅ Successfully updated ({verify_count} total rows preserved)")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    print("Restoring from backup...")
    if os.path.exists('.claude/.claude/tasks.csv.backup'):
        shutil.copy2('.claude/.claude/tasks.csv.backup', '.claude/tasks.csv')
    sys.exit(1)
```

## Validation Tool

Use the built-in validation tool to check CSV integrity:

```bash
# Validate current CSV
python3 .claude/scripts/validate-tasks-csv.py

# Create a backup
python3 .claude/scripts/validate-tasks-csv.py --create-backup

# Restore from backup
python3 .claude/scripts/validate-tasks-csv.py --restore
```

## Recovery Procedures

### If CSV Corruption is Detected

1. **Check for automatic backup** (created by safe update operations):
   ```bash
   ls -la .claude/.claude/tasks.csv.backup
   ```

2. **Validate the backup**:
   ```bash
   python3 .claude/scripts/validate-tasks-csv.py
   ```

3. **Restore from backup**:
   ```bash
   python3 .claude/scripts/validate-tasks-csv.py --restore
   ```
   
   Or manually:
   ```bash
   cp .claude/.claude/tasks.csv.backup .claude/tasks.csv
   ```

4. **If no backup exists, use git**:
   ```bash
   # Check git status
   git status .claude/tasks.csv
   
   # Restore from last commit
   git checkout .claude/tasks.csv
   
   # Or restore from specific commit
   git log -- .claude/tasks.csv
   git checkout <commit-hash> -- .claude/tasks.csv
   ```

### If Backup is Also Corrupted

1. Check for `.corrupted` backup created during restore:
   ```bash
   ls -la .claude/tasks.csv.corrupted
   ```

2. Use git history:
   ```bash
   # Find when file was last good
   git log --oneline -- .claude/tasks.csv
   
   # Show file at specific commit
   git show <commit-hash>:.claude/tasks.csv > .claude/tasks.csv.recovered
   
   # Validate recovered file
   python3 .claude/scripts/validate-tasks-csv.py
   ```

## Common Pitfalls

### ❌ Pitfall 1: Only Writing Updated Rows
```python
# WRONG - only writes matching rows, loses all others
for row in reader:
    if row['task_id'] == target:
        writer.writerow(row)  # Only writes one row!
```

### ❌ Pitfall 2: Not Using newline='' Parameter
```python
# WRONG - can cause line ending issues
with open('.claude/tasks.csv', 'r') as f:  # Missing newline=''
```

### ❌ Pitfall 3: No Validation
```python
# WRONG - no check if write succeeded
with open('.claude/tasks.csv', 'w') as f:
    writer.writerows(rows)
# What if this failed?
```

### ❌ Pitfall 4: No Error Handling
```python
# WRONG - if anything fails, CSV is left corrupted
with open('.claude/tasks.csv', 'w') as f:
    writer.writerows(rows)  # If this crashes, file is lost!
```

## Testing CSV Operations

Before deploying any CSV modification code:

1. **Create a test CSV** with known data:
   ```bash
   cp .claude/tasks.csv .claude/tasks.csv.test
   ```

2. **Run your modification code** on the test file

3. **Validate the results**:
   ```bash
   # Check row count
   wc -l .claude/tasks.csv.test
   
   # Validate structure
   python3 .claude/scripts/validate-tasks-csv.py
   
   # Compare with original
   diff .claude/tasks.csv .claude/tasks.csv.test
   ```

4. **Test error scenarios**:
   - Empty file
   - Missing fieldnames
   - Corrupted data
   - Write failures (test with read-only file)

## Checklist for Claude Agents

Before ANY CSV modification:

- [ ] Created backup with `shutil.copy2('.claude/tasks.csv', '.claude/.claude/tasks.csv.backup')`
- [ ] Reading ALL rows into memory with `rows.append(row)`
- [ ] Validating row count matches before write
- [ ] Validating fieldnames exist and are non-empty
- [ ] Using `newline=''` and `encoding='utf-8'` in open()
- [ ] Writing ALL rows with `writer.writerows(rows)`
- [ ] Verifying write succeeded by re-reading and counting
- [ ] Wrapped in try/except with backup restore on error
- [ ] Printing clear success/error messages with row counts

## References

- **Safe CSV Update Pattern**: See `lessons_learnt.md` → "CSV File Corruption Prevention"
- **Agent Instructions**: See `iac-task-selector.md` and `task-coordinator.md`
- **Validation Tool**: `.claude/scripts/validate-tasks-csv.py`

