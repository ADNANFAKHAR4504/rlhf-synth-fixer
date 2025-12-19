"""
session_manager.py

Lambda function for managing user sessions.
"""

import json
import os
import boto3
from botocore.config import Config
from datetime import datetime, timedelta
import uuid

# Use client instead of resource for SDK v3 compatibility and better performance
dynamodb_client = boto3.client('dynamodb',
    config=Config(
        retries={'max_attempts': 3, 'mode': 'adaptive'}
    )
)


def lambda_handler(event, context):
    """Manage user sessions."""

    sessions_table_name = os.environ['SESSIONS_TABLE']

    try:
        # Parse request
        http_method = event.get('httpMethod', 'GET')
        body = json.loads(event.get('body', '{}'))

        if http_method == 'POST':
            # Create new session
            session_id = str(uuid.uuid4())
            user_id = body.get('userId')

            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Missing userId'})
                }

            # Session expires in 24 hours
            expires_at = int((datetime.utcnow() + timedelta(hours=24)).timestamp())

            dynamodb_client.put_item(
                TableName=sessions_table_name,
                Item={
                    'sessionId': {'S': session_id},
                    'userId': {'S': user_id},
                    'createdAt': {'S': datetime.utcnow().isoformat()},
                    'expiresAt': {'N': str(expires_at)}
                }
            )

            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'sessionId': session_id,
                    'expiresAt': expires_at
                })
            }

        elif http_method == 'GET':
            # Validate session
            session_id = event.get('queryStringParameters', {}).get('sessionId')

            if not session_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Missing sessionId'})
                }

            response = dynamodb_client.get_item(
                TableName=sessions_table_name,
                Key={'sessionId': {'S': session_id}}
            )

            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Session not found'})
                }

            item = response['Item']
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'valid': True,
                    'session': {
                        'sessionId': item['sessionId']['S'],
                        'userId': item['userId']['S'],
                        'expiresAt': int(item['expiresAt']['N'])
                    }
                })
            }

        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Method not allowed'})
            }

    except Exception as e:
        print(f"Error managing session: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }