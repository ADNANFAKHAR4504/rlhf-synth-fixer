"""
Unit tests for Lambda function with proper mocking
"""
import json
import os
import pytest
from unittest.mock import MagicMock, patch, call
from decimal import Decimal


# Mock environment variables before importing the module
@pytest.fixture(autouse=True)
def mock_env_vars():
    """Mock environment variables for all tests"""
    with patch.dict(os.environ, {
        'DYNAMODB_TABLE': 'test-market-alerts',
        'SNS_TOPIC_ARN': 'arn:aws:sns:us-east-1:123456789012:test-topic',
        'ENVIRONMENT': 'test'
    }):
        yield


@pytest.fixture
def mock_boto3_clients():
    """Mock boto3 clients and resources"""
    with patch('boto3.resource') as mock_resource, \
         patch('boto3.client') as mock_client:

        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_resource.return_value = mock_dynamodb

        # Mock SNS client
        mock_sns = MagicMock()
        mock_client.return_value = mock_sns

        yield {
            'dynamodb': mock_dynamodb,
            'table': mock_table,
            'sns': mock_sns
        }


@pytest.fixture
def reload_lambda_module(mock_boto3_clients):
    """Reload lambda module with mocked dependencies"""
    import sys
    import importlib.util

    # Remove cached module if exists
    module_path = 'lib/lambda/index.py'
    if 'lambda_index' in sys.modules:
        del sys.modules['lambda_index']

    # Load module using importlib (lambda is a reserved keyword)
    spec = importlib.util.spec_from_file_location("lambda_index", module_path)
    index = importlib.util.module_from_spec(spec)
    sys.modules['lambda_index'] = index
    spec.loader.exec_module(index)

    # Override the global table and sns with our mocks
    index.table = mock_boto3_clients['table']
    index.sns = mock_boto3_clients['sns']

    return index


class TestLambdaHandler:
    """Test the Lambda handler function"""

    def test_handler_processes_high_price_alert(self, reload_lambda_module, mock_boto3_clients):
        """Test successful processing of high price message"""
        event = {
            'Records': [
                {
                    'messageId': 'msg-123',
                    'body': json.dumps({
                        'symbol': 'AAPL',
                        'price': 200.0
                    })
                }
            ]
        }

        result = reload_lambda_module.handler(event, None)

        # Should succeed with no failures
        assert result == {'batchItemFailures': []}

        # Verify DynamoDB put_item was called
        assert mock_boto3_clients['table'].put_item.called
        put_call = mock_boto3_clients['table'].put_item.call_args
        assert put_call[1]['Item']['symbol'] == 'AAPL'
        assert put_call[1]['Item']['price'] == Decimal('200.0')
        assert put_call[1]['Item']['alert_type'] == 'HIGH'

        # Verify SNS publish was called
        assert mock_boto3_clients['sns'].publish.called

    def test_handler_processes_low_price_alert(self, reload_lambda_module, mock_boto3_clients):
        """Test successful processing of low price message"""
        event = {
            'Records': [
                {
                    'messageId': 'msg-456',
                    'body': json.dumps({
                        'symbol': 'GOOGL',
                        'price': 30.0
                    })
                }
            ]
        }

        result = reload_lambda_module.handler(event, None)

        # Should succeed with no failures
        assert result == {'batchItemFailures': []}

        # Verify alert type is LOW
        put_call = mock_boto3_clients['table'].put_item.call_args
        assert put_call[1]['Item']['alert_type'] == 'LOW'

    def test_handler_ignores_normal_prices(self, reload_lambda_module, mock_boto3_clients):
        """Test that normal prices don't trigger alerts"""
        event = {
            'Records': [
                {
                    'messageId': 'msg-789',
                    'body': json.dumps({
                        'symbol': 'MSFT',
                        'price': 100.0
                    })
                }
            ]
        }

        result = reload_lambda_module.handler(event, None)

        # Should succeed with no failures
        assert result == {'batchItemFailures': []}

        # Verify DynamoDB and SNS were NOT called (price is normal)
        assert not mock_boto3_clients['table'].put_item.called
        assert not mock_boto3_clients['sns'].publish.called

    def test_handler_handles_errors_gracefully(self, reload_lambda_module, mock_boto3_clients):
        """Test that handler returns failed message IDs on errors"""
        # Make DynamoDB fail
        mock_boto3_clients['table'].put_item.side_effect = Exception("DynamoDB error")

        event = {
            'Records': [
                {
                    'messageId': 'msg-error-1',
                    'body': json.dumps({
                        'symbol': 'FAIL',
                        'price': 200.0
                    })
                }
            ]
        }

        result = reload_lambda_module.handler(event, None)

        # Should return the failed message ID
        assert len(result['batchItemFailures']) == 1
        assert result['batchItemFailures'][0]['itemIdentifier'] == 'msg-error-1'

    def test_handler_processes_multiple_messages(self, reload_lambda_module, mock_boto3_clients):
        """Test batch processing of multiple messages"""
        event = {
            'Records': [
                {
                    'messageId': 'msg-1',
                    'body': json.dumps({'symbol': 'AAPL', 'price': 200.0})
                },
                {
                    'messageId': 'msg-2',
                    'body': json.dumps({'symbol': 'GOOGL', 'price': 30.0})
                },
                {
                    'messageId': 'msg-3',
                    'body': json.dumps({'symbol': 'MSFT', 'price': 100.0})
                }
            ]
        }

        result = reload_lambda_module.handler(event, None)

        # All should succeed
        assert result == {'batchItemFailures': []}

        # DynamoDB should be called twice (AAPL high, GOOGL low)
        assert mock_boto3_clients['table'].put_item.call_count == 2


