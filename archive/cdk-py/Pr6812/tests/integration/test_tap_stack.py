"""Integration tests for the TapStack - tests real AWS resources."""
import json
import os
import unittest
import boto3
import requests
from pytest import mark

# Load deployment outputs
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
class TestTapStack(unittest.TestCase):
    """Integration tests using deployed AWS resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and get outputs"""
        cls.outputs = flat_outputs
        cls.region = os.getenv('AWS_REGION', 'us-east-1')

        # Initialize AWS clients
        cls.dynamodb = boto3.resource('dynamodb', region_name=cls.region)
        cls.sqs = boto3.client('sqs', region_name=cls.region)
        cls.sns = boto3.client('sns', region_name=cls.region)
        cls.cloudwatch = boto3.client('cloudwatch', region_name=cls.region)
        cls.apigateway = boto3.client('apigateway', region_name=cls.region)

    def setUp(self):
        """Set up before each test"""
        if not self.outputs:
            self.skipTest("No deployment outputs found - stack not deployed")

    @mark.it("verifies DynamoDB table exists and has PITR enabled")
    def test_dynamodb_table_exists(self):
        """Test DynamoDB table is accessible and configured correctly"""
        # ARRANGE
        table_name = self.outputs.get('TransactionsTableName')
        self.assertIsNotNone(table_name, "TransactionsTableName not in outputs")

        # ACT
        table = self.dynamodb.Table(table_name)
        table.load()

        # ASSERT
        self.assertEqual(table.table_status, 'ACTIVE')
        self.assertEqual(table.billing_mode_summary['BillingMode'], 'PAY_PER_REQUEST')

        # Check PITR is enabled
        dynamodb_client = boto3.client('dynamodb', region_name=self.region)
        pitr_response = dynamodb_client.describe_continuous_backups(
            TableName=table_name
        )
        pitr_status = pitr_response['ContinuousBackupsDescription'][
            'PointInTimeRecoveryDescription'
        ]['PointInTimeRecoveryStatus']
        self.assertEqual(pitr_status, 'ENABLED')

    @mark.it("verifies API Gateway endpoint is accessible")
    def test_api_gateway_health_endpoint(self):
        """Test API Gateway health endpoint returns 200"""
        # ARRANGE
        api_endpoint = self.outputs.get('APIEndpoint')
        self.assertIsNotNone(api_endpoint, "APIEndpoint not in outputs")

        # ACT
        health_url = f"{api_endpoint}health"
        response = requests.get(health_url, timeout=30)

        # ASSERT
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('timestamp', data)
        self.assertIn('checks', data)

    @mark.it("validates payment workflow end-to-end")
    def test_payment_workflow(self):
        """Test complete payment validation and processing workflow"""
        # ARRANGE
        api_endpoint = self.outputs.get('APIEndpoint')
        table_name = self.outputs.get('TransactionsTableName')

        payment_data = {
            "amount": 99.99,
            "currency": "USD",
            "customer_id": "test-customer-123"
        }

        # ACT - Step 1: Validate payment
        validate_url = f"{api_endpoint}validate"
        validate_response = requests.post(
            validate_url,
            json=payment_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        # ASSERT - Validation response
        self.assertEqual(validate_response.status_code, 200)
        validate_data = validate_response.json()
        self.assertEqual(validate_data['status'], 'validated')
        transaction_id = validate_data['transaction_id']
        self.assertIsNotNone(transaction_id)

        # ACT - Step 2: Verify transaction in DynamoDB
        table = self.dynamodb.Table(table_name)
        db_response = table.get_item(Key={'transaction_id': transaction_id})

        # ASSERT - DynamoDB record
        self.assertIn('Item', db_response)
        item = db_response['Item']
        self.assertEqual(item['status'], 'validated')
        self.assertEqual(item['customer_id'], payment_data['customer_id'])

        # ACT - Step 3: Process payment
        process_url = f"{api_endpoint}process"
        process_response = requests.post(
            process_url,
            json={"transaction_id": transaction_id},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        # ASSERT - Processing response
        self.assertEqual(process_response.status_code, 200)
        process_data = process_response.json()
        self.assertEqual(process_data['status'], 'processed')

        # ACT - Step 4: Verify updated transaction in DynamoDB
        db_response_2 = table.get_item(Key={'transaction_id': transaction_id})

        # ASSERT - Updated DynamoDB record
        self.assertIn('Item', db_response_2)
        updated_item = db_response_2['Item']
        self.assertEqual(updated_item['status'], 'processed')
        self.assertIn('processed_at', updated_item)

    @mark.it("verifies SNS topic exists")
    def test_sns_topic_exists(self):
        """Test SNS alarm topic is created"""
        # ARRANGE
        topic_arn = self.outputs.get('AlarmTopicArn')
        self.assertIsNotNone(topic_arn, "AlarmTopicArn not in outputs")

        # ACT
        response = self.sns.get_topic_attributes(TopicArn=topic_arn)

        # ASSERT
        self.assertIn('Attributes', response)
        attributes = response['Attributes']
        self.assertIn('TopicArn', attributes)
        self.assertEqual(attributes['TopicArn'], topic_arn)

    @mark.it("verifies CloudWatch dashboard exists")
    def test_cloudwatch_dashboard_exists(self):
        """Test CloudWatch dashboard is created"""
        # ARRANGE
        dashboard_name = self.outputs.get('DashboardName')
        self.assertIsNotNone(dashboard_name, "DashboardName not in outputs")

        # ACT
        response = self.cloudwatch.get_dashboard(DashboardName=dashboard_name)

        # ASSERT
        self.assertIn('DashboardBody', response)
        self.assertIn('DashboardName', response)
        self.assertEqual(response['DashboardName'], dashboard_name)

        # Verify dashboard has widgets
        dashboard_body = json.loads(response['DashboardBody'])
        self.assertIn('widgets', dashboard_body)
        self.assertGreater(len(dashboard_body['widgets']), 0)

    @mark.it("verifies CloudWatch alarms are created")
    def test_cloudwatch_alarms_exist(self):
        """Test CloudWatch alarms are configured"""
        # ARRANGE
        env_suffix = self.outputs.get('DashboardName', '').replace('payment-dashboard-', '')
        expected_alarms = [
            f'api-latency-{env_suffix}',
            f'dynamodb-throttle-{env_suffix}',
            f'validation-errors-{env_suffix}',
            f'processing-errors-{env_suffix}'
        ]

        # ACT & ASSERT - Check each alarm exists
        for expected_alarm in expected_alarms:
            try:
                response = self.cloudwatch.describe_alarms(
                    AlarmNames=[expected_alarm]
                )
                self.assertEqual(
                    len(response['MetricAlarms']),
                    1,
                    f"Alarm {expected_alarm} not found"
                )
                alarm = response['MetricAlarms'][0]
                self.assertEqual(alarm['AlarmName'], expected_alarm)
            except Exception as e:
                self.fail(f"Failed to retrieve alarm {expected_alarm}: {str(e)}")

    @mark.it("validates payment with missing fields returns 400")
    def test_payment_validation_error_handling(self):
        """Test API error handling for invalid payment data"""
        # ARRANGE
        api_endpoint = self.outputs.get('APIEndpoint')
        invalid_payment = {
            "amount": 50.00
            # Missing currency and customer_id
        }

        # ACT
        validate_url = f"{api_endpoint}validate"
        response = requests.post(
            validate_url,
            json=invalid_payment,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        # ASSERT
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
        self.assertIn('missing_fields', data)

    @mark.it("validates API Gateway throttling configuration")
    def test_api_gateway_throttling(self):
        """Test API Gateway has throttling enabled"""
        # ARRANGE
        api_endpoint = self.outputs.get('APIEndpoint')
        # Extract API ID from endpoint URL
        api_id = api_endpoint.split('//')[1].split('.')[0]

        # ACT
        response = self.apigateway.get_stage(
            restApiId=api_id,
            stageName='prod'
        )

        # ASSERT
        self.assertIn('methodSettings', response)
        method_settings = response['methodSettings']

        # Check throttling is configured
        for path, settings in method_settings.items():
            if 'throttlingRateLimit' in settings:
                self.assertGreaterEqual(settings['throttlingRateLimit'], 1000)
            if 'throttlingBurstLimit' in settings:
                self.assertGreaterEqual(settings['throttlingBurstLimit'], 2000)

    @mark.it("verifies Lambda functions are deployed")
    def test_lambda_functions_deployed(self):
        """Test Lambda functions exist and are active"""
        # ARRANGE
        lambda_client = boto3.client('lambda', region_name=self.region)
        env_suffix = self.outputs.get('DashboardName', '').replace('payment-dashboard-', '')

        expected_functions = [
            f'payment-validation-{env_suffix}',
            f'payment-processing-{env_suffix}',
            f'health-monitor-{env_suffix}'
        ]

        # ACT & ASSERT
        for function_name in expected_functions:
            response = lambda_client.get_function(FunctionName=function_name)
            self.assertIn('Configuration', response)
            config = response['Configuration']
            self.assertEqual(config['State'], 'Active')
            self.assertEqual(config['Runtime'], 'python3.11')

    @mark.it("validates invalid transaction processing returns 404")
    def test_process_nonexistent_transaction(self):
        """Test processing non-existent transaction returns error"""
        # ARRANGE
        api_endpoint = self.outputs.get('APIEndpoint')
        fake_transaction_id = "00000000-0000-0000-0000-000000000000"

        # ACT
        process_url = f"{api_endpoint}process"
        response = requests.post(
            process_url,
            json={"transaction_id": fake_transaction_id},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        # ASSERT
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Transaction not found')
