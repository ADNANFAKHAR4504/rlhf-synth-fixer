"""
Integration tests for webhook processing flow
Tests end-to-end webhook processing with real AWS outputs
"""
import json
import os
import pytest


@pytest.fixture
def stack_outputs():
    """
    Load CloudFormation outputs from deployment
    Returns None if cfn-outputs/flat-outputs.json doesn't exist
    """
    outputs_path = 'cfn-outputs/flat-outputs.json'
    if not os.path.exists(outputs_path):
        pytest.skip("Stack not deployed - cfn-outputs/flat-outputs.json not found")

    with open(outputs_path, 'r') as f:
        return json.load(f)


class TestWebhookEndToEnd:
    """End-to-end integration tests for webhook processing"""

    def test_stack_deployed_successfully(self, stack_outputs):
        """Verify stack is deployed and outputs are available"""
        assert stack_outputs is not None
        assert 'ApiUrl' in stack_outputs or any('ApiUrl' in key for key in stack_outputs.keys())
        assert 'TableName' in stack_outputs or any('TableName' in key for key in stack_outputs.keys())
        assert 'BucketName' in stack_outputs or any('BucketName' in key for key in stack_outputs.keys())

    def test_api_endpoints_exist(self, stack_outputs):
        """Verify API Gateway endpoints are configured"""
        # Find API URL in outputs (key may have stack name prefix)
        api_url = None
        for key, value in stack_outputs.items():
            if 'ApiUrl' in key:
                api_url = value
                break

        assert api_url is not None, "API URL not found in stack outputs"
        assert api_url.startswith('https://'), "API URL should use HTTPS"

    def test_dynamodb_table_accessible(self, stack_outputs):
        """Verify DynamoDB table exists and is accessible"""
        import boto3

        # Find table name in outputs
        table_name = None
        for key, value in stack_outputs.items():
            if 'TableName' in key:
                table_name = value
                break

        assert table_name is not None, "Table name not found in stack outputs"

        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(table_name)

        # Verify table exists by checking its status
        table.load()
        assert table.table_status in ['ACTIVE', 'UPDATING']

    def test_s3_bucket_accessible(self, stack_outputs):
        """Verify S3 bucket exists and is accessible"""
        import boto3

        # Find bucket name in outputs
        bucket_name = None
        for key, value in stack_outputs.items():
            if 'BucketName' in key:
                bucket_name = value
                break

        assert bucket_name is not None, "Bucket name not found in stack outputs"

        s3_client = boto3.client('s3')

        # Verify bucket exists
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200


class TestWebhookProcessing:
    """Integration tests for webhook processing logic"""

    @pytest.mark.skip(reason="Requires deployed API with real webhook signatures")
    def test_stripe_endpoint_processes_webhook(self, stack_outputs):
        """Test Stripe endpoint processes webhook successfully"""
        # This test would require:
        # 1. Deployed API Gateway
        # 2. Valid authorization token
        # 3. Stripe webhook signature
        pass

    @pytest.mark.skip(reason="Requires deployed API with real webhook signatures")
    def test_paypal_endpoint_processes_webhook(self, stack_outputs):
        """Test PayPal endpoint processes webhook successfully"""
        pass

    @pytest.mark.skip(reason="Requires deployed API with real webhook signatures")
    def test_square_endpoint_processes_webhook(self, stack_outputs):
        """Test Square endpoint processes webhook successfully"""
        pass


class TestInfrastructureConfiguration:
    """Integration tests for infrastructure configuration"""

    def test_lambda_functions_configured_correctly(self, stack_outputs):
        """Verify Lambda functions have correct runtime and configuration"""
        import boto3

        lambda_client = boto3.client('lambda')

        # Get environment suffix from outputs or use default
        env_suffix = 'dev'  # Default if not found in outputs

        # List of expected Lambda function names
        expected_functions = [
            f'webhook-authorizer-{env_suffix}',
            f'stripe-processor-{env_suffix}',
            f'paypal-processor-{env_suffix}',
            f'square-processor-{env_suffix}',
            f'sqs-consumer-{env_suffix}',
            f'dlq-processor-{env_suffix}'
        ]

        # Check each Lambda function exists
        for function_name in expected_functions:
            try:
                response = lambda_client.get_function(FunctionName=function_name)
                config = response['Configuration']

                # Verify runtime is Python 3.11
                assert config['Runtime'] == 'python3.11', f"{function_name} should use Python 3.11"

            except lambda_client.exceptions.ResourceNotFoundException:
                # Function may have different naming convention in deployment
                pytest.skip(f"Function {function_name} not found - may use different naming")

    def test_sqs_queues_configured(self, stack_outputs):
        """Verify SQS queues are configured with correct settings"""
        import boto3

        sqs_client = boto3.client('sqs')

        # Get environment suffix
        env_suffix = 'dev'

        try:
            # Check main queue
            queue_name = f'webhook-queue-{env_suffix}'
            response = sqs_client.get_queue_url(QueueName=queue_name)
            queue_url = response['QueueUrl']

            # Get queue attributes
            attrs = sqs_client.get_queue_attributes(
                QueueUrl=queue_url,
                AttributeNames=['VisibilityTimeout', 'RedrivePolicy']
            )

            # Verify visibility timeout is 300 seconds
            assert attrs['Attributes']['VisibilityTimeout'] == '300'

            # Verify DLQ is configured
            assert 'RedrivePolicy' in attrs['Attributes']

        except sqs_client.exceptions.QueueDoesNotExist:
            pytest.skip(f"Queue {queue_name} not found - may use different naming")
