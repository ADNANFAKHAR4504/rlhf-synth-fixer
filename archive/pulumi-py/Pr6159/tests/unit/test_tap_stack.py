"""
test_tap_stack.py

Unit tests for the TapStack Pulumi fraud detection pipeline.
Tests infrastructure configuration values and helper functions.
"""

import unittest
from pathlib import Path
from unittest.mock import patch

import pulumi
from pulumi.runtime import (
    Mocks,
    MockCallArgs,
    MockResourceArgs,
    set_mocks,
)

from lib.helpers import (
    validate_transaction,
    detect_fraud,
    format_notification_message,
    get_configuration_values
)
from lib.tap_stack import TapStack, TapStackArgs


class MinimalMocks(Mocks):
    """Return inputs as outputs with minimal augmentation."""

    def new_resource(self, args: MockResourceArgs):
        outputs = dict(args.inputs)
        outputs.setdefault("id", f"{args.name}-id")
        outputs.setdefault("arn", f"arn:aws:mock::{args.name}")
        outputs.setdefault("name", args.name)

        type_token = getattr(args, "type", "")

        if type_token.endswith(":Queue"):
            queue_url = f"https://mock.sqs/{args.name}"
            outputs.setdefault("url", queue_url)
            outputs.setdefault("queue_url", queue_url)

        if type_token.endswith(":Function"):
            outputs.setdefault("invoke_arn", f"arn:aws:lambda:mock:::function:{args.name}:invoke")

        if type_token.endswith(":Table"):
            outputs.setdefault("stream_arn", f"arn:aws:dynamodb:mock:::table/{args.name}/stream/mock")

        if type_token.endswith(":Topic"):
            outputs.setdefault("arn", f"arn:aws:sns:mock::{args.name}")

        if type_token.endswith(":RestApi"):
            outputs.setdefault("id", f"{args.name}-id")

        return f"{args.name}_id", outputs

    def call(self, args: MockCallArgs) -> dict:
        if args.token == "aws:index/getRegion:getRegion":
            return {"region": "us-east-1", "name": "us-east-1"}
        return dict(args.args)


set_mocks(MinimalMocks())


class TestConfigurationValues(unittest.TestCase):
    """Test cases for configuration values."""

    def test_get_configuration_values(self):
        """Test configuration values are correct."""
        config = get_configuration_values()

        self.assertEqual(config['lambda_memory'], 512)
        self.assertEqual(config['lambda_concurrency'], 50)
        self.assertEqual(config['lambda_runtime'], 'python3.9')
        self.assertEqual(config['dynamodb_billing'], 'PAY_PER_REQUEST')
        self.assertEqual(config['dynamodb_stream_view'], 'NEW_AND_OLD_IMAGES')
        self.assertEqual(config['sqs_visibility_timeout'], 300)
        self.assertEqual(config['cloudwatch_retention'], 7)

    def test_common_tags_values(self):
        """Test common tags match requirements."""
        config = get_configuration_values()
        tags = config['common_tags']

        self.assertEqual(tags['Environment'], 'production')
        self.assertEqual(tags['CostCenter'], 'fraud-detection')


class TestTransactionValidation(unittest.TestCase):
    """Test cases for transaction validation."""

    def test_validate_transaction_with_valid_data(self):
        """Test transaction validation with valid data."""
        body = {
            'transaction_id': 'txn-123',
            'amount': 1500,
            'merchant': 'Test Store'
        }

        is_valid, error = validate_transaction(body)
        self.assertTrue(is_valid)
        self.assertIsNone(error)

    def test_validate_transaction_missing_transaction_id(self):
        """Test transaction validation with missing transaction_id."""
        body = {
            'amount': 1500,
            'merchant': 'Test Store'
        }

        is_valid, error = validate_transaction(body)
        self.assertFalse(is_valid)
        self.assertEqual(error, 'Missing transaction_id')

    def test_validate_transaction_empty_body(self):
        """Test transaction validation with empty body."""
        body = None

        is_valid, error = validate_transaction(body)
        self.assertFalse(is_valid)
        self.assertEqual(error, 'Empty transaction body')

    def test_validate_transaction_with_all_fields(self):
        """Test transaction validation with all fields present."""
        body = {
            'transaction_id': 'txn-456',
            'amount': 2000,
            'merchant': 'Store XYZ',
            'card_number': '****1234',
            'location': 'New York'
        }

        is_valid, error = validate_transaction(body)
        self.assertTrue(is_valid)
        self.assertIsNone(error)


