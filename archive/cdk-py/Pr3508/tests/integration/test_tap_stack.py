import json
import os
import time
import uuid
import boto3
import pytest
from botocore.exceptions import ClientError


class TestGiftCardPlatformIntegration:
    """Integration tests for Gift Card Platform"""

    @classmethod
    def setup_class(cls):
        """Setup test resources"""
        cls.api_gateway = boto3.client('apigateway', region_name='us-west-2')
        cls.lambda_client = boto3.client('lambda', region_name='us-west-2')
        cls.dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
        cls.sns = boto3.client('sns', region_name='us-west-2')
        cls.cloudwatch = boto3.client('cloudwatch', region_name='us-west-2')

        # Get environment suffix from environment variable or default
        cls.env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'test')
        cls.api_endpoint = None  # Will be populated from stack outputs

    def test_api_gateway_endpoint_exists(self):
        """Test that API Gateway endpoint is created"""
        response = self.api_gateway.get_rest_apis()
        api_names = [api['name'] for api in response['items']]
        assert f'gift-card-api-{self.env_suffix}' in api_names

    def test_lambda_function_exists(self):
        """Test that Lambda function is deployed"""
        try:
            response = self.lambda_client.get_function(
                FunctionName=f'gift-card-redemption-{self.env_suffix}'
            )
            assert response['Configuration']['Runtime'] == 'python3.11'
            assert response['Configuration']['TracingConfig']['Mode'] == 'Active'
        except ClientError as e:
            pytest.fail(f"Lambda function not found: {e}")

    def test_dynamodb_tables_exist(self):
        """Test that DynamoDB tables are created"""
        # Check gift cards table
        gift_card_table = self.dynamodb.Table(f'gift-cards-{self.env_suffix}')
        assert gift_card_table.table_status == 'ACTIVE'
        assert gift_card_table.billing_mode_summary['BillingMode'] == 'PAY_PER_REQUEST'

        # Check idempotency table
        idempotency_table = self.dynamodb.Table(f'redemption-idempotency-{self.env_suffix}')
        assert idempotency_table.table_status == 'ACTIVE'

    def test_sns_topic_exists(self):
        """Test that SNS topic is created"""
        response = self.sns.list_topics()
        topic_names = [topic['TopicArn'].split(':')[-1] for topic in response['Topics']]
        assert f'gift-card-redemptions-{self.env_suffix}' in topic_names

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are configured"""
        response = self.cloudwatch.describe_alarms(
            AlarmNamePrefix=f'gift-card-'
        )
        alarm_names = [alarm['AlarmName'] for alarm in response['MetricAlarms']]
        assert f'gift-card-high-errors-{self.env_suffix}' in alarm_names
        assert f'gift-card-throttles-{self.env_suffix}' in alarm_names

    def test_redemption_flow(self):
        """Test end-to-end redemption flow"""
        if not self.api_endpoint:
            pytest.skip("API endpoint not available")

        # Prepare test data
        gift_card_table = self.dynamodb.Table(f'gift-cards-{self.env_suffix}')
        card_id = f'test-card-{uuid.uuid4()}'

        # Insert test gift card
        gift_card_table.put_item(
            Item={
                'card_id': card_id,
                'balance': 100.00,
                'is_active': True,
                'customer_id': 'test-customer',
                'created_at': int(time.time()),
                'redemption_count': 0
            }
        )

        # Test redemption request
        import requests

        redemption_data = {
            'card_id': card_id,
            'amount': 25.00,
            'customer_id': 'test-customer',
            'idempotency_key': str(uuid.uuid4())
        }

        response = requests.post(
            f"{self.api_endpoint}/redeem",
            json=redemption_data,
            headers={'Content-Type': 'application/json'}
        )

        assert response.status_code == 200
        response_data = response.json()
        assert response_data['success'] is True
        assert response_data['new_balance'] == 75.00

        # Verify idempotency
        response2 = requests.post(
            f"{self.api_endpoint}/redeem",
            json=redemption_data,
            headers={'Content-Type': 'application/json'}
        )

        assert response2.status_code == 200
        assert response2.headers.get('X-Idempotency') == 'cached'

        # Cleanup
        gift_card_table.delete_item(Key={'card_id': card_id})

    def test_insufficient_balance_rejection(self):
        """Test that redemption with insufficient balance is rejected"""
        if not self.api_endpoint:
            pytest.skip("API endpoint not available")

        gift_card_table = self.dynamodb.Table(f'gift-cards-{self.env_suffix}')
        card_id = f'test-card-{uuid.uuid4()}'

        # Insert test gift card with low balance
        gift_card_table.put_item(
            Item={
                'card_id': card_id,
                'balance': 10.00,
                'is_active': True,
                'customer_id': 'test-customer',
                'created_at': int(time.time()),
                'redemption_count': 0
            }
        )

        # Test redemption request exceeding balance
        import requests

        redemption_data = {
            'card_id': card_id,
            'amount': 50.00,
            'customer_id': 'test-customer',
            'idempotency_key': str(uuid.uuid4())
        }

        response = requests.post(
            f"{self.api_endpoint}/redeem",
            json=redemption_data,
            headers={'Content-Type': 'application/json'}
        )

        assert response.status_code == 400
        response_data = response.json()
        assert response_data['success'] is False
        assert 'Insufficient balance' in response_data['message']

        # Cleanup
        gift_card_table.delete_item(Key={'card_id': card_id})
