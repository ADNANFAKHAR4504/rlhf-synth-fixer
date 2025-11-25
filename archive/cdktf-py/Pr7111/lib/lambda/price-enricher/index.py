import json
import os
import boto3
import logging
from decimal import Decimal
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name)


def lambda_handler(event, context):
    """
    Price enricher Lambda function.
    Triggered by DynamoDB streams to calculate moving averages and volatility metrics.
    """
    try:
        logger.info("Processing %s records from DynamoDB stream", len(event['Records']))

        for record in event['Records']:
            if record['eventName'] in ['INSERT', 'MODIFY']:
                process_price_record(record)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {len(event["Records"])} records'
            })
        }

    except Exception as e:
        logger.error("Error enriching price data: %s", str(e), exc_info=True)
        raise  # Re-raise to trigger DLQ


def process_price_record(record):
    """Process a single DynamoDB stream record and add enrichment data."""
    try:
        # Extract data from stream record
        new_image = record['dynamodb']['NewImage']
        symbol = new_image['symbol']['S']
        timestamp = int(new_image['timestamp']['N'])
        current_price = Decimal(new_image['price']['N'])

        logger.info("Processing enrichment for %s at %s", symbol, timestamp)

        # Calculate moving averages (5-period and 20-period)
        ma_5 = calculate_moving_average(symbol, timestamp, periods=5)
        ma_20 = calculate_moving_average(symbol, timestamp, periods=20)

        # Calculate volatility
        volatility = calculate_volatility(symbol, timestamp, periods=10)

        # Update DynamoDB item with enrichment data
        table.update_item(
            Key={
                'symbol': symbol,
                'timestamp': timestamp
            },
            UpdateExpression=(
                'SET processed = :processed, ma_5 = :ma5, ma_20 = :ma20, '
                'volatility = :vol, enriched_at = :enriched'
            ),
            ExpressionAttributeValues={
                ':processed': True,
                ':ma5': ma_5,
                ':ma20': ma_20,
                ':vol': volatility,
                ':enriched': datetime.utcnow().isoformat()
            }
        )

        logger.info(
            "Successfully enriched data for %s: MA5=%s, MA20=%s, Vol=%s",
            symbol, ma_5, ma_20, volatility
        )

    except Exception as e:
        logger.error("Error processing record: %s", str(e), exc_info=True)
        raise


def calculate_moving_average(symbol, current_timestamp, periods=5):
    """Calculate moving average for the specified number of periods."""
    try:
        # Query recent prices (simplified - in production, use proper pagination)
        response = table.query(
            KeyConditionExpression='symbol = :symbol AND #ts <= :ts',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':symbol': symbol,
                ':ts': current_timestamp
            },
            ScanIndexForward=False,
            Limit=periods
        )

        items = response.get('Items', [])
        if len(items) < periods:
            logger.warning(
                "Not enough data points for MA%s: %s/%s",
                periods, len(items), periods
            )
            return Decimal('0')

        total = sum(Decimal(item['price']) for item in items)
        ma = total / Decimal(periods)

        return round(ma, 2)

    except Exception as e:
        logger.error("Error calculating moving average: %s", str(e))
        raise


def calculate_volatility(symbol, current_timestamp, periods=10):
    """Calculate price volatility (standard deviation)."""
    try:
        # Query recent prices
        response = table.query(
            KeyConditionExpression='symbol = :symbol AND #ts <= :ts',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':symbol': symbol,
                ':ts': current_timestamp
            },
            ScanIndexForward=False,
            Limit=periods
        )

        items = response.get('Items', [])
        if len(items) < periods:
            logger.warning(
                "Not enough data points for volatility: %s/%s",
                len(items), periods
            )
            return Decimal('0')

        prices = [Decimal(item['price']) for item in items]
        mean_price = sum(prices) / Decimal(len(prices))

        # Calculate standard deviation
        variance = (
            sum((price - mean_price) ** 2 for price in prices) /
            Decimal(len(prices))
        )
        volatility = variance.sqrt()

        return round(volatility, 4)

    except Exception as e:
        logger.error("Error calculating volatility: %s", str(e))
        raise
