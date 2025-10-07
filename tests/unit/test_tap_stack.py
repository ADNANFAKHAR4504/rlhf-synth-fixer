import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template

from pathlib import Path
import sys
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates the high availability nested stack with default tags")
    def test_creates_nested_stack_with_default_tags(self):
        stack = TapStack(self.app, "TapStackUnderTest")
        template = Template.from_stack(stack)

        resources = template.find_resources("AWS::CloudFormation::Stack")
        self.assertEqual(len(resources), 1)

        nested = next(iter(resources.values()))
        tags = {tag["Key"]: tag["Value"] for tag in nested["Properties"]["Tags"]}

        self.assertEqual(tags.get("Environment"), "dev")
        self.assertEqual(tags.get("Project"), "TapProject")
        self.assertEqual(tags.get("Owner"), "TapTeam")

    @mark.it("applies custom props to nested stack tags")
    def test_nested_stack_uses_custom_props(self):
        props = TapStackProps(
            environment_suffix="qa",
            environment="staging",
            project_name="MyApp",
            owner="TeamX"
        )

        stack = TapStack(self.app, "TapStackCustomProps", props=props)
        template = Template.from_stack(stack)

        resources = template.find_resources("AWS::CloudFormation::Stack")
        self.assertEqual(len(resources), 1)

        nested = next(iter(resources.values()))
        tags = {tag["Key"]: tag["Value"] for tag in nested["Properties"]["Tags"]}

        self.assertEqual(tags.get("Environment"), "staging")
        self.assertEqual(tags.get("Project"), "MyApp")
        self.assertEqual(tags.get("Owner"), "TeamX")

    @mark.it("provisions key resources inside the high availability stack")
    def test_high_availability_nested_stack_resources(self):
        stack = TapStack(self.app, "TapStackResources")
        nested_stack = stack.high_availability_web_app
        template = Template.from_stack(nested_stack)

        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.resource_count_is("AWS::Lambda::Function", 1)

        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres",
            "EngineVersion": "16.9"
        })

        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": Match.object_like({
                    "DB_INSTANCE_ID": Match.any_value(),
                    "ENVIRONMENT": "dev",
                    "OWNER": "TapTeam"
                })
            }
        })

        outputs = template.to_json().get("Outputs", {})
        self.assertIn("ALBDNSName", outputs)
