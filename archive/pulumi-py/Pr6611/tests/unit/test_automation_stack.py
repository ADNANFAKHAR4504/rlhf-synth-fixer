"""
test_automation_stack.py

Comprehensive unit tests for the AutomationStack Pulumi component.
Tests Lambda functions, EventBridge rules, and automation resources.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
from pulumi import ResourceOptions, Output

# Import the classes we're testing
from lib.automation_stack import AutomationStack, AutomationStackArgs


class TestAutomationStackArgs(unittest.TestCase):
    """Test cases for AutomationStackArgs configuration class."""

    def test_automation_stack_args_initialization(self):
        """Test AutomationStackArgs initialization with all required parameters."""
        lambda_role_arn = Output.from_input('arn:aws:iam::123456789012:role/lambda-role')
        log_group_arn = Output.from_input('arn:aws:logs:us-east-2:123456789012:log-group:/aws/events/test')
        kms_key_id = Output.from_input('kms-key-123')

        args = AutomationStackArgs(
            environment_suffix='test',
            lambda_role_arn=lambda_role_arn,
            log_group_arn=log_group_arn,
            kms_key_id=kms_key_id
        )

        self.assertEqual(args.environment_suffix, 'test')
        self.assertIsNotNone(args.lambda_role_arn)
        self.assertIsNotNone(args.log_group_arn)
        self.assertIsNotNone(args.kms_key_id)

    def test_automation_stack_args_various_environments(self):
        """Test AutomationStackArgs with different environment suffixes."""
        lambda_role_arn = Output.from_input('arn:aws:iam::123456789012:role/lambda-role')
        log_group_arn = Output.from_input('arn:aws:logs:us-east-2:123456789012:log-group:/aws/events/test')
        kms_key_id = Output.from_input('kms-key-123')

        for env in ['dev', 'staging', 'prod', 'test', 'pr6611']:
            args = AutomationStackArgs(
                environment_suffix=env,
                lambda_role_arn=lambda_role_arn,
                log_group_arn=log_group_arn,
                kms_key_id=kms_key_id
            )
            self.assertEqual(args.environment_suffix, env)


class TestAutomationStackResourceCreation(unittest.TestCase):
    """Test cases for verifying resources are created correctly."""

    @patch('lib.automation_stack.aws.cloudwatch.EventTarget')
    @patch('lib.automation_stack.aws.cloudwatch.EventRule')
    @patch('lib.automation_stack.aws.iam.RolePolicy')
    @patch('lib.automation_stack.aws.iam.Role')
    @patch('lib.automation_stack.aws.iam.get_policy_document')
    @patch('lib.automation_stack.aws.lambda_.Permission')
    @patch('lib.automation_stack.aws.cloudwatch.EventBus')
    @patch('lib.automation_stack.aws.lambda_.Function')
    def test_automation_stack_creates_lambda_function(
        self, mock_lambda, mock_event_bus, mock_lambda_permission,
        mock_get_policy, mock_role, mock_role_policy,
        mock_event_rule, mock_event_target
    ):
        """Test that Lambda function is created with correct configuration."""
        # Setup mocks
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.arn = Output.from_input('arn:aws:lambda:us-east-2:123456789012:function:test')
        mock_lambda_instance.name = Output.from_input('secret-rotation-test')
        mock_lambda.return_value = mock_lambda_instance

        mock_event_bus_instance = MagicMock()
        mock_event_bus_instance.name = Output.from_input('app-events-test')
        mock_event_bus.return_value = mock_event_bus_instance

        mock_event_rule_instance = MagicMock()
        mock_event_rule_instance.name = Output.from_input('rotation-schedule-test')
        mock_event_rule_instance.arn = Output.from_input('arn:aws:events:us-east-2:123456789012:rule/rotation-schedule-test')
        mock_event_rule.return_value = mock_event_rule_instance

        mock_get_policy.return_value = MagicMock(json='{}')
        mock_role_instance = MagicMock()
        mock_role_instance.id = 'role-123'
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123456789012:role/eventbridge-log-role')
        mock_role.return_value = mock_role_instance

        lambda_role_arn = Output.from_input('arn:aws:iam::123456789012:role/lambda-role')
        log_group_arn = Output.from_input('arn:aws:logs:us-east-2:123456789012:log-group:/aws/events/test')
        kms_key_id = Output.from_input('kms-key-123')

        args = AutomationStackArgs(
            environment_suffix='test',
            lambda_role_arn=lambda_role_arn,
            log_group_arn=log_group_arn,
            kms_key_id=kms_key_id
        )

        try:
            stack = AutomationStack('test-automation', args)
        except Exception:
            pass

        # Verify Lambda function was created
        mock_lambda.assert_called_once()
        # Verify the resource name (first positional argument)
        call_args = mock_lambda.call_args[0]
        self.assertIn('secret-rotation-test', call_args[0])
        # Verify kwargs
        call_kwargs = mock_lambda.call_args[1]
        self.assertEqual(call_kwargs['runtime'], 'python3.11')
        self.assertEqual(call_kwargs['handler'], 'index.handler')
        self.assertEqual(call_kwargs['timeout'], 30)

    @patch('lib.automation_stack.aws.cloudwatch.EventTarget')
    @patch('lib.automation_stack.aws.cloudwatch.EventRule')
    @patch('lib.automation_stack.aws.iam.RolePolicy')
    @patch('lib.automation_stack.aws.iam.Role')
    @patch('lib.automation_stack.aws.iam.get_policy_document')
    @patch('lib.automation_stack.aws.lambda_.Permission')
    @patch('lib.automation_stack.aws.cloudwatch.EventBus')
    @patch('lib.automation_stack.aws.lambda_.Function')
    def test_automation_stack_creates_event_bus(
        self, mock_lambda, mock_event_bus, mock_lambda_permission,
        mock_get_policy, mock_role, mock_role_policy,
        mock_event_rule, mock_event_target
    ):
        """Test that EventBridge event bus is created."""
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.arn = Output.from_input('arn:aws:lambda:us-east-2:123456789012:function:test')
        mock_lambda_instance.name = Output.from_input('secret-rotation-test')
        mock_lambda.return_value = mock_lambda_instance

        mock_event_bus_instance = MagicMock()
        mock_event_bus_instance.name = Output.from_input('app-events-test')
        mock_event_bus.return_value = mock_event_bus_instance

        mock_event_rule_instance = MagicMock()
        mock_event_rule_instance.name = Output.from_input('rotation-schedule-test')
        mock_event_rule_instance.arn = Output.from_input('arn:aws:events:us-east-2:123456789012:rule/rotation-schedule-test')
        mock_event_rule.return_value = mock_event_rule_instance

        mock_get_policy.return_value = MagicMock(json='{}')
        mock_role_instance = MagicMock()
        mock_role_instance.id = 'role-123'
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123456789012:role/eventbridge-log-role')
        mock_role.return_value = mock_role_instance

        lambda_role_arn = Output.from_input('arn:aws:iam::123456789012:role/lambda-role')
        log_group_arn = Output.from_input('arn:aws:logs:us-east-2:123456789012:log-group:/aws/events/test')
        kms_key_id = Output.from_input('kms-key-123')

        args = AutomationStackArgs(
            environment_suffix='test',
            lambda_role_arn=lambda_role_arn,
            log_group_arn=log_group_arn,
            kms_key_id=kms_key_id
        )

        try:
            stack = AutomationStack('test-automation', args)
        except Exception:
            pass

        # Verify EventBus was created
        mock_event_bus.assert_called_once()
        # Verify the resource name (first positional argument)
        call_args = mock_event_bus.call_args[0]
        self.assertIn('app-events-test', call_args[0])

    @patch('lib.automation_stack.aws.cloudwatch.EventTarget')
    @patch('lib.automation_stack.aws.cloudwatch.EventRule')
    @patch('lib.automation_stack.aws.iam.RolePolicy')
    @patch('lib.automation_stack.aws.iam.Role')
    @patch('lib.automation_stack.aws.iam.get_policy_document')
    @patch('lib.automation_stack.aws.lambda_.Permission')
    @patch('lib.automation_stack.aws.cloudwatch.EventBus')
    @patch('lib.automation_stack.aws.lambda_.Function')
    def test_automation_stack_creates_rotation_schedule(
        self, mock_lambda, mock_event_bus, mock_lambda_permission,
        mock_get_policy, mock_role, mock_role_policy,
        mock_event_rule, mock_event_target
    ):
        """Test that EventBridge rotation schedule rule is created."""
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.arn = Output.from_input('arn:aws:lambda:us-east-2:123456789012:function:test')
        mock_lambda_instance.name = Output.from_input('secret-rotation-test')
        mock_lambda.return_value = mock_lambda_instance

        mock_event_bus_instance = MagicMock()
        mock_event_bus_instance.name = Output.from_input('app-events-test')
        mock_event_bus.return_value = mock_event_bus_instance

        mock_event_rule_instance = MagicMock()
        mock_event_rule_instance.name = Output.from_input('rotation-schedule-test')
        mock_event_rule_instance.arn = Output.from_input('arn:aws:events:us-east-2:123456789012:rule/rotation-schedule-test')
        mock_event_rule.return_value = mock_event_rule_instance

        mock_get_policy.return_value = MagicMock(json='{}')
        mock_role_instance = MagicMock()
        mock_role_instance.id = 'role-123'
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123456789012:role/eventbridge-log-role')
        mock_role.return_value = mock_role_instance

        lambda_role_arn = Output.from_input('arn:aws:iam::123456789012:role/lambda-role')
        log_group_arn = Output.from_input('arn:aws:logs:us-east-2:123456789012:log-group:/aws/events/test')
        kms_key_id = Output.from_input('kms-key-123')

        args = AutomationStackArgs(
            environment_suffix='test',
            lambda_role_arn=lambda_role_arn,
            log_group_arn=log_group_arn,
            kms_key_id=kms_key_id
        )

        try:
            stack = AutomationStack('test-automation', args)
        except Exception:
            pass

        # Verify EventRule was created - should be called twice (rotation + log forwarding)
        self.assertEqual(mock_event_rule.call_count, 2)

        # Check first rule (rotation schedule)
        first_call = mock_event_rule.call_args_list[0]
        self.assertIn('rotation-schedule-test', first_call[0])
        self.assertEqual(first_call[1]['schedule_expression'], 'rate(30 days)')

    @patch('lib.automation_stack.aws.cloudwatch.EventTarget')
    @patch('lib.automation_stack.aws.cloudwatch.EventRule')
    @patch('lib.automation_stack.aws.iam.RolePolicy')
    @patch('lib.automation_stack.aws.iam.Role')
    @patch('lib.automation_stack.aws.iam.get_policy_document')
    @patch('lib.automation_stack.aws.lambda_.Permission')
    @patch('lib.automation_stack.aws.cloudwatch.EventBus')
    @patch('lib.automation_stack.aws.lambda_.Function')
    def test_automation_stack_creates_lambda_permission(
        self, mock_lambda, mock_event_bus, mock_lambda_permission,
        mock_get_policy, mock_role, mock_role_policy,
        mock_event_rule, mock_event_target
    ):
        """Test that Lambda permission for EventBridge is created."""
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.arn = Output.from_input('arn:aws:lambda:us-east-2:123456789012:function:test')
        mock_lambda_instance.name = Output.from_input('secret-rotation-test')
        mock_lambda.return_value = mock_lambda_instance

        mock_event_bus_instance = MagicMock()
        mock_event_bus_instance.name = Output.from_input('app-events-test')
        mock_event_bus.return_value = mock_event_bus_instance

        mock_event_rule_instance = MagicMock()
        mock_event_rule_instance.name = Output.from_input('rotation-schedule-test')
        mock_event_rule_instance.arn = Output.from_input('arn:aws:events:us-east-2:123456789012:rule/rotation-schedule-test')
        mock_event_rule.return_value = mock_event_rule_instance

        mock_get_policy.return_value = MagicMock(json='{}')
        mock_role_instance = MagicMock()
        mock_role_instance.id = 'role-123'
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123456789012:role/eventbridge-log-role')
        mock_role.return_value = mock_role_instance

        lambda_role_arn = Output.from_input('arn:aws:iam::123456789012:role/lambda-role')
        log_group_arn = Output.from_input('arn:aws:logs:us-east-2:123456789012:log-group:/aws/events/test')
        kms_key_id = Output.from_input('kms-key-123')

        args = AutomationStackArgs(
            environment_suffix='test',
            lambda_role_arn=lambda_role_arn,
            log_group_arn=log_group_arn,
            kms_key_id=kms_key_id
        )

        try:
            stack = AutomationStack('test-automation', args)
        except Exception:
            pass

        # Verify Lambda permission was created
        mock_lambda_permission.assert_called_once()
        call_kwargs = mock_lambda_permission.call_args[1]
        self.assertEqual(call_kwargs['action'], 'lambda:InvokeFunction')
        self.assertEqual(call_kwargs['principal'], 'events.amazonaws.com')

    @patch('lib.automation_stack.aws.cloudwatch.EventTarget')
    @patch('lib.automation_stack.aws.cloudwatch.EventRule')
    @patch('lib.automation_stack.aws.iam.RolePolicy')
    @patch('lib.automation_stack.aws.iam.Role')
    @patch('lib.automation_stack.aws.iam.get_policy_document')
    @patch('lib.automation_stack.aws.lambda_.Permission')
    @patch('lib.automation_stack.aws.cloudwatch.EventBus')
    @patch('lib.automation_stack.aws.lambda_.Function')
    def test_automation_stack_creates_eventbridge_log_role(
        self, mock_lambda, mock_event_bus, mock_lambda_permission,
        mock_get_policy, mock_role, mock_role_policy,
        mock_event_rule, mock_event_target
    ):
        """Test that EventBridge log role is created."""
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.arn = Output.from_input('arn:aws:lambda:us-east-2:123456789012:function:test')
        mock_lambda_instance.name = Output.from_input('secret-rotation-test')
        mock_lambda.return_value = mock_lambda_instance

        mock_event_bus_instance = MagicMock()
        mock_event_bus_instance.name = Output.from_input('app-events-test')
        mock_event_bus.return_value = mock_event_bus_instance

        mock_event_rule_instance = MagicMock()
        mock_event_rule_instance.name = Output.from_input('rotation-schedule-test')
        mock_event_rule_instance.arn = Output.from_input('arn:aws:events:us-east-2:123456789012:rule/rotation-schedule-test')
        mock_event_rule.return_value = mock_event_rule_instance

        mock_get_policy.return_value = MagicMock(json='{}')
        mock_role_instance = MagicMock()
        mock_role_instance.id = 'role-123'
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123456789012:role/eventbridge-log-role')
        mock_role.return_value = mock_role_instance

        lambda_role_arn = Output.from_input('arn:aws:iam::123456789012:role/lambda-role')
        log_group_arn = Output.from_input('arn:aws:logs:us-east-2:123456789012:log-group:/aws/events/test')
        kms_key_id = Output.from_input('kms-key-123')

        args = AutomationStackArgs(
            environment_suffix='test',
            lambda_role_arn=lambda_role_arn,
            log_group_arn=log_group_arn,
            kms_key_id=kms_key_id
        )

        try:
            stack = AutomationStack('test-automation', args)
        except Exception:
            pass

        # Verify EventBridge log role was created
        mock_role.assert_called_once()
        # The first positional argument is the resource name in Pulumi
        call_args = mock_role.call_args[0]
        self.assertEqual(call_args[0], 'eventbridge-log-role-test')

    def test_automation_stack_configuration_parameters(self):
        """Test that AutomationStack args are configured correctly."""
        lambda_role_arn = Output.from_input('arn:aws:iam::123456789012:role/lambda-role')
        log_group_arn = Output.from_input('arn:aws:logs:us-east-2:123456789012:log-group:/aws/events/test')
        kms_key_id = Output.from_input('kms-key-123')

        args = AutomationStackArgs(
            environment_suffix='test',
            lambda_role_arn=lambda_role_arn,
            log_group_arn=log_group_arn,
            kms_key_id=kms_key_id
        )

        # Verify all parameters are set
        self.assertEqual(args.environment_suffix, 'test')
        self.assertIsNotNone(args.lambda_role_arn)
        self.assertIsNotNone(args.log_group_arn)
        self.assertIsNotNone(args.kms_key_id)


class TestAutomationStackImports(unittest.TestCase):
    """Test that all required classes can be imported."""

    def test_automation_stack_class_exists(self):
        """Test that AutomationStack class exists."""
        from lib.automation_stack import AutomationStack
        self.assertIsNotNone(AutomationStack)

    def test_automation_stack_args_class_exists(self):
        """Test that AutomationStackArgs class exists."""
        from lib.automation_stack import AutomationStackArgs
        self.assertIsNotNone(AutomationStackArgs)


if __name__ == '__main__':
    unittest.main()
