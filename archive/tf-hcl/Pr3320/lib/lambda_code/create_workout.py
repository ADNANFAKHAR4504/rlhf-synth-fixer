"""
Lambda function to create new workout logs in DynamoDB.
Runtime: Python 3.10
"""

import json
import os
import uuid
import boto3
from datetime import datetime
from botocore.exceptions import ClientError
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')

# Initialize DynamoDB table
table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, context):
    """
    Create a new workout log entry.

    Request Body (JSON):
        user_id (required): The ID of the user
        workout_type (required): Type of workout (e.g., 'Running', 'Cycling')
        duration (optional): Duration in minutes
        calories (optional): Calories burned
        notes (optional): Additional notes

    Returns:
        201: Workout created successfully
        400: Missing required fields or invalid request
        500: Internal server error
    """
    try:
        # Parse request body
        if not event.get('body'):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Request body is required',
                    'error': 'BAD_REQUEST'
                })
            }

        body = json.loads(event['body'])

        # Validate required fields
        user_id = body.get('user_id')
        workout_type = body.get('workout_type')

        if not user_id or not workout_type:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Missing required fields: user_id and workout_type',
                    'error': 'BAD_REQUEST'
                })
            }

        # Generate workout ID and timestamps
        workout_id = str(uuid.uuid4())
        current_time = datetime.utcnow().isoformat() + 'Z'
        workout_date = datetime.utcnow().strftime('%Y-%m-%d')

        # Create workout item
        item = {
            'UserId': user_id,
            'WorkoutId': workout_id,
            'WorkoutDate': workout_date,
            'WorkoutType': workout_type,
            'Duration': Decimal(str(body.get('duration', 0))),
            'Calories': Decimal(str(body.get('calories', 0))),
            'Notes': body.get('notes', ''),
            'CreatedAt': current_time,
            'UpdatedAt': current_time
        }

        # Save to DynamoDB
        table.put_item(Item=item)

        # Convert Decimal to float for JSON response
        response_item = {k: float(v) if isinstance(v, Decimal) else v for k, v in item.items()}

        # Return success response
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Workout created successfully',
                'workout_id': workout_id,
                'workout': response_item
            })
        }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Invalid JSON in request body',
                'error': 'BAD_REQUEST'
            })
        }

    except ClientError as e:
        # Log DynamoDB client errors
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"DynamoDB ClientError: {error_code} - {error_message}")

        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Failed to create workout',
                'error': 'INTERNAL_SERVER_ERROR'
            })
        }

    except Exception as e:
        # Log unexpected errors
        print(f"Unexpected error: {str(e)}")

        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Internal server error',
                'error': 'INTERNAL_SERVER_ERROR'
            })
        }
