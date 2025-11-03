"""
User service Lambda handler.

Handles user-related operations with DynamoDB.
Uses only boto3 and standard library - no external dependencies.
"""

import json
import logging
import os
from decimal import Decimal

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table(os.environ['USERS_TABLE_NAME'])


def decimal_default(obj):
    """JSON serializer for Decimal objects."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def handler(event, context):
    """
    Main Lambda handler for user service.
    
    Args:
        event: API Gateway event or Step Functions input
        context: Lambda context
        
    Returns:
        Response dict
    """
    logger.info(f"Received event: {json.dumps(event, default=decimal_default)}")
    
    try:
        # Handle both API Gateway and direct invocation (Step Functions)
        http_method = event.get('httpMethod', '')
        
        # Direct invocation (Step Functions) - data is in event root
        if not http_method and 'userId' in event:
            user_id = event.get('userId')
            email = event.get('userEmail') or event.get('email')
            name = event.get('userName') or event.get('name')
            
            if not user_id or not email:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'userId and email are required'})
                }
            
            users_table.put_item(Item={
                'userId': user_id,
                'email': email,
                'name': name or '',
                'status': 'active'
            })
            
            return {
                'statusCode': 200,
                'body': json.dumps({'userId': user_id, 'status': 'created'})
            }
        
        # API Gateway invocation
        if http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('userId')
            email = body.get('email')
            name = body.get('name')
            
            if not user_id or not email:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'userId and email are required'})
                }
            
            users_table.put_item(Item={
                'userId': user_id,
                'email': email,
                'name': name or '',
                'status': 'active'
            })
            
            return {
                'statusCode': 200,
                'body': json.dumps({'userId': user_id, 'status': 'created'})
            }
        
        elif http_method == 'GET':
            user_id = event.get('pathParameters', {}).get('userId')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'userId is required'})
                }
            
            response = users_table.get_item(Key={'userId': user_id})
            
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': 'User not found'})
                }
            
            return {
                'statusCode': 200,
                'body': json.dumps(response['Item'], default=decimal_default)
            }
        
        else:
            return {
                'statusCode': 405,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

