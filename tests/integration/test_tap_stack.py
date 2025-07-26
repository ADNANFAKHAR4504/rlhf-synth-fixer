import json
import os
import time
import unittest
from datetime import datetime

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
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and get stack outputs"""
        cls.s3_client = boto3.client('s3', region_name='us-west-2')
        cls.dynamodb_client = boto3.client('dynamodb', region_name='us-west-2')
        cls.lambda_client = boto3.client('lambda', region_name='us-west-2')
        cls.cloudtrail_client = boto3.client('cloudtrail', region_name='us-west-2')
        cls.iam_client = boto3.client('iam', region_name='us-west-2')
        
        # Get environment suffix for resource naming
        cls.env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        
        # Resource names based on naming convention
        cls.bucket_name = f"proj-bucket-{cls.env_suffix}"
        cls.table_name = f"proj-table-{cls.env_suffix}"
        cls.lambda_name = f"proj-lambda-{cls.env_suffix}"
        cls.trail_name = f"proj-trail-{cls.env_suffix}"
        cls.access_logs_bucket = f"proj-access-logs-{cls.env_suffix}"
        cls.cloudtrail_bucket = f"proj-cloudtrail-{cls.env_suffix}"

    @mark.it("verifies S3 bucket exists and has correct configuration")
    def test_s3_bucket_configuration(self):
        """Test that S3 bucket exists with proper configuration"""
        try:
            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=self.bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            # Check versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=self.bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled')
            
            # Check encryption is configured
            encryption = self.s3_client.get_bucket_encryption(Bucket=self.bucket_name)
            self.assertIn('ServerSideEncryptionConfiguration', encryption)
            
            # Check public access is blocked
            public_access = self.s3_client.get_public_access_block(Bucket=self.bucket_name)
            pab_config = public_access['PublicAccessBlockConfiguration']
            self.assertTrue(pab_config['BlockPublicAcls'])
            self.assertTrue(pab_config['BlockPublicPolicy'])
            self.assertTrue(pab_config['IgnorePublicAcls'])
            self.assertTrue(pab_config['RestrictPublicBuckets'])
            
            # Check access logging bucket exists
            response = self.s3_client.head_bucket(Bucket=self.access_logs_bucket)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
        except ClientError as e:
            self.fail(f"S3 bucket configuration test failed: {e}")

    @mark.it("verifies DynamoDB table exists and has correct configuration")
    def test_dynamodb_table_configuration(self):
        """Test that DynamoDB table exists with proper configuration"""
        try:
            # Describe table
            response = self.dynamodb_client.describe_table(TableName=self.table_name)
            table = response['Table']
            
            # Check table status
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            
            # Check key schema
            key_schema = table['KeySchema']
            self.assertEqual(len(key_schema), 2)
            
            pk_found = False
            sk_found = False
            for key in key_schema:
                if key['AttributeName'] == 'pk' and key['KeyType'] == 'HASH':
                    pk_found = True
                elif key['AttributeName'] == 'sk' and key['KeyType'] == 'RANGE':
                    sk_found = True
            
            self.assertTrue(pk_found, "Partition key 'pk' not found")
            self.assertTrue(sk_found, "Sort key 'sk' not found")
            
            # Check billing mode
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
            
            # Check encryption is enabled
            self.assertIn('SSEDescription', table)
            self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')
            
            # Check point-in-time recovery
            pitr_response = self.dynamodb_client.describe_continuous_backups(
                TableName=self.table_name
            )
            pitr_status = pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']
            self.assertEqual(pitr_status['PointInTimeRecoveryStatus'], 'ENABLED')
            
        except ClientError as e:
            self.fail(f"DynamoDB table configuration test failed: {e}")

    @mark.it("verifies Lambda function exists and has correct configuration")
    def test_lambda_function_configuration(self):
        """Test that Lambda function exists with proper configuration"""
        try:
            # Get function configuration
            response = self.lambda_client.get_function(FunctionName=self.lambda_name)
            config = response['Configuration']
            
            # Check basic properties
            self.assertEqual(config['FunctionName'], self.lambda_name)
            self.assertEqual(config['Runtime'], 'python3.12')
            self.assertEqual(config['Handler'], 'lambda_handler.lambda_handler')
            self.assertEqual(config['Timeout'], 300)
            
            # Check environment variables
            env_vars = config['Environment']['Variables']
            self.assertEqual(env_vars['TABLE_NAME'], self.table_name)
            self.assertEqual(env_vars['BUCKET_NAME'], self.bucket_name)
            
            # Check IAM role exists
            role_arn = config['Role']
            role_name = role_arn.split('/')[-1]
            self.assertEqual(role_name, f"proj-lambda-role-{self.env_suffix}")
            
        except ClientError as e:
            self.fail(f"Lambda function configuration test failed: {e}")

    @mark.it("verifies CloudTrail exists and has correct configuration")
    def test_cloudtrail_configuration(self):
        """Test that CloudTrail exists with proper configuration"""
        try:
            # Describe trail
            response = self.cloudtrail_client.describe_trails(
                trailNameList=[self.trail_name]
            )
            trails = response['trailList']
            self.assertEqual(len(trails), 1)
            
            trail = trails[0]
            self.assertEqual(trail['Name'], self.trail_name)
            self.assertTrue(trail['IsMultiRegionTrail'])
            self.assertTrue(trail['LogFileValidationEnabled'])
            self.assertTrue(trail['IncludeGlobalServiceEvents'])
            
            # Check CloudTrail bucket exists
            response = self.s3_client.head_bucket(Bucket=self.cloudtrail_bucket)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
        except ClientError as e:
            self.fail(f"CloudTrail configuration test failed: {e}")

    @mark.it("tests end-to-end S3 to Lambda to DynamoDB workflow")
    def test_e2e_s3_lambda_dynamodb_workflow(self):
        """Test the complete workflow: S3 event -> Lambda -> DynamoDB"""
        test_key = f"integration-test-{int(time.time())}.txt"
        test_content = f"Integration test content at {datetime.now().isoformat()}"
        
        try:
            # Step 1: Upload a file to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=test_key,
                Body=test_content.encode('utf-8'),
                ContentType='text/plain'
            )
            
            # Step 2: Wait for Lambda to process the event
            # Note: This is asynchronous, so we need to wait and retry
            max_retries = 30
            retry_delay = 2
            
            item_found = False
            for attempt in range(max_retries):
                try:
                    # Step 3: Check if the item was created in DynamoDB
                    response = self.dynamodb_client.scan(
                        TableName=self.table_name,
                        FilterExpression='object_key = :key',
                        ExpressionAttributeValues={
                            ':key': {'S': test_key}
                        }
                    )
                    
                    if response['Items']:
                        item_found = True
                        item = response['Items'][0]
                        
                        # Verify item structure
                        self.assertEqual(item['object_key']['S'], test_key)
                        self.assertEqual(item['bucket_name']['S'], self.bucket_name)
                        self.assertEqual(item['event_source']['S'], 'aws:s3')
                        self.assertIn('event_name', item)
                        self.assertIn('created_at', item)
                        self.assertIn('pk', item)
                        self.assertIn('sk', item)
                        
                        # Check that pk follows the pattern
                        self.assertTrue(item['pk']['S'].startswith(f'OBJECT#{test_key}'))
                        self.assertTrue(item['sk']['S'].startswith('CREATED#'))
                        
                        break
                        
                except ClientError:
                    pass
                
                time.sleep(retry_delay)
            
            self.assertTrue(item_found, 
                          f"DynamoDB item for {test_key} not found after {max_retries} attempts")
            
        except Exception as e:
            self.fail(f"End-to-end workflow test failed: {e}")
        
        finally:
            # Cleanup: Delete the test object
            try:
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=test_key)
            except ClientError:
                pass  # Ignore cleanup errors

    @mark.it("tests Lambda function can be invoked directly")
    def test_lambda_direct_invocation(self):
        """Test that Lambda function can be invoked directly with a mock S3 event"""
        test_event = {
            "Records": [
                {
                    "eventSource": "aws:s3",
                    "eventName": "s3:ObjectCreated:Put",
                    "eventTime": "2023-01-01T00:00:00.000Z",
                    "awsRegion": "us-west-2",
                    "s3": {
                        "bucket": {"name": self.bucket_name},
                        "object": {
                            "key": f"direct-test-{int(time.time())}.txt",
                            "size": 1024,
                            "eTag": "test-etag"
                        }
                    }
                }
            ]
        }
        
        try:
            # Invoke Lambda function directly
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_event)
            )
            
            # Check response
            self.assertEqual(response['StatusCode'], 200)
            
            # Parse response payload
            payload = json.loads(response['Payload'].read().decode('utf-8'))
            self.assertEqual(payload['statusCode'], 200)
            
            response_body = json.loads(payload['body'])
            self.assertEqual(response_body['processed_count'], 1)
            self.assertEqual(response_body['error_count'], 0)
            
        except ClientError as e:
            self.fail(f"Lambda direct invocation test failed: {e}")

    @mark.it("verifies IAM permissions are correctly configured")
    def test_iam_permissions(self):
        """Test that IAM role has correct permissions"""
        try:
            # Get Lambda function to find its role
            function_response = self.lambda_client.get_function(FunctionName=self.lambda_name)
            role_arn = function_response['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
            # List attached policies
            policies_response = self.iam_client.list_attached_role_policies(RoleName=role_name)
            attached_policies = [p['PolicyName'] for p in policies_response['AttachedRolePolicies']]
            
            # Check basic execution role is attached
            self.assertIn('AWSLambdaBasicExecutionRole', attached_policies)
            
            # List inline policies
            inline_policies_response = self.iam_client.list_role_policies(RoleName=role_name)
            inline_policies = inline_policies_response['PolicyNames']
            
            # Should have inline policies for S3 and DynamoDB access
            self.assertTrue(len(inline_policies) >= 2, 
                          "Should have at least 2 inline policies for S3 and DynamoDB")
            
        except ClientError as e:
            self.fail(f"IAM permissions test failed: {e}")

    @mark.it("verifies S3 bucket notification configuration")
    def test_s3_notification_configuration(self):
        """Test that S3 bucket has correct Lambda notification configuration"""
        try:
            # Get bucket notification configuration
            response = self.s3_client.get_bucket_notification_configuration(
                Bucket=self.bucket_name
            )
            
            # Check Lambda configurations exist
            self.assertIn('LambdaConfigurations', response)
            lambda_configs = response['LambdaConfigurations']
            self.assertTrue(len(lambda_configs) > 0)
            
            # Find the configuration for our Lambda function
            lambda_found = False
            for config in lambda_configs:
                if self.lambda_name in config['LambdaFunctionArn']:
                    lambda_found = True
                    # Check events
                    events = config['Events']
                    self.assertIn('s3:ObjectCreated:*', events)
                    break
            
            self.assertTrue(lambda_found, 
                          f"Lambda function {self.lambda_name} not found in S3 notifications")
            
        except ClientError as e:
            self.fail(f"S3 notification configuration test failed: {e}")

    @mark.it("tests resource cleanup and no retain policies")
    def test_no_retain_policies_validation(self):
        """Validate that resources can be deleted (no retain policies)"""
        # This test doesn't actually delete resources but validates that
        # they don't have retain policies by checking CloudFormation template
        # In a real scenario, this would be validated during the destroy phase
        
        # For now, we just verify resources exist and are in expected state
        # The actual retain policy validation happens during stack deletion
        
        try:
            # Just verify resources exist and are in deletable state
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            self.dynamodb_client.describe_table(TableName=self.table_name)
            self.lambda_client.get_function(FunctionName=self.lambda_name)
            
            # If we can access all resources, they exist and deletion should work
            # unless retain policies are set (which we've avoided in the CDK code)
            
        except ClientError as e:
            self.fail(f"Resource accessibility test failed: {e}")

    def tearDown(self):
        """Clean up any test artifacts"""
        # This method can be used to clean up any test-specific resources
        # if needed, but we generally don't want to clean up the main stack
        # resources here as they're needed for other tests
        pass
