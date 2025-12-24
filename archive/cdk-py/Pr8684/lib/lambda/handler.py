import json
import os

import boto3
from botocore.exceptions import ClientError


def handler(event, context):
    """
    Lambda function handler for the /item GET endpoint.

    This function demonstrates DynamoDB integration by:
    1. Reading the table name from environment variables
    2. Attempting to put a sample item in DynamoDB
    3. Returning a success response with item details
    """

    try:
        # Get table name from environment variable
        table_name = os.environ.get("TABLE_NAME")
        if not table_name:
            raise ValueError("TABLE_NAME environment variable not set")

        # Initialize DynamoDB client lazily
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(table_name)

        # Create a sample item to demonstrate functionality
        item_id = f"item_{context.aws_request_id}"
        sample_item = {
            "itemId": item_id,
            "timestamp": context.aws_request_id,
            "message": "Hello from Lambda with DynamoDB integration!",
        }

        # Put item into DynamoDB table
        table.put_item(Item=sample_item)

        # Return successful response
        response = {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",  # CORS support
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            "body": json.dumps(
                {
                    "message": "Item successfully created and stored in DynamoDB",
                    "itemId": item_id,
                    "tableName": table_name,
                }
            ),
        }

        return response

    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(
                {"error": "Database operation failed", "message": str(e)}
            ),
        }
    except ValueError as e:
        print(f"Configuration error: {e}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": "Configuration error", "message": str(e)}),
        }
    except Exception as e:
        print(f"Unexpected error: {e}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": "Internal server error", "message": str(e)}),
        }
