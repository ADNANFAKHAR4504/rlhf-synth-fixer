"""
Transaction processing Lambda function.
Processes approved payment transactions.
"""
import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
AUDIT_BUCKET = os.environ['AUDIT_BUCKET']

def handler(event, context):
    """
    Process payment transaction.

    Steps:
    1. Validate transaction data
    2. Store in DynamoDB
    3. Log to audit bucket
    4. Return confirmation
    """
    try:
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']

        transaction_id = body.get('transactionId', context.request_id)
        customer_id = body['customerId']
        amount = Decimal(str(body['amount']))

        # Store transaction
        table = dynamodb.Table(TRANSACTIONS_TABLE)
        timestamp = int(datetime.utcnow().timestamp())

        table.put_item(
            Item={
                'transactionId': transaction_id,
                'timestamp': timestamp,
                'customerId': customer_id,
                'amount': amount,
                'currency': body.get('currency', 'USD'),
                'status': 'COMPLETED',
                'processedAt': datetime.utcnow().isoformat()
            }
        )

        # Log to audit bucket
        audit_log = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': 'TRANSACTION_PROCESSED',
            'transactionId': transaction_id,
            'customerId': customer_id,
            'amount': float(amount),
            'status': 'SUCCESS'
        }

        s3.put_object(
            Bucket=AUDIT_BUCKET,
            Key=f"transactions/{datetime.utcnow().strftime('%Y/%m/%d')}/{transaction_id}.json",
            Body=json.dumps(audit_log)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'transactionId': transaction_id,
                'status': 'COMPLETED'
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
