import json
import os
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Lambda handler for trade processing

    This function processes trade requests from API Gateway.
    In production, this would connect to RDS Aurora and process trades.
    """
    logger.info(f"Processing trade request in region: {os.getenv('REGION')}")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT')}")
    logger.info(f"Event: {json.dumps(event)}")

    try:
        # Parse request body
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event

        # Validate trade request
        if 'symbol' not in body or 'quantity' not in body:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': 'Missing required fields: symbol and quantity'
                })
            }

        # Process trade (placeholder)
        trade_result = {
            'trade_id': f"TRADE-{context.request_id}",
            'symbol': body['symbol'],
            'quantity': body['quantity'],
            'status': 'SUCCESS',
            'region': os.getenv('REGION'),
            'environment': os.getenv('ENVIRONMENT'),
            'db_endpoint': os.getenv('DB_ENDPOINT')
        }

        logger.info(f"Trade processed successfully: {trade_result['trade_id']}")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps(trade_result)
        }

    except Exception as e:
        logger.error(f"Error processing trade: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
