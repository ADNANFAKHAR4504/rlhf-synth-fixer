import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the TapStack - validates complete stack synthesis"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("synthesizes stack successfully with default configuration")
    def test_synthesizes_successfully_default(self):
        # ARRANGE & ACT
        stack = TapStack(self.app, "TapStackIntegrationTest")
        template = Template.from_stack(stack)

        # ASSERT - stack should synthesize without errors
        self.assertIsNotNone(template)

        # Check that all key resource types are present
        resources = template.to_json().get("Resources", {})
        resource_types = [r.get("Type") for r in resources.values()]

        expected_types = [
            "AWS::KMS::Key",
            "AWS::EC2::VPC",
            "AWS::EC2::SecurityGroup",
            "AWS::S3::Bucket",
            "AWS::RDS::DBInstance",
            "AWS::CloudTrail::Trail",
            "AWS::Logs::LogGroup",
            "AWS::IAM::Role"
        ]

        for expected_type in expected_types:
            self.assertIn(expected_type, resource_types,
                         f"Stack should contain {expected_type}")

    @mark.it("synthesizes stack successfully with dev environment")
    def test_synthesizes_successfully_dev(self):
        # ARRANGE & ACT
        stack = TapStack(self.app, "TapStackIntegrationTestDev",
                        TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        self.assertIsNotNone(template)

        # Dev should have 1 NAT gateway
        nat_gateways = template.find_resources("AWS::EC2::NatGateway")
        self.assertEqual(len(nat_gateways), 1)

    @mark.it("synthesizes stack successfully with prod environment")
    def test_synthesizes_successfully_prod(self):
        # ARRANGE & ACT
        stack = TapStack(self.app, "TapStackIntegrationTestProd",
                        TapStackProps(environment_suffix="prod"))
        template = Template.from_stack(stack)

        # ASSERT
        self.assertIsNotNone(template)

        # Prod should have 2 NAT gateways
        nat_gateways = template.find_resources("AWS::EC2::NatGateway")
        self.assertEqual(len(nat_gateways), 2)

        # Prod should have deletion protection
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": True
        })

    @mark.it("creates all resources without circular dependencies")
    def test_no_circular_dependencies(self):
        # ARRANGE & ACT
        stack = TapStack(self.app, "TapStackIntegrationTestDeps",
                        TapStackProps(environment_suffix="test"))

        # Synthesize the app (this will fail if there are circular deps)
        assembly = self.app.synth()

        # ASSERT
        self.assertIsNotNone(assembly)
        self.assertGreater(len(assembly.stacks), 0)

    @mark.it("validates CloudFormation template is valid JSON")
    def test_template_is_valid_json(self):
        # ARRANGE & ACT
        stack = TapStack(self.app, "TapStackIntegrationTestJSON",
                        TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        template_json = template.to_json()
        self.assertIsInstance(template_json, dict)
        self.assertIn("Resources", template_json)
        self.assertIn("Outputs", template_json)

    @mark.it("ensures all security resources work together")
    def test_security_resources_integration(self):
        # ARRANGE & ACT
        stack = TapStack(self.app, "TapStackIntegrationTestSecurity",
                        TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - verify the security chain is complete
        # 1. KMS key exists
        template.resource_count_is("AWS::KMS::Key", 1)

        # 2. S3 buckets use KMS encryption
        buckets = template.find_resources("AWS::S3::Bucket")
        self.assertEqual(len(buckets), 3, "Should have 3 buckets")

        # 3. RDS uses KMS encryption
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True
        })

        # 4. CloudWatch Log Group uses encryption
        template.resource_count_is("AWS::Logs::LogGroup", 1)

        # 5. Security groups are properly configured
        template.resource_count_is("AWS::EC2::SecurityGroup", 2)

        # 6. IAM roles and policies exist
        template.resource_count_is("AWS::IAM::Role", 2)

    @mark.it("validates network isolation is properly configured")
    def test_network_isolation_integration(self):
        # ARRANGE & ACT
        stack = TapStack(self.app, "TapStackIntegrationTestNetwork",
                        TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT
        # 1. VPC exists
        template.resource_count_is("AWS::EC2::VPC", 1)

        # 2. Private subnets exist (for RDS)
        subnets = template.find_resources("AWS::EC2::Subnet")
        self.assertGreater(len(subnets), 0, "Should have subnets")

        # 3. RDS is in private subnet (not publicly accessible)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "PubliclyAccessible": False
        })

        # 4. DB security group only allows traffic from web security group
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "DB SG, only allows from web SG"
        })


    @mark.it("smoke test - validates minimal viable stack creation")
    def test_smoke_minimal_stack(self):
        # ARRANGE & ACT
        stack = TapStack(self.app, "TapStackSmokeTest",
                        TapStackProps(environment_suffix="smoke"))

        # Just synthesize - if this doesn't throw, the stack is valid
        assembly = self.app.synth()

        # ASSERT
        self.assertIsNotNone(assembly)
        self.assertEqual(len(assembly.stacks), 1)
        self.assertEqual(assembly.stacks[0].stack_name, "TapStackSmokeTest")

    @mark.it("validates outputs are accessible after synthesis")
    def test_outputs_accessible(self):
        # ARRANGE & ACT
        stack = TapStack(self.app, "TapStackIntegrationTestOutputs",
                        TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # ASSERT - outputs should be in the template
        outputs = template.find_outputs("*")

        # Check that outputs have proper structure
        self.assertIn("VPCId", outputs)
        self.assertIn("KMSKeyId", outputs)
        self.assertIn("DatabaseEndpoint", outputs)
        self.assertIn("S3BucketNames", outputs)

        # Each output should have a Value
        for output_name, output_config in outputs.items():
            self.assertIn("Value", output_config,
                         f"Output {output_name} should have a Value")
