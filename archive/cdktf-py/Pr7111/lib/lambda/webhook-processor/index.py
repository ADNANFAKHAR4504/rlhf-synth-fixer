import json
import os
import boto3
import logging
from decimal import Decimal
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name)


def lambda_handler(event, context):
    """
    Webhook processor Lambda function.
    Receives cryptocurrency price updates and stores them in DynamoDB.
    """
    try:
        logger.info("Received event: %s", json.dumps(event))

        # Parse incoming webhook data
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event

        # Validate required fields
        if not all(key in body for key in ['symbol', 'price', 'exchange']):
            raise ValueError("Missing required fields: symbol, price, or exchange")

        # Prepare item for DynamoDB
        timestamp = int(datetime.utcnow().timestamp() * 1000)
        item = {
            'symbol': body['symbol'].upper(),
            'timestamp': timestamp,
            'price': Decimal(str(body['price'])),
            'exchange': body['exchange'],
            'volume': Decimal(str(body.get('volume', 0))),
            'raw_data': json.dumps(body),
            'processed': False,
            'created_at': datetime.utcnow().isoformat()
        }

        # Store in DynamoDB
        response = table.put_item(Item=item)

        logger.info("Successfully stored price for %s at %s", item['symbol'], item['timestamp'])

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Price data stored successfully',
                'symbol': item['symbol'],
                'timestamp': timestamp
            })
        }

    except ValueError as ve:
        logger.error("Validation error: %s", str(ve))
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'Invalid request',
                'message': str(ve)
            })
        }
    except Exception as e:
        logger.error("Error processing webhook: %s", str(e), exc_info=True)
        raise  # Re-raise to trigger DLQ
