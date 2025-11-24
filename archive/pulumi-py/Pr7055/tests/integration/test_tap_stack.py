"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load stack outputs from flat-outputs.json
        outputs_file = os.path.join(os.path.dirname(__file__), '../../cfn-outputs/flat-outputs.json')
        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name='us-east-1')
        cls.s3_client = boto3.client('s3', region_name='us-east-1')
        cls.iam_client = boto3.client('iam', region_name='us-east-1')

    def test_vpc_exists_and_configured(self):
        """Test that VPC exists and is properly configured."""
        vpc_id = self.outputs['vpc_id']
        self.assertIsNotNone(vpc_id)
        self.assertTrue(vpc_id.startswith('vpc-'))

        # Verify VPC exists and has correct configuration
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

        # Check DNS settings using describe_vpc_attribute
        dns_hostnames_response = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_hostnames_response['EnableDnsHostnames']['Value'])

        dns_support_response = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support_response['EnableDnsSupport']['Value'])

    def test_all_subnets_exist(self):
        """Test that all 9 subnets (3 public, 3 private, 3 db) exist."""
        public_subnets = json.loads(self.outputs['public_subnet_ids'])
        private_subnets = json.loads(self.outputs['private_subnet_ids'])
        db_subnets = json.loads(self.outputs['db_subnet_ids'])

        # Check counts
        self.assertEqual(len(public_subnets), 3)
        self.assertEqual(len(private_subnets), 3)
        self.assertEqual(len(db_subnets), 3)

        # Verify all subnets exist
        all_subnets = public_subnets + private_subnets + db_subnets
        response = self.ec2_client.describe_subnets(SubnetIds=all_subnets)
        self.assertEqual(len(response['Subnets']), 9)

        # Verify VPC assignment
        vpc_id = self.outputs['vpc_id']
        for subnet in response['Subnets']:
            self.assertEqual(subnet['VpcId'], vpc_id)

    def test_public_subnets_configuration(self):
        """Test public subnets configuration."""
        public_subnet_ids = json.loads(self.outputs['public_subnet_ids'])
        response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)

        for subnet in response['Subnets']:
            # Public subnets should auto-assign public IPs
            self.assertTrue(subnet['MapPublicIpOnLaunch'])

            # Verify CIDR blocks (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
            cidr = subnet['CidrBlock']
            self.assertTrue(cidr.startswith('10.0.'))
            self.assertTrue(cidr.endswith('.0/24'))

    def test_private_subnets_configuration(self):
        """Test private subnets configuration."""
        private_subnet_ids = json.loads(self.outputs['private_subnet_ids'])
        response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)

        for subnet in response['Subnets']:
            # Private subnets should NOT auto-assign public IPs
            self.assertFalse(subnet['MapPublicIpOnLaunch'])

            # Verify CIDR blocks (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
            cidr = subnet['CidrBlock']
            self.assertTrue(cidr.startswith('10.0.1'))
            self.assertTrue(cidr.endswith('.0/24'))

    def test_database_subnets_configuration(self):
        """Test database subnets configuration."""
        db_subnet_ids = json.loads(self.outputs['db_subnet_ids'])
        response = self.ec2_client.describe_subnets(SubnetIds=db_subnet_ids)

        for subnet in response['Subnets']:
            # Database subnets should NOT auto-assign public IPs
            self.assertFalse(subnet['MapPublicIpOnLaunch'])

            # Verify CIDR blocks (10.0.20.0/24, 10.0.21.0/24, 10.0.22.0/24)
            cidr = subnet['CidrBlock']
            self.assertTrue(cidr.startswith('10.0.2'))
            self.assertTrue(cidr.endswith('.0/24'))

    def test_nat_instances_exist_and_running(self):
        """Test that 3 NAT instances exist and are running."""
        nat_instance_ids = json.loads(self.outputs['nat_instance_ids'])
        self.assertEqual(len(nat_instance_ids), 3)

        # Verify instances exist
        response = self.ec2_client.describe_instances(InstanceIds=nat_instance_ids)
        self.assertEqual(len(response['Reservations']), 3)

        for reservation in response['Reservations']:
            instance = reservation['Instances'][0]
            # NAT instances should have source/dest check disabled
            self.assertFalse(instance['SourceDestCheck'])

            # Instance type should be t3.micro
            self.assertEqual(instance['InstanceType'], 't3.micro')

    def test_security_groups_exist(self):
        """Test that all security groups exist."""
        bastion_sg_id = self.outputs['bastion_sg_id']
        app_sg_id = self.outputs['app_sg_id']
        db_sg_id = self.outputs['db_sg_id']

        sg_ids = [bastion_sg_id, app_sg_id, db_sg_id]

        # Verify all security groups exist
        response = self.ec2_client.describe_security_groups(GroupIds=sg_ids)
        self.assertEqual(len(response['SecurityGroups']), 3)

        # Verify VPC assignment
        vpc_id = self.outputs['vpc_id']
        for sg in response['SecurityGroups']:
            self.assertEqual(sg['VpcId'], vpc_id)

    def test_bastion_security_group_rules(self):
        """Test bastion security group rules."""
        bastion_sg_id = self.outputs['bastion_sg_id']
        response = self.ec2_client.describe_security_groups(GroupIds=[bastion_sg_id])
        sg = response['SecurityGroups'][0]

        # Check ingress rules - should allow SSH
        ingress_rules = sg['IpPermissions']
        ssh_rule_found = False
        for rule in ingress_rules:
            if rule.get('FromPort') == 22 and rule.get('ToPort') == 22:
                ssh_rule_found = True
                self.assertEqual(rule['IpProtocol'], 'tcp')
        self.assertTrue(ssh_rule_found)

    def test_app_security_group_rules(self):
        """Test application security group rules."""
        app_sg_id = self.outputs['app_sg_id']
        response = self.ec2_client.describe_security_groups(GroupIds=[app_sg_id])
        sg = response['SecurityGroups'][0]

        # Check ingress rules - should allow HTTP and HTTPS
        ingress_rules = sg['IpPermissions']
        http_found = False
        https_found = False
        for rule in ingress_rules:
            if rule.get('FromPort') == 80 and rule.get('ToPort') == 80:
                http_found = True
            if rule.get('FromPort') == 443 and rule.get('ToPort') == 443:
                https_found = True
        self.assertTrue(http_found)
        self.assertTrue(https_found)

    def test_db_security_group_rules(self):
        """Test database security group rules."""
        db_sg_id = self.outputs['db_sg_id']
        response = self.ec2_client.describe_security_groups(GroupIds=[db_sg_id])
        sg = response['SecurityGroups'][0]

        # Check ingress rules - should allow MySQL and PostgreSQL
        ingress_rules = sg['IpPermissions']
        mysql_found = False
        postgres_found = False
        for rule in ingress_rules:
            if rule.get('FromPort') == 3306 and rule.get('ToPort') == 3306:
                mysql_found = True
            if rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432:
                postgres_found = True
        self.assertTrue(mysql_found)
        self.assertTrue(postgres_found)

    def test_route_tables_exist(self):
        """Test that all route tables exist."""
        public_rt_id = self.outputs['public_route_table_id']
        private_rt_ids = json.loads(self.outputs['private_route_table_ids'])
        db_rt_ids = json.loads(self.outputs['db_route_table_ids'])

        # Check counts
        self.assertEqual(len(private_rt_ids), 3)
        self.assertEqual(len(db_rt_ids), 3)

        # Verify all route tables exist
        all_rt_ids = [public_rt_id] + private_rt_ids + db_rt_ids
        response = self.ec2_client.describe_route_tables(RouteTableIds=all_rt_ids)
        self.assertEqual(len(response['RouteTables']), 7)

    def test_public_route_table_has_igw_route(self):
        """Test that public route table has route to IGW."""
        public_rt_id = self.outputs['public_route_table_id']
        response = self.ec2_client.describe_route_tables(RouteTableIds=[public_rt_id])
        rt = response['RouteTables'][0]

        # Find route to 0.0.0.0/0
        igw_route_found = False
        for route in rt['Routes']:
            if route['DestinationCidrBlock'] == '0.0.0.0/0':
                igw_route_found = True
                self.assertIn('GatewayId', route)
                self.assertTrue(route['GatewayId'].startswith('igw-'))
        self.assertTrue(igw_route_found)

    def test_private_route_tables_have_nat_routes(self):
        """Test that private route tables have routes to NAT instances."""
        private_rt_ids = json.loads(self.outputs['private_route_table_ids'])
        response = self.ec2_client.describe_route_tables(RouteTableIds=private_rt_ids)

        for rt in response['RouteTables']:
            # Find route to 0.0.0.0/0
            nat_route_found = False
            for route in rt['Routes']:
                if route['DestinationCidrBlock'] == '0.0.0.0/0':
                    nat_route_found = True
                    self.assertIn('NetworkInterfaceId', route)
            self.assertTrue(nat_route_found)

    def test_database_route_tables_no_internet_access(self):
        """Test that database route tables have no internet routes."""
        db_rt_ids = json.loads(self.outputs['db_route_table_ids'])
        response = self.ec2_client.describe_route_tables(RouteTableIds=db_rt_ids)

        for rt in response['RouteTables']:
            # Database route tables should NOT have route to 0.0.0.0/0
            for route in rt['Routes']:
                if route['DestinationCidrBlock'] == '0.0.0.0/0':
                    self.fail(f"Database route table {rt['RouteTableId']} has internet route")

    def test_vpc_flow_logs_enabled(self):
        """Test that VPC Flow Logs are enabled."""
        vpc_id = self.outputs['vpc_id']

        # Check if flow logs are enabled for the VPC
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )

        self.assertGreater(len(response['FlowLogs']), 0)
        flow_log = response['FlowLogs'][0]

        self.assertEqual(flow_log['TrafficType'], 'ALL')
        self.assertEqual(flow_log['LogDestinationType'], 's3')

    def test_availability_zones_distribution(self):
        """Test that resources are distributed across 3 AZs."""
        public_subnets = json.loads(self.outputs['public_subnet_ids'])
        response = self.ec2_client.describe_subnets(SubnetIds=public_subnets)

        azs = set()
        for subnet in response['Subnets']:
            azs.add(subnet['AvailabilityZone'])

        # Should have subnets in 3 different AZs
        self.assertEqual(len(azs), 3)

        # All should be in us-east-1 region
        for az in azs:
            self.assertTrue(az.startswith('us-east-1'))

    def test_resource_tagging(self):
        """Test that resources have proper tags."""
        vpc_id = self.outputs['vpc_id']
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        # Check for required tags
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        self.assertIn('Name', tags)
        self.assertIn('Environment', tags)
        self.assertIn('Project', tags)
        self.assertIn('ManagedBy', tags)
        self.assertEqual(tags['Project'], 'payment-processing')
        self.assertEqual(tags['ManagedBy'], 'pulumi')


if __name__ == '__main__':
    unittest.main()
