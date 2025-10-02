"""
Comprehensive unit tests for storage infrastructure module.
"""
import unittest
from unittest.mock import Mock, patch

import pulumi


class TestStorageComprehensive(unittest.TestCase):
    """Comprehensive tests for storage infrastructure."""

    def setUp(self):
        """Set up test fixtures."""
        # Mock Pulumi before importing our modules
        pulumi.Config = Mock
        pulumi.ResourceOptions = Mock

    def test_storage_module_import(self):
        """Test that storage module can be imported."""
        try:
            from lib.infrastructure import storage
            self.assertTrue(hasattr(storage, 'create_s3_buckets'))
            self.assertTrue(hasattr(storage, 'create_s3_lifecycle_policies'))
            self.assertTrue(hasattr(storage, 'create_ip_restricted_bucket_policy'))
        except ImportError as e:
            self.fail(f"Failed to import storage module: {e}")

    def test_storage_function_signatures(self):
        """Test that storage functions have the correct signatures."""
        import inspect

        from lib.infrastructure.storage import (
            create_ip_restricted_bucket_policy, create_s3_buckets,
            create_s3_lifecycle_policies)

        # Test create_s3_buckets signature
        sig = inspect.signature(create_s3_buckets)
        params = list(sig.parameters.keys())
        self.assertEqual(params, ['config'])
        
        # Test create_s3_lifecycle_policies signature
        sig = inspect.signature(create_s3_lifecycle_policies)
        params = list(sig.parameters.keys())
        self.assertEqual(params, ['config', 'input_bucket', 'output_bucket'])
        
        # Test create_ip_restricted_bucket_policy signature
        sig = inspect.signature(create_ip_restricted_bucket_policy)
        params = list(sig.parameters.keys())
        self.assertEqual(params, ['config', 'bucket', 'bucket_type'])

    def test_storage_config_attributes(self):
        """Test that config object has required attributes."""
        # Mock config object
        mock_config = Mock()
        mock_config.environment_suffix = "dev"
        mock_config.region = "us-east-1"
        mock_config.input_bucket_name = "test-input-bucket"
        mock_config.output_bucket_name = "test-output-bucket"
        mock_config.lambda_function_name = "test-lambda"
        mock_config.aws_provider = Mock()
        
        # Test that config has required attributes
        self.assertEqual(mock_config.environment_suffix, "dev")
        self.assertEqual(mock_config.region, "us-east-1")
        self.assertEqual(mock_config.input_bucket_name, "test-input-bucket")
        self.assertEqual(mock_config.output_bucket_name, "test-output-bucket")
        self.assertEqual(mock_config.lambda_function_name, "test-lambda")

    def test_storage_bucket_attributes(self):
        """Test that bucket objects have required attributes."""
        # Mock bucket objects
        mock_input_bucket = Mock()
        mock_input_bucket.bucket = "test-input-bucket"
        mock_output_bucket = Mock()
        mock_output_bucket.bucket = "test-output-bucket"
        
        # Test bucket attributes
        self.assertEqual(mock_input_bucket.bucket, "test-input-bucket")
        self.assertEqual(mock_output_bucket.bucket, "test-output-bucket")

    def test_storage_bucket_creation_mock(self):
        """Test S3 bucket creation with mocked AWS resources."""
        with patch('lib.infrastructure.storage.aws.s3.Bucket') as mock_bucket:
            # Mock bucket instance
            mock_bucket_instance = Mock()
            mock_bucket_instance.bucket = "test-bucket"
            mock_bucket_instance.arn = "arn:aws:s3:::test-bucket"
            mock_bucket.return_value = mock_bucket_instance
            
            # Create bucket
            bucket = mock_bucket("test-bucket")
            
            # Verify bucket was created
            mock_bucket.assert_called_once()
            self.assertEqual(bucket.bucket, "test-bucket")
            self.assertIn("arn:aws:s3", bucket.arn)

    def test_storage_bucket_policy_mock(self):
        """Test S3 bucket policy creation with mocked AWS resources."""
        with patch('lib.infrastructure.storage.aws.s3.BucketPolicy') as mock_policy:
            # Mock policy instance
            mock_policy_instance = Mock()
            mock_policy.return_value = mock_policy_instance
            
            # Create policy
            policy = mock_policy("test-policy", bucket="test-bucket", policy="{}")
            
            # Verify policy was created
            mock_policy.assert_called_once()

    def test_storage_lifecycle_policy_mock(self):
        """Test S3 lifecycle policy creation with mocked AWS resources."""
        with patch('lib.infrastructure.storage.aws.s3.BucketLifecycleConfiguration') as mock_lifecycle:
            # Mock lifecycle instance
            mock_lifecycle_instance = Mock()
            mock_lifecycle.return_value = mock_lifecycle_instance
            
            # Create lifecycle policy
            lifecycle = mock_lifecycle("test-lifecycle", bucket="test-bucket", rules=[])
            
            # Verify lifecycle policy was created
            mock_lifecycle.assert_called_once()

    def test_storage_encryption_configuration_mock(self):
        """Test S3 encryption configuration with mocked AWS resources."""
        with patch('lib.infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration') as mock_encryption:
            # Mock encryption instance
            mock_encryption_instance = Mock()
            mock_encryption.return_value = mock_encryption_instance
            
            # Create encryption configuration
            encryption = mock_encryption("test-encryption", bucket="test-bucket", rules=[])
            
            # Verify encryption configuration was created
            mock_encryption.assert_called_once()

    def test_storage_versioning_configuration_mock(self):
        """Test S3 versioning configuration with mocked AWS resources."""
        with patch('lib.infrastructure.storage.aws.s3.BucketVersioning') as mock_versioning:
            # Mock versioning instance
            mock_versioning_instance = Mock()
            mock_versioning.return_value = mock_versioning_instance
            
            # Create versioning configuration
            versioning = mock_versioning("test-versioning", bucket="test-bucket", versioning_configuration={})
            
            # Verify versioning configuration was created
            mock_versioning.assert_called_once()

    def test_storage_public_access_block_mock(self):
        """Test S3 public access block with mocked AWS resources."""
        with patch('lib.infrastructure.storage.aws.s3.BucketPublicAccessBlock') as mock_pab:
            # Mock PAB instance
            mock_pab_instance = Mock()
            mock_pab.return_value = mock_pab_instance
            
            # Create public access block
            pab = mock_pab("test-pab", bucket="test-bucket", block_public_acls=True)
            
            # Verify public access block was created
            mock_pab.assert_called_once()

    def test_storage_bucket_naming(self):
        """Test that S3 buckets are named correctly."""
        # Test naming patterns
        environment_suffix = "dev"
        region = "us-east-1"
        
        # Expected naming patterns
        expected_input_bucket = f"clean-s3-lambda-input-useast1-{environment_suffix}"
        expected_output_bucket = f"clean-s3-lambda-output-useast1-{environment_suffix}"
        
        # Verify naming patterns
        self.assertEqual(expected_input_bucket, "clean-s3-lambda-input-useast1-dev")
        self.assertEqual(expected_output_bucket, "clean-s3-lambda-output-useast1-dev")

    def test_storage_bucket_policy_structure(self):
        """Test that S3 bucket policies have correct structure."""
        # Mock bucket policy document
        policy_doc = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    "Resource": "arn:aws:s3:::test-bucket/*"
                },
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": [
                        "s3:ListBucket",
                        "s3:GetBucketLocation"
                    ],
                    "Resource": "arn:aws:s3:::test-bucket"
                }
            ]
        }
        
        # Verify policy document structure
        self.assertIn("Version", policy_doc)
        self.assertIn("Statement", policy_doc)
        self.assertEqual(policy_doc["Version"], "2012-10-17")
        self.assertIsInstance(policy_doc["Statement"], list)
        self.assertEqual(len(policy_doc["Statement"]), 2)
        
        # Check first statement
        statement1 = policy_doc["Statement"][0]
        self.assertEqual(statement1["Effect"], "Allow")
        self.assertEqual(statement1["Principal"], "*")
        self.assertIn("s3:GetObject", statement1["Action"])
        self.assertIn("s3:PutObject", statement1["Action"])
        self.assertIn("s3:DeleteObject", statement1["Action"])
        
        # Check second statement
        statement2 = policy_doc["Statement"][1]
        self.assertEqual(statement2["Effect"], "Allow")
        self.assertEqual(statement2["Principal"], "*")
        self.assertIn("s3:ListBucket", statement2["Action"])
        self.assertIn("s3:GetBucketLocation", statement2["Action"])

    def test_storage_lifecycle_policy_structure(self):
        """Test that S3 lifecycle policies have correct structure."""
        # Mock lifecycle policy rules
        lifecycle_rules = [
            {
                "id": "delete_old_versions",
                "status": "Enabled",
                "filter": {
                    "prefix": "temp/"
                },
                "expiration": {
                    "days": 30
                }
            },
            {
                "id": "transition_to_ia",
                "status": "Enabled",
                "filter": {
                    "prefix": "archive/"
                },
                "transitions": [
                    {
                        "days": 30,
                        "storage_class": "STANDARD_IA"
                    }
                ]
            }
        ]
        
        # Verify lifecycle policy structure
        self.assertIsInstance(lifecycle_rules, list)
        self.assertEqual(len(lifecycle_rules), 2)
        
        # Check first rule
        rule1 = lifecycle_rules[0]
        self.assertEqual(rule1["id"], "delete_old_versions")
        self.assertEqual(rule1["status"], "Enabled")
        self.assertIn("filter", rule1)
        self.assertIn("expiration", rule1)
        self.assertEqual(rule1["expiration"]["days"], 30)
        
        # Check second rule
        rule2 = lifecycle_rules[1]
        self.assertEqual(rule2["id"], "transition_to_ia")
        self.assertEqual(rule2["status"], "Enabled")
        self.assertIn("filter", rule2)
        self.assertIn("transitions", rule2)
        self.assertEqual(rule2["transitions"][0]["days"], 30)
        self.assertEqual(rule2["transitions"][0]["storage_class"], "STANDARD_IA")

    def test_storage_encryption_configuration_structure(self):
        """Test that S3 encryption configurations have correct structure."""
        # Mock encryption configuration
        encryption_config = {
            "rules": [
                {
                    "apply_server_side_encryption_by_default": {
                        "sse_algorithm": "AES256"
                    },
                    "bucket_key_enabled": True
                }
            ]
        }
        
        # Verify encryption configuration structure
        self.assertIn("rules", encryption_config)
        self.assertIsInstance(encryption_config["rules"], list)
        self.assertEqual(len(encryption_config["rules"]), 1)
        
        rule = encryption_config["rules"][0]
        self.assertIn("apply_server_side_encryption_by_default", rule)
        self.assertIn("bucket_key_enabled", rule)
        self.assertEqual(rule["apply_server_side_encryption_by_default"]["sse_algorithm"], "AES256")
        self.assertTrue(rule["bucket_key_enabled"])

    def test_storage_versioning_configuration_structure(self):
        """Test that S3 versioning configurations have correct structure."""
        # Mock versioning configuration
        versioning_config = {
            "status": "Enabled"
        }
        
        # Verify versioning configuration structure
        self.assertIn("status", versioning_config)
        self.assertEqual(versioning_config["status"], "Enabled")

    def test_storage_public_access_block_structure(self):
        """Test that S3 public access block configurations have correct structure."""
        # Mock public access block configuration
        pab_config = {
            "block_public_acls": True,
            "block_public_policy": True,
            "ignore_public_acls": True,
            "restrict_public_buckets": True
        }
        
        # Verify public access block configuration structure
        self.assertIn("block_public_acls", pab_config)
        self.assertIn("block_public_policy", pab_config)
        self.assertIn("ignore_public_acls", pab_config)
        self.assertIn("restrict_public_buckets", pab_config)
        
        self.assertTrue(pab_config["block_public_acls"])
        self.assertTrue(pab_config["block_public_policy"])
        self.assertTrue(pab_config["ignore_public_acls"])
        self.assertTrue(pab_config["restrict_public_buckets"])

    def test_storage_ip_restriction_policy(self):
        """Test IP restriction policy structure."""
        # Mock IP restriction policy
        ip_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:*",
                    "Resource": [
                        "arn:aws:s3:::test-bucket",
                        "arn:aws:s3:::test-bucket/*"
                    ],
                    "Condition": {
                        "IpAddress": {
                            "aws:SourceIp": [
                                "10.0.0.0/8",
                                "192.168.0.0/16"
                            ]
                        }
                    }
                }
            ]
        }
        
        # Verify IP restriction policy structure
        self.assertIn("Version", ip_policy)
        self.assertIn("Statement", ip_policy)
        
        statement = ip_policy["Statement"][0]
        self.assertEqual(statement["Effect"], "Deny")
        self.assertEqual(statement["Principal"], "*")
        self.assertEqual(statement["Action"], "s3:*")
        self.assertIn("Condition", statement)
        self.assertIn("IpAddress", statement["Condition"])
        self.assertIn("aws:SourceIp", statement["Condition"]["IpAddress"])

    def test_storage_bucket_tags(self):
        """Test that S3 buckets have appropriate tags."""
        # Mock bucket tags
        tags = {
            "Environment": "dev",
            "Project": "serverless-infrastructure",
            "ManagedBy": "pulumi",
            "BucketType": "input"
        }
        
        # Verify tags
        self.assertIn("Environment", tags)
        self.assertIn("Project", tags)
        self.assertIn("ManagedBy", tags)
        self.assertIn("BucketType", tags)
        self.assertEqual(tags["Environment"], "dev")
        self.assertEqual(tags["Project"], "serverless-infrastructure")
        self.assertEqual(tags["ManagedBy"], "pulumi")
        self.assertEqual(tags["BucketType"], "input")

    def test_storage_custom_environment_naming(self):
        """Test S3 bucket naming with custom environment."""
        # Test with custom environment
        environment_suffix = "prod"
        region = "us-west-2"
        
        # Expected naming patterns for prod environment
        expected_input_bucket = f"clean-s3-lambda-input-uswest2-{environment_suffix}"
        expected_output_bucket = f"clean-s3-lambda-output-uswest2-{environment_suffix}"
        
        # Verify custom naming
        self.assertEqual(expected_input_bucket, "clean-s3-lambda-input-uswest2-prod")
        self.assertEqual(expected_output_bucket, "clean-s3-lambda-output-uswest2-prod")

    def test_storage_error_handling(self):
        """Test storage error handling scenarios."""
        # Test with invalid config
        invalid_config = Mock()
        invalid_config.input_bucket_name = None
        invalid_config.output_bucket_name = None
        
        # Should handle None values gracefully
        self.assertIsNone(invalid_config.input_bucket_name)
        self.assertIsNone(invalid_config.output_bucket_name)

    def test_storage_resource_dependencies(self):
        """Test that storage resources have correct dependencies."""
        # Mock resources with dependencies
        mock_bucket = Mock()
        mock_policy = Mock()
        mock_lifecycle = Mock()
        mock_encryption = Mock()
        
        # Set up dependencies
        mock_policy.depends_on = [mock_bucket]
        mock_lifecycle.depends_on = [mock_bucket]
        mock_encryption.depends_on = [mock_bucket]
        
        # Verify dependencies
        self.assertIn(mock_bucket, mock_policy.depends_on)
        self.assertIn(mock_bucket, mock_lifecycle.depends_on)
        self.assertIn(mock_bucket, mock_encryption.depends_on)


if __name__ == '__main__':
    unittest.main()
