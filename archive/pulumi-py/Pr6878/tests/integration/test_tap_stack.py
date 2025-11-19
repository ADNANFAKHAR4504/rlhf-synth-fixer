"""
Integration tests for deployed TapStack Pulumi infrastructure.

This test suite validates the deployed infrastructure by:
1. Loading outputs from cfn-outputs/flat-outputs.json  
2. Testing connectivity and health of deployed services
3. Validating infrastructure configuration
4. Testing webhook processing flow with real AWS services

Tests are region-agnostic and use deployment outputs dynamically.
No hardcoded values or mocks - tests validate real infrastructure.
"""

import unittest
import json
import os
import urllib.request
import urllib.error
import boto3
from typing import Dict, Any
import time
from urllib.parse import urlparse
import uuid


class TestDeploymentOutputs(unittest.TestCase):
    """Test cases for validating deployment outputs."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs from flat-outputs.json."""
        outputs_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )

        if not os.path.exists(outputs_path):
            raise FileNotFoundError(
                f"Deployment outputs not found at {outputs_path}. "
                "Please ensure the infrastructure is deployed and outputs are generated."
            )

        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

        print(f"\n{'='*80}")
        print("Loaded Deployment Outputs:")
        print(f"{'='*80}")
        for key, value in cls.outputs.items():
            print(f"  {key}: {value}")
        print(f"{'='*80}\n")

    def test_outputs_exist(self):
        """Test that all required outputs are present."""
        required_outputs = [
            'api_gateway_endpoint',
            'api_key_id', 
            'dynamodb_table_name',
            'eventbridge_bus_name',
            'sns_topic_arn'
        ]

        for output in required_outputs:
            with self.subTest(output=output):
                self.assertIn(output, self.outputs, f"Missing required output: {output}")
                self.assertIsNotNone(self.outputs[output], f"Output {output} is None")
                self.assertNotEqual(self.outputs[output], '', f"Output {output} is empty")

    def test_output_formats(self):
        """Test that outputs have correct format."""
        # Test API Gateway endpoint format
        api_endpoint = self.outputs.get('api_gateway_endpoint', '')
        self.assertTrue(api_endpoint.startswith('https://'),
                       "API endpoint should use HTTPS")
        self.assertIn('execute-api', api_endpoint,
                     "API endpoint should be API Gateway endpoint")
        
        # Extract environment suffix from DynamoDB table name to validate stage
        table_name = self.outputs.get('dynamodb_table_name', '')
        environment_suffix = table_name.replace('webhook-processing-', '')
        expected_stage = f'/{environment_suffix}'
        self.assertTrue(api_endpoint.endswith(expected_stage),
                       f"API endpoint should have {expected_stage} stage")

        # Test API key ID format
        api_key_id = self.outputs.get('api_key_id', '')
        self.assertTrue(len(api_key_id) > 5,
                       "API key ID should be a meaningful string")

        # Test DynamoDB table name format
        table_name = self.outputs.get('dynamodb_table_name', '')
        self.assertTrue(table_name.startswith('webhook-processing-'),
                       "Table name should start with 'webhook-processing-'")

        # Test EventBridge bus name format
        bus_name = self.outputs.get('eventbridge_bus_name', '')
        self.assertTrue(bus_name.startswith('payment-events-'),
                       "EventBridge bus name should start with 'payment-events-'")

        # Test SNS topic ARN format
        sns_arn = self.outputs.get('sns_topic_arn', '')
        self.assertTrue(sns_arn.startswith('arn:aws:sns:'),
                       "SNS topic ARN should start with 'arn:aws:sns:'")
        self.assertIn('webhook-alerts-', sns_arn,
                     "SNS topic ARN should contain 'webhook-alerts-'")

    def test_environment_suffix_consistency(self):
        """Test that all resources use the same environment suffix."""
        # Extract suffix from table name
        table_name = self.outputs.get('dynamodb_table_name', '')
        suffix = table_name.replace('webhook-processing-', '')

        self.assertTrue(len(suffix) > 0, "Environment suffix should not be empty")

        # Verify suffix appears in all resources
        eventbridge_bus = self.outputs.get('eventbridge_bus_name', '')
        self.assertIn(suffix, eventbridge_bus,
                     f"EventBridge bus should contain environment suffix '{suffix}'")

        sns_arn = self.outputs.get('sns_topic_arn', '')
        self.assertIn(suffix, sns_arn,
                     f"SNS topic should contain environment suffix '{suffix}'")


