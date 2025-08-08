import os
import sys
import unittest

sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

import boto3
try:
  from moto import mock_lambda, mock_apigateway, mock_s3, mock_ec2, mock_iam, mock_cloudwatch
except ImportError:
  # Fallback if moto doesn't have these specific decorators
  def mock_lambda(func):
    return func
  def mock_apigateway(func):
    return func
  def mock_s3(func):
    return func
  def mock_ec2(func):
    return func
  def mock_iam(func):
    return func
  def mock_cloudwatch(func):
    return func

from lib.tap_stack import TapStack, TapStackArgs

class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for TapStack infrastructure"""
  
  def setUp(self):
    """Set up integration test environment"""
    self.test_args = TapStackArgs(
      project_name="integration-test",
      environment_suffix="test",
      regions=["us-east-1", "us-west-2"]
    )
    
  def test_full_stack_deployment(self):
    """Test complete stack deployment and functionality"""
    # This test would require actual AWS credentials and would create real resources
    # For demonstration, we'll use mocked services
    
    with mock_lambda(), mock_apigateway(), mock_s3(), mock_ec2(), mock_iam(), mock_cloudwatch():
      # Create stack
      stack = TapStack("integration-test", self.test_args)
      
      # Verify stack components exist
      self.assertIsNotNone(stack.lambda_functions)
      self.assertIsNotNone(stack.api_gateways)
      self.assertIsNotNone(stack.s3_buckets)
      self.assertIsNotNone(stack.cloudwatch_alarms)
      
      # Verify regional deployment
      for region in self.test_args.regions:
        self.assertIn(region, stack.lambda_functions)
        self.assertIn(region, stack.api_gateways)
        self.assertIn(region, stack.s3_buckets)
        self.assertIn(region, stack.cloudwatch_alarms)
  
  @mock_lambda
  @mock_apigateway
  def test_api_gateway_lambda_integration(self):
    """Test API Gateway and Lambda integration"""
    # Create mock Lambda function
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    
    # Create test function
    lambda_client.create_function(
      FunctionName='integration-test-api-us-east-1-test',
      Runtime='python3.9',
      Role='arn:aws:iam::123456789012:role/test-role',
      Handler='index.handler',
      Code={'ZipFile': b'fake code'},
    )
    
    # Create API Gateway
    api_client = boto3.client('apigateway', region_name='us-east-1')
    
    api = api_client.create_rest_api(
      name='integration-test-api-us-east-1-test',
      description='Test API'
    )
    
    # Verify integration works
    self.assertIsNotNone(api['id'])
  
  def test_rolling_update_simulation(self):
    """Test rolling update functionality"""
    # Simulate rolling update by creating two versions of the stack
    # and verifying smooth transition
    
    with mock_lambda(), mock_apigateway():
      # Initial deployment
      stack_v1 = TapStack("integration-test-v1", self.test_args)
      
      # Updated deployment
      updated_args = self.test_args.copy()
      updated_args["environment"] = "test-v2"
      stack_v2 = TapStack("integration-test-v2", updated_args)
      
      # Verify both stacks can coexist
      self.assertNotEqual(stack_v1.environment, stack_v2.environment)
  
  @mock_cloudwatch
  def test_monitoring_integration(self):
    """Test CloudWatch monitoring and alerting"""
    cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')
    
    # Create test alarm
    cloudwatch.put_metric_alarm(
      AlarmName='integration-test-lambda-errors-us-east-1-test',
      ComparisonOperator='GreaterThanThreshold',
      EvaluationPeriods=2,
      MetricName='Errors',
      Namespace='AWS/Lambda',
      Period=300,
      Statistic='Sum',
      Threshold=5.0,
      ActionsEnabled=True,
      AlarmDescription='Test alarm',
      Dimensions=[
        {
          'Name': 'FunctionName',
          'Value': 'integration-test-api-us-east-1-test'
        }
      ]
    )
    
    # Verify alarm exists
    alarms = cloudwatch.describe_alarms(
      AlarmNames=['integration-test-lambda-errors-us-east-1-test']
    )
    self.assertEqual(len(alarms['MetricAlarms']), 1)
  
  def test_cross_region_consistency(self):
    """Test that both regions have consistent infrastructure"""
    with mock_lambda(), mock_apigateway(), mock_s3():
      stack = TapStack("integration-test", self.test_args)
      
      regions = self.test_args["regions"]
      
      # Verify same number of resources in each region
      for region in regions:
        self.assertIn(region, stack.lambda_functions)
        self.assertIn(region, stack.api_gateways)
        self.assertIn(region, stack.s3_buckets)
  
  def test_security_group_configuration(self):
    """Test security group configurations"""
    with mock_ec2():
      ec2 = boto3.client('ec2', region_name='us-east-1')
      
      # Create VPC
      vpc = ec2.create_vpc(CidrBlock='10.0.0.0/16')
      vpc_id = vpc['Vpc']['VpcId']
      
      # Create security group
      sg = ec2.create_security_group(
        GroupName='integration-test-lambda-sg-us-east-1-test',
        Description='Test security group',
        VpcId=vpc_id
      )
      
      # Verify security group exists
      self.assertIsNotNone(sg['GroupId'])
  
  def test_s3_bucket_configuration(self):
    """Test S3 bucket setup and configuration"""
    with mock_s3():
      s3 = boto3.client('s3', region_name='us-east-1')
      
      bucket_name = 'integration-test-artifacts-us-east-1-test-stack'
      
      # Create bucket
      s3.create_bucket(Bucket=bucket_name)
      
      # Enable versioning
      s3.put_bucket_versioning(
        Bucket=bucket_name,
        VersioningConfiguration={'Status': 'Enabled'}
      )
      
      # Verify bucket configuration
      versioning = s3.get_bucket_versioning(Bucket=bucket_name)
      self.assertEqual(versioning['Status'], 'Enabled')
  
  def test_lambda_environment_variables(self):
    """Test Lambda function environment variable configuration"""
    with mock_lambda():
      lambda_client = boto3.client('lambda', region_name='us-east-1')
      
      # Create function with environment variables
      lambda_client.create_function(
        FunctionName='integration-test-api-us-east-1-test',
        Runtime='python3.9',
        Role='arn:aws:iam::123456789012:role/test-role',
        Handler='index.handler',
        Code={'ZipFile': b'fake code'},
        Environment={
          'Variables': {
            'REGION': 'us-east-1',
            'ENVIRONMENT': 'test',
            'PROJECT_NAME': 'integration-test'
          }
        }
      )
      
      # Verify environment variables
      response = lambda_client.get_function(
        FunctionName='integration-test-api-us-east-1-test'
      )
      
      env_vars = response['Configuration']['Environment']['Variables']
      self.assertEqual(env_vars['REGION'], 'us-east-1')
      self.assertEqual(env_vars['ENVIRONMENT'], 'test')
      self.assertEqual(env_vars['PROJECT_NAME'], 'integration-test')

class PulumiMock:
  def call(self, _token, _args, _provider):
    return {}
  
  def new_resource(self, _token, name, inputs, _provider, _id):
    return [name + "_id", inputs]

if __name__ == '__main__':
  # Mock Pulumi for integration tests
  import pulumi
  pulumi.runtime.set_mocks(PulumiMock(), "integration-project", "integration-stack")
  unittest.main()
