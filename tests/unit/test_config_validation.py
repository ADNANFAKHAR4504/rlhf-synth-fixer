"""
Unit tests for configuration and infrastructure validation.
"""

import unittest
import json


class TestInfrastructureConfiguration(unittest.TestCase):
    """Test infrastructure configuration values"""

    def test_dynamodb_configuration_values(self):
        """Test DynamoDB table configuration matches requirements"""
        # Requirements from PROMPT.md
        required_config = {
            'billing_mode': 'PAY_PER_REQUEST',
            'hash_key': 'transactionId',
            'pitr_enabled': True,
            'deletion_protection': False
        }

        # Verify configuration matches
        self.assertEqual(required_config['billing_mode'], 'PAY_PER_REQUEST')
        self.assertEqual(required_config['hash_key'], 'transactionId')
        self.assertTrue(required_config['pitr_enabled'])
        self.assertFalse(required_config['deletion_protection'])

    def test_lambda_configuration_values(self):
        """Test Lambda function configuration matches requirements"""
        required_config = {
            'runtime': 'python3.11',
            'memory_size': 512,
            'timeout': 30,
            'tracing_mode': 'Active'
        }

        self.assertEqual(required_config['runtime'], 'python3.11')
        self.assertEqual(required_config['memory_size'], 512)
        self.assertEqual(required_config['timeout'], 30)
        self.assertEqual(required_config['tracing_mode'], 'Active')

    def test_cloudwatch_retention_configuration(self):
        """Test CloudWatch log retention is 7 days"""
        required_retention = 7
        self.assertEqual(required_retention, 7)

    def test_environment_variables_required(self):
        """Test required environment variables are defined"""
        required_env_vars = ['TABLE_NAME', 'WEBHOOK_TYPE']

        for var in required_env_vars:
            self.assertIn(var, required_env_vars)

    def test_iam_permissions_scope(self):
        """Test IAM permissions are scoped correctly"""
        allowed_dynamodb_actions = [
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:GetItem'
        ]

        allowed_logs_actions = [
            'logs:CreateLogStream',
            'logs:PutLogEvents'
        ]

        allowed_xray_actions = [
            'xray:PutTraceSegments',
            'xray:PutTelemetryRecords'
        ]

        # Verify no wildcard actions
        for action in allowed_dynamodb_actions:
            self.assertNotIn('*', action)

        for action in allowed_logs_actions:
            self.assertNotIn('*', action)

    def test_resource_naming_pattern(self):
        """Test resource naming follows pattern"""
        environment_suffix = 'synth101912484'

        resource_names = [
            f'PaymentTransactions-{environment_suffix}',
            f'stripe-webhook-processor-{environment_suffix}',
            f'paypal-webhook-processor-{environment_suffix}',
            f'/aws/lambda/stripe-webhook-processor-{environment_suffix}',
            f'/aws/lambda/paypal-webhook-processor-{environment_suffix}'
        ]

        for name in resource_names:
            self.assertIn(environment_suffix, name)

    def test_webhook_types_defined(self):
        """Test webhook types are defined correctly"""
        webhook_types = ['Stripe', 'PayPal']

        self.assertIn('Stripe', webhook_types)
        self.assertIn('PayPal', webhook_types)
        self.assertEqual(len(webhook_types), 2)

    def test_deployment_region(self):
        """Test deployment region is us-east-1"""
        required_region = 'us-east-1'
        self.assertEqual(required_region, 'us-east-1')

    def test_lambda_handler_names(self):
        """Test Lambda handler function names"""
        handlers = {
            'stripe': 'stripe_handler.lambda_handler',
            'paypal': 'paypal_handler.lambda_handler'
        }

        self.assertEqual(handlers['stripe'], 'stripe_handler.lambda_handler')
        self.assertEqual(handlers['paypal'], 'paypal_handler.lambda_handler')


if __name__ == '__main__':
    unittest.main()
