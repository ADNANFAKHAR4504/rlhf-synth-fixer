import json
import os
import boto3
from decimal import Decimal
from datetime import datetime
from typing import Dict, Any, List
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ENVIRONMENT = os.environ['ENVIRONMENT']

# Price drop threshold (percentage)
PRICE_DROP_THRESHOLD = 10.0

def decimal_to_float(obj):
    """Convert Decimal objects to float for JSON serialization."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def calculate_price_change(old_price: Decimal, new_price: Decimal) -> float:
    """Calculate percentage change between prices."""
    if old_price == 0:
        return 0.0

    change = ((new_price - old_price) / old_price) * 100
    return float(change)

def process_record(record: Dict) -> Dict[str, Any]:
    """Process a single DynamoDB stream record."""
    event_name = record.get('eventName')

    if event_name not in ['INSERT', 'MODIFY']:
        return None

    # Extract new and old images
    new_image = record.get('dynamodb', {}).get('NewImage', {})
    old_image = record.get('dynamodb', {}).get('OldImage', {})

    if not new_image:
        return None

    # Parse the data
    product_id = new_image.get('product_id', {}).get('S')
    retailer = new_image.get('retailer', {}).get('S')
    new_price = Decimal(new_image.get('price', {}).get('N', '0'))

    result = {
        'product_id': product_id,
        'retailer': retailer,
        'new_price': new_price,
        'event_type': event_name
    }

    # Check for price changes
    if old_image and event_name == 'MODIFY':
        old_price = Decimal(old_image.get('price', {}).get('N', '0'))
        result['old_price'] = old_price
        result['price_change'] = calculate_price_change(old_price, new_price)

        # Check if it's a significant price drop
        if result['price_change'] <= -PRICE_DROP_THRESHOLD:
            result['significant_drop'] = True

    return result

def send_notification(price_data: Dict[str, Any]) -> None:
    """Send price drop notification via SNS."""
    try:
        message = {
            'product_id': price_data['product_id'],
            'retailer': price_data['retailer'],
            'old_price': float(price_data.get('old_price', 0)),
            'new_price': float(price_data['new_price']),
            'price_change_percent': price_data['price_change'],
            'timestamp': datetime.utcnow().isoformat()
        }

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"Price Drop Alert: {price_data['product_id']}",
            Message=json.dumps(message, default=decimal_to_float),
            MessageAttributes={
                'product_id': {'DataType': 'String', 'StringValue': price_data['product_id']},
                'retailer': {'DataType': 'String', 'StringValue': price_data['retailer']},
                'price_change': {'DataType': 'Number', 'StringValue': str(price_data['price_change'])}
            }
        )

        logger.info(f"Sent notification for {price_data['product_id']}: {price_data['price_change']:.2f}% drop")

    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")
        raise

def send_metrics(price_changes: int, price_drops: int) -> None:
    """Send metrics to CloudWatch."""
    try:
        cloudwatch.put_metric_data(
            Namespace=f'PriceMonitor/{ENVIRONMENT}',
            MetricData=[
                {
                    'MetricName': 'PriceChanges',
                    'Value': price_changes,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'SignificantPriceDrops',
                    'Value': price_drops,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        logger.error(f"Failed to send metrics: {str(e)}")

def handler(event: Dict, context: Any) -> Dict:
    """Lambda handler for processing DynamoDB streams."""
    try:
        records = event.get('Records', [])

        if not records:
            logger.warning("No records to process")
            return {'statusCode': 200, 'body': json.dumps('No records to process')}

        price_changes = 0
        price_drops = 0
        notifications_sent = 0

        for record in records:
            try:
                result = process_record(record)

                if not result:
                    continue

                # Track metrics
                if 'price_change' in result:
                    price_changes += 1

                    # Send notification for significant price drops
                    if result.get('significant_drop'):
                        price_drops += 1
                        send_notification(result)
                        notifications_sent += 1

            except Exception as e:
                logger.error(f"Failed to process record: {str(e)}")
                # Continue processing other records
                continue

        # Send aggregated metrics
        send_metrics(price_changes, price_drops)

        response = {
            'statusCode': 200,
            'body': json.dumps({
                'processed': len(records),
                'price_changes': price_changes,
                'price_drops': price_drops,
                'notifications_sent': notifications_sent
            })
        }

        logger.info(f"Stream processing complete: {response}")
        return response

    except Exception as e:
        logger.error(f"Handler error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }