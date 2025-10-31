#!/usr/bin/env python3
"""
CSV Validation and Recovery Tool

This script validates the integrity of .claude/tasks.csv and can recover from backup if needed.

Usage:
    python3 .claude/scripts/validate-tasks-csv.py                    # Validate only
    python3 .claude/scripts/validate-tasks-csv.py --restore          # Restore from backup
    python3 .claude/scripts/validate-tasks-csv.py --create-backup    # Create backup
"""

import csv
import sys
import os
import shutil
import argparse
from pathlib import Path


def get_csv_path():
    """Get the path to tasks.csv (located in .claude folder)"""
    script_dir = Path(__file__).parent
    claude_dir = script_dir.parent
    return claude_dir / "tasks.csv"


def get_backup_path():
    """Get the path to the backup file"""
    return Path(str(get_csv_path()) + ".backup")


def validate_csv(csv_path):
    """
    Validate the CSV file structure and content
    
    Returns: (is_valid, error_message, stats)
    """
    if not csv_path.exists():
        return False, f"CSV file not found at {csv_path}", None
    
    try:
        with open(csv_path, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            
            # Check for required fieldnames
            required_fields = ['task_id', 'status', 'platform', 'difficulty', 'subtask', 
                             'problem', 'language', 'environment', 
                             'constraints', 'subject_labels']
            
            if not fieldnames:
                return False, "No fieldnames found in CSV", None
            
            missing_fields = [f for f in required_fields if f not in fieldnames]
            if missing_fields:
                return False, f"Missing required fields: {missing_fields}", None
            
            # Count rows and check for data integrity
            rows = []
            row_count = 0
            status_counts = {}
            
            for row in reader:
                row_count += 1
                rows.append(row)
                
                # Track status distribution
                status = row.get('status', 'unknown')
                status_counts[status] = status_counts.get(status, 0) + 1
                
                # Validate required fields are not empty
                if not row.get('task_id'):
                    return False, f"Row {row_count}: task_id is empty", None
                if not row.get('platform'):
                    return False, f"Row {row_count}: platform is empty", None
            
            if row_count == 0:
                return False, "CSV has header but no data rows", None
            
            stats = {
                'total_rows': row_count,
                'fieldnames': list(fieldnames),
                'status_counts': status_counts
            }
            
            return True, None, stats
            
    except Exception as e:
        return False, f"Error reading CSV: {e}", None


def create_backup(csv_path, backup_path):
    """Create a backup of the CSV file"""
    try:
        if not csv_path.exists():
            print(f"❌ Cannot create backup: {csv_path} does not exist")
            return False
        
        shutil.copy2(csv_path, backup_path)
        print(f"✅ Backup created: {backup_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to create backup: {e}")
        return False


def restore_from_backup(csv_path, backup_path):
    """Restore CSV from backup"""
    try:
        if not backup_path.exists():
            print(f"❌ Cannot restore: backup file {backup_path} does not exist")
            return False
        
        # Validate backup before restoring
        is_valid, error, stats = validate_csv(backup_path)
        if not is_valid:
            print(f"❌ Backup file is invalid: {error}")
            return False
        
        # Create a backup of the current (corrupted) file
        if csv_path.exists():
            corrupted_backup = Path(str(csv_path) + ".corrupted")
            shutil.copy2(csv_path, corrupted_backup)
            print(f"ℹ️  Current file backed up to: {corrupted_backup}")
        
        # Restore from backup
        shutil.copy2(backup_path, csv_path)
        print(f"✅ Successfully restored from backup")
        print(f"   Total rows: {stats['total_rows']}")
        print(f"   Status distribution: {stats['status_counts']}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to restore from backup: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Validate and manage .claude/tasks.csv file",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('--restore', action='store_true',
                       help='Restore .claude/tasks.csv from backup')
    parser.add_argument('--create-backup', action='store_true',
                       help='Create a new backup of .claude/tasks.csv')
    
    args = parser.parse_args()
    
    csv_path = get_csv_path()
    backup_path = get_backup_path()
    
    print(f"CSV file: {csv_path}")
    print(f"Backup file: {backup_path}")
    print()
    
    if args.create_backup:
        sys.exit(0 if create_backup(csv_path, backup_path) else 1)
    
    if args.restore:
        sys.exit(0 if restore_from_backup(csv_path, backup_path) else 1)
    
    # Default: validate
    print("Validating .claude/tasks.csv...")
    is_valid, error, stats = validate_csv(csv_path)
    
    if is_valid:
        print("✅ CSV validation passed")
        print(f"   Total rows: {stats['total_rows']}")
        print(f"   Fieldnames: {len(stats['fieldnames'])} fields")
        print(f"   Status distribution:")
        for status, count in sorted(stats['status_counts'].items()):
            print(f"      {status}: {count}")
        
        # Check if backup exists and validate it
        if backup_path.exists():
            print()
            print("Validating backup file...")
            backup_valid, backup_error, backup_stats = validate_csv(backup_path)
            if backup_valid:
                print("✅ Backup validation passed")
                print(f"   Backup has {backup_stats['total_rows']} rows")
                if backup_stats['total_rows'] != stats['total_rows']:
                    print(f"   ⚠️  Row count mismatch: current={stats['total_rows']}, backup={backup_stats['total_rows']}")
            else:
                print(f"⚠️  Backup validation failed: {backup_error}")
        else:
            print()
            print("⚠️  No backup file found. Consider creating one with --create-backup")
        
        sys.exit(0)
    else:
        print(f"❌ CSV validation failed: {error}")
        
        # Check if backup exists
        if backup_path.exists():
            print()
            print(f"ℹ️  A backup file exists at {backup_path}")
            print("   Run with --restore to restore from backup")
        
        sys.exit(1)


if __name__ == '__main__':
    main()

