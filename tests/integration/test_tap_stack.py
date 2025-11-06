"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using boto3.
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
        # Read deployment outputs
        outputs_file = os.path.join(
            os.path.dirname(__file__),
            '..', '..', 'cfn-outputs', 'flat-outputs.json'
        )

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name='us-east-1')
        cls.logs_client = boto3.client('logs', region_name='us-east-1')

        # Extract key resource IDs from outputs
        cls.vpc_id = cls.outputs['vpc_id']
        cls.vpc_cidr = cls.outputs['vpc_cidr']
        cls.igw_id = cls.outputs['internet_gateway_id']
        cls.public_subnet_ids = cls.outputs['public_subnet_ids']
        cls.private_subnet_ids = cls.outputs['private_subnet_ids']
        cls.nat_gateway_ids = cls.outputs['nat_gateway_ids']
        cls.security_group_id = cls.outputs['security_group_id']
        cls.flow_log_id = cls.outputs['flow_log_id']

    def test_vpc_exists_and_configured(self):
        """Test VPC exists with correct CIDR and DNS settings."""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])

        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]

        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        self.assertEqual(vpc['State'], 'available')

        # Check DNS attributes
        dns_response = self.ec2_client.describe_vpc_attribute(
            VpcId=self.vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_response['EnableDnsHostnames']['Value'])

        dns_support_response = self.ec2_client.describe_vpc_attribute(
            VpcId=self.vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support_response['EnableDnsSupport']['Value'])

    def test_vpc_tags(self):
        """Test VPC has required tags."""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        self.assertEqual(tags.get('Environment'), 'Production')
        self.assertEqual(tags.get('Project'), 'PaymentGateway')

    def test_internet_gateway_attached(self):
        """Test Internet Gateway is attached to VPC."""
        response = self.ec2_client.describe_internet_gateways(
            InternetGatewayIds=[self.igw_id]
        )

        self.assertEqual(len(response['InternetGateways']), 1)
        igw = response['InternetGateways'][0]

        attachments = igw['Attachments']
        self.assertEqual(len(attachments), 1)
        self.assertEqual(attachments[0]['VpcId'], self.vpc_id)
        self.assertEqual(attachments[0]['State'], 'available')

    def test_public_subnets_configuration(self):
        """Test public subnets are correctly configured across 3 AZs."""
        response = self.ec2_client.describe_subnets(
            SubnetIds=self.public_subnet_ids
        )

        self.assertEqual(len(response['Subnets']), 3)

        expected_cidrs = {'10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'}
        actual_cidrs = {subnet['CidrBlock'] for subnet in response['Subnets']}
        self.assertEqual(actual_cidrs, expected_cidrs)

        # Check all subnets are in different AZs
        azs = {subnet['AvailabilityZone'] for subnet in response['Subnets']}
        self.assertEqual(len(azs), 3)

        # Check auto-assign public IP is enabled
        for subnet in response['Subnets']:
            self.assertTrue(subnet['MapPublicIpOnLaunch'])

    def test_private_subnets_configuration(self):
        """Test private subnets are correctly configured across 3 AZs."""
        response = self.ec2_client.describe_subnets(
            SubnetIds=self.private_subnet_ids
        )

        self.assertEqual(len(response['Subnets']), 3)

        expected_cidrs = {'10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'}
        actual_cidrs = {subnet['CidrBlock'] for subnet in response['Subnets']}
        self.assertEqual(actual_cidrs, expected_cidrs)

        # Check all subnets are in different AZs
        azs = {subnet['AvailabilityZone'] for subnet in response['Subnets']}
        self.assertEqual(len(azs), 3)

        # Check auto-assign public IP is disabled
        for subnet in response['Subnets']:
            self.assertFalse(subnet['MapPublicIpOnLaunch'])

    def test_nat_gateways_deployed(self):
        """Test 3 NAT Gateways are deployed and available."""
        response = self.ec2_client.describe_nat_gateways(
            NatGatewayIds=self.nat_gateway_ids
        )

        self.assertEqual(len(response['NatGateways']), 3)

        # Check all NAT Gateways are available
        for nat in response['NatGateways']:
            self.assertEqual(nat['State'], 'available')
            self.assertEqual(nat['VpcId'], self.vpc_id)

            # Check NAT Gateway has Elastic IP
            self.assertEqual(len(nat['NatGatewayAddresses']), 1)
            self.assertIsNotNone(nat['NatGatewayAddresses'][0]['AllocationId'])

        # Check NAT Gateways are in different subnets (different AZs)
        nat_subnets = {nat['SubnetId'] for nat in response['NatGateways']}
        self.assertEqual(len(nat_subnets), 3)

    def test_security_group_rules(self):
        """Test security group has correct inbound and outbound rules."""
        response = self.ec2_client.describe_security_groups(
            GroupIds=[self.security_group_id]
        )

        self.assertEqual(len(response['SecurityGroups']), 1)
        sg = response['SecurityGroups'][0]

        # Check inbound rules - should allow only HTTPS
        ingress_rules = sg['IpPermissions']
        self.assertEqual(len(ingress_rules), 1)

        https_rule = ingress_rules[0]
        self.assertEqual(https_rule['IpProtocol'], 'tcp')
        self.assertEqual(https_rule['FromPort'], 443)
        self.assertEqual(https_rule['ToPort'], 443)
        # Check CIDR is present (may have additional fields like Description)
        cidr_ips = [r['CidrIp'] for r in https_rule['IpRanges']]
        self.assertIn('0.0.0.0/0', cidr_ips)

        # Check outbound rules - should allow all
        egress_rules = sg['IpPermissionsEgress']
        self.assertEqual(len(egress_rules), 1)
        egress_rule = egress_rules[0]
        self.assertEqual(egress_rule['IpProtocol'], '-1')
        # Check CIDR is present (may have additional fields like Description)
        egress_cidr_ips = [r['CidrIp'] for r in egress_rule['IpRanges']]
        self.assertIn('0.0.0.0/0', egress_cidr_ips)
        egress_cidr_ips = [r['CidrIp'] for r in egress_rule['IpRanges']]
        self.assertIn('0.0.0.0/0', egress_cidr_ips)

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled and configured correctly."""
        response = self.ec2_client.describe_flow_logs(
            FlowLogIds=[self.flow_log_id]
        )

        self.assertEqual(len(response['FlowLogs']), 1)
        flow_log = response['FlowLogs'][0]

        self.assertEqual(flow_log['ResourceId'], self.vpc_id)
        self.assertEqual(flow_log['TrafficType'], 'ALL')
        self.assertEqual(flow_log['LogDestinationType'], 'cloud-watch-logs')
        self.assertEqual(flow_log['FlowLogStatus'], 'ACTIVE')

        # Check aggregation interval (should be 600 seconds / 10 minutes)
        self.assertEqual(flow_log.get('MaxAggregationInterval'), 600)

    def test_public_route_tables(self):
        """Test public subnets route tables point to Internet Gateway."""
        # Get route tables for public subnets
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'association.subnet-id', 'Values': self.public_subnet_ids}
            ]
        )

        route_tables = response['RouteTables']
        self.assertGreater(len(route_tables), 0)

        # Check all public subnet route tables have route to IGW
        for rt in route_tables:
            routes = rt['Routes']

            # Find default route
            default_routes = [r for r in routes if r.get('DestinationCidrBlock') == '0.0.0.0/0']
            self.assertEqual(len(default_routes), 1)

            # Check it points to Internet Gateway
            self.assertEqual(default_routes[0]['GatewayId'], self.igw_id)
            self.assertEqual(default_routes[0]['State'], 'active')

    def test_private_route_tables(self):
        """Test private subnets route tables point to NAT Gateways."""
        # Get route tables for private subnets
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'association.subnet-id', 'Values': self.private_subnet_ids}
            ]
        )

        route_tables = response['RouteTables']
        self.assertEqual(len(route_tables), 3)

        # Check each private subnet has route to NAT Gateway
        nat_gateways_in_routes = set()

        for rt in route_tables:
            routes = rt['Routes']

            # Find default route
            default_routes = [r for r in routes if r.get('DestinationCidrBlock') == '0.0.0.0/0']
            self.assertEqual(len(default_routes), 1)

            # Check it points to NAT Gateway
            nat_gateway_id = default_routes[0].get('NatGatewayId')
            self.assertIsNotNone(nat_gateway_id)
            self.assertIn(nat_gateway_id, self.nat_gateway_ids)
            self.assertEqual(default_routes[0]['State'], 'active')

            nat_gateways_in_routes.add(nat_gateway_id)

        # Verify we're using all 3 NAT Gateways (one per AZ)
        self.assertEqual(len(nat_gateways_in_routes), 3)

    def test_high_availability_architecture(self):
        """Test infrastructure is highly available across multiple AZs."""
        # Get all subnets
        all_subnet_ids = self.public_subnet_ids + self.private_subnet_ids
        response = self.ec2_client.describe_subnets(SubnetIds=all_subnet_ids)

        # Check subnets span 3 availability zones
        azs = {subnet['AvailabilityZone'] for subnet in response['Subnets']}
        self.assertEqual(len(azs), 3)

        # Check we have both public and private subnets in each AZ
        for az in azs:
            subnets_in_az = [s for s in response['Subnets']
                           if s['AvailabilityZone'] == az]

            # Should have 2 subnets per AZ (1 public + 1 private)
            self.assertEqual(len(subnets_in_az), 2)

            cidrs = {s['CidrBlock'] for s in subnets_in_az}
            # One CIDR should be in 10.0.x.0/24 range (public)
            # One CIDR should be in 10.0.1x.0/24 range (private)
            public_subnets = [c for c in cidrs if c in
                            {'10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'}]
            private_subnets = [c for c in cidrs if c in
                             {'10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'}]

            self.assertEqual(len(public_subnets), 1)
            self.assertEqual(len(private_subnets), 1)

    def test_resource_naming_convention(self):
        """Test resources follow naming convention with environment suffix."""
        # This is verified implicitly by successful resource lookups
        # but we can also check tags contain proper naming
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        name_tag = tags.get('Name', '')

        # Name should include environment suffix
        self.assertIn('synth101000852', name_tag.lower())

    def test_network_connectivity_simulation(self):
        """Test network ACLs allow proper connectivity."""
        # Get network ACLs for the VPC
        response = self.ec2_client.describe_network_acls(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )

        self.assertGreater(len(response['NetworkAcls']), 0)

        # Check default NACL allows all traffic (permissive for testing)
        for nacl in response['NetworkAcls']:
            if nacl.get('IsDefault', False):
                # Default NACLs should allow all inbound and outbound
                ingress_rules = [e for e in nacl['Entries'] if not e['Egress']]
                egress_rules = [e for e in nacl['Entries'] if e['Egress']]

                self.assertGreater(len(ingress_rules), 0)
                self.assertGreater(len(egress_rules), 0)


if __name__ == '__main__':
    unittest.main()
