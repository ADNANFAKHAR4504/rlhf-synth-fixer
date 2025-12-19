"""
Unit Tests for AWS Secrets Security Audit Script

==============================================================================
This file contains unit tests for the SecretsAuditor class.
Unit tests use unittest.mock to test logic WITHOUT external services (no Moto).
==============================================================================
"""

import json
import sys
import os
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch, mock_open, call, ANY
from concurrent.futures import Future

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import SecretsAuditor, SENSITIVE_PATTERNS, boto_client


class TestSecretsAuditorInitialization:
    """Test suite for SecretsAuditor initialization"""

    @patch('analyse.boto_client')
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that analyzer initializes with correct AWS clients"""
        mock_client = MagicMock()
        mock_boto_client.return_value = mock_client

        auditor = SecretsAuditor(regions=['us-east-1'])

        assert auditor.regions == ['us-east-1']
        assert auditor.production_accounts == []
        assert auditor.staging_accounts == []
        assert 'us-east-1' in auditor.sm_clients
        assert 'us-east-1' in auditor.ssm_clients
        assert 'us-east-1' in auditor.lambda_clients
        assert 'us-east-1' in auditor.ecs_clients

    @patch('analyse.boto_client')
    def test_initialization_with_multiple_regions(self, mock_boto_client):
        """Test analyzer initializes clients for multiple regions"""
        mock_client = MagicMock()
        mock_boto_client.return_value = mock_client

        auditor = SecretsAuditor(regions=['us-east-1', 'eu-west-1'])

        assert len(auditor.regions) == 2
        assert 'us-east-1' in auditor.sm_clients
        assert 'eu-west-1' in auditor.sm_clients

    @patch('analyse.boto_client')
    def test_initialization_with_account_lists(self, mock_boto_client):
        """Test analyzer stores production and staging account lists"""
        mock_client = MagicMock()
        mock_boto_client.return_value = mock_client

        auditor = SecretsAuditor(
            regions=['us-east-1'],
            production_accounts=['111111111111'],
            staging_accounts=['222222222222']
        )

        assert auditor.production_accounts == ['111111111111']
        assert auditor.staging_accounts == ['222222222222']

    @patch('analyse.boto_client')
    def test_initialization_creates_empty_findings(self, mock_boto_client):
        """Test analyzer initializes with empty findings structure"""
        mock_client = MagicMock()
        mock_boto_client.return_value = mock_client

        auditor = SecretsAuditor(regions=['us-east-1'])

        assert auditor.findings['rotation_lifecycle'] == []
        assert auditor.findings['encryption_access'] == []
        assert auditor.findings['hardcoded_secrets'] == []
        assert auditor.findings['summary'] == {}


class TestShouldSkipResource:
    """Test suite for should_skip_resource method"""

    @patch('analyse.boto_client')
    def test_skips_test_prefix_resources(self, mock_boto_client):
        """Test that resources with test- prefix are skipped"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'])

        assert auditor.should_skip_resource('test-secret') is True
        assert auditor.should_skip_resource('test-database-creds') is True

    @patch('analyse.boto_client')
    def test_skips_demo_prefix_resources(self, mock_boto_client):
        """Test that resources with demo- prefix are skipped"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'])

        assert auditor.should_skip_resource('demo-secret') is True

    @patch('analyse.boto_client')
    def test_skips_excluded_from_audit_tag(self, mock_boto_client):
        """Test that resources tagged ExcludeFromAudit: true are skipped"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'])

        tags = [{'Key': 'ExcludeFromAudit', 'Value': 'true'}]
        assert auditor.should_skip_resource('production-secret', tags) is True

    @patch('analyse.boto_client')
    def test_does_not_skip_normal_resources(self, mock_boto_client):
        """Test that normal resources are not skipped"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'])

        assert auditor.should_skip_resource('production-database-creds') is False

    @patch('analyse.boto_client')
    def test_handles_dict_tags_format(self, mock_boto_client):
        """Test that dict format tags are handled correctly"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'])

        tags = {'ExcludeFromAudit': 'true'}
        assert auditor.should_skip_resource('some-secret', tags) is True


class TestGetSecretLastAccessed:
    """Test suite for get_secret_last_accessed method"""

    @patch('analyse.boto_client')
    def test_returns_last_access_time_when_events_exist(self, mock_boto_client):
        """Test that last access time is returned when CloudTrail events exist"""
        mock_ct_client = MagicMock()
        mock_boto_client.return_value = mock_ct_client

        auditor = SecretsAuditor(regions=['us-east-1'])

        event_time = datetime.now(timezone.utc) - timedelta(days=5)
        mock_paginator = MagicMock()
        mock_ct_client.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {
                'Events': [
                    {'EventName': 'GetSecretValue', 'EventTime': event_time},
                    {'EventName': 'DescribeSecret', 'EventTime': datetime.now(timezone.utc)}
                ]
            }
        ]

        result = auditor.get_secret_last_accessed('arn:aws:secretsmanager:us-east-1:123:secret:test', 'us-east-1')

        assert result == event_time

    @patch('analyse.boto_client')
    def test_returns_none_when_no_events(self, mock_boto_client):
        """Test that None is returned when no CloudTrail events exist"""
        mock_ct_client = MagicMock()
        mock_boto_client.return_value = mock_ct_client

        auditor = SecretsAuditor(regions=['us-east-1'])

        mock_paginator = MagicMock()
        mock_ct_client.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'Events': []}]

        result = auditor.get_secret_last_accessed('arn:aws:secretsmanager:us-east-1:123:secret:test', 'us-east-1')

        assert result is None

    @patch('analyse.boto_client')
    def test_handles_cloudtrail_exception(self, mock_boto_client):
        """Test that exceptions from CloudTrail are handled gracefully"""
        mock_ct_client = MagicMock()
        mock_boto_client.return_value = mock_ct_client

        auditor = SecretsAuditor(regions=['us-east-1'])

        mock_paginator = MagicMock()
        mock_ct_client.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = Exception("CloudTrail error")

        result = auditor.get_secret_last_accessed('arn:aws:secretsmanager:us-east-1:123:secret:test', 'us-east-1')

        assert result is None


