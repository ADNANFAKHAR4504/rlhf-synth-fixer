import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients lazily to avoid import issues
s3_client = None

def get_s3_client():
    """Lazy initialization of S3 client"""
    global s3_client
    if s3_client is None:
        try:
            import boto3
            s3_client = boto3.client('s3')
        except Exception as e:
            logger.warning(f"Failed to initialize S3 client: {e}")
            s3_client = False  # Mark as failed to avoid retrying
    return s3_client if s3_client is not False else None

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function handler for API Gateway proxy integration.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response format
    """
    
    # Log the incoming event (truncated for security)
    try:
        event_summary = {
            'httpMethod': event.get('httpMethod'),
            'path': event.get('path'),
            'hasHeaders': bool(event.get('headers')),
            'hasBody': bool(event.get('body')),
            'stage': event.get('requestContext', {}).get('stage')
        }
        logger.info(f"Received event summary: {json.dumps(event_summary)}")
    except Exception as e:
        logger.warning(f"Failed to log event summary: {e}")
    
    # Validate event structure
    if not isinstance(event, dict):
        logger.error(f"Invalid event type: {type(event)}")
        return create_error_response("Invalid event format", 400)
    
    # Get headers safely
    headers = event.get('headers') or {}
    if not isinstance(headers, dict):
        logger.warning("Headers is not a dict, creating empty dict")
        headers = {}
    
    # Get origin from request headers for CORS (case-insensitive)
    origin = None
    for key, value in headers.items():
        if key and key.lower() == 'origin':
            origin = value
            break
    
    allowed_origins = ['https://yourdomain.com', 'https://app.yourdomain.com']
    
    # Determine CORS origin
    cors_origin = origin if origin in allowed_origins else 'https://yourdomain.com'
    
    try:
        # Extract request information safely
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        query_params = event.get('queryStringParameters') or {}
        body = event.get('body')
        
        logger.info(f"Processing {http_method} request to {path}")
        
        # Parse body if present
        request_body = None
        if body:
            try:
                request_body = json.loads(body)
            except json.JSONDecodeError as e:
                logger.info(f"Body is not JSON, treating as string: {e}")
                request_body = body
        
        # Log request details to S3 (optional, non-blocking)
        try:
            log_request_to_s3(event, context)
        except Exception as s3_error:
            logger.warning(f"S3 logging failed (non-critical): {s3_error}")
        
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
            'headers': create_cors_headers(cors_origin),
            'body': json.dumps({
                'success': True,
                'data': response_data,
                'timestamp': datetime.utcnow().isoformat(),
                'stage': os.environ.get('STAGE', 'unknown'),
                'request_id': getattr(context, 'aws_request_id', 'unknown')
            })
        }
        
        logger.info(f"Returning successful response: {response['statusCode']}")
        return response
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        
        # Return detailed error for debugging (but sanitized)
        error_message = str(e) if len(str(e)) < 200 else "Internal server error"
        
        return {
            'statusCode': 500,
            'headers': create_cors_headers(cors_origin),
            'body': json.dumps({
                'success': False,
                'error': error_message,
                'error_type': type(e).__name__,
                'timestamp': datetime.utcnow().isoformat(),
                'stage': os.environ.get('STAGE', 'unknown'),
                'request_id': getattr(context, 'aws_request_id', 'unknown')
            })
        }

def create_cors_headers(cors_origin: str) -> Dict[str, str]:
    """Create consistent CORS headers"""
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': cors_origin,
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin',
    }

def create_error_response(error_message: str, status_code: int = 500) -> Dict[str, Any]:
    """Create a standardized error response"""
    return {
        'statusCode': status_code,
        'headers': create_cors_headers('https://yourdomain.com'),
        'body': json.dumps({
            'success': False,
            'error': error_message,
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
    This function is non-critical and should not cause the main function to fail.
    """
    try:
        logs_bucket = os.environ.get('LOGS_BUCKET')
        if not logs_bucket:
            logger.info("LOGS_BUCKET environment variable not set, skipping S3 logging")
            return
        
        # Get S3 client (may be None if initialization failed)
        client = get_s3_client()
        if not client:
            logger.info("S3 client not available, skipping S3 logging")
            return
        
        # Create simplified log entry (avoid including full event for security)
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'request_id': getattr(context, 'aws_request_id', 'unknown'),
            'function_name': getattr(context, 'function_name', 'unknown'),
            'http_method': event.get('httpMethod', 'unknown'),
            'path': event.get('path', '/'),
            'user_agent': event.get('headers', {}).get('User-Agent', 'unknown'),
            'source_ip': event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown'),
            'remaining_time_ms': getattr(context, 'get_remaining_time_in_millis', lambda: 0)()
        }
        
        # Create S3 key with date partitioning
        now = datetime.utcnow()
        request_id = getattr(context, 'aws_request_id', 'unknown')
        s3_key = f"api-logs/year={now.year}/month={now.month:02d}/day={now.day:02d}/{request_id}.json"
        
        # Upload to S3 with timeout
        client.put_object(
            Bucket=logs_bucket,
            Key=s3_key,
            Body=json.dumps(log_entry, default=str),
            ContentType='application/json'
        )
        
        logger.info(f"Request logged to S3: s3://{logs_bucket}/{s3_key}")
        
    except Exception as e:
        logger.warning(f"Failed to log request to S3 (non-critical): {str(e)}")
        # Don't raise exception as this is not critical to the main function
