import json
import os
import boto3
from datetime import datetime
import uuid

s3_client = boto3.client('s3')
sns_client = boto3.client('sns')

def handler(event, context):
    """
    Transaction processing Lambda function
    Processes validated payment transactions
    """

    print(f"Received event: {json.dumps(event)}")

    environment = os.environ.get('ENVIRONMENT', 'dev')
    transaction_logs_bucket = os.environ.get('TRANSACTION_LOGS_BUCKET')
    sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')

    try:
        # Parse request body
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Generate transaction ID
        transaction_id = str(uuid.uuid4())

        # Extract transaction details
        amount = body.get('amount')
        currency = body.get('currency', 'USD')
        payment_method = body.get('payment_method')
        customer_id = body.get('customer_id')

        # Simulate transaction processing
        transaction_status = 'completed'

        # Create transaction log
        transaction_log = {
            'transaction_id': transaction_id,
            'timestamp': datetime.utcnow().isoformat(),
            'environment': environment,
            'status': transaction_status,
            'amount': amount,
            'currency': currency,
            'payment_method': payment_method,
            'customer_id': customer_id
        }

        # Store transaction log in S3
        log_key = f"transactions/{datetime.utcnow().strftime('%Y/%m/%d')}/{transaction_id}.json"
        s3_client.put_object(
            Bucket=transaction_logs_bucket,
            Key=log_key,
            Body=json.dumps(transaction_log),
            ContentType='application/json'
        )

        print(f"Transaction log stored: s3://{transaction_logs_bucket}/{log_key}")

        # Return success response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': transaction_id,
                'status': transaction_status
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }

    except Exception as e:
        error_message = str(e)
        print(f"Error processing transaction: {error_message}")

        # Send SNS alert for failed transaction
        try:
            sns_client.publish(
                TopicArn=sns_topic_arn,
                Subject='Transaction Processing Failed',
                Message=f"Transaction failed in {environment} environment.\n\nError: {error_message}\n\nEvent: {json.dumps(event)}"
            )
        except Exception as sns_error:
            print(f"Failed to send SNS alert: {str(sns_error)}")

        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Transaction processing failed',
                'error': error_message
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
