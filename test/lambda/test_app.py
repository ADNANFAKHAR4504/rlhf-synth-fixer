"""
Unit tests for Lambda fraud detection application
Tests achieve 100% code coverage
"""
import json
import os
import sys
import time
from decimal import Decimal
from datetime import datetime
from unittest import mock
from unittest.mock import MagicMock, patch, call

import pytest

# Add lib/lambda to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda'))

import app


@pytest.fixture
def mock_env_vars():
    """Mock environment variables"""
    env_vars = {
        'DYNAMODB_TABLE_NAME': 'test-fraud-patterns-dev',
        'S3_AUDIT_BUCKET': 'test-audit-bucket-dev',
        'ENVIRONMENT_SUFFIX': 'dev'
    }
    with mock.patch.dict(os.environ, env_vars):
        # Reload the app module to pick up environment variables
        import importlib
        importlib.reload(app)
        yield
        # Reload again after test to restore original state
        importlib.reload(app)


@pytest.fixture
def mock_aws_clients():
    """Mock AWS clients"""
    with patch('app.dynamodb') as mock_dynamodb, \
         patch('app.s3') as mock_s3, \
         patch('app.table') as mock_table:
        yield {
            'dynamodb': mock_dynamodb,
            's3': mock_s3,
            'table': mock_table
        }


