"""
Integration tests for TapStack
Tests deployed infrastructure with real AWS resources
"""
import json
import os
import time
import boto3
import requests
from pytest import mark, skip

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStack:
    """Integration tests for deployed TapStack infrastructure"""

    @mark.skipif(not flat_outputs, reason="Stack not deployed - no outputs found")
    @mark.it("Verify API Gateway endpoint is accessible")
    def test_api_gateway_endpoint_accessible(self):
        """Test that API Gateway endpoint is accessible"""
        api_url = flat_outputs.get('ApiUrl')
        assert api_url is not None, "ApiUrl output not found in stack outputs"
        assert api_url.startswith('https://'), "API URL should be HTTPS"
        assert 'execute-api' in api_url, "Should be API Gateway URL"

    @mark.skipif(not flat_outputs, reason="Stack not deployed - no outputs found")
    @mark.it("Verify DynamoDB table exists and is accessible")
    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists and is accessible"""
        table_name = flat_outputs.get('TableName')
        assert table_name is not None, "TableName output not found"

        dynamodb = boto3.client('dynamodb')
        response = dynamodb.describe_table(TableName=table_name)

        assert response['Table']['TableName'] == table_name
        assert response['Table']['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST'
        assert len(response['Table']['KeySchema']) == 2  # Partition + Sort key

        # Verify key schema
        key_names = {key['AttributeName'] for key in response['Table']['KeySchema']}
        assert 'eventId' in key_names
        assert 'timestamp' in key_names

    @mark.skipif(not flat_outputs, reason="Stack not deployed - no outputs found")
    @mark.it("Verify S3 bucket exists and is accessible")
    def test_s3_bucket_exists(self):
        """Test that S3 bucket exists and is accessible"""
        bucket_name = flat_outputs.get('BucketName')
        assert bucket_name is not None, "BucketName output not found"

        s3 = boto3.client('s3')

        # Verify bucket exists
        response = s3.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

        # Verify bucket encryption
        encryption = s3.get_bucket_encryption(Bucket=bucket_name)
        assert 'Rules' in encryption
        assert len(encryption['Rules']) > 0

        # Verify lifecycle policy
        lifecycle = s3.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        assert 'Rules' in lifecycle
        glacier_rule = next((r for r in lifecycle['Rules'] if r['ID'] == 'TransitionToGlacier'), None)
        assert glacier_rule is not None
        assert glacier_rule['Status'] == 'Enabled'
        assert glacier_rule['Transitions'][0]['Days'] == 90
        assert glacier_rule['Transitions'][0]['StorageClass'] == 'GLACIER'

    @mark.skipif(not flat_outputs, reason="Stack not deployed - no outputs found")
    @mark.it("Verify SQS queues exist")
    def test_sqs_queues_exist(self):
        """Test that SQS queues exist"""
        sqs = boto3.client('sqs')

        # Get environment suffix from table name
        table_name = flat_outputs.get('TableName')
        env_suffix = table_name.split('-')[-1] if table_name else 'dev'

        # List all queues
        queues = sqs.list_queues(QueueNamePrefix=f'webhook')
        assert 'QueueUrls' in queues
        assert len(queues['QueueUrls']) >= 2  # Main queue + DLQ

        # Verify main queue
        main_queue_url = next((q for q in queues['QueueUrls'] if f'webhook-queue-{env_suffix}' in q), None)
        assert main_queue_url is not None, "Main webhook queue not found"

        # Verify DLQ
        dlq_url = next((q for q in queues['QueueUrls'] if f'webhook-dlq-{env_suffix}' in q), None)
        assert dlq_url is not None, "DLQ not found"

        # Verify main queue has DLQ configured
        main_queue_attrs = sqs.get_queue_attributes(
            QueueUrl=main_queue_url,
            AttributeNames=['RedrivePolicy', 'VisibilityTimeout']
        )
        assert 'RedrivePolicy' in main_queue_attrs['Attributes']
        assert main_queue_attrs['Attributes']['VisibilityTimeout'] == '300'

    @mark.skipif(not flat_outputs, reason="Stack not deployed - no outputs found")
    @mark.it("Verify Lambda functions exist")
    def test_lambda_functions_exist(self):
        """Test that all Lambda functions exist"""
        lambda_client = boto3.client('lambda')

        # Get environment suffix from table name
        table_name = flat_outputs.get('TableName')
        env_suffix = table_name.split('-')[-1] if table_name else 'dev'

        expected_functions = [
            f'webhook-authorizer-{env_suffix}',
            f'stripe-processor-{env_suffix}',
            f'paypal-processor-{env_suffix}',
            f'square-processor-{env_suffix}',
            f'sqs-consumer-{env_suffix}',
            f'dlq-processor-{env_suffix}'
        ]

        for function_name in expected_functions:
            response = lambda_client.get_function(FunctionName=function_name)
            assert response['Configuration']['FunctionName'] == function_name
            assert response['Configuration']['Runtime'] == 'python3.11'

    @mark.skipif(not flat_outputs, reason="Stack not deployed - no outputs found")
    @mark.it("Verify API Gateway returns 401 for unauthorized requests")
    def test_api_gateway_returns_401_for_unauthorized(self):
        """Test that API Gateway returns 401 for requests without authorization"""
        api_url = flat_outputs.get('ApiUrl')
        assert api_url is not None

        # Try to call Stripe endpoint without authorization
        response = requests.post(
            f"{api_url}stripe",
            json={"test": "data"},
            timeout=10
        )

        # Should return 401 Unauthorized
        assert response.status_code == 401

    @mark.skipif(not flat_outputs, reason="Stack not deployed - no outputs found")
    @mark.it("Verify end-to-end webhook processing flow")
    def test_end_to_end_webhook_flow(self):
        """Test complete webhook processing flow from API to DynamoDB"""
        api_url = flat_outputs.get('ApiUrl')
        table_name = flat_outputs.get('TableName')

        assert api_url is not None
        assert table_name is not None

        # Make authenticated request to Stripe endpoint
        test_event_id = f"test-evt-{int(time.time())}"
        response = requests.post(
            f"{api_url}stripe",
            json={
                "id": test_event_id,
                "type": "payment_intent.succeeded",
                "data": {"amount": 5000}
            },
            headers={"Authorization": "valid-token"},
            timeout=10
        )

        # Should be accepted
        assert response.status_code == 200

        # Wait for async processing (SQS -> Lambda -> DynamoDB)
        time.sleep(5)

        # Verify event was written to DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(table_name)

        # Query for the event
        response = table.scan(
            FilterExpression='contains(eventId, :event_id)',
            ExpressionAttributeValues={':event_id': test_event_id}
        )

        # Should find at least one matching item
        assert response['Count'] >= 1, f"Event {test_event_id} not found in DynamoDB"
        item = response['Items'][0]
        assert item['provider'] == 'stripe'
        assert 'timestamp' in item
