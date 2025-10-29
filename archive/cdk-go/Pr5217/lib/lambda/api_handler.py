"""
API Handler Lambda - Receives orders from API Gateway and queues them in SQS
"""
import json
import os
import uuid
import boto3
from datetime import datetime
from typing import Dict, Any

sqs = boto3.client('sqs')
queue_url = os.environ['ORDER_QUEUE_URL']

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle incoming order requests from API Gateway
    Validates basic structure and queues orders for processing
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Basic validation (additional validation at API Gateway level)
        if not body.get('orderId'):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'orderId is required'})
            }

        if not body.get('customerId'):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'customerId is required'})
            }

        if not body.get('items') or not isinstance(body['items'], list):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'items must be a non-empty array'})
            }

        # Enrich order with metadata
        order_message = {
            'orderId': body['orderId'],
            'customerId': body['customerId'],
            'items': body['items'],
            'receivedAt': datetime.utcnow().isoformat(),
            'messageId': str(uuid.uuid4())
        }

        # Send to SQS for asynchronous processing
        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(order_message),
            MessageAttributes={
                'customerId': {
                    'StringValue': body['customerId'],
                    'DataType': 'String'
                },
                'priority': {
                    'StringValue': body.get('priority', 'normal'),
                    'DataType': 'String'
                }
            }
        )

        print(f"Order queued successfully: {body['orderId']}, MessageId: {response['MessageId']}")

        return {
            'statusCode': 202,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Order received and queued for processing',
                'orderId': body['orderId'],
                'messageId': response['MessageId']
            })
        }

    except json.JSONDecodeError as e:
        print(f"Invalid JSON in request body: {e}")
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Invalid JSON format'})
        }

    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
