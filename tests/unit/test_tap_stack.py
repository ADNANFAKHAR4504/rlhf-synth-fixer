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

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc_with_correct_configuration(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates correct number of subnets")
    def test_creates_correct_number_of_subnets(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Should have 6 subnets (3 types x 2 AZs)
        template.resource_count_is("AWS::EC2::Subnet", 6)

    @mark.it("creates security groups with correct rules")
    def test_creates_security_groups_with_correct_rules(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)

        # Check ALB security group allows HTTP and HTTPS
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for ALB",
            "SecurityGroupIngress": [
                {
                    "CidrIp": "0.0.0.0/0",
                    "FromPort": 80,
                    "IpProtocol": "tcp",
                    "ToPort": 80
                },
                {
                    "CidrIp": "0.0.0.0/0",
                    "FromPort": 443,
                    "IpProtocol": "tcp",
                    "ToPort": 443
                }
            ]
        })

    @mark.it("creates Application Load Balancer")
    def test_creates_application_load_balancer(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing",
            "Type": "application"
        })

    @mark.it("creates outputs for important resources")
    def test_creates_outputs(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Fixed: Use actual output names from the stack
        outputs = template.to_json()["Outputs"]
        self.assertIn("ALBDNS", outputs)  # Fixed: Changed from ALBDNSOutput to ALBDNS
        self.assertIn("PrimaryBucket", outputs)
        self.assertIn("BackupBucket", outputs)

    @mark.it("validates overall stack structure")
    def test_validates_overall_stack_structure(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Validate key resource counts
        expected_resources = {
            "AWS::EC2::VPC": 1,
            "AWS::EC2::SecurityGroup": 3,
            "AWS::ElasticLoadBalancingV2::LoadBalancer": 1,
            "AWS::AutoScaling::AutoScalingGroup": 1,
            "AWS::RDS::DBCluster": 1,
            "AWS::S3::Bucket": 2,
            "AWS::CloudWatch::Alarm": 1,
            "AWS::Lambda::Function": 1,
            "AWS::KMS::Key": 1
        }

        for resource_type, count in expected_resources.items():
            template.resource_count_is(resource_type, count)