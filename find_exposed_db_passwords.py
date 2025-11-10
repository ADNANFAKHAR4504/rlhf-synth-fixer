#!/usr/bin/env python3
"""
Script to find all tasks in the archive directory where database passwords are exposed.
Looks for RDS, Aurora, and other database resources with insecure password handling.
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

# Define the archive directory
ARCHIVE_DIR = "/Users/anthony/turing/iac-test-automations/archive"

# Patterns that indicate secure password handling (these are GOOD)
SECURE_PATTERNS = [
    r'secretsmanager',
    r'secrets_manager',
    r'SecretsManager',
    r'random_password',
    r'RandomPassword',
    r'aws_secretsmanager_secret',
    r'ssm\.Parameter',
    r'parameter_store',
    r'ParameterStore',
    r'aws_ssm_parameter',
    r'kms',
    r'secrets\.Secret',
    r'pulumi\.Config',
    r'config\.require',
    r'config\.get',
    r'Fn::GetAtt.*Secret',
    r'!GetAtt.*Secret',
    r'!Ref.*Secret',
    r'Ref.*Secret',
    r'generate_password',
    r'random\.RandomPassword',
]

# Patterns that indicate database resources
DATABASE_PATTERNS = [
    r'aws_db_instance',
    r'aws_rds_cluster',
    r'rds\.Instance',
    r'rds\.Cluster',
    r'rds\.DatabaseInstance',
    r'rds\.DatabaseCluster',
    r'AWS::RDS::DBInstance',
    r'AWS::RDS::DBCluster',
    r'aurora',
    r'Aurora',
    r'DatabaseInstance',
    r'DatabaseCluster',
]

# Password field patterns
PASSWORD_FIELD_PATTERNS = [
    r'masterPassword',
    r'MasterPassword',
    r'master_password',
    r'master_user_password',
    r'MasterUserPassword',
    r'password',
    r'Password',
    r'db_password',
    r'databasePassword',
]

def is_infrastructure_file(filepath):
    """Check if file is an infrastructure code file."""
    extensions = ['.tf', '.ts', '.py', '.go', '.java', '.js', '.yml', '.yaml', '.json']
    path = Path(filepath)
    path_str = str(path).lower()

    # Skip test files completely - be very thorough
    test_indicators = [
        '/test/', '/tests/',
        'test_', '_test.', '.test.',
        '.unit.', '.int.', '.integration.',
        'unit.test', 'int.test', 'integration.test',
        '/unit/', '/integration/',
    ]

    for indicator in test_indicators:
        if indicator in path_str:
            return False

    # Skip documentation and metadata files
    if any(x in path.name for x in ['MODEL_', 'IDEAL_', 'PROMPT', 'README', 'metadata.json']):
        return False

    # Only process files in lib directories
    return path.suffix in extensions and '/lib/' in str(path)

def contains_database_resource(content):
    """Check if content contains database resources."""
    for pattern in DATABASE_PATTERNS:
        if re.search(pattern, content, re.IGNORECASE):
            return True
    return False

def has_password_field(content):
    """Check if content has password-related fields."""
    for pattern in PASSWORD_FIELD_PATTERNS:
        if re.search(pattern, content):
            return True
    return False

def uses_secure_password_handling(content):
    """Check if the content uses secure password handling."""
    for pattern in SECURE_PATTERNS:
        if re.search(pattern, content, re.IGNORECASE):
            return True
    return False

def find_exposed_password_lines(content, filepath):
    """Find specific lines where passwords might be exposed."""
    exposed_lines = []
    lines = content.split('\n')

    for i, line in enumerate(lines, 1):
        # Skip comments
        if re.match(r'^\s*(#|//|/\*|\*)', line):
            continue

        # Look for password assignments
        for pwd_pattern in PASSWORD_FIELD_PATTERNS:
            # Pattern: password = "value" or password: "value" or password="value"
            if re.search(rf'{pwd_pattern}\s*[=:]\s*["\'](?!.*{{)', line, re.IGNORECASE):
                # Check if it's not using a secure reference
                if not any(re.search(sp, line, re.IGNORECASE) for sp in SECURE_PATTERNS):
                    exposed_lines.append({
                        'line_number': i,
                        'content': line.strip()
                    })

    return exposed_lines

def analyze_task(task_dir):
    """Analyze a single task directory for exposed database passwords."""
    results = {
        'task_name': os.path.basename(task_dir),
        'task_path': task_dir,
        'has_database': False,
        'has_exposed_password': False,
        'files_with_issues': [],
        'framework': os.path.basename(os.path.dirname(task_dir))
    }

    # Read metadata if available
    metadata_file = os.path.join(task_dir, 'metadata.json')
    if os.path.exists(metadata_file):
        try:
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
                results['metadata'] = metadata
        except:
            pass

    # Scan all infrastructure files
    for root, dirs, files in os.walk(task_dir):
        for file in files:
            filepath = os.path.join(root, file)

            if not is_infrastructure_file(filepath):
                continue

            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                # Check for database resources
                has_db = contains_database_resource(content)
                has_pwd_field = has_password_field(content)

                if has_db:
                    results['has_database'] = True

                    if has_pwd_field:
                        # Check if using secure password handling
                        is_secure = uses_secure_password_handling(content)

                        if not is_secure:
                            results['has_exposed_password'] = True
                            exposed_lines = find_exposed_password_lines(content, filepath)

                            results['files_with_issues'].append({
                                'file': os.path.relpath(filepath, task_dir),
                                'full_path': filepath,
                                'exposed_lines': exposed_lines
                            })

            except Exception as e:
                pass

    return results

def main():
    """Main function to scan all tasks and generate report."""
    all_results = []
    tasks_with_issues = []

    # Scan all framework directories
    for framework_dir in os.listdir(ARCHIVE_DIR):
        framework_path = os.path.join(ARCHIVE_DIR, framework_dir)

        if not os.path.isdir(framework_path):
            continue

        # Skip non-framework directories
        if framework_dir in ['.', '..', 'README.md']:
            continue

        print(f"Scanning {framework_dir}...")

        # Scan each task in the framework
        for task_name in os.listdir(framework_path):
            task_path = os.path.join(framework_path, task_name)

            if not os.path.isdir(task_path):
                continue

            if not task_name.startswith('Pr'):
                continue

            result = analyze_task(task_path)

            if result['has_database'] and result['has_exposed_password']:
                tasks_with_issues.append(result)
                all_results.append(result)

    # Generate report
    print(f"\n{'='*80}")
    print(f"SUMMARY: Found {len(tasks_with_issues)} tasks with exposed database passwords")
    print(f"{'='*80}\n")

    # Group by framework
    by_framework = defaultdict(list)
    for task in tasks_with_issues:
        by_framework[task['framework']].append(task)

    # Print detailed results
    for framework, tasks in sorted(by_framework.items()):
        print(f"\n{framework}: {len(tasks)} tasks")
        print("-" * 80)

        for task in sorted(tasks, key=lambda x: x['task_name']):
            print(f"\n  Task: {task['task_name']}")
            print(f"  Path: {task['task_path']}")

            for file_info in task['files_with_issues']:
                print(f"    File: {file_info['file']}")
                if file_info['exposed_lines']:
                    for line_info in file_info['exposed_lines'][:3]:  # Show first 3 lines
                        print(f"      Line {line_info['line_number']}: {line_info['content'][:100]}")

    return tasks_with_issues

if __name__ == "__main__":
    results = main()

    # Save results to JSON for further processing
    output_file = "/Users/anthony/turing/iac-test-automations/exposed_db_passwords_raw.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n\nRaw results saved to: {output_file}")
