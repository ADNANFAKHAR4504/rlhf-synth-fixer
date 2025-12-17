"""Integration test cases for the TapStack CDK stack."""

import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError, BotoCoreError
from pytest import mark

# Load CDK outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

flat_outputs = {}
if os.path.exists(outputs_path):
    try:
        with open(outputs_path, 'r', encoding='utf-8') as f:
            flat_outputs = json.load(f)
    except json.JSONDecodeError:
        print(f"Warning: Failed to parse JSON from {outputs_path}")
else:
    print(f"Warning: CDK outputs file not found at {outputs_path}")

# Get IDs from flat outputs or environment variables (for CI/CD)
VPC_ID = flat_outputs.get("VpcId") or os.environ.get("VPC_ID")
SECURITY_GROUP_ID = flat_outputs.get("SecurityGroupId") or os.environ.get("SECURITY_GROUP_ID")

# Configure boto3 client for LocalStack
def create_ec2_client():
    """Create EC2 client configured for LocalStack or AWS."""
    # Check if we're running against LocalStack
    endpoint_url = os.environ.get("AWS_ENDPOINT_URL")
    
    if endpoint_url:
        # LocalStack configuration
        return boto3.client(
            "ec2",
            endpoint_url=endpoint_url,
            region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test")
        )
    else:
        # Standard AWS configuration
        return boto3.client("ec2", region_name="us-east-1")

ec2_client = create_ec2_client()


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for VPC and Security Group components in TapStack."""

    def setUp(self):
        """Ensure required outputs are available before running tests."""
        if not VPC_ID:
            self.fail("Missing VpcId in flat-outputs.json or VPC_ID environment variable")
        if not SECURITY_GROUP_ID:
            self.fail("Missing SecurityGroupId in flat-outputs.json or SECURITY_GROUP_ID environment variable")

    @mark.it("confirms VPC is accessible")
    def test_vpc_access(self):
        """Test that the VPC exists and is accessible."""
        try:
            response = ec2_client.describe_vpcs(VpcIds=[VPC_ID])
            vpc = response['Vpcs'][0]
            self.assertEqual(vpc['VpcId'], VPC_ID)
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
            # DNS settings might not be present in all AWS regions
            if 'EnableDnsHostnames' in vpc:
                self.assertTrue(vpc['EnableDnsHostnames'])
            if 'EnableDnsSupport' in vpc:
                self.assertTrue(vpc['EnableDnsSupport'])
        except (ClientError, BotoCoreError) as ex:
            self.fail(f"VPC test failed: {ex}")

    @mark.it("confirms security group has correct inbound rules")
    def test_security_group_inbound_rules(self):
        """Test that security group has the correct HTTP inbound rule."""
        try:
            response = ec2_client.describe_security_groups(GroupIds=[SECURITY_GROUP_ID])
            security_group = response['SecurityGroups'][0]
            
            # Check that we have exactly one inbound rule
            self.assertEqual(len(security_group['IpPermissions']), 1)
            
            # Check the HTTP inbound rule
            http_rule = security_group['IpPermissions'][0]
            self.assertEqual(http_rule['IpProtocol'], 'tcp')
            self.assertEqual(http_rule['FromPort'], 80)
            self.assertEqual(http_rule['ToPort'], 80)
            
            # Check the CIDR block
            ip_ranges = http_rule['IpRanges']
            self.assertEqual(len(ip_ranges), 1)
            self.assertEqual(ip_ranges[0]['CidrIp'], '203.0.113.0/24')
            
        except (ClientError, BotoCoreError) as ex:
            self.fail(f"Security group inbound rules test failed: {ex}")

    @mark.it("confirms security group blocks outbound traffic")
    def test_security_group_outbound_rules(self):
        """Test that security group blocks all outbound traffic."""
        try:
            response = ec2_client.describe_security_groups(GroupIds=[SECURITY_GROUP_ID])
            security_group = response['SecurityGroups'][0]
            
            # With allow_all_outbound=False, CDK creates a restrictive ICMP rule
            # that effectively blocks all outbound traffic
            self.assertEqual(len(security_group['IpPermissionsEgress']), 1)
            
            # Check the outbound rule (should be a restrictive ICMP rule)
            outbound_rule = security_group['IpPermissionsEgress'][0]
            self.assertEqual(outbound_rule['IpProtocol'], 'icmp')
            
            # The ICMP rule should have restrictive port ranges
            self.assertIsNotNone(outbound_rule['FromPort'])
            self.assertIsNotNone(outbound_rule['ToPort'])
            
            # Check the CIDR block is 255.255.255.255/32 (restrictive)
            ip_ranges = outbound_rule['IpRanges']
            self.assertEqual(len(ip_ranges), 1)
            self.assertEqual(ip_ranges[0]['CidrIp'], '255.255.255.255/32')
            
        except (ClientError, BotoCoreError) as ex:
            self.fail(f"Security group outbound rules test failed: {ex}")

    @mark.it("confirms security group has correct tags")
    def test_security_group_tags(self):
        """Test that security group has the correct tags."""
        try:
            response = ec2_client.describe_security_groups(GroupIds=[SECURITY_GROUP_ID])
            security_group = response['SecurityGroups'][0]
            
            # Check that we have the expected tags
            tags = {tag['Key']: tag['Value'] for tag in security_group['Tags']}
            
            # Check for required tags
            self.assertIn('Name', tags)
            self.assertIn('Project', tags)
            
            # Check tag values
            self.assertTrue(tags['Name'].startswith('tap-'))
            self.assertTrue('WebOnlyIngressSG' in tags['Name'])
            self.assertEqual(tags['Project'], 'tap')
            
        except (ClientError, BotoCoreError) as ex:
            self.fail(f"Security group tags test failed: {ex}")

    @mark.it("confirms security group is in the correct VPC")
    def test_security_group_vpc_association(self):
        """Test that security group is associated with the correct VPC."""
        try:
            response = ec2_client.describe_security_groups(GroupIds=[SECURITY_GROUP_ID])
            security_group = response['SecurityGroups'][0]
            
            # Check that the security group is in the correct VPC
            self.assertEqual(security_group['VpcId'], VPC_ID)
            
        except (ClientError, BotoCoreError) as ex:
            self.fail(f"Security group VPC association test failed: {ex}")
