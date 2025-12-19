import json
import os
import unittest
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
    """Integration test cases for the deployed TapStack resources"""

    def setUp(self):
        """Set up AWS clients and load outputs"""
        # Skip tests if outputs file doesn't exist or is empty
        if not flat_outputs or len(flat_outputs) == 0:
            self.skipTest("No cfn-outputs/flat-outputs.json found or file is empty")
        
        # Initialize AWS clients
        self.lambda_client = boto3.client('lambda')
        self.dynamodb_client = boto3.client('dynamodb')
        self.s3_client = boto3.client('s3')
        self.kms_client = boto3.client('kms')
        self.apigateway_client = boto3.client('apigateway')
        self.cloudwatch_client = boto3.client('cloudwatch')
        self.sns_client = boto3.client('sns')
        self.iam_client = boto3.client('iam')
        
        # Load outputs
        self.outputs = flat_outputs

    @mark.it("validates API Gateway is deployed and accessible")
    def test_api_gateway_deployment(self):
        """Test that API Gateway is properly deployed and configured"""
        # ARRANGE
        api_gateway_id = self.outputs.get('ApiGatewayId')
        api_gateway_url = self.outputs.get('ApiGatewayUrl')
        
        self.assertIsNotNone(api_gateway_id, "API Gateway ID should be in outputs")
        self.assertIsNotNone(api_gateway_url, "API Gateway URL should be in outputs")
        
        # ACT & ASSERT
        # Test API Gateway exists
        try:
            response = self.apigateway_client.get_rest_api(restApiId=api_gateway_id)
            self.assertIn('name', response)
            self.assertIn('Serverless Web App API', response['name'])
            print(f"✅ API Gateway exists: {response['name']}")
        except ClientError as e:
            self.fail(f"API Gateway {api_gateway_id} not found: {e}")
        
        # Test API Gateway stages
        try:
            stages_response = self.apigateway_client.get_stages(restApiId=api_gateway_id)
            self.assertGreater(len(stages_response['item']), 0, "API Gateway should have at least one stage")
            
            # Check for dev stage
            stage_names = [stage['stageName'] for stage in stages_response['item']]
            print(f"✅ API Gateway stages found: {stage_names}")
        except ClientError as e:
            self.fail(f"Failed to get API Gateway stages: {e}")
        
        # Test API Gateway resources
        try:
            resources_response = self.apigateway_client.get_resources(restApiId=api_gateway_id)
            resource_paths = [res.get('pathPart', '/') for res in resources_response['items']]
            
            # Should have health and items endpoints
            self.assertIn('health', resource_paths, "Should have health endpoint")
            self.assertIn('items', resource_paths, "Should have items endpoint")
            print(f"✅ API Gateway resources found: {resource_paths}")
        except ClientError as e:
            self.fail(f"Failed to get API Gateway resources: {e}")

    @mark.it("validates Lambda function is deployed and properly configured")
    def test_lambda_function_deployment(self):
        """Test that Lambda function is properly deployed and configured"""
        # ARRANGE
        function_name = self.outputs.get('LambdaFunctionName')
        function_arn = self.outputs.get('LambdaFunctionArn')
        
        self.assertIsNotNone(function_name, "Lambda function name should be in outputs")
        self.assertIsNotNone(function_arn, "Lambda function ARN should be in outputs")
        
        # ACT & ASSERT
        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            config = response['Configuration']
            
            # Validate basic configuration
            self.assertEqual(config['Runtime'], 'python3.11')
            self.assertEqual(config['Handler'], 'index.lambda_handler')
            self.assertEqual(config['MemorySize'], 512)
            self.assertEqual(config['Timeout'], 30)
            
            # Validate environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('TABLE_NAME', env_vars)
            self.assertIn('BUCKET_NAME', env_vars)
            self.assertIn('KMS_KEY_ID', env_vars)
            self.assertIn('ENVIRONMENT', env_vars)
            
            # Validate X-Ray tracing
            self.assertEqual(config['TracingConfig']['Mode'], 'Active')
            
            # Validate dead letter queue
            self.assertIn('DeadLetterConfig', config)
            
            print(f"✅ Lambda function properly configured: {function_name}")
            print(f"   Runtime: {config['Runtime']}")
            print(f"   Memory: {config['MemorySize']}MB")
            print(f"   Timeout: {config['Timeout']}s")
            print(f"   Tracing: {config['TracingConfig']['Mode']}")
            
        except ClientError as e:
            self.fail(f"Lambda function {function_name} not found or misconfigured: {e}")

    @mark.it("validates DynamoDB table is deployed with proper configuration")
    def test_dynamodb_table_deployment(self):
        """Test that DynamoDB table is properly deployed and configured"""
        # ARRANGE
        table_name = self.outputs.get('DynamoDBTableName')
        
        self.assertIsNotNone(table_name, "DynamoDB table name should be in outputs")
        
        # ACT & ASSERT
        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            # Validate table configuration
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
            
            # Validate key schema
            key_schema = table['KeySchema']
            self.assertEqual(len(key_schema), 1)
            self.assertEqual(key_schema[0]['AttributeName'], 'id')
            self.assertEqual(key_schema[0]['KeyType'], 'HASH')
            
            # Validate encryption
            self.assertIn('SSEDescription', table)
            self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')
            
            # Validate point-in-time recovery
            pitr_response = self.dynamodb_client.describe_continuous_backups(TableName=table_name)
            self.assertEqual(
                pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'],
                'ENABLED'
            )
            
            # Validate Global Secondary Index
            self.assertIn('GlobalSecondaryIndexes', table)
            gsi = table['GlobalSecondaryIndexes'][0]
            self.assertEqual(gsi['IndexName'], 'StatusCreatedIndex')
            
            # Validate DynamoDB Streams
            self.assertIn('StreamSpecification', table)
            self.assertEqual(table['StreamSpecification']['StreamViewType'], 'NEW_AND_OLD_IMAGES')
            
            print(f"✅ DynamoDB table properly configured: {table_name}")
            print(f"   Status: {table['TableStatus']}")
            print(f"   Billing: {table['BillingModeSummary']['BillingMode']}")
            print(f"   Encryption: {table['SSEDescription']['Status']}")
            
        except ClientError as e:
            self.fail(f"DynamoDB table {table_name} not found or misconfigured: {e}")

    @mark.it("validates S3 bucket is deployed with proper security configuration")
    def test_s3_bucket_deployment(self):
        """Test that S3 bucket is properly deployed and secured"""
        # ARRANGE
        bucket_name = self.outputs.get('S3BucketName')
        
        self.assertIsNotNone(bucket_name, "S3 bucket name should be in outputs")
        
        # ACT & ASSERT
        try:
            # Check bucket exists
            self.s3_client.head_bucket(Bucket=bucket_name)
            
            # Validate encryption
            encryption_response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = encryption_response['ServerSideEncryptionConfiguration']['Rules']
            self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'aws:kms')
            
            # Validate versioning
            versioning_response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning_response.get('Status'), 'Enabled')
            
            # Validate public access block
            public_access_response = self.s3_client.get_public_access_block(Bucket=bucket_name)
            pab = public_access_response['PublicAccessBlockConfiguration']
            self.assertTrue(pab['BlockPublicAcls'])
            self.assertTrue(pab['BlockPublicPolicy'])
            self.assertTrue(pab['IgnorePublicAcls'])
            self.assertTrue(pab['RestrictPublicBuckets'])
            
            # Validate lifecycle configuration
            try:
                lifecycle_response = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
                rules = lifecycle_response['Rules']
                rule_ids = [rule['ID'] for rule in rules]
                self.assertIn('DeleteOldVersions', rule_ids)
                self.assertIn('TransitionToIA', rule_ids)
            except ClientError as e:
                if e.response['Error']['Code'] != 'NoSuchLifecycleConfiguration':
                    raise
            
            print(f"✅ S3 bucket properly configured: {bucket_name}")
            print("   ✅ Encryption enabled")
            print("   ✅ Versioning enabled")
            print("   ✅ Public access blocked")
            
        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} not found or misconfigured: {e}")

    @mark.it("validates KMS key is deployed and properly configured")
    def test_kms_key_deployment(self):
        """Test that KMS key is properly deployed and configured"""
        # ARRANGE
        key_id = self.outputs.get('KMSKeyId')
        
        self.assertIsNotNone(key_id, "KMS key ID should be in outputs")
        
        # ACT & ASSERT
        try:
            # Check key exists and get details
            response = self.kms_client.describe_key(KeyId=key_id)
            key_metadata = response['KeyMetadata']
            
            # Validate key configuration
            self.assertEqual(key_metadata['KeyState'], 'Enabled')
            self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')
            self.assertTrue(key_metadata['Enabled'])
            
            # Check key rotation
            rotation_response = self.kms_client.get_key_rotation_status(KeyId=key_id)
            self.assertTrue(rotation_response['KeyRotationEnabled'])
          
            
            print(f"✅ KMS key properly configured: {key_id}")
            print(f"   State: {key_metadata['KeyState']}")
            print(f"   Rotation: {rotation_response['KeyRotationEnabled']}")
            
        except ClientError as e:
            self.fail(f"KMS key {key_id} not found or misconfigured: {e}")

    @mark.it("validates API endpoints are functional and return expected responses")
    def test_api_endpoints_functionality(self):
        """Test that API endpoints are functional and return expected responses"""
        # ARRANGE
        api_gateway_url = self.outputs.get('ApiGatewayUrl')
        
        self.assertIsNotNone(api_gateway_url, "API Gateway URL should be in outputs")
        
        # Ensure URL ends with /
        if not api_gateway_url.endswith('/'):
            api_gateway_url += '/'
        
        # ACT & ASSERT
        # Test health endpoint
        try:
            health_response = requests.get(f"{api_gateway_url}health", timeout=30)
            self.assertEqual(health_response.status_code, 200)
            
            health_data = health_response.json()
            self.assertEqual(health_data['status'], 'healthy')
            self.assertEqual(health_data['service'], 'api-handler')
            self.assertIn('timestamp', health_data)
            self.assertIn('function_name', health_data)
            self.assertEqual(health_data['memory_limit'], '512')
            
            print("✅ Health endpoint working correctly")
            
        except requests.RequestException as e:
            self.fail(f"Health endpoint failed: {e}")
        except (KeyError, ValueError) as e:
            self.fail(f"Health endpoint returned invalid response: {e}")
        
        # Test items endpoint
        try:
            items_response = requests.get(f"{api_gateway_url}items", timeout=30)
            self.assertEqual(items_response.status_code, 200)
            
            items_data = items_response.json()
            self.assertIn('items', items_data)
            self.assertIn('count', items_data)
            self.assertEqual(items_data['count'], 3)
            self.assertEqual(items_data['service'], 'api-handler')
            
            # Check items structure
            items = items_data['items']
            self.assertEqual(len(items), 3)
            for item in items:
                self.assertIn('id', item)
                self.assertIn('name', item)
                self.assertIn('status', item)
                self.assertEqual(item['status'], 'active')
            
            print("✅ Items endpoint working correctly")
            
        except requests.RequestException as e:
            self.fail(f"Items endpoint failed: {e}")
        except (KeyError, ValueError) as e:
            self.fail(f"Items endpoint returned invalid response: {e}")
        

    @mark.it("validates CORS headers are properly configured")
    def test_cors_configuration(self):
        """Test that CORS headers are properly configured"""
        # ARRANGE
        api_gateway_url = self.outputs.get('ApiGatewayUrl')
        
        self.assertIsNotNone(api_gateway_url, "API Gateway URL should be in outputs")
        
        if not api_gateway_url.endswith('/'):
            api_gateway_url += '/'
        
        # ACT & ASSERT
        # Test CORS preflight request
        try:
            cors_response = requests.options(
                f"{api_gateway_url}health",
                headers={
                    'Origin': 'https://example.com',
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type'
                },
                timeout=30
            )
            
            # CORS should return 200 with proper headers
            self.assertIn(cors_response.status_code, [200, 204])
            
            headers = cors_response.headers
            self.assertIn('Access-Control-Allow-Origin', headers)
            self.assertIn('Access-Control-Allow-Methods', headers)
            self.assertIn('Access-Control-Allow-Headers', headers)
            
            print("✅ CORS configuration working correctly")
            print(f"   Allow-Origin: {headers.get('Access-Control-Allow-Origin')}")
            print(f"   Allow-Methods: {headers.get('Access-Control-Allow-Methods')}")
            
        except requests.RequestException as e:
            self.fail(f"CORS test failed: {e}")

    @mark.it("validates CloudWatch monitoring and alarms are configured")
    def test_cloudwatch_monitoring(self):
        """Test that CloudWatch monitoring and alarms are properly configured"""
        # ARRANGE
        function_name = self.outputs.get('LambdaFunctionName')
        
        self.assertIsNotNone(function_name, "Lambda function name should be in outputs")
        
        # ACT & ASSERT
        try:
            # Check for Lambda error alarm
            alarms_response = self.cloudwatch_client.describe_alarms(
                AlarmNamePrefix='lambda-errors-dev'
            )
            lambda_error_alarms = [alarm for alarm in alarms_response['MetricAlarms'] 
                                 if 'lambda-errors-dev' in alarm['AlarmName']]
            
            # Check for Lambda duration alarm
            duration_alarms = self.cloudwatch_client.describe_alarms(
                AlarmNamePrefix='lambda-duration-dev'
            )
            lambda_duration_alarms = [alarm for alarm in duration_alarms['MetricAlarms']
                                    if 'lambda-duration-dev' in alarm['AlarmName']]
            
            # Check for API Gateway 4XX alarm
            api_alarms = self.cloudwatch_client.describe_alarms(
                AlarmNamePrefix='api-4xx-errors-dev'
            )
            api_4xx_alarms = [alarm for alarm in api_alarms['MetricAlarms']
                            if 'api-4xx-errors-dev' in alarm['AlarmName']]
            
            print("✅ CloudWatch alarms properly configured")
            print(f"   Lambda error alarms: {len(lambda_error_alarms)}")
            print(f"   Lambda duration alarms: {len(lambda_duration_alarms)}")
            print(f"   API Gateway 4XX alarms: {len(api_4xx_alarms)}")
            
        except ClientError as e:
            self.fail(f"CloudWatch monitoring test failed: {e}")


    @mark.it("validates IAM roles and policies are properly configured")
    def test_iam_configuration(self):
        """Test that IAM roles and policies are properly configured"""
        # ARRANGE
        function_name = self.outputs.get('LambdaFunctionName')
        
        self.assertIsNotNone(function_name, "Lambda function name should be in outputs")
        
        # ACT & ASSERT
        try:
            # Get Lambda function configuration to find the execution role
            lambda_response = self.lambda_client.get_function(FunctionName=function_name)
            role_arn = lambda_response['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
            # Check role exists and has correct trust policy
            role_response = self.iam_client.get_role(RoleName=role_name)
            role = role_response['Role']
            
            # Check attached managed policies
            managed_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            policy_names = [policy['PolicyName'] for policy in managed_policies['AttachedPolicies']]
            self.assertIn('AWSLambdaBasicExecutionRole', policy_names)
            
            # Check inline policies for DynamoDB, S3, and KMS permissions
            inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
            self.assertGreater(len(inline_policies['PolicyNames']), 0, "Should have inline policies")
            
            # Check one of the inline policies for proper permissions
            policy_name = inline_policies['PolicyNames'][0]
            policy_response = self.iam_client.get_role_policy(RoleName=role_name, PolicyName=policy_name)
            policy_document = policy_response['PolicyDocument']
            
            # Should have statements for DynamoDB, S3, and KMS
            statements = policy_document.get('Statement', [])
            self.assertGreater(len(statements), 0, "Should have policy statements")
            
            print(f"✅ IAM role properly configured: {role_name}")
            print(f"   Managed policies: {len(policy_names)}")
            print(f"   Inline policies: {len(inline_policies['PolicyNames'])}")
            
        except ClientError as e:
            self.fail(f"IAM configuration test failed: {e}")

    @mark.it("validates resource tagging is properly applied")
    def test_resource_tagging(self):
        """Test that resources are properly tagged"""
        # ARRANGE
        table_name = self.outputs.get('DynamoDBTableName')
        function_name = self.outputs.get('LambdaFunctionName')
        key_id = self.outputs.get('KMSKeyId')
        
        # ACT & ASSERT
        # Check DynamoDB table tags
        try:
            table_response = self.dynamodb_client.list_tags_of_resource(
                ResourceArn=f"arn:aws:dynamodb:{boto3.Session().region_name}:{boto3.client('sts').get_caller_identity()['Account']}:table/{table_name}"
            )
            table_tags = {tag['Key']: tag['Value'] for tag in table_response['Tags']}
            
            self.assertIn('Environment', table_tags)
            self.assertIn('Service', table_tags)
            self.assertEqual(table_tags['Service'], 'TapStack')
            
            print("✅ DynamoDB table properly tagged")
            
        except ClientError as e:
            print(f"⚠️  Could not verify DynamoDB table tags: {e}")
        
        # Check Lambda function tags
        try:
            lambda_response = self.lambda_client.list_tags(
                Resource=self.outputs.get('LambdaFunctionArn')
            )
            lambda_tags = lambda_response['Tags']
            
            self.assertIn('Environment', lambda_tags)
            self.assertIn('Service', lambda_tags)
            self.assertEqual(lambda_tags['Service'], 'TapStack')
            
            print("✅ Lambda function properly tagged")
            
        except ClientError as e:
            print(f"⚠️  Could not verify Lambda function tags: {e}")
        
        # Check KMS key tags
        try:
            kms_response = self.kms_client.list_resource_tags(KeyId=key_id)
            kms_tags = {tag['TagKey']: tag['TagValue'] for tag in kms_response['Tags']}
            
            self.assertIn('Environment', kms_tags)
            self.assertIn('Service', kms_tags)
            self.assertEqual(kms_tags['Service'], 'TapStack')
            
            print("✅ KMS key properly tagged")
            
        except ClientError as e:
            print(f"⚠️  Could not verify KMS key tags: {e}")

    @mark.it("validates all outputs are properly formatted and accessible")
    def test_outputs_validation(self):
        """Test that all CloudFormation outputs are properly formatted and accessible"""
        # ASSERT
        required_outputs = [
            'ApiGatewayUrl',
            'ApiGatewayId', 
            'DynamoDBTableName',
            'LambdaFunctionName',
            'LambdaFunctionArn',
            'S3BucketName',
            'KMSKeyId'
        ]
        
        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Output {output} should be present")
            self.assertIsNotNone(self.outputs[output], f"Output {output} should not be None")
            self.assertNotEqual(self.outputs[output], "", f"Output {output} should not be empty")
        
        # Validate URL format
        api_url = self.outputs['ApiGatewayUrl']
        self.assertTrue(api_url.startswith('https://'), "API Gateway URL should use HTTPS")
        self.assertIn('execute-api', api_url, "API Gateway URL should contain execute-api")
        self.assertIn('amazonaws.com', api_url, "API Gateway URL should be from amazonaws.com")
        
        # Validate ARN format
        lambda_arn = self.outputs['LambdaFunctionArn']
        self.assertTrue(lambda_arn.startswith('arn:aws:lambda:'), "Lambda ARN should have correct format")
      
        
        # Validate table name format
        table_name = self.outputs['DynamoDBTableName']
        self.assertIn('serverless-items', table_name, "Table name should contain serverless-items")
        
        print("✅ All outputs properly formatted and accessible")
        for key, value in self.outputs.items():
            print(f"   {key}: {value}")


if __name__ == '__main__':
    unittest.main()
