
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

def handler(event, context):
    table_name = os.environ['DYNAMODB_TABLE']
    bucket_name = os.environ['S3_BUCKET']

    table = dynamodb.Table(table_name)

    # Process payment
    transaction_id = event.get('transaction_id', 'unknown')
    amount = event.get('amount', 0)
    timestamp = int(datetime.now().timestamp())

    # Store in DynamoDB
    table.put_item(
        Item={
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'status': 'completed',
            'amount': amount
        }
    )

    # Store audit log in S3
    s3.put_object(
        Bucket=bucket_name,
        Key=f"transactions/{transaction_id}.json",
        Body=json.dumps(event)
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Payment processed',
            'transaction_id': transaction_id
        })
    }
