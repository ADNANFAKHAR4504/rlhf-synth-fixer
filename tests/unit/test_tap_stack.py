"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.

Requirements:
- pulumi
- pulumi-aws
- aws-lambda-powertools (for Lambda handler tests)

Note: If dependencies are missing, infrastructure tests will be skipped.
Lambda handler tests require aws-lambda-powertools dependency.
"""

import json
import unittest
import asyncio
from unittest.mock import Mock, patch, MagicMock
import os
import sys

# Add the lib directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib'))

# Try to import required dependencies and skip tests if not available
try:
    import pulumi
    import pulumi.runtime
    PULUMI_AVAILABLE = True
    
    # Set up Pulumi mocking for tests
    class MyMocks(pulumi.runtime.Mocks):
        def call(self, args):
            # Return mock response for AWS calls
            return {}
        
        def new_resource(self, args):
            def convert_mock_to_string(obj):
                """Recursively convert MagicMocks to strings in nested structures"""
                if isinstance(obj, MagicMock):
                    return f"mock-{str(obj)}"
                elif isinstance(obj, dict):
                    return {k: convert_mock_to_string(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_mock_to_string(item) for item in obj]
                else:
                    return obj
            
            # Convert all inputs to string-safe versions
            outputs = convert_mock_to_string(args.inputs)
            
            # Return specific mocked outputs based on resource type
            if args.typ == "aws:lambda/function:Function":
                outputs.update({
                    "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}",
                    "name": args.name,
                    "role": "arn:aws:iam::123456789012:role/lambda-role"
                })
            elif args.typ == "aws:dynamodb/table:Table":
                outputs.update({
                    "arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}",
                    "name": args.name
                })
            elif args.typ == "aws:apigateway/restApi:RestApi":
                outputs.update({
                    "id": f"api-{args.name}",
                    "executionArn": f"arn:aws:execute-api:us-east-1:123456789012:api-{args.name}"
                })
            elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
                outputs.update({
                    "arn": f"arn:aws:cloudwatch:us-east-1:123456789012:alarm:{args.name}",
                    "name": args.name
                })
            
            return (args.name + "_id", outputs)
    
    pulumi.runtime.set_mocks(MyMocks())
except ImportError:
    PULUMI_AVAILABLE = False

try:
    import aws_lambda_powertools
    POWERTOOLS_AVAILABLE = True
except ImportError:
    POWERTOOLS_AVAILABLE = False


class TestEnvironment(unittest.TestCase):
    """Tests to verify the test environment setup."""
    
    def test_dependency_availability(self):
        """Test to show which dependencies are available."""
        self.assertIsInstance(PULUMI_AVAILABLE, bool)
        self.assertIsInstance(POWERTOOLS_AVAILABLE, bool)
        
        if not PULUMI_AVAILABLE:
            self.skipTest("Pulumi not available - infrastructure tests will be skipped")
        if not POWERTOOLS_AVAILABLE:
            self.skipTest("aws-lambda-powertools not available - lambda handler tests will be skipped")
    
    def test_basic_imports(self):
        """Test basic Python imports work."""
        import json
        import os
        import sys
        self.assertTrue(True)  # If we get here, basic imports work

@unittest.skipUnless(PULUMI_AVAILABLE, "Pulumi dependencies not available")
class TapStackTests(unittest.TestCase):
    """Unit tests for TapStack infrastructure."""

    @pulumi.runtime.test
    def test_stack_initialization(self):
        """Test stack initializes with correct configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test', tags={'Test': 'Value'})
        stack = TapStack('test-stack', args)
        
        self.assertEqual(stack.environment_suffix, 'test')
        self.assertIn('Test', stack.tags)
        self.assertEqual(stack.tags['Test'], 'Value')
        self.assertEqual(stack.tags['Environment'], 'test')

    @pulumi.runtime.test
    def test_dynamodb_table_configuration(self):
        """Test DynamoDB table is configured correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        with patch('pulumi_aws.dynamodb.Table') as mock_table:
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            mock_table.assert_called()
            call_args = mock_table.call_args

            self.assertEqual(call_args[1]['billing_mode'], 'PAY_PER_REQUEST')
            self.assertEqual(call_args[1]['hash_key'], 'tracking_id')
            self.assertEqual(call_args[1]['range_key'], 'timestamp')
            self.assertTrue(call_args[1]['stream_enabled'])

    @pulumi.runtime.test
    def test_lambda_configuration(self):
        """Test Lambda function configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        with patch('pulumi_aws.lambda_.Function') as mock_lambda:
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            mock_lambda.assert_called()
            call_args = mock_lambda.call_args

            self.assertEqual(call_args[1]['runtime'], 'python3.9')
            self.assertEqual(call_args[1]['timeout'], 30)
            self.assertEqual(call_args[1]['memory_size'], 512)
            self.assertIn('dead_letter_config', call_args[1])
            self.assertEqual(call_args[1]['tracing_config']['mode'], 'Active')

    @pulumi.runtime.test
    def test_api_gateway_configuration(self):
        """Test API Gateway configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        with patch('pulumi_aws.apigateway.RestApi') as mock_api:
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            mock_api.assert_called()
            call_args = mock_api.call_args

            self.assertIn('tracking-api-test', call_args[0][0])
            self.assertEqual(call_args[1]['endpoint_configuration']['types'], 'REGIONAL')

    @pulumi.runtime.test
    def test_cloudwatch_alarms(self):
        """Test CloudWatch alarms are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        with patch('pulumi_aws.cloudwatch.MetricAlarm') as mock_alarm:
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            # Should create multiple alarms
            self.assertGreaterEqual(mock_alarm.call_count, 4)


