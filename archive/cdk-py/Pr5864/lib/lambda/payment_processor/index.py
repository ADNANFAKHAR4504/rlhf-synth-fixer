import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
secrets_manager = boto3.client('secretsmanager')

table_name = os.environ['DYNAMODB_TABLE']
retry_queue_url = os.environ['RETRY_QUEUE_URL']
rds_secret_arn = os.environ['RDS_SECRET_ARN']

table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Payment processor Lambda function
    Processes validated payments and handles failures with retry queue
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        transaction_id = body.get('transaction_id')

        if not transaction_id:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing transaction_id'
                })
            }

        # Retrieve transaction from DynamoDB
        response = table.query(
            KeyConditionExpression='transaction_id = :tid',
            ExpressionAttributeValues={
                ':tid': transaction_id
            },
            ScanIndexForward=False,
            Limit=1
        )

        if not response.get('Items'):
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'error': 'Transaction not found'
                })
            }

        transaction = response['Items'][0]

        # Check if already processed
        if transaction.get('status') == 'processed':
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Transaction already processed',
                    'transaction_id': transaction_id
                })
            }

        # Simulate payment processing
        # In production, this would call payment gateway, update RDS, etc.
        processing_successful = True  # Simulated success

        if processing_successful:
            # Update transaction status
            timestamp = int(datetime.utcnow().timestamp() * 1000)
            table.put_item(
                Item={
                    'transaction_id': transaction_id,
                    'timestamp': timestamp,
                    'status': 'processed',
                    'amount': transaction['amount'],
                    'currency': transaction['currency'],
                    'customer_id': transaction['customer_id'],
                    'processed_at': datetime.utcnow().isoformat()
                }
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Payment processed successfully',
                    'transaction_id': transaction_id,
                    'timestamp': timestamp
                })
            }

        # Send to retry queue
        sqs.send_message(
            QueueUrl=retry_queue_url,
            MessageBody=json.dumps({
                'transaction_id': transaction_id,
                'retry_count': 0,
                'failed_at': datetime.utcnow().isoformat()
            })
        )

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Payment processing failed, added to retry queue',
                'transaction_id': transaction_id
            })
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")

        # Send to retry queue on error
        if 'transaction_id' in locals():
            try:
                sqs.send_message(
                    QueueUrl=retry_queue_url,
                    MessageBody=json.dumps({
                        'transaction_id': transaction_id,
                        'retry_count': 0,
                        'error': str(e),
                        'failed_at': datetime.utcnow().isoformat()
                    })
                )
            except Exception:  # pylint: disable=broad-except
                pass

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error during processing'
            })
        }
