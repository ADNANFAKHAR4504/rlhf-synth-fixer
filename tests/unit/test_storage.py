"""
Unit tests for the storage module.
Tests S3 bucket creation, lifecycle policies, and IP restrictions.
"""

import json
from unittest.mock import MagicMock, Mock, patch

import pytest

# Mock Pulumi before importing our modules
pulumi = Mock()
pulumi.ResourceOptions = Mock
pulumi_aws = Mock()

# Mock AWS resources
mock_bucket = Mock()
mock_bucket.id = "test-bucket-id"
mock_bucket.bucket = "test-bucket-name"
mock_bucket.arn = "arn:aws:s3:::test-bucket-name"

mock_bucket_policy = Mock()
mock_bucket_policy.id = "test-policy-id"

mock_lifecycle = Mock()
mock_lifecycle.id = "test-lifecycle-id"

# Set up mocks
pulumi_aws.s3.Bucket = Mock(return_value=mock_bucket)
pulumi_aws.s3.BucketPublicAccessBlock = Mock()
pulumi_aws.s3.BucketVersioning = Mock()
pulumi_aws.s3.BucketServerSideEncryptionConfiguration = Mock()
pulumi_aws.s3.BucketLifecycleConfiguration = Mock(return_value=mock_lifecycle)
pulumi_aws.s3.BucketPolicy = Mock(return_value=mock_bucket_policy)
pulumi_aws.get_caller_identity = Mock(return_value=Mock(account_id="123456789012"))

from lib.infrastructure.config import ServerlessConfig
from lib.infrastructure.storage import (create_ip_restricted_bucket_policy,
                                        create_s3_buckets,
                                        create_s3_lifecycle_policies)


