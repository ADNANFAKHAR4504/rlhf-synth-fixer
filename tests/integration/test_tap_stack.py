import json
import os
import unittest
import boto3
import requests
from pytest import mark
from botocore.exceptions import ClientError

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = f.read()
else:
  flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
  """Integration test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up AWS clients for each test"""
    self.dynamodb = boto3.resource('dynamodb')
    self.lambda_client = boto3.client('lambda')
    self.apigateway = boto3.client('apigateway')
    self.cloudwatch = boto3.client('cloudwatch')
    
  @mark.it("DynamoDB table exists and is accessible")
  def test_dynamodb_table_exists(self):
    """Test that DynamoDB table exists and has correct configuration"""
    table_name = flat_outputs.get('DynamoTableNameOutput')
    if not table_name:
      self.skipTest("DynamoDB table name not available in deployment outputs")
    
    try:
      table = self.dynamodb.Table(table_name)
      # Check table exists by calling describe
      table_info = table.meta.client.describe_table(TableName=table_name)
      
      # Verify table configuration
      self.assertEqual(table_info['Table']['BillingMode'], 'PAY_PER_REQUEST')
      self.assertEqual(table_info['Table']['KeySchema'][0]['AttributeName'], 'itemId')
      self.assertEqual(table_info['Table']['KeySchema'][0]['KeyType'], 'HASH')
      
    except ClientError as e:
      self.fail(f"DynamoDB table {table_name} not accessible: {e}")

  @mark.it("Lambda function exists and is properly configured")
  def test_lambda_function_exists(self):
    """Test that Lambda function exists with correct configuration"""
    function_name = flat_outputs.get('LambdaFunctionNameOutput')
    if not function_name:
      self.skipTest("Lambda function name not available in deployment outputs")
    
    try:
      response = self.lambda_client.get_function(FunctionName=function_name)
      
      # Verify function configuration
      config = response['Configuration']
      self.assertEqual(config['Runtime'], 'python3.9')
      self.assertEqual(config['Handler'], 'handler.handler')
      self.assertIn('TABLE_NAME', config['Environment']['Variables'])
      
    except ClientError as e:
      self.fail(f"Lambda function {function_name} not accessible: {e}")

  @mark.it("API Gateway exists and is accessible")
  def test_api_gateway_exists(self):
    """Test that API Gateway exists and is properly configured"""
    api_id = flat_outputs.get('ApiGatewayIdOutput')
    if not api_id:
      self.skipTest("API Gateway ID not available in deployment outputs")
    
    try:
      response = self.apigateway.get_rest_api(restApiId=api_id)
      self.assertEqual(response['name'], 'Item Service')
      
      # Check that the /item resource exists
      resources = self.apigateway.get_resources(restApiId=api_id)
      item_resource = None
      for resource in resources['items']:
        if resource['pathPart'] == 'item':
          item_resource = resource
          break
      
      self.assertIsNotNone(item_resource, "API Gateway /item resource not found")
      
    except ClientError as e:
      self.fail(f"API Gateway {api_id} not accessible: {e}")

  @mark.it("CloudWatch alarm exists")
  def test_cloudwatch_alarm_exists(self):
    """Test that CloudWatch alarm exists for Lambda errors"""
    alarm_name = flat_outputs.get('AlarmNameOutput')
    if not alarm_name:
      self.skipTest("CloudWatch alarm name not available in deployment outputs")
    
    try:
      response = self.cloudwatch.describe_alarms(AlarmNames=[alarm_name])
      self.assertEqual(len(response['MetricAlarms']), 1)
      
      alarm = response['MetricAlarms'][0]
      self.assertEqual(alarm['MetricName'], 'Errors')
      self.assertEqual(alarm['Threshold'], 1.0)
      self.assertEqual(alarm['EvaluationPeriods'], 1)
      
    except ClientError as e:
      self.fail(f"CloudWatch alarm {alarm_name} not accessible: {e}")

  @mark.it("End-to-end API workflow works")
  def test_api_end_to_end(self):
    """Test complete end-to-end workflow: API Gateway -> Lambda -> DynamoDB"""
    api_url = flat_outputs.get('ApiGatewayUrlOutput')
    if not api_url:
      self.skipTest("API Gateway URL not available in deployment outputs")
    
    # Make sure URL ends with item endpoint
    if not api_url.endswith('/'):
      api_url += '/'
    api_url += 'item'
    
    try:
      # Make GET request to API Gateway
      response = requests.get(api_url, timeout=30)
      
      # Check response status
      self.assertEqual(response.status_code, 200)
      
      # Check response content
      response_data = response.json()
      self.assertIn('message', response_data)
      self.assertIn('itemId', response_data)
      self.assertIn('tableName', response_data)
      
      # Verify that item was actually created in DynamoDB
      table_name = flat_outputs.get('DynamoTableNameOutput')
      if table_name:
        table = self.dynamodb.Table(table_name)
        item_id = response_data['itemId']
        
        # Check if item exists in DynamoDB
        db_response = table.get_item(Key={'itemId': item_id})
        self.assertIn('Item', db_response, "Item not found in DynamoDB")
        self.assertEqual(db_response['Item']['itemId'], item_id)
      
    except requests.RequestException as e:
      self.fail(f"API Gateway request failed: {e}")
    except ClientError as e:
      self.fail(f"DynamoDB verification failed: {e}")

  @mark.it("VPC and networking configuration")
  def test_vpc_configuration(self):
    """Test that VPC and networking are properly configured"""
    vpc_id = flat_outputs.get('VpcIdOutput')
    if not vpc_id:
      self.skipTest("VPC ID not available in deployment outputs")
    
    ec2 = boto3.client('ec2')
    
    try:
      # Verify VPC exists
      vpcs = ec2.describe_vpcs(VpcIds=[vpc_id])
      self.assertEqual(len(vpcs['Vpcs']), 1)
      
      # Check that VPC has public subnets
      subnets = ec2.describe_subnets(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
      )
      public_subnets = [s for s in subnets['Subnets'] if s.get('MapPublicIpOnLaunch', False)]
      self.assertGreaterEqual(len(public_subnets), 2, "VPC should have at least 2 public subnets")
      
    except ClientError as e:
      self.fail(f"VPC configuration check failed: {e}")
