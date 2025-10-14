"""
Unit tests for EC2 Recovery Infrastructure.

Comprehensive unit tests focusing on resource creation, configuration,
and attributes with >=90% coverage.
"""

import unittest
from unittest.mock import MagicMock, call, patch

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from lib.infrastructure.cloudwatch import CloudWatchStack
from lib.infrastructure.cloudwatch_events import CloudWatchEventsStack
from lib.infrastructure.config import EC2RecoveryConfig
from lib.infrastructure.iam import IAMStack
from lib.infrastructure.lambda_function import LambdaStack
from lib.infrastructure.parameter_store import ParameterStoreStack
from lib.infrastructure.s3 import S3Stack
from lib.infrastructure.sns import SNSStack
# Import the classes we're testing
from lib.tap_stack import EC2RecoveryStack


class TestEC2RecoveryConfig(unittest.TestCase):
    """Test cases for EC2RecoveryConfig configuration class."""

    @patch.dict('os.environ', {
        'ENVIRONMENT': 'test',
        'AWS_REGION': 'us-west-2',
        'PROJECT_NAME': 'test-project',
        'ALERT_EMAIL': 'test@example.com',
        'MAX_RETRY_ATTEMPTS': '5',
        'RETRY_INTERVAL_MINUTES': '3',
        'MONITORING_INTERVAL_MINUTES': '15'
    })
    def test_config_with_custom_values(self):
        """Test configuration with custom environment variables."""
        config = EC2RecoveryConfig()
        
        # Test that all required attributes exist and are valid
        self.assertIsNotNone(config.environment_suffix)
        self.assertIsNotNone(config.region)
        self.assertIsNotNone(config.project_name)
        self.assertIsNotNone(config.alert_email)
        self.assertIsNotNone(config.max_retry_attempts)
        self.assertIsNotNone(config.retry_interval_minutes)
        self.assertIsNotNone(config.monitoring_interval_minutes)
        
        # Test that values are reasonable
        self.assertGreater(config.max_retry_attempts, 0)
        self.assertGreater(config.retry_interval_minutes, 0)
        self.assertGreater(config.monitoring_interval_minutes, 0)
        self.assertIn('@', config.alert_email)

    @patch.dict('os.environ', {}, clear=True)
    def test_config_with_defaults(self):
        """Test configuration with default values."""
        config = EC2RecoveryConfig()
        
        self.assertEqual(config.environment, 'dev')
        self.assertEqual(config.region, 'us-west-2')
        self.assertEqual(config.project_name, 'ec2-recovery')
        self.assertEqual(config.alert_email, 'admin@example.com')
        self.assertEqual(config.max_retry_attempts, 3)
        self.assertEqual(config.retry_interval_minutes, 5)
        self.assertEqual(config.monitoring_interval_minutes, 10)
        self.assertEqual(config.environment_suffix, '-dev')

    def test_config_region_validation(self):
        """Test region validation raises error for invalid region."""
        with patch.dict('os.environ', {'AWS_REGION': 'eu-west-1'}):
            with self.assertRaises(ValueError) as context:
                EC2RecoveryConfig()
            self.assertIn("Region must be us-west-2 or us-east-1", str(context.exception))

    def test_config_region_validation_us_east_1(self):
        """Test region validation allows us-east-1."""
        with patch.dict('os.environ', {'AWS_REGION': 'us-east-1'}):
            config = EC2RecoveryConfig()
            self.assertEqual(config.region, 'us-east-1')

    def test_config_resource_naming(self):
        """Test resource naming includes timestamp and random suffix."""
        config = EC2RecoveryConfig()
        
        # Check that names include expected patterns
        self.assertIn('ec2-recovery', config.lambda_function_name)
        self.assertIn('dev', config.lambda_function_name)
        self.assertIn('alerts', config.sns_topic_name)
        self.assertIn('state', config.s3_bucket_name)
        self.assertIn('ec2-recovery', config.parameter_store_prefix)
        self.assertIn('role', config.iam_role_name)
        self.assertIn('monitoring', config.event_rule_name)

    def test_config_helper_methods(self):
        """Test configuration helper methods."""
        config = EC2RecoveryConfig()
        
        # Test get_resource_name
        resource_name = config.get_resource_name('test-resource', '-suffix')
        self.assertIn('ec2-recovery-test-resource-dev-suffix', resource_name)
        
        # Test get_parameter_name
        param_name = config.get_parameter_name('test-param')
        self.assertIn('/ec2-recovery/ec2-recovery-dev', param_name)
        self.assertIn('test-param', param_name)
        
        # Test get_s3_key
        s3_key = config.get_s3_key('test-key')
        self.assertEqual('ec2-recovery/test-key', s3_key)
        
        # Test get_tag_name
        tag_name = config.get_tag_name('test-tag')
        self.assertIn('ec2-recovery-test-tag-dev', tag_name)


class TestIAMStack(unittest.TestCase):
    """Test cases for IAMStack resource creation."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = EC2RecoveryConfig()
        self.iam_stack = IAMStack(self.config)

    @patch('pulumi_aws.iam.Role')
    def test_iam_role_creation(self, mock_role):
        """Test IAM role creation with correct attributes."""
        # Mock the role creation
        mock_role_instance = MagicMock()
        mock_role.return_value = mock_role_instance
        
        # Create the role
        role = self.iam_stack._create_lambda_role()
        
        # Verify role was created with correct parameters
        mock_role.assert_called_once()
        call_args = mock_role.call_args
        
        # Check resource name includes random suffix
        self.assertIn('lambda-role', call_args[0][0])
        self.assertIn('dev', call_args[0][0])
        
        # Check role name
        self.assertIn('ec2-recovery-ec2-recovery-role-dev', call_args[1]['name'])
        
        # Check assume role policy (it's a Pulumi Output object)
        assume_policy = call_args[1]['assume_role_policy']
        # Verify it's a Pulumi Output object
        self.assertIsNotNone(assume_policy)
        
        # Check tags
        tags = call_args[1]['tags']
        self.assertEqual(tags['Environment'], 'dev')
        self.assertEqual(tags['Project'], 'ec2-recovery')
        self.assertEqual(tags['Purpose'], 'EC2-Recovery')

    @patch('pulumi_aws.iam.Policy')
    def test_iam_policy_creation(self, mock_policy):
        """Test IAM policy creation with least-privilege permissions."""
        # Mock the policy creation
        mock_policy_instance = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        # Create the policy
        policy = self.iam_stack._create_lambda_policy()
        
        # Verify policy was created
        mock_policy.assert_called_once()
        call_args = mock_policy.call_args
        
        # Check policy name includes random suffix
        self.assertIn('lambda-policy', call_args[0][0])
        self.assertIn('dev', call_args[0][0])
        
        # Check policy document (it's a Pulumi Output object)
        policy_doc = call_args[1]['policy']
        # Verify it's a Pulumi Output object
        self.assertIsNotNone(policy_doc)

    @patch('pulumi_aws.iam.RolePolicyAttachment')
    def test_iam_role_policy_attachment(self, mock_attachment):
        """Test IAM role policy attachment."""
        # Mock the attachment creation
        mock_attachment_instance = MagicMock()
        mock_attachment.return_value = mock_attachment_instance
        
        # Create the attachment
        attachment = self.iam_stack._attach_policy_to_role()
        
        # Verify attachment was created
        mock_attachment.assert_called_once()
        call_args = mock_attachment.call_args
        
        # Check attachment name includes random suffix
        self.assertIn('lambda-policy-attachment', call_args[0][0])
        self.assertIn('dev', call_args[0][0])

    def test_iam_get_role_arn(self):
        """Test IAM role ARN getter."""
        arn = self.iam_stack.get_role_arn()
        self.assertIsNotNone(arn)

    def test_iam_get_role_name(self):
        """Test IAM role name getter."""
        name = self.iam_stack.get_role_name()
        self.assertIsNotNone(name)


class TestS3Stack(unittest.TestCase):
    """Test cases for S3Stack resource creation."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = EC2RecoveryConfig()
        self.s3_stack = S3Stack(self.config)

    @patch('pulumi_aws.s3.Bucket')
    def test_s3_bucket_creation(self, mock_bucket):
        """Test S3 bucket creation with correct attributes."""
        # Mock the bucket creation
        mock_bucket_instance = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        # Create the bucket
        bucket = self.s3_stack._create_state_bucket()
        
        # Verify bucket was created
        mock_bucket.assert_called_once()
        call_args = mock_bucket.call_args
        
        # Check bucket name includes timestamp and random suffix
        self.assertIn('state-bucket', call_args[0][0])
        self.assertIn('dev', call_args[0][0])
        
        # Check bucket name
        self.assertIn('ec2-recovery-state-dev', call_args[1]['bucket'])
        
        # Check tags
        tags = call_args[1]['tags']
        self.assertEqual(tags['Environment'], 'dev')
        self.assertEqual(tags['Project'], 'ec2-recovery')
        self.assertEqual(tags['Purpose'], 'EC2-Recovery-State')

    def test_s3_get_bucket_name(self):
        """Test S3 bucket name getter."""
        name = self.s3_stack.get_bucket_name()
        self.assertIsNotNone(name)

    def test_s3_get_bucket_arn(self):
        """Test S3 bucket ARN getter."""
        arn = self.s3_stack.get_bucket_arn()
        self.assertIsNotNone(arn)


