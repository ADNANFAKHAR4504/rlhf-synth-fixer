"""
Lambda function handler for payment processing.
"""

import json
import os
import boto3
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process payment requests.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """

    print(f"Processing payment request: {json.dumps(event)}")

    # Get environment variables
    db_secret_arn = os.environ.get('DB_SECRET_ARN')
    dynamodb_table = os.environ.get('DYNAMODB_TABLE')
    environment = os.environ.get('ENVIRONMENT')

    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Extract payment details
        payment_id = body.get('payment_id')
        amount = body.get('amount')
        currency = body.get('currency', 'USD')

        if not payment_id or not amount:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields: payment_id, amount'})
            }

        # Process payment (simplified for demo)
        response_data = {
            'payment_id': payment_id,
            'amount': amount,
            'currency': currency,
            'status': 'processed',
            'environment': environment,
            'message': f'Payment processed successfully in {environment} environment'
        }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps(response_data)
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Payment processing failed: {str(e)}'})
        }
