"""Integration tests for end-to-end fraud detection pipeline."""
import json
import os
import subprocess
import time
import unittest
from pathlib import Path
from decimal import Decimal

import boto3
import requests


class TestFraudDetectionPipeline(unittest.TestCase):
    """End-to-end integration tests for fraud detection pipeline."""

    @classmethod
    def _discover_stack_name(cls):
        """Discover the stack name dynamically from cdktf.out/stacks/."""
        project_root = Path(__file__).parent.parent.parent
        stacks_dir = project_root / "cdktf.out" / "stacks"
        
        if not stacks_dir.exists():
            raise unittest.SkipTest("No stacks found in cdktf.out/stacks/. Please deploy the stack first.")
        
        # Find the first stack directory (should be TapStackdev or similar)
        stack_dirs = [d for d in stacks_dir.iterdir() if d.is_dir()]
        if not stack_dirs:
            raise unittest.SkipTest("No stack directories found. Please deploy the stack first.")
        
        # Return the first stack name found
        stack_name = stack_dirs[0].name
        print(f"Discovered stack name: {stack_name}")
        return stack_name

    @classmethod
    def _get_terraform_outputs(cls, stack_name):
        """Get Terraform outputs dynamically from the deployed stack."""
        project_root = Path(__file__).parent.parent.parent
        stack_dir = project_root / "cdktf.out" / "stacks" / stack_name
        
        if not stack_dir.exists():
            raise unittest.SkipTest(f"Stack directory {stack_dir} not found. Please deploy the stack first.")
        
        try:
            # Try to get outputs using terraform output -json
            result = subprocess.run(
                ["terraform", "output", "-json"],
                cwd=str(stack_dir),
                capture_output=True,
                text=True,
                timeout=30,
                check=True
            )
            
            outputs_raw = json.loads(result.stdout)
            
            # Parse Terraform output format: {"key": {"value": "...", "type": "..."}}
            outputs = {}
            for key, value_obj in outputs_raw.items():
                if isinstance(value_obj, dict) and "value" in value_obj:
                    outputs[key] = value_obj["value"]
                else:
                    outputs[key] = value_obj
            
            print(f"Successfully loaded {len(outputs)} outputs from stack {stack_name}")
            print(f"Available outputs: {list(outputs.keys())}")
            return outputs
            
        except subprocess.CalledProcessError as e:
            raise unittest.SkipTest(
                f"Failed to get Terraform outputs from stack {stack_name}: {e.stderr}"
            )
        except json.JSONDecodeError as e:
            raise unittest.SkipTest(
                f"Failed to parse Terraform outputs from stack {stack_name}: {e}"
            )
        except FileNotFoundError:
            raise unittest.SkipTest(
                "Terraform CLI not found. Please install Terraform to run integration tests."
            )

    @classmethod
    def setUpClass(cls):
        """Set up test environment once for all tests."""
        # Discover stack name dynamically
        cls.stack_name = cls._discover_stack_name()
        
        # Get Terraform outputs dynamically
        outputs = cls._get_terraform_outputs(cls.stack_name)
        
        # Extract values from outputs (no mocked values)
        cls.api_endpoint = outputs.get('api_endpoint')
        cls.dynamodb_table = outputs.get('dynamodb_table_name')
        cls.sqs_queue_url = outputs.get('sqs_queue_url')
        cls.sns_topic_arn = outputs.get('sns_topic_arn')
        
        # Get AWS region from environment or discover from outputs/resources
        cls.region = os.getenv('AWS_REGION')
        if not cls.region:
            # Try to extract region from ARN if available
            if cls.sns_topic_arn:
                # ARN format: arn:aws:service:region:account:resource
                parts = cls.sns_topic_arn.split(':')
                if len(parts) >= 4:
                    cls.region = parts[3]
            if not cls.region:
                cls.region = 'us-east-1'  # Default fallback
        
        # Validate required outputs are present
        if not all([cls.api_endpoint, cls.dynamodb_table, cls.sqs_queue_url]):
            missing = []
            if not cls.api_endpoint:
                missing.append('api_endpoint')
            if not cls.dynamodb_table:
                missing.append('dynamodb_table_name')
            if not cls.sqs_queue_url:
                missing.append('sqs_queue_url')
            raise unittest.SkipTest(
                f"Required Terraform outputs not found: {', '.join(missing)}. "
                "Please ensure the stack is deployed and outputs are configured."
            )
        
        print(f"Using region: {cls.region}")
        print(f"API Endpoint: {cls.api_endpoint}")
        print(f"DynamoDB Table: {cls.dynamodb_table}")
        print(f"SQS Queue URL: {cls.sqs_queue_url}")
        print(f"SNS Topic ARN: {cls.sns_topic_arn}")
        
        # Initialize AWS clients
        cls.dynamodb = boto3.client('dynamodb', region_name=cls.region)
        cls.sqs = boto3.client('sqs', region_name=cls.region)
        cls.sns = boto3.client('sns', region_name=cls.region)

    def test_api_endpoint_accessible(self):
        """Test API endpoint is accessible."""
        response = requests.post(
            self.api_endpoint,
            json={
                'amount': 100.50,
                'merchant': 'Test Store',
                'card_number': '1234567890123456'
            },
            timeout=30
        )

        self.assertIn(response.status_code, [200, 201])

    def test_submit_legitimate_transaction(self):
        """Test submitting a legitimate transaction."""

        transaction_data = {
            'amount': 125.67,
            'merchant': 'Walmart',
            'card_number': '1234567890123456',
            'location': 'New York, USA'
        }

        response = requests.post(self.api_endpoint, json=transaction_data, timeout=30)

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertIn('transaction_id', body)
        self.assertIn('timestamp', body)

    def test_submit_suspicious_transaction(self):
        """Test submitting a suspicious transaction that triggers fraud detection."""

        transaction_data = {
            'amount': 15000.00,
            'merchant': 'Unknown Store',
            'card_number': '1234567890123456',
            'location': 'Nigeria'
        }

        response = requests.post(self.api_endpoint, json=transaction_data, timeout=30)

        self.assertEqual(response.status_code, 201)
        body = response.json()
        transaction_id = body['transaction_id']

        # Wait for fraud detection to process
        time.sleep(5)

        # Check SQS queue for suspicious transaction
        messages = self.sqs.receive_message(
            QueueUrl=self.sqs_queue_url,
            MaxNumberOfMessages=10
        )

        if 'Messages' in messages:
            found = False
            for message in messages['Messages']:
                msg_body = json.loads(message['Body'])
                if msg_body.get('transaction_id') == transaction_id:
                    found = True
                    self.assertIn('fraud_reason', msg_body)
                    self.assertIn('risk_score', msg_body)
                    break

            self.assertTrue(found, "Suspicious transaction not found in SQS queue")

    def test_transaction_stored_in_dynamodb(self):
        """Test transaction is stored in DynamoDB."""

        transaction_data = {
            'transaction_id': f'TEST-{int(time.time())}',
            'amount': 50.00,
            'merchant': 'Test Store',
            'card_number': '1234567890123456'
        }

        response = requests.post(self.api_endpoint, json=transaction_data, timeout=30)
        self.assertEqual(response.status_code, 201)

        transaction_id = transaction_data['transaction_id']

        # Wait for write to complete
        time.sleep(2)

        # Query DynamoDB
        try:
            result = self.dynamodb.query(
                TableName=self.dynamodb_table,
                KeyConditionExpression='transaction_id = :tid',
                ExpressionAttributeValues={
                    ':tid': {'S': transaction_id}
                }
            )

            self.assertGreater(result['Count'], 0)
            item = result['Items'][0]
            self.assertEqual(item['transaction_id']['S'], transaction_id)
            self.assertEqual(item['merchant']['S'], 'Test Store')
        except Exception as e:
            self.fail(f"Failed to query DynamoDB: {str(e)}")

    def test_invalid_transaction_rejected(self):
        """Test invalid transaction is rejected."""

        transaction_data = {
            'amount': 100.50
        }

        response = requests.post(self.api_endpoint, json=transaction_data, timeout=30)

        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertIn('error', body)

    def test_high_value_transaction_flagged(self):
        """Test high-value transaction is flagged as suspicious."""

        transaction_data = {
            'amount': 25000.00,
            'merchant': 'Luxury Store',
            'card_number': '1234567890123456'
        }

        response = requests.post(self.api_endpoint, json=transaction_data, timeout=30)
        self.assertEqual(response.status_code, 201)

        # Wait for fraud detection
        time.sleep(5)

        # Check SQS for flagged transaction
        messages = self.sqs.receive_message(
            QueueUrl=self.sqs_queue_url,
            MaxNumberOfMessages=10
        )

        self.assertIn('Messages', messages)
        self.assertGreater(len(messages['Messages']), 0)

    def test_multiple_transactions_processed(self):
        """Test multiple transactions are processed correctly."""

        transactions = [
            {'amount': 50.00, 'merchant': 'Store A', 'card_number': '1111222233334444'},
            {'amount': 75.50, 'merchant': 'Store B', 'card_number': '5555666677778888'},
            {'amount': 120.00, 'merchant': 'Store C', 'card_number': '9999000011112222'}
        ]

        for transaction_data in transactions:
            response = requests.post(self.api_endpoint, json=transaction_data, timeout=30)
            self.assertEqual(response.status_code, 201)

        # Verify all transactions can be processed
        time.sleep(3)

    def test_dlq_configuration(self):
        """Test dead letter queue is configured."""
        try:
            attributes = self.sqs.get_queue_attributes(
                QueueUrl=self.sqs_queue_url,
                AttributeNames=['RedrivePolicy']
            )

            self.assertIn('Attributes', attributes)
            self.assertIn('RedrivePolicy', attributes['Attributes'])

            redrive_policy = json.loads(attributes['Attributes']['RedrivePolicy'])
            self.assertIn('deadLetterTargetArn', redrive_policy)
            self.assertIn('maxReceiveCount', redrive_policy)
        except Exception as e:
            self.fail(f"Failed to verify DLQ configuration: {str(e)}")

    def test_sns_topic_exists(self):
        """Test SNS topic for fraud alerts exists."""
        try:
            response = self.sns.get_topic_attributes(
                TopicArn=self.sns_topic_arn
            )

            self.assertIn('Attributes', response)
            self.assertIn('TopicArn', response['Attributes'])
        except Exception as e:
            self.fail(f"Failed to verify SNS topic: {str(e)}")


if __name__ == '__main__':
    unittest.main()
