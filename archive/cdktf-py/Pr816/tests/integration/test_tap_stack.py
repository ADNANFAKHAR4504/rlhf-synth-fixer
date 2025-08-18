"""
Integration tests for TapStack CDKTF implementation.

These tests verify the complete TapStack behavior including Terraform synthesis
and resource configuration validation.
"""

import pytest
import json
from typing import Dict, Any
from cdktf import Testing

from lib.tap_stack import TapStack


class TestTapStackSynthesis:
  """Test TapStack Terraform synthesis and output generation."""

  def test_synthesize_stack_successfully(self, mock_scope, default_config):
    """Test that TapStack synthesizes to valid Terraform configuration."""
    # Arrange
    app = Testing.app()
    
    # Act
    stack = TapStack(
      app,
      "tap-test-stack",
      environment_suffix=default_config["environment_suffix"],
      aws_region=default_config["aws_region"],
      default_tags=default_config["default_tags"]
    )
    
    # Synthesize the stack
    synthesized = Testing.synth(stack)
    
    # Assert
    assert synthesized is not None
    assert isinstance(synthesized, str)
    
    # Parse the synthesized JSON to ensure it's valid
    terraform_config = json.loads(synthesized)
    assert "terraform" in terraform_config
    assert "provider" in terraform_config
    assert "resource" in terraform_config

  def test_synthesized_terraform_structure(self, mock_scope):
    """Test the structure of synthesized Terraform configuration."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert - Check for expected top-level sections
    expected_sections = ["terraform", "provider", "data", "resource", "output"]
    for section in expected_sections:
      assert section in terraform_config, f"Missing section: {section}"

  def test_aws_provider_configuration(self, mock_scope):
    """Test AWS provider configuration in synthesized output."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack", aws_region="us-west-2")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    providers = terraform_config.get("provider", {})
    aws_providers = providers.get("aws", [])
    assert len(aws_providers) > 0
    
    # Check region configuration
    aws_provider = aws_providers[0]
    assert aws_provider.get("region") == "us-west-2"

  def test_vpc_resource_configuration(self, mock_scope):
    """Test VPC resource configuration in synthesized output."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    resources = terraform_config.get("resource", {})
    vpc_resources = resources.get("aws_vpc", {})
    assert len(vpc_resources) > 0
    
    # Find the main VPC resource
    main_vpc = None
    for vpc_name, vpc_config in vpc_resources.items():
      if "MainVPC" in vpc_name:
        main_vpc = vpc_config
        break
    
    assert main_vpc is not None
    assert main_vpc.get("cidr_block") == "10.0.0.0/16"
    assert main_vpc.get("enable_dns_hostnames") is True
    assert main_vpc.get("enable_dns_support") is True

  def test_subnet_resources_configuration(self, mock_scope):
    """Test subnet resources configuration in synthesized output."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    resources = terraform_config.get("resource", {})
    subnet_resources = resources.get("aws_subnet", {})
    
    # Should have 4 subnets (2 public + 2 private)
    assert len(subnet_resources) == 4
    
    # Check for public and private subnets
    public_subnets = []
    private_subnets = []
    
    for subnet_name, subnet_config in subnet_resources.items():
      if "PublicSubnet" in subnet_name:
        public_subnets.append(subnet_config)
      elif "PrivateSubnet" in subnet_name:
        private_subnets.append(subnet_config)
    
    assert len(public_subnets) == 2
    assert len(private_subnets) == 2
    
    # Verify public subnets have public IP mapping enabled
    for public_subnet in public_subnets:
      assert public_subnet.get("map_public_ip_on_launch") is True
    
    # Verify private subnets have public IP mapping disabled
    for private_subnet in private_subnets:
      assert private_subnet.get("map_public_ip_on_launch") is False

  def test_security_group_configuration(self, mock_scope):
    """Test security group configuration in synthesized output."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    resources = terraform_config.get("resource", {})
    sg_resources = resources.get("aws_security_group", {})
    
    # Should have 2 security groups (public + private)
    assert len(sg_resources) == 2
    
    # Check for public and private security groups
    public_sg = None
    private_sg = None
    
    for sg_name, sg_config in sg_resources.items():
      if "PublicSecurityGroup" in sg_name:
        public_sg = sg_config
      elif "PrivateSecurityGroup" in sg_name:
        private_sg = sg_config
    
    assert public_sg is not None
    assert private_sg is not None

  def test_security_group_rules_configuration(self, mock_scope):
    """Test security group rules configuration in synthesized output."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    resources = terraform_config.get("resource", {})
    sg_rule_resources = resources.get("aws_security_group_rule", {})
    
    # Should have 4 security group rules (2 ingress + 2 egress)
    assert len(sg_rule_resources) >= 4
    
    # Check for SSH access restriction
    ssh_rules = []
    for rule_name, rule_config in sg_rule_resources.items():
      if (rule_config.get("type") == "ingress" and 
          rule_config.get("from_port") == 22 and 
          rule_config.get("to_port") == 22):
        ssh_rules.append(rule_config)
    
    # Should have at least one SSH rule with restricted CIDR
    public_ssh_rule = None
    for rule in ssh_rules:
      if "203.0.113.0/24" in str(rule.get("cidr_blocks", [])):
        public_ssh_rule = rule
        break
    
    assert public_ssh_rule is not None

  def test_ec2_instances_configuration(self, mock_scope):
    """Test EC2 instances configuration in synthesized output."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    resources = terraform_config.get("resource", {})
    instance_resources = resources.get("aws_instance", {})
    
    # Should have 2 instances (public + private)
    assert len(instance_resources) == 2
    
    # Check instance types
    for instance_name, instance_config in instance_resources.items():
      assert instance_config.get("instance_type") == "t3.micro"

  def test_terraform_outputs_configuration(self, mock_scope):
    """Test Terraform outputs configuration in synthesized output."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    outputs = terraform_config.get("output", {})
    
    # Check for expected outputs
    expected_outputs = [
      "vpc_id", "public_subnet_ids", "private_subnet_ids",
      "nat_gateway_id", "public_instance_ip", "private_instance_ip"
    ]
    
    for expected_output in expected_outputs:
      assert any(expected_output in output_name for output_name in outputs.keys()), \
        f"Missing output: {expected_output}"

  def test_nat_gateway_configuration(self, mock_scope):
    """Test NAT Gateway configuration in synthesized output."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    resources = terraform_config.get("resource", {})
    
    # Check for EIP resource
    eip_resources = resources.get("aws_eip", {})
    assert len(eip_resources) > 0
    
    # Check for NAT Gateway resource
    nat_resources = resources.get("aws_nat_gateway", {})
    assert len(nat_resources) > 0


class TestTapStackResourceRelationships:
  """Test relationships between resources in the synthesized configuration."""

  def test_vpc_subnet_relationships(self, mock_scope):
    """Test that subnets correctly reference the VPC."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    resources = terraform_config.get("resource", {})
    subnet_resources = resources.get("aws_subnet", {})
    
    # All subnets should reference the VPC
    for subnet_name, subnet_config in subnet_resources.items():
      vpc_id = subnet_config.get("vpc_id")
      assert vpc_id is not None
      # Should be a reference to the VPC resource
      assert isinstance(vpc_id, str)

  def test_security_group_vpc_relationships(self, mock_scope):
    """Test that security groups correctly reference the VPC."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    resources = terraform_config.get("resource", {})
    sg_resources = resources.get("aws_security_group", {})
    
    # All security groups should reference the VPC
    for sg_name, sg_config in sg_resources.items():
      vpc_id = sg_config.get("vpc_id")
      assert vpc_id is not None

  def test_instance_subnet_relationships(self, mock_scope):
    """Test that instances correctly reference subnets."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    resources = terraform_config.get("resource", {})
    instance_resources = resources.get("aws_instance", {})
    
    # All instances should reference subnets
    for instance_name, instance_config in instance_resources.items():
      subnet_id = instance_config.get("subnet_id")
      assert subnet_id is not None


