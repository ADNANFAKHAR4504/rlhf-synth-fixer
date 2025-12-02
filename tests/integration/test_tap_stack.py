"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack for Multi-VPC Peering.
"""

import unittest
import os
import boto3
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack."""
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)


class TestVPCIntegration(TestTapStackLiveIntegration):
    """Test VPC resources are properly deployed."""

    def test_dev_vpc_exists(self):
        """Test dev VPC is created with correct CIDR."""
        response = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-vpc-{self.environment_suffix}']}
            ]
        )
        vpcs = response.get('Vpcs', [])
        self.assertEqual(len(vpcs), 1, "Dev VPC should exist")
        self.assertEqual(vpcs[0]['CidrBlock'], '10.1.0.0/16')

    def test_prod_vpc_exists(self):
        """Test prod VPC is created with correct CIDR."""
        response = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'prod-vpc-{self.environment_suffix}']}
            ]
        )
        vpcs = response.get('Vpcs', [])
        self.assertEqual(len(vpcs), 1, "Prod VPC should exist")
        self.assertEqual(vpcs[0]['CidrBlock'], '10.2.0.0/16')

    def test_dev_vpc_dns_enabled(self):
        """Test dev VPC has DNS hostnames and support enabled."""
        response = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-vpc-{self.environment_suffix}']}
            ]
        )
        vpcs = response.get('Vpcs', [])
        self.assertEqual(len(vpcs), 1)
        vpc_id = vpcs[0]['VpcId']

        # Check DNS attributes
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])

    def test_prod_vpc_dns_enabled(self):
        """Test prod VPC has DNS hostnames and support enabled."""
        response = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'prod-vpc-{self.environment_suffix}']}
            ]
        )
        vpcs = response.get('Vpcs', [])
        self.assertEqual(len(vpcs), 1)
        vpc_id = vpcs[0]['VpcId']

        # Check DNS attributes
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])


class TestSubnetIntegration(TestTapStackLiveIntegration):
    """Test subnet resources are properly deployed."""

    def test_dev_public_subnets_exist(self):
        """Test dev VPC has 3 public subnets across AZs."""
        response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-public-subnet-*-{self.environment_suffix}']},
                {'Name': 'tag:Type', 'Values': ['Public']}
            ]
        )
        subnets = response.get('Subnets', [])
        self.assertEqual(len(subnets), 3, "Dev VPC should have 3 public subnets")

    def test_dev_private_subnets_exist(self):
        """Test dev VPC has 3 private subnets across AZs."""
        response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-private-subnet-*-{self.environment_suffix}']},
                {'Name': 'tag:Type', 'Values': ['Private']}
            ]
        )
        subnets = response.get('Subnets', [])
        self.assertEqual(len(subnets), 3, "Dev VPC should have 3 private subnets")

    def test_prod_public_subnets_exist(self):
        """Test prod VPC has 3 public subnets across AZs."""
        response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'prod-public-subnet-*-{self.environment_suffix}']},
                {'Name': 'tag:Type', 'Values': ['Public']}
            ]
        )
        subnets = response.get('Subnets', [])
        self.assertEqual(len(subnets), 3, "Prod VPC should have 3 public subnets")

    def test_prod_private_subnets_exist(self):
        """Test prod VPC has 3 private subnets across AZs."""
        response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'prod-private-subnet-*-{self.environment_suffix}']},
                {'Name': 'tag:Type', 'Values': ['Private']}
            ]
        )
        subnets = response.get('Subnets', [])
        self.assertEqual(len(subnets), 3, "Prod VPC should have 3 private subnets")

    def test_subnets_span_availability_zones(self):
        """Test subnets are distributed across 3 availability zones."""
        response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-private-subnet-*-{self.environment_suffix}']}
            ]
        )
        subnets = response.get('Subnets', [])
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        self.assertEqual(len(azs), 3, "Subnets should span 3 availability zones")


