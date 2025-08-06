"""
Unit Tests for AWS Nova Model Breaking VPC Infrastructure Stack

This module contains comprehensive unit tests for the TapStack
using pytest and CDKTF testing utilities. Tests cover all infrastructure
components, configurations, and outputs.
"""

import json

import pytest
from cdktf import Testing, App

from lib.tap_stack import TapStack


class TestTapStack:
  """Test suite for AWS VPC Infrastructure Stack."""

  @pytest.fixture
  def app(self):
    """Create a CDKTF App instance for testing."""
    return App()

  @pytest.fixture
  def stack(self, app):
    """Create a stack instance for testing."""
    return TapStack(
      app, 
      "test-aws-nova-vpc-infrastructure",
      description="Test AWS VPC infrastructure for Nova Model Breaking project"
    )

  @pytest.fixture
  def synthesized_stack(self, stack):
    """Return the synthesized Terraform configuration as a parsed dictionary."""
    synthesized_json = Testing.synth(stack)
    return json.loads(synthesized_json)

  def test_stack_initialization(self, stack):
    """Test that the stack initializes correctly."""
    assert stack is not None
    assert hasattr(stack, 'description')
    assert stack.description == "Test AWS VPC infrastructure for Nova Model Breaking project"

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
    assert default_tags["Project"] == "AWS Nova Model Breaking"
    assert default_tags["ManagedBy"] == "CDKTF"
    assert default_tags["Environment"] == "Development"

    # Check required providers in terraform block
    required_providers = synthesized_stack.get("terraform", {}).get("required_providers", {})
    assert "aws" in required_providers
    assert required_providers["aws"]["source"] == "aws"

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
    assert tags["Environment"] == "Development"
    assert tags["Project"] == "Nova Model Breaking"
    assert tags["Component"] == "Networking"
    assert tags["Name"] == "nova-development-vpc"

  def test_internet_gateway_creation(self, synthesized_stack):
    """Test Internet Gateway resource creation and configuration."""
    igw_resources = synthesized_stack.get("resource", {}).get("aws_internet_gateway", {})
    assert len(igw_resources) == 1

    igw_config = list(igw_resources.values())[0]
    assert "vpc_id" in igw_config

    # Check IGW tags
    tags = igw_config["tags"]
    assert tags["Name"] == "nova-development-igw"
    assert tags["Environment"] == "Development"

  def test_subnets_creation(self, synthesized_stack):
    """Test that all four subnets are created with correct configurations."""
    subnet_resources = synthesized_stack.get("resource", {}).get("aws_subnet", {})
    assert len(subnet_resources) == 4

    # Expected subnet configurations
    expected_subnets = {
      "nova_public_subnet_1": {
        "cidr_block": "10.0.1.0/24",
        "map_public_ip_on_launch": True,
        "type": "Public"
      },
      "nova_public_subnet_2": {
        "cidr_block": "10.0.2.0/24", 
        "map_public_ip_on_launch": True,
        "type": "Public"
      },
      "nova_private_subnet_1": {
        "cidr_block": "10.0.11.0/24",
        "map_public_ip_on_launch": None,
        "type": "Private"
      },
      "nova_private_subnet_2": {
        "cidr_block": "10.0.12.0/24",
        "map_public_ip_on_launch": None,
        "type": "Private"
      }
    }

    for subnet_name, subnet_config in subnet_resources.items():
      if any(expected in subnet_name for expected in expected_subnets):
        # Find matching expected config
        for expected_name, expected_config in expected_subnets.items():
          if expected_name in subnet_name:
            assert subnet_config["cidr_block"] == expected_config["cidr_block"]
            if expected_config["map_public_ip_on_launch"]:
              assert subnet_config["map_public_ip_on_launch"] is True

            # Check subnet tags
            tags = subnet_config["tags"]
            assert tags["Type"] == expected_config["type"]
            assert tags["Environment"] == "Development"

  def test_nat_gateway_creation(self, synthesized_stack):
    """Test NAT Gateway and Elastic IP creation."""
    # Check Elastic IP
    eip_resources = synthesized_stack.get("resource", {}).get("aws_eip", {})
    assert len(eip_resources) == 1

    eip_config = list(eip_resources.values())[0]
    assert eip_config["domain"] == "vpc"

    # Check NAT Gateway
    nat_resources = synthesized_stack.get("resource", {}).get("aws_nat_gateway", {})
    assert len(nat_resources) == 1

    nat_config = list(nat_resources.values())[0]
    assert "allocation_id" in nat_config
    assert "subnet_id" in nat_config

    # Check NAT Gateway tags
    tags = nat_config["tags"]
    assert tags["Name"] == "nova-development-nat-gateway"
    assert tags["Environment"] == "Development"

  def test_route_tables_creation(self, synthesized_stack):
    """Test route table creation and configuration."""
    route_table_resources = synthesized_stack.get("resource", {}).get("aws_route_table", {})
    assert len(route_table_resources) == 2  # Public and Private route tables

    # Check route table tags
    for rt_config in route_table_resources.values():
      tags = rt_config["tags"]
      assert tags["Environment"] == "Development"
      assert "Type" in tags  # Should be either "Public" or "Private"

  def test_routes_creation(self, synthesized_stack):
    """Test route creation for public and private route tables."""
    route_resources = synthesized_stack.get("resource", {}).get("aws_route", {})
    assert len(route_resources) == 2  # One for IGW, one for NAT

    # All routes should target 0.0.0.0/0
    for route_config in route_resources.values():
      assert route_config["destination_cidr_block"] == "0.0.0.0/0"
      # Should have either gateway_id or nat_gateway_id
      assert "gateway_id" in route_config or "nat_gateway_id" in route_config

  def test_route_table_associations(self, synthesized_stack):
    """Test route table associations for all subnets."""
    association_resources = synthesized_stack.get("resource", {}).get(
      "aws_route_table_association", {}
    )
    assert len(association_resources) == 4  # One for each subnet

    # Each association should have subnet_id and route_table_id
    for assoc_config in association_resources.values():
      assert "subnet_id" in assoc_config
      assert "route_table_id" in assoc_config

  def test_s3_bucket_creation(self, synthesized_stack):
    """Test S3 bucket creation and versioning configuration."""
    # Check S3 bucket
    s3_resources = synthesized_stack.get("resource", {}).get("aws_s3_bucket", {})
    assert len(s3_resources) == 1

    bucket_config = list(s3_resources.values())[0]
    tags = bucket_config["tags"]
    assert tags["Environment"] == "Development"
    assert tags["Project"] == "Nova Model Breaking"
    assert tags["Component"] == "Storage"
    assert tags["Purpose"] == "Application Logs Storage"

    # Check S3 bucket versioning
    versioning_resources = synthesized_stack.get("resource", {}).get("aws_s3_bucket_versioning", {})
    assert len(versioning_resources) == 1

    versioning_config = list(versioning_resources.values())[0]
    assert versioning_config["versioning_configuration"]["status"] == "Enabled"

  def test_availability_zones_data_source(self, synthesized_stack):
    """Test availability zones data source configuration."""
    data_sources = synthesized_stack.get("data", {}).get("aws_availability_zones", {})
    assert len(data_sources) == 1

    az_config = list(data_sources.values())[0]
    assert az_config["state"] == "available"

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
      "nat_gateway_id",
      "nat_gateway_public_ip",
      "s3_bucket_name",
      "s3_bucket_arn",
      "availability_zones"
    ]

    for output_name in expected_outputs:
      assert output_name in outputs
      output_config = outputs[output_name]
      assert "value" in output_config
      assert "description" in output_config

  def test_resource_dependencies(self, synthesized_stack):
    """Test that resource dependencies are properly configured."""
    # NAT Gateway should depend on Internet Gateway
    nat_resources = synthesized_stack.get("resource", {}).get("aws_nat_gateway", {})
    nat_config = list(nat_resources.values())[0]
    assert "depends_on" in nat_config

    # Elastic IP should depend on Internet Gateway
    eip_resources = synthesized_stack.get("resource", {}).get("aws_eip", {})
    eip_config = list(eip_resources.values())[0]
    assert "depends_on" in eip_config

  def test_resource_count(self, synthesized_stack):
    """Test that the correct number of each resource type is created."""
    resource_counts = {
      "aws_vpc": 1,
      "aws_subnet": 4,
      "aws_internet_gateway": 1,
      "aws_nat_gateway": 1,
      "aws_eip": 1,
      "aws_route_table": 2,
      "aws_route": 2,
      "aws_route_table_association": 4,
      "aws_s3_bucket": 1,
      "aws_s3_bucket_versioning": 1
    }

    resources = synthesized_stack.get("resource", {})
    for resource_type, expected_count in resource_counts.items():
      actual_count = len(resources.get(resource_type, {}))
      assert actual_count == expected_count, \
        f"Expected {expected_count} {resource_type}, got {actual_count}"

  def test_cidr_blocks_no_overlap(self, synthesized_stack):
    """Test that subnet CIDR blocks don't overlap."""
    subnet_resources = synthesized_stack.get("resource", {}).get("aws_subnet", {})
    cidr_blocks = [config["cidr_block"] for config in subnet_resources.values()]

    # Check that all CIDR blocks are unique
    assert len(cidr_blocks) == len(set(cidr_blocks))

    # Check that all CIDR blocks are within the VPC CIDR  
    for cidr in cidr_blocks:
      # Basic check that subnet CIDRs start with 10.0.
      assert cidr.startswith("10.0.")

  def test_stack_validation(self, stack):
    """Test stack validation passes without errors."""
    try:
      # Attempt to synthesize the stack
      Testing.synth(stack)
      validation_passed = True
    except Exception as e:  # pylint: disable=broad-exception-caught
      validation_passed = False
      pytest.fail(f"Stack validation failed: {str(e)}")

    assert validation_passed

  def test_environment_tags_consistency(self, synthesized_stack):
    """Test that all resources have consistent Environment tags."""
    resources = synthesized_stack.get("resource", {})

    for resource_type, resource_instances in resources.items():
      for resource_name, resource_config in resource_instances.items():
        if "tags" in resource_config:
          tags = resource_config["tags"]
          assert "Environment" in tags, \
            f"Missing Environment tag in {resource_type}.{resource_name}"
          assert tags["Environment"] == "Development", \
            f"Wrong Environment tag value in {resource_type}.{resource_name}"


