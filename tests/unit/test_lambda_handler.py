"""Unit tests for Lambda data processor function."""

import os
import sys
import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from botocore.exceptions import ClientError

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..', 'lib', 'lambda')))


class TestLambdaHandler:
    """Test suite for Lambda handler function."""

    @patch('os.environ', {'ENVIRONMENT': 'test', 'DATA_BUCKET': 'test-bucket', 'AWS_REGION': 'us-east-1'})
    @patch('boto3.client')
    def test_handler_success(self, mock_boto_client):
        """Test Lambda handler returns success response."""
        # Mock Secrets Manager client
        mock_secrets = MagicMock()
        mock_secrets.get_secret_value.return_value = {
            'SecretString': json.dumps({'username': 'test', 'password': 'test'})
        }
        
        # Mock S3 client
        mock_s3 = MagicMock()
        
        # Return different mocks for different services
        def get_client(service_name):
            if service_name == 'secretsmanager':
                return mock_secrets
            elif service_name == 's3':
                return mock_s3
        
        mock_boto_client.side_effect = get_client
        
        # Import after mocking
        import data_processor
        # Reload to pick up mocked clients
        import importlib
        importlib.reload(data_processor)
        
        event = {}
        context = Mock()
        
        result = data_processor.handler(event, context)
        
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'Data processed successfully'
        assert body['environment'] == 'test'

    @patch('os.environ', {'ENVIRONMENT': 'test', 'DATA_BUCKET': 'test-bucket', 'AWS_REGION': 'us-east-1'})
    @patch('boto3.client')
    def test_handler_with_secret_error(self, mock_boto_client):
        """Test Lambda handler handles Secrets Manager errors gracefully."""
        # Mock clients
        mock_secrets = MagicMock()
        mock_secrets.get_secret_value.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException'}},
            'GetSecretValue'
        )
        
        mock_s3 = MagicMock()
        
        def get_client(service_name):
            if service_name == 'secretsmanager':
                return mock_secrets
            elif service_name == 's3':
                return mock_s3
        
        mock_boto_client.side_effect = get_client
        
        # Import after mocking
        import data_processor
        import importlib
        importlib.reload(data_processor)
        
        event = {}
        context = Mock()
        
        result = data_processor.handler(event, context)
        
        # Should still return 200 with warning logged
        assert result['statusCode'] == 200

    @patch('os.environ', {'ENVIRONMENT': '', 'AWS_REGION': 'us-east-1'})
    @patch('boto3.client')
    def test_handler_with_default_environment(self, mock_boto_client):
        """Test Lambda handler uses default environment when not set."""
        mock_secrets = MagicMock()
        mock_secrets.get_secret_value.return_value = {
            'SecretString': json.dumps({'key': 'value'})
        }
        mock_s3 = MagicMock()
        
        def get_client(service_name):
            if service_name == 'secretsmanager':
                return mock_secrets
            elif service_name == 's3':
                return mock_s3
        
        mock_boto_client.side_effect = get_client
        
        # Import after mocking
        import data_processor
        import importlib
        importlib.reload(data_processor)
        
        event = {}
        context = Mock()
        
        result = data_processor.handler(event, context)
        
        assert result['statusCode'] == 200


    @patch('os.environ', {'ENVIRONMENT': 'test', 'DATA_BUCKET': 'test-bucket', 'AWS_REGION': 'us-east-1'})
    @patch('boto3.client')
    def test_handler_exception_in_processing(self, mock_boto_client):
        """Test Lambda handler handles exceptions during processing."""
        # Mock clients with proper return values
        mock_secrets = MagicMock()
        mock_secrets.get_secret_value.return_value = {
            'SecretString': json.dumps({'username': 'test', 'password': 'test'})
        }
        mock_s3 = MagicMock()

        def get_client(service_name):
            if service_name == 'secretsmanager':
                return mock_secrets
            elif service_name == 's3':
                return mock_s3

        mock_boto_client.side_effect = get_client

        # Import after mocking
        import data_processor
        import importlib
        importlib.reload(data_processor)

        # Cause exception by patching the final json.dumps to fail
        original_dumps = json.dumps
        def patched_dumps(obj):
            # Let the first call succeed (for secrets), fail on the return body
            if 'message' in obj and obj.get('message') == 'Data processed successfully':
                raise Exception("JSON encoding error")
            return original_dumps(obj)

        with patch('data_processor.json.dumps', side_effect=patched_dumps):
            event = {}
            context = Mock()

            result = data_processor.handler(event, context)

            assert result['statusCode'] == 500
            body = json.loads(result['body'])
            assert 'error' in body
            assert 'JSON encoding error' in body['error']


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