class TestVPCPeeringIntegration(TestTapStackLiveIntegration):
    """Test VPC Peering connection is properly deployed."""

    def test_vpc_peering_connection_exists(self):
        """Test VPC Peering connection exists and is active."""
        response = self.ec2_client.describe_vpc_peering_connections(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-to-prod-peering-{self.environment_suffix}']},
                {'Name': 'status-code', 'Values': ['active']}
            ]
        )
        connections = response.get('VpcPeeringConnections', [])
        self.assertEqual(len(connections), 1, "VPC Peering connection should exist and be active")

    def test_vpc_peering_connects_correct_vpcs(self):
        """Test VPC Peering connects dev and prod VPCs."""
        # Get VPC IDs
        dev_vpc_response = self.ec2_client.describe_vpcs(
            Filters=[{'Name': 'tag:Name', 'Values': [f'dev-vpc-{self.environment_suffix}']}]
        )
        prod_vpc_response = self.ec2_client.describe_vpcs(
            Filters=[{'Name': 'tag:Name', 'Values': [f'prod-vpc-{self.environment_suffix}']}]
        )

        dev_vpc_id = dev_vpc_response['Vpcs'][0]['VpcId']
        prod_vpc_id = prod_vpc_response['Vpcs'][0]['VpcId']

        # Get peering connection
        response = self.ec2_client.describe_vpc_peering_connections(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-to-prod-peering-{self.environment_suffix}']}
            ]
        )
        connection = response['VpcPeeringConnections'][0]

        # Verify VPCs are connected
        requester_vpc = connection['RequesterVpcInfo']['VpcId']
        accepter_vpc = connection['AccepterVpcInfo']['VpcId']

        self.assertIn(dev_vpc_id, [requester_vpc, accepter_vpc])
        self.assertIn(prod_vpc_id, [requester_vpc, accepter_vpc])


class TestNATInstanceIntegration(TestTapStackLiveIntegration):
    """Test NAT instance resources are properly deployed."""

    def test_dev_nat_instance_exists(self):
        """Test dev NAT instance exists and is running."""
        response = self.ec2_client.describe_instances(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-nat-instance-{self.environment_suffix}']},
                {'Name': 'instance-state-name', 'Values': ['running']}
            ]
        )
        instances = []
        for reservation in response.get('Reservations', []):
            instances.extend(reservation.get('Instances', []))
        self.assertEqual(len(instances), 1, "Dev NAT instance should exist and be running")

    def test_prod_nat_instance_exists(self):
        """Test prod NAT instance exists and is running."""
        response = self.ec2_client.describe_instances(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'prod-nat-instance-{self.environment_suffix}']},
                {'Name': 'instance-state-name', 'Values': ['running']}
            ]
        )
        instances = []
        for reservation in response.get('Reservations', []):
            instances.extend(reservation.get('Instances', []))
        self.assertEqual(len(instances), 1, "Prod NAT instance should exist and be running")

    def test_nat_instance_type_is_t3_micro(self):
        """Test NAT instances use t3.micro instance type."""
        response = self.ec2_client.describe_instances(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-nat-instance-{self.environment_suffix}']}
            ]
        )
        instances = []
        for reservation in response.get('Reservations', []):
            instances.extend(reservation.get('Instances', []))
        self.assertEqual(len(instances), 1)
        self.assertEqual(instances[0]['InstanceType'], 't3.micro')

    def test_nat_instance_source_dest_check_disabled(self):
        """Test NAT instance has source/destination check disabled."""
        response = self.ec2_client.describe_instances(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-nat-instance-{self.environment_suffix}']}
            ]
        )
        instances = []
        for reservation in response.get('Reservations', []):
            instances.extend(reservation.get('Instances', []))
        self.assertEqual(len(instances), 1)
        self.assertFalse(instances[0].get('SourceDestCheck', True))


