import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

SESSION_TABLE = os.environ['SESSION_TABLE']
AUDIT_BUCKET = os.environ['AUDIT_BUCKET']


def handler(event, context):
    """Payment processor Lambda function"""
    try:
        body = json.loads(event.get('body', '{}'))
        payment_id = body.get('payment_id')
        user_id = body.get('user_id')
        amount = Decimal(str(body.get('amount', 0)))

        if not payment_id or not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }

        # Record session in DynamoDB
        table = dynamodb.Table(SESSION_TABLE)
        timestamp = int(datetime.now().timestamp())

        table.put_item(
            Item={
                'session_id': payment_id,
                'timestamp': timestamp,
                'user_id': user_id,
                'status': 'processing',
                'amount': amount,
                'created_at': datetime.now().isoformat()
            }
        )

        # Log to S3
        audit_log = {
            'payment_id': payment_id,
            'user_id': user_id,
            'amount': float(amount),
            'timestamp': timestamp,
            'status': 'success'
        }

        s3.put_object(
            Bucket=AUDIT_BUCKET,
            Key=f"payments/{datetime.now().strftime('%Y/%m/%d')}/{payment_id}.json",
            Body=json.dumps(audit_log)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Payment processed', 'payment_id': payment_id})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
