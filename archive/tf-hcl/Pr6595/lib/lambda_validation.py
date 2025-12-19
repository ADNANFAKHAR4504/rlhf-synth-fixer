import json
import os
import boto3
import time
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Get environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def lambda_handler(event, context):
    """
    Validates payment transactions and updates DynamoDB with validation results.
    
    Args:
        event: Contains transaction_id, payment_amount, payment_method, customer_id
        context: Lambda context object
    
    Returns:
        Validation result with status and details
    """
    
    # Extract transaction details
    transaction_id = event.get('transaction_id')
    payment_amount = event.get('payment_amount')
    payment_method = event.get('payment_method')
    customer_id = event.get('customer_id')
    
    # Initialize response
    response = {
        'transaction_id': transaction_id,
        'validation_status': None,
        'validation_timestamp': datetime.utcnow().isoformat(),
        'validation_details': {}
    }
    
    try:
        # Connect to DynamoDB table
        table = dynamodb.Table(TABLE_NAME)
        
        # Perform validation checks
        validation_errors = []
        
        # Validate transaction_id
        if not transaction_id:
            validation_errors.append('Missing transaction_id')
        
        # Validate payment amount
        if not payment_amount or float(payment_amount) <= 0:
            validation_errors.append('Invalid payment amount')
        elif float(payment_amount) > 10000:
            validation_errors.append('Payment amount exceeds limit')
        
        # Validate payment method
        valid_payment_methods = ['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet']
        if payment_method not in valid_payment_methods:
            validation_errors.append(f'Invalid payment method: {payment_method}')
        
        # Validate customer_id
        if not customer_id:
            validation_errors.append('Missing customer_id')
        
        # Check for fraud indicators (simplified)
        fraud_score = 0
        if payment_amount and float(payment_amount) > 5000:
            fraud_score += 30
        
        # High-risk payment methods
        if payment_method == 'bank_transfer':
            fraud_score += 20
        
        # Add fraud check to validation
        if fraud_score > 50:
            validation_errors.append(f'High fraud risk score: {fraud_score}')
        
        # Determine validation status
        if validation_errors:
            response['validation_status'] = 'FAILED'
            response['validation_details']['errors'] = validation_errors
        else:
            response['validation_status'] = 'PASSED'
            response['validation_details']['fraud_score'] = fraud_score
        
        # Store validation results in DynamoDB
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'payment_amount': Decimal(str(payment_amount)),
                'payment_method': payment_method,
                'customer_id': customer_id,
                'validation_status': response['validation_status'],
                'validation_timestamp': response['validation_timestamp'],
                'validation_details': json.dumps(response['validation_details']),
                'processing_status': 'PENDING',
                'created_at': datetime.utcnow().isoformat()
            }
        )
        
        # If validation failed, notify via SNS
        if response['validation_status'] == 'FAILED':
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Payment Validation Failed',
                Message=json.dumps({
                    'transaction_id': transaction_id,
                    'validation_errors': validation_errors,
                    'timestamp': response['validation_timestamp']
                }, indent=2)
            )
            # Raise exception to trigger Step Functions error handling
            raise ValueError(f"Validation failed: {', '.join(validation_errors)}")
        
        return response
        
    except Exception as e:
        print(f"Error validating payment: {str(e)}")
        
        # Update DynamoDB with error status
        try:
            table = dynamodb.Table(TABLE_NAME)
            table.update_item(
                Key={'transaction_id': transaction_id},
                UpdateExpression='SET validation_status = :status, error_message = :error',
                ExpressionAttributeValues={
                    ':status': 'ERROR',
                    ':error': str(e)
                }
            )
        except:
            pass
        
        # Re-raise the exception for Step Functions to handle
        raise e