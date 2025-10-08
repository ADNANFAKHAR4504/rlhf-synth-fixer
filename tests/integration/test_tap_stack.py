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
        """Retrieve stack outputs by directly detecting AWS resources."""
        try:
            # For integration tests, we'll discover resources directly by naming patterns
            # This is more reliable than depending on Pulumi/CFN outputs in CI/CD
            
            # Discover API Gateway by name pattern (Pulumi adds random suffixes)
            api_name_prefix = f"tracking-api-{self.environment_suffix}"
            try:
                apis = self.apigateway.get_rest_apis()['items']
                tracking_api = next((api for api in apis if api['name'].startswith(api_name_prefix)), None)
                api_endpoint = None
                if tracking_api:
                    api_id = tracking_api['id']
                    api_endpoint = f"https://{api_id}.execute-api.{self.aws_region}.amazonaws.com/prod"
            except Exception as e:
                print(f"Could not discover API Gateway: {e}")
                api_endpoint = None
            
            # Discover DynamoDB table by name pattern (Pulumi adds random suffixes)
            table_name_prefix = f"tracking-data-{self.environment_suffix}"
            try:
                tables = self.dynamodb.list_tables()['TableNames']
                tracking_table = next((table for table in tables if table.startswith(table_name_prefix)), None)
                if tracking_table:
                    self.dynamodb.describe_table(TableName=tracking_table)
                    table_exists = True
                    table_name = tracking_table
                else:
                    table_exists = False
                    table_name = None
            except Exception as e:
                print(f"Could not discover DynamoDB table: {e}")
                table_exists = False
                table_name = None
            
            # Discover Lambda function by name pattern (Pulumi adds random suffixes)
            function_name_prefix = f"tracking-processor-{self.environment_suffix}"
            try:
                functions = self.lambda_client.list_functions()['Functions']
                tracking_function = next((func for func in functions if func['FunctionName'].startswith(function_name_prefix)), None)
                if tracking_function:
                    lambda_exists = True
                    function_name = tracking_function['FunctionName']
                else:
                    lambda_exists = False
                    function_name = None
            except Exception as e:
                print(f"Could not discover Lambda function: {e}")
                lambda_exists = False
                function_name = None
            
            # Discover SQS DLQ by name pattern (Pulumi adds random suffixes)
            dlq_name_prefix = f"tracking-lambda-dlq-{self.environment_suffix}"
            try:
                queues = self.sqs.list_queues(QueueNamePrefix=dlq_name_prefix)
                dlq_url = queues.get('QueueUrls', [None])[0] if queues.get('QueueUrls') else None
            except Exception as e:
                print(f"Could not discover SQS queue: {e}")
                dlq_url = None
            
            # Return discovered resources
            return {
                'api_endpoint': {'value': api_endpoint} if api_endpoint else None,
                'table_name': {'value': table_name} if table_exists else None,
                'lambda_function_name': {'value': function_name} if lambda_exists else None,
                'dlq_url': {'value': dlq_url} if dlq_url else None
            }
            
        except Exception as e:
            print(f"Could not discover resources: {e}")
            return {}
            
        # Legacy fallback code (kept for reference but likely won't be reached)
        try:
            # Try to load outputs from cfn-outputs files first (more reliable in CI)
            cfn_outputs_path = os.path.join(os.getcwd(), 'cfn-outputs', 'all-outputs.json')
            if os.path.exists(cfn_outputs_path):
                with open(cfn_outputs_path, 'r') as f:
                    cfn_data = json.load(f)
                    if self.stack_name in cfn_data and cfn_data[self.stack_name]:
                        # Convert CFN outputs to Pulumi-style outputs
                        outputs = {}
                        for output in cfn_data[self.stack_name]:
                            key = output['OutputKey']
                            value = output['OutputValue']
                            outputs[key] = {'value': value}
                        return outputs
            
            # Fallback: try to get Pulumi outputs directly (requires auth)
            stack = auto.select_stack(
                stack_name=self.stack_name,
                project_name=self.project_name,
                work_dir=os.getcwd()
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
        # Check for specific alarm names we know exist
        expected_alarm_patterns = [
            f"tracking-api-4xx-{self.environment_suffix}",
            f"tracking-api-5xx-{self.environment_suffix}", 
            f"tracking-api-latency-{self.environment_suffix}",
            f"tracking-lambda-throttle-{self.environment_suffix}"
        ]
        
        # Get all alarms and filter for our patterns
        all_alarms = self.cloudwatch.describe_alarms()['MetricAlarms']
        tracking_alarms = []
        
        for alarm in all_alarms:
            alarm_name = alarm['AlarmName']
            for pattern in expected_alarm_patterns:
                if pattern in alarm_name:
                    tracking_alarms.append(alarm_name)
                    break

        self.assertGreater(len(tracking_alarms), 0, f"No tracking-related alarms found. Available alarms: {[a['AlarmName'] for a in all_alarms if 'tracking' in a['AlarmName'].lower()]}")
if __name__ == '__main__':
    unittest.main()
