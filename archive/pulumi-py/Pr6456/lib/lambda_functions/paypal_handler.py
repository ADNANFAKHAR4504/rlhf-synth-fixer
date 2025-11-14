import json
import boto3
import os
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.client('dynamodb')

def lambda_handler(event, context):
    """
    Process PayPal webhook events and store transaction data in DynamoDB
    """
    try:
        table_name = os.environ['TABLE_NAME']
        webhook_type = os.environ['WEBHOOK_TYPE']

        logger.info(f"Processing {webhook_type} webhook event")

        # Parse webhook payload
        if isinstance(event, dict) and 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Extract transaction details
        transaction_id = body.get('id', f"paypal-{datetime.utcnow().isoformat()}")

        # Store transaction in DynamoDB
        response = dynamodb.put_item(
            TableName=table_name,
            Item={
                'transactionId': {'S': transaction_id},
                'webhookType': {'S': webhook_type},
                'payload': {'S': json.dumps(body)},
                'timestamp': {'S': datetime.utcnow().isoformat()},
                'status': {'S': 'processed'}
            }
        )

        logger.info(f"Transaction {transaction_id} stored successfully")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook processed successfully',
                'transactionId': transaction_id
            })
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing webhook',
                'error': str(e)
            })
        }
