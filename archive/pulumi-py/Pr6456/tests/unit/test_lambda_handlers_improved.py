"""
Improved unit tests for Lambda handler functions with proper mocking.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock, call
import json
import os
import sys


class TestStripeLambdaHandlerImproved(unittest.TestCase):
    """Improved test cases for Stripe webhook Lambda handler"""

    def setUp(self):
        """Set up test environment"""
        os.environ['TABLE_NAME'] = 'test-table'
        os.environ['WEBHOOK_TYPE'] = 'Stripe'
        os.environ['AWS_XRAY_SDK_ENABLED'] = 'false'
        os.environ['AWS_XRAY_CONTEXT_MISSING'] = 'LOG_ERROR'

    @patch('boto3.client')
    def test_stripe_webhook_success_with_body(self, mock_boto3_client):
        """Test successful Stripe webhook processing with body wrapper"""
        mock_dynamodb = MagicMock()
        mock_boto3_client.return_value = mock_dynamodb
        mock_dynamodb.put_item.return_value = {'ResponseMetadata': {'HTTPStatusCode': 200}}

        # Clear any previous imports
        import sys
        if 'lib.lambda_functions.stripe_handler' in sys.modules:
            del sys.modules['lib.lambda_functions.stripe_handler']

        from lib.lambda_functions.stripe_handler import lambda_handler

        event = {
            'body': json.dumps({
                'id': 'stripe_test_123',
                'amount': 1000,
                'currency': 'usd'
            })
        }

        response = lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['message'], 'Webhook processed successfully')
        self.assertEqual(body['transactionId'], 'stripe_test_123')

    @patch('boto3.client')
    def test_stripe_webhook_dict_body(self, mock_boto3_client):
        """Test Stripe webhook with dict body (not string)"""
        mock_dynamodb = MagicMock()
        mock_boto3_client.return_value = mock_dynamodb
        mock_dynamodb.put_item.return_value = {}

        from lib.lambda_functions.stripe_handler import lambda_handler

        event = {
            'body': {'id': 'stripe_dict_body', 'amount': 2000}
        }

        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 200)

    @patch('boto3.client')
    def test_stripe_webhook_no_body_key(self, mock_boto3_client):
        """Test Stripe webhook without body key"""
        # Ensure environment variables are set correctly
        os.environ['TABLE_NAME'] = 'test-table'
        os.environ['WEBHOOK_TYPE'] = 'Stripe'
        
        mock_dynamodb = MagicMock()
        mock_boto3_client.return_value = mock_dynamodb
        mock_dynamodb.put_item.return_value = {}

        # Clear cache to reload with correct env vars
        if 'lib.lambda_functions.stripe_handler' in sys.modules:
            del sys.modules['lib.lambda_functions.stripe_handler']

        from lib.lambda_functions.stripe_handler import lambda_handler

        event = {'id': 'stripe_no_body', 'amount': 3000}

        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 200)

    @patch('boto3.client')
    def test_stripe_webhook_no_id_generates_default(self, mock_boto3_client):
        """Test Stripe webhook without ID generates default"""
        # Ensure environment variables are set correctly
        os.environ['TABLE_NAME'] = 'test-table'
        os.environ['WEBHOOK_TYPE'] = 'Stripe'
        
        mock_dynamodb = MagicMock()
        mock_boto3_client.return_value = mock_dynamodb
        mock_dynamodb.put_item.return_value = {}

        # Clear cache to reload with correct env vars
        if 'lib.lambda_functions.stripe_handler' in sys.modules:
            del sys.modules['lib.lambda_functions.stripe_handler']

        from lib.lambda_functions.stripe_handler import lambda_handler

        event = {'body': json.dumps({'amount': 4000})}

        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertIn('stripe-', body['transactionId'])

    @patch('boto3.client')
    def test_stripe_webhook_exception_handling(self, mock_boto3_client):
        """Test Stripe webhook handles exceptions"""
        # Force exception by setting invalid table name
        os.environ['TABLE_NAME'] = ''

        mock_dynamodb = MagicMock()
        mock_boto3_client.return_value = mock_dynamodb
        mock_dynamodb.put_item.side_effect = Exception('Test error')

        # Clear cache
        import sys
        if 'lib.lambda_functions.stripe_handler' in sys.modules:
            del sys.modules['lib.lambda_functions.stripe_handler']

        from lib.lambda_functions.stripe_handler import lambda_handler

        event = {'body': json.dumps({'id': 'error_test'})}

        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 500)
        body = json.loads(response['body'])
        self.assertEqual(body['message'], 'Error processing webhook')

        # Restore table name
        os.environ['TABLE_NAME'] = 'test-table'


class TestPayPalLambdaHandlerImproved(unittest.TestCase):
    """Improved test cases for PayPal webhook Lambda handler"""

    def setUp(self):
        """Set up test environment"""
        os.environ['TABLE_NAME'] = 'test-table'
        os.environ['WEBHOOK_TYPE'] = 'PayPal'
        os.environ['AWS_XRAY_SDK_ENABLED'] = 'false'
        os.environ['AWS_XRAY_CONTEXT_MISSING'] = 'LOG_ERROR'

    @patch('boto3.client')
    def test_paypal_webhook_success(self, mock_boto3_client):
        """Test successful PayPal webhook processing"""
        mock_dynamodb = MagicMock()
        mock_boto3_client.return_value = mock_dynamodb
        mock_dynamodb.put_item.return_value = {}

        # Clear cache
        import sys
        if 'lib.lambda_functions.paypal_handler' in sys.modules:
            del sys.modules['lib.lambda_functions.paypal_handler']

        from lib.lambda_functions.paypal_handler import lambda_handler

        event = {
            'body': json.dumps({
                'id': 'paypal_test_456',
                'amount': 2500
            })
        }

        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['transactionId'], 'paypal_test_456')

    @patch('boto3.client')
    def test_paypal_webhook_no_id(self, mock_boto3_client):
        """Test PayPal webhook without ID"""
        mock_dynamodb = MagicMock()
        mock_boto3_client.return_value = mock_dynamodb
        mock_dynamodb.put_item.return_value = {}

        # Clear cache
        import sys
        if 'lib.lambda_functions.paypal_handler' in sys.modules:
            del sys.modules['lib.lambda_functions.paypal_handler']

        from lib.lambda_functions.paypal_handler import lambda_handler

        event = {'body': json.dumps({'amount': 3000})}

        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertIn('paypal-', body['transactionId'])

    @patch('boto3.client')
    def test_paypal_webhook_error(self, mock_boto3_client):
        """Test PayPal webhook error handling"""
        mock_dynamodb = MagicMock()
        mock_boto3_client.return_value = mock_dynamodb
        mock_dynamodb.put_item.side_effect = Exception('Test error')

        from lib.lambda_functions.paypal_handler import lambda_handler

        event = {'body': json.dumps({'id': 'error_test'})}

        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 500)


class TestTapStackComponent(unittest.TestCase):
    """Test TapStack Pulumi component"""

    def test_tap_stack_args_defaults(self):
        """Test TapStackArgs default values"""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs custom values"""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix='prod', tags={'env': 'production'})
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, {'env': 'production'})

    def test_tap_stack_args_none_suffix_defaults(self):
        """Test TapStackArgs with None suffix defaults to dev"""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix=None)
        self.assertEqual(args.environment_suffix, 'dev')


if __name__ == '__main__':
    unittest.main()