class TestAuditSecretsManager:
    """Test suite for audit_secrets_manager method"""

    @patch('analyse.boto_client')
    def test_finds_never_rotated_secrets(self, mock_boto_client):
        """Test that secrets never rotated are flagged"""
        mock_sm = MagicMock()
        mock_ct = MagicMock()

        def factory(service, region=None):
            return mock_sm if service == 'secretsmanager' else mock_ct

        mock_boto_client.side_effect = factory

        mock_paginator = MagicMock()
        mock_sm.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'SecretList': [{'Name': 'never-rotated', 'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:never-rotated'}]}
        ]
        mock_sm.describe_secret.return_value = {'Name': 'never-rotated', 'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:never-rotated', 'Tags': []}
        mock_sm.list_secret_version_ids.return_value = {'Versions': [{'VersionId': 'v1'}, {'VersionId': 'v2'}]}

        ct_paginator = MagicMock()
        mock_ct.get_paginator.return_value = ct_paginator
        ct_paginator.paginate.return_value = [{'Events': []}]

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_secrets_manager('us-east-1')

        never_rotated = [f for f in auditor.findings['rotation_lifecycle'] if f['type'] == 'never_rotated']
        assert len(never_rotated) >= 1

    @patch('analyse.boto_client')
    def test_finds_rotation_failures(self, mock_boto_client):
        """Test that rotation failures are flagged"""
        mock_sm = MagicMock()
        mock_ct = MagicMock()

        def factory(service, region=None):
            return mock_sm if service == 'secretsmanager' else mock_ct

        mock_boto_client.side_effect = factory

        mock_paginator = MagicMock()
        mock_sm.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'SecretList': [{'Name': 'failed-rotation', 'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:failed'}]}
        ]

        past_date = datetime.now(timezone.utc) - timedelta(days=10)
        mock_sm.describe_secret.return_value = {
            'Name': 'failed-rotation',
            'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:failed',
            'RotationEnabled': True,
            'NextRotationDate': past_date,
            'LastRotatedDate': datetime.now(timezone.utc) - timedelta(days=50),
            'Tags': []
        }
        mock_sm.list_secret_version_ids.return_value = {'Versions': [{'VersionId': 'v1'}, {'VersionId': 'v2'}]}

        ct_paginator = MagicMock()
        mock_ct.get_paginator.return_value = ct_paginator
        ct_paginator.paginate.return_value = [{'Events': []}]

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_secrets_manager('us-east-1')

        rotation_failures = [f for f in auditor.findings['rotation_lifecycle'] if f['type'] == 'rotation_failure']
        assert len(rotation_failures) >= 1

    @patch('analyse.boto_client')
    def test_finds_rollback_risk(self, mock_boto_client):
        """Test that secrets with only one version are flagged for rollback risk"""
        mock_sm = MagicMock()
        mock_ct = MagicMock()

        def factory(service, region=None):
            return mock_sm if service == 'secretsmanager' else mock_ct

        mock_boto_client.side_effect = factory

        mock_paginator = MagicMock()
        mock_sm.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'SecretList': [{'Name': 'single-version', 'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:single'}]}
        ]
        mock_sm.describe_secret.return_value = {'Name': 'single-version', 'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:single', 'Tags': []}
        mock_sm.list_secret_version_ids.return_value = {'Versions': [{'VersionId': 'v1'}]}

        ct_paginator = MagicMock()
        mock_ct.get_paginator.return_value = ct_paginator
        ct_paginator.paginate.return_value = [{'Events': []}]

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_secrets_manager('us-east-1')

        rollback_risk = [f for f in auditor.findings['rotation_lifecycle'] if f['type'] == 'rollback_risk']
        assert len(rollback_risk) >= 1

    @patch('analyse.boto_client')
    def test_finds_dr_gap_for_critical_secrets(self, mock_boto_client):
        """Test that critical secrets without replication are flagged"""
        mock_sm = MagicMock()
        mock_ct = MagicMock()

        def factory(service, region=None):
            return mock_sm if service == 'secretsmanager' else mock_ct

        mock_boto_client.side_effect = factory

        mock_paginator = MagicMock()
        mock_sm.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'SecretList': [{'Name': 'critical-secret', 'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:critical'}]}
        ]
        mock_sm.describe_secret.return_value = {
            'Name': 'critical-secret',
            'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:critical',
            'Tags': [{'Key': 'Critical', 'Value': 'true'}]
        }
        mock_sm.list_secret_version_ids.return_value = {'Versions': [{'VersionId': 'v1'}, {'VersionId': 'v2'}]}

        ct_paginator = MagicMock()
        mock_ct.get_paginator.return_value = ct_paginator
        ct_paginator.paginate.return_value = [{'Events': []}]

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_secrets_manager('us-east-1')

        dr_gaps = [f for f in auditor.findings['encryption_access'] if f['type'] == 'dr_gap']
        assert len(dr_gaps) >= 1

    @patch('analyse.boto_client')
    def test_handles_describe_secret_exception(self, mock_boto_client):
        """Test that describe_secret exceptions are handled"""
        mock_sm = MagicMock()
        mock_ct = MagicMock()

        def factory(service, region=None):
            return mock_sm if service == 'secretsmanager' else mock_ct

        mock_boto_client.side_effect = factory

        mock_paginator = MagicMock()
        mock_sm.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'SecretList': [{'Name': 'error-secret', 'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:error'}]}
        ]
        mock_sm.describe_secret.side_effect = Exception("Access denied")

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_secrets_manager('us-east-1')

        # Should not raise, should just log error
        assert len(auditor.findings['rotation_lifecycle']) == 0

    @patch('analyse.boto_client')
    def test_handles_list_versions_exception(self, mock_boto_client):
        """Test that list_secret_version_ids exceptions are handled"""
        mock_sm = MagicMock()
        mock_ct = MagicMock()

        def factory(service, region=None):
            return mock_sm if service == 'secretsmanager' else mock_ct

        mock_boto_client.side_effect = factory

        mock_paginator = MagicMock()
        mock_sm.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'SecretList': [{'Name': 'test-secret', 'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:test-ver'}]}
        ]
        mock_sm.describe_secret.return_value = {'Name': 'test-secret', 'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:test-ver', 'Tags': []}
        mock_sm.list_secret_version_ids.side_effect = Exception("Version error")

        ct_paginator = MagicMock()
        mock_ct.get_paginator.return_value = ct_paginator
        ct_paginator.paginate.return_value = [{'Events': []}]

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_secrets_manager('us-east-1')

        # Should not raise exception
        assert True

    @patch('analyse.boto_client')
    def test_handles_audit_exception(self, mock_boto_client):
        """Test that main audit exception is handled"""
        mock_sm = MagicMock()
        mock_boto_client.return_value = mock_sm

        mock_sm.get_paginator.side_effect = Exception("Paginator error")

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_secrets_manager('us-east-1')

        # Should not raise
        assert True

    @patch('analyse.boto_client')
    def test_checks_rotation_lambda(self, mock_boto_client):
        """Test that rotation Lambda is checked when configured"""
        mock_sm = MagicMock()
        mock_ct = MagicMock()
        mock_lambda = MagicMock()

        def factory(service, region=None):
            if service == 'secretsmanager':
                return mock_sm
            elif service == 'lambda':
                return mock_lambda
            return mock_ct

        mock_boto_client.side_effect = factory

        mock_paginator = MagicMock()
        mock_sm.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'SecretList': [{'Name': 'rotated-secret', 'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:rotated'}]}
        ]
        mock_sm.describe_secret.return_value = {
            'Name': 'rotated-secret',
            'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:rotated',
            'RotationLambdaARN': 'arn:aws:lambda:us-east-1:123:function:rotator',
            'Tags': []
        }
        mock_sm.list_secret_version_ids.return_value = {'Versions': [{'VersionId': 'v1'}, {'VersionId': 'v2'}]}

        ct_paginator = MagicMock()
        mock_ct.get_paginator.return_value = ct_paginator
        ct_paginator.paginate.return_value = [{'Events': []}]

        mock_lambda.get_function_configuration.return_value = {'Timeout': 60}
        mock_ct.lookup_events.return_value = {'Events': []}

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_secrets_manager('us-east-1')

        # Should have lambda rotation issue
        lambda_issues = [f for f in auditor.findings['rotation_lifecycle'] if f['type'] == 'lambda_rotation_issue']
        assert len(lambda_issues) >= 1

    @patch('analyse.boto_client')
    def test_parses_secret_policy(self, mock_boto_client):
        """Test that secret policy is parsed and analyzed"""
        mock_sm = MagicMock()
        mock_ct = MagicMock()

        def factory(service, region=None):
            return mock_sm if service == 'secretsmanager' else mock_ct

        mock_boto_client.side_effect = factory

        mock_paginator = MagicMock()
        mock_sm.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'SecretList': [{'Name': 'policy-secret', 'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:policy'}]}
        ]
        mock_sm.describe_secret.return_value = {
            'Name': 'policy-secret',
            'ARN': 'arn:aws:secretsmanager:us-east-1:123:secret:policy',
            'Tags': [],
            'SecretPolicy': json.dumps({
                'Statement': [{'Principal': '*', 'Effect': 'Allow', 'Action': 'secretsmanager:GetSecretValue'}]
            })
        }
        mock_sm.list_secret_version_ids.return_value = {'Versions': [{'VersionId': 'v1'}, {'VersionId': 'v2'}]}

        ct_paginator = MagicMock()
        mock_ct.get_paginator.return_value = ct_paginator
        ct_paginator.paginate.return_value = [{'Events': []}]

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_secrets_manager('us-east-1')

        permissive = [f for f in auditor.findings['encryption_access'] if f['type'] == 'overly_permissive_access']
        assert len(permissive) >= 1


