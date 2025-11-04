#!/usr/bin/env python3
"""
IAM Security Posture Analysis Script

This script analyzes AWS IAM configurations to identify security vulnerabilities
and compliance issues, focusing on the most critical IAM security concerns.
"""

import boto3
import json
import csv
import datetime
from dateutil.parser import parse
from dateutil.tz import tzutc
from botocore.exceptions import ClientError

def get_current_time():
    """Return current time in ISO format."""
    return datetime.datetime.now(tzutc()).isoformat()

def days_between(date1, date2=None):
    """Calculate days between two dates."""
    if date2 is None:
        date2 = datetime.datetime.now(tzutc())

    if isinstance(date1, str):
        date1 = parse(date1)

    return (date2 - date1).days

def check_users_without_mfa(iam_client):
    """Find IAM users with console access but no MFA."""
    print("Checking for users without MFA...")
    findings = []
    paginator = iam_client.get_paginator('list_users')

    for page in paginator.paginate():
        for user in page['Users']:
            user_name = user['UserName']
            user_arn = user['Arn']

            # Check if user has console access (password)
            try:
                iam_client.get_login_profile(UserName=user_name)
                has_password = True
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchEntity':
                    has_password = False
                else:
                    raise

            # If user has password, check for MFA devices
            if has_password:
                mfa_devices = iam_client.list_mfa_devices(UserName=user_name)
                if not mfa_devices['MFADevices']:
                    findings.append({
                        'severity': 'HIGH',
                        'type': 'NO_MFA_CONSOLE_USER',
                        'resource_type': 'IAM_USER',
                        'resource_arn': user_arn,
                        'resource_name': user_name,
                        'issue': 'User has console access but no MFA device configured',
                        'details': 'Users with console access should have MFA enabled for additional security',
                        'days_inactive': '',
                        'timestamp': get_current_time()
                    })

    return findings

def check_stale_access_keys(iam_client):
    """Find IAM users with stale or unused access keys."""
    print("Checking for stale access keys...")
    findings = []
    paginator = iam_client.get_paginator('list_users')
    current_time = datetime.datetime.now(tzutc())

    for page in paginator.paginate():
        for user in page['Users']:
            user_name = user['UserName']
            user_arn = user['Arn']

            # Get access keys for the user
            access_keys = iam_client.list_access_keys(UserName=user_name)

            for key in access_keys['AccessKeyMetadata']:
                if key['Status'] == 'Inactive':
                    continue  # Skip inactive keys

                key_id = key['AccessKeyId']
                creation_date = key['CreateDate']

                # Get last used info
                key_last_used = iam_client.get_access_key_last_used(AccessKeyId=key_id)

                # Check if key has been used
                if 'LastUsedDate' in key_last_used['AccessKeyLastUsed']:
                    last_used_date = key_last_used['AccessKeyLastUsed']['LastUsedDate']
                    days_since_last_use = days_between(last_used_date, current_time)

                    if days_since_last_use > 90:
                        findings.append({
                            'severity': 'MEDIUM',
                            'type': 'STALE_KEY_90_DAYS',
                            'resource_type': 'IAM_ACCESS_KEY',
                            'resource_arn': f"{user_arn}/access-key/{key_id}",
                            'resource_name': f"{user_name} (Key: {key_id})",
                            'issue': f'Access key not used in {days_since_last_use} days',
                            'details': f'Last used on {last_used_date.isoformat()}',
                            'days_inactive': str(days_since_last_use),
                            'timestamp': get_current_time()
                        })
                else:
                    # Key has never been used
                    days_since_creation = days_between(creation_date, current_time)

                    if days_since_creation > 30:
                        findings.append({
                            'severity': 'MEDIUM',
                            'type': 'UNUSED_KEY_30_DAYS',
                            'resource_type': 'IAM_ACCESS_KEY',
                            'resource_arn': f"{user_arn}/access-key/{key_id}",
                            'resource_name': f"{user_name} (Key: {key_id})",
                            'issue': f'Access key created {days_since_creation} days ago and never used',
                            'details': f'Created on {creation_date.isoformat()}',
                            'days_inactive': str(days_since_creation),
                            'timestamp': get_current_time()
                        })

    return findings

