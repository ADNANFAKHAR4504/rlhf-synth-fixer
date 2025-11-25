"""
Unit tests for TapStack
Tests the main orchestration stack for multi-region database disaster recovery.
"""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates stack with correct environment suffix")
    def test_creates_stack_with_env_suffix(self):
        """Test that stack is created with proper environment suffix"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )

        # ASSERT
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, env_suffix)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test that environment suffix defaults to 'dev' when not specified"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")

        # ASSERT
        self.assertEqual(stack.environment_suffix, "dev")

    @mark.it("creates database stack with correct suffix")
    def test_creates_database_stack(self):
        """Test that DatabaseStack is instantiated within TapStack"""
        # ARRANGE
        env_suffix = "unittest"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )

        # ASSERT
        self.assertIsNotNone(stack.database_stack)

    @mark.it("synthesizes without errors")
    def test_synthesizes_without_errors(self):
        """Test that the stack can be synthesized successfully"""
        # ARRANGE
        env_suffix = "synth"
        stack = TapStack(
            self.app,
            "TapStackSynth",
            TapStackProps(environment_suffix=env_suffix)
        )

        # ACT
        template = Template.from_stack(stack)

        # ASSERT
        self.assertIsNotNone(template)

    @mark.it("uses context environment suffix when provided")
    def test_uses_context_env_suffix(self):
        """Test that stack uses environment suffix from CDK context"""
        # ARRANGE
        app_with_context = cdk.App(context={"environmentSuffix": "ctx"})
        stack = TapStack(app_with_context, "TapStackContext")

        # ASSERT
        self.assertEqual(stack.environment_suffix, "ctx")

    @mark.it("prioritizes props over context for environment suffix")
    def test_prioritizes_props_over_context(self):
        """Test that props environment suffix takes precedence over context"""
        # ARRANGE
        app_with_context = cdk.App(context={"environmentSuffix": "ctx"})
        stack = TapStack(
            app_with_context,
            "TapStackProps",
            TapStackProps(environment_suffix="props")
        )

        # ASSERT
        self.assertEqual(stack.environment_suffix, "props")
