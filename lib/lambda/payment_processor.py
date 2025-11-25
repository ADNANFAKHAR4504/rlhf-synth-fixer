"""
Payment Processing Lambda Function
Handles payment transactions with multi-region support
"""
import json
import os
import boto3
from botocore.exceptions import ClientError

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')

def handler(event, context):
    """
    Process payment transactions

    Args:
        event: Lambda event containing payment details
        context: Lambda context

    Returns:
        dict: Response with status and payment details
    """
    try:
        # Get environment variables
        db_endpoint = os.environ.get('DB_ENDPOINT')
        dynamodb_table_name = os.environ.get('DYNAMODB_TABLE')
        environment = os.environ.get('ENVIRONMENT', 'test')
        region = os.environ.get('AWS_REGION')

        # Extract payment details from event
        payment_id = event.get('payment_id')
        session_id = event.get('session_id')
        amount = event.get('amount')
        currency = event.get('currency', 'USD')

        if not payment_id or not amount:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing required fields: payment_id and amount'
                })
            }

        # Store session data in DynamoDB
        table = dynamodb.Table(dynamodb_table_name)

        table.put_item(
            Item={
                'sessionId': session_id or payment_id,
                'payment_id': payment_id,
                'amount': str(amount),
                'currency': currency,
                'status': 'processed',
                'region': region,
                'timestamp': context.request_id
            }
        )

        # Log successful processing
        print(f"Payment {payment_id} processed successfully in {region}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'payment_id': payment_id,
                'amount': amount,
                'currency': currency,
                'region': region,
                'db_endpoint': db_endpoint,
                'session_id': session_id or payment_id
            })
        }

    except ClientError as e:
        print(f"AWS Client Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to process payment',
                'details': str(e)
            })
        }
    except Exception as e:
        print(f"Unexpected Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }
