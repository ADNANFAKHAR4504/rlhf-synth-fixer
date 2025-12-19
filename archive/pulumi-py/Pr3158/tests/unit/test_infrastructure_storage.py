"""
test_infrastructure_storage.py

Unit tests for the infrastructure storage module.
Tests S3 bucket creation, encryption, and policies.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

# Mock pulumi before importing our modules
sys.modules['pulumi'] = MagicMock()
sys.modules['pulumi_aws'] = MagicMock()
sys.modules['pulumi_aws.aws'] = MagicMock()

from infrastructure.storage import (create_cloudformation_logs_bucket,
                                    create_logs_bucket)


class TestStorageModule(unittest.TestCase):
    """Test cases for storage module functions."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.aws_provider = MagicMock()
        self.mock_config.aws_region = "us-east-1"
        self.mock_config.log_retention_days = 30
        self.mock_config.get_tags.return_value = {
            "Environment": "dev",
            "Project": "serverless-infrastructure"
        }

    @patch('infrastructure.storage.aws.s3.Bucket')
    @patch('infrastructure.storage.aws.s3.BucketVersioning')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.BucketPolicy')
    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.config')
    def test_create_logs_bucket(self, mock_config, mock_lifecycle, mock_policy, 
                                mock_pab, mock_encryption, mock_versioning, mock_bucket):
        """Test that logs bucket is created with proper configuration."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        mock_config.log_retention_days = 30
        
        # Mock bucket creation
        mock_bucket_instance = MagicMock()
        mock_bucket_instance.id = "test-bucket"
        mock_bucket_instance.arn = "arn:aws:s3:::test-bucket"
        mock_bucket.return_value = mock_bucket_instance
        
        # Mock other components
        mock_versioning_instance = MagicMock()
        mock_versioning.return_value = mock_versioning_instance
        
        mock_encryption_instance = MagicMock()
        mock_encryption.return_value = mock_encryption_instance
        
        mock_pab_instance = MagicMock()
        mock_pab.return_value = mock_pab_instance
        
        mock_policy_instance = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        mock_lifecycle_instance = MagicMock()
        mock_lifecycle.return_value = mock_lifecycle_instance
        
        result = create_logs_bucket("test-bucket")
        
        # Test that bucket is created
        mock_bucket.assert_called_once()
        
        # Test that bucket has correct name
        call_args = mock_bucket.call_args
        self.assertEqual(call_args[1]['bucket'], "test-bucket")
        
        # Test that versioning is enabled
        mock_versioning.assert_called_once()
        
        # Test that encryption is configured
        mock_encryption.assert_called_once()
        
        # Test that public access is blocked
        mock_pab.assert_called_once()
        
        # Test that policy is created
        mock_policy.assert_called_once()
        
        # Test that lifecycle is configured
        mock_lifecycle.assert_called_once()

    @patch('infrastructure.storage.aws.s3.Bucket')
    @patch('infrastructure.storage.aws.s3.BucketVersioning')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.BucketPolicy')
    @patch('infrastructure.storage.config')
    def test_create_cloudformation_logs_bucket(self, mock_config, mock_policy, 
                                               mock_pab, mock_encryption, 
                                               mock_versioning, mock_bucket):
        """Test that CloudFormation logs bucket is created."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock bucket creation
        mock_bucket_instance = MagicMock()
        mock_bucket_instance.id = "cf-logs-bucket"
        mock_bucket_instance.arn = "arn:aws:s3:::cf-logs-bucket"
        mock_bucket.return_value = mock_bucket_instance
        
        # Mock other components
        mock_versioning_instance = MagicMock()
        mock_versioning.return_value = mock_versioning_instance
        
        mock_encryption_instance = MagicMock()
        mock_encryption.return_value = mock_encryption_instance
        
        mock_pab_instance = MagicMock()
        mock_pab.return_value = mock_pab_instance
        
        mock_policy_instance = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        result = create_cloudformation_logs_bucket()
        
        # Test that bucket is created
        mock_bucket.assert_called_once()
        
        # Test that bucket has CloudFormation purpose tag
        call_args = mock_bucket.call_args
        self.assertIn("Purpose", call_args[1]['tags'])
        self.assertEqual(call_args[1]['tags']['Purpose'], "CloudFormation-Logs")
        
        # Test that versioning is enabled
        mock_versioning.assert_called_once()
        
        # Test that encryption is configured
        mock_encryption.assert_called_once()
        
        # Test that public access is blocked
        mock_pab.assert_called_once()
        
        # Test that policy is created
        mock_policy.assert_called_once()

    @patch('infrastructure.storage.aws.s3.Bucket')
    @patch('infrastructure.storage.aws.s3.BucketVersioning')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.BucketPolicy')
    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.config')
    def test_s3_bucket_encryption_configuration(self, mock_config, mock_lifecycle, 
                                                mock_policy, mock_pab, mock_encryption, 
                                                mock_versioning, mock_bucket):
        """Test that S3 bucket has proper encryption configuration."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        mock_config.log_retention_days = 30
        
        # Mock bucket creation
        mock_bucket_instance = MagicMock()
        mock_bucket_instance.id = "test-bucket"
        mock_bucket.return_value = mock_bucket_instance
        
        # Mock encryption
        mock_encryption_instance = MagicMock()
        mock_encryption.return_value = mock_encryption_instance
        
        # Mock other components
        mock_versioning_instance = MagicMock()
        mock_versioning.return_value = mock_versioning_instance
        
        mock_pab_instance = MagicMock()
        mock_pab.return_value = mock_pab_instance
        
        mock_policy_instance = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        mock_lifecycle_instance = MagicMock()
        mock_lifecycle.return_value = mock_lifecycle_instance
        
        create_logs_bucket("test-bucket")
        
        # Test that encryption is configured
        mock_encryption.assert_called_once()
        call_args = mock_encryption.call_args
        self.assertIn('rules', call_args[1])
        # Note: The actual encryption configuration is set in the function, not in the test mock

    @patch('infrastructure.storage.aws.s3.Bucket')
    @patch('infrastructure.storage.aws.s3.BucketVersioning')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.BucketPolicy')
    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.config')
    def test_s3_bucket_lifecycle_configuration(self, mock_config, mock_lifecycle, 
                                               mock_policy, mock_pab, mock_encryption, 
                                               mock_versioning, mock_bucket):
        """Test that S3 bucket has proper lifecycle configuration."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        mock_config.log_retention_days = 30
        
        # Mock bucket creation
        mock_bucket_instance = MagicMock()
        mock_bucket_instance.id = "test-bucket"
        mock_bucket.return_value = mock_bucket_instance
        
        # Mock lifecycle
        mock_lifecycle_instance = MagicMock()
        mock_lifecycle.return_value = mock_lifecycle_instance
        
        # Mock other components
        mock_versioning_instance = MagicMock()
        mock_versioning.return_value = mock_versioning_instance
        
        mock_encryption_instance = MagicMock()
        mock_encryption.return_value = mock_encryption_instance
        
        mock_pab_instance = MagicMock()
        mock_pab.return_value = mock_pab_instance
        
        mock_policy_instance = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        create_logs_bucket("test-bucket")
        
        # Test that lifecycle is configured
        mock_lifecycle.assert_called_once()
        call_args = mock_lifecycle.call_args
        self.assertIn('rules', call_args[1])
        # Note: The actual lifecycle configuration is set in the function, not in the test mock


if __name__ == '__main__':
    unittest.main()