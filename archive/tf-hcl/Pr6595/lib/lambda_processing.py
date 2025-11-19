import json
import os
import boto3
import time
import random
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
    Processes payment transactions and records the final transaction state.
    
    Args:
        event: Contains transaction details and validation results
        context: Lambda context object
    
    Returns:
        Processing result with final transaction state
    """
    
    # Extract transaction details
    transaction_id = event.get('transaction_id')
    payment_amount = event.get('payment_amount')
    payment_method = event.get('payment_method')
    customer_id = event.get('customer_id')
    validation_result = event.get('validation_result', {})
    
    # Initialize response
    response = {
        'transaction_id': transaction_id,
        'processing_status': None,
        'processing_timestamp': datetime.utcnow().isoformat(),
        'processing_details': {}
    }
    
    try:
        # Connect to DynamoDB table
        table = dynamodb.Table(TABLE_NAME)
        
        # Verify validation passed
        if validation_result.get('validation_status') != 'PASSED':
            raise ValueError('Cannot process payment without successful validation')
        
        # Simulate payment gateway communication
        gateway_response = process_payment_gateway(
            transaction_id=transaction_id,
            payment_amount=payment_amount,
            payment_method=payment_method,
            customer_id=customer_id
        )
        
        # Process gateway response
        if gateway_response['status'] == 'SUCCESS':
            response['processing_status'] = 'COMPLETED'
            response['processing_details'] = {
                'gateway_transaction_id': gateway_response['gateway_transaction_id'],
                'authorization_code': gateway_response['authorization_code'],
                'processing_time_ms': gateway_response['processing_time_ms']
            }
        else:
            response['processing_status'] = 'FAILED'
            response['processing_details'] = {
                'error_code': gateway_response.get('error_code'),
                'error_message': gateway_response.get('error_message'),
                'gateway_response': gateway_response
            }
        
        # Update DynamoDB with processing results
        table.update_item(
            Key={'transaction_id': transaction_id},
            UpdateExpression='''
                SET processing_status = :status,
                    processing_timestamp = :timestamp,
                    processing_details = :details,
                    final_status = :final,
                    updated_at = :updated
            ''',
            ExpressionAttributeValues={
                ':status': response['processing_status'],
                ':timestamp': response['processing_timestamp'],
                ':details': json.dumps(response['processing_details']),
                ':final': 'SUCCESS' if response['processing_status'] == 'COMPLETED' else 'FAILED',
                ':updated': datetime.utcnow().isoformat()
            }
        )
        
        # If processing failed, notify via SNS
        if response['processing_status'] == 'FAILED':
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Payment Processing Failed',
                Message=json.dumps({
                    'transaction_id': transaction_id,
                    'processing_error': response['processing_details'],
                    'timestamp': response['processing_timestamp']
                }, indent=2)
            )
            # Raise exception to trigger Step Functions error handling
            raise ValueError(f"Payment processing failed: {response['processing_details'].get('error_message')}")
        
        return response
        
    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        
        # Update DynamoDB with error status
        try:
            table = dynamodb.Table(TABLE_NAME)
            table.update_item(
                Key={'transaction_id': transaction_id},
                UpdateExpression='SET processing_status = :status, error_message = :error, final_status = :final',
                ExpressionAttributeValues={
                    ':status': 'ERROR',
                    ':error': str(e),
                    ':final': 'ERROR'
                }
            )
        except:
            pass
        
        # Send error notification
        try:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Payment Processing Error',
                Message=json.dumps({
                    'transaction_id': transaction_id,
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                }, indent=2)
            )
        except:
            pass
        
        # Re-raise the exception for Step Functions to handle
        raise e


def process_payment_gateway(transaction_id, payment_amount, payment_method, customer_id):
    """
    Simulates payment gateway communication.
    In production, this would make actual API calls to payment providers.
    
    Args:
        transaction_id: Unique transaction identifier
        payment_amount: Amount to process
        payment_method: Payment method to use
        customer_id: Customer identifier
    
    Returns:
        Gateway response with status and details
    """
    
    # Simulate processing time
    processing_start = time.time()
    time.sleep(random.uniform(0.5, 2.0))  # Simulate API latency
    
    # Simulate different response scenarios
    random_value = random.random()
    
    if random_value < 0.85:  # 85% success rate
        return {
            'status': 'SUCCESS',
            'gateway_transaction_id': f'GTW-{transaction_id}-{int(time.time())}',
            'authorization_code': f'AUTH-{random.randint(100000, 999999)}',
            'processing_time_ms': int((time.time() - processing_start) * 1000)
        }
    elif random_value < 0.95:  # 10% insufficient funds
        return {
            'status': 'FAILED',
            'error_code': 'INSUFFICIENT_FUNDS',
            'error_message': 'Transaction declined due to insufficient funds',
            'processing_time_ms': int((time.time() - processing_start) * 1000)
        }
    else:  # 5% gateway errors
        return {
            'status': 'FAILED',
            'error_code': 'GATEWAY_ERROR',
            'error_message': 'Payment gateway temporarily unavailable',
            'processing_time_ms': int((time.time() - processing_start) * 1000)
        }