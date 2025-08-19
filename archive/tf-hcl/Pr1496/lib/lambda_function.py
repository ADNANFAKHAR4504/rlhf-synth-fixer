import json
import os
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    AWS Lambda function handler for serverless application.
    
    Args:
        event: The event dict that contains the parameters sent when the function is invoked
        context: The context object that contains methods and properties about the invocation
        
    Returns:
        dict: Response object with statusCode and body
    """
    
    # Log the incoming event
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Extract query parameters if present
    query_params = event.get('queryStringParameters', {})
    path_params = event.get('pathParameters', {})
    
    # Extract HTTP method
    http_method = event.get('httpMethod', 'GET')
    
    # Prepare response message
    response_message = {
        'message': 'Hello from Lambda!',
        'httpMethod': http_method,
        'timestamp': context.aws_request_id,
        'functionName': context.function_name,
        'region': os.environ.get('AWS_REGION', 'unknown')
    }
    
    # Add query parameters to response if present
    if query_params:
        response_message['queryParameters'] = query_params
    
    # Add path parameters to response if present
    if path_params:
        response_message['pathParameters'] = path_params
    
    # Log the response
    logger.info(f"Sending response: {json.dumps(response_message)}")
    
    # Return the response
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        'body': json.dumps(response_message)
    }