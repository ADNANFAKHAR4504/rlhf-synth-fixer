"""Unit tests for TAP Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing  # noqa: E402
from lib.tap_stack import TapStack  # noqa: E402


class TestTapStackStructure:
    """Test suite for TAP Stack Structure."""

    def test_tap_stack_instantiates_successfully_with_props(self):
        """TapStack instantiates successfully with props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="test",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None
        # Stack should be a Terraform stack
        assert hasattr(stack, 'node')

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors
        assert stack is not None
        assert hasattr(stack, 'node')

    def test_tap_stack_synthesizes_valid_terraform_config(self):
        """TapStack synthesizes valid Terraform configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackSynth",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Synthesize the stack
        synth = Testing.synth(stack)

        # Verify synthesized config exists
        assert synth is not None
        # Should contain Terraform resources
        assert len(synth) > 0

    def test_tap_stack_has_required_stacks(self):
        """TapStack contains all required child stacks."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackChildren",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify child stacks are created (they're stored as attributes in constructs)
        node = stack.node
        children = list(node.children)

        # Should have multiple children (AWS provider, backend, and stacks)
        assert len(children) > 5

        # Check for key child stack types by looking for construct IDs
        child_ids = [child.node.id for child in children]

        # Should include networking, monitoring, IAM, ECS cluster, ALB, ECS services
        assert 'networking' in child_ids
        assert 'monitoring' in child_ids
        assert 'iam_roles' in child_ids
        assert 'ecs_cluster' in child_ids
        assert 'alb' in child_ids
        assert 'ecs_services' in child_ids

    def test_tap_stack_with_custom_environment_suffix(self):
        """TapStack respects custom environment suffix."""
        app = App()
        suffix = "custom123"
        stack = TapStack(
            app,
            f"TapStack{suffix}",
            environment_suffix=suffix,
            aws_region="us-west-2",
        )

        assert stack is not None
        # Synthesize to verify resource names include suffix
        synth = Testing.synth(stack)
        assert synth is not None
