import json
import os
import boto3
import logging
from typing import Dict, Any
from botocore.exceptions import ClientError

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
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing item_id parameter'})
            }

        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        sku = query_params.get('sku')

        # Get table
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        # Build key
        key = {'item_id': item_id}
        if sku:
            key['sku'] = sku
        else:
            # If no SKU provided, we need to query to find the item
            response = table.query(
                KeyConditionExpression='item_id = :item_id',
                ExpressionAttributeValues={':item_id': item_id},
                Limit=1
            )

            if not response.get('Items'):
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Item not found'})
                }

            item = response['Items'][0]
        else:
            # Get specific item
            response = table.get_item(Key=key)

            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Item not found'})
                }

            item = response['Item']

        logger.info(f"Retrieved item: {item_id}")

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'item': item})
        }

    except ClientError as e:
        logger.error(f"DynamoDB error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
