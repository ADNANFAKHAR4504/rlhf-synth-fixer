"""Unit tests for TapStack CDK stack"""

import unittest
from unittest.mock import patch
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
        self.env_suffix = "test"
        self.props = TapStackProps(environment_suffix=self.env_suffix)
        self.stack = TapStack(self.app, f"TapStack{self.env_suffix}", props=self.props)
        self.template = Template.from_stack(self.stack)

    @mark.it("creates a VPC with correct configuration")
    def test_creates_vpc_with_correct_config(self):
        """Test VPC creation with public and private subnets"""
        # ASSERT - VPC exists
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        
        # Check for NAT Gateways (2 for high availability)
        self.template.resource_count_is("AWS::EC2::NatGateway", 2)
        
        # Check for Internet Gateway
        self.template.resource_count_is("AWS::EC2::InternetGateway", 1)
        
        # Check for subnets (public and private)
        subnets = self.template.find_resources("AWS::EC2::Subnet")
        self.assertGreaterEqual(len(subnets), 4)  # At least 2 public and 2 private

    @mark.it("creates security groups for ALB and EC2")
    def test_creates_security_groups(self):
        """Test security group creation for ALB and EC2 instances"""
        # ASSERT - Check for security groups
        security_groups = self.template.find_resources("AWS::EC2::SecurityGroup")
        self.assertGreaterEqual(len(security_groups), 2)
        
        # Check ALB security group allows HTTP and HTTPS
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Application Load Balancer",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "CidrIp": "0.0.0.0/0",
                    "FromPort": 80,
                    "ToPort": 80,
                    "IpProtocol": "tcp"
                }),
                Match.object_like({
                    "CidrIp": "0.0.0.0/0",
                    "FromPort": 443,
                    "ToPort": 443,
                    "IpProtocol": "tcp"
                })
            ])
        })

    @mark.it("creates an Application Load Balancer")
    def test_creates_application_load_balancer(self):
        """Test Application Load Balancer creation"""
        # ASSERT - ALB exists
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        
        # Check ALB is internet-facing
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing",
            "Type": "application"
        })
        
        # Check for ALB listener
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })

    @mark.it("creates a target group with health checks")
    def test_creates_target_group_with_health_checks(self):
        """Test target group creation with proper health check configuration"""
        # ASSERT - Target group exists
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        
        # Check health check configuration
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Port": 80,
            "Protocol": "HTTP",
            "TargetType": "instance",
            "HealthCheckPath": "/",
            "HealthCheckProtocol": "HTTP",
            "HealthCheckIntervalSeconds": 30,
            "HealthCheckTimeoutSeconds": 10,
            "HealthyThresholdCount": 2,
            "UnhealthyThresholdCount": 3
        })

    @mark.it("creates an Auto Scaling Group")
    def test_creates_auto_scaling_group(self):
        """Test Auto Scaling Group creation with proper configuration"""
        # ASSERT - ASG exists
        self.template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        
        # Check ASG configuration
        self.template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "6",
            "DesiredCapacity": "2",
            "HealthCheckType": "ELB",
            "HealthCheckGracePeriod": 300
        })
        
        # Check for scaling policy
        self.template.resource_count_is("AWS::AutoScaling::ScalingPolicy", 1)
        self.template.has_resource_properties("AWS::AutoScaling::ScalingPolicy", {
            "PolicyType": "TargetTrackingScaling",
            "TargetTrackingConfiguration": Match.object_like({
                "TargetValue": 70,
                "PredefinedMetricSpecification": {
                    "PredefinedMetricType": "ASGAverageCPUUtilization"
                }
            })
        })

    @mark.it("creates a launch template for EC2 instances")
    def test_creates_launch_template(self):
        """Test launch template creation for EC2 instances"""
        # ASSERT - Launch template exists
        self.template.resource_count_is("AWS::EC2::LaunchTemplate", 1)
        
        # Check launch template configuration
        self.template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": Match.object_like({
                "InstanceType": "t3.micro",
                "UserData": Match.any_value()  # User data script exists
            })
        })

    @mark.it("creates AWS Secrets Manager secret")
    def test_creates_secrets_manager_secret(self):
        """Test Secrets Manager secret creation for application configuration"""
        # ASSERT - Secret exists
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)
        
        # Check secret configuration
        self.template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Description": "Secrets for web application configuration",
            "GenerateSecretString": Match.object_like({
                "SecretStringTemplate": '{"username": "admin"}',
                "GenerateStringKey": "password"
            })
        })

    @mark.it("creates IAM role for EC2 instances")
    def test_creates_iam_role_for_ec2(self):
        """Test IAM role creation for EC2 instances"""
        # ASSERT - IAM role exists
        roles = self.template.find_resources("AWS::IAM::Role")
        ec2_roles = {k: v for k, v in roles.items() 
                     if "WebAppEC2Role" in k}
        self.assertEqual(len(ec2_roles), 1)
        
        # Check IAM instance profile exists
        self.template.resource_count_is("AWS::IAM::InstanceProfile", 1)

    @mark.it("creates CloudFormation outputs")
    def test_creates_cloudformation_outputs(self):
        """Test CloudFormation outputs are created"""
        # ASSERT - Check outputs exist
        outputs = self.template.find_outputs("*")
        
        # Check for LoadBalancer URL output
        self.assertIn(f"LoadBalancerURL{self.env_suffix}", outputs)
        
        # Check for LoadBalancer DNS output
        self.assertIn(f"LoadBalancerDNS{self.env_suffix}", outputs)
        
        # Check for Secrets Manager ARN output
        self.assertIn(f"SecretsManagerArn{self.env_suffix}", outputs)

    @mark.it("uses environment suffix in resource names")
    def test_uses_environment_suffix_in_resource_names(self):
        """Test that environment suffix is properly applied to resource names"""
        # Check VPC name includes suffix
        vpc_resources = self.template.find_resources("AWS::EC2::VPC")
        vpc_names = [k for k in vpc_resources.keys()]
        self.assertTrue(any(self.env_suffix in name for name in vpc_names))
        
        # Check ALB name includes suffix
        alb_resources = self.template.find_resources("AWS::ElasticLoadBalancingV2::LoadBalancer")
        alb_names = [k for k in alb_resources.keys()]
        self.assertTrue(any(self.env_suffix in name for name in alb_names))
        
        # Check ASG name includes suffix
        asg_resources = self.template.find_resources("AWS::AutoScaling::AutoScalingGroup")
        asg_names = [k for k in asg_resources.keys()]
        self.assertTrue(any(self.env_suffix in name for name in asg_names))

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test that environment suffix defaults to 'dev' when not provided"""
        # ARRANGE - Create a new app for this test to avoid synthesis conflicts
        new_app = cdk.App()
        stack_default = TapStack(new_app, "TapStackDefault")
        template_default = Template.from_stack(stack_default)
        
        # ASSERT - Check that resources contain 'dev' suffix
        vpc_resources = template_default.find_resources("AWS::EC2::VPC")
        vpc_names = [k for k in vpc_resources.keys()]
        self.assertTrue(any("dev" in name for name in vpc_names))

    @mark.it("configures EC2 instances in private subnets")
    def test_ec2_instances_in_private_subnets(self):
        """Test that EC2 instances are configured in private subnets"""
        # ASSERT - Check ASG is configured with private subnets
        asg_resources = self.template.find_resources("AWS::AutoScaling::AutoScalingGroup")
        for _, asg_props in asg_resources.items():
            vpc_zone_ids = asg_props["Properties"].get("VPCZoneIdentifier", [])
            # Should have at least 2 subnet references (multi-AZ)
            self.assertGreaterEqual(len(vpc_zone_ids), 2)

    @mark.it("configures ALB in public subnets")
    def test_alb_in_public_subnets(self):
        """Test that ALB is configured in public subnets"""
        # ASSERT - Check ALB has subnet configuration
        alb_resources = self.template.find_resources("AWS::ElasticLoadBalancingV2::LoadBalancer")
        for _, alb_props in alb_resources.items():
            subnets = alb_props["Properties"].get("Subnets", [])
            # Should have at least 2 subnet references (multi-AZ)
            self.assertGreaterEqual(len(subnets), 2)

    @mark.it("stores stack references for potential cross-stack use")
    def test_stores_stack_references(self):
        """Test that the stack stores references to key resources"""
        # ASSERT - Check that stack has necessary attributes
        self.assertIsNotNone(self.stack.vpc)
        self.assertIsNotNone(self.stack.alb)
        self.assertIsNotNone(self.stack.asg)
        self.assertIsNotNone(self.stack.app_secrets)

    @mark.it("creates infrastructure meeting all requirements")
    def test_infrastructure_meets_all_requirements(self):
        """Integration test to verify all 6 requirements are met"""
        # Requirement 1: Auto Scaling Group across multiple AZs
        self.template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        self.template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",  # Ensures instances across AZs
            "MaxSize": "6"
        })
        
        # Requirement 2: Internet-facing Application Load Balancer
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing",
            "Type": "application"
        })
        
        # Requirement 3: Health checks configured
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "HealthCheckPath": "/",
            "HealthCheckProtocol": "HTTP"
        })
        self.template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "HealthCheckType": "ELB",
            "HealthCheckGracePeriod": 300
        })
        
        # Requirement 4: Network security (HTTP/HTTPS allowed)
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Application Load Balancer",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({"FromPort": 80, "ToPort": 80}),
                Match.object_like({"FromPort": 443, "ToPort": 443})
            ])
        })
        
        # Requirement 5: Secure configuration (Secrets Manager)
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)
        
        # Requirement 6: Infrastructure outputs (ALB URL)
        outputs = self.template.find_outputs("*")
        lb_url_outputs = [k for k in outputs.keys() if "LoadBalancerURL" in k]
        self.assertGreaterEqual(len(lb_url_outputs), 1)


@mark.describe("TapStackProps")
class TestTapStackProps(unittest.TestCase):
    """Test cases for TapStackProps class"""

    @mark.it("initializes with environment suffix")
    def test_initializes_with_environment_suffix(self):
        """Test TapStackProps initialization with environment suffix"""
        # ARRANGE & ACT
        props = TapStackProps(environment_suffix="prod")
        
        # ASSERT
        self.assertEqual(props.environment_suffix, "prod")

    @mark.it("initializes with None environment suffix")
    def test_initializes_with_none_environment_suffix(self):
        """Test TapStackProps initialization without environment suffix"""
        # ARRANGE & ACT
        props = TapStackProps()
        
        # ASSERT
        self.assertIsNone(props.environment_suffix)

    @mark.it("passes kwargs to base class")
    def test_passes_kwargs_to_base_class(self):
        """Test that TapStackProps passes kwargs to base StackProps"""
        # ARRANGE & ACT
        env = cdk.Environment(account="123456789012", region="us-west-2")
        props = TapStackProps(environment_suffix="test", env=env)
        
        # ASSERT
        self.assertEqual(props.environment_suffix, "test")
        self.assertEqual(props.env, env)
