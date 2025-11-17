#!/usr/bin/env python3
"""
Integration tests for CloudFormation VPC Stack
Tests validate deployed resources and connectivity
"""

import json
import os
import time
import unittest
import boto3
from typing import Dict, List, Optional


class TestVPCIntegration(unittest.TestCase):
    """Integration test suite for deployed VPC infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs and initialize AWS clients"""
        cls.ec2_client = boto3.client('ec2', region_name='us-east-1')
        cls.logs_client = boto3.client('logs', region_name='us-east-1')
        cls.cfn_client = boto3.client('cloudformation', region_name='us-east-1')

        # Load outputs from cfn-outputs/flat-outputs.json
        outputs_path = os.path.join(
            os.path.dirname(__file__),
            '..',
            'cfn-outputs',
            'flat-outputs.json'
        )

        if os.path.exists(outputs_path):
            with open(outputs_path, 'r') as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}
            cls.skip_tests = True
            return

        cls.skip_tests = False
        cls.vpc_id = cls.outputs.get('VPCId')
        cls.public_subnet_ids = cls.outputs.get('PublicSubnetIds', '').split(',')
        cls.private_subnet_ids = cls.outputs.get('PrivateSubnetIds', '').split(',')
        cls.database_subnet_ids = cls.outputs.get('DatabaseSubnetIds', '').split(',')
        cls.nat_gateway_ids = cls.outputs.get('NatGatewayIds', '').split(',')
        cls.igw_id = cls.outputs.get('InternetGatewayId')
        cls.flow_logs_group = cls.outputs.get('VPCFlowLogsLogGroupName')

    def setUp(self):
        """Skip tests if outputs not available"""
        if self.skip_tests:
            self.skipTest("Stack outputs not available - stack may not be deployed")

    def test_vpc_exists(self):
        """Test VPC exists and has correct configuration"""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])

        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]

        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

        # Check DNS attributes using describe_vpc_attribute
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=self.vpc_id,
            Attribute='enableDnsSupport'
        )
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=self.vpc_id,
            Attribute='enableDnsHostnames'
        )

        self.assertTrue(dns_support['EnableDnsSupport']['Value'])
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])

    def test_internet_gateway_attached(self):
        """Test Internet Gateway is attached to VPC"""
        response = self.ec2_client.describe_internet_gateways(
            InternetGatewayIds=[self.igw_id]
        )

        self.assertEqual(len(response['InternetGateways']), 1)
        igw = response['InternetGateways'][0]

        attachments = igw['Attachments']
        self.assertEqual(len(attachments), 1)
        self.assertEqual(attachments[0]['VpcId'], self.vpc_id)
        self.assertEqual(attachments[0]['State'], 'available')

    def test_public_subnets_exist(self):
        """Test all public subnets exist with correct configuration"""
        response = self.ec2_client.describe_subnets(SubnetIds=self.public_subnet_ids)

        self.assertEqual(len(response['Subnets']), 3)

        expected_cidrs = {'10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'}
        actual_cidrs = {subnet['CidrBlock'] for subnet in response['Subnets']}

        self.assertEqual(actual_cidrs, expected_cidrs)

        # Check all are in the VPC
        for subnet in response['Subnets']:
            self.assertEqual(subnet['VpcId'], self.vpc_id)
            self.assertTrue(subnet['MapPublicIpOnLaunch'])

    def test_public_subnets_across_azs(self):
        """Test public subnets are distributed across different AZs"""
        response = self.ec2_client.describe_subnets(SubnetIds=self.public_subnet_ids)

        azs = {subnet['AvailabilityZone'] for subnet in response['Subnets']}
        self.assertEqual(len(azs), 3, "Public subnets should be in 3 different AZs")

    def test_private_subnets_exist(self):
        """Test all private subnets exist with correct configuration"""
        response = self.ec2_client.describe_subnets(SubnetIds=self.private_subnet_ids)

        self.assertEqual(len(response['Subnets']), 3)

        expected_cidrs = {'10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'}
        actual_cidrs = {subnet['CidrBlock'] for subnet in response['Subnets']}

        self.assertEqual(actual_cidrs, expected_cidrs)

        for subnet in response['Subnets']:
            self.assertEqual(subnet['VpcId'], self.vpc_id)

    def test_database_subnets_exist(self):
        """Test all database subnets exist with correct configuration"""
        response = self.ec2_client.describe_subnets(SubnetIds=self.database_subnet_ids)

        self.assertEqual(len(response['Subnets']), 3)

        expected_cidrs = {'10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'}
        actual_cidrs = {subnet['CidrBlock'] for subnet in response['Subnets']}

        self.assertEqual(actual_cidrs, expected_cidrs)

    def test_nat_gateways_exist(self):
        """Test all NAT Gateways exist and are available"""
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=self.nat_gateway_ids)

        self.assertEqual(len(response['NatGateways']), 3)

        for nat_gw in response['NatGateways']:
            self.assertEqual(nat_gw['State'], 'available')
            self.assertEqual(nat_gw['VpcId'], self.vpc_id)
            self.assertIn(nat_gw['SubnetId'], self.public_subnet_ids)

    def test_nat_gateways_in_different_azs(self):
        """Test NAT Gateways are in different availability zones"""
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=self.nat_gateway_ids)

        # Get subnets for NAT Gateways
        subnet_ids = [nat_gw['SubnetId'] for nat_gw in response['NatGateways']]
        subnets_response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)

        azs = {subnet['AvailabilityZone'] for subnet in subnets_response['Subnets']}
        self.assertEqual(len(azs), 3, "NAT Gateways should be in 3 different AZs")

    def test_nat_gateways_have_elastic_ips(self):
        """Test each NAT Gateway has an Elastic IP"""
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=self.nat_gateway_ids)

        for nat_gw in response['NatGateways']:
            addresses = nat_gw['NatGatewayAddresses']
            self.assertEqual(len(addresses), 1)
            self.assertIsNotNone(addresses[0].get('PublicIp'))
            self.assertIsNotNone(addresses[0].get('AllocationId'))

    def test_public_route_table_to_igw(self):
        """Test public subnets route to Internet Gateway"""
        # Get route tables for public subnets
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'association.subnet-id', 'Values': self.public_subnet_ids}
            ]
        )

        for rt in response['RouteTables']:
            # Check for route to IGW
            routes = rt['Routes']
            igw_route = [r for r in routes if r.get('GatewayId', '').startswith('igw-')]

            self.assertGreater(len(igw_route), 0, "Public route table should have IGW route")
            self.assertEqual(igw_route[0]['DestinationCidrBlock'], '0.0.0.0/0')

    def test_private_route_tables_to_nat_gateways(self):
        """Test private subnets route to NAT Gateways"""
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'association.subnet-id', 'Values': self.private_subnet_ids}
            ]
        )

        for rt in response['RouteTables']:
            routes = rt['Routes']
            nat_route = [r for r in routes if r.get('NatGatewayId', '').startswith('nat-')]

            self.assertGreater(len(nat_route), 0, "Private route table should have NAT Gateway route")
            self.assertEqual(nat_route[0]['DestinationCidrBlock'], '0.0.0.0/0')

    def test_database_route_tables_to_nat_gateways(self):
        """Test database subnets route to NAT Gateways"""
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'association.subnet-id', 'Values': self.database_subnet_ids}
            ]
        )

        for rt in response['RouteTables']:
            routes = rt['Routes']
            nat_route = [r for r in routes if r.get('NatGatewayId', '').startswith('nat-')]

            self.assertGreater(len(nat_route), 0, "Database route table should have NAT Gateway route")

    def test_network_acls_configured(self):
        """Test Network ACLs are properly configured"""
        # Get all network ACLs for the VPC
        response = self.ec2_client.describe_network_acls(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )

        # Should have at least 3 custom NACLs (public, private, database) + 1 default
        self.assertGreaterEqual(len(response['NetworkAcls']), 4)

    def test_public_nacl_allows_http_https(self):
        """Test public NACL allows HTTP and HTTPS traffic"""
        # Get public subnets' NACL
        response = self.ec2_client.describe_network_acls(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'association.subnet-id', 'Values': [self.public_subnet_ids[0]]}
            ]
        )

        if len(response['NetworkAcls']) > 0:
            nacl = response['NetworkAcls'][0]
            entries = nacl['Entries']

            # Check for HTTP (80) and HTTPS (443) allow rules
            inbound_entries = [e for e in entries if not e['Egress'] and e['RuleAction'] == 'allow']

            http_rules = [e for e in inbound_entries
                         if e.get('PortRange', {}).get('From') == 80]
            https_rules = [e for e in inbound_entries
                          if e.get('PortRange', {}).get('From') == 443]

            self.assertGreater(len(http_rules), 0, "Should have HTTP allow rule")
            self.assertGreater(len(https_rules), 0, "Should have HTTPS allow rule")

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled"""
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [self.vpc_id]}
            ]
        )

        self.assertGreater(len(response['FlowLogs']), 0, "VPC should have flow logs enabled")

        flow_log = response['FlowLogs'][0]
        self.assertEqual(flow_log['TrafficType'], 'ALL')
        self.assertEqual(flow_log['LogDestinationType'], 'cloud-watch-logs')

    def test_flow_logs_log_group_exists(self):
        """Test VPC Flow Logs CloudWatch Log Group exists"""
        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=self.flow_logs_group
        )

        self.assertGreater(len(response['logGroups']), 0, "Flow logs log group should exist")

        log_group = response['logGroups'][0]
        self.assertEqual(log_group['retentionInDays'], 7)

    def test_flow_logs_generating_data(self):
        """Test VPC Flow Logs are generating data"""
        # Wait a bit for logs to generate
        time.sleep(5)

        try:
            response = self.logs_client.describe_log_streams(
                logGroupName=self.flow_logs_group,
                orderBy='LastEventTime',
                descending=True,
                limit=1
            )

            # If log streams exist, flow logs are working
            if len(response['logStreams']) > 0:
                log_stream = response['logStreams'][0]
                self.assertIsNotNone(log_stream.get('lastEventTimestamp'))
        except self.logs_client.exceptions.ResourceNotFoundException:
            self.skipTest("Log streams not yet created - this is normal for new deployments")

    def test_resource_tags_present(self):
        """Test resources have required tags"""
        # Check VPC tags
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        required_tags = ['Environment', 'Project', 'CostCenter']
        for tag in required_tags:
            self.assertIn(tag, tags, f"VPC should have {tag} tag")

    def test_subnet_tags_present(self):
        """Test subnets have required tags"""
        all_subnet_ids = self.public_subnet_ids + self.private_subnet_ids + self.database_subnet_ids
        response = self.ec2_client.describe_subnets(SubnetIds=all_subnet_ids)

        required_tags = ['Environment', 'Project', 'CostCenter', 'Type']

        for subnet in response['Subnets']:
            tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
            for tag in required_tags:
                self.assertIn(tag, tags, f"Subnet {subnet['SubnetId']} should have {tag} tag")

    def test_nat_gateway_tags_present(self):
        """Test NAT Gateways have required tags"""
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=self.nat_gateway_ids)

        required_tags = ['Environment', 'Project', 'CostCenter']

        for nat_gw in response['NatGateways']:
            tags = {tag['Key']: tag['Value'] for tag in nat_gw.get('Tags', [])}
            for tag in required_tags:
                self.assertIn(tag, tags, f"NAT Gateway should have {tag} tag")


if __name__ == '__main__':
    unittest.main(verbosity=2)