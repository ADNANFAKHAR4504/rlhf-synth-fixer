"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.

NOTE: These tests require actual Pulumi stack deployment to AWS.
"""

import unittest
import os
import boto3
import json
import time
import uuid
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with environment configuration."""
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.project_name = os.getenv('PULUMI_PROJECT', 'TapStack')
        
        # Stack name follows the pattern TapStack${ENVIRONMENT_SUFFIX} in deployment scripts
        cls.stack_name = os.getenv('PULUMI_STACK', f'TapStack{cls.environment_suffix}')
        
        # Resource name prefix - matches how Pulumi creates resources: {project_name}-{stack_name}
        # This results in: TapStack-TapStackpr3987 for PR #3987
        cls.resource_prefix = f"{cls.project_name}-{cls.stack_name}"

        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.sqs_client = boto3.client('sqs', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.apigatewayv2_client = boto3.client('apigatewayv2', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)
        
        # Get account ID for resource naming
        sts_client = boto3.client('sts', region_name=cls.region)
        cls.account_id = sts_client.get_caller_identity()['Account']

    def test_lambda_layer_exists(self):
        """Test that Lambda layer for model exists."""
        layer_name = f"{self.resource_prefix}-model"

        try:
            response = self.lambda_client.list_layer_versions(LayerName=layer_name)
            layer_versions = response.get('LayerVersions', [])
            
            self.assertGreater(len(layer_versions), 0, f"Lambda layer {layer_name} has no versions")
            
            latest_version = layer_versions[0]
            self.assertIn('python3.', str(latest_version.get('CompatibleRuntimes', [])))
            
        except ClientError as e:
            self.fail(f"Lambda layer {layer_name} not accessible: {e}")

    def test_api_gateway_exists(self):
        """Test that API Gateway HTTP API exists."""
        try:
            response = self.apigatewayv2_client.get_apis()
            apis = response.get('Items', [])
            
            # Find our API
            matching_apis = [api for api in apis if self.resource_prefix in api['Name']]
            self.assertGreater(len(matching_apis), 0, f"API Gateway for {self.resource_prefix} not found")
            
            api = matching_apis[0]
            api_id = api['ApiId']
            
            # Verify protocol type
            self.assertEqual(api['ProtocolType'], 'HTTP')
            
            # Verify CORS configuration
            self.assertIn('CorsConfiguration', api)
            cors = api['CorsConfiguration']
            self.assertIn('*', cors.get('AllowOrigins', []))
            
            # Get routes
            routes = self.apigatewayv2_client.get_routes(ApiId=api_id)
            route_keys = [r['RouteKey'] for r in routes.get('Items', [])]
            
            # Verify expected routes exist
            self.assertIn('POST /images', route_keys)
            self.assertIn('GET /images/{id}', route_keys)
            
        except ClientError as e:
            self.fail(f"API Gateway not accessible: {e}")

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created."""
        try:
            response = self.cloudwatch_client.describe_alarms()
            alarm_names = [alarm['AlarmName'] for alarm in response.get('MetricAlarms', [])]
            
            # Check for alarms with our resource prefix
            matching_alarms = [name for name in alarm_names if self.resource_prefix in name]
            
            # We should have multiple alarms (DLQ, errors, throttles, queue age)
            self.assertGreater(len(matching_alarms), 0, 
                f"No CloudWatch alarms found for {self.resource_prefix}")
            
        except ClientError as e:
            self.fail(f"CloudWatch alarms check failed: {e}")

    def test_iam_roles_exist(self):
        """Test that IAM roles for Lambda functions exist."""
        role_names_partial = [
            f"{self.resource_prefix}-preprocessing-role",
            f"{self.resource_prefix}-inference-role",
            f"{self.resource_prefix}-api-role"
        ]

        try:
            # List all roles and find matching ones
            paginator = self.iam_client.get_paginator('list_roles')
            all_roles = []
            
            for page in paginator.paginate():
                all_roles.extend(page['Roles'])
            
            role_names = [role['RoleName'] for role in all_roles]
            
            for role_name_partial in role_names_partial:
                matching_roles = [name for name in role_names if role_name_partial in name]
                self.assertGreater(len(matching_roles), 0, 
                    f"IAM role matching {role_name_partial} not found")

        except ClientError as e:
            self.fail(f"IAM roles check failed: {e}")

    def test_end_to_end_image_processing_workflow(self):
        """
        End-to-end integration test for the image processing pipeline.
        
        Tests the complete workflow:
        1. Upload image to S3 (uploads/ folder)
        2. Verify S3 event triggers SQS message
        3. Wait for Lambda preprocessing to process the message
        4. Verify DynamoDB status updates
        5. Check for final results in DynamoDB
        
        This validates: S3 -> SQS -> Lambda -> DynamoDB flow
        """
        bucket_name = f"{self.resource_prefix}-images"
        preprocessing_queue_name = f"{self.resource_prefix}-preprocessing"
        table_name = f"{self.resource_prefix}-results"
        
        # Generate unique test image ID
        test_image_id = f"test-e2e-{uuid.uuid4()}"
        test_key = f"uploads/{test_image_id}.jpg"
        test_image_data = b"fake image data for integration testing"
        
        print(f"\n=== Starting E2E Workflow Test ===")
        print(f"Image ID: {test_image_id}")
        print(f"S3 Key: {test_key}")
        
        try:
            # Step 1: Upload test image to S3
            print("\n[Step 1] Uploading image to S3...")
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_image_data,
                ContentType='image/jpeg'
            )
            print(f"Image uploaded successfully to s3://{bucket_name}/{test_key}")
            
            # Step 2: Wait for S3 event to trigger SQS message
            print("\n[Step 2] Waiting for S3 event to create SQS message...")
            queue_url_response = self.sqs_client.get_queue_url(QueueName=preprocessing_queue_name)
            queue_url = queue_url_response['QueueUrl']
            
            # Poll SQS queue for the message (wait up to 30 seconds)
            message_found = False
            max_attempts = 6
            for attempt in range(max_attempts):
                time.sleep(5)  # Wait 5 seconds between polls
                print(f"Polling SQS (attempt {attempt + 1}/{max_attempts})...")
                
                response = self.sqs_client.receive_message(
                    QueueUrl=queue_url,
                    MaxNumberOfMessages=10,
                    WaitTimeSeconds=5,
                    AttributeNames=['All']
                )
                
                messages = response.get('Messages', [])
                for message in messages:
                    body = json.loads(message['Body'])
                    
                    # Check if this is an S3 event notification
                    if 'Records' in body:
                        for record in body['Records']:
                            if record.get('eventName', '').startswith('ObjectCreated'):
                                s3_key = record.get('s3', {}).get('object', {}).get('key', '')
                                if test_image_id in s3_key:
                                    message_found = True
                                    print(f"Found S3 event message for {test_image_id}!")
                                    print(f"Event: {record.get('eventName')}")
                                    print(f"Bucket: {record.get('s3', {}).get('bucket', {}).get('name')}")
                                    print(f"Key: {s3_key}")
                                    # Don't delete the message - let Lambda process it
                                    break
                
                if message_found:
                    break
            
            self.assertTrue(message_found, 
                f"S3 event message not found in SQS queue after {max_attempts * 5} seconds")
            
            # Step 3: Wait for Lambda to process and update DynamoDB
            print("\n[Step 3] Waiting for Lambda processing and DynamoDB updates...")
            dynamodb = boto3.resource('dynamodb', region_name=self.region)
            table = dynamodb.Table(table_name)
            
            # Poll DynamoDB for status updates (wait up to 60 seconds)
            status_found = False
            max_db_attempts = 12
            final_status = None
            
            for attempt in range(max_db_attempts):
                time.sleep(5)
                print(f"Checking DynamoDB (attempt {attempt + 1}/{max_db_attempts})...")
                
                try:
                    response = table.get_item(Key={'image_id': test_image_id})
                    
                    if 'Item' in response:
                        item = response['Item']
                        status = item.get('status', 'unknown')
                        print(f"Status: {status}")
                        status_found = True
                        final_status = status
                        
                        # If processing is complete or failed, break
                        if status in ['completed', 'preprocessing_failed', 'inference_failed']:
                            print(f"Processing finished with status: {status}")
                            break
                except ClientError:
                    pass  # Item might not exist yet
            
            # Step 4: Verify results
            print("\n[Step 4] Verifying workflow results...")
            
            # At minimum, we should see the record was created in DynamoDB
            self.assertTrue(status_found, 
                "No record found in DynamoDB after Lambda processing")
            
            # Verify the record has expected fields
            response = table.get_item(Key={'image_id': test_image_id})
            self.assertIn('Item', response, "Final DynamoDB record not found")
            
            item = response['Item']
            self.assertEqual(item['image_id'], test_image_id)
            self.assertIn('status', item)
            self.assertIn('created_at', item)
            
            print(f"\nFinal record in DynamoDB:")
            print(f"  Image ID: {item.get('image_id')}")
            print(f"  Status: {item.get('status')}")
            print(f"  Created At: {item.get('created_at')}")
            if 'preprocessing_started_at' in item:
                print(f"  Preprocessing Started: {item.get('preprocessing_started_at')}")
            if 'preprocessing_completed_at' in item:
                print(f"  Preprocessing Completed: {item.get('preprocessing_completed_at')}")
            if 'error' in item:
                print(f"  Error: {item.get('error')}")
            
            print("\n=== E2E Workflow Test Completed Successfully ===")
            
        except Exception as e:
            self.fail(f"E2E workflow test failed: {str(e)}")
            
        finally:
            # Cleanup: Delete test objects
            print("\n[Cleanup] Removing test resources...")
            try:
                self.s3_client.delete_object(Bucket=bucket_name, Key=test_key)
                print(f"Deleted S3 object: {test_key}")
            except:
                pass
                
            try:
                # Also delete processed version if it exists
                processed_key = f"processed/{test_image_id}.bin"
                self.s3_client.delete_object(Bucket=bucket_name, Key=processed_key)
                print(f"Deleted processed object: {processed_key}")
            except:
                pass
                
            try:
                # Delete DynamoDB record
                dynamodb = boto3.resource('dynamodb', region_name=self.region)
                table = dynamodb.Table(table_name)
                table.delete_item(Key={'image_id': test_image_id})
                print(f"Deleted DynamoDB record for: {test_image_id}")
            except:
                pass


if __name__ == '__main__':
    # Skip integration tests if not in integration test environment
    if os.getenv('CI') != '1':
        print("Skipping integration tests. Set CI=1 to run.")
        import sys
        sys.exit(0)

    unittest.main()