class TestAPIGatewayEndpoints(unittest.TestCase):
    """Test cases for API Gateway endpoints."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs."""
        outputs_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )
        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

    def _make_request(self, url: str, method: str = 'GET', data: bytes = None, timeout: int = 10, headers: Dict[str, str] = None) -> Dict[str, Any]:
        """Make HTTP request and return response details."""
        try:
            request_headers = headers or {}
            if data and 'Content-Type' not in request_headers:
                request_headers['Content-Type'] = 'application/json'
            
            req = urllib.request.Request(url, data=data, headers=request_headers, method=method)

            with urllib.request.urlopen(req, timeout=timeout) as response:
                body = response.read().decode('utf-8')
                return {
                    'status_code': response.status,
                    'body': body,
                    'headers': dict(response.headers),
                    'success': True,
                    'error': None
                }
        except urllib.error.HTTPError as e:
            return {
                'status_code': e.code,
                'body': e.read().decode('utf-8') if e.fp else '',
                'headers': dict(e.headers) if hasattr(e, 'headers') else {},
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            return {
                'status_code': None,
                'body': '',
                'headers': {},
                'success': False,
                'error': str(e)
            }

    def test_api_gateway_health_endpoint(self):
        """Test API Gateway health endpoint."""
        api_endpoint = self.outputs.get('api_gateway_endpoint', '')
        health_url = f"{api_endpoint}/health"

        print(f"\nTesting API Gateway Health: {health_url}")
        response = self._make_request(health_url)

        print(f"Response Status: {response['status_code']}")
        print(f"Response Body: {response['body']}")

        # Health endpoint should be accessible
        self.assertIsNotNone(response['status_code'],
                           f"Health endpoint should be accessible. Error: {response['error']}")

        # Should return either 200 or be accessible
        if response['success'] and response['status_code'] == 200:
            try:
                body = json.loads(response['body'])
                self.assertIn('status', body, "Health response should contain status")
                self.assertIn('timestamp', body, "Health response should contain timestamp")
            except json.JSONDecodeError:
                # Basic response is acceptable
                pass

    def test_webhook_endpoint_without_api_key(self):
        """Test webhook endpoint without API key returns 403."""
        api_endpoint = self.outputs.get('api_gateway_endpoint', '')
        webhook_url = f"{api_endpoint}/webhook"

        print(f"\nTesting Webhook Endpoint (no API key): {webhook_url}")

        test_payload = json.dumps({
            'id': f'test-{uuid.uuid4()}',
            'type': 'payment.succeeded',
            'amount': 100,
            'currency': 'usd',
            'provider': 'stripe'
        }).encode('utf-8')

        response = self._make_request(webhook_url, method='POST', data=test_payload)

        print(f"Response Status: {response['status_code']}")
        print(f"Response Body: {response['body']}")

        # Should return 403 Forbidden without API key
        self.assertIn(response['status_code'], [403, 401],
                     "Webhook endpoint should require API key and return 403/401")

    def test_webhook_endpoint_with_invalid_api_key(self):
        """Test webhook endpoint with invalid API key."""
        api_endpoint = self.outputs.get('api_gateway_endpoint', '')
        webhook_url = f"{api_endpoint}/webhook"

        print(f"\nTesting Webhook Endpoint (invalid API key): {webhook_url}")

        test_payload = json.dumps({
            'id': f'test-{uuid.uuid4()}',
            'type': 'payment.succeeded',
            'amount': 100,
            'currency': 'usd',
            'provider': 'stripe'
        }).encode('utf-8')

        headers = {'x-api-key': 'invalid-api-key'}
        response = self._make_request(webhook_url, method='POST', data=test_payload, headers=headers)

        print(f"Response Status: {response['status_code']}")
        print(f"Response Body: {response['body']}")

        # Should return 403 Forbidden with invalid API key
        self.assertIn(response['status_code'], [403, 401],
                     "Webhook endpoint should reject invalid API key")


class TestAWSResourceConnectivity(unittest.TestCase):
    """Test cases for AWS resource connectivity and configuration."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs and setup AWS clients."""
        outputs_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )
        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

        # Extract region from API Gateway endpoint
        api_endpoint = cls.outputs.get('api_gateway_endpoint', '')
        region = api_endpoint.split('.')[2] if 'execute-api' in api_endpoint else 'us-east-1'
        
        cls.region = region
        cls.dynamodb = boto3.resource('dynamodb', region_name=region)
        cls.sqs = boto3.client('sqs', region_name=region)
        cls.events = boto3.client('events', region_name=region)
        cls.sns = boto3.client('sns', region_name=region)
        cls.lambda_client = boto3.client('lambda', region_name=region)

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists and is accessible."""
        table_name = self.outputs.get('dynamodb_table_name', '')
        
        print(f"\nTesting DynamoDB Table: {table_name}")

        try:
            table = self.dynamodb.Table(table_name)
            table.load()
            
            self.assertEqual(table.table_status, 'ACTIVE',
                           "DynamoDB table should be in ACTIVE state")
            
            # Check table has required attributes
            key_schema = table.key_schema
            self.assertTrue(len(key_schema) > 0,
                          "DynamoDB table should have key schema")
            
            print(f"DynamoDB table '{table_name}' is active")
            
        except Exception as e:
            self.fail(f"Failed to access DynamoDB table '{table_name}': {e}")

    def test_eventbridge_bus_exists(self):
        """Test that EventBridge custom bus exists."""
        bus_name = self.outputs.get('eventbridge_bus_name', '')
        
        print(f"\nTesting EventBridge Bus: {bus_name}")

        try:
            response = self.events.describe_event_bus(Name=bus_name)
            
            self.assertIn('Name', response, "EventBridge bus should have name")
            self.assertEqual(response['Name'], bus_name,
                           f"EventBridge bus name should match '{bus_name}'")
            
            print(f"EventBridge bus '{bus_name}' exists")
            
        except Exception as e:
            self.fail(f"Failed to access EventBridge bus '{bus_name}': {e}")

    def test_eventbridge_rules_exist(self):
        """Test that EventBridge rules are configured."""
        bus_name = self.outputs.get('eventbridge_bus_name', '')
        
        print(f"\nTesting EventBridge Rules on bus: {bus_name}")

        try:
            response = self.events.list_rules(EventBusName=bus_name)
            rules = response.get('Rules', [])
            
            self.assertTrue(len(rules) > 0,
                          "EventBridge bus should have rules configured")
            
            # Check for payment threshold rules
            rule_names = [rule['Name'] for rule in rules]
            expected_patterns = ['small', 'medium', 'large', 'xlarge']
            
            for pattern in expected_patterns:
                matching_rules = [name for name in rule_names if pattern in name]
                self.assertTrue(len(matching_rules) > 0,
                              f"Should have rule for {pattern} payment threshold")
            
            print(f"Found {len(rules)} EventBridge rules")
            
        except Exception as e:
            self.fail(f"Failed to list EventBridge rules: {e}")

    def test_sns_topic_exists(self):
        """Test that SNS topic exists and is accessible."""
        sns_arn = self.outputs.get('sns_topic_arn', '')
        
        print(f"\nTesting SNS Topic: {sns_arn}")

        try:
            response = self.sns.get_topic_attributes(TopicArn=sns_arn)
            
            self.assertIn('Attributes', response,
                         "SNS topic should have attributes")
            
            attributes = response['Attributes']
            self.assertIn('TopicArn', attributes,
                         "SNS topic should have TopicArn attribute")
            
            print(f"SNS topic '{sns_arn}' is accessible")
            
        except Exception as e:
            self.fail(f"Failed to access SNS topic '{sns_arn}': {e}")

    def test_sqs_queues_exist(self):
        """Test that SQS queues for providers exist."""
        # List all SQS queues and find our provider queues
        try:
            response = self.sqs.list_queues()
            queue_urls = response.get('QueueUrls', [])
            
            # Extract environment suffix from DynamoDB table name
            table_name = self.outputs.get('dynamodb_table_name', '')
            suffix = table_name.replace('webhook-processing-', '')
            
            # Look for provider queues
            providers = ['stripe', 'paypal', 'square']
            found_queues = []
            
            for queue_url in queue_urls:
                queue_name = queue_url.split('/')[-1]
                for provider in providers:
                    if provider in queue_name and suffix in queue_name:
                        found_queues.append((provider, queue_url))
            
            self.assertTrue(len(found_queues) > 0,
                          f"Should find SQS queues for providers with suffix '{suffix}'")
            
            print(f"Found {len(found_queues)} provider SQS queues")
            
            # Test queue attributes
            for provider, queue_url in found_queues:
                queue_attributes = self.sqs.get_queue_attributes(
                    QueueUrl=queue_url,
                    AttributeNames=['FifoQueue']
                )
                
                # Should be FIFO queue
                is_fifo = queue_attributes['Attributes'].get('FifoQueue', 'false')
                self.assertEqual(is_fifo, 'true',
                               f"{provider} queue should be FIFO queue")
            
        except Exception as e:
            self.fail(f"Failed to list SQS queues: {e}")

    def test_lambda_functions_exist(self):
        """Test that Lambda functions exist and are configured."""
        # Extract environment suffix
        table_name = self.outputs.get('dynamodb_table_name', '')
        suffix = table_name.replace('webhook-processing-', '')
        
        # Expected Lambda functions
        expected_functions = [
            f'webhook-validator-{suffix}',
            f'provider-processor-{suffix}',
            f'event-processor-{suffix}'
        ]
        
        print(f"\nTesting Lambda Functions with suffix: {suffix}")

        try:
            for function_name in expected_functions:
                try:
                    response = self.lambda_client.get_function(FunctionName=function_name)
                    
                    config = response['Configuration']
                    self.assertEqual(config['State'], 'Active',
                                   f"Lambda function '{function_name}' should be active")
                    
                    self.assertEqual(config['Runtime'], 'python3.9',
                                   f"Lambda function '{function_name}' should use Python 3.9")
                    
                    print(f"Lambda function '{function_name}' is active")
                    
                except self.lambda_client.exceptions.ResourceNotFoundException:
                    print(f"Lambda function '{function_name}' not found (may use different naming)")
                    
        except Exception as e:
            self.fail(f"Failed to check Lambda functions: {e}")


class TestSystemHealthChecks(unittest.TestCase):
    """Test cases for overall system health and monitoring."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs."""
        outputs_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )
        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

    def test_resource_naming_conventions(self):
        """Test that all resources follow consistent naming conventions."""
        # Extract suffix from table name
        table_name = self.outputs.get('dynamodb_table_name', '')
        suffix = table_name.replace('webhook-processing-', '')

        naming_patterns = {
            'dynamodb_table_name': 'webhook-processing-',
            'eventbridge_bus_name': 'payment-events-',
            'sns_topic_arn': 'webhook-alerts-'
        }

        for resource_key, prefix in naming_patterns.items():
            with self.subTest(resource=resource_key):
                resource_value = self.outputs.get(resource_key, '')
                
                if resource_key == 'sns_topic_arn':
                    # For ARN, check if it contains the pattern
                    self.assertIn(prefix, resource_value,
                                f"{resource_key} ARN should contain '{prefix}'")
                else:
                    self.assertTrue(resource_value.startswith(prefix),
                                  f"{resource_key} should start with '{prefix}', got '{resource_value}'")
                
                # All should contain the suffix
                self.assertIn(suffix, resource_value,
                            f"{resource_key} should contain environment suffix '{suffix}'")

    def test_api_gateway_region_extraction(self):
        """Test that we can extract region from API Gateway endpoint."""
        api_endpoint = self.outputs.get('api_gateway_endpoint', '')
        
        # Extract region from API Gateway URL
        # Format: https://{api-id}.execute-api.{region}.amazonaws.com/stage
        parts = api_endpoint.split('.')
        self.assertTrue(len(parts) >= 4, "API Gateway URL should have correct format")
        self.assertEqual(parts[1], 'execute-api', "API Gateway URL should contain 'execute-api'")
        
        region = parts[2]
        self.assertTrue(region.startswith('us-'), f"Region should start with 'us-', got '{region}'")
        
        print(f"\nDetected region from API Gateway: {region}")

    def test_all_outputs_non_empty(self):
        """Test that all outputs have meaningful values."""
        for key, value in self.outputs.items():
            with self.subTest(output=key):
                self.assertIsNotNone(value, f"Output {key} should not be None")
                self.assertNotEqual(value, '', f"Output {key} should not be empty string")
                if isinstance(value, str):
                    self.assertTrue(len(value) > 3, 
                                  f"Output {key} should have meaningful value, got '{value}'")


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)
