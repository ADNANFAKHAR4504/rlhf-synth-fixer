# lambda_transaction.py

import json
import boto3
import os
import time
import uuid
import hashlib
from decimal import Decimal
from typing import Dict, Any, Optional
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch boto3 for X-Ray tracing
patch_all()

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

# Constants
MAX_AMOUNT = Decimal('1000000')  # Maximum transaction amount
MIN_AMOUNT = Decimal('0.01')     # Minimum transaction amount

class TransactionError(Exception):
    """Custom exception for transaction errors"""
    pass

@xray_recorder.capture('validate_transaction')
def validate_transaction(transaction: Dict[str, Any]) -> Dict[str, Any]:
    """Validate transaction data"""
    required_fields = ['amount', 'currency', 'recipient', 'type']
    
    # Check required fields
    for field in required_fields:
        if field not in transaction:
            raise TransactionError(f'Missing required field: {field}')
    
    # Validate amount
    try:
        amount = Decimal(str(transaction['amount']))
        if amount < MIN_AMOUNT or amount > MAX_AMOUNT:
            raise TransactionError(f'Amount must be between {MIN_AMOUNT} and {MAX_AMOUNT}')
    except (ValueError, TypeError):
        raise TransactionError('Invalid amount format')
    
    # Validate currency
    valid_currencies = ['USD', 'EUR', 'GBP']
    if transaction['currency'] not in valid_currencies:
        raise TransactionError(f'Invalid currency. Must be one of: {valid_currencies}')
    
    # Validate transaction type
    valid_types = ['transfer', 'payment', 'refund']
    if transaction['type'] not in valid_types:
        raise TransactionError(f'Invalid transaction type. Must be one of: {valid_types}')
    
    return {
        **transaction,
        'amount': amount
    }

@xray_recorder.capture('process_transaction')
def process_transaction(transaction: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """Process and store transaction"""
    # Generate transaction ID
    transaction_id = str(uuid.uuid4())
    timestamp = int(time.time() * 1000)  # Millisecond precision
    
    # Create transaction record
    transaction_record = {
        'transactionId': transaction_id,
        'timestamp': timestamp,
        'userId': user_id,
        'amount': transaction['amount'],
        'currency': transaction['currency'],
        'recipient': transaction['recipient'],
        'type': transaction['type'],
        'status': 'completed',  # Set as completed immediately for synchronous processing
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat(),
        'metadata': transaction.get('metadata', {}),
        'hash': generate_transaction_hash(transaction_id, user_id, str(transaction['amount']))
    }
    
    # Additional fields for GDPR compliance
    if 'ip_address' in transaction:
        # Hash IP address for privacy
        transaction_record['hashedIp'] = hashlib.sha256(transaction['ip_address'].encode()).hexdigest()
    
    # Store in DynamoDB
    try:
        table.put_item(
            Item=transaction_record,
            ConditionExpression='attribute_not_exists(transactionId)'
        )
        
    except Exception as e:
        print(f"Error storing transaction: {e}")
        raise TransactionError('Failed to process transaction')
    
    return transaction_record

@xray_recorder.capture('update_transaction_status')
def update_transaction_status(transaction_id: str, status: str) -> None:
    """Update transaction status in DynamoDB"""
    try:
        table.update_item(
            Key={'transactionId': transaction_id, 'timestamp': timestamp},
            UpdateExpression='SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': status,
                ':updatedAt': datetime.utcnow().isoformat()
            }
        )
    except Exception as e:
        print(f"Error updating transaction status: {e}")

def generate_transaction_hash(transaction_id: str, user_id: str, amount: str) -> str:
    """Generate a hash for transaction integrity"""
    data = f"{transaction_id}:{user_id}:{amount}:{int(time.time())}"
    return hashlib.sha256(data.encode()).hexdigest()

def build_response(status_code: int, body: Any, headers: Optional[Dict] = None) -> Dict:
    """Build API Gateway response"""
    response = {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # Configure based on allowed origins
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'X-Request-ID': str(uuid.uuid4())
        },
        'body': json.dumps(body, default=str)
    }
    
    if headers:
        response['headers'].update(headers)
    
    return response

@xray_recorder.capture('lambda_handler')
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict:
    """Main Lambda handler for transaction processing"""
    print(f"Transaction event: {json.dumps(event)}")
    
    try:
        # Parse request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        # Extract user context from authorizer
        authorizer_context = event.get('requestContext', {}).get('authorizer', {})
        user_id = authorizer_context.get('userId')
        
        if not user_id:
            return build_response(401, {'error': 'Unauthorized'})
        
        # Add request metadata
        body['ip_address'] = event.get('requestContext', {}).get('identity', {}).get('sourceIp')
        
        # Validate transaction
        validated_transaction = validate_transaction(body)
        
        # Process transaction
        result = process_transaction(validated_transaction, user_id)
        
        # Remove sensitive data from response
        response_data = {
            'transactionId': result['transactionId'],
            'status': result['status'],
            'timestamp': result['timestamp'],
            'amount': str(result['amount']),
            'currency': result['currency'],
            'type': result['type']
        }
        
        return build_response(200, {
            'message': 'Transaction processed successfully',
            'transaction': response_data
        })
    
    except TransactionError as e:
        print(f"Transaction error: {e}")
        return build_response(400, {'error': str(e)})
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        xray_recorder.capture_exception()
        return build_response(500, {'error': 'Internal server error'})