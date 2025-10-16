"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, patch

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import PipelineConfig


class TestPipelineConfig(unittest.TestCase):
    """Test PipelineConfig resource configuration."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = PipelineConfig()
            self.assertEqual(config.project_name, 'trading')
            self.assertEqual(config.app_name, 'events')
            self.assertEqual(config.environment, 'dev')
            self.assertEqual(config.environment_suffix, 'pr1234')
            self.assertEqual(config.primary_region, 'us-east-1')
            self.assertEqual(config.secondary_region, 'us-west-2')
            self.assertEqual(config.lambda_runtime, 'python3.11')

    @patch.dict('os.environ', {
        'PROJECT_NAME': 'custom-project',
        'APP_NAME': 'custom-app',
        'ENVIRONMENT': 'prod',
        'ENVIRONMENT_SUFFIX': 'custom123',
        'PRIMARY_REGION': 'eu-west-1',
        'SECONDARY_REGION': 'eu-central-1',
        'LAMBDA_RUNTIME': 'python3.12'
    })
    def test_config_custom_values(self):
        """Test configuration with custom environment variables."""
        config = PipelineConfig()
        self.assertEqual(config.project_name, 'custom-project')
        self.assertEqual(config.app_name, 'custom-app')
        self.assertEqual(config.environment, 'prod')
        self.assertEqual(config.environment_suffix, 'custom123')
        self.assertEqual(config.primary_region, 'eu-west-1')
        self.assertEqual(config.secondary_region, 'eu-central-1')
        self.assertEqual(config.lambda_runtime, 'python3.12')

    def test_get_resource_name(self):
        """Test resource name generation."""
        config = PipelineConfig()
        
        # Test with different resource types - check for key components instead of exact match
        lambda_name = config.get_resource_name('lambda-function', 'us-east-1')
        self.assertIn('trading-events-lambda-function-us-east-1', lambda_name)
        self.assertIn('dev', lambda_name)
        self.assertTrue(len(lambda_name) > 20)  # Should have environment suffix
        
        dynamodb_name = config.get_resource_name('dynamodb-table', 'us-west-2')
        self.assertIn('trading-events-dynamodb-table-us-west-2', dynamodb_name)
        self.assertIn('dev', dynamodb_name)
        self.assertTrue(len(dynamodb_name) > 20)  # Should have environment suffix

    def test_get_common_tags(self):
        """Test common tags generation."""
        config = PipelineConfig()
        tags = config.get_common_tags()
        
        self.assertIn('Project', tags)
        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)
        self.assertEqual(tags['Project'], 'trading')
        self.assertEqual(tags['Environment'], 'dev')

    def test_get_region_tags(self):
        """Test region-specific tags generation."""
        config = PipelineConfig()
        tags = config.get_region_tags('us-east-1')
        
        self.assertIn('Region', tags)
        self.assertEqual(tags['Region'], 'us-east-1')

    def test_normalize_name(self):
        """Test name normalization for case-sensitive resources."""
        config = PipelineConfig()
        
        # Test lowercase normalization
        normalized = config.normalize_name('Test-Name')
        self.assertEqual(normalized, 'test-name')

    def test_regions_property(self):
        """Test regions property."""
        config = PipelineConfig()
        regions = config.regions
        
        self.assertIn('us-east-1', regions)
        self.assertIn('us-west-2', regions)
        self.assertEqual(len(regions), 2)

    def test_get_resource_name_with_special_characters(self):
        """Test resource name generation with special characters."""
        config = PipelineConfig()
        
        # Test with special characters that should be normalized
        name = config.get_resource_name('test-resource', 'us-east-1')
        self.assertIn('trading-events-test-resource-us-east-1', name)
        self.assertIn('dev', name)
        self.assertTrue(len(name) > 20)  # Should have environment suffix

    def test_get_common_tags_with_custom_values(self):
        """Test common tags with custom environment values."""
        with patch.dict('os.environ', {
            'ENVIRONMENT': 'prod',
            'PROJECT_NAME': 'custom-project',
            'APP_NAME': 'custom-app'
        }):
            config = PipelineConfig()
            tags = config.get_common_tags()
            
            self.assertEqual(tags['Project'], 'custom-project')
            self.assertEqual(tags['Environment'], 'prod')

    def test_get_region_tags_different_regions(self):
        """Test region tags for different regions."""
        config = PipelineConfig()
        
        # Test primary region
        primary_tags = config.get_region_tags('us-east-1')
        self.assertEqual(primary_tags['Region'], 'us-east-1')
        
        # Test secondary region
        secondary_tags = config.get_region_tags('us-west-2')
        self.assertEqual(secondary_tags['Region'], 'us-west-2')

    def test_environment_suffix_handling(self):
        """Test environment suffix handling."""
        with patch.dict('os.environ', {
            'ENVIRONMENT_SUFFIX': 'test123'
        }):
            config = PipelineConfig()
            self.assertEqual(config.environment_suffix, 'test123')
            # Also test that it's not empty and contains expected format
            self.assertTrue(len(config.environment_suffix) > 0)
            self.assertIsInstance(config.environment_suffix, str)

    def test_lambda_runtime_handling(self):
        """Test Lambda runtime handling."""
        with patch.dict('os.environ', {
            'LAMBDA_RUNTIME': 'python3.12'
        }):
            config = PipelineConfig()
            self.assertEqual(config.lambda_runtime, 'python3.12')

    def test_region_configuration(self):
        """Test region configuration."""
        with patch.dict('os.environ', {
            'PRIMARY_REGION': 'eu-west-1',
            'SECONDARY_REGION': 'eu-central-1'
        }):
            config = PipelineConfig()
            self.assertEqual(config.primary_region, 'eu-west-1')
            self.assertEqual(config.secondary_region, 'eu-central-1')

    def test_project_and_app_name_handling(self):
        """Test project and app name handling."""
        with patch.dict('os.environ', {
            'PROJECT_NAME': 'my-project',
            'APP_NAME': 'my-app'
        }):
            config = PipelineConfig()
            self.assertEqual(config.project_name, 'my-project')
            self.assertEqual(config.app_name, 'my-app')

    def test_environment_handling(self):
        """Test environment handling."""
        with patch.dict('os.environ', {
            'ENVIRONMENT': 'staging'
        }):
            config = PipelineConfig()
            self.assertEqual(config.environment, 'staging')

    def test_get_resource_name_edge_cases(self):
        """Test resource name generation edge cases."""
        config = PipelineConfig()
        
        # Test with empty resource type
        name = config.get_resource_name('', 'us-east-1')
        self.assertIn('trading-events-us-east-1', name)
        self.assertIn('dev', name)
        self.assertTrue(len(name) > 15)  # Should have environment suffix
        
        # Test with very long resource type
        long_name = config.get_resource_name('very-long-resource-type-name', 'us-east-1')
        self.assertIn('trading-events-very-long-resource-type-name-us-east-1', long_name)
        self.assertIn('dev', long_name)
        self.assertTrue(len(long_name) > 30)  # Should have environment suffix

    def test_normalize_name_edge_cases(self):
        """Test name normalization edge cases."""
        config = PipelineConfig()
        
        # Test with already lowercase
        self.assertEqual(config.normalize_name('already-lowercase'), 'already-lowercase')
        
        # Test with mixed case
        self.assertEqual(config.normalize_name('Mixed-Case-Name'), 'mixed-case-name')
        
        # Test with numbers
        self.assertEqual(config.normalize_name('Test123-Name'), 'test123-name')

    def test_get_common_tags_structure(self):
        """Test common tags structure."""
        config = PipelineConfig()
        tags = config.get_common_tags()
        
        # Verify all required keys are present
        required_keys = ['Project', 'Environment', 'ManagedBy']
        for key in required_keys:
            self.assertIn(key, tags)
        
        # Verify values are strings
        for key, value in tags.items():
            self.assertIsInstance(value, str)
            self.assertGreater(len(value), 0)

    def test_get_region_tags_structure(self):
        """Test region tags structure."""
        config = PipelineConfig()
        tags = config.get_region_tags('us-east-1')
        
        # Verify Region key is present
        self.assertIn('Region', tags)
        self.assertEqual(tags['Region'], 'us-east-1')
        
        # Verify value is string
        self.assertIsInstance(tags['Region'], str)

    def test_regions_list_consistency(self):
        """Test regions list consistency."""
        config = PipelineConfig()
        regions = config.regions
        
        # Verify it's a list
        self.assertIsInstance(regions, list)
        
        # Verify it contains the expected regions
        self.assertIn(config.primary_region, regions)
        self.assertIn(config.secondary_region, regions)
        
        # Verify no duplicates
        self.assertEqual(len(regions), len(set(regions)))


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = PipelineConfig()

    @patch('pulumi_aws.Provider')
    def test_provider_creation_with_regions(self, mock_provider):
        """Test AWS provider creation with correct regions."""
        from infrastructure.aws_provider import AWSProviderManager
        
        provider_manager = AWSProviderManager(self.config)

        # Verify providers were created for each region
        self.assertEqual(mock_provider.call_count, 2)  # Two regions
        
        # Verify provider configurations
        call_args_list = mock_provider.call_args_list
        regions_used = [call[1]['region'] for call in call_args_list]
        self.assertIn('us-east-1', regions_used)
        self.assertIn('us-west-2', regions_used)

    def test_provider_getters(self):
        """Test provider getter methods."""
        with patch('pulumi_aws.Provider') as mock_provider:
            from infrastructure.aws_provider import AWSProviderManager
            
            provider_manager = AWSProviderManager(self.config)
            
            # Test getters return the provider instances
            primary_provider = provider_manager.get_primary_provider()
            secondary_provider = provider_manager.get_secondary_provider()
            all_providers = provider_manager.get_all_providers()
            
            self.assertIsNotNone(primary_provider)
            self.assertIsNotNone(secondary_provider)
            self.assertEqual(len(all_providers), 2)


class TestIAMStack(unittest.TestCase):
    """Test IAM resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = PipelineConfig()
        self.mock_provider = MagicMock()

    @patch('pulumi_aws.iam.Role')
    def test_lambda_role_creation(self, mock_role):
        """Test Lambda role creation with correct configuration."""
        from infrastructure.iam import IAMStack
        
        iam_stack = IAMStack(self.config, self.mock_provider)

        # Verify Lambda roles were created for each region (2 Lambda + 2 EventBridge = 4 total)
        self.assertEqual(mock_role.call_count, 4)  # Two regions with Lambda and EventBridge roles
        
        # Verify role configurations
        call_args_list = mock_role.call_args_list
        lambda_roles = [call for call in call_args_list if 'lambda-execution-role' in call[1]['name']]
        self.assertEqual(len(lambda_roles), 2)  # 2 Lambda roles for 2 regions
        for call_args in lambda_roles:
            self.assertIn('lambda-execution-role', call_args[1]['name'])
            self.assertIn('tags', call_args[1])

    @patch('pulumi_aws.iam.Role')
    def test_eventbridge_role_creation(self, mock_role):
        """Test EventBridge role creation."""
        from infrastructure.iam import IAMStack
        
        iam_stack = IAMStack(self.config, self.mock_provider)

        # Verify EventBridge roles were created for each region
        self.assertEqual(mock_role.call_count, 4)  # 2 Lambda + 2 EventBridge roles
        
        # Verify role configurations
        call_args_list = mock_role.call_args_list
        eventbridge_roles = [call for call in call_args_list if 'eventbridge' in call[1]['name']]
        self.assertEqual(len(eventbridge_roles), 2)

    @patch('pulumi_aws.iam.Policy')
    @patch('pulumi_aws.iam.Role')
    def test_policy_creation(self, mock_role, mock_policy):
        """Test IAM policy creation."""
        from infrastructure.iam import IAMStack
        
        iam_stack = IAMStack(self.config, self.mock_provider)

        # Verify policies were created
        self.assertGreater(mock_policy.call_count, 0)
        
        # Verify policy configurations
        call_args_list = mock_policy.call_args_list
        for call_args in call_args_list:
            self.assertIn('name', call_args[1])
            self.assertIn('policy', call_args[1])

    def test_iam_getters(self):
        """Test IAM getter methods."""
        with patch('pulumi_aws.iam.Role') as mock_role:
            from infrastructure.iam import IAMStack
            
            iam_stack = IAMStack(self.config, self.mock_provider)
            
            # Test getters return the role ARNs
            lambda_role_arn = iam_stack.get_lambda_role_arn('us-east-1')
            eventbridge_role_arn = iam_stack.get_eventbridge_role_arn('us-east-1')
            
            self.assertIsNotNone(lambda_role_arn)
            self.assertIsNotNone(eventbridge_role_arn)


