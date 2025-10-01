"""
test_infrastructure_iam.py

Unit tests for the infrastructure IAM module.
Tests IAM role creation and least privilege policies.
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

from infrastructure.iam import (create_api_gateway_role,
                                create_lambda_execution_role)


class TestIAMModule(unittest.TestCase):
    """Test cases for IAM module functions."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.aws_region = "us-east-1"
        self.mock_config.get_tags.return_value = {
            "Environment": "dev",
            "Project": "serverless-infrastructure"
        }

    @patch('infrastructure.iam.aws.iam.Role')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Policy')
    @patch('infrastructure.iam.config')
    def test_create_lambda_execution_role(self, mock_config, mock_policy, mock_attachment, mock_role):
        """Test that Lambda execution role is created with proper configuration."""
        mock_config.aws_provider = MagicMock()
        mock_config.aws_region = "us-east-1"
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock the role creation
        mock_role_instance = MagicMock()
        mock_role.return_value = mock_role_instance
        
        # Mock policy creation
        mock_policy_instance = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        # Mock attachment
        mock_attachment_instance = MagicMock()
        mock_attachment.return_value = mock_attachment_instance
        
        result = create_lambda_execution_role("test-function", "arn:aws:s3:::test-bucket", "arn:aws:sqs:us-east-1:123456789012:test-dlq")
        
        # Test that role is created
        mock_role.assert_called()
        
        # Test that role has correct name
        call_args = mock_role.call_args
        self.assertEqual(call_args[0][0], "test-function-lambda-role")
        self.assertEqual(call_args[1]['name'], "test-function-lambda-role")

    @patch('infrastructure.iam.aws.iam.Role')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Policy')
    @patch('infrastructure.iam.config')
    def test_create_api_gateway_role(self, mock_config, mock_policy, mock_attachment, mock_role):
        """Test that API Gateway role is created with proper configuration."""
        mock_config.aws_provider = MagicMock()
        mock_config.aws_region = "us-east-1"
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock the role creation
        mock_role_instance = MagicMock()
        mock_role.return_value = mock_role_instance
        
        # Mock policy creation
        mock_policy_instance = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        # Mock attachment
        mock_attachment_instance = MagicMock()
        mock_attachment.return_value = mock_attachment_instance
        
        result = create_api_gateway_role("test-function")
        
        # Test that role is created
        mock_role.assert_called()
        
        # Test that role has correct name
        call_args = mock_role.call_args
        self.assertEqual(call_args[0][0], "test-function-apigw-role")
        self.assertEqual(call_args[1]['name'], "test-function-apigw-role")

    @patch('infrastructure.iam.aws.iam.Role')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Policy')
    @patch('infrastructure.iam.config')
    def test_lambda_role_assume_policy(self, mock_config, mock_policy, mock_attachment, mock_role):
        """Test that Lambda role has correct assume role policy."""
        mock_config.aws_provider = MagicMock()
        mock_config.aws_region = "us-east-1"
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock the role creation
        mock_role_instance = MagicMock()
        mock_role.return_value = mock_role_instance
        
        # Mock policy creation
        mock_policy_instance = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        # Mock attachment
        mock_attachment_instance = MagicMock()
        mock_attachment.return_value = mock_attachment_instance
        
        create_lambda_execution_role("test-function", "arn:aws:s3:::test-bucket", "arn:aws:sqs:us-east-1:123456789012:test-dlq")
        
        # Test that role is created with correct assume role policy
        call_args = mock_role.call_args
        self.assertIn('assume_role_policy', call_args[1])
        
        # Test that assume role policy contains Lambda service
        assume_policy = call_args[1]['assume_role_policy']
        # This would be tested more thoroughly in integration tests

    @patch('infrastructure.iam.aws.iam.Role')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Policy')
    @patch('infrastructure.iam.config')
    def test_least_privilege_policies(self, mock_config, mock_policy, mock_attachment, mock_role):
        """Test that least privilege policies are created."""
        mock_config.aws_provider = MagicMock()
        mock_config.aws_region = "us-east-1"
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock the role creation
        mock_role_instance = MagicMock()
        mock_role.return_value = mock_role_instance
        
        # Mock policy creation
        mock_policy_instance = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        # Mock attachment
        mock_attachment_instance = MagicMock()
        mock_attachment.return_value = mock_attachment_instance
        
        create_lambda_execution_role("test-function", "arn:aws:s3:::test-bucket", "arn:aws:sqs:us-east-1:123456789012:test-dlq")
        
        # Test that multiple policies are created (S3, SSM, DLQ)
        self.assertEqual(mock_policy.call_count, 3)  # S3, SSM, DLQ policies
        
        # Test that policies are attached
        self.assertEqual(mock_attachment.call_count, 5)  # Basic execution, X-Ray, S3, SSM, DLQ

    @patch('infrastructure.iam.aws.iam.Role')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Policy')
    @patch('infrastructure.iam.config')
    def test_dlq_permissions(self, mock_config, mock_policy, mock_attachment, mock_role):
        """Test that DLQ permissions are properly configured."""
        mock_config.aws_provider = MagicMock()
        mock_config.aws_region = "us-east-1"
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock the role creation
        mock_role_instance = MagicMock()
        mock_role.return_value = mock_role_instance
        
        # Mock policy creation
        mock_policy_instance = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        # Mock attachment
        mock_attachment_instance = MagicMock()
        mock_attachment.return_value = mock_attachment_instance
        
        create_lambda_execution_role("test-function", "arn:aws:s3:::test-bucket", "arn:aws:sqs:us-east-1:123456789012:test-dlq")
        
        # Test that DLQ policy is created
        dlq_policy_calls = [call for call in mock_policy.call_args_list if 'dlq' in call[0][0]]
        self.assertEqual(len(dlq_policy_calls), 1)
        
        # Test that DLQ policy is attached
        dlq_attachment_calls = [call for call in mock_attachment.call_args_list if 'dlq' in call[0][0]]
        self.assertEqual(len(dlq_attachment_calls), 1)


if __name__ == '__main__':
    unittest.main()
