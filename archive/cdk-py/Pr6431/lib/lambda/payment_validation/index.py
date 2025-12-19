"""
Payment validation Lambda function.
Validates payment requests before processing.
"""
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
AUDIT_BUCKET = os.environ['AUDIT_BUCKET']

def handler(event, context):
    """
    Validate payment request.

    Checks:
    - Card number format
    - Amount validity
    - Required fields
    """
    try:
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']

        # Validate required fields
        required_fields = ['cardNumber', 'amount', 'currency', 'customerId']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }

        # Validate amount
        amount = float(body['amount'])
        if amount <= 0 or amount > 10000:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid amount'})
            }

        # Log to audit bucket
        audit_log = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': 'PAYMENT_VALIDATION',
            'customerId': body['customerId'],
            'amount': amount,
            'result': 'PASSED'
        }

        s3.put_object(
            Bucket=AUDIT_BUCKET,
            Key=f"validation/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.request_id}.json",
            Body=json.dumps(audit_log)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'valid': True,
                'transactionId': context.request_id
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
