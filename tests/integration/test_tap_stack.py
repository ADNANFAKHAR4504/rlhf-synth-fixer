"""Integration tests for TapStack using real AWS outputs."""
import json
import os
import unittest

import boto3
from pytest import mark

# Load the deployment outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed TapStack."""

    def setUp(self):
        """Set up AWS clients for testing."""
        self.ec2_client = boto3.client('ec2', region_name='us-east-1')
        self.s3_client = boto3.client('s3', region_name='us-east-1')

    @mark.it("verifies VPC exists and is configured correctly")
    def test_vpc_exists_and_configured(self):
        """Test that the VPC exists and has the correct configuration."""
        # ARRANGE
        vpc_id = flat_outputs.get('VPCId')
        self.assertIsNotNone(vpc_id, "VPCId not found in outputs")

        # ACT
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        # ASSERT
        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['VpcId'], vpc_id)
        
        # Check VPC attributes
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])
        
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])
        
        # Check for Environment tag
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        self.assertEqual(tags.get('Environment'), 'Development')

    @mark.it("verifies EC2 instance exists and is running")
    def test_ec2_instance_exists_and_running(self):
        """Test that the EC2 instance exists and is in running state."""
        # ARRANGE
        instance_id = flat_outputs.get('EC2InstanceId')
        self.assertIsNotNone(instance_id, "EC2InstanceId not found in outputs")

        # ACT
        response = self.ec2_client.describe_instances(InstanceIds=[instance_id])

        # ASSERT
        self.assertEqual(len(response['Reservations']), 1)
        self.assertEqual(len(response['Reservations'][0]['Instances']), 1)
        
        instance = response['Reservations'][0]['Instances'][0]
        self.assertEqual(instance['InstanceId'], instance_id)
        self.assertEqual(instance['InstanceType'], 't2.micro')
        self.assertIn(instance['State']['Name'], ['running', 'pending'])
        
        # Check for Environment tag
        tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
        self.assertEqual(tags.get('Environment'), 'Development')

    @mark.it("verifies EC2 instance has public IP")
    def test_ec2_instance_has_public_ip(self):
        """Test that the EC2 instance has a public IP address."""
        # ARRANGE
        public_ip = flat_outputs.get('EC2InstancePublicIp')
        instance_id = flat_outputs.get('EC2InstanceId')
        
        # ASSERT
        self.assertIsNotNone(public_ip, "EC2InstancePublicIp not found in outputs")
        self.assertRegex(public_ip, r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$')
        
        # Verify the IP matches the actual instance
        response = self.ec2_client.describe_instances(InstanceIds=[instance_id])
        instance = response['Reservations'][0]['Instances'][0]
        self.assertEqual(instance.get('PublicIpAddress'), public_ip)

    @mark.it("verifies S3 bucket exists with versioning enabled")
    def test_s3_bucket_exists_with_versioning(self):
        """Test that the S3 bucket exists and has versioning enabled."""
        # ARRANGE
        bucket_name = flat_outputs.get('S3BucketName')
        self.assertIsNotNone(bucket_name, "S3BucketName not found in outputs")

        # ACT & ASSERT
        # Check bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        
        # Check versioning is enabled
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')
        
        # Check encryption is enabled
        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption['ServerSideEncryptionConfiguration']['Rules']
        self.assertTrue(len(rules) > 0)
        self.assertEqual(
            rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 
            'AES256'
        )

    @mark.it("verifies S3 bucket has correct tags")
    def test_s3_bucket_has_tags(self):
        """Test that the S3 bucket has the correct tags."""
        # ARRANGE
        bucket_name = flat_outputs.get('S3BucketName')
        self.assertIsNotNone(bucket_name, "S3BucketName not found in outputs")

        # ACT
        response = self.s3_client.get_bucket_tagging(Bucket=bucket_name)

        # ASSERT
        tags = {tag['Key']: tag['Value'] for tag in response.get('TagSet', [])}
        self.assertEqual(tags.get('Environment'), 'Development')

    @mark.it("verifies security group exists with SSH access")
    def test_security_group_exists_with_ssh(self):
        """Test that the security group exists and allows SSH access."""
        # ARRANGE
        sg_id = flat_outputs.get('SecurityGroupId')
        self.assertIsNotNone(sg_id, "SecurityGroupId not found in outputs")

        # ACT
        response = self.ec2_client.describe_security_groups(GroupIds=[sg_id])

        # ASSERT
        self.assertEqual(len(response['SecurityGroups']), 1)
        sg = response['SecurityGroups'][0]
        self.assertEqual(sg['GroupId'], sg_id)
        
        # Check for SSH ingress rule
        ssh_rules = [
            rule for rule in sg['IpPermissions']
            if rule.get('FromPort') == 22 and rule.get('ToPort') == 22
        ]
        self.assertTrue(len(ssh_rules) > 0, "No SSH ingress rule found")
        
        # Verify SSH is allowed from anywhere (0.0.0.0/0)
        ssh_rule = ssh_rules[0]
        cidr_blocks = [ip_range['CidrIp'] for ip_range in ssh_rule.get('IpRanges', [])]
        self.assertIn('0.0.0.0/0', cidr_blocks)

    @mark.it("verifies EC2 instance is in correct VPC and subnet")
    def test_ec2_instance_in_correct_vpc(self):
        """Test that the EC2 instance is in the correct VPC."""
        # ARRANGE
        instance_id = flat_outputs.get('EC2InstanceId')
        vpc_id = flat_outputs.get('VPCId')
        
        # ACT
        response = self.ec2_client.describe_instances(InstanceIds=[instance_id])
        instance = response['Reservations'][0]['Instances'][0]
        
        # ASSERT
        self.assertEqual(instance['VpcId'], vpc_id)
        
        # Verify the subnet is public (has route to IGW)
        subnet_id = instance['SubnetId']
        subnet_response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
        subnet = subnet_response['Subnets'][0]
        self.assertTrue(subnet['MapPublicIpOnLaunch'])

    @mark.it("verifies EC2 instance uses correct security group")
    def test_ec2_instance_uses_correct_security_group(self):
        """Test that the EC2 instance uses the deployed security group."""
        # ARRANGE
        instance_id = flat_outputs.get('EC2InstanceId')
        sg_id = flat_outputs.get('SecurityGroupId')
        
        # ACT
        response = self.ec2_client.describe_instances(InstanceIds=[instance_id])
        instance = response['Reservations'][0]['Instances'][0]
        
        # ASSERT
        instance_sg_ids = [sg['GroupId'] for sg in instance['SecurityGroups']]
        self.assertIn(sg_id, instance_sg_ids)

    @mark.it("verifies all deployed resources are accessible")
    def test_all_resources_accessible(self):
        """Test that all resources from outputs are accessible."""
        # ASSERT all expected outputs exist
        expected_outputs = [
            'VPCId', 
            'EC2InstanceId', 
            'EC2InstancePublicIp',
            'S3BucketName', 
            'SecurityGroupId'
        ]
        
        for output in expected_outputs:
            self.assertIn(output, flat_outputs, f"Missing output: {output}")
            self.assertIsNotNone(flat_outputs[output], f"Output {output} is None")

    @mark.it("verifies VPC has expected number of subnets")
    def test_vpc_has_correct_subnets(self):
        """Test that the VPC has the expected public subnets."""
        # ARRANGE
        vpc_id = flat_outputs.get('VPCId')
        
        # ACT
        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        
        # ASSERT
        subnets = response['Subnets']
        # Should have 2 public subnets (as per max_azs=2)
        self.assertEqual(len(subnets), 2)
        
        # All should be public subnets
        for subnet in subnets:
            self.assertTrue(subnet['MapPublicIpOnLaunch'])
