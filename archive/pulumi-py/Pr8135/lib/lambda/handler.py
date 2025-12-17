# handler.py
import os
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger()
# Avoid double handlers in warm starts
if not logger.handlers:
  logging.basicConfig(level=logging.INFO)
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")
LOG_BUCKET = os.getenv("LOG_BUCKET_NAME", "")


def _resp(status: int, body: Any,
          headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
  base_headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
  }
  if headers:
    base_headers.update(headers)
  return {
      "statusCode": status,
      "headers": base_headers,
      "isBase64Encoded": False,
      "body": json.dumps(body, ensure_ascii=False),
  }


def _put_s3_log(payload: Dict[str, Any]) -> None:
  if not LOG_BUCKET:
    logger.warning("LOG_BUCKET_NAME env var not set; skipping S3 log")
    return
  # Key format: requests/YYYY/MM/DD/<request_id>.json
  now = datetime.now(timezone.utc)
  date_prefix = now.strftime("%Y/%m/%d")
  request_id = payload.get("context", {}).get(
      "requestId") or payload.get("request_id") or now.strftime("%H%M%S%f")
  key = f"requests/{date_prefix}/{request_id}.json"
  try:
    s3.put_object(
        Bucket=LOG_BUCKET,
        Key=key,
        Body=(
            json.dumps(
                payload,
                ensure_ascii=False,
                separators=(
                    ",",
                    ":"))).encode("utf-8"),
        ContentType="application/json",
    )
    logger.info("Wrote request log to s3://%s/%s", LOG_BUCKET, key)
  except (BotoCoreError, ClientError) as e:
    logger.exception("Failed to write request log to S3: %s", e)


def _parse_event(event: Dict[str, Any]) -> Dict[str, Any]:
  headers = event.get("headers") or {}
  req_context = event.get("requestContext") or {}
  identity = (req_context.get("identity") or {})
  # API Gateway HTTP API (v2) compatibility
  http = (req_context.get("http") or {})
  source_ip = identity.get("sourceIp") or http.get("sourceIp")
  method = event.get("httpMethod") or http.get("method") or "GET"
  path = event.get("path") or event.get("rawPath") or "/"
  qs = event.get("queryStringParameters") or {}
  try:
    body_raw = event.get("body")
    if event.get("isBase64Encoded"):
      import base64
      body_decoded = base64.b64decode(
          body_raw or b"").decode("utf-8") if body_raw else ""
    else:
      body_decoded = body_raw or ""
    body = json.loads(body_decoded) if body_decoded else None
  except Exception:
    body = body_decoded if body_decoded is not None else None

  return {
      "method": method,
      "path": path,
      "query": qs,
      "headers": headers,
      "body": body,
      "sourceIp": source_ip,
      "context": {
          "requestId": req_context.get("requestId"),
          "stage": req_context.get("stage") or (
              event.get("stageVariables") or {}).get("$default"),
          "apiId": req_context.get("apiId"),
      },
  }


def lambda_handler(event, context):
  parsed = _parse_event(event)

  # Enrich for logging
  log_record = {
      "timestamp": datetime.now(timezone.utc).isoformat(),
      "environment": os.getenv("ENVIRONMENT", ""),
      "function": {
          "name": os.getenv("AWS_LAMBDA_FUNCTION_NAME", ""),
          "version": os.getenv("AWS_LAMBDA_FUNCTION_VERSION", ""),
          "memory": os.getenv("AWS_LAMBDA_FUNCTION_MEMORY_SIZE", ""),
          "region": os.getenv("AWS_REGION", ""),
          "request_id": getattr(context, "aws_request_id", None),
      },
      "request": parsed,
  }

  logger.info("Request: %s", json.dumps(parsed, ensure_ascii=False))

  # Route handling
  path = (parsed.get("path") or "/").rstrip("/") or "/"
  method = (parsed.get("method") or "GET").upper()

  if path in ("/", "/health") and method in ("GET", "HEAD"):
    body = {
        "status": "ok",
        "time": datetime.now(timezone.utc).isoformat(),
        "region": os.getenv("AWS_REGION", ""),
    }
    log_record["response"] = {"statusCode": 200, "route": "health"}
    _put_s3_log(log_record)
    return _resp(200, body)

  if path.startswith("/echo"):
    body = {
        "message": "echo",
        "method": method,
        "query": parsed.get("query"),
        "body": parsed.get("body"),
        "path": parsed.get("path"),
        "headers": parsed.get("headers"),
    }
    log_record["response"] = {"statusCode": 200, "route": "echo"}
    _put_s3_log(log_record)
    return _resp(200, body)

  if path.startswith("/info"):
    body = {
        "environment": os.getenv("ENVIRONMENT", ""),
        "function_name": os.getenv("AWS_LAMBDA_FUNCTION_NAME", ""),
        "function_version": os.getenv("AWS_LAMBDA_FUNCTION_VERSION", ""),
        "memory": os.getenv("AWS_LAMBDA_FUNCTION_MEMORY_SIZE", ""),
        "region": os.getenv("AWS_REGION", ""),
        "log_bucket": LOG_BUCKET,
    }
    log_record["response"] = {"statusCode": 200, "route": "info"}
    _put_s3_log(log_record)
    return _resp(200, body)

  # Default handler
  body = {
      "message": "TAP Lambda says hello",
      "path": parsed.get("path"),
      "method": method,
  }
  log_record["response"] = {"statusCode": 200, "route": "default"}
  _put_s3_log(log_record)
  return _resp(200, body)
