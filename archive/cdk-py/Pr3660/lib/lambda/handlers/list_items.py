import json
import os
import boto3
import logging
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

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
ssm = boto3.client('ssm')
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

def get_config():
    """Get configuration from Parameter Store"""
    try:
        param_name = os.environ.get('CONFIG_PARAMETER')
        if param_name:
            response = ssm.get_parameter(Name=param_name)
            return json.loads(response['Parameter']['Value'])
    except Exception as e:
        logger.error(f"Error getting config: {str(e)}")

    return {'max_items_per_page': 50, 'default_page_size': 20}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """List inventory items with pagination and filtering"""
    try:
        # Get configuration
        config = get_config()

        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        category = query_params.get('category')
        status = query_params.get('status')
        page_size = min(
            int(query_params.get('page_size', config['default_page_size'])),
            config['max_items_per_page']
        )
        last_evaluated_key = query_params.get('last_evaluated_key')

        # Get table
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        # Build query parameters
        query_kwargs = {'Limit': page_size}

        if last_evaluated_key:
            query_kwargs['ExclusiveStartKey'] = json.loads(last_evaluated_key)

        # Query based on filters
        if category:
            # Use category index
            query_kwargs['IndexName'] = 'category-index'
            query_kwargs['KeyConditionExpression'] = Key('category').eq(category)
            response = table.query(**query_kwargs)
        elif status:
            # Use status index
            query_kwargs['IndexName'] = 'status-index'
            query_kwargs['KeyConditionExpression'] = Key('status').eq(status)
            response = table.query(**query_kwargs)
        else:
            # Scan table (less efficient but necessary for unfiltered listing)
            response = table.scan(**query_kwargs)

        # Prepare response
        result = {
            'items': response.get('Items', []),
            'count': response.get('Count', 0)
        }

        # Add pagination token if there are more results
        if 'LastEvaluatedKey' in response:
            result['next_page_token'] = json.dumps(response['LastEvaluatedKey'])

        logger.info(f"Listed {result['count']} items")

        return format_response(200, result)

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