class TestSecurityGroupIntegration(TestTapStackLiveIntegration):
    """Test security group resources are properly deployed."""

    def test_dev_security_group_exists(self):
        """Test dev security group exists."""
        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-sg-{self.environment_suffix}']}
            ]
        )
        sgs = response.get('SecurityGroups', [])
        self.assertEqual(len(sgs), 1, "Dev security group should exist")

    def test_prod_security_group_exists(self):
        """Test prod security group exists."""
        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'prod-sg-{self.environment_suffix}']}
            ]
        )
        sgs = response.get('SecurityGroups', [])
        self.assertEqual(len(sgs), 1, "Prod security group should exist")

    def test_dev_security_group_allows_https(self):
        """Test dev security group allows HTTPS from 192.168.1.0/24."""
        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-sg-{self.environment_suffix}']}
            ]
        )
        sg = response['SecurityGroups'][0]

        https_rule_found = False
        for rule in sg.get('IpPermissions', []):
            if rule.get('FromPort') == 443 and rule.get('ToPort') == 443:
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '192.168.1.0/24':
                        https_rule_found = True
                        break
        self.assertTrue(https_rule_found, "HTTPS rule should allow 192.168.1.0/24")

    def test_dev_security_group_allows_ssh(self):
        """Test dev security group allows SSH from 192.168.1.0/24."""
        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-sg-{self.environment_suffix}']}
            ]
        )
        sg = response['SecurityGroups'][0]

        ssh_rule_found = False
        for rule in sg.get('IpPermissions', []):
            if rule.get('FromPort') == 22 and rule.get('ToPort') == 22:
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '192.168.1.0/24':
                        ssh_rule_found = True
                        break
        self.assertTrue(ssh_rule_found, "SSH rule should allow 192.168.1.0/24")

    def test_prod_security_group_allows_postgresql(self):
        """Test prod security group allows PostgreSQL from dev VPC CIDR."""
        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'prod-sg-{self.environment_suffix}']}
            ]
        )
        sg = response['SecurityGroups'][0]

        postgres_rule_found = False
        for rule in sg.get('IpPermissions', []):
            if rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432:
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '10.1.0.0/16':
                        postgres_rule_found = True
                        break
        self.assertTrue(postgres_rule_found, "PostgreSQL rule should allow dev VPC CIDR")


class TestFlowLogsIntegration(TestTapStackLiveIntegration):
    """Test VPC Flow Logs are properly deployed."""

    def test_dev_flow_log_group_exists(self):
        """Test dev VPC flow log CloudWatch log group exists."""
        log_group_name = f'/aws/vpc/dev-{self.environment_suffix}'
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            log_groups = [lg for lg in response.get('logGroups', [])
                         if lg['logGroupName'] == log_group_name]
            self.assertEqual(len(log_groups), 1, "Dev flow log group should exist")
        except ClientError as e:
            self.fail(f"Failed to describe log groups: {e}")

    def test_prod_flow_log_group_exists(self):
        """Test prod VPC flow log CloudWatch log group exists."""
        log_group_name = f'/aws/vpc/prod-{self.environment_suffix}'
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            log_groups = [lg for lg in response.get('logGroups', [])
                         if lg['logGroupName'] == log_group_name]
            self.assertEqual(len(log_groups), 1, "Prod flow log group should exist")
        except ClientError as e:
            self.fail(f"Failed to describe log groups: {e}")

    def test_flow_log_retention_is_7_days(self):
        """Test flow log retention is set to 7 days."""
        log_group_name = f'/aws/vpc/dev-{self.environment_suffix}'
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            log_groups = [lg for lg in response.get('logGroups', [])
                         if lg['logGroupName'] == log_group_name]
            self.assertEqual(len(log_groups), 1)
            self.assertEqual(log_groups[0].get('retentionInDays'), 7)
        except ClientError as e:
            self.fail(f"Failed to describe log groups: {e}")

    def test_dev_vpc_has_flow_log(self):
        """Test dev VPC has flow log enabled."""
        # Get dev VPC ID
        vpc_response = self.ec2_client.describe_vpcs(
            Filters=[{'Name': 'tag:Name', 'Values': [f'dev-vpc-{self.environment_suffix}']}]
        )
        vpcs = vpc_response.get('Vpcs', [])
        self.assertEqual(len(vpcs), 1)
        vpc_id = vpcs[0]['VpcId']

        # Check flow logs
        flow_log_response = self.ec2_client.describe_flow_logs(
            Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}]
        )
        flow_logs = flow_log_response.get('FlowLogs', [])
        self.assertGreaterEqual(len(flow_logs), 1, "Dev VPC should have flow logs enabled")

    def test_prod_vpc_has_flow_log(self):
        """Test prod VPC has flow log enabled."""
        # Get prod VPC ID
        vpc_response = self.ec2_client.describe_vpcs(
            Filters=[{'Name': 'tag:Name', 'Values': [f'prod-vpc-{self.environment_suffix}']}]
        )
        vpcs = vpc_response.get('Vpcs', [])
        self.assertEqual(len(vpcs), 1)
        vpc_id = vpcs[0]['VpcId']

        # Check flow logs
        flow_log_response = self.ec2_client.describe_flow_logs(
            Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}]
        )
        flow_logs = flow_log_response.get('FlowLogs', [])
        self.assertGreaterEqual(len(flow_logs), 1, "Prod VPC should have flow logs enabled")