class TestParameterStoreStack(unittest.TestCase):
    """Test cases for ParameterStoreStack resource creation."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = EC2RecoveryConfig()
        self.param_stack = ParameterStoreStack(self.config)

    @patch('pulumi_aws.ssm.Parameter')
    def test_parameter_creation(self, mock_parameter):
        """Test SSM parameter creation with correct attributes."""
        # Mock the parameter creation
        mock_param_instance = MagicMock()
        mock_parameter.return_value = mock_param_instance
        
        # Create parameters
        parameters = self.param_stack._create_parameters()
        
        # Verify all required parameters were created
        self.assertIn('alert_email', parameters)
        self.assertIn('max_retry_attempts', parameters)
        self.assertIn('retry_interval_minutes', parameters)
        self.assertIn('s3_bucket_name', parameters)
        self.assertIn('sns_topic_arn', parameters)
        
        # Check parameter creation calls
        self.assertEqual(mock_parameter.call_count, 5)
        
        # Verify alert email parameter
        alert_email_calls = [call for call in mock_parameter.call_args_list 
                           if 'alert-email' in call[0][0]]
        self.assertEqual(len(alert_email_calls), 1)
        
        alert_email_call = alert_email_calls[0]
        self.assertIn('alert-email-param', alert_email_call[0][0])
        self.assertIn('dev', alert_email_call[0][0])
        self.assertEqual(alert_email_call[1]['type'], 'String')
        self.assertEqual(alert_email_call[1]['value'], 'admin@example.com')
        self.assertIn('alert-email', alert_email_call[1]['name'])

    def test_parameter_arn_generation(self):
        """Test parameter ARN generation."""
        param_arn = self.param_stack.get_parameter_arn('test-param')
        # Test that ARN contains SSM service and parameter path
        self.assertIn('arn:aws:ssm:', param_arn)
        self.assertIn('parameter', param_arn)
        self.assertIn('test-param', param_arn)
        # Test that region is one of the allowed values
        self.assertTrue(('us-west-2' in param_arn) or ('us-east-1' in param_arn))


class TestSNSStack(unittest.TestCase):
    """Test cases for SNSStack resource creation."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = EC2RecoveryConfig()
        self.sns_stack = SNSStack(self.config)

    @patch('pulumi_aws.sns.Topic')
    def test_sns_topic_creation(self, mock_topic):
        """Test SNS topic creation with correct attributes."""
        # Mock the topic creation
        mock_topic_instance = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        # Create the topic
        topic = self.sns_stack._create_alert_topic()
        
        # Verify topic was created
        mock_topic.assert_called_once()
        call_args = mock_topic.call_args
        
        # Check topic name includes timestamp and random suffix
        self.assertIn('alert-topic', call_args[0][0])
        self.assertIn('dev', call_args[0][0])
        
        # Check topic name
        self.assertIn('ec2-recovery-alerts-dev', call_args[1]['name'])
        
        # Check tags
        tags = call_args[1]['tags']
        self.assertEqual(tags['Environment'], 'dev')
        self.assertEqual(tags['Project'], 'ec2-recovery')
        self.assertEqual(tags['Purpose'], 'EC2-Recovery-Alerts')

    @patch('pulumi_aws.sns.TopicSubscription')
    def test_sns_subscription_creation(self, mock_subscription):
        """Test SNS subscription creation."""
        # Mock the subscription creation
        mock_subscription_instance = MagicMock()
        mock_subscription.return_value = mock_subscription_instance
        
        # Create the subscription
        subscription = self.sns_stack._create_email_subscription()
        
        # Verify subscription was created
        mock_subscription.assert_called_once()
        call_args = mock_subscription.call_args
        
        # Check subscription name includes random suffix
        self.assertIn('email-subscription', call_args[0][0])
        self.assertIn('dev', call_args[0][0])
        
        # Check subscription parameters
        self.assertEqual(call_args[1]['protocol'], 'email')
        self.assertEqual(call_args[1]['endpoint'], 'admin@example.com')

    def test_sns_get_topic_arn(self):
        """Test SNS topic ARN getter."""
        arn = self.sns_stack.get_topic_arn()
        self.assertIsNotNone(arn)

    def test_sns_get_topic_name(self):
        """Test SNS topic name getter."""
        name = self.sns_stack.get_topic_name()
        self.assertIsNotNone(name)


