"""
Lambda function to update existing workout logs in DynamoDB.
Runtime: Python 3.10
"""

import json
import os
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
    Update an existing workout log entry.

    Path Parameters:
        workoutId: The ID of the workout to update

    Request Body (JSON):
        user_id (required): The ID of the user
        workout_type (optional): Type of workout
        duration (optional): Duration in minutes
        calories (optional): Calories burned
        notes (optional): Additional notes

    Returns:
        200: Workout updated successfully
        400: Missing required fields or invalid request
        404: Workout not found
        500: Internal server error
    """
    try:
        # Extract path parameters
        path_params = event.get('pathParameters') or {}
        workout_id = path_params.get('workoutId')

        if not workout_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Missing path parameter: workoutId',
                    'error': 'BAD_REQUEST'
                })
            }

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

        # Validate required field
        user_id = body.get('user_id')
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Missing required field: user_id',
                    'error': 'BAD_REQUEST'
                })
            }

        # Check if workout exists
        try:
            response = table.get_item(
                Key={
                    'UserId': user_id,
                    'WorkoutId': workout_id
                }
            )

            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'message': 'Workout not found',
                        'error': 'NOT_FOUND'
                    })
                }
        except ClientError:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Workout not found',
                    'error': 'NOT_FOUND'
                })
            }

        # Build update expression
        update_expr = "SET UpdatedAt = :updated_at"
        expr_attr_values = {
            ":updated_at": datetime.utcnow().isoformat() + 'Z'
        }

        # Add optional fields to update
        update_fields = {
            'workout_type': ('WorkoutType', str),
            'duration': ('Duration', lambda x: Decimal(str(x))),
            'calories': ('Calories', lambda x: Decimal(str(x))),
            'notes': ('Notes', str)
        }

        for field_key, (attr_name, converter) in update_fields.items():
            if field_key in body:
                update_expr += f", {attr_name} = :{field_key}"
                expr_attr_values[f":{field_key}"] = converter(body[field_key])

        # Update workout in DynamoDB
        table.update_item(
            Key={
                'UserId': user_id,
                'WorkoutId': workout_id
            },
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_attr_values
        )

        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Workout updated successfully',
                'workout_id': workout_id,
                'user_id': user_id
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
                'message': 'Failed to update workout',
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
