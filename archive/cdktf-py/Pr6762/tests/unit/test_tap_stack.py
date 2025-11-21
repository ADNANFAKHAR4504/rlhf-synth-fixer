"""Comprehensive unit tests for TAP Stack - VPC Infrastructure."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestTapStackInstantiation:
    """Test suite for TAP Stack instantiation."""

    def test_tap_stack_instantiates_successfully(self):
        """Test that TapStack instantiates successfully."""
        app = App()
        stack = TapStack(app, "TestTapStack", environment_suffix="test123")

        assert stack is not None
        assert stack.environment_suffix == "test123"

    def test_tap_stack_stores_environment_suffix(self):
        """Test that environment suffix is stored correctly."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="prod-xyz")

        assert stack.environment_suffix == "prod-xyz"


class TestVPCConfiguration:
    """Test suite for VPC configuration."""

    def test_vpc_created_with_correct_cidr(self):
        """Test that VPC is created with correct CIDR block."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        # Parse synthesized JSON
        manifest = json.loads(synth)

        # Find VPC resource
        vpc_resource = manifest['resource']['aws_vpc']['vpc']

        assert vpc_resource['cidr_block'] == "10.50.0.0/16"
        assert vpc_resource['enable_dns_hostnames'] is True
        assert vpc_resource['enable_dns_support'] is True

    def test_vpc_has_environment_suffix_in_name(self):
        """Test that VPC name includes environment suffix."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test123")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)
        vpc_resource = manifest['resource']['aws_vpc']['vpc']

        assert 'test123' in vpc_resource['tags']['Name']
        assert vpc_resource['tags']['Name'] == "banking-vpc-test123"

    def test_vpc_has_required_tags(self):
        """Test that VPC has all required tags."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)
        vpc_resource = manifest['resource']['aws_vpc']['vpc']
        tags = vpc_resource['tags']

        assert 'Environment' in tags
        assert 'Owner' in tags
        assert 'CostCenter' in tags
        assert 'Project' in tags
        assert tags['Owner'] == "Platform-Team"
        assert tags['CostCenter'] == "DigitalBanking"


class TestSubnetConfiguration:
    """Test suite for subnet configuration."""

    def test_public_subnets_count(self):
        """Test that three public subnets are created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        # Count public subnets
        public_subnets = [k for k in manifest['resource']['aws_subnet'].keys()
                         if 'public_subnet' in k]

        assert len(public_subnets) == 3

    def test_private_subnets_count(self):
        """Test that three private subnets are created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        # Count private subnets
        private_subnets = [k for k in manifest['resource']['aws_subnet'].keys()
                          if 'private_subnet' in k]

        assert len(private_subnets) == 3

    def test_database_subnets_count(self):
        """Test that three database subnets are created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        # Count database subnets
        database_subnets = [k for k in manifest['resource']['aws_subnet'].keys()
                           if 'database_subnet' in k]

        assert len(database_subnets) == 3

    def test_public_subnet_cidr_blocks(self):
        """Test that public subnets have correct CIDR blocks."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        expected_cidrs = ["10.50.0.0/24", "10.50.1.0/24", "10.50.2.0/24"]

        for i in range(3):
            subnet = manifest['resource']['aws_subnet'][f'public_subnet_{i}']
            assert subnet['cidr_block'] == expected_cidrs[i]
            assert subnet['map_public_ip_on_launch'] is True

    def test_private_subnet_cidr_blocks(self):
        """Test that private subnets have correct CIDR blocks."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        expected_cidrs = ["10.50.10.0/24", "10.50.11.0/24", "10.50.12.0/24"]

        for i in range(3):
            subnet = manifest['resource']['aws_subnet'][f'private_subnet_{i}']
            assert subnet['cidr_block'] == expected_cidrs[i]
            assert subnet['map_public_ip_on_launch'] is False

    def test_database_subnet_cidr_blocks(self):
        """Test that database subnets have correct CIDR blocks."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        expected_cidrs = ["10.50.20.0/24", "10.50.21.0/24", "10.50.22.0/24"]

        for i in range(3):
            subnet = manifest['resource']['aws_subnet'][f'database_subnet_{i}']
            assert subnet['cidr_block'] == expected_cidrs[i]

    def test_subnet_names_include_environment_suffix(self):
        """Test that subnet names include environment suffix."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="prod123")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        # Check public subnet names
        for i in range(3):
            subnet = manifest['resource']['aws_subnet'][f'public_subnet_{i}']
            assert 'prod123' in subnet['tags']['Name']


