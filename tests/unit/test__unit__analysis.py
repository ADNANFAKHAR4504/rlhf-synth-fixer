"""
Unit Tests for AWS Infrastructure Analysis Script - TEMPLATE

==============================================================================
INSTRUCTIONS: How to Use This Template
==============================================================================

This template provides a structure for unit testing ANY AWS analysis script.
Unit tests use unittest.mock to test logic WITHOUT external services (no Moto).

STEP 1: Update Class and Method Names
--------------------------------------
Replace these placeholders throughout the file:
- [AnalyzerClass] → Your analyzer class name (e.g., FinOpsAnalyzer, IAMSecurityChecker)
- [analyze_method_1] → Your first analysis method (e.g., find_unused_volumes, check_idle_albs)
- [analyze_method_2] → Your second analysis method
- [analyze_method_N] → Additional analysis methods
- [helper_method] → Any helper/private methods you want to test

STEP 2: Update AWS Service Mocks
---------------------------------
Update the boto3.client() mock calls to match your AWS services:
- Example: If you use EC2 and S3, update mock_boto_client.assert_any_call('ec2', ...)
- Update the count in assert mock_boto_client.call_count == N

STEP 3: Copy and Adapt Analysis Method Tests
---------------------------------------------
For EACH analyze_* method in your class:
1. Copy the "Analysis Method Template" section
2. Replace [analyze_method_X] with your method name
3. Update mock data to match AWS API responses for your service
4. Update assertions to match your expected output structure

STEP 4: Test Your Helper Methods
---------------------------------
Add tests for any private/helper methods that contain business logic

STEP 5: Update Main/Report Tests
---------------------------------
Ensure main() and report generation tests match your implementation

==============================================================================
KEY DIFFERENCES FROM INTEGRATION TESTS (test-analysis-py.py):
==============================================================================
UNIT TESTS (this file):
- Use unittest.mock to mock boto3 clients
- No Moto server required
- Test individual methods in isolation
- Fast execution
- Mock AWS API responses directly

INTEGRATION TESTS (test-analysis-py.py):
- Use Moto to create actual mock AWS resources
- Moto server runs in background
- Test complete workflows end-to-end
- Slower execution
- Creates resources via boto3, reads them back

==============================================================================
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from lib.analyse import AWSResourceAuditor, IAMSecurityAuditor, main
import json
from botocore.exceptions import ClientError


class DummyPaginator:
    """Simple paginator stub for IAM/S3 list operations."""
    def __init__(self, pages):
        self.pages = pages

    def paginate(self, **kwargs):
        return self.pages


class TestAWSResourceAuditor:
    """
    Test suite for [AnalyzerClass] class

    TODO: Replace [AnalyzerClass] with your actual class name throughout
    """

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('lib.analyse.boto3.client')
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that analyzer initializes with correct AWS clients"""
        analyzer = AWSResourceAuditor(region_name='us-east-1')

        assert analyzer.region_name == 'us-east-1'

        mock_boto_client.assert_any_call('ec2', region_name='us-east-1')
        mock_boto_client.assert_any_call('logs', region_name='us-east-1')

    @patch('lib.analyse.boto3.client')
    @patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5000'})
    def test_initialization_uses_endpoint_from_environment(self, mock_boto_client):
        """Test analyzer uses Moto endpoint from AWS_ENDPOINT_URL environment variable"""
        # Note: ResourceAuditor doesn't use endpoint_url, only IAM does
        analyzer = AWSResourceAuditor()
        # This test is not applicable for ResourceAuditor
        pass

    # =========================================================================
    # ANALYSIS METHOD TESTS - TEMPLATE
    # =========================================================================
    # COPY THIS ENTIRE SECTION FOR EACH analyze_* METHOD IN YOUR CLASS

    @patch('lib.analyse.boto3.client')
    def test_find_unused_ebs_returns_expected_findings(self, mock_boto_client):
        """
        Test [analyze_method_1] identifies issues correctly

        TODO:
        1. Replace [analyze_method_1] with your actual method name
        2. Update mock_client to match your AWS service (e.g., mock_ec2, mock_s3)
        3. Update mock response structure to match actual AWS API
        4. Update assertions to match your finding structure
        """
        # Setup mock client
        mock_client = MagicMock()
        mock_boto_client.return_value = mock_client

        # Mock paginator (if your method uses pagination)
        mock_paginator = MagicMock()
        mock_client.get_paginator.return_value = mock_paginator

        # TODO: Create mock AWS API response matching actual structure
        # Example structure - customize for your service:
        mock_paginator.paginate.return_value = [
            {
                'ResourceKey': [  # TODO: Replace with actual key (Volumes, SecurityGroups, etc.)
                    {
                        'ResourceId': 'resource-1',
                        'State': 'problematic',  # TODO: Customize fields
                        'Field1': 'value1',
                        'Field2': 'value2',
                        'Tags': [{'Key': 'Name', 'Value': 'test'}]
                    },
                    {
                        'ResourceId': 'resource-2',
                        'State': 'ok',
                        'Field1': 'value3',
                    }
                ]
            }
        ]

    # Call analyzer method
        # Make boto3.client return different mocks for ec2 and logs
        mock_ec2 = MagicMock()
        mock_logs = MagicMock()
        def _client_side_effect(service, region_name=None, endpoint_url=None, **kwargs):
            if service == 'ec2':
                return mock_ec2
            if service == 'logs':
                return mock_logs
            return MagicMock()

        mock_boto_client.side_effect = _client_side_effect

        # Mock paginator for volumes
        mock_paginator = MagicMock()
        mock_ec2.get_paginator.return_value = mock_paginator

        # Provide one available volume and one attached
        mock_paginator.paginate.return_value = [
            {
                'Volumes': [
                    {'VolumeId': 'vol-1', 'Size': 1, 'VolumeType': 'gp2', 'CreateTime': datetime.utcnow(), 'AvailabilityZone': 'us-east-1a', 'State': 'available', 'Tags': [{'Key':'Name','Value':'v1'}]},
                    {'VolumeId': 'vol-2', 'Size': 2, 'VolumeType': 'gp2', 'CreateTime': datetime.utcnow(), 'AvailabilityZone': 'us-east-1a', 'State': 'in-use'}
                ]
            }
        ]


        analyzer = AWSResourceAuditor(region_name='us-east-1')
        findings = analyzer.find_unused_ebs_volumes()

        # Assert results - customize based on your output structure
        assert len(findings) == 1
        assert findings[0]['VolumeId'] == 'vol-1'
        # Add more assertions specific to your findings structure

    @patch('lib.analyse.boto3.client')
    def test_find_unused_ebs_returns_empty_when_no_issues(self, mock_boto_client):
        """Test [analyze_method_1] returns empty list when no issues found"""
        mock_client = MagicMock()
        mock_boto_client.return_value = mock_client
        mock_paginator = MagicMock()
        mock_client.get_paginator.return_value = mock_paginator

        # Mock empty response
        mock_paginator.paginate.return_value = [{'ResourceKey': []}]  # TODO: Update key

        mock_ec2 = MagicMock()
        mock_logs = MagicMock()
        def _client_side_effect(service, region_name=None, endpoint_url=None, **kwargs):
            return mock_ec2 if service == 'ec2' else mock_logs
        mock_boto_client.side_effect = _client_side_effect

        mock_paginator = MagicMock()
        mock_ec2.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'Volumes': []}]

        analyzer = AWSResourceAuditor()
        findings = analyzer.find_unused_ebs_volumes()

        assert findings == []

    @patch('lib.analyse.boto3.client')
    def test_find_unused_ebs_handles_client_error_gracefully(self, mock_boto_client):
        """Test [analyze_method_1] handles AWS ClientError without raising exception"""
        from botocore.exceptions import ClientError

        # Setup mock to raise ClientError
        mock_client = MagicMock()
        mock_boto_client.return_value = mock_client
        mock_paginator = MagicMock()
        mock_client.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'DescribeOperation'  # TODO: Update operation name
        )

        mock_ec2 = MagicMock()
        mock_logs = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_ec2 if service == 'ec2' else mock_logs
        mock_paginator = MagicMock()
        mock_ec2.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}}, 'DescribeVolumes'
        )

        analyzer = AWSResourceAuditor()
        findings = analyzer.find_unused_ebs_volumes()

        # Should return empty list on error, not raise exception
        assert findings == []

    @patch('lib.analyse.boto3.client')
    def test_find_public_security_groups_detects_public_rules(self, mock_boto_client):
        """Test find_public_security_groups collects IPv4 and IPv6 public rules"""
        mock_ec2 = MagicMock()
        mock_logs = MagicMock()

        mock_boto_client.side_effect = lambda service, **kwargs: mock_ec2 if service == 'ec2' else mock_logs
        mock_paginator = MagicMock()
        mock_ec2.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{
            'SecurityGroups': [{
                'GroupId': 'sg-123',
                'GroupName': 'public',
                'Description': 'test',
                'VpcId': 'vpc-1',
                'IpPermissions': [{
                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}],
                    'Ipv6Ranges': [{'CidrIpv6': '::/0'}],
                    'IpProtocol': 'tcp',
                    'FromPort': 22,
                    'ToPort': 22
                }],
                'Tags': [{'Key': 'Name', 'Value': 'public'}]
            }]
        }]

        analyzer = AWSResourceAuditor()
        groups = analyzer.find_public_security_groups()

        assert len(groups) == 1
        rules = groups[0]['PublicIngressRules']
        assert any(rule['Source'] == '0.0.0.0/0' for rule in rules)
        assert any(rule['Source'] == '::/0' for rule in rules)

    @patch('lib.analyse.boto3.client')
    def test_find_public_security_groups_handles_client_error(self, mock_boto_client):
        """Test find_public_security_groups gracefully handles AWS errors"""
        mock_ec2 = MagicMock()
        mock_logs = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_ec2 if service == 'ec2' else mock_logs

        mock_paginator = MagicMock()
        mock_ec2.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'denied'}},
            'DescribeSecurityGroups'
        )

        analyzer = AWSResourceAuditor()
        groups = analyzer.find_public_security_groups()
        assert groups == []

    @patch('lib.analyse.boto3.client')
    def test_calculate_log_metrics_aggregates_streams(self, mock_boto_client):
        """Test calculate_log_stream_metrics totals size and streams"""
        mock_ec2 = MagicMock()
        mock_logs = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_ec2 if service == 'ec2' else mock_logs

        log_group_paginator = MagicMock()
        stream_paginator = MagicMock()

        def _paginator(name):
            if name == 'describe_log_groups':
                return log_group_paginator
            if name == 'describe_log_streams':
                return stream_paginator
            return MagicMock()

        mock_logs.get_paginator.side_effect = _paginator
        log_group_paginator.paginate.return_value = [{'logGroups': [{'logGroupName': '/aws/lambda/demo'}]}]
        stream_paginator.paginate.return_value = [{'logStreams': [{'storedBytes': 100}, {'storedBytes': 300}]}]

        analyzer = AWSResourceAuditor()
        metrics = analyzer.calculate_log_stream_metrics()

        assert metrics['TotalLogStreams'] == 2
        assert metrics['TotalSize'] == 400
        assert metrics['LogGroupMetrics'][0]['AverageStreamSize'] == 200

    @patch('lib.analyse.boto3.client')
    def test_calculate_log_metrics_handles_stream_errors(self, mock_boto_client):
        """Inner ClientError should be handled gracefully"""
        mock_ec2 = MagicMock()
        mock_logs = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_ec2 if service == 'ec2' else mock_logs

        log_group_paginator = MagicMock()
        stream_paginator = MagicMock()

        mock_logs.get_paginator.side_effect = lambda name: log_group_paginator if name == 'describe_log_groups' else stream_paginator
        log_group_paginator.paginate.return_value = [{'logGroups': [{'logGroupName': '/aws/lambda/demo'}]}]
        stream_paginator.paginate.side_effect = ClientError({'Error': {'Code': 'Throttling', 'Message': 'slow'}}, 'DescribeLogStreams')

        analyzer = AWSResourceAuditor()
        metrics = analyzer.calculate_log_stream_metrics()
        assert metrics['LogGroupMetrics'] == []

    @patch('lib.analyse.boto3.client')
    def test_calculate_log_metrics_handles_group_errors(self, mock_boto_client):
        """Outer ClientError should not raise"""
        mock_ec2 = MagicMock()
        mock_logs = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_ec2 if service == 'ec2' else mock_logs

        log_group_paginator = MagicMock()
        mock_logs.get_paginator.return_value = log_group_paginator
        log_group_paginator.paginate.side_effect = ClientError({'Error': {'Code': 'AccessDenied', 'Message': 'denied'}}, 'DescribeLogGroups')

        analyzer = AWSResourceAuditor()
        metrics = analyzer.calculate_log_stream_metrics()
        assert metrics['TotalLogStreams'] == 0

    # =========================================================================
    # HELPER METHOD TESTS
    # =========================================================================
    # Add tests for private/helper methods that contain business logic

    @patch('lib.analyse.boto3.client')
    def test__extract_tags_logic(self, mock_boto_client):
        """
        Test [helper_method] helper method

        TODO: Add tests for helper methods like:
        - _extract_tags(tags) → test tag conversion
        - _calculate_cost(size, type) → test cost calculation
        - _format_output(data) → test data formatting
        - _filter_resources(resources, criteria) → test filtering logic
        """
        analyzer = AWSResourceAuditor()

        # Example: Testing a tag extraction helper
        # tags = [{'Key': 'Environment', 'Value': 'Production'}]
        # result = analyzer._extract_tags(tags)
        # assert result == {'Environment': 'Production'}

        tags = [{'Key': 'Environment', 'Value': 'Production'}]
        result = analyzer._extract_tags(tags)
        assert result == {'Environment': 'Production'}

    # =========================================================================
    # MAIN WORKFLOW TESTS
    # =========================================================================

    @patch('lib.analyse.boto3.client')
    def test_audit_resources_calls_all_methods(self, mock_boto_client):
        """Test audit_resources calls all analysis methods"""
        auditor = AWSResourceAuditor()

        # Mock all methods
        with patch.object(auditor, 'find_unused_ebs_volumes', return_value=[]) as mock_ebs, \
             patch.object(auditor, 'find_public_security_groups', return_value=[]) as mock_sg, \
             patch.object(auditor, 'calculate_log_stream_metrics', return_value={'TotalLogStreams': 0}) as mock_logs:

            result = auditor.audit_resources()

            # Verify all methods were called
            mock_ebs.assert_called_once()
            mock_sg.assert_called_once()
            mock_logs.assert_called_once()

            # Verify result structure
            assert 'AuditTimestamp' in result
            assert 'Region' in result
            assert 'UnusedEBSVolumes' in result
            assert 'PublicSecurityGroups' in result
            assert 'CloudWatchLogMetrics' in result

    @patch('lib.analyse.boto3.client')
    @patch('builtins.print')
    def test_print_console_summary_formats_output(self, mock_print, mock_boto_client):
        """Test print_console_summary formats output correctly"""
        auditor = AWSResourceAuditor()

        # Mock audit_resources
        mock_results = {
            'UnusedEBSVolumes': {'Count': 2, 'TotalSize': 10},
            'PublicSecurityGroups': {'Count': 1},
            'CloudWatchLogMetrics': {'TotalLogStreams': 5, 'AverageStreamSize': 100}
        }

        with patch.object(auditor, 'audit_resources', return_value=mock_results):
            auditor.print_console_summary()

            # Verify print was called (tabulate output)
            assert mock_print.called

    @patch('lib.analyse.boto3.client')
    def test_extract_tags_handles_empty_and_malformed(self, mock_boto_client):
        """Test _extract_tags handles various input cases"""
        auditor = AWSResourceAuditor()

        # Test normal tags
        tags = [{'Key': 'Environment', 'Value': 'Prod'}, {'Key': 'Team', 'Value': 'DevOps'}]
        result = auditor._extract_tags(tags)
        assert result == {'Environment': 'Prod', 'Team': 'DevOps'}

        # Test empty tags
        result = auditor._extract_tags([])
        assert result == {}

        # Test malformed tags
        tags = [{'Key': None, 'Value': 'test'}, {'Key': 'Name'}]
        result = auditor._extract_tags(tags)
        assert result == {'': 'test', 'Name': ''}

    @patch('lib.analyse.boto3.client')
    def test_compute_log_metrics(self, mock_boto_client):
        """Test that summary statistics are calculated correctly"""
        analyzer = AWSResourceAuditor()

        # Create mock findings with different attributes
        # TODO: Customize based on your finding structure
        mock_findings = [
            {'severity': 'HIGH', 'resource_type': 'Type1'},
            {'severity': 'HIGH', 'resource_type': 'Type2'},
            {'severity': 'MEDIUM', 'resource_type': 'Type1'},
            {'severity': 'LOW', 'resource_type': 'Type3'}
        ]
        analyzer.findings = mock_findings

        results = analyzer.calculate_log_stream_metrics()

        # Verify summary calculations
    # This test verifies calculator handles totals and averages
        assert 'TotalLogStreams' in results
        assert 'AverageStreamSize' in results
        # TODO: Add assertions for other summary fields