class TestTapStackMultipleEnvironments:
  """Test TapStack behavior with multiple environment configurations."""

  def test_multiple_environment_synthesis(self, mock_scope):
    """Test synthesis of multiple stacks with different environments."""
    # Arrange
    app = Testing.app()
    environments = ["dev", "staging", "prod"]
    
    for env in environments:
      # Act
      stack = TapStack(app, f"tap-{env}-stack", environment_suffix=env)
      synthesized = Testing.synth(stack)
      
      # Assert
      assert synthesized is not None
      terraform_config = json.loads(synthesized)
      assert "resource" in terraform_config

  def test_different_regions_synthesis(self, mock_scope):
    """Test synthesis of stacks in different AWS regions."""
    # Arrange
    app = Testing.app()
    regions = ["us-east-1", "us-west-2", "eu-west-1"]
    
    for region in regions:
      # Act
      stack = TapStack(app, f"tap-{region}-stack", aws_region=region)
      synthesized = Testing.synth(stack)
      
      # Assert
      terraform_config = json.loads(synthesized)
      providers = terraform_config.get("provider", {})
      aws_providers = providers.get("aws", [])
      assert len(aws_providers) > 0
      
      aws_provider = aws_providers[0]
      assert aws_provider.get("region") == region


class TestTapStackCompliance:
  """Test TapStack compliance with requirements."""

  def test_required_cidr_blocks(self, mock_scope):
    """Test that required CIDR blocks are correctly configured."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    resources = terraform_config.get("resource", {})
    
    # Check VPC CIDR
    vpc_resources = resources.get("aws_vpc", {})
    for vpc_name, vpc_config in vpc_resources.items():
      if "MainVPC" in vpc_name:
        assert vpc_config.get("cidr_block") == "10.0.0.0/16"
    
    # Check subnet CIDRs
    subnet_resources = resources.get("aws_subnet", {})
    expected_cidrs = ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
    actual_cidrs = []
    
    for subnet_name, subnet_config in subnet_resources.items():
      actual_cidrs.append(subnet_config.get("cidr_block"))
    
    for expected_cidr in expected_cidrs:
      assert expected_cidr in actual_cidrs

  def test_ssh_access_restriction(self, mock_scope):
    """Test that SSH access is restricted to required CIDR block."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    resources = terraform_config.get("resource", {})
    sg_rule_resources = resources.get("aws_security_group_rule", {})
    
    # Find SSH ingress rules
    ssh_ingress_rules = []
    for rule_name, rule_config in sg_rule_resources.items():
      if (rule_config.get("type") == "ingress" and 
          rule_config.get("from_port") == 22 and 
          rule_config.get("protocol") == "tcp"):
        ssh_ingress_rules.append(rule_config)
    
    # Verify at least one SSH rule restricts to 203.0.113.0/24
    restricted_rule_found = False
    for rule in ssh_ingress_rules:
      cidr_blocks = rule.get("cidr_blocks", [])
      if "203.0.113.0/24" in cidr_blocks:
        restricted_rule_found = True
        break
    
    assert restricted_rule_found, "SSH access should be restricted to 203.0.113.0/24"

  def test_instance_type_compliance(self, mock_scope):
    """Test that instances use the required instance type."""
    # Arrange
    app = Testing.app()
    stack = TapStack(app, "tap-test-stack")
    
    # Act
    synthesized = Testing.synth(stack)
    terraform_config = json.loads(synthesized)
    
    # Assert
    resources = terraform_config.get("resource", {})
    instance_resources = resources.get("aws_instance", {})
    
    # All instances should be t3.micro
    for instance_name, instance_config in instance_resources.items():
      assert instance_config.get("instance_type") == "t3.micro"
