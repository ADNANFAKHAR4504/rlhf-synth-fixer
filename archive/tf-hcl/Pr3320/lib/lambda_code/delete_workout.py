"""
Lambda function to delete workout logs from DynamoDB.
Runtime: Python 3.10
"""

import json
import os
import boto3
from botocore.exceptions import ClientError

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
    Delete a workout log entry.

    Path Parameters:
        workoutId: The ID of the workout to delete

    Query Parameters:
        user_id (required): The ID of the user

    Returns:
        200: Workout deleted successfully
        400: Missing required parameters
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

        # Extract query string parameters
        query_params = event.get('queryStringParameters') or {}
        user_id = query_params.get('user_id')

        if not user_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Missing required parameter: user_id',
                    'error': 'BAD_REQUEST'
                })
            }

        # Check if workout exists before deleting
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

        # Delete workout from DynamoDB
        table.delete_item(
            Key={
                'UserId': user_id,
                'WorkoutId': workout_id
            }
        )

        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Workout deleted successfully',
                'workout_id': workout_id,
                'user_id': user_id
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
                'message': 'Failed to delete workout',
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
