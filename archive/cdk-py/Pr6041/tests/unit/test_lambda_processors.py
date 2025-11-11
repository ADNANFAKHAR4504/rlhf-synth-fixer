"""Unit tests covering success and failure paths for Lambda handlers."""

from __future__ import annotations

import importlib.util
import json
import os
from decimal import Decimal
from pathlib import Path
from unittest.mock import Mock, MagicMock, patch

import pytest

LAMBDA_DIR = Path(__file__).resolve().parents[2] / "lib" / "lambda"


def _load_lambda_module(name: str):
    """Load Lambda module with proper boto3 mocking to avoid region errors."""
    module_path = LAMBDA_DIR / f"{name}.py"
    spec = importlib.util.spec_from_file_location(f"tests_lambda_{name}", module_path)
    module = importlib.util.module_from_spec(spec)
    loader = spec.loader
    assert loader is not None
    
    # Mock boto3 clients before loading module to avoid region errors
    with patch('boto3.client') as mock_client, patch('boto3.resource') as mock_resource:
        mock_client.return_value = Mock()
        mock_resource.return_value = Mock()
        loader.exec_module(module)
    
    return module


class FlakyS3Client:
    def __init__(self):
        self.failed_once = False
        self.saved_keys = []

    def put_object(self, *, Bucket, Key, Body, **kwargs):  # noqa: N803
        if not self.failed_once:
            self.failed_once = True
            raise RuntimeError("simulated S3 failure")
        self.saved_keys.append((Bucket, Key, Body, kwargs))
        return {"ResponseMetadata": {"HTTPStatusCode": 200}}


def test_authorizer_allows_valid_token():
    module = _load_lambda_module("authorizer")
    event = {
        "authorizationToken": "valid-token",
        "methodArn": "arn:aws:execute-api:eu-west-3:123456789012:abc123/dev/POST/stripe",
    }
    policy = module.lambda_handler(event, None)
    assert policy["policyDocument"]["Statement"][0]["Effect"] == "Allow"


def test_authorizer_rejects_invalid_token():
    module = _load_lambda_module("authorizer")
    event = {"authorizationToken": "invalid", "methodArn": "arn:aws:execute-api:region:acct:id"}
    with pytest.raises(Exception) as exc:
        module.lambda_handler(event, None)
    assert str(exc.value) == "Unauthorized"


def test_dlq_processor_continues_when_record_archival_fails(monkeypatch):
    module = _load_lambda_module("dlq_processor")
    monkeypatch.setenv("BUCKET_NAME", "failed-webhooks-bucket")
    fake_s3 = FlakyS3Client()
    module.s3_client = fake_s3

    event = {
        "Records": [
            {
                "body": json.dumps({"provider": "paypal", "eventId": "evt-1"}),
                "attributes": {"ApproximateReceiveCount": "1"},
                "messageId": "msg-1",
            },
            {
                "body": json.dumps({"provider": "square", "eventId": "evt-2"}),
                "attributes": {"ApproximateReceiveCount": "2"},
                "messageId": "msg-2",
            },
        ]
    }

    result = module.lambda_handler(event, None)
    assert result["statusCode"] == 200
    assert len(fake_s3.saved_keys) == 1


def test_dlq_processor_returns_error_when_records_missing():
    module = _load_lambda_module("dlq_processor")
    result = module.lambda_handler({}, None)
    assert result["statusCode"] == 500


# =============================================================================
# COMPREHENSIVE LAMBDA FUNCTION TESTS FOR 100% COVERAGE
# =============================================================================

# Authorizer Lambda Tests
def test_authorizer_missing_authorization_token():
    """Test authorizer with missing authorizationToken."""
    module = _load_lambda_module("authorizer")
    event = {
        "methodArn": "arn:aws:execute-api:us-east-1:123456789012:abc123/dev/POST/stripe"
    }
    with pytest.raises(Exception) as exc:
        module.lambda_handler(event, None)
    assert str(exc.value) == "Unauthorized"


