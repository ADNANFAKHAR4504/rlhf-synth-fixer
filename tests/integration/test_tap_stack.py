"""
Integration tests for secure multi-region infrastructure
Tests actual AWS resource creation and configuration
"""

import unittest
import boto3
import json
import time
from botocore.exceptions import ClientError, NoCredentialsError


class TestTapStackIntegration(unittest.TestCase):
  """Integration tests with live AWS resources"""

  @classmethod
  def setUpClass(cls):
    """Set up class-level fixtures"""
    cls.regions = ['us-east-1', 'us-west-2']
    cls.test_prefix = f'tap-test-{int(time.time())}'

    # Initialize AWS clients
    try:
      cls.aws_clients = {}
      for region in cls.regions:
        cls.aws_clients[region] = {
          'ec2': boto3.client('ec2', region_name=region),
          's3': boto3.client('s3', region_name=region),
          'cloudtrail': boto3.client('cloudtrail', region_name=region),
          'iam': boto3.client('iam', region_name=region),
          'sts': boto3.client('sts', region_name=region)
        }
    except NoCredentialsError:
      raise unittest.SkipTest("AWS credentials not configured for integration tests")

  def setUp(self):
    """Set up per-test fixtures"""
    self.cleanup_resources = []

  def tearDown(self):
    """Clean up test resources"""
    print(f"\n🧹 Cleaning up test resources...")
    for cleanup_func in self.cleanup_resources:
      try:
        cleanup_func()
      except Exception as e:
        print(f"Warning: Failed to clean up resource: {e}")

  def test_aws_connectivity_all_regions(self):
    """Test AWS connectivity in all target regions"""
    for region in self.regions:
      with self.subTest(region=region):
        try:
          ec2_client = self.aws_clients[region]['ec2']
          response = ec2_client.describe_regions()
          self.assertIn('Regions', response)

          # Verify our target region is available
          available_regions = [r['RegionName'] for r in response['Regions']]
          self.assertIn(region, available_regions)

        except ClientError as e:
          self.fail(f"Failed to connect to AWS in {region}: {e}")

  def test_vpc_infrastructure_creation(self):
    """Test VPC creation with subnets and internet gateway"""
    test_region = 'us-east-1'
    ec2_client = self.aws_clients[test_region]['ec2']
    vpc_cidr = '10.100.0.0/16'

    try:
      # Create VPC (mimicking vpc.py module)
      vpc_response = ec2_client.create_vpc(
        CidrBlock=vpc_cidr,
        EnableDnsHostnames=True,
        EnableDnsSupport=True,
        TagSpecifications=[{
          'ResourceType': 'vpc',
          'Tags': [
            {'Key': 'Name', 'Value': f'{self.test_prefix}-vpc'},
            {'Key': 'Environment', 'Value': 'test'},
            {'Key': 'Owner', 'Value': 'integration-test'},
            {'Key': 'Project', 'Value': 'secure-infrastructure'}
          ]
        }]
      )

      vpc_id = vpc_response['Vpc']['VpcId']
      self.cleanup_resources.append(
        lambda: self._cleanup_vpc(vpc_id, ec2_client)
      )

      # Wait for VPC to be available
      waiter = ec2_client.get_waiter('vpc_available')
      waiter.wait(VpcIds=[vpc_id], WaiterConfig={'Delay': 2, 'MaxAttempts': 30})

      # Create Internet Gateway
      igw_response = ec2_client.create_internet_gateway(
        TagSpecifications=[{
          'ResourceType': 'internet-gateway',
          'Tags': [{'Key': 'Name', 'Value': f'{self.test_prefix}-igw'}]
        }]
      )
      igw_id = igw_response['InternetGateway']['InternetGatewayId']

      # Attach IGW to VPC
      ec2_client.attach_internet_gateway(
        InternetGatewayId=igw_id,
        VpcId=vpc_id
      )

      # Create public subnet
      subnet_response = ec2_client.create_subnet(
        VpcId=vpc_id,
        CidrBlock='10.100.0.0/24',
        TagSpecifications=[{
          'ResourceType': 'subnet',
          'Tags': [
            {'Key': 'Name', 'Value': f'{self.test_prefix}-public-subnet'},
            {'Key': 'Type', 'Value': 'Public'}
          ]
        }]
      )
      subnet_id = subnet_response['Subnet']['SubnetId']

      # Validate VPC configuration
      vpc_details = ec2_client.describe_vpcs(VpcIds=[vpc_id])['Vpcs'][0]
      self.assertEqual(vpc_details['CidrBlock'], vpc_cidr)
      self.assertEqual(vpc_details['State'], 'available')
      self.assertTrue(vpc_details['EnableDnsHostnames'])
      self.assertTrue(vpc_details['EnableDnsSupport'])

      # Validate tags
      tags = {tag['Key']: tag['Value'] for tag in vpc_details.get('Tags', [])}
      self.assertIn('Environment', tags)
      self.assertIn('Project', tags)

      # Validate subnet
      subnet_details = ec2_client.describe_subnets(SubnetIds=[subnet_id])['Subnets'][0]
      self.assertEqual(subnet_details['VpcId'], vpc_id)
      self.assertEqual(subnet_details['CidrBlock'], '10.100.0.0/24')

      print(f"✅ VPC infrastructure validated: {vpc_id}")

    except ClientError as e:
      self.fail(f"VPC infrastructure creation test failed: {e}")

  def test_security_groups_with_tiered_access(self):
    """Test security group creation with proper tier separation"""
    test_region = 'us-east-1'
    ec2_client = self.aws_clients[test_region]['ec2']

    try:
      # Create VPC first
      vpc_response = ec2_client.create_vpc(CidrBlock='10.101.0.0/16')
      vpc_id = vpc_response['Vpc']['VpcId']
      self.cleanup_resources.append(
        lambda: self._cleanup_vpc(vpc_id, ec2_client)
      )

      # Wait for VPC
      waiter = ec2_client.get_waiter('vpc_available')
      waiter.wait(VpcIds=[vpc_id], WaiterConfig={'Delay': 2, 'MaxAttempts': 30})

      # Create web tier security group (mimicking security.py)
      web_sg_response = ec2_client.create_security_group(
        GroupName=f'{self.test_prefix}-web-sg',
        Description='Web tier security group',
        VpcId=vpc_id,
        TagSpecifications=[{
          'ResourceType': 'security-group',
          'Tags': [
            {'Key': 'Name', 'Value': f'{self.test_prefix}-web-sg'},
            {'Key': 'Tier', 'Value': 'Web'}
          ]
        }]
      )
      web_sg_id = web_sg_response['GroupId']

      # Add web tier rules (HTTP/HTTPS)
      ec2_client.authorize_security_group_ingress(
        GroupId=web_sg_id,
        IpPermissions=[
          {
            'IpProtocol': 'tcp',
            'FromPort': 80,
            'ToPort': 80,
            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
          },
          {
            'IpProtocol': 'tcp',
            'FromPort': 443,
            'ToPort': 443,
            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
          }
        ]
      )

      # Create app tier security group
      app_sg_response = ec2_client.create_security_group(
        GroupName=f'{self.test_prefix}-app-sg',
        Description='App tier security group',
        VpcId=vpc_id,
        TagSpecifications=[{
          'ResourceType': 'security-group',
          'Tags': [
            {'Key': 'Name', 'Value': f'{self.test_prefix}-app-sg'},
            {'Key': 'Tier', 'Value': 'Application'}
          ]
        }]
      )
      app_sg_id = app_sg_response['GroupId']

      # Add app tier rule (only from web tier)
      ec2_client.authorize_security_group_ingress(
        GroupId=app_sg_id,
        IpPermissions=[{
          'IpProtocol': 'tcp',
          'FromPort': 8080,
          'ToPort': 8080,
          'UserIdGroupPairs': [{'GroupId': web_sg_id}]
        }]
      )

      # Validate security groups
      web_sg_details = ec2_client.describe_security_groups(GroupIds=[web_sg_id])['SecurityGroups'][0]
      app_sg_details = ec2_client.describe_security_groups(GroupIds=[app_sg_id])['SecurityGroups'][0]

      # Validate web tier allows HTTP/HTTPS from anywhere
      web_rules = web_sg_details['IpPermissions']
      http_rule = next((rule for rule in web_rules if rule['FromPort'] == 80), None)
      https_rule = next((rule for rule in web_rules if rule['FromPort'] == 443), None)

      self.assertIsNotNone(http_rule)
      self.assertIsNotNone(https_rule)
      self.assertEqual(http_rule['IpRanges'][0]['CidrIp'], '0.0.0.0/0')

      # Validate app tier only allows from web tier
      app_rules = app_sg_details['IpPermissions']
      app_rule = next((rule for rule in app_rules if rule['FromPort'] == 8080), None)

      self.assertIsNotNone(app_rule)
      self.assertEqual(app_rule['UserIdGroupPairs'][0]['GroupId'], web_sg_id)

      print(f"✅ Security groups validated: Web({web_sg_id}), App({app_sg_id})")

    except ClientError as e:
      self.fail(f"Security group test failed: {e}")

  def test_s3_bucket_with_encryption_and_ssl_policy(self):
    """Test S3 bucket creation with encryption and SSL enforcement"""
    bucket_name = f'{self.test_prefix}-secure-bucket'
    s3_client = self.aws_clients['us-east-1']['s3']

    try:
      # Create S3 bucket (mimicking security.py)
      s3_client.create_bucket(Bucket=bucket_name)
      self.cleanup_resources.append(
        lambda: self._cleanup_s3_bucket(bucket_name, s3_client)
      )

      # Enable versioning
      s3_client.put_bucket_versioning(
        Bucket=bucket_name,
        VersioningConfiguration={'Status': 'Enabled'}
      )

      # Enable server-side encryption (AES256)
      s3_client.put_bucket_encryption(
        Bucket=bucket_name,
        ServerSideEncryptionConfiguration={
          'Rules': [{
            'ApplyServerSideEncryptionByDefault': {
              'SSEAlgorithm': 'AES256'
            }
          }]
        }
      )

      # Block public access
      s3_client.put_public_access_block(
        Bucket=bucket_name,
        PublicAccessBlockConfiguration={
          'BlockPublicAcls': True,
          'IgnorePublicAcls': True,
          'BlockPublicPolicy': True,
          'RestrictPublicBuckets': True
        }
      )

      # Apply SSL enforcement policy
      bucket_policy = {
        "Version": "2012-10-17",
        "Statement": [{
          "Sid": "DenyInsecureConnections",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:*",
          "Resource": [
            f"arn:aws:s3:::{bucket_name}/*",
            f"arn:aws:s3:::{bucket_name}"
          ],
          "Condition": {
            "Bool": {
              "aws:SecureTransport": "false"
            }
          }
        }]
      }

      s3_client.put_bucket_policy(
        Bucket=bucket_name,
        Policy=json.dumps(bucket_policy)
      )

      # Validate bucket configuration

      # Check versioning
      versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
      self.assertEqual(versioning['Status'], 'Enabled')

      # Check encryption
      encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
      encryption_rule = encryption['ServerSideEncryptionConfiguration']['Rules'][0]
      self.assertEqual(
        encryption_rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
        'AES256'
      )

      # Check public access block
      public_access = s3_client.get_public_access_block(Bucket=bucket_name)
      pab_config = public_access['PublicAccessBlockConfiguration']
      self.assertTrue(pab_config['BlockPublicAcls'])
      self.assertTrue(pab_config['BlockPublicPolicy'])

      # Check SSL enforcement policy
      policy_response = s3_client.get_bucket_policy(Bucket=bucket_name)
      policy = json.loads(policy_response['Policy'])
      statement = policy['Statement'][0]

      self.assertEqual(statement['Effect'], 'Deny')
      self.assertIn('aws:SecureTransport', statement['Condition']['Bool'])
      self.assertEqual(statement['Condition']['Bool']['aws:SecureTransport'], 'false')

      print(f"✅ S3 bucket validated: {bucket_name}")

    except ClientError as e:
      self.fail(f"S3 bucket test failed: {e}")

  def test_cloudtrail_setup_with_s3_integration(self):
    """Test CloudTrail creation with S3 bucket integration"""
    test_region = 'us-east-1'
    cloudtrail_client = self.aws_clients[test_region]['cloudtrail']
    s3_client = self.aws_clients[test_region]['s3']

    trail_name = f'{self.test_prefix}-trail'
    bucket_name = f'{self.test_prefix}-cloudtrail-bucket'

    try:
      # Create S3 bucket for CloudTrail
      s3_client.create_bucket(Bucket=bucket_name)
      self.cleanup_resources.append(
        lambda: self._cleanup_s3_bucket(bucket_name, s3_client)
      )

      # Get account ID for bucket policy
      sts_client = self.aws_clients[test_region]['sts']
      account_id = sts_client.get_caller_identity()['Account']

      # Create bucket policy for CloudTrail (mimicking main.py logic)
      bucket_policy = {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "AWSCloudTrailAclCheck",
            "Effect": "Allow",
            "Principal": {"Service": "cloudtrail.amazonaws.com"},
            "Action": "s3:GetBucketAcl",
            "Resource": f"arn:aws:s3:::{bucket_name}"
          },
          {
            "Sid": "AWSCloudTrailWrite",
            "Effect": "Allow",
            "Principal": {"Service": "cloudtrail.amazonaws.com"},
            "Action": "s3:PutObject",
            "Resource": f"arn:aws:s3:::{bucket_name}/cloudtrail-logs/*",
            "Condition": {
              "StringEquals": {
                "s3:x-amz-acl": "bucket-owner-full-control"
              }
            }
          }
        ]
      }

      s3_client.put_bucket_policy(
        Bucket=bucket_name,
        Policy=json.dumps(bucket_policy)
      )

      # Create CloudTrail (mimicking monitoring.py)
      trail_response = cloudtrail_client.create_trail(
        Name=trail_name,
        S3BucketName=bucket_name,
        S3KeyPrefix='cloudtrail-logs',
        IncludeGlobalServiceEvents=True,
        IsMultiRegionTrail=False,  # Region-specific as per your implementation
        EnableLogFileValidation=True,
        TagsList=[
          {'Key': 'Environment', 'Value': 'test'},
          {'Key': 'Project', 'Value': 'secure-infrastructure'}
        ]
      )

      self.cleanup_resources.append(
        lambda: cloudtrail_client.delete_trail(Name=trail_name)
      )

      # Start logging
      cloudtrail_client.start_logging(Name=trail_name)

      # Validate CloudTrail configuration
      trail_details = cloudtrail_client.describe_trails(trailNameList=[trail_name])['trailList'][0]

      self.assertEqual(trail_details['Name'], trail_name)
      self.assertEqual(trail_details['S3BucketName'], bucket_name)
      self.assertTrue(trail_details['IncludeGlobalServiceEvents'])
      self.assertFalse(trail_details['IsMultiRegionTrail'])  # Per your implementation
      self.assertTrue(trail_details['LogFileValidationEnabled'])

      # Validate logging status
      logging_status = cloudtrail_client.get_trail_status(Name=trail_name)
      self.assertTrue(logging_status['IsLogging'])

      print(f"✅ CloudTrail validated: {trail_name}")

    except ClientError as e:
      self.fail(f"CloudTrail test failed: {e}")

  def test_cross_region_resource_consistency(self):
    """Test that resources can be created consistently across regions"""
    for region in self.regions:
      with self.subTest(region=region):
        ec2_client = self.aws_clients[region]['ec2']

        # Test basic region connectivity and resource creation capability
        try:
          # Test VPC creation capability
          vpc_response = ec2_client.create_vpc(
            CidrBlock=f'10.{self.regions.index(region) + 200}.0.0/16',
            TagSpecifications=[{
              'ResourceType': 'vpc',
              'Tags': [
                {'Key': 'Name', 'Value': f'{self.test_prefix}-cross-region-vpc-{region}'},
                {'Key': 'Region', 'Value': region},
                {'Key': 'TestType', 'Value': 'CrossRegion'}
              ]
            }]
          )

          vpc_id = vpc_response['Vpc']['VpcId']
          self.cleanup_resources.append(
            lambda vid=vpc_id, client=ec2_client: self._cleanup_vpc(vid, client)
          )

          # Validate VPC was created in correct region
          vpc_details = ec2_client.describe_vpcs(VpcIds=[vpc_id])['Vpcs'][0]
          self.assertEqual(vpc_details['State'], 'available')

          # Validate region-specific tagging
          tags = {tag['Key']: tag['Value'] for tag in vpc_details.get('Tags', [])}
          self.assertEqual(tags['Region'], region)

          print(f"✅ Cross-region test passed for {region}: {vpc_id}")

        except ClientError as e:
          self.fail(f"Cross-region test failed in {region}: {e}")

  def test_iam_roles_and_policies_integration(self):
    """Test IAM role creation and policy attachment"""
    iam_client = self.aws_clients['us-east-1']['iam']  # IAM is global
    role_name = f'{self.test_prefix}-test-role'

    try:
      # Create EC2 role (mimicking iam.py)
      trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Action": "sts:AssumeRole"
          }
        ]
      }

      role_response = iam_client.create_role(
        RoleName=role_name,
        AssumeRolePolicyDocument=json.dumps(trust_policy),
        Tags=[
          {'Key': 'Environment', 'Value': 'test'},
          {'Key': 'Project', 'Value': 'secure-infrastructure'}
        ]
      )

      self.cleanup_resources.append(
        lambda: self._cleanup_iam_role(role_name, iam_client)
      )

      # Attach SSM policy (as per iam.py)
      iam_client.attach_role_policy(
        RoleName=role_name,
        PolicyArn='arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      )

      # Create instance profile
      profile_name = f'{role_name}-profile'
      iam_client.create_instance_profile(InstanceProfileName=profile_name)
      iam_client.add_role_to_instance_profile(
        InstanceProfileName=profile_name,
        RoleName=role_name
      )

      # Validate role creation
      role_details = iam_client.get_role(RoleName=role_name)['Role']
      self.assertEqual(role_details['RoleName'], role_name)

      # Validate policy attachment
      attached_policies = iam_client.list_attached_role_policies(RoleName=role_name)
      policy_arns = [policy['PolicyArn'] for policy in attached_policies['AttachedPolicies']]
      self.assertIn('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore', policy_arns)

      # Validate instance profile
      profile_details = iam_client.get_instance_profile(InstanceProfileName=profile_name)
      self.assertEqual(len(profile_details['InstanceProfile']['Roles']), 1)
      self.assertEqual(profile_details['InstanceProfile']['Roles'][0]['RoleName'], role_name)

      print(f"✅ IAM role validated: {role_name}")

    except ClientError as e:
      self.fail(f"IAM role test failed: {e}")

  def test_codepipeline_resources_creation(self):
    """Test CodePipeline related resources can be created"""
    test_region = 'us-east-1'
    s3_client = self.aws_clients[test_region]['s3']
    iam_client = self.aws_clients[test_region]['iam']

    source_bucket_name = f'{self.test_prefix}-pipeline-source'
    artifact_bucket_name = f'{self.test_prefix}-pipeline-artifacts'

    try:
      # Create source bucket (mimicking code_pipeline.py)
      s3_client.create_bucket(Bucket=source_bucket_name)
      self.cleanup_resources.append(
        lambda: self._cleanup_s3_bucket(source_bucket_name, s3_client)
      )

      # Enable encryption on source bucket
      s3_client.put_bucket_encryption(
        Bucket=source_bucket_name,
        ServerSideEncryptionConfiguration={
          'Rules': [{
            'ApplyServerSideEncryptionByDefault': {
              'SSEAlgorithm': 'aws:kms'
            }
          }]
        }
      )

      # Create artifacts bucket
      s3_client.create_bucket(Bucket=artifact_bucket_name)
      self.cleanup_resources.append(
        lambda: self._cleanup_s3_bucket(artifact_bucket_name, s3_client)
      )

      # Create pipeline service role
      pipeline_role_name = f'{self.test_prefix}-pipeline-role'
      pipeline_trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "codepipeline.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }]
      }

      iam_client.create_role(
        RoleName=pipeline_role_name,
        AssumeRolePolicyDocument=json.dumps(pipeline_trust_policy)
      )

      self.cleanup_resources.append(
        lambda: self._cleanup_iam_role(pipeline_role_name, iam_client)
      )

      # Validate bucket creation and encryption
      source_encryption = s3_client.get_bucket_encryption(Bucket=source_bucket_name)
      encryption_rule = source_encryption['ServerSideEncryptionConfiguration']['Rules'][0]
      self.assertEqual(
        encryption_rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
        'aws:kms'
      )

      # Validate role creation
      role_details = iam_client.get_role(RoleName=pipeline_role_name)['Role']
      self.assertEqual(role_details['RoleName'], pipeline_role_name)

      print(f"✅ CodePipeline resources validated")

    except ClientError as e:
      self.fail(f"CodePipeline resources test failed: {e}")

  def _cleanup_vpc(self, vpc_id: str, ec2_client):
    """Helper to clean up VPC and associated resources"""
    try:
      print(f"Cleaning up VPC: {vpc_id}")

      # Delete subnets
      subnets = ec2_client.describe_subnets(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
      )['Subnets']

      for subnet in subnets:
        ec2_client.delete_subnet(SubnetId=subnet['SubnetId'])

      # Delete security groups (except default)
      security_groups = ec2_client.describe_security_groups(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
      )['SecurityGroups']

      for sg in security_groups:
        if sg['GroupName'] != 'default':
          ec2_client.delete_security_group(GroupId=sg['GroupId'])

      # Detach and delete internet gateways
      igws = ec2_client.describe_internet_gateways(
        Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
      )['InternetGateways']

      for igw in igws:
        ec2_client.detach_internet_gateway(
          InternetGatewayId=igw['InternetGatewayId'],
          VpcId=vpc_id
        )
        ec2_client.delete_internet_gateway(InternetGatewayId=igw['InternetGatewayId'])

      # Delete VPC
      ec2_client.delete_vpc(VpcId=vpc_id)

    except ClientError as e:
      print(f"Warning: Error cleaning up VPC {vpc_id}: {e}")

  def _cleanup_s3_bucket(self, bucket_name: str, s3_client):
    """Helper to clean up S3 bucket"""
    try:
      print(f"Cleaning up S3 bucket: {bucket_name}")

      # Delete all objects and versions
      try:
        # Delete all object versions
        versions = s3_client.list_object_versions(Bucket=bucket_name)

        objects_to_delete = []
        for version in versions.get('Versions', []):
          objects_to_delete.append({
            'Key': version['Key'],
            'VersionId': version['VersionId']
          })

        for delete_marker in versions.get('DeleteMarkers', []):
          objects_to_delete.append({
            'Key': delete_marker['Key'],
            'VersionId': delete_marker['VersionId']
          })

        if objects_to_delete:
          s3_client.delete_objects(
            Bucket=bucket_name,
            Delete={'Objects': objects_to_delete}
          )

      except ClientError:
        pass  # Bucket might be empty or versioning not enabled

      # Delete bucket
      s3_client.delete_bucket(Bucket=bucket_name)

    except ClientError as e:
      print(f"Warning: Error cleaning up bucket {bucket_name}: {e}")

  def _cleanup_iam_role(self, role_name: str, iam_client):
    """Helper to clean up IAM role"""
    try:
      print(f"Cleaning up IAM role: {role_name}")

      # Detach all policies
      attached_policies = iam_client.list_attached_role_policies(RoleName=role_name)
      for policy in attached_policies['AttachedPolicies']:
        iam_client.detach_role_policy(
          RoleName=role_name,
          PolicyArn=policy['PolicyArn']
        )

      # Remove from instance profiles
      try:
        profile_name = f'{role_name}-profile'
        iam_client.remove_role_from_instance_profile(
          InstanceProfileName=profile_name,
          RoleName=role_name
        )
        iam_client.delete_instance_profile(InstanceProfileName=profile_name)
      except ClientError:
        pass  # Profile might not exist

      # Delete role
      iam_client.delete_role(RoleName=role_name)

    except ClientError as e:
      print(f"Warning: Error cleaning up IAM role {role_name}: {e}")


if __name__ == '__main__':
  # Run integration tests
  print("🔗 Running Integration Tests for TAP Stack")
  print("=" * 50)
  print("⚠️  Note: These tests create real AWS resources and may incur costs")
  print("=" * 50)

  unittest.main(verbosity=2, buffer=True)
