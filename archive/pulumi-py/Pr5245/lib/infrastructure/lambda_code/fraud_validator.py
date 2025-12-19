"""
Fraud Validator Lambda Handler

Validates transactions for fraud and stores results in DynamoDB.
"""

import json
import os
import random
import time
from decimal import Decimal

import boto3

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')


def handler(event, context):
    """
    Validate transactions for fraud.
    
    Args:
        event: EventBridge event
        context: Lambda context
        
    Returns:
        Validation result
    """
    try:
        detail = event.get('detail', {})
        transaction_id = detail.get('transaction_id')
        amount = detail.get('amount')
        
        if not transaction_id:
            return {'statusCode': 400, 'message': 'Missing transaction_id'}
        
        fraud_threshold = float(os.environ.get('FRAUD_THRESHOLD', '0.85'))
        fraud_score = random.random()
        
        is_fraud = fraud_score > fraud_threshold
        timestamp = int(time.time())
        
        validation_id = f"val-{transaction_id}-{timestamp}"
        
        table_name = os.environ['VALIDATION_RESULTS_TABLE']
        table = dynamodb.Table(table_name)
        
        table.put_item(
            Item={
                'validation_id': validation_id,
                'transaction_id': transaction_id,
                'fraud_score': Decimal(str(fraud_score)),
                'is_fraud': is_fraud,
                'timestamp': timestamp
            }
        )
        
        if is_fraud:
            failed_queue_url = os.environ['FAILED_VALIDATIONS_QUEUE_URL']
            sqs.send_message(
                QueueUrl=failed_queue_url,
                MessageBody=json.dumps({
                    'validation_id': validation_id,
                    'transaction_id': transaction_id,
                    'fraud_score': fraud_score,
                    'timestamp': timestamp
                })
            )
        
        return {
            'statusCode': 200,
            'validation_id': validation_id,
            'is_fraud': is_fraud
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise

