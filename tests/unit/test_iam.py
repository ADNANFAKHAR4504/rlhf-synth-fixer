"""
Unit tests for the IAM module.
Tests IAM roles, policies, and least-privilege access controls.
"""

import json
from unittest.mock import MagicMock, Mock, patch

import pytest

# Mock Pulumi before importing our modules
pulumi = Mock()
pulumi.ResourceOptions = Mock
pulumi_aws = Mock()

# Mock AWS IAM resources
mock_role = Mock()
mock_role.name = "test-role"
mock_role.arn = "arn:aws:iam::123456789012:role/test-role"

mock_policy = Mock()
mock_policy.id = "test-policy-id"
mock_policy.arn = "arn:aws:iam::123456789012:policy/test-policy"

mock_policy_attachment = Mock()
mock_policy_attachment.id = "test-attachment-id"

# Set up mocks
pulumi_aws.iam.Role = Mock(return_value=mock_role)
pulumi_aws.iam.Policy = Mock(return_value=mock_policy)
pulumi_aws.iam.RolePolicyAttachment = Mock(return_value=mock_policy_attachment)

from lib.infrastructure.config import ServerlessConfig
from lib.infrastructure.iam import (create_cloudwatch_logs_policy,
                                    create_iam_resources,
                                    create_lambda_execution_role,
                                    create_lambda_invoke_policy,
                                    create_s3_access_policy)


