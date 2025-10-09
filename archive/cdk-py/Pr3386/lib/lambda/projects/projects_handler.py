"""
Projects CRUD Lambda Handler
Handles create, read, update, delete operations for projects with DynamoDB integration.
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
sns_client = boto3.client('sns')

# Environment variables
PROJECTS_TABLE = os.environ['PROJECTS_TABLE']
NOTIFICATIONS_TOPIC_ARN = os.environ['NOTIFICATIONS_TOPIC_ARN']

# DynamoDB table
projects_table = dynamodb.Table(PROJECTS_TABLE)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to int/float for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    Main Lambda handler for projects CRUD operations

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
        if http_method == 'GET' and 'projectId' in path_parameters:
            return get_project(path_parameters['projectId'])
        elif http_method == 'GET':
            return list_projects(query_parameters, user_id)
        elif http_method == 'POST':
            return create_project(body, user_id, user_email)
        elif http_method == 'PUT' and 'projectId' in path_parameters:
            return update_project(path_parameters['projectId'], body, user_id)
        elif http_method == 'DELETE' and 'projectId' in path_parameters:
            return delete_project(path_parameters['projectId'], user_id)
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


def create_project(body, user_id, user_email):
    """Create a new project"""
    try:
        # Validate required fields
        if 'name' not in body:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing required field: name'})
            }

        # Generate project ID and timestamps
        project_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + 'Z'

        # Create project item
        project_item = {
            'projectId': project_id,
            'name': body['name'],
            'description': body.get('description', ''),
            'status': body.get('status', 'ACTIVE'),
            'ownerId': user_id,
            'createdBy': user_id,
            'createdAt': timestamp,
            'updatedAt': timestamp,
            'startDate': body.get('startDate', ''),
            'endDate': body.get('endDate', ''),
            'teamMembers': body.get('teamMembers', [user_id]),
            'tags': body.get('tags', [])
        }

        # Save to DynamoDB
        projects_table.put_item(Item=project_item)

        # Send SNS notification
        send_notification(
            f"New project created: {body['name']}",
            f"Project '{body['name']}' has been created by {user_email}",
            user_email
        )

        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(project_item, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error creating project: {str(e)}")
        raise


def get_project(project_id):
    """Get a single project by ID"""
    try:
        response = projects_table.get_item(Key={'projectId': project_id})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Project not found'})
            }

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(response['Item'], cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error getting project: {str(e)}")
        raise


def list_projects(query_parameters, user_id):
    """List projects with optional filtering"""
    try:
        # Check for owner filter (use GSI)
        if 'ownerId' in query_parameters:
            response = projects_table.query(
                IndexName='ownerIndex',
                KeyConditionExpression='ownerId = :ownerId',
                ExpressionAttributeValues={':ownerId': query_parameters['ownerId']}
            )
        else:
            # Scan all projects (less efficient but supported)
            response = projects_table.scan()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'projects': response.get('Items', []),
                'count': len(response.get('Items', []))
            }, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error listing projects: {str(e)}")
        raise


def update_project(project_id, body, user_id):
    """Update an existing project"""
    try:
        # Verify project exists
        response = projects_table.get_item(Key={'projectId': project_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Project not found'})
            }

        # Build update expression
        update_expression = "SET updatedAt = :updatedAt"
        expression_values = {':updatedAt': datetime.utcnow().isoformat() + 'Z'}

        # Add fields to update
        updatable_fields = ['name', 'description', 'status', 'startDate', 'endDate', 'teamMembers', 'tags']
        for field in updatable_fields:
            if field in body:
                update_expression += f", {field} = :{field}"
                expression_values[f':{field}'] = body[field]

        # Update project
        response = projects_table.update_item(
            Key={'projectId': project_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )

        # Send SNS notification for status changes
        if 'status' in body:
            send_notification(
                f"Project status updated: {response['Attributes']['name']}",
                f"Project status changed to: {body['status']}",
                user_id
            )

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(response['Attributes'], cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error updating project: {str(e)}")
        raise


def delete_project(project_id, user_id):
    """Delete a project"""
    try:
        # Verify project exists
        response = projects_table.get_item(Key={'projectId': project_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Project not found'})
            }

        project_name = response['Item'].get('name', 'Unknown')

        # Delete project
        projects_table.delete_item(Key={'projectId': project_id})

        # Send SNS notification
        send_notification(
            f"Project deleted: {project_name}",
            f"Project '{project_name}' has been deleted by user {user_id}",
            user_id
        )

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Project deleted successfully'})
        }

    except Exception as e:
        print(f"Error deleting project: {str(e)}")
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
