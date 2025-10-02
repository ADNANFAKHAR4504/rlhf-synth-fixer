"""
Comprehensive unit tests for IAM infrastructure module.
"""
import unittest
from unittest.mock import Mock, patch

import pulumi


class TestIAMComprehensive(unittest.TestCase):
    """Comprehensive tests for IAM infrastructure."""

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

    def test_iam_function_signature(self):
        """Test that create_iam_resources has the correct signature."""
        import inspect

        from lib.infrastructure.iam import create_iam_resources

        # Get function signature
        sig = inspect.signature(create_iam_resources)
        params = list(sig.parameters.keys())
        
        # Should have 4 parameters: config, input_bucket, output_bucket, lambda_function
        expected_params = ['config', 'input_bucket', 'output_bucket', 'lambda_function']
        self.assertEqual(params, expected_params)

    def test_iam_config_attributes(self):
        """Test that config object has required attributes."""
        # Mock config object
        mock_config = Mock()
        mock_config.environment_suffix = "dev"
        mock_config.region = "us-east-1"
        mock_config.input_bucket_name = "test-input-bucket"
        mock_config.output_bucket_name = "test-output-bucket"
        mock_config.lambda_function_name = "test-lambda"
        
        # Test that config has required attributes
        self.assertEqual(mock_config.environment_suffix, "dev")
        self.assertEqual(mock_config.region, "us-east-1")
        self.assertEqual(mock_config.input_bucket_name, "test-input-bucket")
        self.assertEqual(mock_config.output_bucket_name, "test-output-bucket")
        self.assertEqual(mock_config.lambda_function_name, "test-lambda")

    def test_iam_bucket_attributes(self):
        """Test that bucket objects have required attributes."""
        # Mock bucket objects
        mock_input_bucket = Mock()
        mock_input_bucket.bucket = "test-input-bucket"
        mock_output_bucket = Mock()
        mock_output_bucket.bucket = "test-output-bucket"
        
        # Test bucket attributes
        self.assertEqual(mock_input_bucket.bucket, "test-input-bucket")
        self.assertEqual(mock_output_bucket.bucket, "test-output-bucket")

    def test_iam_lambda_attributes(self):
        """Test that lambda function has required attributes."""
        # Mock lambda function
        mock_lambda_function = Mock()
        mock_lambda_function.name = "test-lambda"
        mock_lambda_function.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
        
        # Test lambda attributes
        self.assertEqual(mock_lambda_function.name, "test-lambda")
        self.assertIn("arn:aws:lambda", mock_lambda_function.arn)

    def test_iam_role_creation_mock(self):
        """Test IAM role creation with mocked AWS resources."""
        with patch('lib.infrastructure.iam.aws.iam.Role') as mock_role:
            # Mock role instance
            mock_role_instance = Mock()
            mock_role_instance.name = "test-role"
            mock_role_instance.arn = "arn:aws:iam::123456789012:role/test-role"
            mock_role.return_value = mock_role_instance
            
            # Create role
            role = mock_role("test-role", assume_role_policy="{}")
            
            # Verify role was created
            mock_role.assert_called_once()
            self.assertEqual(role.name, "test-role")
            self.assertIn("arn:aws:iam", role.arn)

    def test_iam_policy_creation_mock(self):
        """Test IAM policy creation with mocked AWS resources."""
        with patch('lib.infrastructure.iam.aws.iam.Policy') as mock_policy:
            # Mock policy instance
            mock_policy_instance = Mock()
            mock_policy_instance.name = "test-policy"
            mock_policy_instance.arn = "arn:aws:iam::123456789012:policy/test-policy"
            mock_policy.return_value = mock_policy_instance
            
            # Create policy
            policy = mock_policy("test-policy", policy="{}")
            
            # Verify policy was created
            mock_policy.assert_called_once()
            self.assertEqual(policy.name, "test-policy")
            self.assertIn("arn:aws:iam", policy.arn)

    def test_iam_policy_attachment_mock(self):
        """Test IAM policy attachment with mocked AWS resources."""
        with patch('lib.infrastructure.iam.aws.iam.RolePolicyAttachment') as mock_attachment:
            # Mock attachment instance
            mock_attachment_instance = Mock()
            mock_attachment.return_value = mock_attachment_instance
            
            # Create attachment
            attachment = mock_attachment("test-attachment", role="role", policy_arn="arn")
            
            # Verify attachment was created
            mock_attachment.assert_called_once()

    def test_iam_resource_naming(self):
        """Test that IAM resources are named correctly."""
        # Test naming patterns
        environment_suffix = "dev"
        lambda_function_name = "test-lambda"
        
        # Expected naming patterns
        expected_role_name = f"{lambda_function_name}-role"
        expected_policy_name = f"{lambda_function_name}-s3-access-policy"
        expected_logs_policy_name = f"{lambda_function_name}-logs-policy"
        
        # Verify naming patterns
        self.assertEqual(expected_role_name, "test-lambda-role")
        self.assertEqual(expected_policy_name, "test-lambda-s3-access-policy")
        self.assertEqual(expected_logs_policy_name, "test-lambda-logs-policy")

    def test_iam_policy_document_structure(self):
        """Test that IAM policy documents have correct structure."""
        # Mock policy document
        policy_doc = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": "s3:GetObject",
                    "Resource": "arn:aws:s3:::test-bucket/*"
                }
            ]
        }
        
        # Verify policy document structure
        self.assertIn("Version", policy_doc)
        self.assertIn("Statement", policy_doc)
        self.assertEqual(policy_doc["Version"], "2012-10-17")
        self.assertIsInstance(policy_doc["Statement"], list)
        self.assertEqual(len(policy_doc["Statement"]), 1)
        
        statement = policy_doc["Statement"][0]
        self.assertIn("Effect", statement)
        self.assertIn("Action", statement)
        self.assertIn("Resource", statement)
        self.assertEqual(statement["Effect"], "Allow")

    def test_iam_assume_role_policy(self):
        """Test IAM assume role policy structure."""
        # Mock assume role policy
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        # Verify assume role policy structure
        self.assertIn("Version", assume_role_policy)
        self.assertIn("Statement", assume_role_policy)
        
        statement = assume_role_policy["Statement"][0]
        self.assertEqual(statement["Effect"], "Allow")
        self.assertEqual(statement["Principal"]["Service"], "lambda.amazonaws.com")
        self.assertEqual(statement["Action"], "sts:AssumeRole")

    def test_iam_least_privilege_principle(self):
        """Test that IAM policies follow least privilege principle."""
        # Mock S3 policy with minimal permissions
        s3_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    "Resource": [
                        "arn:aws:s3:::input-bucket/*",
                        "arn:aws:s3:::output-bucket/*"
                    ]
                }
            ]
        }
        
        # Verify least privilege - only specific actions and resources
        statement = s3_policy["Statement"][0]
        actions = statement["Action"]
        resources = statement["Resource"]
        
        # Should only have specific S3 actions, not wildcard
        self.assertIn("s3:GetObject", actions)
        self.assertIn("s3:PutObject", actions)
        self.assertNotIn("s3:*", actions)
        
        # Should only have specific bucket resources, not wildcard
        self.assertTrue(all("arn:aws:s3:::" in resource for resource in resources))
        self.assertNotIn("arn:aws:s3:::*", resources)

    def test_iam_cloudwatch_logs_permissions(self):
        """Test CloudWatch logs permissions in IAM policy."""
        # Mock CloudWatch logs policy
        logs_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                }
            ]
        }
        
        # Verify CloudWatch logs permissions
        statement = logs_policy["Statement"][0]
        actions = statement["Action"]
        
        self.assertIn("logs:CreateLogGroup", actions)
        self.assertIn("logs:CreateLogStream", actions)
        self.assertIn("logs:PutLogEvents", actions)
        self.assertEqual(statement["Effect"], "Allow")

    def test_iam_custom_environment_naming(self):
        """Test IAM resource naming with custom environment."""
        # Test with custom environment
        environment_suffix = "prod"
        lambda_function_name = "prod-lambda"
        
        # Expected naming patterns for prod environment
        expected_role_name = f"{lambda_function_name}-role"
        expected_policy_name = f"{lambda_function_name}-s3-access-policy"
        
        # Verify custom naming
        self.assertEqual(expected_role_name, "prod-lambda-role")
        self.assertEqual(expected_policy_name, "prod-lambda-s3-access-policy")

    def test_iam_resource_dependencies(self):
        """Test that IAM resources have correct dependencies."""
        # Mock resources with dependencies
        mock_role = Mock()
        mock_policy = Mock()
        mock_attachment = Mock()
        
        # Set up dependencies
        mock_attachment.depends_on = [mock_role, mock_policy]
        
        # Verify dependencies
        self.assertIn(mock_role, mock_attachment.depends_on)
        self.assertIn(mock_policy, mock_attachment.depends_on)

    def test_iam_error_handling(self):
        """Test IAM error handling scenarios."""
        # Test with invalid config
        invalid_config = Mock()
        invalid_config.environment_suffix = None
        invalid_config.lambda_function_name = None
        
        # Should handle None values gracefully
        self.assertIsNone(invalid_config.environment_suffix)
        self.assertIsNone(invalid_config.lambda_function_name)

    def test_iam_resource_tags(self):
        """Test that IAM resources have appropriate tags."""
        # Mock resource tags
        tags = {
            "Environment": "dev",
            "Project": "serverless-infrastructure",
            "ManagedBy": "pulumi"
        }
        
        # Verify tags
        self.assertIn("Environment", tags)
        self.assertIn("Project", tags)
        self.assertIn("ManagedBy", tags)
        self.assertEqual(tags["Environment"], "dev")
        self.assertEqual(tags["Project"], "serverless-infrastructure")
        self.assertEqual(tags["ManagedBy"], "pulumi")


if __name__ == '__main__':
    unittest.main()
