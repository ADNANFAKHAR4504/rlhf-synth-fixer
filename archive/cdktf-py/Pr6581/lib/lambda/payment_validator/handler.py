"""Payment validator Lambda function."""
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

def lambda_handler(event, context):
    """Validate payment request."""
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        transaction_id = body.get('transaction_id')
        customer_id = body.get('customer_id')
        amount = body.get('amount')

        # Basic validation
        if not all([transaction_id, customer_id, amount]):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }

        # Store in DynamoDB
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        table.put_item(Item={
            'transaction_id': transaction_id,
            'customer_id': customer_id,
            'amount': str(amount),
            'status': 'validated'
        })

        # Send to processor queue
        queue_url = os.environ['PROCESSOR_QUEUE_URL']
        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps({
                'transaction_id': transaction_id,
                'customer_id': customer_id,
                'amount': amount
            })
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment validated',
                'transaction_id': transaction_id
            })
        }
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
