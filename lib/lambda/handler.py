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
from datetime import datetime

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
        
        # Parse the HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        # Log request details
        logger.info(f"Request: {http_method} {path}")
        logger.info(f"Environment: {environment}, Region: {region}, Function: {function_name}")
        
        # Handle different HTTP methods
        if http_method == 'GET':
            return handle_get_request(path, environment)
        elif http_method == 'POST':
            return handle_post_request(event, environment)
        elif http_method == 'PUT':
            return handle_put_request(event, environment)
        elif http_method == 'DELETE':
            return handle_delete_request(path, environment)
        elif http_method == 'OPTIONS':
            return handle_options_request()
        else:
            return create_response(405, {'error': f'Method {http_method} not allowed'})
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def handle_get_request(path: str, environment: str) -> Dict[str, Any]:
    """Handle GET requests."""
    if path == '/':
        return create_response(200, {
            'message': 'TAP API is running',
            'environment': environment,
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'healthy'
        })
    elif path == '/health':
        return create_response(200, {
            'status': 'healthy',
            'environment': environment,
            'timestamp': datetime.utcnow().isoformat()
        })
    elif path == '/info':
        return create_response(200, {
            'service': 'TAP API',
            'version': '1.0.0',
            'environment': environment,
            'timestamp': datetime.utcnow().isoformat()
        })
    else:
        return create_response(404, {'error': 'Endpoint not found'})

def handle_post_request(event: Dict[str, Any], environment: str) -> Dict[str, Any]:
    """Handle POST requests."""
    try:
        body = event.get('body', '{}')
        if isinstance(body, str):
            body = json.loads(body)
        
        logger.info(f"POST request body: {body}")
        
        return create_response(200, {
            'message': 'POST request processed successfully',
            'environment': environment,
            'timestamp': datetime.utcnow().isoformat(),
            'received_data': body
        })
    except json.JSONDecodeError:
        return create_response(400, {'error': 'Invalid JSON in request body'})

def handle_put_request(event: Dict[str, Any], environment: str) -> Dict[str, Any]:
    """Handle PUT requests."""
    try:
        body = event.get('body', '{}')
        if isinstance(body, str):
            body = json.loads(body)
        
        logger.info(f"PUT request body: {body}")
        
        return create_response(200, {
            'message': 'PUT request processed successfully',
            'environment': environment,
            'timestamp': datetime.utcnow().isoformat(),
            'received_data': body
        })
    except json.JSONDecodeError:
        return create_response(400, {'error': 'Invalid JSON in request body'})

def handle_delete_request(path: str, environment: str) -> Dict[str, Any]:
    """Handle DELETE requests."""
    return create_response(200, {
        'message': 'DELETE request processed successfully',
        'environment': environment,
        'timestamp': datetime.utcnow().isoformat(),
        'path': path
    })

def handle_options_request() -> Dict[str, Any]:
    """Handle OPTIONS requests for CORS."""
    return create_response(200, {}, cors_headers=True)

def create_response(status_code: int, body: Dict[str, Any], cors_headers: bool = False) -> Dict[str, Any]:
    """
    Create a standardized API Gateway response.
    
    Args:
        status_code: HTTP status code
        body: Response body
        cors_headers: Whether to include CORS headers
        
    Returns:
        Dict containing the API Gateway response
    """
    headers = {
        'Content-Type': 'application/json'
    }
    
    if cors_headers:
        headers.update({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        })
    
    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(body, default=str)
    } 