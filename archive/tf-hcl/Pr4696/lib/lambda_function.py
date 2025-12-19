import json
import logging
import os
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Payment processor Lambda function
    Handles payment processing requests from API Gateway
    """
    
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Extract environment
    environment = os.environ.get('ENVIRONMENT', 'unknown')
    
    # Parse request body
    try:
        if event.get('body'):
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = {}
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            'body': json.dumps({
                'error': 'Invalid JSON in request body',
                'timestamp': datetime.utcnow().isoformat()
            })
        }
    
    # Extract payment details
    amount = body.get('amount', 0)
    currency = body.get('currency', 'USD')
    customer_id = body.get('customer_id', 'anonymous')
    payment_method = body.get('payment_method', 'unknown')
    
    # Log payment processing
    logger.info(f"Processing payment: amount={amount}, currency={currency}, customer={customer_id}")
    
    # Simulate payment processing
    # In real implementation, this would integrate with payment gateway
    # Use microseconds for unique transaction IDs even for concurrent requests
    transaction_id = f"txn_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
    
    # Success response
    response = {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://app.example.com',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        'body': json.dumps({
            'success': True,
            'transaction_id': transaction_id,
            'amount': amount,
            'currency': currency,
            'customer_id': customer_id,
            'payment_method': payment_method,
            'status': 'completed',
            'timestamp': datetime.utcnow().isoformat(),
            'environment': environment,
            'message': 'Payment processed successfully'
        })
    }
    
    logger.info(f"Payment processed: transaction_id={transaction_id}")
    
    return response