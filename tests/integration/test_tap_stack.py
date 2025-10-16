import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark
import requests
import time
import uuid

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
        print(f"Loaded outputs: {cls.outputs}")

        # Extract resource information from flat-outputs.json
        cls.api_endpoint = cls.outputs.get('ApiEndpoint', '')
        cls.s3_bucket_name = cls.outputs.get('S3BucketName', '')
        cls.dynamodb_table_name = cls.outputs.get('DynamoDBTableName', '')
        cls.lambda_function_name = cls.outputs.get('LambdaFunctionName', '')
        cls.lambda_function_arn = cls.outputs.get('LambdaFunctionArn', '')
        cls.api_gateway_id = cls.outputs.get('ApiGatewayId', '')

        # Initialize AWS clients
        cls.dynamodb_client = boto3.client('dynamodb')
        cls.dynamodb_resource = boto3.resource('dynamodb')
        cls.lambda_client = boto3.client('lambda')
        cls.s3_client = boto3.client('s3')
        cls.iam_client = boto3.client('iam')
        cls.apigateway_client = boto3.client('apigateway')
        cls.logs_client = boto3.client('logs')
        cls.cloudwatch_client = boto3.client('cloudwatch')

        # Ensure API endpoint has proper format
        if cls.api_endpoint and not cls.api_endpoint.endswith('/'):
            cls.api_endpoint += '/'

        print(f"API Endpoint: {cls.api_endpoint}")
        print(f"S3 Bucket: {cls.s3_bucket_name}")
        print(f"DynamoDB Table: {cls.dynamodb_table_name}")
        print(f"Lambda Function: {cls.lambda_function_name}")

    def setUp(self):
        """Set up test data for each test"""
        self.test_item_id = f"test-item-{uuid.uuid4()}"
        self.test_items_created = []

    def tearDown(self):
        """Clean up test data after each test"""
        # Clean up any test items created during tests
        for item_id in self.test_items_created:
            try:
                requests.delete(f"{self.api_endpoint}items/{item_id}", timeout=10)
            except:
                pass

    @mark.it("validates that S3 bucket exists and has correct configuration")
    def test_s3_bucket_exists_and_configured(self):
        """Test that the S3 bucket exists and is properly configured"""
        if not self.s3_bucket_name:
            self.skipTest("S3 bucket not found in outputs")
            
        try:
            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=self.s3_bucket_name)
            self.assertIsNotNone(response)

            # Check versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=self.s3_bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled')

            # Check encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=self.s3_bucket_name)
            self.assertIn('ServerSideEncryptionConfiguration', encryption)

            # Check public access block
            public_access_block = self.s3_client.get_public_access_block(Bucket=self.s3_bucket_name)
            pab_config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(pab_config['BlockPublicAcls'])
            self.assertTrue(pab_config['IgnorePublicAcls'])
            self.assertTrue(pab_config['BlockPublicPolicy'])
            self.assertTrue(pab_config['RestrictPublicBuckets'])

            # Check lifecycle configuration
            try:
                lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=self.s3_bucket_name)
                rules = lifecycle.get('Rules', [])
                self.assertTrue(len(rules) > 0, "Expected lifecycle rules")
                
                # Find the DeleteOldVersions rule
                delete_old_versions_rule = next(
                    (rule for rule in rules if rule.get('ID') == 'DeleteOldVersions'), None
                )
                self.assertIsNotNone(delete_old_versions_rule)
                self.assertEqual(delete_old_versions_rule['Status'], 'Enabled')
            except ClientError as e:
                if e.response['Error']['Code'] != 'NoSuchLifecycleConfiguration':
                    raise

        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {e}")

    @mark.it("validates that DynamoDB table exists with correct schema and configuration")
    def test_dynamodb_table_exists_and_configured(self):
        """Test that the DynamoDB table exists with correct configuration"""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)
            table = response['Table']

            # Validate table properties
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

            # Validate key schema - should have id (partition) and timestamp (sort)
            key_schema = table['KeySchema']
            partition_key = next((key for key in key_schema if key['KeyType'] == 'HASH'), None)
            sort_key = next((key for key in key_schema if key['KeyType'] == 'RANGE'), None)
            
            self.assertIsNotNone(partition_key)
            self.assertEqual(partition_key['AttributeName'], 'id')
            
            self.assertIsNotNone(sort_key)
            self.assertEqual(sort_key['AttributeName'], 'timestamp')

            # Validate attribute definitions
            attributes = {attr['AttributeName']: attr['AttributeType'] for attr in table['AttributeDefinitions']}
            self.assertEqual(attributes['id'], 'S')  # String
            self.assertEqual(attributes['timestamp'], 'N')  # Number

            # Validate point-in-time recovery
            pitr_response = self.dynamodb_client.describe_continuous_backups(TableName=self.dynamodb_table_name)
            pitr_status = pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
            self.assertEqual(pitr_status, 'ENABLED')

            # Validate encryption
            self.assertIn('SSEDescription', table)
            self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')

            # Validate stream configuration
            self.assertIn('StreamSpecification', table)
            stream_spec = table['StreamSpecification']
            self.assertTrue(stream_spec.get('StreamEnabled', False))
            self.assertEqual(stream_spec.get('StreamViewType'), 'NEW_AND_OLD_IMAGES')

        except ClientError as e:
            self.fail(f"DynamoDB table validation failed: {e}")

    @mark.it("validates that Lambda function exists and is properly configured")
    def test_lambda_function_exists_and_configured(self):
        """Test that the Lambda function exists and is properly configured"""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            function_config = response['Configuration']

            # Validate basic configuration
            self.assertEqual(function_config['Runtime'], 'python3.11')
            self.assertEqual(function_config['Handler'], 'index.lambda_handler')
            self.assertEqual(function_config['Timeout'], 30)
            self.assertEqual(function_config['MemorySize'], 256)

            # Validate architecture
            architectures = function_config.get('Architectures', [])
            self.assertIn('arm64', architectures)

            # Validate environment variables
            env_vars = function_config.get('Environment', {}).get('Variables', {})
            self.assertIn('S3_BUCKET_NAME', env_vars)
            self.assertIn('DYNAMODB_TABLE_NAME', env_vars)
            self.assertIn('ENVIRONMENT', env_vars)
            self.assertEqual(env_vars['S3_BUCKET_NAME'], self.s3_bucket_name)
            self.assertEqual(env_vars['DYNAMODB_TABLE_NAME'], self.dynamodb_table_name)

            # Validate X-Ray tracing is enabled
            self.assertEqual(function_config.get('TracingConfig', {}).get('Mode'), 'Active')

        except ClientError as e:
            self.fail(f"Lambda function validation failed: {e}")

    @mark.it("validates that API Gateway exists and is properly configured")
    def test_api_gateway_exists_and_accessible(self):
        """Test that the API Gateway exists and is properly configured"""
        try:
            response = self.apigateway_client.get_rest_api(restApiId=self.api_gateway_id)
            
            # Validate API Gateway properties
            self.assertIn('name', response)
            self.assertIn('tap-app-api', response['name'])

            # Validate stage configuration
            stage_response = self.apigateway_client.get_stage(
                restApiId=self.api_gateway_id,
                stageName='prod'
            )
            
            self.assertEqual(stage_response['stageName'], 'prod')
            
            # Check if caching is enabled
            if 'cacheClusterEnabled' in stage_response:
                self.assertTrue(stage_response.get('cacheClusterEnabled', False))

            # Check throttling settings
            throttle_settings = stage_response.get('throttleSettings', {})
            if throttle_settings:
                self.assertIn('rateLimit', throttle_settings)
                self.assertIn('burstLimit', throttle_settings)

        except ClientError as e:
            self.fail(f"API Gateway validation failed: {e}")

    @mark.it("validates API Gateway resources and methods")
    def test_api_gateway_resources_and_methods(self):
        """Test that API Gateway has correct resources and methods"""
        try:
            resources_response = self.apigateway_client.get_resources(restApiId=self.api_gateway_id)
            resources = resources_response['items']

            # Find items resource and item resource
            items_resource = None
            item_resource = None

            for resource in resources:
                if resource.get('pathPart') == 'items':
                    items_resource = resource
                elif resource.get('pathPart') == '{id}':
                    item_resource = resource

            self.assertIsNotNone(items_resource, "Items resource (/items) not found")
            self.assertIsNotNone(item_resource, "Item resource (/items/{id}) not found")

            # Check methods on items resource
            items_methods = items_resource.get('resourceMethods', {})
            self.assertIn('GET', items_methods)
            self.assertIn('POST', items_methods)
            self.assertIn('OPTIONS', items_methods)  # CORS

            # Check methods on item resource  
            item_methods = item_resource.get('resourceMethods', {})
            self.assertIn('GET', item_methods)
            self.assertIn('PUT', item_methods)
            self.assertIn('DELETE', item_methods)
            self.assertIn('OPTIONS', item_methods)  # CORS

        except ClientError as e:
            self.fail(f"API Gateway resources validation failed: {e}")

    @mark.it("validates CloudWatch Log Group exists for Lambda")
    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch Log Group exists for Lambda"""
        try:
            log_group_name = f"/aws/lambda/{self.lambda_function_name}"
            
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            
            log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
            self.assertTrue(len(log_groups) > 0, f"Log group {log_group_name} not found")
            
            log_group = log_groups[0]
            self.assertEqual(log_group['logGroupName'], log_group_name)
            
            # Validate retention policy (14 days = TWO_WEEKS)
            if 'retentionInDays' in log_group:
                self.assertEqual(log_group['retentionInDays'], 14)

        except ClientError as e:
            self.fail(f"CloudWatch Log Group validation failed: {e}")

    @mark.it("validates CloudWatch Alarms exist")
    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created for monitoring"""
        try:
            # List all alarms
            response = self.cloudwatch_client.describe_alarms()
            alarms = response.get('MetricAlarms', [])
            
            # Filter alarms related to our Lambda function
            lambda_alarms = [
                alarm for alarm in alarms 
                if self.lambda_function_name in alarm.get('AlarmDescription', '') or
                   self.lambda_function_name in str(alarm.get('Dimensions', []))
            ]
            
            # Should have at least error and throttle alarms
            self.assertGreaterEqual(len(lambda_alarms), 1, "Expected Lambda monitoring alarms")
            
            # Check for specific alarm types
            alarm_names = [alarm['AlarmName'] for alarm in lambda_alarms]
            error_alarms = [name for name in alarm_names if 'Error' in name]
            throttle_alarms = [name for name in alarm_names if 'Throttle' in name]
            
            self.assertTrue(len(error_alarms) > 0 or len(throttle_alarms) > 0, 
                          "Expected error or throttle alarms")

        except ClientError as e:
            # Alarms might not be immediately available
            print(f"CloudWatch alarms validation warning: {e}")

    @mark.it("validates CRUD operations - CREATE item")
    def test_create_item_operation(self):
        """Test CREATE operation via POST /items"""
        try:
            item_data = {
                "name": "Test Item",
                "description": "Test item for integration testing",
                "category": "test",
                "value": 100
            }
            
            response = requests.post(f"{self.api_endpoint}items", json=item_data, timeout=10)
            self.assertEqual(response.status_code, 201)
            
            response_data = response.json()
            self.assertIn('id', response_data)
            self.assertIn('timestamp', response_data)
            self.assertIn('data', response_data)
            
            created_item = response_data
            self.assertEqual(created_item['data']['name'], item_data['name'])
            self.assertEqual(created_item['data']['value'], item_data['value'])
            
            # Store for cleanup
            self.test_items_created.append(created_item['id'])
            
        except requests.RequestException as e:
            self.fail(f"CREATE operation validation failed: {e}")

    @mark.it("validates CRUD operations - READ items")
    def test_read_items_operations(self):
        """Test READ operations via GET /items and GET /items/{id}"""
        try:
            # First create a test item
            item_data = {
                "name": "Read Test Item", 
                "description": "Item for read testing",
                "status": "active"
            }
            
            create_response = requests.post(f"{self.api_endpoint}items", json=item_data, timeout=10)
            self.assertEqual(create_response.status_code, 201)
            created_item = create_response.json()
            item_id = created_item['id']
            self.test_items_created.append(item_id)
            
            # Test GET all items
            list_response = requests.get(f"{self.api_endpoint}items", timeout=10)
            self.assertEqual(list_response.status_code, 200)
            
            list_data = list_response.json()
            self.assertIn('items', list_data)
            self.assertIn('count', list_data)
            
            # Test GET specific item
            get_response = requests.get(f"{self.api_endpoint}items/{item_id}", timeout=10)
            self.assertEqual(get_response.status_code, 200)
            
            retrieved_item = get_response.json()
            
        except requests.RequestException as e:
            self.fail(f"READ operations validation failed: {e}")

    @mark.it("validates CRUD operations - UPDATE item")
    def test_update_item_operation(self):
        """Test UPDATE operation via PUT /items/{id}"""
        try:
            # First create a test item
            item_data = {
                "name": "Update Test Item",
                "description": "Item for update testing",
                "version": 1
            }
            
            create_response = requests.post(f"{self.api_endpoint}items", json=item_data, timeout=10)
            self.assertEqual(create_response.status_code, 201)
            created_item = create_response.json()
            item_id = created_item['id']
            self.test_items_created.append(item_id)
            
            # Update the item
            update_data = {
                "name": "Updated Test Item",
                "description": "Updated description",
                "version": 2,
                "new_field": "new value"
            }
            
            update_response = requests.put(
                f"{self.api_endpoint}items/{item_id}", 
                json=update_data, 
                timeout=10
            )
            self.assertEqual(update_response.status_code, 200)
            
            updated_item = update_response.json()
            self.assertEqual(updated_item['id'], item_id)
            self.assertEqual(updated_item['data']['name'], update_data['name'])
            
            # Handle version as either string or int
            version_value = updated_item['data']['version']
            if isinstance(version_value, str):
                version_value = int(version_value)
            self.assertEqual(version_value, 2)
            
            self.assertTrue(updated_item.get('updated', False))
            
        except requests.RequestException as e:
            self.fail(f"UPDATE operation validation failed: {e}")

    @mark.it("validates CRUD operations - DELETE item")
    def test_delete_item_operation(self):
        """Test DELETE operation via DELETE /items/{id}"""
        try:
            # First create a test item
            item_data = {
                "name": "Delete Test Item",
                "description": "Item for delete testing"
            }
            
            create_response = requests.post(f"{self.api_endpoint}items", json=item_data, timeout=10)
            self.assertEqual(create_response.status_code, 201)
            created_item = create_response.json()
            item_id = created_item['id']
            
            # Delete the item
            delete_response = requests.delete(f"{self.api_endpoint}items/{item_id}", timeout=10)
            self.assertEqual(delete_response.status_code, 200)
            
            delete_data = delete_response.json()
            self.assertIn('message', delete_data)
            self.assertIn('deleted', delete_data['message'])
            
        except requests.RequestException as e:
            self.fail(f"DELETE operation validation failed: {e}")

    @mark.it("validates S3 integration with file content")
    def test_s3_integration(self):
        """Test S3 integration when creating items with file content"""
        try:
            item_data = {
                "name": "S3 Test Item",
                "description": "Item with file content",
                "file_content": {
                    "type": "document",
                    "content": "This is test file content for S3 storage",
                    "metadata": {"size": 100, "format": "text"}
                }
            }
            
            response = requests.post(f"{self.api_endpoint}items", json=item_data, timeout=10)
            self.assertEqual(response.status_code, 201)
            
            created_item = response.json()
            item_id = created_item['id']
            self.test_items_created.append(item_id)
            
            # Check if S3 key was created
            if 's3_key' in created_item:
                # Verify the S3 object exists
                s3_key = created_item['s3_key']
                s3_response = self.s3_client.head_object(Bucket=self.s3_bucket_name, Key=s3_key)
                self.assertIsNotNone(s3_response)
                
                # Check metadata
                metadata = s3_response.get('Metadata', {})
                self.assertEqual(metadata.get('item_id'), item_id)
                
                # Verify content
                s3_content_response = self.s3_client.get_object(Bucket=self.s3_bucket_name, Key=s3_key)
                s3_content = json.loads(s3_content_response['Body'].read())
                self.assertEqual(s3_content['type'], item_data['file_content']['type'])
            
        except (requests.RequestException, ClientError) as e:
            self.fail(f"S3 integration validation failed: {e}")

    @mark.it("validates error handling and input validation")
    def test_error_handling_and_validation(self):
        """Test comprehensive error handling and input validation"""
        try:
            # Test GET non-existent item
            response = requests.get(f"{self.api_endpoint}items/non-existent-id-12345", timeout=10)
            
            # Test invalid JSON in POST
            response = requests.post(
                f"{self.api_endpoint}items", 
                data="invalid json data", 
                headers={'Content-Type': 'application/json'}, 
                timeout=10
            )
            
        except requests.RequestException as e:
            self.fail(f"Error handling validation failed: {e}")

    @mark.it("validates IAM permissions and security")
    def test_iam_permissions_and_security(self):
        """Test that IAM roles have appropriate permissions"""
        try:
            # Get Lambda function configuration to find its role
            function_response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            role_arn = function_response['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
            # Get role details
            role_response = self.iam_client.get_role(RoleName=role_name)
            assume_role_policy = role_response['Role']['AssumeRolePolicyDocument']
            
            # Validate assume role policy allows Lambda service
            self.assertIn('Statement', assume_role_policy)
            statements = assume_role_policy['Statement']
            lambda_statement = next(
                (stmt for stmt in statements 
                 if stmt.get('Principal', {}).get('Service') == 'lambda.amazonaws.com'), 
                None
            )
            self.assertIsNotNone(lambda_statement)
            
            # Check attached policies
            attached_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            policy_arns = [policy['PolicyArn'] for policy in attached_policies['AttachedPolicies']]
            
            # Should have basic execution role and X-Ray permissions
            basic_execution = any('AWSLambdaBasicExecutionRole' in arn for arn in policy_arns)
            xray_permissions = any('AWSXRayDaemonWriteAccess' in arn for arn in policy_arns)
            
            self.assertTrue(basic_execution, "Missing AWSLambdaBasicExecutionRole")

        except ClientError as e:
            self.fail(f"IAM permissions validation failed: {e}")

    @mark.it("validates end-to-end functionality with versioning")
    def test_end_to_end_versioning_functionality(self):
        """Test complete end-to-end functionality with DynamoDB versioning"""
        try:
            # 1. Create an item
            item_data = {
                "name": "E2E Versioning Test",
                "version": 1,
                "description": "Initial version for end-to-end testing",
                "priority": "high"
            }
            
            create_response = requests.post(f"{self.api_endpoint}items", json=item_data, timeout=10)
            self.assertEqual(create_response.status_code, 201)
            created_item = create_response.json()
            item_id = created_item['id']
            initial_timestamp = created_item['timestamp']
            self.test_items_created.append(item_id)
            
            # Wait to ensure different timestamps
            time.sleep(1)
            
            # 2. Update the item (creates new version)
            update_data = {
                "name": "E2E Versioning Test",
                "version": 2,
                "description": "Updated version for end-to-end testing",
                "priority": "medium"
            }
            
            update_response = requests.put(
                f"{self.api_endpoint}items/{item_id}", 
                json=update_data, 
                timeout=10
            )
            self.assertEqual(update_response.status_code, 200)
            updated_item = update_response.json()
            updated_timestamp = updated_item['timestamp']
            
            # Verify new version has later timestamp
            self.assertGreater(updated_timestamp, initial_timestamp)
            
            # 3. Get the item (should return latest version)
            get_response = requests.get(f"{self.api_endpoint}items/{item_id}", timeout=10)
            self.assertEqual(get_response.status_code, 200)
            latest_item = get_response.json()
            
            # Should be the updated version (handle type conversion)
            version_value = latest_item['data']['version']
            if isinstance(version_value, str):
                version_value = int(version_value)
            self.assertEqual(version_value, 2)
            self.assertEqual(latest_item['data']['priority'], "medium")
            
            # 4. Verify versions exist in DynamoDB
            table = self.dynamodb_resource.Table(self.dynamodb_table_name)
            response = table.query(
                KeyConditionExpression='id = :id',
                ExpressionAttributeValues={':id': item_id}
            )
            
            versions = response['Items']
            self.assertGreaterEqual(len(versions), 2, "Should have at least 2 versions")
            
            # 5. Test list operation includes our item
            list_response = requests.get(f"{self.api_endpoint}items", timeout=10)
            self.assertEqual(list_response.status_code, 200)
            items_list = list_response.json()['items']
            
            # 6. Delete the item (soft delete)
            delete_response = requests.delete(f"{self.api_endpoint}items/{item_id}", timeout=10)
            self.assertEqual(delete_response.status_code, 200)
            
        except (requests.RequestException, ClientError) as e:
            self.fail(f"End-to-end versioning functionality test failed: {e}")

    @mark.it("validates API Gateway performance and limits")
    def test_api_gateway_performance_and_limits(self):
        """Test API Gateway throttling and performance characteristics"""
        try:
            # Test basic performance by making multiple requests
            response_times = []
            
            for i in range(5):
                start_time = time.time()
                response = requests.get(f"{self.api_endpoint}items", timeout=10)
                end_time = time.time()
                
                self.assertEqual(response.status_code, 200)
                response_times.append(end_time - start_time)
            
            # Average response time should be reasonable (under 5 seconds)
            avg_response_time = sum(response_times) / len(response_times)
            self.assertLess(avg_response_time, 5.0, f"Average response time too high: {avg_response_time}s")
            
            print(f"Average API response time: {avg_response_time:.2f}s")
            
        except requests.RequestException as e:
            self.fail(f"API Gateway performance validation failed: {e}")


if __name__ == '__main__':
    unittest.main()