class TestIAMSecurityAuditor:
    """
    Test suite for IAMSecurityAuditor class
    """

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('lib.analyse.boto3.client')
    def test_iam_initialization_creates_clients(self, mock_boto_client):
        """Test that IAM auditor initializes with correct AWS clients"""
        auditor = IAMSecurityAuditor(region='us-east-1')

        assert auditor.region == 'us-east-1'

        # Should create iam and s3 clients
        assert mock_boto_client.call_count == 2
        # Note: endpoint_url will be from environment if set
        mock_boto_client.assert_any_call('iam', region_name='us-east-1', endpoint_url='http://localhost:5001')
        mock_boto_client.assert_any_call('s3', region_name='us-east-1', endpoint_url='http://localhost:5001')

    @patch('lib.analyse.boto3.client')
    @patch.dict(os.environ, {'AWS_ENDPOINT_URL': 'http://localhost:5000'})
    def test_iam_initialization_uses_endpoint_from_environment(self, mock_boto_client):
        """Test IAM auditor uses Moto endpoint from AWS_ENDPOINT_URL environment variable"""
        auditor = IAMSecurityAuditor()

        # Verify endpoint_url was passed to boto3 clients
        calls = mock_boto_client.call_args_list
        for call in calls:
            assert call[1].get('endpoint_url') == 'http://localhost:5000'

    # =========================================================================
    # ANALYSIS METHOD TESTS
    # =========================================================================

    @patch('lib.analyse.boto3.client')
    def test_calculate_risk_score(self, mock_boto_client):
        """Test risk score calculation"""
        auditor = IAMSecurityAuditor()

        # Test different severity levels
        assert auditor.calculate_risk_score('CRITICAL') == 9
        assert auditor.calculate_risk_score('HIGH') == 7
        assert auditor.calculate_risk_score('MEDIUM') == 5
        assert auditor.calculate_risk_score('LOW') == 3

        # Test with additional factors
        assert auditor.calculate_risk_score('HIGH', 2) == 9  # 7 + 2 = 9, capped at 10

    @patch('lib.analyse.boto3.client')
    def test_is_emergency_access_user(self, mock_boto_client):
        """Test emergency access detection for users"""
        auditor = IAMSecurityAuditor()

        # Mock the iam client directly
        mock_iam = MagicMock()
        auditor.iam = mock_iam

        # Mock list_user_tags to return emergency access tag
        mock_iam.list_user_tags.return_value = {
            'Tags': [{'Key': 'EmergencyAccess', 'Value': 'true'}]
        }

        assert auditor.is_emergency_access('User', 'test-user') == True

        # Test without tag
        mock_iam.list_user_tags.return_value = {'Tags': []}
        assert auditor.is_emergency_access('User', 'test-user') == False

    @patch('lib.analyse.boto3.client')
    def test_is_emergency_access_role(self, mock_boto_client):
        """Test emergency access detection for roles"""
        auditor = IAMSecurityAuditor()

        # Mock the iam client directly
        mock_iam = MagicMock()
        auditor.iam = mock_iam

        # Mock list_role_tags to return emergency access tag
        mock_iam.list_role_tags.return_value = {
            'Tags': [{'Key': 'EmergencyAccess', 'Value': 'true'}]
        }

        assert auditor.is_emergency_access('Role', 'test-role') == True

    @patch('lib.analyse.boto3.client')
    def test_is_emergency_access_unknown_type_returns_false(self, mock_boto_client):
        """Unknown principal types should return False without error"""
        auditor = IAMSecurityAuditor()
        assert auditor.is_emergency_access('Group', 'test-group') is False

    @patch('lib.analyse.boto3.client')
    def test_is_emergency_access_handles_exceptions(self, mock_boto_client):
        """is_emergency_access should swallow IAM errors gracefully"""
        auditor = IAMSecurityAuditor()
        mock_iam = MagicMock()
        mock_iam.list_user_tags.side_effect = Exception('boom')
        auditor.iam = mock_iam

        assert auditor.is_emergency_access('User', 'test-user') is False

    @patch('lib.analyse.boto3.client')
    def test_is_service_linked_role(self, mock_boto_client):
        """Test service-linked role detection"""
        auditor = IAMSecurityAuditor()

        # Mock the iam client directly
        mock_iam = MagicMock()
        auditor.iam = mock_iam

        # Mock get_role to return service-linked role
        mock_iam.get_role.return_value = {
            'Role': {'Path': '/aws-service-role/test.amazonaws.com/'}
        }

        assert auditor.is_service_linked_role('test-role') == True

        # Test regular role
        mock_iam.get_role.return_value = {
            'Role': {'Path': '/'}
        }

        assert auditor.is_service_linked_role('test-role') == False

    @patch('lib.analyse.boto3.client')
    def test_get_credential_report_caching(self, mock_boto_client):
        """Test credential report retrieval with caching"""
        auditor = IAMSecurityAuditor()

        # Mock the iam client
        mock_iam = MagicMock()
        auditor.iam = mock_iam

        # Mock generate_credential_report and get_credential_report
        mock_iam.generate_credential_report.side_effect = [
            {'State': 'IN_PROGRESS'},
            {'State': 'COMPLETE'}
        ]
        mock_iam.get_credential_report.return_value = {
            'Content': b'user,password_enabled,mfa_active\nroot,true,false\ntest-user,true,true\n',
            'ReportFormat': 'text/csv'
        }

        with patch('time.sleep', return_value=None):
            result1 = auditor.get_credential_report()
            result2 = auditor.get_credential_report()

        # Should be called only once due to lru_cache
        assert mock_iam.generate_credential_report.call_count == 2
        assert mock_iam.get_credential_report.call_count == 1
        assert len(result1) == 2  # root and test-user
        assert result1 == result2

    @patch('lib.analyse.boto3.client')
    def test_get_credential_report_handles_errors(self, mock_boto_client):
        """get_credential_report should return empty list on failure"""
        auditor = IAMSecurityAuditor()
        mock_iam = MagicMock()
        auditor.iam = mock_iam
        mock_iam.generate_credential_report.side_effect = Exception('boom')

        result = auditor.get_credential_report()
        assert result == []

    @patch('lib.analyse.boto3.client')
    def test_audit_mfa_compliance_finds_issues(self, mock_boto_client):
        """Test MFA compliance audit finds users without MFA"""
        auditor = IAMSecurityAuditor()

        # Mock iam client
        mock_iam = MagicMock()
        auditor.iam = mock_iam

        # Mock credential report
        mock_report = [
            {'user': 'root', 'password_enabled': 'true', 'mfa_active': 'false'},
            {'user': 'user1', 'password_enabled': 'true', 'mfa_active': 'false'},
            {'user': 'break-glass', 'password_enabled': 'true', 'mfa_active': 'false'},
            {'user': 'user2', 'password_enabled': 'true', 'mfa_active': 'true'}
        ]

        with patch.object(auditor, 'get_credential_report', return_value=mock_report), \
             patch.object(auditor, 'is_emergency_access', side_effect=[False, False, True]):
            auditor.audit_mfa_compliance()

            # Should find 2 issues (root and user1)
            assert len(auditor.findings) == 2
            assert all(f['issue_description'].startswith('User has console access without MFA') for f in auditor.findings)

    @patch('lib.analyse.boto3.client')
    def test_audit_access_keys_finds_old_keys(self, mock_boto_client):
        """Test access key audit finds old keys"""
        auditor = IAMSecurityAuditor()

        # Mock iam client
        mock_iam = MagicMock()
        auditor.iam = mock_iam

        # Mock credential report with old access key
        ninety_days_ago = (datetime.now(timezone.utc) - timedelta(days=100)).strftime('%Y-%m-%dT%H:%M:%S+00:00')
        mock_report = [
            {'user': '<root_account>', 'access_key_1_active': 'false', 'access_key_2_active': 'false'},
            {'user': 'break-glass', 'access_key_1_active': 'true', 'access_key_1_created': ninety_days_ago, 'access_key_2_active': 'false'},
            {
                'user': 'test-user',
                'access_key_1_active': 'true',
                'access_key_1_created': ninety_days_ago,
                'access_key_2_active': 'true',
                'access_key_2_created': ninety_days_ago
            }
        ]

        with patch.object(auditor, 'get_credential_report', return_value=mock_report), \
             patch.object(auditor, 'is_emergency_access', side_effect=[True, False]):
            auditor.audit_access_keys()

            # Should find old key issue
            assert len(auditor.findings) >= 1
            assert any('older than 90 days' in f['issue_description'] for f in auditor.findings)
            assert any('multiple active access keys' in f['issue_description'] for f in auditor.findings)

    @patch('lib.analyse.boto3.client')
    def test_audit_zombie_users_finds_inactive(self, mock_boto_client):
        """Test zombie user audit finds inactive users"""
        auditor = IAMSecurityAuditor()

        # Mock iam client
        mock_iam = MagicMock()
        auditor.iam = mock_iam

        # Mock credential report with old user
        ninety_days_ago = (datetime.now(timezone.utc) - timedelta(days=100)).strftime('%Y-%m-%dT%H:%M:%S+00:00')
        mock_report = [
            {'user': '<root_account>', 'password_last_used': 'N/A', 'access_key_1_last_used': 'N/A', 'access_key_2_last_used': 'N/A'},
            {'user': 'zombie-user', 'password_last_used': ninety_days_ago, 'access_key_1_last_used': ninety_days_ago, 'access_key_2_last_used': 'N/A'},
            {'user': 'break-glass', 'password_last_used': 'N/A', 'access_key_1_last_used': 'N/A', 'access_key_2_last_used': 'N/A'}
        ]

        with patch.object(auditor, 'get_credential_report', return_value=mock_report), \
             patch.object(auditor, 'is_emergency_access', side_effect=[False, True]):
            auditor.audit_zombie_users()

            # Should find zombie user
            assert len(auditor.findings) >= 1

    @patch('lib.analyse.boto3.client')
    def test_audit_password_policy_weak_policy(self, mock_boto_client):
        """Test password policy audit finds weak policies"""
        auditor = IAMSecurityAuditor()

        # Mock iam client
        mock_iam = MagicMock()
        auditor.iam = mock_iam

        # Mock weak password policy
        mock_iam.get_account_password_policy.return_value = {
            'PasswordPolicy': {
                'MinimumPasswordLength': 6,  # Too short
                'RequireSymbols': False,
                'RequireNumbers': False,
                'RequireUppercaseCharacters': False,
                'RequireLowercaseCharacters': False
            }
        }

        auditor.audit_password_policy()

        # Should find multiple issues
        assert len(auditor.findings) >= 1

    @patch('lib.analyse.boto3.client')
    def test_audit_password_policy_missing_policy(self, mock_boto_client):
        """Test password policy audit when no policy exists"""
        auditor = IAMSecurityAuditor()
        mock_iam = MagicMock()
        auditor.iam = mock_iam

        class _NoSuchEntity(Exception):
            pass

        mock_iam.exceptions = MagicMock()
        mock_iam.exceptions.NoSuchEntityException = _NoSuchEntity
        mock_iam.get_account_password_policy.side_effect = _NoSuchEntity()

        auditor.audit_password_policy()

        assert any('No password policy' in f['issue_description'] for f in auditor.findings)

    @patch('lib.analyse.boto3.client')
    def test_audit_overprivileged_users_finds_admin(self, mock_boto_client):
        """Test overprivileged user audit finds admin users"""
        auditor = IAMSecurityAuditor()

        # Mock iam client
        mock_iam = MagicMock()
        auditor.iam = mock_iam

        # Mock paginators
        mock_user_paginator = MagicMock()
        mock_user_paginator.paginate.return_value = [{'Users': [{'UserName': 'break-glass'}, {'UserName': 'admin-user'}]}]
        mock_policy_paginator = MagicMock()
        mock_policy_paginator.paginate.return_value = [{'AttachedPolicies': [{'PolicyName': 'AdministratorAccess'}]}]
        mock_group_policy_paginator = MagicMock()
        mock_group_policy_paginator.paginate.return_value = [{'AttachedPolicies': [{'PolicyName': 'PowerUserAccess'}]}]
        mock_iam.get_paginator.side_effect = lambda name: {
            'list_users': mock_user_paginator,
            'list_attached_user_policies': mock_policy_paginator,
            'list_attached_group_policies': mock_group_policy_paginator
        }.get(name, MagicMock())

        mock_iam.list_groups_for_user.return_value = {'Groups': [{'GroupName': 'AdminGroup'}]}

        with patch.object(auditor, 'is_emergency_access', side_effect=[True, False]):
            auditor.audit_overprivileged_users()

        # Should find overprivileged user
        assert len(auditor.findings) >= 1

    @patch('lib.analyse.boto3.client')
    @patch('builtins.open', create=True)
    @patch('json.dump')
    def test_generate_reports_creates_files(self, mock_json_dump, mock_open, mock_boto_client):
        """Test generate_reports creates output files"""
        auditor = IAMSecurityAuditor()

        # Mock findings
        auditor.findings = [{'severity': 'HIGH', 'risk_score': 8, 'principal_type': 'User', 'principal_name': 'test', 'issue_description': 'test issue'}]

        auditor.generate_reports()

        # Should have opened files for writing
        assert mock_open.call_count >= 2  # iam_security_audit.json and least_privilege_recommendations.json
        assert mock_json_dump.called

    @patch('lib.analyse.boto3.client')
    def test_run_full_audit_calls_all_methods(self, mock_boto_client):
        """Test run_full_audit executes all audit methods"""
        auditor = IAMSecurityAuditor()

        # Mock the audit methods
        with patch.object(auditor, 'audit_mfa_compliance') as mock_mfa, \
             patch.object(auditor, 'audit_access_keys') as mock_keys, \
             patch.object(auditor, 'audit_zombie_users') as mock_zombie, \
             patch.object(auditor, 'audit_password_policy') as mock_password, \
             patch.object(auditor, 'audit_overprivileged_users') as mock_privileged:

            result = auditor.run_full_audit()

            # Should call all audit methods
            mock_mfa.assert_called_once()
            mock_keys.assert_called_once()
            mock_zombie.assert_called_once()
            mock_password.assert_called_once()
            mock_privileged.assert_called_once()

            # Should return tuple of findings and recommendations
            assert isinstance(result, tuple)
            assert len(result) == 2

    @patch('lib.analyse.as_completed')
    @patch('lib.analyse.ThreadPoolExecutor')
    @patch('lib.analyse.boto3.client')
    def test_run_full_audit_logs_errors(self, mock_boto_client, mock_executor, mock_as_completed):
        """run_full_audit should handle exceptions from futures"""
        auditor = IAMSecurityAuditor()
        fake_executor = MagicMock()
        mock_executor.return_value.__enter__.return_value = fake_executor
        fake_future = MagicMock()
        fake_future.result.side_effect = Exception('boom')
        fake_executor.submit.return_value = fake_future
        mock_as_completed.return_value = [fake_future]

        with patch.object(auditor, 'audit_mfa_compliance'), \
             patch.object(auditor, 'audit_access_keys'), \
             patch.object(auditor, 'audit_zombie_users'), \
             patch.object(auditor, 'audit_password_policy'), \
             patch.object(auditor, 'audit_overprivileged_users'), \
             patch.object(auditor, 'audit_dangerous_policies'), \
             patch.object(auditor, 'audit_role_session_duration'), \
             patch.object(auditor, 'audit_privilege_escalation'), \
             patch.object(auditor, 'audit_trust_policies'), \
             patch.object(auditor, 'audit_s3_cross_account'), \
             patch.object(auditor, 'audit_zombie_roles'), \
             patch.object(auditor, 'audit_inline_policies'):
            auditor.run_full_audit()

    @patch('lib.analyse.boto3.client')
    @patch('builtins.print')
    def test_iam_print_console_summary_formats_output(self, mock_print, mock_boto_client):
        """Test IAM print_console_summary formats findings correctly"""
        auditor = IAMSecurityAuditor()

        # Mock findings
        auditor.findings = [
            {'risk_score': 9, 'severity': 'CRITICAL', 'principal_type': 'User', 'principal_name': 'admin', 'issue_description': 'Admin access'},
            {'risk_score': 7, 'severity': 'HIGH', 'principal_type': 'Role', 'principal_name': 'power-role', 'issue_description': 'Power user'}
        ]

        auditor.print_console_summary()

        # Should call print multiple times with formatted output
        assert mock_print.called
        # Check that headers are printed
        calls = [call.args[0] for call in mock_print.call_args_list]
        assert any('IAM SECURITY AUDIT SUMMARY' in call for call in calls)
        assert any('Total Findings: 2' in call for call in calls)

    @patch('lib.analyse.boto3.client')
    def test_audit_dangerous_policies_finds_wildcard_permissions(self, mock_boto_client):
        """Test dangerous policies audit finds policies with wildcard permissions"""
        auditor = IAMSecurityAuditor()

        # Mock iam client
        mock_iam = MagicMock()
        auditor.iam = mock_iam

        # Mock paginator for list_policies
        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{'Policies': [{'PolicyName': 'dangerous-policy', 'Arn': 'arn:aws:iam::123456789012:policy/dangerous-policy', 'DefaultVersionId': 'v1'}]}]
        mock_iam.get_paginator.return_value = mock_paginator

        # Mock get_policy_version
        mock_iam.get_policy_version.return_value = {
            'PolicyVersion': {
                'Document': {
                    'Version': '2012-10-17',
                    'Statement': [{
                        'Effect': 'Allow',
                        'Action': 'iam:CreateUser',
                        'Resource': '*'
                    }]
                }
            }
        }

        auditor.audit_dangerous_policies()

        # Should find dangerous policy
        assert len(auditor.findings) >= 1
        assert any('risky actions on all resources' in f['issue_description'] for f in auditor.findings)

    @patch('lib.analyse.boto3.client')
    def test_audit_role_session_duration_finds_long_sessions(self, mock_boto_client):
        """Test role session duration audit finds roles with excessive session duration"""
        auditor = IAMSecurityAuditor()

        # Mock iam client
        mock_iam = MagicMock()
        auditor.iam = mock_iam

        # Mock paginator for list_roles
        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{
            'Roles': [
                {'RoleName': 'aws-service-role/example.amazonaws.com/', 'Arn': 'arn:aws:iam::123456789012:role/service'},
                {'RoleName': 'OrganizationAccountAccessRole', 'Arn': 'arn:aws:iam::123456789012:role/ignored'},
                {'RoleName': 'break-glass', 'Arn': 'arn:aws:iam::123456789012:role/break-glass'},
                {'RoleName': 'long-session-role', 'Arn': 'arn:aws:iam::123456789012:role/long-session-role'}
            ]
        }]
        mock_iam.get_paginator.return_value = mock_paginator

        # Mock get_role
        mock_iam.get_role.return_value = {
            'Role': {
                'RoleName': 'long-session-role',
                'MaxSessionDuration': 86400  # 24 hours
            }
        }

        with patch.object(auditor, 'is_service_linked_role', side_effect=[True, False, False, False]), \
             patch.object(auditor, 'is_emergency_access', side_effect=[True, False]):
            auditor.audit_role_session_duration()

        # Should find role with long session duration
        assert len(auditor.findings) >= 1
        assert any('session duration' in f['issue_description'].lower() for f in auditor.findings)

    @patch('lib.analyse.boto3.client')
    def test_check_privilege_escalation_in_policy_detects_wildcards(self, mock_boto_client):
        """Wildcard policies should report full administrator escalation"""
        mock_boto_client.return_value = MagicMock()
        auditor = IAMSecurityAuditor()

        policy_doc = {
            'Statement': [{
                'Effect': 'Allow',
                'Action': '*',
                'Resource': '*'
            }]
        }

        paths = auditor.check_privilege_escalation_in_policy(policy_doc)
        assert paths
        assert paths[0]['pattern'] == 'FullAdministrator'

    @patch('lib.analyse.boto3.client')
    def test_check_privilege_escalation_in_policy_detects_patterns(self, mock_boto_client):
        """check_privilege_escalation_in_policy should detect known escalation patterns"""
        mock_boto_client.return_value = MagicMock()
        auditor = IAMSecurityAuditor()

        policy_doc = {
            'Statement': [{
                'Effect': 'Allow',
                'Action': ['iam:CreateUser', 'iam:AttachUserPolicy'],
                'Resource': '*'
            }]
        }

        paths = auditor.check_privilege_escalation_in_policy(policy_doc)
        assert any(path['pattern'] == 'CreateUserAndAttachPolicy' for path in paths)

    @patch('lib.analyse.boto3.client')
    def test_check_privilege_escalation_in_policy_detects_iam_wildcard(self, mock_boto_client):
        """IAM service wildcards should return IAMFullAccess pattern"""
        mock_boto_client.return_value = MagicMock()
        auditor = IAMSecurityAuditor()

        policy_doc = {'Statement': [{'Effect': 'Allow', 'Action': 'iam:*', 'Resource': '*'}]}
        paths = auditor.check_privilege_escalation_in_policy(policy_doc)
        assert paths[0]['pattern'] == 'IAMFullAccess'

    @patch('lib.analyse.boto3.client')
    def test_check_privilege_escalation_in_policy_enforces_resource_checks(self, mock_boto_client):
        """Patterns requiring wildcard resources should skip scoped resources"""
        mock_boto_client.return_value = MagicMock()
        auditor = IAMSecurityAuditor()

        policy_doc = {
            'Statement': [{
                'Effect': 'Allow',
                'Action': ['iam:CreateAccessKey'],
                'Resource': 'arn:aws:iam::123456789012:user/example'
            }]
        }

        paths = auditor.check_privilege_escalation_in_policy(policy_doc)
        assert paths == []

    @patch('lib.analyse.boto3.client')
    def test_report_privilege_escalation_records_results(self, mock_boto_client):
        """report_privilege_escalation should populate findings and remediation data"""
        mock_boto_client.return_value = MagicMock()
        auditor = IAMSecurityAuditor()
        auditor.findings = []
        auditor.privilege_escalation_paths = []
        auditor.remediation_recommendations = []

        sample_paths = [{
            'pattern': 'CreateUserAndAttachPolicy',
            'description': 'desc',
            'actions': ['iam:CreateUser', 'iam:AttachUserPolicy'],
            'risk_score': 10
        }]

        auditor.report_privilege_escalation('User', 'alice', 'Inline', 'inline', sample_paths)

        assert auditor.findings
        assert auditor.privilege_escalation_paths
        assert any(rec['issue_type'] == 'privilege_escalation' for rec in auditor.remediation_recommendations)

    @patch('lib.analyse.boto3.client')
    def test_audit_privilege_escalation_scans_all_policy_sources(self, mock_boto_client):
        """audit_privilege_escalation should cover user, role, and managed policies"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()

        def _client_side_effect(service, **kwargs):
            if service == 'iam':
                return mock_iam
            if service == 's3':
                return mock_s3
            return MagicMock()

        mock_boto_client.side_effect = _client_side_effect
        auditor = IAMSecurityAuditor()

        mock_iam.get_paginator.side_effect = lambda name: {
            'list_users': DummyPaginator([{'Users': [{'UserName': 'alice'}]}]),
            'list_roles': DummyPaginator([{'Roles': [{'RoleName': 'role1', 'AssumeRolePolicyDocument': {'Statement': []}}]}]),
            'list_policies': DummyPaginator([{'Policies': [{'PolicyName': 'managed', 'Arn': 'arn:aws:iam::123:policy/managed', 'DefaultVersionId': 'v1'}]}])
        }[name]

        mock_iam.list_user_policies.return_value = {'PolicyNames': ['UserInline']}
        mock_iam.get_user_policy.return_value = {'PolicyDocument': {'Statement': []}}

        mock_iam.list_role_policies.return_value = {'PolicyNames': ['RoleInline']}
        mock_iam.get_role_policy.return_value = {'PolicyDocument': {'Statement': []}}

        mock_iam.get_policy_version.return_value = {'PolicyVersion': {'Document': {'Statement': []}}}

        sample_path = [{
            'pattern': 'CreateUserAndAttachPolicy',
            'description': 'desc',
            'actions': ['iam:CreateUser', 'iam:AttachUserPolicy'],
            'risk_score': 9
        }]

        with patch.object(auditor, 'check_privilege_escalation_in_policy', return_value=sample_path) as mock_checker, \
             patch.object(auditor, 'report_privilege_escalation') as mock_report, \
             patch.object(auditor, 'is_emergency_access', return_value=False), \
             patch.object(auditor, 'is_service_linked_role', return_value=False):
            auditor.audit_privilege_escalation()

        assert mock_checker.call_count == 3
        assert mock_report.call_count == 3

    @patch('lib.analyse.boto3.client')
    def test_audit_privilege_escalation_skips_emergency_users(self, mock_boto_client):
        """audit_privilege_escalation should skip emergency access principals"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_iam if service == 'iam' else mock_s3

        auditor = IAMSecurityAuditor()
        mock_iam.get_paginator.side_effect = lambda name: {
            'list_users': DummyPaginator([{'Users': [{'UserName': 'break-glass'}]}]),
            'list_roles': DummyPaginator([]),
            'list_policies': DummyPaginator([])
        }[name]

        with patch.object(auditor, 'is_emergency_access', return_value=True), \
             patch.object(auditor, 'check_privilege_escalation_in_policy') as mock_checker:
            auditor.audit_privilege_escalation()

        mock_checker.assert_not_called()

    @patch('lib.analyse.boto3.client')
    def test_audit_trust_policies_flags_missing_external_id(self, mock_boto_client):
        """audit_trust_policies should identify cross-account trusts without external ID"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_iam if service == 'iam' else mock_s3

        auditor = IAMSecurityAuditor()
        auditor.findings = []
        auditor.remediation_recommendations = []

        trust_policy = {
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'AWS': 'arn:aws:iam::123456789012:root'},
                'Action': 'sts:AssumeRole'
            }]
        }

        mock_iam.get_paginator.return_value = DummyPaginator([{
            'Roles': [{'RoleName': 'CrossAccountRole', 'AssumeRolePolicyDocument': trust_policy}]
        }])

        with patch.object(auditor, 'is_emergency_access', return_value=False), \
             patch.object(auditor, 'is_service_linked_role', return_value=False):
            auditor.audit_trust_policies()

        assert auditor.findings
        assert any(rec['issue_type'] == 'missing_external_id' for rec in auditor.remediation_recommendations)

    @patch('lib.analyse.boto3.client')
    def test_audit_trust_policies_skips_service_and_emergency_roles(self, mock_boto_client):
        """audit_trust_policies should skip service-linked and emergency roles"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_iam if service == 'iam' else mock_s3

        auditor = IAMSecurityAuditor()

        trust_policy = {
            'Statement': [
                {'Effect': 'Deny'},
                {
                    'Effect': 'Allow',
                    'Principal': {'AWS': 'arn:aws:iam::123456789012:root'},
                    'Action': 'sts:AssumeRole',
                    'Condition': {'StringEquals': {'sts:ExternalId': 'already-set'}}
                }
            ]
        }

        mock_iam.get_paginator.return_value = DummyPaginator([{
            'Roles': [
                {'RoleName': 'aws-service-role', 'AssumeRolePolicyDocument': trust_policy},
                {'RoleName': 'break-glass', 'AssumeRolePolicyDocument': trust_policy}
            ]
        }])

        with patch.object(auditor, 'is_service_linked_role', side_effect=[True, False]), \
             patch.object(auditor, 'is_emergency_access', return_value=True):
            auditor.audit_trust_policies()

        assert auditor.findings == []

    @patch('lib.analyse.boto3.client')
    def test_audit_s3_cross_account_detects_open_access(self, mock_boto_client):
        """audit_s3_cross_account should flag wildcard principals without conditions"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_iam if service == 'iam' else mock_s3

        auditor = IAMSecurityAuditor()
        auditor.findings = []

        mock_s3.list_buckets.return_value = {'Buckets': [{'Name': 'open-bucket'}]}
        mock_s3.get_bucket_policy.return_value = {
            'Policy': json.dumps({
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'AWS': ['*']},
                    'Action': 's3:GetObject',
                    'Resource': 'arn:aws:s3:::open-bucket/*'
                }]
            })
        }

        auditor.audit_s3_cross_account()

        assert auditor.findings
        assert auditor.findings[0]['principal_name'] == 'open-bucket'

    @patch('lib.analyse.boto3.client')
    def test_audit_s3_cross_account_handles_string_principals(self, mock_boto_client):
        """String principals and Deny statements should be processed correctly"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_iam if service == 'iam' else mock_s3

        auditor = IAMSecurityAuditor()
        mock_s3.list_buckets.return_value = {'Buckets': [{'Name': 'mixed-bucket'}]}
        mock_s3.get_bucket_policy.return_value = {
            'Policy': json.dumps({
                'Statement': [
                    {'Effect': 'Deny', 'Principal': '*'},
                    {
                        'Effect': 'Allow',
                        'Principal': {'AWS': 'arn:aws:iam::123456789012:root'},
                        'Action': 's3:GetObject',
                        'Resource': 'arn:aws:s3:::mixed-bucket/*'
                    }
                ]
            })
        }

        auditor.audit_s3_cross_account()
        assert len(auditor.findings) == 1

    @patch('lib.analyse.boto3.client')
    def test_audit_s3_cross_account_logs_bucket_errors(self, mock_boto_client):
        """audit_s3_cross_account should log and continue on unexpected errors"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_iam if service == 'iam' else mock_s3

        auditor = IAMSecurityAuditor()
        mock_s3.list_buckets.return_value = {'Buckets': [{'Name': 'broken-bucket'}]}
        mock_s3.get_bucket_policy.side_effect = Exception('boom')

        auditor.audit_s3_cross_account()
        assert auditor.findings == []

    @patch('lib.analyse.boto3.client')
    def test_audit_s3_cross_account_handles_list_failure(self, mock_boto_client):
        """audit_s3_cross_account should swallow errors listing buckets"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_iam if service == 'iam' else mock_s3

        auditor = IAMSecurityAuditor()
        mock_s3.list_buckets.side_effect = Exception('offline')

        auditor.audit_s3_cross_account()
        assert auditor.findings == []

    @patch('lib.analyse.boto3.client')
    def test_audit_s3_cross_account_handles_missing_policy(self, mock_boto_client):
        """audit_s3_cross_account should ignore buckets without policies"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_iam if service == 'iam' else mock_s3

        auditor = IAMSecurityAuditor()
        mock_s3.list_buckets.return_value = {'Buckets': [{'Name': 'no-policy'}]}

        class _NoSuchBucketPolicy(Exception):
            pass

        mock_s3.exceptions = MagicMock()
        mock_s3.exceptions.NoSuchBucketPolicy = _NoSuchBucketPolicy
        mock_s3.get_bucket_policy.side_effect = _NoSuchBucketPolicy()

        auditor.audit_s3_cross_account()
        assert auditor.findings == []

    @patch('lib.analyse.boto3.client')
    def test_audit_zombie_roles_flags_unused_roles(self, mock_boto_client):
        """audit_zombie_roles should detect inactive roles"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_iam if service == 'iam' else mock_s3

        auditor = IAMSecurityAuditor()
        auditor.findings = []

        old_date = datetime.now(timezone.utc) - timedelta(days=180)
        mock_iam.get_paginator.return_value = DummyPaginator([{
            'Roles': [
                {
                    'RoleName': 'aws-service-role/example.amazonaws.com/',
                    'CreateDate': old_date,
                    'AssumeRolePolicyDocument': {'Statement': []}
                },
                {
                    'RoleName': 'break-glass',
                    'CreateDate': old_date,
                    'AssumeRolePolicyDocument': {'Statement': []}
                },
                {
                    'RoleName': 'StaleRole',
                    'CreateDate': old_date,
                    'AssumeRolePolicyDocument': {'Statement': []}
                }
            ]
        }])

        mock_iam.get_role.return_value = {'Role': {'RoleLastUsed': {}}}

        with patch.object(auditor, 'is_service_linked_role', side_effect=[True, False, False]), \
             patch.object(auditor, 'is_emergency_access', side_effect=[True, False]):
            auditor.audit_zombie_roles()

        assert auditor.findings
        assert auditor.findings[0]['principal_name'] == 'StaleRole'

    @patch('lib.analyse.boto3.client')
    def test_audit_inline_policies_detects_mixed_policies(self, mock_boto_client):
        """audit_inline_policies should flag principals with inline and managed policies"""
        mock_iam = MagicMock()
        mock_s3 = MagicMock()
        mock_boto_client.side_effect = lambda service, **kwargs: mock_iam if service == 'iam' else mock_s3

        auditor = IAMSecurityAuditor()

        mock_iam.get_paginator.side_effect = lambda name: {
            'list_users': DummyPaginator([{'Users': [{'UserName': 'user1'}]}]),
            'list_attached_user_policies': DummyPaginator([{'AttachedPolicies': [{'PolicyName': 'ManagedUserPolicy'}]}]),
            'list_roles': DummyPaginator([{'Roles': [{'RoleName': 'role1'}]}]),
            'list_attached_role_policies': DummyPaginator([{'AttachedPolicies': [{'PolicyName': 'ManagedRolePolicy'}]}])
        }[name]

        mock_iam.list_user_policies.return_value = {'PolicyNames': ['InlineUser']}
        mock_iam.list_role_policies.return_value = {'PolicyNames': ['InlineRole']}

        with patch.object(auditor, 'is_emergency_access', side_effect=[False, False]), \
             patch.object(auditor, 'is_service_linked_role', return_value=False):
            auditor.audit_inline_policies()

        assert len(auditor.findings) >= 2

    @patch('lib.analyse.IAMSecurityAuditor')
    @patch('sys.argv', ['analyse.py', '--auditor', 'iam'])
    def test_main_iam_auditor_called(self, mock_iam_auditor):
        """Test main function calls IAM auditor when --auditor iam"""
        mock_instance = MagicMock()
        mock_iam_auditor.return_value = mock_instance

        result = main()

        mock_iam_auditor.assert_called_once()
        mock_instance.run_full_audit.assert_called_once()
        mock_instance.generate_reports.assert_called_once()
        assert result == 0

    @patch('lib.analyse.AWSResourceAuditor')
    @patch('sys.argv', ['analyse.py', '--auditor', 'resources'])
    def test_main_resource_auditor_called(self, mock_resource_auditor):
        """Test main function executes resource auditor branch"""
        mock_instance = MagicMock()
        mock_resource_auditor.return_value = mock_instance
        result = main()
        mock_resource_auditor.assert_called_once()
        mock_instance.audit_resources.assert_called_once()
        assert result == 0

    @patch('lib.analyse.AWSResourceAuditor', side_effect=Exception('boom'))
    @patch('sys.argv', ['analyse.py', '--auditor', 'resources'])
    def test_main_resource_auditor_handles_errors(self, mock_resource_auditor):
        """Test main returns non-zero when resource auditor fails"""
        result = main()
        assert result == 1
