"""
API Handler Lambda function.

This function receives transaction requests from API Gateway, validates them,
and publishes valid transactions to an SQS queue for processing.
"""
import json
import os
import boto3
from typing import Dict, Any

# Initialize SQS client
sqs = boto3.client('sqs', region_name='us-east-1')

# Get environment variables
QUEUE_URL = os.environ['QUEUE_URL']


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for API Gateway requests.

    Args:
        event: API Gateway event containing transaction data
        context: Lambda context object

    Returns:
        API Gateway response with status code and message
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['transaction_id', 'amount', 'timestamp']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'error': f'Missing required field: {field}'
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }

        # Validate amount is positive
        if body['amount'] <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Amount must be positive'
                }),
                'headers': {
                    'Content-Type': 'application/json'
                }
            }

        # Publish message to SQS
        response = sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(body),
            MessageAttributes={
                'transaction_id': {
                    'StringValue': str(body['transaction_id']),
                    'DataType': 'String'
                }
            }
        )

        return {
            'statusCode': 202,
            'body': json.dumps({
                'message': 'Transaction accepted for processing',
                'transaction_id': body['transaction_id'],
                'message_id': response['MessageId']
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'Invalid JSON in request body'
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error'
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
