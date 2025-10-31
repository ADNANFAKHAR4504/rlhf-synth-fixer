"""
Consolidated payment processor Lambda function.

This function handles validation, processing, and notification in a single
optimized function with proper error handling and DLQ support.
"""

import json
import logging
import os
import time
import traceback
import uuid
from decimal import Decimal

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
payments_table = dynamodb.Table(os.environ['PAYMENTS_TABLE_NAME'])

sqs = boto3.client('sqs')


def decimal_default(obj):
    """JSON serializer for Decimal objects."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def validate_payment(payment_data):
    """
    Validate the payment data.
    
    Args:
        payment_data: Dictionary containing payment information
        
    Returns:
        True if validation passes
        
    Raises:
        ValueError: If validation fails
    """
    required_fields = ['amount', 'currency', 'payment_method', 'customer_id']
    
    for field in required_fields:
        if field not in payment_data:
            raise ValueError(f"Missing required field: {field}")
    
    amount = payment_data['amount']
    if not isinstance(amount, (int, float, Decimal)) or amount <= 0:
        raise ValueError("Payment amount must be greater than 0")
    
    if payment_data['currency'] not in ['USD', 'EUR', 'GBP']:
        raise ValueError(f"Unsupported currency: {payment_data['currency']}")
    
    return True


def process_payment(payment_data):
    """
    Process the payment transaction.
    
    Args:
        payment_data: Dictionary containing payment information
        
    Returns:
        Dictionary with payment result
    """
    payment_id = payment_data.get('id', str(uuid.uuid4()))
    
    payments_table.put_item(Item={
        'id': payment_id,
        'status': 'processed',
        'amount': Decimal(str(payment_data['amount'])),
        'currency': payment_data['currency'],
        'customer_id': payment_data['customer_id'],
        'payment_method': payment_data['payment_method'],
        'timestamp': Decimal(str(int(time.time())))
    })
    
    return {
        'payment_id': payment_id,
        'status': 'success'
    }


def send_notification(payment_result):
    """
    Send notification about the payment result.
    
    Args:
        payment_result: Dictionary containing payment result
        
    Returns:
        True if notification sent successfully
    """
    logger.info(f"Payment processed: {payment_result}")
    return True


def send_to_dlq(event, error):
    """
    Send failed events to Dead Letter Queue.
    
    Args:
        event: The original Lambda event
        error: The exception that occurred
    """
    try:
        message = {
            'event': event,
            'error': str(error),
            'stacktrace': traceback.format_exc()
        }
        
        sqs.send_message(
            QueueUrl=os.environ['DLQ_URL'],
            MessageBody=json.dumps(message, default=decimal_default)
        )
        logger.info(f"Sent failed event to DLQ: {error}")
    except Exception as dlq_error:
        logger.error(f"Failed to send to DLQ: {dlq_error}")


def handler(event, context):
    """
    Main Lambda handler function.
    
    Handles all payment processing operations including validation,
    processing, and notification.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    logger.info(f"Received event: {json.dumps(event, default=decimal_default)}")
    
    try:
        http_method = event.get('httpMethod', '')
        resource = event.get('resource', '')
        
        if http_method == 'POST' and resource == '/payments':
            payment_data = json.loads(event.get('body', '{}'))
            
            validate_payment(payment_data)
            
            payment_result = process_payment(payment_data)
            
            send_notification(payment_result)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps(payment_result)
            }
        
        elif http_method == 'GET' and resource == '/payments/{id}':
            payment_id = event.get('pathParameters', {}).get('id')
            
            if not payment_id:
                raise ValueError("Payment ID is required")
            
            response = payments_table.get_item(Key={'id': payment_id})
            
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Payment not found'})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps(response['Item'], default=decimal_default)
            }
        
        elif http_method == 'GET' and resource == '/payments':
            query_params = event.get('queryStringParameters', {}) or {}
            status = query_params.get('status')
            
            if status:
                response = payments_table.query(
                    IndexName='status-index',
                    KeyConditionExpression='#status = :status',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={':status': status}
                )
            else:
                response = payments_table.scan(Limit=100)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps(response.get('Items', []), default=decimal_default)
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Unsupported method or resource'})
            }
    
    except ValueError as validation_error:
        logger.error(f"Validation error: {str(validation_error)}")
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(validation_error)})
        }
    
    except Exception as e:
        logger.error(f"Error processing payment: {str(e)}")
        logger.error(traceback.format_exc())
        
        send_to_dlq(event, e)
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }


