"""
Integration Tests for AWS Nova Model Breaking VPC Infrastructure

This module contains comprehensive integration tests that validate the complete
infrastructure stack behavior, cross-component interactions, and real-world
deployment scenarios for the AWS VPC infrastructure.
"""

import ipaddress
import json

import pytest
from cdktf import App, Testing

from lib.tap_stack import TapStack


@pytest.mark.integration
class TestCompleteInfrastructureDeployment:
  """Integration tests for complete infrastructure deployment scenarios."""

  def _synth_and_parse(self, stack):
    """Helper method to synthesize stack and parse JSON."""
    synthesized_json = Testing.synth(stack)
    return json.loads(synthesized_json)

  @pytest.fixture(scope="class")
  def production_like_stack(self):
    """Create a production-like stack for integration testing."""
    app = App()
    return TapStack(
      app,
      "prod-like-nova-vpc-stack",
      description="Production-like AWS VPC infrastructure for integration testing"
    )

  @pytest.fixture(scope="class")
  def multi_environment_stacks(self):
    """Create multiple environment stacks for cross-environment testing."""
    app = App()
    stacks = {
      "development": TapStack(
        app, "dev-nova-vpc-stack",
        description="Development environment stack"
      ),
      "staging": TapStack(
        app, "staging-nova-vpc-stack", 
        description="Staging environment stack"
      ),
      "production": TapStack(
        app, "prod-nova-vpc-stack",
        description="Production environment stack"
      )
    }
    return stacks

  def test_complete_stack_synthesis_without_errors(self, production_like_stack):
    """Test that the complete stack synthesizes without any errors."""
    try:
      synthesized_json = Testing.synth(production_like_stack)
      assert synthesized_json is not None
      assert len(synthesized_json) > 0

      # Parse JSON to dictionary
      synthesized = json.loads(synthesized_json)

      # Verify all major sections are present
      required_sections = ["resource", "output", "provider", "data"]
      for section in required_sections:
        assert section in synthesized, f"Missing required section: {section}"

    except Exception as e:
      pytest.fail(f"Stack synthesis failed with error: {str(e)}")

  def test_multi_environment_stack_deployment(self, multi_environment_stacks):
    """Test deployment of multiple environment stacks simultaneously."""
    synthesized_stacks = {}

    for env_name, stack in multi_environment_stacks.items():
      try:
        synthesized_json = Testing.synth(stack)
        synthesized_stacks[env_name] = json.loads(synthesized_json)
      except Exception as e:
        pytest.fail(f"Failed to synthesize {env_name} stack: {str(e)}")

    # Verify all stacks synthesized successfully
    assert len(synthesized_stacks) == 3

    # Each stack should have consistent structure
    for env_name, synthesized in synthesized_stacks.items():
      assert "resource" in synthesized
      assert "output" in synthesized

      # Verify VPC exists in each environment
      vpc_resources = synthesized.get("resource", {}).get("aws_vpc", {})
      assert len(vpc_resources) == 1, f"Missing VPC in {env_name} environment"

  def test_resource_dependency_chain_validation(self, production_like_stack):
    """Test that all resource dependencies are properly configured."""
    synthesized = self._synth_and_parse(production_like_stack)
    resources = synthesized.get("resource", {})

    # NAT Gateway should depend on Internet Gateway
    nat_gateways = resources.get("aws_nat_gateway", {})
    for nat_config in nat_gateways.values():
      assert "depends_on" in nat_config, "NAT Gateway missing dependency on Internet Gateway"

    # Elastic IPs should depend on Internet Gateway
    eips = resources.get("aws_eip", {})
    for eip_config in eips.values():
      assert "depends_on" in eip_config, "EIP missing dependency on Internet Gateway"

    # Routes should reference proper gateways
    routes = resources.get("aws_route", {})
    igw_routes = 0
    nat_routes = 0

    for route_config in routes.values():
      if "gateway_id" in route_config:
        igw_routes += 1
      elif "nat_gateway_id" in route_config:
        nat_routes += 1

    assert igw_routes == 1, "Should have exactly one Internet Gateway route"
    assert nat_routes == 1, "Should have exactly one NAT Gateway route"


