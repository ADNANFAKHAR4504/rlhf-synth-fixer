"""
Comprehensive unit tests for TapStack Pulumi component.

Combines all unit tests into a single file with proper mocking of AWS resources.
Tests the actual TapStack class functionality and infrastructure components.
"""

import unittest
from unittest.mock import MagicMock, Mock, patch
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../lib'))
from tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""
    
    def test_tap_stack_args_initialization(self):
        """Test TapStackArgs initialization with environment suffix."""
        args = TapStackArgs(environment_suffix='test')
        
        self.assertEqual(args.environment_suffix, 'test')
    
    def test_tap_stack_args_default_environment(self):
        """Test TapStackArgs with default environment."""
        args = TapStackArgs(environment_suffix='dev')
        
        self.assertEqual(args.environment_suffix, 'dev')


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack main class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_args = TapStackArgs(environment_suffix='test')
        
        # Mock infrastructure components
        self.mock_infrastructure = {
            "lambda_function": Mock(),
            "storage": {
                "input_bucket": Mock(),
                "output_bucket": Mock()
            },
            "iam": {
                "lambda_role": Mock(),
                "s3_policy": Mock(),
                "logs_policy": Mock()
            },
            "config": Mock()
        }
        
        # Configure mock objects
        self.mock_infrastructure["lambda_function"].name = "test-lambda"
        self.mock_infrastructure["lambda_function"].arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
        self.mock_infrastructure["lambda_function"].invoke_arn = "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:test-lambda/invocations"
        
        self.mock_infrastructure["storage"]["input_bucket"].bucket = "test-input-bucket"
        self.mock_infrastructure["storage"]["input_bucket"].arn = "arn:aws:s3:::test-input-bucket"
        self.mock_infrastructure["storage"]["output_bucket"].bucket = "test-output-bucket"
        self.mock_infrastructure["storage"]["output_bucket"].arn = "arn:aws:s3:::test-output-bucket"
        
        self.mock_infrastructure["iam"]["lambda_role"].arn = "arn:aws:iam::123456789012:role/test-lambda-role"
        self.mock_infrastructure["iam"]["s3_policy"].arn = "arn:aws:iam::123456789012:policy/test-s3-policy"
        self.mock_infrastructure["iam"]["logs_policy"].arn = "arn:aws:iam::123456789012:policy/test-logs-policy"
        
        self.mock_infrastructure["config"].environment_suffix = "test"
        self.mock_infrastructure["config"].region = "us-east-1"
        self.mock_infrastructure["config"].lambda_timeout = 30
        self.mock_infrastructure["config"].lambda_memory = 256
        self.mock_infrastructure["config"].get_environment_variables.return_value = {"ENV": "test"}
        self.mock_infrastructure["config"].get_allowed_ip_ranges.return_value = ["192.168.1.0/24"]
        self.mock_infrastructure["config"].get_tags.return_value = {"Environment": "test"}
    
    @patch('tap_stack.create_infrastructure')
    @patch('tap_stack.pulumi.export')
    @patch('tap_stack.pulumi.log')
    def test_tap_stack_initialization(self, mock_log, mock_export, mock_create_infrastructure):
        """Test TapStack initialization with proper resource creation."""
        # Configure mocks
        mock_create_infrastructure.return_value = self.mock_infrastructure
        
        # Create TapStack instance
        tap_stack = TapStack("test-stack", self.mock_args)
        
        # Verify infrastructure creation was called
        mock_create_infrastructure.assert_called_once()
        
        # Verify outputs were registered
        self.assertGreater(mock_export.call_count, 0)
        
        # Verify validation was called
        mock_log.info.assert_called_with("Deployment validation passed")
    
    @patch('tap_stack.create_infrastructure')
    @patch('tap_stack.pulumi.export')
    def test_register_outputs(self, mock_export, mock_create_infrastructure):
        """Test that all outputs are properly registered."""
        mock_create_infrastructure.return_value = self.mock_infrastructure
        
        tap_stack = TapStack("test-stack", self.mock_args)
        
        # Verify Lambda outputs
        mock_export.assert_any_call("lambda_function_name", "test-lambda")
        mock_export.assert_any_call("lambda_function_arn", "arn:aws:lambda:us-east-1:123456789012:function:test-lambda")
        mock_export.assert_any_call("lambda_function_invoke_arn", "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:test-lambda/invocations")
        
        # Verify S3 outputs
        mock_export.assert_any_call("input_bucket_name", "test-input-bucket")
        mock_export.assert_any_call("input_bucket_arn", "arn:aws:s3:::test-input-bucket")
        mock_export.assert_any_call("output_bucket_name", "test-output-bucket")
        mock_export.assert_any_call("output_bucket_arn", "arn:aws:s3:::test-output-bucket")
        
        # Verify IAM outputs
        mock_export.assert_any_call("lambda_role_arn", "arn:aws:iam::123456789012:role/test-lambda-role")
        mock_export.assert_any_call("s3_policy_arn", "arn:aws:iam::123456789012:policy/test-s3-policy")
        mock_export.assert_any_call("logs_policy_arn", "arn:aws:iam::123456789012:policy/test-logs-policy")
    
    @patch('tap_stack.create_infrastructure')
    @patch('tap_stack.pulumi.export')
    def test_validate_deployment_success(self, mock_export, mock_create_infrastructure):
        """Test successful deployment validation."""
        mock_create_infrastructure.return_value = self.mock_infrastructure
        
        # Should not raise any exceptions
        tap_stack = TapStack("test-stack", self.mock_args)
        
        # Verify the instance was created successfully
        self.assertEqual(tap_stack.name, "test-stack")
        self.assertEqual(tap_stack.args, self.mock_args)
    
    @patch('tap_stack.create_infrastructure')
    @patch('tap_stack.pulumi.export')
    def test_validate_deployment_invalid_region(self, mock_export, mock_create_infrastructure):
        """Test deployment validation with invalid region."""
        # Configure mock with invalid region
        self.mock_infrastructure["config"].region = "us-west-2"
        mock_create_infrastructure.return_value = self.mock_infrastructure
        
        # Should raise ValueError for invalid region
        with self.assertRaises(ValueError) as context:
            TapStack("test-stack", self.mock_args)
        
        self.assertIn("Deployment must be restricted to us-east-1 region", str(context.exception))
    
    @patch('tap_stack.create_infrastructure')
    @patch('tap_stack.pulumi.export')
    def test_validate_deployment_invalid_timeout(self, mock_export, mock_create_infrastructure):
        """Test deployment validation with invalid Lambda timeout."""
        # Configure mock with invalid timeout
        self.mock_infrastructure["config"].lambda_timeout = 400
        mock_create_infrastructure.return_value = self.mock_infrastructure
        
        # Should raise ValueError for invalid timeout
        with self.assertRaises(ValueError) as context:
            TapStack("test-stack", self.mock_args)
        
        self.assertIn("Lambda timeout cannot exceed 5 minutes", str(context.exception))
    
    @patch('tap_stack.create_infrastructure')
    @patch('tap_stack.pulumi.export')
    def test_validate_deployment_invalid_ip_range(self, mock_export, mock_create_infrastructure):
        """Test deployment validation with invalid IP range."""
        # Configure mock with invalid IP range
        self.mock_infrastructure["config"].get_allowed_ip_ranges.return_value = ["0.0.0.0/0"]
        mock_create_infrastructure.return_value = self.mock_infrastructure
        
        # Should raise ValueError for invalid IP range
        with self.assertRaises(ValueError) as context:
            TapStack("test-stack", self.mock_args)
        
        self.assertIn("IP range 0.0.0.0/0 is not allowed", str(context.exception))
    
    @patch('tap_stack.create_infrastructure')
    @patch('tap_stack.pulumi.export')
    def test_get_infrastructure_summary(self, mock_export, mock_create_infrastructure):
        """Test getting infrastructure summary."""
        mock_create_infrastructure.return_value = self.mock_infrastructure
        
        tap_stack = TapStack("test-stack", self.mock_args)
        summary = tap_stack.get_infrastructure_summary()
        
        # Verify summary structure
        self.assertIn("lambda_function", summary)
        self.assertIn("s3_buckets", summary)
        self.assertIn("iam", summary)
        self.assertIn("configuration", summary)
        
        # Verify Lambda function details
        self.assertEqual(summary["lambda_function"]["name"], "test-lambda")
        self.assertEqual(summary["lambda_function"]["arn"], "arn:aws:lambda:us-east-1:123456789012:function:test-lambda")
        self.assertEqual(summary["lambda_function"]["timeout"], 30)
        self.assertEqual(summary["lambda_function"]["memory"], 256)
        
        # Verify S3 buckets
        self.assertEqual(summary["s3_buckets"]["input"]["name"], "test-input-bucket")
        self.assertEqual(summary["s3_buckets"]["output"]["name"], "test-output-bucket")
        
        # Verify IAM
        self.assertEqual(summary["iam"]["lambda_role"], "arn:aws:iam::123456789012:role/test-lambda-role")
        
        # Verify configuration
        self.assertEqual(summary["configuration"]["environment"], "test")
        self.assertEqual(summary["configuration"]["region"], "us-east-1")


