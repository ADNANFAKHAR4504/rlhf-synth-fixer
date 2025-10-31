"""
Product service Lambda handler.

Handles product-related operations with DynamoDB.
Uses only boto3 and standard library - no external dependencies.
"""

import json
import logging
import os
from decimal import Decimal

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
products_table = dynamodb.Table(os.environ['PRODUCTS_TABLE_NAME'])


def decimal_default(obj):
    """JSON serializer for Decimal objects."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def handler(event, context):
    """
    Main Lambda handler for product service.
    
    Args:
        event: API Gateway event or Step Functions input
        context: Lambda context
        
    Returns:
        Response dict
    """
    logger.info(f"Received event: {json.dumps(event, default=decimal_default)}")
    
    try:
        http_method = event.get('httpMethod', '')
        
        if http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            product_id = body.get('productId')
            name = body.get('name')
            category = body.get('category')
            price = body.get('price')
            
            if not product_id or not name or not category:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'productId, name, and category are required'})
                }
            
            products_table.put_item(Item={
                'productId': product_id,
                'name': name,
                'category': category,
                'price': Decimal(str(price)) if price else Decimal('0'),
                'status': 'available'
            })
            
            return {
                'statusCode': 200,
                'body': json.dumps({'productId': product_id, 'status': 'created'})
            }
        
        elif http_method == 'GET':
            product_id = event.get('pathParameters', {}).get('productId')
            
            if not product_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'productId is required'})
                }
            
            response = products_table.get_item(Key={'productId': product_id})
            
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': 'Product not found'})
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

