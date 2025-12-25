import json
import os
import logging
import boto3
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE_NAME')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """
    Enriches processed events with additional metadata
    """
    logger.info(f"Enriching event: {json.dumps(event)}")

    try:
        # Extract processed event
        event_data = event.get('event', {})
        if isinstance(event_data, str):
            event_data = json.loads(event_data)

        # Handle nested Payload structure
        if 'Payload' in event_data:
            event_data = event_data['Payload']
        if 'body' in event_data:
            event_data = event_data['body']

        event_id = event_data.get('event_id')
        timestamp = event_data.get('processing_timestamp', int(datetime.utcnow().timestamp()))

        # Enrichment data
        enrichment = {
            'enrichment_timestamp': int(datetime.utcnow().timestamp()),
            'enricher_version': '1.0',
            'compliance_checked': True,
            'fraud_score': 0.05,
            'risk_level': 'LOW',
            'geo_location': 'US-EAST',
            'currency': 'USD'
        }

        # Update DynamoDB with enrichment
        table.update_item(
            Key={
                'event_id': event_id,
                'timestamp': timestamp
            },
            UpdateExpression='SET enrichment = :enrichment, #status = :status',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':enrichment': enrichment,
                ':status': 'ENRICHED'
            }
        )

        logger.info(f"Event enriched: {event_id}")

        return {
            'statusCode': 200,
            'body': {
                **event_data,
                'enrichment': enrichment,
                'final_status': 'COMPLETED'
            }
        }

    except Exception as e:
        logger.error(f"Enrichment error: {str(e)}")
        raise
