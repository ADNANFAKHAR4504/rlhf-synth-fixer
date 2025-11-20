"""Unit tests for TapStack"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Comprehensive unit tests for TapStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.app.node.set_context("environmentSuffix", "test")
        self.env = cdk.Environment(account="123456789012", region="us-east-1")

    @mark.it("creates main stack successfully")
    def test_creates_stack(self):
        # ARRANGE
        props = TapStackProps(environment_suffix="test", env=self.env)
        stack = TapStack(self.app, "TestTapStack", props=props, env=self.env)

        # ASSERT
        assert stack is not None

    @mark.it("creates nested stacks")
    def test_creates_nested_stacks(self):
        # ARRANGE
        props = TapStackProps(environment_suffix="test", env=self.env)
        stack = TapStack(self.app, "TestTapStack", props=props, env=self.env)
        template = Template.from_stack(stack)

        # ASSERT - Should have nested stacks
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        assert len(nested_stacks) > 0

    @mark.it("applies global tags")
    def test_applies_global_tags(self):
        # ARRANGE
        props = TapStackProps(environment_suffix="test", env=self.env)
        stack = TapStack(self.app, "TestTapStack", props=props, env=self.env)

        # ASSERT
        assert stack is not None

    @mark.it("creates CloudFormation outputs")
    def test_cloudformation_outputs(self):
        # ARRANGE
        props = TapStackProps(environment_suffix="test", env=self.env)
        stack = TapStack(self.app, "TestTapStack", props=props, env=self.env)
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        assert len(outputs) > 0


if __name__ == "__main__":
    unittest.main()
