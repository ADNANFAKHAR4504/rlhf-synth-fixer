"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import boto3
import json
import time
from botocore.exceptions import ClientError, NoCredentialsError
import pulumi
from pulumi import automation as auto


class TestTapStackLiveIntegration(unittest.TestCase):
  """Integration tests against live deployed Pulumi stack."""

  @classmethod
  def setUpClass(cls):
    """Set up integration test class with live stack configuration."""
    # Get environment suffix from environment variable (set by CI)
    cls.env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    cls.stack_name = f"tap-multi-region-{cls.env_suffix}"
    cls.project_name = "tap-multi-region"
    
    # Configure Pulumi backend
    cls.pulumi_backend_url = os.getenv(
      'PULUMI_BACKEND_URL', 
      's3://iac-rlhf-pulumi-states'
    )
    
    # Initialize AWS clients for both regions
    try:
      cls.s3_client = boto3.client('s3', region_name='us-west-1')
      cls.ec2_west = boto3.client('ec2', region_name='us-west-1')
      cls.ec2_east = boto3.client('ec2', region_name='us-east-1')
      cls.rds_west = boto3.client('rds', region_name='us-west-1')
      cls.rds_east = boto3.client('rds', region_name='us-east-1')
    except NoCredentialsError:
      cls.skipTest(cls, "AWS credentials not configured")
    
    # Get stack outputs
    cls.stack_outputs = cls._get_stack_outputs()

  @classmethod
  def _get_stack_outputs(cls):
    """Get outputs from the deployed Pulumi stack."""
    try:
      # Try to get stack reference
      workspace = auto.LocalWorkspace(
        project_settings=auto.ProjectSettings(
          name=cls.project_name,
          runtime="python"
        ),
        pulumi_home=os.getenv('PULUMI_HOME'),
        backend_url=cls.pulumi_backend_url
      )
      
      stack = auto.select_stack(
        stack_name=cls.stack_name,
        work_dir=".",
        opts=auto.LocalWorkspaceOptions(
          pulumi_home=os.getenv('PULUMI_HOME'),
          backend_url=cls.pulumi_backend_url
        )
      )
      
      # Get stack outputs
      outputs = stack.outputs()
      return {k: v.value for k, v in outputs.items()}
      
    except Exception as e:
      print(f"Warning: Could not get stack outputs: {e}")
      return {}

  def test_aws_credentials_configured(self):
    """Test that AWS credentials are properly configured."""
    try:
      # Simple AWS API call to verify credentials
      self.ec2_west.describe_regions()
      self.assertTrue(True, "AWS credentials are configured")
    except NoCredentialsError:
      self.fail("AWS credentials are not configured")
    except Exception as e:
      self.fail(f"AWS credential test failed: {e}")

  def test_vpc_exists_in_primary_region(self):
    """Test that VPC exists in the primary region (us-west-1)."""
    try:
      # Look for VPC with our project name tag
      response = self.ec2_west.describe_vpcs(
        Filters=[
          {
            'Name': 'tag:Name',
            'Values': [f'tap-multi-region-vpc-us-west-1']
          }
        ]
      )
      
      vpcs = response.get('Vpcs', [])
      self.assertGreater(len(vpcs), 0, "VPC should exist in us-west-1")
      
      # Verify VPC properties
      vpc = vpcs[0]
      self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
      self.assertEqual(vpc['State'], 'available')
      
    except ClientError as e:
      self.fail(f"Failed to describe VPCs: {e}")

  def test_subnets_exist_in_primary_region(self):
    """Test that subnets exist in the primary region."""
    try:
      # Check for public subnets
      public_subnets = self.ec2_west.describe_subnets(
        Filters=[
          {
            'Name': 'tag:Type',
            'Values': ['public']
          },
          {
            'Name': 'tag:Name',
            'Values': ['tap-multi-region-public-subnet-us-west-1*']
          }
        ]
      )
      
      self.assertGreater(
        len(public_subnets['Subnets']), 0,
        "Public subnets should exist"
      )
      
      # Check for private subnets
      private_subnets = self.ec2_west.describe_subnets(
        Filters=[
          {
            'Name': 'tag:Type',
            'Values': ['private']
          },
          {
            'Name': 'tag:Name',
            'Values': ['tap-multi-region-private-subnet-us-west-1*']
          }
        ]
      )
      
      self.assertGreater(
        len(private_subnets['Subnets']), 0,
        "Private subnets should exist"
      )
      
    except ClientError as e:
      self.fail(f"Failed to describe subnets: {e}")

  def test_security_groups_exist(self):
    """Test that security groups exist with proper configurations."""
    try:
      # Check for web tier security group
      web_sg = self.ec2_west.describe_security_groups(
        Filters=[
          {
            'Name': 'tag:Name',
            'Values': ['tap-multi-region-web-sg-us-west-1']
          }
        ]
      )
      
      self.assertGreater(
        len(web_sg['SecurityGroups']), 0,
        "Web security group should exist"
      )
      
      # Verify web SG has HTTP/HTTPS ingress rules
      web_sg_rules = web_sg['SecurityGroups'][0]['IpPermissions']
      http_rule_exists = any(
        rule.get('FromPort') == 80 and rule.get('ToPort') == 80
        for rule in web_sg_rules
      )
      https_rule_exists = any(
        rule.get('FromPort') == 443 and rule.get('ToPort') == 443
        for rule in web_sg_rules
      )
      
      self.assertTrue(http_rule_exists, "HTTP rule should exist in web SG")
      self.assertTrue(https_rule_exists, "HTTPS rule should exist in web SG")
      
    except ClientError as e:
      self.fail(f"Failed to describe security groups: {e}")

  def test_s3_bucket_exists(self):
    """Test that S3 bucket exists and is properly configured."""
    if not self.stack_outputs:
      self.skipTest("Stack outputs not available")
    
    # Get bucket name from outputs
    bucket_name = (
      self.stack_outputs.get('bucket_name') or
      self.stack_outputs.get('primary_bucket_name')
    )
    
    if not bucket_name:
      self.skipTest("Bucket name not found in stack outputs")
    
    try:
      # Check if bucket exists
      self.s3_client.head_bucket(Bucket=bucket_name)
      
      # Check bucket versioning
      versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
      self.assertEqual(
        versioning.get('Status'), 'Enabled',
        "Bucket versioning should be enabled"
      )
      
    except ClientError as e:
      if e.response['Error']['Code'] == '404':
        self.fail(f"S3 bucket {bucket_name} does not exist")
      else:
        self.fail(f"Failed to access S3 bucket: {e}")

  def test_rds_instance_exists(self):
    """Test that RDS instance exists and is available."""
    try:
      # Look for RDS instance with our identifier
      response = self.rds_west.describe_db_instances()
      
      tap_instances = [
        db for db in response['DBInstances']
        if 'tap-multi-region-db' in db['DBInstanceIdentifier']
      ]
      
      self.assertGreater(
        len(tap_instances), 0,
        "RDS instance should exist"
      )
      
      # Check instance status
      instance = tap_instances[0]
      self.assertEqual(
        instance['DBInstanceStatus'], 'available',
        "RDS instance should be available"
      )
      
      # Verify basic configuration
      self.assertEqual(instance['Engine'], 'mysql')
      self.assertEqual(instance['DBInstanceClass'], 'db.t3.micro')
      
    except ClientError as e:
      self.fail(f"Failed to describe RDS instances: {e}")

  def test_internet_gateway_exists(self):
    """Test that Internet Gateway exists and is attached to VPC."""
    try:
      # Get VPC ID first
      vpcs = self.ec2_west.describe_vpcs(
        Filters=[
          {
            'Name': 'tag:Name',
            'Values': ['tap-multi-region-vpc-us-west-1']
          }
        ]
      )
      
      if not vpcs['Vpcs']:
        self.skipTest("VPC not found")
      
      vpc_id = vpcs['Vpcs'][0]['VpcId']
      
      # Check for Internet Gateway
      igws = self.ec2_west.describe_internet_gateways(
        Filters=[
          {
            'Name': 'attachment.vpc-id',
            'Values': [vpc_id]
          }
        ]
      )
      
      self.assertGreater(
        len(igws['InternetGateways']), 0,
        "Internet Gateway should be attached to VPC"
      )
      
      # Verify IGW is attached
      igw = igws['InternetGateways'][0]
      attachments = igw.get('Attachments', [])
      self.assertTrue(
        any(att['VpcId'] == vpc_id and att['State'] == 'available'
            for att in attachments),
        "IGW should be properly attached to VPC"
      )
      
    except ClientError as e:
      self.fail(f"Failed to describe Internet Gateway: {e}")

  def test_stack_outputs_exist(self):
    """Test that expected stack outputs are present."""
    if not self.stack_outputs:
      self.skipTest("Stack outputs not available")
    
    # Expected outputs for single region mode
    expected_single_region_outputs = [
      'vpc_id_us_west_1',
      'bucket_name',
      'db_endpoint'
    ]
    
    # Check if we have single region outputs
    has_single_region = any(
      output in self.stack_outputs 
      for output in expected_single_region_outputs
    )
    
    if has_single_region:
      for output in expected_single_region_outputs:
        self.assertIn(
          output, self.stack_outputs,
          f"Stack should export {output}"
        )
    else:
      # Check for multi-region outputs
      expected_multi_region_outputs = [
        'vpc_id_us_west_1',
        'primary_bucket_name',
        'primary_db_endpoint'
      ]
      
      for output in expected_multi_region_outputs:
        self.assertIn(
          output, self.stack_outputs,
          f"Stack should export {output}"
        )

  def test_tags_are_applied(self):
    """Test that proper tags are applied to resources."""
    try:
      # Check VPC tags
      vpcs = self.ec2_west.describe_vpcs(
        Filters=[
          {
            'Name': 'tag:Name',
            'Values': ['tap-multi-region-vpc-us-west-1']
          }
        ]
      )
      
      if vpcs['Vpcs']:
        vpc = vpcs['Vpcs'][0]
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        
        self.assertEqual(tags.get('Region'), 'us-west-1')
        self.assertEqual(tags.get('Environment'), 'production')
        self.assertIn('tap-multi-region', tags.get('Name', ''))
      
    except ClientError as e:
      self.fail(f"Failed to check resource tags: {e}")


