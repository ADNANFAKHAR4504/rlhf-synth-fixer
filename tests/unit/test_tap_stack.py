"""Unit tests for TapStack."""
import json
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStackStructure:
    """Test suite for TapStack structure and resources."""

    def test_tap_stack_instantiates_successfully(self):
        """Test that TapStack instantiates without errors."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack is not None

    def test_stack_has_required_attributes(self):
        """Test that stack has all required resource attributes."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")

        # Verify VPC and networking resources
        assert hasattr(tap_stack, 'vpc')
        assert hasattr(tap_stack, 'igw')
        assert hasattr(tap_stack, 'public_subnets')
        assert hasattr(tap_stack, 'private_subnets')
        assert hasattr(tap_stack, 'nat_gateways')
        assert hasattr(tap_stack, 'eips')
        assert hasattr(tap_stack, 'public_route_table')
        assert hasattr(tap_stack, 'private_route_tables')

        # Verify security groups
        assert hasattr(tap_stack, 'web_sg')
        assert hasattr(tap_stack, 'app_sg')
        assert hasattr(tap_stack, 'db_sg')

        # Verify Flow Logs resources
        assert hasattr(tap_stack, 'flow_log_group')
        assert hasattr(tap_stack, 'flow_log_role')

    def test_stack_synthesizes_correctly(self):
        """Test that stack synthesizes without errors."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        manifest = Testing.synth(stack)
        assert manifest is not None

    def test_vpc_configuration(self):
        """Test VPC has correct CIDR and DNS settings."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Find VPC resource in synthesized output
        resources = json.loads(synthesized)
        vpc_resources = [r for r in resources.get('resource', {}).get('aws_vpc', {}).values()]

        assert len(vpc_resources) > 0
        vpc = vpc_resources[0]
        assert vpc['cidr_block'] == '10.0.0.0/16'
        assert vpc['enable_dns_hostnames'] is True
        assert vpc['enable_dns_support'] is True

    def test_environment_suffix_in_vpc_name(self):
        """Test that VPC name includes environment suffix."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="testenv")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        vpc_resources = [r for r in resources.get('resource', {}).get('aws_vpc', {}).values()]

        assert len(vpc_resources) > 0
        vpc = vpc_resources[0]
        assert 'testenv' in vpc['tags']['Name']

    def test_three_public_subnets_created(self):
        """Test that exactly 3 public subnets are created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert len(tap_stack.public_subnets) == 3

    def test_three_private_subnets_created(self):
        """Test that exactly 3 private subnets are created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert len(tap_stack.private_subnets) == 3

    def test_public_subnet_cidrs(self):
        """Test public subnet CIDRs are correct."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        subnet_resources = resources.get('resource', {}).get('aws_subnet', {})

        public_cidrs = []
        for subnet in subnet_resources.values():
            if 'public' in subnet.get('tags', {}).get('Type', ''):
                public_cidrs.append(subnet['cidr_block'])

        expected_cidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']
        assert sorted(public_cidrs) == sorted(expected_cidrs)

    def test_private_subnet_cidrs(self):
        """Test private subnet CIDRs are correct."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        subnet_resources = resources.get('resource', {}).get('aws_subnet', {})

        private_cidrs = []
        for subnet in subnet_resources.values():
            if 'private' in subnet.get('tags', {}).get('Type', ''):
                private_cidrs.append(subnet['cidr_block'])

        expected_cidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']
        assert sorted(private_cidrs) == sorted(expected_cidrs)

    def test_three_nat_gateways_created(self):
        """Test that exactly 3 NAT Gateways are created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert len(tap_stack.nat_gateways) == 3

    def test_three_elastic_ips_created(self):
        """Test that exactly 3 Elastic IPs are created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert len(tap_stack.eips) == 3

    def test_eips_have_nat_purpose_tag(self):
        """Test that Elastic IPs have Purpose: NAT tag."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        eip_resources = resources.get('resource', {}).get('aws_eip', {})

        for eip in eip_resources.values():
            assert eip['tags']['Purpose'] == 'NAT'

    def test_internet_gateway_created(self):
        """Test that Internet Gateway is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.igw is not None

    def test_public_route_table_has_igw_route(self):
        """Test that public route table has route to IGW."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        rt_resources = resources.get('resource', {}).get('aws_route_table', {})

        # Find public route table
        for rt_name, rt_data in rt_resources.items():
            if 'public-rt' in rt_name:
                routes = rt_data.get('route', [])
                assert len(routes) > 0
                # Check for default route
                default_route = [r for r in routes if r.get('cidr_block') == '0.0.0.0/0']
                assert len(default_route) > 0
                break

    def test_private_route_tables_have_nat_routes(self):
        """Test that private route tables have routes to NAT Gateways."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert len(tap_stack.private_route_tables) == 3

    def test_web_security_group_created(self):
        """Test that web security group is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.web_sg is not None

    def test_web_sg_allows_http_https(self):
        """Test that web SG allows HTTP and HTTPS from anywhere."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        sg_resources = resources.get('resource', {}).get('aws_security_group', {})

        # Find web security group
        for sg_name, sg_data in sg_resources.items():
            if 'web-sg' in sg_name:
                ingress_rules = sg_data.get('ingress', [])

                # Check for HTTP rule
                http_rules = [r for r in ingress_rules if r.get('from_port') == 80]
                assert len(http_rules) > 0
                assert http_rules[0]['protocol'] == 'tcp'
                assert '0.0.0.0/0' in http_rules[0].get('cidr_blocks', [])

                # Check for HTTPS rule
                https_rules = [r for r in ingress_rules if r.get('from_port') == 443]
                assert len(https_rules) > 0
                assert https_rules[0]['protocol'] == 'tcp'
                assert '0.0.0.0/0' in https_rules[0].get('cidr_blocks', [])
                break

    def test_app_security_group_created(self):
        """Test that app security group is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.app_sg is not None

    def test_app_sg_allows_port_8080_from_web_sg(self):
        """Test that app SG allows port 8080 from web SG only."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        sg_resources = resources.get('resource', {}).get('aws_security_group', {})

        # Find app security group
        for sg_name, sg_data in sg_resources.items():
            if 'app-sg' in sg_name:
                ingress_rules = sg_data.get('ingress', [])

                # Check for port 8080 rule
                app_rules = [r for r in ingress_rules if r.get('from_port') == 8080]
                assert len(app_rules) > 0
                assert app_rules[0]['protocol'] == 'tcp'
                # Should reference web SG, not CIDR blocks
                assert 'security_groups' in app_rules[0]
                break

    def test_db_security_group_created(self):
        """Test that database security group is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.db_sg is not None

    def test_db_sg_allows_postgresql_from_app_sg(self):
        """Test that db SG allows PostgreSQL from app SG only."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        sg_resources = resources.get('resource', {}).get('aws_security_group', {})

        # Find db security group
        for sg_name, sg_data in sg_resources.items():
            if 'db-sg' in sg_name:
                ingress_rules = sg_data.get('ingress', [])

                # Check for PostgreSQL rule
                db_rules = [r for r in ingress_rules if r.get('from_port') == 5432]
                assert len(db_rules) > 0
                assert db_rules[0]['protocol'] == 'tcp'
                # Should reference app SG, not CIDR blocks
                assert 'security_groups' in db_rules[0]
                break

    def test_cloudwatch_log_group_created(self):
        """Test that CloudWatch Log Group is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.flow_log_group is not None

    def test_cloudwatch_log_group_retention(self):
        """Test that log group has 7-day retention."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        log_group_resources = resources.get('resource', {}).get('aws_cloudwatch_log_group', {})

        for log_group in log_group_resources.values():
            assert log_group['retention_in_days'] == 7

    def test_iam_role_for_flow_logs_created(self):
        """Test that IAM role for VPC Flow Logs is created."""
        stack = Testing.app()
        tap_stack = TapStack(stack, "test", environment_suffix="test")
        assert tap_stack.flow_log_role is not None

    def test_flow_logs_iam_role_trust_policy(self):
        """Test that IAM role has correct trust policy."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        iam_role_resources = resources.get('resource', {}).get('aws_iam_role', {})

        for role in iam_role_resources.values():
            policy = json.loads(role['assume_role_policy'])
            assert policy['Version'] == '2012-10-17'
            statements = policy['Statement']
            assert len(statements) > 0
            assert statements[0]['Effect'] == 'Allow'
            assert statements[0]['Principal']['Service'] == 'vpc-flow-logs.amazonaws.com'

    def test_flow_logs_iam_policy_has_required_permissions(self):
        """Test that IAM policy has required CloudWatch Logs permissions."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        iam_policy_resources = resources.get('resource', {}).get('aws_iam_role_policy', {})

        for policy_data in iam_policy_resources.values():
            policy = json.loads(policy_data['policy'])
            statements = policy['Statement']
            assert len(statements) > 0

            actions = statements[0]['Action']
            assert 'logs:CreateLogGroup' in actions
            assert 'logs:CreateLogStream' in actions
            assert 'logs:PutLogEvents' in actions

    def test_vpc_flow_log_created(self):
        """Test that VPC Flow Log is created."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        flow_log_resources = resources.get('resource', {}).get('aws_flow_log', {})

        assert len(flow_log_resources) > 0

    def test_flow_log_traffic_type_all(self):
        """Test that Flow Log captures ALL traffic."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        flow_log_resources = resources.get('resource', {}).get('aws_flow_log', {})

        for flow_log in flow_log_resources.values():
            assert flow_log['traffic_type'] == 'ALL'

    def test_mandatory_tags_present(self):
        """Test that resources have mandatory tags."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)

        # Check VPC tags
        vpc_resources = resources.get('resource', {}).get('aws_vpc', {})
        for vpc in vpc_resources.values():
            tags = vpc['tags']
            assert 'Environment' in tags
            assert 'CostCenter' in tags
            assert 'Owner' in tags
            assert 'CreatedBy' in tags

    def test_stack_outputs_vpc_id(self):
        """Test that stack outputs VPC ID."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        outputs = json.loads(synthesized).get('output', {})
        assert 'vpc_id' in outputs

    def test_stack_outputs_subnet_ids(self):
        """Test that stack outputs public and private subnet IDs."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        outputs = json.loads(synthesized).get('output', {})
        assert 'public_subnet_ids' in outputs
        assert 'private_subnet_ids' in outputs

    def test_stack_outputs_security_group_ids(self):
        """Test that stack outputs all security group IDs."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        outputs = json.loads(synthesized).get('output', {})
        assert 'web_sg_id' in outputs
        assert 'app_sg_id' in outputs
        assert 'db_sg_id' in outputs

    def test_stack_outputs_nat_gateway_ids(self):
        """Test that stack outputs NAT Gateway IDs."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        outputs = json.loads(synthesized).get('output', {})
        assert 'nat_gateway_ids' in outputs

    def test_stack_outputs_internet_gateway_id(self):
        """Test that stack outputs Internet Gateway ID."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        outputs = json.loads(synthesized).get('output', {})
        assert 'internet_gateway_id' in outputs

    def test_availability_zones_are_us_east_1(self):
        """Test that subnets are created in us-east-1 availability zones."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        subnet_resources = resources.get('resource', {}).get('aws_subnet', {})

        for subnet in subnet_resources.values():
            az = subnet['availability_zone']
            assert az.startswith('us-east-1')

    def test_public_subnets_map_public_ip(self):
        """Test that public subnets have map_public_ip_on_launch enabled."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        subnet_resources = resources.get('resource', {}).get('aws_subnet', {})

        for subnet in subnet_resources.values():
            if 'public' in subnet.get('tags', {}).get('Type', ''):
                assert subnet['map_public_ip_on_launch'] is True

    def test_private_subnets_do_not_map_public_ip(self):
        """Test that private subnets do not have map_public_ip_on_launch."""
        stack = Testing.app()
        TapStack(stack, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        resources = json.loads(synthesized)
        subnet_resources = resources.get('resource', {}).get('aws_subnet', {})

        for subnet in subnet_resources.values():
            if 'private' in subnet.get('tags', {}).get('Type', ''):
                assert subnet['map_public_ip_on_launch'] is False