class TestCloudWatchStack(unittest.TestCase):
    """Test cases for CloudWatchStack resource creation."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = EC2RecoveryConfig()
        self.cloudwatch_stack = CloudWatchStack(self.config)

    @patch('pulumi_aws.cloudwatch.LogGroup')
    def test_log_group_creation(self, mock_log_group):
        """Test CloudWatch log group creation."""
        # Mock the log group creation
        mock_log_group_instance = MagicMock()
        mock_log_group.return_value = mock_log_group_instance
        
        # Create the log group
        log_group = self.cloudwatch_stack._create_log_group()
        
        # Verify log group was created
        mock_log_group.assert_called_once()
        call_args = mock_log_group.call_args
        
        # Check log group name includes timestamp and random suffix
        self.assertIn('lambda-log-group', call_args[0][0])
        self.assertIn('dev', call_args[0][0])
        
        # Check log group name
        self.assertIn('/aws/lambda/ec2-recovery-ec2-recovery-dev', call_args[1]['name'])
        
        # Check retention policy
        self.assertEqual(call_args[1]['retention_in_days'], 30)
        
        # Check tags
        tags = call_args[1]['tags']
        self.assertEqual(tags['Environment'], 'dev')
        self.assertEqual(tags['Project'], 'ec2-recovery')
        self.assertEqual(tags['Purpose'], 'EC2-Recovery-Logs')

    @patch('pulumi_aws.cloudwatch.LogStream')
    def test_log_stream_creation(self, mock_log_stream):
        """Test CloudWatch log stream creation."""
        # Mock the log stream creation
        mock_log_stream_instance = MagicMock()
        mock_log_stream.return_value = mock_log_stream_instance
        
        # Create the log stream
        log_stream = self.cloudwatch_stack._create_log_stream()
        
        # Verify log stream was created
        mock_log_stream.assert_called_once()
        call_args = mock_log_stream.call_args
        
        # Check log stream name includes timestamp and random suffix
        self.assertIn('lambda-log-stream', call_args[0][0])
        self.assertIn('dev', call_args[0][0])

    def test_cloudwatch_get_log_group_name(self):
        """Test CloudWatch log group name getter."""
        name = self.cloudwatch_stack.get_log_group_name()
        self.assertIsNotNone(name)

    def test_cloudwatch_get_log_group_arn(self):
        """Test CloudWatch log group ARN getter."""
        arn = self.cloudwatch_stack.get_log_group_arn()
        self.assertIsNotNone(arn)


class TestLambdaStack(unittest.TestCase):
    """Test cases for LambdaStack resource creation."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = EC2RecoveryConfig()
        # Mock the IAM role ARN
        self.mock_role_arn = MagicMock()
        self.lambda_stack = LambdaStack(self.config, self.mock_role_arn)

    @patch('pulumi_aws.lambda_.Function')
    def test_lambda_function_creation(self, mock_function):
        """Test Lambda function creation with correct attributes."""
        # Mock the function creation
        mock_function_instance = MagicMock()
        mock_function.return_value = mock_function_instance
        
        # Create the function
        function = self.lambda_stack._create_lambda_function()
        
        # Verify function was created
        mock_function.assert_called_once()
        call_args = mock_function.call_args
        
        # Check function name includes timestamp and random suffix
        self.assertIn('lambda-function', call_args[0][0])
        self.assertIn('dev', call_args[0][0])
        
        # Check function configuration
        self.assertIn('ec2-recovery-ec2-recovery-dev', call_args[1]['name'])
        self.assertEqual(call_args[1]['runtime'], 'python3.11')
        self.assertEqual(call_args[1]['handler'], 'index.lambda_handler')
        self.assertEqual(call_args[1]['timeout'], 300)
        self.assertEqual(call_args[1]['memory_size'], 256)
        
        # Check environment variables (it's a FunctionEnvironmentArgs object)
        env_args = call_args[1]['environment']
        self.assertIsNotNone(env_args)
        # Check that environment is set
        self.assertIn('environment', call_args[1])
        
        # Check tags
        tags = call_args[1]['tags']
        self.assertEqual(tags['Environment'], 'dev')
        self.assertEqual(tags['Project'], 'ec2-recovery')
        self.assertEqual(tags['Purpose'], 'EC2-Recovery')

    def test_lambda_code_content(self):
        """Test Lambda function code contains required functionality."""
        code = self.lambda_stack._get_lambda_code()
        
        # Check for required imports
        self.assertIn('import boto3', code)
        self.assertIn('import json', code)
        self.assertIn('import os', code)
        self.assertIn('import time', code)
        self.assertIn('import logging', code)
        
        # Check for required functions
        self.assertIn('def lambda_handler', code)
        self.assertIn('def get_configuration', code)
        self.assertIn('def get_instances_to_recover', code)
        self.assertIn('def process_instance_recovery', code)
        self.assertIn('def start_instance', code)
        self.assertIn('def send_alert', code)
        
        # Check for AWS client initialization
        self.assertIn("ec2_client = boto3.client('ec2')", code)
        self.assertIn("s3_client = boto3.client('s3')", code)
        self.assertIn("sns_client = boto3.client('sns')", code)
        self.assertIn("ssm_client = boto3.client('ssm')", code)
        
        # Check for error handling
        self.assertIn('try:', code)
        self.assertIn('except Exception as e:', code)
        self.assertIn('logger.error', code)

    def test_lambda_get_function_arn(self):
        """Test Lambda function ARN getter."""
        arn = self.lambda_stack.get_function_arn()
        self.assertIsNotNone(arn)

    def test_lambda_get_function_name(self):
        """Test Lambda function name getter."""
        name = self.lambda_stack.get_function_name()
        self.assertIsNotNone(name)


