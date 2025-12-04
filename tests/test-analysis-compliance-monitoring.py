#!/usr/bin/env python3
"""
Tests for the compliance monitoring analysis script
"""

import os
import sys
import pytest
import json
from unittest.mock import Mock, patch, MagicMock

# Add lib directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

from analyse import ComplianceMonitoringAnalyzer


@pytest.fixture
def mock_aws_clients():
    """Fixture to mock AWS clients"""
    with patch('boto3.client') as mock_client:
        # Create mock clients
        mock_lambda = MagicMock()
        mock_cloudwatch = MagicMock()
        mock_logs = MagicMock()
        mock_sns = MagicMock()
        mock_s3 = MagicMock()
        mock_events = MagicMock()

        # Configure mock_client to return appropriate mock based on service name
        def get_mock_client(service, **kwargs):
            clients = {
                'lambda': mock_lambda,
                'cloudwatch': mock_cloudwatch,
                'logs': mock_logs,
                'sns': mock_sns,
                's3': mock_s3,
                'events': mock_events
            }
            return clients.get(service, MagicMock())

        mock_client.side_effect = get_mock_client

        yield {
            'lambda': mock_lambda,
            'cloudwatch': mock_cloudwatch,
            'logs': mock_logs,
            'sns': mock_sns,
            's3': mock_s3,
            'events': mock_events
        }


@pytest.fixture
def analyzer(mock_aws_clients):
    """Fixture to create analyzer instance"""
    return ComplianceMonitoringAnalyzer(
        region='us-east-1',
        endpoint_url='http://localhost:5001'
    )


