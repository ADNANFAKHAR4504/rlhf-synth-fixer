import json
import os
import boto3
from datetime import datetime

def handler(event, context):
    """
    Payment validation Lambda function
    Validates payment requests before processing
    """

    print(f"Received event: {json.dumps(event)}")

    environment = os.environ.get('ENVIRONMENT', 'dev')

    try:
        # Parse request body
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Extract payment details
        amount = body.get('amount')
        currency = body.get('currency', 'USD')
        payment_method = body.get('payment_method')
        customer_id = body.get('customer_id')

        # Validation rules
        errors = []

        if not amount:
            errors.append("Amount is required")
        elif not isinstance(amount, (int, float)) or amount <= 0:
            errors.append("Amount must be a positive number")

        if not currency or len(currency) != 3:
            errors.append("Valid 3-letter currency code is required")

        if not payment_method:
            errors.append("Payment method is required")

        if not customer_id:
            errors.append("Customer ID is required")

        # Check for errors
        if errors:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'message': 'Validation failed',
                    'errors': errors
                }),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }

        # Validation successful
        validation_result = {
            'valid': True,
            'timestamp': datetime.utcnow().isoformat(),
            'environment': environment,
            'payment_details': {
                'amount': amount,
                'currency': currency,
                'payment_method': payment_method,
                'customer_id': customer_id
            }
        }

        return {
            'statusCode': 200,
            'body': json.dumps(validation_result),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Internal server error',
                'error': str(e)
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
