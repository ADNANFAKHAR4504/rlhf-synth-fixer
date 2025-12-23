import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack CDK stack"""

    def setUp(self):
        self.app = cdk.App()

    @mark.it("creates a VPC with three subnet types")
    def test_creates_vpc_and_subnets(self):
        stack = TapStack(self.app, "TapStackVpcTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::EC2::Subnet", 6)  # 3 subnet types x 2 AZs

    @mark.it("creates security groups for ALB, EC2, and RDS")
    def test_creates_security_groups(self):
        stack = TapStack(self.app, "TapStackSGTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)

    @mark.it("creates RDS MySQL instance with correct settings")
    def test_creates_rds_instance(self):
        stack = TapStack(self.app, "TapStackRdsTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "mysql",
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7,
            "DeletionProtection": False
        })

    @mark.it("creates Application Load Balancer and Target Group")
    def test_creates_alb_and_target_group(self):
        stack = TapStack(self.app, "TapStackAlbTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)

    @mark.it("creates IAM role for EC2")
    def test_creates_ec2_iam_role(self):
        stack = TapStack(self.app, "TapStackIamTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::IAM::Role", 1)

    @mark.it("creates Auto Scaling Group with Launch Configuration")
    def test_creates_auto_scaling_group(self):
        stack = TapStack(self.app, "TapStackAsgTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        # Using LaunchConfiguration instead of LaunchTemplate for LocalStack compatibility
        template.resource_count_is("AWS::AutoScaling::LaunchConfiguration", 1)
        template.resource_count_is("AWS::AutoScaling::ScalingPolicy", 1)

    @mark.it("outputs key resource identifiers")
    def test_outputs(self):
        stack = TapStack(self.app, "TapStackOutputsTest")
        template = Template.from_stack(stack)
        outputs = template.to_json().get("Outputs", {})
        self.assertIn("LoadBalancerDNS", outputs)
        self.assertIn("DatabaseEndpoint", outputs)