@unittest.skipUnless(POWERTOOLS_AVAILABLE, "aws-lambda-powertools dependency not available")
class LambdaHandlerTests(unittest.TestCase):
    """Unit tests for Lambda handler."""

    def setUp(self):
        """Set up test environment."""
        os.environ['TABLE_NAME'] = 'test-table'
        os.environ['ENVIRONMENT'] = 'test'
        os.environ['CONFIG_PARAM'] = '/test/config'
        os.environ['DB_PARAM'] = '/test/db'
        os.environ['FEATURE_FLAGS_PARAM'] = '/test/flags'
        os.environ['AWS_REGION'] = 'us-west-2'
        os.environ['AWS_DEFAULT_REGION'] = 'us-west-2'
        os.environ['POWERTOOLS_METRICS_NAMESPACE'] = 'LogisticsTracking'
        os.environ['POWERTOOLS_SERVICE_NAME'] = 'tracking-api'
        # Add lambda directory to path
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda'))

    @patch('handler.dynamodb')
    @patch('handler.ssm')
    def test_tracking_update_success(self, mock_ssm, mock_dynamodb):
        """Test successful tracking update."""
        import handler  # pylint: disable=import-error,import-outside-toplevel  # pylint: disable=import-error,import-outside-toplevel

        mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': '{"enhanced_tracking": true}'}
        }

        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.put_item.return_value = {}

        event = {
            'httpMethod': 'POST',
            'path': '/track',
            'body': json.dumps({
                'tracking_id': 'TEST123',
                'status': 'in_transit',
                'location': {'lat': 40.7128, 'lng': -74.0060}
            })
        }

        context = Mock()
        response = handler.main(event, context)

        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['tracking_id'] == 'TEST123'
        mock_table.put_item.assert_called_once()

    @patch('handler.dynamodb')
    @patch('handler.ssm')
    def test_tracking_update_validation_failure(self, mock_ssm, mock_dynamodb):
        """Test tracking update with invalid data."""
        import handler  # pylint: disable=import-error,import-outside-toplevel

        mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': '{"enhanced_tracking": true}'}
        }

        event = {
            'httpMethod': 'POST',
            'path': '/track',
            'body': json.dumps({
                'tracking_id': 'TEST123',
                'status': 'invalid_status',
                'location': {'lat': 40.7128}
            })
        }

        context = Mock()
        response = handler.main(event, context)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body

    @patch('handler.dynamodb')
    @patch('handler.ssm')
    def test_status_query_success(self, mock_ssm, mock_dynamodb):
        """Test successful status query."""
        import handler  # pylint: disable=import-error,import-outside-toplevel

        mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': '{"enhanced_tracking": true}'}
        }

        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.query.return_value = {
            'Items': [
                {'tracking_id': 'TEST123', 'status': 'delivered'}
            ]
        }

        event = {
            'httpMethod': 'GET',
            'path': '/status',
            'queryStringParameters': {'tracking_id': 'TEST123'}
        }

        context = Mock()
        response = handler.main(event, context)

        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['tracking_id'] == 'TEST123'
        assert len(body['updates']) == 1

    @patch('handler.ssm')
    def test_status_query_missing_parameter(self, mock_ssm):
        """Test status query without tracking_id."""
        import handler  # pylint: disable=import-error,import-outside-toplevel

        mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': '{"enhanced_tracking": true}'}
        }

        event = {
            'httpMethod': 'GET',
            'path': '/status',
            'queryStringParameters': {}
        }

        context = Mock()
        response = handler.main(event, context)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'tracking_id parameter required' in body['error']

    def test_validate_tracking_data(self):
        """Test tracking data validation function."""
        import handler  # pylint: disable=import-error,import-outside-toplevel

        # Valid data
        valid_data = {
            'tracking_id': 'TEST123',
            'status': 'in_transit',
            'location': {'lat': 40.7128, 'lng': -74.0060}
        }
        assert handler.validate_tracking_data(valid_data) is True

        # Missing field
        invalid_data = {
            'tracking_id': 'TEST123',
            'status': 'in_transit'
        }
        assert handler.validate_tracking_data(invalid_data) is False

        # Invalid status
        invalid_status = {
            'tracking_id': 'TEST123',
            'status': 'unknown',
            'location': {'lat': 40.7128, 'lng': -74.0060}
        }
        assert handler.validate_tracking_data(invalid_status) is False

        # Missing location coordinates
        invalid_location = {
            'tracking_id': 'TEST123',
            'status': 'in_transit',
            'location': {'lat': 40.7128}
        }
        assert handler.validate_tracking_data(invalid_location) is False


if __name__ == '__main__':
    unittest.main()
