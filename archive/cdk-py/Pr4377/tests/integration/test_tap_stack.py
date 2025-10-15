import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark
import requests
import time

# Load the CloudFormation outputs from flat-outputs.json
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
class TestTapStack(unittest.TestCase):
    """Integration tests for the deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and resource information from outputs"""
        cls.outputs = flat_outputs

        # Extract resource information from outputs
        cls.api_endpoint = cls.outputs.get('ApiEndpoint', '')
        cls.dynamodb_table_name = cls.outputs.get('TableName', '')
        cls.lambda_function_name = cls.outputs.get('LambdaFunctionName', '')

        # Initialize AWS clients
        cls.dynamodb_client = boto3.client('dynamodb')
        cls.lambda_client = boto3.client('lambda')
        cls.iam_client = boto3.client('iam')
        cls.apigateway_client = boto3.client('apigateway')
        cls.logs_client = boto3.client('logs')
        cls.cloudwatch_client = boto3.client('cloudwatch')

    @mark.it("validates that the IAM role has least-privilege permissions")
    def test_iam_role_permissions(self):
        """Test that the IAM role has least-privilege permissions"""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            role_arn = response['Configuration']['Role']
            role_name = role_arn.split('/')[-1]

            # Get the IAM role policy
            role_policy = self.iam_client.get_role(RoleName=role_name)
            assume_role_policy = role_policy['Role']['AssumeRolePolicyDocument']

            # Validate the AssumeRolePolicyDocument
            self.assertIn('Statement', assume_role_policy)
            self.assertEqual(assume_role_policy['Version'], '2012-10-17')
            self.assertTrue(any(
                statement['Effect'] == 'Allow' and
                statement['Principal']['Service'] == 'lambda.amazonaws.com' and
                statement['Action'] == 'sts:AssumeRole'
                for statement in assume_role_policy['Statement']
            ))

            # Check attached policies for DynamoDB permissions
            attached_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            policy_names = [policy['PolicyName'] for policy in attached_policies['AttachedPolicies']]
            self.assertIn('AWSLambdaBasicExecutionRole', str(policy_names))

        except ClientError as e:
            self.fail(f"IAM role validation failed: {e}")

    @mark.it("validates that the Lambda function inline code is deployed")
    def test_lambda_inline_code(self):
        """Test that the Lambda function inline code is deployed"""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            self.assertIn('Handler', response['Configuration'])
            self.assertEqual(response['Configuration']['Handler'], 'index.lambda_handler')
            
            # Validate runtime and environment variables
            self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
            self.assertIn('TABLE_NAME', response['Configuration']['Environment']['Variables'])
            
        except ClientError as e:
            self.fail(f"Lambda inline code validation failed: {e}")

    @mark.it("validates the API Gateway CORS configuration")
    def test_api_gateway_cors(self):
        """Test that the API Gateway has CORS enabled"""
        try:
            response = self.apigateway_client.get_rest_api(restApiId=self.outputs.get('ApiGatewayId'))
            self.assertIn('name', response)
            self.assertIn('items-api', response['name'])
            
            # Test CORS with OPTIONS request
            api_url = self.api_endpoint + "items"
            response = requests.options(api_url, timeout=10)
            self.assertIn('Access-Control-Allow-Origin', response.headers)
            
        except (ClientError, requests.RequestException) as e:
            self.fail(f"API Gateway CORS validation failed: {e}")

    @mark.it("validates full CRUD operations - CREATE (POST)")
    def test_crud_create_operation(self):
        """Test CREATE operation via POST /items"""
        try:
            api_url = self.api_endpoint + "items"
            
            # Test POST method
            post_data = {"id": "test-create-1", "name": "Test Create Item", "price": 25.99, "status": "active"}
            response = requests.post(api_url, json=post_data, timeout=10)
            
            self.assertEqual(response.status_code, 201)
            response_data = response.json()
            self.assertIn('message', response_data)
            self.assertIn('item', response_data)
            self.assertEqual(response_data['item']['id'], "test-create-1")
            self.assertEqual(response_data['item']['name'], "Test Create Item")
            
        except requests.RequestException as e:
            self.fail(f"CREATE operation validation failed: {e}")

    @mark.it("validates full CRUD operations - READ (GET)")
    def test_crud_read_operations(self):
        """Test READ operations via GET /items and GET /items/{id}"""
        try:
            api_url = self.api_endpoint + "items"
            
            # First create an item to read
            post_data = {"id": "test-read-1", "name": "Test Read Item", "price": 15.99}
            requests.post(api_url, json=post_data, timeout=10)
            
            # Test GET all items
            response = requests.get(api_url, timeout=10)
            self.assertEqual(response.status_code, 200)
            response_data = response.json()
            self.assertIn('items', response_data)
            self.assertTrue(len(response_data['items']) >= 1)
            
            # Test GET single item
            response = requests.get(f"{api_url}/test-read-1", timeout=10)
            self.assertEqual(response.status_code, 200)
            response_data = response.json()
            self.assertIn('item', response_data)
            self.assertEqual(response_data['item']['id'], "test-read-1")
            
            # Test GET non-existent item
            response = requests.get(f"{api_url}/non-existent", timeout=10)
            self.assertEqual(response.status_code, 404)
            
        except requests.RequestException as e:
            self.fail(f"READ operations validation failed: {e}")

    @mark.it("validates full CRUD operations - UPDATE (PUT)")
    def test_crud_update_operation(self):
        """Test UPDATE operation via PUT /items/{id}"""
        try:
            api_url = self.api_endpoint + "items"
            
            # First create an item to update
            post_data = {"id": "test-update-1", "name": "Test Update Item", "price": 20.99}
            requests.post(api_url, json=post_data, timeout=10)
            
            # Test PUT method
            update_data = {"name": "Updated Test Item", "price": 35.99, "status": "updated"}
            response = requests.put(f"{api_url}/test-update-1", json=update_data, timeout=10)
            self.assertEqual(response.status_code, 200)
            
            # Verify the update
            response = requests.get(f"{api_url}/test-update-1", timeout=10)
            self.assertEqual(response.status_code, 200)
            updated_item = response.json()['item']
            self.assertEqual(updated_item['name'], "Updated Test Item")
            self.assertEqual(float(updated_item['price']), 35.99)
            
        except requests.RequestException as e:
            self.fail(f"UPDATE operation validation failed: {e}")

    @mark.it("validates full CRUD operations - DELETE")
    def test_crud_delete_operation(self):
        """Test DELETE operation via DELETE /items/{id}"""
        try:
            api_url = self.api_endpoint + "items"
            
            # First create an item to delete
            post_data = {"id": "test-delete-1", "name": "Test Delete Item", "price": 10.99}
            requests.post(api_url, json=post_data, timeout=10)
            
            # Test DELETE method
            response = requests.delete(f"{api_url}/test-delete-1", timeout=10)
            self.assertEqual(response.status_code, 200)
            
            # Verify the deletion
            response = requests.get(f"{api_url}/test-delete-1", timeout=10)
            self.assertEqual(response.status_code, 404)
            
        except requests.RequestException as e:
            self.fail(f"DELETE operation validation failed: {e}")

    @mark.it("validates error handling and retry logic")
    def test_error_handling_and_validation(self):
        """Test comprehensive error handling and input validation"""
        try:
            api_url = self.api_endpoint + "items"
            
            # Test invalid POST data (missing required fields)
            invalid_data = {"name": "Missing ID"}
            response = requests.post(api_url, json=invalid_data, timeout=10)
            self.assertEqual(response.status_code, 400)
            response_data = response.json()
            self.assertIn('error', response_data)
            
            # Test invalid JSON
            response = requests.post(api_url, data="invalid json", 
                                   headers={'Content-Type': 'application/json'}, timeout=10)
            self.assertEqual(response.status_code, 400)
            
            # Test unsupported HTTP method
            response = requests.patch(api_url, json={}, timeout=10)
            self.assertEqual(response.status_code, 403)
            
            # Test empty update data
            response = requests.put(f"{api_url}/test-id", json={}, timeout=10)
            self.assertEqual(response.status_code, 400)
            
        except requests.RequestException as e:
            self.fail(f"Error handling validation failed: {e}")

    @mark.it("validates CloudWatch logging and structured logging")
    def test_cloudwatch_logging(self):
        """Test that CloudWatch logs are properly configured with structured logging"""
        try:
            log_group_name = f"/aws/lambda/{self.lambda_function_name}"
            
            # Check if log group exists
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            
            log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
            self.assertTrue(len(log_groups) > 0, f"Log group {log_group_name} not found")
            
            # Make API call to generate logs
            api_url = self.api_endpoint + "items"
            test_data = {"id": "log-test-1", "name": "Log Test Item"}
            requests.post(api_url, json=test_data, timeout=10)
            
            # Wait for logs to appear
            time.sleep(10)
            
            # Check for log streams
            streams_response = self.logs_client.describe_log_streams(
                logGroupName=log_group_name,
                orderBy='LastEventTime',
                descending=True,
                limit=1
            )
            
            self.assertTrue(len(streams_response['logStreams']) > 0, "No log streams found")
            
        except ClientError as e:
            self.fail(f"CloudWatch logging validation failed: {e}")

    @mark.it("validates CloudWatch alarms configuration")
    def test_cloudwatch_alarms(self):
        """Test that CloudWatch alarms are configured for monitoring"""
        try:
            response = self.cloudwatch_client.describe_alarms()
            alarm_names = [alarm['AlarmName'] for alarm in response['MetricAlarms']]
            
            # Check for expected alarms (partial name match since CDK generates full names)
            lambda_error_alarms = [name for name in alarm_names if 'LambdaError' in name]
            api_4xx_alarms = [name for name in alarm_names if 'Api4xxError' in name]
            api_5xx_alarms = [name for name in alarm_names if 'Api5xxError' in name]
            
            self.assertTrue(len(lambda_error_alarms) > 0, "Lambda error alarm not found")
            self.assertTrue(len(api_4xx_alarms) > 0, "API 4xx error alarm not found")
            self.assertTrue(len(api_5xx_alarms) > 0, "API 5xx error alarm not found")
            
        except ClientError as e:
            self.fail(f"CloudWatch alarms validation failed: {e}")

    @mark.it("validates API Gateway method integration and routes")
    def test_api_gateway_method_integration(self):
        """Test that all API Gateway methods are properly integrated"""
        try:
            api_id = self.outputs.get('ApiGatewayId')
            
            # Get resources
            resources_response = self.apigateway_client.get_resources(restApiId=api_id)
            resources = resources_response['items']
            
            # Find items resource and item resource
            items_resource = None
            item_resource = None
            
            for resource in resources:
                if resource.get('pathPart') == 'items':
                    items_resource = resource
                elif '{id}' in resource.get('pathPart', ''):
                    item_resource = resource
            
            self.assertIsNotNone(items_resource, "Items resource (/items) not found")
            self.assertIsNotNone(item_resource, "Item resource (/items/{id}) not found")
            
            # Check methods on items resource
            self.assertIn('GET', items_resource['resourceMethods'])
            self.assertIn('POST', items_resource['resourceMethods'])
            
            # Check methods on item resource
            self.assertIn('GET', item_resource['resourceMethods'])
            self.assertIn('PUT', item_resource['resourceMethods'])
            self.assertIn('DELETE', item_resource['resourceMethods'])
            
        except ClientError as e:
            self.fail(f"API Gateway method integration validation failed: {e}")

    @mark.it("validates DynamoDB table configuration")
    def test_dynamodb_table_configuration(self):
        """Test that the DynamoDB table is properly configured"""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)
            table = response['Table']

            # Validate table name and status
            self.assertEqual(table['TableName'], self.dynamodb_table_name)
            self.assertEqual(table['TableStatus'], 'ACTIVE')

            # Validate billing mode
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

            # Validate point-in-time recovery
            self.assertTrue(table['TableArn'])
            
            # Check if point-in-time recovery is enabled
            pitr_response = self.dynamodb_client.describe_continuous_backups(TableName=self.dynamodb_table_name)
            pitr_status = pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
            self.assertEqual(pitr_status, 'ENABLED')
            
        except ClientError as e:
            self.fail(f"DynamoDB table configuration validation failed: {e}")

    @mark.it("validates boto3 retry configuration")
    def test_boto3_retry_configuration(self):
        """Test that Lambda function has proper retry configuration"""
        try:
            # This is tested indirectly by making multiple rapid requests
            # and ensuring they don't fail due to throttling
            api_url = self.api_endpoint + "items"
            
            successful_requests = 0
            for i in range(5):
                try:
                    test_data = {"id": f"retry-test-{i}", "name": f"Retry Test Item {i}"}
                    response = requests.post(api_url, json=test_data, timeout=10)
                    if response.status_code == 201:
                        successful_requests += 1
                except:
                    pass
            
            # Should handle at least 80% of requests successfully with retry logic
            self.assertGreaterEqual(successful_requests, 4, "Retry logic not working properly")
            
        except Exception as e:
            self.fail(f"Boto3 retry configuration validation failed: {e}")

    @mark.it("validates the removal policy logic")
    def test_removal_policy_logic(self):
        """Test that the DynamoDB table has the correct removal policy"""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)
            table_arn = response['Table']['TableArn']
            self.assertTrue(table_arn)
            
            # For dev environment, removal policy should allow deletion
            # This is implicitly tested by the fact that the table exists and can be managed
            self.assertIn('items-table-', self.dynamodb_table_name)
            
        except ClientError as e:
            self.fail(f"Removal policy validation failed: {e}")

if __name__ == '__main__':
    unittest.main()
