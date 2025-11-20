import sys
import os
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch
import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import CloudWatchLogsAnalyzer


class TestCloudWatchLogsAnalyzer:
    """Unit tests for CloudWatchLogsAnalyzer class with mocked AWS services"""

    @patch('analyse.boto3.client')
    def test_initialization(self, mock_boto_client):
        """Test that analyzer initializes with correct AWS clients"""
        analyzer = CloudWatchLogsAnalyzer()

        # Verify boto3.client was called for each AWS service (logs, lambda, ec2, s3, cloudwatch)
        assert mock_boto_client.call_count == 5
        mock_boto_client.assert_any_call('logs', region_name='us-east-1')
        mock_boto_client.assert_any_call('lambda', region_name='us-east-1')
        mock_boto_client.assert_any_call('ec2', region_name='us-east-1')
        mock_boto_client.assert_any_call('s3', region_name='us-east-1')
        mock_boto_client.assert_any_call('cloudwatch', region_name='us-east-1')

    @patch('analyse.boto3.client')
    def test_get_all_log_groups(self, mock_boto_client):
        """Test _get_all_log_groups retrieves all log groups"""
        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        # Mock paginator
        mock_paginator = MagicMock()
        mock_logs_client.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'logGroups': [{'logGroupName': 'test-log-1'}, {'logGroupName': 'test-log-2'}]},
            {'logGroups': [{'logGroupName': 'test-log-3'}]}
        ]

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._get_all_log_groups()

        assert len(result) == 3
        assert result[0]['logGroupName'] == 'test-log-1'
        assert result[1]['logGroupName'] == 'test-log-2'
        assert result[2]['logGroupName'] == 'test-log-3'

    @patch('analyse.boto3.client')
    def test_analyze_log_group_indefinite_retention(self, mock_boto_client):
        """Test _analyze_log_group detects indefinite retention issue"""
        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()
        mock_cloudwatch_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client
            elif service == 'cloudwatch':
                return mock_cloudwatch_client

        mock_boto_client.side_effect = mock_client_side_effect

        # Mock log group with indefinite retention
        log_group = {
            'logGroupName': '/aws/lambda/test-function',
            'retentionInDays': None,  # Indefinite retention
            'storedBytes': 1024**3,  # 1 GB
            'creationTime': int((datetime.now(timezone.utc) - timedelta(days=60)).timestamp() * 1000)
        }

        # Mock dependencies
        mock_logs_client.list_tags_log_group.return_value = {'tags': {}}
        mock_logs_client.describe_metric_filters.return_value = {'metricFilters': []}
        mock_logs_client.describe_subscription_filters.return_value = {'subscriptionFilters': []}
        mock_logs_client.describe_log_streams.return_value = {'logStreams': [{'storedBytes': 100}]}

        analyzer = CloudWatchLogsAnalyzer()
        analyzer._analyze_log_group(log_group)

        # Verify results
        assert len(analyzer.log_groups_data) == 1
        lg_data = analyzer.log_groups_data[0]
        assert lg_data['log_group_name'] == '/aws/lambda/test-function'
        assert len(lg_data['issues']) > 0

        # Check for indefinite retention issue
        indefinite_issues = [i for i in lg_data['issues'] if i['type'] == 'indefinite_retention']
        assert len(indefinite_issues) == 1
        assert indefinite_issues[0]['severity'] == 'High'

    @patch('analyse.boto3.client')
    def test_is_debug_log(self, mock_boto_client):
        """Test _is_debug_log correctly identifies debug log groups"""
        analyzer = CloudWatchLogsAnalyzer()

        assert analyzer._is_debug_log('/aws/lambda/debug-function') == True
        assert analyzer._is_debug_log('/aws/lambda/my-app-trace') == True
        assert analyzer._is_debug_log('/aws/lambda/verbose-logger') == True
        assert analyzer._is_debug_log('/aws/lambda/prod-app') == False
        assert analyzer._is_debug_log('/aws/lambda/audit-service') == False

    @patch('analyse.boto3.client')
    def test_is_audit_log(self, mock_boto_client):
        """Test _is_audit_log correctly identifies audit log groups"""
        analyzer = CloudWatchLogsAnalyzer()

        assert analyzer._is_audit_log('/aws/lambda/audit-service') == True
        assert analyzer._is_audit_log('/aws/lambda/compliance-logger') == True
        assert analyzer._is_audit_log('/aws/lambda/security-events') == True
        assert analyzer._is_audit_log('/aws/lambda/prod-app') == False
        assert analyzer._is_audit_log('/aws/lambda/debug-function') == False

    @patch('analyse.boto3.client')
    def test_is_application_log(self, mock_boto_client):
        """Test _is_application_log correctly identifies application log groups"""
        analyzer = CloudWatchLogsAnalyzer()

        assert analyzer._is_application_log('/aws/lambda/my-app') == True
        assert analyzer._is_application_log('/ecs/my-service') == True
        assert analyzer._is_application_log('/eks/my-cluster') == True
        assert analyzer._is_application_log('/aws/lambda/') == True
        assert analyzer._is_application_log('vpc-flow-logs') == False

    @patch('analyse.boto3.client')
    def test_is_critical_log(self, mock_boto_client):
        """Test _is_critical_log correctly identifies critical log groups"""
        analyzer = CloudWatchLogsAnalyzer()

        # Test by tags
        assert analyzer._is_critical_log('/aws/lambda/test', {'Criticality': 'high'}) == True
        assert analyzer._is_critical_log('/aws/lambda/test', {'Environment': 'production'}) == True
        assert analyzer._is_critical_log('/aws/lambda/test', {'Environment': 'prod'}) == True
        assert analyzer._is_critical_log('/aws/lambda/critical-app', {}) == True
        assert analyzer._is_critical_log('/aws/lambda/test', {}) == False

    @patch('analyse.boto3.client')
    def test_calculate_daily_ingestion(self, mock_boto_client):
        """Test _calculate_daily_ingestion computes daily ingestion in MB"""
        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        # Mock log streams with ingestion data
        cutoff_time = int((datetime.now(timezone.utc) - timedelta(days=7)).timestamp() * 1000)
        mock_logs_client.describe_log_streams.return_value = {
            'logStreams': [
                {'lastIngestionTime': cutoff_time + 1000, 'storedBytes': 1024**2},  # 1 MB
                {'lastIngestionTime': cutoff_time + 2000, 'storedBytes': 2*1024**2},  # 2 MB
            ]
        }

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._calculate_daily_ingestion('test-log-group')

        # Should be (3 MB) / 7 days = ~0.43 MB/day
        assert abs(result - (3/7)) < 0.01

    @patch('analyse.boto3.client')
    def test_get_last_event_time(self, mock_boto_client):
        """Test _get_last_event_time returns correct datetime"""
        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        event_time = int((datetime.now(timezone.utc) - timedelta(hours=1)).timestamp() * 1000)
        mock_logs_client.describe_log_streams.return_value = {
            'logStreams': [{'lastEventTime': event_time}]
        }

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._get_last_event_time('test-log-group')

        assert result is not None
        assert isinstance(result, datetime)
        assert abs((datetime.now(timezone.utc) - result).seconds - 3600) < 10  # Within 10 seconds of 1 hour ago

    @patch('analyse.boto3.client')
    def test_get_optimized_retention(self, mock_boto_client):
        """Test _get_optimized_retention returns appropriate retention periods"""
        analyzer = CloudWatchLogsAnalyzer()

        # Debug logs
        assert analyzer._get_optimized_retention('/aws/lambda/debug-app', 365, {}) == 30
        # Audit logs
        assert analyzer._get_optimized_retention('/aws/lambda/audit-service', 365, {}) == 7
        # Confidential data
        assert analyzer._get_optimized_retention('/aws/lambda/app', 365, {'DataClassification': 'confidential'}) == 90
        # Application logs
        assert analyzer._get_optimized_retention('/aws/lambda/my-app', 365, {}) == 60
        # Default
        assert analyzer._get_optimized_retention('/var/log/other', 365, {}) == 30

    @patch('analyse.boto3.client')
    def test_calculate_retention_savings(self, mock_boto_client):
        """Test _calculate_retention_savings computes potential savings"""
        analyzer = CloudWatchLogsAnalyzer()

        # 1 GB stored, change from 365 to 30 days retention
        savings = analyzer._calculate_retention_savings(1.0, 30, 365)
        expected_savings = 1.0 * (1 - 30/365) * 0.03  # $0.03 per GB per month
        assert abs(savings - expected_savings) < 0.001

        # No savings if new retention >= current
        assert analyzer._calculate_retention_savings(1.0, 60, 30) == 0

    @patch('analyse.boto3.client')
    def test_check_monitoring_gaps(self, mock_boto_client):
        """Test _check_monitoring_gaps detects missing Lambda function log groups"""
        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()
        mock_cloudwatch_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client
            elif service == 'cloudwatch':
                return mock_cloudwatch_client

        mock_boto_client.side_effect = mock_client_side_effect

        # Mock Lambda functions
        mock_lambda_paginator = MagicMock()
        mock_lambda_client.get_paginator.return_value = mock_lambda_paginator
        mock_lambda_paginator.paginate.return_value = [
            {'Functions': [{'FunctionName': 'test-function-1'}, {'FunctionName': 'test-function-2'}]}
        ]

        analyzer = CloudWatchLogsAnalyzer()
        # Should not raise exception
        analyzer._check_monitoring_gaps()

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_generate_console_output(self, mock_print, mock_boto_client):
        """Test _generate_console_output creates tabular output"""
        # Mock boto3.client to return MagicMock for each service
        mock_boto_client.side_effect = lambda service, **kwargs: MagicMock()
        
        analyzer = CloudWatchLogsAnalyzer()

        # Add sample log group data with various issues and monitoring gaps
        analyzer.log_groups_data = [{
            'log_group_name': '/aws/lambda/test-function',
            'stored_bytes': 1024**3,  # 1 GB
            'daily_ingestion_mb': 100,
            'retention_days': 30,
            'monthly_cost': 0.03,
            'issues': [
                {'type': 'excessive_debug_retention', 'severity': 'Medium', 'potential_savings': 0.01},
                {'type': 'missing_metric_filters', 'severity': 'High', 'potential_savings': 0}
            ],
            'optimization': {'estimated_savings': 0.01}
        }, {
            'log_group_name': '/aws/lambda/another-function',
            'stored_bytes': 2*1024**3,  # 2 GB
            'daily_ingestion_mb': 200,
            'retention_days': None,  # Indefinite
            'monthly_cost': 0.06,
            'issues': [
                {'type': 'indefinite_retention', 'severity': 'High', 'potential_savings': 0.02}
            ],
            'optimization': {'estimated_savings': 0.02}
        }]

        # Add monitoring gaps
        analyzer.monitoring_gaps = [{
            'resource_type': 'Lambda',
            'resource_id': 'missing-function',
            'expected_log_group': '/aws/lambda/missing-function',
            'status': 'Missing Log Group',
            'issue': 'No log group found for Lambda function'
        }]

        # Should not raise exception
        analyzer._generate_console_output()

        # Verify print was called multiple times
        assert mock_print.call_count > 10  # Should print headers, summary, tables, etc.

    @patch('analyse.boto3.client')
    @patch('analyse.json.dump')
    @patch('builtins.open', create=True)
    def test_generate_json_output(self, mock_file, mock_json_dump, mock_boto_client):
        """Test _generate_json_output creates JSON file with correct structure"""
        analyzer = CloudWatchLogsAnalyzer()

        # Add sample data
        analyzer.log_groups_data = [{
            'log_group_name': '/aws/lambda/test-function',
            'monthly_cost': 0.03,
            'stored_bytes': 1024**3,
            'issues': [],
            'optimization': {'estimated_savings': 0.01}
        }]

        analyzer._generate_json_output()

        # Verify file was opened and JSON was dumped
        mock_file.assert_called_with('aws_audit_results.json', 'w')
        assert mock_json_dump.called

        # Verify JSON structure
        call_args = mock_json_dump.call_args[0][0]
        assert 'CloudWatchLogs' in call_args
        assert 'log_groups' in call_args['CloudWatchLogs']
        assert 'summary' in call_args['CloudWatchLogs']

    @patch('analyse.boto3.client')
    @patch('analyse.CHART_DEPENDENCIES_AVAILABLE', False)
    def test_generate_chart(self, mock_boto_client):
        """Test _generate_chart gracefully handles missing dependencies"""
        analyzer = CloudWatchLogsAnalyzer()

        # Add sample data
        analyzer.log_groups_data = [{
            'log_group_name': '/aws/lambda/test-function',
            'retention_days': 30,
            'monthly_cost': 0.03,
            'stored_bytes': 1024**3,
            'optimization': {'estimated_savings': 0.01, 'recommended_retention': 60}
        }]

        # Should not raise exception even without matplotlib/pandas
        analyzer._generate_chart()  # Should log warning and return gracefully

    @patch('analyse.boto3.client')
    @patch('builtins.open', create=True)
    @patch('analyse.csv.DictWriter')
    def test_generate_csv_report(self, mock_csv_writer, mock_file, mock_boto_client):
        """Test _generate_csv_report creates CSV file"""
        analyzer = CloudWatchLogsAnalyzer()

        # Add sample data with different resource types to cover all branches
        analyzer.log_groups_data = [
            {
                'log_group_name': '/aws/lambda/test-function',
                'retention_days': 30,
                'monthly_cost': 0.03,
                'issues': [{'type': 'test_issue', 'description': 'Test issue description'}],
                'optimization': {'estimated_savings': 0.01}
            },
            {
                'log_group_name': '/aws/ecs/my-service',
                'retention_days': 60,
                'monthly_cost': 0.05,
                'issues': [],
                'optimization': {'estimated_savings': 0.00}
            },
            {
                'log_group_name': '/aws/eks/my-cluster',
                'retention_days': 90,
                'monthly_cost': 0.08,
                'issues': [],
                'optimization': {'estimated_savings': 0.00}
            },
            {
                'log_group_name': 'vpc-flow-logs/my-vpc',
                'retention_days': None,
                'monthly_cost': 0.10,
                'issues': [],
                'optimization': {'estimated_savings': 0.00}
            }
        ]

        analyzer._generate_csv_report()

        # Verify file was opened and CSV writer was used
        mock_file.assert_called_with('monitoring_coverage_report.csv', 'w', newline='')
        assert mock_csv_writer.called

    @patch('analyse.boto3.client')
    def test_run_workflow(self, mock_boto_client):
        """Test run() executes complete analysis workflow"""
        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()
        mock_cloudwatch_client = MagicMock()
        mock_s3_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client
            elif service == 'cloudwatch':
                return mock_cloudwatch_client
            elif service == 's3':
                return mock_s3_client

        mock_boto_client.side_effect = mock_client_side_effect

        # Mock all dependencies - include creationTime
        creation_time = int((datetime.now(timezone.utc) - timedelta(days=60)).timestamp() * 1000)
        mock_logs_client.get_paginator.return_value.paginate.return_value = [
            {'logGroups': [{'logGroupName': '/aws/lambda/test', 'retentionInDays': 30, 'storedBytes': 1024**2, 'creationTime': creation_time}]}
        ]
        mock_logs_client.list_tags_log_group.return_value = {'tags': {}}
        mock_logs_client.describe_metric_filters.return_value = {'metricFilters': []}
        mock_logs_client.describe_subscription_filters.return_value = {'subscriptionFilters': []}
        mock_logs_client.describe_log_streams.return_value = {'logStreams': []}

        analyzer = CloudWatchLogsAnalyzer()

        # Mock output methods to avoid file operations
        with patch.object(analyzer, '_generate_console_output'), \
             patch.object(analyzer, '_generate_json_output'), \
             patch.object(analyzer, '_generate_chart'), \
             patch.object(analyzer, '_generate_csv_report'), \
             patch.object(analyzer, '_check_monitoring_gaps'):
            analyzer.run()

        # Verify analysis was performed
        assert len(analyzer.log_groups_data) > 0

    @patch('analyse.boto3.client')
    def test_get_all_log_groups_handles_error(self, mock_boto_client):
        """Test _get_all_log_groups handles ClientError gracefully"""
        from botocore.exceptions import ClientError

        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        mock_paginator = MagicMock()
        mock_logs_client.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'DescribeLogGroups'
        )

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._get_all_log_groups()

        # Should return empty list on error
        assert result == []

    @patch('analyse.boto3.client')
    def test_analyze_log_group_detects_multiple_issues(self, mock_boto_client):
        """Test _analyze_log_group detects multiple issue types"""
        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()
        mock_cloudwatch_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client
            elif service == 'cloudwatch':
                return mock_cloudwatch_client

        mock_boto_client.side_effect = mock_client_side_effect

        # Set up log group with multiple issues
        log_group = {
            'logGroupName': '/aws/lambda/debug-function',  # Debug log with long retention
            'retentionInDays': 90,  # Excessive for debug
            'storedBytes': 1024**3,  # 1GB
            'creationTime': int((datetime.now(timezone.utc) - timedelta(days=100)).timestamp() * 1000)
        }

        # Mock dependencies
        mock_logs_client.list_tags_log_group.return_value = {'tags': {'DataClassification': 'confidential'}}
        mock_logs_client.describe_metric_filters.return_value = {'metricFilters': []}  # Missing filters
        mock_logs_client.describe_subscription_filters.return_value = {'subscriptionFilters': []}
        mock_logs_client.describe_log_streams.return_value = {'logStreams': []}

        analyzer = CloudWatchLogsAnalyzer()
        analyzer._analyze_log_group(log_group)

        assert len(analyzer.log_groups_data) == 1
        issues = analyzer.log_groups_data[0]['issues']
        # Should detect multiple issues
        issue_types = [issue['type'] for issue in issues]
        assert 'excessive_debug_retention' in issue_types
        assert 'missing_metric_filters' in issue_types
        assert 'no_encryption' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_log_group_unused_log_group(self, mock_boto_client):
        """Test _analyze_log_group detects unused log groups"""
        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()
        mock_cloudwatch_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client
            elif service == 'cloudwatch':
                return mock_cloudwatch_client

        mock_boto_client.side_effect = mock_client_side_effect

        # Old log group with no recent events
        old_time = int((datetime.now(timezone.utc) - timedelta(days=100)).timestamp() * 1000)
        log_group = {
            'logGroupName': '/aws/lambda/old-function',
            'retentionInDays': 30,
            'storedBytes': 1024**3,
            'creationTime': old_time
        }

        # Mock last event time as very old
        mock_logs_client.list_tags_log_group.return_value = {'tags': {}}
        mock_logs_client.describe_metric_filters.return_value = {'metricFilters': []}
        mock_logs_client.describe_subscription_filters.return_value = {'subscriptionFilters': []}
        mock_logs_client.describe_log_streams.return_value = {
            'logStreams': [{'lastEventTime': int((datetime.now(timezone.utc) - timedelta(days=70)).timestamp() * 1000)}]
        }

        analyzer = CloudWatchLogsAnalyzer()
        analyzer._analyze_log_group(log_group)

        assert len(analyzer.log_groups_data) == 1
        issues = analyzer.log_groups_data[0]['issues']
        issue_types = [issue['type'] for issue in issues]
        assert 'unused_log_group' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_log_group_subscription_filter_overload(self, mock_boto_client):
        """Test _analyze_log_group detects subscription filter overload"""
        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()
        mock_cloudwatch_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client
            elif service == 'cloudwatch':
                return mock_cloudwatch_client

        mock_boto_client.side_effect = mock_client_side_effect

        log_group = {
            'logGroupName': '/aws/lambda/function',
            'retentionInDays': 30,
            'storedBytes': 1024**3,
            'creationTime': int((datetime.now(timezone.utc) - timedelta(days=30)).timestamp() * 1000)
        }

        # Mock 3 subscription filters (over limit)
        mock_logs_client.list_tags_log_group.return_value = {'tags': {}}
        mock_logs_client.describe_metric_filters.return_value = {'metricFilters': []}
        mock_logs_client.describe_subscription_filters.return_value = {
            'subscriptionFilters': [{'filterName': 'filter1'}, {'filterName': 'filter2'}, {'filterName': 'filter3'}]
        }
        mock_logs_client.describe_log_streams.return_value = {'logStreams': [{'storedBytes': 1024**2}]}

        analyzer = CloudWatchLogsAnalyzer()
        analyzer._analyze_log_group(log_group)

        assert len(analyzer.log_groups_data) == 1
        issues = analyzer.log_groups_data[0]['issues']
        issue_types = [issue['type'] for issue in issues]
        assert 'subscription_filter_overload' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_log_group_vpc_flow_logs_cost(self, mock_boto_client):
        """Test _analyze_log_group detects VPC Flow Logs cost issue"""
        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()
        mock_cloudwatch_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client
            elif service == 'cloudwatch':
                return mock_cloudwatch_client

        mock_boto_client.side_effect = mock_client_side_effect

        log_group = {
            'logGroupName': '/aws/vpc/flow-logs/vpc-12345',
            'retentionInDays': 30,
            'storedBytes': 1024**3,
            'creationTime': int((datetime.now(timezone.utc) - timedelta(days=30)).timestamp() * 1000)
        }

        # Mock VPC Flow Logs capturing ALL traffic
        mock_logs_client.list_tags_log_group.return_value = {'tags': {}}
        mock_logs_client.describe_metric_filters.return_value = {'metricFilters': []}
        mock_logs_client.describe_subscription_filters.return_value = {'subscriptionFilters': []}
        mock_logs_client.describe_log_streams.return_value = {'logStreams': [{'storedBytes': 1024**2}]}
        mock_ec2_client.describe_flow_logs.return_value = {
            'FlowLogs': [{'TrafficType': 'ALL'}]
        }

        analyzer = CloudWatchLogsAnalyzer()
        analyzer._analyze_log_group(log_group)

        assert len(analyzer.log_groups_data) == 1
        issues = analyzer.log_groups_data[0]['issues']
        issue_types = [issue['type'] for issue in issues]
        assert 'vpc_flow_logs_cost' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_log_group_high_ingestion_rate(self, mock_boto_client):
        """Test _analyze_log_group detects high ingestion rate"""
        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()
        mock_cloudwatch_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client
            elif service == 'cloudwatch':
                return mock_cloudwatch_client

        mock_boto_client.side_effect = mock_client_side_effect

        log_group = {
            'logGroupName': '/aws/lambda/high-volume-function',
            'retentionInDays': 30,
            'storedBytes': 1024**3,
            'creationTime': int((datetime.now(timezone.utc) - timedelta(days=30)).timestamp() * 1000)
        }

        # Mock high ingestion rate - set extremely high stored bytes
        mock_logs_client.describe_log_streams.return_value = {
            'logStreams': [{'storedBytes': 4000*1024**3, 'lastIngestionTime': int((datetime.now(timezone.utc) - timedelta(days=1)).timestamp() * 1000)}]  # 4000 GB
        }

        analyzer = CloudWatchLogsAnalyzer()
        analyzer._analyze_log_group(log_group)

        assert len(analyzer.log_groups_data) == 1
        issues = analyzer.log_groups_data[0]['issues']
        issue_types = [issue['type'] for issue in issues]
        assert 'high_ingestion_rate' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_log_group_missing_log_streams(self, mock_boto_client):
        """Test _analyze_log_group detects missing log streams"""
        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()
        mock_cloudwatch_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client
            elif service == 'cloudwatch':
                return mock_cloudwatch_client

        mock_boto_client.side_effect = mock_client_side_effect

        log_group = {
            'logGroupName': '/aws/lambda/function',
            'retentionInDays': 30,
            'storedBytes': 1024**3,
            'creationTime': int((datetime.now(timezone.utc) - timedelta(days=30)).timestamp() * 1000)
        }

        # Mock no log streams found
        mock_logs_client.list_tags_log_group.return_value = {'tags': {}}
        mock_logs_client.describe_metric_filters.return_value = {'metricFilters': []}
        mock_logs_client.describe_subscription_filters.return_value = {'subscriptionFilters': []}
        mock_logs_client.describe_log_streams.return_value = {'logStreams': []}  # No streams

        analyzer = CloudWatchLogsAnalyzer()
        analyzer._analyze_log_group(log_group)

        assert len(analyzer.log_groups_data) == 1
        issues = analyzer.log_groups_data[0]['issues']
        issue_types = [issue['type'] for issue in issues]
        assert 'missing_log_streams' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_log_group_critical_no_cross_region_backup(self, mock_boto_client):
        """Test _analyze_log_group detects missing cross-region backup for critical logs"""
        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()
        mock_cloudwatch_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client
            elif service == 'cloudwatch':
                return mock_cloudwatch_client

        mock_boto_client.side_effect = mock_client_side_effect

        log_group = {
            'logGroupName': '/aws/lambda/critical-function',
            'retentionInDays': 30,
            'storedBytes': 1024**3,
            'creationTime': int((datetime.now(timezone.utc) - timedelta(days=30)).timestamp() * 1000)
        }

        # Mock critical tags but no cross-region subscription filters
        mock_logs_client.list_tags_log_group.return_value = {'tags': {'Criticality': 'high', 'Environment': 'production'}}
        mock_logs_client.describe_metric_filters.return_value = {'metricFilters': []}
        mock_logs_client.describe_subscription_filters.return_value = {'subscriptionFilters': []}  # No cross-region
        mock_logs_client.describe_log_streams.return_value = {'logStreams': [{'storedBytes': 1024**2}]}

        analyzer = CloudWatchLogsAnalyzer()
        analyzer._analyze_log_group(log_group)

        assert len(analyzer.log_groups_data) == 1
        issues = analyzer.log_groups_data[0]['issues']
        issue_types = [issue['type'] for issue in issues]
        assert 'no_cross_region_backup' in issue_types

    @patch('analyse.boto3.client')
    def test_analyze_log_group_inefficient_log_format(self, mock_boto_client):
        """Test _analyze_log_group detects inefficient log format"""
        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()
        mock_cloudwatch_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client
            elif service == 'cloudwatch':
                return mock_cloudwatch_client

        mock_boto_client.side_effect = mock_client_side_effect

        log_group = {
            'logGroupName': '/aws/lambda/function',
            'retentionInDays': 30,
            'storedBytes': 1024**3,
            'creationTime': int((datetime.now(timezone.utc) - timedelta(days=30)).timestamp() * 1000)
        }

        # Mock verbose JSON logs
        mock_logs_client.list_tags_log_group.return_value = {'tags': {}}
        mock_logs_client.describe_metric_filters.return_value = {'metricFilters': []}
        mock_logs_client.describe_subscription_filters.return_value = {'subscriptionFilters': []}
        mock_logs_client.describe_log_streams.return_value = {'logStreams': [{'storedBytes': 1024**2}]}
        mock_logs_client.filter_log_events.return_value = {
            'events': [{'message': '{"field1": "value1", "field2": "value2", "field3": "value3", "field4": "value4", "field5": "value5", "field6": "value6", "field7": "value7", "field8": "value8", "field9": "value9", "field10": "value10", "field11": "value11", "field12": "value12", "field13": "value13", "field14": "value14", "field15": "value15", "field16": "value16", "field17": "value17", "field18": "value18", "field19": "value19", "field20": "value20", "field21": "value21"}'}]
        }

        analyzer = CloudWatchLogsAnalyzer()
        analyzer._analyze_log_group(log_group)

        assert len(analyzer.log_groups_data) == 1
        issues = analyzer.log_groups_data[0]['issues']
        issue_types = [issue['type'] for issue in issues]
        assert 'inefficient_log_format' in issue_types

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_main_execution_success(self, mock_print, mock_boto_client):
        """Test main execution runs without errors"""
        # Test that the script can be executed (simulating if __name__ == '__main__')
        # We can't easily mock the main block, so we'll test that analyzer can be created and run
        with patch.object(CloudWatchLogsAnalyzer, 'run') as mock_run:
            analyzer = CloudWatchLogsAnalyzer()
            analyzer.run()

            mock_run.assert_called_once()

    @patch('analyse.boto3.client')
    def test_filter_log_groups_excludes_dev_prefix(self, mock_boto_client):
        """Test _filter_log_groups excludes dev- and test- prefixes"""
        analyzer = CloudWatchLogsAnalyzer()

        creation_time = int((datetime.now(timezone.utc) - timedelta(days=60)).timestamp() * 1000)
        log_groups = [
            {'logGroupName': '/aws/lambda/dev-function', 'creationTime': creation_time},
            {'logGroupName': 'test-function', 'creationTime': creation_time},
            {'logGroupName': '/aws/lambda/prod-function', 'creationTime': creation_time}
        ]

        filtered = analyzer._filter_log_groups(log_groups)

        # Should only include prod-function
        assert len(filtered) == 1
        assert filtered[0]['logGroupName'] == '/aws/lambda/prod-function'

    @patch('analyse.boto3.client')
    def test_filter_log_groups_excludes_tagged(self, mock_boto_client):
        """Test _filter_log_groups excludes logs with ExcludeFromAnalysis tag"""
        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        creation_time = int((datetime.now(timezone.utc) - timedelta(days=60)).timestamp() * 1000)
        log_groups = [
            {'logGroupName': '/aws/lambda/excluded', 'creationTime': creation_time},
            {'logGroupName': '/aws/lambda/included', 'creationTime': creation_time}
        ]

        def tag_side_effect(logGroupName):
            if 'excluded' in logGroupName:
                return {'tags': {'ExcludeFromAnalysis': 'true'}}
            return {'tags': {}}

        mock_logs_client.list_tags_log_group.side_effect = tag_side_effect

        analyzer = CloudWatchLogsAnalyzer()
        filtered = analyzer._filter_log_groups(log_groups)

        # Should only include 'included'
        assert len(filtered) == 1
        assert filtered[0]['logGroupName'] == '/aws/lambda/included'

    @patch('analyse.boto3.client')
    def test_check_monitoring_gaps_ec2(self, mock_boto_client):
        """Test _check_monitoring_gaps detects EC2 instances without logs"""
        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()
        mock_cloudwatch_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client
            elif service == 'cloudwatch':
                return mock_cloudwatch_client

        mock_boto_client.side_effect = mock_client_side_effect

        # Mock EC2 instances
        mock_ec2_paginator = MagicMock()
        mock_ec2_client.get_paginator.return_value = mock_ec2_paginator
        mock_ec2_paginator.paginate.return_value = [
            {
                'Reservations': [
                    {
                        'Instances': [
                            {'InstanceId': 'i-12345'},
                            {'InstanceId': 'i-67890'}
                        ]
                    }
                ]
            }
        ]

        # Mock Lambda to return empty
        mock_lambda_paginator = MagicMock()
        mock_lambda_client.get_paginator.return_value = mock_lambda_paginator
        mock_lambda_paginator.paginate.return_value = [{'Functions': []}]

        # Mock no log groups exist
        mock_logs_client.describe_log_groups.return_value = {'logGroups': []}

        analyzer = CloudWatchLogsAnalyzer()
        analyzer._check_monitoring_gaps()

        # Should detect 2 EC2 instances without logs
        assert len(analyzer.monitoring_gaps) >= 2
        ec2_gaps = [g for g in analyzer.monitoring_gaps if g['resource_type'] == 'EC2']
        assert len(ec2_gaps) >= 2

    @patch('analyse.boto3.client')
    def test_log_group_exists(self, mock_boto_client):
        """Test _log_group_exists correctly checks existence"""
        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_log_groups.return_value = {'logGroups': [{'logGroupName': '/aws/lambda/test'}]}

        analyzer = CloudWatchLogsAnalyzer()

        assert analyzer._log_group_exists('/aws/lambda/test') == True

    @patch('analyse.boto3.client')
    def test_log_group_exists_pattern(self, mock_boto_client):
        """Test _log_group_exists_pattern finds matching log groups"""
        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_log_groups.return_value = {'logGroups': [{'logGroupName': '/aws/ec2/i-12345'}]}

        analyzer = CloudWatchLogsAnalyzer()

        assert analyzer._log_group_exists_pattern('/aws/ec2/') == True

    @patch('analyse.boto3.client')
    def test_is_vpc_flow_log(self, mock_boto_client):
        """Test _is_vpc_flow_log correctly identifies VPC flow logs"""
        analyzer = CloudWatchLogsAnalyzer()

        assert analyzer._is_vpc_flow_log('vpc-flow-logs/vpc-12345') == True
        assert analyzer._is_vpc_flow_log('/aws/vpc/flow-logs') == True
        assert analyzer._is_vpc_flow_log('/aws/lambda/test') == False

    @patch('analyse.boto3.client')
    def test_has_cross_region_backup(self, mock_boto_client):
        """Test _has_cross_region_backup detects cross-region S3 destinations"""
        analyzer = CloudWatchLogsAnalyzer()

        # Test with cross-region S3
        filters_with_backup = [
            {'destinationArn': 'arn:aws:s3:::my-bucket-us-west-2'}
        ]
        assert analyzer._has_cross_region_backup(filters_with_backup) == True

        # Test without cross-region backup
        filters_without_backup = [
            {'destinationArn': 'arn:aws:logs:us-east-1:123456789012:destination:test'}
        ]
        assert analyzer._has_cross_region_backup(filters_without_backup) == False

    @patch('analyse.boto3.client')
    def test_extract_source_identifier(self, mock_boto_client):
        """Test _extract_source_identifier extracts correct source"""
        analyzer = CloudWatchLogsAnalyzer()

        assert analyzer._extract_source_identifier('/aws/lambda/my-function') == 'my-function'
        assert analyzer._extract_source_identifier('/aws/ecs/my-service') == 'my-service'
        assert analyzer._extract_source_identifier('short') == None

    @patch('analyse.boto3.client')
    def test_are_sources_similar(self, mock_boto_client):
        """Test _are_sources_similar detects duplicate sources"""
        analyzer = CloudWatchLogsAnalyzer()

        assert analyzer._are_sources_similar('my-app-logs', 'my-app-service') == True
        assert analyzer._are_sources_similar('my-app', 'my-app-lambda') == True
        assert analyzer._are_sources_similar('app1', 'app2') == False

    @patch('analyse.boto3.client')
    def test_get_expected_log_streams(self, mock_boto_client):
        """Test _get_expected_log_streams returns correct expectations"""
        analyzer = CloudWatchLogsAnalyzer()

        assert analyzer._get_expected_log_streams('/aws/lambda/test') == 1
        assert analyzer._get_expected_log_streams('/aws/ecs/test') == 1
        assert analyzer._get_expected_log_streams('/aws/eks/test') == 1
        assert analyzer._get_expected_log_streams('/var/log/other') == 0

    @patch('analyse.boto3.client')
    def test_get_recommended_metric_filters(self, mock_boto_client):
        """Test _get_recommended_metric_filters returns appropriate filters"""
        analyzer = CloudWatchLogsAnalyzer()

        issues = [{'type': 'missing_metric_filters'}]
        recommendations = analyzer._get_recommended_metric_filters('/aws/lambda/app', issues)

        assert len(recommendations) > 0
        assert 'ERROR level logs count' in recommendations
        assert 'WARN level logs count' in recommendations

    @patch('analyse.boto3.client')
    def test_calculate_optimized_cost(self, mock_boto_client):
        """Test _calculate_optimized_cost computes reduced costs"""
        analyzer = CloudWatchLogsAnalyzer()

        issues_with_high_ingestion = [
            {'type': 'high_ingestion_rate', 'potential_savings': 10.0}
        ]

        cost = analyzer._calculate_optimized_cost(
            '/aws/lambda/test',
            stored_gb=1.0,
            daily_ingestion_gb=10.0,
            optimized_retention=30,
            issues=issues_with_high_ingestion
        )

        # Cost should be positive
        assert cost > 0

    @patch('analyse.boto3.client')
    def test_filter_log_groups_age_check_in_test_env(self, mock_boto_client):
        """Test _filter_log_groups skips age check when AWS_ENDPOINT_URL is set"""
        import os

        # Set test environment
        os.environ['AWS_ENDPOINT_URL'] = 'http://localhost:5001'

        analyzer = CloudWatchLogsAnalyzer()

        # Recent log group (would normally be filtered)
        recent_time = int((datetime.now(timezone.utc) - timedelta(days=1)).timestamp() * 1000)
        log_groups = [
            {'logGroupName': '/aws/lambda/new-function', 'creationTime': recent_time}
        ]

        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client
        mock_logs_client.list_tags_log_group.return_value = {'tags': {}}

        filtered = analyzer._filter_log_groups(log_groups)

        # Should NOT be filtered in test environment
        assert len(filtered) == 1

        # Clean up
        if 'AWS_ENDPOINT_URL' in os.environ:
            del os.environ['AWS_ENDPOINT_URL']

    @patch('analyse.boto3.client')
    def test_filter_log_groups_handles_tag_error(self, mock_boto_client):
        """Test _filter_log_groups handles tag retrieval errors gracefully"""
        from botocore.exceptions import ClientError

        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        creation_time = int((datetime.now(timezone.utc) - timedelta(days=60)).timestamp() * 1000)
        log_groups = [
            {'logGroupName': '/aws/lambda/function', 'creationTime': creation_time}
        ]

        # Mock tag retrieval to raise error
        mock_logs_client.list_tags_log_group.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'ListTagsLogGroup'
        )

        analyzer = CloudWatchLogsAnalyzer()
        filtered = analyzer._filter_log_groups(log_groups)

        # Should still include the log group despite tag error
        assert len(filtered) == 1

    @patch('analyse.boto3.client')
    def test_get_metric_filters_handles_error(self, mock_boto_client):
        """Test _get_metric_filters handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_metric_filters.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'DescribeMetricFilters'
        )

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._get_metric_filters('/aws/lambda/test')

        # Should return empty list on error
        assert result == []

    @patch('analyse.boto3.client')
    def test_get_subscription_filters_handles_error(self, mock_boto_client):
        """Test _get_subscription_filters handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_subscription_filters.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'DescribeSubscriptionFilters'
        )

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._get_subscription_filters('/aws/lambda/test')

        # Should return empty list on error
        assert result == []

    @patch('analyse.boto3.client')
    def test_get_log_streams_count_handles_error(self, mock_boto_client):
        """Test _get_log_streams_count handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_log_streams.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'DescribeLogStreams'
        )

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._get_log_streams_count('/aws/lambda/test')

        # Should return 0 on error
        assert result == 0

    @patch('analyse.boto3.client')
    def test_calculate_daily_ingestion_handles_error(self, mock_boto_client):
        """Test _calculate_daily_ingestion handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_log_streams.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'DescribeLogStreams'
        )

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._calculate_daily_ingestion('/aws/lambda/test')

        # Should return 0.0 on error
        assert result == 0.0

    @patch('analyse.boto3.client')
    def test_get_last_event_time_no_streams(self, mock_boto_client):
        """Test _get_last_event_time returns None when no streams"""
        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_log_streams.return_value = {'logStreams': []}

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._get_last_event_time('/aws/lambda/test')

        # Should return None
        assert result is None

    @patch('analyse.boto3.client')
    def test_get_last_event_time_handles_error(self, mock_boto_client):
        """Test _get_last_event_time handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_log_streams.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'DescribeLogStreams'
        )

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._get_last_event_time('/aws/lambda/test')

        # Should return None on error
        assert result is None

    @patch('analyse.boto3.client')
    def test_is_capturing_all_traffic_handles_error(self, mock_boto_client):
        """Test _is_capturing_all_traffic handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_logs_client = MagicMock()
        mock_ec2_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'ec2':
                return mock_ec2_client
            return mock_logs_client

        mock_boto_client.side_effect = mock_client_side_effect

        mock_ec2_client.describe_flow_logs.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'DescribeFlowLogs'
        )

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._is_capturing_all_traffic('vpc-flow-logs/vpc-12345')

        # Should return False on error
        assert result == False

    @patch('analyse.boto3.client')
    def test_has_verbose_json_format_handles_error(self, mock_boto_client):
        """Test _has_verbose_json_format handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.filter_log_events.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'FilterLogEvents'
        )

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._has_verbose_json_format('/aws/lambda/test')

        # Should return False on error
        assert result == False

    @patch('analyse.boto3.client')
    def test_log_group_exists_handles_error(self, mock_boto_client):
        """Test _log_group_exists handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_log_groups.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'DescribeLogGroups'
        )

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._log_group_exists('/aws/lambda/test')

        # Should return False on error
        assert result == False

    @patch('analyse.boto3.client')
    def test_log_group_exists_pattern_handles_error(self, mock_boto_client):
        """Test _log_group_exists_pattern handles errors gracefully"""
        from botocore.exceptions import ClientError

        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_log_groups.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'DescribeLogGroups'
        )

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._log_group_exists_pattern('/aws/ec2/')

        # Should return False on error
        assert result == False

    @patch('analyse.boto3.client')
    def test_check_monitoring_gaps_handles_lambda_error(self, mock_boto_client):
        """Test _check_monitoring_gaps handles Lambda API errors gracefully"""
        from botocore.exceptions import ClientError

        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client

        mock_boto_client.side_effect = mock_client_side_effect

        # Mock Lambda to raise error
        mock_lambda_client.get_paginator.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'ListFunctions'
        )

        # Mock EC2 to return empty
        mock_ec2_paginator = MagicMock()
        mock_ec2_client.get_paginator.return_value = mock_ec2_paginator
        mock_ec2_paginator.paginate.return_value = [{'Reservations': []}]

        analyzer = CloudWatchLogsAnalyzer()

        # Should not raise exception
        analyzer._check_monitoring_gaps()

    @patch('analyse.boto3.client')
    def test_check_monitoring_gaps_handles_ec2_error(self, mock_boto_client):
        """Test _check_monitoring_gaps handles EC2 API errors gracefully"""
        from botocore.exceptions import ClientError

        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client

        mock_boto_client.side_effect = mock_client_side_effect

        # Mock Lambda to return empty
        mock_lambda_paginator = MagicMock()
        mock_lambda_client.get_paginator.return_value = mock_lambda_paginator
        mock_lambda_paginator.paginate.return_value = [{'Functions': []}]

        # Mock EC2 to raise error
        mock_ec2_client.get_paginator.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'DescribeInstances'
        )

        analyzer = CloudWatchLogsAnalyzer()

        # Should not raise exception
        analyzer._check_monitoring_gaps()

    @patch('analyse.boto3.client')
    def test_generate_chart_with_empty_data(self, mock_boto_client):
        """Test _generate_chart handles empty data gracefully"""
        analyzer = CloudWatchLogsAnalyzer()
        analyzer.log_groups_data = []

        # Should not raise exception
        analyzer._generate_chart()

    @patch('analyse.boto3.client')
    def test_check_monitoring_gaps_ec2_with_log_streams(self, mock_boto_client):
        """Test _check_monitoring_gaps detects EC2 with log group but no streams"""
        mock_logs_client = MagicMock()
        mock_lambda_client = MagicMock()
        mock_ec2_client = MagicMock()

        def mock_client_side_effect(service, **kwargs):
            if service == 'logs':
                return mock_logs_client
            elif service == 'lambda':
                return mock_lambda_client
            elif service == 'ec2':
                return mock_ec2_client

        mock_boto_client.side_effect = mock_client_side_effect

        # Mock EC2 instances
        mock_ec2_paginator = MagicMock()
        mock_ec2_client.get_paginator.return_value = mock_ec2_paginator
        mock_ec2_paginator.paginate.return_value = [
            {
                'Reservations': [
                    {'Instances': [{'InstanceId': 'i-12345', 'State': {'Name': 'running'}}]}
                ]
            }
        ]

        # Mock Lambda to return empty
        mock_lambda_paginator = MagicMock()
        mock_lambda_client.get_paginator.return_value = mock_lambda_paginator
        mock_lambda_paginator.paginate.return_value = [{'Functions': []}]

        # Mock log group exists but no streams
        mock_logs_client.describe_log_groups.return_value = {'logGroups': [{'logGroupName': '/aws/ec2/i-12345'}]}
        mock_logs_client.describe_log_streams.return_value = {'logStreams': []}

        analyzer = CloudWatchLogsAnalyzer()
        analyzer._check_monitoring_gaps()

        # Should detect EC2 with missing streams (status is now "No Log Streams" per enhanced implementation)
        ec2_gaps = [g for g in analyzer.monitoring_gaps if g['resource_type'] == 'EC2' and g['status'] == 'No Log Streams']
        assert len(ec2_gaps) >= 1

    @patch('analyse.boto3.client')
    def test_check_specific_log_stream_exists(self, mock_boto_client):
        """Test _check_specific_log_stream_exists method"""
        mock_logs_client = MagicMock()
        mock_boto_client.return_value = mock_logs_client

        # Test stream exists
        mock_logs_client.describe_log_streams.return_value = {
            'logStreams': [{'logStreamName': '2025/01/20/test-stream'}]
        }

        analyzer = CloudWatchLogsAnalyzer()
        result = analyzer._check_specific_log_stream_exists('/aws/lambda/test', '2025/01/20')
        assert result == True

        # Test stream doesn't exist
        mock_logs_client.describe_log_streams.return_value = {'logStreams': []}
        result = analyzer._check_specific_log_stream_exists('/aws/lambda/test', '2025/01/20')
        assert result == False
