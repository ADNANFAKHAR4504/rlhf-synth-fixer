import json
import boto3
import os
import time
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """
    Validates transactions against business rules.
    Stores validation results in DynamoDB.
    """
    try:
        reconciliation_id = event['reconciliation_id']
        transaction_count = event['transaction_count']
        
        # Get table names from environment
        transaction_table_name = os.environ['TRANSACTION_TABLE']
        results_table_name = os.environ['RESULTS_TABLE']
        
        transaction_table = dynamodb.Table(transaction_table_name)
        results_table = dynamodb.Table(results_table_name)
        
        # Query transactions for this reconciliation
        response = transaction_table.scan(
            FilterExpression='reconciliation_id = :rid',
            ExpressionAttributeValues={':rid': reconciliation_id}
        )
        
        transactions = response['Items']
        
        # Validate transactions
        valid_count = 0
        invalid_count = 0
        discrepancies = []
        
        for transaction in transactions:
            is_valid = validate_transaction(transaction)
            
            if is_valid:
                valid_count += 1
                transaction_table.update_item(
                    Key={'transaction_id': transaction['transaction_id']},
                    UpdateExpression='SET #status = :status',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={':status': 'valid'}
                )
            else:
                invalid_count += 1
                discrepancies.append({
                    'transaction_id': transaction['transaction_id'],
                    'reason': 'Validation failed',
                    'amount': transaction.get('amount', '0')
                })
                transaction_table.update_item(
                    Key={'transaction_id': transaction['transaction_id']},
                    UpdateExpression='SET #status = :status',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={':status': 'invalid'}
                )
        
        # Store validation results
        timestamp = int(time.time())
        results_table.put_item(Item={
            'reconciliation_id': reconciliation_id,
            'timestamp': timestamp,
            'total_transactions': transaction_count,
            'valid_transactions': valid_count,
            'invalid_transactions': invalid_count,
            'discrepancies': discrepancies,
            'status': 'validated'
        })
        
        return {
            'statusCode': 200,
            'reconciliation_id': reconciliation_id,
            'valid_count': valid_count,
            'invalid_count': invalid_count,
            'discrepancies': discrepancies
        }
        
    except Exception as e:
        print(f"Error validating transactions: {str(e)}")
        raise

def validate_transaction(transaction):
    """
    Business logic for transaction validation.
    Returns True if transaction is valid, False otherwise.
    """
    try:
        # Check if amount is present and valid
        amount = float(transaction.get('amount', 0))
        if amount <= 0:
            return False
        
        # Check if provider is present
        provider = transaction.get('provider', '')
        if not provider:
            return False
        
        # Check if timestamp is present
        timestamp = transaction.get('timestamp', '')
        if not timestamp:
            return False
        
        return True
        
    except (ValueError, TypeError):
        return False