class TestS3Buckets:
    """Test cases for S3 bucket creation."""
    
    def test_create_s3_buckets_basic(self):
        """Test basic S3 bucket creation."""
        with patch('lib.infrastructure.storage.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.storage.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.input_bucket_name = "test-input-bucket"
                config.output_bucket_name = "test-output-bucket"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                result = create_s3_buckets(config)
                
                # Verify buckets were created
                assert "input_bucket" in result
                assert "output_bucket" in result
                assert "input_public_access_block" in result
                assert "output_public_access_block" in result
                assert "input_versioning" in result
                assert "output_versioning" in result
                assert "input_encryption" in result
                assert "output_encryption" in result
                
                # Verify bucket policies are commented out (disabled)
                assert "input_bucket_policy" not in result
                assert "output_bucket_policy" not in result
    
    def test_create_s3_buckets_with_provider(self):
        """Test S3 bucket creation with AWS provider."""
        with patch('lib.infrastructure.storage.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.storage.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.input_bucket_name = "test-input-bucket"
                config.output_bucket_name = "test-output-bucket"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                create_s3_buckets(config)
                
                # Verify provider was passed to resources
                pulumi_aws.s3.Bucket.assert_called()
                pulumi_aws.s3.BucketPublicAccessBlock.assert_called()
                pulumi_aws.s3.BucketVersioning.assert_called()
                pulumi_aws.s3.BucketServerSideEncryptionConfiguration.assert_called()
    
    def test_create_s3_lifecycle_policies(self):
        """Test S3 lifecycle policy creation."""
        with patch('lib.infrastructure.storage.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.storage.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.aws_provider = Mock()
                
                input_bucket = Mock()
                input_bucket.id = "input-bucket-id"
                output_bucket = Mock()
                output_bucket.id = "output-bucket-id"
                
                result = create_s3_lifecycle_policies(config, input_bucket, output_bucket)
                
                # Verify lifecycle policies were created
                assert "input_lifecycle" in result
                assert "output_lifecycle" in result
                
                # Verify lifecycle configuration calls
                assert pulumi_aws.s3.BucketLifecycleConfiguration.call_count == 2
    
    def test_create_ip_restricted_bucket_policy(self):
        """Test IP-restricted bucket policy creation."""
        with patch('lib.infrastructure.storage.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.storage.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.allowed_ip_ranges = ["10.0.0.0/8", "192.168.0.0/16"]
                config.aws_provider = Mock()
                
                bucket = Mock()
                bucket.id = "test-bucket-id"
                bucket.bucket = "test-bucket-name"
                bucket.bucket.apply = Mock(side_effect=lambda func: func("test-bucket-name"))
                
                result = create_ip_restricted_bucket_policy(config, bucket, "input")
                
                # Verify policy was created
                assert result == mock_bucket_policy
                pulumi_aws.s3.BucketPolicy.assert_called_once()
    
    def test_ip_restricted_policy_json_structure(self):
        """Test IP-restricted policy JSON structure."""
        with patch('lib.infrastructure.storage.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.storage.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.allowed_ip_ranges = ["10.0.0.0/8"]
                config.aws_provider = Mock()
                
                bucket = Mock()
                bucket.id = "test-bucket-id"
                bucket.bucket = "test-bucket-name"
                bucket.bucket.apply = Mock(side_effect=lambda func: func("test-bucket-name"))
                
                # Capture the policy JSON
                policy_json = None
                def capture_policy(*args, **kwargs):
                    nonlocal policy_json
                    policy_json = kwargs.get('policy')
                    return mock_bucket_policy
                
                pulumi_aws.s3.BucketPolicy.side_effect = capture_policy
                
                create_ip_restricted_bucket_policy(config, bucket, "input")
                
                # Verify policy structure
                assert policy_json is not None
                # The policy should be a Pulumi Output that when applied gives JSON
                assert hasattr(policy_json, 'apply')
    
    def test_lifecycle_policy_rules(self):
        """Test lifecycle policy rule configuration."""
        with patch('lib.infrastructure.storage.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.storage.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.aws_provider = Mock()
                
                input_bucket = Mock()
                input_bucket.id = "input-bucket-id"
                output_bucket = Mock()
                output_bucket.id = "output-bucket-id"
                
                create_s3_lifecycle_policies(config, input_bucket, output_bucket)
                
                # Verify lifecycle configuration was called with correct rules
                calls = pulumi_aws.s3.BucketLifecycleConfiguration.call_args_list
                assert len(calls) == 2
                
                for call in calls:
                    args, kwargs = call
                    assert 'rules' in kwargs
                    rules = kwargs['rules']
                    assert len(rules) > 0
                    
                    # Check for transition rules
                    transition_rules = [rule for rule in rules if hasattr(rule, 'transitions')]
                    assert len(transition_rules) > 0
    
    def test_bucket_encryption_configuration(self):
        """Test bucket encryption configuration."""
        with patch('lib.infrastructure.storage.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.storage.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.input_bucket_name = "test-input-bucket"
                config.output_bucket_name = "test-output-bucket"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                create_s3_buckets(config)
                
                # Verify encryption configuration was called
                encryption_calls = pulumi_aws.s3.BucketServerSideEncryptionConfiguration.call_args_list
                assert len(encryption_calls) == 2  # One for input, one for output
                
                for call in encryption_calls:
                    args, kwargs = call
                    assert 'rules' in kwargs
                    rules = kwargs['rules']
                    assert len(rules) == 1
                    assert rules[0].apply_server_side_encryption_by_default.sse_algorithm == "AES256"
    
    def test_bucket_versioning_configuration(self):
        """Test bucket versioning configuration."""
        with patch('lib.infrastructure.storage.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.storage.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.input_bucket_name = "test-input-bucket"
                config.output_bucket_name = "test-output-bucket"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                create_s3_buckets(config)
                
                # Verify versioning configuration was called
                versioning_calls = pulumi_aws.s3.BucketVersioning.call_args_list
                assert len(versioning_calls) == 2  # One for input, one for output
                
                for call in versioning_calls:
                    args, kwargs = call
                    assert kwargs['versioning_configuration']['status'] == "Enabled"
    
    def test_public_access_block_configuration(self):
        """Test public access block configuration."""
        with patch('lib.infrastructure.storage.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.storage.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.input_bucket_name = "test-input-bucket"
                config.output_bucket_name = "test-output-bucket"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                create_s3_buckets(config)
                
                # Verify public access block configuration was called
                pab_calls = pulumi_aws.s3.BucketPublicAccessBlock.call_args_list
                assert len(pab_calls) == 2  # One for input, one for output
                
                for call in pab_calls:
                    args, kwargs = call
                    assert kwargs['block_public_acls'] is True
                    assert kwargs['block_public_policy'] is True
                    assert kwargs['ignore_public_acls'] is True
                    assert kwargs['restrict_public_buckets'] is True
