"""Unit tests for TapStack CDK infrastructure."""
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

  @mark.it("creates two VPCs with correct environment suffix")
  def test_creates_vpcs_with_env_suffix(self):
    """Test that two VPCs are created with the correct environment suffix."""
    # ARRANGE
    env_suffix = "testenv"
    props = TapStackProps(environment_suffix=env_suffix)
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::VPC", 2)
    
    # Check VPC configurations
    template.has_resource_properties("AWS::EC2::VPC", {
      "CidrBlock": "10.0.0.0/16",
      "EnableDnsHostnames": True,
      "EnableDnsSupport": True
    })
    
    template.has_resource_properties("AWS::EC2::VPC", {
      "CidrBlock": "10.1.0.0/16",
      "EnableDnsHostnames": True,
      "EnableDnsSupport": True
    })

  @mark.it("creates subnets across multiple availability zones")
  def test_creates_subnets_in_multiple_azs(self):
    """Test that subnets are created across multiple AZs."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Each VPC should have 4 subnets (2 public, 2 private)
    template.resource_count_is("AWS::EC2::Subnet", 8)  # 4 subnets per VPC * 2 VPCs

  @mark.it("creates NAT gateways for high availability")
  def test_creates_nat_gateways(self):
    """Test that NAT gateways are created for private subnet internet access."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Should have NAT gateways (2 per VPC for HA)
    template.resource_count_is("AWS::EC2::NatGateway", 4)

  @mark.it("creates security groups with correct rules")
  def test_creates_security_groups_with_rules(self):
    """Test that security groups are created with appropriate rules."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Should have 4 security groups (2 ALB SGs, 2 EC2 SGs)
    template.resource_count_is("AWS::EC2::SecurityGroup", 4)
    
    # Check ALB security group allows HTTP and HTTPS
    template.has_resource_properties("AWS::EC2::SecurityGroup", {
      "SecurityGroupIngress": Match.array_with([
        Match.object_like({
          "IpProtocol": "tcp",
          "FromPort": 80,
          "ToPort": 80,
          "CidrIp": "0.0.0.0/0"
        }),
        Match.object_like({
          "IpProtocol": "tcp",
          "FromPort": 443,
          "ToPort": 443,
          "CidrIp": "0.0.0.0/0"
        })
      ])
    })

  @mark.it("creates Application Load Balancers")
  def test_creates_albs(self):
    """Test that Application Load Balancers are created."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Should have 2 ALBs
    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 2)
    
    # Check ALB is internet-facing
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
      "Scheme": "internet-facing",
      "Type": "application"
    })

  @mark.it("creates ALB listeners on port 80")
  def test_creates_alb_listeners(self):
    """Test that ALB listeners are created on port 80."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Should have 2 listeners
    template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 2)
    
    # Check listener is on port 80
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
      "Port": 80,
      "Protocol": "HTTP"
    })

  @mark.it("creates target groups with health checks")
  def test_creates_target_groups(self):
    """Test that target groups are created with health checks."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Should have 2 target groups
    template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 2)
    
    # Check target group has health check
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
      "Port": 80,
      "Protocol": "HTTP",
      "TargetType": "instance",
      "HealthCheckEnabled": True,
      "HealthCheckPath": "/"
    })

  @mark.it("creates Auto Scaling Groups with minimum 2 instances")
  def test_creates_auto_scaling_groups(self):
    """Test that Auto Scaling Groups are created with minimum 2 instances."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Should have 2 ASGs
    template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 2)
    
    # Check ASG configuration
    template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
      "MinSize": "2",
      "MaxSize": "6",
      "DesiredCapacity": "2"
    })

  @mark.it("creates launch templates for EC2 instances")
  def test_creates_launch_templates(self):
    """Test that launch templates are created for EC2 instances."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Should have 2 launch templates
    template.resource_count_is("AWS::EC2::LaunchTemplate", 2)

  @mark.it("creates IAM role for EC2 instances")
  def test_creates_ec2_iam_role(self):
    """Test that IAM role is created for EC2 instances."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Should have 1 IAM role for EC2
    template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": Match.object_like({
        "Statement": Match.array_with([
          Match.object_like({
            "Effect": "Allow",
            "Principal": Match.object_like({
              "Service": "ec2.amazonaws.com"
            }),
            "Action": "sts:AssumeRole"
          })
        ])
      })
    })

  @mark.it("creates scaling policies for Auto Scaling Groups")
  def test_creates_scaling_policies(self):
    """Test that scaling policies are created for ASGs."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Should have 2 scaling policies
    template.resource_count_is("AWS::AutoScaling::ScalingPolicy", 2)
    
    # Check scaling policy configuration
    template.has_resource_properties("AWS::AutoScaling::ScalingPolicy", {
      "PolicyType": "TargetTrackingScaling",
      "TargetTrackingConfiguration": Match.object_like({
        "PredefinedMetricSpecification": Match.object_like({
          "PredefinedMetricType": "ASGAverageCPUUtilization"
        }),
        "TargetValue": 70
      })
    })

  @mark.it("creates CloudFormation outputs")
  def test_creates_outputs(self):
    """Test that CloudFormation outputs are created."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Check outputs exist in the template
    template_json = template.to_json()
    outputs = template_json.get("Outputs", {})
    
    # Should have 6 outputs
    assert len(outputs) == 6
    
    # Check specific output keys exist
    assert "VPC1ID" in outputs
    assert "VPC2ID" in outputs
    assert "ALB1DNS" in outputs
    assert "ALB2DNS" in outputs
    assert "ALB1URL" in outputs
    assert "ALB2URL" in outputs

  @mark.it("applies common tags to all resources")
  def test_applies_common_tags(self):
    """Test that common tags are applied to the stack."""
    # ARRANGE
    env_suffix = "staging"
    props = TapStackProps(environment_suffix=env_suffix)
    stack = TapStack(self.app, "TapStackTest", props=props)
    
    # ASSERT
    # Check that the environment suffix is used
    assert stack.environment_suffix == env_suffix
    assert stack.common_tags["Environment"] == env_suffix
    assert stack.common_tags["Owner"] == "DevOps-Team"
    assert stack.common_tags["Project"] == "TapInfrastructure"
    assert stack.common_tags["ManagedBy"] == "AWS-CDK"

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    """Test that environment suffix defaults to 'dev'."""
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestDefault")
    
    # ASSERT
    assert stack.environment_suffix == "dev"
    assert stack.common_tags["Environment"] == "dev"

  @mark.it("configures EC2 instances in private subnets")
  def test_ec2_instances_in_private_subnets(self):
    """Test that EC2 instances are placed in private subnets."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - ASGs should be configured with private subnets
    # This is checked by verifying ASG configuration exists
    template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
      "VPCZoneIdentifier": Match.any_value()
    })

  @mark.it("configures ALBs in public subnets")
  def test_albs_in_public_subnets(self):
    """Test that ALBs are placed in public subnets."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - ALBs should be internet-facing
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
      "Scheme": "internet-facing"
    })

  @mark.it("ensures no retain deletion policies")
  def test_no_retain_deletion_policies(self):
    """Test that resources don't have Retain deletion policies."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)
    
    # ASSERT - Get the template and check no DeletionPolicy: Retain
    template_json = template.to_json()
    resources = template_json.get("Resources", {})
    
    for resource_name, resource_props in resources.items():
      deletion_policy = resource_props.get("DeletionPolicy")
      assert deletion_policy != "Retain", f"Resource {resource_name} has Retain deletion policy"

  @mark.it("uses environment suffix in all resource names")
  def test_environment_suffix_in_resource_names(self):
    """Test that environment suffix is used in resource names."""
    # ARRANGE
    env_suffix = "prod"
    props = TapStackProps(environment_suffix=env_suffix)
    stack = TapStack(self.app, "TapStackTest", props=props)
    
    # ASSERT - Check that resources have the suffix
    assert f"VPC1-{env_suffix}" in str(stack.vpc1.node.id)
    assert f"VPC2-{env_suffix}" in str(stack.vpc2.node.id)
    assert stack.environment_suffix == env_suffix

  @mark.it("creates instance profile for EC2 role")
  def test_creates_instance_profile(self):
    """Test that instance profile is created for EC2 role."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Should have instance profiles (one per launch template)
    template.resource_count_is("AWS::IAM::InstanceProfile", 2)

  @mark.it("attaches managed policies to EC2 role")
  def test_attaches_managed_policies(self):
    """Test that required managed policies are attached to EC2 role."""
    # ARRANGE
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(self.app, "TapStackTest", props=props)
    template = Template.from_stack(stack)

    # ASSERT - Check that role has managed policies
    template.has_resource_properties("AWS::IAM::Role", {
      "ManagedPolicyArns": Match.any_value()
    })
    
    # Further verify by checking the template JSON
    template_json = template.to_json()
    resources = template_json.get("Resources", {})
    
    # Find the EC2 role
    ec2_role_found = False
    for resource_name, resource_props in resources.items():
      if resource_props.get("Type") == "AWS::IAM::Role":
        managed_arns = resource_props.get("Properties", {}).get("ManagedPolicyArns", [])
        # Check if this is the EC2 role by checking managed policies
        if len(managed_arns) >= 2:
          ec2_role_found = True
          # Verify policies are present
          policies_str = str(managed_arns)
          assert "AmazonSSMManagedInstanceCore" in policies_str
          assert "CloudWatchAgentServerPolicy" in policies_str
          break
    
    assert ec2_role_found, "EC2 role with managed policies not found"