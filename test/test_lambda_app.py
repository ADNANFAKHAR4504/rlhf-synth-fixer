"""
Unit tests for Lambda transaction processor
Tests all code paths to achieve 100% coverage
"""

import json
import base64
import sys
import os
from unittest import mock
from unittest.mock import MagicMock, patch
import pytest

# Add lib/lambda to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'lambda'))

# Mock AWS X-Ray SDK before importing app
# Create a decorator that just returns the original function
def mock_capture(name):
    def decorator(func):
        return func
    return decorator

mock_xray = MagicMock()
mock_xray.capture = mock_capture
mock_xray.begin_subsegment = MagicMock(return_value=MagicMock())
mock_xray.end_subsegment = MagicMock()
mock_xray.put_annotation = MagicMock()
mock_xray.put_metadata = MagicMock()

sys.modules['aws_xray_sdk'] = MagicMock()
sys.modules['aws_xray_sdk.core'] = MagicMock()
sys.modules['aws_xray_sdk.core'].xray_recorder = mock_xray
sys.modules['aws_xray_sdk.core'].patch_all = MagicMock()

# Now import app after mocking
import app

# Replace xray_recorder in app with our mock
app.xray_recorder = mock_xray


class TestLogFunction:
    """Test the log function"""

    @patch('builtins.print')
    def test_log_basic(self, mock_print):
        """Test basic logging"""
        app.log('INFO', 'Test message')
        mock_print.assert_called_once()
        call_arg = mock_print.call_args[0][0]
        log_data = json.loads(call_arg)
        assert log_data['level'] == 'INFO'
        assert log_data['message'] == 'Test message'

    @patch('builtins.print')
    def test_log_with_kwargs(self, mock_print):
        """Test logging with extra kwargs"""
        app.log('ERROR', 'Error occurred', transaction_id='123', error_code='E001')
        call_arg = mock_print.call_args[0][0]
        log_data = json.loads(call_arg)
        assert log_data['transaction_id'] == '123'
        assert log_data['error_code'] == 'E001'


class TestValidateTransaction:
    """Test transaction validation"""

    def test_validate_transaction_valid(self):
        """Test validation with valid transaction"""
        transaction = {
            'transaction_id': 'TXN123',
            'amount': 100.50,
            'type': 'purchase',
            'merchant_id': 'M456'
        }
        assert app.validate_transaction(transaction) is True

    def test_validate_transaction_missing_field(self):
        """Test validation with missing required field"""
        transaction = {
            'transaction_id': 'TXN123',
            'amount': 100.50,
            'type': 'purchase'
            # missing merchant_id
        }
        assert app.validate_transaction(transaction) is False

    def test_validate_transaction_invalid_amount_zero(self):
        """Test validation with zero amount"""
        transaction = {
            'transaction_id': 'TXN123',
            'amount': 0,
            'type': 'purchase',
            'merchant_id': 'M456'
        }
        assert app.validate_transaction(transaction) is False

    def test_validate_transaction_invalid_amount_negative(self):
        """Test validation with negative amount"""
        transaction = {
            'transaction_id': 'TXN123',
            'amount': -50,
            'type': 'purchase',
            'merchant_id': 'M456'
        }
        assert app.validate_transaction(transaction) is False


class TestCalculateRiskScore:
    """Test risk score calculation"""

    def test_calculate_risk_score_low_risk(self):
        """Test low risk transaction"""
        transaction = {
            'amount': 100,
            'merchant_country': 'US',
            'transaction_count': 5
        }
        score = app.calculate_risk_score(transaction)
        assert score == 0

    def test_calculate_risk_score_high_amount(self):
        """Test high amount increases risk"""
        transaction = {
            'amount': 15000,
            'merchant_country': 'US',
            'transaction_count': 5
        }
        score = app.calculate_risk_score(transaction)
        assert score == 30

    def test_calculate_risk_score_foreign_merchant(self):
        """Test foreign merchant increases risk"""
        transaction = {
            'amount': 100,
            'merchant_country': 'RU',
            'transaction_count': 5
        }
        score = app.calculate_risk_score(transaction)
        assert score == 40

    def test_calculate_risk_score_high_velocity(self):
        """Test high velocity increases risk"""
        transaction = {
            'amount': 100,
            'merchant_country': 'US',
            'transaction_count': 25
        }
        score = app.calculate_risk_score(transaction)
        assert score == 30

    def test_calculate_risk_score_all_factors(self):
        """Test all risk factors combined"""
        transaction = {
            'amount': 15000,
            'merchant_country': 'RU',
            'transaction_count': 25
        }
        score = app.calculate_risk_score(transaction)
        assert score == 100  # Capped at 100

    def test_calculate_risk_score_missing_fields(self):
        """Test with missing optional fields"""
        transaction = {}
        score = app.calculate_risk_score(transaction)
        # Missing merchant_country defaults to None, which is not in ['US', 'CA', 'GB']
        # So score = 40 for foreign merchant
        assert score == 40


