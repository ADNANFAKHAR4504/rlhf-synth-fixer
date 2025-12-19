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

    def test_upload_handler_success(self):
        """Test successful file upload"""
        # Mock boto3 before import
        with patch.dict('sys.modules', {'boto3': MagicMock()}):
            import importlib
            # Force reimport
            if 'lib.lambda_upload' in sys.modules:
                del sys.modules['lib.lambda_upload']

            import lib.lambda_upload as upload_module

            # Setup mock
            mock_s3 = Mock()
            mock_s3.put_object.return_value = {}
            upload_module.s3_client = mock_s3

            # Create test event
            event = {
                'body': json.dumps({
                    'transactionId': 'test-123',
                    'fileContent': 'test content'
                })
            }
            context = {}

            # Call handler
            response = upload_module.handler(event, context)

            # Verify response
            assert response['statusCode'] == 200
            body = json.loads(response['body'])
            assert body['message'] == 'File uploaded successfully'
            assert body['transactionId'] == 'test-123'

            # Verify S3 put_object was called
            mock_s3.put_object.assert_called_once()

    def test_upload_handler_error(self):
        """Test upload handler error handling"""
        with patch.dict('sys.modules', {'boto3': MagicMock()}):
            if 'lib.lambda_upload' in sys.modules:
                del sys.modules['lib.lambda_upload']

            import lib.lambda_upload as upload_module

            # Mock S3 client to raise exception
            mock_s3 = Mock()
            mock_s3.put_object.side_effect = Exception('S3 error')
            upload_module.s3_client = mock_s3

            # Create test event
            event = {
                'body': json.dumps({
                    'transactionId': 'test-123',
                    'fileContent': 'test content'
                })
            }
            context = {}

            # Call handler
            response = upload_module.handler(event, context)

            # Verify error response
            assert response['statusCode'] == 500
            body = json.loads(response['body'])
            assert 'error' in body


class TestProcessHandler:
    """Tests for process Lambda handler"""

    def test_process_handler_success(self):
        """Test successful transaction processing"""
        with patch.dict('sys.modules', {'boto3': MagicMock()}):
            if 'lib.lambda_process' in sys.modules:
                del sys.modules['lib.lambda_process']

            import lib.lambda_process as process_module

            # Mock S3 client
            mock_s3 = Mock()
            mock_body = Mock()
            mock_body.read.return_value = b'{"amount": 100}'
            mock_s3.get_object.return_value = {'Body': mock_body}
            mock_s3.put_object.return_value = {}
            process_module.s3_client = mock_s3

            # Create test event
            event = {
                'pathParameters': {
                    'transactionId': 'test-123'
                }
            }
            context = {}

            # Call handler
            response = process_module.handler(event, context)

            # Verify response
            assert response['statusCode'] == 200
            body = json.loads(response['body'])
            assert body['transactionId'] == 'test-123'
            assert body['status'] == 'processed'

    def test_process_handler_error(self):
        """Test process handler error handling"""
        with patch.dict('sys.modules', {'boto3': MagicMock()}):
            if 'lib.lambda_process' in sys.modules:
                del sys.modules['lib.lambda_process']

            import lib.lambda_process as process_module

            # Mock S3 client to raise exception
            mock_s3 = Mock()
            mock_s3.get_object.side_effect = Exception('S3 error')
            process_module.s3_client = mock_s3

            # Create test event
            event = {
                'pathParameters': {
                    'transactionId': 'test-123'
                }
            }
            context = {}

            # Call handler
            response = process_module.handler(event, context)

            # Verify error response
            assert response['statusCode'] == 500
            body = json.loads(response['body'])
            assert 'error' in body


class TestStatusHandler:
    """Tests for status Lambda handler"""

    def test_status_handler_processed(self):
        """Test status check for processed transaction"""
        with patch.dict('sys.modules', {'boto3': MagicMock()}):
            if 'lib.lambda_status' in sys.modules:
                del sys.modules['lib.lambda_status']

            import lib.lambda_status as status_module

            # Mock S3 client
            mock_s3 = Mock()
            mock_body = Mock()
            mock_body.read.return_value = b'{"transactionId": "test-123", "status": "processed"}'
            mock_s3.get_object.return_value = {'Body': mock_body}
            status_module.s3_client = mock_s3

            # Create test event
            event = {
                'pathParameters': {
                    'transactionId': 'test-123'
                }
            }
            context = {}

            # Call handler
            response = status_module.handler(event, context)

            # Verify response
            assert response['statusCode'] == 200
            body = json.loads(response['body'])
            assert body['transactionId'] == 'test-123'
            assert body['status'] == 'processed'

    def test_status_handler_pending(self):
        """Test status check for pending transaction"""
        with patch.dict('sys.modules', {'boto3': MagicMock()}):
            if 'lib.lambda_status' in sys.modules:
                del sys.modules['lib.lambda_status']

            import lib.lambda_status as status_module

            # Mock S3 client - simulate NoSuchKey by setting up exception
            mock_s3 = Mock()
            # Create a mock exception class
            mock_s3.exceptions = Mock()
            mock_s3.exceptions.NoSuchKey = type('NoSuchKey', (Exception,), {})
            mock_s3.get_object.side_effect = mock_s3.exceptions.NoSuchKey('No such key')
            status_module.s3_client = mock_s3

            # Create test event
            event = {
                'pathParameters': {
                    'transactionId': 'test-123'
                }
            }
            context = {}

            # Call handler
            response = status_module.handler(event, context)

            # Verify response - since the exception is caught, it returns pending status
            assert response['statusCode'] == 200
            body = json.loads(response['body'])
            assert body['transactionId'] == 'test-123'
            assert body['status'] == 'pending'

    def test_status_handler_error(self):
        """Test status handler error handling"""
        with patch.dict('sys.modules', {'boto3': MagicMock()}):
            if 'lib.lambda_status' in sys.modules:
                del sys.modules['lib.lambda_status']

            import lib.lambda_status as status_module

            # Mock S3 client to raise generic exception (not NoSuchKey)
            mock_s3 = Mock()
            mock_s3.exceptions = Mock()
            mock_s3.exceptions.NoSuchKey = type('NoSuchKey', (Exception,), {})
            mock_s3.get_object.side_effect = Exception('S3 error')
            status_module.s3_client = mock_s3

            # Create test event
            event = {
                'pathParameters': {
                    'transactionId': 'test-123'
                }
            }
            context = {}

            # Call handler
            response = status_module.handler(event, context)

            # Verify error response
            assert response['statusCode'] == 500
            body = json.loads(response['body'])
            assert 'error' in body
