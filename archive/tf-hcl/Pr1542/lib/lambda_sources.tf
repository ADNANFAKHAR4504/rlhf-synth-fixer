# Create lambda source files
resource "local_file" "health_service" {
  filename = "${path.module}/health_service.py"
  content  = <<EOF
import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    try:
        # Basic health check
        response = {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'health-check',
                'version': '1.0.0'
            })
        }
        
        return response
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e)
            })
        }
EOF
}

resource "local_file" "user_service" {
  filename = "${path.module}/user_service.py"
  content  = <<EOF
import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    try:
        http_method = event.get('httpMethod', 'GET')
        path_parameters = event.get('pathParameters') or {}
        body = event.get('body')
        
        if body:
            body = json.loads(body)
        
        # Mock user operations
        if http_method == 'GET':
            user_id = path_parameters.get('id')
            if user_id:
                # Get specific user
                response_body = {
                    'user_id': user_id,
                    'name': f'User {user_id}',
                    'email': f'user{user_id}@example.com',
                    'created_at': datetime.utcnow().isoformat()
                }
            else:
                # Get all users
                response_body = {
                    'users': [
                        {'user_id': '1', 'name': 'User 1', 'email': 'user1@example.com'},
                        {'user_id': '2', 'name': 'User 2', 'email': 'user2@example.com'}
                    ],
                    'total': 2
                }
        
        elif http_method == 'POST':
            # Create user
            response_body = {
                'user_id': '123',
                'name': body.get('name', 'New User'),
                'email': body.get('email', 'new@example.com'),
                'created_at': datetime.utcnow().isoformat(),
                'message': 'User created successfully'
            }
        
        elif http_method == 'PUT':
            user_id = path_parameters.get('id')
            response_body = {
                'user_id': user_id,
                'name': body.get('name', f'Updated User {user_id}'),
                'email': body.get('email', f'updated{user_id}@example.com'),
                'updated_at': datetime.utcnow().isoformat(),
                'message': 'User updated successfully'
            }
        
        elif http_method == 'DELETE':
            user_id = path_parameters.get('id')
            response_body = {
                'user_id': user_id,
                'message': 'User deleted successfully',
                'deleted_at': datetime.utcnow().isoformat()
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Internal server error'
            })
        }
EOF
}

resource "local_file" "notification_service" {
  filename = "${path.module}/notification_service.py"
  content  = <<EOF
import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    try:
        body = event.get('body')
        if body:
            body = json.loads(body)
        
        # Mock notification sending
        notification_type = body.get('type', 'email')
        recipient = body.get('recipient', 'default@example.com')
        message = body.get('message', 'Default notification message')
        
        # Simulate notification sending
        response_body = {
            'notification_id': f'notif_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}',
            'type': notification_type,
            'recipient': recipient,
            'message': message,
            'status': 'sent',
            'sent_at': datetime.utcnow().isoformat()
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to send notification'
            })
        }
EOF
}