class TestStackIntegration:
  """Integration tests for the complete stack."""

  def test_complete_stack_synthesis(self):
    """Test that the complete stack can be synthesized without errors."""
    app = App()
    stack = TapStack(
      app, 
      "integration-test-stack",
      description="Integration test stack"
    )

    # Should not raise any exceptions
    synthesized = Testing.synth(stack)
    assert synthesized is not None
    assert "resource" in synthesized
    assert "output" in synthesized

  def test_multiple_stack_instances(self):
    """Test that multiple stack instances can be created."""
    app = App()

    stack1 = TapStack(app, "stack1")
    stack2 = TapStack(app, "stack2")

    assert stack1 is not None
    assert stack2 is not None
    assert stack1 != stack2

  def test_stack_with_custom_description(self):
    """Test stack creation with custom description."""
    app = App()
    custom_description = "Custom test description"

    stack = TapStack(
      app, 
      "custom-stack",
      description=custom_description
    )

    assert stack.description == custom_description


# Test configuration and fixtures for pytest
@pytest.fixture(scope="session")
def test_app():
  """Session-scoped app fixture."""
  return App()


# Pytest configuration
def pytest_configure(config):
  """Configure pytest with custom markers."""
  config.addinivalue_line(
    "markers", "integration: mark test as integration test"
  )
  config.addinivalue_line(
    "markers", "unit: mark test as unit test"
  )


# Custom test markers
pytestmark = pytest.mark.unit
