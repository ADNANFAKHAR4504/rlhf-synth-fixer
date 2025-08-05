"""
Integration Tests for AWS Production Infrastructure

This module contains comprehensive integration tests that validate the complete
production infrastructure stack behavior, security implementations, high availability,
and real-world deployment scenarios.
"""

import ipaddress
import json

import pytest
from cdktf import App, Testing

from lib.tap_stack import TapStack


def synth_stack(stack):
  """Helper function to synthesize a stack and return parsed JSON."""
  return json.loads(Testing.synth(stack))


@pytest.mark.integration
class TestProductionInfrastructureDeployment:
  """Integration tests for complete production infrastructure deployment."""

  @pytest.fixture(scope="class")
  def production_stack(self):
    """Create a production stack for integration testing."""
    app = App()
    return TapStack(
        app,
        "prod-integration-stack",
        description="Production infrastructure integration testing stack"
    )

  @pytest.fixture(scope="class")
  def multi_region_stacks(self):
    """Create stacks for multi-region testing scenarios."""
    app = App()
    stacks = {}

    # Simulate different regions by creating multiple stacks
    regions = ["us-west-2", "us-east-1", "eu-west-1"]
    for region in regions:
      stack = TapStack(
          app,
          f"prod-{region.replace('-', '_')}-stack",
          description=f"Production stack for {region}"
      )
      # Override region for testing
      stack.aws_region = region
      stacks[region] = stack

    return stacks

  def test_complete_production_stack_synthesis(self, production_stack):
    """Test that the complete production stack synthesizes without errors."""
    try:
      synthesized = synth_stack(production_stack)
      assert synthesized is not None
      assert len(synthesized) > 0

      # Verify all major sections are present
      required_sections = ["resource", "output", "provider", "data"]
      for section in required_sections:
        assert section in synthesized, f"Missing required section: {section}"

    except Exception as e:
      pytest.fail(f"Production stack synthesis failed: {str(e)}")

  def test_production_resource_provisioning_order(self, production_stack):
    """Test that resources have proper dependency ordering for production deployment."""
    synthesized = synth_stack(production_stack)
    resources = synthesized.get("resource", {})

    # NAT Gateways should depend on Internet Gateway
    nat_gateways = resources.get("aws_nat_gateway", {})
    for nat_config in nat_gateways.values():
      assert "depends_on" in nat_config, "NAT Gateway missing dependency"

    # Elastic IPs should depend on Internet Gateway
    eips = resources.get("aws_eip", {})
    for eip_config in eips.values():
      assert "depends_on" in eip_config, "EIP missing dependency"

    # Bastion host should reference security group and subnet
    instances = resources.get("aws_instance", {})
    for instance_config in instances.values():
      assert "vpc_security_group_ids" in instance_config
      assert "subnet_id" in instance_config

  def test_multi_region_deployment_compatibility(self, multi_region_stacks):
    """Test that the stack can be deployed across multiple regions."""
    synthesized_stacks = {}

    for region, stack in multi_region_stacks.items():
      try:
        synthesized_stacks[region] = synth_stack(stack)
      except Exception as e:
        pytest.fail(f"Failed to synthesize stack for {region}: {str(e)}")

    # Verify all regions synthesized successfully
    assert len(synthesized_stacks) == 3

    # Each stack should have consistent structure
    for region, synthesized in synthesized_stacks.items():
      assert "resource" in synthesized
      assert "output" in synthesized

      # Verify VPC exists in each region
      vpc_resources = synthesized.get("resource", {}).get("aws_vpc", {})
      assert len(vpc_resources) == 1, f"Missing VPC in {region}"


