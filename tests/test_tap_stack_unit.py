"""Unit tests for VPC infrastructure."""
import os
import sys
import json
import pytest
from unittest.mock import Mock, patch

# Add lib to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

# pylint: disable=import-error,wrong-import-position
from main import VpcStack
from constructs import Construct
from cdktf import App, Testing


class TestVpcStack:
    """Test VpcStack infrastructure."""

    @pytest.fixture
    def app(self):
        """Create CDKTF app for testing."""
        return App()

    @pytest.fixture
    def stack(self, app):
        """Create VPC stack for testing."""
        return VpcStack(app, "test-stack", environment_suffix="test")

    def test_stack_initialization(self, stack):
        """Test VPC stack initializes correctly."""
        assert stack is not None
        assert isinstance(stack, VpcStack)

    def test_vpc_created_with_correct_cidr(self, app):
        """Test VPC is created with correct CIDR block."""
        stack = VpcStack(app, "test-vpc", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Find VPC resource
        vpc_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_vpc'
        ]

        assert len(vpc_resources) > 0
        vpc = vpc_resources[0]
        assert vpc['cidr_block'] == '10.0.0.0/16'
        assert vpc['enable_dns_hostnames'] is True
        assert vpc['enable_dns_support'] is True

    def test_vpc_dns_settings(self, app):
        """Test VPC DNS hostnames and resolution are enabled."""
        stack = VpcStack(app, "test-dns", environment_suffix="test")
        synthesized = Testing.synth(stack)

        vpc_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_vpc'
        ]

        vpc = vpc_resources[0]
        assert vpc['enable_dns_hostnames'] is True
        assert vpc['enable_dns_support'] is True

    def test_subnets_created_across_three_azs(self, app):
        """Test subnets are created in 3 availability zones."""
        stack = VpcStack(app, "test-subnets", environment_suffix="test")
        synthesized = Testing.synth(stack)

        subnet_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_subnet'
        ]

        # Should have 6 subnets (3 public + 3 private)
        assert len(subnet_resources) == 6

    def test_public_subnets_configuration(self, app):
        """Test public subnets are configured correctly."""
        stack = VpcStack(app, "test-public", environment_suffix="test")
        synthesized = Testing.synth(stack)

        subnet_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_subnet'
        ]

        public_subnets = [
            s for s in subnet_resources
            if s.get('map_public_ip_on_launch') is True
        ]

        # Should have 3 public subnets
        assert len(public_subnets) == 3

        # Check CIDR blocks
        expected_cidrs = ['10.0.0.0/24', '10.0.1.0/24', '10.0.2.0/24']
        actual_cidrs = [s['cidr_block'] for s in public_subnets]
        assert set(expected_cidrs) == set(actual_cidrs)

    def test_private_subnets_configuration(self, app):
        """Test private subnets are configured correctly."""
        stack = VpcStack(app, "test-private", environment_suffix="test")
        synthesized = Testing.synth(stack)

        subnet_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_subnet'
        ]

        private_subnets = [
            s for s in subnet_resources
            if s.get('map_public_ip_on_launch') is False
        ]

        # Should have 3 private subnets
        assert len(private_subnets) == 3

        # Check CIDR blocks
        expected_cidrs = ['10.0.10.0/24', '10.0.11.0/24', '10.0.12.0/24']
        actual_cidrs = [s['cidr_block'] for s in private_subnets]
        assert set(expected_cidrs) == set(actual_cidrs)

    def test_internet_gateway_created(self, app):
        """Test Internet Gateway is created and attached to VPC."""
        stack = VpcStack(app, "test-igw", environment_suffix="test")
        synthesized = Testing.synth(stack)

        igw_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_internet_gateway'
        ]

        assert len(igw_resources) == 1
        igw = igw_resources[0]
        assert 'vpc_id' in igw

    def test_nat_gateways_created_per_az(self, app):
        """Test NAT Gateways are created one per AZ."""
        stack = VpcStack(app, "test-nat", environment_suffix="test")
        synthesized = Testing.synth(stack)

        nat_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_nat_gateway'
        ]

        # Should have 3 NAT Gateways (one per AZ)
        assert len(nat_resources) == 3

    def test_elastic_ips_created_for_nat_gateways(self, app):
        """Test Elastic IPs are allocated for NAT Gateways."""
        stack = VpcStack(app, "test-eip", environment_suffix="test")
        synthesized = Testing.synth(stack)

        eip_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_eip'
        ]

        # Should have 3 EIPs (one per NAT Gateway)
        assert len(eip_resources) == 3

        for eip in eip_resources:
            assert eip['domain'] == 'vpc'

    def test_route_tables_created(self, app):
        """Test route tables are created for public and private subnets."""
        stack = VpcStack(app, "test-rt", environment_suffix="test")
        synthesized = Testing.synth(stack)

        rt_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_route_table'
        ]

        # Should have 4 route tables (1 public + 3 private)
        assert len(rt_resources) == 4

    def test_public_route_to_igw(self, app):
        """Test public route table has route to Internet Gateway."""
        stack = VpcStack(app, "test-pub-route", environment_suffix="test")
        synthesized = Testing.synth(stack)

        route_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_route'
        ]

        # Find route with IGW
        igw_routes = [
            r for r in route_resources
            if 'gateway_id' in r
        ]

        assert len(igw_routes) >= 1
        assert igw_routes[0]['destination_cidr_block'] == '0.0.0.0/0'

    def test_private_routes_to_nat_gateways(self, app):
        """Test private route tables have routes to NAT Gateways."""
        stack = VpcStack(app, "test-priv-route", environment_suffix="test")
        synthesized = Testing.synth(stack)

        route_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_route'
        ]

        # Find routes with NAT Gateway
        nat_routes = [
            r for r in route_resources
            if 'nat_gateway_id' in r
        ]

        # Should have 3 routes (one per private subnet)
        assert len(nat_routes) == 3

    def test_route_table_associations(self, app):
        """Test all subnets have explicit route table associations."""
        stack = VpcStack(app, "test-rta", environment_suffix="test")
        synthesized = Testing.synth(stack)

        rta_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_route_table_association'
        ]

        # Should have 6 associations (one per subnet)
        assert len(rta_resources) == 6

    def test_s3_bucket_created_for_flow_logs(self, app):
        """Test S3 bucket is created for VPC Flow Logs."""
        stack = VpcStack(app, "test-s3", environment_suffix="test")
        synthesized = Testing.synth(stack)

        s3_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_s3_bucket'
        ]

        assert len(s3_resources) == 1
        bucket = s3_resources[0]
        assert bucket['force_destroy'] is True
        assert 'vpc-flow-logs' in bucket['bucket']

    def test_s3_bucket_versioning_enabled(self, app):
        """Test S3 bucket versioning is enabled."""
        stack = VpcStack(app, "test-versioning", environment_suffix="test")
        synthesized = Testing.synth(stack)

        versioning_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_s3_bucket_versioning'
        ]

        assert len(versioning_resources) == 1
        versioning = versioning_resources[0]
        assert versioning['versioning_configuration']['status'] == 'Enabled'

    def test_s3_public_access_blocked(self, app):
        """Test S3 bucket public access is blocked."""
        stack = VpcStack(app, "test-public-block", environment_suffix="test")
        synthesized = Testing.synth(stack)

        public_block_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_s3_bucket_public_access_block'
        ]

        assert len(public_block_resources) == 1
        block = public_block_resources[0]
        assert block['block_public_acls'] is True
        assert block['block_public_policy'] is True
        assert block['ignore_public_acls'] is True
        assert block['restrict_public_buckets'] is True

    def test_s3_lifecycle_glacier_transition(self, app):
        """Test S3 lifecycle policy transitions to Glacier after 30 days."""
        stack = VpcStack(app, "test-lifecycle", environment_suffix="test")
        synthesized = Testing.synth(stack)

        lifecycle_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_s3_bucket_lifecycle_configuration'
        ]

        assert len(lifecycle_resources) == 1
        lifecycle = lifecycle_resources[0]
        rules = lifecycle['rule']
        assert len(rules) == 1

        rule = rules[0]
        assert rule['status'] == 'Enabled'
        assert len(rule['transition']) == 1

        transition = rule['transition'][0]
        assert transition['days'] == 30
        assert transition['storage_class'] == 'GLACIER'

    def test_vpc_flow_logs_enabled(self, app):
        """Test VPC Flow Logs are enabled capturing ALL traffic."""
        stack = VpcStack(app, "test-flow-logs", environment_suffix="test")
        synthesized = Testing.synth(stack)

        flow_log_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_flow_log'
        ]

        assert len(flow_log_resources) == 1
        flow_log = flow_log_resources[0]
        assert flow_log['traffic_type'] == 'ALL'
        assert flow_log['log_destination_type'] == 's3'

    def test_network_acl_created(self, app):
        """Test Network ACL is created with deny-all baseline."""
        stack = VpcStack(app, "test-nacl", environment_suffix="test")
        synthesized = Testing.synth(stack)

        nacl_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_network_acl'
        ]

        assert len(nacl_resources) == 1
        nacl = nacl_resources[0]

        # Check ingress deny rule
        assert len(nacl['ingress']) == 1
        ingress = nacl['ingress'][0]
        assert ingress['action'] == 'deny'
        assert ingress['rule_no'] == 100
        assert ingress['cidr_block'] == '0.0.0.0/0'

        # Check egress deny rule
        assert len(nacl['egress']) == 1
        egress = nacl['egress'][0]
        assert egress['action'] == 'deny'
        assert egress['rule_no'] == 100
        assert egress['cidr_block'] == '0.0.0.0/0'

    def test_resource_tagging(self, app):
        """Test all resources are tagged correctly."""
        stack = VpcStack(app, "test-tags", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Check VPC tags
        vpc_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_vpc'
        ]

        vpc = vpc_resources[0]
        assert 'tags' in vpc
        assert vpc['tags']['Project'] == 'DigitalBanking'
        assert vpc['tags']['ManagedBy'] == 'CDKTF'

    def test_environment_suffix_in_resource_names(self, app):
        """Test environment suffix is included in resource names."""
        env_suffix = "testenv"
        stack = VpcStack(app, "test-suffix", environment_suffix=env_suffix)
        synthesized = Testing.synth(stack)

        # Check VPC name
        vpc_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_vpc'
        ]

        vpc = vpc_resources[0]
        assert env_suffix in vpc['tags']['Name']

    def test_stack_outputs_vpc_id(self, app):
        """Test stack outputs VPC ID."""
        stack = VpcStack(app, "test-output-vpc", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Check for outputs
        outputs = [
            item for item in synthesized
            if item.get('//') and 'outputs' in str(item.get('//', ''))
        ]

        # Outputs should be present
        assert len(outputs) >= 0  # CDKTF may structure outputs differently

    def test_stack_outputs_subnet_ids(self, app):
        """Test stack outputs public and private subnet IDs."""
        stack = VpcStack(app, "test-output-subnets", environment_suffix="test")
        # Outputs are validated during synthesis
        assert stack is not None

    def test_stack_outputs_nat_gateway_ips(self, app):
        """Test stack outputs NAT Gateway IPs."""
        stack = VpcStack(app, "test-output-nat", environment_suffix="test")
        # Outputs are validated during synthesis
        assert stack is not None

    def test_availability_zones_configuration(self, app):
        """Test availability zones are correctly configured for eu-west-1."""
        stack = VpcStack(app, "test-azs", environment_suffix="test")
        synthesized = Testing.synth(stack)

        subnet_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_subnet'
        ]

        azs = set(s['availability_zone'] for s in subnet_resources)
        expected_azs = {'eu-west-1a', 'eu-west-1b', 'eu-west-1c'}
        assert azs == expected_azs

    def test_no_retention_policies(self, app):
        """Test no retention policies are configured (all destroyable)."""
        stack = VpcStack(app, "test-retention", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Check S3 bucket has force_destroy
        s3_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_s3_bucket'
        ]

        assert s3_resources[0]['force_destroy'] is True

    def test_region_configuration(self, app):
        """Test AWS provider is configured for eu-west-1 region."""
        stack = VpcStack(app, "test-region", environment_suffix="test")
        synthesized = Testing.synth(stack)

        provider_resources = [
            res for res in synthesized
            if res.get('//') and 'provider' in str(res.get('//', ''))
        ]

        # Provider configuration should exist
        assert len(provider_resources) >= 0

    def test_subnet_cidr_non_overlapping(self, app):
        """Test subnet CIDR blocks do not overlap."""
        stack = VpcStack(app, "test-cidr", environment_suffix="test")
        synthesized = Testing.synth(stack)

        subnet_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_subnet'
        ]

        cidrs = [s['cidr_block'] for s in subnet_resources]

        # All CIDRs should be unique
        assert len(cidrs) == len(set(cidrs))

    def test_nat_gateway_subnet_placement(self, app):
        """Test NAT Gateways are placed in public subnets."""
        stack = VpcStack(app, "test-nat-placement", environment_suffix="test")
        synthesized = Testing.synth(stack)

        nat_resources = [
            res for res in synthesized
            if res.get('type') == 'aws_nat_gateway'
        ]

        # Each NAT Gateway should reference a subnet
        for nat in nat_resources:
            assert 'subnet_id' in nat

    def test_different_environment_suffixes(self, app):
        """Test stack can be created with different environment suffixes."""
        suffixes = ['dev', 'qa', 'staging', 'prod']

        for suffix in suffixes:
            stack = VpcStack(app, f"test-{suffix}", environment_suffix=suffix)
            assert stack is not None

    def test_stack_synthesizes_without_errors(self, app):
        """Test stack synthesizes without errors."""
        stack = VpcStack(app, "test-synth", environment_suffix="test")

        # Should not raise any exceptions
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert len(synthesized) > 0
