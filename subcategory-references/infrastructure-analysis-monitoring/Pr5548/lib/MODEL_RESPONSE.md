### Reasoning Trace

---

Alright, I'm being asked to create a Python script using Boto3 that analyzes various AWS IAM vulnerabilities and generates a report. Let me break down the requirements:

1. **Users without MFA**:
   - List IAM users without MFA
   - Only flag users with console access (users with passwords)
   - Don't flag programmatic-only users (without passwords)

2. **Stale Access Keys**:
   - Find access keys not used in 90+ days
   - Flag access keys created 30+ days ago and never used as "UNUSED_KEY_30_DAYS"
   - Calculate days since last use or creation

3. **Overly Permissive Roles**:
   - Check IAM roles for admin access
   - Look for AdministratorAccess policy or policies with Allow, Action: "_", Resource: "_"
   - Report each role with admin privileges and which policy grants them

4. **Permissive Policies**:
   - Use IAM Access Analyzer's ValidatePolicy API
   - Find policies with "SECURITY_WARNING" findings
   - Capture issueCode and locations in policy

5. **Cross-Account Role Trust**:
   - Identify roles with trust relationships to external AWS accounts
   - Extract external account IDs
   - Flag root principal access as "HIGH" severity
   - Flag specific IAM users/roles access as "MEDIUM" severity

6. **Output**:
   - Generate iam_compliance_report.json and iam_compliance_report.csv
   - Include user, role, policy ARN and issue type
   - JSON: Include a summary section with statistics
   - CSV: Structure with specific columns

Now, let me start implementing this script:

```python
#!/usr/bin/env python3
"""
IAM Compliance Scanner for AWS

This script analyzes IAM configurations to identify security vulnerabilities and compliance issues.
It generates both JSON and CSV reports detailing the findings.
"""

import boto3
import json
import csv
import datetime
from dateutil.parser import parse
from dateutil.tz import tzutc
from botocore.exceptions import ClientError

# Initialize AWS clients
iam = boto3.client('iam', region_name='us-east-1')
analyzer = boto3.client('accessanalyzer', region_name='us-east-1')

# Define finding types and severities
FINDING_TYPES = {
    'NO_MFA_CONSOLE_USER': 'HIGH',
    'STALE_KEY_90_DAYS': 'MEDIUM',
    'UNUSED_KEY_30_DAYS': 'MEDIUM',
    'ADMIN_ACCESS_ROLE': 'HIGH',
    'PERMISSIVE_POLICY': 'HIGH',
    'EXTERNAL_ACCOUNT_TRUST_ROOT': 'HIGH',
    'EXTERNAL_ACCOUNT_TRUST_SPECIFIC': 'MEDIUM'
}

def get_current_time():
    """Return current time in ISO format."""
    return datetime.datetime.now(tzutc()).isoformat()

def days_between(date1, date2=None):
    """Calculate days between two dates. If date2 is None, use current time."""
    if date2 is None:
        date2 = datetime.datetime.now(tzutc())

    if isinstance(date1, str):
        date1 = parse(date1)

    return (date2 - date1).days

def check_users_without_mfa():
    """Find IAM users without MFA but with console access."""
    findings = []
    paginator = iam.get_paginator('list_users')

    for page in paginator.paginate():
        for user in page['Users']:
            user_name = user['UserName']
            user_arn = user['Arn']

            # Check if user has console access (password)
            try:
                login_profile = iam.get_login_profile(UserName=user_name)
                has_password = True
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchEntity':
                    has_password = False
                else:
                    raise

            # If user has password, check for MFA devices
            if has_password:
                mfa_devices = iam.list_mfa_devices(UserName=user_name)
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

def check_stale_access_keys():
    """Find IAM users with stale or unused access keys."""
    findings = []
    paginator = iam.get_paginator('list_users')

    for page in paginator.paginate():
        for user in page['Users']:
            user_name = user['UserName']
            user_arn = user['Arn']

            # Get access keys for the user
            access_keys = iam.list_access_keys(UserName=user_name)

            for key in access_keys['AccessKeyMetadata']:
                if key['Status'] == 'Inactive':
                    continue  # Skip inactive keys

                key_id = key['AccessKeyId']
                creation_date = key['CreateDate']

                # Get last used info
                key_last_used = iam.get_access_key_last_used(AccessKeyId=key_id)

                # Check if key has been used
                if 'LastUsedDate' in key_last_used['AccessKeyLastUsed']:
                    last_used_date = key_last_used['AccessKeyLastUsed']['LastUsedDate']
                    days_since_last_use = days_between(last_used_date)

                    if days_since_last_use > 90:
                        findings.append({
                            'severity': 'MEDIUM',
                            'type': 'STALE_KEY_90_DAYS',
                            'resource_type': 'IAM_ACCESS_KEY',
                            'resource_arn': f"{user_arn}/access-key/{key_id}",
                            'resource_name': f"{user_name} (Key: {key_id})",
                            'issue': f'Access key not used in {days_since_last_use} days',
                            'details': f'Last used on {last_used_date.isoformat()}',
                            'days_inactive': days_since_last_use,
                            'timestamp': get_current_time()
                        })
                else:
                    # Key has never been used
                    days_since_creation = days_between(creation_date)

                    if days_since_creation > 30:
                        findings.append({
                            'severity': 'MEDIUM',
                            'type': 'UNUSED_KEY_30_DAYS',
                            'resource_type': 'IAM_ACCESS_KEY',
                            'resource_arn': f"{user_arn}/access-key/{key_id}",
                            'resource_name': f"{user_name} (Key: {key_id})",
                            'issue': f'Access key created {days_since_creation} days ago and never used',
                            'details': f'Created on {creation_date.isoformat()}',
                            'days_inactive': days_since_creation,
                            'timestamp': get_current_time()
                        })

    return findings

def is_admin_policy(policy_document):
    """Check if a policy document grants admin access."""
    if not isinstance(policy_document, dict):
        policy_document = json.loads(policy_document)

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

def check_permissive_roles():
    """Find IAM roles with admin access."""
    findings = []
    paginator = iam.get_paginator('list_roles')

    for page in paginator.paginate():
        for role in page['Roles']:
            role_name = role['RoleName']
            role_arn = role['Arn']

            # Check inline policies
            inline_policies = iam.list_role_policies(RoleName=role_name)
            for policy_name in inline_policies['PolicyNames']:
                policy_response = iam.get_role_policy(
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

            # Check attached managed policies
            attached_policies = iam.list_attached_role_policies(RoleName=role_name)
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
                policy_version = iam.get_policy(PolicyArn=policy_arn)['Policy']['DefaultVersionId']
                policy_document = iam.get_policy_version(
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

    return findings

def check_permissive_policies():
    """Find customer-managed policies with security warnings using Access Analyzer."""
    findings = []
    paginator = iam.get_paginator('list_policies')

    # Filter for only customer managed policies
    for page in paginator.paginate(Scope='Local'):
        for policy in page['Policies']:
            policy_arn = policy['Arn']
            policy_name = policy['PolicyName']
            policy_id = policy['PolicyId']

            # Get the default version of the policy
            policy_version = iam.get_policy(PolicyArn=policy_arn)['Policy']['DefaultVersionId']
            policy_document = iam.get_policy_version(
                PolicyArn=policy_arn,
                VersionId=policy_version
            )['PolicyVersion']['Document']

            # Use Access Analyzer to validate the policy
            try:
                validation_response = analyzer.validate_policy(
                    policyDocument=json.dumps(policy_document),
                    policyType='IDENTITY_POLICY'
                )

                security_warnings = [
                    finding for finding in validation_response['findings']
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

def get_aws_account_id():
    """Get the current AWS account ID."""
    sts_client = boto3.client('sts', region_name='us-east-1')
    return sts_client.get_caller_identity()['Account']

def check_cross_account_roles():
    """Find IAM roles with trust relationships to external accounts."""
    findings = []
    external_accounts = set()
    paginator = iam.get_paginator('list_roles')
    current_account = get_aws_account_id()

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
                        if current_account in aws_principal:
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
                            if aws_principal.startswith('arn:aws:iam::'):
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
                            elif aws_principal.isdigit() or aws_principal.startswith('AROA'):
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

def generate_report():
    """Generate a comprehensive IAM compliance report."""
    # Collect findings from all checks
    findings = []

    print("Checking for users without MFA...")
    findings.extend(check_users_without_mfa())

    print("Checking for stale access keys...")
    findings.extend(check_stale_access_keys())

    print("Checking for permissive roles...")
    findings.extend(check_permissive_roles())

    print("Checking for permissive policies...")
    findings.extend(check_permissive_policies())

    print("Checking for cross-account roles...")
    cross_account_findings, external_accounts = check_cross_account_roles()
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
        if finding_type in stats['by_type']:
            stats['by_type'][finding_type] += 1
        else:
            stats['by_type'][finding_type] = 1

    # Calculate stale key statistics
    stale_keys = [
        int(f['days_inactive']) for f in findings
        if f['type'] in ['STALE_KEY_90_DAYS', 'UNUSED_KEY_30_DAYS'] and f['days_inactive']
    ]

    if stale_keys:
        stats['statistics']['average_stale_key_age'] = sum(stale_keys) / len(stale_keys)

    # Calculate MFA statistics
    total_console_users = 0
    console_users_without_mfa = 0

    # List all users
    paginator = iam.get_paginator('list_users')
    for page in paginator.paginate():
        for user in page['Users']:
            user_name = user['UserName']

            # Check if user has console access
            try:
                iam.get_login_profile(UserName=user_name)
                total_console_users += 1

                # Check if user has MFA
                mfa_devices = iam.list_mfa_devices(UserName=user_name)
                if not mfa_devices['MFADevices']:
                    console_users_without_mfa += 1
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchEntity':
                    # User does not have console access
                    pass
                else:
                    raise

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

if __name__ == "__main__":
    generate_report()
```

