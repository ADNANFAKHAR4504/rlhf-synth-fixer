"""
Unit tests for TapStack Pulumi component.

Tests the actual TapStack class functionality with proper mocking of AWS resources.
"""

import unittest
from unittest.mock import MagicMock, patch, Mock
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


if __name__ == '__main__':
    unittest.main()