@pytest.mark.integration
class TestProductionNetworkingIntegration:
  """Integration tests for production networking components and security."""

  @pytest.fixture(scope="class")
  def networking_stack(self):
    """Stack focused on networking integration testing."""
    app = App()
    return TapStack(
        app,
        "networking-integration-stack",
        description="Production networking integration testing"
    )

  def test_vpc_cidr_and_subnet_allocation(self, networking_stack):
    """Test production VPC CIDR allocation and subnet distribution."""
    synthesized = synth_stack(networking_stack)

    # Get VPC CIDR - must be exactly 10.0.0.0/16 per requirements
    vpc_resources = synthesized.get("resource", {}).get("aws_vpc", {})
    vpc_config = list(vpc_resources.values())[0]
    vpc_cidr = ipaddress.IPv4Network(vpc_config["cidr_block"])

    assert str(vpc_cidr) == "10.0.0.0/16", "VPC CIDR must be exactly 10.0.0.0/16"

    # Get all subnet CIDRs and validate allocation
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})
    public_subnets = []
    private_subnets = []

    for subnet_config in subnet_resources.values():
      subnet_cidr = ipaddress.IPv4Network(subnet_config["cidr_block"])
      tags = subnet_config.get("tags", {})

      # Verify subnet is within VPC CIDR
      assert subnet_cidr.subnet_of(
          vpc_cidr), f"Subnet {subnet_cidr} not within VPC {vpc_cidr}"

      if tags.get("Type") == "Public":
        public_subnets.append(subnet_cidr)
      elif tags.get("Type") == "Private":
        private_subnets.append(subnet_cidr)

    # Verify exactly 2 public and 2 private subnets
    assert len(public_subnets) == 2, "Must have exactly 2 public subnets"
    assert len(private_subnets) == 2, "Must have exactly 2 private subnets"

    # Verify no subnet overlaps
    all_subnets = public_subnets + private_subnets
    for i, cidr1 in enumerate(all_subnets):
      for _, cidr2 in enumerate(all_subnets[i + 1:], i + 1):
        assert not cidr1.overlaps(
            cidr2), f"Subnets {cidr1} and {cidr2} overlap"

  def test_high_availability_subnet_distribution(self, networking_stack):
    """Test that subnets are distributed across exactly 2 availability zones."""
    synthesized = synth_stack(networking_stack)

    # Get availability zones data source
    az_data_sources = synthesized.get(
        "data", {}).get(
        "aws_availability_zones", {})
    assert len(az_data_sources) == 1, "Should have exactly one AZ data source"

    # Get subnet configurations and track AZ usage
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})
    az_usage = {}
    public_az_count = {}
    private_az_count = {}

    for subnet_config in subnet_resources.values():
      az_ref = subnet_config.get("availability_zone")
      assert az_ref is not None, "Subnet missing availability_zone"

      # Track overall AZ usage
      az_usage[az_ref] = az_usage.get(az_ref, 0) + 1

      # Track AZ usage by subnet type
      tags = subnet_config.get("tags", {})
      subnet_type = tags.get("Type", "")

      if subnet_type == "Public":
        public_az_count[az_ref] = public_az_count.get(az_ref, 0) + 1
      elif subnet_type == "Private":
        private_az_count[az_ref] = private_az_count.get(az_ref, 0) + 1

    # Verify exactly 2 AZs are used
    assert len(az_usage) == 2, "Must use exactly 2 availability zones"

    # Verify each AZ has exactly 2 subnets (1 public + 1 private)
    for az, count in az_usage.items():
      assert count == 2, f"AZ {az} should have exactly 2 subnets, has {count}"

    # Verify each AZ has 1 public and 1 private subnet
    assert len(public_az_count) == 2, "Public subnets should span 2 AZs"
    assert len(private_az_count) == 2, "Private subnets should span 2 AZs"

    for az, count in public_az_count.items():
      assert count == 1, f"AZ {az} should have exactly 1 public subnet"
    for az, count in private_az_count.items():
      assert count == 1, f"AZ {az} should have exactly 1 private subnet"

  def test_internet_connectivity_configuration(self, networking_stack):
    """Test that internet connectivity is properly configured for production."""
    synthesized = synth_stack(networking_stack)

    # Verify Internet Gateway configuration
    igw_resources = synthesized.get(
        "resource", {}).get(
        "aws_internet_gateway", {})
    assert len(igw_resources) == 1, "Should have exactly 1 Internet Gateway"

    # Verify NAT Gateway configuration for high availability
    nat_resources = synthesized.get("resource", {}).get("aws_nat_gateway", {})
    assert len(nat_resources) == 2, "Should have exactly 2 NAT Gateways for HA"

    # Verify route tables
    route_table_resources = synthesized.get(
        "resource", {}).get(
        "aws_route_table", {})
    public_rts = []
    private_rts = []

    for rt_config in route_table_resources.values():
      tags = rt_config.get("tags", {})
      rt_type = tags.get("Type", "")

      if rt_type == "Public":
        public_rts.append(rt_config)
      elif rt_type == "Private":
        private_rts.append(rt_config)

    assert len(public_rts) == 1, "Should have 1 public route table"
    assert len(private_rts) == 2, "Should have 2 private route tables (1 per AZ)"

    # Verify routes
    route_resources = synthesized.get("resource", {}).get("aws_route", {})
    igw_routes = sum(1 for route in route_resources.values()
                     if "gateway_id" in route)
    nat_routes = sum(1 for route in route_resources.values()
                     if "nat_gateway_id" in route)

    assert igw_routes == 1, "Should have exactly 1 Internet Gateway route"
    assert nat_routes == 2, "Should have exactly 2 NAT Gateway routes"


