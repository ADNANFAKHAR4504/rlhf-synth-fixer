"""Lambda function for processing healthcare data."""

import json
import os
import boto3
from datetime import datetime

# Initialize AWS clients
s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

# Environment variables
DATA_BUCKET = os.environ.get("DATA_BUCKET")
DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "dev")


def handler(event, context):
    """
    Process healthcare data from API Gateway.

    Validates patient data, stores in DynamoDB, and archives in S3.
    """
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))

        # Validate required fields
        patient_id = body.get("patient_id")
        patient_name = body.get("patient_name")
        medical_record = body.get("medical_record")

        if not all([patient_id, patient_name, medical_record]):
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps(
                    {
                        "error": "Missing required fields: patient_id, patient_name, medical_record"
                    }
                ),
            }

        # Store in DynamoDB
        table = dynamodb.Table(DYNAMODB_TABLE)
        timestamp = datetime.utcnow().isoformat()

        item = {
            "patient_id": patient_id,
            "patient_name": patient_name,
            "medical_record": medical_record,
            "created_at": timestamp,
            "updated_at": timestamp,
            "environment": ENVIRONMENT,
        }

        table.put_item(Item=item)

        # Archive to S3
        s3_key = f"patient-records/{patient_id}/{timestamp}.json"
        s3_client.put_object(
            Bucket=DATA_BUCKET,
            Key=s3_key,
            Body=json.dumps(item),
            ServerSideEncryption="AES256",
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "message": "Patient data processed successfully",
                    "patient_id": patient_id,
                    "s3_location": f"s3://{DATA_BUCKET}/{s3_key}",
                }
            ),
        }

    except Exception as e:
        print(f"Error processing patient data: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Internal server error", "message": str(e)}),
        }
