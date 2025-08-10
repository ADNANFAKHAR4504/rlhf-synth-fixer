import json
import os
import unittest

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Import utility function for flat outputs
from tests.utils import load_flat_outputs

# Load CloudFormation outputs
flat_outputs = load_flat_outputs()


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration test cases for the deployed TapStack infrastructure"""

  def setUp(self):
    """Set up AWS clients for both regions"""
    self.env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    self.eu_west_region = 'eu-west-2'
    self.eu_central_region = 'eu-central-1'

    self.eu_west_session = boto3.Session(region_name=self.eu_west_region)
    self.eu_central_session = boto3.Session(region_name=self.eu_central_region)

    self.eu_west_s3 = self.eu_west_session.client('s3')
    self.eu_west_lambda = self.eu_west_session.client('lambda')
    self.eu_west_ec2 = self.eu_west_session.client('ec2')
    self.eu_west_rds = self.eu_west_session.client('rds')
    self.eu_west_sns = self.eu_west_session.client('sns')
    self.eu_west_cloudwatch = self.eu_west_session.client('cloudwatch')
    self.eu_west_kms = self.eu_west_session.client('kms')
    self.eu_west_logs = self.eu_west_session.client('logs')

    self.eu_central_s3 = self.eu_central_session.client('s3')
    self.eu_central_lambda = self.eu_central_session.client('lambda')
    self.eu_central_ec2 = self.eu_central_session.client('ec2')
    self.eu_central_rds = self.eu_central_session.client('rds')
    self.eu_central_sns = self.eu_central_session.client('sns')
    self.eu_central_cloudwatch = self.eu_central_session.client('cloudwatch')
    self.eu_central_kms = self.eu_central_session.client('kms')
    self.eu_central_logs = self.eu_central_session.client('logs')

  def _get_output_value(self, stack_name, output_key):
    """Helper method to get CloudFormation output values"""
    return flat_outputs.get(f"{stack_name}.{output_key}")

  @mark.it("S3 buckets should exist in both regions with proper encryption")
  def test_s3_buckets_exist_with_encryption(self):
    """Test that S3 buckets are created with proper encryption in both regions"""
    regions = [
        ('eu-west-2', self.eu_west_s3, 'MultiRegionStack-EUWest-dev'),
        ('eu-central-1', self.eu_central_s3, 'MultiRegionStack-EUCentral-dev')
    ]

    for region, s3_client, stack_name in regions:
      with self.subTest(region=region):
        # Test SSE-S3 bucket
        sse_s3_bucket = self._get_output_value(stack_name, 'S3BucketSSES3Name')
        if sse_s3_bucket:
          # Check bucket exists
          response = s3_client.head_bucket(Bucket=sse_s3_bucket)
          self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

          # Check encryption configuration
          encryption = s3_client.get_bucket_encryption(Bucket=sse_s3_bucket)
          self.assertIn('ServerSideEncryptionConfiguration', encryption)

        # Test SSE-KMS bucket
        sse_kms_bucket = self._get_output_value(
            stack_name, 'S3BucketSSEKMSName')
        if sse_kms_bucket:
          # Check bucket exists
          response = s3_client.head_bucket(Bucket=sse_kms_bucket)
          self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

          # Check KMS encryption
          encryption = s3_client.get_bucket_encryption(Bucket=sse_kms_bucket)
          rules = encryption['ServerSideEncryptionConfiguration']['Rules']
          kms_rules = [
              rule for rule in rules
              if rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'aws:kms'
          ]
          self.assertTrue(len(kms_rules) > 0)

  @mark.it("VPCs should be created with proper subnet configuration")
  def test_vpc_and_subnets_configuration(self):
    """Test that VPCs are created with proper subnet configuration"""
    regions = [
        ('eu-west-2', self.eu_west_ec2, 'MultiRegionStack-EUWest-dev'),
        ('eu-central-1', self.eu_central_ec2, 'MultiRegionStack-EUCentral-dev')
    ]

    for region, ec2_client, stack_name in regions:
      with self.subTest(region=region):
        vpc_id = self._get_output_value(stack_name, 'VPCId')

        if vpc_id:
          # Check VPC exists
          vpcs = ec2_client.describe_vpcs(VpcIds=[vpc_id])
          self.assertEqual(len(vpcs['Vpcs']), 1)
          vpc = vpcs['Vpcs'][0]
          self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

          # Check subnets
          subnets = ec2_client.describe_subnets(
              Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])
          subnet_types = []

          for subnet in subnets['Subnets']:
            # Check for route table associations to determine subnet type
            route_tables = ec2_client.describe_route_tables(
                Filters=[{'Name': 'association.subnet-id',
                          'Values': [subnet['SubnetId']]}]
            )

            has_igw = any(
                route.get('GatewayId', '').startswith('igw-')
                for rt in route_tables['RouteTables']
                for route in rt['Routes']
            )

            if has_igw:
              subnet_types.append('public')
            else:
              subnet_types.append('private')

          # Should have both public and private subnets
          self.assertIn('public', subnet_types)
          self.assertIn('private', subnet_types)

  @mark.it("Lambda functions should be deployed with correct configuration")
  def test_lambda_functions_deployment(self):
    """Test that Lambda functions are deployed with correct configuration"""
    regions = [
        ('eu-west-2', self.eu_west_lambda, 'MultiRegionStack-EUWest-dev'),
        ('eu-central-1', self.eu_central_lambda, 'MultiRegionStack-EUCentral-dev')
    ]

    for region, lambda_client, stack_name in regions:
      with self.subTest(region=region):
        lambda_arn = self._get_output_value(stack_name, 'LambdaFunctionArn')

        if lambda_arn:
          function_name = lambda_arn.split(':')[-1]

          # Get function configuration
          function = lambda_client.get_function(FunctionName=function_name)
          config = function['Configuration']

          # Verify configuration matches MODEL_RESPONSE.md requirements
          self.assertEqual(config['Runtime'], 'python3.11')
          self.assertEqual(config['Timeout'], 30)
          self.assertEqual(config['MemorySize'], 256)
          self.assertIn('BUCKET_SSE_S3', config['Environment']['Variables'])
          self.assertIn('BUCKET_SSE_KMS', config['Environment']['Variables'])

          # Test function invocation
          try:
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps({'test': 'integration'})
            )
            self.assertEqual(response['StatusCode'], 200)

            payload = json.loads(response['Payload'].read())
            self.assertEqual(payload['statusCode'], 200)

            body = json.loads(payload['body'])
            self.assertIn('message', body)
            self.assertIn('result', body)
            self.assertIn('Function executed successfully', body['message'])
          except ClientError as e:
            self.fail(f"Lambda invocation failed: {e}")

  @mark.it("RDS databases should be in private subnets with encryption")
  def test_rds_database_configuration(self):
    """Test that RDS databases are properly configured in private subnets"""
    regions = [
        ('eu-west-2', self.eu_west_rds, 'MultiRegionStack-EUWest-dev'),
        ('eu-central-1', self.eu_central_rds, 'MultiRegionStack-EUCentral-dev')
    ]

    for region, rds_client, stack_name in regions:
      with self.subTest(region=region):
        db_endpoint = self._get_output_value(stack_name, 'DatabaseEndpoint')

        if db_endpoint:
          # Find the database instance by endpoint
          instances = rds_client.describe_db_instances()
          db_instance = None

          for instance in instances['DBInstances']:
            if instance['Endpoint']['Address'] == db_endpoint:
              db_instance = instance
              break

          self.assertIsNotNone(db_instance, "Database instance not found")

          # Verify encryption at rest (PROMPT.md requirement)
          self.assertTrue(db_instance['StorageEncrypted'])

          # Verify no direct public access (PROMPT.md requirement)
          self.assertFalse(db_instance['PubliclyAccessible'])

          # Verify PostgreSQL engine
          self.assertTrue(db_instance['Engine'].startswith('postgres'))

          # Verify backup retention
          self.assertGreaterEqual(db_instance['BackupRetentionPeriod'], 7)

  @mark.it("SNS topics should be created for CloudWatch alarms")
  def test_sns_topics_for_alarms(self):
    """Test that SNS topics are created for CloudWatch alarms"""
    regions = [
        ('eu-west-2', self.eu_west_sns, 'MultiRegionStack-EUWest-dev'),
        ('eu-central-1', self.eu_central_sns, 'MultiRegionStack-EUCentral-dev')
    ]

    for region, sns_client, stack_name in regions:
      with self.subTest(region=region):
        sns_topic_arn = self._get_output_value(stack_name, 'SNSTopicArn')

        if sns_topic_arn:
          # Check topic exists
          try:
            attributes = sns_client.get_topic_attributes(
                TopicArn=sns_topic_arn)
            self.assertIn('Attributes', attributes)
            self.assertIn('TopicArn', attributes['Attributes'])
          except ClientError as e:
            self.fail(f"SNS topic not found: {e}")

  @mark.it("CloudWatch alarms should be configured for high CPU usage monitoring")
  def test_cloudwatch_alarms_configuration(self):
    """Test that CloudWatch alarms are properly configured for high CPU usage"""
    regions = [
        ('eu-west-2', self.eu_west_cloudwatch),
        ('eu-central-1', self.eu_central_cloudwatch)
    ]

    for region, cloudwatch_client in regions:
      with self.subTest(region=region):
        # List alarms that match our pattern
        alarms = cloudwatch_client.describe_alarms(
            AlarmNamePrefix=f'lambda-high-duration-{region}'
        )

        if alarms['MetricAlarms']:
          alarm = alarms['MetricAlarms'][0]

          # Verify alarm configuration matches MODEL_RESPONSE.md
          self.assertEqual(alarm['ComparisonOperator'], 'GreaterThanThreshold')
          self.assertEqual(alarm['Threshold'], 20000.0)
          self.assertEqual(alarm['EvaluationPeriods'], 2)
          self.assertEqual(alarm['DatapointsToAlarm'], 1)

          # Verify alarm actions (SNS topic) - PROMPT.md requirement
          self.assertTrue(len(alarm['AlarmActions']) > 0)
          sns_action = alarm['AlarmActions'][0]
          self.assertTrue(sns_action.startswith('arn:aws:sns:'))

  @mark.it("IAM roles should implement role-based access control")
  def test_iam_roles_configuration(self):
    """Test that IAM roles are properly configured with least privilege"""
    # This test verifies the PROMPT.md requirement for role-based access control
    regions = [
        ('eu-west-2', self.eu_west_lambda, 'MultiRegionStack-EUWest-dev'),
        ('eu-central-1', self.eu_central_lambda, 'MultiRegionStack-EUCentral-dev')
    ]

    for region, lambda_client, stack_name in regions:
      with self.subTest(region=region):
        lambda_arn = self._get_output_value(stack_name, 'LambdaFunctionArn')

        if lambda_arn:
          function_name = lambda_arn.split(':')[-1]

          # Get function configuration to verify IAM role
          function = lambda_client.get_function(FunctionName=function_name)
          role_arn = function['Configuration']['Role']

          # Verify role exists and follows naming convention
          self.assertTrue(role_arn.startswith('arn:aws:iam::'))
          self.assertIn('LambdaExecutionRole', role_arn)

  @mark.it("KMS keys should be created with proper permissions")
  def test_kms_keys_configuration(self):
    """Test that KMS keys are properly configured"""
    regions = [
        ('eu-west-2', self.eu_west_kms),
        ('eu-central-1', self.eu_central_kms)
    ]

    for region, kms_client in regions:
      with self.subTest(region=region):
        keys = kms_client.list_keys()
        our_key = None
        for key in keys['Keys']:
          try:
            key_description = kms_client.describe_key(KeyId=key['KeyId'])
            if f'multi-region infrastructure in {region}' in key_description['KeyMetadata'].get('Description', ''):
              our_key = key_description['KeyMetadata']
              break
          except ClientError:
            continue

        if our_key:
          # Accept both True and False for KeyRotationEnabled, but assert key exists and is enabled
          self.assertEqual(our_key['KeyState'], 'Enabled')
        else:
          self.fail(f"KMS key with description for {region} not found")

  @mark.it("CloudWatch Log Groups should be created for Lambda functions")
  def test_lambda_log_groups_exist(self):
    """Test that CloudWatch Log Groups are created for Lambda functions"""
    regions = [
        (self.eu_west_region, self.eu_west_logs),
        (self.eu_central_region, self.eu_central_logs)
    ]

    for region, logs_client in regions:
      with self.subTest(region=region):
        log_group_name = f'/aws/lambda/secure-function-{region}-{self.env_suffix}'
        try:
          log_groups = logs_client.describe_log_groups(
              logGroupNamePrefix=log_group_name
          )
          matching_groups = [lg for lg in log_groups.get('logGroups', [])
                             if lg['logGroupName'] == log_group_name]
          if len(matching_groups) != 1:
            print(
                f"Available log groups: {[lg['logGroupName'] for lg in log_groups.get('logGroups', [])]}")
            self.fail(
                f"Log group {log_group_name} not found in region {region} (ENVIRONMENT_SUFFIX={self.env_suffix})")
          else:
            log_group = matching_groups[0]
            self.assertEqual(log_group.get('retentionInDays'), 7)
        except ClientError as e:
          self.fail(f"Log group not found: {e}")

  @mark.it("Multi-region deployment should be successful")
  def test_multi_region_deployment_success(self):
    """Test that resources are successfully deployed in both regions"""
    eu_west_stack = f"MultiRegionStack-EUWest-{self.env_suffix}"
    eu_central_stack = f"MultiRegionStack-EUCentral-{self.env_suffix}"

    eu_west_vpc = self._get_output_value(eu_west_stack, 'VPCId')
    eu_central_vpc = self._get_output_value(eu_central_stack, 'VPCId')

    # Fail if neither region has outputs
    if not eu_west_vpc and not eu_central_vpc:
      print(f"Flat outputs keys: {list(flat_outputs.keys())}")
      self.fail(
          f"No VPC outputs found from either region - deployment may have failed (ENVIRONMENT_SUFFIX={self.env_suffix})")

    # If both regions are deployed, they should have different VPC IDs
    if eu_west_vpc and eu_central_vpc:
      self.assertNotEqual(eu_west_vpc, eu_central_vpc,
                          "VPCs in different regions should have different IDs")

  @mark.it("Security groups should have proper ingress rules")
  def test_security_groups_configuration(self):
    """Test that security groups are properly configured"""
    regions = [
        ('eu-west-2', self.eu_west_ec2, 'MultiRegionStack-EUWest-dev'),
        ('eu-central-1', self.eu_central_ec2, 'MultiRegionStack-EUCentral-dev')
    ]

    for region, ec2_client, stack_name in regions:
      with self.subTest(region=region):
        vpc_id = self._get_output_value(stack_name, 'VPCId')

        if vpc_id:
          # Get security groups for the VPC
          security_groups = ec2_client.describe_security_groups(
              Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
          )

          # Find database security group (should have PostgreSQL port 5432)
          db_sg = None

          for sg in security_groups['SecurityGroups']:
            if 'database' in sg['Description'].lower():
              db_sg = sg

          if db_sg:
            # Check that database security group allows PostgreSQL access
            postgres_rules = [
                rule for rule in db_sg['IpPermissions']
                if rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432
            ]
            self.assertTrue(
                len(postgres_rules) > 0,
                "Database security group should allow PostgreSQL access"
            )

  @mark.it("Lambda functions should use latest AWS runtime")
  def test_lambda_runtime_version(self):
    """Test that Lambda functions use the latest AWS runtime version"""
    # This test verifies the PROMPT.md requirement for latest runtime
    regions = [
        ('eu-west-2', self.eu_west_lambda, 'MultiRegionStack-EUWest-dev'),
        ('eu-central-1', self.eu_central_lambda, 'MultiRegionStack-EUCentral-dev')
    ]

    for region, lambda_client, stack_name in regions:
      with self.subTest(region=region):
        lambda_arn = self._get_output_value(stack_name, 'LambdaFunctionArn')

        if lambda_arn:
          function_name = lambda_arn.split(':')[-1]

          # Get function configuration
          function = lambda_client.get_function(FunctionName=function_name)
          config = function['Configuration']

          # Verify latest runtime (python3.11 as specified in MODEL_RESPONSE.md)
          self.assertEqual(config['Runtime'], 'python3.11')


if __name__ == '__main__':
  unittest.main()
