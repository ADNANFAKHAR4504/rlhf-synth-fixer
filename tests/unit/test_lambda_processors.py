"""Unit tests covering success and failure paths for Lambda handlers."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

LAMBDA_DIR = Path(__file__).resolve().parents[1] / "lib" / "lambda"


def _load_lambda_module(name: str):
    module_path = LAMBDA_DIR / f"{name}.py"
    spec = importlib.util.spec_from_file_location(f"tests_lambda_{name}", module_path)
    module = importlib.util.module_from_spec(spec)
    loader = spec.loader
    assert loader is not None
    loader.exec_module(module)
    return module


class StubSqsClient:
    def __init__(self, should_raise: bool = False):
        self.should_raise = should_raise
        self.messages = []

    def send_message(self, **kwargs):
        if self.should_raise:
            raise RuntimeError("SQS failure")
        self.messages.append(kwargs)
        return {"MessageId": "msg-123"}


class StubTable:
    def __init__(self, should_raise: bool = False):
        self.should_raise = should_raise
        self.items = []

    def put_item(self, *, Item):
        if self.should_raise:
            raise RuntimeError("Dynamo failure")
        self.items.append(Item)
        return {"ResponseMetadata": {"HTTPStatusCode": 200}}


class StubDynamoResource:
    def __init__(self, table: StubTable):
        self._table = table

    def Table(self, _name):  # noqa: N802
        return self._table


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


def test_stripe_processor_success(monkeypatch):
    module = _load_lambda_module("stripe_processor")
    stub = StubSqsClient()
    module.sqs_client = stub
    monkeypatch.setenv("QUEUE_URL", "https://example.com/stripe-queue")

    event = {"body": json.dumps({"id": "evt_stripe", "type": "payment_succeeded"})}
    result = module.lambda_handler(event, None)
    assert result["statusCode"] == 200
    assert stub.messages


def test_paypal_processor_handles_sqs_failure(monkeypatch):
    module = _load_lambda_module("paypal_processor")
    monkeypatch.setenv("QUEUE_URL", "https://example.com/queue")
    module.sqs_client = StubSqsClient(should_raise=True)

    event = {"body": json.dumps({"id": "evt-paypal-1", "event_type": "PAYMENT.SALE"})}

    result = module.lambda_handler(event, None)
    assert result["statusCode"] == 500
    assert "SQS failure" in result["body"]


def test_paypal_processor_success(monkeypatch):
    module = _load_lambda_module("paypal_processor")
    module.sqs_client = StubSqsClient()
    monkeypatch.setenv("QUEUE_URL", "https://example.com/queue")

    event = {"body": json.dumps({"id": "evt-paypal-2", "event_type": "PAYMENT.SALE"})}
    result = module.lambda_handler(event, None)
    assert result["statusCode"] == 200
    assert module.sqs_client.messages


def test_square_processor_returns_error_on_empty_payload(monkeypatch):
    module = _load_lambda_module("square_processor")
    monkeypatch.setenv("QUEUE_URL", "https://example.com/queue")

    result = module.lambda_handler({}, None)
    assert result["statusCode"] == 500
    assert "Empty webhook payload" in result["body"]


def test_square_processor_success(monkeypatch):
    module = _load_lambda_module("square_processor")
    module.sqs_client = StubSqsClient()
    monkeypatch.setenv("QUEUE_URL", "https://example.com/queue")

    event = {"body": json.dumps({"event_id": "evt-square-1", "type": "payment"})}
    result = module.lambda_handler(event, None)
    assert result["statusCode"] == 200
    assert module.sqs_client.messages


def test_sqs_consumer_success(monkeypatch):
    module = _load_lambda_module("sqs_consumer")
    table = StubTable()
    module.dynamodb = StubDynamoResource(table)
    monkeypatch.setenv("TABLE_NAME", "webhook-events")

    event = {
        "Records": [
            {
                "body": json.dumps(
                    {
                        "eventId": "evt-1",
                        "timestamp": 1234567890,
                        "provider": "stripe",
                        "type": "test",
                        "payload": "{}",
                    }
                ),
                "attributes": {"ApproximateFirstReceiveTimestamp": "1700000000000"},
            }
        ]
    }

    result = module.lambda_handler(event, None)
    assert result["statusCode"] == 200
    assert table.items


def test_sqs_consumer_raises_on_dynamo_failure(monkeypatch):
    module = _load_lambda_module("sqs_consumer")
    module.dynamodb = StubDynamoResource(StubTable(should_raise=True))
    monkeypatch.setenv("TABLE_NAME", "webhook-events")

    event = {
        "Records": [
            {
                "body": json.dumps(
                    {
                        "eventId": "evt-err",
                        "timestamp": 123,
                        "provider": "stripe",
                        "type": "test",
                        "payload": "{}",
                    }
                ),
                "attributes": {"ApproximateFirstReceiveTimestamp": "0"},
            }
        ]
    }

    with pytest.raises(RuntimeError):
        module.lambda_handler(event, None)


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
