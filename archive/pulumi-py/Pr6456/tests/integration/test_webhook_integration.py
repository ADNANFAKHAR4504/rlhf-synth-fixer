"""
Integration tests for deployed webhook processing infrastructure.
Tests actual AWS resources using real deployment outputs.
"""

import unittest
import json
import os
import boto3
from datetime import datetime
import time


class TestWebhookProcessingIntegration(unittest.TestCase):
    """Integration tests for webhook processing system"""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures using deployment outputs"""
        # Load deployment outputs
        with open('cfn-outputs/flat-outputs.json', 'r') as f:
            cls.outputs = json.load(f)

        # Read AWS region from file if it exists, otherwise use env/default
        region_file_path = 'lib/AWS_REGION'
        default_region = 'us-east-1'
        if os.path.exists(region_file_path):
            with open(region_file_path, 'r', encoding='utf-8') as f:
                default_region = f.read().strip()
        
        cls.region = os.getenv('AWS_REGION', default_region)
        
        # Read environment suffix from environment variable (exported in CI/CD)
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)

        # Extract resource names from outputs
        cls.stripe_lambda_arn = cls.outputs['stripe_lambda_arn']
        cls.paypal_lambda_arn = cls.outputs['paypal_lambda_arn']
        cls.dynamodb_table_name = cls.outputs['dynamodb_table_name']
        cls.stripe_log_group = cls.outputs['stripe_log_group_name']
        cls.paypal_log_group = cls.outputs['paypal_log_group_name']

    def test_stripe_lambda_function_exists(self):
        """Test Stripe Lambda function exists and is configured correctly"""
        response = self.lambda_client.get_function(FunctionName=self.stripe_lambda_arn)

        # Verify configuration
        config = response['Configuration']
        self.assertEqual(config['Runtime'], 'python3.11')
        self.assertEqual(config['MemorySize'], 512)
        self.assertEqual(config['Timeout'], 30)
        self.assertEqual(config['TracingConfig']['Mode'], 'Active')

        # Verify environment variables
        env_vars = config['Environment']['Variables']
        self.assertIn('TABLE_NAME', env_vars)
        self.assertIn('WEBHOOK_TYPE', env_vars)
        self.assertEqual(env_vars['WEBHOOK_TYPE'], 'Stripe')

    def test_paypal_lambda_function_exists(self):
        """Test PayPal Lambda function exists and is configured correctly"""
        response = self.lambda_client.get_function(FunctionName=self.paypal_lambda_arn)

        # Verify configuration
        config = response['Configuration']
        self.assertEqual(config['Runtime'], 'python3.11')
        self.assertEqual(config['MemorySize'], 512)
        self.assertEqual(config['Timeout'], 30)
        self.assertEqual(config['TracingConfig']['Mode'], 'Active')

        # Verify environment variables
        env_vars = config['Environment']['Variables']
        self.assertEqual(env_vars['WEBHOOK_TYPE'], 'PayPal')

    def test_dynamodb_table_exists(self):
        """Test DynamoDB table exists with correct configuration"""
        response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)

        table = response['Table']

        # Verify billing mode
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

        # Verify key schema
        key_schema = table['KeySchema']
        self.assertEqual(len(key_schema), 1)
        self.assertEqual(key_schema[0]['AttributeName'], 'transactionId')
        self.assertEqual(key_schema[0]['KeyType'], 'HASH')

        # Verify PITR
        pitr_response = self.dynamodb_client.describe_continuous_backups(
            TableName=self.dynamodb_table_name
        )
        pitr_status = pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        self.assertEqual(pitr_status, 'ENABLED')

    def test_stripe_webhook_processing_end_to_end(self):
        """Test Stripe webhook processing end-to-end"""
        # Prepare test event
        test_transaction_id = f"stripe-integration-test-{int(time.time())}"
        event = {
            'body': json.dumps({
                'id': test_transaction_id,
                'amount': 5000,
                'currency': 'usd',
                'status': 'succeeded'
            })
        }

        # Invoke Lambda function
        response = self.lambda_client.invoke(
            FunctionName=self.stripe_lambda_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )

        # Verify Lambda execution
        self.assertEqual(response['StatusCode'], 200)

        payload = json.loads(response['Payload'].read())
        
        # Debug: print payload if statusCode is missing
        if 'statusCode' not in payload:
            print(f"Lambda returned unexpected payload: {payload}")
            self.fail(f"Lambda error: {payload.get('errorMessage', 'Unknown error')}")
        
        self.assertEqual(payload['statusCode'], 200)

        body = json.loads(payload['body'])
        self.assertEqual(body['transactionId'], test_transaction_id)

        # Wait for DynamoDB write
        time.sleep(2)

        # Verify data in DynamoDB
        db_response = self.dynamodb_client.get_item(
            TableName=self.dynamodb_table_name,
            Key={'transactionId': {'S': test_transaction_id}}
        )

        self.assertIn('Item', db_response)
        item = db_response['Item']
        self.assertEqual(item['transactionId']['S'], test_transaction_id)
        self.assertEqual(item['webhookType']['S'], 'Stripe')
        self.assertEqual(item['status']['S'], 'processed')

    def test_paypal_webhook_processing_end_to_end(self):
        """Test PayPal webhook processing end-to-end"""
        # Prepare test event
        test_transaction_id = f"paypal-integration-test-{int(time.time())}"
        event = {
            'body': json.dumps({
                'id': test_transaction_id,
                'amount': 7500,
                'currency': 'usd',
                'status': 'completed'
            })
        }

        # Invoke Lambda function
        response = self.lambda_client.invoke(
            FunctionName=self.paypal_lambda_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )

        # Verify Lambda execution
        self.assertEqual(response['StatusCode'], 200)

        payload = json.loads(response['Payload'].read())
        
        # Debug: print payload if statusCode is missing
        if 'statusCode' not in payload:
            print(f"Lambda returned unexpected payload: {payload}")
            self.fail(f"Lambda error: {payload.get('errorMessage', 'Unknown error')}")
        
        self.assertEqual(payload['statusCode'], 200)

        body = json.loads(payload['body'])
        self.assertEqual(body['transactionId'], test_transaction_id)

        # Wait for DynamoDB write
        time.sleep(2)

        # Verify data in DynamoDB
        db_response = self.dynamodb_client.get_item(
            TableName=self.dynamodb_table_name,
            Key={'transactionId': {'S': test_transaction_id}}
        )

        self.assertIn('Item', db_response)
        item = db_response['Item']
        self.assertEqual(item['transactionId']['S'], test_transaction_id)
        self.assertEqual(item['webhookType']['S'], 'PayPal')

    def test_cloudwatch_log_groups_exist(self):
        """Test CloudWatch log groups exist with correct retention"""
        # Test Stripe log group
        stripe_response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=self.stripe_log_group
        )
        self.assertEqual(len(stripe_response['logGroups']), 1)
        self.assertEqual(stripe_response['logGroups'][0]['retentionInDays'], 7)

        # Test PayPal log group
        paypal_response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=self.paypal_log_group
        )
        self.assertEqual(len(paypal_response['logGroups']), 1)
        self.assertEqual(paypal_response['logGroups'][0]['retentionInDays'], 7)

    def test_stripe_lambda_writes_to_cloudwatch(self):
        """Test Stripe Lambda function writes logs to CloudWatch"""
        # Invoke function
        test_id = f"stripe-log-test-{int(time.time())}"
        event = {'body': json.dumps({'id': test_id})}

        self.lambda_client.invoke(
            FunctionName=self.stripe_lambda_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )

        # Wait for logs
        time.sleep(5)

        # Check log streams exist
        response = self.logs_client.describe_log_streams(
            logGroupName=self.stripe_log_group,
            orderBy='LastEventTime',
            descending=True,
            limit=1
        )

        self.assertGreater(len(response['logStreams']), 0)

    def test_lambda_iam_permissions_dynamodb_access(self):
        """Test Lambda functions have DynamoDB access via IAM roles"""
        # Test by invoking functions and verifying successful DynamoDB write
        test_id = f"iam-test-{int(time.time())}"

        # Test Stripe Lambda
        event = {'body': json.dumps({'id': test_id})}
        response = self.lambda_client.invoke(
            FunctionName=self.stripe_lambda_arn,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )

        payload = json.loads(response['Payload'].read())
        
        # Debug: print payload if statusCode is missing
        if 'statusCode' not in payload:
            print(f"Lambda returned unexpected payload: {payload}")
            self.fail(f"Lambda error: {payload.get('errorMessage', 'Unknown error')}")
        
        # Should succeed (200) if IAM permissions are correct
        self.assertEqual(payload['statusCode'], 200)

    def test_multiple_concurrent_webhook_processing(self):
        """Test system handles multiple concurrent webhooks"""
        test_ids = [f"concurrent-test-{i}-{int(time.time())}" for i in range(5)]

        # Invoke multiple Lambdas concurrently
        for test_id in test_ids:
            event = {'body': json.dumps({'id': test_id, 'amount': 1000})}
            self.lambda_client.invoke(
                FunctionName=self.stripe_lambda_arn,
                InvocationType='Event',  # Asynchronous
                Payload=json.dumps(event)
            )

        # Wait for processing
        time.sleep(5)

        # Verify all transactions were processed
        for test_id in test_ids:
            response = self.dynamodb_client.get_item(
                TableName=self.dynamodb_table_name,
                Key={'transactionId': {'S': test_id}}
            )
            self.assertIn('Item', response)

    def test_resource_naming_includes_environment_suffix(self):
        """Test all resources include environment suffix in names"""
        # All resource names should include the suffix
        self.assertIn(self.environment_suffix, self.dynamodb_table_name)
        self.assertIn(self.environment_suffix, self.stripe_lambda_arn)
        self.assertIn(self.environment_suffix, self.paypal_lambda_arn)
        self.assertIn(self.environment_suffix, self.stripe_log_group)
        self.assertIn(self.environment_suffix, self.paypal_log_group)


if __name__ == '__main__':
    unittest.main()
