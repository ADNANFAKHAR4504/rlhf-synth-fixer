"""
Unit Tests for AWS Production Infrastructure Stack

This module contains comprehensive unit tests for the TapStack
using pytest and CDKTF testing utilities. Tests cover all infrastructure
components, security configurations, and production requirements.
"""

import pytest
import json
from cdktf import Testing, App
from lib.tap_stack import TapStack


def synth_stack(stack):
    """Helper function to synthesize a stack and return parsed JSON."""
    return json.loads(Testing.synth(stack))


class TestTapStack:
  """Test suite for AWS Production Infrastructure Stack."""

  @pytest.fixture
  def app(self):
    """Create a CDKTF App instance for testing."""
    return App()

  @pytest.fixture
  def stack(self, app):
    """Create a stack instance for testing."""
    return TapStack(
        app,
        "test-aws-production-infrastructure",
        description="Test AWS production infrastructure stack"
    )

  @pytest.fixture
  def synthesized_stack(self, stack):
    """Return the synthesized Terraform configuration as a Python dictionary."""
    return synth_stack(stack)

  def test_stack_initialization(self, stack):
    """Test that the stack initializes correctly."""
    assert stack is not None
    assert hasattr(stack, 'description')
    assert stack.description == "Test AWS production infrastructure stack"
    assert stack.vpc_cidr == "10.0.0.0/16"
    assert stack.allowed_ssh_cidr == "203.0.113.0/24"
    assert stack.environment == "Production"

  def test_providers_configuration(self, synthesized_stack):
    """Test that AWS and Random providers are configured correctly."""
    # Check AWS provider configuration
    aws_provider = synthesized_stack.get("provider", {}).get("aws", [])
    assert len(aws_provider) > 0

    aws_config = aws_provider[0]
    assert aws_config["region"] == "us-west-2"
    assert "default_tags" in aws_config

    # Verify default tags
    default_tags = aws_config["default_tags"][0]["tags"]
    assert default_tags["Environment"] == "Production"
    assert default_tags["Project"] == "AWS Nova Model Breaking"
    assert default_tags["ManagedBy"] == "CDKTF"

    # Check Random provider configuration
    random_provider = synthesized_stack.get("provider", {}).get("random")
    assert random_provider is not None

  def test_vpc_creation(self, synthesized_stack):
    """Test VPC resource creation and configuration."""
    vpc_resources = synthesized_stack.get("resource", {}).get("aws_vpc", {})
    assert len(vpc_resources) == 1

    vpc_config = list(vpc_resources.values())[0]
    assert vpc_config["cidr_block"] == "10.0.0.0/16"
    assert vpc_config["enable_dns_hostnames"] is True
    assert vpc_config["enable_dns_support"] is True

    # Check VPC tags
    tags = vpc_config["tags"]
    assert tags["Environment"] == "Production"
    assert tags["Project"] == "AWS Nova Model Breaking"
    assert tags["Component"] == "Networking"

  def test_internet_gateway_creation(self, synthesized_stack):
    """Test Internet Gateway resource creation and configuration."""
    igw_resources = synthesized_stack.get(
        "resource", {}).get(
        "aws_internet_gateway", {})
    assert len(igw_resources) == 1

    igw_config = list(igw_resources.values())[0]
    assert "vpc_id" in igw_config

    # Check IGW tags
    tags = igw_config["tags"]
    assert tags["Environment"] == "Production"
    assert tags["Component"] == "Networking"

  def test_subnets_creation(self, synthesized_stack):
    """Test that all four subnets are created with correct configurations."""
    subnet_resources = synthesized_stack.get(
        "resource", {}).get("aws_subnet", {})
    assert len(subnet_resources) == 4  # 2 public + 2 private

    public_subnets = []
    private_subnets = []

    for subnet_name, subnet_config in subnet_resources.items():
      tags = subnet_config.get("tags", {})
      subnet_type = tags.get("Type", "")

      if subnet_type == "Public":
        public_subnets.append(subnet_config)
        # Public subnets should auto-assign public IPs
        assert subnet_config.get("map_public_ip_on_launch") is True
      elif subnet_type == "Private":
        private_subnets.append(subnet_config)
        # Private subnets should not auto-assign public IPs
        auto_assign = subnet_config.get("map_public_ip_on_launch")
        assert auto_assign is None or auto_assign is False

      # Check subnet tags
      assert tags["Environment"] == "Production"
      assert tags["Component"] == "Networking"

    assert len(public_subnets) == 2, "Should have exactly 2 public subnets"
    assert len(private_subnets) == 2, "Should have exactly 2 private subnets"

  def test_nat_gateways_creation(self, synthesized_stack):
    """Test NAT Gateways and Elastic IPs creation."""
    # Check Elastic IPs
    eip_resources = synthesized_stack.get("resource", {}).get("aws_eip", {})
    assert len(eip_resources) == 2, "Should have 2 Elastic IPs for NAT Gateways"

    for eip_config in eip_resources.values():
      assert eip_config["domain"] == "vpc"
      assert "depends_on" in eip_config

    # Check NAT Gateways
    nat_resources = synthesized_stack.get(
        "resource", {}).get(
        "aws_nat_gateway", {})
    assert len(
        nat_resources) == 2, "Should have 2 NAT Gateways for high availability"

    for nat_config in nat_resources.values():
      assert "allocation_id" in nat_config
      assert "subnet_id" in nat_config
      assert "depends_on" in nat_config

      # Check NAT Gateway tags
      tags = nat_config["tags"]
      assert tags["Environment"] == "Production"
      assert tags["Component"] == "Networking"

  def test_route_tables_creation(self, synthesized_stack):
    """Test route table creation and configuration."""
    route_table_resources = synthesized_stack.get(
        "resource", {}).get("aws_route_table", {})
    assert len(route_table_resources) == 3  # 1 public + 2 private (one per AZ)

    public_route_tables = []
    private_route_tables = []

    for rt_config in route_table_resources.values():
      tags = rt_config["tags"]
      rt_type = tags.get("Type", "")

      if rt_type == "Public":
        public_route_tables.append(rt_config)
      elif rt_type == "Private":
        private_route_tables.append(rt_config)

      assert tags["Environment"] == "Production"
      assert tags["Component"] == "Networking"

    assert len(public_route_tables) == 1, "Should have 1 public route table"
    assert len(private_route_tables) == 2, "Should have 2 private route tables"

  def test_routes_creation(self, synthesized_stack):
    """Test route creation for public and private route tables."""
    route_resources = synthesized_stack.get(
        "resource", {}).get("aws_route", {})
    assert len(route_resources) == 3  # 1 IGW route + 2 NAT routes

    igw_routes = 0
    nat_routes = 0

    for route_config in route_resources.values():
      assert route_config["destination_cidr_block"] == "0.0.0.0/0"

      if "gateway_id" in route_config:
        igw_routes += 1
      elif "nat_gateway_id" in route_config:
        nat_routes += 1

    assert igw_routes == 1, "Should have exactly 1 Internet Gateway route"
    assert nat_routes == 2, "Should have exactly 2 NAT Gateway routes"

  def test_security_groups_creation(self, synthesized_stack):
    """Test security group creation and configuration."""
    sg_resources = synthesized_stack.get(
        "resource", {}).get(
        "aws_security_group", {})
    assert len(sg_resources) == 2  # Bastion + Private instances

    bastion_sgs = []
    private_sgs = []

    for sg_name, sg_config in sg_resources.items():
      tags = sg_config.get("tags", {})
      purpose = tags.get("Purpose", "")

      if "Bastion" in purpose:
        bastion_sgs.append(sg_config)
      elif "Private" in purpose:
        private_sgs.append(sg_config)

      assert tags["Environment"] == "Production"
      assert tags["Component"] == "Security"

    assert len(bastion_sgs) == 1, "Should have 1 Bastion security group"
    assert len(private_sgs) == 1, "Should have 1 Private instances security group"

  def test_security_group_rules(self, synthesized_stack):
    """Test security group rules for proper access control."""
    sg_rule_resources = synthesized_stack.get(
        "resource", {}).get(
        "aws_security_group_rule", {})
    assert len(sg_rule_resources) > 0, "Should have security group rules"

    ssh_rules = []
    http_rules = []
    https_rules = []

    for rule_config in sg_rule_resources.values():
      from_port = rule_config.get("from_port")
      to_port = rule_config.get("to_port")

      if from_port == 22 and to_port == 22:
        ssh_rules.append(rule_config)
      elif from_port == 80 and to_port == 80:
        http_rules.append(rule_config)
      elif from_port == 443 and to_port == 443:
        https_rules.append(rule_config)

    # Should have SSH rules for Bastion access
    assert len(ssh_rules) > 0, "Should have SSH access rules"

    # Check for restricted SSH access
    restricted_ssh = False
    for rule in ssh_rules:
      if rule.get(
              "type") == "ingress" and "203.0.113.0/24" in rule.get("cidr_blocks", []):
        restricted_ssh = True
        break
    assert restricted_ssh, "Should have restricted SSH access from allowed CIDR"

  def test_bastion_host_creation(self, synthesized_stack):
    """Test Bastion host instance creation and configuration."""
    instance_resources = synthesized_stack.get(
        "resource", {}).get("aws_instance", {})
    assert len(
        instance_resources) == 1, "Should have exactly 1 Bastion host instance"

    bastion_config = list(instance_resources.values())[0]
    assert bastion_config["instance_type"] == "t3.micro"
    assert bastion_config["associate_public_ip_address"] is True
    assert "user_data" in bastion_config

    # Check Bastion tags
    tags = bastion_config["tags"]
    assert tags["Environment"] == "Production"
    assert tags["Component"] == "Security"
    assert tags["Purpose"] == "Bastion Host"

  def test_key_pair_creation(self, synthesized_stack):
    """Test Key Pair creation for Bastion host."""
    key_pair_resources = synthesized_stack.get(
        "resource", {}).get("aws_key_pair", {})
    assert len(
        key_pair_resources) == 1, "Should have exactly 1 Key Pair for Bastion"

    key_pair_config = list(key_pair_resources.values())[0]
    assert "public_key" in key_pair_config
    assert "key_name" in key_pair_config

    # Check Key Pair tags
    tags = key_pair_config["tags"]
    assert tags["Environment"] == "Production"
    assert tags["Component"] == "Security"

  def test_s3_buckets_creation(self, synthesized_stack):
    """Test S3 bucket creation with Block Public Access."""
    # Check S3 buckets
    s3_resources = synthesized_stack.get(
        "resource", {}).get(
        "aws_s3_bucket", {})
    assert len(s3_resources) == 2, "Should have 2 S3 buckets (logs + backup)"

    for bucket_config in s3_resources.values():
      tags = bucket_config["tags"]
      assert tags["Environment"] == "Production"
      assert tags["Component"] == "Storage"

    # Check S3 bucket versioning
    versioning_resources = synthesized_stack.get(
        "resource", {}).get(
        "aws_s3_bucket_versioning", {})
    assert len(
        versioning_resources) == 2, "Should have versioning for both buckets"

    for versioning_config in versioning_resources.values():
      assert versioning_config["versioning_configuration"]["status"] == "Enabled"

    # Check S3 bucket public access block
    public_access_block_resources = synthesized_stack.get(
        "resource", {}).get("aws_s3_bucket_public_access_block", {})
    assert len(
        public_access_block_resources) == 2, "Should have public access blocks for both buckets"

    for pab_config in public_access_block_resources.values():
      assert pab_config["block_public_acls"] is True
      assert pab_config["block_public_policy"] is True
      assert pab_config["ignore_public_acls"] is True
      assert pab_config["restrict_public_buckets"] is True

  def test_outputs_creation(self, synthesized_stack):
    """Test that all required outputs are created."""
    outputs = synthesized_stack.get("output", {})

    # Expected outputs
    expected_outputs = [
        "vpc_id",
        "vpc_cidr_block",
        "public_subnet_ids",
        "private_subnet_ids",
        "internet_gateway_id",
        "nat_gateway_ids",
        "bastion_security_group_id",
        "private_security_group_id",
        "bastion_host_id",
        "bastion_host_public_ip",
        "logs_bucket_name",
        "backup_bucket_name",
        "availability_zones"
    ]

    for output_name in expected_outputs:
      assert output_name in outputs, f"Missing required output: {output_name}"
      output_config = outputs[output_name]
      assert "value" in output_config
      assert "description" in output_config

  def test_production_environment_tagging(self, synthesized_stack):
    """Test that all resources are properly tagged with Environment: Production."""
    resources = synthesized_stack.get("resource", {})

    taggable_resource_types = [
        "aws_vpc", "aws_subnet", "aws_internet_gateway", "aws_nat_gateway",
        "aws_eip", "aws_route_table", "aws_security_group", "aws_instance",
        "aws_key_pair", "aws_s3_bucket"
    ]

    for resource_type in taggable_resource_types:
      resource_instances = resources.get(resource_type, {})

      for resource_name, resource_config in resource_instances.items():
        if "tags" in resource_config:
          tags = resource_config["tags"]
          assert "Environment" in tags, f"Missing Environment tag in {resource_type}.{resource_name}"
          assert tags[
              "Environment"] == "Production", f"Wrong Environment tag value in {resource_type}.{resource_name}"

  def test_high_availability_design(self, synthesized_stack):
    """Test that the infrastructure follows high availability principles."""
    # Test multi-AZ subnet distribution
    subnet_resources = synthesized_stack.get(
        "resource", {}).get("aws_subnet", {})
    az_usage = set()

    for subnet_config in subnet_resources.values():
      az_ref = subnet_config.get("availability_zone")
      if az_ref:
        az_usage.add(az_ref)

    assert len(
        az_usage) == 2, "Should use exactly 2 availability zones for high availability"

    # Test NAT Gateway redundancy
    nat_resources = synthesized_stack.get(
        "resource", {}).get(
        "aws_nat_gateway", {})
    assert len(
        nat_resources) == 2, "Should have 2 NAT Gateways for high availability"

  def test_security_compliance(self, synthesized_stack):
    """Test that security requirements are met."""
    # Test SSH access restriction
    sg_rule_resources = synthesized_stack.get(
        "resource", {}).get(
        "aws_security_group_rule", {})

    restricted_ssh_found = False
    for rule_config in sg_rule_resources.values():
      if (rule_config.get("type") == "ingress" and
          rule_config.get("from_port") == 22 and
              "203.0.113.0/24" in rule_config.get("cidr_blocks", [])):
        restricted_ssh_found = True
        break

    assert restricted_ssh_found, "SSH access should be restricted to allowed CIDR block"

    # Test S3 bucket security
    public_access_blocks = synthesized_stack.get(
        "resource", {}).get(
        "aws_s3_bucket_public_access_block", {})
    assert len(
        public_access_blocks) > 0, "S3 buckets should have public access blocks"

  def test_resource_count_validation(self, synthesized_stack):
    """Test that the correct number of each resource type is created."""
    resource_counts = {
        "aws_vpc": 1,
        "aws_subnet": 4,  # 2 public + 2 private
        "aws_internet_gateway": 1,
        "aws_nat_gateway": 2,  # High availability
        "aws_eip": 2,  # For NAT Gateways
        "aws_route_table": 3,  # 1 public + 2 private
        "aws_route": 3,  # 1 IGW + 2 NAT
        "aws_route_table_association": 4,  # One per subnet
        "aws_security_group": 2,  # Bastion + Private
        "aws_instance": 1,  # Bastion host
        "aws_key_pair": 1,  # Bastion key
        "aws_s3_bucket": 2,  # Logs + Backup
        "aws_s3_bucket_versioning": 2,
        "aws_s3_bucket_public_access_block": 2,
        "random_id": 1
    }

    resources = synthesized_stack.get("resource", {})
    for resource_type, expected_count in resource_counts.items():
      actual_count = len(resources.get(resource_type, {}))
      assert actual_count == expected_count, f"Expected {expected_count} {resource_type}, got {actual_count}"

  def test_stack_validation(self, stack):
    """Test stack validation passes without errors."""
    try:
      # Attempt to synthesize the stack
      Testing.synth(stack)
      validation_passed = True
    except Exception as e:
      validation_passed = False
      pytest.fail(f"Stack validation failed: {str(e)}")

    assert validation_passed


class TestStackConfiguration:
  """Tests for stack configuration and constants."""

  def test_configuration_constants(self):
    """Test that configuration constants are set correctly."""
    app = App()
    stack = TapStack(app, "test-config-stack")

    assert stack.vpc_cidr == "10.0.0.0/16"
    assert stack.allowed_ssh_cidr == "203.0.113.0/24"
    assert stack.aws_region == "us-west-2"
    assert stack.environment == "Production"

  def test_stack_description_handling(self):
    """Test that stack description is handled correctly."""
    app = App()

    # Test with description
    stack_with_desc = TapStack(
        app,
        "test-desc-stack",
        description="Test description")
    assert stack_with_desc.description == "Test description"

    # Test without description
    stack_without_desc = TapStack(app, "test-no-desc-stack")
    assert not hasattr(
        stack_without_desc,
        'description') or stack_without_desc.description is None


# Markers for pytest
pytestmark = pytest.mark.unit
