"""Unit tests covering success and failure paths for Lambda handlers."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

LAMBDA_DIR = Path(__file__).resolve().parents[2] / "lib" / "lambda"


def _load_lambda_module(name: str):
    module_path = LAMBDA_DIR / f"{name}.py"
    spec = importlib.util.spec_from_file_location(f"tests_lambda_{name}", module_path)
    module = importlib.util.module_from_spec(spec)
    loader = spec.loader
    assert loader is not None
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