Let me review this script against the requirements:

1. **Users without MFA**:
   - The `check_users_without_mfa()` function checks for users with console access (password) but without MFA
   - It properly differentiates between console users and programmatic-only users
   - It only flags console users without MFA as findings

2. **Stale Access Keys**:
   - The `check_stale_access_keys()` function checks for access keys not used in 90+ days
   - It flags access keys created 30+ days ago and never used as "UNUSED_KEY_30_DAYS"
   - It calculates and includes the days since last use or creation

3. **Overly Permissive Roles**:
   - The `check_permissive_roles()` function checks IAM roles for admin access
   - It looks for both the AdministratorAccess policy and policies with "\*" actions and resources
   - It reports each role with admin privileges and which policy grants them

4. **Permissive Policies**:
   - The `check_permissive_policies()` function uses the IAM Access Analyzer's ValidatePolicy API
   - It finds policies with "SECURITY_WARNING" findings
   - It captures the issueCode and locations in policy

5. **Cross-Account Role Trust**:
   - The `check_cross_account_roles()` function identifies roles with trust relationships to external AWS accounts
   - It extracts external account IDs
   - It flags root principal access as "HIGH" severity
   - It flags specific IAM users/roles access as "MEDIUM" severity

6. **Output**:
   - The script generates both iam_compliance_report.json and iam_compliance_report.csv
   - The JSON includes a summary section with statistics
   - The CSV is structured with the requested columns in the specified order

I think the script meets all the requirements, but I should make some refinements to improve the code quality and ensure robustness. Let me revise it a bit:

