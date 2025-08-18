"""
AWS Lambda function handler for serverless web application
Provides basic API responses and demonstrates serverless functionality
"""

import json
import logging
import os
from datetime import UTC, datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))


def lambda_handler(event, context):
  """
  AWS Lambda handler function

  Args:
    event: API Gateway event object
    context: Lambda context object

  Returns:
    dict: HTTP response object
  """
  try:
    # Log the incoming event for debugging
    logger.info("Received event: %s", json.dumps(event, default=str))

    # Extract request information
    http_method = event.get('httpMethod', 'UNKNOWN')
    path = event.get('path', '/')
    query_params = event.get('queryStringParameters') or {}
    headers = event.get('headers') or {}

    # Get environment information
    environment = os.environ.get('ENVIRONMENT', 'unknown')

    # Create response data
    response_data = {
      "message": "Hello from your serverless application!",
      "timestamp": datetime.now(UTC).isoformat(),
      "environment": environment,
      "request_info": {
        "method": http_method,
        "path": path,
        "query_parameters": query_params,
        "user_agent": headers.get('User-Agent', 'Unknown')
      },
      "lambda_info": {
        "function_name": context.function_name,
        "function_version": context.function_version,
        "request_id": context.aws_request_id,
        "memory_limit": context.memory_limit_in_mb
      }
    }

    # Handle different paths
    if path == '/health':
      response_data["status"] = "healthy"
      response_data["message"] = "Service is running normally"
    elif path == '/info':
      response_data["message"] = "Serverless application information"

    # Create HTTP response
    response = {
      "statusCode": 200,
      "headers": {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": ("GET, POST, PUT, DELETE, "
                                         "OPTIONS"),
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      "body": json.dumps(response_data, indent=2)
    }

    logger.info("Returning response with status code: %s",
                response['statusCode'])
    return response

  except (KeyError, TypeError, AttributeError) as exc:
    logger.error("Error processing request: %s", str(exc), exc_info=True)

    # Return error response
    error_response = {
      "statusCode": 500,
      "headers": {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      "body": json.dumps({
        "error": "Internal server error",
        "message": "An unexpected error occurred",
        "timestamp": datetime.now(UTC).isoformat(),
        "request_id": context.aws_request_id if context else "unknown"
      })
    }

    return error_response
  except Exception as exc:  # pylint: disable=broad-exception-caught
    # Keep a broad catch as fallback, but disable the warning with comment
    logger.error("Unexpected error processing request: %s",
                 str(exc), exc_info=True)

    error_response = {
      "statusCode": 500,
      "headers": {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      "body": json.dumps({
        "error": "Internal server error",
        "message": "An unexpected error occurred",
        "timestamp": datetime.now(UTC).isoformat(),
        "request_id": context.aws_request_id if context else "unknown"
      })
    }

    return error_response


def health_check():
  """
  Simple health check function for testing

  Returns:
    dict: Health status
  """
  return {
    "status": "healthy",
    "timestamp": datetime.now(UTC).isoformat(),
    "service": "serverless-web-app"
  }


def handle_options():
  """
  Handle CORS preflight OPTIONS requests

  Returns:
    dict: CORS response
  """
  return {
    "statusCode": 200,
    "headers": {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    },
    "body": ""
  }
