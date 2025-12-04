"""Payment processing Lambda function."""
import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE_NAME']
ALERTS_TOPIC_ARN = os.environ['ALERTS_TOPIC_ARN']

def process_payment(payment_data):
    """Process the validated payment."""
    # Simulate payment processing logic
    transaction_id = payment_data['transaction_id']
    amount = Decimal(str(payment_data['amount']))

    # Update transaction status
    table = dynamodb.Table(TRANSACTIONS_TABLE)
    timestamp = datetime.utcnow().isoformat()

    try:
        # Simulate processing
        # In a real scenario, this would integrate with payment gateways
        response = table.update_item(
            Key={'transaction_id': transaction_id},
            UpdateExpression='SET #status = :status, updated_at = :updated_at, processed_at = :processed_at, processing_region = :region',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'processed',
                ':updated_at': timestamp,
                ':processed_at': timestamp,
                ':region': os.environ.get('DEPLOYMENT_REGION', os.environ.get('AWS_REGION', 'unknown'))
            },
            ReturnValues='ALL_NEW'
        )

        # Send success notification for high-value transactions
        if amount > Decimal('10000'):
            sns.publish(
                TopicArn=ALERTS_TOPIC_ARN,
                Subject='High-Value Transaction Processed',
                Message=json.dumps({
                    'transaction_id': transaction_id,
                    'amount': str(amount),
                    'currency': payment_data['currency'],
                    'timestamp': timestamp,
                    'region': os.environ.get('DEPLOYMENT_REGION', os.environ.get('AWS_REGION', 'unknown'))
                })
            )

        return True, 'Payment processed successfully'

    except Exception as e:
        # Update status to failed
        table.update_item(
            Key={'transaction_id': transaction_id},
            UpdateExpression='SET #status = :status, updated_at = :updated_at, error_message = :error',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'failed',
                ':updated_at': timestamp,
                ':error': str(e)
            }
        )

        # Send failure notification
        sns.publish(
            TopicArn=ALERTS_TOPIC_ARN,
            Subject='Payment Processing Failed',
            Message=json.dumps({
                'transaction_id': transaction_id,
                'error': str(e),
                'timestamp': timestamp,
                'region': os.environ.get('DEPLOYMENT_REGION', os.environ.get('AWS_REGION', 'unknown'))
            })
        )

        return False, str(e)

def lambda_handler(event, context):
    """Handle payment processing from SQS queue."""
    processed = 0
    failed = 0

    for record in event['Records']:
        try:
            # Parse SQS message
            payment_data = json.loads(record['body'])

            # Process the payment
            success, message = process_payment(payment_data)

            if success:
                processed += 1
            else:
                failed += 1
                print(f"Failed to process transaction {payment_data.get('transaction_id')}: {message}")

        except Exception as e:
            failed += 1
            print(f"Error processing record: {str(e)}")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': processed,
            'failed': failed
        })
    }
