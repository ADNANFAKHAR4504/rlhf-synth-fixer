"""
Tasks CRUD Lambda Handler
Handles create, read, update, delete operations for tasks with DynamoDB and S3 integration.
"""

import json
import os
import uuid
from datetime import datetime
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError


# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')

# Environment variables
TASKS_TABLE = os.environ['TASKS_TABLE']
PROJECTS_TABLE = os.environ['PROJECTS_TABLE']
ATTACHMENTS_BUCKET = os.environ['ATTACHMENTS_BUCKET']
NOTIFICATIONS_TOPIC_ARN = os.environ['NOTIFICATIONS_TOPIC_ARN']

# DynamoDB tables
tasks_table = dynamodb.Table(TASKS_TABLE)
projects_table = dynamodb.Table(PROJECTS_TABLE)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to int/float for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    Main Lambda handler for tasks CRUD operations

    Args:
        event: API Gateway event with httpMethod, path, body
        context: Lambda context object

    Returns:
        API Gateway response with status code and body
    """
    try:
        http_method = event.get('httpMethod')
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}

        # Extract user info from Cognito authorizer context
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})
        claims = authorizer.get('claims', {})
        user_id = claims.get('sub', 'unknown')
        user_email = claims.get('email', 'unknown')

        # Route to appropriate handler
        if http_method == 'GET' and 'taskId' in path_parameters:
            return get_task(path_parameters['taskId'])
        elif http_method == 'GET':
            return list_tasks(query_parameters, user_id)
        elif http_method == 'POST':
            return create_task(body, user_id, user_email)
        elif http_method == 'PUT' and 'taskId' in path_parameters:
            return update_task(path_parameters['taskId'], body, user_id)
        elif http_method == 'DELETE' and 'taskId' in path_parameters:
            return delete_task(path_parameters['taskId'], user_id)
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Invalid request'})
            }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)})
        }


def create_task(body, user_id, user_email):
    """Create a new task"""
    try:
        # Validate required fields
        if 'title' not in body or 'projectId' not in body:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing required fields: title, projectId'})
            }

        # Verify project exists
        try:
            projects_table.get_item(Key={'projectId': body['projectId']})
        except ClientError:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Project not found'})
            }

        # Generate task ID and timestamps
        task_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + 'Z'

        # Create task item
        task_item = {
            'taskId': task_id,
            'projectId': body['projectId'],
            'title': body['title'],
            'description': body.get('description', ''),
            'status': body.get('status', 'TODO'),
            'priority': body.get('priority', 'MEDIUM'),
            'assignedTo': body.get('assignedTo', user_id),
            'createdBy': user_id,
            'createdAt': timestamp,
            'updatedAt': timestamp,
            'tags': body.get('tags', []),
            'attachments': body.get('attachments', [])
        }
        # Only include dueDate if provided and non-empty to satisfy GSI key constraints
        if 'dueDate' in body and str(body['dueDate']).strip() != '':
            task_item['dueDate'] = body['dueDate']

        # Save to DynamoDB
        tasks_table.put_item(Item=task_item)

        # Send SNS notification
        send_notification(
            f"New task created: {body['title']}",
            f"Task '{body['title']}' has been created and assigned to {task_item['assignedTo']}",
            user_email
        )

        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(task_item, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error creating task: {str(e)}")
        raise


def get_task(task_id):
    """Get a single task by ID"""
    try:
        response = tasks_table.get_item(Key={'taskId': task_id})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Task not found'})
            }

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(response['Item'], cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error getting task: {str(e)}")
        raise


def list_tasks(query_parameters, user_id):
    """List tasks with optional filtering"""
    try:
        # Check for project filter (use GSI)
        if 'projectId' in query_parameters:
            response = tasks_table.query(
                IndexName='projectIndex',
                KeyConditionExpression='projectId = :projectId',
                ExpressionAttributeValues={':projectId': query_parameters['projectId']}
            )
        # Check for user filter (use GSI)
        elif 'assignedTo' in query_parameters:
            response = tasks_table.query(
                IndexName='userIndex',
                KeyConditionExpression='assignedTo = :assignedTo',
                ExpressionAttributeValues={':assignedTo': query_parameters['assignedTo']}
            )
        else:
            # Scan all tasks (less efficient but supported)
            response = tasks_table.scan()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'tasks': response.get('Items', []),
                'count': len(response.get('Items', []))
            }, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error listing tasks: {str(e)}")
        raise


def update_task(task_id, body, user_id):
    """Update an existing task"""
    try:
        # Verify task exists
        response = tasks_table.get_item(Key={'taskId': task_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Task not found'})
            }

        # Build update expression
        update_expression = "SET updatedAt = :updatedAt"
        expression_values = {':updatedAt': datetime.utcnow().isoformat() + 'Z'}

        # Add fields to update
        updatable_fields = ['title', 'description', 'status', 'priority', 'assignedTo', 'dueDate', 'tags']
        for field in updatable_fields:
            if field in body:
                update_expression += f", {field} = :{field}"
                expression_values[f':{field}'] = body[field]

        # Update task
        response = tasks_table.update_item(
            Key={'taskId': task_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )

        # Send SNS notification for status changes
        if 'status' in body:
            send_notification(
                f"Task status updated: {response['Attributes']['title']}",
                f"Task status changed to: {body['status']}",
                user_id
            )

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(response['Attributes'], cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error updating task: {str(e)}")
        raise


def delete_task(task_id, user_id):
    """Delete a task"""
    try:
        # Verify task exists
        response = tasks_table.get_item(Key={'taskId': task_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Task not found'})
            }

        task_title = response['Item'].get('title', 'Unknown')

        # Delete task
        tasks_table.delete_item(Key={'taskId': task_id})

        # Send SNS notification
        send_notification(
            f"Task deleted: {task_title}",
            f"Task '{task_title}' has been deleted by user {user_id}",
            user_id
        )

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Task deleted successfully'})
        }

    except Exception as e:
        print(f"Error deleting task: {str(e)}")
        raise


def send_notification(subject, message, recipient):
    """Send SNS notification"""
    try:
        sns_client.publish(
            TopicArn=NOTIFICATIONS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        print(f"Notification sent: {subject}")
    except Exception as e:
        print(f"Error sending notification: {str(e)}")
        # Don't fail the request if notification fails
