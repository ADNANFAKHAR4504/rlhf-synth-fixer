"""
Lambda function handler for serverless API
Includes custom metrics and proper error handling
"""

import json
import logging
import os
import time
import boto3
from datetime import datetime

# Configure logging
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logging.basicConfig(level=getattr(logging, log_level))
logger = logging.getLogger(__name__)

# Initialize CloudWatch client for custom metrics
cloudwatch = boto3.client('cloudwatch')

def put_custom_metric(metric_name, value, unit='Count'):
    """Put custom metric to CloudWatch"""
    try:
        cloudwatch.put_metric_data(
            Namespace='AWS/Lambda/Custom',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        logger.error(f"Failed to put custom metric: {e}")

def lambda_handler(event, context):
    """
    Main Lambda handler function
    Processes HTTP requests from API Gateway
    """
    start_time = time.time()

    try:
        # Log the incoming event
        logger.info(f"Received event: {json.dumps(event, default=str)}")

        # Extract HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        query_params = event.get('queryStringParameters') or {}

        # Process the request based on HTTP method
        if http_method == 'GET':
            response_body = handle_get_request(path, query_params)
        elif http_method == 'POST':
            body = event.get('body', '{}')
            response_body = handle_post_request(path, body)
        else:
            response_body = {
                'message': f'HTTP method {http_method} not supported',
                'supported_methods': ['GET', 'POST']
            }

        # Calculate execution time
        execution_time = (time.time() - start_time) * 1000  # Convert to milliseconds

        # Send custom metrics
        put_custom_metric('ExecutionTime', execution_time, 'Milliseconds')
        put_custom_metric('SuccessfulRequests', 1)

        # Return successful response
        response = {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps({
                'data': response_body,
                'execution_time_ms': round(execution_time, 2),
                'timestamp': datetime.utcnow().isoformat(),
                'environment': os.environ.get('ENVIRONMENT', 'unknown')
            })
        }

        logger.info(f"Request processed successfully in {execution_time:.2f}ms")
        return response

    except Exception as e:
        # Calculate execution time for error case
        execution_time = (time.time() - start_time) * 1000

        # Log the error
        logger.error(f"Error processing request: {str(e)}", exc_info=True)

        # Send error metrics
        put_custom_metric('ErrorRequests', 1)
        put_custom_metric('ExecutionTime', execution_time, 'Milliseconds')

        # Return error response
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'execution_time_ms': round(execution_time, 2),
                'timestamp': datetime.utcnow().isoformat()
            })
        }

def handle_get_request(path, query_params):
    """Handle GET requests"""
    if path == '/' or path == '':
        return {
            'message': 'Welcome to the Serverless API',
            'version': '1.0.0',
            'endpoints': {
                '/': 'This endpoint',
                '/health': 'Health check endpoint',
                '/echo': 'Echo query parameters'
            }
        }
    elif path == '/health':
        return {
            'status': 'healthy',
            'service': 'serverless-api',
            'timestamp': datetime.utcnow().isoformat()
        }
    elif path == '/echo':
        return {
            'message': 'Echo endpoint',
            'query_parameters': query_params,
            'method': 'GET'
        }
    else:
        return {
            'message': f'Endpoint {path} not found',
            'available_endpoints': ['/', '/health', '/echo']
        }

def handle_post_request(path, body):
    """Handle POST requests"""
    try:
        request_data = json.loads(body) if body else {}
    except json.JSONDecodeError:
        request_data = {'raw_body': body}

    if path == '/echo':
        return {
            'message': 'Echo endpoint',
            'received_data': request_data,
            'method': 'POST'
        }
    else:
        return {
            'message': f'POST endpoint {path} not found',
            'received_data': request_data,
            'available_post_endpoints': ['/echo']
        }