"""
Transaction Validator Lambda Function
Validates incoming transaction data for fraud detection system.
"""
import json
import boto3
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Validate transaction data.
    
    Args:
        event: Lambda event containing transaction data
        context: Lambda context
        
    Returns:
        Dict containing validation result
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Extract transaction data
        transaction = event.get('transaction', {})
        
        # Validate required fields
        required_fields = ['transaction_id', 'amount', 'merchant', 'timestamp', 'card_number']
        missing_fields = [field for field in required_fields if field not in transaction]
        
        if missing_fields:
            return {
                'statusCode': 400,
                'status': 'VALIDATION_FAILED',
                'error': f"Missing required fields: {', '.join(missing_fields)}",
                'transaction': transaction
            }
        
        # Validate data types and values
        validation_errors = []
        
        # Amount validation
        try:
            amount = float(transaction['amount'])
            if amount <= 0:
                validation_errors.append("Amount must be greater than 0")
            if amount > 50000:  # Reasonable upper limit
                validation_errors.append("Amount exceeds maximum limit")
        except (ValueError, TypeError):
            validation_errors.append("Amount must be a valid number")
        
        # Transaction ID validation
        if not isinstance(transaction.get('transaction_id'), str) or len(transaction['transaction_id']) == 0:
            validation_errors.append("Transaction ID must be a non-empty string")
        
        # Merchant validation
        if not isinstance(transaction.get('merchant'), str) or len(transaction['merchant']) == 0:
            validation_errors.append("Merchant must be a non-empty string")
        
        # Timestamp validation
        try:
            timestamp = int(transaction['timestamp'])
            if timestamp <= 0:
                validation_errors.append("Timestamp must be a positive integer")
        except (ValueError, TypeError):
            validation_errors.append("Timestamp must be a valid integer")
        
        # Card number basic validation (simplified)
        card_number = transaction.get('card_number', '')
        if not isinstance(card_number, str) or len(card_number) < 13 or len(card_number) > 19:
            validation_errors.append("Card number must be between 13-19 digits")
        
        if validation_errors:
            return {
                'statusCode': 400,
                'status': 'VALIDATION_FAILED',
                'errors': validation_errors,
                'transaction': transaction
            }
        
        # If validation passes
        validated_transaction = {
            'transaction_id': transaction['transaction_id'],
            'amount': float(transaction['amount']),
            'merchant': transaction['merchant'],
            'timestamp': int(transaction['timestamp']),
            'card_number': transaction['card_number'][-4:],  # Only store last 4 digits
            'card_number_hash': hash(transaction['card_number']),  # Hash for comparison
            'validation_timestamp': context.aws_request_id if context else None
        }
        
        logger.info(f"Transaction validation successful: {transaction['transaction_id']}")
        
        return {
            'statusCode': 200,
            'status': 'VALIDATION_PASSED',
            'transaction': validated_transaction
        }
        
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'VALIDATION_ERROR',
            'error': str(e)
        }