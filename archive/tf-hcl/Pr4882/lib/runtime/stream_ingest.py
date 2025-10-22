# ingest_single.py
import os
import json
import base64
import boto3

kinesis = boto3.client("kinesis")
STREAM_NAME = os.environ["STREAM_NAME"]

REQUIRED_FIELDS = ("userId", "timestamp", "eventType")

def handler(event, context):
    # --- Health check fast-path ---
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    path = event.get("path") or event.get("rawPath") or "/"
    method = (event.get("httpMethod") or headers.get(":method") or "GET").upper()
    ua = headers.get("user-agent", "")

    if path == "/health" or "ELB-HealthChecker" in ua:
        return _resp(200, {"status": "ok"})

    # --- Normal ingest path ---
    body = event.get("body") or ""
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode("utf-8")

    # Parse JSON
    try:
        payload = json.loads(body)
    except Exception as e:
        return _resp(400, {"error": f"Invalid JSON: {str(e)}"})

    if not isinstance(payload, dict):
        return _resp(400, {"error": "Payload must be a single JSON object"})

    # Minimal validation of Dynamo fields
    missing = [f for f in REQUIRED_FIELDS if f not in payload]
    if missing:
        return _resp(400, {"error": f"Missing required fields: {missing}"})

    # Partition key: prefer userId
    partition_key = str(payload.get("userId"))

    data_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    if len(data_bytes) > 1024 * 1024:  # 1 MB per Kinesis record
        return _resp(413, {"error": "Payload too large (>1MB)"})
    try:
        resp = kinesis.put_record(
            StreamName=os.environ["STREAM_NAME"],
            Data=data_bytes,
            PartitionKey=partition_key,
        )
        return _resp(200, {"message": "ok", "sequenceNumber": resp["SequenceNumber"]})
    except (ClientError, BotoCoreError) as e:
        print(f"Kinesis error: {e}")
        return _resp(500, {"error": "Kinesis put_record failed", "detail": str(e)})

def _resp(status, body):
    return {
        "statusCode": status,
        "isBase64Encoded": False,
        "headers": {"content-type": "application/json"},
        "body": json.dumps(body),
    }