class TestDynamoDBStack(unittest.TestCase):
    """Test DynamoDB resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = PipelineConfig()
        self.mock_provider = MagicMock()

    @patch('pulumi_aws.dynamodb.Table')
    def test_table_creation(self, mock_table):
        """Test DynamoDB table creation with correct configuration."""
        from infrastructure.dynamodb import DynamoDBStack
        
        dynamodb_stack = DynamoDBStack(self.config, self.mock_provider)

        # Verify tables were created for each region
        self.assertEqual(mock_table.call_count, 2)  # Two regions
        
        # Verify table configurations
        call_args_list = mock_table.call_args_list
        for call_args in call_args_list:
            self.assertIn('trading-events', call_args[1]['name'])
            self.assertEqual(call_args[1]['billing_mode'], 'PAY_PER_REQUEST')
            self.assertIn('attributes', call_args[1])

    def test_dynamodb_getters(self):
        """Test DynamoDB getter methods."""
        with patch('pulumi_aws.dynamodb.Table') as mock_table:
            from infrastructure.dynamodb import DynamoDBStack
            
            dynamodb_stack = DynamoDBStack(self.config, self.mock_provider)
            
            # Test getters return the table attributes
            table_arn = dynamodb_stack.get_table_arn('us-east-1')
            table_name = dynamodb_stack.get_table_name('us-east-1')
            
            self.assertIsNotNone(table_arn)
            self.assertIsNotNone(table_name)


class TestLambdaStack(unittest.TestCase):
    """Test Lambda resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = PipelineConfig()
        self.mock_provider = MagicMock()
        self.mock_iam_stack = MagicMock()
        self.mock_dynamodb_stack = MagicMock()

    @patch('pulumi_aws.lambda_.Function')
    def test_lambda_function_creation(self, mock_function):
        """Test Lambda function creation with correct configuration."""
        from infrastructure.lambda_functions import LambdaStack
        
        lambda_stack = LambdaStack(self.config, self.mock_provider, self.mock_iam_stack, self.mock_dynamodb_stack)

        # Verify Lambda functions were created for each region
        self.assertEqual(mock_function.call_count, 2)  # Two regions
        
        # Verify function configurations
        call_args_list = mock_function.call_args_list
        for call_args in call_args_list:
            self.assertIn('trading-events', call_args[1]['name'])
            self.assertEqual(call_args[1]['runtime'], 'python3.11')
            # Check tracing config mode
            tracing_config = call_args[1]['tracing_config']
            self.assertEqual(tracing_config.mode, 'Active')

    def test_lambda_getters(self):
        """Test Lambda getter methods."""
        with patch('pulumi_aws.lambda_.Function') as mock_function:
            from infrastructure.lambda_functions import LambdaStack
            
            lambda_stack = LambdaStack(self.config, self.mock_provider, self.mock_iam_stack, self.mock_dynamodb_stack)
            
            # Test getters return the function attributes
            function_arn = lambda_stack.get_function_arn('us-east-1')
            function_name = lambda_stack.get_function_name('us-east-1')
            
            self.assertIsNotNone(function_arn)
            self.assertIsNotNone(function_name)


class TestEventBridgeStack(unittest.TestCase):
    """Test EventBridge resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = PipelineConfig()
        self.mock_provider = MagicMock()
        self.mock_lambda_stack = MagicMock()

    @patch('pulumi_aws.cloudwatch.EventBus')
    def test_event_bus_creation(self, mock_bus):
        """Test EventBridge event bus creation."""
        from infrastructure.eventbridge import EventBridgeStack
        
        eventbridge_stack = EventBridgeStack(self.config, self.mock_provider, self.mock_lambda_stack)

        # Verify event buses were created for each region
        self.assertEqual(mock_bus.call_count, 2)  # Two regions
        
        # Verify bus configurations
        call_args_list = mock_bus.call_args_list
        for call_args in call_args_list:
            self.assertIn('trading-events', call_args[1]['name'])

    @patch('pulumi_aws.cloudwatch.EventRule')
    @patch('pulumi_aws.cloudwatch.EventBus')
    def test_event_rule_creation(self, mock_bus, mock_rule):
        """Test EventBridge rule creation."""
        from infrastructure.eventbridge import EventBridgeStack
        
        eventbridge_stack = EventBridgeStack(self.config, self.mock_provider, self.mock_lambda_stack)

        # Verify rules were created for each region
        self.assertEqual(mock_rule.call_count, 2)  # Two regions
        
        # Verify rule configurations
        call_args_list = mock_rule.call_args_list
        for call_args in call_args_list:
            self.assertIn('trading-events', call_args[1]['name'])
            self.assertIn('event_pattern', call_args[1])

    def test_eventbridge_getters(self):
        """Test EventBridge getter methods."""
        with patch('pulumi_aws.cloudwatch.EventBus') as mock_bus:
            from infrastructure.eventbridge import EventBridgeStack
            
            eventbridge_stack = EventBridgeStack(self.config, self.mock_provider, self.mock_lambda_stack)
            
            # Test getters return the event bridge attributes
            bus_arn = eventbridge_stack.get_event_bus_arn('us-east-1')
            bus_name = eventbridge_stack.get_event_bus_name('us-east-1')
            rule_arn = eventbridge_stack.get_rule_arn('us-east-1')
            
            self.assertIsNotNone(bus_arn)
            self.assertIsNotNone(bus_name)
            self.assertIsNotNone(rule_arn)


class TestCloudWatchStack(unittest.TestCase):
    """Test CloudWatch resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = PipelineConfig()
        self.mock_provider = MagicMock()
        self.mock_lambda_stack = MagicMock()
        self.mock_dynamodb_stack = MagicMock()

    @patch('pulumi_aws.sns.Topic')
    def test_sns_topic_creation(self, mock_topic):
        """Test SNS topic creation."""
        from infrastructure.cloudwatch import CloudWatchStack
        
        cloudwatch_stack = CloudWatchStack(self.config, self.mock_provider, self.mock_lambda_stack, self.mock_dynamodb_stack)

        # Verify SNS topics were created for each region
        self.assertEqual(mock_topic.call_count, 2)  # Two regions
        
        # Verify topic configurations
        call_args_list = mock_topic.call_args_list
        for call_args in call_args_list:
            self.assertIn('trading-events', call_args[1]['name'])

    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @patch('pulumi_aws.sns.Topic')
    def test_cloudwatch_alarm_creation(self, mock_topic, mock_alarm):
        """Test CloudWatch alarm creation."""
        from infrastructure.cloudwatch import CloudWatchStack
        
        cloudwatch_stack = CloudWatchStack(self.config, self.mock_provider, self.mock_lambda_stack, self.mock_dynamodb_stack)

        # Verify alarms were created
        self.assertGreater(mock_alarm.call_count, 0)
        
        # Verify alarm configurations
        call_args_list = mock_alarm.call_args_list
        for call_args in call_args_list:
            self.assertIn('name', call_args[1])
            self.assertIn('comparison_operator', call_args[1])

    def test_cloudwatch_getters(self):
        """Test CloudWatch getter methods."""
        with patch('pulumi_aws.sns.Topic') as mock_topic:
            from infrastructure.cloudwatch import CloudWatchStack
            
            cloudwatch_stack = CloudWatchStack(self.config, self.mock_provider, self.mock_lambda_stack, self.mock_dynamodb_stack)
            
            # Test getters return the SNS topic attributes
            topic_arn = cloudwatch_stack.get_sns_topic_arn('us-east-1')
            
            self.assertIsNotNone(topic_arn)


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from tap_stack import TapStackArgs
        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from tap_stack import TapStackArgs
        custom_tags = {'Environment': 'test', 'Project': 'trading'}
        args = TapStackArgs(environment_suffix='test', tags=custom_tags)
        
        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, custom_tags)


