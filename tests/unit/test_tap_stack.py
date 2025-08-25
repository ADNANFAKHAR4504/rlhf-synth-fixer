#!/usr/bin/env python3
"""
Unit tests for the TapStack CDK application.

Tests verify the correct creation and configuration of AWS web application resources
including VPC, ALB, Auto Scaling Group, WAF, security groups, and other components.
"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match

from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):  # pylint: disable=too-many-public-methods
    """Unit tests for TapStack web application infrastructure."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.props = TapStackProps(
            environment_suffix="test",
            env=cdk.Environment(account="123456789012", region="us-east-1")
        )
        self.stack = TapStack(self.app, "TestStack", props=self.props)
        self.template = Template.from_stack(self.stack)

    def test_vpc_creation(self):
        """Test VPC is created with correct configuration."""
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled."""
        self.template.has_resource_properties("AWS::EC2::FlowLog", {
            "ResourceType": "VPC",
            "TrafficType": "ALL"
        })

    def test_flow_log_group_created(self):
        """Test CloudWatch Log Group for VPC Flow Logs."""
        self.template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 30
        })

    def test_subnets_created(self):
        """Test subnets are created (3 AZs with public and private subnets)."""
        self.template.resource_count_is("AWS::EC2::Subnet", 6)  # 3 public + 3 private

    def test_nat_gateways_created(self):
        """Test NAT Gateways are created for private subnets."""
        self.template.resource_count_is("AWS::EC2::NatGateway", 2)

    def test_internet_gateway_created(self):
        """Test Internet Gateway is created."""
        self.template.has_resource("AWS::EC2::InternetGateway", {})

    def test_alb_security_group_created(self):
        """Test ALB security group is created."""
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Application Load Balancer"
        })

    def test_ec2_security_group_created(self):
        """Test EC2 security group is created."""
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for EC2 web servers"
        })

    def test_ec2_role_created(self):
        """Test EC2 IAM role is created with proper permissions."""
        self.template.has_resource_properties("AWS::IAM::Role", {
            "Description": "IAM role for web server EC2 instances",
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
        })

    def test_application_load_balancer_created(self):
        """Test Application Load Balancer is created."""
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "application",
            "Scheme": "internet-facing"
        })

    def test_alb_logs_bucket_created(self):
        """Test S3 bucket for ALB access logs is created."""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    def test_launch_template_created(self):
        """Test Launch Template for Auto Scaling Group is created."""
        self.template.has_resource("AWS::EC2::LaunchTemplate", {})

    def test_auto_scaling_group_created(self):
        """Test Auto Scaling Group is created."""
        self.template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "6",
            "DesiredCapacity": "3"
        })

    def test_target_group_created(self):
        """Test ALB Target Group is created."""
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Port": 80,
            "Protocol": "HTTP",
            "TargetType": "instance"
        })

    def test_alb_listener_created(self):
        """Test ALB Listener is created."""
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })

    def test_waf_web_acl_created(self):
        """Test AWS WAF v2 Web ACL is created."""
        self.template.has_resource_properties("AWS::WAFv2::WebACL", {
            "Scope": "REGIONAL",
            "DefaultAction": {
                "Allow": {}
            }
        })

    def test_waf_rules_configured(self):
        """Test WAF Web ACL has security rules configured."""
        self.template.has_resource_properties("AWS::WAFv2::WebACL", {
            "Rules": Match.array_with([
                Match.object_like({
                    "Name": "AWSManagedRulesCommonRuleSet",
                    "Priority": 1
                }),
                Match.object_like({
                    "Name": "AWSManagedRulesKnownBadInputsRuleSet",
                    "Priority": 2
                }),
                Match.object_like({
                    "Name": "AWSManagedRulesAmazonIpReputationList",
                    "Priority": 3
                })
            ])
        })

    def test_waf_web_acl_association(self):
        """Test WAF Web ACL is associated with ALB."""
        self.template.has_resource("AWS::WAFv2::WebACLAssociation", {})

    def test_tags_applied(self):
        """Test that tags are applied to resources."""
        # Check VPC has tags
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                Match.object_like({
                    "Key": "Environment",
                    "Value": "test"
                }),
                Match.object_like({
                    "Key": "Project",
                    "Value": "SecureWebApp"
                })
            ])
        })

    def test_stack_outputs_exist(self):
        """Test that stack outputs are defined."""
        outputs = self.template.find_outputs("*")
        
        # Check for expected outputs based on actual stack
        expected_outputs = [
            "LoadBalancerDNS",
            "WebACLId", 
            "VPCId"
        ]
        
        for output_name in expected_outputs:
            self.assertIn(output_name, outputs)

    def test_security_best_practices(self):
        """Test security best practices are implemented."""
        # Check that ALB has access logging enabled (indirectly via S3 bucket)
        self.template.resource_count_is("AWS::S3::Bucket", 1)
        
        # Check that Auto Scaling Group uses encrypted EBS volumes
        self.template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": {
                "BlockDeviceMappings": Match.array_with([
                    Match.object_like({
                        "Ebs": {
                            "Encrypted": True
                        }
                    })
                ])
            }
        })

    def test_high_availability_setup(self):
        """Test high availability configuration."""
        # VPC spans 3 AZs
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16"
        })
        
        # Multiple NAT Gateways for HA
        self.template.resource_count_is("AWS::EC2::NatGateway", 2)
        
        # Auto Scaling Group minimum of 2 instances
        self.template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2"
        })

    def test_no_unrestricted_access(self):
        """Test that security groups don't allow unrestricted access."""
        security_groups = self.template.find_resources("AWS::EC2::SecurityGroup")
        
        for _, sg_props in security_groups.items():
            if "Properties" in sg_props and "SecurityGroupIngress" in sg_props["Properties"]:
                for rule in sg_props["Properties"]["SecurityGroupIngress"]:
                    # Ensure no rule allows all traffic from anywhere
                    if rule.get("IpProtocol") == "-1":  # All protocols
                        self.assertNotEqual(rule.get("CidrIp"), "0.0.0.0/0")


class TestTapStackProps(unittest.TestCase):
    """Test TapStackProps dataclass."""

    def test_default_environment_suffix(self):
        """Test default environment suffix is 'dev'."""
        props = TapStackProps()
        self.assertEqual(props.environment_suffix, "dev")

    def test_custom_environment_suffix(self):
        """Test custom environment suffix can be set."""
        props = TapStackProps(environment_suffix="prod")
        self.assertEqual(props.environment_suffix, "prod")

    def test_environment_can_be_set(self):
        """Test CDK environment can be set."""
        env = cdk.Environment(account="123456789012", region="us-west-2")
        props = TapStackProps(env=env)
        self.assertEqual(props.env.account, "123456789012")
        self.assertEqual(props.env.region, "us-west-2")


if __name__ == "__main__":
    unittest.main()