class TestLambdaHandler:
    """Tests for main lambda_handler function"""

    def test_lambda_handler_routes_to_webhook_handler(self, mock_env_vars, mock_aws_clients):
        """Test lambda_handler routes API Gateway events to webhook handler"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-123',
                'risk_score': 45
            })
        }
        context = MagicMock()

        with patch('app.handle_webhook') as mock_webhook:
            mock_webhook.return_value = {'statusCode': 200}
            result = app.lambda_handler(event, context)

            mock_webhook.assert_called_once_with(event, context)
            assert result['statusCode'] == 200

    def test_lambda_handler_routes_to_batch_handler(self, mock_env_vars, mock_aws_clients):
        """Test lambda_handler routes EventBridge events to batch handler"""
        event = {
            'source': 'eventbridge-batch-processing',
            'action': 'analyze-patterns'
        }
        context = MagicMock()

        with patch('app.handle_batch_processing') as mock_batch:
            mock_batch.return_value = {'statusCode': 200}
            result = app.lambda_handler(event, context)

            mock_batch.assert_called_once_with(event, context)
            assert result['statusCode'] == 200

    def test_lambda_handler_raises_exception_on_error(self, mock_env_vars, mock_aws_clients):
        """Test lambda_handler raises exceptions from handlers"""
        event = {'body': json.dumps({'transaction_id': 'txn-123'})}
        context = MagicMock()

        with patch('app.handle_webhook') as mock_webhook:
            mock_webhook.side_effect = Exception('Test error')

            with pytest.raises(Exception) as exc_info:
                app.lambda_handler(event, context)

            assert 'Test error' in str(exc_info.value)


class TestHandleWebhook:
    """Tests for handle_webhook function"""

    def test_handle_webhook_with_api_gateway_event(self, mock_env_vars, mock_aws_clients):
        """Test webhook handler processes API Gateway event successfully"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-456',
                'pattern_data': {'ip': '192.168.1.1', 'device': 'mobile'},
                'risk_score': 35
            })
        }
        context = MagicMock()

        mock_table = mock_aws_clients['table']
        mock_s3 = mock_aws_clients['s3']

        result = app.handle_webhook(event, context)

        # Verify DynamoDB put_item was called
        assert mock_table.put_item.called
        call_args = mock_table.put_item.call_args
        item = call_args[1]['Item']
        assert item['pattern_id'] == 'pattern-txn-456'
        assert item['transaction_id'] == 'txn-456'
        assert item['risk_score'] == Decimal('35')
        assert item['environment'] == 'dev'

        # Verify S3 put_object was called
        assert mock_s3.put_object.called
        s3_call_args = mock_s3.put_object.call_args
        assert s3_call_args[1]['Bucket'] == 'test-audit-bucket-dev'
        assert 'audit/' in s3_call_args[1]['Key']

        # Verify response
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['action'] == 'approve'  # risk_score < 50
        assert body['risk_score'] == 35
        assert 'pattern_id' in body

    def test_handle_webhook_with_direct_event(self, mock_env_vars, mock_aws_clients):
        """Test webhook handler processes direct event (no body wrapper)"""
        event = {
            'transaction_id': 'txn-789',
            'risk_score': 55
        }
        context = MagicMock()

        mock_table = mock_aws_clients['table']

        result = app.handle_webhook(event, context)

        # Verify item was stored
        assert mock_table.put_item.called
        item = mock_table.put_item.call_args[1]['Item']
        assert item['transaction_id'] == 'txn-789'
        assert item['risk_score'] == Decimal('55')

        # Verify response
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['action'] == 'review'  # 50 <= risk_score < 80

    def test_handle_webhook_with_body_as_dict(self, mock_env_vars, mock_aws_clients):
        """Test webhook handler with body already parsed as dict"""
        event = {
            'body': {
                'transaction_id': 'txn-dict',
                'risk_score': 25
            }
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['action'] == 'approve'

    def test_handle_webhook_high_risk_score_block_action(self, mock_env_vars, mock_aws_clients):
        """Test webhook handler returns block action for high risk scores"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-high-risk',
                'risk_score': 85
            })
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['action'] == 'block'  # risk_score >= 80
        assert body['risk_score'] == 85

    def test_handle_webhook_medium_risk_score_review_action(self, mock_env_vars, mock_aws_clients):
        """Test webhook handler returns review action for medium risk scores"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-medium-risk',
                'risk_score': 65
            })
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['action'] == 'review'
        assert body['risk_score'] == 65

    def test_handle_webhook_missing_optional_fields(self, mock_env_vars, mock_aws_clients):
        """Test webhook handler handles missing optional fields gracefully"""
        event = {
            'body': json.dumps({})
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        assert result['statusCode'] == 200
        mock_table = mock_aws_clients['table']
        item = mock_table.put_item.call_args[1]['Item']
        assert item['transaction_id'] == 'unknown'
        assert item['risk_score'] == Decimal('0')

    def test_handle_webhook_returns_error_on_exception(self, mock_env_vars, mock_aws_clients):
        """Test webhook handler returns 500 error on exception"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-error'
            })
        }
        context = MagicMock()

        mock_table = mock_aws_clients['table']
        mock_table.put_item.side_effect = Exception('DynamoDB error')

        result = app.handle_webhook(event, context)

        assert result['statusCode'] == 500
        body = json.loads(result['body'])
        assert 'error' in body
        assert 'DynamoDB error' in body['message']


class TestHandleBatchProcessing:
    """Tests for handle_batch_processing function"""

    def test_handle_batch_processing_success(self, mock_env_vars, mock_aws_clients):
        """Test batch processing handler processes patterns successfully"""
        event = {
            'source': 'eventbridge-batch-processing',
            'action': 'analyze-patterns'
        }
        context = MagicMock()

        mock_table = mock_aws_clients['table']
        mock_s3 = mock_aws_clients['s3']

        # Mock DynamoDB scan response
        mock_table.scan.return_value = {
            'Items': [
                {
                    'pattern_id': 'pattern-1',
                    'timestamp': int(time.time()) - 100,
                    'risk_score': Decimal('75')
                },
                {
                    'pattern_id': 'pattern-2',
                    'timestamp': int(time.time()) - 200,
                    'risk_score': Decimal('85')
                }
            ]
        }

        result = app.handle_batch_processing(event, context)

        # Verify DynamoDB scan was called with correct parameters
        assert mock_table.scan.called
        scan_args = mock_table.scan.call_args[1]
        assert 'FilterExpression' in scan_args
        assert ':time_threshold' in scan_args['ExpressionAttributeValues']
        assert scan_args['ExpressionAttributeValues'][':risk_threshold'] == Decimal('70')

        # Verify S3 put_object was called
        assert mock_s3.put_object.called
        s3_call_args = mock_s3.put_object.call_args[1]
        assert s3_call_args['Bucket'] == 'test-audit-bucket-dev'
        assert 'batch-analysis/' in s3_call_args['Key']

        # Verify response
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['patterns_analyzed'] == 2
        assert 'Batch processing completed' in body['message']

    def test_handle_batch_processing_no_patterns(self, mock_env_vars, mock_aws_clients):
        """Test batch processing with no high-risk patterns"""
        event = {
            'source': 'eventbridge-batch-processing'
        }
        context = MagicMock()

        mock_table = mock_aws_clients['table']
        mock_table.scan.return_value = {'Items': []}

        result = app.handle_batch_processing(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['patterns_analyzed'] == 0

    def test_handle_batch_processing_raises_on_error(self, mock_env_vars, mock_aws_clients):
        """Test batch processing raises exception on error"""
        event = {
            'source': 'eventbridge-batch-processing'
        }
        context = MagicMock()

        mock_table = mock_aws_clients['table']
        mock_table.scan.side_effect = Exception('Scan error')

        with pytest.raises(Exception) as exc_info:
            app.handle_batch_processing(event, context)

        assert 'Scan error' in str(exc_info.value)


class TestIntegration:
    """Integration tests for complete workflows"""

    def test_complete_webhook_to_storage_workflow(self, mock_env_vars, mock_aws_clients):
        """Test complete workflow from webhook to storage"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-integration',
                'pattern_data': {
                    'ip': '10.0.0.1',
                    'user_agent': 'Mozilla/5.0',
                    'location': 'US'
                },
                'risk_score': 72
            })
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        # Verify all storage operations occurred
        mock_table = mock_aws_clients['table']
        mock_s3 = mock_aws_clients['s3']

        assert mock_table.put_item.called
        assert mock_s3.put_object.called

        # Verify pattern_data was properly serialized
        item = mock_table.put_item.call_args[1]['Item']
        pattern_data = json.loads(item['pattern_data'])
        assert pattern_data['ip'] == '10.0.0.1'

        # Verify audit trail includes event details
        s3_body = mock_s3.put_object.call_args[1]['Body']
        audit_data = json.loads(s3_body)
        assert audit_data['transaction_id'] == 'txn-integration'
        assert 'event' in audit_data

        assert result['statusCode'] == 200

    def test_timestamp_consistency(self, mock_env_vars, mock_aws_clients):
        """Test that timestamps are consistent across operations"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-timestamp-test',
                'risk_score': 40
            })
        }
        context = MagicMock()

        with patch('time.time', return_value=1234567890.0):
            result = app.handle_webhook(event, context)

            mock_table = mock_aws_clients['table']
            item = mock_table.put_item.call_args[1]['Item']

            assert item['timestamp'] == 1234567890

            body = json.loads(result['body'])
            assert body['timestamp'] == 1234567890


class TestEnvironmentVariables:
    """Tests for environment variable handling"""

    def test_environment_suffix_used_in_storage(self, mock_env_vars, mock_aws_clients):
        """Test that environment_suffix is stored with patterns"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-env-test',
                'risk_score': 30
            })
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        mock_table = mock_aws_clients['table']
        item = mock_table.put_item.call_args[1]['Item']

        assert item['environment'] == 'dev'


