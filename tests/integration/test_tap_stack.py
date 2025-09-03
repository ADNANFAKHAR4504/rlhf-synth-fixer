import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark
import requests
import time
import uuid

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

# Initialize AWS clients
dynamodb = boto3.client('dynamodb')
s3 = boto3.client('s3')
ssm = boto3.client('ssm')
lambda_client = boto3.client('lambda')
apigateway = boto3.client('apigateway')
ec2 = boto3.client('ec2')
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up test environment"""
        self.env_suffix = os.getenv('ENV_SUFFIX', 'dev')
        self.stack_name = f"TapStack{self.env_suffix}"
        
        # Expected output keys from TapStack
        self.vpc_id_key = f"{self.stack_name}.VPCId"
        self.dynamodb_table_key = f"{self.stack_name}.DynamoDBTableName"
        self.s3_bucket_key = f"{self.stack_name}.S3BucketName"
        self.security_group_key = f"{self.stack_name}.LambdaSecurityGroupId"

    @mark.it("verifies VPC exists and is configured correctly")
    def test_vpc_exists_and_configured(self):
        # ARRANGE
        vpc_id = flat_outputs.get(self.vpc_id_key)
        
        # ASSERT
        self.assertIsNotNone(vpc_id, f"VPC ID not found in outputs with key {self.vpc_id_key}")
        
        # ACT - Query VPC details
        response = ec2.describe_vpcs(VpcIds=[vpc_id])
        
        # ASSERT
        self.assertEqual(len(response['Vpcs']), 1, "VPC not found")
        vpc = response['Vpcs'][0]
        
        # Verify VPC configuration
        self.assertEqual(vpc['CidrBlock'], "10.0.0.0/16", "VPC CIDR block incorrect")
        self.assertTrue(vpc['EnableDnsHostnames'], "DNS hostnames not enabled")
        self.assertTrue(vpc['EnableDnsSupport'], "DNS support not enabled")
        
        # Check for VPC endpoints
        endpoints = ec2.describe_vpc_endpoints(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        
        service_names = [ep['ServiceName'] for ep in endpoints['VpcEndpoints']]
        self.assertTrue(any('s3' in sn for sn in service_names), "S3 VPC endpoint not found")
        self.assertTrue(any('dynamodb' in sn for sn in service_names), "DynamoDB VPC endpoint not found")

    @mark.it("verifies DynamoDB table exists with correct configuration")
    def test_dynamodb_table_exists(self):
        # ARRANGE
        table_name = flat_outputs.get(self.dynamodb_table_key)
        
        # ASSERT
        self.assertIsNotNone(table_name, f"DynamoDB table name not found with key {self.dynamodb_table_key}")
        
        # ACT
        response = dynamodb.describe_table(TableName=table_name)
        
        # ASSERT
        table = response['Table']
        self.assertEqual(table['TableStatus'], 'ACTIVE', "Table not active")
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST', 
                        "Billing mode not PAY_PER_REQUEST")
        
        # Verify key schema
        key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
        self.assertEqual(key_schema.get('pk'), 'HASH', "Primary key 'pk' not configured correctly")
        self.assertEqual(key_schema.get('sk'), 'RANGE', "Sort key 'sk' not configured correctly")
        
        # Verify GSI
        gsi_names = [gsi['IndexName'] for gsi in table.get('GlobalSecondaryIndexes', [])]
        self.assertIn('StatusIndex', gsi_names, "StatusIndex GSI not found")
        
        # Verify point-in-time recovery
        pitr_response = dynamodb.describe_continuous_backups(TableName=table_name)
        self.assertEqual(
            pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'],
            'ENABLED',
            "Point-in-time recovery not enabled"
        )

    @mark.it("verifies S3 bucket exists with correct configuration")
    def test_s3_bucket_exists(self):
        # ARRANGE
        bucket_name = flat_outputs.get(self.s3_bucket_key)
        
        # ASSERT
        self.assertIsNotNone(bucket_name, f"S3 bucket name not found with key {self.s3_bucket_key}")
        
        # ACT & ASSERT - Check bucket exists
        try:
            s3.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} does not exist: {e}")
        
        # Verify versioning
        versioning = s3.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled', "Versioning not enabled")
        
        # Verify encryption
        encryption = s3.get_bucket_encryption(Bucket=bucket_name)
        self.assertIn('Rules', encryption['ServerSideEncryptionConfiguration'])
        
        # Verify lifecycle rules
        lifecycle = s3.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        self.assertIn('Rules', lifecycle)
        rule_ids = [rule['Id'] for rule in lifecycle['Rules']]
        self.assertIn('LogRetentionRule', rule_ids, "LogRetentionRule not found")
        
        # Verify public access block
        public_access = s3.get_public_access_block(Bucket=bucket_name)
        config = public_access['PublicAccessBlockConfiguration']
        self.assertTrue(config['BlockPublicAcls'], "Public ACLs not blocked")
        self.assertTrue(config['BlockPublicPolicy'], "Public policy not blocked")
        self.assertTrue(config['IgnorePublicAcls'], "Public ACLs not ignored")
        self.assertTrue(config['RestrictPublicBuckets'], "Public buckets not restricted")

    @mark.it("verifies SSM parameters exist")
    def test_ssm_parameters_exist(self):
        # ARRANGE
        api_param = f"/serverless/config/api-settings-{self.env_suffix}"
        db_param = f"/serverless/config/database-{self.env_suffix}"
        
        # ACT & ASSERT - API config parameter
        try:
            api_response = ssm.get_parameter(Name=api_param)
            api_config = json.loads(api_response['Parameter']['Value'])
            self.assertIn('timeout', api_config)
            self.assertIn('retry_attempts', api_config)
            self.assertIn('log_level', api_config)
        except ClientError as e:
            self.fail(f"API config parameter {api_param} not found: {e}")
        
        # Database config parameter
        try:
            db_response = ssm.get_parameter(Name=db_param)
            db_config = json.loads(db_response['Parameter']['Value'])
            self.assertIn('table_name', db_config)
            self.assertIn('region', db_config)
        except ClientError as e:
            self.fail(f"Database config parameter {db_param} not found: {e}")

    @mark.it("verifies Lambda security group exists")
    def test_lambda_security_group_exists(self):
        # ARRANGE
        sg_id = flat_outputs.get(self.security_group_key)
        
        # ASSERT
        self.assertIsNotNone(sg_id, f"Security group ID not found with key {self.security_group_key}")
        
        # ACT
        response = ec2.describe_security_groups(GroupIds=[sg_id])
        
        # ASSERT
        self.assertEqual(len(response['SecurityGroups']), 1, "Security group not found")
        sg = response['SecurityGroups'][0]
        self.assertEqual(sg['GroupDescription'], "Security group for Lambda functions")


@mark.describe("LambdaFuncStack Integration Tests")
class TestLambdaFuncStackIntegration(unittest.TestCase):
    """Integration tests for the LambdaFuncStack"""

    def setUp(self):
        """Set up test environment"""
        self.env_suffix = os.getenv('ENV_SUFFIX', 'dev')
        self.stack_name = f"LambdaFuncStack{self.env_suffix}"
        
        # Expected output keys
        self.lambda_name_key = f"{self.stack_name}.LambdaFunctionName"
        self.lambda_arn_key = f"{self.stack_name}.LambdaFunctionArn"
        
        # TapStack outputs needed for testing
        self.tap_stack = f"TapStack{self.env_suffix}"
        self.dynamodb_table_key = f"{self.tap_stack}.DynamoDBTableName"
        self.s3_bucket_key = f"{self.tap_stack}.S3BucketName"

    @mark.it("verifies Lambda function exists and is configured correctly")
    def test_lambda_function_exists(self):
        # ARRANGE
        function_name = flat_outputs.get(self.lambda_name_key)
        
        # ASSERT
        self.assertIsNotNone(function_name, f"Lambda function name not found with key {self.lambda_name_key}")
        
        # ACT
        response = lambda_client.get_function(FunctionName=function_name)
        
        # ASSERT
        config = response['Configuration']
        self.assertEqual(config['Runtime'], 'python3.11', "Runtime not Python 3.11")
        self.assertEqual(config['Handler'], 'index.lambda_handler', "Handler incorrect")
        self.assertEqual(config['MemorySize'], 512, "Memory size not 512 MB")
        self.assertEqual(config['Timeout'], 30, "Timeout not 30 seconds")
        
        # Verify environment variables
        env_vars = config.get('Environment', {}).get('Variables', {})
        self.assertIn('DYNAMODB_TABLE_NAME', env_vars)
        self.assertIn('S3_BUCKET_NAME', env_vars)
        self.assertIn('CONFIG_PARAMETER_NAME', env_vars)
        
        # Verify VPC configuration
        vpc_config = config.get('VpcConfig', {})
        self.assertIn('SubnetIds', vpc_config)
        self.assertIn('SecurityGroupIds', vpc_config)
        self.assertTrue(len(vpc_config['SubnetIds']) > 0, "No subnets configured")
        self.assertTrue(len(vpc_config['SecurityGroupIds']) > 0, "No security groups configured")

    @mark.it("verifies Lambda function can be invoked successfully")
    def test_lambda_invocation(self):
        # ARRANGE
        function_name = flat_outputs.get(self.lambda_name_key)
        self.assertIsNotNone(function_name, "Lambda function name not found")
        
        # Create a test event for listing items
        test_event = {
            "httpMethod": "GET",
            "path": "/items",
            "queryStringParameters": {"limit": "5"}
        }
        
        # ACT
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )
        
        # ASSERT
        self.assertEqual(response['StatusCode'], 200, "Lambda invocation failed")
        
        # Parse response
        payload = json.loads(response['Payload'].read())
        self.assertIn('statusCode', payload)
        self.assertEqual(payload['statusCode'], 200, "Lambda returned non-200 status")
        
        # Verify response body
        body = json.loads(payload.get('body', '{}'))
        self.assertIn('items', body)
        self.assertIn('count', body)

    @mark.it("verifies Lambda can write to DynamoDB")
    def test_lambda_dynamodb_write(self):
        # ARRANGE
        function_name = flat_outputs.get(self.lambda_name_key)
        table_name = flat_outputs.get(self.dynamodb_table_key)
        self.assertIsNotNone(function_name, "Lambda function name not found")
        self.assertIsNotNone(table_name, "DynamoDB table name not found")
        
        # Create a test item
        test_data = {
            "test_field": f"integration_test_{uuid.uuid4().hex[:8]}",
            "timestamp": time.time()
        }
        
        test_event = {
            "httpMethod": "POST",
            "path": "/items",
            "body": json.dumps({"data": test_data})
        }
        
        # ACT - Create item via Lambda
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )
        
        # ASSERT
        payload = json.loads(response['Payload'].read())
        self.assertEqual(payload['statusCode'], 201, "Item creation failed")
        
        body = json.loads(payload['body'])
        self.assertIn('id', body, "Item ID not returned")
        item_id = body['id']
        
        # Verify item exists in DynamoDB
        db_response = dynamodb.get_item(
            TableName=table_name,
            Key={
                'pk': {'S': f"ITEM#{item_id}"},
                'sk': {'S': body['sk']}
            }
        )
        self.assertIn('Item', db_response, "Item not found in DynamoDB")

    @mark.it("verifies Lambda can write logs to S3")
    def test_lambda_s3_logging(self):
        # ARRANGE
        function_name = flat_outputs.get(self.lambda_name_key)
        bucket_name = flat_outputs.get(self.s3_bucket_key)
        self.assertIsNotNone(function_name, "Lambda function name not found")
        self.assertIsNotNone(bucket_name, "S3 bucket name not found")
        
        # ACT - Invoke Lambda to trigger S3 logging
        test_event = {
            "httpMethod": "GET",
            "path": "/items",
            "queryStringParameters": {"limit": "1"}
        }
        
        lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )
        
        # Give time for async S3 write
        time.sleep(2)
        
        # ASSERT - Check if logs exist in S3
        today = time.strftime('%Y/%m/%d')
        prefix = f"logs/{today}/"
        
        response = s3.list_objects_v2(
            Bucket=bucket_name,
            Prefix=prefix,
            MaxKeys=10
        )
        
        self.assertIn('Contents', response, f"No logs found in S3 bucket with prefix {prefix}")
        self.assertTrue(len(response['Contents']) > 0, "No log files created")

    @mark.it("verifies Lambda IAM role has correct permissions")
    def test_lambda_iam_permissions(self):
        # ARRANGE
        function_name = flat_outputs.get(self.lambda_name_key)
        self.assertIsNotNone(function_name, "Lambda function name not found")
        
        # ACT - Get function configuration
        response = lambda_client.get_function(FunctionName=function_name)
        role_arn = response['Configuration']['Role']
        
        # Get role name from ARN
        role_name = role_arn.split('/')[-1]
        
        # Get IAM client
        iam = boto3.client('iam')
        
        # Get attached policies
        attached_policies = iam.list_attached_role_policies(RoleName=role_name)
        policy_names = [p['PolicyName'] for p in attached_policies['AttachedPolicies']]
        
        # ASSERT - Check for VPC execution role
        self.assertTrue(
            any('AWSLambdaVPCAccessExecutionRole' in name for name in policy_names),
            "VPC Access Execution Role not attached"
        )
        
        # Get inline policies
        inline_policies = iam.list_role_policies(RoleName=role_name)
        self.assertTrue(len(inline_policies['PolicyNames']) > 0, "No inline policies found")

    @mark.it("verifies CloudWatch metrics are published")
    def test_cloudwatch_metrics(self):
        # ARRANGE
        function_name = flat_outputs.get(self.lambda_name_key)
        self.assertIsNotNone(function_name, "Lambda function name not found")
        
        # Invoke function to generate metrics
        test_event = {
            "httpMethod": "GET",
            "path": "/items"
        }
        
        lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )
        
        # Give time for metrics to be published
        time.sleep(5)
        
        # ACT - Query CloudWatch metrics
        end_time = time.time()
        start_time = end_time - 300  # Last 5 minutes
        
        response = cloudwatch.list_metrics(
            Namespace='ServerlessApp',
            MetricName='SuccessfulRequests'
        )
        
        # ASSERT
        self.assertTrue(len(response['Metrics']) > 0, "Custom metrics not found")


@mark.describe("End-to-End Integration Tests")
class TestEndToEndIntegration(unittest.TestCase):
    """End-to-end integration tests for the complete stack"""

    def setUp(self):
        """Set up test environment"""
        self.env_suffix = os.getenv('ENV_SUFFIX', 'dev')
        self.lambda_name_key = f"LambdaFuncStack{self.env_suffix}.LambdaFunctionName"
        self.function_name = flat_outputs.get(self.lambda_name_key)

    @mark.it("performs complete CRUD operations")
    def test_complete_crud_operations(self):
        # ARRANGE
        self.assertIsNotNone(self.function_name, "Lambda function name not found")
        
        # CREATE - Post new item
        create_data = {
            "name": "Integration Test Item",
            "value": 42,
            "timestamp": time.time()
        }
        
        create_event = {
            "httpMethod": "POST",
            "path": "/items",
            "body": json.dumps({"data": create_data})
        }
        
        create_response = lambda_client.invoke(
            FunctionName=self.function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(create_event)
        )
        
        create_payload = json.loads(create_response['Payload'].read())
        self.assertEqual(create_payload['statusCode'], 201, "Create failed")
        
        created_item = json.loads(create_payload['body'])
        item_id = created_item['id']
        
        # READ - Get the item
        get_event = {
            "httpMethod": "GET",
            "path": f"/items/{item_id}"
        }
        
        get_response = lambda_client.invoke(
            FunctionName=self.function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(get_event)
        )
        
        get_payload = json.loads(get_response['Payload'].read())
        self.assertEqual(get_payload['statusCode'], 200, "Get failed")
        
        # UPDATE - Modify the item
        update_data = {
            "name": "Updated Integration Test Item",
            "value": 84,
            "updated": True
        }
        
        update_event = {
            "httpMethod": "PUT",
            "path": f"/items/{item_id}",
            "body": json.dumps({"data": update_data})
        }
        
        update_response = lambda_client.invoke(
            FunctionName=self.function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(update_event)
        )
        
        update_payload = json.loads(update_response['Payload'].read())
        self.assertEqual(update_payload['statusCode'], 200, "Update failed")
        
        # DELETE - Remove the item
        delete_event = {
            "httpMethod": "DELETE",
            "path": f"/items/{item_id}"
        }
        
        delete_response = lambda_client.invoke(
            FunctionName=self.function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(delete_event)
        )
        
        delete_payload = json.loads(delete_response['Payload'].read())
        self.assertEqual(delete_payload['statusCode'], 200, "Delete failed")
        
        # Verify deletion
        verify_event = {
            "httpMethod": "GET",
            "path": f"/items/{item_id}"
        }
        
        verify_response = lambda_client.invoke(
            FunctionName=self.function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(verify_event)
        )
        
        verify_payload = json.loads(verify_response['Payload'].read())
        self.assertEqual(verify_payload['statusCode'], 404, "Item not deleted")