def is_admin_policy(policy_document):
    """Check if a policy document grants admin access."""
    if isinstance(policy_document, str):
        try:
            policy_document = json.loads(policy_document)
        except json.JSONDecodeError:
            print(f"Error parsing policy document: {policy_document}")
            return False

    for statement in policy_document.get('Statement', []):
        if isinstance(statement, dict):  # Ensure statement is a dictionary
            effect = statement.get('Effect', '')
            action = statement.get('Action', [])
            resource = statement.get('Resource', [])

            # Convert single values to lists for consistent handling
            if isinstance(action, str):
                action = [action]
            if isinstance(resource, str):
                resource = [resource]

            # Check for admin access
            if (effect.lower() == 'allow' and
                ('*' in action or 'iam:*' in action) and
                ('*' in resource)):
                return True

    return False

def check_permissive_roles(iam_client):
    """Find IAM roles with admin access."""
    print("Checking for overly permissive roles...")
    findings = []
    paginator = iam_client.get_paginator('list_roles')

    for page in paginator.paginate():
        for role in page['Roles']:
            role_name = role['RoleName']
            role_arn = role['Arn']

            # Check inline policies
            inline_policies = iam_client.list_role_policies(RoleName=role_name)
            for policy_name in inline_policies['PolicyNames']:
                try:
                    policy_response = iam_client.get_role_policy(
                        RoleName=role_name,
                        PolicyName=policy_name
                    )

                    if is_admin_policy(policy_response['PolicyDocument']):
                        findings.append({
                            'severity': 'HIGH',
                            'type': 'ADMIN_ACCESS_ROLE',
                            'resource_type': 'IAM_ROLE',
                            'resource_arn': role_arn,
                            'resource_name': role_name,
                            'issue': 'Role has admin access via inline policy',
                            'details': f"Inline policy '{policy_name}' grants admin access",
                            'days_inactive': '',
                            'timestamp': get_current_time()
                        })
                except ClientError as e:
                    print(f"Error getting policy {policy_name} for role {role_name}: {e}")
                    continue

            # Check attached managed policies
            attached_policies = iam_client.list_attached_role_policies(RoleName=role_name)
            for policy in attached_policies['AttachedPolicies']:
                policy_arn = policy['PolicyArn']
                policy_name = policy['PolicyName']

                if policy_name == 'AdministratorAccess':
                    findings.append({
                        'severity': 'HIGH',
                        'type': 'ADMIN_ACCESS_ROLE',
                        'resource_type': 'IAM_ROLE',
                        'resource_arn': role_arn,
                        'resource_name': role_name,
                        'issue': 'Role has admin access via managed policy',
                        'details': f"Managed policy 'AdministratorAccess' is attached",
                        'days_inactive': '',
                        'timestamp': get_current_time()
                    })
                    continue

                # For other policies, check their content
                try:
                    policy_info = iam_client.get_policy(PolicyArn=policy_arn)['Policy']
                    policy_version = policy_info['DefaultVersionId']
                    policy_document = iam_client.get_policy_version(
                        PolicyArn=policy_arn,
                        VersionId=policy_version
                    )['PolicyVersion']['Document']

                    if is_admin_policy(policy_document):
                        findings.append({
                            'severity': 'HIGH',
                            'type': 'ADMIN_ACCESS_ROLE',
                            'resource_type': 'IAM_ROLE',
                            'resource_arn': role_arn,
                            'resource_name': role_name,
                            'issue': 'Role has admin access via managed policy',
                            'details': f"Managed policy '{policy_name}' grants admin access",
                            'days_inactive': '',
                            'timestamp': get_current_time()
                        })
                except ClientError as e:
                    print(f"Error analyzing policy {policy_name} for role {role_name}: {e}")
                    continue

    return findings