class TestEmitMetrics:
    """Test CloudWatch metrics emission"""

    @patch('app.cloudwatch')
    def test_emit_metrics_success(self, mock_cloudwatch):
        """Test successful metrics emission"""
        metrics = {
            'TransactionCount': 1,
            'TransactionAmount': 100.50
        }
        app.emit_metrics(metrics, 'purchase')
        mock_cloudwatch.put_metric_data.assert_called_once()
        call_args = mock_cloudwatch.put_metric_data.call_args
        assert call_args[1]['Namespace'] == app.CLOUDWATCH_NAMESPACE
        assert len(call_args[1]['MetricData']) == 2

    @patch('app.cloudwatch')
    def test_emit_metrics_failure(self, mock_cloudwatch):
        """Test metrics emission failure handling"""
        mock_cloudwatch.put_metric_data.side_effect = Exception('CloudWatch error')
        metrics = {'TransactionCount': 1}
        # Should not raise exception
        app.emit_metrics(metrics, 'purchase')


class TestSendTransactionEvent:
    """Test EventBridge event sending"""

    @patch('app.events')
    @patch('app.calculate_risk_score')
    def test_send_transaction_event_success(self, mock_risk, mock_events):
        """Test successful event sending"""
        mock_risk.return_value = 50
        transaction = {
            'transaction_id': 'TXN123',
            'amount': 100,
            'merchant_id': 'M456',
            'merchant_country': 'US'
        }
        app.send_transaction_event(transaction, 'SUCCESS')
        mock_events.put_events.assert_called_once()
        call_args = mock_events.put_events.call_args[1]
        assert call_args['Entries'][0]['Source'] == 'custom.payment.transactions'

    @patch('app.events')
    @patch('app.calculate_risk_score')
    def test_send_transaction_event_high_velocity(self, mock_risk, mock_events):
        """Test event with high velocity flag"""
        mock_risk.return_value = 50
        transaction = {
            'transaction_id': 'TXN123',
            'amount': 6000,  # > 5000 = HIGH velocity
            'merchant_id': 'M456'
        }
        app.send_transaction_event(transaction, 'SUCCESS')
        call_args = mock_events.put_events.call_args[1]
        detail = json.loads(call_args['Entries'][0]['Detail'])
        assert detail['velocity_flag'] == 'HIGH'

    @patch('app.events')
    @patch('app.calculate_risk_score')
    def test_send_transaction_event_failure(self, mock_risk, mock_events):
        """Test event sending failure handling"""
        mock_events.put_events.side_effect = Exception('EventBridge error')
        transaction = {'transaction_id': 'TXN123', 'amount': 100}
        # Should not raise exception
        app.send_transaction_event(transaction, 'SUCCESS')


class TestProcessValidTransaction:
    """Test valid transaction processing"""

    @patch('app.send_transaction_event')
    @patch('app.emit_metrics')
    def test_process_valid_transaction(self, mock_emit, mock_send):
        """Test processing of valid transaction"""
        transaction = {
            'transaction_id': 'TXN123',
            'amount': 100.50,
            'type': 'purchase',
            'merchant_id': 'M456'
        }
        result = app.process_valid_transaction(transaction)
        assert result['status'] == 'SUCCESS'
        assert result['transaction_id'] == 'TXN123'
        mock_emit.assert_called_once()
        mock_send.assert_called_once()


class TestProcessInvalidTransaction:
    """Test invalid transaction processing"""

    @patch('app.send_transaction_event')
    @patch('app.emit_metrics')
    def test_process_invalid_transaction(self, mock_emit, mock_send):
        """Test processing of invalid transaction"""
        transaction = {
            'transaction_id': 'TXN123',
            'amount': -50
        }
        result = app.process_invalid_transaction(transaction)
        assert result['status'] == 'FAILED'
        assert result['reason'] == 'Validation failed'
        mock_emit.assert_called_once()
        mock_send.assert_called_once()

    @patch('app.send_transaction_event')
    @patch('app.emit_metrics')
    def test_process_invalid_transaction_no_id(self, mock_emit, mock_send):
        """Test processing of invalid transaction without ID"""
        transaction = {}
        result = app.process_invalid_transaction(transaction)
        assert result['transaction_id'] == 'unknown'


