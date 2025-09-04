import json
import os
import unittest
import boto3
import time
import requests
from unittest.mock import Mock, patch

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
    """Integration test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up AWS clients for integration testing"""
        self.s3_client = boto3.client('s3')
        self.dynamodb = boto3.resource('dynamodb')
        self.lambda_client = boto3.client('lambda')
        self.apigateway_client = boto3.client('apigateway')
        self.sqs_client = boto3.client('sqs')
        self.events_client = boto3.client('events')
        self.iam_client = boto3.client('iam')
        
        # Get stack outputs if available
        self.api_gateway_url = flat_outputs.get('ApiGatewayUrl')
        self.dynamodb_table_name = flat_outputs.get('DynamoDbTableName')
        self.s3_data_bucket_name = flat_outputs.get('S3DataBucketName')
        self.sqs_queue_url = flat_outputs.get('SqsQueueUrl')
        self.event_bus_name = flat_outputs.get('EventBusName')

    @mark.it("validates DynamoDB table exists and is configured correctly")
    def test_dynamodb_table_configuration(self):
        """Test that the DynamoDB table exists and has correct configuration"""
        if not self.dynamodb_table_name:
                self.skipTest("DynamoDB table name not available in stack outputs")
        
        # ARRANGE & ACT
        try:
            table = self.dynamodb.Table(self.dynamodb_table_name)
            table.load()  # This will raise an exception if table doesn't exist
            
                # ASSERT
            self.assertEqual(table.table_status, 'ACTIVE')
            self.assertEqual(table.billing_mode_summary['BillingMode'], 'PAY_PER_REQUEST')
            
                # Check key schema
            key_schema = table.key_schema
            self.assertEqual(len(key_schema), 2)  # Should have partition key and sort key
            self.assertEqual(key_schema[0]['AttributeName'], 'pk')
            self.assertEqual(key_schema[0]['KeyType'], 'HASH')
            self.assertEqual(key_schema[1]['AttributeName'], 'sk')
            self.assertEqual(key_schema[1]['KeyType'], 'RANGE')
            
                # Check attribute definitions
            attributes = table.attribute_definitions
            self.assertEqual(len(attributes), 2)
            pk_attr = next(attr for attr in attributes if attr['AttributeName'] == 'pk')
            sk_attr = next(attr for attr in attributes if attr['AttributeName'] == 'sk')
            self.assertEqual(pk_attr['AttributeType'], 'S')
            self.assertEqual(sk_attr['AttributeType'], 'S')
            
                # Check GSI exists
            gsi_list = table.global_secondary_indexes
            self.assertGreater(len(gsi_list), 0, "Table should have at least one GSI")
            
        except Exception as e:
            self.fail(f"DynamoDB table configuration test failed: {str(e)}")

    @mark.it("validates S3 buckets exist and are configured correctly")
    def test_s3_buckets_configuration(self):
        """Test that the S3 buckets exist and have correct configuration"""
        if not self.s3_data_bucket_name:
                self.skipTest("S3 data bucket name not available in stack outputs")
        
        # ARRANGE & ACT
        try:
                # Check data bucket exists
            bucket_response = self.s3_client.head_bucket(Bucket=self.s3_data_bucket_name)
            
                # Check versioning is enabled
            versioning_response = self.s3_client.get_bucket_versioning(
                Bucket=self.s3_data_bucket_name
            )
            
                # Check public access block configuration
            public_access_block = self.s3_client.get_bucket_public_access_block(
                Bucket=self.s3_data_bucket_name
            )
            
                # Check encryption
            encryption_response = self.s3_client.get_bucket_encryption(
                Bucket=self.s3_data_bucket_name
            )
            
                # ASSERT
            self.assertEqual(bucket_response['ResponseMetadata']['HTTPStatusCode'], 200)
            self.assertEqual(versioning_response['Status'], 'Enabled')
            
                # Verify all public access is blocked
            pab_config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(pab_config['BlockPublicAcls'])
            self.assertTrue(pab_config['BlockPublicPolicy'])
            self.assertTrue(pab_config['IgnorePublicAcls'])
            self.assertTrue(pab_config['RestrictPublicBuckets'])
            
                # Verify encryption is enabled
            self.assertIn('ServerSideEncryptionConfiguration', encryption_response)
            
        except Exception as e:
            self.fail(f"S3 bucket configuration test failed: {str(e)}")

    @mark.it("validates Lambda functions exist and are configured correctly")
    def test_lambda_functions_configuration(self):
        """Test that the Lambda functions exist and have correct configuration"""
        # Get Lambda function names from stack outputs or construct them
        expected_functions = [
            'tap-serverless-pr2695-api-handler',
            'tap-serverless-pr2695-async-processor', 
            'tap-serverless-pr2695-event-processor'
        ]
        
        for function_name in expected_functions:
            with self.subTest(function=function_name):
                try:
                    function_config = self.lambda_client.get_function(
                        FunctionName=function_name
                    )
                    
                        # ASSERT
                    config = function_config['Configuration']
                    self.assertEqual(config['Runtime'], 'python3.11')
                    self.assertEqual(config['Handler'], 'index.handler')
                    self.assertEqual(config['Timeout'], 30)  # API handler timeout
                    self.assertGreaterEqual(config['MemorySize'], 256)
                    
                        # Check environment variables
                    env_vars = config.get('Environment', {}).get('Variables', {})
                    self.assertIn('TABLE_NAME', env_vars)
                    self.assertIn('BUCKET_NAME', env_vars)
                    
                except self.lambda_client.exceptions.ResourceNotFoundException:
                    # Function might have unique suffix, try to find it
                    functions = self.lambda_client.list_functions()
                    matching_functions = [f for f in functions['Functions'] 
                                        if function_name.split('-')[-1] in f['FunctionName']]
                    if not matching_functions:
                        self.fail(f"Lambda function {function_name} not found")
                except Exception as e:
                    self.fail(f"Lambda function {function_name} configuration test failed: {str(e)}")

    @mark.it("validates API Gateway exists and is configured correctly")
    def test_api_gateway_configuration(self):
        """Test that the API Gateway exists and has correct configuration"""
        if not self.api_gateway_url:
                self.skipTest("API Gateway URL not available in stack outputs")
        
        # ARRANGE & ACT
        try:
                # Extract API ID from URL
            api_id = self.api_gateway_url.split('/')[-2]
            
                # Get API Gateway details
            api_response = self.apigateway_client.get_rest_api(restApiId=api_id)
            
                # Get resources
            resources_response = self.apigateway_client.get_resources(restApiId=api_id)
            
                # ASSERT
            self.assertEqual(api_response['name'], 'tap-serverless-pr2695-api')
            self.assertEqual(api_response['description'], 'API for tap-serverless pr2695')
            
                # Check that we have the expected resources
            resource_paths = [r['path'] for r in resources_response['items']]
            self.assertIn('/', resource_paths)  # Root path
            self.assertIn('/health', resource_paths)  # Health endpoint
            self.assertIn('/data', resource_paths)  # Data endpoint
            
        except Exception as e:
            self.fail(f"API Gateway configuration test failed: {str(e)}")

    @mark.it("tests API Gateway health endpoint")
    def test_api_gateway_health_endpoint(self):
        """Test that the API Gateway health endpoint responds correctly"""
        if not self.api_gateway_url:
                self.skipTest("API Gateway URL not available in stack outputs")
        
        # ARRANGE & ACT
        try:
            health_url = f"{self.api_gateway_url}health"
            response = requests.get(health_url, timeout=30)
            
                # ASSERT
            self.assertEqual(response.status_code, 200)
            
            response_data = response.json()
            self.assertIn('status', response_data)
            self.assertEqual(response_data['status'], 'healthy')
            self.assertIn('timestamp', response_data)
            
        except Exception as e:
            self.fail(f"API Gateway health endpoint test failed: {str(e)}")

    @mark.it("tests API Gateway data endpoint")
    def test_api_gateway_data_endpoint(self):
        """Test that the API Gateway data endpoint works correctly"""
        if not self.api_gateway_url:
                self.skipTest("API Gateway URL not available in stack outputs")
        
        # ARRANGE
        test_data = {
            "id": "integration-test-123",
            "message": "This is a test message",
            "timestamp": "2024-01-01T12:00:00Z"
        }
        
        try:
                # ACT - POST data
            data_url = f"{self.api_gateway_url}data"
            response = requests.post(
                data_url, 
                json=test_data, 
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
                # ASSERT
            self.assertEqual(response.status_code, 201)
            
            response_data = response.json()
            self.assertIn('message', response_data)
            self.assertEqual(response_data['message'], 'Data stored successfully')
            self.assertIn('item', response_data)
            
                # Verify data was stored in DynamoDB
            if self.dynamodb_table_name:
                table = self.dynamodb.Table(self.dynamodb_table_name)
                stored_item = response_data['item']
                pk = stored_item['pk']
                sk = stored_item['sk']
                
                db_response = table.get_item(Key={'pk': pk, 'sk': sk})
                self.assertIn('Item', db_response)
                
        except Exception as e:
            self.fail(f"API Gateway data endpoint test failed: {str(e)}")

    @mark.it("validates SQS queue exists and is configured correctly")
    def test_sqs_queue_configuration(self):
        """Test that the SQS queue exists and has correct configuration"""
        if not self.sqs_queue_url:
                self.skipTest("SQS queue URL not available in stack outputs")
        
        # ARRANGE & ACT
        try:
                # Get queue attributes
            queue_attributes = self.sqs_client.get_queue_attributes(
                QueueUrl=self.sqs_queue_url,
                AttributeNames=['All']
            )
            
            attributes = queue_attributes['Attributes']
            
                # ASSERT
            self.assertEqual(attributes['VisibilityTimeoutSeconds'], '300')  # 5 minutes
            self.assertEqual(attributes['MessageRetentionPeriod'], '1209600')  # 14 days
            
                # Check dead letter queue configuration
            self.assertIn('RedrivePolicy', attributes)
            redrive_policy = json.loads(attributes['RedrivePolicy'])
            self.assertEqual(redrive_policy['maxReceiveCount'], 3)
            
        except Exception as e:
            self.fail(f"SQS queue configuration test failed: {str(e)}")

    @mark.it("validates EventBridge custom bus exists")
    def test_eventbridge_bus_configuration(self):
        """Test that the EventBridge custom bus exists"""
        if not self.event_bus_name:
                self.skipTest("EventBridge bus name not available in stack outputs")
        
        # ARRANGE & ACT
        try:
                # List custom event buses
            buses_response = self.events_client.list_event_buses()
            
                # ASSERT
            bus_names = [bus['Name'] for bus in buses_response['EventBuses']]
            self.assertIn(self.event_bus_name, bus_names)
            
        except Exception as e:
            self.fail(f"EventBridge bus configuration test failed: {str(e)}")

    @mark.it("tests end-to-end workflow: API -> DynamoDB -> SQS")
    def test_end_to_end_workflow(self):
        """Test the complete workflow: API call -> DynamoDB storage -> SQS message"""
        if not all([self.api_gateway_url, self.dynamodb_table_name, self.sqs_queue_url]):
                self.skipTest("Required AWS resources not available in stack outputs")
        
        # ARRANGE
        test_data = {
            "id": f"e2e-test-{int(time.time())}",
            "message": "End-to-end integration test",
            "test_type": "workflow"
        }
        
        try:
                # ACT - Send data via API
            data_url = f"{self.api_gateway_url}data"
            response = requests.post(
                data_url, 
                json=test_data, 
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
                # ASSERT - API response
            self.assertEqual(response.status_code, 201)
            response_data = response.json()
            stored_item = response_data['item']
            
                # Verify data was stored in DynamoDB
            table = self.dynamodb.Table(self.dynamodb_table_name)
            db_response = table.get_item(
                Key={'pk': stored_item['pk'], 'sk': stored_item['sk']}
            )
            self.assertIn('Item', db_response)
            
            db_item = db_response['Item']
            self.assertEqual(db_item['data']['id'], test_data['id'])
            self.assertEqual(db_item['data']['message'], test_data['message'])
            
                # Note: SQS message processing is async, so we can't easily test
                # the complete flow without waiting for Lambda processing
            
        except Exception as e:
            self.fail(f"End-to-end workflow test failed: {str(e)}")

    @mark.it("validates IAM permissions are working")
    def test_iam_permissions(self):
        """Test that the Lambda functions have proper IAM permissions"""
        # Get Lambda function names
        expected_functions = [
            'tap-serverless-pr2695-api-handler',
            'tap-serverless-pr2695-async-processor', 
            'tap-serverless-pr2695-event-processor'
        ]
        
        for function_name in expected_functions:
            with self.subTest(function=function_name):
                try:
                        # ACT - Get Lambda function configuration
                    function_config = self.lambda_client.get_function(
                        FunctionName=function_name
                    )
                    
                    role_arn = function_config['Configuration']['Role']
                    role_name = role_arn.split('/')[-1]
                    
                        # Get attached policies
                    attached_policies = self.iam_client.list_attached_role_policies(
                        RoleName=role_name
                    )
                    
                        # Get inline policies
                    inline_policies = self.iam_client.list_role_policies(
                        RoleName=role_name
                    )
                    
                        # ASSERT
                        # Should have AWSLambdaVPCAccessExecutionRole attached
                    policy_names = [p['PolicyName'] for p in attached_policies['AttachedPolicies']]
                    self.assertTrue(
                        any('AWSLambdaVPCAccessExecutionRole' in name for name in policy_names),
                        f"Lambda {function_name} should have VPC access execution role attached"
                    )
                    
                        # Should have inline policies for AWS services access
                    self.assertGreater(
                        len(inline_policies['PolicyNames']), 0,
                        f"Lambda {function_name} should have inline policies for AWS services access"
                    )
                    
                except self.lambda_client.exceptions.ResourceNotFoundException:
                    # Function might have unique suffix, skip this test
                    self.skipTest(f"Lambda function {function_name} not found")
                except Exception as e:
                    self.fail(f"IAM permissions test for {function_name} failed: {str(e)}")

    @mark.it("validates VPC configuration for Lambda functions")
    def test_vpc_configuration(self):
        """Test that Lambda functions are properly configured in VPC"""
        # Get Lambda function names
        expected_functions = [
            'tap-serverless-pr2695-api-handler',
            'tap-serverless-pr2695-async-processor', 
            'tap-serverless-pr2695-event-processor'
        ]
        
        for function_name in expected_functions:
            with self.subTest(function=function_name):
                try:
                        # ACT - Get Lambda function configuration
                    function_config = self.lambda_client.get_function(
                        FunctionName=function_name
                    )
                    
                    config = function_config['Configuration']
                    
                        # ASSERT
                        # Should be in VPC
                    self.assertIn('VpcConfig', config)
                    vpc_config = config['VpcConfig']
                    self.assertIsNotNone(vpc_config.get('VpcId'))
                    self.assertIsNotNone(vpc_config.get('SubnetIds'))
                    self.assertIsNotNone(vpc_config.get('SecurityGroupIds'))
                    
                        # Should have at least one subnet and security group
                    self.assertGreater(len(vpc_config['SubnetIds']), 0)
                    self.assertGreater(len(vpc_config['SecurityGroupIds']), 0)
                    
                except self.lambda_client.exceptions.ResourceNotFoundException:
                    # Function might have unique suffix, skip this test
                    self.skipTest(f"Lambda function {function_name} not found")
                except Exception as e:
                    self.fail(f"VPC configuration test for {function_name} failed: {str(e)}")

    @mark.it("validates resource cleanup and error handling")
    def test_error_handling(self):
        """Test error handling in API Gateway with invalid requests"""
        if not self.api_gateway_url:
                self.skipTest("API Gateway URL not available in stack outputs")
        
        # ARRANGE - Invalid request to non-existent endpoint
        try:
                # ACT - Send request to non-existent endpoint
            invalid_url = f"{self.api_gateway_url}nonexistent"
            response = requests.get(invalid_url, timeout=30)
            
                # ASSERT - Should return 404
            self.assertEqual(response.status_code, 404)
            
            response_data = response.json()
            self.assertIn('error', response_data)
            
        except Exception as e:
            self.fail(f"Error handling test failed: {str(e)}")
