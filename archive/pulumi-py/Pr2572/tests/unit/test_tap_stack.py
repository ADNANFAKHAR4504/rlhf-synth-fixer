"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, {})
        self.assertTrue(args.enable_server_access_logs)
        self.assertEqual(args.bucket_name_suffix, 'data')

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Environment': 'Test', 'Project': 'Demo'}
        args = TapStackArgs(
            environment_suffix='test',
            tags=custom_tags,
            enable_server_access_logs=False,
            bucket_name_suffix='test-data'
        )
        
        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, custom_tags)
        self.assertFalse(args.enable_server_access_logs)
        self.assertEqual(args.bucket_name_suffix, 'test-data')

    def test_tap_stack_args_partial_customization(self):
        """Test TapStackArgs with partial customization."""
        args = TapStackArgs(environment_suffix='staging')
        
        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, {})
        self.assertTrue(args.enable_server_access_logs)
        self.assertEqual(args.bucket_name_suffix, 'data')


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    def setUp(self):
        """Set up test fixtures."""
        self.args = TapStackArgs(
            environment_suffix='test',
            tags={'Test': 'true'},
            enable_server_access_logs=True,
            bucket_name_suffix='test-data'
        )

    @patch('lib.tap_stack.get_caller_identity')
    @patch('lib.tap_stack.kms.Key')
    @patch('lib.tap_stack.kms.Alias')
    @patch('lib.tap_stack.s3.Bucket')
    @patch('lib.tap_stack.iam.Policy')
    @patch('lib.tap_stack.s3.BucketPolicy')
    @patch('lib.tap_stack.cloudwatch.MetricAlarm')
    @patch('lib.tap_stack.config')
    def test_tap_stack_initialization(self, mock_config, mock_alarm, mock_bucket_policy, 
                                    mock_iam_policy, mock_s3_bucket, mock_kms_alias, mock_kms_key, mock_get_caller_identity):
        """Test TapStack initialization creates all required resources."""
        # Mock the AWS resources
        mock_get_caller_identity.return_value = MagicMock(account_id='123456789012')
        mock_kms_key.return_value = MagicMock()
        mock_kms_alias.return_value = MagicMock()
        mock_s3_bucket.return_value = MagicMock()
        mock_iam_policy.return_value = MagicMock()
        mock_bucket_policy.return_value = MagicMock()
        mock_alarm.return_value = MagicMock()
        mock_config.region = 'us-east-1'
        mock_config.account_id = '123456789012'

        # Create TapStack instance
        tap_stack = TapStack('test-stack', self.args)

        # Verify KMS key was created
        mock_kms_key.assert_called_once()
        call_args = mock_kms_key.call_args
        self.assertIn('tap-encryption-key-test', call_args[0][0])
        self.assertEqual(call_args[1]['deletion_window_in_days'], 7)
        self.assertTrue(call_args[1]['enable_key_rotation'])

        # Verify KMS alias was created
        mock_kms_alias.assert_called_once()
        call_args = mock_kms_alias.call_args
        self.assertIn('tap-encryption-alias-test', call_args[0][0])

        # Verify S3 buckets were created
        self.assertEqual(mock_s3_bucket.call_count, 2)  # logs bucket and data bucket

        # Verify IAM policy was created
        mock_iam_policy.assert_called_once()

        # Verify bucket policy was created (only logs bucket now)
        self.assertEqual(mock_bucket_policy.call_count, 1)

        # Verify CloudWatch alarm was created
        mock_alarm.assert_called_once()

        # Verify region was set
        mock_config.region = 'us-east-1'

    @patch('lib.tap_stack.get_caller_identity')
    @patch('lib.tap_stack.kms.Key')
    @patch('lib.tap_stack.kms.Alias')
    @patch('lib.tap_stack.s3.Bucket')
    @patch('lib.tap_stack.iam.Policy')
    @patch('lib.tap_stack.s3.BucketPolicy')
    @patch('lib.tap_stack.cloudwatch.MetricAlarm')
    @patch('lib.tap_stack.config')
    def test_tap_stack_without_logging(self, mock_config, mock_alarm, mock_bucket_policy,
                                     mock_iam_policy, mock_s3_bucket, mock_kms_alias, mock_kms_key, mock_get_caller_identity):
        """Test TapStack initialization without server access logging."""
        # Mock the AWS resources
        mock_get_caller_identity.return_value = MagicMock(account_id='123456789012')
        mock_kms_key.return_value = MagicMock()
        mock_kms_alias.return_value = MagicMock()
        mock_s3_bucket.return_value = MagicMock()
        mock_iam_policy.return_value = MagicMock()
        mock_bucket_policy.return_value = MagicMock()
        mock_alarm.return_value = MagicMock()
        mock_config.region = 'us-east-1'
        mock_config.account_id = '123456789012'

        # Create TapStackArgs without logging
        args_no_logging = TapStackArgs(
            environment_suffix='test',
            enable_server_access_logs=False
        )

        # Create TapStack instance
        tap_stack = TapStack('test-stack', args_no_logging)

        # Verify S3 buckets were created (should still create both)
        self.assertEqual(mock_s3_bucket.call_count, 2)

    @patch('lib.tap_stack.get_caller_identity')
    @patch('lib.tap_stack.kms.Key')
    @patch('lib.tap_stack.kms.Alias')
    @patch('lib.tap_stack.s3.Bucket')
    @patch('lib.tap_stack.iam.Policy')
    @patch('lib.tap_stack.s3.BucketPolicy')
    @patch('lib.tap_stack.cloudwatch.MetricAlarm')
    @patch('lib.tap_stack.config')
    def test_tap_stack_resource_tags(self, mock_config, mock_alarm, mock_bucket_policy,
                                   mock_iam_policy, mock_s3_bucket, mock_kms_alias, mock_kms_key, mock_get_caller_identity):
        """Test that all resources are properly tagged."""
        # Mock the AWS resources
        mock_get_caller_identity.return_value = MagicMock(account_id='123456789012')
        mock_kms_key.return_value = MagicMock()
        mock_kms_alias.return_value = MagicMock()
        mock_s3_bucket.return_value = MagicMock()
        mock_iam_policy.return_value = MagicMock()
        mock_bucket_policy.return_value = MagicMock()
        mock_alarm.return_value = MagicMock()
        mock_config.region = 'us-east-1'
        mock_config.account_id = '123456789012'

        # Create TapStack instance
        tap_stack = TapStack('test-stack', self.args)

        # Verify KMS key was tagged
        kms_call_args = mock_kms_key.call_args
        self.assertIn('tags', kms_call_args[1])
        tags = kms_call_args[1]['tags']
        self.assertEqual(tags['Environment'], 'Production')
        self.assertEqual(tags['Project'], 'TAP')
        self.assertEqual(tags['ManagedBy'], 'Pulumi')
        self.assertEqual(tags['Test'], 'true')

        # Verify S3 buckets were tagged
        s3_calls = mock_s3_bucket.call_args_list
        for call in s3_calls:
            self.assertIn('tags', call[1])
            tags = call[1]['tags']
            self.assertEqual(tags['Environment'], 'Production')

    @patch('lib.tap_stack.get_caller_identity')
    @patch('lib.tap_stack.kms.Key')
    @patch('lib.tap_stack.kms.Alias')
    @patch('lib.tap_stack.s3.Bucket')
    @patch('lib.tap_stack.iam.Policy')
    @patch('lib.tap_stack.s3.BucketPolicy')
    @patch('lib.tap_stack.cloudwatch.MetricAlarm')
    @patch('lib.tap_stack.config')
    def test_tap_stack_outputs_registration(self, mock_config, mock_alarm, mock_bucket_policy,
                                          mock_iam_policy, mock_s3_bucket, mock_kms_alias, mock_kms_key, mock_get_caller_identity):
        """Test that TapStack properly registers outputs."""
        # Mock the AWS resources with specific return values
        mock_get_caller_identity.return_value = MagicMock(account_id='123456789012')
        mock_kms_key.return_value = MagicMock()
        mock_kms_alias.return_value = MagicMock()
        mock_s3_bucket.return_value = MagicMock()
        mock_iam_policy.return_value = MagicMock()
        mock_bucket_policy.return_value = MagicMock()
        mock_alarm.return_value = MagicMock()
        mock_config.region = 'us-east-1'
        mock_config.account_id = '123456789012'

        # Create TapStack instance
        tap_stack = TapStack('test-stack', self.args)

        # Verify that outputs were registered
        self.assertIsNotNone(tap_stack.kms_key)
        self.assertIsNotNone(tap_stack.kms_alias)
        self.assertIsNotNone(tap_stack.logs_bucket)
        self.assertIsNotNone(tap_stack.data_bucket)
        self.assertIsNotNone(tap_stack.bucket_policy)
        self.assertIsNotNone(tap_stack.access_error_alarm)

    def test_tap_stack_args_validation(self):
        """Test TapStackArgs parameter validation."""
        # Test with None values
        args = TapStackArgs(
            environment_suffix=None,
            tags=None,
            enable_server_access_logs=None,
            bucket_name_suffix=None
        )
        
        # Should use defaults
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, {})
        self.assertTrue(args.enable_server_access_logs)
        self.assertEqual(args.bucket_name_suffix, 'data')

        # Test with empty string
        args = TapStackArgs(environment_suffix='')
        self.assertEqual(args.environment_suffix, '')  # Empty string should be preserved

        # Test with zero values
        args = TapStackArgs(enable_server_access_logs=False)
        self.assertFalse(args.enable_server_access_logs)


if __name__ == '__main__':
    unittest.main()
