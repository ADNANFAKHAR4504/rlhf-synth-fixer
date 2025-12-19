import json
import os
import boto3
from datetime import datetime

# Environment variables
REGION = os.environ['AWS_REGION_NAME']
DYNAMO_TABLE = os.environ['DYNAMO_TABLE_NAME']
S3_BUCKET = os.environ['S3_BUCKET']
IS_PRIMARY = os.environ.get('IS_PRIMARY', 'false') == 'true'

dynamodb = boto3.resource('dynamodb', region_name=REGION)
s3 = boto3.client('s3', region_name=REGION)
table = dynamodb.Table(DYNAMO_TABLE)

def handler(event, context):
    action = event.get('action', 'process')
    order = event.get('order', {})

    if action == 'validate':
        return validate_order(order)
    elif action == 'process_payment':
        return process_payment(order)
    elif action == 'fulfill':
        return fulfill_order(order)
    else:
        return process_transaction(event)

def validate_order(order):
    required_fields = ['orderId', 'customerId', 'amount']
    if not all(field in order for field in required_fields):
        raise ValueError('Missing required order fields')

    return {
        'statusCode': 200,
        'body': json.dumps({'status': 'validated', 'order': order})
    }

def process_payment(order):
    transaction_id = f"txn-{order['orderId']}-{int(datetime.now().timestamp())}"

    table.put_item(
        Item={
            'transactionId': transaction_id,
            'timestamp': int(datetime.now().timestamp()),
            'orderId': order['orderId'],
            'customerId': order['customerId'],
            'amount': order['amount'],
            'status': 'payment_processed',
            'region': REGION,
            'isPrimary': IS_PRIMARY
        }
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'status': 'payment_processed',
            'transactionId': transaction_id,
            'order': order
        })
    }

def fulfill_order(order):
    fulfillment_id = f"fulfill-{order['orderId']}"

    s3.put_object(
        Bucket=S3_BUCKET,
        Key=f"fulfillment/{fulfillment_id}.json",
        Body=json.dumps({
            'fulfillmentId': fulfillment_id,
            'orderId': order['orderId'],
            'timestamp': datetime.now().isoformat(),
            'region': REGION,
            'status': 'fulfilled'
        })
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'status': 'fulfilled',
            'fulfillmentId': fulfillment_id,
            'order': order
        })
    }

def process_transaction(event):
    return {
        'statusCode': 200,
        'body': json.dumps({
            'status': 'processed',
            'region': REGION,
            'isPrimary': IS_PRIMARY
        })
    }