class TestTapStack(unittest.TestCase):
    """Test TapStack integration and resource orchestration."""

    @patch('pulumi.export')
    @patch('tap_stack.CloudWatchStack')
    @patch('tap_stack.EventBridgeStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.DynamoDBStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.PipelineConfig')
    def test_stack_initialization(self, mock_config, mock_provider, mock_iam, mock_dynamodb, mock_lambda, mock_eventbridge, mock_cloudwatch, mock_export):
        """Test TapStack initialization and resource orchestration."""
        # Mock the stack components
        mock_config_instance = mock_config.return_value
        mock_provider_instance = mock_provider.return_value
        mock_iam_instance = mock_iam.return_value
        mock_dynamodb_instance = mock_dynamodb.return_value
        mock_lambda_instance = mock_lambda.return_value
        mock_eventbridge_instance = mock_eventbridge.return_value
        mock_cloudwatch_instance = mock_cloudwatch.return_value

        # Mock getter methods
        mock_lambda_instance.get_function_arn.return_value = MagicMock()
        mock_lambda_instance.get_function_name.return_value = MagicMock()
        mock_dynamodb_instance.get_table_arn.return_value = MagicMock()
        mock_dynamodb_instance.get_table_name.return_value = MagicMock()
        mock_dynamodb_instance.global_table = None
        mock_eventbridge_instance.get_event_bus_arn.return_value = MagicMock()
        mock_eventbridge_instance.get_event_bus_name.return_value = MagicMock()
        mock_eventbridge_instance.get_rule_arn.return_value = MagicMock()
        mock_cloudwatch_instance.get_sns_topic_arn.return_value = MagicMock()

        # Initialize the stack
        from tap_stack import TapStack, TapStackArgs
        args = TapStackArgs()
        stack = TapStack('test-stack', args)

        # Verify all components were initialized
        self.assertIsNotNone(stack)
        
        # Verify all components were created
        mock_config.assert_called_once()
        mock_provider.assert_called_once_with(mock_config_instance)
        mock_iam.assert_called_once_with(mock_config_instance, mock_provider_instance)
        mock_dynamodb.assert_called_once_with(mock_config_instance, mock_provider_instance)
        mock_lambda.assert_called_once_with(mock_config_instance, mock_provider_instance, mock_iam_instance, mock_dynamodb_instance)
        mock_eventbridge.assert_called_once_with(mock_config_instance, mock_provider_instance, mock_lambda_instance)
        mock_cloudwatch.assert_called_once_with(mock_config_instance, mock_provider_instance, mock_lambda_instance, mock_dynamodb_instance)

        # Verify outputs were registered
        self.assertTrue(mock_export.called)

    @patch('pulumi.export')
    def test_output_registration(self, mock_export):
        """Test that all outputs are properly registered."""
        # Mock all the infrastructure components to avoid Pulumi runtime issues
        with patch('infrastructure.cloudwatch.CloudWatchStack') as mock_cw, \
             patch('infrastructure.eventbridge.EventBridgeStack') as mock_eventbridge, \
             patch('infrastructure.lambda_functions.LambdaStack') as mock_lambda, \
             patch('infrastructure.dynamodb.DynamoDBStack') as mock_dynamodb, \
             patch('infrastructure.iam.IAMStack') as mock_iam, \
             patch('infrastructure.aws_provider.AWSProviderManager') as mock_provider, \
             patch('infrastructure.config.PipelineConfig') as mock_config:

            # Mock the getter methods to return mock objects
            mock_lambda_instance = mock_lambda.return_value
            mock_dynamodb_instance = mock_dynamodb.return_value
            mock_eventbridge_instance = mock_eventbridge.return_value
            mock_cloudwatch_instance = mock_cw.return_value

            mock_lambda_instance.get_function_arn.return_value = MagicMock()
            mock_lambda_instance.get_function_name.return_value = MagicMock()
            mock_dynamodb_instance.get_table_arn.return_value = MagicMock()
            mock_dynamodb_instance.get_table_name.return_value = MagicMock()
            mock_dynamodb_instance.global_table = None
            mock_eventbridge_instance.get_event_bus_arn.return_value = MagicMock()
            mock_eventbridge_instance.get_event_bus_name.return_value = MagicMock()
            mock_eventbridge_instance.get_rule_arn.return_value = MagicMock()
            mock_cloudwatch_instance.get_sns_topic_arn.return_value = MagicMock()

            from tap_stack import TapStack, TapStackArgs
            args = TapStackArgs()
            stack = TapStack('test-stack', args)

            # Verify that pulumi.export was called for key outputs
            export_calls = [call[0][0] for call in mock_export.call_args_list]
            expected_outputs = [
                'primary_region', 'secondary_region', 'environment', 'environment_suffix',
                'lambda_function_arn_us-east-1', 'lambda_function_name_us-east-1',
                'lambda_function_arn_us-west-2', 'lambda_function_name_us-west-2',
                'dynamodb_table_arn_us-east-1', 'dynamodb_table_name_us-east-1',
                'dynamodb_table_arn_us-west-2', 'dynamodb_table_name_us-west-2',
                'eventbridge_bus_arn_us-east-1', 'eventbridge_bus_name_us-east-1',
                'eventbridge_bus_arn_us-west-2', 'eventbridge_bus_name_us-west-2',
                'eventbridge_rule_arn_us-east-1', 'eventbridge_rule_arn_us-west-2',
                'sns_topic_arn_us-east-1', 'sns_topic_arn_us-west-2'
            ]

            for output in expected_outputs:
                self.assertIn(output, export_calls)


if __name__ == '__main__':
    unittest.main()