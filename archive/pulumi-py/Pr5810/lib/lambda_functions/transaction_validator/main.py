import json
import os
import boto3
from decimal import Decimal

def handler(event, context):
    """
    Transaction validator Lambda function.
    Validates transaction data and business rules.
    """
    try:
        # Get environment variables
        environment = os.environ['ENVIRONMENT']
        dynamodb_table = os.environ['DYNAMODB_TABLE']
        
        # Initialize AWS clients
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(dynamodb_table)
        
        # Get transaction data
        transaction_data = json.loads(event['body']) if 'body' in event else event
        
        amount = Decimal(str(transaction_data.get('amount', 0)))
        user_id = transaction_data.get('user_id')
        
        # Validation rules
        validation_errors = []
        
        if amount <= 0:
            validation_errors.append("Amount must be greater than zero")
        
        if amount > Decimal('10000'):
            validation_errors.append("Amount exceeds maximum limit")
        
        if not user_id:
            validation_errors.append("User ID is required")
        
        # Return validation result
        if validation_errors:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'valid': False,
                    'errors': validation_errors,
                    'environment': environment
                })
            }
        else:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'valid': True,
                    'message': 'Transaction is valid',
                    'environment': environment
                })
            }
            
    except Exception as e:
        print(f"Error validating transaction: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Transaction validation failed',
                'message': str(e)
            })
        }