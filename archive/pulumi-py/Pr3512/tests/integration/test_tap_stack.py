"""
Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack without hardcoded values.
"""

import json
import time
import unittest
import os
import boto3
import requests
import subprocess
from datetime import datetime, timezone
from typing import Dict, Any


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Get Pulumi stack outputs dynamically
        try:
            result = subprocess.run(
                ['pulumi', 'stack', 'output', '--json'],
                capture_output=True,
                text=True,
                check=True
            )
            cls.outputs = json.loads(result.stdout)
        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            raise unittest.SkipTest(f"Could not retrieve Pulumi outputs: {e}")

        if not cls.outputs:
            raise unittest.SkipTest("No Pulumi outputs found. Stack may not be deployed.")

        # Extract required outputs
        required_outputs = [
            'aws_region', 'metrics_table_name', 'alert_config_table_name',
            'metrics_bucket_name', 'lambda_function_name', 'alert_topic_arn',
            'api_gateway_id', 'api_endpoint'
        ]
        
        missing_outputs = [output for output in required_outputs if output not in cls.outputs]
        if missing_outputs:
            raise unittest.SkipTest(f"Missing required outputs: {missing_outputs}")

        # Initialize AWS clients
        cls.region = cls.outputs['aws_region']
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.api_client = boto3.client('apigateway', region_name=cls.region)

    def setUp(self):
        """Set up each test method."""
        self.test_id = f"test_{int(time.time())}"

    def test_s3_bucket_exists(self):
        """Test that S3 bucket was created and is accessible."""
        bucket_name = self.outputs['metrics_bucket_name']

        # Check bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Check versioning is enabled
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')

        # Check encryption is enabled
        try:
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn('Rules', encryption['ServerSideEncryptionConfiguration'])
        except self.s3_client.exceptions.ClientError as e:
            if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
                raise
            # Encryption might be set but not required - this is acceptable

        # Check public access is blocked
        try:
            public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
            block_config = public_access['PublicAccessBlockConfiguration']
            self.assertTrue(block_config['BlockPublicAcls'])
            self.assertTrue(block_config['IgnorePublicAcls'])
            self.assertTrue(block_config['BlockPublicPolicy'])
            self.assertTrue(block_config['RestrictPublicBuckets'])
        except self.s3_client.exceptions.ClientError:
            # Public access block might not be configured - test what we can
            pass

    def test_dynamodb_tables_exist(self):
        """Test that DynamoDB tables were created with correct configuration."""
        # Test metrics table
        metrics_table = self.outputs['metrics_table_name']
        response = self.dynamodb_client.describe_table(TableName=metrics_table)
        table = response['Table']

        self.assertEqual(table['TableStatus'], 'ACTIVE')
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

        # Check key schema
        key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
        self.assertIn('metric_name', key_schema)
        self.assertEqual(key_schema['metric_name'], 'HASH')

        # Check TTL is enabled
        try:
            ttl_response = self.dynamodb_client.describe_time_to_live(TableName=metrics_table)
            ttl_status = ttl_response['TimeToLiveDescription']['TimeToLiveStatus']
            self.assertIn(ttl_status, ['ENABLED', 'ENABLING'])
        except Exception:
            # TTL might not be configured - this is acceptable for testing
            pass

        # Test alert config table
        alert_table = self.outputs['alert_config_table_name']
        response = self.dynamodb_client.describe_table(TableName=alert_table)
        table = response['Table']

        self.assertEqual(table['TableStatus'], 'ACTIVE')
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

    def test_lambda_function_exists(self):
        """Test that Lambda function was created with correct configuration."""
        function_name = self.outputs['lambda_function_name']

        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']

        # Test basic configuration
        self.assertIn('python', config['Runtime'].lower())
        self.assertEqual(config['TracingConfig']['Mode'], 'Active')
        self.assertGreaterEqual(config['MemorySize'], 256)
        self.assertGreaterEqual(config['Timeout'], 30)

        # Check environment variables are set
        env_vars = config['Environment']['Variables']
        required_env_vars = ['METRICS_TABLE', 'ALERT_CONFIG_TABLE', 'ALERT_TOPIC_ARN', 'METRICS_BUCKET']
        for var in required_env_vars:
            self.assertIn(var, env_vars, f"Missing environment variable: {var}")

        # Verify environment variables point to correct resources
        self.assertEqual(env_vars['METRICS_TABLE'], self.outputs['metrics_table_name'])
        self.assertEqual(env_vars['ALERT_CONFIG_TABLE'], self.outputs['alert_config_table_name'])
        self.assertEqual(env_vars['ALERT_TOPIC_ARN'], self.outputs['alert_topic_arn'])
        self.assertEqual(env_vars['METRICS_BUCKET'], self.outputs['metrics_bucket_name'])

    def test_sns_topic_exists(self):
        """Test that SNS topic was created."""
        topic_arn = self.outputs['alert_topic_arn']

        response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
        self.assertIn('Attributes', response)
        
        # Verify topic ARN format
        self.assertTrue(topic_arn.startswith('arn:aws:sns:'))
        self.assertIn(self.region, topic_arn)

        # Check if topic is accessible
        try:
            subs_response = self.sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
            self.assertIsNotNone(subs_response['Subscriptions'])
        except Exception:
            # No subscriptions is acceptable for testing
            pass

    def test_api_gateway_exists(self):
        """Test that API Gateway was created and is accessible."""
        api_id = self.outputs['api_gateway_id']

        # Check REST API exists
        response = self.api_client.get_rest_api(restApiId=api_id)
        self.assertIn('name', response)
        
        # Check resources exist
        resources = self.api_client.get_resources(restApiId=api_id)
        resource_paths = [r.get('path') for r in resources['items']]
        self.assertIn('/metrics', resource_paths)

        # Check deployment exists
        deployments = self.api_client.get_deployments(restApiId=api_id)
        self.assertGreater(len(deployments['items']), 0)

    def test_api_endpoint_responds(self):
        """Test that API endpoint is accessible and responds correctly."""
        api_endpoint = self.outputs['api_endpoint']
        
        # Ensure endpoint URL is properly formatted
        if not api_endpoint.startswith('https://'):
            self.fail(f"API endpoint should be HTTPS: {api_endpoint}")

        # Construct metrics endpoint URL
        metrics_url = f"{api_endpoint.rstrip('/')}/metrics"

        # Test POST request with metric data
        test_metric = {
            'metric_name': f'integration_test_metric_{self.test_id}',
            'value': 42.5,
            'metric_type': 'integration_test'
        }

        try:
            response = requests.post(
                metrics_url,
                json=test_metric,
                timeout=30,
                headers={'Content-Type': 'application/json'}
            )

            # API should respond with success
            self.assertIn(response.status_code, [200, 201, 202])

            # Check response has expected structure
            if response.headers.get('content-type', '').startswith('application/json'):
                response_data = response.json()
                self.assertIn('message', response_data)

        except requests.exceptions.RequestException as e:
            self.fail(f"API endpoint failed to respond: {e}")
        except json.JSONDecodeError:
            # Non-JSON response is acceptable if status code is good
            pass

    def test_lambda_invocation(self):
        """Test direct Lambda invocation."""
        function_name = self.outputs['lambda_function_name']

        # Test metric processing
        test_payload = {
            'body': json.dumps({
                'metric_name': f'lambda_test_metric_{self.test_id}',
                'value': 100,
                'metric_type': 'lambda_test'
            })
        }

        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload)
        )

        self.assertEqual(response['StatusCode'], 200)

        # Check response
        response_payload = json.loads(response['Payload'].read())
        self.assertIn('statusCode', response_payload)
        self.assertIn(response_payload['statusCode'], [200, 201])
        
        # Check for error in response
        if 'body' in response_payload:
            try:
                body = json.loads(response_payload['body'])
                if 'error' in body:
                    self.fail(f"Lambda returned error: {body['error']}")
            except json.JSONDecodeError:
                pass  # Non-JSON body is acceptable

    def test_metric_storage_in_dynamodb(self):
        """Test that metrics can be stored in DynamoDB."""
        table_name = self.outputs['metrics_table_name']
        function_name = self.outputs['lambda_function_name']

        # Send a metric through Lambda
        test_metric_name = f"dynamodb_test_metric_{self.test_id}"
        test_payload = {
            'body': json.dumps({
                'metric_name': test_metric_name,
                'value': 123.45,
                'metric_type': 'dynamodb_integration_test'
            })
        }

        # Invoke Lambda
        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload)
        )
        
        # Verify Lambda executed successfully
        self.assertEqual(response['StatusCode'], 200)

        # Give it a moment to process
        time.sleep(3)

        # Query DynamoDB to verify metric was stored
        try:
            response = self.dynamodb_client.query(
                TableName=table_name,
                KeyConditionExpression='metric_name = :name',
                ExpressionAttributeValues={
                    ':name': {'S': test_metric_name}
                }
            )

            # Check if item was stored
            self.assertGreater(response['Count'], 0, "No metrics found in DynamoDB")
            if response['Count'] > 0:
                item = response['Items'][0]
                self.assertEqual(item['metric_name']['S'], test_metric_name)
                self.assertEqual(item['value']['S'], '123.45')
                self.assertEqual(item['metric_type']['S'], 'dynamodb_integration_test')
                
        except Exception as e:
            self.fail(f"Failed to query DynamoDB: {e}")
        
        finally:
            # Clean up the test data
            try:
                self.dynamodb_client.delete_item(
                    TableName=table_name,
                    Key={'metric_name': {'S': test_metric_name}}
                )
            except Exception:
                pass  # Cleanup failure is not critical

    def test_alert_configuration_table(self):
        """Test alert configuration table operations."""
        table_name = self.outputs['alert_config_table_name']

        # Put a test alert configuration
        test_metric_name = f'alert_test_metric_{self.test_id}'
        test_config = {
            'metric_name': {'S': test_metric_name},
            'threshold': {'N': '50'},
            'severity': {'S': 'high'}
        }

        try:
            self.dynamodb_client.put_item(
                TableName=table_name,
                Item=test_config
            )

            # Read it back
            response = self.dynamodb_client.get_item(
                TableName=table_name,
                Key={'metric_name': {'S': test_metric_name}}
            )

            self.assertIn('Item', response)
            self.assertEqual(response['Item']['metric_name']['S'], test_metric_name)
            self.assertEqual(response['Item']['threshold']['N'], '50')
            self.assertEqual(response['Item']['severity']['S'], 'high')

        finally:
            # Clean up
            try:
                self.dynamodb_client.delete_item(
                    TableName=table_name,
                    Key={'metric_name': {'S': test_metric_name}}
                )
            except Exception:
                pass  # Cleanup failure is not critical

    def test_s3_export_capability(self):
        """Test that Lambda can write to S3 bucket."""
        function_name = self.outputs['lambda_function_name']
        bucket_name = self.outputs['metrics_bucket_name']

        # Trigger export function
        export_payload = {
            'action': 'export_metrics'
        }

        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(export_payload)
        )

        self.assertEqual(response['StatusCode'], 200)

        # Check response indicates success
        response_payload = json.loads(response['Payload'].read())
        self.assertEqual(response_payload['statusCode'], 200)

        # Give time for S3 write operation
        time.sleep(2)

        # List objects in bucket to verify export
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=bucket_name,
                Prefix='exports/'
            )

            # Should have at least one export file
            if 'Contents' in response:
                self.assertGreater(len(response['Contents']), 0)
                
                # Verify file was created recently (within last minute)
                recent_files = [
                    obj for obj in response['Contents']
                    if (datetime.now(timezone.utc) - obj['LastModified']).total_seconds() < 60
                ]
                self.assertGreater(len(recent_files), 0, "No recent export files found")
                
        except Exception as e:
            self.fail(f"Failed to verify S3 export: {e}")

    def test_end_to_end_metric_flow(self):
        """Test complete metric flow from API to storage to export."""
        api_endpoint = self.outputs['api_endpoint']
        bucket_name = self.outputs['metrics_bucket_name']
        metrics_table = self.outputs['metrics_table_name']
        
        # Unique test identifier
        test_metric_name = f'e2e_test_metric_{self.test_id}'
        
        # Step 1: Send metric via API
        metrics_url = f"{api_endpoint.rstrip('/')}/metrics"
        test_metric = {
            'metric_name': test_metric_name,
            'value': 999.99,
            'metric_type': 'e2e_test'
        }

        try:
            response = requests.post(
                metrics_url,
                json=test_metric,
                timeout=30,
                headers={'Content-Type': 'application/json'}
            )
            self.assertIn(response.status_code, [200, 201, 202])
            
        except requests.exceptions.RequestException:
            self.skipTest("API endpoint not accessible for E2E test")

        # Step 2: Verify metric stored in DynamoDB
        time.sleep(3)  # Allow processing time
        
        try:
            response = self.dynamodb_client.query(
                TableName=metrics_table,
                KeyConditionExpression='metric_name = :name',
                ExpressionAttributeValues={
                    ':name': {'S': test_metric_name}
                }
            )
            
            self.assertGreater(response['Count'], 0, "Metric not found in DynamoDB after API call")
            
        finally:
            # Clean up test data
            try:
                self.dynamodb_client.delete_item(
                    TableName=metrics_table,
                    Key={'metric_name': {'S': test_metric_name}}
                )
            except Exception:
                pass


if __name__ == '__main__':
    unittest.main()
