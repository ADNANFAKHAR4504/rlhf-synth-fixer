"""
Unit tests for storage infrastructure.
"""

import unittest
from unittest.mock import Mock, patch
from lib.storage import StorageStack


class TestStorageStack(unittest.TestCase):
    """Test storage stack initialization and outputs."""

    @patch('lib.storage.aws.s3.Bucket')
    @patch('lib.storage.aws.s3.BucketVersioningV2')
    @patch('lib.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('lib.storage.aws.s3.BucketLifecycleConfigurationV2')
    @patch('lib.storage.aws.s3.BucketPublicAccessBlock')
    @patch('lib.storage.aws.dynamodb.Table')
    @patch('lib.storage.aws.kms.Key')
    @patch('lib.storage.aws.kms.Alias')
    def test_storage_stack_with_encryption(
        self, mock_kms_alias, mock_kms_key, mock_dynamodb, mock_public_block,
        mock_lifecycle, mock_sse, mock_versioning, mock_s3
    ):
        """Test storage stack with encryption enabled."""
        # Mock KMS key
        mock_kms_instance = Mock()
        mock_kms_instance.id = 'kms-123'
        mock_kms_instance.arn = 'arn:aws:kms:us-east-1:123456789012:key/123'
        mock_kms_key.return_value = mock_kms_instance

        # Mock S3 bucket
        mock_s3_instance = Mock()
        mock_s3_instance.id = 'bucket-123'
        mock_s3.return_value = mock_s3_instance

        # Mock DynamoDB table
        mock_dynamodb_instance = Mock()
        mock_dynamodb_instance.name = 'table-123'
        mock_dynamodb.return_value = mock_dynamodb_instance

        # Create stack with encryption
        stack = StorageStack(
            'test-storage',
            enable_versioning=True,
            lifecycle_days=90,
            dynamodb_billing_mode='PAY_PER_REQUEST',
            enable_encryption=True,
            environment_suffix='prod',
            tags={'Environment': 'prod'}
        )

        # Verify KMS key was created
        mock_kms_key.assert_called_once()

        # Verify S3 bucket was created
        mock_s3.assert_called_once()

        # Verify versioning was enabled
        mock_versioning.assert_called_once()

        # Verify lifecycle configuration was created
        mock_lifecycle.assert_called_once()

        # Verify DynamoDB table was created
        mock_dynamodb.assert_called_once()

    @patch('lib.storage.aws.s3.Bucket')
    @patch('lib.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('lib.storage.aws.s3.BucketPublicAccessBlock')
    @patch('lib.storage.aws.dynamodb.Table')
    def test_storage_stack_without_encryption(
        self, mock_dynamodb, mock_public_block, mock_sse, mock_s3
    ):
        """Test storage stack without encryption."""
        # Mock S3 bucket
        mock_s3_instance = Mock()
        mock_s3_instance.id = 'bucket-123'
        mock_s3.return_value = mock_s3_instance

        # Mock DynamoDB table
        mock_dynamodb_instance = Mock()
        mock_dynamodb_instance.name = 'table-123'
        mock_dynamodb.return_value = mock_dynamodb_instance

        # Create stack without encryption
        stack = StorageStack(
            'test-storage',
            enable_versioning=False,
            lifecycle_days=None,
            dynamodb_billing_mode='PROVISIONED',
            enable_encryption=False,
            environment_suffix='dev',
            tags={'Environment': 'dev'}
        )

        # Verify S3 bucket was created
        mock_s3.assert_called_once()

        # Verify DynamoDB table was created
        mock_dynamodb.assert_called_once()

    @patch('lib.storage.aws.s3.Bucket')
    @patch('lib.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('lib.storage.aws.s3.BucketPublicAccessBlock')
    @patch('lib.storage.aws.dynamodb.Table')
    def test_dynamodb_provisioned_mode(
        self, mock_dynamodb, mock_public_block, mock_sse, mock_s3
    ):
        """Test DynamoDB table with PROVISIONED billing mode."""
        mock_s3_instance = Mock()
        mock_s3_instance.id = 'bucket-123'
        mock_s3.return_value = mock_s3_instance

        mock_dynamodb_instance = Mock()
        mock_dynamodb_instance.name = 'table-123'
        mock_dynamodb.return_value = mock_dynamodb_instance

        stack = StorageStack(
            'test-storage',
            enable_versioning=False,
            lifecycle_days=None,
            dynamodb_billing_mode='PROVISIONED',
            enable_encryption=False,
            environment_suffix='dev',
            tags={'Environment': 'dev'}
        )

        # Verify DynamoDB was called with provisioned throughput
        call_kwargs = mock_dynamodb.call_args[1]
        self.assertEqual(call_kwargs['read_capacity'], 5)
        self.assertEqual(call_kwargs['write_capacity'], 5)


if __name__ == '__main__':
    unittest.main()
