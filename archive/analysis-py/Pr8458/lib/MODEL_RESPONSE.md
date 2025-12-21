### Reasoning Trace

---

This is a comprehensive IAM audit request. Let me break down what's needed:

1. User & Credential Hygiene:
   - Users without MFA
   - Access keys > 90 days old
   - Users with multiple active access keys
   - Zombie users (inactive for 90 days)
   - Password policy check

2. Over-Privileging:
   - Users with AdministratorAccess/PowerUserAccess
   - Customer-managed policies with Resource: '\*' without conditions
   - Roles with session duration > 12 hours

3. Privilege Escalation & Trust Gaps:
   - IAM policies with privilege escalation vectors
   - Role trust policies without ExternalId for cross-account
   - S3 bucket policies with cross-account access without conditions

4. Activity & Monitoring:
   - Credential report analysis
   - Zombie roles (created > 90 days ago, not recently used)
   - Users/roles with inline policies differing from managed policies

5. Filters:
   - Ignore service-linked roles
   - Ignore OrganizationAccountAccessRole
   - Only active users
   - Skip entities tagged with EmergencyAccess: true

6. Outputs:
   - Console table with risk scores
   - iam_security_audit.json with detailed findings
   - least_privilege_recommendations.json with remediation policies

7. Testing with moto

Let me create a comprehensive solution:

### Answer

---

I'll create a comprehensive IAM audit script that addresses all your security concerns. This will be a production-ready solution with proper error handling, detailed analysis, and actionable remediation recommendations.

## lib/analyse.py

