import json
import logging
import boto3
from botocore.exceptions import ClientError
import os

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize Secrets Manager client
secrets_client = boto3.client('secretsmanager', region_name='us-east-1')

def get_secret_value(secret_name: str) -> dict:
  """
  Retrieve secret value from AWS Secrets Manager

  Args:
      secret_name (str): Name of the secret to retrieve

  Returns:
      dict: Secret value as dictionary
  """
  try:
    response = secrets_client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])
  except ClientError as e:
    logger.error("Error retrieving secret %s: %s", secret_name, str(e))
    raise e
  except json.JSONDecodeError as e:
    logger.error("Error parsing secret JSON: %s", str(e))
    raise e

def lambda_handler(event, context):
  """
  Main Lambda handler function

  Args:
      event: API Gateway event object
      context: Lambda context object

  Returns:
      dict: HTTP response object
  """
  try:
    # Log the incoming request payload
    logger.info("Received event payload:")
    logger.info(json.dumps(event, indent=2, default=str))

    # Retrieve configuration from Secrets Manager
    secret_name = os.environ.get('SECRET_NAME')
    if not secret_name:
      raise ValueError("SECRET_NAME environment variable not set")

    logger.info("Retrieving configuration from secret: %s", secret_name)
    config = get_secret_value(secret_name)

    # Log successful configuration retrieval (without exposing sensitive data)
    logger.info("Successfully retrieved configuration from Secrets Manager")
    logger.info("Configuration keys available: %s", list(config.keys()))

    # Process the request
    http_method = event.get('requestContext', {}).get('http', {}).get('method', 'UNKNOWN')
    path = event.get('requestContext', {}).get('http', {}).get('path', '/')
    source_ip = event.get('requestContext', {}).get('http', {}).get('sourceIp', 'unknown')

    logger.info("Processing %s request to %s from %s", http_method, path, source_ip)

    # Prepare response
    response_body = {
      "message": "Request processed successfully",
      "method": http_method,
      "path": path,
      "timestamp": context.aws_request_id,
      "config_loaded": True,
      "available_config_keys": list(config.keys())
    }

    return {
      "statusCode": 200,
      "headers": {
        "Content-Type": "application/json",
        "X-Request-ID": context.aws_request_id
      },
      "body": json.dumps(response_body, indent=2)
    }

  except Exception as e:
    logger.error("Error processing request: %s", str(e))

    error_response = {
      "error": "Internal server error",
      "message": "Failed to process request",
      "request_id": context.aws_request_id
    }

    return {
      "statusCode": 500,
      "headers": {
        "Content-Type": "application/json",
        "X-Request-ID": context.aws_request_id
      },
      "body": json.dumps(error_response)
    }
