"""Unit tests for Lambda handler functions"""

import json
import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib'))


class TestUploadHandler:
    """Tests for upload Lambda handler"""

    @patch('lib.lambda_upload.boto3')
    def test_upload_handler_success(self, mock_boto3):
        """Test successful file upload"""
        from lib.lambda_upload import handler

        # Mock S3 client
        mock_s3 = Mock()
        mock_boto3.client.return_value = mock_s3
        mock_s3.put_object.return_value = {}

        # Create test event
        event = {
            'body': json.dumps({
                'transactionId': 'test-123',
                'fileContent': 'test content'
            })
        }
        context = {}

        # Call handler
        response = handler(event, context)

        # Verify response
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['message'] == 'File uploaded successfully'
        assert body['transactionId'] == 'test-123'

        # Verify S3 put_object was called
        mock_s3.put_object.assert_called_once()

    @patch('lib.lambda_upload.boto3')
    def test_upload_handler_error(self, mock_boto3):
        """Test upload handler error handling"""
        from lib.lambda_upload import handler

        # Mock S3 client to raise exception
        mock_s3 = Mock()
        mock_boto3.client.return_value = mock_s3
        mock_s3.put_object.side_effect = Exception('S3 error')

        # Create test event
        event = {
            'body': json.dumps({
                'transactionId': 'test-123',
                'fileContent': 'test content'
            })
        }
        context = {}

        # Call handler
        response = handler(event, context)

        # Verify error response
        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert 'error' in body


class TestProcessHandler:
    """Tests for process Lambda handler"""

    @patch('lib.lambda_process.boto3')
    def test_process_handler_success(self, mock_boto3):
        """Test successful transaction processing"""
        from lib.lambda_process import handler

        # Mock S3 client
        mock_s3 = Mock()
        mock_boto3.client.return_value = mock_s3

        # Mock S3 get_object response
        mock_body = Mock()
        mock_body.read.return_value = b'{"amount": 100}'
        mock_s3.get_object.return_value = {'Body': mock_body}
        mock_s3.put_object.return_value = {}

        # Create test event
        event = {
            'pathParameters': {
                'transactionId': 'test-123'
            }
        }
        context = {}

        # Call handler
        response = handler(event, context)

        # Verify response
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['transactionId'] == 'test-123'
        assert body['status'] == 'processed'

    @patch('lib.lambda_process.boto3')
    def test_process_handler_error(self, mock_boto3):
        """Test process handler error handling"""
        from lib.lambda_process import handler

        # Mock S3 client to raise exception
        mock_s3 = Mock()
        mock_boto3.client.return_value = mock_s3
        mock_s3.get_object.side_effect = Exception('S3 error')

        # Create test event
        event = {
            'pathParameters': {
                'transactionId': 'test-123'
            }
        }
        context = {}

        # Call handler
        response = handler(event, context)

        # Verify error response
        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert 'error' in body


class TestStatusHandler:
    """Tests for status Lambda handler"""

    @patch('lib.lambda_status.boto3')
    def test_status_handler_processed(self, mock_boto3):
        """Test status check for processed transaction"""
        from lib.lambda_status import handler

        # Mock S3 client
        mock_s3 = Mock()
        mock_boto3.client.return_value = mock_s3

        # Mock S3 get_object response
        mock_body = Mock()
        mock_body.read.return_value = b'{"transactionId": "test-123", "status": "processed"}'
        mock_s3.get_object.return_value = {'Body': mock_body}

        # Create test event
        event = {
            'pathParameters': {
                'transactionId': 'test-123'
            }
        }
        context = {}

        # Call handler
        response = handler(event, context)

        # Verify response
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['transactionId'] == 'test-123'
        assert body['status'] == 'processed'

    @patch('lib.lambda_status.boto3')
    def test_status_handler_pending(self, mock_boto3):
        """Test status check for pending transaction"""
        from lib.lambda_status import handler

        # Mock S3 client
        mock_s3 = Mock()
        mock_boto3.client.return_value = mock_s3

        # Mock NoSuchKey exception
        from botocore.exceptions import ClientError
        error_response = {'Error': {'Code': 'NoSuchKey'}}
        mock_s3.get_object.side_effect = ClientError(error_response, 'GetObject')
        mock_s3.exceptions.NoSuchKey = type('NoSuchKey', (Exception,), {})

        # Create test event
        event = {
            'pathParameters': {
                'transactionId': 'test-123'
            }
        }
        context = {}

        # Call handler
        response = handler(event, context)

        # Verify response
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['transactionId'] == 'test-123'
        assert body['status'] == 'pending'

    @patch('lib.lambda_status.boto3')
    def test_status_handler_error(self, mock_boto3):
        """Test status handler error handling"""
        from lib.lambda_status import handler

        # Mock S3 client to raise exception
        mock_s3 = Mock()
        mock_boto3.client.return_value = mock_s3
        mock_s3.get_object.side_effect = Exception('S3 error')

        # Create test event
        event = {
            'pathParameters': {
                'transactionId': 'test-123'
            }
        }
        context = {}

        # Call handler
        response = handler(event, context)

        # Verify error response
        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert 'error' in body
