"""
Lambda function handler for dynamic content requests.
Provides a REST API endpoint that returns current timestamp and request information.
"""

import json
import boto3
import os
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    """
    Lambda function handler for dynamic content requests.
    Returns a JSON response with current timestamp and request information.

    Args:
        event: AWS Lambda event object
        context: AWS Lambda context object

    Returns:
        dict: HTTP response with status code, headers, and body
    """
    try:
        # Get the website bucket name from environment variables
        website_bucket = os.environ.get("WEBSITE_BUCKET")

        if not website_bucket:
            logger.error("WEBSITE_BUCKET environment variable not set")
            raise ValueError("WEBSITE_BUCKET environment variable is required")

        # Create S3 client
        s3_client = boto3.client("s3")

        # Get current timestamp
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Prepare response data
        response_data = {
            "message": "Hello from Lambda!",
            "timestamp": current_time,
            "request_id": context.aws_request_id,
            "function_name": context.function_name,
            "function_version": context.function_version,
            "website_bucket": website_bucket,
            "region": os.environ.get("AWS_REGION"),
            "event": {
                "httpMethod": event.get("httpMethod"),
                "path": event.get("path"),
                "queryStringParameters": event.get("queryStringParameters"),
                "headers": event.get("headers", {}),
            },
        }

        logger.info(f"Successfully processed request: {context.aws_request_id}")

        # Return successful response
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Cache-Control": "no-cache",
            },
            "body": json.dumps(response_data, indent=2),
        }

    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(
                {
                    "error": "Bad Request",
                    "message": str(ve),
                    "request_id": context.aws_request_id if context else None,
                },
                indent=2,
            ),
        }

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        # Return error response
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(
                {
                    "error": "Internal Server Error",
                    "message": "An unexpected error occurred",
                    "request_id": context.aws_request_id if context else None,
                },
                indent=2,
            ),
        }
