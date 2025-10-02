import json
import os
import unittest
import time
import uuid
from typing import Dict, Any
import boto3
import requests
from botocore.exceptions import ClientError, BotoCoreError
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
class TestTapStack(unittest.TestCase):
    """Integration test cases for the deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and extract resource information from outputs"""
        cls.outputs = flat_outputs
        
        # Extract resource information from outputs
        cls.lambda_function_arn = cls.outputs.get('LambdaFunctionArn', '')
        cls.sns_topic_arn = cls.outputs.get('SNSTopicArn', '')
        cls.api_gateway_url_dev = cls.outputs.get('ApiGatewayUrlDev', '')
        cls.api_gateway_url_prod = cls.outputs.get('ApiGatewayUrlProd', '')
        cls.dynamodb_table_name = cls.outputs.get('DynamoDBTableName', '')
        cls.cloudwatch_dashboard_url = cls.outputs.get('CloudWatchDashboard', '')
        
        # Extract region and function name from ARN
        if cls.lambda_function_arn:
            arn_parts = cls.lambda_function_arn.split(':')
            cls.region = arn_parts[3] if len(arn_parts) > 3 else 'us-east-1'
            cls.function_name = arn_parts[-1] if len(arn_parts) > 0 else ''
        else:
            cls.region = 'us-east-1'
            cls.function_name = ''
        
        # Initialize AWS clients
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.dynamodb_resource = boto3.resource('dynamodb', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        
        # Test data
        cls.test_item_id = None
        cls.created_items = []

    def setUp(self):
        """Set up test data for each test"""
        self.maxDiff = None

    def tearDown(self):
        """Clean up test data after each test"""
        # Clean up any items created during testing
        if self.created_items and self.dynamodb_table_name:
            table = self.dynamodb_resource.Table(self.dynamodb_table_name)
            for item_id in self.created_items:
                try:
                    table.delete_item(Key={'itemId': item_id})
                except Exception:
                    pass  # Ignore cleanup errors
            self.created_items.clear()

    @mark.it("validates that all required outputs exist")
    def test_outputs_exist(self):
        """Test that all required stack outputs are present"""
        required_outputs = [
            'LambdaFunctionArn',
            'SNSTopicArn', 
            'ApiGatewayUrlDev',
            'ApiGatewayUrlProd',
            'DynamoDBTableName',
            'CloudWatchDashboard'
        ]
        
        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Missing required output: {output}")
            self.assertIsNotNone(self.outputs[output], f"Output {output} is None")
            self.assertNotEqual(self.outputs[output], '', f"Output {output} is empty")

    @mark.it("validates Lambda function exists and has correct configuration")
    def test_lambda_function_exists(self):
        """Test that the Lambda function exists with correct configuration"""
        try:
            response = self.lambda_client.get_function(FunctionName=self.function_name)
            
            # Validate function configuration
            config = response['Configuration']
            self.assertEqual(config['Runtime'], 'python3.9')
            self.assertEqual(config['Handler'], 'index.handler')
            self.assertEqual(config['Timeout'], 30)
            self.assertEqual(config['MemorySize'], 256)
            
            # Validate environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('DYNAMODB_TABLE_NAME', env_vars)
            self.assertEqual(env_vars['DYNAMODB_TABLE_NAME'], self.dynamodb_table_name)
            self.assertIn('ENVIRONMENT', env_vars)
            self.assertIn('PROJECT_NAME', env_vars)
            
            # Validate tracing is enabled
            tracing_config = config.get('TracingConfig', {})
            self.assertEqual(tracing_config.get('Mode'), 'Active')
            
        except ClientError as e:
            self.fail(f"Lambda function not found or error occurred: {e}")

    @mark.it("validates DynamoDB table exists with correct configuration")
    def test_dynamodb_table_exists(self):
        """Test that the DynamoDB table exists with correct configuration"""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)
            table_description = response['Table']
            
            # Validate table configuration
            self.assertEqual(table_description['TableStatus'], 'ACTIVE')
            
            # Validate provisioned throughput
            throughput = table_description['ProvisionedThroughput']
            self.assertEqual(throughput['ReadCapacityUnits'], 5)
            self.assertEqual(throughput['WriteCapacityUnits'], 5)
            
            # Validate key schema
            key_schema = table_description['KeySchema']
            self.assertEqual(len(key_schema), 1)
            self.assertEqual(key_schema[0]['AttributeName'], 'itemId')
            self.assertEqual(key_schema[0]['KeyType'], 'HASH')
            
            # Validate stream is enabled
            stream_spec = table_description.get('StreamSpecification', {})
            self.assertTrue(stream_spec.get('StreamEnabled', False))
            self.assertEqual(stream_spec.get('StreamViewType'), 'NEW_AND_OLD_IMAGES')
            
        except ClientError as e:
            self.fail(f"DynamoDB table not found or error occurred: {e}")


    @mark.it("validates CRUD operations through API Gateway")
    def test_api_crud_operations(self):
        """Test complete CRUD operations through the API"""
        base_url = self.api_gateway_url_dev
        
        # Test data
        test_item = {
            "name": "Test Item",
            "description": "Integration test item",
            "category": "testing"
        }
        
        # CREATE - POST /items
        create_response = requests.post(
            f"{base_url}/items",
            json=test_item,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        self.assertEqual(create_response.status_code, 201)
        
        created_data = create_response.json()
        self.assertIn('item', created_data)
        item_id = created_data['item']['itemId']
        self.created_items.append(item_id)  # Track for cleanup
        
        # READ - GET /items/{id}
        read_response = requests.get(f"{base_url}/items/{item_id}", timeout=30)
        self.assertEqual(read_response.status_code, 200)
        
        item_data = read_response.json()
        self.assertEqual(item_data['itemId'], item_id)
        self.assertEqual(item_data['name'], test_item['name'])
        
        # UPDATE - PUT /items/{id}
        updated_item = {"name": "Updated Test Item", "status": "updated"}
        update_response = requests.put(
            f"{base_url}/items/{item_id}",
            json=updated_item,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        self.assertEqual(update_response.status_code, 200)
        
        updated_data = update_response.json()
        self.assertIn('item', updated_data)
        self.assertEqual(updated_data['item']['name'], updated_item['name'])
        
        # LIST - GET /items
        list_response = requests.get(f"{base_url}/items", timeout=30)
        self.assertEqual(list_response.status_code, 200)
        
        list_data = list_response.json()
        self.assertIn('items', list_data)
        self.assertIn('count', list_data)
        
        # DELETE - DELETE /items/{id}
        delete_response = requests.delete(f"{base_url}/items/{item_id}", timeout=30)
        self.assertEqual(delete_response.status_code, 200)
        
        # Verify item is deleted
        verify_response = requests.get(f"{base_url}/items/{item_id}", timeout=30)
        self.assertEqual(verify_response.status_code, 404)
        
        # Remove from cleanup list since we already deleted it
        if item_id in self.created_items:
            self.created_items.remove(item_id)

    @mark.it("validates Lambda function can be invoked directly")
    def test_lambda_direct_invocation(self):
        """Test direct Lambda function invocation"""
        test_event = {
            "httpMethod": "GET",
            "path": "/items",
            "pathParameters": None,
            "body": None,
            "headers": {}
        }
        
        try:
            response = self.lambda_client.invoke(
                FunctionName=self.function_name,
                Payload=json.dumps(test_event)
            )
            
            self.assertEqual(response['StatusCode'], 200)
            
            # Parse response payload
            payload = json.loads(response['Payload'].read())
            self.assertEqual(payload['statusCode'], 200)
            
            # Parse body
            body = json.loads(payload['body'])
            self.assertIn('items', body)
            self.assertIn('count', body)
            
        except ClientError as e:
            self.fail(f"Error invoking Lambda function: {e}")

    @mark.it("validates DynamoDB direct operations")
    def test_dynamodb_direct_operations(self):
        """Test direct DynamoDB operations"""
        table = self.dynamodb_resource.Table(self.dynamodb_table_name)
        
        # Test item
        test_item_id = str(uuid.uuid4())
        test_item = {
            'itemId': test_item_id,
            'name': 'Direct DynamoDB Test',
            'description': 'Testing direct DynamoDB access',
            'createdAt': '2024-01-01T00:00:00.000Z',
            'updatedAt': '2024-01-01T00:00:00.000Z'
        }
        
        try:
            # PUT item
            table.put_item(Item=test_item)
            self.created_items.append(test_item_id)  # Track for cleanup
            
            # GET item
            response = table.get_item(Key={'itemId': test_item_id})
            self.assertIn('Item', response)
            
            retrieved_item = response['Item']
            self.assertEqual(retrieved_item['itemId'], test_item_id)
            self.assertEqual(retrieved_item['name'], test_item['name'])
            
            # SCAN table
            scan_response = table.scan()
            self.assertIn('Items', scan_response)
            
            # DELETE item
            table.delete_item(Key={'itemId': test_item_id})
            self.created_items.remove(test_item_id)  # Remove from cleanup list
            
            # Verify deletion
            verify_response = table.get_item(Key={'itemId': test_item_id})
            self.assertNotIn('Item', verify_response)
            
        except ClientError as e:
            self.fail(f"Error with direct DynamoDB operations: {e}")

    @mark.it("validates error handling for invalid requests")
    def test_error_handling(self):
        """Test API error handling for invalid requests"""
        base_url = self.api_gateway_url_dev
        
        # Test 404 for non-existent item
        response = requests.get(f"{base_url}/items/non-existent-id", timeout=30)
        self.assertEqual(response.status_code, 404)
        
        error_data = response.json()
        self.assertIn('error', error_data)
        
        # Test 400 for invalid POST request (empty body)
        response = requests.post(
            f"{base_url}/items",
            json={},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        self.assertEqual(response.status_code, 400)
        
        error_data = response.json()
        self.assertIn('error', error_data)

    @mark.it("validates performance and response times")
    def test_performance_benchmarks(self):
        """Test API performance benchmarks"""
        base_url = self.api_gateway_url_dev
        
        # Test response time for GET /items
        start_time = time.time()
        response = requests.get(f"{base_url}/items", timeout=30)
        end_time = time.time()
        
        self.assertEqual(response.status_code, 200)
        response_time = end_time - start_time
        
        # API should respond within 5 seconds
        self.assertLess(response_time, 5.0, 
                       f"API response time {response_time:.2f}s exceeds 5s threshold")

    @mark.it("validates resource tagging")
    def test_resource_tagging(self):
        """Test that resources have proper tags applied"""
        # Check Lambda function tags
        try:
            lambda_tags = self.lambda_client.list_tags(Resource=self.lambda_function_arn)
            tags = lambda_tags.get('Tags', {})
            
            expected_tags = ['Project', 'Environment', 'Owner', 'ManagedBy', 'CostCenter']
            for tag_key in expected_tags:
                self.assertIn(tag_key, tags, f"Missing tag: {tag_key}")
                
        except ClientError as e:
            self.fail(f"Error retrieving Lambda function tags: {e}")


if __name__ == "__main__":
    unittest.main()