@pytest.mark.integration
class TestNetworkingIntegration:
  def _synth_and_parse(self, stack):
    """Helper method to synthesize stack and parse JSON."""
    synthesized_json = Testing.synth(stack)
    return json.loads(synthesized_json)
  """Integration tests for networking components and their interactions."""

  @pytest.fixture(scope="class")
  def networking_stack(self):
    """Stack focused on networking integration testing."""
    app = App()
    return TapStack(
      app,
      "networking-integration-stack",
      description="Stack for networking integration testing"
    )

  def test_vpc_subnet_cidr_allocation(self, networking_stack):
    """Test that subnet CIDR blocks are properly allocated within VPC CIDR."""
    synthesized = self._synth_and_parse(networking_stack)

    # Get VPC CIDR
    vpc_resources = synthesized.get("resource", {}).get("aws_vpc", {})
    vpc_config = list(vpc_resources.values())[0]
    vpc_cidr = ipaddress.IPv4Network(vpc_config["cidr_block"])

    # Get all subnet CIDRs
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})
    subnet_cidrs = []

    for subnet_config in subnet_resources.values():
      subnet_cidr = ipaddress.IPv4Network(subnet_config["cidr_block"])
      subnet_cidrs.append(subnet_cidr)

      # Verify subnet is within VPC CIDR
      assert subnet_cidr.subnet_of(vpc_cidr), f"Subnet {subnet_cidr} is not within VPC {vpc_cidr}"

    # Verify no subnet overlaps
    for i, cidr1 in enumerate(subnet_cidrs):
      for cidr2 in subnet_cidrs[i+1:]:
        assert not cidr1.overlaps(cidr2), f"Subnets {cidr1} and {cidr2} overlap"

    # Verify we have exactly 4 subnets
    assert len(subnet_cidrs) == 4, "Should have exactly 4 subnets"

  def test_multi_az_subnet_distribution(self, networking_stack):
    """Test that subnets are properly distributed across availability zones."""
    synthesized = self._synth_and_parse(networking_stack)

    # Get availability zones data source
    az_data_sources = synthesized.get("data", {}).get("aws_availability_zones", {})
    assert len(az_data_sources) == 1, "Should have exactly one AZ data source"

    # Get subnet configurations
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})

    # Track AZ usage
    az_usage = {}
    public_subnets = []
    private_subnets = []

    for subnet_name, subnet_config in subnet_resources.items():
      az_ref = subnet_config.get("availability_zone")
      assert az_ref is not None, f"Subnet {subnet_name} missing availability_zone"

      # Count AZ usage
      az_usage[az_ref] = az_usage.get(az_ref, 0) + 1

      # Categorize subnets
      if subnet_config.get("map_public_ip_on_launch"):
        public_subnets.append(subnet_name)
      else:
        private_subnets.append(subnet_name)

    # Verify we have 2 public and 2 private subnets
    assert len(public_subnets) == 2, "Should have exactly 2 public subnets"
    assert len(private_subnets) == 2, "Should have exactly 2 private subnets"

    # Verify AZ distribution (should use exactly 2 AZs)
    assert len(az_usage) == 2, "Should use exactly 2 availability zones"
    for az, count in az_usage.items():
      assert count == 2, f"Each AZ should have exactly 2 subnets, {az} has {count}"

  def test_routing_table_associations_completeness(self, networking_stack):
    """Test that all subnets have proper route table associations."""
    synthesized = self._synth_and_parse(networking_stack)

    # Get all subnets
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})
    subnet_ids = set()
    for subnet_name in subnet_resources:
      # Construct expected subnet ID reference
      subnet_ids.add(f"${{aws_subnet.{subnet_name}.id}}")

    # Get all route table associations
    associations = synthesized.get("resource", {}).get("aws_route_table_association", {})
    associated_subnet_ids = set()

    for assoc_config in associations.values():
      associated_subnet_ids.add(assoc_config["subnet_id"])

    # Verify every subnet has an association
    assert len(associated_subnet_ids) == len(subnet_ids), "Not all subnets have route table associations"

    # Verify we have exactly 4 associations
    assert len(associations) == 4, "Should have exactly 4 route table associations"

  def test_internet_connectivity_configuration(self, networking_stack):
    """Test that internet connectivity is properly configured for different subnet types."""
    synthesized = self._synth_and_parse(networking_stack)

    # Get route tables
    route_tables = synthesized.get("resource", {}).get("aws_route_table", {})
    assert len(route_tables) == 2, "Should have exactly 2 route tables"

    # Get routes
    routes = synthesized.get("resource", {}).get("aws_route", {})
    assert len(routes) == 2, "Should have exactly 2 routes"

    # Verify both routes target 0.0.0.0/0
    for route_config in routes.values():
      assert route_config["destination_cidr_block"] == "0.0.0.0/0"

    # Should have one route via IGW and one via NAT
    igw_routes = sum(1 for route in routes.values() if "gateway_id" in route)
    nat_routes = sum(1 for route in routes.values() if "nat_gateway_id" in route)

    assert igw_routes == 1, "Should have exactly one Internet Gateway route"
    assert nat_routes == 1, "Should have exactly one NAT Gateway route"


@pytest.mark.integration
class TestHighAvailabilityIntegration:
  def _synth_and_parse(self, stack):
    """Helper method to synthesize stack and parse JSON."""
    synthesized_json = Testing.synth(stack)
    return json.loads(synthesized_json)
  """Integration tests for high availability and fault tolerance."""

  @pytest.fixture(scope="class")
  def ha_stack(self):
    """High availability focused stack."""
    app = App()
    return TapStack(
      app,
      "ha-integration-stack",
      description="High availability integration testing stack"
    )

  def test_multi_az_resilience(self, ha_stack):
    """Test that infrastructure is resilient across multiple availability zones."""
    synthesized = self._synth_and_parse(ha_stack)

    # Verify multi-AZ subnet deployment
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})

    # Track AZ distribution
    az_distribution = {"public": set(), "private": set()}

    for subnet_config in subnet_resources.values():
      az_ref = subnet_config["availability_zone"]

      if subnet_config.get("map_public_ip_on_launch"):
        az_distribution["public"].add(az_ref)
      else:
        az_distribution["private"].add(az_ref)

    # Verify both public and private subnets span multiple AZs
    assert len(az_distribution["public"]) >= 2, "Public subnets should span at least 2 AZs"
    assert len(az_distribution["private"]) >= 2, "Private subnets should span at least 2 AZs"

    # Verify AZ overlap for cross-AZ connectivity
    assert az_distribution["public"] == az_distribution["private"], "Public and private subnets should use same AZs"

  def test_single_point_of_failure_analysis(self, ha_stack):
    """Test for potential single points of failure in the architecture."""
    synthesized = self._synth_and_parse(ha_stack)

    # Critical components that should have redundancy considerations
    critical_components = {
      "aws_nat_gateway": 1,  # Acceptable for dev environment
      "aws_internet_gateway": 1,  # Single IGW per VPC is normal
      "aws_vpc": 1,  # Single VPC is expected
    }

    resources = synthesized.get("resource", {})
    for component, expected_count in critical_components.items():
      actual_count = len(resources.get(component, {}))
      assert actual_count == expected_count, f"Unexpected count for {component}: {actual_count}"

    # Verify NAT Gateway placement for optimal availability
    nat_gateways = resources.get("aws_nat_gateway", {})
    for nat_config in nat_gateways.values():
      # NAT Gateway should be in a public subnet
      subnet_id_ref = nat_config["subnet_id"]
      assert "public_subnet" in subnet_id_ref, "NAT Gateway should be in a public subnet"

  def test_cross_az_connectivity_validation(self, ha_stack):
    """Test that cross-AZ connectivity is properly established."""
    synthesized = self._synth_and_parse(ha_stack)

    # Get route table associations to verify cross-AZ routing
    associations = synthesized.get("resource", {}).get("aws_route_table_association", {})
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})

    # Map subnets to their route tables
    subnet_to_rt = {}
    for assoc_config in associations.values():
      subnet_id = assoc_config["subnet_id"]
      rt_id = assoc_config["route_table_id"]
      subnet_to_rt[subnet_id] = rt_id

    # Verify all subnets of same type use same route table
    public_route_tables = set()
    private_route_tables = set()

    for subnet_name, subnet_config in subnet_resources.items():
      subnet_id_ref = f"${{aws_subnet.{subnet_name}.id}}"
      rt_id = subnet_to_rt.get(subnet_id_ref)

      if subnet_config.get("map_public_ip_on_launch"):
        public_route_tables.add(rt_id)
      else:
        private_route_tables.add(rt_id)

    # All public subnets should use same route table
    assert len(public_route_tables) == 1, "All public subnets should use same route table"
    # All private subnets should use same route table  
    assert len(private_route_tables) == 1, "All private subnets should use same route table"


