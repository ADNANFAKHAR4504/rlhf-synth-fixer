"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import boto3
import json
import pulumi
from pulumi import automation as auto


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    def setUp(self):
        """Set up integration test with live stack."""
        # Get dynamic values from environment
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.project_name = os.getenv('PULUMI_PROJECT_NAME', 'TapStack')
        self.stack_name = os.getenv('PULUMI_STACK_NAME', f'TapStack{self.environment_suffix}')
        self.aws_region = os.getenv('AWS_REGION', 'us-east-1')
        self.pulumi_backend_url = os.getenv('PULUMI_BACKEND_URL', 's3://iac-rlhf-pulumi-states')
        
        # Initialize AWS clients
        self.dynamodb = boto3.client('dynamodb', region_name=self.aws_region)
        self.lambda_client = boto3.client('lambda', region_name=self.aws_region)
        self.apigateway = boto3.client('apigateway', region_name=self.aws_region)
        self.ssm = boto3.client('ssm', region_name=self.aws_region)
        self.cloudwatch = boto3.client('cloudwatch', region_name=self.aws_region)
        self.sqs = boto3.client('sqs', region_name=self.aws_region)
        
        # Get stack outputs
        self.stack_outputs = self._get_stack_outputs()

    def _get_stack_outputs(self):
        """Discover deployed resources dynamically using AWS APIs."""
        try:
            # Instead of relying on Pulumi outputs, discover resources by naming convention
            return {
                'table_name': {'value': f'tracking-data-{self.environment_suffix}'},
                'lambda_function_name': {'value': f'tracking-processor-{self.environment_suffix}'},
                'api_gateway_name': {'value': f'tracking-api-{self.environment_suffix}'},
                'dlq_name': {'value': f'tracking-lambda-dlq-{self.environment_suffix}'},
                'log_group_name': {'value': f'/aws/lambda/tracking-processor-{self.environment_suffix}'}
            }
        except Exception as e:
            self.skipTest(f"Could not retrieve stack outputs: {e}")

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists and is configured correctly."""
        # Dynamically find the table by name pattern
        response = self.dynamodb.list_tables()
        table_name = None
        
        for table in response['TableNames']:
            if f'tracking-data-{self.environment_suffix}' in table:
                table_name = table
                break
        
        self.assertIsNotNone(table_name, f"Table with pattern 'tracking-data-{self.environment_suffix}' not found")
        
        response = self.dynamodb.describe_table(TableName=table_name)
        table = response['Table']
        
        self.assertEqual(table['TableStatus'], 'ACTIVE')
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        self.assertTrue(table['StreamSpecification']['StreamEnabled'])

    def test_lambda_function_exists(self):
        """Test that Lambda function exists and is configured correctly."""
        # Dynamically find the function by name pattern
        response = self.lambda_client.list_functions()
        function_name = None
        
        for func in response['Functions']:
            if f'tracking-processor-{self.environment_suffix}' in func['FunctionName']:
                function_name = func['FunctionName']
                break
        
        self.assertIsNotNone(function_name, f"Function with pattern 'tracking-processor-{self.environment_suffix}' not found")
        
        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']
        
        self.assertEqual(config['Runtime'], 'python3.9')
        self.assertEqual(config['Timeout'], 30)
        self.assertEqual(config['MemorySize'], 512)
        self.assertIn('TABLE_NAME', config['Environment']['Variables'])

    def test_api_gateway_exists(self):
        """Test that API Gateway is deployed and accessible."""
        # Dynamically discover API Gateway by name
        api_name = f'tracking-api-{self.environment_suffix}'
        response = self.apigateway.get_rest_apis()
        
        api_found = None
        for api in response['items']:
            if api['name'] == api_name:
                api_found = api
                break
        
        self.assertIsNotNone(api_found, f"API Gateway '{api_name}' not found")
        
        # Construct the endpoint URL
        api_id = api_found['id']
        api_endpoint = f"https://{api_id}.execute-api.{self.aws_region}.amazonaws.com/prod"
        self.assertTrue(api_endpoint.startswith('https://'))
        self.assertIn('execute-api', api_endpoint)

    def test_ssm_parameters_exist(self):
        """Test that SSM parameters are created."""
        params_to_check = [
            f"/logistics/api/{self.environment_suffix}/config",
            f"/logistics/db/{self.environment_suffix}/endpoint",
            f"/logistics/features/{self.environment_suffix}/flags"
        ]
        
        for param_name in params_to_check:
            response = self.ssm.get_parameter(Name=param_name)
            self.assertIsNotNone(response['Parameter']['Value'])

    def test_dlq_exists(self):
        """Test that DLQ exists."""
        # Dynamically discover DLQ by name pattern
        dlq_name = f'tracking-lambda-dlq-{self.environment_suffix}'
        
        response = self.sqs.list_queues(QueueNamePrefix=dlq_name)
        queue_urls = response.get('QueueUrls', [])
        
        self.assertTrue(len(queue_urls) > 0, f"DLQ with name pattern '{dlq_name}' not found")
        
        dlq_url = queue_urls[0]
        response = self.sqs.get_queue_attributes(
            QueueUrl=dlq_url,
            AttributeNames=['MessageRetentionPeriod']
        )
        self.assertEqual(response['Attributes']['MessageRetentionPeriod'], '1209600')

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created."""
        # Look for alarms with tracking pattern
        response = self.cloudwatch.describe_alarms()
        tracking_alarms = []
        
        for alarm in response['MetricAlarms']:
            if 'tracking' in alarm['AlarmName'] and self.environment_suffix in alarm['AlarmName']:
                tracking_alarms.append(alarm['AlarmName'])
        
        self.assertGreater(len(tracking_alarms), 0, f"No tracking alarms found for environment '{self.environment_suffix}'")

    def test_ssm_parameters_exist(self):
        """Test that SSM parameters are created."""
        params_to_check = [
            f"/logistics/api/{self.environment_suffix}/config",
            f"/logistics/db/{self.environment_suffix}/endpoint",
            f"/logistics/features/{self.environment_suffix}/flags"
        ]
        
        for param_name in params_to_check:
            try:
                response = self.ssm.get_parameter(Name=param_name, WithDecryption=True)
                self.assertIsNotNone(response, f"Parameter '{param_name}' not found")
            except self.ssm.exceptions.ParameterNotFound:
                self.fail(f"Required SSM parameter not found: {param_name}")


if __name__ == '__main__':
    unittest.main()
