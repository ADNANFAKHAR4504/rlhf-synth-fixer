#!/usr/bin/env python3
import json
import subprocess
import sys
from datetime import datetime

# Get list of OPEN PR numbers for mayanksethi-turing
try:
    result = subprocess.run(
        ['gh', 'pr', 'list', '--author', 'mayanksethi-turing', '--state', 'open', '--limit', '100', '--json', 'number'],
        capture_output=True,
        text=True,
        timeout=30
    )
    pr_list = json.loads(result.stdout)
    pr_numbers = [pr['number'] for pr in pr_list]
    print(f"Initial list: {len(pr_numbers)} OPEN PRs for mayanksethi-turing", file=sys.stderr)
except Exception as e:
    print(f"Error getting PR list: {e}", file=sys.stderr)
    sys.exit(1)

# Fetch details for each PR and validate
all_pr_data = []
skipped_prs = []
for i, pr_num in enumerate(pr_numbers):
    try:
        print(f"Fetching PR #{pr_num} ({i+1}/{len(pr_numbers)})...", file=sys.stderr)
        result = subprocess.run(
            ['gh', 'pr', 'view', str(pr_num), '--json', 'number,url,assignees,state,statusCheckRollup,updatedAt'],
            capture_output=True,
            text=True,
            timeout=15
        )
        if result.returncode == 0:
            pr_data = json.loads(result.stdout)
            # Validate the PR is actually OPEN
            if pr_data.get('state') == 'OPEN':
                all_pr_data.append(pr_data)
            else:
                print(f"  Skipping PR #{pr_num} - State is {pr_data.get('state')}", file=sys.stderr)
                skipped_prs.append(pr_num)
        else:
            print(f"  Skipping PR #{pr_num} - Error: {result.stderr.strip()}", file=sys.stderr)
            skipped_prs.append(pr_num)
    except Exception as e:
        print(f"  Skipping PR #{pr_num} - Exception: {e}", file=sys.stderr)
        skipped_prs.append(pr_num)
        continue

print(f"\nSuccessfully fetched {len(all_pr_data)} valid OPEN PRs", file=sys.stderr)
if skipped_prs:
    print(f"Skipped {len(skipped_prs)} PRs: {skipped_prs}", file=sys.stderr)

# Process the PR data
results = []
for pr in all_pr_data:
    pr_number = pr.get('number')
    pr_url = pr.get('url')
    pr_state = pr.get('state')

    # Get assignees
    assignees = pr.get('assignees', [])
    if assignees:
        assignee_names = ', '.join([a.get('login', '') for a in assignees])
    else:
        assignee_names = 'Unassigned'

    # Get last updated time
    updated_at = pr.get('updatedAt', '')
    if updated_at:
        try:
            dt = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
            last_updated = dt.strftime('%Y-%m-%d %H:%M:%S')
        except:
            last_updated = updated_at
    else:
        last_updated = ''

    # Check for failed status checks
    status_checks = pr.get('statusCheckRollup', [])
    failed_checks = []

    for check in status_checks:
        if check.get('conclusion') == 'FAILURE':
            check_name = check.get('name', 'Unknown')
            failed_checks.append(check_name)

    # Determine overall status
    status = ''
    reason = ''

    if failed_checks:
        status = 'FAILED'
        reason = ', '.join(failed_checks)
    elif pr_state == 'OPEN':
        # Check if any checks are still in progress
        in_progress = any(check.get('status') == 'IN_PROGRESS' for check in status_checks)
        if in_progress:
            status = 'IN PROGRESS'
            reason = ''
        else:
            # Check if all checks passed
            has_success = any(check.get('conclusion') == 'SUCCESS' for check in status_checks)
            if has_success and not failed_checks:
                status = 'PASSED'
                reason = ''
            else:
                status = 'IN PROGRESS'
                reason = ''
    else:
        status = pr_state
        reason = ''

    results.append({
        'pr_number': pr_number,
        'pr_link': pr_url,
        'assignee': assignee_names,
        'status': status,
        'failure_reason': reason if reason else None,
        'last_updated_at': last_updated
    })

# Calculate statistics
failed_count = sum(1 for r in results if r['status'] == 'FAILED')
passed_count = sum(1 for r in results if r['status'] == 'PASSED')
in_progress_count = sum(1 for r in results if r['status'] == 'IN PROGRESS')

# Sort results by PR number (descending)
sorted_results = sorted(results, key=lambda x: x['pr_number'], reverse=True)

# Create presentable JSON structure
output_data = {
    'metadata': {
        'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'author': 'mayanksethi-turing',
        'total_open_prs': len(results)
    },
    'summary': {
        'failed': failed_count,
        'passed': passed_count,
        'in_progress': in_progress_count
    },
    'pull_requests': sorted_results
}

# Write to JSON file with pretty formatting
with open('.claude/open_pr_status.json', 'w') as jsonfile:
    json.dump(output_data, jsonfile, indent=2, ensure_ascii=False)

# Print statistics
print(f"\nProcessed {len(results)} valid OPEN PRs for mayanksethi-turing", file=sys.stderr)
print(f"FAILED: {failed_count}, PASSED: {passed_count}, IN PROGRESS: {in_progress_count}", file=sys.stderr)
print(f"JSON file created at .claude/open_pr_status.json", file=sys.stderr)
