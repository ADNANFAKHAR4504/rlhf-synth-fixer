"""
Unit tests for Tap Stack.

Tests verify the main orchestrator stack configuration.
"""
import pytest
from aws_cdk import App, assertions
from lib.tap_stack import TapStack


class TestTapStack:
    """Test suite for Tap Stack."""

    @pytest.fixture
    def app(self):
        """Create CDK app for testing."""
        return App()

    @pytest.fixture
    def stack(self, app):
        """Create Tap stack instance for testing."""
        return TapStack(
            app,
            "TestTapStack",
            environment_suffix="test",
            env={"region": "us-east-1", "account": "123456789012"}
        )

    def test_stack_created(self, stack):
        """Test that Tap stack is created successfully."""
        assert stack is not None

    def test_vpc_stack_created(self, stack):
        """Test that VPC stack is created within Tap stack."""
        assert stack.vpc_stack is not None

    def test_vpc_accessible(self, stack):
        """Test that VPC is accessible through the nested stack."""
        vpc = stack.vpc_stack.get_vpc
        assert vpc is not None

    def test_stack_synthesizes(self, stack):
        """Test that stack synthesizes without errors."""
        template = assertions.Template.from_stack(stack)
        assert template is not None

    def test_stack_has_vpc_resources(self, stack):
        """Test that stack includes VPC resources."""
        template = assertions.Template.from_stack(stack)

        # Should have VPC resource
        template.resource_count_is("AWS::EC2::VPC", 1)

    def test_stack_has_subnets(self, stack):
        """Test that stack includes subnet resources."""
        template = assertions.Template.from_stack(stack)

        # Should have 9 subnets (3 AZs × 3 types)
        template.resource_count_is("AWS::EC2::Subnet", 9)

    def test_stack_has_nat_gateways(self, stack):
        """Test that stack includes NAT Gateway resources."""
        template = assertions.Template.from_stack(stack)

        # Should have 3 NAT Gateways
        template.resource_count_is("AWS::EC2::NatGateway", 3)

    def test_stack_has_flow_logs(self, stack):
        """Test that stack includes VPC Flow Logs."""
        template = assertions.Template.from_stack(stack)

        # Should have Flow Log resource
        template.resource_count_is("AWS::EC2::FlowLog", 1)

    def test_environment_suffix_propagated(self, stack):
        """Test that environment suffix is propagated to VPC stack."""
        assert stack.vpc_stack.environment_suffix == "test"


class TestTapStackConfiguration:
    """Test suite for Tap Stack configuration variations."""

    def test_stack_with_production_suffix(self):
        """Test stack with production environment suffix."""
        app = App()
        stack = TapStack(
            app,
            "ProdTapStack",
            environment_suffix="prod",
            env={"region": "us-east-1", "account": "123456789012"}
        )

        assert stack is not None
        assert stack.vpc_stack.environment_suffix == "prod"

    def test_stack_with_staging_suffix(self):
        """Test stack with staging environment suffix."""
        app = App()
        stack = TapStack(
            app,
            "StagingTapStack",
            environment_suffix="staging",
            env={"region": "us-east-1", "account": "123456789012"}
        )

        assert stack is not None
        assert stack.vpc_stack.environment_suffix == "staging"

    def test_multiple_stacks(self):
        """Test creating multiple Tap stacks in same app."""
        app = App()

        stack1 = TapStack(
            app,
            "TapStack1",
            environment_suffix="env1",
            env={"region": "us-east-1", "account": "123456789012"}
        )

        stack2 = TapStack(
            app,
            "TapStack2",
            environment_suffix="env2",
            env={"region": "us-east-1", "account": "123456789012"}
        )

        assert stack1 is not None
        assert stack2 is not None
        assert stack1.vpc_stack != stack2.vpc_stack


class TestTapStackEdgeCases:
    """Test edge cases for Tap Stack."""

    def test_stack_requires_environment_suffix(self):
        """Test that stack requires environment_suffix parameter."""
        app = App()

        with pytest.raises(TypeError):
            # Should fail without environment_suffix
            TapStack(app, "TestStack")

    def test_stack_with_empty_suffix(self):
        """Test stack with empty string suffix."""
        app = App()

        # Should succeed - empty suffix is technically valid
        stack = TapStack(
            app,
            "EmptyStack",
            environment_suffix="",
            env={"region": "us-east-1", "account": "123456789012"}
        )

        assert stack is not None

    def test_stack_with_special_characters_suffix(self):
        """Test stack with special characters in suffix."""
        app = App()

        # CDK should handle hyphens and alphanumeric
        stack = TapStack(
            app,
            "SpecialStack",
            environment_suffix="test-env-123",
            env={"region": "us-east-1", "account": "123456789012"}
        )

        assert stack is not None
        assert stack.vpc_stack.environment_suffix == "test-env-123"
