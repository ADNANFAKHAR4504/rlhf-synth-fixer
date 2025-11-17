"""
Transaction validator Lambda function.

This function validates payment transactions and sends them to
analytics and reporting queues for async processing.
"""

import json
import os
from decimal import Decimal

import boto3

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
cloudwatch = boto3.client('cloudwatch')


def handler(event, context):
    """
    Lambda handler for transaction validation.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    try:
        table_name = os.environ.get('TRANSACTIONS_TABLE')
        analytics_queue_url = os.environ.get('ANALYTICS_QUEUE_URL')
        reporting_queue_url = os.environ.get('REPORTING_QUEUE_URL')
        
        body = json.loads(event.get('body', '{}'))
        transaction_id = body.get('transaction_id')
        merchant_id = body.get('merchant_id')
        amount = body.get('amount')
        
        print(f"Processing transaction: transaction_id={transaction_id}, merchant_id={merchant_id}, amount={amount}")
        
        if not all([transaction_id, merchant_id, amount]):
            print(f"Validation failed: Missing required fields")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }
        
        table = dynamodb.Table(table_name)
        
        item = {
            'transaction_id': transaction_id,
            'merchant_id': merchant_id,
            'amount': Decimal(str(amount)),
            'status': 'validated',
            'transaction_date': body.get('transaction_date', '2024-01-01')
        }
        
        table.put_item(Item=item)
        print(f"Successfully wrote transaction to DynamoDB: {transaction_id}")
        
        message_body = json.dumps({
            'transaction_id': transaction_id,
            'merchant_id': merchant_id,
            'amount': float(amount)
        })
        
        sqs.send_message(
            QueueUrl=analytics_queue_url,
            MessageBody=message_body
        )
        print(f"Sent message to analytics queue for transaction: {transaction_id}")
        
        sqs.send_message(
            QueueUrl=reporting_queue_url,
            MessageBody=message_body
        )
        print(f"Sent message to reporting queue for transaction: {transaction_id}")
        
        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'TransactionsValidated',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )
        
        print(f"Transaction validation completed successfully: {transaction_id}")
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction validated successfully',
                'transaction_id': transaction_id
            })
        }
        
    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'TransactionErrors',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