def test_authorizer_empty_authorization_token():
    """Test authorizer with empty authorizationToken."""
    module = _load_lambda_module("authorizer")
    event = {
        "authorizationToken": "",
        "methodArn": "arn:aws:execute-api:us-east-1:123456789012:abc123/dev/POST/stripe"
    }
    with pytest.raises(Exception) as exc:
        module.lambda_handler(event, None)
    assert str(exc.value) == "Unauthorized"


def test_authorizer_valid_token_generates_policy():
    """Test authorizer with valid token generates proper IAM policy."""
    module = _load_lambda_module("authorizer")
    event = {
        "authorizationToken": "valid-webhook-token",
        "methodArn": "arn:aws:execute-api:us-east-1:123456789012:abc123/dev/POST/stripe"
    }
    policy = module.lambda_handler(event, None)
    
    assert policy["principalId"] == "webhook-user"
    assert policy["policyDocument"]["Version"] == "2012-10-17"
    assert len(policy["policyDocument"]["Statement"]) == 1
    statement = policy["policyDocument"]["Statement"][0]
    assert statement["Action"] == "execute-api:Invoke"
    assert statement["Effect"] == "Allow"
    assert statement["Resource"] == event["methodArn"]
    assert policy["context"]["provider"] == "webhook"
    assert policy["context"]["validated"] == "true"


def test_authorizer_exception_during_processing():
    """Test authorizer handles exceptions during processing."""
    module = _load_lambda_module("authorizer")
    # Missing methodArn will cause an exception
    event = {
        "authorizationToken": "valid-token"
    }
    with pytest.raises(Exception) as exc:
        module.lambda_handler(event, None)
    assert str(exc.value) == "Unauthorized"


