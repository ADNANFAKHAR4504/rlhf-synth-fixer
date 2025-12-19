"""
Unit Tests for IAM Security Auditor

==============================================================================
Unit tests for the IAM Security Auditor class that performs comprehensive
IAM security analysis including MFA compliance, access keys, privilege
escalation, and more.

These tests use unittest.mock to test logic WITHOUT external services.
==============================================================================
"""

import sys
import os
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch, mock_open
import io
import json

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import IAMSecurityAuditor, PRIVILEGE_ESCALATION_PATTERNS, main


class TestIAMSecurityAuditor:
    """
    Test suite for IAMSecurityAuditor class
    """

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that analyzer initializes with correct AWS clients"""
        auditor = IAMSecurityAuditor(region='us-west-2')

        assert auditor.region == 'us-west-2'
        assert auditor.emergency_access_tag_key == 'EmergencyAccess'
        assert auditor.emergency_access_tag_value == 'true'

        # Should create IAM and S3 clients
        assert mock_boto_client.call_count == 2
        calls = [call[0][0] for call in mock_boto_client.call_args_list]
        assert 'iam' in calls
        assert 's3' in calls

    @patch('analyse.boto3.client')
    @patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5000'})
    def test_initialization_uses_endpoint_from_environment(self, mock_boto_client):
        """Test auditor uses Moto endpoint from AWS_ENDPOINT_URL environment variable"""
        auditor = IAMSecurityAuditor()

        # Verify endpoint_url was passed to boto3 clients
        calls = mock_boto_client.call_args_list
        for call in calls:
            assert call[1].get('endpoint_url') == 'http://localhost:5000'

    @patch('analyse.boto3.client')
    @patch.dict(os.environ, {'AWS_DEFAULT_REGION': 'eu-west-1'})
    def test_initialization_uses_region_from_environment(self, mock_boto_client):
        """Test auditor uses region from AWS_DEFAULT_REGION environment variable when region=None"""
        auditor = IAMSecurityAuditor(region=None)

        assert auditor.region == 'eu-west-1'

    # =========================================================================
    # CREDENTIAL REPORT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_credential_report_parses_csv_correctly(self, mock_boto_client):
        """Test credential report is fetched and parsed correctly"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        # Mock credential report response
        csv_data = """user,arn,user_creation_time,password_enabled,password_last_used,password_last_changed,password_next_rotation,mfa_active,access_key_1_active,access_key_1_last_rotated,access_key_1_last_used_date,access_key_1_last_used_region,access_key_1_last_used_service,access_key_2_active,access_key_2_last_rotated,access_key_2_last_used_date,access_key_2_last_used_region,access_key_2_last_used_service,cert_1_active,cert_1_last_rotated,cert_2_active,cert_2_last_rotated
test_user,arn:aws:iam::123456789012:user/test_user,2024-01-01T00:00:00+00:00,true,2024-01-10T00:00:00+00:00,2024-01-01T00:00:00+00:00,N/A,false,true,2024-01-01T00:00:00+00:00,2024-01-05T00:00:00+00:00,us-east-1,s3,false,N/A,N/A,N/A,N/A,false,N/A,false,N/A"""

        mock_iam.get_credential_report.return_value = {
            'State': 'COMPLETE',
            'Content': csv_data.encode('utf-8')
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        # Clear cache to force new call
        auditor.get_credential_report.cache_clear()

        report = auditor.get_credential_report()

        assert len(report) == 1
        assert report[0]['user'] == 'test_user'
        assert report[0]['password_enabled'] == 'true'
        assert report[0]['mfa_active'] == 'false'

    @patch('analyse.boto3.client')
    def test_get_credential_report_handles_errors(self, mock_boto_client):
        """Test credential report handles errors gracefully"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam
        mock_iam.get_credential_report.side_effect = Exception("API Error")

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        # Clear cache
        auditor.get_credential_report.cache_clear()

        report = auditor.get_credential_report()

        assert report == []

    # =========================================================================
    # EMERGENCY ACCESS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_is_emergency_access_returns_true_for_tagged_user(self, mock_boto_client):
        """Test emergency access detection for users with EmergencyAccess tag"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_iam.list_user_tags.return_value = {
            'Tags': [
                {'Key': 'EmergencyAccess', 'Value': 'true'},
                {'Key': 'Team', 'Value': 'Security'}
            ]
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        result = auditor.is_emergency_access('User', 'emergency-user')

        assert result is True

    @patch('analyse.boto3.client')
    def test_is_emergency_access_returns_false_for_untagged_user(self, mock_boto_client):
        """Test emergency access returns False for users without tag"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_iam.list_user_tags.return_value = {
            'Tags': [{'Key': 'Team', 'Value': 'Engineering'}]
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        result = auditor.is_emergency_access('User', 'normal-user')

        assert result is False

    @patch('analyse.boto3.client')
    def test_is_emergency_access_handles_api_errors(self, mock_boto_client):
        """Test emergency access handles API errors gracefully"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam
        mock_iam.list_user_tags.side_effect = Exception("AccessDenied")

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        result = auditor.is_emergency_access('User', 'test-user')

        assert result is False

    # =========================================================================
    # SERVICE-LINKED ROLE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_is_service_linked_role_identifies_correctly(self, mock_boto_client):
        """Test service-linked role identification"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_iam.get_role.return_value = {
            'Role': {'Path': '/aws-service-role/elasticloadbalancing.amazonaws.com/'}
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        result = auditor.is_service_linked_role('AWSServiceRoleForELB')

        assert result is True

    @patch('analyse.boto3.client')
    def test_is_service_linked_role_returns_false_for_normal_roles(self, mock_boto_client):
        """Test normal roles are not identified as service-linked"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_iam.get_role.return_value = {
            'Role': {'Path': '/'}
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        result = auditor.is_service_linked_role('CustomRole')

        assert result is False

    # =========================================================================
    # RISK SCORE CALCULATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_calculate_risk_score_for_each_severity(self, mock_boto_client):
        """Test risk score calculation for all severity levels"""
        auditor = IAMSecurityAuditor()

        assert auditor.calculate_risk_score('CRITICAL') == 9
        assert auditor.calculate_risk_score('HIGH') == 7
        assert auditor.calculate_risk_score('MEDIUM') == 5
        assert auditor.calculate_risk_score('LOW') == 3

    @patch('analyse.boto3.client')
    def test_calculate_risk_score_with_additional_factors(self, mock_boto_client):
        """Test risk score calculation with additional factors"""
        auditor = IAMSecurityAuditor()

        # Should cap at 10
        assert auditor.calculate_risk_score('CRITICAL', 5) == 10
        assert auditor.calculate_risk_score('HIGH', 2) == 9
        assert auditor.calculate_risk_score('MEDIUM', 3) == 8

    # =========================================================================
    # MFA COMPLIANCE AUDIT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_audit_mfa_compliance_detects_users_without_mfa(self, mock_boto_client):
        """Test MFA audit identifies users with console access but no MFA"""
        auditor = IAMSecurityAuditor()

        # Mock credential report
        with patch.object(auditor, 'get_credential_report') as mock_report:
            mock_report.return_value = [
                {
                    'user': 'user-no-mfa',
                    'password_enabled': 'true',
                    'mfa_active': 'false'
                },
                {
                    'user': 'user-with-mfa',
                    'password_enabled': 'true',
                    'mfa_active': 'true'
                }
            ]

            with patch.object(auditor, 'is_emergency_access', return_value=False):
                auditor.audit_mfa_compliance()

        # Should find one MFA issue
        assert len(auditor.findings) == 1
        assert auditor.findings[0]['principal_name'] == 'user-no-mfa'
        assert auditor.findings[0]['severity'] == 'HIGH'
        assert 'MFA' in auditor.findings[0]['issue_description']

    @patch('analyse.boto3.client')
    def test_audit_mfa_compliance_skips_emergency_users(self, mock_boto_client):
        """Test MFA audit skips users tagged with emergency access"""
        auditor = IAMSecurityAuditor()

        with patch.object(auditor, 'get_credential_report') as mock_report:
            mock_report.return_value = [
                {
                    'user': 'emergency-user',
                    'password_enabled': 'true',
                    'mfa_active': 'false'
                }
            ]

            # Emergency user should be skipped
            with patch.object(auditor, 'is_emergency_access', return_value=True):
                auditor.audit_mfa_compliance()

        # Should not find any issues
        assert len(auditor.findings) == 0

    # =========================================================================
    # ACCESS KEY AUDIT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_audit_access_keys_detects_old_keys(self, mock_boto_client):
        """Test access key audit identifies keys older than 90 days"""
        auditor = IAMSecurityAuditor()

        old_date = (datetime.now(timezone.utc) - timedelta(days=100)).isoformat()

        with patch.object(auditor, 'get_credential_report') as mock_report:
            mock_report.return_value = [
                {
                    'user': 'user-old-key',
                    'access_key_1_active': 'true',
                    'access_key_1_created': old_date,
                    'access_key_2_active': 'false'
                }
            ]

            with patch.object(auditor, 'is_emergency_access', return_value=False):
                auditor.audit_access_keys()

        # Should find old key issue
        assert len(auditor.findings) == 1
        assert auditor.findings[0]['principal_name'] == 'user-old-key'
        assert 'older than 90 days' in auditor.findings[0]['issue_description']

    @patch('analyse.boto3.client')
    def test_audit_access_keys_detects_multiple_active_keys(self, mock_boto_client):
        """Test access key audit identifies users with multiple active keys"""
        auditor = IAMSecurityAuditor()

        with patch.object(auditor, 'get_credential_report') as mock_report:
            mock_report.return_value = [
                {
                    'user': 'user-multiple-keys',
                    'access_key_1_active': 'true',
                    'access_key_1_created': 'N/A',
                    'access_key_2_active': 'true',
                    'access_key_2_created': 'N/A'
                }
            ]

            with patch.object(auditor, 'is_emergency_access', return_value=False):
                auditor.audit_access_keys()

        # Should find multiple keys issue
        assert len(auditor.findings) == 1
        assert 'multiple active access keys' in auditor.findings[0]['issue_description']

    # =========================================================================
    # ZOMBIE USER AUDIT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_audit_zombie_users_detects_inactive_users(self, mock_boto_client):
        """Test zombie user audit identifies users inactive for 90+ days"""
        auditor = IAMSecurityAuditor()

        old_date = (datetime.now(timezone.utc) - timedelta(days=100)).isoformat()

        with patch.object(auditor, 'get_credential_report') as mock_report:
            mock_report.return_value = [
                {
                    'user': 'zombie-user',
                    'password_last_used': old_date,
                    'access_key_1_last_used': 'N/A',
                    'access_key_2_last_used': 'N/A'
                }
            ]

            with patch.object(auditor, 'is_emergency_access', return_value=False):
                auditor.audit_zombie_users()

        # Should find zombie user
        assert len(auditor.findings) == 1
        assert auditor.findings[0]['principal_name'] == 'zombie-user'
        assert '90 days' in auditor.findings[0]['issue_description']

    # =========================================================================
    # PASSWORD POLICY AUDIT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_audit_password_policy_detects_missing_policy(self, mock_boto_client):
        """Test password policy audit detects missing policy"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        # Mock NoSuchEntityException
        from botocore.exceptions import ClientError
        mock_iam.exceptions.NoSuchEntityException = type('NoSuchEntityException', (ClientError,), {})
        mock_iam.get_account_password_policy.side_effect = mock_iam.exceptions.NoSuchEntityException(
            {'Error': {'Code': 'NoSuchEntity', 'Message': 'No policy'}},
            'GetAccountPasswordPolicy'
        )

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam
        auditor.audit_password_policy()

        # Should find critical issue
        assert len(auditor.findings) == 1
        assert auditor.findings[0]['severity'] == 'CRITICAL'
        assert 'No password policy' in auditor.findings[0]['issue_description']

    @patch('analyse.boto3.client')
    def test_audit_password_policy_detects_weak_policy(self, mock_boto_client):
        """Test password policy audit detects weak policies"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_iam.get_account_password_policy.return_value = {
            'PasswordPolicy': {
                'MinimumPasswordLength': 8,  # Less than 14
                'RequireSymbols': False,
                'RequireNumbers': False,
                'RequireUppercaseCharacters': False,
                'RequireLowercaseCharacters': False
            }
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam
        auditor.audit_password_policy()

        # Should find weak policy issues
        assert len(auditor.findings) == 1
        assert auditor.findings[0]['severity'] == 'HIGH'
        assert 'weakness' in auditor.findings[0]['issue_description']

    # =========================================================================
    # OVERPRIVILEGED USER AUDIT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_audit_overprivileged_users_detects_admin_access(self, mock_boto_client):
        """Test overprivileged user audit detects users with admin access"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        # Mock list_users pagination
        mock_paginator = MagicMock()
        mock_iam.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'Users': [{'UserName': 'admin-user'}]}
        ]

        # Mock attached policies
        mock_policy_paginator = MagicMock()
        def get_paginator_side_effect(operation):
            if operation == 'list_users':
                return mock_paginator
            elif operation == 'list_attached_user_policies':
                return mock_policy_paginator
            elif operation == 'list_attached_group_policies':
                return MagicMock()

        mock_iam.get_paginator.side_effect = get_paginator_side_effect
        mock_policy_paginator.paginate.return_value = [
            {'AttachedPolicies': [{'PolicyName': 'AdministratorAccess', 'PolicyArn': 'arn'}]}
        ]

        # Mock groups
        mock_iam.list_groups_for_user.return_value = {'Groups': []}

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        with patch.object(auditor, 'is_emergency_access', return_value=False):
            auditor.audit_overprivileged_users()

        # Should find overprivileged user
        assert len(auditor.findings) == 1
        assert auditor.findings[0]['severity'] == 'CRITICAL'
        assert 'AdministratorAccess' in auditor.findings[0]['issue_description']

    # =========================================================================
    # PRIVILEGE ESCALATION AUDIT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_privilege_escalation_detects_full_admin(self, mock_boto_client):
        """Test privilege escalation detection for wildcard actions"""
        auditor = IAMSecurityAuditor()

        policy_doc = {
            'Statement': [{
                'Effect': 'Allow',
                'Action': '*',
                'Resource': '*'
            }]
        }

        paths = auditor.check_privilege_escalation_in_policy(policy_doc)

        assert len(paths) == 1
        assert paths[0]['pattern'] == 'FullAdministrator'
        assert paths[0]['risk_score'] == 10

    @patch('analyse.boto3.client')
    def test_check_privilege_escalation_detects_iam_full_access(self, mock_boto_client):
        """Test privilege escalation detection for IAM:* actions"""
        auditor = IAMSecurityAuditor()

        policy_doc = {
            'Statement': [{
                'Effect': 'Allow',
                'Action': 'iam:*',
                'Resource': '*'
            }]
        }

        paths = auditor.check_privilege_escalation_in_policy(policy_doc)

        assert len(paths) == 1
        assert paths[0]['pattern'] == 'IAMFullAccess'
        assert paths[0]['risk_score'] == 10

    @patch('analyse.boto3.client')
    def test_check_privilege_escalation_detects_specific_patterns(self, mock_boto_client):
        """Test privilege escalation detection for specific dangerous combinations"""
        auditor = IAMSecurityAuditor()

        policy_doc = {
            'Statement': [{
                'Effect': 'Allow',
                'Action': ['iam:CreateUser', 'iam:AttachUserPolicy'],
                'Resource': '*'
            }]
        }

        paths = auditor.check_privilege_escalation_in_policy(policy_doc)

        assert len(paths) == 1
        assert paths[0]['pattern'] == 'CreateUserAndAttachPolicy'
        assert 'iam:CreateUser' in paths[0]['actions']
        assert 'iam:AttachUserPolicy' in paths[0]['actions']

    # =========================================================================
    # ROLE SESSION DURATION AUDIT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_audit_role_session_duration_detects_long_sessions(self, mock_boto_client):
        """Test role session audit detects sessions longer than 12 hours"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_paginator = MagicMock()
        mock_iam.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'Roles': [{'RoleName': 'LongSessionRole', 'CreateDate': datetime.now(timezone.utc)}]}
        ]

        # Role with 24 hour session (86400 seconds)
        mock_iam.get_role.return_value = {
            'Role': {'MaxSessionDuration': 86400}
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        with patch.object(auditor, 'is_service_linked_role', return_value=False):
            with patch.object(auditor, 'is_emergency_access', return_value=False):
                auditor.audit_role_session_duration()

        # Should find long session issue
        assert len(auditor.findings) == 1
        assert '24 hours' in auditor.findings[0]['issue_description']
        assert auditor.findings[0]['severity'] == 'MEDIUM'

    # =========================================================================
    # TRUST POLICY AUDIT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_audit_trust_policies_detects_missing_external_id(self, mock_boto_client):
        """Test trust policy audit detects missing ExternalId for cross-account access"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_paginator = MagicMock()
        mock_iam.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {
                'Roles': [{
                    'RoleName': 'CrossAccountRole',
                    'AssumeRolePolicyDocument': {
                        'Statement': [{
                            'Effect': 'Allow',
                            'Principal': {'AWS': 'arn:aws:iam::123456789012:root'},
                            'Action': 'sts:AssumeRole'
                        }]
                    }
                }]
            }
        ]

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        with patch.object(auditor, 'is_service_linked_role', return_value=False):
            with patch.object(auditor, 'is_emergency_access', return_value=False):
                auditor.audit_trust_policies()

        # Should find missing ExternalId issue
        assert len(auditor.findings) == 1
        assert 'ExternalId' in auditor.findings[0]['issue_description']
        assert auditor.findings[0]['severity'] == 'HIGH'

    # =========================================================================
    # S3 CROSS-ACCOUNT AUDIT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_audit_s3_cross_account_detects_open_buckets(self, mock_boto_client):
        """Test S3 audit detects buckets with unrestricted cross-account access"""
        mock_s3 = MagicMock()

        def client_side_effect(service, **kwargs):
            if service == 's3':
                return mock_s3
            return MagicMock()

        mock_boto_client.side_effect = client_side_effect

        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'open-bucket'}]
        }

        bucket_policy = {
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'AWS': '*'},
                'Action': 's3:GetObject',
                'Resource': 'arn:aws:s3:::open-bucket/*'
            }]
        }

        mock_s3.get_bucket_policy.return_value = {
            'Policy': json.dumps(bucket_policy)
        }

        auditor = IAMSecurityAuditor()
        auditor.s3 = mock_s3
        auditor.audit_s3_cross_account()

        # Should find open bucket issue
        assert len(auditor.findings) == 1
        assert auditor.findings[0]['principal_type'] == 'S3Bucket'
        assert auditor.findings[0]['severity'] == 'CRITICAL'

    # =========================================================================
    # ZOMBIE ROLE AUDIT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_audit_zombie_roles_detects_unused_roles(self, mock_boto_client):
        """Test zombie role audit identifies roles not used in 90+ days"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        old_date = datetime.now(timezone.utc) - timedelta(days=100)

        mock_paginator = MagicMock()
        mock_iam.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'Roles': [{'RoleName': 'ZombieRole', 'CreateDate': old_date}]}
        ]

        # Role with no LastUsedDate
        mock_iam.get_role.return_value = {
            'Role': {'RoleLastUsed': {}}
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        with patch.object(auditor, 'is_service_linked_role', return_value=False):
            with patch.object(auditor, 'is_emergency_access', return_value=False):
                auditor.audit_zombie_roles()

        # Should find zombie role
        assert len(auditor.findings) == 1
        assert auditor.findings[0]['principal_name'] == 'ZombieRole'
        assert '90 days' in auditor.findings[0]['issue_description']

    # =========================================================================
    # INLINE POLICY AUDIT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_audit_inline_policies_detects_mixed_policies(self, mock_boto_client):
        """Test inline policy audit detects users with both inline and managed policies"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_user_paginator = MagicMock()
        mock_policy_paginator = MagicMock()
        mock_role_paginator = MagicMock()

        def get_paginator_side_effect(operation):
            if operation == 'list_users':
                return mock_user_paginator
            elif operation == 'list_attached_user_policies':
                return mock_policy_paginator
            elif operation == 'list_roles':
                return mock_role_paginator
            elif operation == 'list_attached_role_policies':
                return MagicMock()
            return MagicMock()

        mock_iam.get_paginator.side_effect = get_paginator_side_effect

        mock_user_paginator.paginate.return_value = [
            {'Users': [{'UserName': 'mixed-policy-user'}]}
        ]

        # Has inline policies
        mock_iam.list_user_policies.return_value = {'PolicyNames': ['InlinePolicy1']}

        # Has managed policies
        mock_policy_paginator.paginate.return_value = [
            {'AttachedPolicies': [{'PolicyName': 'ManagedPolicy1'}]}
        ]

        # Mock empty roles to avoid further processing
        mock_role_paginator.paginate.return_value = [{'Roles': []}]
        mock_iam.list_role_policies.return_value = {'PolicyNames': []}

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        with patch.object(auditor, 'is_emergency_access', return_value=False):
            with patch.object(auditor, 'is_service_linked_role', return_value=False):
                auditor.audit_inline_policies()

        # Should find mixed policy issue
        assert len(auditor.findings) == 1
        assert 'inline' in auditor.findings[0]['issue_description']
        assert 'managed' in auditor.findings[0]['issue_description']

    # =========================================================================
    # FULL AUDIT WORKFLOW TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_run_full_audit_executes_all_checks(self, mock_boto_client):
        """Test run_full_audit executes all 12 audit checks"""
        auditor = IAMSecurityAuditor()

        # Mock all audit methods
        methods = [
            'audit_mfa_compliance',
            'audit_access_keys',
            'audit_zombie_users',
            'audit_password_policy',
            'audit_overprivileged_users',
            'audit_dangerous_policies',
            'audit_role_session_duration',
            'audit_privilege_escalation',
            'audit_trust_policies',
            'audit_s3_cross_account',
            'audit_zombie_roles',
            'audit_inline_policies'
        ]

        for method in methods:
            setattr(auditor, method, MagicMock())

        auditor.run_full_audit()

        # Verify all methods were called
        for method in methods:
            getattr(auditor, method).assert_called_once()

    @patch('analyse.boto3.client')
    def test_run_full_audit_sorts_findings_by_risk_score(self, mock_boto_client):
        """Test run_full_audit sorts findings by risk score in descending order"""
        auditor = IAMSecurityAuditor()

        # Add unsorted findings
        auditor.findings = [
            {'risk_score': 5, 'issue': 'Medium'},
            {'risk_score': 10, 'issue': 'Critical'},
            {'risk_score': 3, 'issue': 'Low'},
            {'risk_score': 8, 'issue': 'High'}
        ]

        # Mock all audit methods to do nothing
        with patch.object(auditor, 'audit_mfa_compliance'):
            with patch.object(auditor, 'audit_access_keys'):
                with patch.object(auditor, 'audit_zombie_users'):
                    with patch.object(auditor, 'audit_password_policy'):
                        with patch.object(auditor, 'audit_overprivileged_users'):
                            with patch.object(auditor, 'audit_dangerous_policies'):
                                with patch.object(auditor, 'audit_role_session_duration'):
                                    with patch.object(auditor, 'audit_privilege_escalation'):
                                        with patch.object(auditor, 'audit_trust_policies'):
                                            with patch.object(auditor, 'audit_s3_cross_account'):
                                                with patch.object(auditor, 'audit_zombie_roles'):
                                                    with patch.object(auditor, 'audit_inline_policies'):
                                                        auditor.run_full_audit()

        # Verify findings are sorted by risk score descending
        assert auditor.findings[0]['risk_score'] == 10
        assert auditor.findings[1]['risk_score'] == 8
        assert auditor.findings[2]['risk_score'] == 5
        assert auditor.findings[3]['risk_score'] == 3

    # =========================================================================
    # REPORT GENERATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.open', new_callable=mock_open)
    @patch('json.dump')
    def test_generate_reports_creates_json_files(self, mock_json_dump, mock_file, mock_boto_client):
        """Test generate_reports creates both JSON output files"""
        auditor = IAMSecurityAuditor()
        auditor.findings = [
            {'severity': 'HIGH', 'risk_score': 8, 'issue': 'test'}
        ]
        auditor.privilege_escalation_paths = []
        auditor.remediation_recommendations = []

        with patch.object(auditor, 'print_console_summary'):
            auditor.generate_reports()

        # Verify both files were opened
        assert mock_file.call_count == 2
        calls = [call[0][0] for call in mock_file.call_args_list]
        assert 'iam_security_audit.json' in calls
        assert 'least_privilege_recommendations.json' in calls

        # Verify JSON was dumped twice
        assert mock_json_dump.call_count == 2

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_print_console_summary_outputs_tabulate_table(self, mock_print, mock_boto_client):
        """Test print_console_summary outputs findings in tabulate format"""
        auditor = IAMSecurityAuditor()
        auditor.findings = [
            {
                'risk_score': 10,
                'severity': 'CRITICAL',
                'principal_type': 'User',
                'principal_name': 'admin-user',
                'issue_description': 'User has dangerous policies'
            },
            {
                'risk_score': 7,
                'severity': 'HIGH',
                'principal_type': 'Role',
                'principal_name': 'risky-role',
                'issue_description': 'Role has excessive permissions'
            }
        ]
        auditor.privilege_escalation_paths = []

        auditor.print_console_summary()

        # Verify print was called with table-like output
        assert mock_print.called
        output = ' '.join([str(call[0][0]) for call in mock_print.call_args_list])

        # Check for table elements
        assert 'Risk Score' in output or 'SUMMARY' in output
        assert 'Severity' in output or 'Total Findings' in output

    # =========================================================================
    # MAIN FUNCTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_main_function_executes_successfully(self, mock_boto_client):
        """Test main() function runs audit and generates reports"""
        from analyse import main

        with patch('analyse.IAMSecurityAuditor') as MockAuditor:
            mock_instance = MockAuditor.return_value
            mock_instance.run_full_audit.return_value = ([], [])
            mock_instance.generate_reports.return_value = None

            try:
                main()
            except SystemExit:
                pass  # main() may not return, might call sys.exit

            mock_instance.run_full_audit.assert_called_once()
            mock_instance.generate_reports.assert_called_once()

    # =========================================================================
    # EDGE CASE AND ERROR HANDLING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_audit_handles_empty_responses_gracefully(self, mock_boto_client):
        """Test audit methods handle empty AWS responses without errors"""
        auditor = IAMSecurityAuditor()

        with patch.object(auditor, 'get_credential_report', return_value=[]):
            # Should not raise exception
            auditor.audit_mfa_compliance()
            auditor.audit_access_keys()
            auditor.audit_zombie_users()

        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_privilege_escalation_patterns_are_comprehensive(self, mock_boto_client):
        """Test privilege escalation patterns cover all major vectors"""
        # Verify we have patterns for critical escalation vectors
        pattern_names = [p['name'] for p in PRIVILEGE_ESCALATION_PATTERNS]

        assert 'CreateUserAndAttachPolicy' in pattern_names
        assert 'CreateAccessKeyForAnyUser' in pattern_names
        assert 'UpdateAssumeRolePolicy' in pattern_names
        assert 'PassRoleAndLambda' in pattern_names
        assert 'PassRoleAndEC2' in pattern_names

        # All patterns should have required fields
        for pattern in PRIVILEGE_ESCALATION_PATTERNS:
            assert 'name' in pattern
            assert 'actions' in pattern
            assert 'description' in pattern
            assert 'risk_score' in pattern
            assert isinstance(pattern['actions'], list)
            assert len(pattern['actions']) > 0

    # =========================================================================
    # ADDITIONAL COVERAGE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_audit_dangerous_policies_handles_string_actions(self, mock_boto_client):
        """Test dangerous policy audit handles actions as string"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_paginator = MagicMock()
        mock_iam.get_paginator.return_value = mock_paginator

        # Policy with string action instead of list
        mock_paginator.paginate.return_value = [
            {
                'Policies': [{
                    'PolicyName': 'StringActionPolicy',
                    'Arn': 'arn:aws:iam::123456789012:policy/test',
                    'DefaultVersionId': 'v1'
                }]
            }
        ]

        mock_iam.get_policy_version.return_value = {
            'PolicyVersion': {
                'Document': {
                    'Statement': [{
                        'Effect': 'Allow',
                        'Action': 'ec2:CreateInstances',  # String instead of list
                        'Resource': '*'
                    }]
                }
            }
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam
        auditor.audit_dangerous_policies()

        # Should handle string action without error
        assert len(auditor.findings) == 1

    @patch('analyse.boto3.client')
    def test_audit_dangerous_policies_with_conditions(self, mock_boto_client):
        """Test dangerous policy audit skips policies with conditions"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_paginator = MagicMock()
        mock_iam.get_paginator.return_value = mock_paginator

        mock_paginator.paginate.return_value = [
            {
                'Policies': [{
                    'PolicyName': 'ConditionalPolicy',
                    'Arn': 'arn:aws:iam::123456789012:policy/test',
                    'DefaultVersionId': 'v1'
                }]
            }
        ]

        mock_iam.get_policy_version.return_value = {
            'PolicyVersion': {
                'Document': {
                    'Statement': [{
                        'Effect': 'Allow',
                        'Action': ['ec2:CreateInstances'],
                        'Resource': '*',
                        'Condition': {'StringEquals': {'aws:RequestedRegion': 'us-east-1'}}
                    }]
                }
            }
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam
        auditor.audit_dangerous_policies()

        # Should not flag policies with conditions
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_s3_handles_no_bucket_policy_exception(self, mock_boto_client):
        """Test S3 audit handles buckets without policies gracefully"""
        mock_s3 = MagicMock()

        def client_side_effect(service, **kwargs):
            if service == 's3':
                return mock_s3
            return MagicMock()

        mock_boto_client.side_effect = client_side_effect

        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'no-policy-bucket'}]
        }

        # Mock NoSuchBucketPolicy exception
        mock_s3.exceptions.NoSuchBucketPolicy = type('NoSuchBucketPolicy', (Exception,), {})
        mock_s3.get_bucket_policy.side_effect = mock_s3.exceptions.NoSuchBucketPolicy()

        auditor = IAMSecurityAuditor()
        auditor.s3 = mock_s3
        auditor.audit_s3_cross_account()

        # Should handle exception and continue
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_s3_handles_list_buckets_error(self, mock_boto_client):
        """Test S3 audit handles errors listing buckets"""
        mock_s3 = MagicMock()

        def client_side_effect(service, **kwargs):
            if service == 's3':
                return mock_s3
            return MagicMock()

        mock_boto_client.side_effect = client_side_effect

        mock_s3.list_buckets.side_effect = Exception("AccessDenied")

        auditor = IAMSecurityAuditor()
        auditor.s3 = mock_s3
        auditor.audit_s3_cross_account()

        # Should handle exception gracefully
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_check_privilege_escalation_handles_string_action(self, mock_boto_client):
        """Test privilege escalation check handles single string action"""
        auditor = IAMSecurityAuditor()

        policy_doc = {
            'Statement': [{
                'Effect': 'Allow',
                'Action': 'iam:CreateAccessKey',  # String instead of list
                'Resource': '*'
            }]
        }

        paths = auditor.check_privilege_escalation_in_policy(policy_doc)

        # Should handle string action and detect pattern
        assert len(paths) == 1
        assert paths[0]['pattern'] == 'CreateAccessKeyForAnyUser'

    @patch('analyse.boto3.client')
    def test_check_privilege_escalation_requires_resource_wildcard(self, mock_boto_client):
        """Test privilege escalation patterns with resource requirements"""
        auditor = IAMSecurityAuditor()

        # Pattern requires Resource: "*" but policy has specific resource
        policy_doc = {
            'Statement': [{
                'Effect': 'Allow',
                'Action': ['iam:CreateAccessKey'],
                'Resource': 'arn:aws:iam::123456789012:user/specific-user'
            }]
        }

        paths = auditor.check_privilege_escalation_in_policy(policy_doc)

        # Should not detect pattern without resource wildcard
        assert len(paths) == 0

    @patch('analyse.boto3.client')
    def test_check_privilege_escalation_handles_deny_statements(self, mock_boto_client):
        """Test privilege escalation skips Deny statements"""
        auditor = IAMSecurityAuditor()

        policy_doc = {
            'Statement': [{
                'Effect': 'Deny',
                'Action': '*',
                'Resource': '*'
            }]
        }

        paths = auditor.check_privilege_escalation_in_policy(policy_doc)

        # Should skip Deny statements
        assert len(paths) == 0

    @patch('analyse.boto3.client')
    def test_audit_trust_policies_handles_string_principal(self, mock_boto_client):
        """Test trust policy audit handles AWS principal as string"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_paginator = MagicMock()
        mock_iam.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {
                'Roles': [{
                    'RoleName': 'StringPrincipalRole',
                    'AssumeRolePolicyDocument': {
                        'Statement': [{
                            'Effect': 'Allow',
                            'Principal': {'AWS': 'arn:aws:iam::999888777666:root'},  # String
                            'Action': 'sts:AssumeRole'
                        }]
                    }
                }]
            }
        ]

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        with patch.object(auditor, 'is_service_linked_role', return_value=False):
            with patch.object(auditor, 'is_emergency_access', return_value=False):
                auditor.audit_trust_policies()

        # Should detect missing ExternalId for string principal
        assert len(auditor.findings) == 1

    @patch('analyse.boto3.client')
    def test_audit_trust_policies_with_external_id(self, mock_boto_client):
        """Test trust policy audit allows cross-account with ExternalId"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_paginator = MagicMock()
        mock_iam.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {
                'Roles': [{
                    'RoleName': 'SecureRole',
                    'AssumeRolePolicyDocument': {
                        'Statement': [{
                            'Effect': 'Allow',
                            'Principal': {'AWS': 'arn:aws:iam::123456789012:root'},
                            'Action': 'sts:AssumeRole',
                            'Condition': {
                                'StringEquals': {
                                    'sts:ExternalId': 'secure-external-id-12345'
                                }
                            }
                        }]
                    }
                }]
            }
        ]

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        with patch.object(auditor, 'is_service_linked_role', return_value=False):
            with patch.object(auditor, 'is_emergency_access', return_value=False):
                auditor.audit_trust_policies()

        # Should not flag when ExternalId is present
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_access_keys_skips_root_account(self, mock_boto_client):
        """Test access key audit skips root account"""
        auditor = IAMSecurityAuditor()

        with patch.object(auditor, 'get_credential_report') as mock_report:
            mock_report.return_value = [
                {
                    'user': '<root_account>',
                    'access_key_1_active': 'true',
                    'access_key_1_created': '2020-01-01T00:00:00+00:00',
                    'access_key_2_active': 'false'
                }
            ]

            auditor.audit_access_keys()

        # Should not flag root account
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_zombie_users_skips_root_account(self, mock_boto_client):
        """Test zombie user audit skips root account"""
        auditor = IAMSecurityAuditor()

        old_date = (datetime.now(timezone.utc) - timedelta(days=100)).isoformat()

        with patch.object(auditor, 'get_credential_report') as mock_report:
            mock_report.return_value = [
                {
                    'user': '<root_account>',
                    'password_last_used': old_date,
                    'access_key_1_last_used': 'N/A',
                    'access_key_2_last_used': 'N/A'
                }
            ]

            auditor.audit_zombie_users()

        # Should not flag root account
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_mfa_skips_root_account(self, mock_boto_client):
        """Test MFA audit skips root account"""
        auditor = IAMSecurityAuditor()

        with patch.object(auditor, 'get_credential_report') as mock_report:
            mock_report.return_value = [
                {
                    'user': '<root_account>',
                    'password_enabled': 'true',
                    'mfa_active': 'false'
                }
            ]

            auditor.audit_mfa_compliance()

        # Should not flag root account
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_generate_reports_includes_all_required_fields(self, mock_boto_client):
        """Test generated report contains all required fields"""
        auditor = IAMSecurityAuditor()
        auditor.findings = [
            {'severity': 'CRITICAL', 'risk_score': 10},
            {'severity': 'HIGH', 'risk_score': 8},
            {'severity': 'MEDIUM', 'risk_score': 5}
        ]
        auditor.privilege_escalation_paths = [{'pattern': 'test'}]
        auditor.remediation_recommendations = [{'principal_name': 'test'}]

        report_data = None

        def capture_json_dump(data, file, **kwargs):
            nonlocal report_data
            if 'audit_timestamp' in data:
                report_data = data

        with patch('builtins.open', mock_open()):
            with patch('json.dump', side_effect=capture_json_dump):
                with patch.object(auditor, 'print_console_summary'):
                    auditor.generate_reports()

        # Verify report structure
        assert report_data is not None
        assert 'audit_timestamp' in report_data
        assert 'region' in report_data
        assert 'total_findings' in report_data
        assert report_data['total_findings'] == 3
        assert 'findings_by_severity' in report_data
        assert report_data['findings_by_severity']['CRITICAL'] == 1
        assert report_data['findings_by_severity']['HIGH'] == 1
        assert report_data['findings_by_severity']['MEDIUM'] == 1

    @patch('analyse.boto3.client')
    def test_audit_overprivileged_users_checks_group_policies(self, mock_boto_client):
        """Test overprivileged user audit checks policies via group membership"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_user_paginator = MagicMock()
        mock_iam.get_paginator.return_value = mock_user_paginator
        mock_user_paginator.paginate.return_value = [
            {'Users': [{'UserName': 'group-admin'}]}
        ]

        # Mock no direct policies
        mock_policy_paginator = MagicMock()
        def get_paginator_side_effect(operation):
            if operation == 'list_users':
                return mock_user_paginator
            elif operation == 'list_attached_user_policies':
                return mock_policy_paginator
            elif operation == 'list_attached_group_policies':
                group_paginator = MagicMock()
                group_paginator.paginate.return_value = [
                    {'AttachedPolicies': [{'PolicyName': 'AdministratorAccess', 'PolicyArn': 'arn'}]}
                ]
                return group_paginator

        mock_iam.get_paginator.side_effect = get_paginator_side_effect
        mock_policy_paginator.paginate.return_value = [{'AttachedPolicies': []}]

        # User is in admin group
        mock_iam.list_groups_for_user.return_value = {
            'Groups': [{'GroupName': 'AdminGroup'}]
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        with patch.object(auditor, 'is_emergency_access', return_value=False):
            auditor.audit_overprivileged_users()

        # Should detect admin access via group
        assert len(auditor.findings) == 1
        assert 'AdminGroup' in auditor.findings[0]['issue_description']

    @patch('analyse.boto3.client')
    def test_audit_privilege_escalation_full_workflow_users(self, mock_boto_client):
        """Test full privilege escalation audit workflow for users"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        # Mock user pagination
        mock_user_paginator = MagicMock()
        mock_role_paginator = MagicMock()
        mock_policy_paginator = MagicMock()

        def get_paginator_side_effect(operation):
            if operation == 'list_users':
                return mock_user_paginator
            elif operation == 'list_roles':
                return mock_role_paginator
            elif operation == 'list_policies':
                return mock_policy_paginator
            return MagicMock()

        mock_iam.get_paginator.side_effect = get_paginator_side_effect

        mock_user_paginator.paginate.return_value = [
            {'Users': [{'UserName': 'priv-esc-user'}]}
        ]

        # User has inline policy with priv esc
        mock_iam.list_user_policies.return_value = {'PolicyNames': ['DangerousPolicy']}
        mock_iam.get_user_policy.return_value = {
            'PolicyDocument': {
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': ['iam:CreateUser', 'iam:AttachUserPolicy'],
                    'Resource': '*'
                }]
            }
        }

        # Empty roles and policies
        mock_role_paginator.paginate.return_value = [{'Roles': []}]
        mock_policy_paginator.paginate.return_value = [{'Policies': []}]
        mock_iam.list_role_policies.return_value = {'PolicyNames': []}

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        with patch.object(auditor, 'is_emergency_access', return_value=False):
            with patch.object(auditor, 'is_service_linked_role', return_value=False):
                auditor.audit_privilege_escalation()

        # Should find privilege escalation in user policy
        assert len(auditor.findings) == 1
        assert auditor.findings[0]['severity'] == 'CRITICAL'
        assert len(auditor.privilege_escalation_paths) == 1
        assert auditor.privilege_escalation_paths[0]['escalation_pattern'] == 'CreateUserAndAttachPolicy'

    @patch('analyse.boto3.client')
    def test_audit_privilege_escalation_in_roles(self, mock_boto_client):
        """Test privilege escalation detection in role inline policies"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_user_paginator = MagicMock()
        mock_role_paginator = MagicMock()
        mock_policy_paginator = MagicMock()

        def get_paginator_side_effect(operation):
            if operation == 'list_users':
                return mock_user_paginator
            elif operation == 'list_roles':
                return mock_role_paginator
            elif operation == 'list_policies':
                return mock_policy_paginator

        mock_iam.get_paginator.side_effect = get_paginator_side_effect

        # Empty users
        mock_user_paginator.paginate.return_value = [{'Users': []}]
        mock_iam.list_user_policies.return_value = {'PolicyNames': []}

        # Role with privilege escalation
        mock_role_paginator.paginate.return_value = [
            {'Roles': [{'RoleName': 'EscalationRole'}]}
        ]
        mock_iam.list_role_policies.return_value = {'PolicyNames': ['EscPolicy']}
        mock_iam.get_role_policy.return_value = {
            'PolicyDocument': {
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': ['iam:PassRole', 'lambda:CreateFunction', 'lambda:InvokeFunction'],
                    'Resource': '*'
                }]
            }
        }

        # Empty managed policies
        mock_policy_paginator.paginate.return_value = [{'Policies': []}]

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        with patch.object(auditor, 'is_emergency_access', return_value=False):
            with patch.object(auditor, 'is_service_linked_role', return_value=False):
                auditor.audit_privilege_escalation()

        # Should find PassRoleAndLambda escalation
        assert len(auditor.findings) == 1
        assert len(auditor.privilege_escalation_paths) == 1
        assert auditor.privilege_escalation_paths[0]['escalation_pattern'] == 'PassRoleAndLambda'

    @patch('analyse.boto3.client')
    def test_audit_privilege_escalation_in_managed_policies(self, mock_boto_client):
        """Test privilege escalation detection in managed policies"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_user_paginator = MagicMock()
        mock_role_paginator = MagicMock()
        mock_policy_paginator = MagicMock()

        def get_paginator_side_effect(operation):
            if operation == 'list_users':
                return mock_user_paginator
            elif operation == 'list_roles':
                return mock_role_paginator
            elif operation == 'list_policies':
                return mock_policy_paginator

        mock_iam.get_paginator.side_effect = get_paginator_side_effect

        # Empty users and roles
        mock_user_paginator.paginate.return_value = [{'Users': []}]
        mock_iam.list_user_policies.return_value = {'PolicyNames': []}
        mock_role_paginator.paginate.return_value = [{'Roles': []}]
        mock_iam.list_role_policies.return_value = {'PolicyNames': []}

        # Managed policy with escalation
        mock_policy_paginator.paginate.return_value = [
            {
                'Policies': [{
                    'PolicyName': 'ManagedEscPolicy',
                    'Arn': 'arn:aws:iam::123456789012:policy/test',
                    'DefaultVersionId': 'v1'
                }]
            }
        ]
        mock_iam.get_policy_version.return_value = {
            'PolicyVersion': {
                'Document': {
                    'Statement': [{
                        'Effect': 'Allow',
                        'Action': ['iam:UpdateAssumeRolePolicy'],
                        'Resource': '*'
                    }]
                }
            }
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        with patch.object(auditor, 'is_emergency_access', return_value=False):
            with patch.object(auditor, 'is_service_linked_role', return_value=False):
                auditor.audit_privilege_escalation()

        # Should find UpdateAssumeRolePolicy escalation
        assert len(auditor.findings) == 1
        assert len(auditor.privilege_escalation_paths) == 1
        assert auditor.privilege_escalation_paths[0]['escalation_pattern'] == 'UpdateAssumeRolePolicy'

    @patch('analyse.boto3.client')
    def test_audit_inline_policies_for_roles(self, mock_boto_client):
        """Test inline policy audit for roles with mixed policies"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_user_paginator = MagicMock()
        mock_role_paginator = MagicMock()
        mock_attached_paginator = MagicMock()

        def get_paginator_side_effect(operation):
            if operation == 'list_users':
                return mock_user_paginator
            elif operation == 'list_roles':
                return mock_role_paginator
            elif operation == 'list_attached_role_policies':
                return mock_attached_paginator
            return MagicMock()

        mock_iam.get_paginator.side_effect = get_paginator_side_effect

        # Empty users
        mock_user_paginator.paginate.return_value = [{'Users': []}]
        mock_iam.list_user_policies.return_value = {'PolicyNames': []}

        # Role with mixed policies
        mock_role_paginator.paginate.return_value = [
            {'Roles': [{'RoleName': 'MixedRole'}]}
        ]
        mock_iam.list_role_policies.return_value = {'PolicyNames': ['InlinePolicy']}
        mock_attached_paginator.paginate.return_value = [
            {'AttachedPolicies': [{'PolicyName': 'ManagedPolicy'}]}
        ]

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        with patch.object(auditor, 'is_emergency_access', return_value=False):
            with patch.object(auditor, 'is_service_linked_role', return_value=False):
                auditor.audit_inline_policies()

        # Should detect mixed policies in role
        assert len(auditor.findings) == 1
        assert 'MixedRole' in auditor.findings[0]['principal_name']

    @patch('analyse.boto3.client')
    def test_audit_zombie_roles_with_last_used_date(self, mock_boto_client):
        """Test zombie role detection when LastUsedDate is old"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        old_date = datetime.now(timezone.utc) - timedelta(days=100)
        very_old_date = datetime.now(timezone.utc) - timedelta(days=200)

        mock_paginator = MagicMock()
        mock_iam.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'Roles': [{'RoleName': 'OldUsedRole', 'CreateDate': very_old_date}]}
        ]

        # Role with old LastUsedDate
        mock_iam.get_role.return_value = {
            'Role': {
                'RoleLastUsed': {
                    'LastUsedDate': old_date
                }
            }
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam

        with patch.object(auditor, 'is_service_linked_role', return_value=False):
            with patch.object(auditor, 'is_emergency_access', return_value=False):
                auditor.audit_zombie_roles()

        # Should find zombie role with old usage
        assert len(auditor.findings) == 1

    @patch('analyse.boto3.client')
    def test_audit_password_policy_with_max_age(self, mock_boto_client):
        """Test password policy with MaxPasswordAge set"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        # Policy with good settings
        mock_iam.get_account_password_policy.return_value = {
            'PasswordPolicy': {
                'MinimumPasswordLength': 16,
                'RequireSymbols': True,
                'RequireNumbers': True,
                'RequireUppercaseCharacters': True,
                'RequireLowercaseCharacters': True,
                'MaxPasswordAge': 90
            }
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam
        auditor.audit_password_policy()

        # Should not find issues with good policy
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_s3_with_condition_in_policy(self, mock_boto_client):
        """Test S3 audit allows wildcard principal with conditions"""
        mock_s3 = MagicMock()

        def client_side_effect(service, **kwargs):
            if service == 's3':
                return mock_s3
            return MagicMock()

        mock_boto_client.side_effect = client_side_effect

        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'conditional-bucket'}]
        }

        bucket_policy = {
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'AWS': '*'},
                'Action': 's3:GetObject',
                'Resource': 'arn:aws:s3:::conditional-bucket/*',
                'Condition': {
                    'StringEquals': {
                        'aws:SourceAccount': '123456789012'
                    }
                }
            }]
        }

        mock_s3.get_bucket_policy.return_value = {
            'Policy': json.dumps(bucket_policy)
        }

        auditor = IAMSecurityAuditor()
        auditor.s3 = mock_s3
        auditor.audit_s3_cross_account()

        # Should not flag bucket with conditions
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_s3_with_non_dict_principal(self, mock_boto_client):
        """Test S3 audit handles non-dict Principal"""
        mock_s3 = MagicMock()

        def client_side_effect(service, **kwargs):
            if service == 's3':
                return mock_s3
            return MagicMock()

        mock_boto_client.side_effect = client_side_effect

        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'string-principal-bucket'}]
        }

        bucket_policy = {
            'Statement': [{
                'Effect': 'Allow',
                'Principal': '*',  # String instead of dict
                'Action': 's3:GetObject',
                'Resource': 'arn:aws:s3:::string-principal-bucket/*'
            }]
        }

        mock_s3.get_bucket_policy.return_value = {
            'Policy': json.dumps(bucket_policy)
        }

        auditor = IAMSecurityAuditor()
        auditor.s3 = mock_s3
        auditor.audit_s3_cross_account()

        # Should handle string principal gracefully (not flag as cross-account)
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_report_privilege_escalation_creates_remediation(self, mock_boto_client):
        """Test report_privilege_escalation adds remediation recommendation"""
        auditor = IAMSecurityAuditor()

        escalation_paths = [{
            'pattern': 'CreateUserAndAttachPolicy',
            'description': 'Can create users',
            'actions': ['iam:CreateUser', 'iam:AttachUserPolicy'],
            'risk_score': 10
        }]

        auditor.report_privilege_escalation(
            'User', 'test-user', 'TestPolicy', 'inline', escalation_paths
        )

        # Should create finding and remediation
        assert len(auditor.findings) == 1
        assert len(auditor.privilege_escalation_paths) == 1
        assert len(auditor.remediation_recommendations) == 1
        assert auditor.remediation_recommendations[0]['issue_type'] == 'privilege_escalation'

    @patch('analyse.boto3.client')
    def test_audit_zombie_users_with_no_password_usage(self, mock_boto_client):
        """Test zombie user detection when password_last_used is N/A"""
        auditor = IAMSecurityAuditor()

        with patch.object(auditor, 'get_credential_report') as mock_report:
            mock_report.return_value = [
                {
                    'user': 'never-logged-in',
                    'password_last_used': 'N/A',
                    'access_key_1_last_used': 'N/A',
                    'access_key_2_last_used': 'N/A'
                }
            ]

            with patch.object(auditor, 'is_emergency_access', return_value=False):
                auditor.audit_zombie_users()

        # Should find zombie user with no usage history
        assert len(auditor.findings) == 1

    @patch('analyse.boto3.client')
    def test_audit_access_keys_with_n_a_created_date(self, mock_boto_client):
        """Test access key audit handles N/A created date"""
        auditor = IAMSecurityAuditor()

        with patch.object(auditor, 'get_credential_report') as mock_report:
            mock_report.return_value = [
                {
                    'user': 'user-na-key',
                    'access_key_1_active': 'true',
                    'access_key_1_created': 'N/A',
                    'access_key_2_active': 'false'
                }
            ]

            with patch.object(auditor, 'is_emergency_access', return_value=False):
                auditor.audit_access_keys()

        # Should handle N/A gracefully, no findings
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_dangerous_policies_with_string_resource(self, mock_boto_client):
        """Test dangerous policy audit handles Resource as string"""
        mock_iam = MagicMock()
        mock_boto_client.return_value = mock_iam

        mock_paginator = MagicMock()
        mock_iam.get_paginator.return_value = mock_paginator

        mock_paginator.paginate.return_value = [
            {
                'Policies': [{
                    'PolicyName': 'StringResourcePolicy',
                    'Arn': 'arn:aws:iam::123456789012:policy/test',
                    'DefaultVersionId': 'v1'
                }]
            }
        ]

        mock_iam.get_policy_version.return_value = {
            'PolicyVersion': {
                'Document': {
                    'Statement': [{
                        'Effect': 'Allow',
                        'Action': ['ec2:CreateInstances'],
                        'Resource': '*'  # String instead of list
                    }]
                }
            }
        }

        auditor = IAMSecurityAuditor()
        auditor.iam = mock_iam
        auditor.audit_dangerous_policies()

        # Should handle string resource and flag it
        assert len(auditor.findings) == 1

    @patch('analyse.boto3.client')
    def test_check_privilege_escalation_with_string_resource(self, mock_boto_client):
        """Test privilege escalation check with Resource as string"""
        auditor = IAMSecurityAuditor()

        policy_doc = {
            'Statement': [{
                'Effect': 'Allow',
                'Action': ['iam:CreateAccessKey'],
                'Resource': '*'  # String instead of list
            }]
        }

        paths = auditor.check_privilege_escalation_in_policy(policy_doc)

        # Should handle string Resource and detect escalation
        assert len(paths) == 1
        assert paths[0]['pattern'] == 'CreateAccessKeyForAnyUser'

    @patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5000'})
    @patch('analyse.boto3.client')
    def test_initialization_with_endpoint_url(self, mock_boto_client):
        """Test that AWS_ENDPOINT_URL environment variable is used"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        auditor = IAMSecurityAuditor()

        # Verify endpoint_url was passed to boto3 clients
        calls = mock_boto_client.call_args_list
        assert len(calls) == 2
        for call in calls:
            assert 'endpoint_url' in call[1]
            assert call[1]['endpoint_url'] == 'http://localhost:5000'

    @patch('analyse.boto3.client')
    def test_run_full_audit_with_exception_in_check(self, mock_boto_client):
        """Test run_full_audit continues when one check fails"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        auditor = IAMSecurityAuditor()

        # Make one audit method raise exception
        auditor.audit_mfa_compliance = MagicMock(side_effect=Exception("Test error"))
        auditor.audit_access_keys = MagicMock()
        auditor.audit_zombie_users = MagicMock()
        auditor.audit_password_policy = MagicMock()
        auditor.audit_overprivileged_users = MagicMock()
        auditor.audit_dangerous_policies = MagicMock()
        auditor.audit_role_session_duration = MagicMock()
        auditor.audit_privilege_escalation = MagicMock()
        auditor.audit_trust_policies = MagicMock()
        auditor.audit_s3_cross_account = MagicMock()
        auditor.audit_zombie_roles = MagicMock()
        auditor.audit_inline_policies = MagicMock()

        # Should not raise, just log error
        findings, recs = auditor.run_full_audit()

        # Other audits should still run
        auditor.audit_access_keys.assert_called_once()

    @patch('analyse.boto3.client')
    def test_is_emergency_access_for_role(self, mock_boto_client):
        """Test is_emergency_access for Role type"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_iam.list_role_tags.return_value = {
            'Tags': [{'Key': 'EmergencyAccess', 'Value': 'true'}]
        }

        auditor = IAMSecurityAuditor()
        result = auditor.is_emergency_access('Role', 'EmergencyRole')

        assert result is True
        mock_iam.list_role_tags.assert_called_with(RoleName='EmergencyRole')

    @patch('analyse.boto3.client')
    def test_is_emergency_access_unknown_type(self, mock_boto_client):
        """Test is_emergency_access with unknown principal type"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        auditor = IAMSecurityAuditor()
        result = auditor.is_emergency_access('Group', 'SomeGroup')

        assert result is False

    @patch('analyse.boto3.client')
    def test_is_service_linked_role_with_exception(self, mock_boto_client):
        """Test is_service_linked_role handles exceptions"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_iam.get_role.side_effect = Exception("Access denied")

        auditor = IAMSecurityAuditor()
        result = auditor.is_service_linked_role('TestRole')

        assert result is False

    @patch('time.sleep')
    @patch('analyse.boto3.client')
    def test_credential_report_waits_for_completion(self, mock_boto_client, mock_sleep):
        """Test credential report waits for COMPLETE state"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        # First call returns INPROGRESS, second returns COMPLETE
        mock_iam.get_credential_report.side_effect = [
            {'State': 'INPROGRESS'},
            {'State': 'COMPLETE', 'Content': b'user\ntest-user'}
        ]
        mock_iam.generate_credential_report.return_value = {}

        auditor = IAMSecurityAuditor()
        auditor.get_credential_report.cache_clear()
        report = auditor.get_credential_report()

        # Should have called sleep
        mock_sleep.assert_called_with(1)
        assert len(report) == 1

    @patch('analyse.boto3.client')
    def test_audit_access_keys_with_recent_keys(self, mock_boto_client):
        """Test audit_access_keys with recent keys (no finding)"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        auditor = IAMSecurityAuditor()

        # Recent key (within 90 days)
        recent_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        auditor.get_credential_report = MagicMock(return_value=[
            {
                'user': 'test-user',
                'access_key_1_active': 'true',
                'access_key_1_created': recent_date,
                'access_key_2_active': 'false'
            }
        ])

        auditor.audit_access_keys()

        # No finding should be created for recent key
        key_findings = [f for f in auditor.findings if 'older than 90 days' in f['issue_description']]
        assert len(key_findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_dangerous_policies_with_deny_statement(self, mock_boto_client):
        """Test audit_dangerous_policies skips Deny statements"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{
            'Policies': [{
                'Arn': 'arn:aws:iam::123456789012:policy/TestPolicy',
                'PolicyName': 'TestPolicy',
                'DefaultVersionId': 'v1'
            }]
        }]
        mock_iam.get_paginator.return_value = mock_paginator

        # Policy with Deny statement
        mock_iam.get_policy_version.return_value = {
            'PolicyVersion': {
                'Document': {
                    'Statement': [{
                        'Effect': 'Deny',
                        'Action': ['s3:DeleteBucket'],
                        'Resource': '*'
                    }]
                }
            }
        }

        auditor = IAMSecurityAuditor()
        auditor.audit_dangerous_policies()

        # No finding for Deny statement
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_dangerous_policies_with_safe_actions(self, mock_boto_client):
        """Test audit_dangerous_policies with safe actions (read-only)"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{
            'Policies': [{
                'Arn': 'arn:aws:iam::123456789012:policy/ReadOnlyPolicy',
                'PolicyName': 'ReadOnlyPolicy',
                'DefaultVersionId': 'v1'
            }]
        }]
        mock_iam.get_paginator.return_value = mock_paginator

        # Policy with safe read actions
        mock_iam.get_policy_version.return_value = {
            'PolicyVersion': {
                'Document': {
                    'Statement': [{
                        'Effect': 'Allow',
                        'Action': ['s3:ListBucket', 's3:GetObject', 'ec2:Describe*'],
                        'Resource': '*'
                    }]
                }
            }
        }

        auditor = IAMSecurityAuditor()
        auditor.audit_dangerous_policies()

        # No finding for safe read-only actions
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_role_session_duration_with_short_duration(self, mock_boto_client):
        """Test audit_role_session_duration with acceptable short duration"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{
            'Roles': [{
                'RoleName': 'ShortSessionRole',
                'Path': '/',
                'CreateDate': datetime.now(timezone.utc)
            }]
        }]
        mock_iam.get_paginator.return_value = mock_paginator
        mock_iam.get_role.return_value = {
            'Role': {
                'Path': '/',
                'MaxSessionDuration': 3600  # 1 hour, acceptable
            }
        }

        auditor = IAMSecurityAuditor()
        auditor.is_service_linked_role = MagicMock(return_value=False)
        auditor.is_emergency_access = MagicMock(return_value=False)

        auditor.audit_role_session_duration()

        # No finding for short session duration
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_role_session_duration_skips_ignored_role(self, mock_boto_client):
        """Test audit_role_session_duration skips OrganizationAccountAccessRole"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{
            'Roles': [{
                'RoleName': 'OrganizationAccountAccessRole',
                'Path': '/',
                'CreateDate': datetime.now(timezone.utc)
            }]
        }]
        mock_iam.get_paginator.return_value = mock_paginator

        auditor = IAMSecurityAuditor()
        auditor.is_service_linked_role = MagicMock(return_value=False)

        auditor.audit_role_session_duration()

        # Should not call get_role for ignored role
        mock_iam.get_role.assert_not_called()

    @patch('analyse.boto3.client')
    def test_check_privilege_escalation_with_non_iam_service_wildcard(self, mock_boto_client):
        """Test privilege escalation check with non-IAM service wildcard"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        auditor = IAMSecurityAuditor()

        policy_doc = {
            'Statement': [{
                'Effect': 'Allow',
                'Action': ['s3:*'],  # S3 wildcard, not IAM
                'Resource': '*'
            }]
        }

        paths = auditor.check_privilege_escalation_in_policy(policy_doc)

        # Should not find privilege escalation (not IAM actions)
        assert len(paths) == 0

    @patch('analyse.boto3.client')
    def test_audit_trust_policies_with_service_principal(self, mock_boto_client):
        """Test audit_trust_policies with Service principal (not AWS)"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{
            'Roles': [{
                'RoleName': 'LambdaExecutionRole',
                'Path': '/',
                'AssumeRolePolicyDocument': {
                    'Statement': [{
                        'Effect': 'Allow',
                        'Principal': {'Service': 'lambda.amazonaws.com'},
                        'Action': 'sts:AssumeRole'
                    }]
                }
            }]
        }]
        mock_iam.get_paginator.return_value = mock_paginator

        auditor = IAMSecurityAuditor()
        auditor.is_service_linked_role = MagicMock(return_value=False)
        auditor.is_emergency_access = MagicMock(return_value=False)

        auditor.audit_trust_policies()

        # No finding for Service principal (not cross-account)
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_trust_policies_with_external_id(self, mock_boto_client):
        """Test audit_trust_policies with cross-account principal that has ExternalId"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{
            'Roles': [{
                'RoleName': 'AppRole',
                'Path': '/',
                'AssumeRolePolicyDocument': {
                    'Statement': [{
                        'Effect': 'Allow',
                        'Principal': {'AWS': 'arn:aws:iam::123456789012:role/TrustedRole'},
                        'Action': 'sts:AssumeRole',
                        'Condition': {
                            'StringEquals': {
                                'sts:ExternalId': 'secure-external-id'
                            }
                        }
                    }]
                }
            }]
        }]
        mock_iam.get_paginator.return_value = mock_paginator

        auditor = IAMSecurityAuditor()
        auditor.is_service_linked_role = MagicMock(return_value=False)
        auditor.is_emergency_access = MagicMock(return_value=False)

        auditor.audit_trust_policies()

        # No finding when ExternalId is present
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_trust_policies_with_deny_statement(self, mock_boto_client):
        """Test audit_trust_policies skips Deny statements"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{
            'Roles': [{
                'RoleName': 'TestRole',
                'Path': '/',
                'AssumeRolePolicyDocument': {
                    'Statement': [{
                        'Effect': 'Deny',
                        'Principal': {'AWS': 'arn:aws:iam::999999999999:root'},
                        'Action': 'sts:AssumeRole'
                    }]
                }
            }]
        }]
        mock_iam.get_paginator.return_value = mock_paginator

        auditor = IAMSecurityAuditor()
        auditor.is_service_linked_role = MagicMock(return_value=False)
        auditor.is_emergency_access = MagicMock(return_value=False)

        auditor.audit_trust_policies()

        # No finding for Deny statement
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_s3_cross_account_with_deny_statement(self, mock_boto_client):
        """Test audit_s3_cross_account skips Deny statements"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'test-bucket'}]
        }
        mock_s3.get_bucket_policy.return_value = {
            'Policy': json.dumps({
                'Statement': [{
                    'Effect': 'Deny',
                    'Principal': {'AWS': '*'},
                    'Action': 's3:GetObject',
                    'Resource': 'arn:aws:s3:::test-bucket/*'
                }]
            })
        }

        auditor = IAMSecurityAuditor()
        auditor.audit_s3_cross_account()

        # No finding for Deny statement
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_s3_cross_account_with_specific_principal(self, mock_boto_client):
        """Test audit_s3_cross_account with specific principal (not wildcard)"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'test-bucket'}]
        }
        mock_s3.get_bucket_policy.return_value = {
            'Policy': json.dumps({
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'AWS': 'arn:aws:iam::123456789012:user/specific-user'},
                    'Action': 's3:GetObject',
                    'Resource': 'arn:aws:s3:::test-bucket/*'
                }]
            })
        }

        auditor = IAMSecurityAuditor()
        auditor.audit_s3_cross_account()

        # No finding for specific principal (not wildcard or :root)
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_s3_cross_account_with_bucket_error(self, mock_boto_client):
        """Test audit_s3_cross_account handles bucket-specific errors"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'error-bucket'}]
        }
        mock_s3.get_bucket_policy.side_effect = Exception("Access Denied")

        auditor = IAMSecurityAuditor()

        # Should not raise, just log warning
        auditor.audit_s3_cross_account()

        # No findings due to error
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_zombie_roles_with_young_role(self, mock_boto_client):
        """Test audit_zombie_roles skips recently created roles"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        # Role created 30 days ago (< 90 days)
        recent_date = datetime.now(timezone.utc) - timedelta(days=30)

        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{
            'Roles': [{
                'RoleName': 'NewRole',
                'Path': '/',
                'CreateDate': recent_date
            }]
        }]
        mock_iam.get_paginator.return_value = mock_paginator

        auditor = IAMSecurityAuditor()
        auditor.is_service_linked_role = MagicMock(return_value=False)
        auditor.is_emergency_access = MagicMock(return_value=False)

        auditor.audit_zombie_roles()

        # Should not call get_role for young role
        mock_iam.get_role.assert_not_called()
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_inline_policies_user_with_only_inline(self, mock_boto_client):
        """Test audit_inline_policies with user having only inline policies"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_user_paginator = MagicMock()
        mock_user_paginator.paginate.return_value = [{
            'Users': [{'UserName': 'test-user'}]
        }]

        mock_policy_paginator = MagicMock()
        mock_policy_paginator.paginate.return_value = [
            {'AttachedPolicies': []}  # No managed policies
        ]

        def get_paginator_side_effect(operation):
            if operation == 'list_users':
                return mock_user_paginator
            elif operation == 'list_attached_user_policies':
                return mock_policy_paginator
            return MagicMock()

        mock_iam.get_paginator.side_effect = get_paginator_side_effect
        mock_iam.list_user_policies.return_value = {'PolicyNames': ['InlinePolicy']}

        auditor = IAMSecurityAuditor()
        auditor.is_emergency_access = MagicMock(return_value=False)

        auditor.audit_inline_policies()

        # No finding - user has only inline, not mixed
        assert len(auditor.findings) == 0

    @patch('analyse.boto3.client')
    def test_audit_inline_policies_role_with_only_managed(self, mock_boto_client):
        """Test audit_inline_policies with role having only managed policies"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = [mock_iam, mock_s3]

        mock_user_paginator = MagicMock()
        mock_user_paginator.paginate.return_value = [{'Users': []}]

        mock_role_paginator = MagicMock()
        mock_role_paginator.paginate.return_value = [{
            'Roles': [{
                'RoleName': 'test-role',
                'Path': '/'
            }]
        }]

        mock_policy_paginator = MagicMock()
        mock_policy_paginator.paginate.return_value = [
            {'AttachedPolicies': [{'PolicyName': 'ManagedPolicy'}]}
        ]

        def get_paginator_side_effect(operation):
            if operation == 'list_users':
                return mock_user_paginator
            elif operation == 'list_roles':
                return mock_role_paginator
            elif operation == 'list_attached_role_policies':
                return mock_policy_paginator
            return MagicMock()

        mock_iam.get_paginator.side_effect = get_paginator_side_effect
        mock_iam.list_role_policies.return_value = {'PolicyNames': []}  # No inline

        auditor = IAMSecurityAuditor()
        auditor.is_service_linked_role = MagicMock(return_value=False)
        auditor.is_emergency_access = MagicMock(return_value=False)

        auditor.audit_inline_policies()

        # No finding - role has only managed, not mixed
        assert len(auditor.findings) == 0

    @patch('analyse.IAMSecurityAuditor')
    @patch('analyse.logger')
    def test_main_with_exception(self, mock_logger, mock_auditor_class):
        """Test main() handles exceptions and logs error"""
        # Mock auditor instance that fails during run_full_audit
        mock_auditor = MagicMock()
        mock_auditor.run_full_audit.side_effect = Exception("Audit failed")
        mock_auditor_class.return_value = mock_auditor

        with pytest.raises(Exception, match="Audit failed"):
            main()

        # Should log error
        mock_logger.error.assert_called_once()
        # Verify error message format
        call_args = mock_logger.error.call_args[0][0]
        assert "Audit failed" in call_args
