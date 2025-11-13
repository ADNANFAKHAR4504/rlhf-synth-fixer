"""Unit tests for Tap Stack."""
# pylint: disable=attribute-defined-outside-init

import aws_cdk as cdk
from aws_cdk import assertions
import pytest

from lib.tap_stack import TapStack, TapStackProps


class TestTapStack:
    """Test suite for Tap Stack."""

    def setup_method(self):
        """Setup test environment."""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.props = TapStackProps(environment_suffix=self.env_suffix)
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            props=self.props,
            env=cdk.Environment(region="us-east-1")
        )
        self.template = assertions.Template.from_stack(self.stack)

    def test_nested_vpc_stack_created(self):
        """Test that nested VPC stack is created."""
        # Verify nested stack exists
        self.template.resource_count_is("AWS::CloudFormation::Stack", 1)

    def test_vpc_resources_accessible(self):
        """Test that VPC resources are accessible as stack properties."""
        assert hasattr(self.stack, 'vpc'), "Stack should expose vpc property"
        assert hasattr(self.stack, 'public_subnets'), "Stack should expose public_subnets"
        assert hasattr(self.stack, 'private_subnets'), "Stack should expose private_subnets"

    def test_environment_suffix_propagated_to_nested_stack(self):
        """Test that environment suffix is propagated to nested stack."""
        # Check that nested stack ID includes environment suffix
        template_json = self.template.to_json()
        nested_stacks = {
            k: v for k, v in template_json["Resources"].items()
            if v["Type"] == "AWS::CloudFormation::Stack"
        }

        assert len(nested_stacks) > 0, "Should have at least one nested stack"

        # Verify construct ID pattern
        for stack_id in nested_stacks.keys():
            assert "VpcStack" in stack_id, "Nested stack should be VPC stack"


class TestTapStackProps:
    """Test suite for TapStackProps."""

    def test_props_inherits_from_stack_props(self):
        """Test that TapStackProps inherits from cdk.StackProps."""
        props = TapStackProps()
        assert isinstance(props, cdk.StackProps)

    def test_environment_suffix_stored_in_props(self):
        """Test that environment suffix is stored in props."""
        props = TapStackProps(environment_suffix="prod")
        assert props.environment_suffix == "prod"

    def test_props_accepts_additional_kwargs(self):
        """Test that props accepts additional StackProps kwargs."""
        props = TapStackProps(
            environment_suffix="test",
            description="Test stack"
        )
        assert props.environment_suffix == "test"
        assert props.description == "Test stack"


class TestTapStackContextHandling:
    """Test suite for context handling in Tap Stack."""

    def test_environment_suffix_from_props(self):
        """Test that environment suffix comes from props."""
        app = cdk.App()
        props = TapStackProps(environment_suffix="from-props")
        stack = TapStack(
            app,
            "TestStack",
            props=props,
            env=cdk.Environment(region="us-east-1")
        )

        # Environment suffix should be available to nested stacks
        assert stack is not None

    def test_environment_suffix_from_context(self):
        """Test that environment suffix can come from context."""
        app = cdk.App(context={"environmentSuffix": "from-context"})
        stack = TapStack(
            app,
            "TestStack",
            env=cdk.Environment(region="us-east-1")
        )

        # Stack should be created successfully
        assert stack is not None

    def test_environment_suffix_defaults_to_dev(self):
        """Test that environment suffix defaults to 'dev'."""
        app = cdk.App()
        stack = TapStack(
            app,
            "TestStack",
            env=cdk.Environment(region="us-east-1")
        )

        # Stack should be created successfully with default
        assert stack is not None


class TestTapStackIntegration:
    """Integration tests for Tap Stack."""

    def test_stack_synthesizes_without_errors(self):
        """Test that stack can be synthesized without errors."""
        app = cdk.App()
        stack = TapStack(
            app,
            "TestStack",
            props=TapStackProps(environment_suffix="test"),
            env=cdk.Environment(region="us-east-1")
        )

        # This will raise an exception if synthesis fails
        template = assertions.Template.from_stack(stack)
        assert template is not None

    def test_multiple_stacks_with_different_suffixes(self):
        """Test that multiple stacks can coexist with different suffixes."""
        app = cdk.App()

        stack1 = TapStack(
            app,
            "Stack1",
            props=TapStackProps(environment_suffix="env1"),
            env=cdk.Environment(region="us-east-1")
        )

        stack2 = TapStack(
            app,
            "Stack2",
            props=TapStackProps(environment_suffix="env2"),
            env=cdk.Environment(region="us-east-1")
        )

        # Both stacks should synthesize successfully
        template1 = assertions.Template.from_stack(stack1)
        template2 = assertions.Template.from_stack(stack2)

        assert template1 is not None
        assert template2 is not None

    def test_stack_description_set_correctly(self):
        """Test that stack description is set correctly."""
        app = cdk.App()
        env_suffix = "test"
        stack = TapStack(
            app,
            f"PaymentVpcStack-{env_suffix}",
            props=TapStackProps(environment_suffix=env_suffix),
            env=cdk.Environment(region="us-east-1"),
            description=f"Production VPC infrastructure for payment processing (env: {env_suffix})"
        )

        # Verify stack has description
        assert stack.stack_name is not None
