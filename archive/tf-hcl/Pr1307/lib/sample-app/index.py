import json
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Sample Lambda function handler for serverless CI/CD pipeline demo.
    
    Args:
        event: API Gateway event or direct invocation event
        context: Lambda context object
        
    Returns:
        dict: Response with statusCode, headers, and body
    """
    
    try:
        # Log the incoming event
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Extract HTTP method and path if this is an API Gateway event
        http_method = event.get('httpMethod', 'DIRECT_INVOKE')
        path = event.get('path', '/')
        
        # Get query parameters if available
        query_params = event.get('queryStringParameters') or {}
        
        # Create response data
        response_data = {
            'message': 'Hello from Serverless CI/CD Pipeline!',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'method': http_method,
            'path': path,
            'query_parameters': query_params,
            'function_name': context.function_name if context else 'unknown',
            'function_version': context.function_version if context else 'unknown',
            'request_id': context.aws_request_id if context else 'unknown'
        }
        
        # Handle different HTTP methods if this is API Gateway
        if http_method == 'GET':
            response_data['action'] = 'Retrieved data successfully'
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            response_data['action'] = 'Processed POST request'
            response_data['received_data'] = body
        elif http_method == 'PUT':
            response_data['action'] = 'Updated resource'
        elif http_method == 'DELETE':
            response_data['action'] = 'Deleted resource'
        else:
            response_data['action'] = 'Direct invocation or unsupported method'
        
        # Success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps(response_data, indent=2)
        }
        
    except Exception as e:
        # Error handling
        logger.error(f"Error processing request: {str(e)}")
        
        error_response = {
            'error': 'Internal server error',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(error_response, indent=2)
        }

def health_check():
    """
    Health check function for monitoring.
    
    Returns:
        dict: Health status
    """
    return {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'version': '1.0.0'
    }