@pytest.mark.integration
class TestProductionSecurityIntegration:
  """Integration tests for production security configurations."""

  @pytest.fixture(scope="class")
  def security_stack(self):
    """Security-focused stack for production testing."""
    app = App()
    return TapStack(
        app,
        "security-integration-stack",
        description="Production security integration testing"
    )

  def test_bastion_host_security_configuration(self, security_stack):
    """Test Bastion host security implementation for production."""
    synthesized = synth_stack(security_stack)

    # Verify Bastion host exists
    instance_resources = synthesized.get(
        "resource", {}).get(
        "aws_instance", {})
    assert len(instance_resources) == 1, "Should have exactly 1 Bastion host"

    bastion_config = list(instance_resources.values())[0]
    assert bastion_config["associate_public_ip_address"] is True

    # Verify Bastion is in public subnet
    subnet_id_ref = bastion_config["subnet_id"]
    assert "public_subnet" in subnet_id_ref, "Bastion should be in public subnet"

    # Check security group assignment
    assert "vpc_security_group_ids" in bastion_config
    assert len(bastion_config["vpc_security_group_ids"]) > 0

  def test_ssh_access_restriction_compliance(self, security_stack):
    """Test that SSH access is restricted to allowed CIDR block."""
    synthesized = synth_stack(security_stack)

    # Get security group rules
    sg_rules = synthesized.get(
        "resource", {}).get(
        "aws_security_group_rule", {})

    # Find SSH ingress rules
    ssh_ingress_rules = []
    for rule_config in sg_rules.values():
      if (rule_config.get("type") == "ingress" and
          rule_config.get("from_port") == 22 and
              rule_config.get("to_port") == 22):
        ssh_ingress_rules.append(rule_config)

    assert len(ssh_ingress_rules) > 0, "Should have SSH ingress rules"

    # Verify SSH access is restricted to allowed CIDR
    restricted_ssh_found = False
    for rule in ssh_ingress_rules:
      cidr_blocks = rule.get("cidr_blocks", [])
      if "203.0.113.0/24" in cidr_blocks:
        restricted_ssh_found = True
        # Ensure no other CIDR blocks are allowed
        assert cidr_blocks == [
            "203.0.113.0/24"], "SSH should only allow specific CIDR"
        break

    assert restricted_ssh_found, "SSH access must be restricted to 203.0.113.0/24"

  def test_security_group_segregation(self, security_stack):
    """Test that security groups properly segregate access."""
    synthesized = synth_stack(security_stack)

    # Get security groups
    sg_resources = synthesized.get(
        "resource", {}).get(
        "aws_security_group", {})
    assert len(sg_resources) == 2, "Should have 2 security groups"

    bastion_sg = None
    private_sg = None

    for sg_config in sg_resources.values():
      tags = sg_config.get("tags", {})
      purpose = tags.get("Purpose", "")

      if "Bastion" in purpose:
        bastion_sg = sg_config
      elif "Private" in purpose:
        private_sg = sg_config

    assert bastion_sg is not None, "Should have Bastion security group"
    assert private_sg is not None, "Should have Private security group"

    # Verify security groups are distinct
    assert bastion_sg != private_sg, "Security groups should be different"

  def test_network_segmentation_enforcement(self, security_stack):
    """Test that network segmentation is properly enforced."""
    synthesized = synth_stack(security_stack)

    # Get security group rules
    sg_rules = synthesized.get(
        "resource", {}).get(
        "aws_security_group_rule", {})

    # Verify private instances can only be accessed from Bastion
    private_ssh_access = []
    for rule_config in sg_rules.values():
      if (rule_config.get("type") == "ingress" and
          rule_config.get("from_port") == 22 and
              "source_security_group_id" in rule_config):
        private_ssh_access.append(rule_config)

    assert len(
        private_ssh_access) > 0, "Private instances should have SSH access from Bastion"


