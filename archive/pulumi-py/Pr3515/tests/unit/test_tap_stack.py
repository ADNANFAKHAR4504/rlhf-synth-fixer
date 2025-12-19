"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, call
import os
import sys
import pulumi
from pulumi import ResourceOptions

# Add lib directory to path
sys.path.insert(0, '/Users/mayanksethi/Projects/turing/iac-test-automations/worktrees/IAC-synth-53098726')

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs
from lib.image_optimization_stack import ImageOptimizationStack


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Environment': 'test', 'Project': 'tap'}
        args = TapStackArgs(
            environment_suffix='test',
            tags=custom_tags
        )

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_partial_values(self):
        """Test TapStackArgs with partial custom values."""
        args = TapStackArgs(environment_suffix='staging')

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertIsNone(args.tags)


class TestImageOptimizationStack(unittest.TestCase):
    """Test cases for ImageOptimizationStack component."""

    def test_image_optimization_stack_initialization(self):
        """Test ImageOptimizationStack initialization."""
        with patch('pulumi.ComponentResource.__init__', return_value=None):
            with patch.object(ImageOptimizationStack, '_create_s3_buckets'):
                with patch.object(ImageOptimizationStack, '_create_dynamodb_table'):
                    with patch.object(ImageOptimizationStack, '_create_iam_resources'):
                        with patch.object(ImageOptimizationStack, '_create_lambda_function'):
                            with patch.object(ImageOptimizationStack, '_configure_s3_notifications'):
                                with patch.object(ImageOptimizationStack, '_create_cloudfront_distribution'):
                                    with patch.object(ImageOptimizationStack, '_create_cloudwatch_dashboard'):
                                        with patch.object(ImageOptimizationStack, 'register_outputs'):
                                            stack = ImageOptimizationStack(
                                                "test-stack",
                                                environment_suffix="test",
                                                tags={"Environment": "test"}
                                            )

                                            # Verify all methods were called
                                            stack._create_s3_buckets.assert_called_once()
                                            stack._create_dynamodb_table.assert_called_once()
                                            stack._create_iam_resources.assert_called_once()
                                            stack._create_lambda_function.assert_called_once()
                                            stack._configure_s3_notifications.assert_called_once()
                                            stack._create_cloudfront_distribution.assert_called_once()
                                            stack._create_cloudwatch_dashboard.assert_called_once()

                                            # Verify environment suffix and tags are set
                                            self.assertEqual(stack.environment_suffix, "test")
                                            self.assertEqual(stack.tags, {"Environment": "test"})

    def test_environment_suffix_propagation(self):
        """Test environment suffix is properly propagated."""
        environment_suffix = "prod"

        with patch('pulumi.ComponentResource.__init__', return_value=None):
            with patch.object(ImageOptimizationStack, '_create_s3_buckets'):
                with patch.object(ImageOptimizationStack, '_create_dynamodb_table'):
                    with patch.object(ImageOptimizationStack, '_create_iam_resources'):
                        with patch.object(ImageOptimizationStack, '_create_lambda_function'):
                            with patch.object(ImageOptimizationStack, '_configure_s3_notifications'):
                                with patch.object(ImageOptimizationStack, '_create_cloudfront_distribution'):
                                    with patch.object(ImageOptimizationStack, '_create_cloudwatch_dashboard'):
                                        with patch.object(ImageOptimizationStack, 'register_outputs'):
                                            stack = ImageOptimizationStack(
                                                "test-stack",
                                                environment_suffix=environment_suffix
                                            )

                                            # Verify environment suffix is set correctly
                                            self.assertEqual(stack.environment_suffix, environment_suffix)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack component."""

    @patch('lib.tap_stack.ImageOptimizationStack')
    def test_tap_stack_initialization(self, mock_image_stack):
        """Test TapStack initialization with default args."""
        mock_instance = MagicMock()
        mock_instance.upload_bucket = MagicMock()
        mock_instance.upload_bucket.id = pulumi.Output.from_input("upload-bucket")
        mock_instance.distribution = MagicMock()
        mock_instance.distribution.domain_name = pulumi.Output.from_input("cdn.example.com")
        mock_instance.metadata_table = MagicMock()
        mock_instance.metadata_table.name = pulumi.Output.from_input("metadata-table")
        mock_instance.processor_function = MagicMock()
        mock_instance.processor_function.name = pulumi.Output.from_input("processor-function")

        mock_image_stack.return_value = mock_instance

        with patch('pulumi.ComponentResource.__init__', return_value=None):
            with patch.object(TapStack, 'register_outputs'):
                args = TapStackArgs(environment_suffix="test")
                stack = TapStack("test-tap-stack", args)

                # Verify environment suffix is set
                self.assertEqual(stack.environment_suffix, "test")

                # Verify ImageOptimizationStack was created
                mock_image_stack.assert_called_once()
                call_args = mock_image_stack.call_args
                self.assertIn("image-optimization-test", call_args[0])

                # Verify the stack instance is assigned
                self.assertEqual(stack.image_optimization, mock_instance)

    @patch('lib.tap_stack.ImageOptimizationStack')
    def test_tap_stack_with_tags(self, mock_image_stack):
        """Test TapStack passes tags to child stacks."""
        mock_instance = MagicMock()
        mock_instance.upload_bucket = MagicMock()
        mock_instance.upload_bucket.id = pulumi.Output.from_input("upload-bucket")
        mock_instance.distribution = MagicMock()
        mock_instance.distribution.domain_name = pulumi.Output.from_input("cdn.example.com")
        mock_instance.metadata_table = MagicMock()
        mock_instance.metadata_table.name = pulumi.Output.from_input("metadata-table")
        mock_instance.processor_function = MagicMock()
        mock_instance.processor_function.name = pulumi.Output.from_input("processor-function")

        mock_image_stack.return_value = mock_instance

        test_tags = {"Environment": "staging", "Project": "tap"}

        with patch('pulumi.ComponentResource.__init__', return_value=None):
            with patch.object(TapStack, 'register_outputs'):
                args = TapStackArgs(environment_suffix="staging", tags=test_tags)
                stack = TapStack("test-tap-stack", args)

                # Verify tags are passed to child stack
                mock_image_stack.assert_called_once()
                _, kwargs = mock_image_stack.call_args
                self.assertEqual(kwargs['tags'], test_tags)

    @patch('lib.tap_stack.ImageOptimizationStack')
    def test_tap_stack_outputs(self, mock_image_stack):
        """Test TapStack registers correct outputs."""
        mock_instance = MagicMock()
        mock_instance.upload_bucket = MagicMock()
        mock_instance.upload_bucket.id = pulumi.Output.from_input("upload-bucket-id")
        mock_instance.distribution = MagicMock()
        mock_instance.distribution.domain_name = pulumi.Output.from_input("cdn.example.com")
        mock_instance.metadata_table = MagicMock()
        mock_instance.metadata_table.name = pulumi.Output.from_input("metadata-table-name")
        mock_instance.processor_function = MagicMock()
        mock_instance.processor_function.name = pulumi.Output.from_input("processor-function-name")

        mock_image_stack.return_value = mock_instance

        with patch('pulumi.ComponentResource.__init__', return_value=None):
            with patch.object(TapStack, 'register_outputs') as mock_register:
                args = TapStackArgs(environment_suffix="test")
                stack = TapStack("test-tap-stack", args)

                # Verify outputs are registered
                mock_register.assert_called_once()
                outputs = mock_register.call_args[0][0]

                self.assertIn('upload_bucket', outputs)
                self.assertIn('cloudfront_distribution', outputs)
                self.assertIn('dynamodb_table', outputs)
                self.assertIn('lambda_function', outputs)


if __name__ == '__main__':
    unittest.main()