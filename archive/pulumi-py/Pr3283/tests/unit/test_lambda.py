"""
Unit tests for Lambda function
"""
import unittest
import json
import os
import sys
import importlib
from unittest.mock import MagicMock, patch, call
from datetime import datetime, timedelta

# Add lib/lambda to path dynamically
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', 'lambda'))

# Set AWS region for testing
os.environ['AWS_REGION'] = 'us-east-1'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'


class TestLambdaFunction(unittest.TestCase):
    """Test cases for Lambda function"""

    def setUp(self):
        """Set up test environment"""
        os.environ['LOG_GROUP_NAME'] = '/aws/application/test-logs'
        os.environ['S3_BUCKET_NAME'] = 'test-bucket'
        os.environ['AWS_REGION'] = 'us-east-1'
        os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'

        # Clean up any previously imported index module
        if 'index' in sys.modules:
            del sys.modules['index']

    @patch('index.s3_client')
    @patch('index.logs_client')
    def test_handler_success(self, mock_logs_client, mock_s3_client):
        """Test successful log export"""
        # Import after patching
        import index

        # Mock successful export task creation
        mock_logs_client.create_export_task.return_value = {
            'taskId': 'test-task-123'
        }

        # Mock export task status - completed
        mock_logs_client.describe_export_tasks.return_value = {
            'exportTasks': [{
                'status': {'code': 'COMPLETED'}
            }]
        }

        # Call handler
        result = index.handler({}, {})

        # Verify response
        self.assertEqual(result['statusCode'], 200)
        response_body = json.loads(result['body'])
        self.assertEqual(response_body['taskId'], 'test-task-123')
        self.assertIn('Log export completed successfully', response_body['message'])

    @patch('index.s3_client')
    @patch('index.logs_client')
    def test_handler_export_failed(self, mock_logs_client, mock_s3_client):
        """Test failed log export"""
        import index

        # Mock successful export task creation
        mock_logs_client.create_export_task.return_value = {
            'taskId': 'test-task-456'
        }

        # Mock export task status - failed
        mock_logs_client.describe_export_tasks.return_value = {
            'exportTasks': [{
                'status': {'code': 'FAILED'}
            }]
        }

        # Call handler
        result = index.handler({}, {})

        # Verify error response
        self.assertEqual(result['statusCode'], 500)
        response_body = json.loads(result['body'])
        self.assertIn('failed', response_body['error'].lower())

    @patch('index.s3_client')
    @patch('index.logs_client')
    def test_handler_export_cancelled(self, mock_logs_client, mock_s3_client):
        """Test cancelled log export"""
        import index

        # Mock successful export task creation
        mock_logs_client.create_export_task.return_value = {
            'taskId': 'test-task-789'
        }

        # Mock export task status - cancelled
        mock_logs_client.describe_export_tasks.return_value = {
            'exportTasks': [{
                'status': {'code': 'CANCELLED'}
            }]
        }

        # Call handler
        result = index.handler({}, {})

        # Verify error response
        self.assertEqual(result['statusCode'], 500)
        response_body = json.loads(result['body'])
        self.assertIn('CANCELLED', response_body['error'])

    @patch('index.time.sleep')
    @patch('index.s3_client')
    @patch('index.logs_client')
    def test_handler_timeout(self, mock_logs_client, mock_s3_client, mock_sleep):
        """Test export task timeout"""
        import index

        # Mock successful export task creation
        mock_logs_client.create_export_task.return_value = {
            'taskId': 'test-task-timeout'
        }

        # Mock export task status - always pending
        mock_logs_client.describe_export_tasks.return_value = {
            'exportTasks': [{
                'status': {'code': 'PENDING'}
            }]
        }

        # Mock sleep to avoid actual waiting
        mock_sleep.return_value = None

        # Call handler
        result = index.handler({}, {})

        # Verify timeout response
        self.assertEqual(result['statusCode'], 202)
        response_body = json.loads(result['body'])
        self.assertIn('Export task still running', response_body['message'])

    @patch('index.s3_client')
    @patch('index.logs_client')
    def test_handler_exception(self, mock_logs_client, mock_s3_client):
        """Test exception handling"""
        import index

        # Mock exception
        mock_logs_client.create_export_task.side_effect = Exception("Test error")

        # Call handler
        result = index.handler({}, {})

        # Verify error response
        self.assertEqual(result['statusCode'], 500)
        response_body = json.loads(result['body'])
        self.assertEqual(response_body['error'], "Test error")

    @patch('index.s3_client')
    @patch('index.logs_client')
    def test_time_range_calculation(self, mock_logs_client, mock_s3_client):
        """Test that time range is calculated correctly"""
        import index

        # Mock successful export
        mock_logs_client.create_export_task.return_value = {
            'taskId': 'test-task-time'
        }
        mock_logs_client.describe_export_tasks.return_value = {
            'exportTasks': [{
                'status': {'code': 'COMPLETED'}
            }]
        }

        # Call handler
        index.handler({}, {})

        # Verify create_export_task was called with correct time range
        call_args = mock_logs_client.create_export_task.call_args
        self.assertIn('fromTime', call_args[1])
        self.assertIn('to', call_args[1])

        # Verify time range is approximately 24 hours
        from_time = call_args[1]['fromTime']
        to_time = call_args[1]['to']
        time_diff = to_time - from_time
        # Should be approximately 24 hours in milliseconds
        self.assertAlmostEqual(time_diff, 24 * 60 * 60 * 1000, delta=60000)

    @patch('index.s3_client')
    @patch('index.logs_client')
    def test_destination_prefix_format(self, mock_logs_client, mock_s3_client):
        """Test S3 destination prefix format"""
        import index

        # Mock successful export
        mock_logs_client.create_export_task.return_value = {
            'taskId': 'test-task-prefix'
        }
        mock_logs_client.describe_export_tasks.return_value = {
            'exportTasks': [{
                'status': {'code': 'COMPLETED'}
            }]
        }

        # Call handler
        index.handler({}, {})

        # Verify destination prefix format
        call_args = mock_logs_client.create_export_task.call_args
        destination_prefix = call_args[1]['destinationPrefix']

        # Should match pattern logs/YYYY/MM/DD/
        import re
        pattern = r'logs/\d{4}/\d{2}/\d{2}/'
        self.assertTrue(re.match(pattern, destination_prefix))

    def test_environment_variables_required(self):
        """Test that environment variables are required"""
        # Save original env vars
        orig_log_group = os.environ.get('LOG_GROUP_NAME')
        orig_bucket = os.environ.get('S3_BUCKET_NAME')

        try:
            # Remove environment variables
            if 'LOG_GROUP_NAME' in os.environ:
                del os.environ['LOG_GROUP_NAME']
            if 'S3_BUCKET_NAME' in os.environ:
                del os.environ['S3_BUCKET_NAME']

            # Clean module cache and import
            if 'index' in sys.modules:
                del sys.modules['index']
            import index

            # Call handler - should return error since env vars are missing
            result = index.handler({}, {})

            # Verify error response
            self.assertEqual(result['statusCode'], 500)
            response_body = json.loads(result['body'])
            self.assertIn('LOG_GROUP_NAME', response_body['error'])
        finally:
            # Restore env vars
            if orig_log_group:
                os.environ['LOG_GROUP_NAME'] = orig_log_group
            if orig_bucket:
                os.environ['S3_BUCKET_NAME'] = orig_bucket

    @patch('index.s3_client')
    @patch('index.logs_client')
    def test_export_task_monitoring(self, mock_logs_client, mock_s3_client):
        """Test that export task is properly monitored"""
        import index

        # Mock export task creation
        mock_logs_client.create_export_task.return_value = {
            'taskId': 'test-monitor'
        }

        # Mock status changes: PENDING -> RUNNING -> COMPLETED
        mock_logs_client.describe_export_tasks.side_effect = [
            {'exportTasks': [{'status': {'code': 'PENDING'}}]},
            {'exportTasks': [{'status': {'code': 'RUNNING'}}]},
            {'exportTasks': [{'status': {'code': 'COMPLETED'}}]}
        ]

        # Call handler
        result = index.handler({}, {})

        # Verify multiple status checks were made
        self.assertEqual(mock_logs_client.describe_export_tasks.call_count, 3)
        self.assertEqual(result['statusCode'], 200)

    @patch('index.s3_client')
    @patch('index.logs_client')
    def test_response_format(self, mock_logs_client, mock_s3_client):
        """Test response format"""
        import index

        # Mock successful export
        mock_logs_client.create_export_task.return_value = {
            'taskId': 'test-response'
        }
        mock_logs_client.describe_export_tasks.return_value = {
            'exportTasks': [{
                'status': {'code': 'COMPLETED'}
            }]
        }

        # Call handler
        result = index.handler({}, {})

        # Verify response structure
        self.assertIn('statusCode', result)
        self.assertIn('body', result)

        # Verify body is valid JSON
        body = json.loads(result['body'])
        self.assertIsInstance(body, dict)
        self.assertIn('message', body)
        self.assertIn('taskId', body)
        self.assertIn('destination', body)


if __name__ == "__main__":
    # Restore environment variables
    os.environ['LOG_GROUP_NAME'] = '/aws/application/test-logs'
    os.environ['S3_BUCKET_NAME'] = 'test-bucket'
    unittest.main()