```python
#!/usr/bin/env python3
"""
IAM Compliance Scanner for AWS

This script analyzes IAM configurations to identify security vulnerabilities and compliance issues.
It generates both JSON and CSV reports detailing the findings.
"""

import boto3
import json
import csv
import datetime
from dateutil.parser import parse
from dateutil.tz import tzutc
from botocore.exceptions import ClientError

# Initialize AWS clients
iam = boto3.client('iam', region_name='us-east-1')
analyzer = boto3.client('accessanalyzer', region_name='us-east-1')
sts = boto3.client('sts', region_name='us-east-1')

# Define finding types and severities
FINDING_TYPES = {
    'NO_MFA_CONSOLE_USER': 'HIGH',
    'STALE_KEY_90_DAYS': 'MEDIUM',
    'UNUSED_KEY_30_DAYS': 'MEDIUM',
    'ADMIN_ACCESS_ROLE': 'HIGH',
    'PERMISSIVE_POLICY': 'HIGH',
    'EXTERNAL_ACCOUNT_TRUST_ROOT': 'HIGH',
    'EXTERNAL_ACCOUNT_TRUST_SPECIFIC': 'MEDIUM'
}

def get_current_time():
    """Return current time in ISO format."""
    return datetime.datetime.now(tzutc()).isoformat()

def days_between(date1, date2=None):
    """Calculate days between two dates. If date2 is None, use current time."""
    if date2 is None:
        date2 = datetime.datetime.now(tzutc())

    if isinstance(date1, str):
        date1 = parse(date1)

    return (date2 - date1).days

def check_users_without_mfa():
    """Find IAM users without MFA but with console access."""
    print("Checking for users without MFA...")
    findings = []
    paginator = iam.get_paginator('list_users')

    for page in paginator.paginate():
        for user in page['Users']:
            user_name = user['UserName']
            user_arn = user['Arn']

            # Check if user has console access (password)
            try:
                iam.get_login_profile(UserName=user_name)
                has_password = True
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchEntity':
                    has_password = False
                else:
                    raise

            # If user has password, check for MFA devices
            if has_password:
                mfa_devices = iam.list_mfa_devices(UserName=user_name)
                if not mfa_devices['MFADevices']:
                    findings.append({
                        'severity': FINDING_TYPES['NO_MFA_CONSOLE_USER'],
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

def check_stale_access_keys():
    """Find IAM users with stale or unused access keys."""
    print("Checking for stale access keys...")
    findings = []
    paginator = iam.get_paginator('list_users')
    current_time = datetime.datetime.now(tzutc())

    for page in paginator.paginate():
        for user in page['Users']:
            user_name = user['UserName']
            user_arn = user['Arn']

            # Get access keys for the user
            access_keys = iam.list_access_keys(UserName=user_name)

            for key in access_keys['AccessKeyMetadata']:
                if key['Status'] == 'Inactive':
                    continue  # Skip inactive keys

                key_id = key['AccessKeyId']
                creation_date = key['CreateDate']

                # Get last used info
                key_last_used = iam.get_access_key_last_used(AccessKeyId=key_id)

                # Check if key has been used
                if 'LastUsedDate' in key_last_used['AccessKeyLastUsed']:
                    last_used_date = key_last_used['AccessKeyLastUsed']['LastUsedDate']
                    days_since_last_use = days_between(last_used_date, current_time)

                    if days_since_last_use > 90:
                        findings.append({
                            'severity': FINDING_TYPES['STALE_KEY_90_DAYS'],
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
                            'severity': FINDING_TYPES['UNUSED_KEY_30_DAYS'],
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

def check_permissive_roles():
    """Find IAM roles with admin access."""
    print("Checking for permissive roles...")
    findings = []
    paginator = iam.get_paginator('list_roles')

    for page in paginator.paginate():
        for role in page['Roles']:
            role_name = role['RoleName']
            role_arn = role['Arn']

            # Check inline policies
            inline_policies = iam.list_role_policies(RoleName=role_name)
            for policy_name in inline_policies['PolicyNames']:
                try:
                    policy_response = iam.get_role_policy(
                        RoleName=role_name,
                        PolicyName=policy_name
                    )

                    if is_admin_policy(policy_response['PolicyDocument']):
                        findings.append({
                            'severity': FINDING_TYPES['ADMIN_ACCESS_ROLE'],
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
            attached_policies = iam.list_attached_role_policies(RoleName=role_name)
            for policy in attached_policies['AttachedPolicies']:
                policy_arn = policy['PolicyArn']
                policy_name = policy['PolicyName']

                if policy_name == 'AdministratorAccess':
                    findings.append({
                        'severity': FINDING_TYPES['ADMIN_ACCESS_ROLE'],
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
                    policy_info = iam.get_policy(PolicyArn=policy_arn)['Policy']
                    policy_version = policy_info['DefaultVersionId']
                    policy_document = iam.get_policy_version(
                        PolicyArn=policy_arn,
                        VersionId=policy_version
                    )['PolicyVersion']['Document']

                    if is_admin_policy(policy_document):
                        findings.append({
                            'severity': FINDING_TYPES['ADMIN_ACCESS_ROLE'],
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

def check_permissive_policies():
    """Find customer-managed policies with security warnings using Access Analyzer."""
    print("Checking for permissive policies...")
    findings = []
    paginator = iam.get_paginator('list_policies')

    # Filter for only customer managed policies
    for page in paginator.paginate(Scope='Local'):
        for policy in page['Policies']:
            policy_arn = policy['Arn']
            policy_name = policy['PolicyName']

            try:
                # Get the default version of the policy
                policy_info = iam.get_policy(PolicyArn=policy_arn)['Policy']
                policy_version = policy_info['DefaultVersionId']
                policy_document = iam.get_policy_version(
                    PolicyArn=policy_arn,
                    VersionId=policy_version
                )['PolicyVersion']['Document']

                # Use Access Analyzer to validate the policy
                validation_response = analyzer.validate_policy(
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
                        'severity': FINDING_TYPES['PERMISSIVE_POLICY'],
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

def get_aws_account_id():
    """Get the current AWS account ID."""
    return sts.get_caller_identity()['Account']

def check_cross_account_roles():
    """Find IAM roles with trust relationships to external accounts."""
    print("Checking for cross-account roles...")
    findings = []
    external_accounts = set()
    paginator = iam.get_paginator('list_roles')
    current_account = get_aws_account_id()

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
                                'severity': FINDING_TYPES['EXTERNAL_ACCOUNT_TRUST_ROOT'],
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
                                        'severity': FINDING_TYPES['EXTERNAL_ACCOUNT_TRUST_ROOT'],
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
                                        'severity': FINDING_TYPES['EXTERNAL_ACCOUNT_TRUST_SPECIFIC'],
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
                                    'severity': FINDING_TYPES['EXTERNAL_ACCOUNT_TRUST_ROOT'],
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

def count_console_users():
    """Count total console users and those without MFA."""
    total_console_users = 0
    console_users_without_mfa = 0

    paginator = iam.get_paginator('list_users')
    for page in paginator.paginate():
        for user in page['Users']:
            user_name = user['UserName']

            # Check if user has console access
            try:
                iam.get_login_profile(UserName=user_name)
                total_console_users += 1

                # Check if user has MFA
                mfa_devices = iam.list_mfa_devices(UserName=user_name)
                if not mfa_devices['MFADevices']:
                    console_users_without_mfa += 1
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchEntity':
                    # User does not have console access
                    pass
                else:
                    raise

    return total_console_users, console_users_without_mfa

def generate_report():
    """Generate a comprehensive IAM compliance report."""
    # Collect findings from all checks
    findings = []

    findings.extend(check_users_without_mfa())
    findings.extend(check_stale_access_keys())
    findings.extend(check_permissive_roles())
    findings.extend(check_permissive_policies())

    cross_account_findings, external_accounts = check_cross_account_roles()
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
        if finding_type in stats['by_type']:
            stats['by_type'][finding_type] = stats['by_type'].get(finding_type, 0) + 1

    # Calculate stale key statistics
    stale_keys = [
        int(f['days_inactive']) for f in findings
        if f['type'] in ['STALE_KEY_90_DAYS', 'UNUSED_KEY_30_DAYS'] and f['days_inactive']
    ]

    if stale_keys:
        stats['statistics']['average_stale_key_age'] = sum(stale_keys) / len(stale_keys)

    # Calculate MFA statistics
    total_console_users, console_users_without_mfa = count_console_users()

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

if __name__ == "__main__":
    try:
        generate_report()
    except Exception as e:
        print(f"Error running IAM compliance scan: {e}")
        raise
```

This improved version includes:

1. More robust error handling throughout the code
2. Better type checking and handling for policy documents
3. Improved progress output to the console
4. Separated the console user counting function for cleaner code
5. Added proper exception handling for the main function
6. Made the code more consistent in using the severity constants

The script now meets all the requirements while being more robust and maintainable. It handles potential errors gracefully, provides useful progress updates, and generates comprehensive reports in both JSON and CSV formats as requested.

Final thing to check: Let me ensure that we've included all the specific vulnerability types and output structure as requested.

Required finding types:

- NO_MFA_CONSOLE_USER ✓
- STALE_KEY_90_DAYS ✓
- UNUSED_KEY_30_DAYS ✓
- ADMIN_ACCESS_ROLE ✓
- PERMISSIVE_POLICY ✓
- EXTERNAL_ACCOUNT_TRUST_ROOT ✓
- EXTERNAL_ACCOUNT_TRUST_SPECIFIC ✓

Required CSV structure:

- severity ✓
- type ✓
- resource_type ✓
- resource_arn ✓
- resource_name ✓
- issue ✓
- details ✓
- days_inactive ✓
- timestamp ✓

Required JSON summary section:

- Total findings count by severity ✓
- Total findings count by type ✓
- List of all external account IDs discovered ✓
- Statistics: average age of stale keys, percentage of console users without MFA ✓

