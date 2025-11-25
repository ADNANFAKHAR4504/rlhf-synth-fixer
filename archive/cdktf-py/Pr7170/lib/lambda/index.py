import json
import boto3
import os
import time
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Environment variables
TABLE_NAME = os.environ.get('DYNAMODB_TABLE', 'market-alerts')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')

# Get DynamoDB table
table = dynamodb.Table(TABLE_NAME)

# Price thresholds for alerts
PRICE_THRESHOLD_HIGH = 150.0
PRICE_THRESHOLD_LOW = 50.0


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for processing market data messages

    Args:
        event: SQS event with market data messages
        context: Lambda context

    Returns:
        Dict with batch item failures for retry
    """
    batch_item_failures = []

    for record in event.get('Records', []):
        message_id = record.get('messageId')

        try:
            # Parse message body
            body = json.loads(record.get('body', '{}'))

            # Process the market data
            process_market_data(body)

        except Exception as e:
            print(f"Error processing message {message_id}: {str(e)}")
            # Add to batch failures for retry with exponential backoff
            batch_item_failures.append({
                'itemIdentifier': message_id
            })

    # Return failed messages for retry
    return {
        'batchItemFailures': batch_item_failures
    }


def process_market_data(data: Dict[str, Any]) -> None:
    """
    Process market data and create alerts if thresholds are met

    Args:
        data: Market data dictionary with symbol and price
    """
    symbol = data.get('symbol')
    price = float(data.get('price', 0))
    timestamp = datetime.utcnow().isoformat()

    # Check if price crosses thresholds
    should_alert = False
    alert_type = None

    if price > PRICE_THRESHOLD_HIGH:
        should_alert = True
        alert_type = 'HIGH'
    elif price < PRICE_THRESHOLD_LOW:
        should_alert = True
        alert_type = 'LOW'

    if should_alert:
        # Write to DynamoDB with exponential backoff
        write_to_dynamodb_with_retry(symbol, timestamp, price, alert_type)

        # Publish to SNS with exponential backoff
        publish_to_sns_with_retry(symbol, price, alert_type)


def write_to_dynamodb_with_retry(
    symbol: str,
    timestamp: str,
    price: float,
    alert_type: str,
    max_retries: int = 3
) -> None:
    """
    Write alert to DynamoDB with exponential backoff retry logic

    Args:
        symbol: Stock symbol
        timestamp: ISO format timestamp
        price: Current price
        alert_type: Type of alert (HIGH or LOW)
        max_retries: Maximum number of retry attempts
    """
    for attempt in range(max_retries):
        try:
            table.put_item(
                Item={
                    'symbol': symbol,
                    'timestamp': timestamp,
                    'price': Decimal(str(price)),
                    'alert_type': alert_type,
                    'environment': ENVIRONMENT
                }
            )
            print(f"Successfully wrote alert for {symbol} to DynamoDB")
            return
        except Exception as e:
            wait_time = (2 ** attempt) + (time.time() % 1)  # Exponential backoff with jitter
            print(f"DynamoDB write attempt {attempt + 1} failed: {str(e)}")

            if attempt < max_retries - 1:
                print(f"Retrying in {wait_time:.2f} seconds...")
                time.sleep(wait_time)
            else:
                print(f"Failed to write to DynamoDB after {max_retries} attempts")
                raise


def publish_to_sns_with_retry(
    symbol: str,
    price: float,
    alert_type: str,
    max_retries: int = 3
) -> None:
    """
    Publish alert to SNS with exponential backoff retry logic

    Args:
        symbol: Stock symbol
        price: Current price
        alert_type: Type of alert (HIGH or LOW)
        max_retries: Maximum number of retry attempts
    """
    message = {
        'symbol': symbol,
        'price': price,
        'alert_type': alert_type,
        'timestamp': datetime.utcnow().isoformat()
    }

    for attempt in range(max_retries):
        try:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"Trading Alert: {symbol} - {alert_type}",
                Message=json.dumps(message, indent=2)
            )
            print(f"Successfully published alert for {symbol} to SNS")
            return
        except Exception as e:
            wait_time = (2 ** attempt) + (time.time() % 1)  # Exponential backoff with jitter
            print(f"SNS publish attempt {attempt + 1} failed: {str(e)}")

            if attempt < max_retries - 1:
                print(f"Retrying in {wait_time:.2f} seconds...")
                time.sleep(wait_time)
            else:
                print(f"Failed to publish to SNS after {max_retries} attempts")
                raise
