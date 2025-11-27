"""Integration tests for VPC infrastructure using AWS SDK."""
import os
import json
import pytest
import boto3

# Get environment variables
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
region = os.environ.get('AWS_REGION', 'us-east-1')

# Read outputs from flat-outputs.json
outputs_path = os.path.join(os.getcwd(), 'cfn-outputs', 'flat-outputs.json')
outputs = json.loads(open(outputs_path, 'r').read())

# Get stack outputs
stack_key = f'TapStack{environment_suffix}'
stack_outputs = outputs.get(stack_key, {})

vpc_id = stack_outputs.get('vpc_id')
public_subnet_ids = stack_outputs.get('public_subnet_ids', [])
private_subnet_ids = stack_outputs.get('private_subnet_ids', [])
nat_gateway_ips = stack_outputs.get('nat_gateway_ips', [])
flow_logs_bucket = stack_outputs.get('flow_logs_bucket')

# Initialize AWS clients
ec2_client = boto3.client('ec2', region_name=region)
s3_client = boto3.client('s3', region_name=region)


class TestVpcIntegration:
    """Integration tests for VPC resources."""

    def test_vpc_exists(self):
        """Test VPC exists and is available."""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]
        assert vpc['VpcId'] == vpc_id
        assert vpc['State'] == 'available'

    def test_vpc_cidr_block(self):
        """Test VPC has correct CIDR block."""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        vpc = response['Vpcs'][0]
        assert vpc['CidrBlock'] == '10.0.0.0/16'

    def test_vpc_dns_support_enabled(self):
        """Test VPC has DNS support enabled."""
        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        assert response['EnableDnsSupport']['Value'] is True

    def test_vpc_dns_hostnames_enabled(self):
        """Test VPC has DNS hostnames enabled."""
        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        assert response['EnableDnsHostnames']['Value'] is True

    def test_vpc_tags(self):
        """Test VPC has correct tags."""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        vpc = response['Vpcs'][0]
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        assert tags.get('Project') == 'DigitalBanking'
        assert tags.get('ManagedBy') == 'CDKTF'


class TestSubnetsIntegration:
    """Integration tests for subnet resources."""

    def test_public_subnets_exist(self):
        """Test public subnets exist."""
        response = ec2_client.describe_subnets(SubnetIds=public_subnet_ids)

        assert len(response['Subnets']) == 3

    def test_private_subnets_exist(self):
        """Test private subnets exist."""
        response = ec2_client.describe_subnets(SubnetIds=private_subnet_ids)

        assert len(response['Subnets']) == 3

    def test_public_subnets_in_vpc(self):
        """Test public subnets belong to correct VPC."""
        response = ec2_client.describe_subnets(SubnetIds=public_subnet_ids)

        for subnet in response['Subnets']:
            assert subnet['VpcId'] == vpc_id

    def test_private_subnets_in_vpc(self):
        """Test private subnets belong to correct VPC."""
        response = ec2_client.describe_subnets(SubnetIds=private_subnet_ids)

        for subnet in response['Subnets']:
            assert subnet['VpcId'] == vpc_id

    def test_public_subnets_map_public_ip(self):
        """Test public subnets auto-assign public IP."""
        response = ec2_client.describe_subnets(SubnetIds=public_subnet_ids)

        for subnet in response['Subnets']:
            assert subnet['MapPublicIpOnLaunch'] is True

    def test_private_subnets_no_public_ip(self):
        """Test private subnets do not auto-assign public IP."""
        response = ec2_client.describe_subnets(SubnetIds=private_subnet_ids)

        for subnet in response['Subnets']:
            assert subnet['MapPublicIpOnLaunch'] is False

    def test_subnets_in_different_azs(self):
        """Test subnets are in different availability zones."""
        response = ec2_client.describe_subnets(
            SubnetIds=public_subnet_ids + private_subnet_ids
        )

        azs = set(subnet['AvailabilityZone'] for subnet in response['Subnets'])
        expected_azs = {f'{region}a', f'{region}b', f'{region}c'}
        assert azs == expected_azs

    def test_public_subnet_cidr_blocks(self):
        """Test public subnets have correct CIDR blocks."""
        response = ec2_client.describe_subnets(SubnetIds=public_subnet_ids)

        expected_cidrs = {'10.0.0.0/24', '10.0.1.0/24', '10.0.2.0/24'}
        actual_cidrs = {subnet['CidrBlock'] for subnet in response['Subnets']}
        assert actual_cidrs == expected_cidrs

    def test_private_subnet_cidr_blocks(self):
        """Test private subnets have correct CIDR blocks."""
        response = ec2_client.describe_subnets(SubnetIds=private_subnet_ids)

        expected_cidrs = {'10.0.10.0/24', '10.0.11.0/24', '10.0.12.0/24'}
        actual_cidrs = {subnet['CidrBlock'] for subnet in response['Subnets']}
        assert actual_cidrs == expected_cidrs

    def test_subnet_state_available(self):
        """Test all subnets are in available state."""
        response = ec2_client.describe_subnets(
            SubnetIds=public_subnet_ids + private_subnet_ids
        )

        for subnet in response['Subnets']:
            assert subnet['State'] == 'available'


class TestInternetGatewayIntegration:
    """Integration tests for Internet Gateway."""

    def test_internet_gateway_exists(self):
        """Test Internet Gateway exists and attached to VPC."""
        response = ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        assert len(response['InternetGateways']) == 1

    def test_internet_gateway_attached(self):
        """Test Internet Gateway is attached to VPC."""
        response = ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        igw = response['InternetGateways'][0]
        attachment = igw['Attachments'][0]
        assert attachment['VpcId'] == vpc_id
        assert attachment['State'] in ['attached', 'available']


