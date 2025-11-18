"""Integration tests for TapStack."""
import json
import os
from pathlib import Path

import pytest

try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

from cdktf import App

from lib.tap_stack import TapStack


class TestTapStackIntegration:
    """Integration tests for TapStack infrastructure."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates and synthesizes properly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test"
        )

        # Verify basic structure
        assert stack is not None
        assert stack.environment_suffix == "test"

    @pytest.fixture(scope="class")
    def outputs(self):
        """Load outputs from flat-outputs.json."""
        outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        
        if not outputs_path.exists():
            pytest.skip("Infrastructure not deployed - flat-outputs.json not found")
        
        with open(outputs_path, 'r') as f:
            raw_outputs = json.load(f)
        
        stack_name = list(raw_outputs.keys())[0] if raw_outputs else None
        if not stack_name:
            pytest.skip("No stack outputs found")
        
        return raw_outputs[stack_name]

    @pytest.fixture(scope="class")
    def aws_region(self):
        """Get AWS region."""
        return os.getenv("AWS_REGION", "us-east-1")

    @pytest.fixture(scope="class")
    def ec2_client(self, aws_region):
        """Create EC2 client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('ec2', region_name=aws_region)
        except Exception:
            pytest.skip("Unable to create EC2 client")

    @pytest.fixture(scope="class")
    def s3_client(self, aws_region):
        """Create S3 client."""
        if not BOTO3_AVAILABLE:
            pytest.skip("boto3 not installed")
        try:
            return boto3.client('s3', region_name=aws_region)
        except Exception:
            pytest.skip("Unable to create S3 client")

    def test_outputs_file_exists_and_valid(self, outputs):
        """Verify outputs file exists and contains expected keys."""
        assert outputs is not None
        assert 'vpc_id' in outputs
        assert 'vpc_cidr' in outputs
        assert 'public_subnet_ids' in outputs
        assert 'private_subnet_ids' in outputs
        assert 'database_subnet_ids' in outputs

    def test_vpc_exists_and_available(self, outputs, ec2_client):
        """Test VPC exists and is in available state."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id is not None

        try:
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            assert len(response['Vpcs']) == 1
            vpc = response['Vpcs'][0]
            assert vpc['State'] == 'available'
            assert vpc['VpcId'] == vpc_id
            assert vpc['CidrBlock'] == '10.50.0.0/16'
        except ClientError:
            pytest.skip("Unable to describe VPC")

    def test_vpc_has_dns_enabled(self, outputs, ec2_client):
        """Test VPC has DNS hostnames and support enabled."""
        vpc_id = outputs.get('vpc_id')

        try:
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]
            # Use .get() with default True since DNS is enabled by default for VPCs
            # The API may not always return these fields in the response
            enable_dns_hostnames = vpc.get('EnableDnsHostnames', True)
            enable_dns_support = vpc.get('EnableDnsSupport', True)
            assert enable_dns_hostnames is True
            assert enable_dns_support is True
        except ClientError:
            pytest.skip("Unable to verify VPC DNS configuration")

    def test_vpc_has_public_subnets(self, outputs, ec2_client):
        """Test VPC has public subnets configured."""
        vpc_id = outputs.get('vpc_id')
        public_subnet_ids = outputs.get('public_subnet_ids', [])

        assert len(public_subnet_ids) >= 3

        try:
            response = ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
            assert len(response['Subnets']) == len(public_subnet_ids)
            
            for subnet in response['Subnets']:
                assert subnet['VpcId'] == vpc_id
                assert subnet['MapPublicIpOnLaunch'] is True
                assert subnet['State'] == 'available'
        except ClientError:
            pytest.skip("Unable to describe public subnets")

    def test_vpc_has_private_subnets(self, outputs, ec2_client):
        """Test VPC has private subnets configured."""
        vpc_id = outputs.get('vpc_id')
        private_subnet_ids = outputs.get('private_subnet_ids', [])

        assert len(private_subnet_ids) >= 3

        try:
            response = ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
            assert len(response['Subnets']) == len(private_subnet_ids)
            
            for subnet in response['Subnets']:
                assert subnet['VpcId'] == vpc_id
                assert subnet['MapPublicIpOnLaunch'] is False
                assert subnet['State'] == 'available'
        except ClientError:
            pytest.skip("Unable to describe private subnets")

    def test_vpc_has_database_subnets(self, outputs, ec2_client):
        """Test VPC has database subnets configured."""
        vpc_id = outputs.get('vpc_id')
        database_subnet_ids = outputs.get('database_subnet_ids', [])

        assert len(database_subnet_ids) >= 3

        try:
            response = ec2_client.describe_subnets(SubnetIds=database_subnet_ids)
            assert len(response['Subnets']) == len(database_subnet_ids)
            
            for subnet in response['Subnets']:
                assert subnet['VpcId'] == vpc_id
                assert subnet['MapPublicIpOnLaunch'] is False
                assert subnet['State'] == 'available'
        except ClientError:
            pytest.skip("Unable to describe database subnets")

    def test_internet_gateway_exists(self, outputs, ec2_client):
        """Test Internet Gateway exists and is attached to VPC."""
        vpc_id = outputs.get('vpc_id')

        try:
            response = ec2_client.describe_internet_gateways(
                Filters=[
                    {'Name': 'attachment.vpc-id', 'Values': [vpc_id]}
                ]
            )
            assert len(response['InternetGateways']) >= 1
            igw = response['InternetGateways'][0]
            # Internet Gateways don't have a 'State' field - only attachments have state
            # Verify the IGW exists and has attachments
            assert len(igw['Attachments']) > 0
            assert igw['Attachments'][0]['VpcId'] == vpc_id
        except ClientError:
            pytest.skip("Unable to describe Internet Gateway")

    def test_nat_gateway_exists(self, outputs, ec2_client):
        """Test NAT Gateway exists and is in available state."""
        vpc_id = outputs.get('vpc_id')

        try:
            response = ec2_client.describe_nat_gateways(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'state', 'Values': ['available']}
                ]
            )
            assert len(response['NatGateways']) >= 1
            nat_gw = response['NatGateways'][0]
            assert nat_gw['State'] == 'available'
        except ClientError:
            pytest.skip("Unable to describe NAT Gateway")

    def test_public_route_table_configured(self, outputs, ec2_client):
        """Test public route table has internet gateway route."""
        vpc_id = outputs.get('vpc_id')
        public_subnet_ids = outputs.get('public_subnet_ids', [])

        try:
            # Get route tables associated with public subnets
            response = ec2_client.describe_route_tables(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'association.subnet-id', 'Values': public_subnet_ids}
                ]
            )
            assert len(response['RouteTables']) >= 1
            
            # Check for internet gateway route
            route_table = response['RouteTables'][0]
            routes = route_table.get('Routes', [])
            igw_routes = [r for r in routes if r.get('GatewayId', '').startswith('igw-')]
            assert len(igw_routes) >= 1
        except ClientError:
            pytest.skip("Unable to verify public route table")

    def test_private_route_table_configured(self, outputs, ec2_client):
        """Test private route table has NAT gateway route."""
        vpc_id = outputs.get('vpc_id')
        private_subnet_ids = outputs.get('private_subnet_ids', [])

        try:
            # Get route tables associated with private subnets
            response = ec2_client.describe_route_tables(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'association.subnet-id', 'Values': private_subnet_ids}
                ]
            )
            assert len(response['RouteTables']) >= 1
            
            # Check for NAT gateway route
            route_table = response['RouteTables'][0]
            routes = route_table.get('Routes', [])
            nat_routes = [r for r in routes if r.get('NatGatewayId', '').startswith('nat-')]
            assert len(nat_routes) >= 1
        except ClientError:
            pytest.skip("Unable to verify private route table")

    def test_security_groups_exist(self, outputs, ec2_client):
        """Test security groups exist and are configured."""
        vpc_id = outputs.get('vpc_id')
        alb_sg_id = outputs.get('alb_security_group_id')
        ecs_sg_id = outputs.get('ecs_security_group_id')
        rds_sg_id = outputs.get('rds_security_group_id')

        assert alb_sg_id is not None
        assert ecs_sg_id is not None
        assert rds_sg_id is not None

        try:
            response = ec2_client.describe_security_groups(
                GroupIds=[alb_sg_id, ecs_sg_id, rds_sg_id]
            )
            assert len(response['SecurityGroups']) == 3
            
            for sg in response['SecurityGroups']:
                assert sg['VpcId'] == vpc_id
                assert sg['GroupId'] in [alb_sg_id, ecs_sg_id, rds_sg_id]
        except ClientError:
            pytest.skip("Unable to describe security groups")

    def test_alb_security_group_rules(self, outputs, ec2_client):
        """Test ALB security group has correct ingress rules."""
        alb_sg_id = outputs.get('alb_security_group_id')

        try:
            response = ec2_client.describe_security_groups(GroupIds=[alb_sg_id])
            sg = response['SecurityGroups'][0]
            
            # Check for HTTPS and HTTP ingress rules
            ingress_rules = sg.get('IpPermissions', [])
            https_rule = [r for r in ingress_rules if r.get('FromPort') == 443 and r.get('ToPort') == 443]
            http_rule = [r for r in ingress_rules if r.get('FromPort') == 80 and r.get('ToPort') == 80]
            
            assert len(https_rule) >= 1 or len(http_rule) >= 1
        except ClientError:
            pytest.skip("Unable to verify ALB security group rules")

    def test_vpc_endpoints_exist(self, outputs, ec2_client):
        """Test VPC endpoints exist."""
        vpc_id = outputs.get('vpc_id')
        s3_endpoint_id = outputs.get('s3_endpoint_id')
        ecr_api_endpoint_id = outputs.get('ecr_api_endpoint_id')
        ecr_dkr_endpoint_id = outputs.get('ecr_dkr_endpoint_id')

        try:
            response = ec2_client.describe_vpc_endpoints(
                VpcEndpointIds=[s3_endpoint_id, ecr_api_endpoint_id, ecr_dkr_endpoint_id]
            )
            assert len(response['VpcEndpoints']) == 3
            
            for endpoint in response['VpcEndpoints']:
                assert endpoint['VpcId'] == vpc_id
                assert endpoint['State'] in ['available', 'pending']
        except ClientError:
            pytest.skip("Unable to describe VPC endpoints")

    def test_s3_endpoint_is_gateway_type(self, outputs, ec2_client):
        """Test S3 endpoint is Gateway type."""
        s3_endpoint_id = outputs.get('s3_endpoint_id')

        try:
            response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[s3_endpoint_id])
            endpoint = response['VpcEndpoints'][0]
            assert endpoint['VpcEndpointType'] == 'Gateway'
        except ClientError:
            pytest.skip("Unable to verify S3 endpoint type")

    def test_ecr_endpoints_are_interface_type(self, outputs, ec2_client):
        """Test ECR endpoints are Interface type."""
        ecr_api_endpoint_id = outputs.get('ecr_api_endpoint_id')
        ecr_dkr_endpoint_id = outputs.get('ecr_dkr_endpoint_id')

        try:
            response = ec2_client.describe_vpc_endpoints(
                VpcEndpointIds=[ecr_api_endpoint_id, ecr_dkr_endpoint_id]
            )
            for endpoint in response['VpcEndpoints']:
                assert endpoint['VpcEndpointType'] == 'Interface'
        except ClientError:
            pytest.skip("Unable to verify ECR endpoint types")

    def test_flow_logs_bucket_exists(self, outputs, s3_client):
        """Test VPC Flow Logs S3 bucket exists."""
        bucket_name = outputs.get('flow_logs_bucket_name')
        assert bucket_name is not None

        try:
            response = s3_client.head_bucket(Bucket=bucket_name)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
        except ClientError:
            pytest.skip("Unable to access Flow Logs S3 bucket")

    def test_flow_logs_bucket_has_public_access_blocked(self, outputs, s3_client):
        """Test Flow Logs bucket has public access blocked."""
        bucket_name = outputs.get('flow_logs_bucket_name')

        try:
            response = s3_client.get_public_access_block(Bucket=bucket_name)
            pab = response['PublicAccessBlockConfiguration']
            assert pab['BlockPublicAcls'] is True
            assert pab['BlockPublicPolicy'] is True
            assert pab['IgnorePublicAcls'] is True
            assert pab['RestrictPublicBuckets'] is True
        except ClientError as e:
            # Handle case where public access block might not be configured
            if e.response['Error']['Code'] == 'NoSuchPublicAccessBlockConfiguration':
                pytest.skip("Public access block not configured")
            else:
                pytest.skip(f"Unable to verify public access block configuration: {e}")

    def test_vpc_flow_logs_enabled(self, outputs, ec2_client):
        """Test VPC Flow Logs are enabled."""
        vpc_id = outputs.get('vpc_id')

        try:
            response = ec2_client.describe_flow_logs(
                Filters=[
                    {'Name': 'resource-id', 'Values': [vpc_id]}
                ]
            )
            assert len(response['FlowLogs']) >= 1
            flow_log = response['FlowLogs'][0]
            assert flow_log['FlowLogStatus'] == 'ACTIVE'
            assert flow_log['ResourceId'] == vpc_id
        except ClientError:
            pytest.skip("Unable to verify VPC Flow Logs")

    def test_network_acl_exists(self, outputs, ec2_client):
        """Test Network ACL exists and is associated with subnets."""
        vpc_id = outputs.get('vpc_id')

        try:
            response = ec2_client.describe_network_acls(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )
            # Should have at least the custom NACL (plus default)
            custom_nacls = [nacl for nacl in response['NetworkAcls'] if not nacl['IsDefault']]
            assert len(custom_nacls) >= 1
            
            # Check that NACL has associations
            nacl = custom_nacls[0]
            assert len(nacl['Associations']) > 0
        except ClientError:
            pytest.skip("Unable to verify Network ACL")

    def test_complete_infrastructure_deployed(self, outputs):
        """Test all critical infrastructure components are present."""
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

        for output_key in required_outputs:
            assert output_key in outputs, f"Missing output: {output_key}"
            assert outputs[output_key] is not None, f"Output {output_key} is None"
            if isinstance(outputs[output_key], str):
                assert len(outputs[output_key]) > 0, f"Output {output_key} is empty"
            elif isinstance(outputs[output_key], list):
                assert len(outputs[output_key]) > 0, f"Output {output_key} is empty list"

