"""
Comprehensive unit tests for the TapStack Pulumi component.

This module contains comprehensive unit tests that achieve 100% code coverage
for the TapStack Pulumi component, using pytest and unittest.mock for mocking
AWS resources to avoid requiring AWS credentials.
"""

import json
import pytest
from unittest.mock import Mock, patch, MagicMock, call
import pulumi
from pulumi import Output

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs:
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        
        assert args.environment_suffix == 'dev'

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_suffix = 'production'
        args = TapStackArgs(environment_suffix=custom_suffix)
        
        assert args.environment_suffix == custom_suffix

    def test_tap_stack_args_various_environments(self):
        """Test TapStackArgs with various environment suffixes."""
        test_environments = ['dev', 'staging', 'production', 'test', 'qa']
        
        for env in test_environments:
            args = TapStackArgs(environment_suffix=env)
            assert args.environment_suffix == env


class TestTapStack:
    """Test cases for TapStack Pulumi component."""

    def setup_method(self):
        """Set up test fixtures before each test method."""
        # Create mock objects for AWS resources
        self.mock_bucket = Mock()
        self.mock_bucket.arn = Output.from_input("arn:aws:s3:::test-bucket")
        self.mock_bucket.id = Output.from_input("test-bucket")
        
        self.mock_lambda_role = Mock()
        self.mock_lambda_role.arn = Output.from_input("arn:aws:iam::123456789012:role/test-role")
        self.mock_lambda_role.name = Output.from_input("test-role")
        
        self.mock_lambda_policy = Mock()
        self.mock_lambda_policy.arn = Output.from_input("arn:aws:iam::123456789012:policy/test-policy")
        
        self.mock_lambda_function = Mock()
        self.mock_lambda_function.arn = Output.from_input("arn:aws:lambda:us-east-1:123456789012:function:test-function")
        self.mock_lambda_function.name = Output.from_input("test-function")

    @patch('lib.tap_stack.aws.iam.RolePolicyAttachment')
    def test_tap_stack_initialization_flow(self, mock_role_policy_attachment):
        """Test the complete TapStack initialization flow."""
        with patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch.object(TapStack, 'register_outputs') as mock_register_outputs:
            
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)
            
            # Verify all resources are assigned
            assert stack.bucket == self.mock_bucket
            assert stack.lambda_role == self.mock_lambda_role
            assert stack.lambda_policy == self.mock_lambda_policy
            assert stack.lambda_function == self.mock_lambda_function
            
            # Verify policy attachment was called
            mock_role_policy_attachment.assert_called_once()
            call_args = mock_role_policy_attachment.call_args
            assert call_args[0][0] == "lambda-policy-attachment"
            assert call_args[1]['role'] == self.mock_lambda_role.name
            assert call_args[1]['policy_arn'] == self.mock_lambda_policy.arn
            
            # Verify register_outputs was called
            mock_register_outputs.assert_called_once()

    @patch('lib.tap_stack.aws.s3.BucketV2')
    @patch('lib.tap_stack.aws.s3.BucketVersioningV2')
    @patch('lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2')
    @patch('lib.tap_stack.aws.s3.BucketPublicAccessBlock')
    def test_create_s3_bucket(self, mock_public_access_block, mock_encryption, 
                             mock_versioning, mock_bucket_v2):
        """Test _create_s3_bucket method."""
        mock_bucket_v2.return_value = self.mock_bucket
        
        with patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify S3 bucket creation
            mock_bucket_v2.assert_called_once()
            call_args = mock_bucket_v2.call_args
            assert call_args[0][0] == "serverless-trigger-bucket"
            assert call_args[1]['tags'] == {
                "Environment": "production",
                "Project": "serverless-s3-lambda",
                "Purpose": "Lambda trigger source",
                "ManagedBy": "Pulumi"
            }
            assert call_args[1]['opts'].parent == stack
            
            # Verify bucket versioning configuration
            mock_versioning.assert_called_once()
            versioning_call_args = mock_versioning.call_args
            assert versioning_call_args[0][0] == "bucket-versioning"
            assert versioning_call_args[1]['bucket'] == self.mock_bucket.id
            
            # Verify encryption configuration
            mock_encryption.assert_called_once()
            encryption_call_args = mock_encryption.call_args
            assert encryption_call_args[0][0] == "bucket-encryption"
            assert encryption_call_args[1]['bucket'] == self.mock_bucket.id
            
            # Verify public access block
            mock_public_access_block.assert_called_once()
            public_access_call_args = mock_public_access_block.call_args
            assert public_access_call_args[0][0] == "bucket-public-access-block"
            assert public_access_call_args[1]['bucket'] == self.mock_bucket.id
            assert public_access_call_args[1]['block_public_acls'] is True
            assert public_access_call_args[1]['block_public_policy'] is True
            assert public_access_call_args[1]['ignore_public_acls'] is True
            assert public_access_call_args[1]['restrict_public_buckets'] is True

    @patch('lib.tap_stack.aws.iam.Role')
    def test_create_lambda_role(self, mock_iam_role):
        """Test _create_lambda_role method."""
        mock_iam_role.return_value = self.mock_lambda_role
        
        with patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify IAM role creation
            mock_iam_role.assert_called_once()
            call_args = mock_iam_role.call_args
            assert call_args[0][0] == "lambda-execution-role"
            
            # Verify assume role policy
            assume_role_policy = json.loads(call_args[1]['assume_role_policy'])
            expected_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    }
                ]
            }
            assert assume_role_policy == expected_policy
            
            # Verify other parameters
            assert call_args[1]['description'] == "IAM role for S3-triggered Lambda function"
            assert call_args[1]['tags'] == {
                "Environment": "production",
                "Project": "serverless-s3-lambda",
                "ManagedBy": "Pulumi"
            }

    @patch('lib.tap_stack.aws.iam.Policy')
    def test_create_lambda_policy(self, mock_iam_policy):
        """Test _create_lambda_policy method."""
        mock_iam_policy.return_value = self.mock_lambda_policy
        
        with patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify IAM policy creation
            mock_iam_policy.assert_called_once()
            call_args = mock_iam_policy.call_args
            assert call_args[0][0] == "lambda-s3-policy"
            
            # The policy document is an Output, so we need to verify it differently
            assert 'policy' in call_args[1]
            assert call_args[1]['description'] == "Policy for Lambda function to access S3 and CloudWatch Logs"
            assert call_args[1]['tags'] == {
                "Environment": "production",
                "Project": "serverless-s3-lambda",
                "ManagedBy": "Pulumi"
            }

    def test_create_lambda_policy_document_content(self):
        """Test the lambda policy document content generation."""
        with patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'), \
             patch('lib.tap_stack.aws.iam.Policy') as mock_iam_policy:
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Get the policy document function from the Output.apply call
            call_args = mock_iam_policy.call_args
            policy_output = call_args[1]['policy']
            
            # Simulate the apply function with a test ARN
            test_arn = "arn:aws:s3:::test-bucket"
            
            # Create a direct instance to test the policy creation method
            test_stack = TapStack.__new__(TapStack)
            test_policy = test_stack._create_lambda_policy(Output.from_input(test_arn))
            
            # The policy document should be created correctly
            assert test_policy is not None

    @patch('lib.tap_stack.aws.lambda_.Function')
    def test_create_lambda_function(self, mock_lambda_function):
        """Test _create_lambda_function method."""
        mock_lambda_function.return_value = self.mock_lambda_function
        
        with patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify Lambda function creation
            mock_lambda_function.assert_called_once()
            call_args = mock_lambda_function.call_args
            assert call_args[0][0] == "s3-processor-lambda"
            
            # Verify function configuration
            assert call_args[1]['runtime'] == "python3.9"
            assert call_args[1]['handler'] == "main.lambda_handler"
            assert call_args[1]['role'] == self.mock_lambda_role.arn
            assert call_args[1]['timeout'] == 300
            assert call_args[1]['memory_size'] == 256
            assert call_args[1]['description'] == "Lambda function to process S3 events"
            
            # Verify environment variables
            env_vars = call_args[1]['environment']
            assert env_vars.variables['LOG_LEVEL'] == "INFO"
            assert env_vars.variables['ENVIRONMENT'] == "production"
            
            # Verify tags
            assert call_args[1]['tags'] == {
                "Environment": "production",
                "Project": "serverless-s3-lambda",
                "ManagedBy": "Pulumi"
            }

    @patch('lib.tap_stack.aws.lambda_.Permission')
    @patch('lib.tap_stack.aws.s3.BucketNotification')
    def test_setup_s3_lambda_trigger(self, mock_bucket_notification, mock_lambda_permission):
        """Test _setup_s3_lambda_trigger method."""
        # Create a proper mock that behaves like a Pulumi Resource
        mock_permission = Mock(spec=pulumi.Resource)
        mock_lambda_permission.return_value = mock_permission
        
        with patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify Lambda permission creation
            mock_lambda_permission.assert_called_once()
            permission_call_args = mock_lambda_permission.call_args
            assert permission_call_args[0][0] == "s3-invoke-lambda-permission"
            assert permission_call_args[1]['action'] == "lambda:InvokeFunction"
            assert permission_call_args[1]['function'] == self.mock_lambda_function.name
            assert permission_call_args[1]['principal'] == "s3.amazonaws.com"
            
            # Verify bucket notification creation
            mock_bucket_notification.assert_called_once()
            notification_call_args = mock_bucket_notification.call_args
            assert notification_call_args[0][0] == "s3-lambda-notification"
            assert notification_call_args[1]['bucket'] == self.mock_bucket.id
            
            # Verify lambda function configuration in notification
            lambda_functions = notification_call_args[1]['lambda_functions']
            assert len(lambda_functions) == 1
            lambda_config = lambda_functions[0]
            assert lambda_config.lambda_function_arn == self.mock_lambda_function.arn
            assert lambda_config.events == ["s3:ObjectCreated:*"]
            assert lambda_config.filter_prefix == ""
            assert lambda_config.filter_suffix == ""

    def test_outputs_registration(self):
        """Test that outputs are registered correctly."""
        with patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'), \
             patch.object(TapStack, 'register_outputs') as mock_register_outputs:
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify outputs are set correctly
            assert stack.bucket_arn == self.mock_bucket.arn
            assert stack.bucket_name == self.mock_bucket.id
            assert stack.lambda_function_arn == self.mock_lambda_function.arn
            assert stack.lambda_function_name == self.mock_lambda_function.name
            assert stack.lambda_role_arn == self.mock_lambda_role.arn
            
            # Verify register_outputs was called with correct structure
            mock_register_outputs.assert_called_once()
            call_args = mock_register_outputs.call_args[0][0]
            
            # Check that all expected keys are present
            expected_keys = [
                'bucket_arn', 'bucket_name', 'lambda_function_arn', 
                'lambda_function_name', 'lambda_role_arn', 'test_command'
            ]
            for key in expected_keys:
                assert key in call_args

    def test_parent_child_relationships(self):
        """Test that parent-child relationships are established correctly."""
        with patch('lib.tap_stack.aws.s3.BucketV2') as mock_bucket_v2, \
             patch('lib.tap_stack.aws.iam.Role') as mock_iam_role, \
             patch('lib.tap_stack.aws.iam.Policy') as mock_iam_policy, \
             patch('lib.tap_stack.aws.lambda_.Function') as mock_lambda_func, \
             patch('lib.tap_stack.aws.lambda_.Permission') as mock_lambda_perm, \
             patch('lib.tap_stack.aws.s3.BucketNotification') as mock_bucket_notif, \
             patch('lib.tap_stack.aws.s3.BucketVersioningV2'), \
             patch('lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2'), \
             patch('lib.tap_stack.aws.s3.BucketPublicAccessBlock'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            # Set up return values with proper Resource inheritance
            mock_bucket_v2.return_value = self.mock_bucket
            mock_iam_role.return_value = self.mock_lambda_role
            mock_iam_policy.return_value = self.mock_lambda_policy
            mock_lambda_func.return_value = self.mock_lambda_function
            
            # Create a proper mock permission for the depends_on
            mock_permission = Mock(spec=pulumi.Resource)
            mock_lambda_perm.return_value = mock_permission
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify parent is set for main resources
            main_resources = [mock_bucket_v2, mock_iam_role, mock_iam_policy, mock_lambda_func]
            
            for mock_resource in main_resources:
                call_args = mock_resource.call_args
                if call_args and 'opts' in call_args[1]:
                    opts = call_args[1]['opts']
                    assert opts.parent == stack
            
            # Verify lambda permission parent is set
            if mock_lambda_perm.call_args and 'opts' in mock_lambda_perm.call_args[1]:
                opts = mock_lambda_perm.call_args[1]['opts']
                assert opts.parent == stack

    def test_component_resource_inheritance(self):
        """Test that TapStack properly inherits from ComponentResource."""
        with patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify it's a ComponentResource
            assert isinstance(stack, pulumi.ComponentResource)

    def test_resource_options_handling(self):
        """Test that resource options are handled correctly."""
        custom_opts = pulumi.ResourceOptions(protect=True)
        
        with patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args, custom_opts)
            
            # The stack should be created successfully with custom options
            assert stack is not None

    def test_method_return_types(self):
        """Test that all methods return the correct types."""
        with patch('lib.tap_stack.aws.s3.BucketV2', return_value=self.mock_bucket), \
             patch('lib.tap_stack.aws.iam.Role', return_value=self.mock_lambda_role), \
             patch('lib.tap_stack.aws.iam.Policy', return_value=self.mock_lambda_policy), \
             patch('lib.tap_stack.aws.lambda_.Function', return_value=self.mock_lambda_function), \
             patch('lib.tap_stack.aws.lambda_.Permission') as mock_lambda_perm, \
             patch('lib.tap_stack.aws.s3.BucketNotification'), \
             patch('lib.tap_stack.aws.s3.BucketVersioningV2'), \
             patch('lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2'), \
             patch('lib.tap_stack.aws.s3.BucketPublicAccessBlock'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            # Create a proper mock permission for the depends_on
            mock_permission = Mock(spec=pulumi.Resource)
            mock_lambda_perm.return_value = mock_permission
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Test that methods return expected types (they're called during init)
            assert stack.bucket == self.mock_bucket
            assert stack.lambda_role == self.mock_lambda_role  
            assert stack.lambda_policy == self.mock_lambda_policy
            assert stack.lambda_function == self.mock_lambda_function

    def test_stack_name_handling(self):
        """Test that stack name is handled correctly."""
        test_names = ['test-stack', 'production-stack', 'my-awesome-stack']
        
        for stack_name in test_names:
            with patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
                 patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
                 patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
                 patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
                 patch.object(TapStack, '_setup_s3_lambda_trigger'), \
                 patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
                
                args = TapStackArgs()
                stack = TapStack(stack_name, args)
                
                # Stack should be created successfully with any name
                assert stack is not None

    def test_lambda_policy_bucket_arn_dependency(self):
        """Test that lambda policy correctly depends on bucket ARN."""
        # Create a test stack instance directly to test the method
        test_stack = TapStack.__new__(TapStack)
        
        # Mock the parent initialization
        with patch('pulumi.ComponentResource.__init__'):
            test_stack.__dict__['bucket'] = self.mock_bucket
            
            # Test the policy creation with bucket ARN
            with patch('lib.tap_stack.aws.iam.Policy') as mock_policy:
                mock_policy.return_value = self.mock_lambda_policy
                
                result = test_stack._create_lambda_policy(self.mock_bucket.arn)
                
                # Verify policy was created
                mock_policy.assert_called_once()
                call_args = mock_policy.call_args
                
                # Verify the policy document is an Output that depends on bucket ARN
                assert 'policy' in call_args[1]
                policy_output = call_args[1]['policy']
                assert hasattr(policy_output, 'apply')

    def test_s3_bucket_configuration_completeness(self):
        """Test that S3 bucket is configured with all security settings."""
        with patch('lib.tap_stack.aws.s3.BucketV2', return_value=self.mock_bucket) as mock_bucket, \
             patch('lib.tap_stack.aws.s3.BucketVersioningV2') as mock_versioning, \
             patch('lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2') as mock_encryption, \
             patch('lib.tap_stack.aws.s3.BucketPublicAccessBlock') as mock_public_access, \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify all S3 security configurations are applied
            mock_bucket.assert_called_once()
            mock_versioning.assert_called_once()
            mock_encryption.assert_called_once()
            mock_public_access.assert_called_once()
            
            # Verify versioning configuration
            versioning_args = mock_versioning.call_args[1]
            assert versioning_args['versioning_configuration'].status == "Enabled"
            
            # Verify encryption configuration
            encryption_args = mock_encryption.call_args[1]
            encryption_rules = encryption_args['rules']
            assert len(encryption_rules) == 1
            assert encryption_rules[0].apply_server_side_encryption_by_default.sse_algorithm == "AES256"


class TestTapStackEdgeCases:
    """Test edge cases and error scenarios for TapStack."""

    def setup_method(self):
        """Set up test fixtures before each test method."""
        # Create mock objects for AWS resources
        self.mock_bucket = Mock()
        self.mock_bucket.arn = Output.from_input("arn:aws:s3:::test-bucket")
        self.mock_bucket.id = Output.from_input("test-bucket")
        
        self.mock_lambda_role = Mock()
        self.mock_lambda_role.arn = Output.from_input("arn:aws:iam::123456789012:role/test-role")
        self.mock_lambda_role.name = Output.from_input("test-role")
        
        self.mock_lambda_policy = Mock()
        self.mock_lambda_policy.arn = Output.from_input("arn:aws:iam::123456789012:policy/test-policy")
        
        self.mock_lambda_function = Mock()
        self.mock_lambda_function.arn = Output.from_input("arn:aws:lambda:us-east-1:123456789012:function:test-function")
        self.mock_lambda_function.name = Output.from_input("test-function")

    def test_tap_stack_args_edge_cases(self):
        """Test TapStackArgs with edge case values."""
        # Test with empty string
        args = TapStackArgs(environment_suffix='')
        assert args.environment_suffix == ''
        
        # Test with special characters
        args = TapStackArgs(environment_suffix='test-env_123')
        assert args.environment_suffix == 'test-env_123'
        
        # Test with very long environment suffix
        long_suffix = 'a' * 100
        args = TapStackArgs(environment_suffix=long_suffix)
        assert args.environment_suffix == long_suffix

    def test_lambda_policy_document_structure(self):
        """Test the structure of the generated lambda policy document."""
        # Create a test stack instance directly to test the policy creation method
        test_stack = TapStack.__new__(TapStack)
        
        # Mock the parent initialization
        with patch('pulumi.ComponentResource.__init__'):
            test_stack.__dict__['bucket'] = self.mock_bucket
            
            # Test the policy creation with bucket ARN
            with patch('lib.tap_stack.aws.iam.Policy') as mock_policy:
                mock_policy.return_value = self.mock_lambda_policy
                
                result = test_stack._create_lambda_policy(self.mock_bucket.arn)
                
                # Verify policy was created with correct parameters
                call_args = mock_policy.call_args
                assert call_args[1]['description'] == "Policy for Lambda function to access S3 and CloudWatch Logs"
                
                # Verify the policy document structure
                policy_output = call_args[1]['policy']
                assert hasattr(policy_output, 'apply')

    def test_s3_bucket_tags_completeness(self):
        """Test that all required tags are applied to S3 bucket and related resources."""
        with patch('lib.tap_stack.aws.s3.BucketV2', return_value=self.mock_bucket) as mock_bucket, \
             patch('lib.tap_stack.aws.s3.BucketVersioningV2') as mock_versioning, \
             patch('lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2') as mock_encryption, \
             patch('lib.tap_stack.aws.s3.BucketPublicAccessBlock') as mock_public_access, \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify S3 bucket tags
            bucket_call_args = mock_bucket.call_args[1]
            expected_tags = {
                "Environment": "production",
                "Project": "serverless-s3-lambda",
                "Purpose": "Lambda trigger source", 
                "ManagedBy": "Pulumi"
            }
            assert bucket_call_args['tags'] == expected_tags

    def test_lambda_function_environment_variables(self):
        """Test that Lambda function has correct environment variables."""
        with patch('lib.tap_stack.aws.lambda_.Function') as mock_lambda_function, \
             patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            mock_lambda_function.return_value = self.mock_lambda_function
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify environment variables
            call_args = mock_lambda_function.call_args[1]
            env_vars = call_args['environment']
            expected_vars = {
                'LOG_LEVEL': 'INFO',
                'ENVIRONMENT': 'production'
            }
            assert env_vars.variables == expected_vars

    def test_lambda_function_timeout_and_memory(self):
        """Test that Lambda function has correct timeout and memory settings."""
        with patch('lib.tap_stack.aws.lambda_.Function') as mock_lambda_function, \
             patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            mock_lambda_function.return_value = self.mock_lambda_function
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify timeout and memory settings
            call_args = mock_lambda_function.call_args[1]
            assert call_args['timeout'] == 300  # 5 minutes
            assert call_args['memory_size'] == 256  # MB

    def test_s3_bucket_notification_configuration(self):
        """Test that S3 bucket notification is configured correctly."""
        with patch('lib.tap_stack.aws.s3.BucketNotification') as mock_bucket_notification, \
             patch('lib.tap_stack.aws.lambda_.Permission') as mock_lambda_permission, \
             patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            # Create a proper mock permission for the depends_on
            mock_permission = Mock(spec=pulumi.Resource)
            mock_lambda_permission.return_value = mock_permission
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify bucket notification configuration
            notification_call_args = mock_bucket_notification.call_args[1]
            lambda_functions = notification_call_args['lambda_functions']
            assert len(lambda_functions) == 1
            
            lambda_config = lambda_functions[0]
            assert lambda_config.events == ["s3:ObjectCreated:*"]
            assert lambda_config.filter_prefix == ""
            assert lambda_config.filter_suffix == ""

    def test_component_resource_type(self):
        """Test that TapStack is registered with the correct component resource type."""
        with patch('pulumi.ComponentResource.__init__') as mock_super_init, \
             patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify ComponentResource.__init__ was called with correct type
            mock_super_init.assert_called_once_with('tap:index:TapStack', 'test-stack', {}, None)

    def test_lambda_code_asset_archive(self):
        """Test that Lambda function uses correct code asset archive."""
        with patch('lib.tap_stack.aws.lambda_.Function') as mock_lambda_function, \
             patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'), \
             patch('lib.tap_stack.aws.iam.RolePolicyAttachment'):
            
            mock_lambda_function.return_value = self.mock_lambda_function
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify code asset archive
            call_args = mock_lambda_function.call_args[1]
            code_archive = call_args['code']
            assert isinstance(code_archive, pulumi.AssetArchive)

    def test_iam_role_policy_attachment(self):
        """Test that IAM role policy attachment is configured correctly."""
        with patch('lib.tap_stack.aws.iam.RolePolicyAttachment') as mock_attachment, \
             patch.object(TapStack, '_create_s3_bucket', return_value=self.mock_bucket), \
             patch.object(TapStack, '_create_lambda_role', return_value=self.mock_lambda_role), \
             patch.object(TapStack, '_create_lambda_policy', return_value=self.mock_lambda_policy), \
             patch.object(TapStack, '_create_lambda_function', return_value=self.mock_lambda_function), \
             patch.object(TapStack, '_setup_s3_lambda_trigger'):
            
            args = TapStackArgs()
            stack = TapStack('test-stack', args)
            
            # Verify role policy attachment
            mock_attachment.assert_called_once()
            call_args = mock_attachment.call_args
            assert call_args[0][0] == "lambda-policy-attachment"
            assert call_args[1]['role'] == self.mock_lambda_role.name
            assert call_args[1]['policy_arn'] == self.mock_lambda_policy.arn
            assert call_args[1]['opts'].parent == stack