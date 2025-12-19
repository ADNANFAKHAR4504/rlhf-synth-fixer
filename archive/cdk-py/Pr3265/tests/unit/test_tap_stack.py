"""Unit tests for the TAP stack."""

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark
from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a nested stack for file processing")
    def test_stack_creates_nested_stack(self):
        """Test that the main stack creates a nested stack."""
        # ARRANGE
        props = TapStackProps(environment_suffix='test')
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Check that nested stack is created
        template.has_resource_properties("AWS::CloudFormation::Stack", {
            "TemplateURL": Match.any_value()
        })

    @mark.it("passes environment suffix to nested stack")
    def test_environment_suffix_passed(self):
        """Test that environment suffix is properly configured."""
        # ARRANGE
        test_suffix = 'unittest'
        props = TapStackProps(environment_suffix=test_suffix)
        stack = TapStack(self.app, "TestStack", props=props)

        # ASSERT - Check stack has the expected structure
        self.assertIsNotNone(stack)
        # The nested stack should be created with the correct suffix - checking for NestedStack type
        from aws_cdk import NestedStack
        nested_stacks = [child for child in stack.node.children
                        if isinstance(child, NestedStack) and 'FileProcessingStack' in child.node.id]
        self.assertEqual(len(nested_stacks), 1)
        self.assertIn(test_suffix, nested_stacks[0].node.id)

    @mark.it("creates stack without errors")
    def test_stack_synthesis(self):
        """Test that the stack can be synthesized without errors."""
        # ARRANGE
        props = TapStackProps(environment_suffix='test')

        # ACT & ASSERT - Should not raise any exceptions
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)

        # Basic validation that template has resources
        template.resource_count_is("AWS::CloudFormation::Stack", 1)

    @mark.it("uses default environment suffix when not provided")
    def test_default_environment_suffix(self):
        """Test that a default environment suffix is used when not provided."""
        # ARRANGE & ACT
        stack = TapStack(self.app, "TestStack")

        # ASSERT
        self.assertIsNotNone(stack)
        # Should have created a nested stack with some suffix - checking for NestedFileProcessingStack class
        from aws_cdk import NestedStack
        nested_stacks = [child for child in stack.node.children
                        if isinstance(child, NestedStack) and 'FileProcessingStack' in child.node.id]
        self.assertEqual(len(nested_stacks), 1)