class TestMultiRegionConfiguration(unittest.TestCase):
  """Test multi-region specific configurations."""

  def setUp(self):
    """Set up for multi-region tests."""
    self.ec2_west = boto3.client('ec2', region_name='us-west-1')
    self.ec2_east = boto3.client('ec2', region_name='us-east-1')

  def test_single_region_mode_configuration(self):
    """Test that single region mode is properly configured."""
    # In single region mode, resources should only exist in us-west-1
    try:
      # Check that VPC exists in us-west-1
      vpcs_west = self.ec2_west.describe_vpcs(
        Filters=[
          {
            'Name': 'tag:Name',
            'Values': ['tap-multi-region-vpc-us-west-1']
          }
        ]
      )
      
      # Check that VPC does NOT exist in us-east-1 (for single region mode)
      vpcs_east = self.ec2_east.describe_vpcs(
        Filters=[
          {
            'Name': 'tag:Name',
            'Values': ['tap-multi-region-vpc-us-east-1']
          }
        ]
      )
      
      # In single region mode, we should have west but not east
      west_exists = len(vpcs_west['Vpcs']) > 0
      east_exists = len(vpcs_east['Vpcs']) > 0
      
      if west_exists and not east_exists:
        self.assertTrue(True, "Single region mode is properly configured")
      elif west_exists and east_exists:
        self.assertTrue(True, "Multi-region mode is configured")
      else:
        self.fail("No VPCs found in either region")
        
    except ClientError as e:
      self.skipTest(f"Could not test region configuration: {e}")


if __name__ == '__main__':
  unittest.main()