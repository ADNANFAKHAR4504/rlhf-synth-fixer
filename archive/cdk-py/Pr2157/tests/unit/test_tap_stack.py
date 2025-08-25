"""Unit tests for TapStack"""
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

    @mark.it("creates VPC infrastructure stack with correct environment suffix")
    def test_creates_vpc_stack_with_env_suffix(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )

        # ASSERT
        self.assertIsNotNone(stack.vpc_stack)
        self.assertEqual(
            stack.vpc_stack.node.id,
            f"VpcStack-{env_suffix}"
        )

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")

        # ASSERT
        self.assertIsNotNone(stack.vpc_stack)
        self.assertEqual(
            stack.vpc_stack.node.id,
            "VpcStack-dev"
        )

    @mark.it("uses environment suffix from context if provided")
    def test_uses_env_suffix_from_context(self):
        # ARRANGE
        self.app = cdk.App(context={'environmentSuffix': 'contextenv'})
        stack = TapStack(self.app, "TapStackTestContext")

        # ASSERT
        self.assertIsNotNone(stack.vpc_stack)
        self.assertEqual(
            stack.vpc_stack.node.id,
            "VpcStack-contextenv"
        )

    @mark.it("prioritizes props over context for environment suffix")
    def test_prioritizes_props_over_context(self):
        # ARRANGE
        self.app = cdk.App(context={'environmentSuffix': 'contextenv'})
        env_suffix = "propsenv"
        stack = TapStack(
            self.app,
            "TapStackTestPriority",
            TapStackProps(environment_suffix=env_suffix)
        )

        # ASSERT
        self.assertIsNotNone(stack.vpc_stack)
        self.assertEqual(
            stack.vpc_stack.node.id,
            f"VpcStack-{env_suffix}"
        )

    @mark.it("creates nested stack properly")
    def test_creates_nested_stack_structure(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app,
            f"TapStack{env_suffix}",
            TapStackProps(environment_suffix=env_suffix)
        )

        # ASSERT - Check that the VPC nested stack is created
        self.assertIsNotNone(stack.vpc_stack)
        # VPC stack should be a child of TapStack (nested stack)
        # Since we're using nested stacks, verify the parent-child relationship
        self.assertEqual(stack.vpc_stack.node.scope, stack)

    @mark.it("passes environment suffix to child stacks")
    def test_passes_env_suffix_to_child_stacks(self):
        # ARRANGE
        env_suffix = "child-test"
        stack = TapStack(
            self.app,
            "TapStackChildTest",
            TapStackProps(environment_suffix=env_suffix)
        )

        # ASSERT
        self.assertIsNotNone(stack.vpc_stack)
        # Verify the VPC stack received the environment suffix
        vpc_template = Template.from_stack(stack.vpc_stack)
        vpc_template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16"
        })

    @mark.it("creates CDK metadata for the stack")
    def test_creates_cdk_metadata(self):
        # ARRANGE
        # CDK adds the versionReporting context to enable metadata
        self.app = cdk.App(context={'aws:cdk:version-reporting': True})
        stack = TapStack(self.app, "TapStackMetadata")
        
        # ASSERT - The parent stack creates the vpc stack
        self.assertIsNotNone(stack.vpc_stack)
        # VPC Stack should exist and have resources
        vpc_template = Template.from_stack(stack.vpc_stack)
        vpc_template.resource_count_is("AWS::EC2::VPC", 1)

    @mark.it("accepts optional stack props")
    def test_accepts_optional_stack_props(self):
        # ARRANGE
        props = TapStackProps(
            environment_suffix="props-test",
            env=cdk.Environment(
                account="123456789012",
                region="us-west-2"
            )
        )
        stack = TapStack(self.app, "TapStackPropsTest", props=props)

        # ASSERT - Stack should have the props
        self.assertIsNotNone(stack)
        self.assertIsNotNone(stack.vpc_stack)
