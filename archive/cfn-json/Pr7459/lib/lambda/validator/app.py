import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Validates incoming trade data
    """
    try:
        # Extract trade data from event
        trade_data = event.get('Payload', event)
        
        # Validation logic
        required_fields = ['tradeId', 'amount', 'currency', 'sourceSystem']
        for field in required_fields:
            if field not in trade_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate amount is positive
        if Decimal(str(trade_data['amount'])) <= 0:
            raise ValueError("Trade amount must be positive")
        
        # Return validation result
        return {
            'statusCode': 200,
            'body': {
                'valid': True,
                'tradeId': trade_data['tradeId'],
                'validatedAt': context.invoked_function_arn
            }
        }
    
    except Exception as e:
        print(f"Validation error: {str(e)}")
        return {
            'statusCode': 400,
            'body': {
                'valid': False,
                'error': str(e)
            }
        }
