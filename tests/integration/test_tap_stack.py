import json
import os
import unittest
import uuid
import time
import boto3
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
class TestTapStack(unittest.TestCase):
    """Integration tests for the deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and resource information from outputs"""
        cls.outputs = flat_outputs
        
        # Extract resource information from outputs
        cls.api_url = cls.outputs.get('ApiUrl', '')
        cls.lambda_function_arn = cls.outputs.get('LambdaFunctionArn', '')
        cls.lambda_function_name = cls.outputs.get('LambdaFunctionName', '')
        cls.s3_bucket_name = cls.outputs.get('LogBucketName', '')
        cls.s3_bucket_arn = cls.outputs.get('S3BucketArn', '')
        cls.dynamodb_table_name = cls.outputs.get('DynamoDBTableName', '')
        cls.dynamodb_table_arn = cls.outputs.get('DynamoDBTableArn', '')
        cls.dlq_url = cls.outputs.get('DLQUrl', '')
        cls.dlq_arn = cls.outputs.get('DLQArn', '')
        cls.cloudwatch_log_group_name = cls.outputs.get('CloudWatchLogGroupName', '')
        cls.api_stage_name = cls.outputs.get('ApiStageName', 'prod')
        
        # Extract region from Lambda ARN
        if cls.lambda_function_arn:
            arn_parts = cls.lambda_function_arn.split(':')
            cls.region = arn_parts[3] if len(arn_parts) > 3 else 'us-west-2'
        else:
            cls.region = 'us-west-2'
        
        # Initialize AWS clients
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.dynamodb_resource = boto3.resource('dynamodb', region_name=cls.region)
        cls.sqs_client = boto3.client('sqs', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        
        # Test items for cleanup
        cls.created_users = []
        cls.created_s3_objects = []

    def setUp(self):
        """Set up for each test"""
        self.maxDiff = None

    def tearDown(self):
        """Clean up test objects after each test"""
        # Clean up DynamoDB test items
        if self.created_users:
            table = self.dynamodb_resource.Table(self.dynamodb_table_name)
            for user_id, created_date in self.created_users:
                try:
                    table.delete_item(
                        Key={'userId': user_id, 'createdDate': created_date}
                    )
                except Exception:
                    pass  # Ignore cleanup errors
            self.created_users.clear()
        
        # Clean up S3 test objects
        for object_key in self.created_s3_objects:
            try:
                self.s3_client.delete_object(Bucket=self.s3_bucket_name, Key=object_key)
            except Exception:
                pass  # Ignore cleanup errors
        self.created_s3_objects.clear()

    @mark.it("validates that all required outputs exist")
    def test_outputs_exist(self):
        """Test that all required stack outputs are present"""
        required_outputs = [
            'ApiUrl',
            'LambdaFunctionArn',
            'LambdaFunctionName',
            'LogBucketName',
            'S3BucketArn',
            'DynamoDBTableName',
            'DynamoDBTableArn',
            'DLQUrl',
            'DLQArn',
            'CloudWatchLogGroupName',
            'ApiStageName'
        ]
        
        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Missing required output: {output}")
            self.assertIsNotNone(self.outputs[output], f"Output {output} is None")
            self.assertNotEqual(self.outputs[output], '', f"Output {output} is empty")

    @mark.it("validates Lambda function exists and has correct configuration")
    def test_lambda_function_exists(self):
        """Test that the Lambda function exists with correct configuration"""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            
            # Validate function configuration
            config = response['Configuration']
            self.assertEqual(config['Runtime'], 'python3.9')
            self.assertEqual(config['Handler'], 'index.lambda_handler')
            self.assertEqual(config['Timeout'], 30)
            self.assertEqual(config['MemorySize'], 512)
            
            # Validate environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('TABLE_NAME', env_vars)
            self.assertEqual(env_vars['TABLE_NAME'], self.dynamodb_table_name)
            self.assertIn('LOG_BUCKET', env_vars)
            self.assertEqual(env_vars['LOG_BUCKET'], self.s3_bucket_name)
            
            # Validate tracing is enabled
            tracing_config = config.get('TracingConfig', {})
            self.assertEqual(tracing_config.get('Mode'), 'Active')
            
        except ClientError as e:
            self.fail(f"Lambda function not found or error occurred: {e}")

    @mark.it("validates S3 bucket exists with correct configuration")
    def test_s3_bucket_exists(self):
        """Test that the S3 bucket exists with correct configuration"""
        try:
            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=self.s3_bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            # Validate versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=self.s3_bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled')
            
            # Validate encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=self.s3_bucket_name)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            self.assertTrue(any(rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256' for rule in rules))
            
            # Validate public access block
            public_access_block = self.s3_client.get_public_access_block(Bucket=self.s3_bucket_name)
            config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'])
            self.assertTrue(config['BlockPublicPolicy'])
            self.assertTrue(config['IgnorePublicAcls'])
            self.assertTrue(config['RestrictPublicBuckets'])
            
        except ClientError as e:
            self.fail(f"S3 bucket not found or error occurred: {e}")

    @mark.it("validates DynamoDB table exists with correct configuration")
    def test_dynamodb_table_exists(self):
        """Test that the DynamoDB table exists with correct configuration"""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)
            table = response['Table']
            
            # Validate table name and status
            self.assertEqual(table['TableName'], self.dynamodb_table_name)
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            
            # Validate billing mode
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
            
            # Validate key schema
            key_schema = table['KeySchema']
            partition_key = next((k for k in key_schema if k['KeyType'] == 'HASH'), None)
            sort_key = next((k for k in key_schema if k['KeyType'] == 'RANGE'), None)
            
            self.assertIsNotNone(partition_key)
            self.assertEqual(partition_key['AttributeName'], 'userId')
            self.assertIsNotNone(sort_key)
            self.assertEqual(sort_key['AttributeName'], 'createdDate')
            
            # Validate encryption
            sse_description = table.get('SSEDescription', {})
            self.assertEqual(sse_description.get('Status'), 'ENABLED')
            
        except ClientError as e:
            self.fail(f"DynamoDB table not found or error occurred: {e}")

    @mark.it("validates SQS dead letter queue exists with correct configuration")
    def test_sqs_dlq_exists(self):
        """Test that the SQS dead letter queue exists with correct configuration"""
        try:
            response = self.sqs_client.get_queue_attributes(
                QueueUrl=self.dlq_url,
                AttributeNames=['All']
            )
            
            attributes = response['Attributes']
            
            # Validate retention period (14 days = 1209600 seconds)
            self.assertEqual(attributes['MessageRetentionPeriod'], '1209600')
            
            # Validate encryption
            self.assertIn('KmsMasterKeyId', attributes)
            
        except ClientError as e:
            self.fail(f"SQS dead letter queue not found or error occurred: {e}")

    @mark.it("validates CloudWatch log group exists")
    def test_cloudwatch_log_group_exists(self):
        """Test that the CloudWatch log group exists"""
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=self.cloudwatch_log_group_name
            )
            
            log_groups = response['logGroups']
            self.assertTrue(len(log_groups) > 0, "CloudWatch log group not found")
            
            # Find the specific log group
            log_group = next((lg for lg in log_groups if lg['logGroupName'] == self.cloudwatch_log_group_name), None)
            self.assertIsNotNone(log_group, f"Log group {self.cloudwatch_log_group_name} not found")
            
        except ClientError as e:
            # Log group might not exist yet if no requests have been made
            self.skipTest(f"CloudWatch log group not found (may not be created yet): {e}")

    @mark.it("validates Lambda function can be invoked directly")
    def test_lambda_direct_invocation(self):
        """Test direct Lambda function invocation"""
        test_event = {
            "body": json.dumps({
                "userId": f"test-user-{uuid.uuid4()}",
                "name": "Test User",
                "email": "test@example.com"
            }),
            "httpMethod": "POST",
            "path": "/users"
        }
        
        try:
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                Payload=json.dumps(test_event)
            )
            
            self.assertEqual(response['StatusCode'], 200)
            
            # Parse response payload
            payload = json.loads(response['Payload'].read())
            self.assertEqual(payload['statusCode'], 201)
            
            # Parse body
            body = json.loads(payload['body'])
            self.assertEqual(body['message'], 'User created successfully')
            self.assertIn('userId', body)
            self.assertIn('createdDate', body)
            
            # Track for cleanup
            user_data = json.loads(test_event['body'])
            self.created_users.append((body['userId'], body['createdDate']))
            
        except ClientError as e:
            self.fail(f"Error invoking Lambda function: {e}")

    @mark.it("validates DynamoDB operations work correctly")
    def test_dynamodb_operations(self):
        """Test direct DynamoDB operations"""
        test_user_id = f"test-user-{uuid.uuid4()}"
        test_created_date = "2023-01-01T00:00:00Z"
        test_data = {
            "userId": test_user_id,
            "createdDate": test_created_date,
            "name": "DynamoDB Test User",
            "email": "dynamodb@example.com"
        }
        
        try:
            table = self.dynamodb_resource.Table(self.dynamodb_table_name)
            
            # PUT item
            table.put_item(Item=test_data)
            self.created_users.append((test_user_id, test_created_date))
            
            # GET item
            response = table.get_item(
                Key={'userId': test_user_id, 'createdDate': test_created_date}
            )
            
            self.assertIn('Item', response)
            item = response['Item']
            self.assertEqual(item['userId'], test_user_id)
            self.assertEqual(item['name'], test_data['name'])
            self.assertEqual(item['email'], test_data['email'])
            
            # UPDATE item
            table.update_item(
                Key={'userId': test_user_id, 'createdDate': test_created_date},
                UpdateExpression='SET #n = :name',
                ExpressionAttributeNames={'#n': 'name'},
                ExpressionAttributeValues={':name': 'Updated DynamoDB Test User'}
            )
            
            # Verify update
            response = table.get_item(
                Key={'userId': test_user_id, 'createdDate': test_created_date}
            )
            updated_item = response['Item']
            self.assertEqual(updated_item['name'], 'Updated DynamoDB Test User')
            
        except ClientError as e:
            self.fail(f"Error with DynamoDB operations: {e}")

    @mark.it("validates S3 operations work correctly")
    def test_s3_operations(self):
        """Test direct S3 operations"""
        test_object_key = f"test-logs/test-{uuid.uuid4()}.json"
        test_data = {
            "operation": "TEST",
            "userId": f"test-user-{uuid.uuid4()}",
            "timestamp": "2023-01-01T00:00:00Z"
        }
        
        try:
            # PUT object
            self.s3_client.put_object(
                Bucket=self.s3_bucket_name,
                Key=test_object_key,
                Body=json.dumps(test_data),
                ContentType='application/json'
            )
            self.created_s3_objects.append(test_object_key)
            
            # GET object
            response = self.s3_client.get_object(Bucket=self.s3_bucket_name, Key=test_object_key)
            retrieved_data = json.loads(response['Body'].read())
            
            self.assertEqual(retrieved_data['operation'], test_data['operation'])
            self.assertEqual(retrieved_data['userId'], test_data['userId'])
            
            # LIST objects
            list_response = self.s3_client.list_objects_v2(
                Bucket=self.s3_bucket_name,
                Prefix='test-logs/'
            )
            
            self.assertIn('Contents', list_response)
            object_keys = [obj['Key'] for obj in list_response['Contents']]
            self.assertIn(test_object_key, object_keys)
            
        except ClientError as e:
            self.fail(f"Error with S3 operations: {e}")

    @mark.it("validates end-to-end user creation flow")
    def test_end_to_end_user_creation(self):
        """Test complete end-to-end flow of user creation"""
        test_user_data = {
            "userId": f"e2e-user-{uuid.uuid4()}",
            "name": "End-to-End Test User",
            "email": "e2e@example.com",
            "department": "Testing"
        }
        
        # Invoke Lambda function
        test_event = {
            "body": json.dumps(test_user_data),
            "httpMethod": "POST",
            "path": "/users"
        }
        
        try:
            # 1. Invoke Lambda function
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                Payload=json.dumps(test_event)
            )
            
            payload = json.loads(response['Payload'].read())
            self.assertEqual(payload['statusCode'], 201)
            
            body = json.loads(payload['body'])
            created_user_id = body['userId']
            created_date = body['createdDate']
            
            # Track for cleanup
            self.created_users.append((created_user_id, created_date))
            
            # 2. Verify user was created in DynamoDB
            time.sleep(2)  # Allow time for eventual consistency
            table = self.dynamodb_resource.Table(self.dynamodb_table_name)
            db_response = table.get_item(
                Key={'userId': created_user_id, 'createdDate': created_date}
            )
            
            self.assertIn('Item', db_response)
            db_item = db_response['Item']
            self.assertEqual(db_item['name'], test_user_data['name'])
            self.assertEqual(db_item['email'], test_user_data['email'])
            
            # 3. Verify log was created in S3
            time.sleep(3)  # Allow time for S3 operation
            list_response = self.s3_client.list_objects_v2(
                Bucket=self.s3_bucket_name,
                Prefix=f'logs/{created_user_id}-'
            )
            
            self.assertIn('Contents', list_response)
            self.assertTrue(len(list_response['Contents']) > 0, "No log files found in S3")
            
            # Verify log content
            log_object = list_response['Contents'][0]
            log_response = self.s3_client.get_object(
                Bucket=self.s3_bucket_name,
                Key=log_object['Key']
            )
            log_data = json.loads(log_response['Body'].read())
            
            self.assertEqual(log_data['operation'], 'CREATE')
            self.assertEqual(log_data['userId'], created_user_id)
            self.assertIn('body', log_data)
            
            # Track S3 object for cleanup
            self.created_s3_objects.append(log_object['Key'])
            
        except ClientError as e:
            self.fail(f"Error in end-to-end test: {e}")

    @mark.it("validates error handling and dead letter queue")
    def test_error_handling_and_dlq(self):
        """Test error handling and dead letter queue functionality"""
        # Create an invalid event that should cause an error
        invalid_event = {
            "body": "invalid-json-string",  # This will cause JSON parsing to fail
            "httpMethod": "POST",
            "path": "/users"
        }
        
        try:
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                Payload=json.dumps(invalid_event)
            )
            
            payload = json.loads(response['Payload'].read())
            
            # Lambda should handle the error gracefully and return 500
            self.assertEqual(payload['statusCode'], 500)
            
            body = json.loads(payload['body'])
            self.assertEqual(body['message'], 'Internal server error')
            self.assertIn('error', body)
            
        except ClientError as e:
            self.fail(f"Error testing error handling: {e}")


if __name__ == "__main__":
    unittest.main()