class TestAnalyzeResourcePolicy:
    """Test suite for _analyze_resource_policy method"""

    @patch('analyse.boto_client')
    def test_flags_wildcard_principal(self, mock_boto_client):
        """Test that wildcard principal is flagged"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'])

        policy = {'Statement': [{'Principal': '*', 'Effect': 'Allow'}]}
        auditor._analyze_resource_policy(policy, 'test-secret', 'arn:test', 'us-east-1', None)

        assert len(auditor.findings['encryption_access']) == 1
        assert auditor.findings['encryption_access'][0]['type'] == 'overly_permissive_access'

    @patch('analyse.boto_client')
    def test_flags_wildcard_in_aws_principal(self, mock_boto_client):
        """Test that wildcard in AWS principal list is flagged"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'])

        policy = {'Statement': [{'Principal': {'AWS': ['*']}, 'Effect': 'Allow'}]}
        auditor._analyze_resource_policy(policy, 'test-secret', 'arn:test', 'us-east-1', None)

        permissive = [f for f in auditor.findings['encryption_access'] if f['type'] == 'overly_permissive_access']
        assert len(permissive) >= 1

    @patch('analyse.boto_client')
    def test_flags_cross_account_without_external_id(self, mock_boto_client):
        """Test that cross-account access without ExternalId is flagged"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'])

        policy = {'Statement': [{'Principal': {'AWS': 'arn:aws:iam::999999999999:root'}, 'Effect': 'Allow'}]}
        auditor._analyze_resource_policy(policy, 'test-secret', 'arn:test', 'us-east-1', None)

        unsafe = [f for f in auditor.findings['encryption_access'] if f['type'] == 'unsafe_cross_account']
        assert len(unsafe) >= 1

    @patch('analyse.boto_client')
    def test_skips_known_accounts(self, mock_boto_client):
        """Test that known production accounts are not flagged"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'], production_accounts=['999999999999'])

        policy = {'Statement': [{'Principal': {'AWS': 'arn:aws:iam::999999999999:root'}, 'Effect': 'Allow'}]}
        auditor._analyze_resource_policy(policy, 'test-secret', 'arn:test', 'us-east-1', None)

        unsafe = [f for f in auditor.findings['encryption_access'] if f['type'] == 'unsafe_cross_account']
        assert len(unsafe) == 0


class TestCheckRotationLambda:
    """Test suite for _check_rotation_lambda method"""

    @patch('analyse.boto_client')
    def test_flags_high_timeout(self, mock_boto_client):
        """Test that Lambda with high timeout is flagged"""
        mock_lambda = MagicMock()
        mock_ct = MagicMock()

        def factory(service, region=None):
            return mock_lambda if service == 'lambda' else mock_ct

        mock_boto_client.side_effect = factory

        auditor = SecretsAuditor(regions=['us-east-1'])
        mock_lambda.get_function_configuration.return_value = {'Timeout': 60}
        mock_ct.lookup_events.return_value = {'Events': []}

        auditor._check_rotation_lambda('arn:aws:lambda:us-east-1:123:function:rotator', 'test-secret', 'us-east-1')

        issues = [f for f in auditor.findings['rotation_lifecycle'] if f['type'] == 'lambda_rotation_issue']
        assert len(issues) >= 1

    @patch('analyse.boto_client')
    def test_flags_lambda_errors(self, mock_boto_client):
        """Test that Lambda with recent errors is flagged"""
        mock_lambda = MagicMock()
        mock_ct = MagicMock()

        def factory(service, region=None):
            return mock_lambda if service == 'lambda' else mock_ct

        mock_boto_client.side_effect = factory

        auditor = SecretsAuditor(regions=['us-east-1'])
        mock_lambda.get_function_configuration.return_value = {'Timeout': 10}
        mock_ct.lookup_events.return_value = {'Events': [{'errorCode': 'RuntimeError'}]}

        auditor._check_rotation_lambda('arn:aws:lambda:us-east-1:123:function:rotator', 'test-secret', 'us-east-1')

        errors = [f for f in auditor.findings['rotation_lifecycle'] if f['type'] == 'lambda_rotation_error']
        assert len(errors) >= 1

    @patch('analyse.boto_client')
    def test_handles_lambda_exception(self, mock_boto_client):
        """Test that Lambda check exceptions are handled"""
        mock_lambda = MagicMock()
        mock_boto_client.return_value = mock_lambda

        auditor = SecretsAuditor(regions=['us-east-1'])
        mock_lambda.get_function_configuration.side_effect = Exception("Lambda error")

        auditor._check_rotation_lambda('arn:aws:lambda:us-east-1:123:function:rotator', 'test-secret', 'us-east-1')

        # Should not raise
        assert True

    @patch('analyse.boto_client')
    def test_handles_cloudtrail_lookup_exception(self, mock_boto_client):
        """Test that CloudTrail lookup exceptions are handled"""
        mock_lambda = MagicMock()
        mock_ct = MagicMock()

        def factory(service, region=None):
            return mock_lambda if service == 'lambda' else mock_ct

        mock_boto_client.side_effect = factory

        auditor = SecretsAuditor(regions=['us-east-1'])
        mock_lambda.get_function_configuration.return_value = {'Timeout': 10}
        mock_ct.lookup_events.side_effect = Exception("CloudTrail error")

        auditor._check_rotation_lambda('arn:aws:lambda:us-east-1:123:function:rotator', 'test-secret', 'us-east-1')

        # Should not raise
        assert True


