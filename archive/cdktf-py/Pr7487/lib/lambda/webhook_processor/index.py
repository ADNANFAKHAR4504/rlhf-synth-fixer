import json
import boto3
import os
import logging
from datetime import datetime
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """
    Webhook processor Lambda function to receive cryptocurrency price updates.
    Validates incoming data and writes to DynamoDB.
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Parse incoming webhook payload
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event

        # Validate required fields
        required_fields = ['symbol', 'price', 'exchange']
        for field in required_fields:
            if field not in body:
                raise ValueError(f"Missing required field: {field}")

        # Normalize data
        symbol = body['symbol'].upper()
        price = Decimal(str(body['price']))
        exchange = body['exchange']
        timestamp = int(datetime.utcnow().timestamp())

        # Validate price is positive
        if price <= 0:
            raise ValueError(f"Invalid price value: {price}")

        # Prepare item for DynamoDB
        item = {
            'symbol': symbol,
            'timestamp': timestamp,
            'price': price,
            'exchange': exchange,
            'raw_data': json.dumps(body),
            'processed_at': datetime.utcnow().isoformat()
        }

        # Write to DynamoDB
        response = table.put_item(Item=item)
        logger.info(f"Successfully wrote item to DynamoDB: {symbol} @ {price}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Price update processed successfully',
                'symbol': symbol,
                'timestamp': timestamp
            })
        }

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'Validation error',
                'message': str(e)
            })
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}", exc_info=True)
        raise
