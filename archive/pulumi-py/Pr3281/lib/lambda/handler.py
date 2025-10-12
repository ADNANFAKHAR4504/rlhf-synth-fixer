import json
import os
import time
import boto3
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')

# Environment variables
TABLE_NAME = os.environ['TABLE_NAME']
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
CONFIG_PARAM = os.environ.get('CONFIG_PARAM')
DB_PARAM = os.environ.get('DB_PARAM')
FEATURE_FLAGS_PARAM = os.environ.get('FEATURE_FLAGS_PARAM')

# Cache for SSM parameters
_parameter_cache = {}
_cache_expiry = {}
CACHE_TTL = 300  # 5 minutes

def get_parameter(name: str, decrypt: bool = True) -> str:
    """Get parameter from SSM with caching."""
    current_time = time.time()

    if name in _parameter_cache and current_time < _cache_expiry.get(name, 0):
        return _parameter_cache[name]

    try:
        response = ssm.get_parameter(Name=name, WithDecryption=decrypt)
        value = response['Parameter']['Value']
        _parameter_cache[name] = value
        _cache_expiry[name] = current_time + CACHE_TTL
        return value
    except Exception as e:
        logger.error(f"Failed to get parameter {name}: {str(e)}")
        raise

@tracer.capture_method
def validate_tracking_data(data: Dict[str, Any]) -> bool:
    """Validate tracking data structure."""
    required_fields = ['tracking_id', 'status', 'location']

    for field in required_fields:
        if field not in data:
            logger.warning(f"Missing required field: {field}")
            return False

    if 'lat' not in data['location'] or 'lng' not in data['location']:
        logger.warning("Location missing lat or lng")
        return False

    valid_statuses = ['pending', 'in_transit', 'delivered', 'failed']
    if data['status'] not in valid_statuses:
        logger.warning(f"Invalid status: {data['status']}")
        return False

    return True

@tracer.capture_method
def store_tracking_update(data: Dict[str, Any]) -> Dict[str, Any]:
    """Store tracking update in DynamoDB."""
    table = dynamodb.Table(TABLE_NAME)
    timestamp = int(time.time() * 1000)

    item = {
        'tracking_id': data['tracking_id'],
        'timestamp': timestamp,
        'status': data['status'],
        'location': data['location'],
        'environment': ENVIRONMENT,
        'created_at': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())
    }

    if 'metadata' in data:
        item['metadata'] = data['metadata']

    try:
        table.put_item(Item=item)
        metrics.add_metric(name="TrackingUpdateStored", unit=MetricUnit.Count, value=1)
        return item
    except Exception as e:
        logger.error(f"Failed to store tracking update: {str(e)}")
        metrics.add_metric(name="TrackingUpdateFailed", unit=MetricUnit.Count, value=1)
        raise

@tracer.capture_method
def get_tracking_status(tracking_id: str) -> list:
    """Get tracking status from DynamoDB."""
    table = dynamodb.Table(TABLE_NAME)

    try:
        response = table.query(
            KeyConditionExpression='tracking_id = :tid',
            ExpressionAttributeValues={
                ':tid': tracking_id
            },
            ScanIndexForward=False,
            Limit=10
        )

        metrics.add_metric(name="StatusQuerySuccess", unit=MetricUnit.Count, value=1)
        return response.get('Items', [])
    except Exception as e:
        logger.error(f"Failed to get tracking status: {str(e)}")
        metrics.add_metric(name="StatusQueryFailed", unit=MetricUnit.Count, value=1)
        raise

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def main(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Main Lambda handler."""

    logger.info(f"Processing request: {json.dumps(event)}")

    try:
        # Load feature flags
        feature_flags = json.loads(get_parameter(FEATURE_FLAGS_PARAM, decrypt=False))
        logger.info(f"Feature flags: {feature_flags}")

        http_method = event.get('httpMethod', '')
        path = event.get('path', '')

        if http_method == 'POST' and path == '/track':
            # Handle tracking update
            body = json.loads(event.get('body', '{}'))

            if not validate_tracking_data(body):
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Invalid tracking data'}),
                    'headers': {'Content-Type': 'application/json'}
                }

            result = store_tracking_update(body)

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Tracking update stored successfully',
                    'tracking_id': result['tracking_id'],
                    'timestamp': result['timestamp']
                }),
                'headers': {'Content-Type': 'application/json'}
            }

        if http_method == 'GET' and path == '/status':
            # Handle status query
            query_params = event.get('queryStringParameters') or {}
            tracking_id = query_params.get('tracking_id')

            if not tracking_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'tracking_id parameter required'}),
                    'headers': {'Content-Type': 'application/json'}
                }

            items = get_tracking_status(tracking_id)

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'tracking_id': tracking_id,
                    'updates': items,
                    'count': len(items)
                }),
                'headers': {'Content-Type': 'application/json'}
            }

        # No matching route found
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Not found'}),
            'headers': {'Content-Type': 'application/json'}
        }

    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}")
        metrics.add_metric(name="UnhandledException", unit=MetricUnit.Count, value=1)

        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'}),
            'headers': {'Content-Type': 'application/json'}
        }
