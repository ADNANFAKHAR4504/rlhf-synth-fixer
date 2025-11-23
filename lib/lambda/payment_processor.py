import json
import os
import boto3
from typing import Dict, Any

dynamodb = boto3.resource('dynamodb')
secrets_manager = boto3.client('secretsmanager')

DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
DB_SECRET_ARN = os.environ['DB_SECRET_ARN']
REGION = os.environ['REGION']

table = dynamodb.Table(DYNAMODB_TABLE)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Payment processor Lambda function.
    Processes payment requests and stores session state in DynamoDB.
    """
    try:
        # Extract payment details from event
        payment_id = event.get('paymentId')
        amount = event.get('amount')
        currency = event.get('currency', 'USD')

        if not payment_id or not amount:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }

        # Store session state in DynamoDB
        table.put_item(
            Item={
                'sessionId': payment_id,
                'amount': str(amount),
                'currency': currency,
                'status': 'processing',
                'region': REGION,
                'timestamp': context.request_id
            }
        )

        # Process payment (simplified for demo)
        result = {
            'paymentId': payment_id,
            'amount': amount,
            'currency': currency,
            'status': 'success',
            'region': REGION,
            'transactionId': context.request_id
        }

        # Update session with result
        table.update_item(
            Key={'sessionId': payment_id},
            UpdateExpression='SET #status = :status, transactionId = :txnId',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'completed',
                ':txnId': context.request_id
            }
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }


def health_check(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Health check endpoint for Route 53 health checks.
    """
    return {
        'statusCode': 200,
        'body': json.dumps({
            'status': 'healthy',
            'region': REGION
        })
    }