class TestAuditParameterStore:
    """Test suite for audit_parameter_store method"""

    @patch('analyse.boto_client')
    def test_flags_plaintext_passwords(self, mock_boto_client):
        """Test that plaintext parameters with passwords are flagged"""
        mock_ssm = MagicMock()
        mock_boto_client.return_value = mock_ssm

        mock_paginator = MagicMock()
        mock_ssm.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'Parameters': [{'Name': '/app/password', 'Type': 'String'}]}]
        mock_ssm.get_parameter.return_value = {'Parameter': {'Name': '/app/password', 'Value': 'password=secret123', 'Type': 'String'}}
        mock_ssm.list_tags_for_resource.return_value = {'TagList': []}

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_parameter_store('us-east-1')

        plaintext = [f for f in auditor.findings['encryption_access'] if f['type'] == 'plaintext_sensitive_data']
        assert len(plaintext) >= 1

    @patch('analyse.boto_client')
    def test_flags_secure_string_with_default_key(self, mock_boto_client):
        """Test that SecureString with default AWS key is flagged"""
        mock_ssm = MagicMock()
        mock_boto_client.return_value = mock_ssm

        mock_paginator = MagicMock()
        mock_ssm.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'Parameters': [{'Name': '/app/token', 'Type': 'SecureString', 'KeyId': 'alias/aws/ssm'}]}]
        mock_ssm.get_parameter.return_value = {'Parameter': {'Name': '/app/token', 'Value': 'token-value', 'Type': 'SecureString'}}
        mock_ssm.list_tags_for_resource.return_value = {'TagList': []}

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_parameter_store('us-east-1')

        cmk = [f for f in auditor.findings['encryption_access'] if f['type'] == 'missing_cmk_encryption']
        assert len(cmk) >= 1

    @patch('analyse.boto_client')
    def test_flags_tier_waste(self, mock_boto_client):
        """Test that standard tier for small parameters is flagged"""
        mock_ssm = MagicMock()
        mock_boto_client.return_value = mock_ssm

        mock_paginator = MagicMock()
        mock_ssm.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'Parameters': [{'Name': '/app/config', 'Type': 'String', 'Tier': 'Standard'}]}]
        mock_ssm.get_parameter.return_value = {'Parameter': {'Name': '/app/config', 'Value': 'small-value', 'Type': 'String'}}
        mock_ssm.list_tags_for_resource.return_value = {'TagList': []}

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_parameter_store('us-east-1')

        waste = [f for f in auditor.findings['encryption_access'] if f['type'] == 'tier_waste']
        assert len(waste) >= 1

    @patch('analyse.boto_client')
    def test_handles_get_parameter_exception(self, mock_boto_client):
        """Test that get_parameter exceptions are handled"""
        mock_ssm = MagicMock()
        mock_boto_client.return_value = mock_ssm

        mock_paginator = MagicMock()
        mock_ssm.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'Parameters': [{'Name': '/app/error', 'Type': 'String'}]}]
        mock_ssm.get_parameter.side_effect = Exception("Access denied")

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_parameter_store('us-east-1')

        # Should not raise
        assert True

    @patch('analyse.boto_client')
    def test_handles_audit_exception(self, mock_boto_client):
        """Test that main audit exception is handled"""
        mock_ssm = MagicMock()
        mock_boto_client.return_value = mock_ssm

        mock_ssm.get_paginator.side_effect = Exception("Paginator error")

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_parameter_store('us-east-1')

        # Should not raise
        assert True

    @patch('analyse.boto_client')
    def test_skips_excluded_parameters(self, mock_boto_client):
        """Test that parameters with ExcludeFromAudit tag are skipped"""
        mock_ssm = MagicMock()
        mock_boto_client.return_value = mock_ssm

        mock_paginator = MagicMock()
        mock_ssm.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'Parameters': [{'Name': '/app/excluded', 'Type': 'String'}]}]
        mock_ssm.get_parameter.return_value = {'Parameter': {'Name': '/app/excluded', 'Value': 'password=secret', 'Type': 'String'}}
        mock_ssm.list_tags_for_resource.return_value = {'TagList': [{'Key': 'ExcludeFromAudit', 'Value': 'true'}]}

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_parameter_store('us-east-1')

        # Should have no findings for excluded parameter
        assert len(auditor.findings['encryption_access']) == 0


