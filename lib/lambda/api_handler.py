"""
API Handler Lambda Function
Handles API Gateway requests and interacts with RDS database
"""
import json
import os
import logging
from datetime import datetime
from decimal import Decimal

# Configure logging
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger = logging.getLogger()
logger.setLevel(log_level)


def handler(event, context):
    """
    Main handler function for API Gateway requests
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    path = event.get('path', '')
    http_method = event.get('httpMethod', '')
    
    try:
        if path == '/health' and http_method == 'GET':
            return handle_health_check(event, context)
        elif path == '/metrics' and http_method == 'GET':
            return handle_metrics_request(event, context)
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Not Found',
                    'message': f'Path {path} not found'
                })
            }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal Server Error',
                'message': str(e)
            })
        }


def handle_health_check(event, context):
    """
    Handle health check endpoint
    """
    logger.info("Health check requested")
    
    db_host = os.environ.get('DB_HOST', 'not-configured')
    db_name = os.environ.get('DB_NAME', 'not-configured')
    dynamodb_table = os.environ.get('DYNAMODB_TABLE', 'not-configured')
    
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'cloudwatch-analytics-api',
        'version': '1.0.0',
        'environment': {
            'db_configured': db_host != 'not-configured',
            'db_host': db_host,
            'db_name': db_name,
            'dynamodb_table': dynamodb_table
        },
        'lambda': {
            'function_name': context.function_name,
            'memory_limit': context.memory_limit_in_mb,
            'request_id': context.request_id,
            'remaining_time': context.get_remaining_time_in_millis()
        }
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(health_status)
    }


def handle_metrics_request(event, context):
    """
    Handle metrics retrieval endpoint
    Returns aggregated metrics from DynamoDB
    """
    logger.info("Metrics request received")
    
    try:
        import boto3
        
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ.get('DYNAMODB_TABLE')
        
        if not table_name:
            raise ValueError("DYNAMODB_TABLE environment variable not set")
        
        table = dynamodb.Table(table_name)
        
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        limit = int(query_params.get('limit', '10'))
        metric_id = query_params.get('metricId')
        
        if metric_id:
            # Query specific metric
            response = table.query(
                KeyConditionExpression='metricId = :metricId',
                ExpressionAttributeValues={
                    ':metricId': metric_id
                },
                Limit=limit,
                ScanIndexForward=False
            )
        else:
            # Scan for recent metrics
            response = table.scan(Limit=limit)
        
        items = response.get('Items', [])
        
        # Convert Decimal to float for JSON serialization
        def decimal_default(obj):
            if isinstance(obj, Decimal):
                return float(obj)
            raise TypeError
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'metrics': items,
                'count': len(items),
                'timestamp': datetime.utcnow().isoformat()
            }, default=decimal_default)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving metrics: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Failed to retrieve metrics',
                'message': str(e)
            })
        }

