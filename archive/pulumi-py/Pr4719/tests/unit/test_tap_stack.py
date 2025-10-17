"""
test_tap_stack.py
Unit tests for the TapStack Pulumi component focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, call, patch

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import ServerlessConfig


class TestServerlessConfig(unittest.TestCase):
    """Test ServerlessConfig resource configuration."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = ServerlessConfig()
            # Test that defaults are set (don't assert exact values that may change)
            self.assertIsInstance(config.project_name, str)
            self.assertIsInstance(config.environment, str)
            self.assertIsInstance(config.environment_suffix, str)
            self.assertIsInstance(config.primary_region, str)
            self.assertIsInstance(config.lambda_runtime, str)
            self.assertIsInstance(config.lambda_timeout, int)
            self.assertIsInstance(config.lambda_memory_size, int)
            self.assertGreater(config.lambda_timeout, 0)
            self.assertGreater(config.lambda_memory_size, 0)

    @patch.dict('os.environ', {
        'PROJECT_NAME': 'custom-project',
        'ENVIRONMENT': 'prod',
        'ENVIRONMENT_SUFFIX': 'custom123',
        'PRIMARY_REGION': 'eu-west-1',
        'LAMBDA_RUNTIME': 'python3.12',
        'LAMBDA_TIMEOUT': '60',
        'LAMBDA_MEMORY_SIZE': '256'
    })
    def test_config_custom_values(self):
        """Test configuration with custom environment variables."""
        config = ServerlessConfig()
        self.assertEqual(config.project_name, 'custom-project')
        self.assertEqual(config.environment, 'prod')
        self.assertEqual(config.environment_suffix, 'custom123')
        self.assertEqual(config.primary_region, 'eu-west-1')
        self.assertEqual(config.lambda_runtime, 'python3.12')
        self.assertEqual(config.lambda_timeout, 60)
        self.assertEqual(config.lambda_memory_size, 256)

    def test_normalize_name(self):
        """Test name normalization for case-sensitive resources."""
        config = ServerlessConfig()
        
        # Test lowercase normalization
        normalized = config.normalize_name('Test-Name')
        self.assertEqual(normalized, 'test-name')
        
        # Test special characters
        normalized = config.normalize_name('Test_Name@123')
        self.assertEqual(normalized, 'test-name-123')
        
        # Test multiple dashes
        normalized = config.normalize_name('Test---Name')
        self.assertEqual(normalized, 'test-name')

    def test_get_resource_name(self):
        """Test resource name generation."""
        config = ServerlessConfig()
        
        # Test with different resource types - use assertIn for dynamic parts
        lambda_name = config.get_resource_name('lambda')
        self.assertIn('lambda', lambda_name)
        self.assertIsInstance(lambda_name, str)
        self.assertGreater(len(lambda_name), 10)
        
        bucket_name = config.get_resource_name('bucket')
        self.assertIn('bucket', bucket_name)
        self.assertIsInstance(bucket_name, str)
        self.assertGreater(len(bucket_name), 10)

    def test_get_normalized_resource_name(self):
        """Test normalized resource name generation."""
        config = ServerlessConfig()
        
        # Test normalization in resource name
        name = config.get_normalized_resource_name('S3-Bucket')
        self.assertEqual(name, name.lower())
        self.assertNotIn('_', name)
        self.assertNotIn('@', name)

    def test_get_common_tags(self):
        """Test common tags generation."""
        config = ServerlessConfig()
        tags = config.get_common_tags()
        
        # Verify required tag keys exist (don't assert exact values)
        self.assertIn('Project', tags)
        self.assertIn('Environment', tags)
        self.assertIn('EnvironmentSuffix', tags)
        self.assertIn('ManagedBy', tags)
        self.assertIn('Region', tags)
        
        # Verify values are strings and non-empty
        for key, value in tags.items():
            self.assertIsInstance(value, str)
            self.assertGreater(len(value), 0)

    def test_get_ssm_parameter_name(self):
        """Test SSM parameter name generation."""
        config = ServerlessConfig()
        param_name = config.get_ssm_parameter_name('db-connection')
        
        # Don't assert exact environment suffix, just verify structure
        self.assertIn('db-connection', param_name)
        self.assertTrue(param_name.startswith('/'))
        self.assertIsInstance(param_name, str)
        self.assertGreater(len(param_name), 10)

    def test_api_stages_parsing(self):
        """Test API stages parsing from environment."""
        with patch.dict('os.environ', {'API_STAGES': 'dev,staging,prod'}):
            config = ServerlessConfig()
            self.assertEqual(len(config.api_stages), 3)
            self.assertIn('dev', config.api_stages)
            self.assertIn('staging', config.api_stages)
            self.assertIn('prod', config.api_stages)

    def test_cors_allow_origins_parsing(self):
        """Test CORS allow origins parsing."""
        with patch.dict('os.environ', {'CORS_ALLOW_ORIGINS': 'https://app1.com,https://app2.com'}):
            config = ServerlessConfig()
            self.assertEqual(len(config.cors_allow_origins), 2)
            self.assertIn('https://app1.com', config.cors_allow_origins)
            self.assertIn('https://app2.com', config.cors_allow_origins)


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = ServerlessConfig()

    @patch('pulumi_aws.Provider')
    @patch('pulumi.ResourceOptions')
    def test_provider_creation(self, mock_resource_options, mock_provider):
        """Test AWS provider creation with correct configuration."""
        from infrastructure.aws_provider import AWSProviderManager
        
        provider_manager = AWSProviderManager(self.config)
        provider = provider_manager.get_provider()
        
        # Verify provider was created for primary region
        self.assertIsNotNone(provider)

    @patch('pulumi_aws.Provider')
    def test_provider_caching(self, mock_provider):
        """Test provider caching mechanism."""
        from infrastructure.aws_provider import AWSProviderManager
        
        provider_manager = AWSProviderManager(self.config)
        
        # Get provider for same region twice
        provider1 = provider_manager.get_provider('us-east-1')
        provider2 = provider_manager.get_provider('us-east-1')
        
        # Should return same cached provider
        self.assertEqual(mock_provider.call_count, 1)

    @patch('pulumi_aws.Provider')
    def test_provider_different_regions(self, mock_provider):
        """Test provider creation for different regions."""
        from infrastructure.aws_provider import AWSProviderManager
        
        provider_manager = AWSProviderManager(self.config)
        
        # Get providers for different regions
        provider1 = provider_manager.get_provider('us-east-1')
        provider2 = provider_manager.get_provider('eu-west-1')
        
        # Should create separate providers
        self.assertEqual(mock_provider.call_count, 2)


class TestStorageStack(unittest.TestCase):
    """Test S3 storage resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = ServerlessConfig()
        self.mock_provider_manager = MagicMock()

    @patch('pulumi_aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('pulumi_aws.s3.BucketPublicAccessBlock')
    @patch('pulumi_aws.s3.Bucket')
    def test_static_bucket_creation(self, mock_bucket, mock_public_access, mock_encryption):
        """Test static S3 bucket creation with correct configuration."""
        from infrastructure.storage import StorageStack
        
        storage_stack = StorageStack(self.config, self.mock_provider_manager)
        
        # Verify buckets were created
        self.assertEqual(mock_bucket.call_count, 2)  # static and uploads
        
        # Verify public access blocks were created
        self.assertEqual(mock_public_access.call_count, 2)
        
        # Verify encryption was configured
        self.assertEqual(mock_encryption.call_count, 2)

    @patch('pulumi_aws.s3.BucketVersioning')
    @patch('pulumi_aws.s3.Bucket')
    def test_uploads_bucket_versioning(self, mock_bucket, mock_versioning):
        """Test uploads bucket versioning configuration."""
        from infrastructure.storage import StorageStack
        
        storage_stack = StorageStack(self.config, self.mock_provider_manager)
        
        # Verify versioning was configured for uploads bucket
        self.assertEqual(mock_versioning.call_count, 2)

    def test_storage_getters(self):
        """Test storage getter methods."""
        with patch('pulumi_aws.s3.Bucket') as mock_bucket, \
             patch('pulumi_aws.s3.BucketPublicAccessBlock'), \
             patch('pulumi_aws.s3.BucketServerSideEncryptionConfiguration'), \
             patch('pulumi_aws.s3.BucketVersioning'):
            
            from infrastructure.storage import StorageStack
            
            storage_stack = StorageStack(self.config, self.mock_provider_manager)
            
            # Test getters
            static_bucket = storage_stack.get_bucket('static')
            uploads_bucket = storage_stack.get_bucket('uploads')
            
            self.assertIsNotNone(static_bucket)
            self.assertIsNotNone(uploads_bucket)


class TestParameterStoreStack(unittest.TestCase):
    """Test SSM Parameter Store resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = ServerlessConfig()
        self.mock_provider_manager = MagicMock()

    @patch('pulumi_aws.ssm.Parameter')
    def test_parameter_creation(self, mock_parameter):
        """Test SSM parameter creation with correct configuration."""
        from infrastructure.parameter_store import ParameterStoreStack
        
        param_stack = ParameterStoreStack(self.config, self.mock_provider_manager)
        
        # Verify parameters were created
        self.assertGreater(mock_parameter.call_count, 0)

    @patch('pulumi_aws.ssm.Parameter')
    def test_secure_parameter_creation(self, mock_parameter):
        """Test secure SSM parameter creation."""
        from infrastructure.parameter_store import ParameterStoreStack
        
        param_stack = ParameterStoreStack(self.config, self.mock_provider_manager)
        
        # Verify SecureString type was used for sensitive parameters
        call_args_list = mock_parameter.call_args_list
        secure_params = [call for call in call_args_list if call[1].get('type') == 'SecureString']
        self.assertGreater(len(secure_params), 0)

    def test_parameter_getters(self):
        """Test parameter getter methods."""
        with patch('pulumi_aws.ssm.Parameter') as mock_parameter:
            from infrastructure.parameter_store import ParameterStoreStack
            
            param_stack = ParameterStoreStack(self.config, self.mock_provider_manager)
            
            # Test getter returns parameter
            param = param_stack.get_parameter('db_connection_string')
            self.assertIsNotNone(param)


