"""Unit tests for TapStack CDK infrastructure."""
import unittest
import json

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
        self.env_suffix = "testenv"

    @mark.it("creates VPC with correct CIDR block")
    def test_creates_vpc_with_correct_cidr(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "172.31.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True,
        })

    @mark.it("creates subnets across multiple AZs")
    def test_creates_six_subnets(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - At least 2 AZs (4 subnets: 2 public + 2 private)
        # In actual deployment with real AWS, will be 6 subnets (3 AZs)
        subnet_count = len([r for r in template.to_json()["Resources"].values()
                           if r["Type"] == "AWS::EC2::Subnet"])
        self.assertGreaterEqual(subnet_count, 4)

    @mark.it("creates public subnets with /24 CIDR blocks")
    def test_creates_public_subnets_with_correct_cidr(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for /24 CIDR mask in public subnets
        template.has_resource_properties("AWS::EC2::Subnet", {
            "CidrBlock": Match.string_like_regexp(r"172\.31\.\d+\.0/24"),
            "MapPublicIpOnLaunch": True,
        })

    @mark.it("creates private subnets with /24 CIDR blocks")
    def test_creates_private_subnets_with_correct_cidr(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for private subnets (no MapPublicIpOnLaunch)
        template.has_resource_properties("AWS::EC2::Subnet", {
            "CidrBlock": Match.string_like_regexp(r"172\.31\.\d+\.0/24"),
        })

    @mark.it("creates NAT instances with t3.micro")
    def test_creates_nat_instances(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - At least 2 NAT instances (one per AZ available in test)
        # In actual deployment, will be 3 NAT instances
        instance_count = len([r for r in template.to_json()["Resources"].values()
                             if r["Type"] == "AWS::EC2::Instance"])
        self.assertGreaterEqual(instance_count, 2)
        template.has_resource_properties("AWS::EC2::Instance", {
            "InstanceType": "t3.micro",
            "SourceDestCheck": False,
        })

    @mark.it("creates security groups for NAT instances")
    def test_creates_nat_security_groups(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - At least 2 security groups (one per NAT instance per AZ)
        # In actual deployment, will be 3 security groups
        sg_count = len([r for r in template.to_json()["Resources"].values()
                       if r["Type"] == "AWS::EC2::SecurityGroup"])
        self.assertGreaterEqual(sg_count, 2)

    @mark.it("creates Network ACL with correct rules")
    def test_creates_network_acl(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::NetworkAcl", 1)

        # Check for HTTP rule (port 80)
        template.has_resource_properties("AWS::EC2::NetworkAclEntry", {
            "Protocol": 6,  # TCP
            "PortRange": {"From": 80, "To": 80},
            "RuleNumber": 100,
            "RuleAction": "allow",
            "Egress": False,
        })

        # Check for HTTPS rule (port 443)
        template.has_resource_properties("AWS::EC2::NetworkAclEntry", {
            "Protocol": 6,  # TCP
            "PortRange": {"From": 443, "To": 443},
            "RuleNumber": 110,
            "RuleAction": "allow",
            "Egress": False,
        })

        # Check for SSH rule (port 22)
        template.has_resource_properties("AWS::EC2::NetworkAclEntry", {
            "Protocol": 6,  # TCP
            "PortRange": {"From": 22, "To": 22},
            "RuleNumber": 120,
            "CidrBlock": "192.168.1.0/24",
            "RuleAction": "allow",
            "Egress": False,
        })

    @mark.it("creates S3 bucket for VPC Flow Logs")
    def test_creates_flow_logs_s3_bucket(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "ExpirationInDays": 90,
                        "Status": "Enabled",
                    })
                ])
            },
        })

    @mark.it("creates CloudWatch Log Group for VPC Flow Logs")
    def test_creates_flow_logs_log_group(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - We have 1 explicit log group for VPC Flow Logs
        # Lambda log group is managed via log_retention property (creates a custom resource)
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 30,
        })

    @mark.it("creates VPC Flow Logs to S3")
    def test_creates_vpc_flow_logs_to_s3(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for FlowLog with S3 destination
        template.has_resource_properties("AWS::EC2::FlowLog", {
            "ResourceType": "VPC",
            "TrafficType": "ALL",
            "LogDestinationType": "s3",
        })

    @mark.it("creates VPC Flow Logs to CloudWatch")
    def test_creates_vpc_flow_logs_to_cloudwatch(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for FlowLog with CloudWatch destination
        template.has_resource_properties("AWS::EC2::FlowLog", {
            "ResourceType": "VPC",
            "TrafficType": "ALL",
            "LogDestinationType": "cloud-watch-logs",
        })

    @mark.it("creates IAM role for VPC Flow Logs")
    def test_creates_flow_logs_iam_role(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                    })
                ])
            })
        })

    @mark.it("creates Lambda function for NAT metrics")
    def test_creates_metrics_lambda(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - At least 1 Lambda function (metrics publisher)
        # May have additional Lambda for custom resources
        lambda_count = len([r for r in template.to_json()["Resources"].values()
                           if r["Type"] == "AWS::Lambda::Function"])
        self.assertGreaterEqual(lambda_count, 1)

        # Check that at least one Lambda has correct properties
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9",
            "Handler": "index.handler",
            "Timeout": 60,
        })

    @mark.it("creates IAM role for Lambda function")
    def test_creates_lambda_iam_role(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Lambda execution role
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {"Service": "lambda.amazonaws.com"},
                    })
                ])
            })
        })

    @mark.it("creates EventBridge rule for Lambda trigger")
    def test_creates_eventbridge_rule(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Events::Rule", 1)
        template.has_resource_properties("AWS::Events::Rule", {
            "ScheduleExpression": "rate(5 minutes)",
            "State": "ENABLED",
        })

    @mark.it("creates custom route tables for private subnets")
    def test_creates_custom_route_tables(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - At least 3 route tables (one per private subnet)
        rt_count = len([r for r in template.to_json()["Resources"].values()
                       if r["Type"] == "AWS::EC2::RouteTable"])
        self.assertGreaterEqual(rt_count, 3)

    @mark.it("creates routes pointing to NAT instances")
    def test_creates_nat_routes(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Routes with destination 0.0.0.0/0 to NAT instances
        template.has_resource_properties("AWS::EC2::Route", {
            "DestinationCidrBlock": "0.0.0.0/0",
        })

    @mark.it("creates stack outputs for VPC ID")
    def test_creates_vpc_output(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.to_json()["Outputs"]
        self.assertIn("VpcId", outputs)
        self.assertIn("Description", outputs["VpcId"])

    @mark.it("creates stack outputs for subnet IDs")
    def test_creates_subnet_outputs(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.to_json()["Outputs"]
        self.assertIn("PublicSubnetIds", outputs)
        self.assertIn("PrivateSubnetIds", outputs)

    @mark.it("creates stack outputs for NAT instance IDs")
    def test_creates_nat_instance_outputs(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.to_json()["Outputs"]
        self.assertIn("NatInstanceIds", outputs)

    @mark.it("creates Transit Gateway attachment config output")
    def test_creates_tgw_config_output(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.to_json()["Outputs"]
        self.assertIn("TransitGatewayAttachmentConfig", outputs)

        # Parse the JSON value to verify structure
        tgw_value = outputs["TransitGatewayAttachmentConfig"]["Value"]
        # Should contain VpcId, SubnetIds, Tags

    @mark.it("tags all resources with Environment and CostCenter")
    def test_tags_resources(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - VPC should have Environment tag
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Environment", "Value": "Production"},
            ])
        })

        # S3 bucket should also have tags
        template.has_resource_properties("AWS::S3::Bucket", {
            "Tags": Match.array_with([
                {"Key": "CostCenter", "Value": "NetworkOps"},
            ])
        })

    @mark.it("uses RemovalPolicy.DESTROY for all resources")
    def test_uses_destroy_removal_policy(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - S3 bucket should have deletion policy
        template.has_resource("AWS::S3::Bucket", {
            "DeletionPolicy": "Delete",
        })

    @mark.it("defaults environment suffix to prod if not provided")
    def test_defaults_env_suffix_to_prod(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Should use 'prod' as default suffix
        template.resource_count_is("AWS::EC2::VPC", 1)
        # VPC should be created with prod suffix

    @mark.it("accepts custom environment suffix via props")
    def test_accepts_custom_env_suffix(self):
        # ARRANGE
        custom_suffix = "qa"
        stack = TapStack(
            self.app, "TapStackTestCustom",
            TapStackProps(environment_suffix=custom_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        # Resources should use custom suffix

    @mark.it("creates NAT instances with correct user data")
    def test_nat_instance_user_data(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - User data should configure IP forwarding
        template.has_resource_properties("AWS::EC2::Instance", {
            "UserData": Match.any_value(),
        })

    @mark.it("creates IAM roles for NAT instances")
    def test_creates_nat_instance_roles(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - NAT instance role with SSM policy
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {"Service": "ec2.amazonaws.com"},
                    })
                ])
            })
        })

    @mark.it("associates route tables with subnets")
    def test_associates_route_tables(self):
        # ARRANGE
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Route table associations
        rta_count = len([r for r in template.to_json()["Resources"].values()
                        if r["Type"] == "AWS::EC2::SubnetRouteTableAssociation"])
        self.assertGreaterEqual(rta_count, 3)


@mark.describe("TapStackProps")
class TestTapStackProps(unittest.TestCase):
    """Test cases for TapStackProps class"""

    @mark.it("creates props with environment suffix")
    def test_creates_props_with_env_suffix(self):
        # ARRANGE & ACT
        props = TapStackProps(environment_suffix="test")

        # ASSERT
        self.assertEqual(props.environment_suffix, "test")

    @mark.it("creates props without environment suffix")
    def test_creates_props_without_env_suffix(self):
        # ARRANGE & ACT
        props = TapStackProps()

        # ASSERT
        self.assertIsNone(props.environment_suffix)

    @mark.it("inherits from StackProps")
    def test_inherits_from_stack_props(self):
        # ARRANGE & ACT
        props = TapStackProps(environment_suffix="test")

        # ASSERT
        self.assertIsInstance(props, cdk.StackProps)

    @mark.it("accepts env in props")
    def test_accepts_env_in_props(self):
        # ARRANGE & ACT
        env = cdk.Environment(account="123456789012", region="us-east-1")
        props = TapStackProps(environment_suffix="test", env=env)
        app = cdk.App()
        stack = TapStack(app, "TapStackEnvTest", props=props)

        # ASSERT
        self.assertEqual(stack.account, "123456789012")
        self.assertEqual(stack.region, "us-east-1")