class TestProcessTransaction:
    """Test individual transaction processing"""

    @patch('app.process_valid_transaction')
    @patch('app.validate_transaction')
    def test_process_transaction_valid(self, mock_validate, mock_process):
        """Test processing valid transaction record"""
        mock_validate.return_value = True
        mock_process.return_value = {'status': 'SUCCESS'}

        transaction = {
            'transaction_id': 'TXN123',
            'amount': 100,
            'type': 'purchase',
            'merchant_id': 'M456'
        }
        encoded_data = base64.b64encode(json.dumps(transaction).encode('utf-8'))

        record = {
            'kinesis': {
                'data': encoded_data
            }
        }

        result = app.process_transaction(record)
        assert result['status'] == 'SUCCESS'

    @patch('app.process_invalid_transaction')
    @patch('app.validate_transaction')
    def test_process_transaction_invalid(self, mock_validate, mock_process):
        """Test processing invalid transaction record"""
        mock_validate.return_value = False
        mock_process.return_value = {'status': 'FAILED'}

        transaction = {
            'transaction_id': 'TXN123',
            'amount': -50
        }
        encoded_data = base64.b64encode(json.dumps(transaction).encode('utf-8'))

        record = {
            'kinesis': {
                'data': encoded_data
            }
        }

        result = app.process_transaction(record)
        assert result['status'] == 'FAILED'

    def test_process_transaction_decode_error(self):
        """Test processing transaction with decode error"""
        record = {
            'kinesis': {
                'data': base64.b64encode(b'invalid json')
            }
        }

        with pytest.raises(json.JSONDecodeError):
            app.process_transaction(record)


class TestLambdaHandler:
    """Test Lambda handler function"""

    @patch('app.emit_metrics')
    @patch('app.process_transaction')
    def test_lambda_handler_success(self, mock_process, mock_emit):
        """Test successful Lambda handler execution"""
        mock_process.return_value = {'status': 'SUCCESS', 'transaction_id': 'TXN123'}

        transaction = {
            'transaction_id': 'TXN123',
            'amount': 100,
            'type': 'purchase',
            'merchant_id': 'M456'
        }
        encoded_data = base64.b64encode(json.dumps(transaction).encode('utf-8'))

        event = {
            'Records': [
                {'kinesis': {'data': encoded_data}},
                {'kinesis': {'data': encoded_data}}
            ]
        }

        context = MagicMock()
        context.request_id = 'req-123'
        context.function_name = 'transaction-processor'

        result = app.lambda_handler(event, context)
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['processed'] == 2
        assert len(body['results']) == 2

    @patch('app.emit_metrics')
    @patch('app.process_transaction')
    def test_lambda_handler_partial_failure(self, mock_process, mock_emit):
        """Test Lambda handler with partial failures"""
        # First record succeeds, second fails
        mock_process.side_effect = [
            {'status': 'SUCCESS'},
            Exception('Processing error')
        ]

        transaction = {
            'transaction_id': 'TXN123',
            'amount': 100,
            'type': 'purchase',
            'merchant_id': 'M456'
        }
        encoded_data = base64.b64encode(json.dumps(transaction).encode('utf-8'))

        event = {
            'Records': [
                {'kinesis': {'data': encoded_data}},
                {'kinesis': {'data': encoded_data}}
            ]
        }

        context = MagicMock()
        context.request_id = 'req-123'
        context.function_name = 'transaction-processor'

        result = app.lambda_handler(event, context)
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['processed'] == 2
        assert body['results'][0]['status'] == 'SUCCESS'
        assert body['results'][1]['status'] == 'ERROR'

    @patch('app.process_transaction')
    def test_lambda_handler_complete_failure(self, mock_process):
        """Test Lambda handler with complete failure"""
        mock_process.side_effect = Exception('Critical error')

        event = {
            'Records': [
                {'kinesis': {'data': base64.b64encode(b'{}')}}
            ]
        }

        context = MagicMock()
        context.request_id = 'req-123'
        context.function_name = 'transaction-processor'

        # Handler should catch and process the exception
        result = app.lambda_handler(event, context)
        # Should still return success with error in results
        assert result['statusCode'] == 200

    @patch('app.emit_metrics')
    @patch('app.process_transaction')
    def test_lambda_handler_exception_in_handler(self, mock_process, mock_emit):
        """Test Lambda handler with exception in main try block"""
        # Make event.get('Records') fail by making event not a dict
        mock_emit.side_effect = Exception('Emit metrics failed')

        transaction = {
            'transaction_id': 'TXN123',
            'amount': 100,
            'type': 'purchase',
            'merchant_id': 'M456'
        }
        encoded_data = base64.b64encode(json.dumps(transaction).encode('utf-8'))

        event = {
            'Records': [
                {'kinesis': {'data': encoded_data}}
            ]
        }

        context = MagicMock()
        context.request_id = 'req-123'
        context.function_name = 'transaction-processor'

        # This should raise exception and be caught by outer try-except
        with pytest.raises(Exception):
            app.lambda_handler(event, context)
