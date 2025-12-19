"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component covering approximately 20% of functionality.
Tests configuration, basic resource creation, and key component interactions.
"""

import unittest
from unittest.mock import patch, MagicMock, call
import json
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})
        self.assertEqual(args.lambda_memory_size, 256)
        self.assertEqual(args.lambda_timeout, 30)
        self.assertEqual(args.dynamodb_read_capacity, 5)
        self.assertEqual(args.dynamodb_write_capacity, 5)
        self.assertTrue(args.enable_auto_scaling)
        self.assertEqual(args.max_requests_per_hour, 10000)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"Environment": "test", "Project": "tap"}
        args = TapStackArgs(
            environment_suffix="prod",
            tags=custom_tags,
            lambda_memory_size=512,
            lambda_timeout=60,
            dynamodb_read_capacity=10,
            dynamodb_write_capacity=10,
            enable_auto_scaling=False,
            max_requests_per_hour=20000
        )
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.lambda_memory_size, 512)
        self.assertEqual(args.lambda_timeout, 60)
        self.assertEqual(args.dynamodb_read_capacity, 10)
        self.assertEqual(args.dynamodb_write_capacity, 10)
        self.assertFalse(args.enable_auto_scaling)
        self.assertEqual(args.max_requests_per_hour, 20000)

    def test_tap_stack_args_none_values(self):
        """Test TapStackArgs with None values (should use defaults)."""
        args = TapStackArgs(
            environment_suffix=None,
            tags=None,
            lambda_memory_size=None,
            lambda_timeout=None,
            dynamodb_read_capacity=None,
            dynamodb_write_capacity=None,
            enable_auto_scaling=None,
            max_requests_per_hour=None
        )
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})
        self.assertEqual(args.lambda_memory_size, 256)
        self.assertEqual(args.lambda_timeout, 30)
        self.assertEqual(args.dynamodb_read_capacity, 5)
        self.assertEqual(args.dynamodb_write_capacity, 5)
        self.assertTrue(args.enable_auto_scaling)
        self.assertEqual(args.max_requests_per_hour, 10000)


class TestTapStackInitialization(unittest.TestCase):
    """Test cases for TapStack initialization and basic setup."""

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__')
    @patch('lib.tap_stack.kms.Key')
    @patch('lib.tap_stack.kms.Alias')
    def test_tap_stack_initialization(self, mock_alias, mock_key, mock_init):
        """Test TapStack initialization with default arguments."""
        # Mock the parent class initialization
        mock_init.return_value = None
        
        # Mock KMS resources
        mock_key_instance = MagicMock()
        mock_key_instance.key_id = "test-key-id"
        mock_key_instance.arn = "arn:aws:kms:us-east-1:123456789012:key/test-key-id"
        mock_key.return_value = mock_key_instance
        
        mock_alias_instance = MagicMock()
        mock_alias.return_value = mock_alias_instance
        
        # Create TapStack instance
        args = TapStackArgs(environment_suffix="test")
        
        with patch.multiple(
            'lib.tap_stack',
            dynamodb=MagicMock(),
            iam=MagicMock(),
            ssm=MagicMock(),
            lambda_=MagicMock(),
            apigateway=MagicMock(),
            cloudwatch=MagicMock()
        ):
            stack = TapStack("test-stack", args)
            
            # Verify initialization
            self.assertEqual(stack.environment_suffix, "test")
            self.assertEqual(stack.name_prefix, "tap-test")
            self.assertEqual(stack.lambda_memory_size, 256)
            self.assertEqual(stack.lambda_timeout, 30)
            
            # Verify KMS key was created
            mock_key.assert_called_once()
            mock_alias.assert_called_once()

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__')
    def test_tap_stack_name_prefix_generation(self, mock_init):
        """Test that name prefix is generated correctly."""
        mock_init.return_value = None
        
        with patch.multiple(
            'lib.tap_stack',
            kms=MagicMock(),
            dynamodb=MagicMock(),
            iam=MagicMock(),
            ssm=MagicMock(),
            lambda_=MagicMock(),
            apigateway=MagicMock(),
            cloudwatch=MagicMock()
        ):
            # Test with different environment suffixes
            test_cases = [
                ("dev", "tap-dev"),
                ("prod", "tap-prod"),
                ("staging", "tap-staging"),
                ("test-env", "tap-test-env")
            ]
            
            for env_suffix, expected_prefix in test_cases:
                args = TapStackArgs(environment_suffix=env_suffix)
                stack = TapStack("test-stack", args)
                self.assertEqual(stack.name_prefix, expected_prefix)


class TestTapStackResourceCreation(unittest.TestCase):
    """Test cases for resource creation methods."""

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__')
    @patch('lib.tap_stack.cloudwatch')
    @patch('lib.tap_stack.apigateway')
    @patch('lib.tap_stack.lambda_')
    @patch('lib.tap_stack.ssm')
    @patch('lib.tap_stack.iam')
    @patch('lib.tap_stack.dynamodb')
    @patch('lib.tap_stack.kms')
    def test_create_kms_key(self, mock_kms, mock_dynamodb, mock_iam, mock_ssm, mock_lambda, mock_apigateway, mock_cloudwatch, mock_init):
        """Test KMS key creation."""
        mock_init.return_value = None
        
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        
        # Verify KMS key creation
        mock_kms.Key.assert_called_once()
        mock_kms.Alias.assert_called_once()
        
        # Check key configuration
        key_call_args = mock_kms.Key.call_args
        self.assertIn("tap-test-kms-key", key_call_args[0][0])
        self.assertEqual(key_call_args[1]["deletion_window_in_days"], 7)
        self.assertTrue(key_call_args[1]["enable_key_rotation"])

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__')
    @patch('lib.tap_stack.cloudwatch')
    @patch('lib.tap_stack.apigateway')
    @patch('lib.tap_stack.lambda_')
    @patch('lib.tap_stack.ssm')
    @patch('lib.tap_stack.iam')
    @patch('lib.tap_stack.dynamodb')
    @patch('lib.tap_stack.kms')
    def test_create_dynamodb_table(self, mock_kms, mock_dynamodb, mock_iam, mock_ssm, mock_lambda, mock_apigateway, mock_cloudwatch, mock_init):
        """Test DynamoDB table creation."""
        mock_init.return_value = None
        
        # Mock KMS key
        mock_key = MagicMock()
        mock_key.arn = "arn:aws:kms:us-east-1:123456789012:key/test-key-id"
        mock_kms.Key.return_value = mock_key
        mock_kms.Alias.return_value = MagicMock()
        
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        
        # Verify DynamoDB table creation
        mock_dynamodb.Table.assert_called_once()
        
        # Check table configuration
        table_call_args = mock_dynamodb.Table.call_args
        self.assertIn("tap-test-data-table", table_call_args[0][0])
        self.assertEqual(table_call_args[1]["billing_mode"], "PROVISIONED")
        self.assertEqual(table_call_args[1]["read_capacity"], 5)
        self.assertEqual(table_call_args[1]["write_capacity"], 5)
        self.assertEqual(table_call_args[1]["hash_key"], "id")
        self.assertEqual(table_call_args[1]["range_key"], "timestamp")

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__')
    @patch('lib.tap_stack.cloudwatch')
    @patch('lib.tap_stack.apigateway')
    @patch('lib.tap_stack.lambda_')
    @patch('lib.tap_stack.ssm')
    @patch('lib.tap_stack.iam')
    @patch('lib.tap_stack.dynamodb')
    @patch('lib.tap_stack.kms')
    def test_create_lambda_function(self, mock_kms, mock_dynamodb, mock_iam, mock_ssm, mock_lambda, mock_apigateway, mock_cloudwatch, mock_init):
        """Test Lambda function creation."""
        mock_init.return_value = None
        
        # Mock dependencies
        mock_key = MagicMock()
        mock_key.arn = "arn:aws:kms:us-east-1:123456789012:key/test-key-id"
        mock_kms.Key.return_value = mock_key
        mock_kms.Alias.return_value = MagicMock()
        
        mock_table = MagicMock()
        mock_table.name = "tap-test-data-table"
        mock_dynamodb.Table.return_value = mock_table
        
        mock_role = MagicMock()
        mock_role.arn = "arn:aws:iam::123456789012:role/tap-test-lambda-role"
        mock_iam.Role.return_value = mock_role
        mock_iam.RolePolicyAttachment.return_value = MagicMock()
        mock_iam.Policy.return_value = MagicMock()
        
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)
        
        # Verify Lambda function creation
        mock_lambda.Function.assert_called_once()
        
        # Check function configuration
        lambda_call_args = mock_lambda.Function.call_args
        self.assertIn("tap-test-api-handler", lambda_call_args[0][0])
        self.assertEqual(lambda_call_args[1]["runtime"], "python3.9")
        self.assertEqual(lambda_call_args[1]["handler"], "index.lambda_handler")
        self.assertEqual(lambda_call_args[1]["memory_size"], 256)
        self.assertEqual(lambda_call_args[1]["timeout"], 30)


class TestTapStackConfiguration(unittest.TestCase):
    """Test cases for configuration and parameter handling."""

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__')
    def test_custom_configuration_values(self, mock_init):
        """Test TapStack with custom configuration values."""
        mock_init.return_value = None
        
        with patch.multiple(
            'lib.tap_stack',
            kms=MagicMock(),
            dynamodb=MagicMock(),
            iam=MagicMock(),
            ssm=MagicMock(),
            lambda_=MagicMock(),
            apigateway=MagicMock(),
            cloudwatch=MagicMock()
        ):
            custom_tags = {"Environment": "prod", "CostCenter": "12345"}
            args = TapStackArgs(
                environment_suffix="prod",
                tags=custom_tags,
                lambda_memory_size=1024,
                lambda_timeout=120,
                dynamodb_read_capacity=20,
                dynamodb_write_capacity=20,
                enable_auto_scaling=False,
                max_requests_per_hour=50000
            )
            
            stack = TapStack("prod-stack", args)
            
            # Verify custom configuration is applied
            self.assertEqual(stack.environment_suffix, "prod")
            self.assertEqual(stack.tags, custom_tags)
            self.assertEqual(stack.lambda_memory_size, 1024)
            self.assertEqual(stack.lambda_timeout, 120)
            self.assertEqual(stack.dynamodb_read_capacity, 20)
            self.assertEqual(stack.dynamodb_write_capacity, 20)
            self.assertFalse(stack.enable_auto_scaling)
            self.assertEqual(stack.max_requests_per_hour, 50000)

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__')
    @patch('lib.tap_stack.cloudwatch')
    @patch('lib.tap_stack.apigateway')
    @patch('lib.tap_stack.lambda_')
    @patch('lib.tap_stack.ssm')
    @patch('lib.tap_stack.iam')
    @patch('lib.tap_stack.dynamodb')
    @patch('lib.tap_stack.kms')
    def test_resource_tagging(self, mock_kms, mock_dynamodb, mock_iam, mock_ssm, mock_lambda, mock_apigateway, mock_cloudwatch, mock_init):
        """Test that resources are properly tagged."""
        mock_init.return_value = None
        
        custom_tags = {"Environment": "test", "Project": "tap"}
        args = TapStackArgs(environment_suffix="test", tags=custom_tags)
        stack = TapStack("test-stack", args)
        
        # Verify that KMS key was created with proper tags
        kms_call_args = mock_kms.Key.call_args
        expected_tags = {
            **custom_tags,
            "Name": "tap-test-kms-key",
            "Environment": "test",
            "Purpose": "DynamoDB and Lambda encryption"
        }
        self.assertEqual(kms_call_args[1]["tags"], expected_tags)


if __name__ == '__main__':
    unittest.main()