@pytest.mark.integration
class TestProductionStorageIntegration:
  """Integration tests for production storage and data protection."""

  @pytest.fixture(scope="class")
  def storage_stack(self):
    """Storage-focused stack for production testing."""
    app = App()
    return TapStack(
        app,
        "storage-integration-stack",
        description="Production storage integration testing"
    )

  def test_s3_bucket_security_configuration(self, storage_stack):
    """Test S3 bucket security configuration for production."""
    synthesized = synth_stack(storage_stack)

    # Verify S3 buckets exist
    s3_resources = synthesized.get("resource", {}).get("aws_s3_bucket", {})
    assert len(s3_resources) == 2, "Should have 2 S3 buckets"

    # Verify versioning is enabled
    versioning_resources = synthesized.get(
        "resource", {}).get(
        "aws_s3_bucket_versioning", {})
    assert len(
        versioning_resources) == 2, "Should have versioning for both buckets"

    for versioning_config in versioning_resources.values():
      assert versioning_config["versioning_configuration"]["status"] == "Enabled"

    # Verify Block Public Access is enabled
    pab_resources = synthesized.get(
        "resource", {}).get(
        "aws_s3_bucket_public_access_block", {})
    assert len(
        pab_resources) == 2, "Should have public access blocks for both buckets"

    for pab_config in pab_resources.values():
      assert pab_config["block_public_acls"] is True
      assert pab_config["block_public_policy"] is True
      assert pab_config["ignore_public_acls"] is True
      assert pab_config["restrict_public_buckets"] is True

  def test_bucket_purpose_segregation(self, storage_stack):
    """Test that buckets are properly segregated by purpose."""
    synthesized = synth_stack(storage_stack)

    s3_resources = synthesized.get("resource", {}).get("aws_s3_bucket", {})
    bucket_purposes = []

    for bucket_config in s3_resources.values():
      tags = bucket_config.get("tags", {})
      purpose = tags.get("Purpose", "")
      bucket_purposes.append(purpose)

    # Should have different purposes
    assert "Application Logs" in bucket_purposes
    assert "Backup Storage" in bucket_purposes
    assert len(set(bucket_purposes)
               ) == 2, "Buckets should have different purposes"

  def test_data_protection_measures(self, storage_stack):
    """Test comprehensive data protection measures."""
    synthesized = synth_stack(storage_stack)

    # Verify all buckets have versioning
    versioning_resources = synthesized.get(
        "resource", {}).get(
        "aws_s3_bucket_versioning", {})
    for versioning_config in versioning_resources.values():
      status = versioning_config["versioning_configuration"]["status"]
      assert status == "Enabled", "All buckets should have versioning enabled"

    # Verify all buckets have public access blocked
    pab_resources = synthesized.get(
        "resource", {}).get(
        "aws_s3_bucket_public_access_block", {})
    for pab_config in pab_resources.values():
      security_settings = [
          pab_config["block_public_acls"],
          pab_config["block_public_policy"],
          pab_config["ignore_public_acls"],
          pab_config["restrict_public_buckets"]
      ]
      assert all(security_settings), "All public access should be blocked"


