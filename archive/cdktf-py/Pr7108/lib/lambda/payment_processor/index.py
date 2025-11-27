"""Payment processor Lambda function."""

import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

PAYMENTS_TABLE = os.environ['PAYMENTS_TABLE']
AUDIT_TABLE = os.environ['AUDIT_TABLE']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ENVIRONMENT = os.environ['ENVIRONMENT']


def handler(event, context):
    """Process payment transactions."""
    try:
        # Parse input
        if 'body' in event:
            payment_data = json.loads(event['body'])
        else:
            payment_data = event

        payment_id = payment_data.get('payment_id')
        amount = payment_data.get('amount')
        currency = payment_data.get('currency', 'USD')

        if not payment_id or not amount:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }

        # Validate payment
        if amount <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid amount'})
            }

        timestamp = int(datetime.utcnow().timestamp())

        # Store in DynamoDB
        payments_table = dynamodb.Table(PAYMENTS_TABLE)
        payments_table.put_item(
            Item={
                'payment_id': payment_id,
                'amount': Decimal(str(amount)),
                'currency': currency,
                'status': 'processed',
                'timestamp': timestamp,
                'environment': ENVIRONMENT,
                'processed_at': datetime.utcnow().isoformat()
            }
        )

        # Audit log
        audit_table = dynamodb.Table(AUDIT_TABLE)
        audit_table.put_item(
            Item={
                'audit_id': f"{payment_id}-{timestamp}",
                'payment_id': payment_id,
                'action': 'payment_processed',
                'timestamp': timestamp,
                'details': json.dumps({
                    'amount': float(amount),
                    'currency': currency,
                    'environment': ENVIRONMENT
                })
            }
        )

        # Send notification
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"Payment Processed: {payment_id}",
            Message=json.dumps({
                'payment_id': payment_id,
                'amount': float(amount),
                'currency': currency,
                'status': 'processed',
                'timestamp': timestamp
            })
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'payment_id': payment_id,
                'status': 'processed'
            })
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
