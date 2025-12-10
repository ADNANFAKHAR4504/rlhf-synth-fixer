"""
Unit Tests for FinTech Webhook Infrastructure Analysis Script

==============================================================================
Unit tests use unittest.mock to test logic WITHOUT external services (no Moto).
These tests verify the analysis logic, error handling, and output generation.
==============================================================================
"""

import sys
import os
from datetime import datetime
from unittest.mock import MagicMock, patch, mock_open, call
from io import StringIO
import json

import pytest
from botocore.exceptions import ClientError

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import FinTechWebhookAnalyzer


class TestFinTechWebhookAnalyzer:
    """Test suite for FinTechWebhookAnalyzer class"""

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that analyzer initializes with correct AWS clients"""
        analyzer = FinTechWebhookAnalyzer(region='us-east-1')

        assert analyzer.region == 'us-east-1'
        assert analyzer.findings == []
        assert analyzer.infrastructure_data == {}

        # Verify all required AWS clients are created
        assert mock_boto_client.call_count == 8
        expected_services = ['apigateway', 'lambda', 'dynamodb', 'sns', 'sqs', 'cloudwatch', 'logs', 'iam']

        actual_calls = [call[0][0] for call in mock_boto_client.call_args_list]
        for service in expected_services:
            assert service in actual_calls

    @patch('analyse.boto3.client')
    @patch.dict(os.environ, {
        'AWS_ENDPOINT_URL': 'http://localhost:5000',
        'AWS_ACCESS_KEY_ID': 'test-key',
        'AWS_SECRET_ACCESS_KEY': 'test-secret'
    })
    def test_initialization_uses_environment_variables(self, mock_boto_client):
        """Test analyzer uses environment variables for configuration"""
        analyzer = FinTechWebhookAnalyzer()

        # Verify endpoint_url and credentials were passed to boto3 clients
        calls = mock_boto_client.call_args_list
        for call_args in calls:
            kwargs = call_args[1]
            assert kwargs.get('endpoint_url') == 'http://localhost:5000'
            assert kwargs.get('aws_access_key_id') == 'test-key'
            assert kwargs.get('aws_secret_access_key') == 'test-secret'

    # =========================================================================
    # DATA COLLECTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_collect_api_gateway_data_success(self, mock_boto_client):
        """Test API Gateway data collection"""
        mock_apigw = MagicMock()
        mock_boto_client.return_value = mock_apigw

        # Mock API Gateway responses
        mock_apigw.get_rest_apis.return_value = {
            'items': [
                {'id': 'api-123', 'name': 'test-api'}
            ]
        }
        mock_apigw.get_api_keys.return_value = {
            'items': [
                {'id': 'key-123', 'name': 'test-key'}
            ]
        }
        mock_apigw.get_stages.return_value = {
            'item': [
                {'stageName': 'prod', 'throttle': {'rateLimit': 1000}}
            ]
        }

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_api_gateway_data()

        assert len(analyzer.infrastructure_data['api_gateways']) == 1
        assert analyzer.infrastructure_data['api_gateways'][0]['id'] == 'api-123'
        assert analyzer.infrastructure_data['api_gateways'][0]['name'] == 'test-api'

    @patch('analyse.boto3.client')
    def test_collect_api_gateway_data_handles_errors(self, mock_boto_client):
        """Test API Gateway data collection handles errors gracefully"""
        mock_apigw = MagicMock()
        mock_boto_client.return_value = mock_apigw
        mock_apigw.get_rest_apis.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'GetRestApis'
        )

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_api_gateway_data()

        # Should handle error and set empty list
        assert analyzer.infrastructure_data['api_gateways'] == []

    @patch('analyse.boto3.client')
    def test_collect_lambda_data_success(self, mock_boto_client):
        """Test Lambda function data collection"""
        mock_lambda = MagicMock()
        mock_boto_client.return_value = mock_lambda

        mock_lambda.list_functions.return_value = {
            'Functions': [
                {
                    'FunctionName': 'webhook_handler',
                    'Runtime': 'python3.11',
                    'MemorySize': 512,
                    'Timeout': 30,
                    'Architectures': ['arm64'],
                    'Environment': {
                        'Variables': {
                            'TOPIC_ARN': 'arn:aws:sns:us-east-1:123456789012:topic',
                            'API_KEY_HASH': 'hash123'
                        }
                    },
                    'DeadLetterConfig': {
                        'TargetArn': 'arn:aws:sqs:us-east-1:123456789012:dlq'
                    }
                }
            ]
        }

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_lambda_data()

        assert len(analyzer.infrastructure_data['lambda_functions']) == 1
        func = analyzer.infrastructure_data['lambda_functions'][0]
        assert func['name'] == 'webhook_handler'
        assert func['runtime'] == 'python3.11'
        assert func['memory'] == 512
        assert func['architecture'] == ['arm64']

    @patch('analyse.boto3.client')
    def test_collect_dynamodb_data_success(self, mock_boto_client):
        """Test DynamoDB table data collection"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        mock_dynamodb.list_tables.return_value = {
            'TableNames': ['transactions', 'audit_logs']
        }

        mock_dynamodb.describe_table.return_value = {
            'Table': {
                'TableName': 'transactions',
                'TableStatus': 'ACTIVE',
                'KeySchema': [
                    {'AttributeName': 'transaction_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
                ],
                'BillingModeSummary': {'BillingMode': 'PAY_PER_REQUEST'},
                'SSEDescription': {'Status': 'ENABLED'}
            }
        }

        mock_dynamodb.describe_continuous_backups.return_value = {
            'ContinuousBackupsDescription': {
                'PointInTimeRecoveryDescription': {
                    'PointInTimeRecoveryStatus': 'ENABLED'
                }
            }
        }

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_dynamodb_data()

        assert len(analyzer.infrastructure_data['dynamodb_tables']) == 2

    @patch('analyse.boto3.client')
    def test_collect_sns_data_success(self, mock_boto_client):
        """Test SNS topic data collection"""
        mock_sns = MagicMock()
        mock_boto_client.return_value = mock_sns

        mock_sns.list_topics.return_value = {
            'Topics': [
                {'TopicArn': 'arn:aws:sns:us-east-1:123456789012:payment_events'}
            ]
        }

        mock_sns.list_subscriptions_by_topic.return_value = {
            'Subscriptions': [
                {
                    'SubscriptionArn': 'arn:aws:sns:us-east-1:123456789012:payment_events:sub-123',
                    'Protocol': 'lambda',
                    'FilterPolicy': '{"status": ["completed", "pending"]}'
                }
            ]
        }

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_sns_data()

        assert len(analyzer.infrastructure_data['sns_topics']) == 1
        assert analyzer.infrastructure_data['sns_topics'][0]['arn'] == 'arn:aws:sns:us-east-1:123456789012:payment_events'

    @patch('analyse.boto3.client')
    def test_collect_sqs_data_success(self, mock_boto_client):
        """Test SQS queue data collection"""
        mock_sqs = MagicMock()
        mock_boto_client.return_value = mock_sqs

        mock_sqs.list_queues.return_value = {
            'QueueUrls': [
                'https://sqs.us-east-1.amazonaws.com/123456789012/webhook-handler-dlq'
            ]
        }

        mock_sqs.get_queue_attributes.return_value = {
            'Attributes': {
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789012:webhook-handler-dlq',
                'MessageRetentionPeriod': '1209600'
            }
        }

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_sqs_data()

        assert len(analyzer.infrastructure_data['sqs_queues']) == 1
        assert 'webhook-handler-dlq' in analyzer.infrastructure_data['sqs_queues'][0]['url']

    @patch('analyse.boto3.client')
    def test_collect_cloudwatch_data_success(self, mock_boto_client):
        """Test CloudWatch data collection"""
        mock_cloudwatch = MagicMock()
        mock_logs = MagicMock()

        def client_factory(service, **kwargs):
            if service == 'cloudwatch':
                return mock_cloudwatch
            elif service == 'logs':
                return mock_logs
            return MagicMock()

        mock_boto_client.side_effect = client_factory

        mock_cloudwatch.describe_alarms.return_value = {
            'MetricAlarms': [
                {
                    'AlarmName': 'transaction-processor-error-rate',
                    'MetricName': 'Errors',
                    'Threshold': 1.0
                }
            ]
        }

        mock_logs.describe_log_groups.return_value = {
            'logGroups': [
                {
                    'logGroupName': '/aws/lambda/webhook_handler',
                    'retentionInDays': 30
                }
            ]
        }

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_cloudwatch_data()

        assert len(analyzer.infrastructure_data['cloudwatch_alarms']) == 1
        assert len(analyzer.infrastructure_data['log_groups']) == 1

    # =========================================================================
    # SECURITY CHECK TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_api_gateway_security_no_api_keys(self, mock_boto_client):
        """Test detection of missing API keys"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['api_gateways'] = [
            {
                'id': 'api-123',
                'name': 'test-api',
                'api_keys': [],
                'stages': []
            }
        ]

        analyzer._check_api_gateway_security()

        # Should find security issue for missing API keys
        security_findings = [f for f in analyzer.findings if f['category'] == 'Security']
        assert len(security_findings) >= 1
        assert any('API keys' in f['issue'] for f in security_findings)

    @patch('analyse.boto3.client')
    def test_check_lambda_security_sensitive_env_vars(self, mock_boto_client):
        """Test detection of sensitive data in environment variables"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['lambda_functions'] = [
            {
                'name': 'test-function',
                'environment': {
                    'Variables': {
                        'API_KEY': 'secret-key-123',
                        'PASSWORD': 'my-password'
                    }
                }
            }
        ]

        analyzer._check_lambda_security()

        # Should find security issues for sensitive env vars
        security_findings = [f for f in analyzer.findings if f['category'] == 'Security']
        assert len(security_findings) >= 2
        assert any('API_KEY' in f['issue'] for f in security_findings)
        assert any('PASSWORD' in f['issue'] for f in security_findings)

    @patch('analyse.boto3.client')
    def test_check_lambda_security_no_reserved_concurrency(self, mock_boto_client):
        """Test detection of missing reserved concurrency"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['lambda_functions'] = [
            {
                'name': 'test-function',
                'reserved_concurrency': None,
                'environment': {'Variables': {}}
            }
        ]

        analyzer._check_lambda_security()

        # Should find performance issue for missing reserved concurrency
        performance_findings = [f for f in analyzer.findings if f['category'] == 'Performance']
        assert len(performance_findings) >= 1
        assert any('reserved concurrency' in f['issue'] for f in performance_findings)

    @patch('analyse.boto3.client')
    def test_check_dynamodb_security_encryption_disabled(self, mock_boto_client):
        """Test detection of missing encryption on DynamoDB tables"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['dynamodb_tables'] = [
            {
                'name': 'transactions',
                'sse_description': {'Status': 'DISABLED'},
                'point_in_time_recovery': 'ENABLED'
            }
        ]

        analyzer._check_dynamodb_security()

        # Should find security issue for disabled encryption
        security_findings = [f for f in analyzer.findings if f['category'] == 'Security']
        assert len(security_findings) >= 1
        assert any('Encryption' in f['issue'] for f in security_findings)

    @patch('analyse.boto3.client')
    def test_check_dynamodb_security_pitr_disabled(self, mock_boto_client):
        """Test detection of missing PITR on DynamoDB tables"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['dynamodb_tables'] = [
            {
                'name': 'transactions',
                'sse_description': {'Status': 'ENABLED'},
                'point_in_time_recovery': 'DISABLED'
            }
        ]

        analyzer._check_dynamodb_security()

        # Should find resilience issue for disabled PITR
        resilience_findings = [f for f in analyzer.findings if f['category'] == 'Resilience']
        assert len(resilience_findings) >= 1
        assert any('Point-in-time recovery' in f['issue'] for f in resilience_findings)

    @patch('analyse.boto3.client')
    def test_check_sns_security_no_filtering(self, mock_boto_client):
        """Test detection of SNS topics without message filtering"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['sns_topics'] = [
            {
                'arn': 'arn:aws:sns:us-east-1:123456789012:topic',
                'subscriptions': [
                    {'SubscriptionArn': 'sub-1', 'FilterPolicy': None},
                    {'SubscriptionArn': 'sub-2', 'FilterPolicy': None}
                ]
            }
        ]

        analyzer._check_sns_security()

        # Should find performance issue for missing filtering
        performance_findings = [f for f in analyzer.findings if f['category'] == 'Performance']
        assert len(performance_findings) >= 1
        assert any('filtering' in f['issue'] for f in performance_findings)

    # =========================================================================
    # PERFORMANCE CHECK TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_lambda_performance_high_timeout(self, mock_boto_client):
        """Test detection of high Lambda timeout values"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['lambda_functions'] = [
            {
                'name': 'slow-function',
                'timeout': 120,
                'architecture': ['arm64']
            }
        ]

        analyzer._check_lambda_performance()

        # Should find performance issue for high timeout
        performance_findings = [f for f in analyzer.findings if f['category'] == 'Performance']
        assert len(performance_findings) >= 1
        assert any('timeout' in f['issue'].lower() for f in performance_findings)

    @patch('analyse.boto3.client')
    def test_check_lambda_performance_not_arm64(self, mock_boto_client):
        """Test detection of Lambda functions not using ARM64"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['lambda_functions'] = [
            {
                'name': 'x86-function',
                'timeout': 30,
                'architecture': ['x86_64']
            }
        ]

        analyzer._check_lambda_performance()

        # Should find cost issue for not using ARM64
        cost_findings = [f for f in analyzer.findings if f['category'] == 'Cost']
        assert len(cost_findings) >= 1
        assert any('ARM64' in f['issue'] for f in cost_findings)

    @patch('analyse.boto3.client')
    def test_check_dynamodb_performance_provisioned_mode(self, mock_boto_client):
        """Test detection of provisioned billing mode"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['dynamodb_tables'] = [
            {
                'name': 'table1',
                'billing_mode': 'PROVISIONED'
            }
        ]

        analyzer._check_dynamodb_performance()

        # Should find cost issue for provisioned mode
        cost_findings = [f for f in analyzer.findings if f['category'] == 'Cost']
        assert len(cost_findings) >= 1
        assert any('PROVISIONED' in f['issue'] for f in cost_findings)

    @patch('analyse.boto3.client')
    def test_check_api_gateway_throttling_low_rate(self, mock_boto_client):
        """Test detection of low API Gateway throttling rates"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['api_gateways'] = [
            {
                'id': 'api-123',
                'stages': [
                    {'stageName': 'prod', 'throttle': {'rateLimit': 500}}
                ]
            }
        ]

        analyzer._check_api_gateway_throttling()

        # Should find performance issue for low rate limit
        performance_findings = [f for f in analyzer.findings if f['category'] == 'Performance']
        assert len(performance_findings) >= 1
        assert any('rate limit' in f['issue'].lower() for f in performance_findings)

    # =========================================================================
    # COST OPTIMIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_cloudwatch_costs_no_retention(self, mock_boto_client):
        """Test detection of log groups without retention policy"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['log_groups'] = [
            {
                'logGroupName': '/aws/lambda/function1',
                'retentionInDays': None
            }
        ]

        analyzer._check_cloudwatch_costs()

        # Should find cost issue for no retention policy
        cost_findings = [f for f in analyzer.findings if f['category'] == 'Cost']
        assert len(cost_findings) >= 1
        assert any('retention' in f['issue'].lower() for f in cost_findings)

    @patch('analyse.boto3.client')
    def test_check_cloudwatch_costs_long_retention(self, mock_boto_client):
        """Test detection of log groups with long retention periods"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['log_groups'] = [
            {
                'logGroupName': '/aws/lambda/function1',
                'retentionInDays': 365
            }
        ]

        analyzer._check_cloudwatch_costs()

        # Should find cost issue for long retention
        cost_findings = [f for f in analyzer.findings if f['category'] == 'Cost']
        assert len(cost_findings) >= 1
        assert any('retention period' in f['issue'] for f in cost_findings)

    # =========================================================================
    # RESILIENCE CHECK TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_dead_letter_queues_insufficient(self, mock_boto_client):
        """Test detection of insufficient DLQ coverage"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['lambda_functions'] = [
            {'name': 'func1'}, {'name': 'func2'}, {'name': 'func3'}
        ]
        analyzer.infrastructure_data['sqs_queues'] = [
            {'name': 'webhook-handler-dlq', 'url': 'https://sqs/webhook-handler-dlq'}
        ]

        analyzer._check_dead_letter_queues()

        # Should find resilience issue for insufficient DLQs
        resilience_findings = [f for f in analyzer.findings if f['category'] == 'Resilience']
        assert len(resilience_findings) >= 1
        assert any('DLQ' in f['issue'] for f in resilience_findings)

    @patch('analyse.boto3.client')
    def test_check_retry_configurations_no_dlq(self, mock_boto_client):
        """Test detection of Lambda functions without DLQ configuration"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['lambda_functions'] = [
            {
                'name': 'function1',
                'dead_letter_config': None
            }
        ]

        analyzer._check_retry_configurations()

        # Should find resilience issue for no DLQ config
        resilience_findings = [f for f in analyzer.findings if f['category'] == 'Resilience']
        assert len(resilience_findings) >= 1
        assert any('DLQ' in f['issue'] for f in resilience_findings)

    @patch('analyse.boto3.client')
    def test_check_monitoring_alarms_no_alarms(self, mock_boto_client):
        """Test detection of missing CloudWatch alarms"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['cloudwatch_alarms'] = []
        analyzer.infrastructure_data['lambda_functions'] = [{'name': 'func1'}]

        analyzer._check_monitoring_alarms()

        # Should find monitoring issue for no alarms
        monitoring_findings = [f for f in analyzer.findings if f['category'] == 'Monitoring']
        assert len(monitoring_findings) >= 1
        assert any('No CloudWatch alarms' in f['issue'] for f in monitoring_findings)

    @patch('analyse.boto3.client')
    def test_check_monitoring_alarms_no_error_rate_alarms(self, mock_boto_client):
        """Test detection of missing error rate alarms"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['cloudwatch_alarms'] = [
            {'AlarmName': 'cpu-alarm'}
        ]
        analyzer.infrastructure_data['lambda_functions'] = [{'name': 'func1'}]

        analyzer._check_monitoring_alarms()

        # Should find monitoring issue for no error rate alarms
        monitoring_findings = [f for f in analyzer.findings if f['category'] == 'Monitoring']
        assert len(monitoring_findings) >= 1
        assert any('error rate' in f['issue'].lower() for f in monitoring_findings)

    @patch('analyse.boto3.client')
    def test_check_monitoring_alarms_no_throttle_alarms(self, mock_boto_client):
        """Test detection of missing throttling alarms"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['cloudwatch_alarms'] = [
            {'AlarmName': 'error-alarm'}
        ]
        analyzer.infrastructure_data['lambda_functions'] = [{'name': 'func1'}]

        analyzer._check_monitoring_alarms()

        # Should find monitoring issue for no throttling alarms
        monitoring_findings = [f for f in analyzer.findings if f['category'] == 'Monitoring']
        assert len(monitoring_findings) >= 1
        assert any('throttling' in f['issue'].lower() for f in monitoring_findings)

    # =========================================================================
    # REPORT GENERATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_generate_console_output(self, mock_print, mock_boto_client):
        """Test console output generation with tabulate"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data = {
            'api_gateways': [{'id': 'api-1'}],
            'lambda_functions': [{'name': 'func1'}, {'name': 'func2'}],
            'dynamodb_tables': [{'name': 'table1'}],
            'sns_topics': [],
            'sqs_queues': [],
            'cloudwatch_alarms': [],
            'log_groups': []
        }
        analyzer.findings = [
            {
                'category': 'Security',
                'severity': 'HIGH',
                'resource_type': 'Lambda',
                'resource_id': 'func1',
                'issue': 'Test issue',
                'recommendation': 'Fix it'
            }
        ]

        analyzer._generate_console_output()

        # Verify print was called (output generated)
        assert mock_print.called

    @patch('analyse.boto3.client')
    @patch('builtins.open', new_callable=mock_open)
    @patch('json.dump')
    def test_generate_json_report(self, mock_json_dump, mock_file, mock_boto_client):
        """Test JSON report generation"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data = {
            'api_gateways': [],
            'lambda_functions': [{'name': 'func1'}],
            'dynamodb_tables': [],
            'sns_topics': [],
            'sqs_queues': [],
            'cloudwatch_alarms': [],
            'log_groups': []
        }
        analyzer.findings = [
            {
                'category': 'Security',
                'severity': 'HIGH',
                'resource_type': 'Lambda',
                'resource_id': 'func1',
                'issue': 'Test issue',
                'recommendation': 'Fix it'
            }
        ]

        analyzer._generate_json_report()

        # Verify file was opened for writing
        mock_file.assert_called_once_with('lib/analysis-results.json', 'w')

        # Verify JSON dump was called
        assert mock_json_dump.called

        # Verify the structure of the dumped data
        call_args = mock_json_dump.call_args
        report = call_args[0][0]

        assert 'timestamp' in report
        assert 'region' in report
        assert 'summary' in report
        assert 'findings_by_severity' in report
        assert 'findings_by_category' in report
        assert 'findings' in report
        assert 'infrastructure' in report

        assert report['summary']['total_lambda_functions'] == 1
        assert report['findings_by_severity']['high'] == 1

    # =========================================================================
    # MAIN WORKFLOW TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_analyze_executes_all_checks(self, mock_boto_client):
        """Test analyze() method executes all collection and check methods"""
        analyzer = FinTechWebhookAnalyzer()

        # Mock all collection methods
        with patch.object(analyzer, '_collect_api_gateway_data') as mock_collect_apigw, \
             patch.object(analyzer, '_collect_lambda_data') as mock_collect_lambda, \
             patch.object(analyzer, '_collect_dynamodb_data') as mock_collect_dynamodb, \
             patch.object(analyzer, '_collect_sns_data') as mock_collect_sns, \
             patch.object(analyzer, '_collect_sqs_data') as mock_collect_sqs, \
             patch.object(analyzer, '_collect_cloudwatch_data') as mock_collect_cloudwatch, \
             patch.object(analyzer, '_check_api_gateway_security') as mock_check_apigw, \
             patch.object(analyzer, '_check_lambda_security') as mock_check_lambda, \
             patch.object(analyzer, '_check_dynamodb_security') as mock_check_dynamodb, \
             patch.object(analyzer, '_generate_console_output') as mock_console, \
             patch.object(analyzer, '_generate_json_report') as mock_json:

            analyzer.analyze()

            # Verify all collection methods were called
            mock_collect_apigw.assert_called_once()
            mock_collect_lambda.assert_called_once()
            mock_collect_dynamodb.assert_called_once()
            mock_collect_sns.assert_called_once()
            mock_collect_sqs.assert_called_once()
            mock_collect_cloudwatch.assert_called_once()

            # Verify security checks were called
            mock_check_apigw.assert_called_once()
            mock_check_lambda.assert_called_once()
            mock_check_dynamodb.assert_called_once()

            # Verify report generation was called
            mock_console.assert_called_once()
            mock_json.assert_called_once()

    # =========================================================================
    # MAIN FUNCTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('analyse.FinTechWebhookAnalyzer')
    def test_main_function_success(self, mock_analyzer_class, mock_boto_client):
        """Test main() function executes successfully"""
        from analyse import main

        mock_instance = MagicMock()
        mock_analyzer_class.return_value = mock_instance

        result = main()

        assert result == 0
        mock_instance.analyze.assert_called_once()

    @patch('analyse.boto3.client')
    @patch('analyse.FinTechWebhookAnalyzer')
    def test_main_function_handles_exception(self, mock_analyzer_class, mock_boto_client):
        """Test main() function handles exceptions"""
        from analyse import main

        mock_analyzer_class.side_effect = Exception("Test error")

        result = main()

        assert result == 1

    # =========================================================================
    # EDGE CASES AND ERROR HANDLING
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_handles_empty_infrastructure(self, mock_boto_client):
        """Test analyzer handles empty infrastructure gracefully"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data = {
            'api_gateways': [],
            'lambda_functions': [],
            'dynamodb_tables': [],
            'sns_topics': [],
            'sqs_queues': [],
            'cloudwatch_alarms': [],
            'log_groups': []
        }

        # Run all checks
        analyzer._check_api_gateway_security()
        analyzer._check_lambda_security()
        analyzer._check_dynamodb_security()
        analyzer._check_lambda_performance()
        analyzer._check_monitoring_alarms()

        # Should not raise errors
        assert True

    @patch('analyse.boto3.client')
    def test_findings_have_required_fields(self, mock_boto_client):
        """Test that all findings have required fields"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data = {
            'lambda_functions': [
                {
                    'name': 'test-func',
                    'timeout': 120,
                    'architecture': ['x86_64'],
                    'reserved_concurrency': None,
                    'environment': {'Variables': {'SECRET_KEY': 'test'}}
                }
            ]
        }

        analyzer._check_lambda_security()
        analyzer._check_lambda_performance()

        # Verify all findings have required fields
        for finding in analyzer.findings:
            assert 'category' in finding
            assert 'severity' in finding
            assert 'resource_type' in finding
            assert 'resource_id' in finding
            assert 'issue' in finding
            assert 'recommendation' in finding

            # Verify severity is valid
            assert finding['severity'] in ['HIGH', 'MEDIUM', 'LOW']

            # Verify category is valid
            assert finding['category'] in ['Security', 'Performance', 'Cost', 'Resilience', 'Monitoring']

    # =========================================================================
    # ADDITIONAL ERROR HANDLING AND EDGE CASE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_collect_api_gateway_data_handles_api_keys_error(self, mock_boto_client):
        """Test API Gateway handles API key fetch errors"""
        mock_apigw = MagicMock()
        mock_boto_client.return_value = mock_apigw

        mock_apigw.get_rest_apis.return_value = {
            'items': [{'id': 'api-123', 'name': 'test-api'}]
        }
        mock_apigw.get_api_keys.side_effect = Exception("API Keys error")
        mock_apigw.get_stages.return_value = {'item': []}

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_api_gateway_data()

        # Should handle error gracefully
        assert len(analyzer.infrastructure_data['api_gateways']) == 1
        assert analyzer.infrastructure_data['api_gateways'][0]['api_keys'] == []

    @patch('analyse.boto3.client')
    def test_collect_api_gateway_data_handles_stages_error(self, mock_boto_client):
        """Test API Gateway handles stage fetch errors"""
        mock_apigw = MagicMock()
        mock_boto_client.return_value = mock_apigw

        mock_apigw.get_rest_apis.return_value = {
            'items': [{'id': 'api-123', 'name': 'test-api'}]
        }
        mock_apigw.get_api_keys.return_value = {'items': []}
        mock_apigw.get_stages.side_effect = Exception("Stages error")

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_api_gateway_data()

        # Should handle error gracefully
        assert len(analyzer.infrastructure_data['api_gateways']) == 1

    @patch('analyse.boto3.client')
    def test_collect_lambda_data_handles_errors(self, mock_boto_client):
        """Test Lambda data collection handles errors"""
        mock_lambda = MagicMock()
        mock_boto_client.return_value = mock_lambda
        mock_lambda.list_functions.side_effect = Exception("Lambda error")

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_lambda_data()

        # Should handle error and set empty list
        assert analyzer.infrastructure_data['lambda_functions'] == []

    @patch('analyse.boto3.client')
    def test_collect_dynamodb_data_handles_describe_table_error(self, mock_boto_client):
        """Test DynamoDB handles describe_table errors"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        mock_dynamodb.list_tables.return_value = {'TableNames': ['table1']}
        mock_dynamodb.describe_table.side_effect = Exception("Describe error")

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_dynamodb_data()

        # Should handle error gracefully
        assert analyzer.infrastructure_data['dynamodb_tables'] == []

    @patch('analyse.boto3.client')
    def test_collect_dynamodb_data_handles_pitr_error(self, mock_boto_client):
        """Test DynamoDB handles PITR check errors"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb

        mock_dynamodb.list_tables.return_value = {'TableNames': ['table1']}
        mock_dynamodb.describe_table.return_value = {
            'Table': {
                'TableName': 'table1',
                'TableStatus': 'ACTIVE',
                'KeySchema': [],
                'BillingModeSummary': {'BillingMode': 'PAY_PER_REQUEST'},
                'SSEDescription': {'Status': 'ENABLED'}
            }
        }
        mock_dynamodb.describe_continuous_backups.side_effect = Exception("PITR error")

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_dynamodb_data()

        # Should handle PITR error and still collect table data
        assert len(analyzer.infrastructure_data['dynamodb_tables']) == 1
        assert analyzer.infrastructure_data['dynamodb_tables'][0]['point_in_time_recovery'] is None

    @patch('analyse.boto3.client')
    def test_collect_dynamodb_data_handles_list_tables_error(self, mock_boto_client):
        """Test DynamoDB handles list_tables errors"""
        mock_dynamodb = MagicMock()
        mock_boto_client.return_value = mock_dynamodb
        mock_dynamodb.list_tables.side_effect = Exception("List tables error")

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_dynamodb_data()

        # Should handle error and set empty list
        assert analyzer.infrastructure_data['dynamodb_tables'] == []

    @patch('analyse.boto3.client')
    def test_collect_sns_data_handles_subscription_error(self, mock_boto_client):
        """Test SNS handles subscription fetch errors"""
        mock_sns = MagicMock()
        mock_boto_client.return_value = mock_sns

        mock_sns.list_topics.return_value = {
            'Topics': [{'TopicArn': 'arn:aws:sns:us-east-1:123456789012:topic'}]
        }
        mock_sns.list_subscriptions_by_topic.side_effect = Exception("Subscription error")

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_sns_data()

        # Should handle error gracefully
        assert len(analyzer.infrastructure_data['sns_topics']) == 1
        assert analyzer.infrastructure_data['sns_topics'][0]['subscriptions'] == []

    @patch('analyse.boto3.client')
    def test_collect_sns_data_handles_list_topics_error(self, mock_boto_client):
        """Test SNS handles list_topics errors"""
        mock_sns = MagicMock()
        mock_boto_client.return_value = mock_sns
        mock_sns.list_topics.side_effect = Exception("List topics error")

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_sns_data()

        # Should handle error and set empty list
        assert analyzer.infrastructure_data['sns_topics'] == []

    @patch('analyse.boto3.client')
    def test_collect_sqs_data_handles_get_attributes_error(self, mock_boto_client):
        """Test SQS handles get_queue_attributes errors"""
        mock_sqs = MagicMock()
        mock_boto_client.return_value = mock_sqs

        mock_sqs.list_queues.return_value = {
            'QueueUrls': ['https://sqs.us-east-1.amazonaws.com/123456789012/queue1']
        }
        mock_sqs.get_queue_attributes.side_effect = Exception("Get attributes error")

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_sqs_data()

        # Should handle error gracefully
        assert analyzer.infrastructure_data['sqs_queues'] == []

    @patch('analyse.boto3.client')
    def test_collect_sqs_data_handles_list_queues_error(self, mock_boto_client):
        """Test SQS handles list_queues errors"""
        mock_sqs = MagicMock()
        mock_boto_client.return_value = mock_sqs
        mock_sqs.list_queues.side_effect = Exception("List queues error")

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_sqs_data()

        # Should handle error and set empty list
        assert analyzer.infrastructure_data['sqs_queues'] == []

    @patch('analyse.boto3.client')
    def test_collect_cloudwatch_data_handles_alarms_error(self, mock_boto_client):
        """Test CloudWatch handles describe_alarms errors"""
        mock_cloudwatch = MagicMock()
        mock_logs = MagicMock()

        def client_factory(service, **kwargs):
            if service == 'cloudwatch':
                return mock_cloudwatch
            elif service == 'logs':
                return mock_logs
            return MagicMock()

        mock_boto_client.side_effect = client_factory
        mock_cloudwatch.describe_alarms.side_effect = Exception("Alarms error")
        mock_logs.describe_log_groups.return_value = {'logGroups': []}

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_cloudwatch_data()

        # Should handle error and set empty list
        assert analyzer.infrastructure_data['cloudwatch_alarms'] == []

    @patch('analyse.boto3.client')
    def test_collect_cloudwatch_data_handles_log_groups_error(self, mock_boto_client):
        """Test CloudWatch handles describe_log_groups errors"""
        mock_cloudwatch = MagicMock()
        mock_logs = MagicMock()

        def client_factory(service, **kwargs):
            if service == 'cloudwatch':
                return mock_cloudwatch
            elif service == 'logs':
                return mock_logs
            return MagicMock()

        mock_boto_client.side_effect = client_factory
        mock_cloudwatch.describe_alarms.return_value = {'MetricAlarms': []}
        mock_logs.describe_log_groups.side_effect = Exception("Log groups error")

        analyzer = FinTechWebhookAnalyzer()
        analyzer._collect_cloudwatch_data()

        # Should handle error and set empty list
        assert analyzer.infrastructure_data['log_groups'] == []

    @patch('analyse.boto3.client')
    def test_check_api_gateway_security_with_no_throttle(self, mock_boto_client):
        """Test detection of missing throttling on API Gateway stages"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['api_gateways'] = [
            {
                'id': 'api-123',
                'name': 'test-api',
                'api_keys': [{'id': 'key-1'}],
                'stages': [
                    {'stageName': 'prod'}  # No throttle key
                ]
            }
        ]

        analyzer._check_api_gateway_security()

        # Should find security issue for missing throttling
        security_findings = [f for f in analyzer.findings if f['category'] == 'Security']
        assert len(security_findings) >= 1

    @patch('analyse.boto3.client')
    def test_check_lambda_security_with_no_sensitive_vars(self, mock_boto_client):
        """Test Lambda functions without sensitive environment variables"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['lambda_functions'] = [
            {
                'name': 'test-function',
                'reserved_concurrency': 100,
                'environment': {
                    'Variables': {
                        'REGION': 'us-east-1',
                        'LOG_LEVEL': 'INFO'
                    }
                }
            }
        ]

        analyzer._check_lambda_security()

        # Should not find sensitive env var issues
        sensitive_findings = [f for f in analyzer.findings
                             if 'environment variable' in f['issue']]
        assert len(sensitive_findings) == 0

    @patch('analyse.boto3.client')
    def test_check_lambda_performance_with_arm64(self, mock_boto_client):
        """Test Lambda functions using ARM64 architecture"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['lambda_functions'] = [
            {
                'name': 'arm-function',
                'timeout': 30,
                'architecture': ['arm64']
            }
        ]

        analyzer._check_lambda_performance()

        # Should not find ARM64 issue
        arm_findings = [f for f in analyzer.findings if 'ARM64' in f['issue']]
        assert len(arm_findings) == 0

    @patch('analyse.boto3.client')
    def test_check_sns_security_with_single_subscription(self, mock_boto_client):
        """Test SNS topics with single subscription (no filtering needed)"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['sns_topics'] = [
            {
                'arn': 'arn:aws:sns:us-east-1:123456789012:topic',
                'subscriptions': [
                    {'SubscriptionArn': 'sub-1', 'FilterPolicy': None}
                ]
            }
        ]

        analyzer._check_sns_security()

        # Should not find filtering issue with single subscription
        filtering_findings = [f for f in analyzer.findings if 'filtering' in f['issue']]
        assert len(filtering_findings) == 0

    @patch('analyse.boto3.client')
    def test_check_iam_permissions(self, mock_boto_client):
        """Test IAM permissions check when Lambda functions exist"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['lambda_functions'] = [{'name': 'func1'}]

        analyzer._check_iam_permissions()

        # Should add IAM recommendation
        iam_findings = [f for f in analyzer.findings
                       if f['resource_type'] == 'IAM Roles']
        assert len(iam_findings) >= 1

    @patch('analyse.boto3.client')
    def test_check_dynamodb_performance_with_on_demand(self, mock_boto_client):
        """Test DynamoDB tables with on-demand billing"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['dynamodb_tables'] = [
            {
                'name': 'table1',
                'billing_mode': 'PAY_PER_REQUEST'
            }
        ]

        analyzer._check_dynamodb_performance()

        # Should not find provisioned mode issue
        provisioned_findings = [f for f in analyzer.findings
                               if 'PROVISIONED' in f['issue']]
        assert len(provisioned_findings) == 0

    @patch('analyse.boto3.client')
    def test_check_lambda_cost_optimization(self, mock_boto_client):
        """Test Lambda cost optimization check"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['lambda_functions'] = [
            {'name': 'func1', 'memory': 512},
            {'name': 'func2', 'memory': 1024}
        ]

        analyzer._check_lambda_cost_optimization()

        # Should add cost optimization recommendation
        cost_findings = [f for f in analyzer.findings
                        if f['category'] == 'Cost' and
                        f['resource_type'] == 'Lambda Functions']
        assert len(cost_findings) >= 1

    @patch('analyse.boto3.client')
    def test_check_dynamodb_cost_optimization(self, mock_boto_client):
        """Test DynamoDB cost optimization with all PAY_PER_REQUEST"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['dynamodb_tables'] = [
            {'name': 'table1', 'billing_mode': 'PAY_PER_REQUEST'},
            {'name': 'table2', 'billing_mode': 'PAY_PER_REQUEST'}
        ]

        analyzer._check_dynamodb_cost_optimization()

        # Should add cost optimization recommendation
        cost_findings = [f for f in analyzer.findings
                        if f['category'] == 'Cost' and
                        f['resource_type'] == 'DynamoDB Tables']
        assert len(cost_findings) >= 1

    @patch('analyse.boto3.client')
    def test_check_cloudwatch_costs_with_valid_retention(self, mock_boto_client):
        """Test log groups with valid retention (not too long)"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['log_groups'] = [
            {
                'logGroupName': '/aws/lambda/function1',
                'retentionInDays': 30
            }
        ]

        analyzer._check_cloudwatch_costs()

        # Should not find retention issues
        retention_findings = [f for f in analyzer.findings
                             if 'retention' in f['issue'].lower()]
        assert len(retention_findings) == 0

    @patch('analyse.boto3.client')
    def test_check_retry_configurations_with_dlq(self, mock_boto_client):
        """Test Lambda functions with DLQ configured"""
        analyzer = FinTechWebhookAnalyzer()
        analyzer.infrastructure_data['lambda_functions'] = [
            {
                'name': 'function1',
                'dead_letter_config': {
                    'TargetArn': 'arn:aws:sqs:us-east-1:123456789012:dlq'
                }
            }
        ]

        analyzer._check_retry_configurations()

        # Should not find DLQ config issues
        dlq_findings = [f for f in analyzer.findings
                       if 'DLQ' in f['issue'] and
                       f['resource_id'] == 'function1']
        assert len(dlq_findings) == 0