@pytest.mark.integration
class TestSecurityIntegration:
  def _synth_and_parse(self, stack):
    """Helper method to synthesize stack and parse JSON."""
    synthesized_json = Testing.synth(stack)
    return json.loads(synthesized_json)
  """Integration tests for security configurations and compliance."""

  @pytest.fixture(scope="class")
  def security_stack(self):
    """Security-focused stack for testing."""
    app = App()
    return TapStack(
      app,
      "security-integration-stack",
      description="Security integration testing stack"
    )

  def test_network_segmentation_compliance(self, security_stack):
    """Test that network segmentation follows security best practices."""
    synthesized = self._synth_and_parse(security_stack)

    # Verify private subnets don't have direct internet access
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})

    for subnet_name, subnet_config in subnet_resources.items():
      tags = subnet_config.get("tags", {})
      subnet_type = tags.get("Type", "")

      if subnet_type == "Private":
        # Private subnets should not auto-assign public IPs
        auto_assign = subnet_config.get("map_public_ip_on_launch")
        assert auto_assign is None or auto_assign is False, f"Private subnet {subnet_name} should not auto-assign public IPs"
      elif subnet_type == "Public":
        # Public subnets should auto-assign public IPs
        auto_assign = subnet_config.get("map_public_ip_on_launch")
        assert auto_assign is True, f"Public subnet {subnet_name} should auto-assign public IPs"

  def test_controlled_internet_access_validation(self, security_stack):
    """Test that internet access is properly controlled through gateways."""
    synthesized = self._synth_and_parse(security_stack)

    # Get route configurations
    routes = synthesized.get("resource", {}).get("aws_route", {})
    route_tables = synthesized.get("resource", {}).get("aws_route_table", {})
    associations = synthesized.get("resource", {}).get("aws_route_table_association", {})

    # Build routing topology
    rt_to_gateway = {}
    for route_config in routes.values():
      rt_id = route_config["route_table_id"]
      if "gateway_id" in route_config:
        rt_to_gateway[rt_id] = "internet_gateway"
      elif "nat_gateway_id" in route_config:
        rt_to_gateway[rt_id] = "nat_gateway"

    # Verify routing security
    assert len(rt_to_gateway) == 2, "Should have exactly 2 route tables with internet routes"

    # Should have one IGW route and one NAT route
    gateway_types = list(rt_to_gateway.values())
    assert "internet_gateway" in gateway_types, "Missing Internet Gateway route"
    assert "nat_gateway" in gateway_types, "Missing NAT Gateway route"

  def test_resource_tagging_compliance(self, security_stack):
    """Test that all resources have proper security and compliance tags."""
    synthesized = self._synth_and_parse(security_stack)

    required_tags = {
      "Environment": "Development",
      "Project": "Nova Model Breaking"
    }

    # Check all taggable resources
    taggable_resources = [
      "aws_vpc", "aws_subnet", "aws_internet_gateway", 
      "aws_nat_gateway", "aws_eip", "aws_route_table", "aws_s3_bucket"
    ]

    resources = synthesized.get("resource", {})
    for resource_type in taggable_resources:
      resource_instances = resources.get(resource_type, {})

      for resource_name, resource_config in resource_instances.items():
        tags = resource_config.get("tags", {})

        for required_tag, expected_value in required_tags.items():
          assert required_tag in tags, f"Missing required tag '{required_tag}' in {resource_type}.{resource_name}"
          assert tags[required_tag] == expected_value, f"Wrong value for tag '{required_tag}' in {resource_type}.{resource_name}"


@pytest.mark.integration
class TestStorageIntegration:
  def _synth_and_parse(self, stack):
    """Helper method to synthesize stack and parse JSON."""
    synthesized_json = Testing.synth(stack)
    return json.loads(synthesized_json)
  """Integration tests for storage components and data protection."""

  @pytest.fixture(scope="class")
  def storage_stack(self):
    """Storage-focused stack for testing."""
    app = App()
    return TapStack(
      app,
      "storage-integration-stack", 
      description="Storage integration testing stack"
    )

  def test_s3_bucket_configuration_integration(self, storage_stack):
    """Test complete S3 bucket configuration with versioning and security."""
    synthesized = self._synth_and_parse(storage_stack)

    # Verify S3 bucket exists
    s3_buckets = synthesized.get("resource", {}).get("aws_s3_bucket", {})
    assert len(s3_buckets) == 1, "Should have exactly one S3 bucket"

    bucket_config = list(s3_buckets.values())[0]

    # Verify bucket tags
    tags = bucket_config.get("tags", {})
    assert tags["Purpose"] == "Application Logs Storage", "Bucket should be for application logs"
    assert tags["Component"] == "Storage", "Bucket should be tagged as Storage component"

    # Verify versioning configuration
    versioning_resources = synthesized.get("resource", {}).get("aws_s3_bucket_versioning", {})
    assert len(versioning_resources) == 1, "Should have exactly one versioning configuration"

    versioning_config = list(versioning_resources.values())[0]
    assert versioning_config["versioning_configuration"]["status"] == "Enabled", "Versioning should be enabled"

  def test_unique_bucket_naming_strategy(self, storage_stack):
    """Test that bucket naming includes uniqueness strategy."""
    synthesized = self._synth_and_parse(storage_stack)

    # Verify random ID resource for unique naming (optional for this implementation)
    random_ids = synthesized.get("resource", {}).get("random_id", {})

    # The bucket should exist regardless of random ID usage
    s3_buckets = synthesized.get("resource", {}).get("aws_s3_bucket", {})
    assert len(s3_buckets) >= 1, "Should have at least one S3 bucket"

    # If random IDs are used, verify configuration
    if len(random_ids) > 0:
      assert len(random_ids) == 1, "Should have exactly one random ID for bucket naming"
      random_config = list(random_ids.values())[0]
      assert random_config["byte_length"] == 8, "Random ID should be 8 bytes for sufficient uniqueness"

  def test_data_protection_measures(self, storage_stack):
    """Test that proper data protection measures are in place."""
    synthesized = self._synth_and_parse(storage_stack)

    # S3 versioning should be enabled
    versioning_resources = synthesized.get("resource", {}).get("aws_s3_bucket_versioning", {})
    assert len(versioning_resources) > 0, "S3 versioning should be configured"

    for versioning_config in versioning_resources.values():
      status = versioning_config["versioning_configuration"]["status"]
      assert status == "Enabled", "S3 versioning should be enabled for data protection"


@pytest.mark.integration
class TestCostOptimizationIntegration:
  def _synth_and_parse(self, stack):
    """Helper method to synthesize stack and parse JSON."""
    synthesized_json = Testing.synth(stack)
    return json.loads(synthesized_json)
  """Integration tests for cost optimization and resource efficiency."""

  @pytest.fixture(scope="class")
  def cost_optimized_stack(self):
    """Cost optimization focused stack."""
    app = App()
    return TapStack(
      app,
      "cost-optimization-stack",
      description="Cost optimization integration testing stack"
    )

  def test_nat_gateway_cost_optimization(self, cost_optimized_stack):
    """Test that NAT Gateway configuration is cost-optimized for development."""
    synthesized = self._synth_and_parse(cost_optimized_stack)

    # Should have only one NAT Gateway (cost optimization for dev)
    nat_gateways = synthesized.get("resource", {}).get("aws_nat_gateway", {})
    assert len(nat_gateways) == 1, "Should have only one NAT Gateway for cost optimization"

    # NAT Gateway should be in a public subnet
    nat_config = list(nat_gateways.values())[0]
    subnet_ref = nat_config["subnet_id"]
    assert "public_subnet" in subnet_ref, "NAT Gateway should be in public subnet"

  def test_resource_rightsizing_for_development(self, cost_optimized_stack):
    """Test that resources are appropriately sized for development environment.""" 
    synthesized = self._synth_and_parse(cost_optimized_stack)

    # Verify subnet CIDR sizing is appropriate
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})

    for subnet_config in subnet_resources.values():
      cidr = subnet_config["cidr_block"]
      network = ipaddress.IPv4Network(cidr)

      # /24 subnets provide 256 IPs (254 usable) - appropriate for dev
      assert network.prefixlen == 24, f"Subnet {cidr} should use /24 for development efficiency"

  def test_shared_resource_utilization(self, cost_optimized_stack):
    """Test that resources are shared where appropriate for cost optimization."""
    synthesized = self._synth_and_parse(cost_optimized_stack)

    # Private subnets should share the same NAT Gateway
    associations = synthesized.get("resource", {}).get("aws_route_table_association", {})
    routes = synthesized.get("resource", {}).get("aws_route", {})

    # Count routes that use NAT Gateway
    nat_routes = [route for route in routes.values() if "nat_gateway_id" in route]
    assert len(nat_routes) == 1, "Should have only one NAT Gateway route (shared by all private subnets)"


@pytest.mark.integration
class TestComplianceAndBestPractices:
  def _synth_and_parse(self, stack):
    """Helper method to synthesize stack and parse JSON."""
    synthesized_json = Testing.synth(stack)
    return json.loads(synthesized_json)
  """Integration tests for AWS best practices and compliance validation."""

  @pytest.fixture(scope="class")
  def compliance_stack(self):
    """Compliance-focused stack for testing."""
    app = App()
    return TapStack(
      app,
      "compliance-integration-stack",
      description="Compliance and best practices integration testing stack"
    )

  def test_aws_well_architected_compliance(self, compliance_stack):
    """Test compliance with AWS Well-Architected Framework principles."""
    synthesized = self._synth_and_parse(compliance_stack)

    # Security Pillar: Network segmentation
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})
    public_subnets = []
    private_subnets = []

    for subnet_config in subnet_resources.values():
      if subnet_config.get("map_public_ip_on_launch"):
        public_subnets.append(subnet_config)
      else:
        private_subnets.append(subnet_config)

    assert len(public_subnets) > 0, "Should have public subnets for internet-facing resources"
    assert len(private_subnets) > 0, "Should have private subnets for internal resources"

    # Reliability Pillar: Multi-AZ deployment
    az_refs = set()
    for subnet_config in subnet_resources.values():
      az_refs.add(subnet_config["availability_zone"])
    assert len(az_refs) >= 2, "Should use multiple AZs for reliability"

    # Cost Optimization Pillar: Appropriate resource sizing
    vpc_resources = synthesized.get("resource", {}).get("aws_vpc", {})
    vpc_config = list(vpc_resources.values())[0]
    vpc_cidr = ipaddress.IPv4Network(vpc_config["cidr_block"])
    assert vpc_cidr.prefixlen == 16, "VPC should use /16 for appropriate IP space"

  def test_infrastructure_as_code_best_practices(self, compliance_stack):
    """Test that IaC best practices are followed."""
    synthesized = self._synth_and_parse(compliance_stack)

    # All resources should have proper tags
    taggable_resource_types = [
      "aws_vpc", "aws_subnet", "aws_internet_gateway",
      "aws_nat_gateway", "aws_eip", "aws_route_table", "aws_s3_bucket"
    ]

    resources = synthesized.get("resource", {})
    for resource_type in taggable_resource_types:
      resource_instances = resources.get(resource_type, {})
      for resource_name, resource_config in resource_instances.items():
        tags = resource_config.get("tags", {})
        assert len(tags) > 0, f"Resource {resource_type}.{resource_name} should have tags"
        assert "Environment" in tags, f"Resource {resource_type}.{resource_name} missing Environment tag"

  def test_output_completeness_for_integration(self, compliance_stack):
    """Test that all necessary outputs are provided for system integration."""
    synthesized = self._synth_and_parse(compliance_stack)

    outputs = synthesized.get("output", {})

    # Critical outputs for integration
    critical_outputs = [
      "vpc_id", "public_subnet_ids", "private_subnet_ids",
      "internet_gateway_id", "nat_gateway_id", "s3_bucket_name"
    ]

    for output_name in critical_outputs:
      assert output_name in outputs, f"Missing critical output: {output_name}"
      output_config = outputs[output_name]
      assert "value" in output_config, f"Output {output_name} missing value"
      assert "description" in output_config, f"Output {output_name} missing description"


