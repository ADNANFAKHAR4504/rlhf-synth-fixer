"""
Order Processor Lambda - Processes orders from SQS and stores in DynamoDB
"""
import json
import os
import boto3
from datetime import datetime
from typing import Dict, Any, List
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

table_name = os.environ['ORDERS_TABLE']
topic_arn = os.environ['SNS_TOPIC']
customer_gsi = os.environ['CUSTOMER_ID_GSI']

table = dynamodb.Table(table_name)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process batch of orders from SQS
    Returns batch item failures for proper DLQ handling
    """
    batch_item_failures = []

    for record in event['Records']:
        try:
            # Parse message from SQS
            message_body = json.loads(record['body'])

            order_id = message_body['orderId']
            customer_id = message_body['customerId']
            items = message_body['items']
            received_at = message_body.get('receivedAt', datetime.utcnow().isoformat())

            # Validate order data
            if not validate_order(order_id, customer_id, items):
                print(f"Invalid order data: {order_id}")
                # Don't add to batch failures - invalid orders go to DLQ
                continue

            # Calculate order total (simplified)
            total = calculate_order_total(items)

            # Store order in DynamoDB
            table.put_item(
                Item={
                    'orderId': order_id,
                    'customerId': customer_id,
                    'items': items,
                    'total': total,
                    'status': 'processing',
                    'timestamp': datetime.utcnow().isoformat(),
                    'receivedAt': received_at,
                    'processedAt': datetime.utcnow().isoformat(),
                    'ttl': int((datetime.utcnow().timestamp() + (90 * 24 * 60 * 60)))  # 90 days TTL
                }
            )

            print(f"Order stored successfully: {order_id}")

            # Publish notification to SNS
            try:
                sns.publish(
                    TopicArn=topic_arn,
                    Subject='Order Processing Notification',
                    Message=json.dumps({
                        'orderId': order_id,
                        'customerId': customer_id,
                        'status': 'processing',
                        'total': str(total),
                        'timestamp': datetime.utcnow().isoformat()
                    }),
                    MessageAttributes={
                        'eventType': {
                            'DataType': 'String',
                            'StringValue': 'OrderProcessed'
                        },
                        'customerId': {
                            'DataType': 'String',
                            'StringValue': customer_id
                        }
                    }
                )
                print(f"Notification sent for order: {order_id}")
            except Exception as sns_error:
                # Log SNS error but don't fail the whole process
                print(f"Error sending SNS notification: {str(sns_error)}")

        except Exception as e:
            print(f"Error processing message: {str(e)}")
            print(f"Failed record: {record}")
            # Add to batch failures for retry
            batch_item_failures.append({
                'itemIdentifier': record['messageId']
            })

    # Return batch item failures for SQS to retry
    return {
        'batchItemFailures': batch_item_failures
    }

def validate_order(order_id: str, customer_id: str, items: List[Dict]) -> bool:
    """Validate order data structure"""
    if not order_id or not isinstance(order_id, str):
        return False
    if not customer_id or not isinstance(customer_id, str):
        return False
    if not items or not isinstance(items, list) or len(items) == 0:
        return False

    # Validate each item has required fields
    for item in items:
        if not isinstance(item, dict):
            return False
        if 'itemId' not in item or 'quantity' not in item:
            return False

    return True

def calculate_order_total(items: List[Dict]) -> Decimal:
    """Calculate order total from items"""
    total = Decimal('0')
    for item in items:
        price = Decimal(str(item.get('price', 0)))
        quantity = Decimal(str(item.get('quantity', 1)))
        total += price * quantity
    return total