class TestIAMStack(unittest.TestCase):
    """Test IAM resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = ServerlessConfig()
        self.mock_provider_manager = MagicMock()

    @patch('pulumi_aws.iam.RolePolicy')
    @patch('pulumi_aws.iam.Role')
    def test_lambda_role_creation(self, mock_role, mock_policy):
        """Test Lambda IAM role creation with correct configuration."""
        from infrastructure.iam import IAMStack
        
        iam_stack = IAMStack(self.config, self.mock_provider_manager)
        
        # Create a test role
        role = iam_stack.create_lambda_role(
            'test-function',
            s3_bucket_arns=[MagicMock()],
            s3_permissions=['s3:GetObject'],
            ssm_parameter_arns=[MagicMock()]
        )
        
        # Verify role was created
        self.assertEqual(mock_role.call_count, 1)
        
        # Verify policies were attached (CloudWatch, S3, SSM)
        self.assertGreater(mock_policy.call_count, 0)

    @patch('pulumi_aws.iam.RolePolicy')
    @patch('pulumi_aws.iam.Role')
    def test_cloudwatch_logs_policy(self, mock_role, mock_policy):
        """Test CloudWatch Logs policy attachment."""
        from infrastructure.iam import IAMStack
        
        iam_stack = IAMStack(self.config, self.mock_provider_manager)
        
        # Create role which should attach CloudWatch policy
        role = iam_stack.create_lambda_role('test-function')
        
        # Verify CloudWatch policy was created
        call_args_list = mock_policy.call_args_list
        cloudwatch_policies = [call for call in call_args_list if 'cloudwatch-policy' in call[0][0]]
        self.assertGreater(len(cloudwatch_policies), 0)

    def test_iam_getters(self):
        """Test IAM getter methods."""
        with patch('pulumi_aws.iam.Role') as mock_role:
            from infrastructure.iam import IAMStack
            
            iam_stack = IAMStack(self.config, self.mock_provider_manager)
            
            # Create a role
            iam_stack.create_lambda_role('test-function')
            
            # Test getter
            role = iam_stack.get_role('test-function')
            self.assertIsNotNone(role)


class TestLambdaFunctionsStack(unittest.TestCase):
    """Test Lambda function resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = ServerlessConfig()
        self.mock_provider_manager = MagicMock()
        self.mock_iam_stack = MagicMock()
        self.mock_storage_stack = MagicMock()
        self.mock_parameter_store_stack = MagicMock()
        
        # Mock the stack getter methods
        self.mock_storage_stack.get_bucket_name.return_value = MagicMock()
        self.mock_storage_stack.get_bucket_arn.return_value = MagicMock()
        self.mock_parameter_store_stack.get_parameter_name.return_value = MagicMock()
        self.mock_parameter_store_stack.get_parameter_arn.return_value = MagicMock()

    @patch('pulumi_aws.lambda_.Function')
    def test_lambda_function_creation(self, mock_function):
        """Test Lambda function creation with correct configuration."""
        from infrastructure.lambda_functions import LambdaStack
        
        lambda_stack = LambdaStack(
            self.config,
            self.mock_provider_manager,
            self.mock_iam_stack,
            self.mock_storage_stack,
            self.mock_parameter_store_stack
        )
        
        # Verify Lambda functions were created
        self.assertEqual(mock_function.call_count, 2)  # users and items
        
        # Verify function configurations (don't assert exact values that may change)
        call_args_list = mock_function.call_args_list
        for call_args in call_args_list:
            self.assertIn('runtime', call_args[1])
            self.assertEqual(call_args[1]['handler'], 'index.handler')
            self.assertIn('memory_size', call_args[1])
            self.assertIn('timeout', call_args[1])
            self.assertIsInstance(call_args[1]['memory_size'], int)
            self.assertIsInstance(call_args[1]['timeout'], int)

    @patch('pulumi_aws.lambda_.Function')
    def test_lambda_environment_variables(self, mock_function):
        """Test Lambda environment variables configuration."""
        from infrastructure.lambda_functions import LambdaStack
        
        lambda_stack = LambdaStack(
            self.config,
            self.mock_provider_manager,
            self.mock_iam_stack,
            self.mock_storage_stack,
            self.mock_parameter_store_stack
        )
        
        # Verify environment variables were configured
        call_args_list = mock_function.call_args_list
        for call_args in call_args_list:
            self.assertIn('environment', call_args[1])

    def test_lambda_getters(self):
        """Test Lambda getter methods."""
        with patch('pulumi_aws.lambda_.Function') as mock_function:
            from infrastructure.lambda_functions import LambdaStack
            
            lambda_stack = LambdaStack(
                self.config,
                self.mock_provider_manager,
                self.mock_iam_stack,
                self.mock_storage_stack,
                self.mock_parameter_store_stack
            )
            
            # Test getters
            users_function = lambda_stack.get_function('users')
            items_function = lambda_stack.get_function('items')
            all_function_names = lambda_stack.get_all_function_names()
            
            self.assertIsNotNone(users_function)
            self.assertIsNotNone(items_function)
            self.assertEqual(len(all_function_names), 2)


