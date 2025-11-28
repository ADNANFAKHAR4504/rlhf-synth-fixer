import json
import boto3
import os
import logging
from decimal import Decimal
from statistics import mean, stdev

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name)

def calculate_moving_average(prices, window=10):
    """Calculate simple moving average"""
    if len(prices) < window:
        window = len(prices)
    return mean(prices[-window:]) if prices else 0

def calculate_volatility(prices):
    """Calculate price volatility (standard deviation)"""
    if len(prices) < 2:
        return 0
    return stdev(prices)

def lambda_handler(event, context):
    """
    Price enricher Lambda function triggered by DynamoDB Streams.
    Adds moving averages and volatility metrics to price data.
    """
    try:
        logger.info(f"Processing {len(event['Records'])} records from DynamoDB Stream")

        for record in event['Records']:
            if record['eventName'] not in ['INSERT', 'MODIFY']:
                logger.info(f"Skipping record with eventName: {record['eventName']}")
                continue

            # Extract new image from DynamoDB Stream record
            new_image = record['dynamodb']['NewImage']

            symbol = new_image['symbol']['S']
            timestamp = int(new_image['timestamp']['N'])
            current_price = Decimal(new_image['price']['N'])

            logger.info(f"Processing enrichment for {symbol} at {timestamp}")

            # Query historical prices for this symbol
            response = table.query(
                KeyConditionExpression='symbol = :symbol',
                ExpressionAttributeValues={
                    ':symbol': symbol
                },
                ScanIndexForward=False,  # Most recent first
                Limit=50  # Last 50 records for calculations
            )

            historical_prices = [float(item['price']) for item in response['Items']]

            # Calculate metrics
            ma_10 = Decimal(str(calculate_moving_average(historical_prices, 10)))
            ma_20 = Decimal(str(calculate_moving_average(historical_prices, 20)))
            volatility = Decimal(str(calculate_volatility(historical_prices)))

            # Calculate price change percentage
            if len(historical_prices) > 1:
                previous_price = historical_prices[1]
                price_change_pct = Decimal(str(((float(current_price) - previous_price) / previous_price) * 100))
            else:
                price_change_pct = Decimal('0')

            # Update DynamoDB item with enriched data
            table.update_item(
                Key={
                    'symbol': symbol,
                    'timestamp': timestamp
                },
                UpdateExpression='SET ma_10 = :ma10, ma_20 = :ma20, volatility = :vol, price_change_pct = :pct, enriched = :enriched',
                ExpressionAttributeValues={
                    ':ma10': ma_10,
                    ':ma20': ma_20,
                    ':vol': volatility,
                    ':pct': price_change_pct,
                    ':enriched': True
                }
            )

            logger.info(f"Successfully enriched data for {symbol}: MA10={ma_10}, MA20={ma_20}, Vol={volatility}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {len(event["Records"])} records'
            })
        }

    except Exception as e:
        logger.error(f"Error enriching price data: {str(e)}", exc_info=True)
        raise