class TestNatGatewayIntegration:
    """Integration tests for NAT Gateways."""

    def test_nat_gateways_exist(self):
        """Test NAT Gateways exist."""
        response = ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )

        assert len(response['NatGateways']) == 3

    def test_nat_gateways_in_public_subnets(self):
        """Test NAT Gateways are in public subnets."""
        response = ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )

        nat_subnet_ids = {nat['SubnetId'] for nat in response['NatGateways']}
        public_subnet_set = set(public_subnet_ids)
        assert nat_subnet_ids == public_subnet_set

    def test_nat_gateways_have_elastic_ips(self):
        """Test NAT Gateways have Elastic IPs."""
        response = ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )

        for nat in response['NatGateways']:
            assert len(nat['NatGatewayAddresses']) > 0
            assert nat['NatGatewayAddresses'][0]['PublicIp'] is not None

    def test_nat_gateway_ips_match_outputs(self):
        """Test NAT Gateway IPs match stack outputs."""
        response = ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )

        actual_ips = set()
        for nat in response['NatGateways']:
            for addr in nat['NatGatewayAddresses']:
                actual_ips.add(addr['PublicIp'])

        expected_ips = set(nat_gateway_ips)
        assert actual_ips == expected_ips


class TestRouteTablesIntegration:
    """Integration tests for Route Tables."""

    def test_route_tables_exist(self):
        """Test route tables exist in VPC."""
        response = ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Should have main + 1 public + 3 private route tables = 5
        assert len(response['RouteTables']) >= 4

    def test_public_route_table_has_igw_route(self):
        """Test public route table has route to Internet Gateway."""
        response = ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'route.destination-cidr-block', 'Values': ['0.0.0.0/0']}
            ]
        )

        igw_routes_found = False
        for rt in response['RouteTables']:
            for route in rt['Routes']:
                if route.get('GatewayId', '').startswith('igw-'):
                    igw_routes_found = True
                    break

        assert igw_routes_found is True

    def test_private_route_tables_have_nat_routes(self):
        """Test private route tables have routes to NAT Gateways."""
        response = ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        nat_routes_count = 0
        for rt in response['RouteTables']:
            for route in rt['Routes']:
                if route.get('NatGatewayId', '').startswith('nat-'):
                    nat_routes_count += 1
                    break

        assert nat_routes_count == 3


class TestS3BucketIntegration:
    """Integration tests for S3 Flow Logs bucket."""

    def test_s3_bucket_exists(self):
        """Test S3 bucket exists."""
        response = s3_client.head_bucket(Bucket=flow_logs_bucket)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_s3_bucket_versioning_enabled(self):
        """Test S3 bucket versioning is enabled."""
        response = s3_client.get_bucket_versioning(Bucket=flow_logs_bucket)
        assert response.get('Status') == 'Enabled'

    def test_s3_bucket_public_access_blocked(self):
        """Test S3 bucket public access is blocked."""
        response = s3_client.get_public_access_block(Bucket=flow_logs_bucket)
        config = response['PublicAccessBlockConfiguration']

        assert config['BlockPublicAcls'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['RestrictPublicBuckets'] is True

    def test_s3_bucket_lifecycle_configuration(self):
        """Test S3 bucket has lifecycle configuration."""
        response = s3_client.get_bucket_lifecycle_configuration(
            Bucket=flow_logs_bucket
        )

        assert len(response['Rules']) >= 1

        glacier_rule_found = False
        for rule in response['Rules']:
            if rule.get('Status') == 'Enabled':
                for transition in rule.get('Transitions', []):
                    if transition.get('StorageClass') == 'GLACIER':
                        glacier_rule_found = True
                        assert transition.get('Days') == 30

        assert glacier_rule_found is True


class TestVpcFlowLogsIntegration:
    """Integration tests for VPC Flow Logs."""

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled."""
        response = ec2_client.describe_flow_logs(
            Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}]
        )

        assert len(response['FlowLogs']) >= 1

    def test_vpc_flow_logs_active(self):
        """Test VPC Flow Logs are active."""
        response = ec2_client.describe_flow_logs(
            Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}]
        )

        for flow_log in response['FlowLogs']:
            assert flow_log['FlowLogStatus'] == 'ACTIVE'

    def test_vpc_flow_logs_capture_all_traffic(self):
        """Test VPC Flow Logs capture all traffic types."""
        response = ec2_client.describe_flow_logs(
            Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}]
        )

        for flow_log in response['FlowLogs']:
            assert flow_log['TrafficType'] == 'ALL'

    def test_vpc_flow_logs_destination_s3(self):
        """Test VPC Flow Logs destination is S3."""
        response = ec2_client.describe_flow_logs(
            Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}]
        )

        for flow_log in response['FlowLogs']:
            assert flow_log['LogDestinationType'] == 's3'
            assert flow_logs_bucket in flow_log['LogDestination']


class TestNetworkAclIntegration:
    """Integration tests for Network ACLs."""

    def test_network_acl_exists(self):
        """Test custom Network ACL exists."""
        response = ec2_client.describe_network_acls(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'default', 'Values': ['false']}
            ]
        )

        assert len(response['NetworkAcls']) >= 1

    def test_network_acl_associated_with_subnets(self):
        """Test Network ACL is associated with subnets."""
        response = ec2_client.describe_network_acls(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'default', 'Values': ['false']}
            ]
        )

        all_subnet_ids = set(public_subnet_ids + private_subnet_ids)

        for nacl in response['NetworkAcls']:
            associated_subnets = {
                assoc['SubnetId'] for assoc in nacl['Associations']
            }
            # At least some subnets should be associated
            assert len(associated_subnets.intersection(all_subnet_ids)) > 0