The script meets all these requirements. I think it's ready for use and will effectively scan for the IAM vulnerabilities as requested.

Actually, let me make a few final tweaks to clean things up further and make it easier to use as a library:

```python
#!/usr/bin/env python3
"""
IAM Compliance Scanner for AWS

This script analyzes IAM configurations to identify security vulnerabilities and compliance issues.
It generates both JSON and CSV reports detailing the findings.
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
    """Calculate days between two dates. If date2 is None, use current time."""
    if date2 is None:
        date2 = datetime.datetime.now(tzutc())

    if isinstance(date1, str):
        date1 = parse(date1)

    return (date2 - date1).days

def check_users_without_mfa(iam_client):
    """Find IAM users without MFA but with console access."""
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
    print("Checking for permissive roles...")
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
    print("Checking for cross-account roles...")
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
        if finding_type in stats['by_type']:
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
```

This final version includes the following improvements:

1. Moved the AWS clients into the main function to make the code more modular
2. Passed clients as parameters to each scanning function for better testability
3. Cleaned up the module structure to make it easier to use as a library
4. Added an optional region parameter to the generate_report function
5. Made the function return the findings and statistics, in addition to saving files

With these improvements, the script is not only more maintainable but also more flexible if you want to reuse parts of it in other tools.

### Answer

---

# IAM Security Posture Analysis Script

This Python script will help your CISO analyze the IAM vulnerabilities in your AWS environment. It checks for several critical security issues and generates detailed reports in both JSON and CSV formats.

## The Script: `lib/analyse.py`

```python
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
        if finding_type in stats['by_type']:
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
```

## What This Script Does

The script performs the following security checks:

1. **Users without MFA**
   - Identifies IAM users with console access but no MFA
   - Only flags users with passwords (ignores programmatic-only users)
   - Marked as HIGH severity

2. **Stale Access Keys**
   - Finds access keys not used in over 90 days (STALE_KEY_90_DAYS)
   - Identifies keys created over 30 days ago but never used (UNUSED_KEY_30_DAYS)
   - Calculates and reports days of inactivity for each key
   - Marked as MEDIUM severity

3. **Overly Permissive Roles**
   - Checks for roles with admin access via:
     - AdministratorAccess managed policy
     - Inline or managed policies with "Effect: Allow, Action: "_", Resource: "_"
   - Reports which specific policy grants the admin privileges
   - Marked as HIGH severity

4. **Permissive Policies**
   - Uses IAM Access Analyzer's ValidatePolicy API
   - Identifies customer-managed policies with SECURITY_WARNING findings
   - Captures issueCode and specific locations within the policy
   - Marked as HIGH severity

5. **Cross-Account Role Trust**
   - Detects roles with trust relationships to external AWS accounts
   - Extracts and reports external account IDs
   - Flags root principal access as HIGH severity (EXTERNAL_ACCOUNT_TRUST_ROOT)
   - Flags specific principal access as MEDIUM severity (EXTERNAL_ACCOUNT_TRUST_SPECIFIC)

## Output Files

The script generates two output files:

1. `iam_compliance_report.json` - A detailed JSON report with:
   - Summary statistics by severity and finding type
   - List of external account IDs discovered
   - Average age of stale keys and percentage of console users without MFA
   - Detailed findings with complete information

2. `iam_compliance_report.csv` - A CSV file with all findings in columns:
   - severity, type, resource_type, resource_arn, resource_name, issue, details, days_inactive, timestamp

## Usage

Simply run the script in your AWS environment with sufficient permissions:

```bash
python lib/analyse.py
```

Make sure you have the required Python packages installed:

```bash
pip install boto3 python-dateutil
```

The AWS credentials used to run the script should have read access to IAM resources and Access Analyzer.
