"""
Integration tests for live AWS Nova Model Breaking infrastructure.
Tests actual deployed resources and end-to-end functionality.
"""

import time
import unittest

import boto3
from pulumi import automation as auto


class TestAWSNovaModelIntegration(unittest.TestCase):
  """Integration tests against live deployed infrastructure."""
  
  def setUp(self):
    """Initialize AWS clients and get stack outputs."""
    self.region = "us-east-1"
    self.stack_name = "dev"  # Change based on your environment
    self.project_name = "iac-aws-nova-model-breaking"
    
    # AWS clients
    self.ec2 = boto3.client('ec2', region_name=self.region)
    self.s3 = boto3.client('s3', region_name=self.region)
    self.lambda_client = boto3.client('lambda', region_name=self.region)
    self.iam = boto3.client('iam', region_name=self.region)
    self.logs = boto3.client('logs', region_name=self.region)
    
    # Get stack outputs
    self.outputs = self._get_stack_outputs()
  
  def _get_stack_outputs(self):
    """Retrieve outputs from deployed Pulumi stack."""
    try:
      stack = auto.select_stack(
        stack_name=self.stack_name,
        project_name=self.project_name,
        program=lambda: None
      )
      return stack.outputs()
    except auto.StackNotFoundError as e:
      self.skipTest(f"Stack not deployed: {e}")
      return None

  def test_vpc_deployment_and_configuration(self):
    """Test VPC is deployed with correct configuration."""
    vpc_id = self.outputs['vpcId']['value']
    
    # Verify VPC exists and has correct configuration
    response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
    vpc = response['Vpcs'][0]
    
    self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
    self.assertTrue(vpc['EnableDnsHostnames'])
    self.assertTrue(vpc['EnableDnsSupport'])
    self.assertEqual(vpc['State'], 'available')

  def test_subnet_deployment_across_azs(self):
    """Test subnets are deployed across multiple availability zones."""
    public_subnet_ids = self.outputs['publicSubnetIds']['value']
    private_subnet_ids = self.outputs['privateSubnetIds']['value']
    vpc_id = self.outputs['vpcId']['value']
    
    # Test public subnets
    response = self.ec2.describe_subnets(SubnetIds=public_subnet_ids)
    public_subnets = response['Subnets']
    
    self.assertEqual(len(public_subnets), 2)
    
    # Verify they're in different AZs
    azs = {subnet['AvailabilityZone'] for subnet in public_subnets}
    self.assertEqual(len(azs), 2)
    
    # Verify public subnets configuration
    for subnet in public_subnets:
      self.assertEqual(subnet['VpcId'], vpc_id)
      self.assertTrue(subnet['MapPublicIpOnLaunch'])
      self.assertIn(subnet['CidrBlock'], ['10.0.0.0/24', '10.0.1.0/24'])
    
    # Test private subnets
    response = self.ec2.describe_subnets(SubnetIds=private_subnet_ids)
    private_subnets = response['Subnets']
    
    self.assertEqual(len(private_subnets), 2)
    
    # Verify private subnets configuration
    for subnet in private_subnets:
      self.assertEqual(subnet['VpcId'], vpc_id)
      self.assertFalse(subnet['MapPublicIpOnLaunch'])
      self.assertIn(subnet['CidrBlock'], ['10.0.10.0/24', '10.0.11.0/24'])

  def test_internet_gateway_and_routing(self):
    """Test Internet Gateway and routing configuration."""
    vpc_id = self.outputs['vpcId']['value']
    
    # Find Internet Gateway
    response = self.ec2.describe_internet_gateways(
      Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
    )
    
    self.assertEqual(len(response['InternetGateways']), 1)
    igw = response['InternetGateways'][0]
    self.assertEqual(igw['Attachments'][0]['State'], 'available')

  def test_nat_gateway_deployment(self):
    """Test NAT Gateway is deployed in public subnet."""
    vpc_id = self.outputs['vpcId']['value']
    
    # Find NAT Gateway
    response = self.ec2.describe_nat_gateways(
      Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
    )
    
    self.assertEqual(len(response['NatGateways']), 1)
    nat_gw = response['NatGateways'][0]
    self.assertEqual(nat_gw['State'], 'available')

  def test_s3_bucket_security_configuration(self):
    """Test S3 bucket security and encryption settings."""
    bucket_name = self.outputs['bucketName']['value']
    
    # Test bucket exists
    response = self.s3.head_bucket(Bucket=bucket_name)
    self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
    
    # Test encryption configuration
    response = self.s3.get_bucket_encryption(Bucket=bucket_name)
    rules = response['ServerSideEncryptionConfiguration']['Rules']
    self.assertEqual(len(rules), 1)
    self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'AES256')
    
    # Test versioning
    response = self.s3.get_bucket_versioning(Bucket=bucket_name)
    self.assertEqual(response['Status'], 'Enabled')
    
    # Test public access block
    response = self.s3.get_public_access_block(Bucket=bucket_name)
    pab = response['PublicAccessBlockConfiguration']
    self.assertTrue(pab['BlockPublicAcls'])
    self.assertTrue(pab['BlockPublicPolicy'])
    self.assertTrue(pab['IgnorePublicAcls'])
    self.assertTrue(pab['RestrictPublicBuckets'])

  def test_lambda_function_deployment(self):
    """Test Lambda function is deployed with correct configuration."""
    lambda_name = self.outputs['lambdaName']['value']
    
    # Get function configuration
    response = self.lambda_client.get_function(FunctionName=lambda_name)
    config = response['Configuration']
    
    self.assertEqual(config['Runtime'], 'python3.9')
    self.assertEqual(config['Handler'], 'index.handler')
    self.assertEqual(config['Timeout'], 30)
    self.assertEqual(config['MemorySize'], 128)
    
    # Check environment variables
    env_vars = config.get('Environment', {}).get('Variables', {})
    self.assertIn('STAGE', env_vars)
    self.assertIn('BUCKET', env_vars)

  def test_iam_role_least_privilege(self):
    """Test IAM role has least privilege permissions."""
    role_arn = self.outputs['lambdaRoleArn']['value']
    
    # Extract role name from ARN
    role_name = role_arn.split('/')[-1]
    
    # Check role exists
    response = self.iam.get_role(RoleName=role_name)
    self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
    
    # Check attached managed policies
    response = self.iam.list_attached_role_policies(RoleName=role_name)
    managed_policies = [p['PolicyArn'] for p in response['AttachedPolicies']]
    
    # Should only have basic execution role
    expected_policy = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    self.assertIn(expected_policy, managed_policies)
    
    # Check inline policies (should have S3 read-only)
    response = self.iam.list_role_policies(RoleName=role_name)
    self.assertEqual(len(response['PolicyNames']), 1)

  def test_cloudwatch_logging_configuration(self):
    """Test CloudWatch logging is configured for Lambda."""
    lambda_name = self.outputs['lambdaName']['value']
    log_group_name = f"/aws/lambda/{lambda_name}"
    
    # Check log group exists
    response = self.logs.describe_log_groups(logGroupNamePrefix=log_group_name)
    log_groups = response['logGroups']
    
    self.assertEqual(len(log_groups), 1)
    log_group = log_groups[0]
    self.assertEqual(log_group['logGroupName'], log_group_name)
    self.assertEqual(log_group['retentionInDays'], 14)

  def test_s3_lambda_event_integration(self):
    """Test S3 to Lambda event notification is configured."""
    bucket_name = self.outputs['bucketName']['value']
    lambda_name = self.outputs['lambdaName']['value']
    
    # Check bucket notification configuration
    response = self.s3.get_bucket_notification_configuration(Bucket=bucket_name)
    lambda_configs = response.get('LambdaConfigurations', [])
    
    self.assertEqual(len(lambda_configs), 1)
    config = lambda_configs[0]
    
    # Verify Lambda function ARN is correct
    self.assertIn(lambda_name, config['LambdaFunctionArn'])
    self.assertIn('s3:ObjectCreated:', config['Events'][0])

  def test_end_to_end_file_processing(self):
    """Test end-to-end file upload and Lambda processing."""
    bucket_name = self.outputs['bucketName']['value']
    lambda_name = self.outputs['lambdaName']['value']
    
    # Upload test file to S3
    test_content = "Test file for Lambda processing"
    test_key = f"test-file-{int(time.time())}.txt"
    
    self.s3.put_object(
      Bucket=bucket_name,
      Key=test_key,
      Body=test_content.encode('utf-8')
    )
    
    # Wait for Lambda execution
    time.sleep(5)
    
    # Check CloudWatch logs for processing
    log_group_name = f"/aws/lambda/{lambda_name}"
    
    try:
      response = self.logs.describe_log_streams(
        logGroupName=log_group_name,
        orderBy='LastEventTime',
        descending=True,
        limit=1
      )
      
      if response['logStreams']:
        log_stream = response['logStreams'][0]['logStreamName']
        
        events = self.logs.get_log_events(
          logGroupName=log_group_name,
          logStreamName=log_stream
        )
        
        # Check if our test file was processed
        log_messages = [event['message'] for event in events['events']]
        processed_files = [msg for msg in log_messages if test_key in msg]
        
        self.assertTrue(len(processed_files) > 0, 
                       f"Test file {test_key} was not processed by Lambda")
    
    finally:
      # Clean up test file
      self.s3.delete_object(Bucket=bucket_name, Key=test_key)

  def test_multi_az_resilience(self):
    """Test infrastructure spans multiple availability zones."""
    public_subnet_ids = self.outputs['publicSubnetIds']['value']
    private_subnet_ids = self.outputs['privateSubnetIds']['value']
    
    # Get all subnet details
    all_subnet_ids = public_subnet_ids + private_subnet_ids
    response = self.ec2.describe_subnets(SubnetIds=all_subnet_ids)
    
    # Check AZ distribution
    azs = {subnet['AvailabilityZone'] for subnet in response['Subnets']}
    self.assertGreaterEqual(len(azs), 2, "Infrastructure should span at least 2 AZs")

  def test_infrastructure_tags(self):
    """Test all resources are properly tagged."""
    vpc_id = self.outputs['vpcId']['value']
    
    # Check VPC tags
    response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
    vpc_tags = {tag['Key']: tag['Value'] for tag in response['Vpcs'][0].get('Tags', [])}
    
    self.assertIn('Project', vpc_tags)
    self.assertIn('Stage', vpc_tags)
    self.assertIn('Managed', vpc_tags)
    self.assertEqual(vpc_tags['Managed'], 'pulumi')



if __name__ == '__main__':
  # Run with: python -m pytest tests/integration/test_tap_stack.py -v
  unittest.main()
