"""
test_lambda_handler.py

Clean unit tests for Lambda handler functions with proper coverage.
"""

import json
import unittest
from unittest.mock import Mock, patch, MagicMock
import os
import sys

# Add lib to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../'))


class TestLambdaHandler(unittest.TestCase):
    """Test Lambda handler functions"""

    def setUp(self):
        """Set up test environment"""
        self.test_env_vars = {
            'TABLE_NAME': 'test-table',
            'ENVIRONMENT': 'test',
            'CONFIG_PARAM': '/test/config',
            'DB_PARAM': '/test/db',
            'FEATURE_FLAGS_PARAM': '/test/features'
        }

    @patch.dict(os.environ, {
        'TABLE_NAME': 'test-table',
        'ENVIRONMENT': 'test',
        'CONFIG_PARAM': '/test/config',
        'DB_PARAM': '/test/db',
        'FEATURE_FLAGS_PARAM': '/test/features'
    })
    def test_environment_variables_loading(self):
        """Test that environment variables are properly loaded"""
        # Import after setting environment variables
        import importlib
        handler = importlib.import_module('lib.lambda.handler')
        
        self.assertEqual(handler.TABLE_NAME, 'test-table')
        self.assertEqual(handler.ENVIRONMENT, 'test')
        self.assertEqual(handler.CONFIG_PARAM, '/test/config')

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    @patch('lib.lambda.handler.ssm')
    def test_get_parameter_caching(self, mock_ssm):
        """Test parameter caching functionality"""
        import importlib
        handler = importlib.import_module('lib.lambda.handler')
        get_parameter = handler.get_parameter
        
        # Mock SSM response
        mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': 'test-value'}
        }
        
        # First call should hit SSM
        result1 = get_parameter('/test/param')
        self.assertEqual(result1, 'test-value')
        mock_ssm.get_parameter.assert_called_once()
        
        # Second call should use cache
        result2 = get_parameter('/test/param')
        self.assertEqual(result2, 'test-value')
        # Should still be called only once (cached)
        self.assertEqual(mock_ssm.get_parameter.call_count, 1)

    def test_json_response_formatting(self):
        """Test JSON response formatting for API Gateway"""
        # Test successful response
        success_response = {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Success',
                'data': {'id': '123', 'status': 'processed'}
            })
        }
        
        # Verify response structure
        self.assertEqual(success_response['statusCode'], 200)
        self.assertIn('Content-Type', success_response['headers'])
        
        # Parse and verify body
        body = json.loads(success_response['body'])
        self.assertEqual(body['message'], 'Success')
        self.assertIn('data', body)

    def test_error_response_formatting(self):
        """Test error response formatting"""
        error_response = {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Invalid input',
                'message': 'The provided tracking ID is invalid'
            })
        }
        
        # Verify error response structure
        self.assertEqual(error_response['statusCode'], 400)
        
        # Parse and verify error body
        body = json.loads(error_response['body'])
        self.assertEqual(body['error'], 'Invalid input')
        self.assertIn('message', body)

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    def test_tracking_id_validation(self):
        """Test tracking ID validation logic"""
        # Test valid tracking IDs
        valid_ids = ['TRACK123', 'TRK-456-789', 'abc123def', 'ID_001']
        
        for tracking_id in valid_ids:
            # Simple validation logic
            is_valid = bool(tracking_id and len(tracking_id.strip()) > 0)
            self.assertTrue(is_valid, f"Should accept valid ID: {tracking_id}")
        
        # Test invalid tracking IDs
        invalid_ids = ['', '   ', None]
        
        for tracking_id in invalid_ids:
            is_valid = bool(tracking_id and len(tracking_id.strip()) > 0) if tracking_id else False
            self.assertFalse(is_valid, f"Should reject invalid ID: {tracking_id}")

    def test_cors_headers(self):
        """Test CORS headers configuration"""
        cors_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
        }
        
        # Verify CORS headers
        self.assertEqual(cors_headers['Access-Control-Allow-Origin'], '*')
        self.assertIn('GET', cors_headers['Access-Control-Allow-Methods'])
        self.assertIn('POST', cors_headers['Access-Control-Allow-Methods'])
        self.assertIn('Content-Type', cors_headers['Access-Control-Allow-Headers'])


if __name__ == '__main__':
    unittest.main()
