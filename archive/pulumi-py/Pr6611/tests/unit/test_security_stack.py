"""
test_security_stack.py

Comprehensive unit tests for the SecurityStack Pulumi component.
Tests KMS keys, Parameter Store parameters, and IAM roles.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
from pulumi import ResourceOptions, Output

# Import the classes we're testing
from lib.security_stack import SecurityStack, SecurityStackArgs


class TestSecurityStackArgs(unittest.TestCase):
    """Test cases for SecurityStackArgs configuration class."""

    def test_security_stack_args_default_values(self):
        """Test SecurityStackArgs with default values."""
        args = SecurityStackArgs(environment_suffix='test')

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.parameter_names, [
            'trading-api-key-1',
            'trading-api-key-2',
            'trading-api-secret'
        ])

    def test_security_stack_args_custom_parameter_names(self):
        """Test SecurityStackArgs with custom parameter names."""
        custom_params = ['api-key-1', 'api-key-2', 'database-password']
        args = SecurityStackArgs(
            environment_suffix='prod',
            parameter_names=custom_params
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.parameter_names, custom_params)

    def test_security_stack_args_empty_parameter_names(self):
        """Test SecurityStackArgs with empty parameter names list uses default."""
        args = SecurityStackArgs(
            environment_suffix='dev',
            parameter_names=[]
        )

        self.assertEqual(args.environment_suffix, 'dev')
        # Empty list is falsy, so it uses default values
        self.assertEqual(len(args.parameter_names), 3)
        self.assertIn('trading-api-key-1', args.parameter_names)

    def test_security_stack_args_none_parameter_names_uses_default(self):
        """Test SecurityStackArgs with None parameter_names uses defaults."""
        args = SecurityStackArgs(
            environment_suffix='staging',
            parameter_names=None
        )

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(len(args.parameter_names), 3)
        self.assertIn('trading-api-key-1', args.parameter_names)

    def test_security_stack_args_various_environments(self):
        """Test SecurityStackArgs with different environment suffixes."""
        for env in ['dev', 'staging', 'prod', 'test', 'pr6611']:
            args = SecurityStackArgs(environment_suffix=env)
            self.assertEqual(args.environment_suffix, env)


class TestSecurityStackResourceCreation(unittest.TestCase):
    """Test cases for verifying resources are created correctly."""

    @patch('lib.security_stack.aws.iam.RolePolicy')
    @patch('lib.security_stack.aws.iam.RolePolicyAttachment')
    @patch('lib.security_stack.aws.iam.Role')
    @patch('lib.security_stack.aws.iam.get_policy_document')
    @patch('lib.security_stack.aws.ssm.Parameter')
    @patch('lib.security_stack.aws.kms.Alias')
    @patch('lib.security_stack.aws.kms.Key')
    def test_security_stack_creates_kms_key(
        self, mock_kms_key, mock_kms_alias, mock_ssm_param,
        mock_get_policy, mock_role, mock_role_attach, mock_role_policy
    ):
        """Test that KMS key is created with correct configuration."""
        # Setup mocks
        mock_kms_instance = MagicMock()
        mock_kms_instance.id = Output.from_input('kms-key-123')
        mock_kms_instance.arn = Output.from_input('arn:aws:kms:us-east-2:123456789012:key/12345')
        mock_kms_key.return_value = mock_kms_instance

        mock_get_policy.return_value = MagicMock(json='{}')
        mock_role_instance = MagicMock()
        mock_role_instance.id = 'role-123'
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123456789012:role/test-role')
        mock_role_instance.name = Output.from_input('test-role')
        mock_role.return_value = mock_role_instance

        args = SecurityStackArgs(environment_suffix='test')

        try:
            stack = SecurityStack('test-security', args)
        except Exception:
            pass

        # Verify KMS key was created
        mock_kms_key.assert_called_once()
        call_kwargs = mock_kms_key.call_args[1]
        self.assertIn('description', call_kwargs)
        self.assertEqual(call_kwargs['enable_key_rotation'], True)
        self.assertEqual(call_kwargs['deletion_window_in_days'], 7)

    @patch('lib.security_stack.aws.iam.RolePolicy')
    @patch('lib.security_stack.aws.iam.RolePolicyAttachment')
    @patch('lib.security_stack.aws.iam.Role')
    @patch('lib.security_stack.aws.iam.get_policy_document')
    @patch('lib.security_stack.aws.ssm.Parameter')
    @patch('lib.security_stack.aws.kms.Alias')
    @patch('lib.security_stack.aws.kms.Key')
    def test_security_stack_creates_kms_alias(
        self, mock_kms_key, mock_kms_alias, mock_ssm_param,
        mock_get_policy, mock_role, mock_role_attach, mock_role_policy
    ):
        """Test that KMS alias is created."""
        mock_kms_instance = MagicMock()
        mock_kms_instance.id = Output.from_input('kms-key-123')
        mock_kms_instance.arn = Output.from_input('arn:aws:kms:us-east-2:123456789012:key/12345')
        mock_kms_key.return_value = mock_kms_instance

        mock_get_policy.return_value = MagicMock(json='{}')
        mock_role_instance = MagicMock()
        mock_role_instance.id = 'role-123'
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123456789012:role/test-role')
        mock_role_instance.name = Output.from_input('test-role')
        mock_role.return_value = mock_role_instance

        args = SecurityStackArgs(environment_suffix='test')

        try:
            stack = SecurityStack('test-security', args)
        except Exception:
            pass

        # Verify KMS alias was created
        mock_kms_alias.assert_called_once()
        call_kwargs = mock_kms_alias.call_args[1]
        self.assertIn('alias/parameter-store-test', call_kwargs['name'])

    @patch('lib.security_stack.aws.iam.RolePolicy')
    @patch('lib.security_stack.aws.iam.RolePolicyAttachment')
    @patch('lib.security_stack.aws.iam.Role')
    @patch('lib.security_stack.aws.iam.get_policy_document')
    @patch('lib.security_stack.aws.ssm.Parameter')
    @patch('lib.security_stack.aws.kms.Alias')
    @patch('lib.security_stack.aws.kms.Key')
    def test_security_stack_creates_correct_number_of_parameters(
        self, mock_kms_key, mock_kms_alias, mock_ssm_param,
        mock_get_policy, mock_role, mock_role_attach, mock_role_policy
    ):
        """Test that correct number of SSM parameters are created."""
        mock_kms_instance = MagicMock()
        mock_kms_instance.id = Output.from_input('kms-key-123')
        mock_kms_instance.arn = Output.from_input('arn:aws:kms:us-east-2:123456789012:key/12345')
        mock_kms_key.return_value = mock_kms_instance

        mock_ssm_instance = MagicMock()
        mock_ssm_instance.arn = Output.from_input('arn:aws:ssm:us-east-2:123456789012:parameter/test/key')
        mock_ssm_param.return_value = mock_ssm_instance

        mock_get_policy.return_value = MagicMock(json='{}')
        mock_role_instance = MagicMock()
        mock_role_instance.id = 'role-123'
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123456789012:role/test-role')
        mock_role_instance.name = Output.from_input('test-role')
        mock_role.return_value = mock_role_instance

        custom_params = ['key1', 'key2']
        args = SecurityStackArgs(
            environment_suffix='test',
            parameter_names=custom_params
        )

        try:
            stack = SecurityStack('test-security', args)
        except Exception:
            pass

        # Verify 2 SSM parameters were created
        self.assertEqual(mock_ssm_param.call_count, 2)

    @patch('lib.security_stack.aws.iam.RolePolicy')
    @patch('lib.security_stack.aws.iam.RolePolicyAttachment')
    @patch('lib.security_stack.aws.iam.Role')
    @patch('lib.security_stack.aws.iam.get_policy_document')
    @patch('lib.security_stack.aws.ssm.Parameter')
    @patch('lib.security_stack.aws.kms.Alias')
    @patch('lib.security_stack.aws.kms.Key')
    def test_security_stack_creates_lambda_iam_role(
        self, mock_kms_key, mock_kms_alias, mock_ssm_param,
        mock_get_policy, mock_role, mock_role_attach, mock_role_policy
    ):
        """Test that Lambda IAM role is created."""
        mock_kms_instance = MagicMock()
        mock_kms_instance.id = Output.from_input('kms-key-123')
        mock_kms_instance.arn = Output.from_input('arn:aws:kms:us-east-2:123456789012:key/12345')
        mock_kms_key.return_value = mock_kms_instance

        mock_ssm_instance = MagicMock()
        mock_ssm_instance.arn = Output.from_input('arn:aws:ssm:us-east-2:123456789012:parameter/test/key')
        mock_ssm_param.return_value = mock_ssm_instance

        mock_get_policy.return_value = MagicMock(json='{}')
        mock_role_instance = MagicMock()
        mock_role_instance.id = 'role-123'
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123456789012:role/test-role')
        mock_role_instance.name = Output.from_input('test-role')
        mock_role.return_value = mock_role_instance

        args = SecurityStackArgs(environment_suffix='test')

        try:
            stack = SecurityStack('test-security', args)
        except Exception:
            pass

        # Verify Lambda role was created
        mock_role.assert_called_once()
        # Verify the resource name (first positional argument)
        call_args = mock_role.call_args[0]
        self.assertIn('lambda-rotation-role-test', call_args[0])

    @patch('lib.security_stack.aws.iam.RolePolicy')
    @patch('lib.security_stack.aws.iam.RolePolicyAttachment')
    @patch('lib.security_stack.aws.iam.Role')
    @patch('lib.security_stack.aws.iam.get_policy_document')
    @patch('lib.security_stack.aws.ssm.Parameter')
    @patch('lib.security_stack.aws.kms.Alias')
    @patch('lib.security_stack.aws.kms.Key')
    def test_security_stack_attaches_lambda_basic_execution_policy(
        self, mock_kms_key, mock_kms_alias, mock_ssm_param,
        mock_get_policy, mock_role, mock_role_attach, mock_role_policy
    ):
        """Test that Lambda basic execution policy is attached."""
        mock_kms_instance = MagicMock()
        mock_kms_instance.id = Output.from_input('kms-key-123')
        mock_kms_instance.arn = Output.from_input('arn:aws:kms:us-east-2:123456789012:key/12345')
        mock_kms_key.return_value = mock_kms_instance

        mock_ssm_instance = MagicMock()
        mock_ssm_instance.arn = Output.from_input('arn:aws:ssm:us-east-2:123456789012:parameter/test/key')
        mock_ssm_param.return_value = mock_ssm_instance

        mock_get_policy.return_value = MagicMock(json='{}')
        mock_role_instance = MagicMock()
        mock_role_instance.id = 'role-123'
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123456789012:role/test-role')
        mock_role_instance.name = Output.from_input('test-role')
        mock_role.return_value = mock_role_instance

        args = SecurityStackArgs(environment_suffix='test')

        try:
            stack = SecurityStack('test-security', args)
        except Exception:
            pass

        # Verify managed policy attachment was created
        mock_role_attach.assert_called_once()
        call_kwargs = mock_role_attach.call_args[1]
        self.assertIn('AWSLambdaBasicExecutionRole', call_kwargs['policy_arn'])

    @patch('lib.security_stack.aws.iam.RolePolicy')
    @patch('lib.security_stack.aws.iam.RolePolicyAttachment')
    @patch('lib.security_stack.aws.iam.Role')
    @patch('lib.security_stack.aws.iam.get_policy_document')
    @patch('lib.security_stack.aws.ssm.Parameter')
    @patch('lib.security_stack.aws.kms.Alias')
    @patch('lib.security_stack.aws.kms.Key')
    def test_security_stack_creates_inline_policy_for_lambda(
        self, mock_kms_key, mock_kms_alias, mock_ssm_param,
        mock_get_policy, mock_role, mock_role_attach, mock_role_policy
    ):
        """Test that inline policy for SSM/KMS access is created."""
        mock_kms_instance = MagicMock()
        mock_kms_instance.id = Output.from_input('kms-key-123')
        mock_kms_instance.arn = Output.from_input('arn:aws:kms:us-east-2:123456789012:key/12345')
        mock_kms_key.return_value = mock_kms_instance

        mock_ssm_instance = MagicMock()
        mock_ssm_instance.arn = Output.from_input('arn:aws:ssm:us-east-2:123456789012:parameter/test/key')
        mock_ssm_param.return_value = mock_ssm_instance

        mock_get_policy.return_value = MagicMock(json='{}')
        mock_role_instance = MagicMock()
        mock_role_instance.id = 'role-123'
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123456789012:role/test-role')
        mock_role_instance.name = Output.from_input('test-role')
        mock_role.return_value = mock_role_instance

        args = SecurityStackArgs(environment_suffix='test')

        try:
            stack = SecurityStack('test-security', args)
        except Exception:
            pass

        # Verify inline policy was created
        mock_role_policy.assert_called_once()


class TestSecurityStackImports(unittest.TestCase):
    """Test that all required classes can be imported."""

    def test_security_stack_class_exists(self):
        """Test that SecurityStack class exists."""
        from lib.security_stack import SecurityStack
        self.assertIsNotNone(SecurityStack)

    def test_security_stack_args_class_exists(self):
        """Test that SecurityStackArgs class exists."""
        from lib.security_stack import SecurityStackArgs
        self.assertIsNotNone(SecurityStackArgs)


if __name__ == '__main__':
    unittest.main()