class TestComplianceMonitoringAnalyzer:
    """Test suite for ComplianceMonitoringAnalyzer"""

    def test_analyzer_initialization(self, analyzer):
        """Test analyzer initializes correctly"""
        assert analyzer.region == 'us-east-1'
        assert analyzer.endpoint_url == 'http://localhost:5001'
        assert analyzer.timestamp is not None

    def test_analyze_lambda_functions_success(self, analyzer, mock_aws_clients):
        """Test successful Lambda function analysis"""
        # Mock Lambda function response
        mock_aws_clients['lambda'].get_function.return_value = {
            'Configuration': {
                'FunctionName': 'compliance-analyzer-test',
                'Runtime': 'nodejs18.x',
                'MemorySize': 256,
                'Timeout': 60
            }
        }

        result = analyzer.analyze_lambda_functions('test')

        assert 'total_functions' in result
        assert 'functions' in result
        assert 'issues' in result

    def test_analyze_lambda_functions_not_found(self, analyzer, mock_aws_clients):
        """Test Lambda function analysis when function not found"""
        # Mock ResourceNotFoundException
        from botocore.exceptions import ClientError
        mock_aws_clients['lambda'].get_function.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Function not found'}},
            'GetFunction'
        )

        result = analyzer.analyze_lambda_functions('test')

        assert len(result['issues']) > 0
        assert any('Not found' in issue for issue in result['issues'])

    def test_analyze_lambda_functions_memory_warning(self, analyzer, mock_aws_clients):
        """Test Lambda function analysis detects low memory"""
        # Mock Lambda function with low memory
        mock_aws_clients['lambda'].get_function.return_value = {
            'Configuration': {
                'FunctionName': 'compliance-analyzer-test',
                'Runtime': 'nodejs18.x',
                'MemorySize': 64,  # Too low
                'Timeout': 60
            }
        }

        result = analyzer.analyze_lambda_functions('test')

        # Should have issue about low memory
        assert any('Memory too low' in issue for issue in result['issues'])

    def test_analyze_cloudwatch_resources(self, analyzer, mock_aws_clients):
        """Test CloudWatch resources analysis"""
        # Mock CloudWatch responses
        mock_aws_clients['logs'].describe_log_groups.return_value = {
            'logGroups': [
                {
                    'logGroupName': '/aws/lambda/compliance-test',
                    'retentionInDays': 7
                }
            ]
        }

        mock_aws_clients['cloudwatch'].describe_alarms.return_value = {
            'MetricAlarms': [
                {
                    'AlarmName': 'compliance-violations-test',
                    'MetricName': 'ViolationCount',
                    'StateValue': 'OK',
                    'Threshold': 5.0
                }
            ]
        }

        result = analyzer.analyze_cloudwatch_resources('test')

        assert 'log_groups' in result
        assert 'alarms' in result
        assert 'issues' in result
        assert len(result['log_groups']) >= 0
        assert len(result['alarms']) >= 0

    def test_analyze_sns_topics(self, analyzer, mock_aws_clients):
        """Test SNS topics analysis"""
        # Mock SNS responses
        mock_aws_clients['sns'].list_topics.return_value = {
            'Topics': [
                {'TopicArn': 'arn:aws:sns:us-east-1:123456789012:compliance-test'}
            ]
        }

        mock_aws_clients['sns'].list_subscriptions_by_topic.return_value = {
            'Subscriptions': [
                {
                    'Protocol': 'email',
                    'Endpoint': 'security@example.com',
                    'SubscriptionArn': 'arn:aws:sns:us-east-1:123456789012:compliance-test:sub-id'
                }
            ]
        }

        result = analyzer.analyze_sns_topics('test')

        assert 'topics' in result
        assert 'subscriptions' in result
        assert 'issues' in result

    def test_analyze_s3_buckets(self, analyzer, mock_aws_clients):
        """Test S3 buckets analysis"""
        # Mock S3 responses
        mock_aws_clients['s3'].list_buckets.return_value = {
            'Buckets': [
                {
                    'Name': 'compliance-reports-test',
                    'CreationDate': '2025-01-01T00:00:00Z'
                }
            ]
        }

        mock_aws_clients['s3'].get_bucket_versioning.return_value = {
            'Status': 'Enabled'
        }

        mock_aws_clients['s3'].get_bucket_encryption.return_value = {
            'ServerSideEncryptionConfiguration': {}
        }

        result = analyzer.analyze_s3_buckets('test')

        assert 'buckets' in result
        assert 'issues' in result

    def test_analyze_s3_buckets_no_encryption(self, analyzer, mock_aws_clients):
        """Test S3 bucket analysis detects missing encryption"""
        # Mock S3 responses
        mock_aws_clients['s3'].list_buckets.return_value = {
            'Buckets': [
                {
                    'Name': 'compliance-reports-test',
                    'CreationDate': '2025-01-01T00:00:00Z'
                }
            ]
        }

        mock_aws_clients['s3'].get_bucket_versioning.return_value = {
            'Status': 'Enabled'
        }

        # Mock no encryption
        from botocore.exceptions import ClientError
        mock_aws_clients['s3'].get_bucket_encryption.side_effect = ClientError(
            {'Error': {'Code': 'ServerSideEncryptionConfigurationNotFoundError'}},
            'GetBucketEncryption'
        )

        result = analyzer.analyze_s3_buckets('test')

        # Should have issue about missing encryption
        assert any('Encryption not enabled' in issue for issue in result['issues'])

    def test_analyze_eventbridge_rules(self, analyzer, mock_aws_clients):
        """Test EventBridge rules analysis"""
        # Mock EventBridge responses
        mock_aws_clients['events'].list_rules.return_value = {
            'Rules': [
                {
                    'Name': 'daily-compliance-scan-test',
                    'State': 'ENABLED',
                    'ScheduleExpression': 'cron(0 0 * * ? *)'
                }
            ]
        }

        result = analyzer.analyze_eventbridge_rules('test')

        assert 'rules' in result
        assert 'issues' in result

    def test_analyze_eventbridge_rules_disabled(self, analyzer, mock_aws_clients):
        """Test EventBridge rules analysis detects disabled rules"""
        # Mock EventBridge responses with disabled rule
        mock_aws_clients['events'].list_rules.return_value = {
            'Rules': [
                {
                    'Name': 'daily-compliance-scan-test',
                    'State': 'DISABLED',
                    'ScheduleExpression': 'cron(0 0 * * ? *)'
                }
            ]
        }

        result = analyzer.analyze_eventbridge_rules('test')

        # Should have issue about disabled rule
        assert any('Not enabled' in issue for issue in result['issues'])

    def test_generate_report(self, analyzer, mock_aws_clients):
        """Test comprehensive report generation"""
        # Mock all service responses
        mock_aws_clients['lambda'].get_function.return_value = {
            'Configuration': {
                'FunctionName': 'compliance-analyzer-test',
                'Runtime': 'nodejs18.x',
                'MemorySize': 256,
                'Timeout': 60
            }
        }

        mock_aws_clients['logs'].describe_log_groups.return_value = {'logGroups': []}
        mock_aws_clients['cloudwatch'].describe_alarms.return_value = {'MetricAlarms': []}
        mock_aws_clients['sns'].list_topics.return_value = {'Topics': []}
        mock_aws_clients['s3'].list_buckets.return_value = {'Buckets': []}
        mock_aws_clients['events'].list_rules.return_value = {'Rules': []}

        report = analyzer.generate_report('test')

        # Verify report structure
        assert 'timestamp' in report
        assert 'environment_suffix' in report
        assert report['environment_suffix'] == 'test'
        assert 'region' in report
        assert report['region'] == 'us-east-1'
        assert 'lambda_functions' in report
        assert 'cloudwatch_resources' in report
        assert 'sns_topics' in report
        assert 's3_buckets' in report
        assert 'eventbridge_rules' in report
        assert 'summary' in report

        # Verify summary structure
        summary = report['summary']
        assert 'total_issues' in summary
        assert 'issues' in summary
        assert 'lambda_functions_count' in summary
        assert 'log_groups_count' in summary
        assert 'alarms_count' in summary
        assert 'sns_topics_count' in summary
        assert 's3_buckets_count' in summary
        assert 'eventbridge_rules_count' in summary


def test_main_function(mock_aws_clients, tmp_path):
    """Test main function execution"""
    # Set environment variables
    os.environ['AWS_REGION'] = 'us-east-1'
    os.environ['AWS_ENDPOINT_URL'] = 'http://localhost:5001'
    os.environ['ENVIRONMENT_SUFFIX'] = 'test'

    # Change to temp directory to avoid file pollution
    original_dir = os.getcwd()
    os.chdir(tmp_path)

    try:
        from analyse import main

        # Mock all AWS service calls
        with patch('boto3.client'):
            result = main()

            # Check that analysis report was created
            assert os.path.exists('compliance-monitoring-analysis.json')

            # Verify report can be loaded
            with open('compliance-monitoring-analysis.json', 'r') as f:
                report = json.load(f)
                assert 'timestamp' in report
                assert 'environment_suffix' in report

    finally:
        os.chdir(original_dir)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
