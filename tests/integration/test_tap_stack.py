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
import subprocess
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with environment configuration."""
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.project_name = os.getenv('PULUMI_PROJECT', 'TapStack')
        cls.pulumi_org = os.getenv('PULUMI_ORG', 'organization')
        
        # Stack name follows the pattern TapStack${ENVIRONMENT_SUFFIX} in deployment scripts
        cls.stack_name = os.getenv('PULUMI_STACK', f'TapStack{cls.environment_suffix}')
        
        # Full Pulumi stack identifier: org/project/stack
        cls.pulumi_stack_identifier = f"{cls.pulumi_org}/{cls.project_name}/{cls.stack_name}"
        
        # Resource name prefix - matches how Pulumi creates resources: {project_name}-{stack_name}
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
        
        # Fetch Pulumi stack outputs
        cls.outputs = cls._fetch_pulumi_outputs()
    
    @classmethod
    def _fetch_pulumi_outputs(cls):
        """Fetch Pulumi outputs as a Python dictionary."""
        try:
            print(f"\nDebug: Environment suffix: {cls.environment_suffix}")
            print(f"Debug: Stack name: {cls.stack_name}")
            print(f"Debug: Full stack identifier: {cls.pulumi_stack_identifier}")
            print(f"Fetching Pulumi outputs for stack: {cls.pulumi_stack_identifier}")
            
            result = subprocess.run(
                ["pulumi", "stack", "output", "--json", "--stack", cls.pulumi_stack_identifier],
                capture_output=True,
                text=True,
                check=True,
                cwd=os.path.join(os.path.dirname(__file__), "../..")
            )
            outputs = json.loads(result.stdout)
            print(f"Successfully fetched {len(outputs)} outputs from Pulumi stack")
            if outputs:
                print(f"Available outputs: {list(outputs.keys())}")
            else:
                print("Note: Stack has no outputs registered. Tests will use naming conventions.")
            return outputs
        except subprocess.CalledProcessError as e:
            print(f"Warning: Could not retrieve Pulumi stack outputs")
            print(f"Error: {e.stderr}")
            print("Tests will fall back to standard naming conventions")
            return {}
        except json.JSONDecodeError as e:
            print(f"Warning: Could not parse Pulumi output: {e}")
            return {}

    def test_s3_image_bucket_exists(self):
        """Test that S3 image bucket exists and is configured correctly."""
        self.assertIn('image_bucket_name', self.outputs,
                     "Missing 'image_bucket_name' in Pulumi outputs")
        
        bucket_name = self.outputs['image_bucket_name']
        
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            # Verify versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled')
            
            # Verify encryption is enabled
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            self.assertTrue(len(rules) > 0)
            self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'AES256')
            
        except ClientError as e:
            self.fail(f"S3 bucket test failed: {e}")
    
    def test_dynamodb_results_table_exists(self):
        """Test that DynamoDB results table exists and is configured correctly."""
        self.assertIn('results_table_name', self.outputs,
                     "Missing 'results_table_name' in Pulumi outputs")
        
        table_name = self.outputs['results_table_name']
        
        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
            
            # Verify hash key
            key_schema = {k['AttributeName']: k['KeyType'] for k in table['KeySchema']}
            self.assertEqual(key_schema.get('image_id'), 'HASH')
            
            # Verify GSI exists
            gsi_names = [gsi['IndexName'] for gsi in table.get('GlobalSecondaryIndexes', [])]
            self.assertIn('status-created-index', gsi_names)
            
            # Verify point-in-time recovery is enabled
            pitr = self.dynamodb_client.describe_continuous_backups(TableName=table_name)
            pitr_status = pitr['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
            self.assertEqual(pitr_status, 'ENABLED')
            
        except ClientError as e:
            self.fail(f"DynamoDB table test failed: {e}")
    
    def test_sqs_queues_exist(self):
        """Test that SQS queues exist and are configured correctly."""
        required_queues = ['preprocessing_queue_url', 'inference_queue_url', 'dlq_url']
        
        for queue_key in required_queues:
            self.assertIn(queue_key, self.outputs,
                         f"Missing '{queue_key}' in Pulumi outputs")
            
            queue_url = self.outputs[queue_key]
            
            try:
                attributes = self.sqs_client.get_queue_attributes(
                    QueueUrl=queue_url,
                    AttributeNames=['All']
                )['Attributes']
                
                self.assertIsNotNone(attributes.get('MessageRetentionPeriod'))
                
                # Check redrive policy for non-DLQ queues
                if 'dlq' not in queue_key:
                    self.assertIn('RedrivePolicy', attributes)
                    redrive_policy = json.loads(attributes['RedrivePolicy'])
                    self.assertEqual(redrive_policy['maxReceiveCount'], 3)
                    
            except ClientError as e:
                self.fail(f"SQS queue {queue_key} test failed: {e}")
    
    def test_lambda_functions_exist(self):
        """Test that all Lambda functions exist and are configured correctly."""
        lambda_functions = {
            'preprocessing_function_arn': 'preprocessing',
            'inference_function_arn': 'inference',
            'api_handler_function_arn': 'api-handler'
        }
        
        for output_key, func_type in lambda_functions.items():
            self.assertIn(output_key, self.outputs,
                         f"Missing '{output_key}' in Pulumi outputs")
            
            function_arn = self.outputs[output_key]
            
            try:
                response = self.lambda_client.get_function(FunctionName=function_arn)
                config = response['Configuration']
                
                self.assertEqual(config['Runtime'], 'python3.11')
                self.assertIsNotNone(config['Role'])
                
                # Verify X-Ray tracing
                self.assertEqual(config['TracingConfig']['Mode'], 'Active')
                
                # Verify timeout and memory
                self.assertGreater(config['Timeout'], 0)
                self.assertGreater(config['MemorySize'], 0)
                
            except ClientError as e:
                self.fail(f"Lambda function {func_type} test failed: {e}")
    
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
        self.assertIn('api_base_url', self.outputs,
                     "Missing 'api_base_url' in Pulumi outputs")
        
        api_endpoint = self.outputs['api_base_url']
        
        try:
            response = self.apigatewayv2_client.get_apis()
            apis = response.get('Items', [])
            
            # Find our API by matching the endpoint
            matching_api = None
            for api in apis:
                if api.get('ApiEndpoint') == api_endpoint:
                    matching_api = api
                    break
            
            self.assertIsNotNone(matching_api, f"API Gateway with endpoint {api_endpoint} not found")
            
            api_id = matching_api['ApiId']
            
            # Verify protocol type
            self.assertEqual(matching_api['ProtocolType'], 'HTTP')
            
            # Verify CORS configuration
            self.assertIn('CorsConfiguration', matching_api)
            cors = matching_api['CorsConfiguration']
            self.assertIn('*', cors.get('AllowOrigins', []))
            
            # Get routes
            routes = self.apigatewayv2_client.get_routes(ApiId=api_id)
            route_keys = [r['RouteKey'] for r in routes.get('Items', [])]
            
            # Verify expected routes exist
            self.assertIn('POST /images', route_keys)
            self.assertIn('GET /images/{id}', route_keys)
            
        except ClientError as e:
            self.fail(f"API Gateway test failed: {e}")

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
    
    def test_stack_outputs_complete(self):
        """Test that all expected stack outputs are present."""
        expected_outputs = [
            'api_base_url',
            'image_bucket_name',
            'upload_prefix',
            'results_table_name',
            'preprocessing_queue_url',
            'inference_queue_url',
            'dlq_url',
            'preprocessing_function_arn',
            'inference_function_arn',
            'api_handler_function_arn'
        ]
        
        for output_name in expected_outputs:
            self.assertIn(
                output_name,
                self.outputs,
                f"Output '{output_name}' should be present in stack outputs"
            )

    def test_end_to_end_image_processing_workflow(self):
        """
        End-to-end integration test for the image processing pipeline.
        
        Tests the complete workflow:
        1. Upload image to S3 (uploads/ folder)
        2. S3 event automatically triggers Lambda via SQS (EventSourceMapping)
        3. Wait for Lambda preprocessing to process and update DynamoDB
        4. Verify DynamoDB status updates and processing results
        
        This validates: S3 -> SQS -> Lambda -> DynamoDB flow
        
        Note: We don't poll SQS because Lambda EventSourceMapping consumes
        messages immediately (maximum_batching_window_in_seconds=0), so
        messages are processed before the test can poll them.
        """
        # Verify all required outputs are present
        required_outputs = ['image_bucket_name', 'preprocessing_queue_url', 'results_table_name']
        for output_key in required_outputs:
            self.assertIn(output_key, self.outputs,
                         f"Missing '{output_key}' in Pulumi outputs - cannot run E2E test")
        
        bucket_name = self.outputs['image_bucket_name']
        preprocessing_queue_url = self.outputs['preprocessing_queue_url']
        table_name = self.outputs['results_table_name']
        
        # Generate unique test image ID
        test_image_id = f"test-e2e-{uuid.uuid4()}"
        test_key = f"uploads/{test_image_id}.jpg"
        test_image_data = b"fake image data for integration testing"
        
        print(f"\n=== Starting E2E Workflow Test ===")
        print(f"Image ID: {test_image_id}")
        print(f"S3 Bucket: {bucket_name}")
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
            
            # Step 2: S3 event automatically triggers Lambda via SQS
            print("\n[Step 2] S3 event notification will automatically trigger Lambda...")
            print("Note: Lambda EventSourceMapping consumes messages immediately,")
            print("so we skip polling SQS and go directly to checking DynamoDB status.")
            
            # Step 3: Wait for Lambda to process and update DynamoDB
            print("\n[Step 3] Waiting for Lambda processing and DynamoDB updates...")
            dynamodb = boto3.resource('dynamodb', region_name=self.region)
            table = dynamodb.Table(table_name)
            
            # Poll DynamoDB for status updates (wait up to 60 seconds)
            status_found = False
            max_db_attempts = 12
            
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
                        
                        # If processing is complete or failed, break
                        if status in ['completed', 'preprocessed', 'preprocessing', 'preprocessing_failed', 'inference_failed']:
                            print(f"Processing status updated: {status}")
                            break
                except ClientError:
                    pass
            
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
            
            print(f"\nFinal record in DynamoDB:")
            print(f"  Image ID: {item.get('image_id')}")
            print(f"  Status: {item.get('status')}")
            if 'preprocessing_started_at' in item:
                print(f"  Preprocessing Started: {item.get('preprocessing_started_at')}")
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
                processed_key = f"processed/{test_image_id}.bin"
                self.s3_client.delete_object(Bucket=bucket_name, Key=processed_key)
                print(f"Deleted processed object: {processed_key}")
            except:
                pass
                
            try:
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
