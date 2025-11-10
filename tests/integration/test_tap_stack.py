"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using real deployment outputs.
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
        # Load deployment outputs
        outputs_path = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )

        with open(outputs_path, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name='us-east-1')
        cls.s3_client = boto3.client('s3', region_name='us-east-1')

    def test_vpc_exists_with_correct_cidr(self):
        """Test VPC exists and has correct CIDR block."""
        vpc_id = self.outputs['vpc_id']
        vpc_cidr = self.outputs['vpc_cidr']

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['VpcId'], vpc_id)
        self.assertEqual(vpc['CidrBlock'], vpc_cidr)
        self.assertEqual(vpc['State'], 'available')

    def test_vpc_dns_settings(self):
        """Test VPC DNS hostnames and DNS support are enabled."""
        vpc_id = self.outputs['vpc_id']

        # Check DNS support
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])

        # Check DNS hostnames
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])

    def test_public_subnets_exist(self):
        """Test public subnets exist in correct availability zones."""
        public_subnet_ids = self.outputs['public_subnet_ids']
        self.assertEqual(len(public_subnet_ids), 3)

        response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        self.assertEqual(len(response['Subnets']), 3)

        # Verify subnets are in different AZs
        azs = [subnet['AvailabilityZone'] for subnet in response['Subnets']]
        self.assertEqual(len(set(azs)), 3, "Subnets should be in 3 different AZs")

        # Verify CIDRs are within VPC CIDR
        vpc_cidr = self.outputs['vpc_cidr']
        for subnet in response['Subnets']:
            self.assertTrue(subnet['CidrBlock'].startswith('10.0.'))

    def test_private_subnets_exist(self):
        """Test private subnets exist in correct availability zones."""
        private_subnet_ids = self.outputs['private_subnet_ids']
        self.assertEqual(len(private_subnet_ids), 3)

        response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
        self.assertEqual(len(response['Subnets']), 3)

        # Verify subnets are in different AZs
        azs = [subnet['AvailabilityZone'] for subnet in response['Subnets']]
        self.assertEqual(len(set(azs)), 3, "Subnets should be in 3 different AZs")

        # Verify private subnet CIDRs
        for subnet in response['Subnets']:
            self.assertTrue(subnet['CidrBlock'].startswith('10.0.1'))

    def test_database_subnets_exist(self):
        """Test database subnets exist in correct availability zones."""
        database_subnet_ids = self.outputs['database_subnet_ids']
        self.assertEqual(len(database_subnet_ids), 3)

        response = self.ec2_client.describe_subnets(SubnetIds=database_subnet_ids)
        self.assertEqual(len(response['Subnets']), 3)

        # Verify subnets are in different AZs
        azs = [subnet['AvailabilityZone'] for subnet in response['Subnets']]
        self.assertEqual(len(set(azs)), 3, "Subnets should be in 3 different AZs")

        # Verify database subnet CIDRs
        for subnet in response['Subnets']:
            self.assertTrue(subnet['CidrBlock'].startswith('10.0.2'))

    def test_internet_gateway_attached(self):
        """Test Internet Gateway exists and is attached to VPC."""
        igw_id = self.outputs['internet_gateway_id']
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_internet_gateways(
            InternetGatewayIds=[igw_id]
        )
        self.assertEqual(len(response['InternetGateways']), 1)

        igw = response['InternetGateways'][0]
        attachments = igw['Attachments']
        self.assertEqual(len(attachments), 1)
        self.assertEqual(attachments[0]['VpcId'], vpc_id)
        self.assertEqual(attachments[0]['State'], 'available')

    def test_nat_gateways_exist_and_available(self):
        """Test NAT Gateways exist and are in available state."""
        nat_gateway_ids = self.outputs['nat_gateway_ids']
        self.assertEqual(len(nat_gateway_ids), 3)

        response = self.ec2_client.describe_nat_gateways(
            NatGatewayIds=nat_gateway_ids
        )
        self.assertEqual(len(response['NatGateways']), 3)

        for nat_gateway in response['NatGateways']:
            self.assertEqual(nat_gateway['State'], 'available')
            # Verify NAT gateway is in public subnet
            self.assertIn(
                nat_gateway['SubnetId'],
                self.outputs['public_subnet_ids']
            )

    def test_web_security_group_rules(self):
        """Test web tier security group has correct HTTPS rule."""
        web_sg_id = self.outputs['web_security_group_id']

        response = self.ec2_client.describe_security_groups(
            GroupIds=[web_sg_id]
        )
        self.assertEqual(len(response['SecurityGroups']), 1)

        sg = response['SecurityGroups'][0]

        # Check for HTTPS ingress rule (port 443)
        https_rule_found = False
        for rule in sg['IpPermissions']:
            if rule.get('FromPort') == 443 and rule.get('ToPort') == 443:
                https_rule_found = True
                self.assertEqual(rule['IpProtocol'], 'tcp')
                break

        self.assertTrue(https_rule_found, "HTTPS ingress rule not found")

    def test_app_security_group_rules(self):
        """Test app tier security group allows traffic from web tier."""
        app_sg_id = self.outputs['app_security_group_id']
        web_sg_id = self.outputs['web_security_group_id']

        response = self.ec2_client.describe_security_groups(
            GroupIds=[app_sg_id]
        )
        self.assertEqual(len(response['SecurityGroups']), 1)

        sg = response['SecurityGroups'][0]

        # Check for port 8080 ingress rule from web SG
        app_rule_found = False
        for rule in sg['IpPermissions']:
            if rule.get('FromPort') == 8080 and rule.get('ToPort') == 8080:
                for user_id_pair in rule.get('UserIdGroupPairs', []):
                    if user_id_pair['GroupId'] == web_sg_id:
                        app_rule_found = True
                        break

        self.assertTrue(app_rule_found, "App ingress rule from web SG not found")

    def test_database_security_group_rules(self):
        """Test database tier security group allows traffic from app tier."""
        db_sg_id = self.outputs['database_security_group_id']
        app_sg_id = self.outputs['app_security_group_id']

        response = self.ec2_client.describe_security_groups(
            GroupIds=[db_sg_id]
        )
        self.assertEqual(len(response['SecurityGroups']), 1)

        sg = response['SecurityGroups'][0]

        # Check for PostgreSQL port 5432 ingress rule from app SG
        db_rule_found = False
        for rule in sg['IpPermissions']:
            if rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432:
                for user_id_pair in rule.get('UserIdGroupPairs', []):
                    if user_id_pair['GroupId'] == app_sg_id:
                        db_rule_found = True
                        break

        self.assertTrue(db_rule_found, "Database ingress rule from app SG not found")

    def test_flow_logs_bucket_exists(self):
        """Test S3 bucket for VPC flow logs exists."""
        bucket_name = self.outputs['flow_logs_bucket']

        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"Flow logs bucket does not exist: {e}")

    def test_flow_logs_enabled(self):
        """Test VPC flow logs are enabled for the VPC."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {
                    'Name': 'resource-id',
                    'Values': [vpc_id]
                }
            ]
        )

        self.assertGreater(len(response['FlowLogs']), 0, "No flow logs found for VPC")

        flow_log = response['FlowLogs'][0]
        self.assertEqual(flow_log['ResourceId'], vpc_id)
        self.assertEqual(flow_log['TrafficType'], 'ALL')
        self.assertEqual(flow_log['LogDestinationType'], 's3')

    def test_route_tables_configuration(self):
        """Test route tables are properly configured."""
        vpc_id = self.outputs['vpc_id']

        # Get all route tables for the VPC
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {
                    'Name': 'vpc-id',
                    'Values': [vpc_id]
                }
            ]
        )

        route_tables = response['RouteTables']
        # Should have: 1 public, 3 private, 1 database, 1 default (main) = 6 total
        self.assertGreaterEqual(len(route_tables), 5)

    def test_public_route_to_internet_gateway(self):
        """Test public route table has route to internet gateway."""
        public_subnet_id = self.outputs['public_subnet_ids'][0]
        igw_id = self.outputs['internet_gateway_id']

        # Get route table associated with public subnet
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {
                    'Name': 'association.subnet-id',
                    'Values': [public_subnet_id]
                }
            ]
        )

        self.assertGreater(len(response['RouteTables']), 0)
        route_table = response['RouteTables'][0]

        # Check for route to IGW
        igw_route_found = False
        for route in route_table['Routes']:
            if route.get('GatewayId') == igw_id:
                self.assertEqual(route['DestinationCidrBlock'], '0.0.0.0/0')
                igw_route_found = True
                break

        self.assertTrue(igw_route_found, "Route to Internet Gateway not found")

    def test_private_route_to_nat_gateway(self):
        """Test private route tables have routes to NAT gateways."""
        private_subnet_ids = self.outputs['private_subnet_ids']
        nat_gateway_ids = self.outputs['nat_gateway_ids']

        for private_subnet_id in private_subnet_ids:
            # Get route table associated with private subnet
            response = self.ec2_client.describe_route_tables(
                Filters=[
                    {
                        'Name': 'association.subnet-id',
                        'Values': [private_subnet_id]
                    }
                ]
            )

            self.assertGreater(len(response['RouteTables']), 0)
            route_table = response['RouteTables'][0]

            # Check for route to NAT Gateway
            nat_route_found = False
            for route in route_table['Routes']:
                if route.get('NatGatewayId') in nat_gateway_ids:
                    self.assertEqual(route['DestinationCidrBlock'], '0.0.0.0/0')
                    nat_route_found = True
                    break

            self.assertTrue(
                nat_route_found,
                f"Route to NAT Gateway not found for subnet {private_subnet_id}"
            )

    def test_database_route_table_no_internet_route(self):
        """Test database route table has no internet routing."""
        database_subnet_id = self.outputs['database_subnet_ids'][0]

        # Get route table associated with database subnet
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {
                    'Name': 'association.subnet-id',
                    'Values': [database_subnet_id]
                }
            ]
        )

        self.assertGreater(len(response['RouteTables']), 0)
        route_table = response['RouteTables'][0]

        # Check that there's no route to 0.0.0.0/0
        internet_route_found = False
        for route in route_table['Routes']:
            if route.get('DestinationCidrBlock') == '0.0.0.0/0':
                internet_route_found = True
                break

        self.assertFalse(
            internet_route_found,
            "Database subnet should not have internet routing"
        )


if __name__ == '__main__':
    unittest.main()
