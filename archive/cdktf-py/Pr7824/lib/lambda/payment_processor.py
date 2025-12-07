"""Payment processor Lambda function handler."""

import json
import os
import boto3
from datetime import datetime, timedelta
from typing import Dict, Any

# Initialize AWS clients
dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")
secrets_manager = boto3.client("secretsmanager")

# Environment variables
DYNAMODB_TABLE = os.environ["DYNAMODB_TABLE"]
S3_BUCKET = os.environ["S3_BUCKET"]
DB_SECRET_NAME = os.environ["DB_SECRET_NAME"]
ENVIRONMENT = os.environ["ENVIRONMENT"]


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process payment requests.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        payment_id = body.get("paymentId")
        user_id = body.get("userId")
        amount = body.get("amount")

        if not all([payment_id, user_id, amount]):
            return {
                "statusCode": 400,
                "body": json.dumps(
                    {"error": "Missing required fields: paymentId, userId, amount"}
                ),
            }

        # Store session in DynamoDB
        table = dynamodb.Table(DYNAMODB_TABLE)
        session_id = f"session-{payment_id}"
        expires_at = int((datetime.utcnow() + timedelta(hours=24)).timestamp())

        table.put_item(
            Item={
                "sessionId": session_id,
                "userId": user_id,
                "paymentId": payment_id,
                "amount": str(amount),
                "status": "processing",
                "createdAt": datetime.utcnow().isoformat(),
                "expiresAt": expires_at,
            }
        )

        # Log transaction to S3
        transaction_log = {
            "paymentId": payment_id,
            "userId": user_id,
            "amount": amount,
            "timestamp": datetime.utcnow().isoformat(),
            "environment": ENVIRONMENT,
            "status": "initiated",
        }

        s3.put_object(
            Bucket=S3_BUCKET,
            Key=f"transactions/{payment_id}.json",
            Body=json.dumps(transaction_log),
            ContentType="application/json",
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "message": "Payment processing initiated",
                    "paymentId": payment_id,
                    "sessionId": session_id,
                }
            ),
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Internal server error"}),
        }
