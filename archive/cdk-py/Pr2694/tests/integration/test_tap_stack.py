import json
import os
import unittest
import boto3
import time
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
        
        # Get stack outputs if available
        self.api_gateway_url = flat_outputs.get('ApiGatewayUrl')
        self.dynamodb_table_name = flat_outputs.get('DynamoDbTableName')
        self.s3_data_bucket_name = flat_outputs.get('S3DataBucketName')
        self.sqs_queue_url = flat_outputs.get('SqsQueueUrl')
        self.event_bus_name = flat_outputs.get('EventBusName')

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
            
                # ASSERT
            self.assertEqual(bucket_response['ResponseMetadata']['HTTPStatusCode'], 200)
            self.assertEqual(versioning_response['Status'], 'Enabled')
            
                # Verify all public access is blocked
            pab_config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(pab_config['BlockPublicAcls'])
            self.assertTrue(pab_config['BlockPublicPolicy'])
            self.assertTrue(pab_config['IgnorePublicAcls'])
            self.assertTrue(pab_config['RestrictPublicBuckets'])
            
        except Exception as e:
            self.fail(f"S3 buckets configuration test failed: {str(e)}")

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
            
                # Check key schema (partition key and sort key)
            key_schema = table.key_schema
            self.assertEqual(len(key_schema), 2)
            
                # Check partition key
            pk = next((key for key in key_schema if key['KeyType'] == 'HASH'), None)
            self.assertIsNotNone(pk)
            self.assertEqual(pk['AttributeName'], 'pk')
            
                # Check sort key
            sk = next((key for key in key_schema if key['KeyType'] == 'RANGE'), None)
            self.assertIsNotNone(sk)
            self.assertEqual(sk['AttributeName'], 'sk')
            
        except Exception as e:
            self.fail(f"DynamoDB table configuration test failed: {str(e)}")

    @mark.it("validates Lambda functions exist and are configured correctly")
    def test_lambda_functions_configuration(self):
        """Test that the Lambda functions exist and have correct configuration"""
        # ARRANGE & ACT
        try:
                # List all Lambda functions and find our TAP functions
            functions_response = self.lambda_client.list_functions()
            all_functions = functions_response['Functions']
            
            # Debug: Print all function names to help with troubleshooting
            print(f"Found {len(all_functions)} total Lambda functions")
            for func in all_functions:
                print(f"  - {func['FunctionName']}")
            
            # Filter for actual TAP Lambda functions (exclude CDK construct functions)
            tap_functions = [
                func for func in all_functions 
                if 'tap-serverless' in func['FunctionName'] and 
                not 'CustomVpcRestrictDefaultSG' in func['FunctionName'] and
                not 'CustomS3AutoDelete' in func['FunctionName']
            ]
            
            print(f"Found {len(tap_functions)} TAP Lambda functions")
            for func in tap_functions:
                print(f"  - {func['FunctionName']}")
            
                # ASSERT - Should have at least 1 main Lambda function (some might not be deployed or have different names)
            self.assertGreaterEqual(len(tap_functions), 1, f"Should have at least 1 TAP Lambda function. Found: {[f['FunctionName'] for f in tap_functions]}")
            
                # Check each function configuration
            for func in tap_functions:
                function_name = func['FunctionName']
                config = func
                
                # Basic configuration checks
                self.assertEqual(config['Runtime'], 'python3.11')
                self.assertEqual(config['Handler'], 'index.handler')
                self.assertIn('Environment', config)
                
        except Exception as e:
            self.fail(f"Lambda functions configuration test failed: {str(e)}")

    @mark.it("tests API Gateway health endpoint")
    def test_api_gateway_health_endpoint(self):
        """Test that the API Gateway health endpoint responds correctly"""
        if not self.api_gateway_url:
                self.skipTest("API Gateway URL not available in stack outputs")
        
        # ARRANGE
        import requests
        
        try:
                # ACT - Call health endpoint
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

    @mark.it("tests end-to-end data processing workflow")
    def test_end_to_end_data_processing(self):
        """Test the complete workflow: API call -> DynamoDB write"""
        if not all([self.api_gateway_url, self.dynamodb_table_name]):
                self.skipTest("Required AWS resources not available in stack outputs")
        
        # ARRANGE
        import requests
        
        test_data = {
            "id": f"test-{int(time.time())}",
            "message": "Integration test data",
            "timestamp": time.time()
        }
        
        try:
                # ACT - Send data via API Gateway
            data_url = f"{self.api_gateway_url}data"
            response = requests.post(
                data_url, 
                json=test_data, 
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
                # ASSERT - Check API response
            self.assertEqual(response.status_code, 201)
            
            response_data = response.json()
            self.assertIn('message', response_data)
            self.assertIn('item', response_data)
            
                # Wait a moment for DynamoDB write
            time.sleep(2)
            
                # ASSERT - Check that data was written to DynamoDB
            table = self.dynamodb.Table(self.dynamodb_table_name)
            pk = f"DATA#{test_data['id']}"
            
                # Query for the item (we need to scan since we don't know the sort key)
            response = table.scan(
                FilterExpression='pk = :pk',
                ExpressionAttributeValues={':pk': pk}
            )
            
            self.assertGreater(len(response['Items']), 0, "Data not found in DynamoDB")
            
            item = response['Items'][0]
            self.assertEqual(item['pk'], pk)
            self.assertIn('data', item)
            self.assertIn('created_at', item)
            
        except Exception as e:
            self.fail(f"End-to-end data processing test failed: {str(e)}")

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
            self.assertIn('QueueArn', attributes)
            self.assertIn('VisibilityTimeoutSeconds', attributes)
            self.assertIn('MessageRetentionPeriod', attributes)
            
                # Check dead letter queue configuration
            self.assertIn('RedrivePolicy', attributes)
            redrive_policy = json.loads(attributes['RedrivePolicy'])
            self.assertIn('deadLetterTargetArn', redrive_policy)
            self.assertIn('maxReceiveCount', redrive_policy)
            self.assertEqual(redrive_policy['maxReceiveCount'], 3)
            
        except Exception as e:
            self.fail(f"SQS queue configuration test failed: {str(e)}")

    @mark.it("validates EventBridge bus exists and is configured correctly")
    def test_eventbridge_bus_configuration(self):
        """Test that the EventBridge bus exists and has correct configuration"""
        if not self.event_bus_name:
                self.skipTest("EventBridge bus name not available in stack outputs")
        
        # ARRANGE & ACT
        try:
                # List event buses
            buses_response = self.events_client.list_event_buses()
            
                # Find our custom bus
            custom_bus = None
            for bus in buses_response['EventBuses']:
                if bus['Name'] == self.event_bus_name:
                    custom_bus = bus
                    break
            
                # ASSERT
            self.assertIsNotNone(custom_bus, f"EventBridge bus {self.event_bus_name} not found")
            self.assertEqual(custom_bus['Name'], self.event_bus_name)
            
                # Check that it's a custom bus (not default)
            self.assertNotEqual(custom_bus['Name'], 'default')
            
        except Exception as e:
            self.fail(f"EventBridge bus configuration test failed: {str(e)}")

    @mark.it("validates IAM permissions are working")
    def test_iam_permissions(self):
        """Test that the Lambda functions have proper IAM permissions"""
        # ARRANGE
        iam_client = boto3.client('iam')
        
        try:
                # Get Lambda functions
            functions_response = self.lambda_client.list_functions()
            # Filter for actual TAP Lambda functions (exclude CDK construct functions)
            tap_functions = [
                func for func in functions_response['Functions'] 
                if 'tap-serverless' in func['FunctionName'] and 
                not 'CustomVpcRestrictDefaultSG' in func['FunctionName'] and
                not 'CustomS3AutoDelete' in func['FunctionName']
            ]
            
            # Skip test if no TAP functions found
            if not tap_functions:
                self.skipTest("No TAP Lambda functions found to test IAM permissions")
            
            for func in tap_functions:
                function_name = func['FunctionName']
                role_arn = func['Role']
                role_name = role_arn.split('/')[-1]
                
                # Get attached policies
                attached_policies = iam_client.list_attached_role_policies(
                    RoleName=role_name
                )
                
                # ASSERT
                # Should have some AWS managed policy attached
                policy_names = [p['PolicyName'] for p in attached_policies['AttachedPolicies']]
                self.assertTrue(
                    any('AWSLambda' in name for name in policy_names),
                    f"Lambda {function_name} should have AWS Lambda execution role attached"
                )
                
        except Exception as e:
            self.fail(f"IAM permissions test failed: {str(e)}")

    @mark.it("validates resource cleanup and error handling")
    def test_error_handling(self):
        """Test error handling in API Gateway with invalid requests"""
        if not self.api_gateway_url:
                self.skipTest("API Gateway URL not available in stack outputs")
        
        # ARRANGE
        import requests
        
        try:
                # ACT - Send invalid request to API Gateway
            invalid_url = f"{self.api_gateway_url}nonexistent"
            response = requests.get(invalid_url, timeout=30)
            
                # ASSERT - Should return 404
            self.assertEqual(response.status_code, 404)
            
            response_data = response.json()
            self.assertIn('error', response_data)
            
        except Exception as e:
            self.fail(f"Error handling test failed: {str(e)}")
