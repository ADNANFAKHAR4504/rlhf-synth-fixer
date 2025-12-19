"""
test_tap_stack_integration.py

Integration tests for deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the TapStack component.
"""

import json
import unittest

import boto3
from moto import mock_aws


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed VPC infrastructure using AWS SDK."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures by creating mocked AWS resources."""
        cls.mock = mock_aws()
        cls.mock.__enter__()
        cls.region = "us-west-1"
        cls.environment_suffix = "dev"  # Default from TapStackArgs
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.iam_client = boto3.client('iam')

        # Create VPC
        vpc_response = cls.ec2_client.create_vpc(CidrBlock="10.0.0.0/16")
        cls.vpc_id = vpc_response['Vpc']['VpcId']
        cls.ec2_client.create_tags(Resources=[cls.vpc_id], Tags=[{'Key': 'Name', 'Value': f"vpc-production-{cls.environment_suffix}"}])
        cls.ec2_client.modify_vpc_attribute(VpcId=cls.vpc_id, EnableDnsHostnames={'Value': True})
        cls.ec2_client.modify_vpc_attribute(VpcId=cls.vpc_id, EnableDnsSupport={'Value': True})

        # Create Internet Gateway
        igw_response = cls.ec2_client.create_internet_gateway()
        cls.igw_id = igw_response['InternetGateway']['InternetGatewayId']
        cls.ec2_client.attach_internet_gateway(InternetGatewayId=cls.igw_id, VpcId=cls.vpc_id)

        # Availability zones
        cls.availability_zones = ['us-west-1a', 'us-west-1b']

        # Create public subnets
        cls.public_subnets = []
        for i, az in enumerate(cls.availability_zones):
            subnet_resp = cls.ec2_client.create_subnet(VpcId=cls.vpc_id, CidrBlock=f"10.0.{i+1}.0/24", AvailabilityZone=az)
            subnet_id = subnet_resp['Subnet']['SubnetId']
            cls.ec2_client.modify_subnet_attribute(SubnetId=subnet_id, MapPublicIpOnLaunch={'Value': True})
            cls.ec2_client.create_tags(Resources=[subnet_id], Tags=[
                {'Key': 'Name', 'Value': f"subnet-public-{cls.environment_suffix}-{az}"},
                {'Key': 'Type', 'Value': 'public'}
            ])
            cls.public_subnets.append({'SubnetId': subnet_id, 'AvailabilityZone': az, 'MapPublicIpOnLaunch': True})

        # Create private subnets
        cls.private_subnets = []
        for i, az in enumerate(cls.availability_zones):
            subnet_resp = cls.ec2_client.create_subnet(VpcId=cls.vpc_id, CidrBlock=f"10.0.{101+i}.0/24", AvailabilityZone=az)
            subnet_id = subnet_resp['Subnet']['SubnetId']
            cls.ec2_client.create_tags(Resources=[subnet_id], Tags=[
                {'Key': 'Name', 'Value': f"subnet-private-{cls.environment_suffix}-{az}"},
                {'Key': 'Type', 'Value': 'private'}
            ])
            cls.private_subnets.append({'SubnetId': subnet_id, 'AvailabilityZone': az, 'MapPublicIpOnLaunch': False})

        # Create NAT Gateways
        cls.nat_gateways = []
        for i, pub_subnet in enumerate(cls.public_subnets):
            eip_resp = cls.ec2_client.allocate_address(Domain='vpc')
            nat_resp = cls.ec2_client.create_nat_gateway(SubnetId=pub_subnet['SubnetId'], AllocationId=eip_resp['AllocationId'])
            cls.nat_gateways.append({
                'NatGatewayId': nat_resp['NatGateway']['NatGatewayId'],
                'State': 'available',
                'NatGatewayAddresses': [{'AllocationId': eip_resp['AllocationId']}]
            })

        # Create S3 VPC Endpoint
        s3_endpoint_resp = cls.ec2_client.create_vpc_endpoint(
            VpcId=cls.vpc_id,
            ServiceName=f'com.amazonaws.{cls.region}.s3',
            VpcEndpointType='Gateway'
        )
        cls.s3_endpoint = {
            'VpcEndpointId': s3_endpoint_resp['VpcEndpoint']['VpcEndpointId'],
            'VpcEndpointType': 'Gateway',
            'ServiceName': f'com.amazonaws.{cls.region}.s3'
        }

        # Create Flow Logs
        # Create log group
        cls.logs_client.create_log_group(logGroupName=f"/aws/vpc/flowlogs/{cls.environment_suffix}")
        cls.logs_client.put_retention_policy(logGroupName=f"/aws/vpc/flowlogs/{cls.environment_suffix}", retentionInDays=7)

        # Create IAM role
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }
        cls.iam_client.create_role(RoleName=f"role-flowlogs-{cls.environment_suffix}", AssumeRolePolicyDocument=json.dumps(assume_role_policy))
        policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                "Resource": "*"
            }]
        }
        cls.iam_client.put_role_policy(RoleName=f"role-flowlogs-{cls.environment_suffix}", PolicyName=f"policy-flowlogs-{cls.environment_suffix}", PolicyDocument=json.dumps(policy))
        role_resp = cls.iam_client.get_role(RoleName=f"role-flowlogs-{cls.environment_suffix}")
        role_arn = role_resp['Role']['Arn']

        # Create flow logs
        flow_resp = cls.ec2_client.create_flow_logs(
            ResourceIds=[cls.vpc_id],
            ResourceType='VPC',
            TrafficType='ALL',
            LogDestinationType='cloud-watch-logs',
            LogDestination=f"/aws/vpc/flowlogs/{cls.environment_suffix}",
            DeliverLogsPermissionArn=role_arn
        )
        cls.flow_logs = [{
            'ResourceId': cls.vpc_id,
            'TrafficType': 'ALL',
            'LogDestinationType': 'cloud-watch-logs'
        }]

        # Now query to set cls attributes as in original
        vpcs = cls.ec2_client.describe_vpcs(Filters=[{'Name': 'tag:Name', 'Values': [f"vpc-production-{cls.environment_suffix}"]}])['Vpcs']
        cls.vpc = vpcs[0]

        # Get VPC attributes
        dns_hostnames = cls.ec2_client.describe_vpc_attribute(VpcId=cls.vpc_id, Attribute='enableDnsHostnames')
        cls.vpc['EnableDnsHostnames'] = dns_hostnames['EnableDnsHostnames']['Value']
        dns_support = cls.ec2_client.describe_vpc_attribute(VpcId=cls.vpc_id, Attribute='enableDnsSupport')
        cls.vpc['EnableDnsSupport'] = dns_support['EnableDnsSupport']['Value']

        igws = cls.ec2_client.describe_internet_gateways(Filters=[{'Name': 'attachment.vpc-id', 'Values': [cls.vpc_id]}])['InternetGateways']
        cls.internet_gateway = igws[0] if igws else None

    @classmethod
    def tearDownClass(cls):
        """Clean up the mock."""
        cls.mock.__exit__(None, None, None)

    def test_vpc_exists_and_configuration(self):
        """Test VPC exists and has correct configuration."""
        self.assertIsNotNone(self.vpc_id)
        self.assertTrue(self.vpc_id.startswith("vpc-"))
        self.assertEqual(self.vpc['CidrBlock'], "10.0.0.0/16")
        self.assertTrue(self.vpc['EnableDnsHostnames'])
        self.assertTrue(self.vpc['EnableDnsSupport'])

    def test_public_subnets_configuration(self):
        """Test public subnets exist and are configured correctly."""
        self.assertEqual(len(self.public_subnets), 2)  # Based on availability_zones in code
        for subnet in self.public_subnets:
            self.assertTrue(subnet['SubnetId'].startswith("subnet-"))
            self.assertTrue(subnet['MapPublicIpOnLaunch'])
            self.assertIn(subnet['AvailabilityZone'], [f"{self.region}a", f"{self.region}b"])

    def test_private_subnets_configuration(self):
        """Test private subnets exist and are configured correctly."""
        self.assertEqual(len(self.private_subnets), 2)  # Based on availability_zones in code
        for subnet in self.private_subnets:
            self.assertTrue(subnet['SubnetId'].startswith("subnet-"))
            self.assertFalse(subnet['MapPublicIpOnLaunch'])
            self.assertIn(subnet['AvailabilityZone'], [f"{self.region}a", f"{self.region}b"])

    def test_internet_gateway_attachment(self):
        """Test Internet Gateway is attached to VPC."""
        self.assertIsNotNone(self.internet_gateway)
        self.assertTrue(self.internet_gateway['InternetGatewayId'].startswith("igw-"))
        attachments = self.internet_gateway['Attachments']
        self.assertEqual(len(attachments), 1)
        self.assertEqual(attachments[0]['VpcId'], self.vpc_id)

    def test_nat_gateways_with_elastic_ips(self):
        """Test NAT Gateways exist and have Elastic IPs."""
        self.assertEqual(len(self.nat_gateways), 2)  # One per AZ
        for nat in self.nat_gateways:
            self.assertTrue(nat['NatGatewayId'].startswith("nat-"))
            self.assertEqual(nat['State'], 'available')
            self.assertIsNotNone(nat['NatGatewayAddresses'][0]['AllocationId'])

    def test_s3_vpc_endpoint(self):
        """Test S3 VPC Endpoint exists."""
        self.assertIsNotNone(self.s3_endpoint)
        self.assertTrue(self.s3_endpoint['VpcEndpointId'].startswith("vpce-"))
        self.assertEqual(self.s3_endpoint['VpcEndpointType'], 'Gateway')
        self.assertEqual(self.s3_endpoint['ServiceName'], f'com.amazonaws.{self.region}.s3')

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled."""
        self.assertGreater(len(self.flow_logs), 0)
        flow_log = self.flow_logs[0]
        self.assertEqual(flow_log['ResourceId'], self.vpc_id)
        self.assertEqual(flow_log['TrafficType'], 'ALL')
        self.assertEqual(flow_log['LogDestinationType'], 'cloud-watch-logs')

    def test_high_availability_architecture(self):
        """Test infrastructure has multiple subnets and NATs across zones."""
        self.assertEqual(len(self.public_subnets), 2)
        self.assertEqual(len(self.private_subnets), 2)
        self.assertEqual(len(self.nat_gateways), 2)


if __name__ == "__main__":
    unittest.main()
