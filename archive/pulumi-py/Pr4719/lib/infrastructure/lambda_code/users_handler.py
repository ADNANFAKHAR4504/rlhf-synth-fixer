"""
Users API Lambda function handler.

This handler demonstrates proper SSM parameter retrieval at runtime,
using the parameter names passed via environment variables.
"""

import json
import logging
import os
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
ssm_client = boto3.client('ssm')

# Cache for SSM parameters to reduce API calls
ssm_cache: Dict[str, str] = {}


def get_ssm_parameter(parameter_name: str) -> Optional[str]:
    """
    Retrieve SSM parameter value at runtime.
    
    This properly retrieves the parameter value using the parameter name
    passed via environment variables, not the resource name.
    
    Args:
        parameter_name: Full SSM parameter path
        
    Returns:
        Parameter value or None if not found
    """
    if parameter_name in ssm_cache:
        return ssm_cache[parameter_name]
    
    try:
        response = ssm_client.get_parameter(
            Name=parameter_name,
            WithDecryption=True
        )
        value = response['Parameter']['Value']
        ssm_cache[parameter_name] = value
        return value
    except ClientError as e:
        logger.error(f"Error retrieving SSM parameter {parameter_name}: {e}")
        return None


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for users API endpoints.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Get environment variables
    environment = os.getenv('ENVIRONMENT', 'unknown')
    function_name = os.getenv('FUNCTION_NAME', 'unknown')
    static_bucket = os.getenv('STATIC_BUCKET', '')
    uploads_bucket = os.getenv('UPLOADS_BUCKET', '')
    
    # Get SSM parameters (retrieve actual values at runtime)
    db_connection_param = os.getenv('DB_CONNECTION_STRING_PARAMETER')
    api_key_param = os.getenv('API_KEY_PARAMETER')
    
    if db_connection_param:
        db_connection = get_ssm_parameter(db_connection_param)
        logger.info(f"Retrieved DB connection parameter (length: {len(db_connection) if db_connection else 0})")
    
    if api_key_param:
        api_key = get_ssm_parameter(api_key_param)
        logger.info(f"Retrieved API key parameter (length: {len(api_key) if api_key else 0})")
    
    # Parse the request
    http_method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    path = event.get('requestContext', {}).get('http', {}).get('path', '/')
    
    # Extract user ID from path if present
    path_parameters = event.get('pathParameters', {})
    user_id = path_parameters.get('id') if path_parameters else None
    
    logger.info(f"Processing {http_method} request to {path} (user_id: {user_id})")
    
    # Route the request
    try:
        if http_method == 'GET' and user_id:
            response = get_user(user_id, static_bucket)
        elif http_method == 'GET':
            response = list_users(static_bucket)
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            response = create_user(body, uploads_bucket)
        elif http_method == 'PUT' and user_id:
            body = json.loads(event.get('body', '{}'))
            response = update_user(user_id, body, uploads_bucket)
        elif http_method == 'DELETE' and user_id:
            response = delete_user(user_id, uploads_bucket)
        else:
            response = {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': 'Invalid request'})
            }
    except Exception as e:
        logger.error(f"Error processing request: {e}", exc_info=True)
        response = {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Internal server error'})
        }
    
    return response


def get_user(user_id: str, bucket: str) -> Dict[str, Any]:
    """Get a user by ID."""
    try:
        response = s3_client.get_object(
            Bucket=bucket,
            Key=f'users/{user_id}.json'
        )
        user_data = json.loads(response['Body'].read().decode('utf-8'))
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(user_data)
        }
    except s3_client.exceptions.NoSuchKey:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': f'User {user_id} not found'})
        }
    except Exception as e:
        logger.error(f"Error retrieving user {user_id}: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Internal server error'})
        }


def list_users(bucket: str) -> Dict[str, Any]:
    """List all users."""
    try:
        response = s3_client.list_objects_v2(
            Bucket=bucket,
            Prefix='users/'
        )
        
        users = []
        if 'Contents' in response:
            for obj in response['Contents']:
                if obj['Key'].endswith('.json'):
                    try:
                        user_response = s3_client.get_object(
                            Bucket=bucket,
                            Key=obj['Key']
                        )
                        user_data = json.loads(user_response['Body'].read().decode('utf-8'))
                        users.append(user_data)
                    except Exception as e:
                        logger.warning(f"Error reading user file {obj['Key']}: {e}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'users': users, 'count': len(users)})
        }
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Internal server error'})
        }


def create_user(user_data: Dict[str, Any], bucket: str) -> Dict[str, Any]:
    """Create a new user."""
    try:
        import uuid
        
        user_id = user_data.get('id', str(uuid.uuid4()))
        user_data['id'] = user_id
        
        s3_client.put_object(
            Bucket=bucket,
            Key=f'users/{user_id}.json',
            Body=json.dumps(user_data),
            ContentType='application/json'
        )
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(user_data)
        }
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Internal server error'})
        }


def update_user(user_id: str, user_data: Dict[str, Any], bucket: str) -> Dict[str, Any]:
    """Update an existing user."""
    try:
        # Check if user exists
        try:
            s3_client.head_object(
                Bucket=bucket,
                Key=f'users/{user_id}.json'
            )
        except s3_client.exceptions.ClientError:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': f'User {user_id} not found'})
            }
        
        user_data['id'] = user_id
        
        s3_client.put_object(
            Bucket=bucket,
            Key=f'users/{user_id}.json',
            Body=json.dumps(user_data),
            ContentType='application/json'
        )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(user_data)
        }
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Internal server error'})
        }


def delete_user(user_id: str, bucket: str) -> Dict[str, Any]:
    """Delete a user."""
    try:
        # Check if user exists
        try:
            s3_client.head_object(
                Bucket=bucket,
                Key=f'users/{user_id}.json'
            )
        except s3_client.exceptions.ClientError:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': f'User {user_id} not found'})
            }
        
        s3_client.delete_object(
            Bucket=bucket,
            Key=f'users/{user_id}.json'
        )
        
        return {
            'statusCode': 204,
            'headers': {'Content-Type': 'application/json'},
            'body': ''
        }
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Internal server error'})
        }


