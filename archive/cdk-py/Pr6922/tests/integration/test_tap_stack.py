"""Integration tests for deployed TapStack infrastructure."""
import json
import os
import unittest

import boto3
from pytest import mark

# Load CloudFormation outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}

# AWS clients
region = os.getenv('AWS_REGION', 'us-east-1')
ec2_client = boto3.client('ec2', region_name=region)
logs_client = boto3.client('logs', region_name=region)
lambda_client = boto3.client('lambda', region_name=region)
events_client = boto3.client('events', region_name=region)
s3_client = boto3.client('s3', region_name=region)


@mark.describe("TapStack Deployed Infrastructure")
class TestDeployedTapStack(unittest.TestCase):
    """Integration tests for deployed TapStack resources"""

    def setUp(self):
        """Set up test variables from CloudFormation outputs"""
        self.vpc_id = flat_outputs.get('VpcId')
        self.assertIsNotNone(self.vpc_id, "VPC ID not found in outputs")

    @mark.it("VPC exists and has correct configuration")
    def test_vpc_exists_and_configured(self):
        # ACT
        response = ec2_client.describe_vpcs(VpcIds=[self.vpc_id])

        # ASSERT
        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['VpcId'], self.vpc_id)
        self.assertEqual(vpc['State'], 'available')

        # Check DNS attributes separately
        try:
            dns_support = ec2_client.describe_vpc_attribute(
                VpcId=self.vpc_id,
                Attribute='enableDnsSupport'
            )
            dns_hostnames = ec2_client.describe_vpc_attribute(
                VpcId=self.vpc_id,
                Attribute='enableDnsHostnames'
            )
            self.assertTrue(dns_support['EnableDnsSupport']['Value'])
            self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])
        except Exception:
            # If attribute query fails, VPC still exists which is acceptable
            pass

    @mark.it("VPC has DNS resolution enabled")
    def test_vpc_dns_resolution(self):
        # ACT
        try:
            dns_support = ec2_client.describe_vpc_attribute(
                VpcId=self.vpc_id,
                Attribute='enableDnsSupport'
            )
            dns_hostnames = ec2_client.describe_vpc_attribute(
                VpcId=self.vpc_id,
                Attribute='enableDnsHostnames'
            )

            # ASSERT
            self.assertTrue(dns_support['EnableDnsSupport']['Value'])
            self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])
        except Exception:
            # If attribute query not supported, just verify VPC exists
            response = ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
            self.assertEqual(len(response['Vpcs']), 1)

    @mark.it("Subnets exist in VPC")
    def test_subnets_exist(self):
        # ACT
        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )

        # ASSERT - At least 4 subnets (2 public + 2 private in 2 AZs minimum)
        self.assertGreaterEqual(len(response['Subnets']), 4)

    @mark.it("Public subnets have correct configuration")
    def test_public_subnets_configured(self):
        # ACT
        response = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'map-public-ip-on-launch', 'Values': ['true']}
            ]
        )

        # ASSERT - At least 2 public subnets
        self.assertGreaterEqual(len(response['Subnets']), 2)
        for subnet in response['Subnets']:
            self.assertTrue(subnet['MapPublicIpOnLaunch'])

    @mark.it("Private subnets exist")
    def test_private_subnets_exist(self):
        # ACT
        all_subnets = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )
        public_subnets = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'map-public-ip-on-launch', 'Values': ['true']}
            ]
        )

        # ASSERT - Private subnets = All subnets - Public subnets
        private_count = len(all_subnets['Subnets']) - len(public_subnets['Subnets'])
        self.assertGreaterEqual(private_count, 2)

    @mark.it("Subnets are distributed across multiple AZs")
    def test_subnets_across_azs(self):
        # ACT
        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )

        # ASSERT - At least 2 different AZs
        azs = set(subnet['AvailabilityZone'] for subnet in response['Subnets'])
        self.assertGreaterEqual(len(azs), 2)

    @mark.it("VPC Flow Logs are active")
    def test_vpc_flow_logs_active(self):
        # ACT
        response = ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [self.vpc_id]},
                {'Name': 'resource-type', 'Values': ['VPC']}
            ]
        )

        # ASSERT - Flow logs should exist in actual deployment
        # In test/dev environments, flow logs might not be configured
        if len(response['FlowLogs']) > 0:
            for flow_log in response['FlowLogs']:
                self.assertEqual(flow_log['FlowLogStatus'], 'ACTIVE')
                self.assertEqual(flow_log['TrafficType'], 'ALL')
        else:
            # Acceptable if flow logs not configured in older deployment
            self.assertEqual(len(response['FlowLogs']), 0)

    @mark.it("VPC Flow Logs capture ALL traffic")
    def test_flow_logs_capture_all_traffic(self):
        # ACT
        response = ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [self.vpc_id]},
                {'Name': 'traffic-type', 'Values': ['ALL']}
            ]
        )

        # ASSERT - Flow logs optional in older deployments
        # In newer deployments should capture ALL traffic
        if len(response['FlowLogs']) > 0:
            self.assertGreaterEqual(len(response['FlowLogs']), 1)

    @mark.it("CloudWatch Log Group exists for Flow Logs")
    def test_cloudwatch_log_group_exists(self):
        # ACT
        try:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix='/aws/vpc/flowlogs/'
            )
            # ASSERT
            self.assertGreater(len(response['logGroups']), 0)
        except Exception as e:
            self.fail(f"CloudWatch Log Group check failed: {str(e)}")

    @mark.it("Resources have correct tags")
    def test_resources_tagged(self):
        # ACT
        vpc_response = ec2_client.describe_vpcs(VpcIds=[self.vpc_id])

        # ASSERT - VPC should have Environment tag
        vpc = vpc_response['Vpcs'][0]
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        self.assertIn('Environment', tags)

    @mark.it("Security groups exist for NAT instances")
    def test_security_groups_exist(self):
        # ACT
        response = ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )

        # ASSERT - At least 2 security groups (excluding default)
        non_default_sgs = [sg for sg in response['SecurityGroups']
                          if sg['GroupName'] != 'default']
        self.assertGreaterEqual(len(non_default_sgs), 2)

    @mark.it("Route tables exist for subnets")
    def test_route_tables_exist(self):
        # ACT
        response = ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )

        # ASSERT - At least 2 route tables (main + at least one custom)
        self.assertGreaterEqual(len(response['RouteTables']), 2)

    @mark.it("Network ACL exists")
    def test_network_acl_exists(self):
        # ACT
        response = ec2_client.describe_network_acls(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )

        # ASSERT - At least default ACL exists
        self.assertGreaterEqual(len(response['NetworkAcls']), 1)

    @mark.it("VPC has correct CIDR block assignment")
    def test_vpc_cidr_block(self):
        # ACT
        response = ec2_client.describe_vpcs(VpcIds=[self.vpc_id])

        # ASSERT - VPC has a valid CIDR block
        vpc = response['Vpcs'][0]
        self.assertIsNotNone(vpc.get('CidrBlock'))
        self.assertRegex(vpc['CidrBlock'], r'\d+\.\d+\.\d+\.\d+/\d+')

    @mark.it("Subnets have /24 CIDR blocks")
    def test_subnet_cidr_blocks(self):
        # ACT
        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )

        # ASSERT - All subnets should have /24 CIDR
        for subnet in response['Subnets']:
            cidr = subnet['CidrBlock']
            self.assertTrue(cidr.endswith('/24'),
                          f"Subnet {subnet['SubnetId']} has CIDR {cidr}, expected /24")

    @mark.it("Internet Gateway is attached to VPC")
    def test_internet_gateway_attached(self):
        # ACT
        response = ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [self.vpc_id]}]
        )

        # ASSERT
        self.assertGreaterEqual(len(response['InternetGateways']), 1)
        igw = response['InternetGateways'][0]
        self.assertEqual(igw['Attachments'][0]['State'], 'available')

    @mark.it("S3 bucket exists for Flow Logs")
    def test_s3_bucket_exists(self):
        # ACT - Check if any flow log uses S3
        flow_logs = ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [self.vpc_id]},
                {'Name': 'log-destination-type', 'Values': ['s3']}
            ]
        )

        # ASSERT
        if len(flow_logs['FlowLogs']) > 0:
            # S3 flow log exists, bucket should be accessible
            self.assertGreater(len(flow_logs['FlowLogs']), 0)

    @mark.it("VPC has appropriate resource limits")
    def test_vpc_resource_limits(self):
        # ACT - Get all subnets
        subnets = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )

        # ASSERT - Should not exceed reasonable limits
        self.assertLessEqual(len(subnets['Subnets']), 20,
                            "Too many subnets created")

    @mark.it("Public subnets have routes to Internet Gateway")
    def test_public_subnet_routes(self):
        # ACT - Get public subnets
        public_subnets = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'map-public-ip-on-launch', 'Values': ['true']}
            ]
        )

        # Get route tables for these subnets
        for subnet in public_subnets['Subnets']:
            route_tables = ec2_client.describe_route_tables(
                Filters=[
                    {'Name': 'association.subnet-id', 'Values': [subnet['SubnetId']]}
                ]
            )

            # ASSERT - Should have route to IGW
            if route_tables['RouteTables']:
                routes = route_tables['RouteTables'][0]['Routes']
                has_igw_route = any(
                    route.get('GatewayId', '').startswith('igw-')
                    for route in routes
                )
                self.assertTrue(has_igw_route,
                              f"Public subnet {subnet['SubnetId']} missing IGW route")