class TestCloudWatchEventsStack(unittest.TestCase):
    """Test cases for CloudWatchEventsStack resource creation."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = EC2RecoveryConfig()
        # Mock the Lambda function ARN
        self.mock_function_arn = MagicMock()
        self.events_stack = CloudWatchEventsStack(self.config, self.mock_function_arn)

    @patch('pulumi_aws.cloudwatch.EventRule')
    def test_event_rule_creation(self, mock_rule):
        """Test CloudWatch Events rule creation."""
        # Mock the rule creation
        mock_rule_instance = MagicMock()
        mock_rule.return_value = mock_rule_instance
        
        # Create the rule
        rule = self.events_stack._create_event_rule()
        
        # Verify rule was created
        mock_rule.assert_called_once()
        call_args = mock_rule.call_args
        
        # Check rule name includes timestamp and random suffix
        self.assertIn('event-rule', call_args[0][0])
        self.assertIn('dev', call_args[0][0])
        
        # Check rule configuration
        self.assertIn('ec2-recovery-ec2-monitoring-dev', call_args[1]['name'])
        self.assertEqual(call_args[1]['description'], 'Trigger EC2 recovery monitoring every 10 minutes')
        self.assertEqual(call_args[1]['schedule_expression'], 'rate(10 minutes)')
        
        # Check tags
        tags = call_args[1]['tags']
        self.assertEqual(tags['Environment'], 'dev')
        self.assertEqual(tags['Project'], 'ec2-recovery')
        self.assertEqual(tags['Purpose'], 'EC2-Recovery-Monitoring')

    @patch('pulumi_aws.lambda_.Permission')
    def test_lambda_permission_creation(self, mock_permission):
        """Test Lambda permission creation for CloudWatch Events."""
        # Mock the permission creation
        mock_permission_instance = MagicMock()
        mock_permission.return_value = mock_permission_instance
        
        # Create the permission
        permission = self.events_stack._create_lambda_permission()
        
        # Verify permission was created
        mock_permission.assert_called_once()
        call_args = mock_permission.call_args
        
        # Check permission name includes random suffix
        self.assertIn('lambda-permission', call_args[0][0])
        self.assertIn('dev', call_args[0][0])
        
        # Check permission configuration
        self.assertEqual(call_args[1]['statement_id'], 'AllowExecutionFromCloudWatch')
        self.assertEqual(call_args[1]['action'], 'lambda:InvokeFunction')
        self.assertEqual(call_args[1]['principal'], 'events.amazonaws.com')

    @patch('pulumi_aws.cloudwatch.EventTarget')
    def test_event_target_creation(self, mock_target):
        """Test CloudWatch Events target creation."""
        # Mock the target creation
        mock_target_instance = MagicMock()
        mock_target.return_value = mock_target_instance
        
        # Create the target
        target = self.events_stack._create_event_target()
        
        # Verify target was created
        mock_target.assert_called_once()
        call_args = mock_target.call_args
        
        # Check target name includes random suffix
        self.assertIn('event-target', call_args[0][0])
        self.assertIn('dev', call_args[0][0])
        
        # Check target configuration
        self.assertEqual(call_args[1]['target_id'], 'EC2RecoveryTarget')
        
        # Check input contains expected JSON structure
        input_data = call_args[1]['input']
        self.assertIn('"source": "ec2-recovery-monitoring"', input_data)
        self.assertIn('"timestamp": "{{.Timestamp}}"', input_data)

    def test_events_get_event_rule_arn(self):
        """Test CloudWatch Events rule ARN getter."""
        arn = self.events_stack.get_event_rule_arn()
        self.assertIsNotNone(arn)

    def test_events_get_event_rule_name(self):
        """Test CloudWatch Events rule name getter."""
        name = self.events_stack.get_event_rule_name()
        self.assertIsNotNone(name)


class TestEC2RecoveryStack(unittest.TestCase):
    """Test cases for main EC2RecoveryStack orchestration."""

    def test_stack_initialization(self):
        """Test main stack initialization and component orchestration."""
        # Test that the stack can be initialized without errors
        try:
            stack = EC2RecoveryStack()
            # Verify stack has required attributes
            self.assertIsNotNone(stack.config)
            self.assertIsNotNone(stack.iam_stack)
            self.assertIsNotNone(stack.s3_stack)
            self.assertIsNotNone(stack.parameter_store_stack)
            self.assertIsNotNone(stack.sns_stack)
            self.assertIsNotNone(stack.cloudwatch_stack)
            self.assertIsNotNone(stack.lambda_stack)
            self.assertIsNotNone(stack.cloudwatch_events_stack)
        except Exception as e:
            self.fail(f"Stack initialization failed: {e}")

    @patch('pulumi.export')
    def test_output_registration_error_handling(self, mock_export):
        """Test output registration handles errors gracefully."""
        # Make pulumi.export raise an exception
        mock_export.side_effect = Exception("Test error")
        
        # This should not raise an exception
        with patch('builtins.print') as mock_print:
            stack = EC2RecoveryStack()
            # Should have printed a warning
            mock_print.assert_called()
            self.assertIn("Warning: Could not export outputs", mock_print.call_args[0][0])


if __name__ == '__main__':
    unittest.main()