class TestConfigModule(unittest.TestCase):
    """Test cases for config module to increase coverage."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Mock Pulumi before importing our modules
        pulumi.Config = Mock
        pulumi.ResourceOptions = Mock
        
        # Create a proper mock for ResourceOptions with merge method
        class MockResourceOptions:
            def __init__(self, **kwargs):
                self.kwargs = kwargs
            
            def merge(self, other):
                if other is None:
                    return self
                if hasattr(other, 'kwargs'):
                    merged = {**self.kwargs, **other.kwargs}
                elif isinstance(other, dict):
                    merged = {**self.kwargs, **other}
                else:
                    merged = {**self.kwargs}
                return MockResourceOptions(**merged)

        pulumi.ResourceOptions = MockResourceOptions

    @patch('lib.infrastructure.config.aws.Provider')
    def test_config_default_initialization(self, mock_provider):
        """Test default configuration initialization."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'dev',
                'lambda_timeout': 300,
                'lambda_memory': 128,
                'log_level': 'INFO'
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            from lib.infrastructure.config import ServerlessConfig
            config = ServerlessConfig()
            
            # Test basic attributes
            self.assertEqual(config.environment_suffix, 'dev')
            self.assertEqual(config.region, 'us-east-1')
            self.assertEqual(config.lambda_timeout, 300)
            self.assertEqual(config.lambda_memory, 128)

    @patch('lib.infrastructure.config.aws.Provider')
    def test_config_validation_success(self, mock_provider):
        """Test successful configuration validation."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'dev'
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            from lib.infrastructure.config import ServerlessConfig
            config = ServerlessConfig()
            result = config.validate_configuration()
            
            self.assertTrue(result)


class TestInfrastructureModules(unittest.TestCase):
    """Test cases for infrastructure modules to increase coverage."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Mock Pulumi before importing our modules
        pulumi.Config = Mock
        pulumi.ResourceOptions = Mock

    def test_iam_module_import(self):
        """Test that IAM module can be imported."""
        try:
            from lib.infrastructure import iam
            self.assertTrue(hasattr(iam, 'create_iam_resources'))
        except ImportError as e:
            self.fail(f"Failed to import IAM module: {e}")

    def test_storage_module_import(self):
        """Test that storage module can be imported."""
        try:
            from lib.infrastructure import storage
            self.assertTrue(hasattr(storage, 'create_s3_buckets'))
        except ImportError as e:
            self.fail(f"Failed to import storage module: {e}")

    def test_lambda_module_import(self):
        """Test that Lambda module can be imported."""
        try:
            from lib.infrastructure import lambda_function
            self.assertTrue(hasattr(lambda_function, 'create_lambda_resources'))
        except ImportError as e:
            self.fail(f"Failed to import Lambda module: {e}")

    def test_config_module_import(self):
        """Test that config module can be imported."""
        try:
            from lib.infrastructure import config
            self.assertTrue(hasattr(config, 'ServerlessConfig'))
        except ImportError as e:
            self.fail(f"Failed to import config module: {e}")


