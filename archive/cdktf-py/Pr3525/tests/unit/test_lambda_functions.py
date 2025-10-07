"""Unit tests for Lambda functions."""
import os
import sys
import json
import pytest
from unittest.mock import patch, MagicMock, Mock

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from lib.lambda_validation import lambda_handler as validation_handler
from lib.lambda_workflow import lambda_handler as workflow_handler


class TestLambdaValidation:
    """Test suite for Lambda validation function."""

    @patch.dict(os.environ, {
        'DYNAMODB_TABLE': 'test-table',
        'S3_BUCKET': 'test-bucket',
        'WORKFLOW_ARN': 'arn:aws:states:us-east-1:123456789012:stateMachine:test'
    })
    def test_validation_handler_valid_request(self):
        """Test validation handler with valid request."""
        event = {
            'body': json.dumps({
                'email': 'test@example.com',
                'name': 'Test User',
                'message': 'Test message',
                'form_type': 'contact'
            })
        }

        with patch('lib.lambda_validation.boto3') as mock_boto3:
            # Mock DynamoDB resource
            mock_dynamodb_resource = MagicMock()
            mock_dynamodb_table = MagicMock()
            mock_boto3.resource.return_value = mock_dynamodb_resource
            mock_dynamodb_resource.Table.return_value = mock_dynamodb_table
            mock_dynamodb_table.put_item.return_value = {'ResponseMetadata': {'HTTPStatusCode': 200}}

            response = validation_handler(event, None)

            assert response['statusCode'] == 200
            body = json.loads(response['body'])
            assert 'submission_id' in body
            assert body['status'] == 'received'

    def test_validation_handler_invalid_email(self):
        """Test validation handler with invalid email."""
        event = {
            'body': json.dumps({
                'email': 'invalid-email',
                'name': 'Test User',
                'message': 'Test message'
            })
        }

        response = validation_handler(event, None)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'Invalid email' in body['error']

    def test_validation_handler_missing_required_fields(self):
        """Test validation handler with missing required fields."""
        event = {
            'body': json.dumps({
                'email': 'test@example.com'
            })
        }

        response = validation_handler(event, None)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'Missing required fields' in body['error']

    def test_validation_handler_file_too_large(self):
        """Test validation handler with file too large."""
        event = {
            'body': json.dumps({
                'email': 'test@example.com',
                'name': 'Test User',
                'message': 'Test message',
                'attachment': {
                    'filename': 'test.pdf',
                    'size': 11 * 1024 * 1024  # 11MB
                }
            })
        }

        response = validation_handler(event, None)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'File size exceeds' in body['error']

    @patch.dict(os.environ, {
        'DYNAMODB_TABLE': 'test-table',
        'S3_BUCKET': 'test-bucket',
        'WORKFLOW_ARN': 'arn:aws:states:us-east-1:123456789012:stateMachine:test'
    })
    def test_validation_handler_with_attachment(self):
        """Test validation handler with valid attachment."""
        event = {
            'body': json.dumps({
                'email': 'test@example.com',
                'name': 'Test User',
                'message': 'Test message',
                'attachment': {
                    'filename': 'test.pdf',
                    'size': 1024 * 1024,  # 1MB
                    'content_type': 'application/pdf'
                }
            })
        }

        with patch('lib.lambda_validation.boto3') as mock_boto3:
            # Mock S3 and DynamoDB clients
            mock_s3 = MagicMock()
            mock_dynamodb_resource = MagicMock()
            mock_dynamodb_table = MagicMock()

            def client_factory(service, **kwargs):
                if service == 's3':
                    return mock_s3
                return MagicMock()

            def resource_factory(service, **kwargs):
                if service == 'dynamodb':
                    return mock_dynamodb_resource
                return MagicMock()

            mock_boto3.client.side_effect = client_factory
            mock_boto3.resource.side_effect = resource_factory
            mock_dynamodb_resource.Table.return_value = mock_dynamodb_table
            mock_s3.generate_presigned_url.return_value = 'https://test-url'
            mock_dynamodb_table.put_item.return_value = {'ResponseMetadata': {'HTTPStatusCode': 200}}

            response = validation_handler(event, None)

            assert response['statusCode'] == 200
            body = json.loads(response['body'])
            assert 'upload_url' in body

    def test_validation_handler_invalid_json(self):
        """Test validation handler with invalid JSON."""
        event = {
            'body': 'invalid json'
        }

        response = validation_handler(event, None)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body

    def test_validation_handler_no_body(self):
        """Test validation handler with no body."""
        event = {}

        response = validation_handler(event, None)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body


class TestLambdaWorkflow:
    """Test suite for Lambda workflow function."""

    def test_workflow_handler_process_contact(self):
        """Test workflow handler for contact form processing."""
        event = {
            'action': 'process_contact',
            'data': {
                'email': 'test@example.com',
                'name': 'Test User',
                'message': 'Test message'
            }
        }

        response = workflow_handler(event, None)

        assert response['statusCode'] == 200
        assert response['action'] == 'process_contact'
        assert response['processed'] is True
        assert 'priority' in response
        assert response['priority'] == 'normal'

    def test_workflow_handler_process_support(self):
        """Test workflow handler for support form processing."""
        event = {
            'action': 'process_support',
            'data': {
                'email': 'test@example.com',
                'issue': 'Technical problem',
                'severity': 'high'
            }
        }

        response = workflow_handler(event, None)

        assert response['statusCode'] == 200
        assert response['action'] == 'process_support'
        assert response['processed'] is True
        assert response['priority'] == 'high'

    def test_workflow_handler_generate_presigned_url(self):
        """Test workflow handler for generating presigned URL."""
        event = {
            'action': 'generate_presigned_url',
            'data': {
                'bucket': 'test-bucket',
                'key': 'test-file.pdf'
            }
        }

        with patch('lib.lambda_workflow.boto3') as mock_boto3:
            mock_s3 = MagicMock()
            mock_boto3.client.return_value = mock_s3
            mock_s3.generate_presigned_url.return_value = 'https://test-url'

            response = workflow_handler(event, None)

            assert response['statusCode'] == 200
            assert response['action'] == 'generate_presigned_url'
            assert 'presigned_url' in response
            assert response['presigned_url'] == 'https://test-url'

    def test_workflow_handler_default_processing(self):
        """Test workflow handler default processing."""
        event = {
            'action': 'unknown_action',
            'data': {
                'test': 'data'
            }
        }

        response = workflow_handler(event, None)

        assert response['statusCode'] == 200
        assert response['action'] == 'general'
        assert response['processed'] is True

    def test_workflow_handler_no_action(self):
        """Test workflow handler with no action specified."""
        event = {
            'data': {
                'test': 'data'
            }
        }

        response = workflow_handler(event, None)

        assert response['statusCode'] == 200
        assert response['action'] == 'general'

    def test_workflow_handler_exception(self):
        """Test workflow handler exception handling."""
        event = {
            'action': 'process_contact',
            'data': {
                'email': 'test@example.com'
            }
        }

        with patch('lib.lambda_workflow.process_contact_form') as mock_process:
            mock_process.side_effect = Exception('Test error')

            with pytest.raises(Exception):
                workflow_handler(event, None)

    def test_workflow_handler_empty_event(self):
        """Test workflow handler with empty event."""
        event = {}

        response = workflow_handler(event, None)

        assert response['statusCode'] == 200
        assert response['action'] == 'general'
        assert response['processed'] is True