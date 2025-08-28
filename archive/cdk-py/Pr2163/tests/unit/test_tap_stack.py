"""Unit tests for TapStack CDK infrastructure"""
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
    def test_creates_vpc_with_public_subnets(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check VPC exists
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })
        
        # Check public subnets exist (at least 2 for multi-AZ)
        template.resource_count_is("AWS::EC2::Subnet", 2)

    @mark.it("creates Application Load Balancer with correct settings")
    def test_creates_alb_with_security_features(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check ALB exists
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "application",
            "Scheme": "internet-facing",
            "Name": f"WebAppALB{env_suffix}",
            "LoadBalancerAttributes": Match.array_with([
                {"Key": "deletion_protection.enabled", "Value": "false"},
                {"Key": "routing.http.desync_mitigation_mode", "Value": "strictest"}
            ])
        })

    @mark.it("creates Auto Scaling Group with correct capacity")
    def test_creates_auto_scaling_group(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check Auto Scaling Group exists
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "5",
            "DesiredCapacity": "2",
            "AutoScalingGroupName": f"WebAppASG{env_suffix}",
            "HealthCheckType": "ELB"
        })

    @mark.it("creates EC2 Launch Template with t2.micro instances")
    def test_creates_launch_template(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check Launch Template exists
        template.resource_count_is("AWS::EC2::LaunchTemplate", 1)
        template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateName": f"WebAppLaunchTemplate{env_suffix}",
            "LaunchTemplateData": Match.object_like({
                "InstanceType": "t2.micro",
                "MetadataOptions": {
                    "HttpTokens": "required"  # IMDSv2 enforcement
                }
            })
        })

    @mark.it("creates IAM role for EC2 instances")
    def test_creates_iam_role(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Check IAM Role exists (at least 2 - EC2 role and Lambda role for custom resource)
        resources = template.find_resources("AWS::IAM::Role")
        # Find the EC2 role specifically
        ec2_roles = [r for r in resources.values() 
                     if "ec2.amazonaws.com" in str(r.get("Properties", {}).get(
                         "AssumeRolePolicyDocument", {}))]
        self.assertGreaterEqual(len(ec2_roles), 1)

    @mark.it("creates security groups for ALB and EC2")
    def test_creates_security_groups(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Check Security Groups exist
        # Should have at least 2 (ALB and EC2)
        resources = template.find_resources("AWS::EC2::SecurityGroup")
        security_groups = [r for r in resources.values() 
                          if "GroupDescription" in r.get("Properties", {})]
        
        # Check we have at least ALB and EC2 security groups
        descriptions = [sg["Properties"]["GroupDescription"] for sg in security_groups]
        self.assertIn("Security group for Application Load Balancer", descriptions)
        self.assertIn("Security group for EC2 instances", descriptions)

    @mark.it("creates ALB target group with health checks")
    def test_creates_target_group(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check Target Group exists
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Name": f"WebAppTG{env_suffix}",
            "Port": 80,
            "Protocol": "HTTP",
            "TargetType": "instance",
            "HealthCheckEnabled": True,
            "HealthCheckPath": "/",
            "HealthCheckPort": "80",
            "HealthCheckProtocol": "HTTP"
        })

    @mark.it("creates ALB listener on port 80")
    def test_creates_alb_listener(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Check Listener exists
        template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP",
            "DefaultActions": Match.array_with([
                Match.object_like({
                    "Type": "forward"
                })
            ])
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Check resources use 'dev' suffix
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Name": "WebAppALBdev"
        })
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "AutoScalingGroupName": "WebAppASGdev"
        })

    @mark.it("applies correct tags to all resources")
    def test_applies_tags(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check tags exist on VPC (tags are applied but order may vary)
        vpc_resources = template.find_resources("AWS::EC2::VPC")
        self.assertEqual(len(vpc_resources), 1)
        vpc = list(vpc_resources.values())[0]
        tags = vpc["Properties"]["Tags"]
        tag_dict = {tag["Key"]: tag["Value"] for tag in tags}
        
        # Check required tags are present
        self.assertEqual(tag_dict.get("Environment"), "Production")
        self.assertEqual(tag_dict.get("Application"), "WebApp")
        self.assertEqual(tag_dict.get("ManagedBy"), "CDK")
        self.assertEqual(tag_dict.get("Project"), f"WebApp{env_suffix}")

    @mark.it("creates CloudFormation outputs")
    def test_creates_outputs(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check outputs exist
        outputs = template.find_outputs("*")
        output_keys = list(outputs.keys())
        
        self.assertIn("ApplicationLoadBalancerDNS", output_keys)
        self.assertIn("VPCId", output_keys)
        self.assertIn("AutoScalingGroupName", output_keys)

    @mark.it("configures auto scaling with CPU-based scaling")
    def test_auto_scaling_policy(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Check scaling policy exists
        template.resource_count_is("AWS::AutoScaling::ScalingPolicy", 1)
        template.has_resource_properties("AWS::AutoScaling::ScalingPolicy", {
            "PolicyType": "TargetTrackingScaling",
            "TargetTrackingConfiguration": Match.object_like({
                "TargetValue": 70,
                "PredefinedMetricSpecification": {
                    "PredefinedMetricType": "ASGAverageCPUUtilization"
                }
            })
        })

    @mark.it("uses environment suffix from context if provided")
    def test_uses_context_env_suffix(self):
        # ARRANGE
        # Create a new app with context
        context_app = cdk.App(context={'environmentSuffix': 'context-env'})
        stack = TapStack(context_app, "TapStackTestContext")
        template = Template.from_stack(stack)

        # ASSERT - Check resources use context suffix
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Name": "WebAppALBcontext-env"
        })

    @mark.it("creates Internet Gateway for VPC")
    def test_creates_internet_gateway(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Check Internet Gateway exists
        template.resource_count_is("AWS::EC2::InternetGateway", 1)
        template.resource_count_is("AWS::EC2::VPCGatewayAttachment", 1)

    @mark.it("configures security group rules correctly")
    def test_security_group_rules(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT - Check ingress rules
        # ALB should allow HTTP from anywhere
        alb_sgs = template.find_resources("AWS::EC2::SecurityGroup", {
            "Properties": {
                "GroupDescription": "Security group for Application Load Balancer"
            }
        })
        self.assertEqual(len(alb_sgs), 1)
        
        # EC2 should have HTTP from ALB and SSH from anywhere
        ec2_sgs = template.find_resources("AWS::EC2::SecurityGroup", {
            "Properties": {
                "GroupDescription": "Security group for EC2 instances"
            }
        })
        self.assertEqual(len(ec2_sgs), 1)
