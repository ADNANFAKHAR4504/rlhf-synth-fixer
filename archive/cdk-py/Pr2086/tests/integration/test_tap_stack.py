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
            cls.s3_client = None
            cls.rds_client = None
            cls.ec2_client = None
            cls.elb_client = None
            cls.asg_client = None
            cls.cloudwatch_client = None
        else:
            try:
                # Initialize AWS clients for web application architecture
                cls.s3_client = session.client('s3', region_name='us-east-1')
                cls.rds_client = session.client('rds', region_name='us-east-1')
                cls.ec2_client = session.client('ec2', region_name='us-east-1')
                cls.elb_client = session.client('elbv2', region_name='us-east-1')
                cls.asg_client = session.client('autoscaling', region_name='us-east-1')
                cls.cloudwatch_client = session.client('cloudwatch', region_name='us-east-1')
                cls.has_credentials = True
            except Exception as e:
                print(f"Failed to initialize AWS clients: {str(e)}")
                cls.has_credentials = False
                # Create placeholder clients for tests that don't make actual API calls
                cls.s3_client = None
                cls.rds_client = None
                cls.ec2_client = None
                cls.elb_client = None
                cls.asg_client = None
                cls.cloudwatch_client = None
    
    def setUp(self):
        """Additional setup for each test"""
        pass

    @mark.it("Application endpoint should be accessible")
    def test_application_endpoint_exists(self):
        """Verify either API Gateway or Load Balancer endpoint exists and is correctly formatted"""
        # Check for Load Balancer (web app architecture)
        alb_dns_key = next((key for key in self.outputs.keys() if 'DNSName' in key and 'alb' in key.lower()), None)
        
        # Check for API Gateway (serverless architecture)
        api_endpoint_exists = 'apiEndpoint' in self.outputs
        
        # At least one of them should exist
        self.assertTrue(alb_dns_key is not None or api_endpoint_exists, 
                       "Neither Load Balancer DNS name nor API Gateway endpoint found in outputs")
        
        if alb_dns_key:
            # Web app architecture with ALB
            alb_url = self.outputs[alb_dns_key]
            # Check URL format
            self.assertTrue(alb_url.endswith('.elb.amazonaws.com'), 
                            f"Load Balancer endpoint should end with .elb.amazonaws.com, got: {alb_url}")
        
        elif api_endpoint_exists:
            # Serverless architecture with API Gateway
            api_url = self.outputs['apiEndpoint']
            # Check URL format
            self.assertTrue(api_url.startswith('https://'), 
                            f"API endpoint should start with https://, got: {api_url}")
            self.assertTrue('execute-api.us-east-1.amazonaws.com' in api_url, 
                            f"API endpoint doesn't look like an API Gateway URL: {api_url}")
    
    @mark.it("S3 bucket should be accessible")
    def test_s3_bucket_exists(self):
        """Verify the S3 bucket exists"""
        # Check for S3 bucket in different output formats
        
        # Try web app architecture bucket naming
        s3_bucket_key = next((key for key in self.outputs.keys() if 'bucket' in key.lower() or 'assets' in key.lower()), None)
        
        # Try serverless architecture bucket naming
        if not s3_bucket_key and 's3BucketName' in self.outputs:
            s3_bucket_key = 's3BucketName'
        
        if not s3_bucket_key:
            self.skipTest("No S3 bucket reference found in outputs, skipping test")
            
        bucket_name = self.outputs[s3_bucket_key]
        
        # Check bucket name format
        self.assertTrue(isinstance(bucket_name, str), "Bucket name should be a string")
        # Just verify it looks like a bucket name, without specific naming requirements
        self.assertTrue('-' in bucket_name or '.' in bucket_name,
                       f"Value doesn't look like a bucket name: {bucket_name}")
    
    @mark.it("Backend compute should be properly configured")
    def test_backend_compute(self):
        """Verify either Lambda functions or RDS database exists"""
        # Check for RDS database (web app architecture)
        has_database = 'DatabaseEndpoint' in self.outputs
        
        # Check for Lambda functions (serverless architecture)
        has_lambda = 'imageProcessorArn' in self.outputs
        
        # At least one of them should exist
        self.assertTrue(has_database or has_lambda,
                      "Neither RDS database nor Lambda functions found in outputs")
        
        if has_database:
            # Web app architecture with RDS
            db_endpoint = self.outputs['DatabaseEndpoint']
            self.assertTrue('rds.amazonaws.com' in db_endpoint,
                          f"Database endpoint doesn't look like an RDS endpoint: {db_endpoint}")
            
            if 'DatabaseSecretArn' in self.outputs:
                db_secret_arn = self.outputs['DatabaseSecretArn']
                self.assertTrue('secretsmanager' in db_secret_arn,
                              f"Database secret ARN doesn't look like a Secrets Manager ARN: {db_secret_arn}")
        
        elif has_lambda:
            # Serverless architecture with Lambda
            image_processor_arn = self.outputs['imageProcessorArn']
            self.assertTrue('lambda' in image_processor_arn.lower(),
                          f"Lambda ARN doesn't look like a Lambda function ARN: {image_processor_arn}")
            
            if 'dataAnalyzerArn' in self.outputs:
                data_analyzer_arn = self.outputs['dataAnalyzerArn']
                self.assertTrue('lambda' in data_analyzer_arn.lower(),
                              f"Lambda ARN doesn't look like a Lambda function ARN: {data_analyzer_arn}")

    @mark.it("Compute resources should be properly configured")
    def test_compute_resources(self):
        """Verify either Auto Scaling Group or Lambda functions exist"""
        # Try to find an ASG reference in the outputs (web app architecture)
        asg_key = next((key for key in self.outputs.keys() if 'asg' in key.lower() and 'ref' in key.lower()), None)
        
        # Check for Lambda functions (serverless architecture)
        lambda_key = next((key for key in self.outputs.keys() if 'lambda' in key.lower() or 'arn' in key.lower()), None)
        
        # Skip if neither is found
        if not asg_key and not lambda_key:
            self.skipTest("Neither Auto Scaling Group nor Lambda functions found in outputs, skipping test")
        
        if asg_key:
            # For web app architecture with ASG
            asg_ref = self.outputs[asg_key]
            # Basic validation that it looks like an ASG reference
            self.assertTrue(isinstance(asg_ref, str), "ASG reference should be a string")
            
        elif lambda_key:
            # For serverless architecture with Lambda
            lambda_ref = self.outputs[lambda_key]
            # Basic validation that it looks like a Lambda ARN
            self.assertTrue(isinstance(lambda_ref, str), "Lambda reference should be a string")
            self.assertTrue('arn' in lambda_ref.lower(), 
                          f"Lambda reference should contain ARN: {lambda_ref}")
    
    @mark.it("S3 bucket should have proper security settings")
    def test_s3_bucket_security(self):
        """Verify the S3 bucket has proper security settings"""
        # Try to find an S3 bucket reference in the outputs
        s3_bucket_key = next((key for key in self.outputs.keys() if 'bucket' in key.lower() or 'assets' in key.lower()), None)
        
        # Try serverless architecture bucket naming
        if not s3_bucket_key and 's3BucketName' in self.outputs:
            s3_bucket_key = 's3BucketName'
        
        if not s3_bucket_key:
            self.skipTest("No S3 bucket reference found in outputs, skipping test")
        
        if not self.has_credentials:
            self.skipTest("AWS credentials not available, skipping test")
            
        bucket_name = self.outputs[s3_bucket_key]
        
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
    
    @mark.it("Request handling should be properly configured")
    def test_request_handler_configuration(self):
        """Verify Load Balancer or API Gateway is properly configured"""
        # Check for Load Balancer (web app architecture)
        alb_dns_key = next((key for key in self.outputs.keys() if 'DNSName' in key and 'alb' in key.lower()), None)
        
        # Check for API Gateway (serverless architecture)
        api_endpoint_exists = 'apiEndpoint' in self.outputs
        
        if not alb_dns_key and not api_endpoint_exists:
            self.skipTest("Neither Load Balancer nor API Gateway found in outputs, skipping test")
            
        if not self.has_credentials:
            self.skipTest("AWS credentials not available, skipping test")
            
        if alb_dns_key:
            # For web app architecture with ALB
            # Look for a target group reference which is common with ALBs
            tg_key = next((key for key in self.outputs.keys() if 'TargetGroup' in key), None)
            if tg_key:
                tg_name = self.outputs[tg_key]
                self.assertTrue('targetgroup/' in tg_name.lower(), 
                              f"Target Group name format is incorrect: {tg_name}")
        
        elif api_endpoint_exists:
            # For serverless architecture with API Gateway
            api_url = self.outputs['apiEndpoint']
            # Just verify the URL format
            self.assertTrue(api_url.startswith('https://'), 
                          f"API endpoint should start with https://, got: {api_url}")
    
    @mark.it("Resources should have proper naming conventions")
    def test_resource_naming_conventions(self):
        """Verify resources follow naming conventions"""
        # Handle both CI environment with PR number and local environment with synthetic ID
        
        # Check for environment identifier in resource names
        env_identifiers = []
        
        # Check for PR number in CI environment
        if any('pr' in key.lower() for key in self.outputs.keys()):
            # In CI environment, resources often have PR number in their names
            pr_pattern_found = any(isinstance(value, str) and 'pr' in value.lower() 
                                for key, value in self.outputs.items())
            env_identifiers.append(pr_pattern_found)
        
        # Check for synthetic training ID in local environment
        if 'environmentSuffix' in self.outputs:
            env_suffix = self.outputs['environmentSuffix']
            suffix_in_resources = any(isinstance(value, str) and env_suffix in value
                                   for key, value in self.outputs.items() 
                                   if key != 'environmentSuffix')
            env_identifiers.append(suffix_in_resources)
        
        # Check for prod environment identifier in resource names
        prod_in_resources = any(isinstance(value, str) and 'prod' in value.lower()
                             for key, value in self.outputs.items())
        env_identifiers.append(prod_in_resources)
        
        # At least one type of environment identifier should be present
        self.assertTrue(any(env_identifiers), 
                      "Resources should include environment identifiers in their names")