class TestNATGatewayConfiguration:
    """Test suite for NAT Gateway configuration."""

    def test_single_nat_gateway_created(self):
        """Test that only one NAT Gateway is created for cost optimization."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        # Count NAT Gateways
        nat_gateways = manifest['resource']['aws_nat_gateway']

        assert len(nat_gateways) == 1
        assert 'nat_gateway' in nat_gateways

    def test_elastic_ip_created(self):
        """Test that Elastic IP is created for NAT Gateway."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        eip = manifest['resource']['aws_eip']['nat_eip']

        assert eip['domain'] == "vpc"
        assert 'test' in eip['tags']['Name']

    def test_nat_gateway_uses_first_public_subnet(self):
        """Test that NAT Gateway is deployed in first public subnet."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        nat_gateway = manifest['resource']['aws_nat_gateway']['nat_gateway']

        # Verify it references the first public subnet
        assert '${aws_subnet.public_subnet_0.id}' in nat_gateway['subnet_id']


class TestInternetGatewayConfiguration:
    """Test suite for Internet Gateway configuration."""

    def test_internet_gateway_created(self):
        """Test that Internet Gateway is created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        igw = manifest['resource']['aws_internet_gateway']['igw']

        assert igw is not None
        assert '${aws_vpc.vpc.id}' in igw['vpc_id']


class TestRouteTableConfiguration:
    """Test suite for route table configuration."""

    def test_three_route_tables_created(self):
        """Test that three route tables are created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        route_tables = manifest['resource']['aws_route_table']

        assert 'public_route_table' in route_tables
        assert 'private_route_table' in route_tables
        assert 'database_route_table' in route_tables

    def test_public_route_table_has_igw_route(self):
        """Test that public route table routes to Internet Gateway."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        public_route = manifest['resource']['aws_route']['public_internet_route']

        assert public_route['destination_cidr_block'] == "0.0.0.0/0"
        assert '${aws_internet_gateway.igw.id}' in public_route['gateway_id']

    def test_private_route_table_has_nat_route(self):
        """Test that private route table routes to NAT Gateway."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        private_route = manifest['resource']['aws_route']['private_nat_route']

        assert private_route['destination_cidr_block'] == "0.0.0.0/0"
        assert '${aws_nat_gateway.nat_gateway.id}' in private_route['nat_gateway_id']

    def test_database_route_table_has_nat_route(self):
        """Test that database route table routes to NAT Gateway."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        database_route = manifest['resource']['aws_route']['database_nat_route']

        assert database_route['destination_cidr_block'] == "0.0.0.0/0"
        assert '${aws_nat_gateway.nat_gateway.id}' in database_route['nat_gateway_id']

    def test_route_table_associations(self):
        """Test that all subnets have route table associations."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        associations = manifest['resource']['aws_route_table_association']

        # 3 public + 3 private + 3 database = 9 associations
        assert len(associations) == 9


class TestSecurityGroupConfiguration:
    """Test suite for security group configuration."""

    def test_three_security_groups_created(self):
        """Test that three security groups are created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        security_groups = manifest['resource']['aws_security_group']

        assert 'alb_security_group' in security_groups
        assert 'ecs_security_group' in security_groups
        assert 'rds_security_group' in security_groups

    def test_alb_security_group_ingress_rules(self):
        """Test ALB security group ingress rules."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        alb_sg = manifest['resource']['aws_security_group']['alb_security_group']
        ingress = alb_sg['ingress']

        # Check for HTTPS and HTTP rules
        assert len(ingress) == 2

        # Verify no 0.0.0.0/0 ingress
        for rule in ingress:
            assert "0.0.0.0/0" not in rule.get('cidr_blocks', [])

    def test_ecs_security_group_references_alb(self):
        """Test ECS security group references ALB security group."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        ecs_sg = manifest['resource']['aws_security_group']['ecs_security_group']
        ingress = ecs_sg['ingress'][0]

        assert ingress['from_port'] == 8080
        assert ingress['to_port'] == 8080
        assert '${aws_security_group.alb_security_group.id}' in str(ingress['security_groups'])

    def test_rds_security_group_references_ecs(self):
        """Test RDS security group references ECS security group."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        rds_sg = manifest['resource']['aws_security_group']['rds_security_group']
        ingress = rds_sg['ingress'][0]

        assert ingress['from_port'] == 5432
        assert ingress['to_port'] == 5432
        assert '${aws_security_group.ecs_security_group.id}' in str(ingress['security_groups'])

    def test_security_group_names_include_suffix(self):
        """Test that security group names include environment suffix."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test456")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        alb_sg = manifest['resource']['aws_security_group']['alb_security_group']

        assert 'test456' in alb_sg['name']


class TestNetworkACLConfiguration:
    """Test suite for Network ACL configuration."""

    def test_network_acl_created(self):
        """Test that Network ACL is created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        nacl = manifest['resource']['aws_network_acl']['network_acl']

        assert nacl is not None

    def test_network_acl_ingress_rules(self):
        """Test Network ACL ingress rules."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        nacl = manifest['resource']['aws_network_acl']['network_acl']
        ingress = nacl['ingress']

        # Should have 3 ingress rules
        assert len(ingress) == 3

        # Verify HTTPS rule
        https_rule = [r for r in ingress if r['rule_no'] == 100][0]
        assert https_rule['from_port'] == 443
        assert https_rule['action'] == "allow"

    def test_network_acl_egress_rules(self):
        """Test Network ACL egress rules."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        nacl = manifest['resource']['aws_network_acl']['network_acl']
        egress = nacl['egress']

        # Should have 2 egress rules
        assert len(egress) == 2

    def test_network_acl_associations(self):
        """Test that all subnets are associated with Network ACL."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        associations = manifest['resource']['aws_network_acl_association']

        # 9 subnets should have associations
        assert len(associations) == 9


class TestVPCEndpointConfiguration:
    """Test suite for VPC Endpoint configuration."""

    def test_s3_endpoint_created(self):
        """Test that S3 VPC Endpoint is created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        s3_endpoint = manifest['resource']['aws_vpc_endpoint']['s3_endpoint']

        assert s3_endpoint['service_name'] == "com.amazonaws.us-east-1.s3"
        assert s3_endpoint['vpc_endpoint_type'] == "Gateway"

    def test_ecr_api_endpoint_created(self):
        """Test that ECR API VPC Endpoint is created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        ecr_api_endpoint = manifest['resource']['aws_vpc_endpoint']['ecr_api_endpoint']

        assert ecr_api_endpoint['service_name'] == "com.amazonaws.us-east-1.ecr.api"
        assert ecr_api_endpoint['vpc_endpoint_type'] == "Interface"
        assert ecr_api_endpoint['private_dns_enabled'] is True

    def test_ecr_dkr_endpoint_created(self):
        """Test that ECR DKR VPC Endpoint is created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        ecr_dkr_endpoint = manifest['resource']['aws_vpc_endpoint']['ecr_dkr_endpoint']

        assert ecr_dkr_endpoint['service_name'] == "com.amazonaws.us-east-1.ecr.dkr"
        assert ecr_dkr_endpoint['vpc_endpoint_type'] == "Interface"


class TestFlowLogsConfiguration:
    """Test suite for VPC Flow Logs configuration."""

    def test_s3_bucket_created(self):
        """Test that S3 bucket for flow logs is created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test123")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        bucket = manifest['resource']['aws_s3_bucket']['flow_logs_bucket']

        assert bucket['bucket'] == "vpc-flow-logs-test123"

    def test_s3_bucket_public_access_blocked(self):
        """Test that S3 bucket has public access blocked."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        public_access_block = manifest['resource']['aws_s3_bucket_public_access_block']['flow_logs_bucket_public_access_block']

        assert public_access_block['block_public_acls'] is True
        assert public_access_block['block_public_policy'] is True
        assert public_access_block['ignore_public_acls'] is True
        assert public_access_block['restrict_public_buckets'] is True

    def test_s3_lifecycle_glacier_transition(self):
        """Test that S3 bucket has Glacier transition after 7 days."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        lifecycle = manifest['resource']['aws_s3_bucket_lifecycle_configuration']['flow_logs_bucket_lifecycle']
        rule = lifecycle['rule'][0]

        assert rule['status'] == "Enabled"
        assert rule['transition'][0]['days'] == 7
        assert rule['transition'][0]['storage_class'] == "GLACIER"

    def test_flow_log_created(self):
        """Test that VPC Flow Log is created."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        flow_log = manifest['resource']['aws_flow_log']['vpc_flow_log']

        assert flow_log['traffic_type'] == "ALL"
        assert flow_log['log_destination_type'] == "s3"


class TestStackOutputs:
    """Test suite for stack outputs."""

    def test_all_required_outputs_exist(self):
        """Test that all required outputs are defined."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        outputs = manifest['output']

        required_outputs = [
            'vpc_id',
            'vpc_cidr',
            'public_subnet_ids',
            'private_subnet_ids',
            'database_subnet_ids',
            'nat_gateway_public_ip',
            'alb_security_group_id',
            'ecs_security_group_id',
            'rds_security_group_id',
            's3_endpoint_id',
            'ecr_api_endpoint_id',
            'ecr_dkr_endpoint_id',
            'flow_logs_bucket_name'
        ]

        for output_name in required_outputs:
            assert output_name in outputs

    def test_outputs_have_descriptions(self):
        """Test that outputs have descriptions."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        outputs = manifest['output']

        for output_name, output_value in outputs.items():
            assert 'description' in output_value
            assert len(output_value['description']) > 0


class TestTaggingStrategy:
    """Test suite for resource tagging strategy."""

    def test_common_tags_applied(self):
        """Test that common tags are applied to all resources."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        # Check VPC tags
        vpc = manifest['resource']['aws_vpc']['vpc']
        assert 'Environment' in vpc['tags']
        assert 'Owner' in vpc['tags']
        assert 'CostCenter' in vpc['tags']
        assert 'Project' in vpc['tags']

    def test_environment_tag_includes_suffix(self):
        """Test that Environment tag includes the suffix."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="prod123")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        vpc = manifest['resource']['aws_vpc']['vpc']

        assert 'prod123' in vpc['tags']['Environment']
        assert vpc['tags']['Environment'] == "banking-prod123"


class TestAWSProviderConfiguration:
    """Test suite for AWS provider configuration."""

    def test_aws_provider_uses_us_east_1(self):
        """Test that AWS provider is configured for us-east-1."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        provider = manifest['provider']['aws'][0]

        assert provider['region'] == "us-east-1"


class TestDataSources:
    """Test suite for data sources."""

    def test_availability_zones_data_source(self):
        """Test that availability zones data source is defined."""
        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")
        synth = Testing.synth(stack)

        manifest = json.loads(synth)

        azs = manifest['data']['aws_availability_zones']['available']

        assert azs['state'] == "available"
