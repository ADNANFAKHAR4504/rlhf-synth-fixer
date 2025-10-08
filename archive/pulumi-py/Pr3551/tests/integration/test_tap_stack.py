"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.

NOTE: These tests require actual Pulumi stack deployment to AWS.
"""

import unittest
import os
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with environment configuration."""
        # cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.environment_suffix = "dev"
        cls.region = os.getenv('AWS_REGION', 'us-east-1')

        # Initialize AWS clients
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.events_client = boto3.client('events', region_name=cls.region)

    def test_dynamodb_tables(self):
        """Test that DynamoDB tables exist and are accessible."""
        # Test member accounts table
        member_table_name = f"loyalty-member-accounts-{self.environment_suffix}"
        try:
            response = self.dynamodb_client.describe_table(TableName=member_table_name)
            self.assertEqual(response['Table']['TableName'], member_table_name)
            self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')
            self.assertEqual(response['Table']['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        except ClientError as e:
            self.fail(f"Member accounts table not accessible: {e}")

        # Test transactions table
        transaction_table_name = f"loyalty-transactions-{self.environment_suffix}"
        try:
            response = self.dynamodb_client.describe_table(TableName=transaction_table_name)
            self.assertEqual(response['Table']['TableName'], transaction_table_name)
            self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')
        except ClientError as e:
            self.fail(f"Transactions table not accessible: {e}")

    def test_s3_bucket(self):
        """Test that S3 bucket for campaign assets exists."""
        # Get account ID
        sts_client = boto3.client('sts')
        account_id = sts_client.get_caller_identity()['Account']
        bucket_name = f"loyalty-campaign-assets-{self.environment_suffix}-{account_id}"

        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

            # Verify public access block configuration
            public_access_block = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'])
            self.assertTrue(config['BlockPublicPolicy'])
        except ClientError as e:
            self.fail(f"S3 bucket not accessible: {e}")

    def test_lambda_functions(self):
        """Test that Lambda functions are deployed."""
        function_names = [
            f"loyalty-transaction-lambda-{self.environment_suffix}",
            f"loyalty-lookup-lambda-{self.environment_suffix}",
            f"loyalty-campaign-lambda-{self.environment_suffix}",
        ]

        for function_name in function_names:
            try:
                response = self.lambda_client.get_function(FunctionName=function_name)
                self.assertEqual(response['Configuration']['FunctionName'], function_name)
                self.assertEqual(response['Configuration']['Runtime'], 'python3.10')
                self.assertIsNotNone(response['Configuration']['Role'])
            except ClientError as e:
                self.fail(f"Lambda function {function_name} not accessible: {e}")

    def test_api_gateway(self):
        """Test that API Gateway REST API exists."""
        api_name = f"loyalty-api-{self.environment_suffix}"

        try:
            response = self.apigateway_client.get_rest_apis()
            apis = response.get('items', [])
            matching_apis = [api for api in apis if api['name'] == api_name]

            self.assertGreater(len(matching_apis), 0, f"API Gateway {api_name} not found")

            # Get API details
            api_id = matching_apis[0]['id']
            resources = self.apigateway_client.get_resources(restApiId=api_id)

            # Verify /transactions and /members endpoints exist
            paths = [r['path'] for r in resources.get('items', [])]
            self.assertIn('/transactions', paths)
            self.assertIn('/members', paths)
        except ClientError as e:
            self.fail(f"API Gateway not accessible: {e}")

    def test_sns_topic(self):
        """Test that SNS topic for offers exists."""
        topic_name = f"loyalty-offers-topic-{self.environment_suffix}"

        try:
            # List topics and find ours
            response = self.sns_client.list_topics()
            topic_arns = [t['TopicArn'] for t in response.get('Topics', [])]
            matching_topics = [arn for arn in topic_arns if topic_name in arn]

            self.assertGreater(len(matching_topics), 0, f"SNS topic {topic_name} not found")
        except ClientError as e:
            self.fail(f"SNS topic not accessible: {e}")

    def test_dynamodb_functionality(self):
        """Test DynamoDB table functionality by writing and reading data."""
        member_table_name = f"loyalty-member-accounts-{self.environment_suffix}"
        dynamodb = boto3.resource('dynamodb', region_name=self.region)

        try:
            table = dynamodb.Table(member_table_name)

            # Write test member
            test_member_id = "test-member-integration"
            table.put_item(
                Item={
                    'member_id': test_member_id,
                    'email': 'test@example.com',
                    'points_balance': 100,
                    'status': 'active'
                }
            )

            # Read test member
            response = table.get_item(Key={'member_id': test_member_id})
            self.assertIn('Item', response)
            self.assertEqual(response['Item']['member_id'], test_member_id)
            self.assertEqual(response['Item']['email'], 'test@example.com')
            self.assertEqual(response['Item']['points_balance'], 100)

            # Clean up
            table.delete_item(Key={'member_id': test_member_id})
        except Exception as e:
            self.fail(f"DynamoDB functionality test failed: {e}")


if __name__ == '__main__':
    # Skip integration tests if not in integration test environment
    if os.getenv('RUN_INTEGRATION_TESTS') != 'true':
        print("Skipping integration tests. Set RUN_INTEGRATION_TESTS=true to run.")
        import sys
        sys.exit(0)

    unittest.main()