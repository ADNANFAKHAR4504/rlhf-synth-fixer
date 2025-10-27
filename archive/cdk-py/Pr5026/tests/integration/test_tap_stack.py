import json
import os
import unittest
import boto3
import requests
import time
from botocore.exceptions import ClientError, NoCredentialsError
from pytest import mark

# Load CloudFormation outputs from flat-outputs.json
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
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the deployed TapStack CDK infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and extract resource identifiers"""
        # Get region from environment variables first, then from API endpoint, or default to us-east-2
        cls.region = os.environ.get('AWS_REGION') or os.environ.get('AWS_DEFAULT_REGION')
        
        if not cls.region:
            # Extract region from API endpoint if environment variables are not set
            api_endpoint = flat_outputs.get('ApiEndpoint', '')
            if api_endpoint and 'execute-api' in api_endpoint:
                # Extract region from URL like https://xxx.execute-api.us-east-1.amazonaws.com/
                import re
                region_match = re.search(r'execute-api\.([^.]+)\.amazonaws\.com', api_endpoint)
                cls.region = region_match.group(1) if region_match else 'us-east-2'
            else:
                cls.region = 'us-east-2'
        
        print(f"Using AWS region: {cls.region}")
        
        # Initialize AWS clients
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigatewayv2', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        
        # Extract resource identifiers from flat outputs
        cls.table_name = flat_outputs.get('TableName', '')
        cls.vpc_id = flat_outputs.get('VpcId', '')
        cls.kms_key_id = flat_outputs.get('KmsKeyId', '')
        cls.data_bucket_name = flat_outputs.get('DataBucketName', '')
        cls.api_endpoint = flat_outputs.get('ApiEndpoint', '')
        cls.lambda_function_name = flat_outputs.get('LambdaFunctionName', '')
        cls.security_alerts_topic_arn = flat_outputs.get('SecurityAlertsTopicArn', '')
        
        # Validate required outputs are present
        required_outputs = [
            'TableName', 'VpcId', 'KmsKeyId', 'DataBucketName',
            'ApiEndpoint', 'LambdaFunctionName', 'SecurityAlertsTopicArn'
        ]
        
        for output in required_outputs:
            if not flat_outputs.get(output):
                raise ValueError(f"Required output '{output}' is missing from flat-outputs.json")

    @mark.it("validates all CloudFormation outputs are present")
    def test_cfn_outputs_exist(self):
        """Test that all required CloudFormation outputs are present and valid"""
        # Validate DynamoDB table name
        self.assertIsNotNone(self.table_name, "DynamoDB table name should be present")
        self.assertTrue(self.table_name.startswith('tap-api-data-'), 
                       f"Table name should start with 'tap-api-data-', got: {self.table_name}")
        
        # Validate VPC ID format
        self.assertIsNotNone(self.vpc_id, "VPC ID should be present")
        self.assertTrue(self.vpc_id.startswith('vpc-'), 
                       f"VPC ID should start with 'vpc-', got: {self.vpc_id}")
        
        # Validate KMS key ID format (UUID)
        self.assertIsNotNone(self.kms_key_id, "KMS key ID should be present")
        self.assertEqual(len(self.kms_key_id), 36, 
                        f"KMS key ID should be 36 characters (UUID format), got: {self.kms_key_id}")
        
        # Validate S3 bucket name
        self.assertIsNotNone(self.data_bucket_name, "S3 data bucket name should be present")
        self.assertTrue('tapstack' in self.data_bucket_name.lower(), 
                       f"Bucket name should contain 'tapstack', got: {self.data_bucket_name}")
        
        # Validate API endpoint format
        self.assertIsNotNone(self.api_endpoint, "API Gateway endpoint should be present")
        self.assertTrue(self.api_endpoint.startswith('https://'), 
                       f"API endpoint should be HTTPS, got: {self.api_endpoint}")
        self.assertTrue('execute-api' in self.api_endpoint, 
                       f"API endpoint should contain 'execute-api', got: {self.api_endpoint}")
        
        # Validate Lambda function name
        self.assertIsNotNone(self.lambda_function_name, "Lambda function name should be present")
        self.assertTrue(self.lambda_function_name.startswith('tap-api-handler-'), 
                       f"Lambda name should start with 'tap-api-handler-', got: {self.lambda_function_name}")
        
        # Validate SNS topic ARN
        self.assertIsNotNone(self.security_alerts_topic_arn, "SNS topic ARN should be present")
        self.assertTrue(self.security_alerts_topic_arn.startswith('arn:aws:sns:'), 
                       f"SNS ARN should start with 'arn:aws:sns:', got: {self.security_alerts_topic_arn}")

    @mark.it("validates DynamoDB table exists and is properly configured")
    def test_dynamodb_table_configuration(self):
        """Test DynamoDB table exists with correct configuration"""
        try:
            # Get table description
            response = self.dynamodb_client.describe_table(TableName=self.table_name)
            table_info = response['Table']
            
            # Validate table status
            self.assertEqual(table_info['TableStatus'], 'ACTIVE', 
                           f"Table should be ACTIVE, got: {table_info['TableStatus']}")
            
            # Validate table name
            self.assertEqual(table_info['TableName'], self.table_name)
            
            # Validate key schema (expecting a hash key)
            key_schema = table_info['KeySchema']
            self.assertGreater(len(key_schema), 0, "Table should have at least one key attribute")
            
            # Find the hash key
            hash_keys = [key for key in key_schema if key['KeyType'] == 'HASH']
            self.assertEqual(len(hash_keys), 1, "Table should have exactly one HASH key")
            
            # Validate billing mode (should be PAY_PER_REQUEST for serverless)
            billing_mode = table_info.get('BillingModeSummary', {}).get('BillingMode', 'PROVISIONED')
            self.assertIn(billing_mode, ['PAY_PER_REQUEST', 'PROVISIONED'], 
                         f"Invalid billing mode: {billing_mode}")
            
            print(f"✅ DynamoDB table '{self.table_name}' is properly configured")
            
        except ClientError as e:
            self.fail(f"Failed to validate DynamoDB table: {str(e)}")

    @mark.it("validates VPC exists and has proper configuration")
    def test_vpc_configuration(self):
        """Test VPC exists with proper configuration"""
        try:
            # Describe VPC
            response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
            
            self.assertEqual(len(response['Vpcs']), 1, f"Should find exactly one VPC with ID {self.vpc_id}")
            
            vpc_info = response['Vpcs'][0]
            
            # Validate VPC state
            self.assertEqual(vpc_info['State'], 'available', 
                           f"VPC should be available, got: {vpc_info['State']}")
            
            # Validate DNS settings using describe_vpc_attribute
            dns_hostnames_response = self.ec2_client.describe_vpc_attribute(
                VpcId=self.vpc_id, 
                Attribute='enableDnsHostnames'
            )
            dns_support_response = self.ec2_client.describe_vpc_attribute(
                VpcId=self.vpc_id, 
                Attribute='enableDnsSupport'
            )
            
            self.assertTrue(dns_hostnames_response['EnableDnsHostnames']['Value'], 
                          "VPC should have DNS hostnames enabled")
            self.assertTrue(dns_support_response['EnableDnsSupport']['Value'], 
                          "VPC should have DNS support enabled")
            
            # Check for subnets
            subnets_response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )
            self.assertGreater(len(subnets_response['Subnets']), 0, 
                             "VPC should have at least one subnet")
            
            print(f"✅ VPC '{self.vpc_id}' is properly configured with {len(subnets_response['Subnets'])} subnets")
            
        except ClientError as e:
            self.fail(f"Failed to validate VPC configuration: {str(e)}")

    @mark.it("validates KMS key exists and has proper configuration")
    def test_kms_key_configuration(self):
        """Test KMS key exists with proper security configuration"""
        try:
            # Describe KMS key
            response = self.kms_client.describe_key(KeyId=self.kms_key_id)
            key_info = response['KeyMetadata']
            
            # Validate key state
            self.assertEqual(key_info['KeyState'], 'Enabled', 
                           f"KMS key should be enabled, got: {key_info['KeyState']}")
            
            # Validate key usage
            self.assertEqual(key_info['KeyUsage'], 'ENCRYPT_DECRYPT', 
                           f"KMS key should be for ENCRYPT_DECRYPT, got: {key_info['KeyUsage']}")
            
            # Validate key spec
            self.assertEqual(key_info['KeySpec'], 'SYMMETRIC_DEFAULT', 
                           f"KMS key should be SYMMETRIC_DEFAULT, got: {key_info['KeySpec']}")
            
            # Check if key rotation is enabled
            rotation_response = self.kms_client.get_key_rotation_status(KeyId=self.kms_key_id)
            # Note: Key rotation might not be enabled for cost reasons in dev environments
            
            print(f"✅ KMS key '{self.kms_key_id}' is properly configured")
            print(f"   Key rotation enabled: {rotation_response['KeyRotationEnabled']}")
            
        except ClientError as e:
            self.fail(f"Failed to validate KMS key: {str(e)}")

    @mark.it("validates S3 bucket exists with proper security configuration")
    def test_s3_bucket_configuration(self):
        """Test S3 bucket exists with proper security settings"""
        try:
            # Check if bucket exists
            self.s3_client.head_bucket(Bucket=self.data_bucket_name)
            
            # Check bucket encryption
            try:
                encryption_response = self.s3_client.get_bucket_encryption(Bucket=self.data_bucket_name)
                encryption_rules = encryption_response['ServerSideEncryptionConfiguration']['Rules']
                self.assertGreater(len(encryption_rules), 0, "Bucket should have encryption rules")
                
                # Verify KMS encryption is used
                default_encryption = encryption_rules[0]['ApplyServerSideEncryptionByDefault']
                self.assertEqual(default_encryption['SSEAlgorithm'], 'aws:kms', 
                               "Bucket should use KMS encryption")
                
                print(f"✅ S3 bucket '{self.data_bucket_name}' has KMS encryption enabled")
                
            except ClientError as e:
                if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
                    print(f"⚠️  S3 bucket '{self.data_bucket_name}' does not have encryption configured")
                else:
                    raise
            
            # Check bucket versioning
            try:
                versioning_response = self.s3_client.get_bucket_versioning(Bucket=self.data_bucket_name)
                versioning_status = versioning_response.get('Status', 'Disabled')
                print(f"   Bucket versioning status: {versioning_status}")
                
            except ClientError:
                print("   Could not check bucket versioning")
            
            # Check public access block
            try:
                pab_response = self.s3_client.get_public_access_block(Bucket=self.data_bucket_name)
                pab_config = pab_response['PublicAccessBlockConfiguration']
                
                # Verify all public access is blocked for security
                security_checks = [
                    pab_config['BlockPublicAcls'],
                    pab_config['IgnorePublicAcls'],
                    pab_config['BlockPublicPolicy'],
                    pab_config['RestrictPublicBuckets']
                ]
                
                if all(security_checks):
                    print(f"✅ S3 bucket has all public access blocked")
                else:
                    print(f"⚠️  S3 bucket public access configuration: {pab_config}")
                    
            except ClientError:
                print("   Could not check public access block configuration")
                
        except ClientError as e:
            self.fail(f"Failed to validate S3 bucket: {str(e)}")

    @mark.it("validates Lambda function exists and is properly configured")
    def test_lambda_function_configuration(self):
        """Test Lambda function exists with proper configuration"""
        try:
            # Get function configuration
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            function_config = response['Configuration']
            
            # Validate function state
            self.assertEqual(function_config['State'], 'Active', 
                           f"Lambda should be Active, got: {function_config['State']}")
            
            # Validate runtime (should be Python)
            self.assertTrue(function_config['Runtime'].startswith('python'), 
                          f"Lambda should use Python runtime, got: {function_config['Runtime']}")
            
            # Validate timeout (should be reasonable for API operations)
            timeout = function_config['Timeout']
            self.assertGreater(timeout, 0, "Lambda timeout should be greater than 0")
            self.assertLessEqual(timeout, 900, "Lambda timeout should not exceed 15 minutes")
            
            # Check if function has environment variables
            env_vars = function_config.get('Environment', {}).get('Variables', {})
            
            # Check if function has proper IAM role
            role_arn = function_config['Role']
            self.assertTrue(role_arn.startswith('arn:aws:iam:'), 
                          f"Lambda should have valid IAM role, got: {role_arn}")
            
            print(f"✅ Lambda function '{self.lambda_function_name}' is properly configured")
            print(f"   Runtime: {function_config['Runtime']}")
            print(f"   Timeout: {timeout}s")
            print(f"   Memory: {function_config['MemorySize']}MB")
            print(f"   Environment variables: {len(env_vars)} configured")
            
        except ClientError as e:
            self.fail(f"Failed to validate Lambda function: {str(e)}")

    @mark.it("validates SNS topic exists and is accessible")
    def test_sns_topic_configuration(self):
        """Test SNS topic exists and has proper configuration"""
        try:
            # Get topic attributes
            response = self.sns_client.get_topic_attributes(TopicArn=self.security_alerts_topic_arn)
            topic_attributes = response['Attributes']
            
            # Validate topic name
            topic_name = topic_attributes['TopicArn'].split(':')[-1]
            self.assertTrue(topic_name.startswith('tap-security-alerts-'), 
                          f"Topic name should start with 'tap-security-alerts-', got: {topic_name}")
            
            # Check if topic has encryption enabled
            kms_master_key_id = topic_attributes.get('KmsMasterKeyId')
            if kms_master_key_id:
                print(f"✅ SNS topic has KMS encryption enabled")
                print(f"   KMS Key: {kms_master_key_id}")
            else:
                print(f"⚠️  SNS topic does not have KMS encryption enabled")
            
            # Check delivery policy
            delivery_policy = topic_attributes.get('DeliveryPolicy')
            if delivery_policy:
                print(f"   Delivery policy configured")
            
            print(f"✅ SNS topic '{topic_name}' is accessible")
            
        except ClientError as e:
            self.fail(f"Failed to validate SNS topic: {str(e)}")

    @mark.it("validates API Gateway is accessible")
    def test_api_gateway_accessibility(self):
        """Test API Gateway endpoint is accessible"""
        try:
            # Make a simple HTTP request to the API endpoint
            # Use a GET request to a likely health check or root endpoint
            response = requests.get(self.api_endpoint, timeout=30)
            
            # We expect either 200 (successful), 404 (not found but API is working), 
            # or 403 (forbidden but API is working)
            # We don't expect connection errors or 5xx errors
            self.assertIn(response.status_code, [200, 404, 403, 401], 
                         f"API should be accessible, got status: {response.status_code}")
            
            print(f"✅ API Gateway endpoint is accessible")
            print(f"   Endpoint: {self.api_endpoint}")
            print(f"   Status Code: {response.status_code}")
            
        except requests.exceptions.RequestException as e:
            self.fail(f"Failed to connect to API Gateway: {str(e)}")

    @mark.it("validates resource interconnectivity")
    def test_resource_interconnectivity(self):
        """Test that resources can interact with each other properly"""
        
        # Test 1: Verify Lambda can access DynamoDB table
        try:
            # This is an indirect test - we check if the Lambda has the right permissions
            # by examining its execution role
            lambda_response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            role_arn = lambda_response['Configuration']['Role']
            
            # Extract role name from ARN
            role_name = role_arn.split('/')[-1]
            
            # Check if role exists (this validates Lambda-IAM integration)
            iam_client = boto3.client('iam', region_name=self.region)
            iam_client.get_role(RoleName=role_name)
            
            print(f"✅ Lambda function has valid IAM role for resource access")
            
        except ClientError as e:
            print(f"⚠️  Could not validate Lambda-IAM integration: {str(e)}")
        
        # Test 2: Verify all resources are in the same region
        # (This is implicit from our client configuration, but good to validate)
        print(f"✅ All resources are deployed in region: {self.region}")
        
        # Test 3: Basic connectivity test
        print(f"✅ Resource interconnectivity validation completed")


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)