"""Payment Processing Lambda Function"""
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    """Process payment requests"""
    try:
        region = os.environ.get('REGION', 'unknown')
        db_endpoint = os.environ.get('DB_ENDPOINT', 'not-configured')
        table_name = os.environ.get('DYNAMODB_TABLE', 'not-configured')

        logger.info(f"Processing payment in region: {region}")

        body = json.loads(event.get('body', '{}'))
        payment_id = body.get('payment_id', 'unknown')
        amount = body.get('amount', 0)

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': True,
                'payment_id': payment_id,
                'amount': amount,
                'region': region,
                'db_endpoint': db_endpoint,
                'table': table_name
            })
        }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'success': False, 'error': str(e)})
        }