class TestEdgeCases:
    """Tests for edge cases and boundary conditions"""

    def test_risk_score_zero(self, mock_env_vars, mock_aws_clients):
        """Test handling of zero risk score"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-zero-risk',
                'risk_score': 0
            })
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['action'] == 'approve'
        assert body['risk_score'] == 0

    def test_risk_score_boundary_49(self, mock_env_vars, mock_aws_clients):
        """Test risk score boundary at 49 (approve)"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-49',
                'risk_score': 49
            })
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        body = json.loads(result['body'])
        assert body['action'] == 'approve'

    def test_risk_score_boundary_50(self, mock_env_vars, mock_aws_clients):
        """Test risk score boundary at 50 (review)"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-50',
                'risk_score': 50
            })
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        body = json.loads(result['body'])
        assert body['action'] == 'review'

    def test_risk_score_boundary_79(self, mock_env_vars, mock_aws_clients):
        """Test risk score boundary at 79 (review)"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-79',
                'risk_score': 79
            })
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        body = json.loads(result['body'])
        assert body['action'] == 'review'

    def test_risk_score_boundary_80(self, mock_env_vars, mock_aws_clients):
        """Test risk score boundary at 80 (block)"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-80',
                'risk_score': 80
            })
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        body = json.loads(result['body'])
        assert body['action'] == 'block'

    def test_risk_score_100(self, mock_env_vars, mock_aws_clients):
        """Test maximum risk score of 100"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-100',
                'risk_score': 100
            })
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        body = json.loads(result['body'])
        assert body['action'] == 'block'
        assert body['risk_score'] == 100

    def test_empty_pattern_data(self, mock_env_vars, mock_aws_clients):
        """Test handling of empty pattern_data"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-empty-pattern',
                'pattern_data': {},
                'risk_score': 45
            })
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        assert result['statusCode'] == 200
        mock_table = mock_aws_clients['table']
        item = mock_table.put_item.call_args[1]['Item']
        pattern_data = json.loads(item['pattern_data'])
        assert pattern_data == {}

    def test_complex_pattern_data(self, mock_env_vars, mock_aws_clients):
        """Test handling of complex pattern_data"""
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-complex',
                'pattern_data': {
                    'nested': {
                        'deep': {
                            'value': 123
                        }
                    },
                    'array': [1, 2, 3],
                    'boolean': True
                },
                'risk_score': 60
            })
        }
        context = MagicMock()

        result = app.handle_webhook(event, context)

        assert result['statusCode'] == 200
        mock_table = mock_aws_clients['table']
        item = mock_table.put_item.call_args[1]['Item']
        pattern_data = json.loads(item['pattern_data'])
        assert pattern_data['nested']['deep']['value'] == 123
        assert pattern_data['array'] == [1, 2, 3]