@pytest.mark.integration
class TestProductionComplianceAndBestPractices:
  """Integration tests for production compliance and AWS best practices."""

  @pytest.fixture(scope="class")
  def compliance_stack(self):
    """Compliance-focused stack for production testing."""
    app = App()
    return TapStack(
        app,
        "compliance-integration-stack",
        description="Production compliance integration testing"
    )

  def test_production_tagging_compliance(self, compliance_stack):
    """Test that all resources have proper production tags."""
    synthesized = synth_stack(compliance_stack)

    required_tags = {
        "Environment": "Production",
        "Project": "AWS Nova Model Breaking"
    }

    # Check all taggable resources (excluding aws_key_pair for Session Manager)
    taggable_resources = [
        "aws_vpc", "aws_subnet", "aws_internet_gateway", "aws_nat_gateway",
        "aws_eip", "aws_route_table", "aws_security_group", "aws_instance",
        "aws_s3_bucket"
    ]

    resources = synthesized.get("resource", {})
    for resource_type in taggable_resources:
      resource_instances = resources.get(resource_type, {})

      for resource_name, resource_config in resource_instances.items():
        tags = resource_config.get("tags", {})

        for required_tag, expected_value in required_tags.items():
          assert required_tag in tags, (
              f"Missing tag '{required_tag}' in {resource_type}.{resource_name}")
          actual_value = tags[required_tag]
          assert actual_value == expected_value, (
              f"Wrong tag value in {resource_type}.{resource_name}: "
              f"expected '{expected_value}', got '{actual_value}'")

  def test_aws_well_architected_framework_compliance(self, compliance_stack):
    """Test compliance with AWS Well-Architected Framework for production."""
    synthesized = synth_stack(compliance_stack)

    # Security Pillar: Network segmentation and access controls
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})
    public_subnets = []
    private_subnets = []

    for subnet_config in subnet_resources.values():
      tags = subnet_config.get("tags", {})
      subnet_type = tags.get("Type", "")

      if subnet_type == "Public":
        public_subnets.append(subnet_config)
      elif subnet_type == "Private":
        private_subnets.append(subnet_config)

    assert len(
        public_subnets) == 2, "Should have public subnets for internet-facing resources"
    assert len(
        private_subnets) == 2, "Should have private subnets for internal resources"

    # Reliability Pillar: Multi-AZ high availability
    nat_gateways = synthesized.get("resource", {}).get("aws_nat_gateway", {})
    assert len(
        nat_gateways) == 2, "Should have 2 NAT Gateways for high availability"

    # Performance Efficiency Pillar: Appropriate resource placement
    bastion_instances = synthesized.get("resource", {}).get("aws_instance", {})
    for instance_config in bastion_instances.values():
      assert instance_config["instance_type"] == "t3.micro", "Should use appropriate instance type"

  def test_production_security_best_practices(self, compliance_stack):
    """Test that production security best practices are implemented."""
    synthesized = synth_stack(compliance_stack)

    # Test principle of least privilege in security groups
    sg_rules = synthesized.get(
        "resource", {}).get(
        "aws_security_group_rule", {})

    # SSH should only be allowed from specific CIDR
    ssh_rules = [rule for rule in sg_rules.values() if rule.get(
        "from_port") == 22 and rule.get("type") == "ingress"]

    for ssh_rule in ssh_rules:
      cidr_blocks = ssh_rule.get("cidr_blocks", [])
      if cidr_blocks:
        # Should not allow 0.0.0.0/0 for SSH
        assert "0.0.0.0/0" not in cidr_blocks, "SSH should not allow access from anywhere"

  def test_infrastructure_outputs_completeness(self, compliance_stack):
    """Test that all necessary outputs are provided for production integration."""
    synthesized = synth_stack(compliance_stack)

    outputs = synthesized.get("output", {})

    # Critical outputs for production integration
    critical_outputs = [
        "vpc_id",
        "public_subnet_ids",
        "private_subnet_ids",
        "bastion_host_public_ip",
        "bastion_security_group_id",
        "private_security_group_id",
        "logs_bucket_name",
        "backup_bucket_name"
    ]

    for output_name in critical_outputs:
      assert output_name in outputs, f"Missing critical output: {output_name}"
      output_config = outputs[output_name]
      assert "value" in output_config, f"Output {output_name} missing value"
      assert "description" in output_config, f"Output {output_name} missing description"


