import unittest
from unittest.mock import MagicMock, patch, PropertyMock
import aws_cdk as cdk
from aws_cdk import App, Stack
from aws_cdk.assertions import Template, Match
import sys
import os

# Add lib to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from lib.tap_stack import TapStack
from lib.vpc_stack import VpcStack


class TestTapStack(unittest.TestCase):
    """Test suite for TapStack class."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = App()
        self.environment_suffix = "test"

    def test_tap_stack_creation_with_basic_params(self):
        """Test TapStack creation with basic parameters."""
        stack = TapStack(
            self.app,
            "TestTapStack",
            environment_suffix=self.environment_suffix
        )

        # Verify stack is created
        self.assertIsInstance(stack, Stack)
        self.assertIsNotNone(stack.vpc_stack)
        self.assertIsInstance(stack.vpc_stack, VpcStack)

    def test_tap_stack_with_environment_params(self):
        """Test TapStack with environment parameters."""
        env = cdk.Environment(account="123456789012", region="us-east-1")
        stack = TapStack(
            self.app,
            "TestTapStackEnv",
            environment_suffix="prod",
            env=env
        )

        # Verify stack properties
        self.assertIsNotNone(stack)
        self.assertEqual(stack.vpc_stack.environment_suffix, "prod")

    def test_tap_stack_with_description(self):
        """Test TapStack with description."""
        description = "Test Payment Processing Stack"
        stack = TapStack(
            self.app,
            "TestTapStackDesc",
            environment_suffix=self.environment_suffix,
            description=description
        )

        # Verify stack is created with description
        self.assertIsInstance(stack, Stack)

    def test_vpc_stack_integration(self):
        """Test VpcStack is properly integrated."""
        stack = TapStack(
            self.app,
            "TestTapStackVpc",
            environment_suffix="integration"
        )

        # Verify VpcStack is created as nested stack
        self.assertIsNotNone(stack.vpc_stack)
        self.assertEqual(stack.vpc_stack.environment_suffix, "integration")

    def test_tap_stack_synthesizes(self):
        """Test TapStack synthesizes to CloudFormation template."""
        stack = TapStack(
            self.app,
            "TestTapStackSynth",
            environment_suffix=self.environment_suffix
        )

        # Verify template can be synthesized
        template = Template.from_stack(stack.vpc_stack)
        self.assertIsNotNone(template)

    def test_tap_stack_with_multiple_kwargs(self):
        """Test TapStack with multiple kwargs passed through."""
        stack = TapStack(
            self.app,
            "TestTapStackKwargs",
            environment_suffix="staging",
            stack_name="CustomStackName",
            termination_protection=True,
            tags={"Team": "Infrastructure", "Cost": "Center123"}
        )

        # Verify stack is created with all kwargs
        self.assertIsNotNone(stack)
        self.assertIsNotNone(stack.vpc_stack)

    def test_tap_stack_vpc_stack_naming(self):
        """Test VpcStack has correct construct ID."""
        stack = TapStack(
            self.app,
            "TestTapStackNaming",
            environment_suffix="dev"
        )

        # Verify VpcStack construct ID
        vpc_stack_construct = stack.node.find_child("VpcStack")
        self.assertIsNotNone(vpc_stack_construct)


if __name__ == "__main__":
    unittest.main()