class TestRoutingIntegration(TestTapStackLiveIntegration):
    """Test routing configuration is properly deployed."""

    def test_dev_private_route_table_has_peering_route(self):
        """Test dev private route table has route to prod VPC via peering."""
        # Get dev private route table
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-private-rt-{self.environment_suffix}']}
            ]
        )
        route_tables = response.get('RouteTables', [])
        self.assertEqual(len(route_tables), 1)

        routes = route_tables[0].get('Routes', [])
        peering_route_found = False
        for route in routes:
            if route.get('DestinationCidrBlock') == '10.2.0.0/16':
                if route.get('VpcPeeringConnectionId'):
                    peering_route_found = True
                    break
        self.assertTrue(peering_route_found, "Dev private RT should have route to prod via peering")

    def test_prod_private_route_table_has_peering_route(self):
        """Test prod private route table has route to dev VPC via peering."""
        # Get prod private route table
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'prod-private-rt-{self.environment_suffix}']}
            ]
        )
        route_tables = response.get('RouteTables', [])
        self.assertEqual(len(route_tables), 1)

        routes = route_tables[0].get('Routes', [])
        peering_route_found = False
        for route in routes:
            if route.get('DestinationCidrBlock') == '10.1.0.0/16':
                if route.get('VpcPeeringConnectionId'):
                    peering_route_found = True
                    break
        self.assertTrue(peering_route_found, "Prod private RT should have route to dev via peering")


class TestTaggingIntegration(TestTapStackLiveIntegration):
    """Test resource tagging is properly applied."""

    def test_dev_vpc_has_project_tag(self):
        """Test dev VPC has Project tag."""
        response = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-vpc-{self.environment_suffix}']}
            ]
        )
        vpcs = response.get('Vpcs', [])
        self.assertEqual(len(vpcs), 1)

        tags = {tag['Key']: tag['Value'] for tag in vpcs[0].get('Tags', [])}
        self.assertEqual(tags.get('Project'), 'payment-platform')

    def test_dev_vpc_has_environment_tag(self):
        """Test dev VPC has Environment tag."""
        response = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'dev-vpc-{self.environment_suffix}']}
            ]
        )
        vpcs = response.get('Vpcs', [])
        self.assertEqual(len(vpcs), 1)

        tags = {tag['Key']: tag['Value'] for tag in vpcs[0].get('Tags', [])}
        self.assertEqual(tags.get('Environment'), 'dev')

    def test_prod_vpc_has_environment_tag(self):
        """Test prod VPC has Environment tag."""
        response = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'prod-vpc-{self.environment_suffix}']}
            ]
        )
        vpcs = response.get('Vpcs', [])
        self.assertEqual(len(vpcs), 1)

        tags = {tag['Key']: tag['Value'] for tag in vpcs[0].get('Tags', [])}
        self.assertEqual(tags.get('Environment'), 'prod')


if __name__ == '__main__':
    unittest.main()
