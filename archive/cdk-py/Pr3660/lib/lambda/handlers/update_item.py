import json
import os
import boto3
from decimal import Decimal
from datetime import datetime
import logging
from typing import Dict, Any
from botocore.exceptions import ClientError

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
    """Update an existing inventory item"""
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

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        if not body or 'sku' not in body:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing SKU in request body'})
            }

        # Get table
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        # Build update expression
        update_expression_parts = []
        expression_attribute_names = {}
        expression_attribute_values = {':updated_at': datetime.utcnow().isoformat()}

        # Add updated_at
        update_expression_parts.append('#updated_at = :updated_at')
        expression_attribute_names['#updated_at'] = 'updated_at'

        # Update fields if provided
        updateable_fields = ['name', 'description', 'quantity', 'price', 'category', 'status']
        for field in updateable_fields:
            if field in body:
                placeholder = f'#{field}'
                value_placeholder = f':{field}'
                update_expression_parts.append(f'{placeholder} = {value_placeholder}')
                expression_attribute_names[placeholder] = field

                # Handle numeric types
                if field == 'quantity':
                    expression_attribute_values[value_placeholder] = int(body[field])
                elif field == 'price':
                    expression_attribute_values[value_placeholder] = Decimal(str(body[field]))
                else:
                    expression_attribute_values[value_placeholder] = body[field]

        # Perform update
        response = table.update_item(
            Key={
                'item_id': item_id,
                'sku': body['sku']
            },
            UpdateExpression='SET ' + ', '.join(update_expression_parts),
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ConditionExpression='attribute_exists(item_id)',
            ReturnValues='ALL_NEW'
        )

        logger.info(f"Updated item: {item_id}")

        return format_response(200, {
            'message': 'Item updated successfully',
            'item': response['Attributes']
        })

    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Item not found'})
            }
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
