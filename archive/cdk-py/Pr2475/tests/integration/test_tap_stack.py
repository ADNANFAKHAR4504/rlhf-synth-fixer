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
        
        # Get stack outputs if available
        self.s3_bucket_name = flat_outputs.get('S3BucketName')
        self.dynamodb_table_name = flat_outputs.get('DynamoDBTableName')
        self.lambda_function_name = flat_outputs.get('LambdaFunctionName')

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
            self.fail(f"S3 bucket configuration test failed: {str(e)}")

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
            self.assertEqual(len(key_schema), 1)
            self.assertEqual(key_schema[0]['AttributeName'], 'file_key')
            self.assertEqual(key_schema[0]['KeyType'], 'HASH')
            
                # Check attribute definitions
            attributes = table.attribute_definitions
            self.assertEqual(len(attributes), 1)
            self.assertEqual(attributes[0]['AttributeName'], 'file_key')
            self.assertEqual(attributes[0]['AttributeType'], 'S')
            
        except Exception as e:
            self.fail(f"DynamoDB table configuration test failed: {str(e)}")

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
            self.assertEqual(config['Handler'], 'process_file.lambda_handler')
            self.assertEqual(config['Timeout'], 15)
            self.assertEqual(config['MemorySize'], 256)
            
                # Check environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('DYNAMODB_TABLE_NAME', env_vars)
            self.assertIn('DYNAMODB_TABLE_ARN', env_vars)
            self.assertEqual(env_vars['DYNAMODB_TABLE_NAME'], self.dynamodb_table_name)
            
        except Exception as e:
            self.fail(f"Lambda function configuration test failed: {str(e)}")

    @mark.it("tests end-to-end file processing workflow")
    def test_end_to_end_file_processing(self):
        """Test the complete workflow: S3 upload -> Lambda trigger -> DynamoDB write"""
        if not all([self.s3_bucket_name, self.dynamodb_table_name, self.lambda_function_name]):
                self.skipTest("Required AWS resources not available in stack outputs")
        
        # ARRANGE
        test_file_key = "test-files/integration-test.txt"
        test_file_content = b"This is a test file for integration testing."
        
        try:
                # ACT - Upload file to S3
            self.s3_client.put_object(
                Bucket=self.s3_bucket_name,
                Key=test_file_key,
                Body=test_file_content,
                ContentType='text/plain'
            )
            
                # Wait for Lambda to process (async)
            time.sleep(5)
            
                # ASSERT - Check that metadata was written to DynamoDB
            table = self.dynamodb.Table(self.dynamodb_table_name)
            response = table.get_item(Key={'file_key': test_file_key})
            
            self.assertIn('Item', response, "File metadata not found in DynamoDB")
            
            item = response['Item']
            self.assertEqual(item['file_key'], test_file_key)
            self.assertEqual(item['bucket_name'], self.s3_bucket_name)
            self.assertEqual(item['file_size'], len(test_file_content))
            self.assertEqual(item['content_type'], 'text/plain')
            self.assertEqual(item['processing_status'], 'completed')
            self.assertIn('processed_at', item)
            self.assertIn('event_time', item)
            self.assertIn('last_modified', item)
            self.assertIn('etag', item)
            
        except Exception as e:
            self.fail(f"End-to-end test failed: {str(e)}")
        
        finally:
                # Cleanup - Remove test file
            try:
              self.s3_client.delete_object(
                  Bucket=self.s3_bucket_name,
                  Key=test_file_key
              )
              # Remove from DynamoDB
              table = self.dynamodb.Table(self.dynamodb_table_name)
              table.delete_item(Key={'file_key': test_file_key})
            except Exception:
                pass  # Ignore cleanup errors

    @mark.it("tests Lambda function can be invoked directly")
    def test_lambda_direct_invocation(self):
        """Test that the Lambda function can be invoked directly with mock S3 event"""
        if not self.lambda_function_name:
                self.skipTest("Lambda function name not available in stack outputs")
        
        # ARRANGE - Mock S3 event
        mock_event = {
              "Records": [
                  {
                      "eventVersion": "2.1",
                      "eventSource": "aws:s3",
                      "eventTime": "2024-01-01T12:00:00.000Z",
                      "eventName": "ObjectCreated:Put",
                      "s3": {
                          "bucket": {
                              "name": self.s3_bucket_name or "test-bucket"
                          },
                          "object": {
                              "key": "test-direct-invoke.txt",
                              "size": 1024
                          }
                      }
                  }
              ]
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
            self.assertIn('processed_files', response_body)
            
        except Exception as e:
            self.fail(f"Lambda direct invocation test failed: {str(e)}")

    @mark.it("validates IAM permissions are working")
    def test_iam_permissions(self):
        """Test that the Lambda function has proper IAM permissions"""
        if not self.lambda_function_name:
                self.skipTest("Lambda function name not available in stack outputs")
        
        # ARRANGE
        iam_client = boto3.client('iam')
        
        try:
                # ACT - Get Lambda function configuration
            function_config = self.lambda_client.get_function(
                FunctionName=self.lambda_function_name
            )
            
            role_arn = function_config['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
                # Get attached policies
            attached_policies = iam_client.list_attached_role_policies(
                RoleName=role_name
            )
            
                # Get inline policies
            inline_policies = iam_client.list_role_policies(
                RoleName=role_name
            )
            
                # ASSERT
                # Should have AWSLambdaBasicExecutionRole attached
            policy_names = [p['PolicyName'] for p in attached_policies['AttachedPolicies']]
            self.assertTrue(
                any('AWSLambdaBasicExecutionRole' in name for name in policy_names),
                "Lambda should have basic execution role attached"
            )
            
                # Should have inline policies for S3 and DynamoDB access
            self.assertGreater(
                len(inline_policies['PolicyNames']), 0,
                "Lambda should have inline policies for S3 and DynamoDB access"
            )
            
        except Exception as e:
            self.fail(f"IAM permissions test failed: {str(e)}")

    @mark.it("validates resource cleanup and error handling")
    def test_error_handling(self):
        """Test error handling in Lambda function with invalid S3 event"""
        if not self.lambda_function_name:
                self.skipTest("Lambda function name not available in stack outputs")
        
        # ARRANGE - Invalid S3 event (missing required fields)
        invalid_event = {
              "Records": [
                  {
                      "eventSource": "aws:s3",
                      "s3": {
                          "bucket": {},  # Missing bucket name
                          "object": {}   # Missing object key and size
                      }
                  }
              ]
        }
        
        try:
                # ACT - Invoke Lambda with invalid event
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(invalid_event)
            )
            
                # ASSERT - Function should handle error gracefully
            self.assertEqual(response['StatusCode'], 200)
            
            payload = json.loads(response['Payload'].read())
                # The function should return a 500 status code for errors
            self.assertEqual(payload['statusCode'], 500)
            
            response_body = json.loads(payload['body'])
            self.assertIn('error', response_body)
            self.assertIn('message', response_body)
            
        except Exception as e:
            self.fail(f"Error handling test failed: {str(e)}")
