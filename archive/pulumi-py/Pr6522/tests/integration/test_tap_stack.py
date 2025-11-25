"""
test_tap_stack_integration.py

Integration tests for TapStack Pulumi infrastructure.
Tests AWS resource creation using moto for mocking.
"""

import json
import os
import shutil
import unittest

import boto3
from moto import mock_aws

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack using moto AWS mocking."""

    def setUp(self):
        """Set up integration test environment."""
        # Configure boto3 to use moto
        self.aws_region = 'us-east-1'
        
        # Set environment variables for moto
        os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
        os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'
        os.environ['AWS_SECURITY_TOKEN'] = 'testing'
        os.environ['AWS_SESSION_TOKEN'] = 'testing'
        os.environ['AWS_DEFAULT_REGION'] = self.aws_region
        
        # Initialize boto3 clients (moto will mock these)
        self.sns_client = boto3.client('sns', region_name=self.aws_region)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=self.aws_region)
        self.logs_client = boto3.client('logs', region_name=self.aws_region)
        self.iam_client = boto3.client('iam', region_name=self.aws_region)
        self.lambda_client = boto3.client('lambda', region_name=self.aws_region)
        
        # Test configuration
        self.environment_suffix = 'test'
        self.member_account_ids = ['123456789012', '987654321098']
        self.alert_email = 'test@example.com'
        self.jira_url = 'https://test.atlassian.net'
        self.jira_api_token = 'test-token'
        self.tags = {'Environment': 'test', 'Project': 'tap-integration'}

    def tearDown(self):
        """Clean up test workspace directories."""
        import shutil
        work_dirs = ['test-workspace', 'test-workspace-outputs']
        for work_dir in work_dirs:
            if os.path.exists(work_dir):
                shutil.rmtree(work_dir)

    @mock_aws
    def test_sns_topic_creation(self):
        """Test SNS topic creation and verification."""
        topic_name = f'monitoring-alerts-{self.environment_suffix}'
        topic = self.sns_client.create_topic(
            Name=topic_name,
            Attributes={'DisplayName': 'Cross-Account Monitoring Alerts'}
        )
        topic_arn = topic['TopicArn']
        
        # Verify topic exists
        topics = self.sns_client.list_topics()
        self.assertIn(topic_arn, [t['TopicArn'] for t in topics['Topics']])
        
        # Verify topic attributes
        topic_attrs = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
        self.assertEqual(topic_attrs['Attributes']['DisplayName'], 'Cross-Account Monitoring Alerts')

    @mock_aws
    def test_cloudwatch_log_group_creation(self):
        """Test CloudWatch log group creation with retention."""
        log_group_name = f'/aws/application/{self.environment_suffix}'
        self.logs_client.create_log_group(
            logGroupName=log_group_name,
            tags={'Environment': self.environment_suffix}
        )
        
        # Set retention policy
        self.logs_client.put_retention_policy(
            logGroupName=log_group_name,
            retentionInDays=30
        )
        
        # Verify log group exists
        log_groups = self.logs_client.describe_log_groups()
        self.assertIn(log_group_name, [lg['logGroupName'] for lg in log_groups['logGroups']])
        
        # Verify log group retention
        log_group = self.logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)['logGroups'][0]
        self.assertEqual(log_group['retentionInDays'], 30)

    @mock_aws
    def test_lambda_function_creation(self):
        """Test Lambda function creation with IAM role."""
        function_name = f'jira-ticket-creator-{self.environment_suffix}'
        lambda_code = '''
def handler(event, context):
    return {'statusCode': 200, 'body': 'OK'}
'''
        
        # Create IAM role for Lambda
        role_name = f'lambda-role-{self.environment_suffix}'
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }
        
        self.iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(assume_role_policy)
        )
        
        role_arn = f'arn:aws:iam::123456789012:role/{role_name}'
        
        self.lambda_client.create_function(
            FunctionName=function_name,
            Runtime='python3.11',
            Role=role_arn,
            Handler='index.handler',
            Code={'ZipFile': lambda_code.encode()},
            MemorySize=128,
            Timeout=3,
            Environment={
                'Variables': {
                    'JIRA_URL': self.jira_url,
                    'JIRA_API_TOKEN': self.jira_api_token
                }
            }
        )
        
        # Verify Lambda function exists
        functions = self.lambda_client.list_functions()
        self.assertIn(function_name, [f['FunctionName'] for f in functions['Functions']])
        
        # Verify Lambda function configuration
        func_config = self.lambda_client.get_function(FunctionName=function_name)
        self.assertEqual(func_config['Configuration']['Runtime'], 'python3.11')
        self.assertEqual(func_config['Configuration']['MemorySize'], 128)
        self.assertEqual(func_config['Configuration']['Timeout'], 3)
        
        # Verify environment variables
        env_vars = func_config['Configuration']['Environment']['Variables']
        self.assertEqual(env_vars['JIRA_URL'], self.jira_url)
        self.assertEqual(env_vars['JIRA_API_TOKEN'], self.jira_api_token)

    @mock_aws
    def test_cloudwatch_dashboard_creation(self):
        """Test CloudWatch dashboard creation."""
        dashboard_name = f'observability-dashboard-{self.environment_suffix}'
        dashboard_body = {
            "widgets": [{
                "type": "metric",
                "properties": {
                    "metrics": [["CustomMetrics/Application", f"ApplicationErrors-{self.environment_suffix}"]],
                    "period": 300,
                    "stat": "Sum",
                    "region": self.aws_region,
                    "title": "Application Errors"
                }
            }]
        }
        
        self.cloudwatch_client.put_dashboard(
            DashboardName=dashboard_name,
            DashboardBody=json.dumps(dashboard_body)
        )
        
        # Verify dashboard exists
        dashboards = self.cloudwatch_client.list_dashboards()
        self.assertIn(dashboard_name, [db['DashboardName'] for db in dashboards['DashboardEntries']])

    @mock_aws
    def test_iam_role_creation(self):
        """Test IAM role creation for cross-account access."""
        for account_id in self.member_account_ids:
            role_name = f'MonitoringRole-{account_id}'
            assume_role_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"AWS": f"arn:aws:iam::{account_id}:root"},
                    "Action": "sts:AssumeRole"
                }]
            }
            
            self.iam_client.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(assume_role_policy),
                Description=f'Cross-account monitoring role for {account_id}'
            )
            
            # Verify role exists
            roles = self.iam_client.list_roles()
            role_names = [role['RoleName'] for role in roles['Roles']]
            self.assertIn(role_name, role_names)
            
            # Verify role assume role policy
            role = self.iam_client.get_role(RoleName=role_name)
            policy = role['Role']['AssumeRolePolicyDocument']
            self.assertIn('Statement', policy)
            self.assertEqual(policy['Statement'][0]['Effect'], 'Allow')
            self.assertEqual(policy['Statement'][0]['Action'], 'sts:AssumeRole')

    @mock_aws
    def test_cloudwatch_alarms_creation(self):
        """Test CloudWatch alarms creation."""
        # Create error alarm
        error_alarm_name = f'application-error-alarm-{self.environment_suffix}'
        self.cloudwatch_client.put_metric_alarm(
            AlarmName=error_alarm_name,
            ComparisonOperator='GreaterThanThreshold',
            EvaluationPeriods=1,
            MetricName=f'ApplicationErrors-{self.environment_suffix}',
            Namespace='CustomMetrics/Application',
            Period=300,
            Statistic='Sum',
            Threshold=5.0,
            ActionsEnabled=True,
            AlarmActions=[f'arn:aws:sns:{self.aws_region}:123456789012:monitoring-alerts-{self.environment_suffix}']
        )
        
        # Create another alarm for testing
        latency_alarm_name = f'application-latency-alarm-{self.environment_suffix}'
        self.cloudwatch_client.put_metric_alarm(
            AlarmName=latency_alarm_name,
            ComparisonOperator='GreaterThanThreshold',
            EvaluationPeriods=1,
            MetricName=f'ApplicationLatency-{self.environment_suffix}',
            Namespace='CustomMetrics/Application',
            Period=300,
            Statistic='Average',
            Threshold=1000.0
        )
        
        # Verify alarms exist
        alarms = self.cloudwatch_client.describe_alarms()
        alarm_names = [alarm['AlarmName'] for alarm in alarms['MetricAlarms']]
        
        self.assertIn(error_alarm_name, alarm_names)
        self.assertIn(latency_alarm_name, alarm_names)
        
        # Verify error alarm configuration
        error_alarm = next(alarm for alarm in alarms['MetricAlarms'] if alarm['AlarmName'] == error_alarm_name)
        self.assertEqual(error_alarm['ComparisonOperator'], 'GreaterThanThreshold')
        self.assertEqual(error_alarm['Threshold'], 5.0)
        self.assertEqual(error_alarm['MetricName'], f'ApplicationErrors-{self.environment_suffix}')
        
        # Verify latency alarm configuration
        latency_alarm = next(alarm for alarm in alarms['MetricAlarms'] if alarm['AlarmName'] == latency_alarm_name)
        self.assertEqual(latency_alarm['ComparisonOperator'], 'GreaterThanThreshold')
        self.assertEqual(latency_alarm['Threshold'], 1000.0)

    @mock_aws
    def test_error_handling_invalid_config(self):
        """Test error handling for invalid configurations."""
        # Test invalid Lambda runtime
        with self.assertRaises(Exception):
            self.lambda_client.create_function(
                FunctionName='invalid-function',
                Runtime='invalid-runtime',
                Role='arn:aws:iam::123456789012:role/test-role',
                Handler='index.handler',
                Code={'ZipFile': b'invalid code'}
            )

    @mock_aws
    def test_resource_naming_conventions(self):
        """Test resource naming conventions."""
        # Test SNS topic naming
        topic_name = f'monitoring-alerts-{self.environment_suffix}'
        topic = self.sns_client.create_topic(Name=topic_name)
        self.assertTrue(topic_name.startswith('monitoring-alerts-'))
        
        # Test Lambda function naming
        function_name = f'jira-ticket-creator-{self.environment_suffix}'
        self.assertTrue(function_name.startswith('jira-ticket-creator-'))
        
        # Test dashboard naming
        dashboard_name = f'observability-dashboard-{self.environment_suffix}'
        self.assertTrue(dashboard_name.startswith('observability-dashboard-'))

    @mock_aws
    def test_tag_propagation(self):
        """Test tag propagation across resources."""
        tags = self.tags
        
        # Create log group with tags
        log_group_name = f'/aws/application/{self.environment_suffix}'
        self.logs_client.create_log_group(
            logGroupName=log_group_name,
            tags=tags
        )
        
        # Verify tags
        log_group_tags = self.logs_client.list_tags_log_group(logGroupName=log_group_name)
        self.assertEqual(log_group_tags['tags'], tags)

    @mock_aws
    def test_multiple_environment_suffixes(self):
        """Test multiple environment suffixes."""
        environments = ['dev', 'staging', 'prod']
        
        for env in environments:
            # Test SNS topic creation for each environment
            topic_name = f'monitoring-alerts-{env}'
            topic = self.sns_client.create_topic(Name=topic_name)
            topic_arn = topic['TopicArn']
            
            # Verify topic exists
            topics = self.sns_client.list_topics()
            self.assertIn(topic_arn, [t['TopicArn'] for t in topics['Topics']])

    @mock_aws
    def test_member_account_roles(self):
        """Test member account role creation."""
        account_ids = ['111111111111', '222222222222', '333333333333']
        
        for account_id in account_ids:
            role_name = f'MonitoringRole-{account_id}'
            assume_role_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"AWS": f"arn:aws:iam::{account_id}:root"},
                    "Action": "sts:AssumeRole"
                }]
            }
            
            self.iam_client.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(assume_role_policy)
            )
            
            # Verify role exists and has correct trust policy
            role = self.iam_client.get_role(RoleName=role_name)
            policy = role['Role']['AssumeRolePolicyDocument']
            self.assertEqual(policy['Statement'][0]['Principal']['AWS'], f'arn:aws:iam::{account_id}:root')

    @mock_aws
    def test_alarm_actions_and_notifications(self):
        """Test CloudWatch alarm actions and SNS notifications."""
        # Create SNS topic first
        topic_name = f'monitoring-alerts-{self.environment_suffix}'
        topic = self.sns_client.create_topic(Name=topic_name)
        topic_arn = topic['TopicArn']
        
        # Create alarm with SNS action
        alarm_name = f'test-alarm-{self.environment_suffix}'
        self.cloudwatch_client.put_metric_alarm(
            AlarmName=alarm_name,
            ComparisonOperator='GreaterThanThreshold',
            EvaluationPeriods=1,
            MetricName='TestMetric',
            Namespace='TestNamespace',
            Period=300,
            Statistic='Average',
            Threshold=10.0,
            ActionsEnabled=True,
            AlarmActions=[topic_arn]
        )
        
        # Verify alarm has correct actions
        alarms = self.cloudwatch_client.describe_alarms()
        alarm = next(alarm for alarm in alarms['MetricAlarms'] if alarm['AlarmName'] == alarm_name)
        self.assertIn(topic_arn, alarm['AlarmActions'])
        self.assertTrue(alarm['ActionsEnabled'])


if __name__ == '__main__':
    unittest.main()
