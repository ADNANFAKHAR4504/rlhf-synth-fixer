"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
import pytest
from botocore.exceptions import ClientError


@pytest.mark.integration
@pytest.mark.live
class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        cls.region = os.getenv('AWS_REGION', 'eu-central-1')

        # Load stack outputs
        outputs_file = 'cfn-outputs/flat-outputs.json'
        if not os.path.exists(outputs_file):
            raise FileNotFoundError(f"Outputs file not found: {outputs_file}")

        with open(outputs_file, 'r') as f:
            raw_outputs = json.load(f)

        # Parse JSON-encoded strings from outputs
        cls.outputs = {}
        for key, value in raw_outputs.items():
            # Try to parse JSON strings, otherwise use as-is
            if isinstance(value, str) and value.startswith('['):
                try:
                    cls.outputs[key] = json.loads(value)
                except json.JSONDecodeError:
                    cls.outputs[key] = value
            else:
                cls.outputs[key] = value

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)

    def test_vpc_exists_and_configured(self):
        """Test that VPC exists with correct CIDR and DNS settings."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]

        # Verify CIDR block
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

        # Verify DNS support using describe_vpc_attribute
        dns_support_resp = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        dns_hostnames_resp = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )

        self.assertTrue(dns_support_resp['EnableDnsSupport']['Value'])
        self.assertTrue(dns_hostnames_resp['EnableDnsHostnames']['Value'])

    def test_public_subnets_configuration(self):
        """Test public subnets are in correct AZs and have proper routing."""
        public_subnet_ids = self.outputs['public_subnet_ids']
        azs = self.outputs['availability_zones']

        # Verify we have 3 public subnets
        self.assertEqual(len(public_subnet_ids), 3)

        response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        subnets = response['Subnets']

        # Verify each subnet
        subnet_azs = [s['AvailabilityZone'] for s in subnets]
        for az in azs:
            self.assertIn(az, subnet_azs)

        # Verify CIDR blocks
        expected_cidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']
        actual_cidrs = [s['CidrBlock'] for s in subnets]
        for cidr in expected_cidrs:
            self.assertIn(cidr, actual_cidrs)

        # Verify map public IP on launch
        for subnet in subnets:
            self.assertTrue(subnet['MapPublicIpOnLaunch'])

    def test_private_subnets_configuration(self):
        """Test private application subnets are in correct AZs."""
        private_subnet_ids = self.outputs['private_subnet_ids']
        azs = self.outputs['availability_zones']

        # Verify we have 3 private subnets
        self.assertEqual(len(private_subnet_ids), 3)

        response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
        subnets = response['Subnets']

        # Verify each subnet is in correct AZ
        subnet_azs = [s['AvailabilityZone'] for s in subnets]
        for az in azs:
            self.assertIn(az, subnet_azs)

        # Verify CIDR blocks
        expected_cidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']
        actual_cidrs = [s['CidrBlock'] for s in subnets]
        for cidr in expected_cidrs:
            self.assertIn(cidr, actual_cidrs)

    def test_database_subnets_configuration(self):
        """Test database subnets are in correct AZs."""
        database_subnet_ids = self.outputs['database_subnet_ids']
        azs = self.outputs['availability_zones']

        # Verify we have 3 database subnets
        self.assertEqual(len(database_subnet_ids), 3)

        response = self.ec2_client.describe_subnets(SubnetIds=database_subnet_ids)
        subnets = response['Subnets']

        # Verify each subnet is in correct AZ
        subnet_azs = [s['AvailabilityZone'] for s in subnets]
        for az in azs:
            self.assertIn(az, subnet_azs)

        # Verify CIDR blocks
        expected_cidrs = ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24']
        actual_cidrs = [s['CidrBlock'] for s in subnets]
        for cidr in expected_cidrs:
            self.assertIn(cidr, actual_cidrs)

    def test_nat_gateways_deployed(self):
        """Test that NAT Gateways are deployed in each public subnet."""
        nat_gateway_ids = self.outputs['nat_gateway_ids']
        public_subnet_ids = self.outputs['public_subnet_ids']

        # Verify we have 3 NAT Gateways
        self.assertEqual(len(nat_gateway_ids), 3)

        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=nat_gateway_ids)
        nat_gateways = response['NatGateways']

        # Verify each NAT Gateway is in a public subnet
        nat_subnet_ids = [ng['SubnetId'] for ng in nat_gateways]
        for subnet_id in nat_subnet_ids:
            self.assertIn(subnet_id, public_subnet_ids)

        # Verify all NAT Gateways are available
        for nat in nat_gateways:
            self.assertEqual(nat['State'], 'available')

    def test_internet_gateway_attached(self):
        """Test that Internet Gateway is attached to VPC."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        # Verify exactly one IGW is attached
        self.assertEqual(len(response['InternetGateways']), 1)

        igw = response['InternetGateways'][0]
        self.assertEqual(igw['Attachments'][0]['VpcId'], vpc_id)
        self.assertEqual(igw['Attachments'][0]['State'], 'available')

    def test_public_route_table_configuration(self):
        """Test public subnets route to Internet Gateway."""
        vpc_id = self.outputs['vpc_id']
        public_subnet_ids = self.outputs['public_subnet_ids']

        # Get route tables for public subnets
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'association.subnet-id', 'Values': public_subnet_ids}
            ]
        )

        # Verify route tables have IGW routes
        for rt in response['RouteTables']:
            # Check for 0.0.0.0/0 route to IGW
            has_igw_route = False
            for route in rt['Routes']:
                if route.get('DestinationCidrBlock') == '0.0.0.0/0' and 'GatewayId' in route:
                    if route['GatewayId'].startswith('igw-'):
                        has_igw_route = True
                        break

            self.assertTrue(has_igw_route, "Public subnet should route to IGW")

    def test_private_route_table_configuration(self):
        """Test private subnets route to NAT Gateways."""
        vpc_id = self.outputs['vpc_id']
        private_subnet_ids = self.outputs['private_subnet_ids']
        nat_gateway_ids = self.outputs['nat_gateway_ids']

        # Get route tables for private subnets
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'association.subnet-id', 'Values': private_subnet_ids}
            ]
        )

        # Verify each private subnet routes to a NAT Gateway
        for rt in response['RouteTables']:
            has_nat_route = False
            for route in rt['Routes']:
                if route.get('DestinationCidrBlock') == '0.0.0.0/0' and 'NatGatewayId' in route:
                    if route['NatGatewayId'] in nat_gateway_ids:
                        has_nat_route = True
                        break

            self.assertTrue(has_nat_route, "Private subnet should route to NAT Gateway")

    def test_database_route_table_no_internet(self):
        """Test database subnets have no direct internet access."""
        vpc_id = self.outputs['vpc_id']
        database_subnet_ids = self.outputs['database_subnet_ids']

        # Get route tables for database subnets
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'association.subnet-id', 'Values': database_subnet_ids}
            ]
        )

        # Verify no internet routes
        for rt in response['RouteTables']:
            for route in rt['Routes']:
                if route.get('DestinationCidrBlock') == '0.0.0.0/0':
                    self.fail("Database subnet should not have internet route")

    def test_flow_logs_bucket_exists(self):
        """Test that VPC Flow Logs S3 bucket exists with proper configuration."""
        bucket_name = self.outputs['flow_logs_bucket_name']

        # Verify bucket exists
        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
        except ClientError:
            self.fail(f"Flow logs bucket {bucket_name} does not exist")

        # Verify lifecycle policy exists
        try:
            response = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)

            # Verify 90-day expiration rule exists
            rules = response['Rules']
            has_90_day_rule = False
            for rule in rules:
                if rule['Status'] == 'Enabled' and 'Expiration' in rule:
                    if rule['Expiration'].get('Days') == 90:
                        has_90_day_rule = True
                        break

            self.assertTrue(has_90_day_rule, "Bucket should have 90-day lifecycle rule")
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchLifecycleConfiguration':
                self.fail("Flow logs bucket should have lifecycle configuration")
            raise

        # Verify public access is blocked
        try:
            response = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = response['PublicAccessBlockConfiguration']

            self.assertTrue(config['BlockPublicAcls'])
            self.assertTrue(config['BlockPublicPolicy'])
            self.assertTrue(config['IgnorePublicAcls'])
            self.assertTrue(config['RestrictPublicBuckets'])
        except ClientError as e:
            self.fail(f"Failed to get public access block: {e}")

    def test_vpc_flow_logs_enabled(self):
        """Test that VPC Flow Logs are enabled and configured."""
        vpc_id = self.outputs['vpc_id']
        bucket_name = self.outputs['flow_logs_bucket_name']

        response = self.ec2_client.describe_flow_logs(
            Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}]
        )

        # Verify flow log exists
        self.assertGreater(len(response['FlowLogs']), 0)

        flow_log = response['FlowLogs'][0]

        # Verify flow log configuration
        self.assertEqual(flow_log['TrafficType'], 'ALL')
        self.assertEqual(flow_log['LogDestinationType'], 's3')
        self.assertIn(bucket_name, flow_log['LogDestination'])

    def test_transit_gateway_exists(self):
        """Test that Transit Gateway exists and is available."""
        tgw_id = self.outputs['transit_gateway_id']

        response = self.ec2_client.describe_transit_gateways(
            TransitGatewayIds=[tgw_id]
        )

        # Verify transit gateway exists
        self.assertEqual(len(response['TransitGateways']), 1)

        tgw = response['TransitGateways'][0]
        self.assertEqual(tgw['State'], 'available')
        self.assertEqual(tgw['Options']['DnsSupport'], 'enable')
        self.assertEqual(tgw['Options']['VpnEcmpSupport'], 'enable')

    def test_transit_gateway_vpc_attachment(self):
        """Test that Transit Gateway is attached to VPC."""
        tgw_attachment_id = self.outputs['transit_gateway_attachment_id']
        vpc_id = self.outputs['vpc_id']
        private_subnet_ids = self.outputs['private_subnet_ids']

        response = self.ec2_client.describe_transit_gateway_vpc_attachments(
            TransitGatewayAttachmentIds=[tgw_attachment_id]
        )

        # Verify attachment exists
        self.assertEqual(len(response['TransitGatewayVpcAttachments']), 1)

        attachment = response['TransitGatewayVpcAttachments'][0]
        self.assertEqual(attachment['VpcId'], vpc_id)
        self.assertEqual(attachment['State'], 'available')

        # Verify attached to private subnets
        attached_subnet_ids = attachment.get('SubnetIds', [])
        # SubnetIds might be a list of strings directly
        if isinstance(attached_subnet_ids, list) and len(attached_subnet_ids) > 0:
            if isinstance(attached_subnet_ids[0], str):
                # Direct list of subnet IDs
                for subnet_id in attached_subnet_ids:
                    self.assertIn(subnet_id, private_subnet_ids)
            else:
                # List of dict objects with SubnetId key
                for s in attached_subnet_ids:
                    subnet_id = s.get('SubnetId') if isinstance(s, dict) else s
                    self.assertIn(subnet_id, private_subnet_ids)

    def test_network_acls_configured(self):
        """Test that Network ACLs are properly configured for all tiers."""
        vpc_id = self.outputs['vpc_id']

        # Get all NACLs for the VPC (excluding default)
        response = self.ec2_client.describe_network_acls(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'default', 'Values': ['false']}
            ]
        )

        # Should have 3 custom NACLs (public, private, database)
        self.assertEqual(len(response['NetworkAcls']), 3)

        # Verify each NACL has explicit rules
        for nacl in response['NetworkAcls']:
            # Should have both ingress and egress rules
            self.assertGreater(len(nacl['Entries']), 0)

    def test_multi_az_deployment(self):
        """Test that resources are deployed across 3 availability zones."""
        azs = self.outputs['availability_zones']

        # Verify 3 AZs
        self.assertEqual(len(azs), 3)

        # Verify all AZs belong to the configured region
        # AZs are dynamically discovered, so verify they match the region
        for az in azs:
            self.assertTrue(az.startswith(self.region),
                          f"AZ {az} should be in region {self.region}")

        # Verify subnets span all AZs
        all_subnet_ids = (
            self.outputs['public_subnet_ids'] +
            self.outputs['private_subnet_ids'] +
            self.outputs['database_subnet_ids']
        )

        response = self.ec2_client.describe_subnets(SubnetIds=all_subnet_ids)
        subnet_azs = {s['AvailabilityZone'] for s in response['Subnets']}

        # Verify subnets exist in all 3 AZs
        self.assertEqual(len(subnet_azs), 3)
        for az in azs:
            self.assertIn(az, subnet_azs)


if __name__ == "__main__":
    unittest.main()
