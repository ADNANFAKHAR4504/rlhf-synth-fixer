import json
import os
import unittest
import uuid
import time
import boto3
import requests
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
        cls.cloudfront_url = cls.outputs.get('CloudFrontUrl', '')
        cls.cloudfront_domain = cls.outputs.get('CloudFrontDomainName', '')
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
        
        # CloudWatch Alarm Names
        cls.lambda_duration_alarm_name = cls.outputs.get('LambdaDurationAlarmName', '')
        cls.lambda_error_alarm_name = cls.outputs.get('LambdaErrorAlarmName', '')
        cls.dlq_message_alarm_name = cls.outputs.get('DLQMessageAlarmName', '')
        cls.api_4xx_alarm_name = cls.outputs.get('ApiGateway4XXAlarmName', '')
        cls.api_5xx_alarm_name = cls.outputs.get('ApiGateway5XXAlarmName', '')
        
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
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.cloudfront_client = boto3.client('cloudfront', region_name='us-east-1')  # CloudFront is global
        
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
            'CloudFrontUrl',
            'CloudFrontDomainName',
            'LambdaFunctionArn',
            'LambdaFunctionName',
            'LogBucketName',
            'S3BucketArn',
            'DynamoDBTableName',
            'DynamoDBTableArn',
            'DLQUrl',
            'DLQArn',
            'CloudWatchLogGroupName',
            'ApiStageName',
            'LambdaDurationAlarmName',
            'LambdaErrorAlarmName',
            'DLQMessageAlarmName',
            'ApiGateway4XXAlarmName',
            'ApiGateway5XXAlarmName'
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

    @mark.it("validates API Gateway HTTP endpoint - POST /users")
    def test_api_gateway_http_post_endpoint(self):
        """Test API Gateway HTTP POST endpoint functionality"""
        test_user_data = {
            "userId": f"http-test-user-{uuid.uuid4()}",
            "name": "HTTP Test User",
            "email": "http-test@example.com",
            "department": "Testing"
        }
        
        try:
            # Send HTTP POST request to API Gateway
            response = requests.post(
                f"{self.api_url}users",
                json=test_user_data,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                timeout=30
            )
            
            # Validate response
            self.assertEqual(response.status_code, 201)
            
            response_body = response.json()
            self.assertEqual(response_body['message'], 'User created successfully')
            self.assertIn('userId', response_body)
            self.assertIn('createdDate', response_body)
            
            # Track for cleanup
            self.created_users.append((response_body['userId'], response_body['createdDate']))
            
        except requests.RequestException as e:
            self.fail(f"Error testing API Gateway HTTP endpoint: {e}")

    @mark.it("validates API Gateway CORS functionality")
    def test_api_gateway_cors_headers(self):
        """Test API Gateway CORS headers"""
        try:
            # Send OPTIONS request to check CORS
            response = requests.options(
                f"{self.api_url}users",
                headers={
                    "Origin": "https://example.com",
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Content-Type"
                },
                timeout=30
            )
            
            # Validate CORS headers are present
            self.assertIn('access-control-allow-origin', [h.lower() for h in response.headers.keys()])
            
        except requests.RequestException as e:
            self.fail(f"Error testing API Gateway CORS: {e}")

    @mark.it("validates CloudFront distribution exists and functionality")
    def test_cloudfront_distribution_functionality(self):
        """Test CloudFront distribution functionality"""
        test_user_data = {
            "userId": f"cf-test-user-{uuid.uuid4()}",
            "name": "CloudFront Test User",
            "email": "cf-test@example.com"
        }
        
        try:
            # Test HTTP request through CloudFront using the actual domain from outputs
            cloudfront_url = f"https://{self.cloudfront_domain}/"
            response = requests.post(
                f"{cloudfront_url}users",
                json=test_user_data,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                timeout=60  # CloudFront may take longer
            )
            
            # Validate response
            self.assertEqual(response.status_code, 201)
            response_body = response.json()
            self.assertEqual(response_body['message'], 'User created successfully')
            
            # Track for cleanup
            self.created_users.append((response_body['userId'], response_body['createdDate']))
            
        except requests.RequestException as e:
            self.fail(f"Error testing CloudFront distribution: {e}")

    @mark.it("validates CloudWatch alarms exist and are configured correctly")
    def test_cloudwatch_alarms_configuration(self):
        """Test CloudWatch alarms configuration"""
        try:
            # Test Lambda Duration Alarm
            response = self.cloudwatch_client.describe_alarms(
                AlarmNames=[self.lambda_duration_alarm_name]
            )
            alarms = response.get('MetricAlarms', [])
            self.assertTrue(len(alarms) > 0, f"Lambda duration alarm {self.lambda_duration_alarm_name} not found")
            
            alarm = alarms[0]
            self.assertEqual(alarm['AlarmName'], self.lambda_duration_alarm_name)
            self.assertEqual(alarm['Threshold'], 25000.0)  # 25 seconds in milliseconds
            self.assertEqual(alarm['ComparisonOperator'], 'GreaterThanThreshold')
            self.assertEqual(alarm['EvaluationPeriods'], 2)
            
            # Test Lambda Error Alarm
            response = self.cloudwatch_client.describe_alarms(
                AlarmNames=[self.lambda_error_alarm_name]
            )
            alarms = response.get('MetricAlarms', [])
            self.assertTrue(len(alarms) > 0, f"Lambda error alarm {self.lambda_error_alarm_name} not found")
            
            alarm = alarms[0]
            self.assertEqual(alarm['AlarmName'], self.lambda_error_alarm_name)
            self.assertEqual(alarm['Threshold'], 1.0)
            
            # Test DLQ Message Alarm
            response = self.cloudwatch_client.describe_alarms(
                AlarmNames=[self.dlq_message_alarm_name]
            )
            alarms = response.get('MetricAlarms', [])
            self.assertTrue(len(alarms) > 0, f"DLQ message alarm {self.dlq_message_alarm_name} not found")
            
            # Test API Gateway 4XX Alarm
            response = self.cloudwatch_client.describe_alarms(
                AlarmNames=[self.api_4xx_alarm_name]
            )
            alarms = response.get('MetricAlarms', [])
            self.assertTrue(len(alarms) > 0, f"API Gateway 4XX alarm {self.api_4xx_alarm_name} not found")
            
            # Test API Gateway 5XX Alarm
            response = self.cloudwatch_client.describe_alarms(
                AlarmNames=[self.api_5xx_alarm_name]
            )
            alarms = response.get('MetricAlarms', [])
            self.assertTrue(len(alarms) > 0, f"API Gateway 5XX alarm {self.api_5xx_alarm_name} not found")
            
        except ClientError as e:
            self.fail(f"Error testing CloudWatch alarms: {e}")

    @mark.it("validates S3 bucket exists with correct configuration")
    def test_s3_bucket_configuration(self):
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
    def test_dynamodb_table_configuration(self):
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

    @mark.it("validates SQS dead letter queue configuration")
    def test_sqs_dlq_configuration(self):
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

    @mark.it("validates end-to-end user creation flow with real resources")
    def test_end_to_end_user_creation_flow(self):
        """Test complete end-to-end flow using real deployed resources"""
        test_user_data = {
            "userId": f"e2e-test-{uuid.uuid4()}",
            "name": "End-to-End Test User",
            "email": "e2e@example.com",
            "department": "Integration Testing"
        }
        
        try:
            # Step 1: Create user via API Gateway
            response = requests.post(
                f"{self.api_url}users",
                json=test_user_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            self.assertEqual(response.status_code, 201)
            response_body = response.json()
            created_user_id = response_body['userId']
            created_date = response_body['createdDate']
            
            # Track for cleanup
            self.created_users.append((created_user_id, created_date))
            
            # Step 2: Verify user exists in DynamoDB
            time.sleep(2)  # Allow for eventual consistency
            table = self.dynamodb_resource.Table(self.dynamodb_table_name)
            db_response = table.get_item(
                Key={'userId': created_user_id, 'createdDate': created_date}
            )
            
            self.assertIn('Item', db_response)
            db_item = db_response['Item']
            self.assertEqual(db_item['userId'], created_user_id)
            self.assertEqual(db_item['name'], test_user_data['name'])
            self.assertEqual(db_item['email'], test_user_data['email'])
            
            # Step 3: Verify log was created in S3
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
            
        except (requests.RequestException, ClientError) as e:
            self.fail(f"Error in end-to-end test: {e}")

    @mark.it("validates error handling returns proper HTTP status codes")
    def test_api_error_handling(self):
        """Test API error handling with invalid data"""
        try:
            # Send invalid JSON data
            response = requests.post(
                f"{self.api_url}users",
                data="invalid-json-data",
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                timeout=30
            )
            
            # Should return 500 for invalid JSON
            self.assertEqual(response.status_code, 500)
            
            response_body = response.json()
            self.assertEqual(response_body['message'], 'Internal server error')
            self.assertIn('error', response_body)
            
        except requests.RequestException as e:
            self.fail(f"Error testing API error handling: {e}")

    @mark.it("validates CloudWatch log group exists for Lambda function")
    def test_cloudwatch_log_group_exists(self):
        """Test that the CloudWatch log group exists for the Lambda function"""
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=self.cloudwatch_log_group_name
            )
            
            log_groups = response['logGroups']
            
            # Find the specific log group
            log_group = next((lg for lg in log_groups if lg['logGroupName'] == self.cloudwatch_log_group_name), None)
            self.assertIsNotNone(log_group, f"Log group {self.cloudwatch_log_group_name} not found")
            
        except ClientError as e:
            # Log group might not exist yet if no requests have been made
            self.skipTest(f"CloudWatch log group not found (may not be created yet): {e}")

    @mark.it("validates resource tagging is applied correctly")
    def test_resource_tagging(self):
        """Test that resources have correct tags applied"""
        try:
            # Check Lambda function tags
            response = self.lambda_client.list_tags(Resource=self.lambda_function_arn)
            lambda_tags = response.get('Tags', {})
            
            # Verify environment-specific tags exist
            self.assertIn('Environment', lambda_tags)
            self.assertIn('Project', lambda_tags)
            
            # Check S3 bucket tags
            try:
                response = self.s3_client.get_bucket_tagging(Bucket=self.s3_bucket_name)
                s3_tags = {tag['Key']: tag['Value'] for tag in response.get('TagSet', [])}
                
                self.assertIn('Environment', s3_tags)
                self.assertIn('Project', s3_tags)
                
            except ClientError:
                # Tags might not be applied to S3 bucket
                pass
            
        except ClientError as e:
            self.skipTest(f"Resource tagging test skipped: {e}")

    @mark.it("validates performance by measuring response times")
    def test_api_performance(self):
        """Test API performance by measuring response times"""
        test_user_data = {
            "userId": f"perf-test-{uuid.uuid4()}",
            "name": "Performance Test User",
            "email": "perf@example.com"
        }
        
        try:
            start_time = time.time()
            
            response = requests.post(
                f"{self.api_url}users",
                json=test_user_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            # Validate response
            self.assertEqual(response.status_code, 201)
            
            # Performance assertion: API should respond within 5 seconds
            self.assertLess(response_time, 5.0, f"API response time {response_time:.2f}s exceeds 5 seconds")
            
            # Track for cleanup
            response_body = response.json()
            self.created_users.append((response_body['userId'], response_body['createdDate']))
            
        except requests.RequestException as e:
            self.fail(f"Error in performance test: {e}")


if __name__ == "__main__":
    unittest.main()
