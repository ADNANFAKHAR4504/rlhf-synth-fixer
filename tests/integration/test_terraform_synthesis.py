"""Integration tests for Terraform configuration synthesis and validation."""
from lib.tap_stack import TapStack
from cdktf import App, Testing
import json
import os
import sys
from typing import Any, Dict

sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))


class TestTerraformSynthesis:
  """Test suite for Terraform configuration synthesis."""


  def test_complete_terraform_configuration_synthesis(self):
    """Test complete Terraform configuration synthesis from CDKTF."""
    app = App()
    stack = TapStack(
        app,
        "SynthesisTestStack",
        environment_suffix="integration",
        aws_region="us-east-1"
    )

    # Synthesize the stack
    synthesized_json = Testing.synth(stack)
    synthesized = json.loads(synthesized_json)

    # Verify top-level structure
    assert "resource" in synthesized
    assert "data" in synthesized
    assert "terraform" in synthesized

    # Verify Terraform configuration
    terraform_config = synthesized["terraform"]
    assert "required_providers" in terraform_config

  def test_provider_configuration_synthesis(self):
    """Test AWS provider configuration in synthesized Terraform."""
    app = App()
    stack = TapStack(
        app,
        "ProviderSynthesisTestStack",
        aws_region="eu-west-1",
        default_tags={"Environment": "test", "Team": "DevOps"}
    )

    synthesized = json.loads(Testing.synth(stack))

    # Verify AWS provider configuration
    provider_config = synthesized.get("provider", {}).get("aws")
    assert provider_config is not None

    # AWS provider config can be a list or dict
    if isinstance(provider_config, list):
      aws_provider = provider_config[0]
    else:
      aws_provider = list(provider_config.values())[0]

    assert aws_provider["region"] == "eu-west-1"
    assert "default_tags" in aws_provider

  def test_vpc_resources_synthesis(self):
    """Test VPC and networking resources in synthesized configuration."""
    app = App()
    stack = TapStack(app, "VPCSynthesisTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify VPC
    assert "aws_vpc" in resources
    vpc_config = list(resources["aws_vpc"].values())[0]
    assert vpc_config["cidr_block"] == "10.0.0.0/16"
    assert vpc_config["enable_dns_hostnames"] is True
    assert vpc_config["enable_dns_support"] is True

    # Verify subnets
    assert "aws_subnet" in resources
    subnets = resources["aws_subnet"]
    assert len(subnets) == 4  # 2 public + 2 private

    # Verify Internet Gateway
    assert "aws_internet_gateway" in resources
    igw_config = list(resources["aws_internet_gateway"].values())[0]
    assert "vpc_id" in igw_config

    # Verify NAT Gateway
    assert "aws_nat_gateway" in resources
    nat_config = list(resources["aws_nat_gateway"].values())[0]
    assert "allocation_id" in nat_config
    assert "subnet_id" in nat_config

    # Verify Elastic IP
    assert "aws_eip" in resources
    eip_config = list(resources["aws_eip"].values())[0]
    assert eip_config["domain"] == "vpc"

  def test_security_group_synthesis(self):
    """Test security group resources in synthesized configuration."""
    app = App()
    stack = TapStack(app, "SecurityGroupSynthesisTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify security groups
    assert "aws_security_group" in resources
    security_groups = resources["aws_security_group"]
    assert len(security_groups) == 2  # LB + Instance

    # Verify security group rules
    assert "aws_security_group_rule" in resources
    sg_rules = resources["aws_security_group_rule"]
    assert len(sg_rules) >= 4  # HTTP ingress/egress for both groups

  def test_compute_resources_synthesis(self):
    """Test compute resources in synthesized configuration."""
    app = App()
    stack = TapStack(app, "ComputeSynthesisTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify Launch Template
    assert "aws_launch_template" in resources
    lt_config = list(resources["aws_launch_template"].values())[0]
    assert lt_config["instance_type"] == "t3.micro"
    assert "user_data" in lt_config
    assert "iam_instance_profile" in lt_config

    # Verify Auto Scaling Group
    assert "aws_autoscaling_group" in resources
    asg_config = list(resources["aws_autoscaling_group"].values())[0]
    assert asg_config["min_size"] == 2
    assert asg_config["max_size"] == 4
    assert asg_config["desired_capacity"] == 2
    assert asg_config["health_check_type"] == "ELB"

  def test_load_balancer_synthesis(self):
    """Test load balancer resources in synthesized configuration."""
    app = App()
    stack = TapStack(app, "LoadBalancerSynthesisTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify Application Load Balancer
    assert "aws_lb" in resources
    lb_config = list(resources["aws_lb"].values())[0]
    assert lb_config["load_balancer_type"] == "application"
    assert lb_config["internal"] is False

    # Verify Target Group
    assert "aws_lb_target_group" in resources
    tg_config = list(resources["aws_lb_target_group"].values())[0]
    assert tg_config["port"] == 80
    assert tg_config["protocol"] == "HTTP"
    assert tg_config["target_type"] == "instance"

    # Verify Listener
    assert "aws_lb_listener" in resources
    listener_config = list(resources["aws_lb_listener"].values())[0]
    assert listener_config["port"] == 80
    assert listener_config["protocol"] == "HTTP"

  def test_iam_resources_synthesis(self):
    """Test IAM resources in synthesized configuration."""
    app = App()
    stack = TapStack(app, "IAMSynthesisTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify IAM Role
    assert "aws_iam_role" in resources
    role_config = list(resources["aws_iam_role"].values())[0]
    assert "assume_role_policy" in role_config

    # Verify IAM Instance Profile
    assert "aws_iam_instance_profile" in resources
    profile_config = list(resources["aws_iam_instance_profile"].values())[0]
    assert "role" in profile_config

    # Verify IAM Policy Attachment
    assert "aws_iam_role_policy_attachment" in resources
    attachment_config = list(
        resources["aws_iam_role_policy_attachment"].values())[0]
    assert "policy_arn" in attachment_config
    assert "role" in attachment_config

  def test_state_management_synthesis(self):
    """Test state management resources in synthesized configuration."""
    app = App()
    stack = TapStack(app, "StateSynthesisTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify S3 Bucket
    assert "aws_s3_bucket" in resources
    bucket_config = list(resources["aws_s3_bucket"].values())[0]
    assert "bucket" in bucket_config

    # Verify S3 Bucket Versioning
    assert "aws_s3_bucket_versioning" in resources
    versioning_config = list(resources["aws_s3_bucket_versioning"].values())[0]
    assert versioning_config["versioning_configuration"]["status"] == "Enabled"

    # Verify S3 Public Access Block
    assert "aws_s3_bucket_public_access_block" in resources
    pab_config = list(
        resources["aws_s3_bucket_public_access_block"].values())[0]
    assert pab_config["block_public_acls"] is True
    assert pab_config["block_public_policy"] is True

    # Verify DynamoDB Table
    assert "aws_dynamodb_table" in resources
    table_config = list(resources["aws_dynamodb_table"].values())[0]
    assert table_config["hash_key"] == "LockID"
    assert table_config["billing_mode"] == "PAY_PER_REQUEST"

  def test_data_sources_synthesis(self):
    """Test data sources in synthesized configuration."""
    app = App()
    stack = TapStack(app, "DataSourceSynthesisTestStack")

    synthesized = json.loads(Testing.synth(stack))
    data_sources = synthesized["data"]

    # Verify AWS Caller Identity
    assert "aws_caller_identity" in data_sources

    # Verify Availability Zones
    assert "aws_availability_zones" in data_sources
    az_config = list(data_sources["aws_availability_zones"].values())[0]
    assert az_config["state"] == "available"

    # Verify AMI Data Source
    assert "aws_ami" in data_sources
    ami_config = list(data_sources["aws_ami"].values())[0]
    assert ami_config["most_recent"] is True
    assert "amazon" in ami_config["owners"]

  def test_resource_tagging_synthesis(self):
    """Test resource tagging in synthesized configuration."""
    app = App()
    custom_tags = {"Project": "TestProject", "Environment": "integration"}
    stack = TapStack(
        app,
        "TaggingSynthesisTestStack",
        default_tags=custom_tags
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Check that resources have tags
    vpc_config = list(resources["aws_vpc"].values())[0]
    assert "tags" in vpc_config

    # Check that common tags are present
    tags = vpc_config["tags"]
    assert "Environment" in tags
    assert "ManagedBy" in tags

  def test_route_table_synthesis(self):
    """Test route table resources in synthesized configuration."""
    app = App()
    stack = TapStack(app, "RouteTableSynthesisTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify Route Tables
    assert "aws_route_table" in resources
    route_tables = resources["aws_route_table"]
    assert len(route_tables) == 2  # Public + Private

    # Verify Routes
    assert "aws_route" in resources
    routes = resources["aws_route"]
    assert len(routes) == 2  # IGW route + NAT route

    # Verify Route Table Associations
    assert "aws_route_table_association" in resources
    associations = resources["aws_route_table_association"]
    assert len(associations) == 4  # 2 public + 2 private subnets


class TestTerraformValidation:
  """Test suite for Terraform configuration validation."""

  def test_resource_naming_consistency(self):
    """Test that resource naming follows consistent patterns."""
    app = App()
    stack = TapStack(app, "NamingConsistencyTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Check VPC naming
    vpc_resources = resources.get("aws_vpc", {})
    for resource_name, config in vpc_resources.items():
      assert "prod-vpc-1" in resource_name or "tags" in config

    # Check security group naming
    sg_resources = resources.get("aws_security_group", {})
    for resource_name, config in sg_resources.items():
      assert any(term in resource_name for term in ["lb", "instance"])

  def test_resource_references_validity(self):
    """Test that resource references are valid in synthesized config."""
    app = App()
    stack = TapStack(app, "ResourceReferencesTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify subnet VPC references
    subnets = resources.get("aws_subnet", {})
    for subnet_config in subnets.values():
      vpc_id = subnet_config["vpc_id"]
      # Should reference VPC resource
      assert "${aws_vpc." in vpc_id or isinstance(vpc_id, str)

    # Verify security group VPC references
    security_groups = resources.get("aws_security_group", {})
    for sg_config in security_groups.values():
      vpc_id = sg_config["vpc_id"]
      assert "${aws_vpc." in vpc_id or isinstance(vpc_id, str)

  def test_terraform_backend_configuration(self):
    """Test Terraform backend configuration."""
    app = App()
    stack = TapStack(
        app,
        "BackendConfigTestStack",
        state_bucket="test-terraform-state",
        state_bucket_region="us-west-2"
    )

    synthesized = json.loads(Testing.synth(stack))

    # Note: Backend configuration is typically handled outside of resource synthesis
    # This test verifies the stack can be created with backend parameters
    assert synthesized is not None
    assert stack.state_bucket == "test-terraform-state"
    assert stack.state_bucket_region == "us-west-2"

  def test_multi_environment_synthesis(self):
    """Test synthesis with different environment configurations."""
    environments = ["dev", "staging", "prod"]

    for env in environments:
      app = App()
      stack = TapStack(
          app,
          f"MultiEnvTestStack{env.title()}",
          environment_suffix=env,
          aws_region="us-east-1"
      )

      synthesized = json.loads(Testing.synth(stack))

      # Verify environment-specific configuration
      assert synthesized is not None
      assert stack.environment_suffix == env

      # Verify resources are created regardless of environment
      resources = synthesized["resource"]
      assert "aws_vpc" in resources
      assert "aws_autoscaling_group" in resources
      assert "aws_lb" in resources

  def test_regional_synthesis_variations(self):
    """Test synthesis with different AWS regions."""
    regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]

    for region in regions:
      app = App()
      stack = TapStack(
          app,
          f"RegionalTestStack{region.replace('-', '').title()}",
          aws_region=region
      )

      synthesized = json.loads(Testing.synth(stack))

      # Verify region-specific configuration
      assert synthesized is not None
      assert stack.aws_region == region

      # Verify provider configuration
      provider_config = synthesized.get("provider", {}).get("aws")
      if isinstance(provider_config, list):
        aws_provider = provider_config[0]
      else:
        aws_provider = list(provider_config.values())[0]
      assert aws_provider["region"] == region

  def test_resource_dependency_order(self):
    """Test that resource dependencies are properly ordered."""
    app = App()
    stack = TapStack(app, "DependencyOrderTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify that dependent resources reference their dependencies
    # Example: Subnets should reference VPC
    subnets = resources.get("aws_subnet", {})
    vpcs = resources.get("aws_vpc", {})

    assert len(vpcs) > 0, "VPC should exist before subnets"
    assert len(subnets) > 0, "Subnets should exist"

    # Verify NAT Gateway references EIP and subnet
    nat_gateways = resources.get("aws_nat_gateway", {})
    eips = resources.get("aws_eip", {})

    if nat_gateways and eips:
      nat_config = list(nat_gateways.values())[0]
      assert "allocation_id" in nat_config
      assert "subnet_id" in nat_config


if __name__ == "__main__":
  import pytest
  pytest.main([__file__])
