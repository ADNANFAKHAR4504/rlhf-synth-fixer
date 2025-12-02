"""
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
        """Set up integration test with outputs from deployed stack."""
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)

        # Load outputs from flat-outputs.json
        outputs_path = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )

        if os.path.exists(outputs_path):
            with open(outputs_path, 'r') as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}

    def test_vpc_exists_and_available(self):
        """Test that VPC exists and is in available state."""
        if 'vpc_id' not in self.outputs:
            self.skipTest('vpc_id not in outputs')

        vpc_id = self.outputs['vpc_id']
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

    def test_vpc_has_dns_enabled(self):
        """Test that VPC has DNS hostnames and support enabled."""
        if 'vpc_id' not in self.outputs:
            self.skipTest('vpc_id not in outputs')

        vpc_id = self.outputs['vpc_id']

        # Check DNS hostnames
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])

        # Check DNS support
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])

    def test_public_subnets_exist(self):
        """Test that public subnets exist and have proper configuration."""
        vpc_id = self.outputs.get('vpc_id')
        if not vpc_id:
            self.skipTest('vpc_id not in outputs')

        # Get public subnets by tag
        response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'tag:Type', 'Values': ['public']}
            ]
        )

        subnets = response['Subnets']
        self.assertEqual(len(subnets), 3, 'Should have 3 public subnets')

        for subnet in subnets:
            self.assertEqual(subnet['State'], 'available')
            self.assertTrue(subnet['MapPublicIpOnLaunch'])

    def test_private_subnets_exist(self):
        """Test that private subnets exist and have proper configuration."""
        vpc_id = self.outputs.get('vpc_id')
        if not vpc_id:
            self.skipTest('vpc_id not in outputs')

        # Get private subnets by tag
        response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'tag:Type', 'Values': ['private']}
            ]
        )

        subnets = response['Subnets']
        self.assertEqual(len(subnets), 3, 'Should have 3 private subnets')

        for subnet in subnets:
            self.assertEqual(subnet['State'], 'available')
            self.assertFalse(subnet['MapPublicIpOnLaunch'])

    def test_internet_gateway_attached(self):
        """Test that Internet Gateway is attached to VPC."""
        if 'internet_gateway_id' not in self.outputs:
            self.skipTest('internet_gateway_id not in outputs')

        igw_id = self.outputs['internet_gateway_id']
        vpc_id = self.outputs.get('vpc_id')

        response = self.ec2_client.describe_internet_gateways(
            InternetGatewayIds=[igw_id]
        )

        self.assertEqual(len(response['InternetGateways']), 1)
        igw = response['InternetGateways'][0]

        # Check attachment
        attachments = igw.get('Attachments', [])
        self.assertTrue(len(attachments) > 0, 'IGW should be attached')
        self.assertEqual(attachments[0]['VpcId'], vpc_id)
        self.assertEqual(attachments[0]['State'], 'available')

    def test_nat_gateway_available(self):
        """Test that NAT Gateway exists and is available."""
        if 'nat_gateway_id' not in self.outputs:
            self.skipTest('nat_gateway_id not in outputs')

        nat_id = self.outputs['nat_gateway_id']

        response = self.ec2_client.describe_nat_gateways(
            NatGatewayIds=[nat_id]
        )

        self.assertEqual(len(response['NatGateways']), 1)
        nat = response['NatGateways'][0]
        self.assertEqual(nat['State'], 'available')

    def test_web_security_group_exists(self):
        """Test that web security group exists with correct rules."""
        if 'web_security_group_id' not in self.outputs:
            self.skipTest('web_security_group_id not in outputs')

        sg_id = self.outputs['web_security_group_id']

        response = self.ec2_client.describe_security_groups(
            GroupIds=[sg_id]
        )

        self.assertEqual(len(response['SecurityGroups']), 1)
        sg = response['SecurityGroups'][0]

        # Verify HTTPS ingress rule
        https_rule_found = False
        for rule in sg['IpPermissions']:
            if rule.get('FromPort') == 443 and rule.get('ToPort') == 443:
                https_rule_found = True
                break

        self.assertTrue(https_rule_found, 'Web SG should allow HTTPS (port 443)')

    def test_database_security_group_exists(self):
        """Test that database security group exists."""
        if 'database_security_group_id' not in self.outputs:
            self.skipTest('database_security_group_id not in outputs')

        sg_id = self.outputs['database_security_group_id']

        response = self.ec2_client.describe_security_groups(
            GroupIds=[sg_id]
        )

        self.assertEqual(len(response['SecurityGroups']), 1)
        sg = response['SecurityGroups'][0]

        # Verify PostgreSQL ingress rule
        postgres_rule_found = False
        for rule in sg['IpPermissions']:
            if rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432:
                postgres_rule_found = True
                break

        self.assertTrue(postgres_rule_found, 'DB SG should allow PostgreSQL (port 5432)')

    def test_flow_logs_bucket_exists(self):
        """Test that VPC Flow Logs S3 bucket exists."""
        if 'flow_logs_bucket' not in self.outputs:
            self.skipTest('flow_logs_bucket not in outputs')

        bucket_name = self.outputs['flow_logs_bucket']

        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            self.fail(f'Flow logs bucket {bucket_name} does not exist: {e}')

    def test_flow_logs_bucket_has_lifecycle(self):
        """Test that Flow Logs bucket has lifecycle configuration."""
        if 'flow_logs_bucket' not in self.outputs:
            self.skipTest('flow_logs_bucket not in outputs')

        bucket_name = self.outputs['flow_logs_bucket']

        try:
            response = self.s3_client.get_bucket_lifecycle_configuration(
                Bucket=bucket_name
            )
            rules = response.get('Rules', [])
            self.assertTrue(len(rules) > 0, 'Bucket should have lifecycle rules')

            # Check for 7-day expiration rule
            expiration_found = False
            for rule in rules:
                if rule.get('Status') == 'Enabled':
                    expiration = rule.get('Expiration', {})
                    if expiration.get('Days') == 7:
                        expiration_found = True
                        break

            self.assertTrue(expiration_found, 'Should have 7-day expiration rule')
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchLifecycleConfiguration':
                self.fail('Flow logs bucket has no lifecycle configuration')
            raise

    def test_vpc_flow_log_exists(self):
        """Test that VPC Flow Log is enabled."""
        vpc_id = self.outputs.get('vpc_id')
        if not vpc_id:
            self.skipTest('vpc_id not in outputs')

        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )

        flow_logs = response['FlowLogs']
        self.assertTrue(len(flow_logs) > 0, 'VPC should have flow logs enabled')

        # Check flow log is active
        active_log = next(
            (fl for fl in flow_logs if fl['FlowLogStatus'] == 'ACTIVE'),
            None
        )
        self.assertIsNotNone(active_log, 'Should have an active flow log')

    def test_resources_have_proper_tags(self):
        """Test that resources have proper tags."""
        vpc_id = self.outputs.get('vpc_id')
        if not vpc_id:
            self.skipTest('vpc_id not in outputs')

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

        self.assertIn('Environment', tags, 'VPC should have Environment tag')
        self.assertIn('ManagedBy', tags, 'VPC should have ManagedBy tag')
        self.assertEqual(tags.get('ManagedBy'), 'pulumi')


if __name__ == '__main__':
    unittest.main()
