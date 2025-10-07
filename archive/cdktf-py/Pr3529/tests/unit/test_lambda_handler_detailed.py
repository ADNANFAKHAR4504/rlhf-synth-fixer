"""Detailed unit tests for Lambda handler function."""
import os
import sys
import json
from unittest.mock import MagicMock, patch

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

# Add lambda directory to path for handler imports
lambda_dir = os.path.join(project_root, "lib", "lambda")
sys.path.append(lambda_dir)

import index  # noqa: E402


class TestLambdaHandlerDetailed:
    """Detailed test suite for Lambda handler functionality."""

    @patch('index.boto3')
    def test_initialize_clients(self, mock_boto3):
        """Test that AWS clients are initialized correctly."""
        # Setup mocks
        mock_dynamodb = MagicMock()
        mock_sns = MagicMock()
        mock_ecr = MagicMock()

        mock_boto3.resource.return_value = mock_dynamodb
        mock_boto3.client.side_effect = lambda service: {
            'sns': mock_sns,
            'ecr': mock_ecr
        }.get(service, MagicMock())

        # Reset global clients
        index.dynamodb = None
        index.sns = None
        index.ecr = None

        # Initialize clients
        index.initialize_clients()

        # Verify clients were initialized
        assert index.dynamodb is not None
        assert index.sns is not None
        assert index.ecr is not None

        # Verify boto3 was called correctly
        mock_boto3.resource.assert_called_with('dynamodb')
        assert mock_boto3.client.call_count == 2

    def test_handle_cleanup(self):
        """Test the cleanup handler function."""
        event = {
            'action': 'cleanup',
            'repository': 'test-repo'
        }

        result = index.handle_cleanup(event)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'Cleanup task completed'
        assert body['repository'] == 'test-repo'

    @patch('index.initialize_clients')
    @patch('index.boto3')
    def test_handler_with_cleanup_event(self, mock_boto3, mock_init):
        """Test handler with cleanup event."""
        event = {
            'action': 'cleanup',
            'repository': 'test-repo'
        }

        result = index.handler(event, None)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'Cleanup task completed'

    @patch.dict(os.environ, {'DYNAMODB_TABLE': 'test-table', 'SNS_TOPIC_ARN': 'arn:test'})
    @patch('index.initialize_clients')
    @patch('index.dynamodb')
    @patch('index.sns')
    @patch('index.ecr')
    def test_handler_with_ecr_scan_event_no_critical(self, mock_ecr, mock_sns, mock_dynamodb, mock_init):
        """Test handler with ECR scan event without critical vulnerabilities."""
        # Setup event
        event = {
            'detail': {
                'repository-name': 'test-repo',
                'image-digest': 'sha256:test123',
                'image-tags': ['v1.0.0']
            }
        }

        # Setup mocks
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        mock_ecr.describe_image_scan_findings.return_value = {
            'imageScanFindings': {
                'findingSeverityCounts': {
                    'HIGH': 5,
                    'MEDIUM': 10,
                    'LOW': 20
                }
            }
        }

        # Call handler
        result = index.handler(event, None)

        # Verify result
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'Scan results processed successfully'

        # Verify DynamoDB was called
        mock_table.put_item.assert_called_once()

        # Verify SNS was not called (no critical vulnerabilities)
        mock_sns.publish.assert_not_called()

    @patch.dict(os.environ, {'DYNAMODB_TABLE': 'test-table', 'SNS_TOPIC_ARN': 'arn:test'})
    @patch('index.initialize_clients')
    @patch('index.dynamodb')
    @patch('index.sns')
    @patch('index.ecr')
    def test_handler_with_ecr_scan_event_with_critical(self, mock_ecr, mock_sns, mock_dynamodb, mock_init):
        """Test handler with ECR scan event with critical vulnerabilities."""
        # Setup event
        event = {
            'detail': {
                'repository-name': 'test-repo',
                'image-digest': 'sha256:test123',
                'image-tags': ['v1.0.0']
            }
        }

        # Setup mocks
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        mock_ecr.describe_image_scan_findings.return_value = {
            'imageScanFindings': {
                'findingSeverityCounts': {
                    'CRITICAL': 2,
                    'HIGH': 5,
                    'MEDIUM': 10,
                    'LOW': 20
                }
            }
        }

        # Call handler
        result = index.handler(event, None)

        # Verify result
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'Scan results processed successfully'
        assert body['vulnerabilities']['CRITICAL'] == 2

        # Verify DynamoDB was called
        mock_table.put_item.assert_called_once()

        # Verify SNS was called (critical vulnerabilities found)
        mock_sns.publish.assert_called_once()
        sns_call = mock_sns.publish.call_args
        assert 'Critical Vulnerabilities' in sns_call.kwargs['Subject']

    @patch.dict(os.environ, {'DYNAMODB_TABLE': 'test-table', 'SNS_TOPIC_ARN': 'arn:test'})
    @patch('index.initialize_clients')
    @patch('index.ecr')
    def test_handler_with_exception(self, mock_ecr, mock_init):
        """Test handler with exception."""
        # Setup event
        event = {
            'detail': {
                'repository-name': 'test-repo',
                'image-digest': 'sha256:test123',
                'image-tags': ['v1.0.0']
            }
        }

        # Setup mock to raise exception
        mock_ecr.describe_image_scan_findings.side_effect = Exception("Test error")

        # Call handler
        result = index.handler(event, None)

        # Verify error result
        assert result['statusCode'] == 500
        body = json.loads(result['body'])
        assert 'error' in body
        assert body['error'] == 'Test error'