class TestProcessMarketData:
    """Test the process_market_data function"""

    def test_processes_high_price_threshold(self, reload_lambda_module, mock_boto3_clients):
        """Test high price threshold logic"""
        data = {'symbol': 'TSLA', 'price': 200.0}

        reload_lambda_module.process_market_data(data)

        # Verify alert was created
        assert mock_boto3_clients['table'].put_item.called
        assert mock_boto3_clients['sns'].publish.called

    def test_processes_low_price_threshold(self, reload_lambda_module, mock_boto3_clients):
        """Test low price threshold logic"""
        data = {'symbol': 'AMC', 'price': 10.0}

        reload_lambda_module.process_market_data(data)

        # Verify alert was created
        assert mock_boto3_clients['table'].put_item.called
        assert mock_boto3_clients['sns'].publish.called

    def test_ignores_prices_within_threshold(self, reload_lambda_module, mock_boto3_clients):
        """Test that prices within normal range are ignored"""
        data = {'symbol': 'NFLX', 'price': 100.0}

        reload_lambda_module.process_market_data(data)

        # Verify no alert was created
        assert not mock_boto3_clients['table'].put_item.called
        assert not mock_boto3_clients['sns'].publish.called


class TestWriteToDynamoDBWithRetry:
    """Test DynamoDB write with exponential backoff"""

    def test_successful_write_first_attempt(self, reload_lambda_module, mock_boto3_clients):
        """Test successful DynamoDB write on first attempt"""
        reload_lambda_module.write_to_dynamodb_with_retry('AAPL', '2025-01-01T00:00:00', 200.0, 'HIGH')

        # Should be called once
        assert mock_boto3_clients['table'].put_item.call_count == 1

    def test_retry_on_failure_then_success(self, reload_lambda_module, mock_boto3_clients):
        """Test retry logic when first attempt fails"""
        # Fail first, then succeed
        mock_boto3_clients['table'].put_item.side_effect = [
            Exception("Temporary error"),
            None  # Success
        ]

        with patch('time.sleep'):  # Mock sleep to speed up test
            reload_lambda_module.write_to_dynamodb_with_retry('AAPL', '2025-01-01T00:00:00', 200.0, 'HIGH')

        # Should be called twice (1 failure + 1 success)
        assert mock_boto3_clients['table'].put_item.call_count == 2

    def test_raises_after_max_retries(self, reload_lambda_module, mock_boto3_clients):
        """Test that exception is raised after max retries"""
        # Fail all attempts
        mock_boto3_clients['table'].put_item.side_effect = Exception("Persistent error")

        with patch('time.sleep'):  # Mock sleep to speed up test
            with pytest.raises(Exception, match="Persistent error"):
                reload_lambda_module.write_to_dynamodb_with_retry(
                    'AAPL', '2025-01-01T00:00:00', 200.0, 'HIGH', max_retries=3
                )

        # Should be called max_retries times
        assert mock_boto3_clients['table'].put_item.call_count == 3


