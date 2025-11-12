"""
Unit tests for TapStack.
Tests the main coordination stack configuration.
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

    @mark.it("creates environment suffix output")
    def test_tap_stack_creates_output(self):
        """Test that TapStack creates environment suffix output."""
        stack = TapStack(
            self.app,
            "TestStack",
            props=TapStackProps(environment_suffix="test")
        )

        template = Template.from_stack(stack)

        # Verify CfnOutput for environment suffix exists
        template.has_output(
            "EnvironmentSuffix",
            {
                "Value": "test",
                "Export": {
                    "Name": "environment-suffix-test"
                }
            }
        )

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_tap_stack_defaults_to_dev(self):
        """Test that TapStack defaults to 'dev' environment suffix."""
        stack = TapStack(self.app, "TestStack")

        template = Template.from_stack(stack)

        # Should default to 'dev'
        template.has_output(
            "EnvironmentSuffix",
            {
                "Value": "dev"
            }
        )

    @mark.it("does not create nested AWS resources")
    def test_tap_stack_no_nested_resources(self):
        """Test that TapStack doesn't create AWS resources directly."""
        stack = TapStack(
            self.app,
            "TestStack",
            props=TapStackProps(environment_suffix="test")
        )

        template = Template.from_stack(stack)

        # Should only have outputs, no AWS resources
        # Check that common resource types are NOT present
        template.resource_count_is("AWS::EC2::VPC", 0)
        template.resource_count_is("AWS::RDS::DBCluster", 0)
        template.resource_count_is("AWS::Lambda::Function", 0)
        template.resource_count_is("AWS::S3::Bucket", 0)

    @mark.it("accepts custom environment suffix via props")
    def test_custom_environment_suffix(self):
        """Test that TapStack accepts custom environment suffix."""
        stack = TapStack(
            self.app,
            "TestStack",
            props=TapStackProps(environment_suffix="production")
        )

        template = Template.from_stack(stack)

        template.has_output(
            "EnvironmentSuffix",
            {
                "Value": "production"
            }
        )
