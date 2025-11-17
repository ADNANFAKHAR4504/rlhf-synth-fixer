"""Unit tests for IAM Roles Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, TerraformStack  # noqa: E402
from lib.iam_roles import IamRolesStack  # noqa: E402


class TestIamRolesStack:
    """Test suite for IAM Roles Stack."""

    def test_iam_roles_stack_instantiates_successfully(self):
        """IAM roles stack instantiates successfully."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        log_arns = [
            "arn:aws:logs:us-east-1:123456789012:log-group:/ecs/test:*"
        ]
        stack = IamRolesStack(
            parent_stack,
            "test_iam",
            environment_suffix="test",
            aws_region="us-east-1",
            log_group_arns=log_arns,
        )

        assert stack is not None
        assert hasattr(stack, 'task_execution_role')
        assert hasattr(stack, 'task_role')

    def test_iam_roles_stack_creates_task_execution_role(self):
        """IAM roles stack creates task execution role."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        log_arns = [
            "arn:aws:logs:us-east-1:123456789012:log-group:/ecs/test:*"
        ]
        stack = IamRolesStack(
            parent_stack,
            "test_iam",
            environment_suffix="test",
            aws_region="us-east-1",
            log_group_arns=log_arns,
        )

        assert stack.task_execution_role is not None
        assert hasattr(stack.task_execution_role, 'arn')

    def test_iam_roles_stack_creates_task_role(self):
        """IAM roles stack creates task role."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        log_arns = [
            "arn:aws:logs:us-east-1:123456789012:log-group:/ecs/test:*"
        ]
        stack = IamRolesStack(
            parent_stack,
            "test_iam",
            environment_suffix="test",
            aws_region="us-east-1",
            log_group_arns=log_arns,
        )

        assert stack.task_role is not None
        assert hasattr(stack.task_role, 'arn')

    def test_iam_roles_stack_exports_task_execution_role_arn(self):
        """IAM roles stack exports task execution role ARN."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        log_arns = [
            "arn:aws:logs:us-east-1:123456789012:log-group:/ecs/test:*"
        ]
        stack = IamRolesStack(
            parent_stack,
            "test_iam",
            environment_suffix="test",
            aws_region="us-east-1",
            log_group_arns=log_arns,
        )

        arn = stack.task_execution_role_arn
        assert arn is not None
        # Tokens are synthesized references, just verify it exists
        assert isinstance(arn, str)

    def test_iam_roles_stack_exports_task_role_arn(self):
        """IAM roles stack exports task role ARN."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        log_arns = [
            "arn:aws:logs:us-east-1:123456789012:log-group:/ecs/test:*"
        ]
        stack = IamRolesStack(
            parent_stack,
            "test_iam",
            environment_suffix="test",
            aws_region="us-east-1",
            log_group_arns=log_arns,
        )

        arn = stack.task_role_arn
        assert arn is not None
        # Tokens are synthesized references, just verify it exists
        assert isinstance(arn, str)

    def test_iam_roles_stack_with_multiple_log_groups(self):
        """IAM roles stack works with multiple log group ARNs."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        log_arns = [
            "arn:aws:logs:us-east-1:123456789012:log-group:/ecs/service1:*",
            "arn:aws:logs:us-east-1:123456789012:log-group:/ecs/service2:*",
            "arn:aws:logs:us-east-1:123456789012:log-group:/ecs/service3:*",
        ]
        stack = IamRolesStack(
            parent_stack,
            "test_iam",
            environment_suffix="test",
            aws_region="us-east-1",
            log_group_arns=log_arns,
        )

        assert stack is not None
        assert stack.task_execution_role is not None
        assert stack.task_role is not None

    def test_iam_roles_stack_with_different_region(self):
        """IAM roles stack works with different AWS region."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        log_arns = [
            "arn:aws:logs:us-west-2:123456789012:log-group:/ecs/test:*"
        ]
        stack = IamRolesStack(
            parent_stack,
            "test_iam",
            environment_suffix="prod",
            aws_region="us-west-2",
            log_group_arns=log_arns,
        )

        assert stack is not None
        assert stack.task_execution_role is not None