def check_permissive_policies(iam_client, analyzer_client):
    """Find customer-managed policies with security warnings using Access Analyzer."""
    print("Checking for permissive policies...")
    findings = []
    paginator = iam_client.get_paginator('list_policies')

    # Filter for only customer managed policies
    for page in paginator.paginate(Scope='Local'):
        for policy in page['Policies']:
            policy_arn = policy['Arn']
            policy_name = policy['PolicyName']

            try:
                # Get the default version of the policy
                policy_info = iam_client.get_policy(PolicyArn=policy_arn)['Policy']
                policy_version = policy_info['DefaultVersionId']
                policy_document = iam_client.get_policy_version(
                    PolicyArn=policy_arn,
                    VersionId=policy_version
                )['PolicyVersion']['Document']

                # Use Access Analyzer to validate the policy
                validation_response = analyzer_client.validate_policy(
                    policyDocument=json.dumps(policy_document),
                    policyType='IDENTITY_POLICY'
                )

                security_warnings = [
                    finding for finding in validation_response.get('findings', [])
                    if finding['findingType'] == 'SECURITY_WARNING'
                ]

                for warning in security_warnings:
                    locations = warning.get('locations', [])
                    location_details = []

                    for location in locations:
                        path = location.get('path', [])
                        span = location.get('span', {})
                        location_details.append(f"Path: {'.'.join(path)}, Span: {span}")

                    findings.append({
                        'severity': 'HIGH',
                        'type': 'PERMISSIVE_POLICY',
                        'resource_type': 'IAM_POLICY',
                        'resource_arn': policy_arn,
                        'resource_name': policy_name,
                        'issue': f"Security warning: {warning['issueCode']}",
                        'details': f"Issue: {warning.get('issue', '')}, Locations: {'; '.join(location_details)}",
                        'days_inactive': '',
                        'timestamp': get_current_time()
                    })

            except ClientError as e:
                print(f"Error validating policy {policy_name}: {e}")
                continue

    return findings

def check_cross_account_roles(iam_client, sts_client):
    """Find IAM roles with trust relationships to external accounts."""
    print("Checking for cross-account role trusts...")
    findings = []
    external_accounts = set()
    paginator = iam_client.get_paginator('list_roles')
    current_account = sts_client.get_caller_identity()['Account']

    for page in paginator.paginate():
        for role in page['Roles']:
            role_name = role['RoleName']
            role_arn = role['Arn']
            trust_policy = role['AssumeRolePolicyDocument']

            for statement in trust_policy.get('Statement', []):
                if statement.get('Effect') != 'Allow':
                    continue

                principal = statement.get('Principal', {})

                # Check for AWS principals
                if 'AWS' in principal:
                    aws_principals = principal['AWS']
                    if not isinstance(aws_principals, list):
                        aws_principals = [aws_principals]

                    for aws_principal in aws_principals:
                        # Skip if principal is in the current account
                        if current_account in str(aws_principal):
                            continue

                        # Extract account ID from ARN or account format
                        if aws_principal == '*':
                            # Wildcard principal is very dangerous
                            findings.append({
                                'severity': 'HIGH',
                                'type': 'EXTERNAL_ACCOUNT_TRUST_ROOT',
                                'resource_type': 'IAM_ROLE',
                                'resource_arn': role_arn,
                                'resource_name': role_name,
                                'issue': 'Role trusts ALL AWS accounts (wildcard)',
                                'details': f"Trust policy allows '*' as principal",
                                'days_inactive': '',
                                'timestamp': get_current_time()
                            })
                            external_accounts.add('*')
                        else:
                            # Extract account ID
                            if isinstance(aws_principal, str) and aws_principal.startswith('arn:aws:iam::'):
                                # Format: arn:aws:iam::ACCOUNT_ID:root or arn:aws:iam::ACCOUNT_ID:user/something
                                account_id = aws_principal.split(':')[4]
                                external_accounts.add(account_id)

                                if aws_principal.endswith(':root'):
                                    findings.append({
                                        'severity': 'HIGH',
                                        'type': 'EXTERNAL_ACCOUNT_TRUST_ROOT',
                                        'resource_type': 'IAM_ROLE',
                                        'resource_arn': role_arn,
                                        'resource_name': role_name,
                                        'issue': f'Role trusts external account root: {account_id}',
                                        'details': f"Trust policy allows account root: {aws_principal}",
                                        'days_inactive': '',
                                        'timestamp': get_current_time()
                                    })
                                else:
                                    findings.append({
                                        'severity': 'MEDIUM',
                                        'type': 'EXTERNAL_ACCOUNT_TRUST_SPECIFIC',
                                        'resource_type': 'IAM_ROLE',
                                        'resource_arn': role_arn,
                                        'resource_name': role_name,
                                        'issue': f'Role trusts specific principal in external account: {account_id}',
                                        'details': f"Trust policy allows: {aws_principal}",
                                        'days_inactive': '',
                                        'timestamp': get_current_time()
                                    })
                            elif isinstance(aws_principal, str) and (aws_principal.isdigit() or aws_principal.startswith('AROA')):
                                # Format: ACCOUNT_ID or AROAXXXXXXXXXXXX
                                account_id = aws_principal
                                external_accounts.add(account_id)

                                findings.append({
                                    'severity': 'HIGH',
                                    'type': 'EXTERNAL_ACCOUNT_TRUST_ROOT',
                                    'resource_type': 'IAM_ROLE',
                                    'resource_arn': role_arn,
                                    'resource_name': role_name,
                                    'issue': f'Role trusts external account: {account_id}',
                                    'details': f"Trust policy allows: {aws_principal}",
                                    'days_inactive': '',
                                    'timestamp': get_current_time()
                                })

    return findings, external_accounts