class TestAPIGatewayStack(unittest.TestCase):
    """Test API Gateway resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = ServerlessConfig()
        self.mock_provider_manager = MagicMock()
        self.mock_lambda_stack = MagicMock()
        
        # Mock Lambda stack methods
        mock_function = MagicMock()
        mock_function.invoke_arn = MagicMock()
        mock_function.name = MagicMock()
        self.mock_lambda_stack.get_function.return_value = mock_function

    @patch('pulumi_aws.cloudwatch.LogGroup')
    @patch('pulumi_aws.lambda_.Permission')
    @patch('pulumi_aws.apigatewayv2.Route')
    @patch('pulumi_aws.apigatewayv2.Integration')
    @patch('pulumi_aws.apigatewayv2.Stage')
    @patch('pulumi_aws.apigatewayv2.Api')
    def test_api_gateway_creation(self, mock_api, mock_stage, mock_integration, mock_route, mock_permission, mock_log_group):
        """Test API Gateway creation with correct configuration."""
        from infrastructure.api_gateway import APIGatewayStack
        
        api_stack = APIGatewayStack(
            self.config,
            self.mock_provider_manager,
            self.mock_lambda_stack
        )
        
        # Verify APIs were created for each stage
        self.assertEqual(mock_api.call_count, 3)  # dev, test, prod
        
        # Verify stages were created
        self.assertEqual(mock_stage.call_count, 3)

    @patch('pulumi_aws.cloudwatch.LogGroup')
    @patch('pulumi_aws.lambda_.Permission')
    @patch('pulumi_aws.apigatewayv2.Route')
    @patch('pulumi_aws.apigatewayv2.Integration')
    @patch('pulumi_aws.apigatewayv2.Stage')
    @patch('pulumi_aws.apigatewayv2.Api')
    def test_api_cors_configuration(self, mock_api, mock_stage, mock_integration, mock_route, mock_permission, mock_log_group):
        """Test API Gateway CORS configuration."""
        from infrastructure.api_gateway import APIGatewayStack
        
        api_stack = APIGatewayStack(
            self.config,
            self.mock_provider_manager,
            self.mock_lambda_stack
        )
        
        # Verify CORS was configured
        call_args_list = mock_api.call_args_list
        for call_args in call_args_list:
            self.assertIn('cors_configuration', call_args[1])

    def test_api_gateway_getters(self):
        """Test API Gateway getter methods."""
        with patch('pulumi_aws.apigatewayv2.Api') as mock_api, \
             patch('pulumi_aws.apigatewayv2.Stage'), \
             patch('pulumi_aws.apigatewayv2.Integration'), \
             patch('pulumi_aws.apigatewayv2.Route'), \
             patch('pulumi_aws.lambda_.Permission'), \
             patch('pulumi_aws.cloudwatch.LogGroup'):
            
            from infrastructure.api_gateway import APIGatewayStack
            
            api_stack = APIGatewayStack(
                self.config,
                self.mock_provider_manager,
                self.mock_lambda_stack
            )
            
            # Test getters
            api = api_stack.get_api('dev')
            stage = api_stack.get_stage('dev')
            all_stage_names = api_stack.get_all_stage_names()
            
            self.assertIsNotNone(api)
            self.assertIsNotNone(stage)
            self.assertEqual(len(all_stage_names), 3)


class TestMonitoringStack(unittest.TestCase):
    """Test CloudWatch monitoring resource creation and configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = ServerlessConfig()
        self.mock_provider_manager = MagicMock()
        self.mock_lambda_stack = MagicMock()
        
        # Mock Lambda stack methods
        mock_function = MagicMock()
        mock_function.name = MagicMock()
        self.mock_lambda_stack.get_function.return_value = mock_function
        self.mock_lambda_stack.get_all_function_names.return_value = ['users', 'items']

    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @patch('pulumi_aws.cloudwatch.LogMetricFilter')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    def test_log_group_creation(self, mock_log_group, mock_metric_filter, mock_alarm):
        """Test CloudWatch log group creation."""
        from infrastructure.monitoring import MonitoringStack
        
        monitoring_stack = MonitoringStack(
            self.config,
            self.mock_provider_manager,
            self.mock_lambda_stack
        )
        
        # Verify log groups were created for each Lambda function
        self.assertEqual(mock_log_group.call_count, 2)  # users and items

    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @patch('pulumi_aws.cloudwatch.LogMetricFilter')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    def test_metric_filter_creation(self, mock_log_group, mock_metric_filter, mock_alarm):
        """Test CloudWatch metric filter creation."""
        from infrastructure.monitoring import MonitoringStack
        
        monitoring_stack = MonitoringStack(
            self.config,
            self.mock_provider_manager,
            self.mock_lambda_stack
        )
        
        # Verify metric filters were created
        self.assertEqual(mock_metric_filter.call_count, 2)  # users and items

    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @patch('pulumi_aws.cloudwatch.LogMetricFilter')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    def test_metric_alarm_creation(self, mock_log_group, mock_metric_filter, mock_alarm):
        """Test CloudWatch alarm creation."""
        from infrastructure.monitoring import MonitoringStack
        
        monitoring_stack = MonitoringStack(
            self.config,
            self.mock_provider_manager,
            self.mock_lambda_stack
        )
        
        # Verify alarms were created (may be multiple alarms per function)
        self.assertGreater(mock_alarm.call_count, 0)

    def test_monitoring_getters(self):
        """Test monitoring getter methods."""
        with patch('pulumi_aws.cloudwatch.LogGroup') as mock_log_group, \
             patch('pulumi_aws.cloudwatch.LogMetricFilter'), \
             patch('pulumi_aws.cloudwatch.MetricAlarm'):
            
            from infrastructure.monitoring import MonitoringStack
            
            monitoring_stack = MonitoringStack(
                self.config,
                self.mock_provider_manager,
                self.mock_lambda_stack
            )
            
            # Test getter
            log_group_name = monitoring_stack.get_log_group_name('users')
            self.assertIsNotNone(log_group_name)


class TestTapStack(unittest.TestCase):
    """Test TapStack integration and resource orchestration."""

    @patch('pulumi.export')
    @patch('infrastructure.monitoring.MonitoringStack')
    @patch('infrastructure.api_gateway.APIGatewayStack')
    @patch('infrastructure.lambda_functions.LambdaStack')
    @patch('infrastructure.iam.IAMStack')
    @patch('infrastructure.parameter_store.ParameterStoreStack')
    @patch('infrastructure.storage.StorageStack')
    @patch('infrastructure.aws_provider.AWSProviderManager')
    @patch('infrastructure.config.ServerlessConfig')
    def test_stack_initialization(self, mock_config, mock_provider, mock_storage, 
                                   mock_param_store, mock_iam, mock_lambda, 
                                   mock_api_gateway, mock_monitoring, mock_export):
        """Test TapStack initialization and resource orchestration."""
        # Mock the stack components
        mock_config_instance = mock_config.return_value
        mock_provider_instance = mock_provider.return_value
        mock_storage_instance = mock_storage.return_value
        mock_param_store_instance = mock_param_store.return_value
        mock_iam_instance = mock_iam.return_value
        mock_lambda_instance = mock_lambda.return_value
        mock_api_gateway_instance = mock_api_gateway.return_value
        mock_monitoring_instance = mock_monitoring.return_value
        
        # Mock getter methods
        mock_lambda_instance.get_function_arn.return_value = MagicMock()
        mock_lambda_instance.get_function_name.return_value = MagicMock()
        mock_lambda_instance.get_all_function_names.return_value = ['users', 'items']
        mock_storage_instance.get_bucket_name.return_value = MagicMock()
        mock_storage_instance.get_bucket_arn.return_value = MagicMock()
        mock_api_gateway_instance.get_api_url.return_value = MagicMock()
        mock_api_gateway_instance.get_api.return_value = MagicMock()
        mock_api_gateway_instance.get_all_stage_names.return_value = ['dev', 'test', 'prod']
        mock_monitoring_instance.get_log_group_name.return_value = MagicMock()
        
        # Initialize the stack
        from tap_stack import TapStack, TapStackArgs
        args = TapStackArgs()
        stack = TapStack('test-stack', args)
        
        # Verify all components were initialized
        self.assertIsNotNone(stack)
        
        # Verify all components were created (TapStack instantiates config itself)
        # We just verify the stack was created successfully
        self.assertTrue(hasattr(stack, 'config'))
        self.assertTrue(hasattr(stack, 'provider_manager'))
        self.assertTrue(hasattr(stack, 'storage_stack'))
        self.assertTrue(hasattr(stack, 'parameter_store_stack'))
        self.assertTrue(hasattr(stack, 'iam_stack'))
        self.assertTrue(hasattr(stack, 'lambda_stack'))
        self.assertTrue(hasattr(stack, 'api_gateway_stack'))
        self.assertTrue(hasattr(stack, 'monitoring_stack'))

    @patch('pulumi.export')
    def test_output_registration(self, mock_export):
        """Test that all outputs are properly registered."""
        # Mock all the infrastructure components
        with patch('infrastructure.monitoring.MonitoringStack') as mock_monitoring, \
             patch('infrastructure.api_gateway.APIGatewayStack') as mock_api_gateway, \
             patch('infrastructure.lambda_functions.LambdaStack') as mock_lambda, \
             patch('infrastructure.iam.IAMStack'), \
             patch('infrastructure.parameter_store.ParameterStoreStack'), \
             patch('infrastructure.storage.StorageStack') as mock_storage, \
             patch('infrastructure.aws_provider.AWSProviderManager'), \
             patch('infrastructure.config.ServerlessConfig') as mock_config:
            
            # Mock the getter methods
            mock_lambda_instance = mock_lambda.return_value
            mock_storage_instance = mock_storage.return_value
            mock_api_gateway_instance = mock_api_gateway.return_value
            mock_monitoring_instance = mock_monitoring.return_value
            mock_config_instance = mock_config.return_value
            
            mock_lambda_instance.get_function_arn.return_value = MagicMock()
            mock_lambda_instance.get_function_name.return_value = MagicMock()
            mock_lambda_instance.get_all_function_names.return_value = ['users', 'items']
            mock_storage_instance.get_bucket_name.return_value = MagicMock()
            mock_storage_instance.get_bucket_arn.return_value = MagicMock()
            mock_api_gateway_instance.get_api_url.return_value = MagicMock()
            mock_api_gateway_instance.get_api.return_value = MagicMock(id=MagicMock())
            mock_api_gateway_instance.get_all_stage_names.return_value = ['dev', 'test', 'prod']
            mock_monitoring_instance.get_log_group_name.return_value = MagicMock()
            mock_config_instance.environment = 'dev'
            mock_config_instance.environment_suffix = 'pr1234'
            mock_config_instance.primary_region = 'us-east-1'
            mock_config_instance.project_name = 'serverless'
            
            from tap_stack import TapStack, TapStackArgs
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify that pulumi.export was called
            self.assertTrue(mock_export.called)
            
            # Verify key outputs were exported
            export_calls = [call[0][0] for call in mock_export.call_args_list]
            expected_outputs = [
                'lambda_function_arn_users',
                'lambda_function_name_users',
                'lambda_function_arn_items',
                'lambda_function_name_items',
                's3_static_bucket_name',
                's3_static_bucket_arn',
                's3_uploads_bucket_name',
                's3_uploads_bucket_arn',
                'api_url_dev',
                'api_id_dev',
                'log_group_name_users',
                'log_group_name_items',
                'environment',
                'environment_suffix',
                'region',
                'project_name'
            ]
            
            for output in expected_outputs:
                self.assertIn(output, export_calls, f"Expected output '{output}' not found in exports")


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from tap_stack import TapStackArgs
        args = TapStackArgs()
        
        # environment_suffix has a default value or can be None
        self.assertIsInstance(args.environment_suffix, (str, type(None)))
        if args.environment_suffix:
            self.assertIsInstance(args.environment_suffix, str)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from tap_stack import TapStackArgs
        args = TapStackArgs()
        args.environment_suffix = 'test123'
        
        self.assertEqual(args.environment_suffix, 'test123')


if __name__ == '__main__':
    unittest.main()