class TestAuditLambdaEnvironment:
    """Test suite for audit_lambda_environment method"""

    @patch('analyse.boto_client')
    def test_finds_hardcoded_passwords(self, mock_boto_client):
        """Test that Lambda functions with hardcoded passwords are flagged"""
        mock_lambda = MagicMock()
        mock_boto_client.return_value = mock_lambda

        mock_paginator = MagicMock()
        mock_lambda.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'Functions': [{'FunctionName': 'api-handler', 'FunctionArn': 'arn:aws:lambda:us-east-1:123:function:api-handler'}]}
        ]
        mock_lambda.get_function_configuration.return_value = {
            'FunctionName': 'api-handler',
            'Environment': {'Variables': {'DB_PASSWORD': 'password=secret123'}}
        }
        mock_lambda.list_tags.return_value = {'Tags': {}}

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_lambda_environment('us-east-1')

        lambda_findings = [f for f in auditor.findings['hardcoded_secrets'] if f['type'] == 'hardcoded_lambda_secret']
        assert len(lambda_findings) >= 1

    @patch('analyse.boto_client')
    def test_handles_get_configuration_exception(self, mock_boto_client):
        """Test that get_function_configuration exceptions are handled"""
        mock_lambda = MagicMock()
        mock_boto_client.return_value = mock_lambda

        mock_paginator = MagicMock()
        mock_lambda.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'Functions': [{'FunctionName': 'error-func', 'FunctionArn': 'arn:aws:lambda:us-east-1:123:function:error'}]}
        ]
        mock_lambda.get_function_configuration.side_effect = Exception("Access denied")

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_lambda_environment('us-east-1')

        # Should not raise
        assert True

    @patch('analyse.boto_client')
    def test_handles_audit_exception(self, mock_boto_client):
        """Test that main audit exception is handled"""
        mock_lambda = MagicMock()
        mock_boto_client.return_value = mock_lambda

        mock_lambda.get_paginator.side_effect = Exception("Paginator error")

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_lambda_environment('us-east-1')

        # Should not raise
        assert True


class TestAuditEcsTaskDefinitions:
    """Test suite for audit_ecs_task_definitions method"""

    @patch('analyse.boto_client')
    def test_finds_hardcoded_secrets(self, mock_boto_client):
        """Test that ECS task definitions with hardcoded secrets are flagged"""
        mock_ecs = MagicMock()
        mock_boto_client.return_value = mock_ecs

        mock_paginator = MagicMock()
        mock_ecs.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'families': ['web-app']}]
        mock_ecs.list_task_definitions.return_value = {'taskDefinitionArns': ['arn:aws:ecs:us-east-1:123:task-definition/web-app:1']}
        mock_ecs.describe_task_definition.return_value = {
            'taskDefinition': {
                'taskDefinitionArn': 'arn:aws:ecs:us-east-1:123:task-definition/web-app:1',
                'revision': 1,
                'containerDefinitions': [{'name': 'web', 'environment': [{'name': 'PASSWORD', 'value': 'password=secret'}]}]
            }
        }

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_ecs_task_definitions('us-east-1')

        ecs_findings = [f for f in auditor.findings['hardcoded_secrets'] if f['type'] == 'hardcoded_ecs_secret']
        assert len(ecs_findings) >= 1

    @patch('analyse.boto_client')
    def test_flags_missing_secrets_reference(self, mock_boto_client):
        """Test that containers with sensitive vars but no secrets reference are flagged"""
        mock_ecs = MagicMock()
        mock_boto_client.return_value = mock_ecs

        mock_paginator = MagicMock()
        mock_ecs.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'families': ['backend']}]
        mock_ecs.list_task_definitions.return_value = {'taskDefinitionArns': ['arn:aws:ecs:us-east-1:123:task-definition/backend:1']}
        mock_ecs.describe_task_definition.return_value = {
            'taskDefinition': {
                'taskDefinitionArn': 'arn:aws:ecs:us-east-1:123:task-definition/backend:1',
                'revision': 1,
                'containerDefinitions': [{'name': 'backend', 'environment': [{'name': 'SECRET_KEY', 'value': 'static'}]}]
            }
        }

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_ecs_task_definitions('us-east-1')

        missing = [f for f in auditor.findings['hardcoded_secrets'] if f['type'] == 'missing_secrets_reference']
        assert len(missing) >= 1

    @patch('analyse.boto_client')
    def test_handles_no_task_definitions(self, mock_boto_client):
        """Test that empty task definitions are handled"""
        mock_ecs = MagicMock()
        mock_boto_client.return_value = mock_ecs

        mock_paginator = MagicMock()
        mock_ecs.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'families': ['empty-family']}]
        mock_ecs.list_task_definitions.return_value = {'taskDefinitionArns': []}

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_ecs_task_definitions('us-east-1')

        # Should not raise
        assert True

    @patch('analyse.boto_client')
    def test_handles_describe_exception(self, mock_boto_client):
        """Test that describe_task_definition exceptions are handled"""
        mock_ecs = MagicMock()
        mock_boto_client.return_value = mock_ecs

        mock_paginator = MagicMock()
        mock_ecs.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'families': ['error-family']}]
        mock_ecs.list_task_definitions.return_value = {'taskDefinitionArns': ['arn:aws:ecs:us-east-1:123:task-definition/error:1']}
        mock_ecs.describe_task_definition.side_effect = Exception("Access denied")

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_ecs_task_definitions('us-east-1')

        # Should not raise
        assert True

    @patch('analyse.boto_client')
    def test_handles_audit_exception(self, mock_boto_client):
        """Test that main audit exception is handled"""
        mock_ecs = MagicMock()
        mock_boto_client.return_value = mock_ecs

        mock_ecs.get_paginator.side_effect = Exception("Paginator error")

        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.audit_ecs_task_definitions('us-east-1')

        # Should not raise
        assert True