class TestFraudDetection(unittest.TestCase):
    """Test cases for fraud detection logic."""

    def test_detect_fraud_high_amount(self):
        """Test fraud detection for high amount (>5000)."""
        amount = 6000

        is_suspicious, reasons, severity = detect_fraud(amount)

        self.assertTrue(is_suspicious)
        self.assertIn('High amount transaction', reasons)
        self.assertIn('Very high amount transaction', reasons)
        self.assertEqual(severity, 'high')

    def test_detect_fraud_medium_amount(self):
        """Test fraud detection for medium amount (1000-5000)."""
        amount = 2500

        is_suspicious, reasons, severity = detect_fraud(amount)

        self.assertTrue(is_suspicious)
        self.assertIn('High amount transaction', reasons)
        self.assertEqual(severity, 'medium')
        self.assertEqual(len(reasons), 1)

    def test_detect_fraud_low_amount(self):
        """Test fraud detection for low amount (<1000)."""
        amount = 500

        is_suspicious, reasons, severity = detect_fraud(amount)

        self.assertFalse(is_suspicious)
        self.assertEqual(len(reasons), 0)
        self.assertEqual(severity, 'low')

    def test_detect_fraud_boundary_1000(self):
        """Test fraud detection at 1000 boundary."""
        amount = 1000

        is_suspicious, reasons, severity = detect_fraud(amount)

        self.assertFalse(is_suspicious)
        self.assertEqual(len(reasons), 0)

    def test_detect_fraud_boundary_1001(self):
        """Test fraud detection just above 1000."""
        amount = 1001

        is_suspicious, reasons, severity = detect_fraud(amount)

        self.assertTrue(is_suspicious)
        self.assertGreater(len(reasons), 0)

    def test_detect_fraud_boundary_5000(self):
        """Test fraud detection at 5000 boundary."""
        amount = 5000

        is_suspicious, reasons, severity = detect_fraud(amount)

        self.assertTrue(is_suspicious)
        self.assertEqual(severity, 'medium')

    def test_detect_fraud_boundary_5001(self):
        """Test fraud detection just above 5000."""
        amount = 5001

        is_suspicious, reasons, severity = detect_fraud(amount)

        self.assertTrue(is_suspicious)
        self.assertEqual(severity, 'high')


class TestNotificationFormatting(unittest.TestCase):
    """Test cases for notification message formatting."""

    def test_format_notification_message_high_severity(self):
        """Test notification formatting for high severity."""
        transaction_id = 'txn-789'
        amount = 6000
        reasons = ['High amount transaction', 'Very high amount transaction']
        severity = 'high'

        message = format_notification_message(transaction_id, amount, reasons, severity)

        self.assertIn('FRAUD ALERT - HIGH SEVERITY', message)
        self.assertIn(transaction_id, message)
        self.assertIn('$6000', message)
        self.assertIn('High amount transaction', message)
        self.assertIn('investigate', message.lower())

    def test_format_notification_message_medium_severity(self):
        """Test notification formatting for medium severity."""
        transaction_id = 'txn-456'
        amount = 2500
        reasons = ['High amount transaction']
        severity = 'medium'

        message = format_notification_message(transaction_id, amount, reasons, severity)

        self.assertIn('FRAUD ALERT - MEDIUM SEVERITY', message)
        self.assertIn(transaction_id, message)
        self.assertIn('$2500', message)

    def test_format_notification_message_contains_required_fields(self):
        """Test notification message contains all required fields."""
        transaction_id = 'txn-123'
        amount = 5500
        reasons = ['Test reason']
        severity = 'high'

        message = format_notification_message(transaction_id, amount, reasons, severity)

        self.assertIn('Transaction ID', message)
        self.assertIn('Amount', message)
        self.assertIn('Reasons', message)
        self.assertIn('FRAUD ALERT', message)


