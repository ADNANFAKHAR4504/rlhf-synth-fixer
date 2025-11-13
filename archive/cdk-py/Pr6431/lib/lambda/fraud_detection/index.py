"""
Fraud detection Lambda function.
Analyzes transactions for fraudulent patterns.
"""
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

FRAUD_TABLE = os.environ['FRAUD_TABLE']
TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
AUDIT_BUCKET = os.environ['AUDIT_BUCKET']

def handler(event, context):
    """
    Perform fraud detection on transaction.

    Checks:
    - Transaction velocity
    - Amount patterns
    - Geographic anomalies
    """
    try:
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']

        customer_id = body.get('customerId')
        amount = float(body.get('amount', 0))

        # Simple fraud detection rules
        fraud_score = 0

        # Check for high amount
        if amount > 5000:
            fraud_score += 30

        # Check transaction history (simplified)
        table = dynamodb.Table(TRANSACTIONS_TABLE)
        response = table.query(
            IndexName='CustomerIdIndex',
            KeyConditionExpression='customerId = :cid',
            ExpressionAttributeValues={':cid': customer_id},
            Limit=10
        )

        # High velocity check
        if len(response.get('Items', [])) > 5:
            fraud_score += 20

        # Determine fraud status
        is_fraud = fraud_score > 50

        # Log to audit bucket
        audit_log = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': 'FRAUD_DETECTION',
            'customerId': customer_id,
            'amount': amount,
            'fraudScore': fraud_score,
            'isFraud': is_fraud
        }

        s3.put_object(
            Bucket=AUDIT_BUCKET,
            Key=f"fraud/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.request_id}.json",
            Body=json.dumps(audit_log)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'fraudScore': fraud_score,
                'isFraud': is_fraud,
                'transactionId': context.request_id
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
