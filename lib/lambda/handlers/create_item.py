import json
import os
import boto3
import uuid
from datetime import datetime
from typing import Dict, Any
import logging
from botocore.exceptions import ClientError

# Initialize clients
dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Create a new inventory item"""
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['sku', 'name', 'quantity', 'category']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }

        # Get table name from environment
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        # Generate item_id
        item_id = str(uuid.uuid4())

        # Prepare item
        item = {
            'item_id': item_id,
            'sku': body['sku'],
            'name': body['name'],
            'description': body.get('description', ''),
            'quantity': int(body['quantity']),
            'price': float(body.get('price', 0)),
            'category': body['category'],
            'status': body.get('status', 'available'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        # Check if SKU already exists
        existing = table.query(
            IndexName='status-index',
            KeyConditionExpression='#status = :status AND item_id = :item_id',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'available',
                ':item_id': item_id
            },
            Limit=1
        )

        # Put item in DynamoDB
        table.put_item(
            Item=item,
            ConditionExpression='attribute_not_exists(item_id)'
        )

        logger.info(f"Created item: {item_id}")

        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Item created successfully',
                'item': item
            })
        }

    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            return {
                'statusCode': 409,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Item with this SKU already exists'})
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