ROOT_DIR = Path(__file__).resolve().parents[2]
LIB_DIR = ROOT_DIR / "lib"


class TestInfrastructureCodeStructure(unittest.TestCase):
    """Test cases for infrastructure code file structure."""

    def test_tap_stack_file_exists(self):
        """Test tap_stack.py file exists."""
        file_path = LIB_DIR / 'tap_stack.py'
        self.assertTrue(file_path.exists())

    def test_tap_stack_contains_kms_key(self):
        """Test tap_stack.py contains KMS key configuration."""
        file_path = LIB_DIR / 'tap_stack.py'
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        self.assertIn('aws.kms.Key', content)
        self.assertIn('kms_key', content)

    def test_tap_stack_contains_dynamodb_table(self):
        """Test tap_stack.py contains DynamoDB table."""
        file_path = LIB_DIR / 'tap_stack.py'
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        self.assertIn('aws.dynamodb.Table', content)
        self.assertIn('transactions_table', content)

    def test_tap_stack_contains_lambda_functions(self):
        """Test tap_stack.py contains all three Lambda functions."""
        file_path = LIB_DIR / 'tap_stack.py'
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        self.assertIn('process-transaction', content)
        self.assertIn('detect-fraud', content)
        self.assertIn('notify-team', content)

    def test_tap_stack_contains_api_gateway(self):
        """Test tap_stack.py contains API Gateway REST API."""
        file_path = LIB_DIR / 'tap_stack.py'
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        self.assertIn('aws.apigateway.RestApi', content)
        self.assertIn('RequestValidator', content)

    def test_tap_stack_contains_sqs_queue(self):
        """Test tap_stack.py contains SQS queue."""
        file_path = LIB_DIR / 'tap_stack.py'
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        self.assertIn('aws.sqs.Queue', content)
        self.assertIn('fraud-alerts', content)

    def test_tap_stack_contains_sns_topic(self):
        """Test tap_stack.py contains SNS topic."""
        file_path = LIB_DIR / 'tap_stack.py'
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        self.assertIn('aws.sns.Topic', content)
        self.assertIn('fraud-notifications', content)

    def test_tap_stack_uses_environment_suffix(self):
        """Test tap_stack.py uses environment_suffix for resource naming."""
        file_path = LIB_DIR / 'tap_stack.py'
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        self.assertIn('environment_suffix', content)
        # Check that environment_suffix is used in resource names
        self.assertIn('{environment_suffix}', content)

    def test_helpers_file_exists(self):
        """Test helpers.py file exists."""
        file_path = LIB_DIR / 'helpers.py'
        self.assertTrue(file_path.exists())


class TestTapStackComponent(unittest.TestCase):
    """Pulumi component tests for TapStack using runtime mocks."""

    def _instantiate_stack(self, environment_suffix: str | None = "dev", tags: dict | None = None):
        exports = {}

        original_export = pulumi.export

        def capture_export(key, value):
            exports[key] = value
            return original_export(key, value)

        with patch("pulumi.Config") as mock_config, patch(
            "lib.tap_stack.pulumi.export",
            new=capture_export,
        ):
            mock_config.return_value.get.return_value = None
            stack = TapStack(
                "test-stack",
                TapStackArgs(environment_suffix=environment_suffix, tags=tags),
            )

        return stack, exports

    @pulumi.runtime.test
    def test_stack_uses_provided_environment_suffix(self):
        """Stack should honour provided environment suffix."""

        def check(_):
            stack, _ = self._instantiate_stack(environment_suffix="qa")
            return pulumi.Output.from_input(stack.environment_suffix)

        return check([]).apply(lambda value: self.assertEqual(value, "qa"))

    @pulumi.runtime.test
    def test_stack_defaults_to_dev_environment(self):
        """Stack should default to dev when environment not supplied."""

        def check(_):
            stack, _ = self._instantiate_stack(environment_suffix=None, tags=None)
            return pulumi.Output.from_input(stack.environment_suffix)

        return check([]).apply(lambda value: self.assertEqual(value, "dev"))

if __name__ == '__main__':
    unittest.main()
