import json
import os
import boto3
import logging
from typing import Dict, Any
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr

# Import utilities from layer
try:
    from utils import DecimalEncoder, format_response
except ImportError:
    # Fallback if layer is not available
    class DecimalEncoder(json.JSONEncoder):
        def default(self, obj):
            from decimal import Decimal
            if isinstance(obj, Decimal):
                return float(obj)
            return super(DecimalEncoder, self).default(obj)
    
    def format_response(status_code, body, headers=None):
        return {
            'statusCode': status_code,
            'headers': headers or {'Content-Type': 'application/json'},
            'body': json.dumps(body, cls=DecimalEncoder)
        }

dynamodb = boto3.resource('dynamodb')
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Get an inventory item by ID and optionally SKU"""
    try:
        # Get path parameters
        path_params = event.get('pathParameters', {})
        item_id = path_params.get('item_id')

        if not item_id:
            return format_response(400, {'error': 'Missing item_id parameter'})

        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        sku = query_params.get('sku')

        # Get table
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        if sku:
            # Get specific item using both keys
            response = table.get_item(
                Key={
                    'item_id': item_id,
                    'sku': sku
                }
            )

            if 'Item' not in response:
                return format_response(404, {'error': 'Item not found'})

            item = response['Item']
        else:
            # If no SKU provided, scan to find item by item_id (less efficient)
            response = table.scan(
                FilterExpression=Attr('item_id').eq(item_id),
                Limit=1
            )

            if not response.get('Items'):
                return format_response(404, {'error': 'Item not found'})

            item = response['Items'][0]

        logger.info(f"Retrieved item: {item_id}")

        return format_response(200, {'item': item})

    except ClientError as e:
        logger.error(f"DynamoDB error: {str(e)}")
        return format_response(500, {'error': 'Internal server error'})
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return format_response(500, {'error': 'Internal server error'})
