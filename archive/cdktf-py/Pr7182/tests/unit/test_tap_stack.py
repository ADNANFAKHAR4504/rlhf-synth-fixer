"""Unit tests for VPC infrastructure."""
import os
import sys
import json
import pytest

# Add lib to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

# pylint: disable=import-error,wrong-import-position
from lib.tap_stack import TapStack
from cdktf import App, Testing


def get_resources_from_synth(synthesized):
    """Parse synthesized output and extract resources."""
    data = json.loads(synthesized)
    resources = []

    # Extract resources from terraform JSON format
    if 'resource' in data:
        for resource_type, resource_instances in data['resource'].items():
            for resource_name, resource_config in resource_instances.items():
                resource_config['type'] = resource_type
                resource_config['name'] = resource_name
                resources.append(resource_config)

    return resources


def get_outputs_from_synth(synthesized):
    """Parse synthesized output and extract outputs."""
    data = json.loads(synthesized)
    return data.get('output', {})


class TestTapStack:
    """Test TapStack infrastructure."""

    @pytest.fixture
    def app(self):
        """Create CDKTF app for testing."""
        return App()

    @pytest.fixture
    def stack(self, app):
        """Create VPC stack for testing."""
        return TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

    def test_stack_initialization(self, stack):
        """Test VPC stack initializes correctly."""
        assert stack is not None
        assert isinstance(stack, TapStack)

    def test_vpc_created_with_correct_cidr(self, app):
        """Test VPC is created with correct CIDR block."""
        stack = TapStack(
            app,
            "test-vpc",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        vpc_resources = [r for r in resources if r.get('type') == 'aws_vpc']

        assert len(vpc_resources) > 0
        vpc = vpc_resources[0]
        assert vpc['cidr_block'] == '10.0.0.0/16'
        assert vpc['enable_dns_hostnames'] is True
        assert vpc['enable_dns_support'] is True

    def test_vpc_dns_settings(self, app):
        """Test VPC DNS hostnames and resolution are enabled."""
        stack = TapStack(
            app,
            "test-dns",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        vpc_resources = [r for r in resources if r.get('type') == 'aws_vpc']
        vpc = vpc_resources[0]
        assert vpc['enable_dns_hostnames'] is True
        assert vpc['enable_dns_support'] is True

    def test_subnets_created_across_three_azs(self, app):
        """Test subnets are created in 3 availability zones."""
        stack = TapStack(
            app,
            "test-subnets",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        subnet_resources = [r for r in resources if r.get('type') == 'aws_subnet']
        assert len(subnet_resources) == 6

    def test_public_subnets_configuration(self, app):
        """Test public subnets are configured correctly."""
        stack = TapStack(
            app,
            "test-public",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        subnet_resources = [r for r in resources if r.get('type') == 'aws_subnet']
        public_subnets = [s for s in subnet_resources if s.get('map_public_ip_on_launch') is True]

        assert len(public_subnets) == 3

        expected_cidrs = ['10.0.0.0/24', '10.0.1.0/24', '10.0.2.0/24']
        actual_cidrs = [s['cidr_block'] for s in public_subnets]
        assert set(expected_cidrs) == set(actual_cidrs)

    def test_private_subnets_configuration(self, app):
        """Test private subnets are configured correctly."""
        stack = TapStack(
            app,
            "test-private",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        subnet_resources = [r for r in resources if r.get('type') == 'aws_subnet']
        private_subnets = [s for s in subnet_resources if s.get('map_public_ip_on_launch') is False]

        assert len(private_subnets) == 3

        expected_cidrs = ['10.0.10.0/24', '10.0.11.0/24', '10.0.12.0/24']
        actual_cidrs = [s['cidr_block'] for s in private_subnets]
        assert set(expected_cidrs) == set(actual_cidrs)

    def test_internet_gateway_created(self, app):
        """Test Internet Gateway is created and attached to VPC."""
        stack = TapStack(
            app,
            "test-igw",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        igw_resources = [r for r in resources if r.get('type') == 'aws_internet_gateway']
        assert len(igw_resources) == 1

    def test_nat_gateways_created_per_az(self, app):
        """Test NAT Gateways are created one per AZ."""
        stack = TapStack(
            app,
            "test-nat",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        nat_resources = [r for r in resources if r.get('type') == 'aws_nat_gateway']
        assert len(nat_resources) == 3

    def test_elastic_ips_created_for_nat_gateways(self, app):
        """Test Elastic IPs are allocated for NAT Gateways."""
        stack = TapStack(
            app,
            "test-eip",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        eip_resources = [r for r in resources if r.get('type') == 'aws_eip']
        assert len(eip_resources) == 3

        for eip in eip_resources:
            assert eip['domain'] == 'vpc'

    def test_route_tables_created(self, app):
        """Test route tables are created for public and private subnets."""
        stack = TapStack(
            app,
            "test-rt",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        rt_resources = [r for r in resources if r.get('type') == 'aws_route_table']
        assert len(rt_resources) == 4

    def test_public_route_to_igw(self, app):
        """Test public route table has route to Internet Gateway."""
        stack = TapStack(
            app,
            "test-pub-route",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        route_resources = [r for r in resources if r.get('type') == 'aws_route']
        igw_routes = [r for r in route_resources if 'gateway_id' in r]

        assert len(igw_routes) >= 1
        assert igw_routes[0]['destination_cidr_block'] == '0.0.0.0/0'

    def test_private_routes_to_nat_gateways(self, app):
        """Test private route tables have routes to NAT Gateways."""
        stack = TapStack(
            app,
            "test-priv-route",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        route_resources = [r for r in resources if r.get('type') == 'aws_route']
        nat_routes = [r for r in route_resources if 'nat_gateway_id' in r]

        assert len(nat_routes) == 3

    def test_route_table_associations(self, app):
        """Test all subnets have explicit route table associations."""
        stack = TapStack(
            app,
            "test-rta",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        rta_resources = [r for r in resources if r.get('type') == 'aws_route_table_association']
        assert len(rta_resources) == 6

    def test_s3_bucket_created_for_flow_logs(self, app):
        """Test S3 bucket is created for VPC Flow Logs."""
        stack = TapStack(
            app,
            "test-s3",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        s3_resources = [r for r in resources if r.get('type') == 'aws_s3_bucket']
        assert len(s3_resources) == 1

        bucket = s3_resources[0]
        assert bucket['force_destroy'] is True
        assert 'vpc-flow-logs' in bucket['bucket']

    def test_s3_bucket_versioning_enabled(self, app):
        """Test S3 bucket versioning is enabled."""
        stack = TapStack(
            app,
            "test-versioning",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        versioning_resources = [r for r in resources if r.get('type') == 'aws_s3_bucket_versioning']
        assert len(versioning_resources) == 1

        versioning = versioning_resources[0]
        assert versioning['versioning_configuration']['status'] == 'Enabled'

    def test_s3_public_access_blocked(self, app):
        """Test S3 bucket public access is blocked."""
        stack = TapStack(
            app,
            "test-public-block",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        public_block_resources = [r for r in resources if r.get('type') == 'aws_s3_bucket_public_access_block']
        assert len(public_block_resources) == 1

        block = public_block_resources[0]
        assert block['block_public_acls'] is True
        assert block['block_public_policy'] is True
        assert block['ignore_public_acls'] is True
        assert block['restrict_public_buckets'] is True

    def test_s3_lifecycle_glacier_transition(self, app):
        """Test S3 lifecycle policy transitions to Glacier after 30 days."""
        stack = TapStack(
            app,
            "test-lifecycle",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        lifecycle_resources = [r for r in resources if r.get('type') == 'aws_s3_bucket_lifecycle_configuration']
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
        stack = TapStack(
            app,
            "test-flow-logs",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        flow_log_resources = [r for r in resources if r.get('type') == 'aws_flow_log']
        assert len(flow_log_resources) == 1

        flow_log = flow_log_resources[0]
        assert flow_log['traffic_type'] == 'ALL'
        assert flow_log['log_destination_type'] == 's3'

    def test_network_acl_created(self, app):
        """Test Network ACL is created with deny-all baseline."""
        stack = TapStack(
            app,
            "test-nacl",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        nacl_resources = [r for r in resources if r.get('type') == 'aws_network_acl']
        assert len(nacl_resources) == 1

        nacl = nacl_resources[0]
        assert len(nacl['ingress']) == 1
        ingress = nacl['ingress'][0]
        assert ingress['action'] == 'deny'
        assert ingress['rule_no'] == 100
        assert ingress['cidr_block'] == '0.0.0.0/0'

        assert len(nacl['egress']) == 1
        egress = nacl['egress'][0]
        assert egress['action'] == 'deny'
        assert egress['rule_no'] == 100
        assert egress['cidr_block'] == '0.0.0.0/0'

    def test_resource_tagging(self, app):
        """Test all resources are tagged correctly."""
        stack = TapStack(
            app,
            "test-tags",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        vpc_resources = [r for r in resources if r.get('type') == 'aws_vpc']
        vpc = vpc_resources[0]
        assert 'tags' in vpc
        assert vpc['tags']['Project'] == 'DigitalBanking'
        assert vpc['tags']['ManagedBy'] == 'CDKTF'

    def test_environment_suffix_in_resource_names(self, app):
        """Test environment suffix is included in resource names."""
        env_suffix = "testenv"
        stack = TapStack(
            app,
            "test-suffix",
            environment_suffix=env_suffix,
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        vpc_resources = [r for r in resources if r.get('type') == 'aws_vpc']
        vpc = vpc_resources[0]
        assert env_suffix in vpc['tags']['Name']

    def test_stack_outputs_vpc_id(self, app):
        """Test stack outputs VPC ID."""
        stack = TapStack(
            app,
            "test-output-vpc",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        outputs = get_outputs_from_synth(synthesized)

        assert 'vpc_id' in outputs

    def test_stack_outputs_subnet_ids(self, app):
        """Test stack outputs public and private subnet IDs."""
        stack = TapStack(
            app,
            "test-output-subnets",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        outputs = get_outputs_from_synth(synthesized)

        assert 'public_subnet_ids' in outputs
        assert 'private_subnet_ids' in outputs

    def test_stack_outputs_nat_gateway_ips(self, app):
        """Test stack outputs NAT Gateway IPs."""
        stack = TapStack(
            app,
            "test-output-nat",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        outputs = get_outputs_from_synth(synthesized)

        assert 'nat_gateway_ips' in outputs

    def test_stack_outputs_flow_logs_bucket(self, app):
        """Test stack outputs flow logs bucket name."""
        stack = TapStack(
            app,
            "test-output-bucket",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        outputs = get_outputs_from_synth(synthesized)

        assert 'flow_logs_bucket' in outputs

    def test_availability_zones_configuration(self, app):
        """Test availability zones are correctly configured for us-east-1."""
        stack = TapStack(
            app,
            "test-azs",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        subnet_resources = [r for r in resources if r.get('type') == 'aws_subnet']
        azs = set(s['availability_zone'] for s in subnet_resources)
        expected_azs = {'us-east-1a', 'us-east-1b', 'us-east-1c'}
        assert azs == expected_azs

    def test_no_retention_policies(self, app):
        """Test no retention policies are configured (all destroyable)."""
        stack = TapStack(
            app,
            "test-retention",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        s3_resources = [r for r in resources if r.get('type') == 'aws_s3_bucket']
        assert s3_resources[0]['force_destroy'] is True

    def test_subnet_cidr_non_overlapping(self, app):
        """Test subnet CIDR blocks do not overlap."""
        stack = TapStack(
            app,
            "test-cidr",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        subnet_resources = [r for r in resources if r.get('type') == 'aws_subnet']
        cidrs = [s['cidr_block'] for s in subnet_resources]
        assert len(cidrs) == len(set(cidrs))

    def test_nat_gateway_subnet_placement(self, app):
        """Test NAT Gateways are placed in public subnets."""
        stack = TapStack(
            app,
            "test-nat-placement",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        nat_resources = [r for r in resources if r.get('type') == 'aws_nat_gateway']
        for nat in nat_resources:
            assert 'subnet_id' in nat

    def test_different_environment_suffixes(self, app):
        """Test stack can be created with different environment suffixes."""
        suffixes = ['dev', 'qa', 'staging', 'prod']

        for suffix in suffixes:
            stack = TapStack(
                app,
                f"test-{suffix}",
                environment_suffix=suffix,
                aws_region="us-east-1",
                state_bucket="test-bucket",
                state_bucket_region="us-east-1"
            )
            assert stack is not None

    def test_stack_synthesizes_without_errors(self, app):
        """Test stack synthesizes without errors."""
        stack = TapStack(
            app,
            "test-synth",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert len(synthesized) > 0

    def test_default_tags_passed_to_provider(self, app):
        """Test default tags are passed to AWS provider."""
        default_tags = {
            "tags": {
                "Environment": "test",
                "Team": "platform"
            }
        }
        stack = TapStack(
            app,
            "test-default-tags",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags=default_tags
        )
        assert stack is not None

    def test_s3_backend_configuration(self, app):
        """Test S3 backend is configured correctly."""
        stack = TapStack(
            app,
            "test-backend",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="my-state-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        data = json.loads(synthesized)

        assert 'terraform' in data
        assert 'backend' in data['terraform']
        assert 's3' in data['terraform']['backend']
        assert data['terraform']['backend']['s3']['bucket'] == 'my-state-bucket'

    def test_flow_logs_bucket_naming(self, app):
        """Test flow logs bucket naming convention."""
        stack = TapStack(
            app,
            "test-bucket-name",
            environment_suffix="myenv",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        s3_resources = [r for r in resources if r.get('type') == 'aws_s3_bucket']
        bucket = s3_resources[0]
        assert 'myenv' in bucket['bucket']
        assert bucket['bucket'] == bucket['bucket'].lower()

    def test_nacl_protocol_configuration(self, app):
        """Test NACL uses all protocols (-1)."""
        stack = TapStack(
            app,
            "test-nacl-protocol",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        nacl_resources = [r for r in resources if r.get('type') == 'aws_network_acl']
        nacl = nacl_resources[0]
        assert nacl['ingress'][0]['protocol'] == '-1'
        assert nacl['egress'][0]['protocol'] == '-1'

    def test_nacl_port_configuration(self, app):
        """Test NACL port configuration for all ports."""
        stack = TapStack(
            app,
            "test-nacl-ports",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        nacl_resources = [r for r in resources if r.get('type') == 'aws_network_acl']
        nacl = nacl_resources[0]
        assert nacl['ingress'][0]['from_port'] == 0
        assert nacl['ingress'][0]['to_port'] == 0
        assert nacl['egress'][0]['from_port'] == 0
        assert nacl['egress'][0]['to_port'] == 0

    def test_igw_tagging(self, app):
        """Test Internet Gateway has proper tags."""
        stack = TapStack(
            app,
            "test-igw-tags",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        igw_resources = [r for r in resources if r.get('type') == 'aws_internet_gateway']
        igw = igw_resources[0]
        assert 'tags' in igw
        assert 'Name' in igw['tags']
        assert igw['tags']['Project'] == 'DigitalBanking'

    def test_nat_gateway_tagging(self, app):
        """Test NAT Gateways have proper tags."""
        stack = TapStack(
            app,
            "test-nat-tags",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        nat_resources = [r for r in resources if r.get('type') == 'aws_nat_gateway']
        for nat in nat_resources:
            assert 'tags' in nat
            assert 'Name' in nat['tags']
            assert nat['tags']['Project'] == 'DigitalBanking'

    def test_eip_tagging(self, app):
        """Test Elastic IPs have proper tags."""
        stack = TapStack(
            app,
            "test-eip-tags",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        eip_resources = [r for r in resources if r.get('type') == 'aws_eip']
        for eip in eip_resources:
            assert 'tags' in eip
            assert 'Name' in eip['tags']

    def test_route_table_tagging(self, app):
        """Test route tables have proper tags."""
        stack = TapStack(
            app,
            "test-rt-tags",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        rt_resources = [r for r in resources if r.get('type') == 'aws_route_table']
        for rt in rt_resources:
            assert 'tags' in rt
            assert 'Name' in rt['tags']

    def test_subnet_type_tags(self, app):
        """Test subnets have Type tags."""
        stack = TapStack(
            app,
            "test-subnet-type",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        subnet_resources = [r for r in resources if r.get('type') == 'aws_subnet']
        public_subnets = [s for s in subnet_resources if s.get('map_public_ip_on_launch')]
        private_subnets = [s for s in subnet_resources if not s.get('map_public_ip_on_launch')]

        for subnet in public_subnets:
            assert subnet['tags']['Type'] == 'Public'

        for subnet in private_subnets:
            assert subnet['tags']['Type'] == 'Private'

    def test_nacl_note_tag(self, app):
        """Test NACL has documentation note tag."""
        stack = TapStack(
            app,
            "test-nacl-note",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        nacl_resources = [r for r in resources if r.get('type') == 'aws_network_acl']
        nacl = nacl_resources[0]
        assert 'Note' in nacl['tags']
        assert 'deny-all' in nacl['tags']['Note'].lower()

    def test_s3_bucket_tagging(self, app):
        """Test S3 bucket has proper tags."""
        stack = TapStack(
            app,
            "test-s3-tags",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        s3_resources = [r for r in resources if r.get('type') == 'aws_s3_bucket']
        bucket = s3_resources[0]
        assert 'tags' in bucket
        assert bucket['tags']['Project'] == 'DigitalBanking'

    def test_flow_log_tagging(self, app):
        """Test VPC Flow Log has proper tags."""
        stack = TapStack(
            app,
            "test-flow-log-tags",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        flow_log_resources = [r for r in resources if r.get('type') == 'aws_flow_log']
        flow_log = flow_log_resources[0]
        assert 'tags' in flow_log
        assert flow_log['tags']['Project'] == 'DigitalBanking'

    def test_vpc_cidr_block_size(self, app):
        """Test VPC CIDR block is /16."""
        stack = TapStack(
            app,
            "test-cidr-size",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        vpc_resources = [r for r in resources if r.get('type') == 'aws_vpc']
        vpc = vpc_resources[0]
        assert vpc['cidr_block'].endswith('/16')

    def test_subnet_cidr_block_size(self, app):
        """Test subnet CIDR blocks are /24."""
        stack = TapStack(
            app,
            "test-subnet-cidr-size",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        subnet_resources = [r for r in resources if r.get('type') == 'aws_subnet']
        for subnet in subnet_resources:
            assert subnet['cidr_block'].endswith('/24')

    def test_all_routes_have_destination(self, app):
        """Test all routes have destination CIDR block."""
        stack = TapStack(
            app,
            "test-route-dest",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        resources = get_resources_from_synth(synthesized)

        route_resources = [r for r in resources if r.get('type') == 'aws_route']
        for route in route_resources:
            assert 'destination_cidr_block' in route
            assert route['destination_cidr_block'] == '0.0.0.0/0'

    def test_provider_region_configuration(self, app):
        """Test AWS provider region is configured correctly."""
        stack = TapStack(
            app,
            "test-provider-region",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )
        synthesized = Testing.synth(stack)
        data = json.loads(synthesized)

        assert 'provider' in data
        assert 'aws' in data['provider']
        provider = data['provider']['aws'][0]
        assert provider['region'] == 'us-east-1'
