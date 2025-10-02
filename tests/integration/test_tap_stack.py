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
        self.aws_region = os.getenv('AWS_REGION', 'us-west-2')
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
        """Retrieve Pulumi stack outputs dynamically."""
        try:
            workspace = auto.LocalWorkspace(
                work_dir=os.getcwd(),
                pulumi_home=os.getenv('PULUMI_HOME'),
                backend_url=self.pulumi_backend_url
            )
            stack = auto.select_stack(
                stack_name=self.stack_name,
                project_name=self.project_name,
                workspace=workspace
            )
            return stack.outputs()
        except Exception as e:
            self.skipTest(f"Could not retrieve stack outputs: {e}")

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists and is configured correctly."""
        table_name = self.stack_outputs.get('table_name', {}).get('value')
        self.assertIsNotNone(table_name, "Table name not found in stack outputs")
        
        response = self.dynamodb.describe_table(TableName=table_name)
        table = response['Table']
        
        self.assertEqual(table['TableStatus'], 'ACTIVE')
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        self.assertTrue(table['StreamSpecification']['StreamEnabled'])

    def test_lambda_function_exists(self):
        """Test that Lambda function exists and is configured correctly."""
        function_name = self.stack_outputs.get('lambda_function_name', {}).get('value')
        self.assertIsNotNone(function_name, "Lambda function name not found in stack outputs")
        
        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']
        
        self.assertEqual(config['Runtime'], 'python3.9')
        self.assertEqual(config['Timeout'], 30)
        self.assertEqual(config['MemorySize'], 512)
        self.assertIn('TABLE_NAME', config['Environment']['Variables'])

    def test_api_gateway_exists(self):
        """Test that API Gateway is deployed and accessible."""
        api_endpoint = self.stack_outputs.get('api_endpoint', {}).get('value')
        self.assertIsNotNone(api_endpoint, "API endpoint not found in stack outputs")
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
        dlq_url = self.stack_outputs.get('dlq_url', {}).get('value')
        self.assertIsNotNone(dlq_url, "DLQ URL not found in stack outputs")
        
        response = self.sqs.get_queue_attributes(
            QueueUrl=dlq_url,
            AttributeNames=['MessageRetentionPeriod']
        )
        self.assertEqual(response['Attributes']['MessageRetentionPeriod'], '1209600')

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created."""
        alarm_prefix = f"tracking-api-{self.environment_suffix}"
        response = self.cloudwatch.describe_alarms(AlarmNamePrefix=alarm_prefix)
        
        self.assertGreater(len(response['MetricAlarms']), 0, "No alarms found")


if __name__ == '__main__':
    unittest.main()
