"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load stack outputs from flat-outputs.json
        outputs_file = os.path.join(os.getcwd(), 'cfn-outputs', 'flat-outputs.json')

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(
                f"Stack outputs file not found at {outputs_file}. "
                "Deploy the stack first to generate outputs."
            )

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.ec2_resource = boto3.resource('ec2', region_name=cls.region)

    def test_vpc_exists_and_configured(self):
        """Test VPC exists with correct CIDR and configuration."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

        # Describe VPC
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        # Note: EnableDnsHostnames and EnableDnsSupport require describe_vpc_attribute
        self.assertEqual(vpc['State'], 'available')

        # Check DNS attributes
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])

        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])

    def test_internet_gateway_attached(self):
        """Test Internet Gateway is attached to VPC."""
        vpc_id = self.outputs.get('vpc_id')
        igw_id = self.outputs.get('internet_gateway_id')

        self.assertIsNotNone(igw_id, "Internet Gateway ID not found in outputs")

        # Describe Internet Gateway
        response = self.ec2_client.describe_internet_gateways(
            InternetGatewayIds=[igw_id]
        )
        self.assertEqual(len(response['InternetGateways']), 1)

        igw = response['InternetGateways'][0]
        self.assertEqual(len(igw['Attachments']), 1)
        self.assertEqual(igw['Attachments'][0]['VpcId'], vpc_id)
        self.assertEqual(igw['Attachments'][0]['State'], 'available')

    def test_public_subnets_configuration(self):
        """Test public subnets exist with correct configuration."""
        public_subnet_ids = self.outputs.get('public_subnet_ids')
        self.assertIsNotNone(public_subnet_ids, "Public subnet IDs not found in outputs")

        # Convert string representation to list if needed
        if isinstance(public_subnet_ids, str):
            public_subnet_ids = json.loads(public_subnet_ids)

        self.assertEqual(len(public_subnet_ids), 3, "Expected 3 public subnets")

        # Describe subnets
        response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        subnets = response['Subnets']

        expected_cidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']
        actual_cidrs = sorted([subnet['CidrBlock'] for subnet in subnets])

        self.assertEqual(actual_cidrs, expected_cidrs)

        # Verify all subnets have map_public_ip_on_launch enabled
        for subnet in subnets:
            self.assertTrue(
                subnet['MapPublicIpOnLaunch'],
                f"Subnet {subnet['SubnetId']} should have MapPublicIpOnLaunch enabled"
            )

    def test_private_subnets_configuration(self):
        """Test private subnets exist with correct configuration."""
        private_subnet_ids = self.outputs.get('private_subnet_ids')
        self.assertIsNotNone(private_subnet_ids, "Private subnet IDs not found in outputs")

        # Convert string representation to list if needed
        if isinstance(private_subnet_ids, str):
            private_subnet_ids = json.loads(private_subnet_ids)

        self.assertEqual(len(private_subnet_ids), 3, "Expected 3 private subnets")

        # Describe subnets
        response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
        subnets = response['Subnets']

        expected_cidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']
        actual_cidrs = sorted([subnet['CidrBlock'] for subnet in subnets])

        self.assertEqual(actual_cidrs, expected_cidrs)

        # Verify all subnets have map_public_ip_on_launch disabled
        for subnet in subnets:
            self.assertFalse(
                subnet['MapPublicIpOnLaunch'],
                f"Subnet {subnet['SubnetId']} should have MapPublicIpOnLaunch disabled"
            )

    def test_isolated_subnets_configuration(self):
        """Test isolated subnets exist with correct configuration."""
        isolated_subnet_ids = self.outputs.get('isolated_subnet_ids')
        self.assertIsNotNone(isolated_subnet_ids, "Isolated subnet IDs not found in outputs")

        # Convert string representation to list if needed
        if isinstance(isolated_subnet_ids, str):
            isolated_subnet_ids = json.loads(isolated_subnet_ids)

        self.assertEqual(len(isolated_subnet_ids), 3, "Expected 3 isolated subnets")

        # Describe subnets
        response = self.ec2_client.describe_subnets(SubnetIds=isolated_subnet_ids)
        subnets = response['Subnets']

        expected_cidrs = ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24']
        actual_cidrs = sorted([subnet['CidrBlock'] for subnet in subnets])

        self.assertEqual(actual_cidrs, expected_cidrs)

    def test_nat_gateways_in_public_subnets(self):
        """Test NAT Gateways are created in public subnets."""
        nat_gateway_ids = self.outputs.get('nat_gateway_ids')
        self.assertIsNotNone(nat_gateway_ids, "NAT Gateway IDs not found in outputs")

        # Convert string representation to list if needed
        if isinstance(nat_gateway_ids, str):
            nat_gateway_ids = json.loads(nat_gateway_ids)

        self.assertEqual(len(nat_gateway_ids), 3, "Expected 3 NAT Gateways (one per AZ)")

        # Describe NAT Gateways
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=nat_gateway_ids)
        nat_gateways = response['NatGateways']

        public_subnet_ids = self.outputs.get('public_subnet_ids')
        if isinstance(public_subnet_ids, str):
            public_subnet_ids = json.loads(public_subnet_ids)

        # Verify all NAT Gateways are in public subnets
        for nat_gw in nat_gateways:
            self.assertIn(
                nat_gw['SubnetId'],
                public_subnet_ids,
                f"NAT Gateway {nat_gw['NatGatewayId']} should be in a public subnet"
            )
            self.assertEqual(nat_gw['State'], 'available')
            self.assertEqual(len(nat_gw['NatGatewayAddresses']), 1)

    def test_public_route_table_has_igw_route(self):
        """Test public subnets have route to Internet Gateway."""
        vpc_id = self.outputs.get('vpc_id')
        igw_id = self.outputs.get('internet_gateway_id')
        public_subnet_ids = self.outputs.get('public_subnet_ids')

        if isinstance(public_subnet_ids, str):
            public_subnet_ids = json.loads(public_subnet_ids)

        # Get route tables for public subnets
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'association.subnet-id', 'Values': public_subnet_ids}
            ]
        )

        # Should have at least one route table for public subnets
        self.assertGreater(len(response['RouteTables']), 0)

        # Verify route to IGW exists
        for rt in response['RouteTables']:
            igw_routes = [
                route for route in rt['Routes']
                if route.get('GatewayId') == igw_id and route['DestinationCidrBlock'] == '0.0.0.0/0'
            ]
            self.assertGreater(
                len(igw_routes),
                0,
                f"Route table {rt['RouteTableId']} should have route to IGW"
            )

    def test_private_route_tables_have_nat_routes(self):
        """Test private subnets have routes to NAT Gateways."""
        vpc_id = self.outputs.get('vpc_id')
        private_subnet_ids = self.outputs.get('private_subnet_ids')
        nat_gateway_ids = self.outputs.get('nat_gateway_ids')

        if isinstance(private_subnet_ids, str):
            private_subnet_ids = json.loads(private_subnet_ids)
        if isinstance(nat_gateway_ids, str):
            nat_gateway_ids = json.loads(nat_gateway_ids)

        # Get route tables for private subnets
        for subnet_id in private_subnet_ids:
            response = self.ec2_client.describe_route_tables(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'association.subnet-id', 'Values': [subnet_id]}
                ]
            )

            self.assertGreater(len(response['RouteTables']), 0)

            rt = response['RouteTables'][0]
            # Verify route to NAT Gateway exists
            nat_routes = [
                route for route in rt['Routes']
                if route.get('NatGatewayId') in nat_gateway_ids and
                route['DestinationCidrBlock'] == '0.0.0.0/0'
            ]
            self.assertGreater(
                len(nat_routes),
                0,
                f"Route table for subnet {subnet_id} should have route to NAT Gateway"
            )

    def test_isolated_subnets_no_internet_routes(self):
        """Test isolated subnets have no routes to internet."""
        vpc_id = self.outputs.get('vpc_id')
        isolated_subnet_ids = self.outputs.get('isolated_subnet_ids')

        if isinstance(isolated_subnet_ids, str):
            isolated_subnet_ids = json.loads(isolated_subnet_ids)

        # Get route tables for isolated subnets
        for subnet_id in isolated_subnet_ids:
            response = self.ec2_client.describe_route_tables(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'association.subnet-id', 'Values': [subnet_id]}
                ]
            )

            self.assertGreater(len(response['RouteTables']), 0)

            rt = response['RouteTables'][0]
            # Verify no routes to internet (no IGW or NAT Gateway routes)
            for route in rt['Routes']:
                if route['DestinationCidrBlock'] == '0.0.0.0/0':
                    self.fail(
                        f"Isolated subnet {subnet_id} should not have default route to internet"
                    )

    def test_s3_bucket_exists_and_encrypted(self):
        """Test S3 bucket for VPC Flow Logs exists with encryption."""
        bucket_name = self.outputs.get('flow_logs_bucket_name')
        self.assertIsNotNone(bucket_name, "Flow logs bucket name not found in outputs")

        # Check bucket exists
        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            self.fail(f"Bucket {bucket_name} does not exist or is not accessible: {e}")

        # Check encryption
        try:
            response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = response['ServerSideEncryptionConfiguration']['Rules']
            self.assertGreater(len(rules), 0)
            self.assertEqual(
                rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
                'AES256'
            )
        except ClientError as e:
            self.fail(f"Failed to get bucket encryption: {e}")

    def test_s3_bucket_versioning_enabled(self):
        """Test S3 bucket has versioning enabled."""
        bucket_name = self.outputs.get('flow_logs_bucket_name')
        self.assertIsNotNone(bucket_name, "Flow logs bucket name not found in outputs")

        # Check versioning
        try:
            response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(response.get('Status'), 'Enabled')
        except ClientError as e:
            self.fail(f"Failed to get bucket versioning: {e}")

    def test_s3_bucket_lifecycle_policy(self):
        """Test S3 bucket has lifecycle policy for Glacier transition."""
        bucket_name = self.outputs.get('flow_logs_bucket_name')
        self.assertIsNotNone(bucket_name, "Flow logs bucket name not found in outputs")

        # Check lifecycle policy
        try:
            response = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            rules = response['Rules']
            self.assertGreater(len(rules), 0)

            # Check for Glacier transition after 30 days
            glacier_rule_found = False
            for rule in rules:
                if rule['Status'] == 'Enabled':
                    for transition in rule.get('Transitions', []):
                        if (transition['Days'] == 30 and
                            transition['StorageClass'] == 'GLACIER'):
                            glacier_rule_found = True
                            break

            self.assertTrue(
                glacier_rule_found,
                "Bucket should have lifecycle rule to transition to Glacier after 30 days"
            )
        except ClientError as e:
            self.fail(f"Failed to get bucket lifecycle policy: {e}")

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled and logging to S3."""
        vpc_id = self.outputs.get('vpc_id')
        bucket_arn = self.outputs.get('flow_logs_bucket_arn')

        self.assertIsNotNone(bucket_arn, "Flow logs bucket ARN not found in outputs")

        # Describe flow logs
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )

        self.assertGreater(len(response['FlowLogs']), 0, "No flow logs found for VPC")

        flow_log = response['FlowLogs'][0]
        self.assertEqual(flow_log['LogDestinationType'], 's3')
        self.assertEqual(flow_log['TrafficType'], 'ALL')
        self.assertEqual(flow_log['FlowLogStatus'], 'ACTIVE')

    def test_network_acl_rules_for_public_subnets(self):
        """Test Network ACL rules for public subnets allow only HTTP/HTTPS."""
        vpc_id = self.outputs.get('vpc_id')
        public_subnet_ids = self.outputs.get('public_subnet_ids')

        if isinstance(public_subnet_ids, str):
            public_subnet_ids = json.loads(public_subnet_ids)

        # Get Network ACLs for public subnets
        response = self.ec2_client.describe_network_acls(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'association.subnet-id', 'Values': public_subnet_ids}
            ]
        )

        # Check at least one custom NACL exists (not just default)
        custom_nacls = [
            nacl for nacl in response['NetworkAcls']
            if not nacl['IsDefault']
        ]

        self.assertGreater(len(custom_nacls), 0, "No custom Network ACL found for public subnets")

        nacl = custom_nacls[0]
        entries = nacl['Entries']

        # Verify inbound rules
        inbound_entries = [e for e in entries if not e['Egress']]

        # Check for HTTP allow rule
        http_rules = [
            e for e in inbound_entries
            if e['RuleAction'] == 'allow' and e.get('PortRange', {}).get('From') == 80
        ]
        self.assertGreater(len(http_rules), 0, "No HTTP allow rule found")

        # Check for HTTPS allow rule
        https_rules = [
            e for e in inbound_entries
            if e['RuleAction'] == 'allow' and e.get('PortRange', {}).get('From') == 443
        ]
        self.assertGreater(len(https_rules), 0, "No HTTPS allow rule found")

    def test_availability_zones_distribution(self):
        """Test resources are distributed across 3 availability zones."""
        public_subnet_ids = self.outputs.get('public_subnet_ids')

        if isinstance(public_subnet_ids, str):
            public_subnet_ids = json.loads(public_subnet_ids)

        # Get availability zones for public subnets
        response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        azs = set(subnet['AvailabilityZone'] for subnet in response['Subnets'])

        self.assertEqual(len(azs), 3, "Subnets should be distributed across 3 AZs")

    def test_resource_tagging(self):
        """Test resources have correct tags."""
        vpc_id = self.outputs.get('vpc_id')

        # Describe VPC tags
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        tags = {tag['Key']: tag['Value'] for tag in response['Vpcs'][0].get('Tags', [])}

        # Verify required tags
        self.assertEqual(tags.get('Environment'), 'production')
        self.assertEqual(tags.get('Project'), 'trading-platform')


if __name__ == '__main__':
    unittest.main()
