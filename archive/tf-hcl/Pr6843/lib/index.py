"""
Lambda function for production environment
This function demonstrates secure Lambda practices with minimal permissions
and secure database credential retrieval from AWS Secrets Manager
"""
import json
import logging
import os
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
secrets_client = boto3.client('secretsmanager')


def get_database_credentials():
    """
    Retrieve database credentials from AWS Secrets Manager
    
    Returns:
        dict: Database credentials (username, password) or None if failed
    """
    secret_name = "prod/rds/credentials"
    
    try:
        response = secrets_client.get_secret_value(SecretId=secret_name)
        credentials = json.loads(response['SecretString'])
        logger.info("Successfully retrieved database credentials from Secrets Manager")
        return credentials
    except ClientError as e:
        logger.error(f"Failed to retrieve database credentials: {str(e)}")
        return None


def handler(event, context):
    """
    Main Lambda handler function
    
    Args:
        event: Lambda event object
        context: Lambda context object
        
    Returns:
        dict: Response with statusCode and body
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Get environment variable
    environment = os.environ.get('ENVIRONMENT', 'unknown')
    
    try:
        # Example: Retrieve database credentials securely
        db_credentials = get_database_credentials()
        
        # Example: Process the event
        response_body = {
            'message': 'Lambda function executed successfully',
            'environment': environment,
            'request_id': context.request_id,
            'function_name': context.function_name,
            'database_connection_available': db_credentials is not None
        }
        
        logger.info(f"Successfully processed request: {context.request_id}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-Id': context.request_id
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