# Stripe Processor Lambda Tests
def test_stripe_processor_success_with_api_gateway_event(monkeypatch):
    """Test Stripe processor with API Gateway event format."""
    module = _load_lambda_module("stripe_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    # Mock SQS client
    mock_sqs = Mock()
    mock_sqs.send_message.return_value = {"MessageId": "test-msg-id"}
    module.sqs_client = mock_sqs
    
    event = {
        "body": json.dumps({
            "id": "evt_stripe_123",
            "type": "payment_intent.succeeded",
            "data": {"object": {"amount": 1000}}
        })
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 200
    response_body = json.loads(result["body"])
    assert response_body["message"] == "Webhook processed successfully"
    
    # Verify SQS was called correctly
    mock_sqs.send_message.assert_called_once()
    call_args = mock_sqs.send_message.call_args[1]
    assert call_args["QueueUrl"] == "https://sqs.us-east-1.amazonaws.com/123/webhook-queue"
    
    message_body = json.loads(call_args["MessageBody"])
    assert message_body["eventId"] == "evt_stripe_123"
    assert message_body["provider"] == "stripe"
    assert message_body["type"] == "payment_intent.succeeded"
    assert "timestamp" in message_body
    assert "payload" in message_body


def test_stripe_processor_success_with_direct_event(monkeypatch):
    """Test Stripe processor with direct event (no 'body' key)."""
    module = _load_lambda_module("stripe_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    # Mock SQS client
    mock_sqs = Mock()
    mock_sqs.send_message.return_value = {"MessageId": "test-msg-id-2"}
    module.sqs_client = mock_sqs
    
    event = {
        "id": "evt_stripe_456",
        "type": "invoice.payment_succeeded",
        "data": {"object": {"amount_paid": 2000}}
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 200
    mock_sqs.send_message.assert_called_once()


def test_stripe_processor_empty_body_error(monkeypatch):
    """Test Stripe processor with empty body raises error."""
    module = _load_lambda_module("stripe_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    event = {"body": "{}"}
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 500
    response_body = json.loads(result["body"])
    assert "error" in response_body


def test_stripe_processor_sqs_error(monkeypatch):
    """Test Stripe processor handles SQS errors."""
    module = _load_lambda_module("stripe_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    # Mock SQS client to raise error
    mock_sqs = Mock()
    mock_sqs.send_message.side_effect = Exception("SQS connection failed")
    module.sqs_client = mock_sqs
    
    event = {
        "body": json.dumps({"id": "evt_123", "type": "test"})
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 500
    response_body = json.loads(result["body"])
    assert response_body["error"] == "SQS connection failed"


def test_stripe_processor_missing_id_generates_timestamp_id(monkeypatch):
    """Test Stripe processor generates eventId when id is missing."""
    module = _load_lambda_module("stripe_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    mock_sqs = Mock()
    mock_sqs.send_message.return_value = {"MessageId": "test-msg-id"}
    module.sqs_client = mock_sqs
    
    event = {
        "body": json.dumps({"type": "test.event", "data": {}})
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 200
    call_args = mock_sqs.send_message.call_args[1]
    message_body = json.loads(call_args["MessageBody"])
    assert message_body["eventId"].startswith("stripe-")
    assert message_body["type"] == "test.event"


# PayPal Processor Lambda Tests
def test_paypal_processor_success_with_event_type(monkeypatch):
    """Test PayPal processor with event_type field."""
    module = _load_lambda_module("paypal_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    mock_sqs = Mock()
    mock_sqs.send_message.return_value = {"MessageId": "paypal-msg-id"}
    module.sqs_client = mock_sqs
    
    event = {
        "body": json.dumps({
            "id": "paypal_evt_123",
            "event_type": "PAYMENT.CAPTURE.COMPLETED",
            "resource": {"amount": {"total": "10.00"}}
        })
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 200
    call_args = mock_sqs.send_message.call_args[1]
    message_body = json.loads(call_args["MessageBody"])
    assert message_body["eventId"] == "paypal_evt_123"
    assert message_body["provider"] == "paypal"
    assert message_body["type"] == "PAYMENT.CAPTURE.COMPLETED"


def test_paypal_processor_missing_event_type_defaults_to_unknown(monkeypatch):
    """Test PayPal processor with missing event_type defaults to 'unknown'."""
    module = _load_lambda_module("paypal_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    mock_sqs = Mock()
    mock_sqs.send_message.return_value = {"MessageId": "paypal-msg-id"}
    module.sqs_client = mock_sqs
    
    event = {
        "body": json.dumps({"id": "paypal_evt_456", "resource": {}})
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 200
    call_args = mock_sqs.send_message.call_args[1]
    message_body = json.loads(call_args["MessageBody"])
    assert message_body["type"] == "unknown"


def test_paypal_processor_empty_body_error(monkeypatch):
    """Test PayPal processor with empty body raises error."""
    module = _load_lambda_module("paypal_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    event = {"body": "null"}
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 500
    response_body = json.loads(result["body"])
    assert "error" in response_body


def test_paypal_processor_direct_event_format(monkeypatch):
    """Test PayPal processor with direct event format."""
    module = _load_lambda_module("paypal_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    mock_sqs = Mock()
    mock_sqs.send_message.return_value = {"MessageId": "paypal-direct-msg"}
    module.sqs_client = mock_sqs
    
    event = {
        "id": "direct_paypal_evt",
        "event_type": "BILLING.SUBSCRIPTION.CREATED"
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 200
    call_args = mock_sqs.send_message.call_args[1]
    message_body = json.loads(call_args["MessageBody"])
    assert message_body["eventId"] == "direct_paypal_evt"
    assert message_body["type"] == "BILLING.SUBSCRIPTION.CREATED"


# Square Processor Lambda Tests
def test_square_processor_success_with_event_id(monkeypatch):
    """Test Square processor with event_id field."""
    module = _load_lambda_module("square_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    mock_sqs = Mock()
    mock_sqs.send_message.return_value = {"MessageId": "square-msg-id"}
    module.sqs_client = mock_sqs
    
    event = {
        "body": json.dumps({
            "event_id": "square_evt_123",
            "type": "payment.updated",
            "data": {"object": {"payment": {"id": "payment_123"}}}
        })
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 200
    call_args = mock_sqs.send_message.call_args[1]
    message_body = json.loads(call_args["MessageBody"])
    assert message_body["eventId"] == "square_evt_123"
    assert message_body["provider"] == "square"
    assert message_body["type"] == "payment.updated"


def test_square_processor_missing_event_id_generates_timestamp_id(monkeypatch):
    """Test Square processor generates eventId when event_id is missing."""
    module = _load_lambda_module("square_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    mock_sqs = Mock()
    mock_sqs.send_message.return_value = {"MessageId": "square-msg-id"}
    module.sqs_client = mock_sqs
    
    event = {
        "body": json.dumps({"type": "order.updated", "data": {}})
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 200
    call_args = mock_sqs.send_message.call_args[1]
    message_body = json.loads(call_args["MessageBody"])
    assert message_body["eventId"].startswith("square-")
    assert message_body["type"] == "order.updated"


def test_square_processor_sqs_error_handling(monkeypatch):
    """Test Square processor handles SQS errors."""
    module = _load_lambda_module("square_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    mock_sqs = Mock()
    mock_sqs.send_message.side_effect = Exception("Network timeout")
    module.sqs_client = mock_sqs
    
    event = {
        "body": json.dumps({"event_id": "square_evt", "type": "test"})
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 500
    response_body = json.loads(result["body"])
    assert response_body["error"] == "Network timeout"


# SQS Consumer Lambda Tests
def test_sqs_consumer_success_single_record(monkeypatch):
    """Test SQS consumer processes single record successfully."""
    module = _load_lambda_module("sqs_consumer")
    monkeypatch.setenv("TABLE_NAME", "webhook-events-table")
    
    # Mock DynamoDB table
    mock_table = Mock()
    mock_dynamodb = Mock()
    mock_dynamodb.Table.return_value = mock_table
    module.dynamodb = mock_dynamodb
    
    event = {
        "Records": [
            {
                "body": json.dumps({
                    "eventId": "test-event-123",
                    "timestamp": 1699000000,
                    "provider": "stripe",
                    "type": "payment.succeeded",
                    "payload": '{"amount": 1000}'
                }),
                "attributes": {
                    "ApproximateFirstReceiveTimestamp": "1699000100000"
                }
            }
        ]
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 200
    response_body = json.loads(result["body"])
    assert response_body["successful"] == 1
    assert response_body["failed"] == 0
    
    # Verify DynamoDB was called correctly
    mock_table.put_item.assert_called_once()
    call_args = mock_table.put_item.call_args[1]["Item"]
    assert call_args["eventId"] == "test-event-123"
    assert call_args["timestamp"] == Decimal('1699000000')
    assert call_args["provider"] == "stripe"
    assert call_args["type"] == "payment.succeeded"
    assert call_args["payload"] == '{"amount": 1000}'
    assert call_args["processedAt"] == Decimal('1699000100')


def test_sqs_consumer_multiple_records_success(monkeypatch):
    """Test SQS consumer processes multiple records successfully."""
    module = _load_lambda_module("sqs_consumer")
    monkeypatch.setenv("TABLE_NAME", "webhook-events-table")
    
    mock_table = Mock()
    mock_dynamodb = Mock()
    mock_dynamodb.Table.return_value = mock_table
    module.dynamodb = mock_dynamodb
    
    event = {
        "Records": [
            {
                "body": json.dumps({
                    "eventId": "event-1",
                    "timestamp": 1699000001,
                    "provider": "stripe",
                    "type": "payment.succeeded",
                    "payload": '{"amount": 1000}'
                }),
                "attributes": {"ApproximateFirstReceiveTimestamp": "1699000101000"}
            },
            {
                "body": json.dumps({
                    "eventId": "event-2",
                    "timestamp": 1699000002,
                    "provider": "paypal",
                    "type": "payment.completed",
                    "payload": '{"amount": 2000}'
                }),
                "attributes": {"ApproximateFirstReceiveTimestamp": "1699000102000"}
            }
        ]
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 200
    response_body = json.loads(result["body"])
    assert response_body["successful"] == 2
    assert response_body["failed"] == 0
    assert mock_table.put_item.call_count == 2


def test_sqs_consumer_dynamodb_error_reraises_exception(monkeypatch):
    """Test SQS consumer reraises exceptions on DynamoDB errors."""
    module = _load_lambda_module("sqs_consumer")
    monkeypatch.setenv("TABLE_NAME", "webhook-events-table")
    
    mock_table = Mock()
    mock_table.put_item.side_effect = Exception("DynamoDB error")
    mock_dynamodb = Mock()
    mock_dynamodb.Table.return_value = mock_table
    module.dynamodb = mock_dynamodb
    
    event = {
        "Records": [
            {
                "body": json.dumps({
                    "eventId": "failing-event",
                    "timestamp": 1699000000,
                    "provider": "stripe",
                    "type": "payment.failed",
                    "payload": '{}'
                }),
                "attributes": {"ApproximateFirstReceiveTimestamp": "1699000000000"}
            }
        ]
    }
    
    with pytest.raises(Exception) as exc:
        module.lambda_handler(event, None)
    assert str(exc.value) == "DynamoDB error"


def test_sqs_consumer_general_exception_handling(monkeypatch):
    """Test SQS consumer handles general exceptions."""
    module = _load_lambda_module("sqs_consumer")
    # Don't set TABLE_NAME to cause an error
    
    event = {
        "Records": [
            {
                "body": json.dumps({"eventId": "test", "timestamp": 1699000000, "provider": "test", "type": "test", "payload": "{}"}),
                "attributes": {"ApproximateFirstReceiveTimestamp": "1699000000000"}
            }
        ]
    }
    
    with pytest.raises(Exception):
        module.lambda_handler(event, None)


# DLQ Processor Lambda Tests (Additional Coverage)
def test_dlq_processor_success_single_record(monkeypatch):
    """Test DLQ processor successfully archives single record."""
    module = _load_lambda_module("dlq_processor")
    monkeypatch.setenv("BUCKET_NAME", "failed-webhooks-bucket")
    
    mock_s3 = Mock()
    mock_s3.put_object.return_value = {"ETag": "test-etag"}
    module.s3_client = mock_s3
    
    event = {
        "Records": [
            {
                "body": json.dumps({
                    "eventId": "failed-event-123",
                    "provider": "stripe",
                    "type": "payment.failed",
                    "payload": '{"error": "card_declined"}'
                }),
                "attributes": {"ApproximateReceiveCount": "3"},
                "messageId": "msg-123"
            }
        ]
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 200
    response_body = json.loads(result["body"])
    assert response_body["message"] == "DLQ processing completed"
    
    # Verify S3 was called correctly
    mock_s3.put_object.assert_called_once()
    call_args = mock_s3.put_object.call_args[1]
    assert call_args["Bucket"] == "failed-webhooks-bucket"
    assert "stripe" in call_args["Key"]
    assert "failed-event-123.json" in call_args["Key"]
    assert call_args["ContentType"] == "application/json"
    
    # Verify body contains failure metadata
    body_data = json.loads(call_args["Body"])
    assert body_data["originalMessage"]["eventId"] == "failed-event-123"
    assert body_data["receiveCount"] == "3"
    assert body_data["messageId"] == "msg-123"
    assert "failureTime" in body_data


def test_dlq_processor_unknown_provider_defaults(monkeypatch):
    """Test DLQ processor handles records with missing provider field."""
    module = _load_lambda_module("dlq_processor")
    monkeypatch.setenv("BUCKET_NAME", "failed-webhooks-bucket")
    
    mock_s3 = Mock()
    mock_s3.put_object.return_value = {"ETag": "test-etag"}
    module.s3_client = mock_s3
    
    event = {
        "Records": [
            {
                "body": json.dumps({
                    "type": "unknown.event",
                    "payload": '{}'
                }),
                "attributes": {"ApproximateReceiveCount": "1"},
                "messageId": "msg-unknown"
            }
        ]
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 200
    call_args = mock_s3.put_object.call_args[1]
    assert "unknown" in call_args["Key"]  # Should use 'unknown' as provider
    assert "unknown.json" in call_args["Key"]  # Should use 'unknown' as eventId


def test_dlq_processor_s3_error_continues_processing_other_records(monkeypatch):
    """Test DLQ processor continues processing when S3 errors occur on some records."""
    module = _load_lambda_module("dlq_processor")
    monkeypatch.setenv("BUCKET_NAME", "failed-webhooks-bucket")
    
    # Use the existing FlakyS3Client for consistency
    fake_s3 = FlakyS3Client()
    module.s3_client = fake_s3
    
    event = {
        "Records": [
            {
                "body": json.dumps({"provider": "stripe", "eventId": "evt-fail"}),
                "attributes": {"ApproximateReceiveCount": "1"},
                "messageId": "msg-fail"
            },
            {
                "body": json.dumps({"provider": "paypal", "eventId": "evt-success"}),
                "attributes": {"ApproximateReceiveCount": "2"},
                "messageId": "msg-success"
            }
        ]
    }
    
    result = module.lambda_handler(event, None)
    
    # Should still return success status even if some records failed
    assert result["statusCode"] == 200
    # FlakyS3Client fails once then succeeds, so only one record should be saved
    assert len(fake_s3.saved_keys) == 1


def test_dlq_processor_empty_event(monkeypatch):
    """Test DLQ processor handles empty event (no Records key) gracefully."""
    module = _load_lambda_module("dlq_processor")
    monkeypatch.setenv("BUCKET_NAME", "test-bucket")
    
    result = module.lambda_handler({}, None)
    
    # Should return error status when event structure is invalid
    assert result["statusCode"] == 500
    response_body = json.loads(result["body"])
    assert "error" in response_body


def test_dlq_processor_empty_records_list(monkeypatch):
    """Test DLQ processor handles event with empty Records list."""
    module = _load_lambda_module("dlq_processor")
    monkeypatch.setenv("BUCKET_NAME", "test-bucket")
    
    result = module.lambda_handler({"Records": []}, None)
    
    # Should return success when no records to process
    assert result["statusCode"] == 200
    response_body = json.loads(result["body"])
    assert response_body["message"] == "DLQ processing completed"


def test_square_processor_with_non_string_body(monkeypatch):
    """Test Square processor with body that's already parsed (not string)."""
    module = _load_lambda_module("square_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    mock_sqs = Mock()
    mock_sqs.send_message.return_value = {"MessageId": "square-non-string-msg"}
    module.sqs_client = mock_sqs
    
    event = {
        "body": {"event_id": "square_parsed_body", "type": "order.created"}
    }
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 200
    call_args = mock_sqs.send_message.call_args[1]
    message_body = json.loads(call_args["MessageBody"])
    assert message_body["eventId"] == "square_parsed_body"


def test_square_processor_empty_body_direct_event(monkeypatch):
    """Test Square processor with empty body in direct event format."""
    module = _load_lambda_module("square_processor")
    monkeypatch.setenv("QUEUE_URL", "https://sqs.us-east-1.amazonaws.com/123/webhook-queue")
    
    # Test the direct event path when there's no 'body' key but event itself is empty
    event = {}
    
    result = module.lambda_handler(event, None)
    
    assert result["statusCode"] == 500
    response_body = json.loads(result["body"])
    assert "error" in response_body
