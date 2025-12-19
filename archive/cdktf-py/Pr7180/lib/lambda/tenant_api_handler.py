```python
"""Lambda function handler for tenant API endpoints."""
import json
import os
import logging
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle API requests for tenant.

    Args:
        event: Lambda event object
        context: Lambda context object

    Returns:
        API Gateway formatted response
    """
    tenant_id = os.environ.get('TENANT_ID', 'unknown')
    environment = os.environ.get('ENVIRONMENT', 'dev')
    dynamodb_table = os.environ.get('DYNAMODB_TABLE', '')
    s3_bucket = os.environ.get('S3_BUCKET', '')

    logger.info(f"Processing request for tenant: {tenant_id}")

    try:
        http_method = event.get('httpMethod', 'UNKNOWN')
        path = event.get('path', '/')

        logger.info(f"Method: {http_method}, Path: {path}")

        if http_method == 'GET':
            response_body = {
                'message': f'Hello from {tenant_id}',
                'tenant_id': tenant_id,
                'environment': environment,
                'dynamodb_table': dynamodb_table,
                's3_bucket': s3_bucket,
                'status': 'active',
                'path': path
            }
            status_code = 200
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            response_body = {
                'message': f'Data received for {tenant_id}',
                'tenant_id': tenant_id,
                'received_data': body,
                'status': 'processed'
            }
            status_code = 201
        else:
            response_body = {
                'error': 'Method not allowed',
                'tenant_id': tenant_id
            }
            status_code = 405

        return {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json',
                'X-Tenant-Id': tenant_id
            },
            'body': json.dumps(response_body)
        }

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)

        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Tenant-Id': tenant_id
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'tenant_id': tenant_id,
                'message': str(e)
            })
        }
