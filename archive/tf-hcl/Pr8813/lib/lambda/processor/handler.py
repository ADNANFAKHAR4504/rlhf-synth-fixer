import json
import os
import logging
import boto3
from datetime import datetime
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE_NAME')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """
    Processes validated payment events and stores in DynamoDB
    """
    logger.info(f"Processing event: {json.dumps(event)}")

    try:
        # Extract validated event
        event_data = event.get('event', {})
        if isinstance(event_data, str):
            event_data = json.loads(event_data)

        # Handle nested Payload structure from Step Functions
        if 'Payload' in event_data:
            event_data = event_data['Payload']
        if 'body' in event_data:
            event_data = event_data['body']

        event_id = event_data.get('event_id')
        timestamp = event_data.get('validation_timestamp', int(datetime.utcnow().timestamp()))

        # Process event
        processed_event = {
            'event_id': event_id,
            'timestamp': timestamp,
            'payment_provider': event_data.get('payment_provider'),
            'transaction_id': event_data.get('transaction_id'),
            'amount': Decimal(str(event_data.get('amount', 0))),
            'status': 'PROCESSED',
            'processing_timestamp': int(datetime.utcnow().timestamp()),
            'raw_event': json.dumps(event_data),
            'processor_version': '1.0'
        }

        # Store in DynamoDB
        table.put_item(Item=processed_event)

        logger.info(f"Event processed and stored: {event_id}")

        return {
            'statusCode': 200,
            'body': {
                **event_data,
                'processing_status': 'PROCESSED',
                'processing_timestamp': processed_event['processing_timestamp']
            }
        }

    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        raise
