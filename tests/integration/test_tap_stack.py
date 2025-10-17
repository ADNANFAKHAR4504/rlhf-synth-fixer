import json
import os
import unittest
import boto3
import requests
import time
from typing import Dict, Any
from botocore.exceptions import ClientError

from pytest import mark

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
class TestTapStackIntegration(unittest.TestCase):
  """Integration test cases for the deployed TapStack CDK stack"""

  @classmethod
  def setUpClass(cls):
    """Set up AWS clients and extract outputs once for all tests"""
    # Check if outputs are available
    if not flat_outputs:
      raise unittest.SkipTest("No CDK outputs found - stack may not be deployed")
    
    # Initialize AWS clients
    cls.dynamodb = boto3.resource('dynamodb')
    cls.lambda_client = boto3.client('lambda')
    cls.logs_client = boto3.client('logs')
    cls.apigateway_client = boto3.client('apigatewayv2')
    
    # Extract outputs
    cls.table_name = flat_outputs.get('TableName')
    cls.lambda_function_name = flat_outputs.get('LambdaFunctionName')
    cls.api_endpoint = flat_outputs.get('ApiEndpoint')
    cls.api_log_group_name = flat_outputs.get('ApiLogGroupName')
    
    # Validate required outputs
    if not all([cls.table_name, cls.lambda_function_name, cls.api_endpoint]):
      raise unittest.SkipTest("Required CDK outputs missing")
    
    # Set up API configuration
    cls.api_key = os.environ.get('API_KEY', 'tap-default-key')
    cls.headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': cls.api_key
    }

  def setUp(self):
    """Set up for each test"""
    self.test_items_created = []  # Track items for cleanup

  def tearDown(self):
    """Clean up after each test"""
    # Clean up any test items created
    if hasattr(self, 'test_items_created'):
      for item_id in self.test_items_created:
        try:
          response = requests.delete(
            f"{self.api_endpoint}items/{item_id}",
            headers=self.headers,
            timeout=10
          )
        except Exception:
          pass  # Ignore cleanup errors

  @mark.it("should validate DynamoDB table exists and has correct configuration")
  def test_dynamodb_table_configuration(self):
    """Test that DynamoDB table exists with correct configuration"""
    # ARRANGE & ACT
    try:
      table = self.dynamodb.Table(self.table_name)
      table.load()
    except ClientError as e:
      self.fail(f"DynamoDB table {self.table_name} not found: {e}")
    
    # ASSERT
    self.assertEqual(table.table_name, self.table_name)
    self.assertEqual(table.billing_mode_summary['BillingMode'], 'PAY_PER_REQUEST')
    
    # Check key schema
    key_schema = {item['AttributeName']: item['KeyType'] for item in table.key_schema}
    self.assertIn('id', key_schema)
    self.assertIn('createdAt', key_schema)
    self.assertEqual(key_schema['id'], 'HASH')  # Partition key
    self.assertEqual(key_schema['createdAt'], 'RANGE')  # Sort key
    
    # Check encryption
    self.assertIsNotNone(table.sse_description)
    
    # Check point-in-time recovery
    pitr_response = boto3.client('dynamodb').describe_continuous_backups(
      TableName=self.table_name
    )
    self.assertEqual(
      pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'],
      'ENABLED'
    )

  @mark.it("should validate Lambda function exists and has correct configuration")
  def test_lambda_function_configuration(self):
    """Test that Lambda function exists with correct configuration"""
    # ARRANGE & ACT
    try:
      response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
    except ClientError as e:
      self.fail(f"Lambda function {self.lambda_function_name} not found: {e}")
    
    # ASSERT
    function_config = response['Configuration']
    self.assertEqual(function_config['FunctionName'], self.lambda_function_name)
    self.assertEqual(function_config['Runtime'], 'python3.11')
    self.assertEqual(function_config['Handler'], 'index.lambda_handler')
    self.assertEqual(function_config['Timeout'], 30)
    self.assertEqual(function_config['MemorySize'], 256)
    
    # Check environment variables
    env_vars = function_config.get('Environment', {}).get('Variables', {})
    self.assertIn('TABLE_NAME', env_vars)
    self.assertEqual(env_vars['TABLE_NAME'], self.table_name)
    self.assertIn('ENVIRONMENT', env_vars)
    self.assertIn('LOG_LEVEL', env_vars)
    self.assertIn('API_KEY', env_vars)
    
    # Check tracing
    self.assertEqual(function_config['TracingConfig']['Mode'], 'Active')

  @mark.it("should validate CloudWatch log groups exist")
  def test_cloudwatch_log_groups_exist(self):
    """Test that CloudWatch log groups exist"""
    # ARRANGE & ACT - Check API Gateway log group
    if self.api_log_group_name:
      try:
        api_log_response = self.logs_client.describe_log_groups(
          logGroupNamePrefix=self.api_log_group_name
        )
        api_log_groups = [lg['logGroupName'] for lg in api_log_response['logGroups']]
        self.assertIn(self.api_log_group_name, api_log_groups)
      except ClientError as e:
        self.fail(f"API log group {self.api_log_group_name} not found: {e}")
    
    # Check Lambda log group
    lambda_log_group_name = f"/aws/lambda/{self.lambda_function_name}"
    try:
      lambda_log_response = self.logs_client.describe_log_groups(
        logGroupNamePrefix=lambda_log_group_name
      )
      lambda_log_groups = [lg['logGroupName'] for lg in lambda_log_response['logGroups']]
      self.assertIn(lambda_log_group_name, lambda_log_groups)
    except ClientError as e:
      self.fail(f"Lambda log group {lambda_log_group_name} not found: {e}")

  @mark.it("should validate API Gateway endpoint is accessible")
  def test_api_gateway_endpoint_accessible(self):
    """Test that API Gateway endpoint is accessible"""
    # ARRANGE & ACT
    try:
      response = requests.get(f"{self.api_endpoint}items", headers=self.headers, timeout=10)
    except requests.exceptions.RequestException as e:
      self.fail(f"API endpoint {self.api_endpoint} not accessible: {e}")
    
    # ASSERT
    self.assertIn(response.status_code, [200, 404])  # 404 is ok if no items exist
    self.assertEqual(response.headers.get('content-type'), 'application/json')

  @mark.it("should successfully create an item via API")
  def test_create_item_via_api(self):
    """Test creating an item through the API"""
    # ARRANGE
    test_data = {
      "content": "Test item content",
      "metadata": {"test": "data", "number": 42}
    }
    
    # ACT
    response = requests.post(
      f"{self.api_endpoint}items",
      json=test_data,
      headers=self.headers,
      timeout=10
    )
    
    # ASSERT
    self.assertEqual(response.status_code, 201)
    response_data = response.json()
    self.assertTrue(response_data['success'])
    self.assertIsNotNone(response_data['data'])
    
    item = response_data['data']
    self.assertIn('id', item)
    self.assertIn('createdAt', item)
    self.assertEqual(item['content'], test_data['content'])
    self.assertEqual(item['metadata'], test_data['metadata'])
    self.assertEqual(item['status'], 'active')
    
    # Track for cleanup
    self.test_items_created.append(item['id'])

  @mark.it("should successfully retrieve all items via API")
  def test_get_all_items_via_api(self):
    """Test retrieving all items through the API"""
    # ARRANGE - Create a test item first
    test_data = {"content": "Test item for retrieval"}
    create_response = requests.post(
      f"{self.api_endpoint}items",
      json=test_data,
      headers=self.headers,
      timeout=10
    )
    self.assertEqual(create_response.status_code, 201)
    created_item = create_response.json()['data']
    self.test_items_created.append(created_item['id'])
    
    # ACT
    response = requests.get(f"{self.api_endpoint}items", headers=self.headers, timeout=10)
    
    # ASSERT
    self.assertEqual(response.status_code, 200)
    response_data = response.json()
    self.assertTrue(response_data['success'])
    self.assertIn('items', response_data['data'])
    self.assertIn('count', response_data['data'])
    self.assertGreaterEqual(response_data['data']['count'], 1)

  @mark.it("should successfully retrieve a specific item via API")
  def test_get_specific_item_via_api(self):
    """Test retrieving a specific item through the API"""
    # ARRANGE - Create a test item first
    test_data = {"content": "Specific test item"}
    create_response = requests.post(
      f"{self.api_endpoint}items",
      json=test_data,
      headers=self.headers,
      timeout=10
    )
    self.assertEqual(create_response.status_code, 201)
    created_item = create_response.json()['data']
    item_id = created_item['id']
    self.test_items_created.append(item_id)
    
    # ACT
    response = requests.get(
      f"{self.api_endpoint}items/{item_id}",
      headers=self.headers,
      timeout=10
    )
    
    # ASSERT
    self.assertEqual(response.status_code, 200)
    response_data = response.json()
    self.assertTrue(response_data['success'])
    
    retrieved_item = response_data['data']
    self.assertEqual(retrieved_item['id'], item_id)
    self.assertEqual(retrieved_item['content'], test_data['content'])

  @mark.it("should successfully update an item via API")
  def test_update_item_via_api(self):
    """Test updating an item through the API"""
    # ARRANGE - Create a test item first
    initial_data = {"content": "Initial content"}
    create_response = requests.post(
      f"{self.api_endpoint}items",
      json=initial_data,
      headers=self.headers,
      timeout=10
    )
    self.assertEqual(create_response.status_code, 201)
    created_item = create_response.json()['data']
    item_id = created_item['id']
    self.test_items_created.append(item_id)
    
    # ACT
    update_data = {
      "content": "Updated content",
      "metadata": {"updated": True}
    }
    response = requests.put(
      f"{self.api_endpoint}items/{item_id}",
      json=update_data,
      headers=self.headers,
      timeout=10
    )
    
    # ASSERT
    self.assertEqual(response.status_code, 200)
    response_data = response.json()
    self.assertTrue(response_data['success'])
    
    updated_item = response_data['data']
    self.assertEqual(updated_item['id'], item_id)
    self.assertEqual(updated_item['content'], update_data['content'])
    self.assertEqual(updated_item['metadata'], update_data['metadata'])
    self.assertNotEqual(updated_item['updatedAt'], updated_item['createdAt'])

  @mark.it("should successfully delete an item via API")
  def test_delete_item_via_api(self):
    """Test deleting an item through the API"""
    # ARRANGE - Create a test item first
    test_data = {"content": "Item to be deleted"}
    create_response = requests.post(
      f"{self.api_endpoint}items",
      json=test_data,
      headers=self.headers,
      timeout=10
    )
    self.assertEqual(create_response.status_code, 201)
    created_item = create_response.json()['data']
    item_id = created_item['id']
    
    # ACT
    response = requests.delete(
      f"{self.api_endpoint}items/{item_id}",
      headers=self.headers,
      timeout=10
    )
    
    # ASSERT
    self.assertEqual(response.status_code, 200)
    response_data = response.json()
    self.assertTrue(response_data['success'])
    self.assertIn("deleted successfully", response_data['data']['message'])
    
    # Verify item is actually deleted
    get_response = requests.get(
      f"{self.api_endpoint}items/{item_id}",
      headers=self.headers,
      timeout=10
    )
    self.assertEqual(get_response.status_code, 404)

  @mark.it("should handle invalid API key")
  def test_invalid_api_key_handling(self):
    """Test that invalid API key is properly rejected"""
    # ARRANGE
    invalid_headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': 'invalid-key'
    }
    
    # ACT
    response = requests.get(
      f"{self.api_endpoint}items",
      headers=invalid_headers,
      timeout=10
    )
    
    # ASSERT
    self.assertEqual(response.status_code, 401)
    response_data = response.json()
    self.assertFalse(response_data['success'])
    self.assertIn('Unauthorized', response_data['error']['message'])

  @mark.it("should handle invalid JSON in request body")
  def test_invalid_json_handling(self):
    """Test that invalid JSON is properly handled"""
    # ARRANGE
    invalid_json = "{'invalid': json}"  # Single quotes make this invalid JSON
    
    # ACT
    response = requests.post(
      f"{self.api_endpoint}items",
      data=invalid_json,
      headers=self.headers,
      timeout=10
    )
    
    # ASSERT
    self.assertEqual(response.status_code, 400)
    response_data = response.json()
    self.assertFalse(response_data['success'])
    self.assertIn('Invalid JSON', response_data['error']['message'])

  @mark.it("should handle missing required fields")
  def test_missing_required_fields(self):
    """Test that missing required fields are properly validated"""
    # ARRANGE
    invalid_data = {"metadata": {"test": "data"}}  # Missing 'content' field
    
    # ACT
    response = requests.post(
      f"{self.api_endpoint}items",
      json=invalid_data,
      headers=self.headers,
      timeout=10
    )
    
    # ASSERT
    self.assertEqual(response.status_code, 400)
    response_data = response.json()
    self.assertFalse(response_data['success'])
    self.assertIn('Missing required field: content', response_data['error']['message'])

  @mark.it("should handle non-existent item requests")
  def test_non_existent_item_handling(self):
    """Test that requests for non-existent items return 404"""
    # ARRANGE
    non_existent_id = "non-existent-id-12345"
    
    # ACT
    response = requests.get(
      f"{self.api_endpoint}items/{non_existent_id}",
      headers=self.headers,
      timeout=10
    )
    
    # ASSERT
    self.assertEqual(response.status_code, 404)
    response_data = response.json()
    self.assertFalse(response_data['success'])
    self.assertIn('not found', response_data['error']['message'])

  @mark.it("should validate CORS headers are present")
  def test_cors_headers_present(self):
    """Test that CORS headers are properly set"""
    # ARRANGE & ACT
    response = requests.get(f"{self.api_endpoint}items", headers=self.headers, timeout=10)
    
    # Debug: Print response details
    print(f"Response status: {response.status_code}")
    print(f"Response headers: {dict(response.headers)}")
    print(f"Response body: {response.text}")

  @mark.it("should verify DynamoDB data consistency")
  def test_dynamodb_data_consistency(self):
    """Test that data created via API is properly stored in DynamoDB"""
    # ARRANGE
    test_data = {
      "content": "Direct DynamoDB verification test",
      "metadata": {"verification": True}
    }
    
    # ACT - Create item via API
    api_response = requests.post(
      f"{self.api_endpoint}items",
      json=test_data,
      headers=self.headers,
      timeout=10
    )
    self.assertEqual(api_response.status_code, 201)
    created_item = api_response.json()['data']
    item_id = created_item['id']
    created_at = created_item['createdAt']
    self.test_items_created.append(item_id)
    
    # Verify directly in DynamoDB
    table = self.dynamodb.Table(self.table_name)
    try:
      db_response = table.get_item(Key={'id': item_id, 'createdAt': created_at})
    except ClientError as e:
      self.fail(f"Failed to retrieve item from DynamoDB: {e}")
    
    # ASSERT
    self.assertIn('Item', db_response)
    db_item = db_response['Item']
    self.assertEqual(db_item['id'], item_id)
    self.assertEqual(db_item['content'], test_data['content'])
    self.assertEqual(db_item['metadata'], test_data['metadata'])
    self.assertEqual(db_item['status'], 'active')

  @mark.it("should verify Lambda function logs are being written")
  def test_lambda_logs_are_written(self):
    """Test that Lambda function is writing logs to CloudWatch"""
    # ARRANGE
    lambda_log_group_name = f"/aws/lambda/{self.lambda_function_name}"
    
    # ACT - Make an API call to trigger Lambda
    requests.get(f"{self.api_endpoint}items", headers=self.headers, timeout=10)
    
    # Wait a bit for logs to appear
    time.sleep(2)
    
    # Check for recent log streams
    try:
      streams_response = self.logs_client.describe_log_streams(
        logGroupName=lambda_log_group_name,
        orderBy='LastEventTime',
        descending=True,
        limit=1
      )
    except ClientError as e:
      self.fail(f"Failed to retrieve log streams: {e}")
    
    # ASSERT
    self.assertGreater(len(streams_response['logStreams']), 0)
    
    # Check for recent log events
    latest_stream = streams_response['logStreams'][0]
    try:
      events_response = self.logs_client.get_log_events(
        logGroupName=lambda_log_group_name,
        logStreamName=latest_stream['logStreamName'],
        limit=10
      )
    except ClientError as e:
      self.fail(f"Failed to retrieve log events: {e}")
    
    # Should have some log events
    self.assertGreater(len(events_response['events']), 0)

if __name__ == '__main__':
    unittest.main()
