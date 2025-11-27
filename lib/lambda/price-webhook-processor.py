import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Processes incoming cryptocurrency price updates from exchange webhooks.
    Stores price updates in DynamoDB for alert matching.
    """
    print(f'Received price update event: {json.dumps(event)}')

    try:
        # Extract price data from webhook
        body = json.loads(event.get('body', '{}'))
        crypto_symbol = body.get('symbol', 'UNKNOWN')
        price = body.get('price', 0)
        exchange = body.get('exchange', 'unknown')

        print(f'Processing price update: {crypto_symbol} = ${price} from {exchange}')

        # Store price update in DynamoDB
        response = table.put_item(
            Item={
                'userId': 'system',
                'alertId': f'{crypto_symbol}#{datetime.utcnow().isoformat()}',
                'symbol': crypto_symbol,
                'price': str(price),
                'exchange': exchange,
                'timestamp': datetime.utcnow().isoformat(),
                'type': 'price_update'
            }
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Price update processed successfully',
                'symbol': crypto_symbol,
                'price': price,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
    except Exception as e:
        print(f'Error processing webhook: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