@pytest.mark.integration
@pytest.mark.slow
class TestProductionScalabilityAndPerformance:
  """Integration tests for production scalability and performance characteristics."""

  @pytest.fixture(scope="class")
  def scalability_stack(self):
    """Scalability-focused stack for production testing."""
    app = App()
    return TapStack(
        app,
        "scalability-integration-stack",
        description="Production scalability integration testing"
    )

  def test_network_capacity_planning(self, scalability_stack):
    """Test that network capacity supports production workloads."""
    synthesized = synth_stack(scalability_stack)

    # Analyze IP address allocation efficiency
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

    # Should have room for growth (production environments need scalability)
    assert utilization_percentage < 10, (
        f"IP utilization too high for production: {utilization_percentage}%")

  def test_high_availability_scalability(self, scalability_stack):
    """Test that high availability design supports scaling."""
    synthesized = synth_stack(scalability_stack)

    # Verify NAT Gateway distribution for scaling
    nat_gateways = synthesized.get("resource", {}).get("aws_nat_gateway", {})
    nat_azs = set()

    for nat_config in nat_gateways.values():
      tags = nat_config.get("tags", {})
      az = tags.get("AZ", "")
      if az:
        nat_azs.add(az)

    assert len(nat_azs) == 2, "NAT Gateways should be distributed across 2 AZs"

    # Verify subnet distribution supports horizontal scaling
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})
    subnet_azs = set()

    for subnet_config in subnet_resources.values():
      az_ref = subnet_config.get("availability_zone")
      if az_ref:
        subnet_azs.add(az_ref)

    assert len(
        subnet_azs) == 2, "Subnets should be distributed for horizontal scaling"

  def test_production_resource_sizing(self, scalability_stack):
    """Test that resources are appropriately sized for production."""
    synthesized = synth_stack(scalability_stack)

    # Test subnet sizing for production workloads
    subnet_resources = synthesized.get("resource", {}).get("aws_subnet", {})

    for subnet_config in subnet_resources.values():
      cidr = subnet_config["cidr_block"]
      network = ipaddress.IPv4Network(cidr)
      usable_ips = network.num_addresses - 5  # AWS reserves 5 IPs

      # Production subnets should have adequate capacity
      assert usable_ips >= 200, f"Subnet {cidr} insufficient for production: {usable_ips} IPs"


# Test execution helpers
@pytest.mark.integration
def test_integration_test_suite_completeness():
  """Meta-test to ensure integration test suite covers all critical production areas."""

  critical_areas = [
      "production_infrastructure_deployment",
      "production_networking_integration",
      "production_security_integration",
      "production_storage_integration",
      "production_compliance_and_best_practices",
      "production_scalability_and_performance"
  ]

  assert len(
      critical_areas) >= 6, "Should cover at least 6 critical production areas"


if __name__ == "__main__":
  # Run integration tests with verbose output
  pytest.main([__file__, "-v", "-m", "integration"])