class TestRunAudit:
    """Test suite for run_audit method"""

    @patch('analyse.boto_client')
    def test_run_audit_calls_all_audit_methods(self, mock_boto_client):
        """Test that run_audit calls all audit methods"""
        mock_boto_client.return_value = MagicMock()

        auditor = SecretsAuditor(regions=['us-east-1'])

        with patch.object(auditor, 'audit_secrets_manager') as mock_sm, \
             patch.object(auditor, 'audit_parameter_store') as mock_ssm, \
             patch.object(auditor, 'audit_lambda_environment') as mock_lambda, \
             patch.object(auditor, 'audit_ecs_task_definitions') as mock_ecs, \
             patch.object(auditor, '_calculate_summary') as mock_summary, \
             patch.object(auditor, '_generate_json_report') as mock_json, \
             patch.object(auditor, '_generate_console_output') as mock_console:

            auditor.run_audit()

            mock_sm.assert_called()
            mock_ssm.assert_called()
            mock_lambda.assert_called()
            mock_ecs.assert_called()
            mock_summary.assert_called_once()
            mock_json.assert_called_once()
            mock_console.assert_called_once()

    @patch('analyse.boto_client')
    def test_run_audit_handles_future_exception(self, mock_boto_client):
        """Test that run_audit handles exceptions from futures"""
        mock_boto_client.return_value = MagicMock()

        auditor = SecretsAuditor(regions=['us-east-1'])

        def raise_error(region):
            raise Exception("Audit error")

        with patch.object(auditor, 'audit_secrets_manager', side_effect=raise_error), \
             patch.object(auditor, 'audit_parameter_store'), \
             patch.object(auditor, 'audit_lambda_environment'), \
             patch.object(auditor, 'audit_ecs_task_definitions'), \
             patch.object(auditor, '_calculate_summary'), \
             patch.object(auditor, '_generate_json_report'), \
             patch.object(auditor, '_generate_console_output'):

            # Should not raise even if one audit fails
            auditor.run_audit()
            assert True


class TestCalculateSummary:
    """Test suite for _calculate_summary method"""

    @patch('analyse.boto_client')
    def test_counts_findings_correctly(self, mock_boto_client):
        """Test that summary correctly counts findings"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'])

        auditor.findings['rotation_lifecycle'] = [
            {'type': 'unrotated_credential', 'severity': 'CRITICAL'},
            {'type': 'unused_credential', 'severity': 'CLEANUP'}
        ]
        auditor.findings['encryption_access'] = [{'type': 'missing_cmk_encryption', 'severity': 'HIGH'}]
        auditor.findings['hardcoded_secrets'] = [{'type': 'hardcoded_lambda_secret', 'severity': 'CRITICAL'}]

        auditor._calculate_summary()

        assert auditor.findings['summary']['total_findings'] == 4
        assert auditor.findings['summary']['severity_breakdown']['CRITICAL'] == 2
        assert auditor.findings['summary']['severity_breakdown']['HIGH'] == 1


class TestGenerateRecommendations:
    """Test suite for _generate_recommendations method"""

    @patch('analyse.boto_client')
    def test_includes_critical_action(self, mock_boto_client):
        """Test that recommendations include immediate action for critical findings"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'])

        auditor.findings['summary'] = {
            'severity_breakdown': {'CRITICAL': 5},
            'type_breakdown': {}
        }

        recs = auditor._generate_recommendations()
        assert any('IMMEDIATE ACTION' in r for r in recs)

    @patch('analyse.boto_client')
    def test_includes_type_specific_recommendations(self, mock_boto_client):
        """Test that type-specific recommendations are generated"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'])

        auditor.findings['summary'] = {
            'severity_breakdown': {'CRITICAL': 1},
            'type_breakdown': {
                'unrotated_credential': 2,
                'plaintext_sensitive_data': 1,
                'hardcoded_lambda_secret': 1,
                'missing_cmk_encryption': 1,
                'unused_credential': 1,
                'overly_permissive_access': 1,
                'dr_gap': 1,
                'rollback_risk': 1
            }
        }

        recs = auditor._generate_recommendations()
        assert any('Rotate' in r for r in recs)
        assert any('Secrets Manager' in r for r in recs)


class TestGenerateConsoleOutput:
    """Test suite for _generate_console_output method"""

    @patch('analyse.boto_client')
    @patch('builtins.print')
    def test_outputs_all_sections(self, mock_print, mock_boto_client):
        """Test that console output includes all sections"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'])

        auditor.findings = {
            'rotation_lifecycle': [{'type': 'unrotated_credential', 'severity': 'CRITICAL', 'resource': 'test', 'region': 'us-east-1', 'last_accessed': 'Never', 'details': 'Not rotated'}],
            'encryption_access': [{'type': 'missing_cmk_encryption', 'severity': 'HIGH', 'resource': 'test2', 'region': 'us-east-1', 'details': 'No CMK'}],
            'hardcoded_secrets': [{'type': 'hardcoded_lambda_secret', 'severity': 'CRITICAL', 'resource': 'func', 'region': 'us-east-1', 'variable_name': 'PASSWORD', 'pattern_matched': 'password', 'details': 'Hardcoded'}],
            'summary': {'total_findings': 3, 'severity_breakdown': {'CRITICAL': 2, 'HIGH': 1}, 'type_breakdown': {}}
        }

        auditor._generate_console_output()

        calls = ''.join(str(c) for c in mock_print.call_args_list)
        assert 'SECRETS SECURITY AUDIT' in calls
        assert 'ROTATION AND LIFECYCLE' in calls
        assert 'ENCRYPTION AND ACCESS' in calls
        assert 'HARDCODED SECRETS' in calls
        assert 'RECOMMENDATIONS' in calls