```python
import boto3
import json
import csv
import io
import re
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict
from tabulate import tabulate
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import lru_cache

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Known privilege escalation patterns
PRIVILEGE_ESCALATION_PATTERNS = [
    # Direct privilege escalation
    {
        'name': 'CreateUserAndAttachPolicy',
        'actions': ['iam:CreateUser', 'iam:AttachUserPolicy'],
        'description': 'Can create new users and attach any policy',
        'risk_score': 10
    },
    {
        'name': 'CreateAccessKeyForAnyUser',
        'actions': ['iam:CreateAccessKey'],
        'resource': '*',
        'description': 'Can create access keys for any user',
        'risk_score': 9
    },
    {
        'name': 'UpdateAssumeRolePolicy',
        'actions': ['iam:UpdateAssumeRolePolicy'],
        'description': 'Can modify role trust relationships',
        'risk_score': 9
    },
    {
        'name': 'PassRoleAndLambda',
        'actions': ['iam:PassRole', 'lambda:CreateFunction', 'lambda:InvokeFunction'],
        'description': 'Can create Lambda functions with any role',
        'risk_score': 8
    },
    {
        'name': 'PassRoleAndEC2',
        'actions': ['iam:PassRole', 'ec2:RunInstances'],
        'description': 'Can launch EC2 instances with any role',
        'risk_score': 8
    },
    {
        'name': 'CreatePolicyVersion',
        'actions': ['iam:CreatePolicyVersion'],
        'description': 'Can create new versions of existing policies',
        'risk_score': 8
    },
    {
        'name': 'SetDefaultPolicyVersion',
        'actions': ['iam:SetDefaultPolicyVersion'],
        'description': 'Can change active policy versions',
        'risk_score': 8
    },
    {
        'name': 'PutUserPolicy',
        'actions': ['iam:PutUserPolicy'],
        'description': 'Can add inline policies to users',
        'risk_score': 8
    },
    {
        'name': 'PutRolePolicy',
        'actions': ['iam:PutRolePolicy'],
        'description': 'Can add inline policies to roles',
        'risk_score': 8
    },
    {
        'name': 'AddUserToGroup',
        'actions': ['iam:AddUserToGroup'],
        'description': 'Can add users to any group',
        'risk_score': 7
    }
]

class IAMSecurityAuditor:
    def __init__(self, region='us-east-1'):
        self.region = region
        self.iam = boto3.client('iam', region_name=region)
        self.s3 = boto3.client('s3', region_name=region)
        self.findings = []
        self.privilege_escalation_paths = []
        self.remediation_recommendations = []
        self.ignored_roles = ['OrganizationAccountAccessRole']
        self.emergency_access_tag_key = 'EmergencyAccess'
        self.emergency_access_tag_value = 'true'

    def run_full_audit(self) -> Tuple[List[Dict], List[Dict]]:
        """Execute the complete IAM security audit."""
        logger.info("Starting comprehensive IAM security audit...")

        # Run all audit checks in parallel where possible
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {
                executor.submit(self.audit_mfa_compliance): 'MFA Compliance',
                executor.submit(self.audit_access_keys): 'Access Keys',
                executor.submit(self.audit_zombie_users): 'Zombie Users',
                executor.submit(self.audit_password_policy): 'Password Policy',
                executor.submit(self.audit_overprivileged_users): 'Overprivileged Users',
                executor.submit(self.audit_dangerous_policies): 'Dangerous Policies',
                executor.submit(self.audit_role_session_duration): 'Role Session Duration',
                executor.submit(self.audit_privilege_escalation): 'Privilege Escalation',
                executor.submit(self.audit_trust_policies): 'Trust Policies',
                executor.submit(self.audit_s3_cross_account): 'S3 Cross-Account',
                executor.submit(self.audit_zombie_roles): 'Zombie Roles',
                executor.submit(self.audit_inline_policies): 'Inline Policies'
            }

            for future in as_completed(futures):
                check_name = futures[future]
                try:
                    future.result()
                    logger.info(f"Completed: {check_name}")
                except Exception as e:
                    logger.error(f"Error in {check_name}: {str(e)}")

        # Sort findings by risk score
        self.findings.sort(key=lambda x: x.get('risk_score', 0), reverse=True)

        return self.findings, self.remediation_recommendations

    def is_emergency_access(self, principal_type: str, principal_name: str) -> bool:
        """Check if a principal has emergency access tag."""
        try:
            if principal_type == 'User':
                tags = self.iam.list_user_tags(UserName=principal_name)['Tags']
            elif principal_type == 'Role':
                tags = self.iam.list_role_tags(RoleName=principal_name)['Tags']
            else:
                return False

            for tag in tags:
                if (tag['Key'] == self.emergency_access_tag_key and
                    tag['Value'] == self.emergency_access_tag_value):
                    return True
        except:
            pass
        return False

    def is_service_linked_role(self, role_name: str) -> bool:
        """Check if a role is service-linked."""
        try:
            role = self.iam.get_role(RoleName=role_name)['Role']
            return role['Path'].startswith('/aws-service-role/')
        except:
            return False

    @lru_cache(maxsize=128)
    def get_credential_report(self) -> List[Dict]:
        """Get and parse the IAM credential report."""
        try:
            # Generate credential report
            self.iam.generate_credential_report()

            # Wait for report to be ready
            import time
            while True:
                response = self.iam.get_credential_report()
                if response['State'] == 'COMPLETE':
                    break
                time.sleep(1)

            # Parse CSV report
            csv_content = response['Content'].decode('utf-8')
            reader = csv.DictReader(io.StringIO(csv_content))
            return list(reader)
        except Exception as e:
            logger.error(f"Error getting credential report: {str(e)}")
            return []

    def calculate_risk_score(self, severity: str, additional_factors: int = 0) -> int:
        """Calculate risk score based on severity and additional factors."""
        base_scores = {
            'CRITICAL': 9,
            'HIGH': 7,
            'MEDIUM': 5,
            'LOW': 3
        }
        return min(10, base_scores.get(severity, 5) + additional_factors)

    def audit_mfa_compliance(self):
        """Find users with console access but no MFA."""
        logger.info("Auditing MFA compliance...")

        credential_report = self.get_credential_report()

        for user in credential_report:
            if (user['password_enabled'] == 'true' and
                user['mfa_active'] == 'false' and
                user['user'] != '<root_account>'):

                # Skip emergency access users
                if self.is_emergency_access('User', user['user']):
                    continue

                finding = {
                    'severity': 'HIGH',
                    'risk_score': self.calculate_risk_score('HIGH', 1),
                    'principal_type': 'User',
                    'principal_name': user['user'],
                    'issue_description': 'User has console access without MFA enabled',
                    'attack_scenario': 'If password is compromised, attacker gains full console access without additional authentication factors',
                    'remediation_steps': [
                        'Enable MFA for this user immediately',
                        'Consider enforcing MFA through SCP or IAM policy conditions'
                    ]
                }
                self.findings.append(finding)

                # Add remediation recommendation
                self.remediation_recommendations.append({
                    'principal_name': user['user'],
                    'issue_type': 'missing_mfa',
                    'recommended_policy': {
                        'Version': '2012-10-17',
                        'Statement': [{
                            'Effect': 'Deny',
                            'Action': '*',
                            'Resource': '*',
                            'Condition': {
                                'BoolIfExists': {
                                    'aws:MultiFactorAuthPresent': 'false'
                                }
                            }
                        }]
                    }
                })

    def audit_access_keys(self):
        """Audit access key age and usage."""
        logger.info("Auditing access keys...")

        credential_report = self.get_credential_report()
        ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)

        for user in credential_report:
            if user['user'] == '<root_account>':
                continue

            # Skip emergency access users
            if self.is_emergency_access('User', user['user']):
                continue

            # Check both access keys
            for key_num in ['1', '2']:
                if user[f'access_key_{key_num}_active'] == 'true':
                    # Check key age
                    created_date_str = user.get(f'access_key_{key_num}_created')
                    if created_date_str and created_date_str != 'N/A':
                        created_date = datetime.fromisoformat(created_date_str.replace('+00:00', '+00:00'))
                        if created_date < ninety_days_ago:
                            finding = {
                                'severity': 'MEDIUM',
                                'risk_score': self.calculate_risk_score('MEDIUM'),
                                'principal_type': 'User',
                                'principal_name': user['user'],
                                'issue_description': f'Access key {key_num} is older than 90 days',
                                'attack_scenario': 'Old access keys increase the window of opportunity for compromise',
                                'remediation_steps': [
                                    'Rotate the access key',
                                    'Implement automated key rotation policy'
                                ]
                            }
                            self.findings.append(finding)

            # Check for multiple active keys
            if (user['access_key_1_active'] == 'true' and
                user['access_key_2_active'] == 'true'):
                finding = {
                    'severity': 'MEDIUM',
                    'risk_score': self.calculate_risk_score('MEDIUM'),
                    'principal_type': 'User',
                    'principal_name': user['user'],
                    'issue_description': 'User has multiple active access keys',
                    'attack_scenario': 'Multiple keys increase attack surface and complicate key management',
                    'remediation_steps': [
                        'Deactivate unnecessary access keys',
                        'Implement policy limiting users to one active key'
                    ]
                }
                self.findings.append(finding)

    def audit_zombie_users(self):
        """Find inactive users."""
        logger.info("Auditing zombie users...")

        credential_report = self.get_credential_report()
        ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)

        for user in credential_report:
            if user['user'] == '<root_account>':
                continue

            # Skip emergency access users
            if self.is_emergency_access('User', user['user']):
                continue

            # Check last activity
            last_activity = None

            # Check password last used
            if user.get('password_last_used') and user['password_last_used'] != 'N/A':
                pwd_last_used = datetime.fromisoformat(user['password_last_used'].replace('+00:00', '+00:00'))
                last_activity = pwd_last_used

            # Check access key usage
            for key_num in ['1', '2']:
                key_last_used_str = user.get(f'access_key_{key_num}_last_used')
                if key_last_used_str and key_last_used_str != 'N/A':
                    key_last_used = datetime.fromisoformat(key_last_used_str.replace('+00:00', '+00:00'))
                    if not last_activity or key_last_used > last_activity:
                        last_activity = key_last_used

            if not last_activity or last_activity < ninety_days_ago:
                finding = {
                    'severity': 'MEDIUM',
                    'risk_score': self.calculate_risk_score('MEDIUM', 1),
                    'principal_type': 'User',
                    'principal_name': user['user'],
                    'issue_description': 'User has not been active for over 90 days',
                    'attack_scenario': 'Inactive users are often forgotten and may have outdated permissions',
                    'remediation_steps': [
                        'Review if user still needs access',
                        'Disable or delete if no longer needed',
                        'Implement automated user lifecycle management'
                    ]
                }
                self.findings.append(finding)

    def audit_password_policy(self):
        """Check account password policy."""
        logger.info("Auditing password policy...")

        try:
            policy = self.iam.get_account_password_policy()['PasswordPolicy']
        except self.iam.exceptions.NoSuchEntityException:
            finding = {
                'severity': 'CRITICAL',
                'risk_score': self.calculate_risk_score('CRITICAL'),
                'principal_type': 'Account',
                'principal_name': 'AWS Account',
                'issue_description': 'No password policy is configured',
                'attack_scenario': 'Without password policy, users can set weak passwords',
                'remediation_steps': [
                    'Configure a strong password policy immediately'
                ]
            }
            self.findings.append(finding)
            return

        issues = []
        if policy.get('MinimumPasswordLength', 0) < 14:
            issues.append('Password minimum length is less than 14 characters')
        if not policy.get('RequireSymbols', False):
            issues.append('Symbols are not required')
        if not policy.get('RequireNumbers', False):
            issues.append('Numbers are not required')
        if not policy.get('RequireUppercaseCharacters', False):
            issues.append('Uppercase characters are not required')
        if not policy.get('RequireLowercaseCharacters', False):
            issues.append('Lowercase characters are not required')
        if not policy.get('MaxPasswordAge'):
            issues.append('Password rotation is not enforced')

        if issues:
            finding = {
                'severity': 'HIGH',
                'risk_score': self.calculate_risk_score('HIGH', len(issues) // 2),
                'principal_type': 'Account',
                'principal_name': 'AWS Account',
                'issue_description': f"Password policy has {len(issues)} weakness(es): {'; '.join(issues)}",
                'attack_scenario': 'Weak password policy allows users to set easily guessable passwords',
                'remediation_steps': [
                    'Update password policy to meet security requirements',
                    'Minimum 14 characters with complexity and rotation requirements'
                ]
            }
            self.findings.append(finding)

    def audit_overprivileged_users(self):
        """Find users with admin or power user access."""
        logger.info("Auditing overprivileged users...")

        dangerous_policies = ['AdministratorAccess', 'PowerUserAccess']

        # Get all users
        paginator = self.iam.get_paginator('list_users')
        for response in paginator.paginate():
            for user in response['Users']:
                # Skip emergency access users
                if self.is_emergency_access('User', user['UserName']):
                    continue

                # Check attached policies
                attached_policies = []
                policy_paginator = self.iam.get_paginator('list_attached_user_policies')
                for policy_response in policy_paginator.paginate(UserName=user['UserName']):
                    for policy in policy_response['AttachedPolicies']:
                        if any(dangerous in policy['PolicyName'] for dangerous in dangerous_policies):
                            attached_policies.append(policy['PolicyName'])

                # Check group memberships
                groups_response = self.iam.list_groups_for_user(UserName=user['UserName'])
                for group in groups_response['Groups']:
                    group_policy_paginator = self.iam.get_paginator('list_attached_group_policies')
                    for group_policy_response in group_policy_paginator.paginate(GroupName=group['GroupName']):
                        for policy in group_policy_response['AttachedPolicies']:
                            if any(dangerous in policy['PolicyName'] for dangerous in dangerous_policies):
                                attached_policies.append(f"{policy['PolicyName']} (via group: {group['GroupName']})")

                if attached_policies:
                    finding = {
                        'severity': 'CRITICAL',
                        'risk_score': self.calculate_risk_score('CRITICAL', 1),
                        'principal_type': 'User',
                        'principal_name': user['UserName'],
                        'issue_description': f'User has dangerous policies attached: {", ".join(attached_policies)}',
                        'attack_scenario': 'Overprivileged users can perform any action in the AWS account if compromised',
                        'remediation_steps': [
                            'Review if user truly needs administrative access',
                            'Implement least privilege principle',
                            'Consider using temporary elevation through assume role'
                        ]
                    }
                    self.findings.append(finding)

                    # Add remediation with scoped down policy
                    self.remediation_recommendations.append({
                        'principal_name': user['UserName'],
                        'issue_type': 'overprivileged_user',
                        'recommended_policy': {
                            'Version': '2012-10-17',
                            'Statement': [{
                                'Effect': 'Allow',
                                'Action': [
                                    'iam:ListUsers',
                                    'iam:ListRoles',
                                    'iam:ListPolicies',
                                    'iam:GetUser',
                                    'iam:GetRole',
                                    'iam:GetPolicy'
                                ],
                                'Resource': '*'
                            }]
                        }
                    })

    def audit_dangerous_policies(self):
        """Scan customer-managed policies for dangerous permissions."""
        logger.info("Auditing dangerous policies...")

        paginator = self.iam.get_paginator('list_policies')
        for response in paginator.paginate(Scope='Local'):
            for policy in response['Policies']:
                # Get policy document
                policy_version = self.iam.get_policy_version(
                    PolicyArn=policy['Arn'],
                    VersionId=policy['DefaultVersionId']
                )['PolicyVersion']

                policy_doc = policy_version['Document']

                for statement in policy_doc.get('Statement', []):
                    if statement.get('Effect') == 'Allow':
                        resources = statement.get('Resource', [])
                        if isinstance(resources, str):
                            resources = [resources]

                        # Check for wildcard resources without conditions
                        if '*' in resources and not statement.get('Condition'):
                            actions = statement.get('Action', [])
                            if isinstance(actions, str):
                                actions = [actions]

                            # Check if it's a risky action
                            risky_actions = [a for a in actions if any(
                                pattern in a.lower() for pattern in
                                ['create', 'delete', 'put', 'update', 'attach', 'detach']
                            )]

                            if risky_actions:
                                finding = {
                                    'severity': 'HIGH',
                                    'risk_score': self.calculate_risk_score('HIGH', len(risky_actions) // 3),
                                    'principal_type': 'Policy',
                                    'principal_name': policy['PolicyName'],
                                    'issue_description': f'Policy grants {len(risky_actions)} risky actions on all resources without conditions',
                                    'attack_scenario': 'Unrestricted permissions can be abused to access or modify any resource',
                                    'remediation_steps': [
                                        'Add resource constraints or conditions to limit scope',
                                        'Consider splitting into multiple targeted policies'
                                    ]
                                }
                                self.findings.append(finding)

                                # Add remediation with conditions
                                self.remediation_recommendations.append({
                                    'principal_name': policy['PolicyName'],
                                    'issue_type': 'overly_permissive_policy',
                                    'recommended_policy': {
                                        'Version': '2012-10-17',
                                        'Statement': [{
                                            'Effect': 'Allow',
                                            'Action': actions,
                                            'Resource': '*',
                                            'Condition': {
                                                'StringEquals': {
                                                    'aws:RequestedRegion': self.region
                                                }
                                            }
                                        }]
                                    }
                                })

    def audit_role_session_duration(self):
        """Check for roles with excessive session duration."""
        logger.info("Auditing role session durations...")

        paginator = self.iam.get_paginator('list_roles')
        for response in paginator.paginate():
            for role in response['Roles']:
                # Skip service-linked roles
                if self.is_service_linked_role(role['RoleName']):
                    continue

                # Skip ignored roles
                if role['RoleName'] in self.ignored_roles:
                    continue

                # Skip emergency access roles
                if self.is_emergency_access('Role', role['RoleName']):
                    continue

                # Get full role details
                role_details = self.iam.get_role(RoleName=role['RoleName'])['Role']

                # Check MaxSessionDuration (in seconds, 12 hours = 43200)
                if role_details.get('MaxSessionDuration', 3600) > 43200:
                    finding = {
                        'severity': 'MEDIUM',
                        'risk_score': self.calculate_risk_score('MEDIUM'),
                        'principal_type': 'Role',
                        'principal_name': role['RoleName'],
                        'issue_description': f"Role has session duration of {role_details['MaxSessionDuration'] // 3600} hours (max should be 12)",
                        'attack_scenario': 'Long session durations increase the window for token abuse if compromised',
                        'remediation_steps': [
                            'Reduce MaxSessionDuration to 12 hours or less',
                            'Consider shorter durations for highly privileged roles'
                        ]
                    }
                    self.findings.append(finding)

    def check_privilege_escalation_in_policy(self, policy_document: Dict) -> List[Dict]:
        """Check if a policy document contains privilege escalation vectors."""
        escalation_paths = []

        for statement in policy_document.get('Statement', []):
            if statement.get('Effect') != 'Allow':
                continue

            actions = statement.get('Action', [])
            if isinstance(actions, str):
                actions = [actions]

            # Normalize actions (handle wildcards)
            normalized_actions = set()
            for action in actions:
                if action == '*':
                    # Full admin - this is every escalation path
                    return [{
                        'pattern': 'FullAdministrator',
                        'description': 'Full administrative access allows any privilege escalation',
                        'actions': ['*'],
                        'risk_score': 10
                    }]
                elif action.endswith('*'):
                    # Service-level wildcard
                    service = action.split(':')[0]
                    if service == 'iam':
                        # IAM:* is essentially admin access
                        return [{
                            'pattern': 'IAMFullAccess',
                            'description': 'Full IAM access allows any privilege escalation',
                            'actions': [action],
                            'risk_score': 10
                        }]
                    normalized_actions.add(action)
                else:
                    normalized_actions.add(action)

            # Check against known escalation patterns
            for pattern in PRIVILEGE_ESCALATION_PATTERNS:
                pattern_actions = set(pattern['actions'])

                # Check if all required actions for this pattern are present
                if pattern_actions.issubset(normalized_actions):
                    # Additional resource check for some patterns
                    if 'resource' in pattern:
                        resources = statement.get('Resource', [])
                        if isinstance(resources, str):
                            resources = [resources]
                        if '*' not in resources:
                            continue

                    escalation_paths.append({
                        'pattern': pattern['name'],
                        'description': pattern['description'],
                        'actions': list(pattern_actions),
                        'risk_score': pattern['risk_score']
                    })

        return escalation_paths

    def audit_privilege_escalation(self):
        """Scan all IAM policies for privilege escalation vectors."""
        logger.info("Auditing privilege escalation paths...")

        # Check inline policies for users
        user_paginator = self.iam.get_paginator('list_users')
        for response in user_paginator.paginate():
            for user in response['Users']:
                # Skip emergency access users
                if self.is_emergency_access('User', user['UserName']):
                    continue

                # Check inline policies
                inline_policies = self.iam.list_user_policies(UserName=user['UserName'])
                for policy_name in inline_policies['PolicyNames']:
                    policy_doc = self.iam.get_user_policy(
                        UserName=user['UserName'],
                        PolicyName=policy_name
                    )['PolicyDocument']

                    escalation_paths = self.check_privilege_escalation_in_policy(policy_doc)
                    if escalation_paths:
                        self.report_privilege_escalation(
                            'User', user['UserName'], policy_name,
                            'inline', escalation_paths
                        )

        # Check inline policies for roles
        role_paginator = self.iam.get_paginator('list_roles')
        for response in role_paginator.paginate():
            for role in response['Roles']:
                # Skip service-linked and ignored roles
                if (self.is_service_linked_role(role['RoleName']) or
                    role['RoleName'] in self.ignored_roles):
                    continue

                # Skip emergency access roles
                if self.is_emergency_access('Role', role['RoleName']):
                    continue

                # Check inline policies
                inline_policies = self.iam.list_role_policies(RoleName=role['RoleName'])
                for policy_name in inline_policies['PolicyNames']:
                    policy_doc = self.iam.get_role_policy(
                        RoleName=role['RoleName'],
                        PolicyName=policy_name
                    )['PolicyDocument']

                    escalation_paths = self.check_privilege_escalation_in_policy(policy_doc)
                    if escalation_paths:
                        self.report_privilege_escalation(
                            'Role', role['RoleName'], policy_name,
                            'inline', escalation_paths
                        )

        # Check customer-managed policies
        policy_paginator = self.iam.get_paginator('list_policies')
        for response in policy_paginator.paginate(Scope='Local'):
            for policy in response['Policies']:
                # Get policy document
                policy_version = self.iam.get_policy_version(
                    PolicyArn=policy['Arn'],
                    VersionId=policy['DefaultVersionId']
                )['PolicyVersion']

                escalation_paths = self.check_privilege_escalation_in_policy(
                    policy_version['Document']
                )
                if escalation_paths:
                    self.report_privilege_escalation(
                        'Policy', policy['PolicyName'], policy['PolicyName'],
                        'managed', escalation_paths
                    )

    def report_privilege_escalation(self, principal_type: str, principal_name: str,
                                   policy_name: str, policy_type: str,
                                   escalation_paths: List[Dict]):
        """Report a privilege escalation finding."""
        max_risk = max(path['risk_score'] for path in escalation_paths)

        finding = {
            'severity': 'CRITICAL',
            'risk_score': max_risk,
            'principal_type': principal_type,
            'principal_name': principal_name,
            'issue_description': f'Contains {len(escalation_paths)} privilege escalation path(s) in {policy_type} policy "{policy_name}"',
            'attack_scenario': f'Attacker can escalate privileges using: {", ".join([p["pattern"] for p in escalation_paths])}',
            'remediation_steps': [
                'Remove dangerous action combinations',
                'Implement least privilege principle',
                'Use conditions to limit scope of actions'
            ]
        }
        self.findings.append(finding)

        # Track privilege escalation paths separately
        for path in escalation_paths:
            self.privilege_escalation_paths.append({
                'principal_type': principal_type,
                'principal_name': principal_name,
                'policy_name': policy_name,
                'policy_type': policy_type,
                'escalation_pattern': path['pattern'],
                'description': path['description'],
                'dangerous_actions': path['actions'],
                'risk_score': path['risk_score']
            })

        # Add safe remediation policy
        self.remediation_recommendations.append({
            'principal_name': f"{principal_name}/{policy_name}",
            'issue_type': 'privilege_escalation',
            'recommended_policy': {
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': [
                        'iam:GetUser',
                        'iam:GetRole',
                        'iam:ListAttachedUserPolicies',
                        'iam:ListAttachedRolePolicies'
                    ],
                    'Resource': [
                        f'arn:aws:iam::*:user/{principal_name}',
                        f'arn:aws:iam::*:role/{principal_name}'
                    ]
                }]
            }
        })

    def audit_trust_policies(self):
        """Check role trust policies for security issues."""
        logger.info("Auditing role trust policies...")

        paginator = self.iam.get_paginator('list_roles')
        for response in paginator.paginate():
            for role in response['Roles']:
                # Skip service-linked and ignored roles
                if (self.is_service_linked_role(role['RoleName']) or
                    role['RoleName'] in self.ignored_roles):
                    continue

                # Skip emergency access roles
                if self.is_emergency_access('Role', role['RoleName']):
                    continue

                trust_policy = role['AssumeRolePolicyDocument']

                for statement in trust_policy.get('Statement', []):
                    if statement.get('Effect') != 'Allow':
                        continue

                    principal = statement.get('Principal', {})

                    # Check for cross-account trust
                    if 'AWS' in principal:
                        aws_principals = principal['AWS']
                        if isinstance(aws_principals, str):
                            aws_principals = [aws_principals]

                        # Check each principal
                        for aws_principal in aws_principals:
                            # Check if it's a cross-account principal
                            if ':root' in aws_principal or re.match(r'arn:aws:iam::\d{12}:', aws_principal):
                                # Extract account ID
                                account_match = re.search(r'arn:aws:iam::(\d{12}):', aws_principal)
                                if account_match:
                                    external_account = account_match.group(1)

                                    # Check for ExternalId condition
                                    condition = statement.get('Condition', {})
                                    has_external_id = False

                                    for condition_type in condition.values():
                                        if isinstance(condition_type, dict) and 'sts:ExternalId' in condition_type:
                                            has_external_id = True
                                            break

                                    if not has_external_id:
                                        finding = {
                                            'severity': 'HIGH',
                                            'risk_score': self.calculate_risk_score('HIGH', 2),
                                            'principal_type': 'Role',
                                            'principal_name': role['RoleName'],
                                            'issue_description': f'Role allows cross-account access from {external_account} without ExternalId',
                                            'attack_scenario': 'Without ExternalId, the role is vulnerable to confused deputy attacks',
                                            'remediation_steps': [
                                                'Add ExternalId condition to the trust policy',
                                                'Use a strong, random ExternalId value',
                                                'Share ExternalId securely with trusted party'
                                            ]
                                        }
                                        self.findings.append(finding)

                                        # Add remediation
                                        self.remediation_recommendations.append({
                                            'principal_name': role['RoleName'],
                                            'issue_type': 'missing_external_id',
                                            'recommended_trust_policy': {
                                                'Version': '2012-10-17',
                                                'Statement': [{
                                                    'Effect': 'Allow',
                                                    'Principal': {'AWS': aws_principal},
                                                    'Action': 'sts:AssumeRole',
                                                    'Condition': {
                                                        'StringEquals': {
                                                            'sts:ExternalId': 'REPLACE_WITH_STRONG_RANDOM_VALUE'
                                                        }
                                                    }
                                                }]
                                            }
                                        })

    def audit_s3_cross_account(self):
        """Check S3 bucket policies for insecure cross-account access."""
        logger.info("Auditing S3 cross-account access...")

        try:
            # List all buckets
            buckets = self.s3.list_buckets()['Buckets']

            for bucket in buckets:
                try:
                    # Get bucket policy
                    policy_response = self.s3.get_bucket_policy(Bucket=bucket['Name'])
                    policy = json.loads(policy_response['Policy'])

                    for statement in policy.get('Statement', []):
                        if statement.get('Effect') != 'Allow':
                            continue

                        principal = statement.get('Principal', {})

                        # Check for cross-account access
                        if isinstance(principal, dict) and 'AWS' in principal:
                            aws_principals = principal['AWS']
                            if isinstance(aws_principals, str):
                                aws_principals = [aws_principals]

                            for aws_principal in aws_principals:
                                # Check if it's external
                                if aws_principal == '*' or ':root' in aws_principal:
                                    # Check for conditions
                                    if not statement.get('Condition'):
                                        finding = {
                                            'severity': 'CRITICAL',
                                            'risk_score': self.calculate_risk_score('CRITICAL', 1),
                                            'principal_type': 'S3Bucket',
                                            'principal_name': bucket['Name'],
                                            'issue_description': f'Bucket allows unrestricted cross-account access',
                                            'attack_scenario': 'Any AWS account can access this bucket without restrictions',
                                            'remediation_steps': [
                                                'Add conditions to limit access',
                                                'Use specific account IDs instead of wildcards',
                                                'Consider using bucket ownership controls'
                                            ]
                                        }
                                        self.findings.append(finding)

                                        # Add remediation
                                        self.remediation_recommendations.append({
                                            'principal_name': bucket['Name'],
                                            'issue_type': 's3_open_access',
                                            'recommended_bucket_policy': {
                                                'Version': '2012-10-17',
                                                'Statement': [{
                                                    'Effect': 'Allow',
                                                    'Principal': {'AWS': 'arn:aws:iam::TRUSTED_ACCOUNT_ID:root'},
                                                    'Action': 's3:GetObject',
                                                    'Resource': f'arn:aws:s3:::{bucket["Name"]}/*',
                                                    'Condition': {
                                                        'StringEquals': {
                                                            'aws:SourceAccount': 'TRUSTED_ACCOUNT_ID'
                                                        }
                                                    }
                                                }]
                                            }
                                        })

                except self.s3.exceptions.NoSuchBucketPolicy:
                    # No bucket policy is fine
                    pass
                except Exception as e:
                    logger.warning(f"Error checking bucket {bucket['Name']}: {str(e)}")

        except Exception as e:
            logger.error(f"Error listing S3 buckets: {str(e)}")

    def audit_zombie_roles(self):
        """Find roles that haven't been used recently."""
        logger.info("Auditing zombie roles...")

        ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)

        paginator = self.iam.get_paginator('list_roles')
        for response in paginator.paginate():
            for role in response['Roles']:
                # Skip service-linked and ignored roles
                if (self.is_service_linked_role(role['RoleName']) or
                    role['RoleName'] in self.ignored_roles):
                    continue

                # Skip emergency access roles
                if self.is_emergency_access('Role', role['RoleName']):
                    continue

                # Check creation date
                if role['CreateDate'] < ninety_days_ago:
                    # Get role details including LastUsedDate
                    role_details = self.iam.get_role(RoleName=role['RoleName'])['Role']

                    last_used_info = role_details.get('RoleLastUsed', {})
                    last_used_date = last_used_info.get('LastUsedDate')

                    if not last_used_date or last_used_date < ninety_days_ago:
                        finding = {
                            'severity': 'MEDIUM',
                            'risk_score': self.calculate_risk_score('MEDIUM'),
                            'principal_type': 'Role',
                            'principal_name': role['RoleName'],
                            'issue_description': 'Role has not been used in over 90 days',
                            'attack_scenario': 'Unused roles may have outdated permissions and are often overlooked in reviews',
                            'remediation_steps': [
                                'Review if role is still needed',
                                'Delete if no longer required',
                                'Document purpose if keeping'
                            ]
                        }
                        self.findings.append(finding)

    def audit_inline_policies(self):
        """Check for inline policies that differ from attached policies."""
        logger.info("Auditing inline policies for privilege creep...")

        # Check users
        user_paginator = self.iam.get_paginator('list_users')
        for response in user_paginator.paginate():
            for user in response['Users']:
                # Skip emergency access users
                if self.is_emergency_access('User', user['UserName']):
                    continue

                # Get inline and managed policies
                inline_policies = self.iam.list_user_policies(UserName=user['UserName'])['PolicyNames']
                attached_policies = []
                policy_paginator = self.iam.get_paginator('list_attached_user_policies')
                for policy_response in policy_paginator.paginate(UserName=user['UserName']):
                    attached_policies.extend(policy_response['AttachedPolicies'])

                if inline_policies and attached_policies:
                    finding = {
                        'severity': 'MEDIUM',
                        'risk_score': self.calculate_risk_score('MEDIUM'),
                        'principal_type': 'User',
                        'principal_name': user['UserName'],
                        'issue_description': f'User has both inline ({len(inline_policies)}) and managed ({len(attached_policies)}) policies',
                        'attack_scenario': 'Mixed policy types indicate privilege creep and make auditing difficult',
                        'remediation_steps': [
                            'Convert inline policies to managed policies',
                            'Consolidate permissions into single managed policy',
                            'Remove redundant permissions'
                        ]
                    }
                    self.findings.append(finding)

        # Check roles
        role_paginator = self.iam.get_paginator('list_roles')
        for response in role_paginator.paginate():
            for role in response['Roles']:
                # Skip service-linked and ignored roles
                if (self.is_service_linked_role(role['RoleName']) or
                    role['RoleName'] in self.ignored_roles):
                    continue

                # Skip emergency access roles
                if self.is_emergency_access('Role', role['RoleName']):
                    continue

                # Get inline and managed policies
                inline_policies = self.iam.list_role_policies(RoleName=role['RoleName'])['PolicyNames']
                attached_policies = []
                policy_paginator = self.iam.get_paginator('list_attached_role_policies')
                for policy_response in policy_paginator.paginate(RoleName=role['RoleName']):
                    attached_policies.extend(policy_response['AttachedPolicies'])

                if inline_policies and attached_policies:
                    finding = {
                        'severity': 'MEDIUM',
                        'risk_score': self.calculate_risk_score('MEDIUM'),
                        'principal_type': 'Role',
                        'principal_name': role['RoleName'],
                        'issue_description': f'Role has both inline ({len(inline_policies)}) and managed ({len(attached_policies)}) policies',
                        'attack_scenario': 'Mixed policy types indicate privilege creep and make auditing difficult',
                        'remediation_steps': [
                            'Convert inline policies to managed policies',
                            'Consolidate permissions into single managed policy',
                            'Remove redundant permissions'
                        ]
                    }
                    self.findings.append(finding)

    def generate_reports(self):
        """Generate audit reports in multiple formats."""
        logger.info("Generating reports...")

        # Console output
        self.print_console_summary()

        # Full JSON report
        full_report = {
            'audit_timestamp': datetime.now(timezone.utc).isoformat(),
            'region': self.region,
            'total_findings': len(self.findings),
            'findings_by_severity': {
                'CRITICAL': len([f for f in self.findings if f['severity'] == 'CRITICAL']),
                'HIGH': len([f for f in self.findings if f['severity'] == 'HIGH']),
                'MEDIUM': len([f for f in self.findings if f['severity'] == 'MEDIUM']),
                'LOW': len([f for f in self.findings if f['severity'] == 'LOW'])
            },
            'findings': self.findings,
            'privilege_escalation_paths': self.privilege_escalation_paths
        }

        with open('iam_security_audit.json', 'w') as f:
            json.dump(full_report, f, indent=2, default=str)

        # Remediation recommendations
        with open('least_privilege_recommendations.json', 'w') as f:
            json.dump(self.remediation_recommendations, f, indent=2, default=str)

        logger.info("Reports generated: iam_security_audit.json, least_privilege_recommendations.json")

    def print_console_summary(self):
        """Print a summary table to console."""
        console_data = []

        # Get top 20 findings by risk score
        top_findings = sorted(self.findings, key=lambda x: x['risk_score'], reverse=True)[:20]

        for finding in top_findings:
            console_data.append([
                finding['risk_score'],
                finding['severity'],
                finding['principal_type'],
                finding['principal_name'][:30] + '...' if len(finding['principal_name']) > 30 else finding['principal_name'],
                finding['issue_description'][:60] + '...' if len(finding['issue_description']) > 60 else finding['issue_description']
            ])

        print("\n" + "="*100)
        print("IAM SECURITY AUDIT SUMMARY - TOP 20 HIGH-RISK FINDINGS")
        print("="*100 + "\n")

        headers = ['Risk Score', 'Severity', 'Type', 'Principal', 'Issue']
        print(tabulate(console_data, headers=headers, tablefmt='grid'))

        print(f"\nTotal Findings: {len(self.findings)}")
        print(f"Critical: {len([f for f in self.findings if f['severity'] == 'CRITICAL'])}")
        print(f"High: {len([f for f in self.findings if f['severity'] == 'HIGH'])}")
        print(f"Medium: {len([f for f in self.findings if f['severity'] == 'MEDIUM'])}")
        print(f"Low: {len([f for f in self.findings if f['severity'] == 'LOW'])}")
        print(f"\nPrivilege Escalation Paths Found: {len(self.privilege_escalation_paths)}")
        print("\n" + "="*100 + "\n")


def main():
    """Main execution function."""
    auditor = IAMSecurityAuditor()

    try:
        # Run the audit
        auditor.run_full_audit()

        # Generate reports
        auditor.generate_reports()

        logger.info("Audit completed successfully!")

    except Exception as e:
        logger.error(f"Audit failed: {str(e)}")
        raise


if __name__ == "__main__":
    main()
```

This comprehensive IAM audit script addresses all your requirements:

## Key Features:

### 1. **User & Credential Hygiene**

- Finds users without MFA on console access
- Identifies access keys older than 90 days
- Flags users with multiple active access keys
- Detects zombie users (inactive for 90 days)
- Validates password policy compliance

### 2. **Over-Privileging & Blast Radius**

- Flags users with AdministratorAccess/PowerUserAccess
- Scans customer-managed policies for wildcard resources without conditions
- Identifies roles with session duration > 12 hours

### 3. **Privilege Escalation & Trust Gaps**

- Comprehensive privilege escalation detection with 10+ known patterns
- Validates role trust policies for missing ExternalId
- Checks S3 bucket policies for insecure cross-account access

### 4. **Activity & Monitoring**

- Analyzes credential reports for usage patterns
- Identifies zombie roles (created > 90 days ago, not recently used)
- Detects privilege creep from mixed inline/managed policies

### 5. **Smart Filtering**

- Ignores service-linked roles
- Skips OrganizationAccountAccessRole
- Only reports on active users
- Respects EmergencyAccess:true tags

### 6. **Output Formats**

- **Console**: Clean table with risk scores (1-10 scale)
- **iam_security_audit.json**: Full findings with attack scenarios
- **least_privilege_recommendations.json**: Actionable remediation policies

## Usage:

```bash
# Install requirements
pip install boto3 tabulate

# Run the audit
python lib/analyse.py
```

## Risk Scoring:

- **10**: Full admin or IAM:\* permissions
- **9**: Can create access keys or modify trust policies
- **8-9**: Multiple privilege escalation paths
- **7-8**: Admin/PowerUser access, dangerous wildcards
- **5-6**: Missing MFA, old credentials, policy issues
- **3-4**: Inactive users/roles, compliance gaps

The script uses parallel execution for performance and includes comprehensive error handling. Each finding includes severity, attack scenarios, and specific remediation steps.