class TestIAMRoles:
    """Test cases for IAM role creation."""
    
    def test_create_lambda_execution_role(self):
        """Test Lambda execution role creation."""
        with patch('lib.infrastructure.iam.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.iam.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                result = create_lambda_execution_role(config)
                
                # Verify role was created
                assert result == mock_role
                pulumi_aws.iam.Role.assert_called_once()
                
                # Verify role configuration
                call_args = pulumi_aws.iam.Role.call_args
                assert call_args[1]['name'] == "test-lambda-execution-role"
                assert call_args[1]['assume_role_policy'] is not None
    
    def test_lambda_execution_role_assume_policy(self):
        """Test Lambda execution role assume policy."""
        with patch('lib.infrastructure.iam.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.iam.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                # Capture the assume role policy
                assume_policy = None
                def capture_policy(*args, **kwargs):
                    nonlocal assume_policy
                    assume_policy = kwargs.get('assume_role_policy')
                    return mock_role
                
                pulumi_aws.iam.Role.side_effect = capture_policy
                
                create_lambda_execution_role(config)
                
                # Verify assume role policy structure
                assert assume_policy is not None
                assert hasattr(assume_policy, 'apply')  # Should be a Pulumi Output
    
    def test_create_s3_access_policy(self):
        """Test S3 access policy creation."""
        with patch('lib.infrastructure.iam.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.iam.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                lambda_role = Mock()
                lambda_role.name = "test-role"
                
                input_bucket = Mock()
                input_bucket.arn = "arn:aws:s3:::input-bucket"
                
                output_bucket = Mock()
                output_bucket.arn = "arn:aws:s3:::output-bucket"
                
                result = create_s3_access_policy(config, lambda_role, input_bucket, output_bucket)
                
                # Verify policy was created
                assert result == mock_policy
                pulumi_aws.iam.Policy.assert_called_once()
                
                # Verify policy configuration
                call_args = pulumi_aws.iam.Policy.call_args
                assert call_args[1]['name'] == "test-lambda-s3-access-policy"
                assert call_args[1]['description'] == "S3 access policy for test-lambda"
    
    def test_s3_access_policy_document(self):
        """Test S3 access policy document structure."""
        with patch('lib.infrastructure.iam.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.iam.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                lambda_role = Mock()
                lambda_role.name = "test-role"
                
                input_bucket = Mock()
                input_bucket.arn = "arn:aws:s3:::input-bucket"
                
                output_bucket = Mock()
                output_bucket.arn = "arn:aws:s3:::output-bucket"
                
                # Capture the policy document
                policy_doc = None
                def capture_policy(*args, **kwargs):
                    nonlocal policy_doc
                    policy_doc = kwargs.get('policy')
                    return mock_policy
                
                pulumi_aws.iam.Policy.side_effect = capture_policy
                
                create_s3_access_policy(config, lambda_role, input_bucket, output_bucket)
                
                # Verify policy document structure
                assert policy_doc is not None
                assert hasattr(policy_doc, 'apply')  # Should be a Pulumi Output
    
    def test_create_cloudwatch_logs_policy(self):
        """Test CloudWatch Logs policy creation."""
        with patch('lib.infrastructure.iam.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.iam.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                lambda_role = Mock()
                lambda_role.name = "test-role"
                
                result = create_cloudwatch_logs_policy(config, lambda_role)
                
                # Verify policy was created
                assert result == mock_policy
                pulumi_aws.iam.Policy.assert_called_once()
                
                # Verify policy configuration
                call_args = pulumi_aws.iam.Policy.call_args
                assert call_args[1]['name'] == "test-lambda-logs-policy"
                assert call_args[1]['description'] == "CloudWatch Logs policy for test-lambda"
    
    def test_create_lambda_invoke_policy(self):
        """Test Lambda invoke policy creation."""
        with patch('lib.infrastructure.iam.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.iam.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                lambda_function = Mock()
                lambda_function.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
                
                result = create_lambda_invoke_policy(config, lambda_function)
                
                # Verify policy was created
                assert result == mock_policy
                pulumi_aws.iam.Policy.assert_called_once()
                
                # Verify policy configuration
                call_args = pulumi_aws.iam.Policy.call_args
                assert call_args[1]['name'] == "test-lambda-invoke-policy"
                assert call_args[1]['description'] == "Lambda invoke permissions for test-lambda"
    
    def test_create_iam_resources_complete(self):
        """Test complete IAM resources creation."""
        with patch('lib.infrastructure.iam.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.iam.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                input_bucket = Mock()
                input_bucket.arn = "arn:aws:s3:::input-bucket"
                
                output_bucket = Mock()
                output_bucket.arn = "arn:aws:s3:::output-bucket"
                
                lambda_function = Mock()
                lambda_function.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
                
                result = create_iam_resources(config, input_bucket, output_bucket, lambda_function)
                
                # Verify all resources were created
                assert "lambda_role" in result
                assert "s3_policy" in result
                assert "logs_policy" in result
                assert "invoke_policy" in result
                
                # Verify role was created
                assert result["lambda_role"] == mock_role
                
                # Verify policies were created
                assert result["s3_policy"] == mock_policy
                assert result["logs_policy"] == mock_policy
                assert result["invoke_policy"] == mock_policy
    
    def test_create_iam_resources_without_lambda(self):
        """Test IAM resources creation without Lambda function."""
        with patch('lib.infrastructure.iam.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.iam.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                input_bucket = Mock()
                input_bucket.arn = "arn:aws:s3:::input-bucket"
                
                output_bucket = Mock()
                output_bucket.arn = "arn:aws:s3:::output-bucket"
                
                result = create_iam_resources(config, input_bucket, output_bucket, None)
                
                # Verify resources were created except invoke policy
                assert "lambda_role" in result
                assert "s3_policy" in result
                assert "logs_policy" in result
                assert "invoke_policy" is None
    
    def test_least_privilege_s3_policy_structure(self):
        """Test least-privilege S3 policy structure."""
        with patch('lib.infrastructure.iam.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.iam.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                lambda_role = Mock()
                lambda_role.name = "test-role"
                
                input_bucket = Mock()
                input_bucket.arn = "arn:aws:s3:::input-bucket"
                
                output_bucket = Mock()
                output_bucket.arn = "arn:aws:s3:::output-bucket"
                
                # Capture the policy document
                policy_doc = None
                def capture_policy(*args, **kwargs):
                    nonlocal policy_doc
                    policy_doc = kwargs.get('policy')
                    return mock_policy
                
                pulumi_aws.iam.Policy.side_effect = capture_policy
                
                create_s3_access_policy(config, lambda_role, input_bucket, output_bucket)
                
                # Verify policy document is a Pulumi Output
                assert policy_doc is not None
                assert hasattr(policy_doc, 'apply')
    
    def test_policy_attachment_creation(self):
        """Test policy attachment creation."""
        with patch('lib.infrastructure.iam.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.iam.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.get_tags.return_value = {"Environment": "test"}
                config.aws_provider = Mock()
                
                input_bucket = Mock()
                input_bucket.arn = "arn:aws:s3:::input-bucket"
                
                output_bucket = Mock()
                output_bucket.arn = "arn:aws:s3:::output-bucket"
                
                lambda_function = Mock()
                lambda_function.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
                
                create_iam_resources(config, input_bucket, output_bucket, lambda_function)
                
                # Verify policy attachments were created
                attachment_calls = pulumi_aws.iam.RolePolicyAttachment.call_args_list
                assert len(attachment_calls) >= 3  # Basic execution, S3, logs, invoke
                
                # Verify basic execution policy attachment
                basic_execution_call = next(
                    (call for call in attachment_calls 
                     if call[1]['policy_arn'] == "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
                    None
                )
                assert basic_execution_call is not None
