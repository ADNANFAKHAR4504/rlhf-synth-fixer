import json
import os
import boto3
from decimal import Decimal
import uuid
from datetime import datetime
from typing import Dict, Any
import logging
from botocore.exceptions import ClientError

# Import utilities from layer
try:
    from utils import DecimalEncoder, validate_item_data, format_response
except ImportError:
    # Fallback if layer is not available
    class DecimalEncoder(json.JSONEncoder):
        def default(self, obj):
            from decimal import Decimal
            if isinstance(obj, Decimal):
                return float(obj)
            return super(DecimalEncoder, self).default(obj)
    
    def validate_item_data(item_data):
        required_fields = ['sku', 'name', 'quantity', 'category']
        for field in required_fields:
            if field not in item_data:
                return False, f"Missing required field: {field}"
        return True, "Valid"
    
    def format_response(status_code, body, headers=None):
        return {
            'statusCode': status_code,
            'headers': headers or {'Content-Type': 'application/json'},
            'body': json.dumps(body, cls=DecimalEncoder)
        }

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

        # Validate request data
        is_valid, validation_message = validate_item_data(body)
        if not is_valid:
            return format_response(400, {'error': validation_message})

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
            'price': Decimal(str(body.get('price', 0))) if body.get('price') is not None else Decimal('0'),
            'category': body['category'],
            'status': body.get('status', 'available'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        # Note: SKU uniqueness is handled by the composite key (item_id + sku)
        # Multiple items can have the same SKU with different item_ids if needed

        # Put item in DynamoDB
        # UUID collision is extremely unlikely, so no condition expression needed
        table.put_item(Item=item)

        logger.info(f"Created item: {item_id}")

        return format_response(201, {
            'message': 'Item created successfully',
            'item': item
        })

    except ClientError as e:
        logger.error(f"DynamoDB error: {str(e)}")
        return format_response(500, {'error': 'Internal server error'})
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return format_response(500, {'error': 'Internal server error'})