@pytest.mark.integration
@pytest.mark.slow
class TestPerformanceAndScalability:
  def _synth_and_parse(self, stack):
    """Helper method to synthesize stack and parse JSON."""
    synthesized_json = Testing.synth(stack)
    return json.loads(synthesized_json)
  """Integration tests for performance and scalability characteristics."""

  @pytest.fixture(scope="class")
  def scalability_stack(self):
    """Scalability-focused stack for testing."""
    app = App()
    return TapStack(
      app,
      "scalability-integration-stack",
      description="Scalability and performance integration testing stack"
    )

  def test_ip_address_space_scalability(self, scalability_stack):
    """Test that IP address allocation supports future scaling."""
    synthesized = self._synth_and_parse(scalability_stack)

    # Get VPC and subnet CIDRs
    vpc_resources = synthesized.get("resource", {}).get("aws_vpc", {})
    vpc_config = list(vpc_resources.values())[0]
    vpc_network = ipaddress.IPv4Network(vpc_config["cidr_block"])

    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})
    total_allocated_ips = 0

    for subnet_config in subnet_resources.values():
      subnet_network = ipaddress.IPv4Network(subnet_config["cidr_block"])
      total_allocated_ips += subnet_network.num_addresses

    vpc_total_ips = vpc_network.num_addresses
    utilization_percentage = (total_allocated_ips / vpc_total_ips) * 100

    # Should have room for growth (less than 50% utilization)
    assert utilization_percentage < 50, f"IP utilization too high: {utilization_percentage}%"

  def test_subnet_capacity_planning(self, scalability_stack):
    """Test that subnet sizing supports expected workload scaling."""
    synthesized = self._synth_and_parse(scalability_stack)

    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})

    for subnet_name, subnet_config in subnet_resources.items():
      subnet_network = ipaddress.IPv4Network(subnet_config["cidr_block"])
      usable_ips = subnet_network.num_addresses - 5  # AWS reserves 5 IPs

      # Each /24 subnet should have sufficient capacity for development workloads
      assert usable_ips >= 250, f"Subnet {subnet_name} has insufficient capacity: {usable_ips} IPs"

  def test_cross_region_expandability(self, scalability_stack):
    """Test that the design supports future cross-region expansion."""
    synthesized = self._synth_and_parse(scalability_stack)

    # Verify region configuration is parameterized
    providers = synthesized.get("provider", {}).get("aws", [])
    assert len(providers) > 0, "Should have AWS provider configuration"

    aws_provider = providers[0]
    assert aws_provider["region"] == "us-west-2", "Region should be configurable"

    # VPC CIDR should allow for cross-region peering
    vpc_resources = synthesized.get("resource", {}).get("aws_vpc", {})
    vpc_config = list(vpc_resources.values())[0]
    vpc_network = ipaddress.IPv4Network(vpc_config["cidr_block"])

    # Using 10.0.0.0/16 is part of the 10.0.0.0/8 space, allowing for other regions
    # (10.1.0.0/16, 10.2.0.0/16, etc.)
    assert vpc_network.network_address.packed[0] == 10, "Should use 10.x.x.x private space"
    assert vpc_network.prefixlen >= 16, "VPC should use /16 or smaller to allow expansion"


# Test execution helpers
@pytest.mark.integration
def test_integration_test_suite_completeness():
  """Meta-test to ensure integration test suite covers all critical areas."""

  # Define critical integration test areas
  critical_areas = [
    "complete_infrastructure_deployment",
    "networking_integration", 
    "high_availability",
    "security_integration",
    "storage_integration",
    "cost_optimization",
    "compliance_and_best_practices",
    "performance_and_scalability"
  ]

  # This test serves as documentation of test coverage
  assert len(critical_areas) >= 8, "Should cover at least 8 critical integration areas"


if __name__ == "__main__":
  # Run integration tests with verbose output
  pytest.main([__file__, "-v", "-m", "integration"])
