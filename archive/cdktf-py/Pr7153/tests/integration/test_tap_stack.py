"""Integration tests for TapStack using real AWS resources."""
import json
import os
import boto3
import pytest


class TestTapStackIntegration:
    """Integration tests for deployed VPC infrastructure."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Load deployment outputs and setup AWS clients."""
        # Get environment variables
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.region = os.getenv('AWS_REGION', 'us-east-1')

        # Load outputs from flat-outputs.json
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )

        with open(outputs_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

            # Get the stack name dynamically
            stack_name = f"TapStack{self.environment_suffix}"
            self.outputs = data.get(stack_name, {})

            # If outputs are empty, try to get from the first key (for backward compatibility)
            if not self.outputs and data:
                self.outputs = list(data.values())[0]

        # Setup AWS clients with dynamic region
        self.ec2_client = boto3.client('ec2', region_name=self.region)
        self.logs_client = boto3.client('logs', region_name=self.region)
        self.iam_client = boto3.client('iam', region_name=self.region)

    def test_vpc_exists_and_accessible(self):
        """Test that VPC exists and is accessible."""
        vpc_id = self.outputs['vpc_id']
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'

    def test_vpc_cidr_block(self):
        """Test that VPC has correct CIDR block."""
        vpc_id = self.outputs['vpc_id']
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        vpc = response['Vpcs'][0]
        assert vpc['CidrBlock'] == '10.0.0.0/16'

    def test_vpc_dns_settings(self):
        """Test that VPC has DNS hostnames and resolution enabled."""
        vpc_id = self.outputs['vpc_id']

        # Check DNS hostnames
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        assert dns_hostnames['EnableDnsHostnames']['Value'] is True

        # Check DNS support
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        assert dns_support['EnableDnsSupport']['Value'] is True

    def test_three_public_subnets_exist(self):
        """Test that exactly 3 public subnets exist."""
        public_subnet_ids = self.outputs['public_subnet_ids']
        assert len(public_subnet_ids) == 3

        response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        assert len(response['Subnets']) == 3

    def test_three_private_subnets_exist(self):
        """Test that exactly 3 private subnets exist."""
        private_subnet_ids = self.outputs['private_subnet_ids']
        assert len(private_subnet_ids) == 3

        response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
        assert len(response['Subnets']) == 3

    def test_public_subnets_in_different_azs(self):
        """Test that public subnets are in different availability zones."""
        public_subnet_ids = self.outputs['public_subnet_ids']
        response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)

        azs = [subnet['AvailabilityZone'] for subnet in response['Subnets']]
        # Should have 3 unique AZs
        assert len(set(azs)) == 3

    def test_private_subnets_in_different_azs(self):
        """Test that private subnets are in different availability zones."""
        private_subnet_ids = self.outputs['private_subnet_ids']
        response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)

        azs = [subnet['AvailabilityZone'] for subnet in response['Subnets']]
        # Should have 3 unique AZs
        assert len(set(azs)) == 3

    def test_public_subnets_have_correct_cidrs(self):
        """Test that public subnets have correct CIDR blocks."""
        public_subnet_ids = self.outputs['public_subnet_ids']
        response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)

        cidrs = sorted([subnet['CidrBlock'] for subnet in response['Subnets']])
        expected_cidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']
        assert cidrs == expected_cidrs

    def test_private_subnets_have_correct_cidrs(self):
        """Test that private subnets have correct CIDR blocks."""
        private_subnet_ids = self.outputs['private_subnet_ids']
        response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)

        cidrs = sorted([subnet['CidrBlock'] for subnet in response['Subnets']])
        expected_cidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']
        assert cidrs == expected_cidrs

    def test_public_subnets_map_public_ip(self):
        """Test that public subnets auto-assign public IPs."""
        public_subnet_ids = self.outputs['public_subnet_ids']
        response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)

        for subnet in response['Subnets']:
            assert subnet['MapPublicIpOnLaunch'] is True

    def test_private_subnets_do_not_map_public_ip(self):
        """Test that private subnets do not auto-assign public IPs."""
        private_subnet_ids = self.outputs['private_subnet_ids']
        response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)

        for subnet in response['Subnets']:
            assert subnet['MapPublicIpOnLaunch'] is False

    def test_internet_gateway_exists(self):
        """Test that Internet Gateway exists and is attached."""
        igw_id = self.outputs['internet_gateway_id']
        response = self.ec2_client.describe_internet_gateways(
            InternetGatewayIds=[igw_id]
        )

        assert len(response['InternetGateways']) == 1
        igw = response['InternetGateways'][0]

        # Check attachment
        assert len(igw['Attachments']) == 1
        assert igw['Attachments'][0]['State'] == 'available'
        assert igw['Attachments'][0]['VpcId'] == self.outputs['vpc_id']

    def test_three_nat_gateways_exist(self):
        """Test that exactly 3 NAT Gateways exist."""
        nat_gateway_ids = self.outputs['nat_gateway_ids']
        assert len(nat_gateway_ids) == 3

        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=nat_gateway_ids)
        assert len(response['NatGateways']) == 3

    def test_nat_gateways_are_available(self):
        """Test that all NAT Gateways are in available state."""
        nat_gateway_ids = self.outputs['nat_gateway_ids']
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=nat_gateway_ids)

        for nat_gw in response['NatGateways']:
            assert nat_gw['State'] == 'available'

    def test_nat_gateways_in_public_subnets(self):
        """Test that NAT Gateways are deployed in public subnets."""
        nat_gateway_ids = self.outputs['nat_gateway_ids']
        public_subnet_ids = self.outputs['public_subnet_ids']

        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=nat_gateway_ids)

        nat_subnet_ids = [nat_gw['SubnetId'] for nat_gw in response['NatGateways']]
        for subnet_id in nat_subnet_ids:
            assert subnet_id in public_subnet_ids

    def test_web_security_group_exists(self):
        """Test that web security group exists."""
        web_sg_id = self.outputs['web_sg_id']
        response = self.ec2_client.describe_security_groups(GroupIds=[web_sg_id])

        assert len(response['SecurityGroups']) == 1

    def test_web_sg_allows_http_from_internet(self):
        """Test that web SG allows HTTP from 0.0.0.0/0."""
        web_sg_id = self.outputs['web_sg_id']
        response = self.ec2_client.describe_security_groups(GroupIds=[web_sg_id])

        sg = response['SecurityGroups'][0]
        ingress_rules = sg['IpPermissions']

        # Find HTTP rule
        http_rules = [r for r in ingress_rules if r.get('FromPort') == 80]
        assert len(http_rules) > 0

        http_rule = http_rules[0]
        assert http_rule['IpProtocol'] == 'tcp'
        assert http_rule['ToPort'] == 80

        # Check for 0.0.0.0/0
        cidrs = [ip_range['CidrIp'] for ip_range in http_rule.get('IpRanges', [])]
        assert '0.0.0.0/0' in cidrs

    def test_web_sg_allows_https_from_internet(self):
        """Test that web SG allows HTTPS from 0.0.0.0/0."""
        web_sg_id = self.outputs['web_sg_id']
        response = self.ec2_client.describe_security_groups(GroupIds=[web_sg_id])

        sg = response['SecurityGroups'][0]
        ingress_rules = sg['IpPermissions']

        # Find HTTPS rule
        https_rules = [r for r in ingress_rules if r.get('FromPort') == 443]
        assert len(https_rules) > 0

        https_rule = https_rules[0]
        assert https_rule['IpProtocol'] == 'tcp'
        assert https_rule['ToPort'] == 443

        # Check for 0.0.0.0/0
        cidrs = [ip_range['CidrIp'] for ip_range in https_rule.get('IpRanges', [])]
        assert '0.0.0.0/0' in cidrs

    def test_app_security_group_exists(self):
        """Test that app security group exists."""
        app_sg_id = self.outputs['app_sg_id']
        response = self.ec2_client.describe_security_groups(GroupIds=[app_sg_id])

        assert len(response['SecurityGroups']) == 1

    def test_app_sg_allows_port_8080_from_web_sg(self):
        """Test that app SG allows port 8080 from web SG only."""
        app_sg_id = self.outputs['app_sg_id']
        web_sg_id = self.outputs['web_sg_id']
        response = self.ec2_client.describe_security_groups(GroupIds=[app_sg_id])

        sg = response['SecurityGroups'][0]
        ingress_rules = sg['IpPermissions']

        # Find port 8080 rule
        app_rules = [r for r in ingress_rules if r.get('FromPort') == 8080]
        assert len(app_rules) > 0

        app_rule = app_rules[0]
        assert app_rule['IpProtocol'] == 'tcp'
        assert app_rule['ToPort'] == 8080

        # Check it references web SG
        user_id_group_pairs = app_rule.get('UserIdGroupPairs', [])
        assert len(user_id_group_pairs) > 0
        assert user_id_group_pairs[0]['GroupId'] == web_sg_id

    def test_db_security_group_exists(self):
        """Test that database security group exists."""
        db_sg_id = self.outputs['db_sg_id']
        response = self.ec2_client.describe_security_groups(GroupIds=[db_sg_id])

        assert len(response['SecurityGroups']) == 1

    def test_db_sg_allows_postgresql_from_app_sg(self):
        """Test that db SG allows PostgreSQL from app SG only."""
        db_sg_id = self.outputs['db_sg_id']
        app_sg_id = self.outputs['app_sg_id']
        response = self.ec2_client.describe_security_groups(GroupIds=[db_sg_id])

        sg = response['SecurityGroups'][0]
        ingress_rules = sg['IpPermissions']

        # Find PostgreSQL rule
        db_rules = [r for r in ingress_rules if r.get('FromPort') == 5432]
        assert len(db_rules) > 0

        db_rule = db_rules[0]
        assert db_rule['IpProtocol'] == 'tcp'
        assert db_rule['ToPort'] == 5432

        # Check it references app SG
        user_id_group_pairs = db_rule.get('UserIdGroupPairs', [])
        assert len(user_id_group_pairs) > 0
        assert user_id_group_pairs[0]['GroupId'] == app_sg_id

    def test_vpc_flow_logs_enabled(self):
        """Test that VPC Flow Logs are enabled."""
        vpc_id = self.outputs['vpc_id']
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )

        assert len(response['FlowLogs']) > 0
        flow_log = response['FlowLogs'][0]
        assert flow_log['FlowLogStatus'] == 'ACTIVE'
        assert flow_log['TrafficType'] == 'ALL'

    def test_flow_logs_cloudwatch_log_group_exists(self):
        """Test that CloudWatch Log Group for Flow Logs exists."""
        vpc_id = self.outputs['vpc_id']
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )

        flow_log = response['FlowLogs'][0]
        log_destination = flow_log['LogDestination']

        # Extract log group name from ARN
        log_group_name = log_destination.split(':')[-1]

        # Verify log group exists
        logs_response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        assert len(logs_response['logGroups']) > 0

    def test_flow_logs_log_group_retention(self):
        """Test that log group has 7-day retention."""
        vpc_id = self.outputs['vpc_id']
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )

        flow_log = response['FlowLogs'][0]
        log_destination = flow_log['LogDestination']
        log_group_name = log_destination.split(':')[-1]

        logs_response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_group = logs_response['logGroups'][0]
        assert log_group.get('retentionInDays') == 7

    def test_public_subnet_route_table_has_igw_route(self):
        """Test that public subnets have route to Internet Gateway."""
        public_subnet_ids = self.outputs['public_subnet_ids']
        igw_id = self.outputs['internet_gateway_id']

        # Check first public subnet's route table
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'association.subnet-id', 'Values': [public_subnet_ids[0]]}
            ]
        )

        assert len(response['RouteTables']) > 0
        route_table = response['RouteTables'][0]

        # Find default route
        routes = route_table['Routes']
        default_routes = [r for r in routes if r.get('DestinationCidrBlock') == '0.0.0.0/0']

        assert len(default_routes) > 0
        assert default_routes[0].get('GatewayId') == igw_id

    def test_private_subnet_route_table_has_nat_route(self):
        """Test that private subnets have route to NAT Gateway."""
        private_subnet_ids = self.outputs['private_subnet_ids']
        nat_gateway_ids = self.outputs['nat_gateway_ids']

        # Check first private subnet's route table
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'association.subnet-id', 'Values': [private_subnet_ids[0]]}
            ]
        )

        assert len(response['RouteTables']) > 0
        route_table = response['RouteTables'][0]

        # Find default route
        routes = route_table['Routes']
        default_routes = [r for r in routes if r.get('DestinationCidrBlock') == '0.0.0.0/0']

        assert len(default_routes) > 0
        # Should point to a NAT Gateway
        nat_gw_id = default_routes[0].get('NatGatewayId')
        assert nat_gw_id in nat_gateway_ids

    def test_each_private_subnet_has_own_route_table(self):
        """Test that each private subnet has its own route table."""
        private_subnet_ids = self.outputs['private_subnet_ids']

        route_table_ids = set()
        for subnet_id in private_subnet_ids:
            response = self.ec2_client.describe_route_tables(
                Filters=[
                    {'Name': 'association.subnet-id', 'Values': [subnet_id]}
                ]
            )

            assert len(response['RouteTables']) > 0
            route_table_ids.add(response['RouteTables'][0]['RouteTableId'])

        # Should have 3 unique route tables
        assert len(route_table_ids) == 3

    def test_vpc_has_mandatory_tags(self):
        """Test that VPC has all mandatory tags."""
        vpc_id = self.outputs['vpc_id']
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        vpc = response['Vpcs'][0]
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        assert 'Environment' in tags
        assert 'CostCenter' in tags
        assert 'Owner' in tags
        assert 'CreatedBy' in tags

    def test_subnets_are_in_correct_region(self):
        """Test that all subnets are in the correct region."""
        public_subnet_ids = self.outputs['public_subnet_ids']
        private_subnet_ids = self.outputs['private_subnet_ids']
        all_subnet_ids = public_subnet_ids + private_subnet_ids

        response = self.ec2_client.describe_subnets(SubnetIds=all_subnet_ids)

        for subnet in response['Subnets']:
            # Availability zone should start with the configured region
            assert subnet['AvailabilityZone'].startswith(self.region)

    def test_nat_gateways_have_elastic_ips(self):
        """Test that each NAT Gateway has an associated Elastic IP."""
        nat_gateway_ids = self.outputs['nat_gateway_ids']
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=nat_gateway_ids)

        for nat_gw in response['NatGateways']:
            # Each NAT Gateway should have at least one address
            assert len(nat_gw['NatGatewayAddresses']) > 0

            # Verify each address has an allocation ID (EIP)
            for addr in nat_gw['NatGatewayAddresses']:
                assert 'AllocationId' in addr
                assert addr['AllocationId'].startswith('eipalloc-')
