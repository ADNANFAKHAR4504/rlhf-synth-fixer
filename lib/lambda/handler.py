"""
Lambda handler for TAP application
Simple handler for demonstration purposes
"""

import json
import logging
import os

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))

def lambda_handler(event, context):
    """
    Main Lambda handler function
    
    Args:
        event: Lambda event data
        context: Lambda runtime context
        
    Returns:
        dict: HTTP response
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract path and method from event
        path = event.get('rawPath', '/')
        method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
        
        # Simple routing
        if path == '/health' and method == 'GET':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'status': 'healthy',
                    'service': 'tap-api',
                    'version': '1.0.0'
                })
            }
        elif path == '/' and method == 'GET':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'message': 'Welcome to TAP API',
                    'endpoints': ['/health']
                })
            }
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': 'Not Found',
                    'path': path,
                    'method': method
                })
            }
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal Server Error'
            })
        }