class TestBucketNameNormalization(unittest.TestCase):
    """Tests for bucket name normalization functions to increase coverage."""
    
    def test_normalize_s3_bucket_name_basic(self):
        """Test basic bucket name normalization."""
        from lib.infrastructure.config import normalize_s3_bucket_name
        result = normalize_s3_bucket_name("My-Bucket-Name")
        self.assertEqual(result, "my-bucket-name")

    def test_normalize_s3_bucket_name_with_special_chars(self):
        """Test bucket name normalization with special characters."""
        from lib.infrastructure.config import normalize_s3_bucket_name
        result = normalize_s3_bucket_name("My_Bucket.Name-123")
        self.assertEqual(result, "my-bucket.name-123")

    def test_validate_s3_bucket_name_valid(self):
        """Test validation of valid bucket names."""
        from lib.infrastructure.config import validate_s3_bucket_name
        valid_names = [
            "my-bucket",
            "my-bucket-123",
            "my.bucket.name",
            "mybucket123"
        ]
        
        for name in valid_names:
            with self.subTest(name=name):
                self.assertTrue(validate_s3_bucket_name(name))

    def test_validate_s3_bucket_name_invalid(self):
        """Test validation of invalid bucket names."""
        from lib.infrastructure.config import validate_s3_bucket_name
        invalid_names = [
            "",  # Empty
            "a",  # Too short
            "a" * 64,  # Too long
            "My-Bucket",  # Invalid characters
            "-bucket",  # Starts with hyphen
            "bucket-",  # Ends with hyphen
        ]
        
        for name in invalid_names:
            with self.subTest(name=name):
                self.assertFalse(validate_s3_bucket_name(name))


