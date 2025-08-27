import json
import logging
import os
from datetime import datetime

# Configure logging
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger = logging.getLogger()
logger.setLevel(getattr(logging, log_level))

def lambda_handler(event, context):
    """
    Main Lambda handler function
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        # Route handling
        if path == '/health':
            return handle_health_check()
        elif path == '/api/data':
            return handle_data_request(http_method, event)
        else:
            return handle_default(path)
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def handle_health_check():
    """Health check endpoint"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'tap-handler'
        })
    }

def handle_data_request(method, event):
    """Handle data API requests"""
    if method == 'GET':
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'data': [
                    {'id': 1, 'name': 'Item 1', 'value': 100},
                    {'id': 2, 'name': 'Item 2', 'value': 200}
                ],
                'timestamp': datetime.utcnow().isoformat()
            })
        }
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Data created successfully',
                'received_data': body,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
    else:
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Method not allowed',
                'allowed_methods': ['GET', 'POST']
            })
        }

def handle_default(path):
    """Default handler for unmatched paths"""
    return {
        'statusCode': 404,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'error': 'Not found',
            'path': path,
            'available_endpoints': ['/health', '/api/data']
        })
    }
