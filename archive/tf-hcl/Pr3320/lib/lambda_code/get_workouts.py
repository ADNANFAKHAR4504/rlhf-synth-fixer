"""
Lambda function to retrieve user workout logs from DynamoDB.
Runtime: Python 3.10
"""

import json
import os
import boto3
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


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal objects to float for JSON serialization."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    Retrieve workout logs for a specific user.

    Query Parameters:
        user_id (required): The ID of the user whose workouts to retrieve

    Returns:
        200: List of workout logs
        400: Missing required parameter
        500: Internal server error
    """
    try:
        # Extract user_id from query string parameters
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

        # Query DynamoDB for all workouts for this user
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('UserId').eq(user_id),
            ScanIndexForward=False  # Sort by WorkoutId descending
        )

        workouts = response.get('Items', [])

        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'workouts': workouts,
                'count': len(workouts),
                'message': 'Workouts retrieved successfully'
            }, cls=DecimalEncoder)
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
                'message': 'Failed to retrieve workouts',
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
