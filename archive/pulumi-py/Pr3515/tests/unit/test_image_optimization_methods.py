"""
test_image_optimization_methods.py

Unit tests for individual methods in ImageOptimizationStack.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import json
import sys
import pulumi
from pulumi import ResourceOptions

# Add lib directory to path
sys.path.insert(0, '/Users/mayanksethi/Projects/turing/iac-test-automations/worktrees/IAC-synth-53098726')

from lib.image_optimization_stack import ImageOptimizationStack


class TestImageOptimizationMethods(unittest.TestCase):
    """Test individual methods of ImageOptimizationStack."""

    def setUp(self):
        """Set up test environment."""
        self.patcher = patch('pulumi.ComponentResource.__init__', return_value=None)
        self.patcher.start()

    def tearDown(self):
        """Clean up test environment."""
        self.patcher.stop()

    @patch('lib.image_optimization_stack.s3')
    def test_create_s3_buckets_method(self, mock_s3):
        """Test _create_s3_buckets method creates all required buckets."""
        # Mock bucket creation
        mock_bucket = MagicMock()
        mock_bucket.id = pulumi.Output.from_input("test-bucket-id")
        mock_s3.Bucket.return_value = mock_bucket

        # Create stack instance without calling __init__ methods
        with patch.object(ImageOptimizationStack, '__init__', return_value=None):
            stack = ImageOptimizationStack.__new__(ImageOptimizationStack)
            stack.environment_suffix = "test"
            stack.tags = {"Environment": "test"}

            # Call the method directly
            stack._create_s3_buckets()

            # Verify 4 buckets were created (upload + 3 optimized)
            self.assertEqual(mock_s3.Bucket.call_count, 4)

            # Verify bucket configurations were created
            self.assertEqual(mock_s3.BucketVersioning.call_count, 1)
            self.assertEqual(mock_s3.BucketAccelerateConfiguration.call_count, 1)
            self.assertEqual(mock_s3.BucketCorsConfiguration.call_count, 1)
            self.assertEqual(mock_s3.BucketPublicAccessBlock.call_count, 3)  # For optimized buckets

            # Verify stack has bucket attributes
            self.assertIsNotNone(stack.upload_bucket)
            self.assertIsNotNone(stack.webp_bucket)
            self.assertIsNotNone(stack.jpeg_bucket)
            self.assertIsNotNone(stack.png_bucket)

    @patch('lib.image_optimization_stack.dynamodb')
    def test_create_dynamodb_table_method(self, mock_dynamodb):
        """Test _create_dynamodb_table method."""
        # Mock table creation
        mock_table = MagicMock()
        mock_table.name = pulumi.Output.from_input("test-table")
        mock_table.arn = pulumi.Output.from_input("arn:aws:dynamodb:us-west-1:123456789012:table/test-table")
        mock_dynamodb.Table.return_value = mock_table

        # Create stack instance
        with patch.object(ImageOptimizationStack, '__init__', return_value=None):
            stack = ImageOptimizationStack.__new__(ImageOptimizationStack)
            stack.environment_suffix = "test"
            stack.tags = {"Environment": "test"}

            # Call the method
            stack._create_dynamodb_table()

            # Verify table was created
            mock_dynamodb.Table.assert_called_once()
            call_args = mock_dynamodb.Table.call_args

            # Verify table configuration
            self.assertIn('image-metadata-test', call_args[0])
            kwargs = call_args[1]
            self.assertEqual(kwargs['billing_mode'], 'PAY_PER_REQUEST')
            self.assertEqual(kwargs['hash_key'], 'image_id')

            # Verify stack has table attribute
            self.assertEqual(stack.metadata_table, mock_table)

    @patch('lib.image_optimization_stack.iam')
    def test_create_iam_resources_method(self, mock_iam):
        """Test _create_iam_resources method."""
        # Mock role creation
        mock_role = MagicMock()
        mock_role.id = pulumi.Output.from_input("test-role-id")
        mock_role.arn = pulumi.Output.from_input("arn:aws:iam::123456789012:role/test-role")
        mock_iam.Role.return_value = mock_role

        # Setup required attributes
        mock_bucket = MagicMock()
        mock_bucket.arn = pulumi.Output.from_input("arn:aws:s3:::test-bucket")

        mock_table = MagicMock()
        mock_table.arn = pulumi.Output.from_input("arn:aws:dynamodb:us-west-1:123456789012:table/test-table")

        # Create stack instance
        with patch.object(ImageOptimizationStack, '__init__', return_value=None):
            stack = ImageOptimizationStack.__new__(ImageOptimizationStack)
            stack.environment_suffix = "test"
            stack.tags = {"Environment": "test"}
            stack.upload_bucket = mock_bucket
            stack.webp_bucket = mock_bucket
            stack.jpeg_bucket = mock_bucket
            stack.png_bucket = mock_bucket
            stack.metadata_table = mock_table

            # Call the method
            stack._create_iam_resources()

            # Verify role was created
            mock_iam.Role.assert_called_once()
            mock_iam.RolePolicy.assert_called_once()

            # Verify stack has role attribute
            self.assertEqual(stack.lambda_role, mock_role)

    @patch('lib.image_optimization_stack.lambda_')
    def test_create_lambda_function_method(self, mock_lambda):
        """Test _create_lambda_function method."""
        # Mock function creation
        mock_function = MagicMock()
        mock_function.name = pulumi.Output.from_input("test-function")
        mock_function.arn = pulumi.Output.from_input("arn:aws:lambda:us-west-1:123456789012:function:test-function")
        mock_lambda.Function.return_value = mock_function

        # Setup required attributes
        mock_role = MagicMock()
        mock_role.arn = pulumi.Output.from_input("arn:aws:iam::123456789012:role/test-role")

        mock_bucket = MagicMock()
        mock_bucket.id = pulumi.Output.from_input("test-bucket-id")

        mock_table = MagicMock()
        mock_table.name = pulumi.Output.from_input("test-table")

        # Create stack instance
        with patch.object(ImageOptimizationStack, '__init__', return_value=None):
            stack = ImageOptimizationStack.__new__(ImageOptimizationStack)
            stack.environment_suffix = "test"
            stack.tags = {"Environment": "test"}
            stack.lambda_role = mock_role
            stack.webp_bucket = mock_bucket
            stack.jpeg_bucket = mock_bucket
            stack.png_bucket = mock_bucket
            stack.metadata_table = mock_table

            # Call the method
            stack._create_lambda_function()

            # Verify function was created
            mock_lambda.Function.assert_called_once()
            call_args = mock_lambda.Function.call_args

            # Verify function configuration
            self.assertIn('image-processor-test', call_args[0])
            kwargs = call_args[1]
            self.assertEqual(kwargs['runtime'], 'python3.11')
            self.assertEqual(kwargs['handler'], 'handler.process_image')
            self.assertEqual(kwargs['timeout'], 300)
            self.assertEqual(kwargs['memory_size'], 1024)

            # Verify stack has function attribute
            self.assertEqual(stack.processor_function, mock_function)

    @patch('lib.image_optimization_stack.cloudwatch')
    def test_create_cloudwatch_dashboard_method(self, mock_cloudwatch):
        """Test _create_cloudwatch_dashboard method."""
        # Mock dashboard creation
        mock_dashboard = MagicMock()
        mock_cloudwatch.Dashboard.return_value = mock_dashboard

        # Create stack instance
        with patch.object(ImageOptimizationStack, '__init__', return_value=None):
            stack = ImageOptimizationStack.__new__(ImageOptimizationStack)
            stack.environment_suffix = "test"

            # Call the method
            stack._create_cloudwatch_dashboard()

            # Verify dashboard was created
            mock_cloudwatch.Dashboard.assert_called_once()
            call_args = mock_cloudwatch.Dashboard.call_args

            # Verify dashboard configuration
            self.assertIn('image-optimization-dashboard-test', call_args[0])
            kwargs = call_args[1]
            self.assertIn('dashboard_body', kwargs)

            # Parse dashboard body to verify structure
            dashboard_body = json.loads(kwargs['dashboard_body'])
            self.assertIn('widgets', dashboard_body)
            self.assertIsInstance(dashboard_body['widgets'], list)

            # Verify stack has dashboard attribute
            self.assertEqual(stack.dashboard, mock_dashboard)


if __name__ == '__main__':
    unittest.main()