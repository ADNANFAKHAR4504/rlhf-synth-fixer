import json
import boto3
import os
import time
import logging
from decimal import Decimal
from datetime import datetime
import hashlib
import urllib3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
http = urllib3.PoolManager()

# Environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
SQS_QUEUE_URL = os.environ['SQS_QUEUE_URL']
FRAUD_API_URL = os.environ.get('FRAUD_API_URL', 'https://api.fraud-detection.internal/validate')

# DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)

def handler(event, context):
    """
    Process payment transactions from SQS FIFO queue with fraud detection
    """
    logger.info(f"Processing batch of {len(event['Records'])} messages")
    
    failed_messages = []
    
    for record in event['Records']:
        try:
            # Parse message body
            message = json.loads(record['body'])
            transaction_id = message.get('transaction_id')
            amount = Decimal(str(message.get('amount', 0)))
            currency = message.get('currency', 'USD')
            customer_id = message.get('customer_id')
            merchant_id = message.get('merchant_id')
            payment_method = message.get('payment_method')
            
            logger.info(f"Processing transaction: {transaction_id}")
            
            # Validate required fields
            if not all([transaction_id, amount, customer_id, merchant_id]):
                raise ValueError("Missing required transaction fields")
            
            # Update initial status in DynamoDB
            update_transaction_status(
                transaction_id=transaction_id,
                status='PROCESSING',
                details=message,
                timestamp=datetime.utcnow().isoformat()
            )
            
            # Perform fraud detection with exponential backoff
            fraud_check_result = check_fraud_with_retry(
                transaction_id=transaction_id,
                amount=float(amount),
                customer_id=customer_id,
                merchant_id=merchant_id
            )
            
            # Process based on fraud check result
            if fraud_check_result['risk_score'] < 0.7:
                # Low risk - approve transaction
                process_payment(
                    transaction_id=transaction_id,
                    amount=amount,
                    payment_method=payment_method
                )
                
                update_transaction_status(
                    transaction_id=transaction_id,
                    status='APPROVED',
                    details={
                        **message,
                        'fraud_score': fraud_check_result['risk_score'],
                        'fraud_check_id': fraud_check_result.get('check_id')
                    },
                    timestamp=datetime.utcnow().isoformat()
                )
                
                logger.info(f"Transaction {transaction_id} approved")
                
            elif fraud_check_result['risk_score'] >= 0.9:
                # High risk - reject transaction
                update_transaction_status(
                    transaction_id=transaction_id,
                    status='REJECTED',
                    details={
                        **message,
                        'fraud_score': fraud_check_result['risk_score'],
                        'fraud_check_id': fraud_check_result.get('check_id'),
                        'rejection_reason': 'High fraud risk'
                    },
                    timestamp=datetime.utcnow().isoformat()
                )
                
                logger.warning(f"Transaction {transaction_id} rejected due to high fraud risk")
                
            else:
                # Medium risk - flag for manual review
                update_transaction_status(
                    transaction_id=transaction_id,
                    status='PENDING_REVIEW',
                    details={
                        **message,
                        'fraud_score': fraud_check_result['risk_score'],
                        'fraud_check_id': fraud_check_result.get('check_id')
                    },
                    timestamp=datetime.utcnow().isoformat()
                )
                
                logger.info(f"Transaction {transaction_id} flagged for manual review")
            
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)
            
            # Update status to failed
            try:
                update_transaction_status(
                    transaction_id=message.get('transaction_id', 'unknown'),
                    status='FAILED',
                    details={
                        'error': str(e),
                        'message': message
                    },
                    timestamp=datetime.utcnow().isoformat()
                )
            except:
                pass
            
            # Track failed message for potential retry
            failed_messages.append({
                'itemIdentifier': record['messageId']
            })
    
    # Return batch item failures for retry
    if failed_messages:
        return {
            'batchItemFailures': failed_messages
        }
    
    return {'statusCode': 200}

def check_fraud_with_retry(transaction_id, amount, customer_id, merchant_id, max_retries=3):
    """
    Check fraud with exponential backoff retry logic
    """
    for attempt in range(max_retries):
        try:
            # Prepare request payload
            payload = json.dumps({
                'transaction_id': transaction_id,
                'amount': amount,
                'customer_id': customer_id,
                'merchant_id': merchant_id,
                'timestamp': datetime.utcnow().isoformat()
            })
            
            # Make fraud detection API call
            response = http.request(
                'POST',
                FRAUD_API_URL,
                body=payload,
                headers={
                    'Content-Type': 'application/json',
                    'X-Transaction-ID': transaction_id
                },
                timeout=5.0,
                retries=False
            )
            
            if response.status == 200:
                result = json.loads(response.data)
                return {
                    'risk_score': result.get('risk_score', 0.5),
                    'check_id': result.get('check_id'),
                    'factors': result.get('factors', [])
                }
            elif response.status >= 500:
                # Server error - retry
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 0.5  # Exponential backoff
                    logger.warning(f"Fraud API returned {response.status}, retrying in {wait_time}s")
                    time.sleep(wait_time)
                    continue
                else:
                    raise Exception(f"Fraud API failed with status {response.status}")
            else:
                # Client error - don't retry
                raise Exception(f"Fraud API error: {response.status} - {response.data}")
                
        except urllib3.exceptions.TimeoutError:
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 0.5
                logger.warning(f"Fraud API timeout, retrying in {wait_time}s")
                time.sleep(wait_time)
                continue
            else:
                raise
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 0.5
                logger.warning(f"Fraud API error: {str(e)}, retrying in {wait_time}s")
                time.sleep(wait_time)
                continue
            else:
                raise
    
    # Default to medium risk if all retries fail
    logger.error("All fraud check attempts failed, defaulting to medium risk")
    return {
        'risk_score': 0.5,
        'check_id': None,
        'factors': ['fraud_check_failed']
    }

def process_payment(transaction_id, amount, payment_method):
    """
    Process the actual payment (mock implementation)
    """
    logger.info(f"Processing payment for transaction {transaction_id}: {amount} via {payment_method}")
    
    # Mock payment processing
    # In production, this would integrate with payment gateway
    time.sleep(0.1)  # Simulate processing time
    
    return {
        'status': 'success',
        'authorization_code': hashlib.md5(transaction_id.encode()).hexdigest()[:8].upper()
    }

def update_transaction_status(transaction_id, status, details, timestamp):
    """
    Update transaction status in DynamoDB
    """
    try:
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'payment_status': status,
                'timestamp': timestamp,
                'details': details,
                'ttl': int(time.time()) + 86400 * 30  # 30 days TTL
            }
        )
        logger.info(f"Updated transaction {transaction_id} status to {status}")
    except ClientError as e:
        logger.error(f"Failed to update DynamoDB: {str(e)}")
        raise