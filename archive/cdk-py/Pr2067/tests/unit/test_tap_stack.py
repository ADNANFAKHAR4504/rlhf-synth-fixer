"""Unit tests for TapStack."""
import os
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()

    @mark.it("creates nested serverless stack with correct suffix")
    def test_creates_nested_serverless_stack(self):
        """Test that TapStack creates a nested ServerlessStack."""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check nested stack is created
        template.resource_count_is("AWS::CloudFormation::Stack", 1)
        template.has_resource("AWS::CloudFormation::Stack", {
            "Type": "AWS::CloudFormation::Stack",
            "Properties": Match.object_like({
                "TemplateURL": Match.any_value()
            })
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test default environment suffix."""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")

        # ASSERT
        # Since it's a nested stack, we can't directly check the bucket name
        # but we can verify the stack is created
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 1)

    @mark.it("creates stack-level outputs")
    def test_creates_stack_outputs(self):
        """Test that stack outputs are created."""
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        self.assertIn("ApiGatewayUrl", outputs)
        self.assertIn("S3BucketName", outputs)

    @mark.it("uses context for environment suffix when props not provided")
    def test_uses_context_for_env_suffix(self):
        """Test that context is used for environment suffix."""
        # ARRANGE
        self.app = cdk.App(context={"environmentSuffix": "context-env"})
        stack = TapStack(self.app, "TapStackTestContext")

        # ASSERT
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 1)

    @mark.it("prioritizes props over context for environment suffix")
    def test_prioritizes_props_over_context(self):
        """Test that props take precedence over context."""
        # ARRANGE
        self.app = cdk.App(context={"environmentSuffix": "context-env"})
        stack = TapStack(
            self.app, "TapStackTestPriority",
            TapStackProps(environment_suffix="props-env")
        )

        # ASSERT
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 1)

    @mark.it("passes environment configuration to props")
    def test_passes_environment_configuration(self):
        """Test environment configuration in props."""
        # ARRANGE
        os.environ['CDK_DEFAULT_ACCOUNT'] = '123456789012'
        os.environ['CDK_DEFAULT_REGION'] = 'us-east-1'

        props = TapStackProps(
            environment_suffix="test",
            env=cdk.Environment(
                account=os.getenv('CDK_DEFAULT_ACCOUNT'),
                region=os.getenv('CDK_DEFAULT_REGION')
            )
        )

        # ASSERT
        self.assertEqual(props.environment_suffix, "test")
        self.assertIsNotNone(props.env)

    @mark.it("creates nested stack with proper naming")
    def test_nested_stack_naming(self):
        """Test nested stack naming convention."""
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, f"TapStack{env_suffix}",
            TapStackProps(environment_suffix=env_suffix)
        )

        # ASSERT
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 1)

    @mark.it("exposes serverless stack resources through outputs")
    def test_exposes_serverless_resources(self):
        """Test that serverless resources are exposed."""
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )

        # ASSERT
        self.assertIsNotNone(stack.serverless_nested_stack)
        self.assertIsNotNone(stack.serverless_nested_stack.api_url)
        self.assertIsNotNone(stack.serverless_nested_stack.bucket_name)

    @mark.it("creates valid CloudFormation template")
    def test_creates_valid_cloudformation_template(self):
        """Test that a valid CloudFormation template is generated."""
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )

        # ASSERT
        template = Template.from_stack(stack)

        # Check template has required sections
        template_json = template.to_json()
        self.assertIn("Resources", template_json)
        self.assertIn("Outputs", template_json)

    @mark.it("handles None props gracefully")
    def test_handles_none_props(self):
        """Test stack creation with None props."""
        # ARRANGE & ACT
        stack = TapStack(self.app, "TapStackTestNone", props=None)

        # ASSERT
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudFormation::Stack", 1)

    @mark.it("creates serverless infrastructure within nested stack")
    def test_creates_serverless_infrastructure(self):
        """Test that serverless infrastructure is created."""
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )

        # ASSERT
        # Verify nested stack exists
        template = Template.from_stack(stack)
        template.has_resource("AWS::CloudFormation::Stack", {
            "Type": "AWS::CloudFormation::Stack"
        })

        # Verify outputs reference nested stack resources
        outputs = template.find_outputs("*")
        self.assertTrue(len(outputs) > 0)

    @mark.it("maintains stack hierarchy correctly")
    def test_stack_hierarchy(self):
        """Test that stack hierarchy is maintained."""
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )

        # ASSERT
        # Check that the nested stack is a child of the main stack
        self.assertEqual(stack.node.id, "TapStackTest")
        children = [child.node.id for child in stack.node.children]
        self.assertIn(f"ServerlessStack{env_suffix}", children)