class TestGenerateJsonReport:
    """Test suite for _generate_json_report method"""

    @patch('analyse.boto_client')
    def test_creates_json_file(self, mock_boto_client):
        """Test that JSON report is created"""
        mock_boto_client.return_value = MagicMock()
        auditor = SecretsAuditor(regions=['us-east-1'])
        auditor.findings = {'rotation_lifecycle': [], 'encryption_access': [], 'hardcoded_secrets': [], 'summary': {}}

        m = mock_open()
        with patch('builtins.open', m):
            auditor._generate_json_report()

        m.assert_called_once_with('secrets_audit.json', 'w')


class TestMainFunction:
    """Test suite for main function"""

    @patch('analyse.boto_client')
    @patch('analyse.SecretsAuditor')
    def test_main_runs_audit(self, mock_auditor_class, mock_boto_client):
        """Test that main function runs the audit"""
        from analyse import main

        mock_auditor = MagicMock()
        mock_auditor_class.return_value = mock_auditor

        main()

        mock_auditor.run_audit.assert_called_once()

    @patch('analyse.boto_client')
    @patch('analyse.SecretsAuditor')
    def test_main_handles_exception(self, mock_auditor_class, mock_boto_client):
        """Test that main function handles exceptions"""
        from analyse import main

        mock_auditor_class.side_effect = Exception("Init error")

        with pytest.raises(Exception):
            main()

    @patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5000', 'AWS_DEFAULT_REGION': 'us-west-2'})
    @patch('analyse.boto_client')
    @patch('analyse.SecretsAuditor')
    def test_main_uses_single_region_for_moto(self, mock_auditor_class, mock_boto_client):
        """Test that main uses single region when AWS_ENDPOINT_URL is set"""
        from analyse import main

        mock_auditor = MagicMock()
        mock_auditor_class.return_value = mock_auditor

        main()

        # Should be called with single region
        call_kwargs = mock_auditor_class.call_args[1]
        assert call_kwargs['regions'] == ['us-west-2']


class TestSensitivePatterns:
    """Test suite for SENSITIVE_PATTERNS regex patterns"""

    def test_password_pattern(self):
        """Test password pattern matches"""
        pattern = SENSITIVE_PATTERNS['password']
        assert pattern.search('password=secret123')
        assert pattern.search('PASSWORD: mysecret')
        assert pattern.search('pwd=test')

    def test_api_key_pattern(self):
        """Test API key pattern matches"""
        pattern = SENSITIVE_PATTERNS['api_key']
        assert pattern.search('api_key=sk-12345')
        assert pattern.search('apikey: abcdef')

    def test_token_pattern(self):
        """Test token pattern matches"""
        pattern = SENSITIVE_PATTERNS['token']
        assert pattern.search('token=abc123')
        assert pattern.search('bearer: xyz789')

    def test_aws_access_pattern(self):
        """Test AWS access key pattern matches"""
        pattern = SENSITIVE_PATTERNS['aws_access']
        assert pattern.search('AKIAIOSFODNN7EXAMPLE')

    def test_connection_string_pattern(self):
        """Test connection string pattern matches"""
        pattern = SENSITIVE_PATTERNS['connection_string']
        assert pattern.search('mongodb://user:pass@localhost')
        assert pattern.search('postgresql://admin:secret@db.example.com')


class TestBotoClientHelper:
    """Test suite for boto_client helper function"""

    @patch('analyse.boto3.client')
    def test_uses_endpoint_url(self, mock_boto3_client):
        """Test boto_client uses AWS_ENDPOINT_URL when set"""
        with patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5000'}):
            boto_client('secretsmanager', 'us-east-1')

        mock_boto3_client.assert_called_with(
            'secretsmanager',
            endpoint_url='http://localhost:5000',
            region_name='us-east-1',
            aws_access_key_id=ANY,
            aws_secret_access_key=ANY
        )

    @patch('analyse.boto3.client')
    def test_without_endpoint_url(self, mock_boto3_client):
        """Test boto_client works without AWS_ENDPOINT_URL"""
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop('AWS_ENDPOINT_URL', None)
            boto_client('ssm', 'eu-west-1')

        mock_boto3_client.assert_called()
        call_kwargs = mock_boto3_client.call_args[1]
        assert call_kwargs['endpoint_url'] is None
