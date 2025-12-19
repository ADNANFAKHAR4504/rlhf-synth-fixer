"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
import time
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load outputs from deployment
        outputs_path = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )

        if not os.path.exists(outputs_path):
            raise FileNotFoundError(
                f"Outputs file not found: {outputs_path}. "
                "Run deployment first to generate outputs."
            )

        with open(outputs_path, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Get AWS region from environment or default to us-east-1
        aws_region = os.getenv('AWS_REGION', 'us-east-1')

        # Initialize AWS clients with explicit region
        cls.lambda_client = boto3.client('lambda', region_name=aws_region)
        cls.dynamodb = boto3.resource('dynamodb', region_name=aws_region)
        cls.secrets_client = boto3.client('secretsmanager', region_name=aws_region)
        cls.logs_client = boto3.client('logs', region_name=aws_region)

        # Extract resource identifiers from outputs
        cls.lambda_function_name = cls.outputs['lambda_function_name']
        cls.lambda_function_url = cls.outputs['lambda_function_url']
        cls.dynamodb_table_name = cls.outputs['dynamodb_table_name']
        cls.secrets_arn = cls.outputs['secrets_manager_arn']

    def test_01_lambda_function_exists(self):
        """Test that Lambda function was created and is configured correctly."""
        response = self.lambda_client.get_function(
            FunctionName=self.lambda_function_name
        )

        self.assertIn('Configuration', response)
        config = response['Configuration']

        # Verify Lambda configuration
        self.assertIn(config['Runtime'], ['python3.9', 'python3.11', 'python3.12'])
        self.assertEqual(config['Handler'], 'index.lambda_handler')
        self.assertIn('envmig-webhook', config['FunctionName'])

        # Verify environment variables are set
        self.assertIn('Environment', config)
        env_vars = config['Environment']['Variables']
        self.assertIn('DYNAMODB_TABLE_NAME', env_vars)
        self.assertIn('SECRETS_MANAGER_ARN', env_vars)

        # Verify X-Ray tracing is enabled
        self.assertEqual(config['TracingConfig']['Mode'], 'Active')

    def test_02_lambda_function_url_exists(self):
        """Test that Lambda function URL was created with correct auth."""
        response = self.lambda_client.get_function_url_config(
            FunctionName=self.lambda_function_name
        )

        self.assertEqual(response['AuthType'], 'AWS_IAM')
        self.assertIn('FunctionUrl', response)
        self.assertTrue(response['FunctionUrl'].startswith('https://'))

    def test_03_dynamodb_table_exists(self):
        """Test that DynamoDB table was created with correct configuration."""
        table = self.dynamodb.Table(self.dynamodb_table_name)

        # Force load table metadata
        table.load()

        # Verify table configuration
        self.assertEqual(table.table_status, 'ACTIVE')
        self.assertIn('envmig-transactions', table.table_name)

        # Verify key schema
        key_schema = {item['AttributeName']: item['KeyType'] for item in table.key_schema}
        self.assertEqual(key_schema['transactionId'], 'HASH')

        # Verify billing mode
        self.assertEqual(table.billing_mode_summary['BillingMode'], 'PAY_PER_REQUEST')

    def test_04_secrets_manager_secret_exists(self):
        """Test that Secrets Manager secret was created."""
        response = self.secrets_client.describe_secret(
            SecretId=self.secrets_arn
        )

        self.assertIn('envmig-apikeys', response['Name'])
        self.assertEqual(response['ARN'], self.secrets_arn)

        # Verify secret has a value
        secret_value = self.secrets_client.get_secret_value(SecretId=self.secrets_arn)
        self.assertIn('SecretString', secret_value)

        # Verify it's valid JSON
        secret_data = json.loads(secret_value['SecretString'])
        self.assertIn('api_key', secret_data)

    def test_05_cloudwatch_log_group_exists(self):
        """Test that CloudWatch Log Group was created."""
        log_group_name = f"/aws/lambda/{self.lambda_function_name}"

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        self.assertGreater(len(response['logGroups']), 0)
        log_group = response['logGroups'][0]

        # Verify retention policy (7 days)
        self.assertEqual(log_group.get('retentionInDays'), 7)

    def test_06_lambda_invocation_success(self):
        """Test Lambda function invocation with valid payload."""
        test_payload = {
            'transactionId': f'test-txn-{int(time.time())}',
            'amount': 100.50,
            'currency': 'USD',
            'timestamp': int(time.time())
        }

        response = self.lambda_client.invoke(
            FunctionName=self.lambda_function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload)
        )

        self.assertEqual(response['StatusCode'], 200)

        # Parse response
        response_payload = json.loads(response['Payload'].read())
        self.assertEqual(response_payload['statusCode'], 200)

        body = json.loads(response_payload['body'])
        self.assertEqual(body['message'], 'Webhook processed successfully')
        self.assertEqual(body['transactionId'], test_payload['transactionId'])

    def test_07_dynamodb_data_persistence(self):
        """Test that Lambda writes data to DynamoDB correctly."""
        # Create unique transaction
        transaction_id = f'test-persistence-{int(time.time())}'
        test_payload = {
            'transactionId': transaction_id,
            'amount': 250.75,
            'currency': 'EUR',
            'timestamp': int(time.time())
        }

        # Invoke Lambda
        self.lambda_client.invoke(
            FunctionName=self.lambda_function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload)
        )

        # Wait for data to be written
        time.sleep(2)

        # Query DynamoDB (only transactionId is the hash key)
        table = self.dynamodb.Table(self.dynamodb_table_name)
        response = table.get_item(
            Key={
                'transactionId': transaction_id
            }
        )

        # Verify data was written
        self.assertIn('Item', response)
        item = response['Item']
        self.assertEqual(item['transactionId'], transaction_id)

        # Verify payload is stored
        stored_payload = json.loads(item['payload'])
        self.assertEqual(stored_payload['amount'], 250.75)

    def test_08_lambda_error_handling_missing_transaction_id(self):
        """Test Lambda handles missing transactionId correctly."""
        invalid_payload = {
            'amount': 100.50,
            'currency': 'USD'
        }

        response = self.lambda_client.invoke(
            FunctionName=self.lambda_function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(invalid_payload)
        )

        self.assertEqual(response['StatusCode'], 200)

        # Parse response
        response_payload = json.loads(response['Payload'].read())
        self.assertEqual(response_payload['statusCode'], 400)

        body = json.loads(response_payload['body'])
        self.assertIn('error', body)
        self.assertIn('transactionId', body['error'])

    def test_09_resource_tagging(self):
        """Test that resources have correct tags."""
        # Check Lambda function tags
        lambda_tags = self.lambda_client.list_tags(
            Resource=self.outputs['lambda_function_arn']
        )
        self.assertIn('Tags', lambda_tags)
        self.assertEqual(lambda_tags['Tags']['Environment'], 'prod')
        self.assertEqual(lambda_tags['Tags']['MigrationPhase'], 'testing')

    def test_10_iam_permissions(self):
        """Test Lambda has correct IAM permissions."""
        # Get function configuration to find role
        config = self.lambda_client.get_function(
            FunctionName=self.lambda_function_name
        )['Configuration']

        role_arn = config['Role']
        self.assertIn('envmig-webhook-role', role_arn)

        # Verify role has necessary permissions (via AWS CLI or IAM client)
        aws_region = os.getenv('AWS_REGION', 'us-east-1')
        iam_client = boto3.client('iam', region_name=aws_region)
        role_name = role_arn.split('/')[-1]

        # Get attached policies
        attached_policies = iam_client.list_attached_role_policies(
            RoleName=role_name
        )

        policy_names = [p['PolicyName'] for p in attached_policies['AttachedPolicies']]

        # Verify basic execution role
        self.assertIn('AWSLambdaBasicExecutionRole', policy_names)

        # Verify X-Ray permissions
        self.assertIn('AWSXRayDaemonWriteAccess', policy_names)


if __name__ == '__main__':
    unittest.main()
