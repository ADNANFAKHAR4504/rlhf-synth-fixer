import json
import logging
import boto3
import os
from datetime import datetime
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function handler for API Gateway proxy integration.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response format
    """
    
    # Log the incoming request
    logger.info(f"Received event: {json.dumps(event, default=str)}")
    
    # Get origin from request headers for CORS
    origin = event.get('headers', {}).get('Origin') or event.get('headers', {}).get('origin')
    allowed_origins = ['https://yourdomain.com', 'https://app.yourdomain.com']
    
    # Determine CORS origin
    cors_origin = origin if origin in allowed_origins else 'https://yourdomain.com'
    
    try:
        # Extract request information
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        query_params = event.get('queryStringParameters') or {}
        headers = event.get('headers', {})
        body = event.get('body')
        
        # Parse body if present
        request_body = None
        if body:
            try:
                request_body = json.loads(body)
            except json.JSONDecodeError:
                request_body = body
        
        # Log request details to S3 (optional)
        log_request_to_s3(event, context)
        
        # Handle different HTTP methods
        if http_method == 'GET':
            response_data = handle_get_request(path, query_params)
        elif http_method == 'POST':
            response_data = handle_post_request(path, request_body)
        elif http_method == 'PUT':
            response_data = handle_put_request(path, request_body)
        elif http_method == 'DELETE':
            response_data = handle_delete_request(path)
        else:
            response_data = {
                'error': f'Method {http_method} not supported',
                'supported_methods': ['GET', 'POST', 'PUT', 'DELETE']
            }
        
        # Prepare successful response with improved CORS
        response = {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': cors_origin,
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Allow-Credentials': 'true',
                'Vary': 'Origin',
            },
            'body': json.dumps({
                'success': True,
                'data': response_data,
                'timestamp': datetime.utcnow().isoformat(),
                'stage': os.environ.get('STAGE', 'unknown')
            })
        }
        
        logger.info(f"Returning response: {response['statusCode']}")
        return response
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        
        # Return error response with improved CORS
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': cors_origin,
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Allow-Credentials': 'true',
                'Vary': 'Origin',
            },
            'body': json.dumps({
                'success': False,
                'error': 'Internal server error',
                'timestamp': datetime.utcnow().isoformat(),
                'stage': os.environ.get('STAGE', 'unknown')
            })
        }

def handle_get_request(path: str, query_params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle GET requests."""
    return {
        'message': 'GET request processed successfully',
        'path': path,
        'query_parameters': query_params,
        'method': 'GET'
    }

def handle_post_request(path: str, body: Any) -> Dict[str, Any]:
    """Handle POST requests."""
    return {
        'message': 'POST request processed successfully',
        'path': path,
        'received_data': body,
        'method': 'POST'
    }

def handle_put_request(path: str, body: Any) -> Dict[str, Any]:
    """Handle PUT requests."""
    return {
        'message': 'PUT request processed successfully',
        'path': path,
        'received_data': body,
        'method': 'PUT'
    }

def handle_delete_request(path: str) -> Dict[str, Any]:
    """Handle DELETE requests."""
    return {
        'message': 'DELETE request processed successfully',
        'path': path,
        'method': 'DELETE'
    }

def log_request_to_s3(event: Dict[str, Any], context: Any) -> None:
    """
    Log request details to S3 bucket for audit purposes.
    """
    try:
        logs_bucket = os.environ.get('LOGS_BUCKET')
        if not logs_bucket:
            logger.warning("LOGS_BUCKET environment variable not set")
            return
        
        # Create log entry
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'request_id': context.aws_request_id,
            'function_name': context.function_name,
            'event': event,
            'remaining_time_ms': context.get_remaining_time_in_millis()
        }
        
        # Create S3 key with date partitioning
        now = datetime.utcnow()
        s3_key = f"api-logs/year={now.year}/month={now.month:02d}/day={now.day:02d}/{context.aws_request_id}.json"
        
        # Upload to S3
        s3_client.put_object(
            Bucket=logs_bucket,
            Key=s3_key,
            Body=json.dumps(log_entry, default=str),
            ContentType='application/json'
        )
        
        logger.info(f"Request logged to S3: s3://{logs_bucket}/{s3_key}")
        
    except Exception as e:
        logger.error(f"Failed to log request to S3: {str(e)}")
        # Don't raise exception as this is not critical to the main function
