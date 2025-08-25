import json
import os
import unittest

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load the CloudFormation outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}

# If we get environment suffix directly from the deployment
env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')


@mark.describe("TapStack")
@mark.integration
class TestTapStack(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for integration tests"""
        cls.outputs = flat_outputs
        
        # Initialize boto3 session to check for credentials
        session = boto3.Session()
        credentials = session.get_credentials()
        
        # Check if AWS credentials are actually available
        if credentials is None:
            cls.has_credentials = False
            # Create placeholder clients for tests that don't make actual API calls
            cls.lambda_client = None
            cls.s3_client = None
            cls.apigateway_client = None
            cls.cloudwatch_client = None
        else:
            try:
                # Initialize AWS clients
                cls.lambda_client = session.client('lambda', region_name='us-east-1')
                cls.s3_client = session.client('s3', region_name='us-east-1')
                cls.apigateway_client = session.client('apigateway', region_name='us-east-1')
                cls.cloudwatch_client = session.client('cloudwatch', region_name='us-east-1')
                cls.has_credentials = True
            except Exception:
                cls.has_credentials = False
                # Create placeholder clients for tests that don't make actual API calls
                cls.lambda_client = None
                cls.s3_client = None
                cls.apigateway_client = None
                cls.cloudwatch_client = None
    
    def setUp(self):
        """Additional setup for each test"""
        pass

    @mark.it("API Gateway endpoint should be accessible")
    def test_api_endpoint_exists(self):
        """Verify the API Gateway endpoint output exists and is correctly formatted"""
        self.assertIn('apiEndpoint', self.outputs, "apiEndpoint not found in outputs")
        api_url = self.outputs['apiEndpoint']
        
        # Check URL format
        self.assertTrue(api_url.startswith('https://'), 
                        f"API endpoint should start with https://, got: {api_url}")
        self.assertTrue('.execute-api.' in api_url, 
                        f"API endpoint doesn't look like an API Gateway URL: {api_url}")
    
    @mark.it("S3 bucket should be accessible")
    def test_s3_bucket_exists(self):
        """Verify the S3 bucket exists"""
        self.assertIn('s3BucketName', self.outputs, "s3BucketName not found in outputs")
        bucket_name = self.outputs['s3BucketName']
        
        # Check bucket name format
        self.assertTrue('tap-processing-bucket' in bucket_name,
                        f"Bucket name doesn't include expected prefix: {bucket_name}")
        self.assertIn('environmentSuffix', self.outputs, "environmentSuffix not found in outputs")
        self.assertTrue(self.outputs['environmentSuffix'] in bucket_name,
                        f"Bucket name doesn't include environment suffix: {bucket_name}")
    
    @mark.it("Lambda functions should be properly configured")
    def test_lambda_functions_exist(self):
        """Verify the Lambda functions exist"""
        # Check image processor Lambda
        self.assertIn('imageProcessorArn', self.outputs, "imageProcessorArn not found in outputs")
        image_processor_arn = self.outputs['imageProcessorArn']
        self.assertTrue('tap-image-processor' in image_processor_arn,
                        f"Lambda ARN doesn't contain expected function name: {image_processor_arn}")
        
        # Check data analyzer Lambda
        self.assertIn('dataAnalyzerArn', self.outputs, "dataAnalyzerArn not found in outputs")
        data_analyzer_arn = self.outputs['dataAnalyzerArn']
        self.assertTrue('tap-data-analyzer' in data_analyzer_arn,
                        f"Lambda ARN doesn't contain expected function name: {data_analyzer_arn}")
        
        # Check notification handler Lambda
        self.assertIn('notificationHandlerArn', self.outputs, "notificationHandlerArn not found in outputs")
        notification_handler_arn = self.outputs['notificationHandlerArn']
        self.assertTrue('tap-notification-handler' in notification_handler_arn,
                        f"Lambda ARN doesn't contain expected function name: {notification_handler_arn}")
    
    @mark.it("S3 bucket should have proper security settings")
    def test_s3_bucket_security(self):
        """Verify the S3 bucket has proper security settings"""
        if 's3BucketName' not in self.outputs:
            self.skipTest("s3BucketName not found in outputs, skipping test")
        
        if not self.has_credentials:
            self.skipTest("AWS credentials not available, skipping test")
            
        bucket_name = self.outputs['s3BucketName']
        
        try:
            # Check bucket exists
            self.s3_client.head_bucket(Bucket=bucket_name)
            
            # Check bucket encryption
            try:
                encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                rules = encryption.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
                self.assertTrue(len(rules) > 0, "Bucket should have encryption configured")
            except ClientError as e:
                if 'ServerSideEncryptionConfigurationNotFoundError' in str(e):
                    self.fail("Bucket encryption not enabled")
                else:
                    raise
                
            # Check bucket policy (optional)
            try:
                policy = self.s3_client.get_bucket_policy(Bucket=bucket_name)
                self.assertIsNotNone(policy.get('Policy'), "Bucket policy should be defined")
            except ClientError as e:
                if 'NoSuchBucketPolicy' in str(e):
                    # Skip test if no policy is defined, as it might be intentional
                    pass
                else:
                    raise
            
        except ClientError as e:
            if 'NotFound' in str(e) or 'NoSuchBucket' in str(e):
                self.fail(f"Bucket {bucket_name} not found")
            else:
                self.fail(f"Failed to verify S3 bucket: {e}")
    
    @mark.it("Lambda functions should be properly configured")
    def test_lambda_functions_configuration(self):
        """Verify Lambda functions have the expected configuration"""
        # Test image processor Lambda
        if 'imageProcessorArn' not in self.outputs:
            self.skipTest("imageProcessorArn not found in outputs, skipping test")
            
        if not self.has_credentials:
            self.skipTest("AWS credentials not available, skipping test")
            
        image_processor_arn = self.outputs['imageProcessorArn']
        function_name = image_processor_arn.split(':')[-1]
        
        try:
            # Get Lambda configuration
            response = self.lambda_client.get_function(
                FunctionName=function_name
            )
            
            config = response['Configuration']
            
            # Verify Lambda config
            self.assertGreaterEqual(config.get('Timeout', 0), 10, 
                                  f"Lambda timeout should be at least 10 seconds, got {config.get('Timeout')}")
            self.assertGreaterEqual(int(config.get('MemorySize', 0)), 256, 
                                  f"Lambda memory should be at least 256MB, got {config.get('MemorySize')}")
            
            # Check runtime
            runtime = config.get('Runtime', '')
            self.assertTrue(runtime in ['nodejs18.x', 'nodejs20.x', 'python3.9', 'python3.10', 'python3.11'], 
                          f"Lambda should use a supported runtime, got {runtime}")
            
        except ClientError as e:
            self.fail(f"Failed to verify Lambda function: {e}")
    
    @mark.it("API Gateway should be properly configured")
    def test_api_gateway_configuration(self):
        """Verify API Gateway has the expected configuration"""
        if 'apiEndpoint' not in self.outputs:
            self.skipTest("apiEndpoint not found in outputs, skipping test")
            
        if not self.has_credentials:
            self.skipTest("AWS credentials not available, skipping test")
            
        api_url = self.outputs['apiEndpoint']
        api_id = api_url.split('//')[1].split('.')[0]
        
        try:
            # Get API Gateway stages
            response = self.apigateway_client.get_stages(
                restApiId=api_id
            )
            
            stages = response.get('item', [])
            self.assertGreaterEqual(len(stages), 1, "API Gateway should have at least one stage")
            
            # Check if the current stage has logging enabled
            env_suffix = self.outputs['environmentSuffix']
            current_stage = next((s for s in stages if s.get('stageName') == env_suffix), None)
            
            if current_stage:
                method_settings = current_stage.get('methodSettings', {})
                has_logging = any('loggingLevel' in settings for settings in method_settings.values())
                self.assertTrue(has_logging, "API Gateway should have logging enabled")
            
        except ClientError as e:
            self.fail(f"Failed to verify API Gateway: {e}")
    
    @mark.it("Environment suffix should be properly applied")
    def test_environment_suffix(self):
        """Verify environment suffix is applied to all resource names"""
        self.assertIn('environmentSuffix', self.outputs, "environmentSuffix not found in outputs")
        env_suffix = self.outputs['environmentSuffix']
        
        # Check all resource names include the environment suffix
        for key, value in self.outputs.items():
            if key != 'environmentSuffix' and isinstance(value, str):
                self.assertIn(env_suffix, value, 
                             f"Resource {key} should include environment suffix in its name/ARN/URL")
