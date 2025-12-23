"""Fraud detection Lambda function."""

import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')


def handler(event, context):
    """Detect fraudulent transactions."""
    try:
        table_name = os.environ.get('TABLE_NAME')
        table = dynamodb.Table(table_name)
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        transaction_id = body.get('transaction_id')
        user_id = body.get('user_id')
        amount = float(body.get('amount', 0))
        timestamp = int(body.get('timestamp', datetime.utcnow().timestamp()))

        # Simple fraud detection logic
        fraud_score = 0

        # Check for high-value transactions
        if amount > 10000:
            fraud_score += 50

        # Check transaction frequency
        response = table.query(
            IndexName='user-index',
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': user_id},
            Limit=10,
        )

        if len(response['Items']) > 5:
            fraud_score += 30

        # Determine fraud status
        is_fraud = fraud_score > 70
        status = 'fraud_detected' if is_fraud else 'cleared'

        # Update transaction status
        table.update_item(
            Key={
                'transaction_id': transaction_id,
                'timestamp': timestamp,
            },
            UpdateExpression='SET #status = :status, fraud_score = :score',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': status,
                ':score': fraud_score,
            },
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'transaction_id': transaction_id,
                'fraud_score': fraud_score,
                'is_fraud': is_fraud,
            }),
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'}),
        }
