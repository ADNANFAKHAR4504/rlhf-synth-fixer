"""Payment processor Lambda function."""
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

def lambda_handler(event, context):
    """Process payment."""
    try:
        for record in event['Records']:
            # Parse SQS message
            message = json.loads(record['body'])
            transaction_id = message['transaction_id']

            # Update transaction status
            table_name = os.environ['TABLE_NAME']
            table = dynamodb.Table(table_name)

            table.update_item(
                Key={'transaction_id': transaction_id},
                UpdateExpression='SET #status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': 'processed'}
            )

            # Send to notifier queue
            queue_url = os.environ['NOTIFIER_QUEUE_URL']
            sqs.send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps({
                    'transaction_id': transaction_id,
                    'status': 'processed'
                })
            )

        return {'statusCode': 200}
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        raise