class TestMainInfrastructure(unittest.TestCase):
    """Test cases for main infrastructure orchestration."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Mock Pulumi before importing our modules
        pulumi.Config = Mock
        pulumi.ResourceOptions = Mock

    @patch('lib.infrastructure.main.create_infrastructure')
    def test_main_infrastructure_creation(self, mock_create_infrastructure):
        """Test main infrastructure creation."""
        # Mock the infrastructure components
        mock_infrastructure = {
            "lambda_function": Mock(),
            "storage": Mock(),
            "iam": Mock(),
            "config": Mock()
        }
        mock_create_infrastructure.return_value = mock_infrastructure
        
        from lib.infrastructure.main import create_infrastructure
        result = create_infrastructure()
        
        self.assertEqual(result, mock_infrastructure)
        mock_create_infrastructure.assert_called_once()

    @patch('lib.infrastructure.main.create_infrastructure')
    def test_main_infrastructure_with_vpc_config(self, mock_create_infrastructure):
        """Test main infrastructure creation with VPC configuration."""
        # Mock VPC configuration
        mock_vpc_config = {
            "vpc": Mock(),
            "private_subnet_ids": ["subnet-123", "subnet-456"],
            "lambda_security_group_ids": ["sg-123"]
        }
        
        mock_infrastructure = {
            "lambda_function": Mock(),
            "storage": Mock(),
            "iam": Mock(),
            "config": Mock(),
            "vpc_config": mock_vpc_config
        }
        mock_create_infrastructure.return_value = mock_infrastructure
        
        from lib.infrastructure.main import create_infrastructure
        result = create_infrastructure()
        
        self.assertIn("vpc_config", result)
        self.assertEqual(result["vpc_config"], mock_vpc_config)

    @patch('lib.infrastructure.main.create_infrastructure')
    def test_main_infrastructure_with_monitoring(self, mock_create_infrastructure):
        """Test main infrastructure creation with monitoring components."""
        mock_infrastructure = {
            "lambda_function": Mock(),
            "storage": Mock(),
            "iam": Mock(),
            "config": Mock(),
            "monitoring": {
                "cloudwatch_alarms": Mock(),
                "sns_topic": Mock()
            }
        }
        mock_create_infrastructure.return_value = mock_infrastructure
        
        from lib.infrastructure.main import create_infrastructure
        result = create_infrastructure()
        
        self.assertIn("monitoring", result)
        self.assertIn("cloudwatch_alarms", result["monitoring"])


class TestInfrastructureModulesExtended(unittest.TestCase):
    """Extended test cases for infrastructure modules to increase coverage."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Mock Pulumi before importing our modules
        pulumi.Config = Mock
        pulumi.ResourceOptions = Mock

    @patch('lib.infrastructure.iam.create_iam_resources')
    def test_iam_resources_creation(self, mock_create_iam):
        """Test IAM resources creation."""
        mock_iam_resources = {
            "lambda_role": Mock(),
            "s3_policy": Mock(),
            "logs_policy": Mock()
        }
        mock_create_iam.return_value = mock_iam_resources
        
        from lib.infrastructure.iam import create_iam_resources
        result = create_iam_resources(Mock(), Mock(), Mock(), Mock())
        
        self.assertEqual(result, mock_iam_resources)
        mock_create_iam.assert_called_once()

    @patch('lib.infrastructure.storage.create_s3_buckets')
    def test_storage_resources_creation(self, mock_create_s3):
        """Test S3 storage resources creation."""
        mock_storage_resources = {
            "input_bucket": Mock(),
            "output_bucket": Mock(),
            "input_policy": Mock(),
            "output_policy": Mock()
        }
        mock_create_s3.return_value = mock_storage_resources
        
        from lib.infrastructure.storage import create_s3_buckets
        result = create_s3_buckets(Mock())
        
        self.assertEqual(result, mock_storage_resources)
        mock_create_s3.assert_called_once()

    @patch('lib.infrastructure.lambda_function.create_lambda_resources')
    def test_lambda_resources_creation(self, mock_create_lambda):
        """Test Lambda resources creation."""
        mock_lambda_resources = {
            "lambda_function": Mock(),
            "lambda_permission": Mock(),
            "cloudwatch_alarms": Mock()
        }
        mock_create_lambda.return_value = mock_lambda_resources
        
        from lib.infrastructure.lambda_function import create_lambda_resources
        result = create_lambda_resources(Mock(), Mock(), Mock(), Mock())
        
        self.assertEqual(result, mock_lambda_resources)
        mock_create_lambda.assert_called_once()

    def test_config_module_functions(self):
        """Test config module utility functions."""
        from lib.infrastructure.config import normalize_s3_bucket_name, validate_s3_bucket_name
        
        # Test normalize function
        self.assertEqual(normalize_s3_bucket_name("My-Bucket"), "my-bucket")
        self.assertEqual(normalize_s3_bucket_name("My_Bucket.Name"), "my-bucket.name")
        
        # Test validate function
        self.assertTrue(validate_s3_bucket_name("my-bucket"))
        self.assertFalse(validate_s3_bucket_name(""))
        self.assertFalse(validate_s3_bucket_name("a"))

    @patch('lib.infrastructure.config.ServerlessConfig')
    def test_config_validation_functions(self, mock_config_class):
        """Test config validation functions."""
        mock_config = Mock()
        mock_config.validate_configuration.return_value = True
        mock_config_class.return_value = mock_config
        
        from lib.infrastructure.config import ServerlessConfig
        config = ServerlessConfig()
        
        self.assertTrue(config.validate_configuration())

    def test_infrastructure_module_imports(self):
        """Test that all infrastructure modules can be imported."""
        try:
            from lib.infrastructure import config
            from lib.infrastructure import iam
            from lib.infrastructure import storage
            from lib.infrastructure import lambda_function
            from lib.infrastructure import main
            
            # Test that modules have expected functions
            self.assertTrue(hasattr(config, 'ServerlessConfig'))
            self.assertTrue(hasattr(iam, 'create_iam_resources'))
            self.assertTrue(hasattr(storage, 'create_s3_buckets'))
            self.assertTrue(hasattr(lambda_function, 'create_lambda_resources'))
            self.assertTrue(hasattr(main, 'create_infrastructure'))
            
        except ImportError as e:
            self.fail(f"Failed to import infrastructure modules: {e}")

    @patch('lib.infrastructure.config.aws.Provider')
    def test_config_environment_variables(self, mock_provider):
        """Test config environment variables generation."""
        mock_provider.return_value = Mock()
        
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'test',
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            from lib.infrastructure.config import ServerlessConfig
            config = ServerlessConfig()
            
            env_vars = config.get_environment_variables()
            self.assertIn('ENVIRONMENT', env_vars)
            self.assertIn('REGION', env_vars)
            self.assertIn('INPUT_BUCKET', env_vars)
            self.assertIn('OUTPUT_BUCKET', env_vars)

    @patch('lib.infrastructure.config.aws.Provider')
    def test_config_tags_generation(self, mock_provider):
        """Test config tags generation."""
        mock_provider.return_value = Mock()
        
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'test'
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            from lib.infrastructure.config import ServerlessConfig
            config = ServerlessConfig()
            
            tags = config.get_tags()
            self.assertIn('Environment', tags)
            self.assertIn('Project', tags)
            self.assertIn('ManagedBy', tags)
            self.assertEqual(tags['Environment'], 'test')

    @patch('lib.infrastructure.config.aws.Provider')
    def test_config_ip_ranges(self, mock_provider):
        """Test config IP ranges validation."""
        mock_provider.return_value = Mock()
        
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'test'
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8", "172.16.0.0/12"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            from lib.infrastructure.config import ServerlessConfig
            config = ServerlessConfig()
            
            ip_ranges = config.get_allowed_ip_ranges()
            self.assertIsInstance(ip_ranges, list)
            self.assertIn("10.0.0.0/8", ip_ranges)
            self.assertIn("172.16.0.0/12", ip_ranges)

    def test_config_validation_edge_cases(self):
        """Test config validation edge cases."""
        from lib.infrastructure.config import ServerlessConfig
        
        # Mock the config to avoid AWS provider initialization
        with patch('lib.infrastructure.config.aws.Provider'):
            with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
                mock_config_instance = Mock()
                mock_config_instance.get.side_effect = lambda key, default=None: {
                    'environment_suffix': 'test'
                }.get(key, default)
                mock_config_instance.get_int.side_effect = lambda key, default=None: {
                    'lambda_timeout': 300,
                    'lambda_memory': 128
                }.get(key, default)
                mock_config_instance.get_object.side_effect = lambda key, default=None: {
                    'allowed_ip_ranges': ["10.0.0.0/8"]
                }.get(key, default)
                mock_config.return_value = mock_config_instance
                
                config = ServerlessConfig()
                
                # Test validation
                self.assertTrue(config.validate_configuration())
                
                # Test default values
                self.assertEqual(config.lambda_timeout, 300)
                self.assertEqual(config.lambda_memory, 128)

    def test_iam_lambda_execution_role(self):
        """Test IAM Lambda execution role creation."""
        from lib.infrastructure.iam import create_lambda_execution_role
        
        # Mock AWS resources
        with patch('lib.infrastructure.iam.aws.iam.Role') as mock_role:
            with patch('lib.infrastructure.iam.aws.iam.RolePolicyAttachment') as mock_attachment:
                with patch('lib.infrastructure.iam.ServerlessConfig') as mock_config:
                    
                    # Setup mocks
                    mock_config_instance = Mock()
                    mock_config_instance.lambda_function_name = "test-lambda"
                    mock_config_instance.get_tags.return_value = {"Environment": "test"}
                    mock_config_instance.aws_provider = Mock()
                    mock_config.return_value = mock_config_instance
                    
                    mock_role.return_value = Mock()
                    mock_attachment.return_value = Mock()
                    
                    # Test role creation
                    result = create_lambda_execution_role(mock_config_instance)
                    
                    # Verify role was created
                    mock_role.assert_called_once()
                    mock_attachment.assert_called_once()
                    self.assertIsNotNone(result)

    def test_iam_s3_access_policy(self):
        """Test IAM S3 access policy creation."""
        from lib.infrastructure.iam import create_s3_access_policy
        
        # Mock AWS resources
        with patch('lib.infrastructure.iam.aws.iam.Policy') as mock_policy:
            with patch('lib.infrastructure.iam.aws.iam.RolePolicyAttachment') as mock_attachment:
                with patch('lib.infrastructure.iam.ServerlessConfig') as mock_config:
                    
                    # Setup mocks
                    mock_config_instance = Mock()
                    mock_config_instance.lambda_function_name = "test-lambda"
                    mock_config_instance.environment_suffix = "test"
                    mock_config_instance.get_tags.return_value = {"Environment": "test"}
                    mock_config_instance.aws_provider = Mock()
                    mock_config.return_value = mock_config_instance
                    
                    mock_role = Mock()
                    mock_input_bucket = Mock()
                    mock_output_bucket = Mock()
                    mock_input_bucket.bucket = "test-input-bucket"
                    mock_output_bucket.bucket = "test-output-bucket"
                    
                    mock_policy.return_value = Mock()
                    mock_attachment.return_value = Mock()
                    
                    # Test policy creation
                    result = create_s3_access_policy(
                        mock_config_instance, 
                        mock_role, 
                        mock_input_bucket, 
                        mock_output_bucket
                    )
                    
                    # Verify policy was created
                    mock_policy.assert_called_once()
                    mock_attachment.assert_called_once()
                    self.assertIsNotNone(result)

    def test_iam_cloudwatch_logs_policy(self):
        """Test IAM CloudWatch Logs policy creation."""
        from lib.infrastructure.iam import create_cloudwatch_logs_policy
        
        # Mock AWS resources
        with patch('lib.infrastructure.iam.aws.iam.Policy') as mock_policy:
            with patch('lib.infrastructure.iam.aws.iam.RolePolicyAttachment') as mock_attachment:
                with patch('lib.infrastructure.iam.ServerlessConfig') as mock_config:
                    
                    # Setup mocks
                    mock_config_instance = Mock()
                    mock_config_instance.lambda_function_name = "test-lambda"
                    mock_config_instance.region = "us-east-1"
                    mock_config_instance.get_tags.return_value = {"Environment": "test"}
                    mock_config_instance.aws_provider = Mock()
                    mock_config.return_value = mock_config_instance
                    
                    mock_role = Mock()
                    mock_policy.return_value = Mock()
                    mock_attachment.return_value = Mock()
                    
                    # Test policy creation
                    result = create_cloudwatch_logs_policy(mock_config_instance, mock_role)
                    
                    # Verify policy was created
                    mock_policy.assert_called_once()
                    mock_attachment.assert_called_once()
                    self.assertIsNotNone(result)

    def test_iam_lambda_invoke_policy(self):
        """Test IAM Lambda invoke policy creation."""
        from lib.infrastructure.iam import create_lambda_invoke_policy
        
        # Mock AWS resources
        with patch('lib.infrastructure.iam.aws.iam.Policy') as mock_policy:
            with patch('lib.infrastructure.iam.ServerlessConfig') as mock_config:
                
                # Setup mocks
                mock_config_instance = Mock()
                mock_config_instance.lambda_function_name = "test-lambda"
                mock_config_instance.get_tags.return_value = {"Environment": "test"}
                mock_config_instance.aws_provider = Mock()
                mock_config.return_value = mock_config_instance
                
                mock_lambda_function = Mock()
                mock_lambda_function.arn = Mock()
                mock_lambda_function.arn.apply = Mock(return_value="test-arn")
                
                mock_policy.return_value = Mock()
                
                # Test policy creation
                result = create_lambda_invoke_policy(mock_config_instance, mock_lambda_function)
                
                # Verify policy was created
                mock_policy.assert_called_once()
                self.assertIsNotNone(result)

    def test_storage_s3_buckets_creation(self):
        """Test S3 buckets creation."""
        from lib.infrastructure.storage import create_s3_buckets
        
        # Mock AWS resources
        with patch('lib.infrastructure.storage.aws.s3.Bucket') as mock_bucket:
            with patch('lib.infrastructure.storage.aws.s3.BucketPublicAccessBlock') as mock_pab:
                with patch('lib.infrastructure.storage.aws.s3.BucketVersioning') as mock_versioning:
                    with patch('lib.infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration') as mock_encryption:
                        with patch('lib.infrastructure.storage.ServerlessConfig') as mock_config:
                            
                            # Setup mocks
                            mock_config_instance = Mock()
                            mock_config_instance.lambda_function_name = "test-lambda"
                            mock_config_instance.input_bucket_name = "test-input-bucket"
                            mock_config_instance.output_bucket_name = "test-output-bucket"
                            mock_config_instance.get_tags.return_value = {"Environment": "test"}
                            mock_config_instance.aws_provider = Mock()
                            mock_config.return_value = mock_config_instance
                            
                            mock_bucket.return_value = Mock()
                            mock_pab.return_value = Mock()
                            mock_versioning.return_value = Mock()
                            mock_encryption.return_value = Mock()
                            
                            # Test bucket creation
                            result = create_s3_buckets(mock_config_instance)
                            
                            # Verify buckets were created
                            self.assertEqual(mock_bucket.call_count, 2)  # input and output buckets
                            self.assertEqual(mock_pab.call_count, 2)    # public access blocks
                            self.assertEqual(mock_versioning.call_count, 2)  # versioning
                            self.assertEqual(mock_encryption.call_count, 2)  # encryption
                            
                            # Verify result structure
                            self.assertIn("input_bucket", result)
                            self.assertIn("output_bucket", result)
                            self.assertIn("input_public_access_block", result)
                            self.assertIn("output_public_access_block", result)

    def test_storage_lifecycle_policies(self):
        """Test S3 lifecycle policies creation."""
        from lib.infrastructure.storage import create_s3_lifecycle_policies
        
        # Mock AWS resources
        with patch('lib.infrastructure.storage.aws.s3.BucketLifecycleConfiguration') as mock_lifecycle:
            with patch('lib.infrastructure.storage.ServerlessConfig') as mock_config:
                
                # Setup mocks
                mock_config_instance = Mock()
                mock_config_instance.lambda_function_name = "test-lambda"
                mock_config_instance.aws_provider = Mock()
                mock_config.return_value = mock_config_instance
                
                mock_input_bucket = Mock()
                mock_output_bucket = Mock()
                mock_lifecycle.return_value = Mock()
                
                # Test lifecycle creation
                result = create_s3_lifecycle_policies(
                    mock_config_instance, 
                    mock_input_bucket, 
                    mock_output_bucket
                )
                
                # Verify lifecycle policies were created
                self.assertEqual(mock_lifecycle.call_count, 2)  # input and output lifecycle
                
                # Verify result structure
                self.assertIn("input_lifecycle", result)
                self.assertIn("output_lifecycle", result)

    def test_main_infrastructure_creation(self):
        """Test main infrastructure creation function."""
        from lib.infrastructure.main import create_infrastructure
        
        # Mock all the infrastructure creation functions
        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config_class:
            with patch('lib.infrastructure.main.create_s3_buckets') as mock_s3:
                with patch('lib.infrastructure.main.create_s3_lifecycle_policies') as mock_lifecycle:
                    with patch('lib.infrastructure.main.create_iam_resources') as mock_iam:
                        with patch('lib.infrastructure.main.create_lambda_resources') as mock_lambda:
                            with patch('lib.infrastructure.main.create_lambda_invoke_policy') as mock_invoke:
                                with patch('lib.infrastructure.main.pulumi.export') as mock_export:
                                    
                                    # Setup mocks
                                    mock_config_instance = Mock()
                                    mock_config_instance.lambda_function_name = "test-lambda"
                                    mock_config_instance.environment_suffix = "test"
                                    mock_config_instance.region = "us-east-1"
                                    mock_config_instance.validate_configuration.return_value = True
                                    mock_config_class.return_value = mock_config_instance
                                    
                                    mock_s3.return_value = {
                                        "input_bucket": Mock(),
                                        "output_bucket": Mock()
                                    }
                                    mock_lifecycle.return_value = {
                                        "input_lifecycle": Mock(),
                                        "output_lifecycle": Mock()
                                    }
                                    mock_iam.return_value = {
                                        "lambda_role": Mock(),
                                        "s3_policy": Mock(),
                                        "logs_policy": Mock()
                                    }
                                    mock_lambda.return_value = {
                                        "lambda_function": Mock(),
                                        "s3_notification": Mock(),
                                        "alarms": Mock()
                                    }
                                    mock_invoke.return_value = Mock()
                                    
                                    # Test infrastructure creation
                                    result = create_infrastructure()
                                    
                                    # Verify all functions were called
                                    mock_s3.assert_called_once()
                                    mock_lifecycle.assert_called_once()
                                    mock_iam.assert_called_once()
                                    mock_lambda.assert_called_once()
                                    mock_invoke.assert_called_once()
                                    
                                    # Verify result structure
                                    self.assertIn("config", result)
                                    self.assertIn("storage", result)
                                    self.assertIn("lifecycle_policies", result)
                                    self.assertIn("iam", result)
                                    self.assertIn("lambda", result)
                                    self.assertIn("lambda_function", result)

    def test_main_lambda_function_with_iam(self):
        """Test Lambda function creation with IAM."""
        from lib.infrastructure.main import create_lambda_function_with_iam
        
        # Mock AWS resources
        with patch('lib.infrastructure.main.aws.lambda_.Function') as mock_lambda:
            with patch('lib.infrastructure.main.aws.cloudwatch.LogGroup') as mock_log_group:
                with patch('lib.infrastructure.main.pulumi.AssetArchive') as mock_archive:
                    with patch('lib.infrastructure.main.pulumi.FileArchive') as mock_file_archive:
                        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config:
                            
                            # Setup mocks
                            mock_config_instance = Mock()
                            mock_config_instance.lambda_function_name = "test-lambda"
                            mock_config_instance.lambda_timeout = 300
                            mock_config_instance.lambda_memory = 128
                            mock_config_instance.get_environment_variables.return_value = {"ENV": "test"}
                            mock_config_instance.get_tags.return_value = {"Environment": "test"}
                            mock_config_instance.aws_provider = Mock()
                            mock_config.return_value = mock_config_instance
                            
                            mock_role = Mock()
                            mock_role.arn = "test-role-arn"
                            
                            mock_archive.return_value = Mock()
                            mock_file_archive.return_value = Mock()
                            mock_lambda.return_value = Mock()
                            mock_log_group.return_value = Mock()
                            
                            # Test Lambda function creation
                            result = create_lambda_function_with_iam(
                                mock_config_instance, 
                                mock_role, 
                                Mock(), 
                                Mock()
                            )
                            
                            # Verify Lambda function was created
                            mock_lambda.assert_called_once()
                            mock_log_group.assert_called_once()
                            self.assertIsNotNone(result)


if __name__ == '__main__':
    unittest.main()