class TestPublishToSNSWithRetry:
    """Test SNS publish with exponential backoff"""

    def test_successful_publish_first_attempt(self, reload_lambda_module, mock_boto3_clients):
        """Test successful SNS publish on first attempt"""
        reload_lambda_module.publish_to_sns_with_retry('AAPL', 200.0, 'HIGH')

        # Should be called once
        assert mock_boto3_clients['sns'].publish.call_count == 1

        # Verify message format
        call_args = mock_boto3_clients['sns'].publish.call_args
        assert call_args[1]['TopicArn'] == 'arn:aws:sns:us-east-1:123456789012:test-topic'
        assert 'AAPL' in call_args[1]['Subject']

        message = json.loads(call_args[1]['Message'])
        assert message['symbol'] == 'AAPL'
        assert message['price'] == 200.0
        assert message['alert_type'] == 'HIGH'

    def test_retry_on_failure_then_success(self, reload_lambda_module, mock_boto3_clients):
        """Test retry logic when first attempt fails"""
        # Fail first, then succeed
        mock_boto3_clients['sns'].publish.side_effect = [
            Exception("Temporary error"),
            None  # Success
        ]

        with patch('time.sleep'):  # Mock sleep to speed up test
            reload_lambda_module.publish_to_sns_with_retry('AAPL', 200.0, 'HIGH')

        # Should be called twice (1 failure + 1 success)
        assert mock_boto3_clients['sns'].publish.call_count == 2

    def test_raises_after_max_retries(self, reload_lambda_module, mock_boto3_clients):
        """Test that exception is raised after max retries"""
        # Fail all attempts
        mock_boto3_clients['sns'].publish.side_effect = Exception("Persistent error")

        with patch('time.sleep'):  # Mock sleep to speed up test
            with pytest.raises(Exception, match="Persistent error"):
                reload_lambda_module.publish_to_sns_with_retry(
                    'AAPL', 200.0, 'HIGH', max_retries=3
                )

        # Should be called max_retries times
        assert mock_boto3_clients['sns'].publish.call_count == 3


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_handler_with_empty_records(self, reload_lambda_module):
        """Test handler with empty records list"""
        event = {'Records': []}
        result = reload_lambda_module.handler(event, None)
        assert result == {'batchItemFailures': []}

    def test_handler_with_malformed_json(self, reload_lambda_module):
        """Test handler with malformed JSON in message body"""
        event = {
            'Records': [
                {
                    'messageId': 'msg-bad',
                    'body': 'not valid json'
                }
            ]
        }

        result = reload_lambda_module.handler(event, None)

        # Should return the failed message ID
        assert len(result['batchItemFailures']) == 1
        assert result['batchItemFailures'][0]['itemIdentifier'] == 'msg-bad'

    def test_handler_with_missing_fields(self, reload_lambda_module, mock_boto3_clients):
        """Test handler with missing required fields"""
        event = {
            'Records': [
                {
                    'messageId': 'msg-incomplete',
                    'body': json.dumps({'symbol': 'AAPL'})  # Missing price
                }
            ]
        }

        # Should not crash - price defaults to 0
        result = reload_lambda_module.handler(event, None)
        assert result == {'batchItemFailures': []}

    def test_price_exactly_at_threshold(self, reload_lambda_module, mock_boto3_clients):
        """Test behavior when price is exactly at threshold"""
        # Test high threshold (150.0)
        data_high = {'symbol': 'TEST', 'price': 150.0}
        reload_lambda_module.process_market_data(data_high)

        # Should not trigger (uses > not >=)
        assert not mock_boto3_clients['table'].put_item.called

        # Test low threshold (50.0)
        data_low = {'symbol': 'TEST2', 'price': 50.0}
        reload_lambda_module.process_market_data(data_low)

        # Should not trigger (uses < not <=)
        assert not mock_boto3_clients['table'].put_item.called
