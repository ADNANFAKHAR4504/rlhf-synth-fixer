#!/usr/bin/env python3
"""
Lambda function handler for TAP API.

This module provides the main handler function for the TAP (Test Automation Platform)
API Lambda function. It handles HTTP requests from API Gateway and returns
appropriate responses.
"""

import json
import logging
import os
from typing import Dict, Any, Optional
from datetime import datetime, timezone

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda function handler.
    
    Args:
        event: The event data from API Gateway
        context: The Lambda context object
        
    Returns:
        Dict containing the response for API Gateway
    """
    try:
        # Log the incoming event for debugging
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Extract environment variables
        environment = os.environ.get('ENVIRONMENT', 'unknown')
        log_level = os.environ.get('LOG_LEVEL', 'INFO')
        region = os.environ.get('REGION', 'unknown')
        function_name = os.environ.get('FUNCTION_NAME', 'unknown')
        
        # Parse the HTTP method, path, and headers
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        headers = event.get('headers', {})
        origin = headers.get('Origin') or headers.get('origin', '')
        
        # Log request details
        logger.info(f"Request: {http_method} {path}")
        logger.info(f"Environment: {environment}, Region: {region}, Function: {function_name}")
        
        # Handle different HTTP methods
        if http_method == 'GET':
            return handle_get_request(path, environment, origin)
        elif http_method == 'POST':
            return handle_post_request(event, environment, origin)
        elif http_method == 'PUT':
            return handle_put_request(event, environment, origin)
        elif http_method == 'DELETE':
            return handle_delete_request(path, environment, origin)
        elif http_method == 'OPTIONS':
            return handle_options_request(origin)
        else:
            return create_response(405, {'error': f'Method {http_method} not allowed'}, origin=origin)
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def handle_get_request(path: str, environment: str, origin: str = '') -> Dict[str, Any]:
    """Handle GET requests."""
    if path == '/':
        return create_response(200, {
            'message': 'TAP API is running',
            'environment': environment,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'status': 'healthy'
        })
    elif path == '/health':
        return create_response(200, {
            'status': 'healthy',
            'environment': environment,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    elif path == '/info':
        return create_response(200, {
            'service': 'TAP API',
            'version': '1.0.0',
            'environment': environment,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    else:
        return create_response(404, {'error': 'Endpoint not found'})

def handle_post_request(event: Dict[str, Any], environment: str, origin: str = '') -> Dict[str, Any]:
    """Handle POST requests."""
    try:
        body = event.get('body', '{}')
        is_base64_encoded = event.get('isBase64Encoded', False)
        
        # Handle different body formats from API Gateway
        if isinstance(body, str):
            if is_base64_encoded:
                import base64
                body = base64.b64decode(body).decode('utf-8')
            
            if body.strip():
                try:
                    body = json.loads(body)
                except json.JSONDecodeError:
                    # If it's not valid JSON, treat it as plain text
                    body = {"raw_body": body}
            else:
                body = {}
        elif isinstance(body, dict):
            # Body is already a dict
            pass
        else:
            body = {}
        
        logger.info(f"POST request body: {body}")
        
        return create_response(200, {
            'message': 'POST request processed successfully',
            'environment': environment,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'received_data': body
        })
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        return create_response(400, {'error': 'Invalid JSON in request body'})
    except Exception as e:
        logger.error(f"Error processing POST request: {e}")
        return create_response(500, {'error': 'Internal server error'})

def handle_put_request(event: Dict[str, Any], environment: str, origin: str = '') -> Dict[str, Any]:
    """Handle PUT requests."""
    try:
        body = event.get('body', '{}')
        is_base64_encoded = event.get('isBase64Encoded', False)
        
        # Handle different body formats from API Gateway
        if isinstance(body, str):
            if is_base64_encoded:
                import base64
                body = base64.b64decode(body).decode('utf-8')
            
            if body.strip():
                try:
                    body = json.loads(body)
                except json.JSONDecodeError:
                    # If it's not valid JSON, treat it as plain text
                    body = {"raw_body": body}
            else:
                body = {}
        elif isinstance(body, dict):
            # Body is already a dict
            pass
        else:
            body = {}
        
        logger.info(f"PUT request body: {body}")
        
        return create_response(200, {
            'message': 'PUT request processed successfully',
            'environment': environment,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'received_data': body
        })
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        return create_response(400, {'error': 'Invalid JSON in request body'})
    except Exception as e:
        logger.error(f"Error processing PUT request: {e}")
        return create_response(500, {'error': 'Internal server error'})

def handle_delete_request(path: str, environment: str, origin: str = '') -> Dict[str, Any]:
    """Handle DELETE requests."""
    return create_response(200, {
        'message': 'DELETE request processed successfully',
        'environment': environment,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'path': path
    })

def handle_options_request(origin: str = '') -> Dict[str, Any]:
    """Handle OPTIONS requests for CORS."""
    return create_response(200, {}, cors_headers=True, origin=origin)

def get_allowed_origin(origin: str) -> str:
    """
    Get allowed CORS origin based on request origin and environment configuration.
    
    Args:
        origin: The origin from the request headers
        
    Returns:
        Allowed origin for CORS or default secure origin
    """
    allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'https://example.com').split(',')
    allowed_origins = [origin.strip() for origin in allowed_origins]
    
    if origin in allowed_origins:
        return origin
    
    # Return first allowed origin as default (most secure)
    return allowed_origins[0] if allowed_origins else 'https://example.com'

def create_response(status_code: int, body: Dict[str, Any], cors_headers: bool = False, origin: str = None) -> Dict[str, Any]:
    """
    Create a standardized API Gateway response.
    
    Args:
        status_code: HTTP status code
        body: Response body
        cors_headers: Whether to include CORS headers
        origin: Request origin for CORS validation
        
    Returns:
        Dict containing the API Gateway response
    """
    headers = {
        'Content-Type': 'application/json'
    }
    
    if cors_headers:
        allowed_origin = get_allowed_origin(origin or '')
        headers.update({
            'Access-Control-Allow-Origin': allowed_origin,
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        })
    
    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(body, default=str)
    } 