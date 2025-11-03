"""
Order service Lambda handler.

Handles order-related operations with DynamoDB.
Uses only boto3 and standard library - no external dependencies.
"""

import json
import logging
import os
import time
from decimal import Decimal

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
orders_table = dynamodb.Table(os.environ['ORDERS_TABLE_NAME'])


def decimal_default(obj):
    """JSON serializer for Decimal objects."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def handler(event, context):
    """
    Main Lambda handler for order service.
    
    Args:
        event: API Gateway event or Step Functions input
        context: Lambda context
        
    Returns:
        Response dict
    """
    logger.info(f"Received event: {json.dumps(event, default=decimal_default)}")
    
    try:
        # Handle both API Gateway and direct invocation (Step Functions)
        http_method = event.get('httpMethod', '')
        
        # Direct invocation (Step Functions) - data is in event root
        if not http_method and 'orderId' in event:
            order_id = event.get('orderId')
            user_id = event.get('userId')
            product_id = event.get('productId')
            quantity = event.get('quantity', '1')
            
            if not order_id or not user_id or not product_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'orderId, userId, and productId are required'})
                }
            
            orders_table.put_item(Item={
                'orderId': order_id,
                'userId': user_id,
                'productId': product_id,
                'quantity': Decimal(str(quantity)),
                'status': 'pending',
                'createdAt': Decimal(str(int(time.time())))
            })
            
            return {
                'statusCode': 200,
                'body': json.dumps({'orderId': order_id, 'status': 'created'})
            }
        
        # API Gateway invocation
        if http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            order_id = body.get('orderId')
            user_id = body.get('userId')
            product_id = body.get('productId')
            quantity = body.get('quantity', 1)
            
            if not order_id or not user_id or not product_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'orderId, userId, and productId are required'})
                }
            
            orders_table.put_item(Item={
                'orderId': order_id,
                'userId': user_id,
                'productId': product_id,
                'quantity': Decimal(str(quantity)),
                'status': 'pending',
                'createdAt': Decimal(str(int(time.time())))
            })
            
            return {
                'statusCode': 200,
                'body': json.dumps({'orderId': order_id, 'status': 'created'})
            }
        
        elif http_method == 'GET':
            order_id = event.get('pathParameters', {}).get('orderId')
            
            if not order_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'orderId is required'})
                }
            
            response = orders_table.get_item(Key={'orderId': order_id})
            
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': 'Order not found'})
                }
            
            return {
                'statusCode': 200,
                'body': json.dumps(response['Item'], default=decimal_default)
            }
        
        else:
            return {
                'statusCode': 405,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

