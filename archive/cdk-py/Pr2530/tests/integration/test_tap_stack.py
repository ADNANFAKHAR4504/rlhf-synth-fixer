import json
import os
import unittest
import boto3
import time
import base64
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
        self.lambda_client = boto3.client('lambda')
        self.apigateway_client = boto3.client('apigateway')
        self.secrets_client = boto3.client('secretsmanager')
        self.iam_client = boto3.client('iam')
        
        # Get stack outputs if available
        self.s3_bucket_name = flat_outputs.get('BucketName')
        self.lambda_function_name = flat_outputs.get('LambdaFunctionName')
        self.api_endpoint = flat_outputs.get('ApiEndpoint')
        self.secrets_arn = flat_outputs.get('SecretsArn')

    @mark.it("validates S3 bucket exists and is configured correctly")
    def test_s3_bucket_configuration(self):
        """Test that the S3 bucket exists and has correct configuration"""
        if not self.s3_bucket_name:
                self.skipTest("S3 bucket name not available in stack outputs")
        
        # ARRANGE & ACT
        try:
                # Check bucket exists
            bucket_response = self.s3_client.head_bucket(Bucket=self.s3_bucket_name)
            
                # Check versioning is enabled
            versioning_response = self.s3_client.get_bucket_versioning(
                Bucket=self.s3_bucket_name
            )
            
                # Check public access block configuration
            public_access_block = self.s3_client.get_public_access_block(
                Bucket=self.s3_bucket_name
            )
            
                # Check encryption configuration
            encryption_response = self.s3_client.get_bucket_encryption(
                Bucket=self.s3_bucket_name
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
            encryption_config = encryption_response['ServerSideEncryptionConfiguration']
            self.assertEqual(len(encryption_config['Rules']), 1)
            self.assertEqual(encryption_config['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'AES256')
            
        except Exception as e:
            self.fail(f"S3 bucket configuration test failed: {str(e)}")

    @mark.it("validates Lambda function exists and is configured correctly")
    def test_lambda_function_configuration(self):
        """Test that the Lambda function exists and has correct configuration"""
        if not self.lambda_function_name:
                self.skipTest("Lambda function name not available in stack outputs")
        
        # ARRANGE & ACT
        try:
            function_config = self.lambda_client.get_function(
                FunctionName=self.lambda_function_name
            )
            
                # ASSERT
            config = function_config['Configuration']
            self.assertEqual(config['Runtime'], 'python3.9')
            self.assertEqual(config['Handler'], 'upload_handler.lambda_handler')
            self.assertEqual(config['Timeout'], 3)
            self.assertEqual(config['MemorySize'], 256)
            
                # Check environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('BUCKET_NAME', env_vars)
            self.assertIn('SECRETS_ARN', env_vars)
            self.assertEqual(env_vars['BUCKET_NAME'], self.s3_bucket_name)
            
                # Check reserved concurrency
            self.assertEqual(config['ReservedConcurrencyLimit'], 100)
            
        except Exception as e:
            self.fail(f"Lambda function configuration test failed: {str(e)}")

    @mark.it("validates API Gateway exists and is configured correctly")
    def test_api_gateway_configuration(self):
        """Test that the API Gateway exists and has correct configuration"""
        if not self.api_endpoint:
                self.skipTest("API Gateway endpoint not available in stack outputs")
        
        # ARRANGE & ACT
        try:
                # Extract API ID from endpoint URL
            api_id = self.api_endpoint.split('/')[-2]
            
                # Get API Gateway details
            api_response = self.apigateway_client.get_rest_api(restApiId=api_id)
            
                # Get resources
            resources_response = self.apigateway_client.get_resources(restApiId=api_id)
            
                # ASSERT
            self.assertEqual(api_response['name'], 'TAP File Upload API')
            self.assertEqual(api_response['description'], 'Secure file upload API with validation')
            
                # Check that upload resource exists
            upload_resource = None
            for resource in resources_response['items']:
                if resource['pathPart'] == 'upload':
                    upload_resource = resource
                    break
            
            self.assertIsNotNone(upload_resource, "Upload resource not found in API Gateway")
            
                # Check that POST method exists on upload resource
            methods_response = self.apigateway_client.get_method(
                restApiId=api_id,
                resourceId=upload_resource['id'],
                httpMethod='POST'
            )
            
            self.assertEqual(methods_response['httpMethod'], 'POST')
            
        except Exception as e:
            self.fail(f"API Gateway configuration test failed: {str(e)}")

    @mark.it("validates Secrets Manager secret exists and is configured correctly")
    def test_secrets_manager_configuration(self):
        """Test that the Secrets Manager secret exists and has correct configuration"""
        if not self.secrets_arn:
                self.skipTest("Secrets Manager ARN not available in stack outputs")
        
        # ARRANGE & ACT
        try:
                # Get secret details
            secret_response = self.secrets_client.describe_secret(SecretId=self.secrets_arn)
            
                # Get secret value
            secret_value_response = self.secrets_client.get_secret_value(SecretId=self.secrets_arn)
            
                # ASSERT
            self.assertEqual(secret_response['Description'], 'Configuration secrets for TAP upload service')
            
                # Parse secret value
            secret_data = json.loads(secret_value_response['SecretString'])
            
                # Check required configuration keys
            self.assertIn('max_file_size', secret_data)
            self.assertIn('allowed_mime_types', secret_data)
            self.assertIn('upload_prefix', secret_data)
            
                # Check specific values
            self.assertEqual(secret_data['max_file_size'], '5242880')  # 5MB
            self.assertEqual(secret_data['upload_prefix'], 'uploads/')
            
                # Check allowed MIME types
            allowed_types = json.loads(secret_data['allowed_mime_types'])
            expected_types = ['image/png', 'image/jpg', 'image/jpeg']
            self.assertEqual(allowed_types, expected_types)
            
        except Exception as e:
            self.fail(f"Secrets Manager configuration test failed: {str(e)}")

    @mark.it("tests end-to-end file upload workflow via API Gateway")
    def test_end_to_end_file_upload_workflow(self):
        """Test the complete workflow: API Gateway -> Lambda -> S3 upload"""
        if not all([self.api_endpoint, self.s3_bucket_name]):
                self.skipTest("Required AWS resources not available in stack outputs")
        
        # ARRANGE
        import requests
        
        test_file_content = b"This is a test file for integration testing."
        test_file_name = "integration-test.txt"
        
        # Create a simple test image (1x1 PNG)
        test_image_content = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        )
        
        try:
                # ACT - Upload file via API Gateway
            upload_url = f"{self.api_endpoint}upload"
            
            # Test with text file (should fail due to MIME type restriction)
            files = {'file': (test_file_name, test_file_content, 'text/plain')}
            response = requests.post(upload_url, files=files, timeout=10)
            
                # ASSERT - Should fail due to MIME type restriction
            self.assertEqual(response.status_code, 400)
            response_data = response.json()
            self.assertIn('error', response_data)
            
                # Test with image file (should succeed)
            files = {'file': (test_file_name, test_image_content, 'image/png')}
            response = requests.post(upload_url, files=files, timeout=10)
            
                # ASSERT - Should succeed
            self.assertEqual(response.status_code, 200)
            response_data = response.json()
            self.assertIn('message', response_data)
            self.assertIn('fileKey', response_data)
            self.assertIn('uploadId', response_data)
            
                # Verify file exists in S3
            file_key = response_data['fileKey']
            s3_response = self.s3_client.head_object(
                Bucket=self.s3_bucket_name,
                Key=file_key
            )
            
            self.assertEqual(s3_response['ContentType'], 'image/png')
            self.assertEqual(s3_response['ContentLength'], len(test_image_content))
            
        except Exception as e:
            self.fail(f"End-to-end file upload test failed: {str(e)}")
        
        finally:
                # Cleanup - Remove test file from S3
            try:
                if 'file_key' in locals():
                    self.s3_client.delete_object(
                        Bucket=self.s3_bucket_name,
                        Key=file_key
                    )
            except Exception:
                pass  # Ignore cleanup errors

    @mark.it("tests Lambda function can be invoked directly")
    def test_lambda_direct_invocation(self):
        """Test that the Lambda function can be invoked directly with mock API Gateway event"""
        if not self.lambda_function_name:
                self.skipTest("Lambda function name not available in stack outputs")
        
        # ARRANGE - Mock API Gateway event
        mock_event = {
            "httpMethod": "POST",
            "path": "/upload",
            "headers": {
                "Content-Type": "image/png",
                "Content-Length": "1024"
            },
            "body": base64.b64encode(b"test image content").decode('utf-8'),
            "isBase64Encoded": True,
            "requestContext": {
                "requestId": "test-request-id"
            }
        }
        
        try:
                # ACT - Invoke Lambda function
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(mock_event)
            )
            
                # ASSERT
            self.assertEqual(response['StatusCode'], 200)
            
                # Check response payload
            payload = json.loads(response['Payload'].read())
            self.assertEqual(payload['statusCode'], 200)
            
            response_body = json.loads(payload['body'])
            self.assertIn('message', response_body)
            self.assertIn('fileKey', response_body)
            self.assertIn('uploadId', response_body)
            
        except Exception as e:
            self.fail(f"Lambda direct invocation test failed: {str(e)}")

    @mark.it("validates IAM permissions are working")
    def test_iam_permissions(self):
        """Test that the Lambda function has proper IAM permissions"""
        if not self.lambda_function_name:
                self.skipTest("Lambda function name not available in stack outputs")
        
        # ARRANGE
        try:
                # ACT - Get Lambda function configuration
            function_config = self.lambda_client.get_function(
                FunctionName=self.lambda_function_name
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
                # Should have AWSLambdaBasicExecutionRole attached
            policy_names = [p['PolicyName'] for p in attached_policies['AttachedPolicies']]
            self.assertTrue(
                any('AWSLambdaBasicExecutionRole' in name for name in policy_names),
                "Lambda should have basic execution role attached"
            )
            
                # Should have inline policies for S3 and Secrets Manager access
            self.assertGreater(
                len(inline_policies['PolicyNames']), 0,
                "Lambda should have inline policies for S3 and Secrets Manager access"
            )
            
        except Exception as e:
            self.fail(f"IAM permissions test failed: {str(e)}")

    @mark.it("validates error handling with invalid file types")
    def test_error_handling_invalid_file_type(self):
        """Test error handling in Lambda function with invalid file type"""
        if not self.lambda_function_name:
                self.skipTest("Lambda function name not available in stack outputs")
        
        # ARRANGE - Mock API Gateway event with invalid file type
        mock_event = {
            "httpMethod": "POST",
            "path": "/upload",
            "headers": {
                "Content-Type": "application/pdf",  # Invalid file type
                "Content-Length": "1024"
            },
            "body": base64.b64encode(b"test pdf content").decode('utf-8'),
            "isBase64Encoded": True,
            "requestContext": {
                "requestId": "test-request-id"
            }
        }
        
        try:
                # ACT - Invoke Lambda with invalid file type
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(mock_event)
            )
            
                # ASSERT - Function should handle error gracefully
            self.assertEqual(response['StatusCode'], 200)
            
            payload = json.loads(response['Payload'].read())
                # The function should return a 400 status code for validation errors
            self.assertEqual(payload['statusCode'], 400)
            
            response_body = json.loads(payload['body'])
            self.assertIn('error', response_body)
            
        except Exception as e:
            self.fail(f"Error handling test failed: {str(e)}")

    @mark.it("validates error handling with oversized file")
    def test_error_handling_oversized_file(self):
        """Test error handling in Lambda function with oversized file"""
        if not self.lambda_function_name:
                self.skipTest("Lambda function name not available in stack outputs")
        
        # ARRANGE - Mock API Gateway event with oversized file
        mock_event = {
            "httpMethod": "POST",
            "path": "/upload",
            "headers": {
                "Content-Type": "image/png",
                "Content-Length": "10485760"  # 10MB (exceeds 5MB limit)
            },
            "body": base64.b64encode(b"x" * 10485760).decode('utf-8'),
            "isBase64Encoded": True,
            "requestContext": {
                "requestId": "test-request-id"
            }
        }
        
        try:
                # ACT - Invoke Lambda with oversized file
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(mock_event)
            )
            
                # ASSERT - Function should handle error gracefully
            self.assertEqual(response['StatusCode'], 200)
            
            payload = json.loads(response['Payload'].read())
                # The function should return a 400 status code for validation errors
            self.assertEqual(payload['statusCode'], 400)
            
            response_body = json.loads(payload['body'])
            self.assertIn('error', response_body)
            self.assertIn('exceeds maximum allowed size', response_body['error'])
            
        except Exception as e:
            self.fail(f"Oversized file error handling test failed: {str(e)}")

    @mark.it("validates CORS configuration")
    def test_cors_configuration(self):
        """Test that CORS is properly configured for the API Gateway"""
        if not self.api_endpoint:
                self.skipTest("API Gateway endpoint not available in stack outputs")
        
        # ARRANGE
        import requests
        
        try:
                # ACT - Make OPTIONS request to test CORS
            upload_url = f"{self.api_endpoint}upload"
            headers = {
                'Origin': 'https://example.com',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            
            response = requests.options(upload_url, headers=headers, timeout=10)
            
                # ASSERT - CORS headers should be present
            self.assertEqual(response.status_code, 200)
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            self.assertIsNotNone(cors_headers['Access-Control-Allow-Origin'])
            self.assertIsNotNone(cors_headers['Access-Control-Allow-Methods'])
            self.assertIsNotNone(cors_headers['Access-Control-Allow-Headers'])
            
        except Exception as e:
            self.fail(f"CORS configuration test failed: {str(e)}")

    @mark.it("validates S3 bucket lifecycle configuration")
    def test_s3_lifecycle_configuration(self):
        """Test that S3 bucket has proper lifecycle configuration"""
        if not self.s3_bucket_name:
                self.skipTest("S3 bucket name not available in stack outputs")
        
        # ARRANGE & ACT
        try:
                # Get lifecycle configuration
            lifecycle_response = self.s3_client.get_bucket_lifecycle_configuration(
                Bucket=self.s3_bucket_name
            )
            
                # ASSERT
            rules = lifecycle_response['Rules']
            self.assertGreater(len(rules), 0, "Bucket should have lifecycle rules")
            
                # Check for Glacier transition rule
            glacier_rule = None
            for rule in rules:
                if rule.get('Transitions'):
                    for transition in rule['Transitions']:
                        if transition.get('StorageClass') == 'GLACIER':
                            glacier_rule = rule
                            break
            
            self.assertIsNotNone(glacier_rule, "Bucket should have Glacier transition rule")
            self.assertEqual(glacier_rule['Transitions'][0]['Days'], 30)
            
        except Exception as e:
            self.fail(f"S3 lifecycle configuration test failed: {str(e)}")