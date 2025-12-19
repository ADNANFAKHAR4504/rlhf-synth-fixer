import json
import os
import boto3
from datetime import datetime

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def lambda_handler(event, context):
    """Process accounting updates from SQS messages"""

    table_name = os.environ['TABLE_NAME']
    sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')

    processed_count = 0
    failed_count = 0

    for record in event['Records']:
        try:
            # Parse SQS message
            message = json.loads(record['body'])
            transaction_id = message['transaction_id']

            # Update DynamoDB with accounting status
            table = dynamodb.Table(table_name)
            table.update_item(
                Key={
                    'transaction_id': transaction_id,
                    'timestamp': message['timestamp']
                },
                UpdateExpression='SET #status = :status, accounting_processed_at = :processed_at',
                ExpressionAttributeNames={
                    '#status': 'status'
                },
                ExpressionAttributeValues={
                    ':status': 'accounting_processed',
                    ':processed_at': datetime.utcnow().isoformat()
                }
            )

            processed_count += 1
            print(f"Successfully processed transaction: {transaction_id}")

        except Exception as e:
            failed_count += 1
            error_message = f"Failed to process transaction: {str(e)}"
            print(error_message)

            # Send failure notification to SNS if configured
            if sns_topic_arn and 'transaction_id' in message:
                try:
                    sns.publish(
                        TopicArn=sns_topic_arn,
                        Subject='Payment Processing Failure',
                        Message=json.dumps({
                            'error': error_message,
                            'transaction_id': message.get('transaction_id'),
                            'timestamp': datetime.utcnow().isoformat()
                        })
                    )
                except Exception as sns_error:
                    print(f"Failed to send SNS notification: {str(sns_error)}")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': processed_count,
            'failed': failed_count
        })
    }
