"""Lambda function for health checks."""

import json
import os
import boto3

# Initialize AWS clients
dynamodb = boto3.resource("dynamodb")

# Environment variables
DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "dev")


def handler(event, context):
    """
    Perform health check on infrastructure components.

    Checks DynamoDB table accessibility and returns health status.
    """
    try:
        health_status = {"environment": ENVIRONMENT, "status": "healthy", "checks": {}}

        # Check DynamoDB table
        try:
            table = dynamodb.Table(DYNAMODB_TABLE)
            table.table_status
            health_status["checks"]["dynamodb"] = "healthy"
        except Exception as e:
            health_status["checks"]["dynamodb"] = f"unhealthy: {str(e)}"
            health_status["status"] = "degraded"

        return {
            "statusCode": 200 if health_status["status"] == "healthy" else 503,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(health_status),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"status": "unhealthy", "error": str(e)}),
        }
