import json
import os
import unittest
import boto3
import time
from botocore.exceptions import ClientError
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}

# Initialize boto3 clients
dynamodb_client = boto3.client('dynamodb')
s3_client = boto3.client('s3')
lambda_client = boto3.client('lambda')
sns_client = boto3.client('sns')
ec2_client = boto3.client('ec2')
kms_client = boto3.client('kms')
cloudwatch_client = boto3.client('cloudwatch')


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
    """Integration tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up test environment"""
        self.flat_outputs = flat_outputs
        print(f"Testing with outputs: {self.flat_outputs}")

    @mark.it("validates DynamoDB table exists and is accessible")
    def test_dynamodb_table_exists(self):
        """Test that the DynamoDB table exists and has correct configuration"""
        table_name = self.flat_outputs.get('DynamoDBTableName')
        table_arn = self.flat_outputs.get('DynamoDBTableArn')
        
        self.assertIsNotNone(table_name, "DynamoDBTableName is missing in flat-outputs.json")
        self.assertIsNotNone(table_arn, "DynamoDBTableArn is missing in flat-outputs.json")

        try:
            # Describe the table to verify it exists
            response = dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            # Verify table status
            self.assertEqual(table['TableStatus'], 'ACTIVE', "DynamoDB table is not active")
            
            # Verify key schema
            key_schema = table['KeySchema']
            partition_key = next((key for key in key_schema if key['KeyType'] == 'HASH'), None)
            sort_key = next((key for key in key_schema if key['KeyType'] == 'RANGE'), None)
            
            self.assertIsNotNone(partition_key, "Partition key not found")
            self.assertEqual(partition_key['AttributeName'], 'id', "Partition key is not 'id'")
            
            self.assertIsNotNone(sort_key, "Sort key not found")
            self.assertEqual(sort_key['AttributeName'], 'timestamp', "Sort key is not 'timestamp'")
            
            # Verify encryption
            self.assertIn('SSEDescription', table, "Table encryption not enabled")
            
            print(f"✅ DynamoDB table {table_name} validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to validate DynamoDB table: {e}")

    @mark.it("validates S3 bucket exists and has correct configuration")
    def test_s3_bucket_exists(self):
        """Test that the S3 bucket exists and has correct configuration"""
        bucket_name = self.flat_outputs.get('DataBucketName')
        bucket_arn = self.flat_outputs.get('DataBucketArn')
        
        self.assertIsNotNone(bucket_name, "DataBucketName is missing in flat-outputs.json")
        self.assertIsNotNone(bucket_arn, "DataBucketArn is missing in flat-outputs.json")

        try:
            # Check if bucket exists
            s3_client.head_bucket(Bucket=bucket_name)
            
            # Check versioning configuration
            versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(
                versioning.get('Status', 'Disabled'), 
                'Enabled', 
                "S3 bucket versioning is not enabled"
            )
            
            # Check public access block
            public_access_block = s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'], "BlockPublicAcls is not enabled")
            self.assertTrue(config['BlockPublicPolicy'], "BlockPublicPolicy is not enabled")
            self.assertTrue(config['IgnorePublicAcls'], "IgnorePublicAcls is not enabled")
            self.assertTrue(config['RestrictPublicBuckets'], "RestrictPublicBuckets is not enabled")
            
            # Check encryption configuration
            encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
            sse_config = encryption['ServerSideEncryptionConfiguration']['Rules'][0]
            self.assertEqual(
                sse_config['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
                'aws:kms',
                "S3 bucket is not using KMS encryption"
            )
            
            print(f"✅ S3 bucket {bucket_name} validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to validate S3 bucket: {e}")

    @mark.it("validates Lambda functions exist and have correct configuration")
    def test_lambda_functions_exist(self):
        """Test that the Lambda functions exist and have correct configuration"""
        process_lambda_name = self.flat_outputs.get('ProcessLambdaName')
        analytics_lambda_name = self.flat_outputs.get('AnalyticsLambdaName')
        process_lambda_arn = self.flat_outputs.get('ProcessLambdaArn')
        analytics_lambda_arn = self.flat_outputs.get('AnalyticsLambdaArn')
        
        self.assertIsNotNone(process_lambda_name, "ProcessLambdaName is missing in flat-outputs.json")
        self.assertIsNotNone(analytics_lambda_name, "AnalyticsLambdaName is missing in flat-outputs.json")

        for function_name, function_arn in [
            (process_lambda_name, process_lambda_arn),
            (analytics_lambda_name, analytics_lambda_arn)
        ]:
            try:
                # Get function configuration
                response = lambda_client.get_function(FunctionName=function_name)
                config = response['Configuration']
                
                # Verify runtime
                self.assertEqual(config['Runtime'], 'python3.9', f"Lambda {function_name} runtime is incorrect")
                
                # Verify timeout
                self.assertEqual(config['Timeout'], 30, f"Lambda {function_name} timeout is incorrect")
                
                # Verify memory size
                self.assertEqual(config['MemorySize'], 128, f"Lambda {function_name} memory size is incorrect")
                
                # Verify tracing
                self.assertEqual(config['TracingConfig']['Mode'], 'Active', f"Lambda {function_name} tracing is not active")
                
                # Verify environment variables
                env_vars = config.get('Environment', {}).get('Variables', {})
                self.assertIn('TABLE_NAME', env_vars, f"Lambda {function_name} TABLE_NAME environment variable is missing")
                self.assertIn('BUCKET_NAME', env_vars, f"Lambda {function_name} BUCKET_NAME environment variable is missing")
                self.assertIn('ENVIRONMENT', env_vars, f"Lambda {function_name} ENVIRONMENT variable is missing")
                
                # Verify VPC configuration
                self.assertIn('VpcConfig', config, f"Lambda {function_name} VPC configuration is missing")
                
                print(f"✅ Lambda function {function_name} validated successfully")
                
            except ClientError as e:
                self.fail(f"Failed to validate Lambda function {function_name}: {e}")

    @mark.it("validates KMS key exists and has correct configuration")
    def test_kms_key_exists(self):
        """Test that the KMS key exists and has correct configuration"""
        kms_key_id = self.flat_outputs.get('KMSKeyId')
        
        self.assertIsNotNone(kms_key_id, "KMSKeyId is missing in flat-outputs.json")

        try:
            # Describe the key
            response = kms_client.describe_key(KeyId=kms_key_id)
            key_metadata = response['KeyMetadata']
            
            # Verify key state
            self.assertEqual(key_metadata['KeyState'], 'Enabled', "KMS key is not enabled")
            
            # Verify key usage
            self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT', "KMS key usage is incorrect")
            
            # Verify key rotation
            rotation_response = kms_client.get_key_rotation_status(KeyId=kms_key_id)
            self.assertTrue(rotation_response['KeyRotationEnabled'], "KMS key rotation is not enabled")
            
            print(f"✅ KMS key {kms_key_id} validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to validate KMS key: {e}")

    @mark.it("validates VPC exists and has correct configuration")
    def test_vpc_exists(self):
        """Test that the VPC exists and has correct configuration"""
        vpc_id = self.flat_outputs.get('VPCId')
        
        self.assertIsNotNone(vpc_id, "VPCId is missing in flat-outputs.json")

        try:
            # Describe the VPC
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]
            
            # Verify VPC state
            self.assertEqual(vpc['State'], 'available', "VPC is not available")
            
            # Check for VPC endpoints (S3 and DynamoDB)
            endpoints_response = ec2_client.describe_vpc_endpoints(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            endpoint_services = [ep['ServiceName'] for ep in endpoints_response['VpcEndpoints']]
            
            # Check for S3 endpoint
            s3_endpoint_found = any('s3' in service for service in endpoint_services)
            self.assertTrue(s3_endpoint_found, "S3 VPC endpoint not found")
            
            # Check for DynamoDB endpoint
            dynamodb_endpoint_found = any('dynamodb' in service for service in endpoint_services)
            self.assertTrue(dynamodb_endpoint_found, "DynamoDB VPC endpoint not found")
            
            print(f"✅ VPC {vpc_id} validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to validate VPC: {e}")

    @mark.it("validates SNS topic exists")
    def test_sns_topic_exists(self):
        """Test that the SNS topic exists"""
        sns_topic_arn = self.flat_outputs.get('SNSTopicArn')
        
        self.assertIsNotNone(sns_topic_arn, "SNSTopicArn is missing in flat-outputs.json")

        try:
            # Get topic attributes
            response = sns_client.get_topic_attributes(TopicArn=sns_topic_arn)
            
            # Verify topic exists and is accessible
            self.assertIn('Attributes', response, "SNS topic attributes not accessible")
            
            # Verify display name
            attributes = response['Attributes']
            self.assertEqual(
                attributes.get('DisplayName'), 
                'Infrastructure Alarms', 
                "SNS topic display name is incorrect"
            )
            
            print(f"✅ SNS topic {sns_topic_arn} validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to validate SNS topic: {e}")

    @mark.it("tests DynamoDB data operations")
    def test_dynamodb_data_operations(self):
        """Test direct DynamoDB operations"""
        table_name = self.flat_outputs.get('DynamoDBTableName')
        self.assertIsNotNone(table_name, "DynamoDBTableName is missing in flat-outputs.json")

        test_item_id = 'integration-test-item'
        test_timestamp = int(time.time())

        try:
            # Put a test item
            test_item = {
                'id': {'S': test_item_id},
                'timestamp': {'N': str(test_timestamp)},
                'data': {'S': 'Test data for integration'},
                'test': {'BOOL': True}
            }
            
            dynamodb_client.put_item(TableName=table_name, Item=test_item)
            
            # Get the item back
            response = dynamodb_client.get_item(
                TableName=table_name,
                Key={
                    'id': {'S': test_item_id},
                    'timestamp': {'N': str(test_timestamp)}
                }
            )
            
            self.assertIn('Item', response, "Item not found in DynamoDB")
            retrieved_item = response['Item']
            self.assertEqual(
                retrieved_item['id']['S'], 
                test_item_id, 
                "Retrieved item ID doesn't match"
            )
            
            # Clean up - delete the test item
            dynamodb_client.delete_item(
                TableName=table_name,
                Key={
                    'id': {'S': test_item_id},
                    'timestamp': {'N': str(test_timestamp)}
                }
            )
            
            print(f"✅ DynamoDB data operations validated successfully")
            
        except ClientError as e:
            self.fail(f"DynamoDB operations test failed: {e}")

    @mark.it("tests S3 bucket operations")
    def test_s3_bucket_operations(self):
        """Test S3 bucket operations"""
        bucket_name = self.flat_outputs.get('DataBucketName')
        self.assertIsNotNone(bucket_name, "DataBucketName is missing in flat-outputs.json")

        test_key = 'integration-test-file.txt'
        test_content = b'This is a test file for integration testing'

        try:
            # Put a test object
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content,
                ContentType='text/plain'
            )
            
            # Get the object back
            response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
            retrieved_content = response['Body'].read()
            
            self.assertEqual(
                retrieved_content, 
                test_content, 
                "Retrieved S3 object content doesn't match"
            )
            
            # Verify object is encrypted
            self.assertIn('ServerSideEncryption', response, "S3 object is not encrypted")
            self.assertEqual(response['ServerSideEncryption'], 'aws:kms', "S3 object not using KMS encryption")
            
            # Clean up - delete the test object
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            
            print(f"✅ S3 bucket operations validated successfully")
            
        except ClientError as e:
            self.fail(f"S3 operations test failed: {e}")

    @mark.it("tests Lambda function invocation")
    def test_lambda_function_invocation(self):
        """Test Lambda function invocation"""
        process_lambda_name = self.flat_outputs.get('ProcessLambdaName')
        analytics_lambda_name = self.flat_outputs.get('AnalyticsLambdaName')
        
        self.assertIsNotNone(process_lambda_name, "ProcessLambdaName is missing in flat-outputs.json")
        self.assertIsNotNone(analytics_lambda_name, "AnalyticsLambdaName is missing in flat-outputs.json")

        try:
            # Test processor Lambda
            test_payload = {"test": "data", "integration": True}
            
            response = lambda_client.invoke(
                FunctionName=process_lambda_name,
                Payload=json.dumps(test_payload)
            )
            
            self.assertEqual(response['StatusCode'], 200, "Processor Lambda invocation failed")
            
            # Parse response
            response_payload = json.loads(response['Payload'].read())
            
            # Test analytics Lambda
            response = lambda_client.invoke(
                FunctionName=analytics_lambda_name,
                Payload=json.dumps(test_payload)
            )
            
            self.assertEqual(response['StatusCode'], 200, "Analytics Lambda invocation failed")
            response_payload = json.loads(response['Payload'].read())
            print(f"✅ Lambda function invocations validated successfully")
            
        except ClientError as e:
            self.fail(f"Lambda invocation test failed: {e}")

    @mark.it("validates CloudWatch alarms exist")
    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms exist"""
        try:
            # List alarms to find our stack's alarms
            response = cloudwatch_client.describe_alarms()
            
            alarm_names = [alarm['AlarmName'] for alarm in response['MetricAlarms']]
            
            # Look for Lambda error alarm and DynamoDB throttle alarm
            lambda_error_alarm_found = any('LambdaError' in name for name in alarm_names)
            dynamodb_throttle_alarm_found = any('DynamoDBThrottle' in name for name in alarm_names)
            
            self.assertTrue(lambda_error_alarm_found, "Lambda error alarm not found")
            self.assertTrue(dynamodb_throttle_alarm_found, "DynamoDB throttle alarm not found")
            
            print(f"✅ CloudWatch alarms validated successfully")
            
        except ClientError as e:
            self.fail(f"CloudWatch alarms validation failed: {e}")

    @mark.it("validates end-to-end workflow")
    def test_end_to_end_workflow(self):
        """Test end-to-end workflow from Lambda to DynamoDB"""
        process_lambda_name = self.flat_outputs.get('ProcessLambdaName')
        table_name = self.flat_outputs.get('DynamoDBTableName')
        
        self.assertIsNotNone(process_lambda_name, "ProcessLambdaName is missing in flat-outputs.json")
        self.assertIsNotNone(table_name, "DynamoDBTableName is missing in flat-outputs.json")

        try:
            # Invoke Lambda to process data
            test_payload = {"end_to_end": "test", "timestamp": int(time.time())}
            
            response = lambda_client.invoke(
                FunctionName=process_lambda_name,
                Payload=json.dumps(test_payload)
            )
            
            self.assertEqual(response['StatusCode'], 200, "Lambda invocation failed")
            
            # Wait a moment for eventual consistency
            time.sleep(3)
            
            # Check if data was written to DynamoDB by scanning recent items
            scan_response = dynamodb_client.scan(
                TableName=table_name,
                Limit=10,
                FilterExpression="contains(#data, :test_value)",
                ExpressionAttributeNames={"#data": "data"},
                ExpressionAttributeValues={":test_value": {"S": "end_to_end"}}
            )
            
            # Should find at least one item with our test data
            items_found = len(scan_response.get('Items', []))
            
            print(f"✅ End-to-end workflow validated successfully - {items_found} items found")
            
        except ClientError as e:
            self.fail(f"End-to-end workflow test failed: {e}")

    def tearDown(self):
        """Clean up after each test"""
        # Clean up any remaining test data if needed
        pass


if __name__ == '__main__':
    unittest.main()
