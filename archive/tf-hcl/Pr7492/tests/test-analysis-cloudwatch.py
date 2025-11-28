#!/usr/bin/env python3
"""
Test suite for CloudWatch Observability Platform Analysis Script

These tests validate the analyze.py script functionality using the Moto mock server.
Tests verify that the analysis script correctly creates and validates AWS resources.
"""

import boto3
import pytest
import os
import sys

# Add lib directory to path for importing analyse module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

from analyse import CloudWatchObservabilityAnalyzer, get_client, get_resource

# Configure test environment
MOTO_ENDPOINT = os.environ.get('MOTO_ENDPOINT', 'http://127.0.0.1:5001')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'test')


@pytest.fixture
def analyzer():
    """Create an analyzer instance for testing."""
    return CloudWatchObservabilityAnalyzer(ENVIRONMENT_SUFFIX)


class TestS3BucketAnalysis:
    """Test S3 bucket analysis functionality."""

    def test_analyze_s3_buckets_creates_metric_streams_bucket(self, analyzer):
        """Test that metric streams bucket is created with correct configuration."""
        result = analyzer.analyze_s3_buckets()
        assert result is True

        # Verify bucket was created
        s3 = get_client('s3')
        response = s3.list_buckets()
        bucket_names = [b['Name'] for b in response['Buckets']]
        assert f'cw-obs-{ENVIRONMENT_SUFFIX}-metric-streams' in bucket_names

    def test_analyze_s3_buckets_creates_synthetics_bucket(self, analyzer):
        """Test that synthetics artifacts bucket is created."""
        analyzer.analyze_s3_buckets()

        s3 = get_client('s3')
        response = s3.list_buckets()
        bucket_names = [b['Name'] for b in response['Buckets']]
        assert f'cw-obs-{ENVIRONMENT_SUFFIX}-synthetics-artifacts' in bucket_names

    def test_s3_bucket_has_versioning_enabled(self, analyzer):
        """Test that metric streams bucket has versioning enabled."""
        analyzer.analyze_s3_buckets()

        s3 = get_client('s3')
        bucket_name = f'cw-obs-{ENVIRONMENT_SUFFIX}-metric-streams'
        response = s3.get_bucket_versioning(Bucket=bucket_name)
        assert response.get('Status') == 'Enabled'

    def test_s3_bucket_has_encryption(self, analyzer):
        """Test that buckets have server-side encryption."""
        analyzer.analyze_s3_buckets()

        s3 = get_client('s3')
        bucket_name = f'cw-obs-{ENVIRONMENT_SUFFIX}-metric-streams'
        response = s3.get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'

    def test_s3_bucket_blocks_public_access(self, analyzer):
        """Test that buckets block public access."""
        analyzer.analyze_s3_buckets()

        s3 = get_client('s3')
        bucket_name = f'cw-obs-{ENVIRONMENT_SUFFIX}-metric-streams'
        response = s3.get_public_access_block(Bucket=bucket_name)
        config = response['PublicAccessBlockConfiguration']
        assert config['BlockPublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['RestrictPublicBuckets'] is True


class TestLambdaFunctionAnalysis:
    """Test Lambda function analysis functionality."""

    def test_analyze_lambda_creates_metric_processor(self, analyzer):
        """Test that metric processor Lambda is created."""
        result = analyzer.analyze_lambda_functions()
        assert result is True

        lambda_client = get_client('lambda')
        function_name = f'cw-obs-{ENVIRONMENT_SUFFIX}-metric-processor'
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['FunctionName'] == function_name

    def test_analyze_lambda_creates_alarm_processor(self, analyzer):
        """Test that alarm processor Lambda is created."""
        analyzer.analyze_lambda_functions()

        lambda_client = get_client('lambda')
        function_name = f'cw-obs-{ENVIRONMENT_SUFFIX}-alarm-processor'
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['FunctionName'] == function_name

    def test_lambda_uses_python311_runtime(self, analyzer):
        """Test that Lambda functions use Python 3.11 runtime."""
        analyzer.analyze_lambda_functions()

        lambda_client = get_client('lambda')
        function_name = f'cw-obs-{ENVIRONMENT_SUFFIX}-metric-processor'
        response = lambda_client.get_function(FunctionName=function_name)
        assert response['Configuration']['Runtime'] == 'python3.11'

    def test_lambda_uses_arm64_architecture(self, analyzer):
        """Test that Lambda functions use ARM64 (Graviton2) architecture."""
        analyzer.analyze_lambda_functions()

        lambda_client = get_client('lambda')
        function_name = f'cw-obs-{ENVIRONMENT_SUFFIX}-metric-processor'
        response = lambda_client.get_function(FunctionName=function_name)
        assert 'arm64' in response['Configuration']['Architectures']


class TestSNSTopicAnalysis:
    """Test SNS topic analysis functionality."""

    def test_analyze_sns_creates_severity_topics(self, analyzer):
        """Test that SNS topics are created for each severity level."""
        result = analyzer.analyze_sns_topics()
        assert result is True

        sns = get_client('sns')
        response = sns.list_topics()
        topic_arns = [t['TopicArn'] for t in response['Topics']]

        for severity in ['critical', 'warning', 'info']:
            topic_name = f'cw-obs-{ENVIRONMENT_SUFFIX}-{severity}-alarms'
            matching_topics = [arn for arn in topic_arns if topic_name in arn]
            assert len(matching_topics) == 1, f"Expected topic for {severity} severity"


class TestCloudWatchAlarmAnalysis:
    """Test CloudWatch alarm analysis functionality."""

    def test_analyze_alarms_creates_multiple_alarms(self, analyzer):
        """Test that multiple CloudWatch alarms are created."""
        result = analyzer.analyze_cloudwatch_alarms()
        assert result is True

        cloudwatch = get_client('cloudwatch')
        response = cloudwatch.describe_alarms(
            AlarmNamePrefix=f'cw-obs-{ENVIRONMENT_SUFFIX}'
        )
        assert len(response['MetricAlarms']) >= 4

    def test_alarms_have_correct_thresholds(self, analyzer):
        """Test that alarms have correct threshold configurations."""
        analyzer.analyze_cloudwatch_alarms()

        cloudwatch = get_client('cloudwatch')
        response = cloudwatch.describe_alarms(
            AlarmNamePrefix=f'cw-obs-{ENVIRONMENT_SUFFIX}'
        )

        alarm_names = [a['AlarmName'] for a in response['MetricAlarms']]
        assert any('high-cpu' in name for name in alarm_names)
        assert any('high-memory' in name for name in alarm_names)
        assert any('high-error-rate' in name for name in alarm_names)


class TestECSContainerInsightsAnalysis:
    """Test ECS Container Insights analysis functionality."""

    def test_analyze_ecs_creates_cluster(self, analyzer):
        """Test that ECS cluster is created with Container Insights enabled."""
        result = analyzer.analyze_ecs_container_insights()
        assert result is True

        ecs = get_client('ecs')
        response = ecs.describe_clusters(clusters=['microservices-cluster'])
        assert len(response['clusters']) == 1

        cluster = response['clusters'][0]
        container_insights_setting = next(
            (s for s in cluster.get('settings', []) if s['name'] == 'containerInsights'),
            None
        )
        assert container_insights_setting is not None
        assert container_insights_setting['value'] == 'enabled'


class TestIAMRoleAnalysis:
    """Test IAM role analysis functionality."""

    def test_analyze_iam_creates_required_roles(self, analyzer):
        """Test that required IAM roles are created."""
        result = analyzer.analyze_iam_roles()
        assert result is True

        iam = get_client('iam')
        response = iam.list_roles()
        role_names = [r['RoleName'] for r in response['Roles']]

        expected_roles = [
            f'cw-obs-{ENVIRONMENT_SUFFIX}-metric-streams-role',
            f'cw-obs-{ENVIRONMENT_SUFFIX}-firehose-role',
            f'cw-obs-{ENVIRONMENT_SUFFIX}-synthetics-role',
        ]

        for expected_role in expected_roles:
            assert expected_role in role_names, f"Expected role {expected_role} not found"


class TestAnalyzerSummary:
    """Test analyzer summary and results functionality."""

    def test_run_analysis_returns_pass_fail_counts(self, analyzer):
        """Test that run_analysis returns correct pass/fail counts."""
        passed, failed = analyzer.run_analysis()
        assert isinstance(passed, int)
        assert isinstance(failed, int)
        assert passed > 0

    def test_analyzer_logs_results(self, analyzer):
        """Test that analyzer properly logs test results."""
        analyzer.log_result('Test item', True, 'Test details')
        assert len(analyzer.results) == 1
        assert analyzer.results[0]['test'] == 'Test item'
        assert analyzer.results[0]['passed'] is True
        assert analyzer.passed == 1

    def test_analyzer_tracks_failures(self, analyzer):
        """Test that analyzer properly tracks failed tests."""
        analyzer.log_result('Failing test', False, 'Error details')
        assert analyzer.failed == 1
        assert analyzer.results[0]['passed'] is False
