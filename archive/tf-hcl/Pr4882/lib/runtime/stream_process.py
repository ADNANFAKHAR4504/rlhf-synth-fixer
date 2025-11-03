# lambda_function.py
import os
import json
import base64
import logging
import boto3
from decimal import Decimal
from datetime import datetime
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.getenv("DYNAMODB_TABLE") or os.getenv("TABLE_NAME")
if not TABLE_NAME:
    raise RuntimeError("Missing env var: DYNAMODB_TABLE or TABLE_NAME")
table = dynamodb.Table(TABLE_NAME)

REQUIRED_FIELDS = ("userId", "timestamp", "eventType")

def _to_unix_seconds(value) -> int:
    """
    Converts various timestamp formats to integer Unix seconds.
    Accepts ISO8601, epoch ms/sec, or datetime.
    """
    if isinstance(value, (int, float)):
        # If looks like milliseconds (e.g., > 10^12)
        return int(value / 1000) if value > 1e11 else int(value)
    if isinstance(value, str):
        try:
            # Try to parse ISO8601
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return int(dt.timestamp())
        except Exception:
            # Try to interpret as numeric string
            f = float(value)
            return int(f / 1000) if f > 1e11 else int(f)
    if isinstance(value, datetime):
        return int(value.timestamp())
    raise ValueError(f"Invalid timestamp format: {value}")

def _prepare_item(payload: dict) -> dict:
    missing = [f for f in REQUIRED_FIELDS if f not in payload]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")

    timestamp_unix = _to_unix_seconds(payload["timestamp"])

    item = {
        "userId": str(payload["userId"]),
        "timestamp": Decimal(str(timestamp_unix)),  # store as DynamoDB Number
        "eventType": str(payload["eventType"]),
    }

    for k, v in payload.items():
        if k in item:
            continue
        if isinstance(v, float):
            item[k] = Decimal(str(v))
        elif isinstance(v, (int, str, bool, Decimal)) or v is None:
            item[k] = v
        elif isinstance(v, (list, dict)):
            item[k] = json.loads(json.dumps(v), parse_float=Decimal)
        else:
            item[k] = str(v)

    return item

def _put_item_idempotent(item: dict):
    try:
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
            ExpressionAttributeNames={"#pk": "userId", "#sk": "timestamp"},
        )
        return True, None
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            return True, "duplicate"
        return False, str(e)

def lambda_handler(event, context):
    total = success = duplicates = failures = 0
    errors = []

    for rec in event.get("Records", []):
        total += 1
        try:
            raw = base64.b64decode(rec["kinesis"]["data"])
            payload = json.loads(raw)
            item = _prepare_item(payload)

            ok, note = _put_item_idempotent(item)
            if ok:
                success += 1
                if note == "duplicate":
                    duplicates += 1
            else:
                failures += 1
                errors.append({"reason": note, "payload": payload})
        except Exception as e:
            failures += 1
            errors.append({
                "reason": str(e),
                "partitionKey": rec["kinesis"].get("partitionKey"),
                "sequenceNumber": rec["kinesis"].get("sequenceNumber"),
            })

    logger.info(
        json.dumps({
            "ingest_summary": {
                "table": TABLE_NAME,
                "total": total,
                "success": success,
                "duplicates": duplicates,
                "failures": failures
            }
        })
    )

    return {
        "statusCode": 200 if failures == 0 else 207,
        "body": {
            "table": TABLE_NAME,
            "total": total,
            "success": success,
            "duplicates": duplicates,
            "failures": failures,
            "errors": errors[:10],
        },
    }