def count_console_users(iam_client):
    """Count total console users and those without MFA."""
    total_console_users = 0
    console_users_without_mfa = 0

    paginator = iam_client.get_paginator('list_users')
    for page in paginator.paginate():
        for user in page['Users']:
            user_name = user['UserName']

            # Check if user has console access
            try:
                iam_client.get_login_profile(UserName=user_name)
                total_console_users += 1

                # Check if user has MFA
                mfa_devices = iam_client.list_mfa_devices(UserName=user_name)
                if not mfa_devices['MFADevices']:
                    console_users_without_mfa += 1
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchEntity':
                    # User does not have console access
                    pass
                else:
                    raise

    return total_console_users, console_users_without_mfa

def generate_report(region='us-east-1'):
    """Generate a comprehensive IAM compliance report."""
    # Initialize AWS clients
    iam_client = boto3.client('iam', region_name=region)
    analyzer_client = boto3.client('accessanalyzer', region_name=region)
    sts_client = boto3.client('sts', region_name=region)

    # Collect findings from all checks
    findings = []

    findings.extend(check_users_without_mfa(iam_client))
    findings.extend(check_stale_access_keys(iam_client))
    findings.extend(check_permissive_roles(iam_client))
    findings.extend(check_permissive_policies(iam_client, analyzer_client))

    cross_account_findings, external_accounts = check_cross_account_roles(iam_client, sts_client)
    findings.extend(cross_account_findings)

    # Generate statistics
    stats = {
        'by_severity': {
            'HIGH': 0,
            'MEDIUM': 0,
            'LOW': 0
        },
        'by_type': {},
        'external_account_ids': list(external_accounts),
        'statistics': {
            'average_stale_key_age': 0,
            'console_users_without_mfa_percentage': 0
        }
    }

    # Count findings by severity and type
    for finding in findings:
        severity = finding['severity']
        finding_type = finding['type']

        # Count by severity
        if severity in stats['by_severity']:
            stats['by_severity'][severity] += 1

        # Count by type
        stats['by_type'][finding_type] = stats['by_type'].get(finding_type, 0) + 1

    # Calculate stale key statistics
    stale_keys = [
        int(f['days_inactive']) for f in findings
        if f['type'] in ['STALE_KEY_90_DAYS', 'UNUSED_KEY_30_DAYS'] and f['days_inactive']
    ]

    if stale_keys:
        stats['statistics']['average_stale_key_age'] = sum(stale_keys) / len(stale_keys)

    # Calculate MFA statistics
    total_console_users, console_users_without_mfa = count_console_users(iam_client)

    if total_console_users > 0:
        stats['statistics']['console_users_without_mfa_percentage'] = (console_users_without_mfa / total_console_users) * 100

    # Generate JSON report
    json_report = {
        'summary': stats,
        'findings': findings,
        'scan_time': get_current_time()
    }

    with open('iam_compliance_report.json', 'w') as f:
        json.dump(json_report, f, indent=2, default=str)

    # Generate CSV report
    with open('iam_compliance_report.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'severity', 'type', 'resource_type', 'resource_arn', 'resource_name',
            'issue', 'details', 'days_inactive', 'timestamp'
        ])
        writer.writeheader()
        writer.writerows(findings)

    print(f"Scan complete. Found {len(findings)} issues.")
    print(f"HIGH severity issues: {stats['by_severity']['HIGH']}")
    print(f"MEDIUM severity issues: {stats['by_severity']['MEDIUM']}")
    print(f"LOW severity issues: {stats['by_severity']['LOW']}")
    print("Reports generated: iam_compliance_report.json and iam_compliance_report.csv")

    return findings, stats

if __name__ == "__main__":
    try:
        generate_report()
    except Exception as e:
        print(f"Error running IAM compliance scan: {e}")
        raise
