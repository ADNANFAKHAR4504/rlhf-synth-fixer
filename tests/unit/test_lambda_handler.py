"""
Unit tests for Lambda handler function response structure.
Tests the lambda function response format without requiring AWS resources.
"""
import json
import os
import re
import sys
import unittest
from unittest.mock import Mock, patch, MagicMock

from pytest import mark

# Import the lambda handler
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'lib', 'lambda'))
# pylint: disable=import-error,wrong-import-position
from handler import lambda_handler


@mark.describe("Lambda Handler Response")
class TestLambdaHandlerResponse(unittest.TestCase):
  """Unit tests for Lambda handler function response structure"""

  def setUp(self):
    """Set up test environment for each test"""
    # Mock environment variables
    self.env_patcher = patch.dict(os.environ, {
        'WEBSITE_BUCKET': 'test-bucket-name',
        'AWS_REGION': 'us-west-2'
    })
    self.env_patcher.start()

    # Mock AWS context object
    self.mock_context = Mock()
    self.mock_context.aws_request_id = 'test-request-id-12345'
    self.mock_context.function_name = 'test-lambda-function'
    self.mock_context.function_version = '$LATEST'

    # Mock test event
    self.test_event = {
        "httpMethod": "GET",
        "path": "/test",
        "headers": {
            "User-Agent": "test-agent",
            "Content-Type": "application/json"
        },
        "queryStringParameters": {
            "param1": "value1"
        }
    }

  def tearDown(self):
    """Clean up after each test"""
    self.env_patcher.stop()

  @mark.it("returns successful response with correct structure and status 200")
  @patch('handler.boto3.client')
  def test_successful_response_structure(self, mock_boto_client):
    """Test that successful lambda response has correct structure and content"""
    # Mock S3 client (not used in actual response but needs to be created)
    mock_s3_client = MagicMock()
    mock_boto_client.return_value = mock_s3_client

    # Call the lambda handler
    response = lambda_handler(self.test_event, self.mock_context)

    # Verify response structure
    self.assertIsInstance(response, dict, "Response should be a dictionary")

    # Verify required response keys
    required_keys = ['statusCode', 'headers', 'body']
    for key in required_keys:
      self.assertIn(key, response, f"Response should contain '{key}'")

    # Verify status code
    self.assertEqual(response['statusCode'], 200, "Successful response should have status 200")

    # Verify headers structure and content
    headers = response['headers']
    self.assertIsInstance(headers, dict, "Headers should be a dictionary")

    expected_headers = [
        'Content-Type',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods',
        'Cache-Control'
    ]
    for header in expected_headers:
      self.assertIn(header, headers, f"Headers should contain '{header}'")

    # Verify specific header values
    self.assertEqual(headers['Content-Type'], 'application/json')
    self.assertEqual(headers['Access-Control-Allow-Origin'], '*')
    self.assertEqual(headers['Cache-Control'], 'no-cache')

    # Verify body is valid JSON string
    self.assertIsInstance(response['body'], str, "Response body should be a string")

    # Parse and verify body content
    body_data = json.loads(response['body'])
    self.assertIsInstance(body_data, dict, "Response body should contain JSON object")

    # Verify required fields in response body
    required_body_fields = [
        'message', 'timestamp', 'request_id', 'function_name',
        'function_version', 'website_bucket', 'region', 'event'
    ]
    for field in required_body_fields:
      self.assertIn(field, body_data, f"Response body should contain '{field}'")

    # Verify specific values
    self.assertEqual(body_data['message'], "Hello from Lambda!")
    self.assertEqual(body_data['request_id'], 'test-request-id-12345')
    self.assertEqual(body_data['function_name'], 'test-lambda-function')
    self.assertEqual(body_data['function_version'], '$LATEST')
    self.assertEqual(body_data['website_bucket'], 'test-bucket-name')
    self.assertEqual(body_data['region'], 'us-west-2')

    # Verify event data structure
    event_data = body_data['event']
    self.assertIsInstance(event_data, dict, "Event data should be a dictionary")
    self.assertEqual(event_data['httpMethod'], 'GET')
    self.assertEqual(event_data['path'], '/test')
    self.assertIn('headers', event_data)
    self.assertIn('queryStringParameters', event_data)

  @mark.it("returns error response with status 400 when WEBSITE_BUCKET missing")
  @patch('handler.boto3.client')
  def test_error_response_missing_env_var(self, _mock_boto_client):
    """Test error response when WEBSITE_BUCKET environment variable is missing"""
    # Remove WEBSITE_BUCKET from environment
    with patch.dict(os.environ, {}, clear=True):
      response = lambda_handler(self.test_event, self.mock_context)

    # Verify error response structure
    self.assertEqual(response['statusCode'], 400, "Should return 400 for validation error")

    # Verify headers
    headers = response['headers']
    self.assertEqual(headers['Content-Type'], 'application/json')
    self.assertEqual(headers['Access-Control-Allow-Origin'], '*')

    # Verify error body
    body_data = json.loads(response['body'])
    self.assertIn('error', body_data)
    self.assertIn('message', body_data)
    self.assertIn('request_id', body_data)

    self.assertEqual(body_data['error'], 'Bad Request')
    self.assertEqual(body_data['request_id'], 'test-request-id-12345')
    self.assertIn('WEBSITE_BUCKET', body_data['message'])

  @mark.it("returns error response with status 500 for unexpected errors")
  @patch('handler.boto3.client')
  def test_error_response_unexpected_error(self, mock_boto_client):
    """Test error response when unexpected exception occurs"""
    # Mock boto3 to raise an exception
    mock_boto_client.side_effect = Exception("Unexpected AWS error")

    response = lambda_handler(self.test_event, self.mock_context)

    # Verify error response structure
    self.assertEqual(response['statusCode'], 500, "Should return 500 for unexpected error")

    # Verify headers
    headers = response['headers']
    self.assertEqual(headers['Content-Type'], 'application/json')
    self.assertEqual(headers['Access-Control-Allow-Origin'], '*')

    # Verify error body
    body_data = json.loads(response['body'])
    self.assertIn('error', body_data)
    self.assertIn('message', body_data)
    self.assertIn('request_id', body_data)

    self.assertEqual(body_data['error'], 'Internal Server Error')
    self.assertEqual(body_data['message'], 'An unexpected error occurred')
    self.assertEqual(body_data['request_id'], 'test-request-id-12345')

  @mark.it("handles edge cases with missing event data gracefully")
  @patch('handler.boto3.client')
  def test_response_with_minimal_event_data(self, mock_boto_client):
    """Test lambda response with minimal event data (missing optional fields)"""
    # Mock S3 client
    mock_s3_client = MagicMock()
    mock_boto_client.return_value = mock_s3_client

    # Create minimal event (missing optional fields)
    minimal_event = {}

    response = lambda_handler(minimal_event, self.mock_context)

    # Should still return successful response
    self.assertEqual(response['statusCode'], 200)

    # Verify body handles missing event fields
    body_data = json.loads(response['body'])
    event_data = body_data['event']

    # Should handle missing fields gracefully (return None)
    self.assertIsNone(event_data['httpMethod'])
    self.assertIsNone(event_data['path'])
    self.assertIsNone(event_data['queryStringParameters'])
    self.assertEqual(event_data['headers'], {})  # defaults to empty dict

  @mark.it("returns properly formatted timestamp in response")
  @patch('handler.boto3.client')
  def test_timestamp_format_in_response(self, mock_boto_client):
    """Test that timestamp in response follows expected format"""
    # Mock S3 client
    mock_s3_client = MagicMock()
    mock_boto_client.return_value = mock_s3_client

    response = lambda_handler(self.test_event, self.mock_context)
    body_data = json.loads(response['body'])

    # Verify timestamp format (YYYY-MM-DD HH:MM:SS)
    timestamp = body_data['timestamp']
    self.assertIsInstance(timestamp, str, "Timestamp should be a string")

    # Basic format check - should match pattern like "2024-01-01 12:00:00"
    timestamp_pattern = r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'
    self.assertIsNotNone(
        re.match(timestamp_pattern, timestamp),
        f"Timestamp '{timestamp}' should match format 'YYYY-MM-DD HH:MM:SS'"
    )


if __name__ == '__main__':
  unittest.main()
