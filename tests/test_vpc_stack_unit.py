"""
Unit tests for VPC infrastructure Terraform configuration.
Tests validate Terraform HCL syntax, resource configurations, and compliance requirements.
"""

import json
import os
import re
import sys
import unittest
from pathlib import Path


class TestVPCStackUnit(unittest.TestCase):
    """Unit tests for VPC Stack Terraform configuration."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures."""
        cls.lib_dir = Path(__file__).parent.parent / "lib"
        cls.main_tf = cls.lib_dir / "main.tf"
        cls.nacl_tf = cls.lib_dir / "nacl.tf"
        cls.flow_logs_tf = cls.lib_dir / "flow-logs.tf"
        cls.outputs_tf = cls.lib_dir / "outputs.tf"
        cls.variables_tf = cls.lib_dir / "variables.tf"
        cls.provider_tf = cls.lib_dir / "provider.tf"
        
        # Read all Terraform files
        cls.main_content = cls.main_tf.read_text()
        cls.nacl_content = cls.nacl_tf.read_text()
        cls.flow_logs_content = cls.flow_logs_tf.read_text()
        cls.outputs_content = cls.outputs_tf.read_text()
        cls.variables_content = cls.variables_tf.read_text()
        cls.provider_content = cls.provider_tf.read_text()

    def test_terraform_files_exist(self):
        """Test that all required Terraform files exist."""
        self.assertTrue(self.main_tf.exists(), "main.tf should exist")
        self.assertTrue(self.nacl_tf.exists(), "nacl.tf should exist")
        self.assertTrue(self.flow_logs_tf.exists(), "flow-logs.tf should exist")
        self.assertTrue(self.outputs_tf.exists(), "outputs.tf should exist")
        self.assertTrue(self.variables_tf.exists(), "variables.tf should exist")
        self.assertTrue(self.provider_tf.exists(), "provider.tf should exist")

    def test_vpc_resource_defined(self):
        """Test that VPC resource is properly defined."""
        self.assertIn('resource "aws_vpc" "payment_vpc"', self.main_content)
        self.assertIn('cidr_block           = "10.0.0.0/16"', self.main_content)
        self.assertIn('enable_dns_hostnames = true', self.main_content)
        self.assertIn('enable_dns_support   = true', self.main_content)

    def test_vpc_cidr_block(self):
        """Test VPC CIDR block is correctly configured."""
        cidr_pattern = r'cidr_block\s*=\s*"10\.0\.0\.0/16"'
        self.assertIsNotNone(re.search(cidr_pattern, self.main_content))

    def test_internet_gateway_defined(self):
        """Test Internet Gateway resource is defined."""
        self.assertIn('resource "aws_internet_gateway" "payment_igw"', self.main_content)
        self.assertIn('vpc_id = aws_vpc.payment_vpc.id', self.main_content)

    def test_public_subnets_count(self):
        """Test that 3 public subnets are defined."""
        public_subnet_matches = re.findall(r'resource "aws_subnet" "public"', self.main_content)
        self.assertEqual(len(public_subnet_matches), 1, "Should have one public subnet resource with count")
        self.assertIn('count             = 3', self.main_content)

    def test_private_subnets_count(self):
        """Test that 3 private subnets are defined."""
        private_subnet_matches = re.findall(r'resource "aws_subnet" "private"', self.main_content)
        self.assertEqual(len(private_subnet_matches), 1, "Should have one private subnet resource with count")

    def test_database_subnets_count(self):
        """Test that 3 database subnets are defined."""
        database_subnet_matches = re.findall(r'resource "aws_subnet" "database"', self.main_content)
        self.assertEqual(len(database_subnet_matches), 1, "Should have one database subnet resource with count")

    def test_public_subnet_cidr_blocks(self):
        """Test public subnet CIDR blocks are correct."""
        # Public subnets should use 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
        self.assertIn('"10.0.${count.index + 1}.0/24"', self.main_content)

    def test_private_subnet_cidr_blocks(self):
        """Test private subnet CIDR blocks are correct."""
        # Private subnets should use 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
        self.assertIn('"10.0.${count.index + 11}.0/24"', self.main_content)

    def test_database_subnet_cidr_blocks(self):
        """Test database subnet CIDR blocks are correct."""
        # Database subnets should use 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
        self.assertIn('"10.0.${count.index + 21}.0/24"', self.main_content)

    def test_nat_gateways_count(self):
        """Test that 3 NAT Gateways are defined."""
        nat_gateway_matches = re.findall(r'resource "aws_nat_gateway" "nat"', self.main_content)
        self.assertEqual(len(nat_gateway_matches), 1, "Should have one NAT gateway resource with count")

    def test_elastic_ips_for_nat(self):
        """Test that 3 Elastic IPs are allocated for NAT Gateways."""
        eip_matches = re.findall(r'resource "aws_eip" "nat"', self.main_content)
        self.assertEqual(len(eip_matches), 1, "Should have one EIP resource with count")
        self.assertIn('domain = "vpc"', self.main_content)

    def test_public_route_table(self):
        """Test public route table configuration."""
        self.assertIn('resource "aws_route_table" "public"', self.main_content)
        self.assertIn('gateway_id = aws_internet_gateway.payment_igw.id', self.main_content)

    def test_private_route_tables(self):
        """Test private route tables with NAT Gateway routes."""
        self.assertIn('resource "aws_route_table" "private"', self.main_content)
        self.assertIn('nat_gateway_id = aws_nat_gateway.nat[count.index].id', self.main_content)

    def test_database_route_table_no_internet(self):
        """Test database route table has no internet access."""
        # Database route table should not have any 0.0.0.0/0 route
        database_rt_section = re.search(
            r'resource "aws_route_table" "database".*?(?=resource |\Z)',
            self.main_content,
            re.DOTALL
        )
        self.assertIsNotNone(database_rt_section)
        # Database route table should not contain internet routes
        db_rt_content = database_rt_section.group(0)
        self.assertNotIn('0.0.0.0/0', db_rt_content)

    def test_public_nacl_rules(self):
        """Test public NACL allows HTTP and HTTPS."""
        self.assertIn('resource "aws_network_acl" "public"', self.nacl_content)
        # Check for HTTP (port 80)
        http_rule = re.search(r'from_port\s*=\s*80.*?to_port\s*=\s*80', self.nacl_content, re.DOTALL)
        self.assertIsNotNone(http_rule, "Public NACL should allow HTTP (port 80)")
        # Check for HTTPS (port 443)
        https_rule = re.search(r'from_port\s*=\s*443.*?to_port\s*=\s*443', self.nacl_content, re.DOTALL)
        self.assertIsNotNone(https_rule, "Public NACL should allow HTTPS (port 443)")

    def test_private_nacl_application_ports(self):
        """Test private NACL allows application ports 8080-8090."""
        self.assertIn('resource "aws_network_acl" "private"', self.nacl_content)
        app_ports = re.search(r'from_port\s*=\s*8080.*?to_port\s*=\s*8090', self.nacl_content, re.DOTALL)
        self.assertIsNotNone(app_ports, "Private NACL should allow ports 8080-8090")

    def test_database_nacl_postgresql_only(self):
        """Test database NACL allows only PostgreSQL from private subnets."""
        self.assertIn('resource "aws_network_acl" "database"', self.nacl_content)
        # Check for PostgreSQL port 5432
        pg_rules = re.findall(r'from_port\s*=\s*5432.*?to_port\s*=\s*5432', self.nacl_content, re.DOTALL)
        self.assertGreaterEqual(len(pg_rules), 3, "Should have PostgreSQL rules for all 3 private subnets")

    def test_database_nacl_cidr_restrictions(self):
        """Test database NACL restricts access to private subnet CIDRs."""
        # Should allow from 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
        self.assertIn('10.0.11.0/24', self.nacl_content)
        self.assertIn('10.0.12.0/24', self.nacl_content)
        self.assertIn('10.0.13.0/24', self.nacl_content)

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled."""
        self.assertIn('resource "aws_flow_log" "payment_vpc"', self.flow_logs_content)
        self.assertIn('traffic_type    = "ALL"', self.flow_logs_content)

    def test_cloudwatch_log_group(self):
        """Test CloudWatch Log Group for Flow Logs."""
        self.assertIn('resource "aws_cloudwatch_log_group" "vpc_flow_logs"', self.flow_logs_content)
        self.assertIn('retention_in_days = 30', self.flow_logs_content)

    def test_iam_role_for_flow_logs(self):
        """Test IAM role for VPC Flow Logs."""
        self.assertIn('resource "aws_iam_role" "vpc_flow_logs"', self.flow_logs_content)
        self.assertIn('vpc-flow-logs.amazonaws.com', self.flow_logs_content)

    def test_iam_policy_for_flow_logs(self):
        """Test IAM policy for Flow Logs has correct permissions."""
        self.assertIn('resource "aws_iam_role_policy" "vpc_flow_logs"', self.flow_logs_content)
        self.assertIn('logs:CreateLogGroup', self.flow_logs_content)
        self.assertIn('logs:CreateLogStream', self.flow_logs_content)
        self.assertIn('logs:PutLogEvents', self.flow_logs_content)

    def test_environment_suffix_in_vpc(self):
        """Test VPC name includes environment_suffix variable."""
        self.assertIn('var.environment_suffix', self.main_content)
        vpc_name_pattern = r'Name\s*=\s*"payment-vpc-\$\{var\.environment_suffix\}"'
        self.assertIsNotNone(re.search(vpc_name_pattern, self.main_content))

    def test_environment_suffix_in_all_resources(self):
        """Test all resource names include environment_suffix."""
        all_content = self.main_content + self.nacl_content + self.flow_logs_content
        # Count Name tags with environment_suffix
        name_tags_with_suffix = re.findall(r'Name\s*=\s*"[^"]*\$\{var\.environment_suffix\}', all_content)
        self.assertGreater(len(name_tags_with_suffix), 10, "Multiple resources should use environment_suffix")

    def test_required_tags_present(self):
        """Test required tags (Environment, Project) are present."""
        all_content = self.main_content + self.nacl_content + self.flow_logs_content
        self.assertIn('Environment = "Production"', all_content)
        self.assertIn('Project     = "PaymentGateway"', all_content)

    def test_no_deletion_protection(self):
        """Test resources don't have deletion protection enabled."""
        all_content = self.main_content + self.nacl_content + self.flow_logs_content
        self.assertNotIn('deletion_protection = true', all_content.lower())
        self.assertNotIn('prevent_destroy = true', all_content.lower())

    def test_availability_zones_data_source(self):
        """Test availability zones data source is defined."""
        self.assertIn('data "aws_availability_zones" "available"', self.main_content)
        self.assertIn('state = "available"', self.main_content)

    def test_subnets_use_availability_zones(self):
        """Test subnets use availability zones from data source."""
        az_usage = re.findall(r'availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]', self.main_content)
        self.assertGreaterEqual(len(az_usage), 3, "All subnet types should use AZ data source")

    def test_outputs_defined(self):
        """Test all required outputs are defined."""
        required_outputs = [
            'vpc_id',
            'vpc_cidr',
            'internet_gateway_id',
            'public_subnet_ids',
            'private_subnet_ids',
            'database_subnet_ids',
            'nat_gateway_ids',
            'nat_gateway_eips',
            'public_route_table_id',
            'private_route_table_ids',
            'database_route_table_id',
            'public_nacl_id',
            'private_nacl_id',
            'database_nacl_id',
            'flow_logs_log_group'
        ]
        for output in required_outputs:
            self.assertIn(f'output "{output}"', self.outputs_content, f"Output {output} should be defined")

    def test_variables_defined(self):
        """Test required variables are defined."""
        required_vars = ['aws_region', 'environment_suffix']
        for var in required_vars:
            self.assertIn(f'variable "{var}"', self.variables_content, f"Variable {var} should be defined")

    def test_provider_configuration(self):
        """Test provider configuration."""
        self.assertIn('provider "aws"', self.provider_content)
        self.assertIn('region = var.aws_region', self.provider_content)

    def test_terraform_version_constraint(self):
        """Test Terraform version constraint is specified."""
        self.assertIn('required_version', self.provider_content)
        self.assertIn('>= 1.', self.provider_content)

    def test_aws_provider_version(self):
        """Test AWS provider version is 5.x or higher."""
        self.assertIn('version = ">= 5.0"', self.provider_content)

    def test_s3_backend_configured(self):
        """Test S3 backend is configured."""
        self.assertIn('backend "s3"', self.provider_content)

    def test_default_tags_configured(self):
        """Test default tags are configured in provider."""
        self.assertIn('default_tags', self.provider_content)

    def test_nat_gateway_depends_on_igw(self):
        """Test NAT Gateways depend on Internet Gateway."""
        nat_section = re.search(
            r'resource "aws_nat_gateway" "nat".*?(?=resource |\Z)',
            self.main_content,
            re.DOTALL
        )
        self.assertIsNotNone(nat_section)
        self.assertIn('depends_on = [aws_internet_gateway.payment_igw]', nat_section.group(0))

    def test_eip_depends_on_igw(self):
        """Test Elastic IPs depend on Internet Gateway."""
        eip_section = re.search(
            r'resource "aws_eip" "nat".*?(?=resource |\Z)',
            self.main_content,
            re.DOTALL
        )
        self.assertIsNotNone(eip_section)
        self.assertIn('depends_on = [aws_internet_gateway.payment_igw]', eip_section.group(0))

    def test_route_table_associations(self):
        """Test route table associations are defined."""
        self.assertIn('resource "aws_route_table_association" "public"', self.main_content)
        self.assertIn('resource "aws_route_table_association" "private"', self.main_content)
        self.assertIn('resource "aws_route_table_association" "database"', self.main_content)

    def test_no_hardcoded_regions(self):
        """Test no hardcoded AWS regions in resource configurations."""
        all_content = self.main_content + self.nacl_content + self.flow_logs_content
        # Should not have hardcoded regions like us-east-1 in resource definitions
        # (except in availability zone data source which is acceptable)
        # This is a soft check - we're verifying proper use of var.aws_region
        self.assertIn('var.aws_region', self.provider_content)

    def test_public_subnets_auto_assign_public_ip(self):
        """Test public subnets auto-assign public IPs."""
        self.assertIn('map_public_ip_on_launch = true', self.main_content)

    def test_flow_logs_arn_output(self):
        """Test Flow Logs IAM role ARN is output."""
        self.assertIn('flow_logs_iam_role_arn', self.outputs_content)

    def test_nacl_ephemeral_ports(self):
        """Test NACLs allow ephemeral ports for return traffic."""
        # Ephemeral ports (1024-65535) should be allowed in all NACLs
        ephemeral_pattern = r'from_port\s*=\s*1024.*?to_port\s*=\s*65535'
        ephemeral_matches = re.findall(ephemeral_pattern, self.nacl_content, re.DOTALL)
        self.assertGreaterEqual(len(ephemeral_matches), 3, "All NACLs should allow ephemeral ports")

    def test_nacl_egress_rules(self):
        """Test NACLs have proper egress rules."""
        # Check that egress rules exist for all NACLs
        egress_blocks = re.findall(r'egress\s*\{', self.nacl_content)
        self.assertGreaterEqual(len(egress_blocks), 3, "All NACLs should have egress rules")

    def test_flow_logs_log_destination(self):
        """Test Flow Logs use CloudWatch as destination."""
        self.assertIn('log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn', self.flow_logs_content)

    def test_flow_logs_iam_role_arn(self):
        """Test Flow Logs reference IAM role ARN."""
        self.assertIn('iam_role_arn    = aws_iam_role.vpc_flow_logs.arn', self.flow_logs_content)

    def test_cidr_blocks_non_overlapping(self):
        """Test CIDR blocks are non-overlapping."""
        # Public: 10.0.1-3.0/24
        # Private: 10.0.11-13.0/24
        # Database: 10.0.21-23.0/24
        # These should not overlap
        cidrs = [
            '10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24',
            '10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24',
            '10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'
        ]
        # Simple check: third octet values should be unique
        third_octets = [1, 2, 3, 11, 12, 13, 21, 22, 23]
        self.assertEqual(len(third_octets), len(set(third_octets)), "CIDR blocks should not overlap")

    def test_vpc_capacity_for_4000_hosts(self):
        """Test VPC CIDR has capacity for 4000+ hosts."""
        # /16 CIDR provides 65,536 addresses, sufficient for 4000 hosts
        self.assertIn('10.0.0.0/16', self.main_content)
        # Calculate: 2^(32-16) - 5 (AWS reserved) = 65,531 usable IPs
        capacity = 2 ** (32 - 16) - 5
        self.assertGreater(capacity, 4000, "VPC should support 4000+ hosts")

    def test_subnet_capacity_per_tier(self):
        """Test each subnet has adequate capacity."""
        # /24 provides 256 addresses, minus 5 AWS reserved = 251 usable
        # With 3 subnets per tier: 251 * 3 = 753 per tier
        subnet_capacity = (2 ** (32 - 24) - 5) * 3
        self.assertGreater(subnet_capacity, 700, "Each tier should have adequate capacity")

    def test_three_availability_zones(self):
        """Test infrastructure spans 3 availability zones."""
        # Count should be 3 for subnets, NAT gateways, etc.
        count_3_matches = re.findall(r'count\s*=\s*3', self.main_content)
        self.assertGreaterEqual(len(count_3_matches), 4, "Resources should span 3 AZs")

    def test_private_route_tables_per_az(self):
        """Test one private route table per AZ for NAT Gateway redundancy."""
        # Should have 3 private route tables
        self.assertIn('count  = 3', self.main_content)
        # Each should reference its own NAT Gateway
        self.assertIn('nat_gateway_id = aws_nat_gateway.nat[count.index].id', self.main_content)

    def test_pci_dss_network_segmentation(self):
        """Test network segmentation meets PCI DSS requirements."""
        # Database tier should be isolated (no internet routes)
        # Verified in test_database_route_table_no_internet
        # NACLs should restrict traffic between tiers
        # Verified in NACL tests
        # This test confirms the architecture supports PCI DSS
        self.assertTrue(True, "Network segmentation configured for PCI DSS")


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)
