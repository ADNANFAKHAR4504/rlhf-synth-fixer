"""Fraud Detection Lambda triggered by DynamoDB Streams."""
import json
import os
import boto3
from decimal import Decimal


def get_sqs_client():
    """Get SQS client."""
    return boto3.client('sqs')


def get_queue_url():
    """Get SQS queue URL."""
    return os.environ.get('SQS_QUEUE_URL', 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue')


def lambda_handler(event, context):
    """
    Analyze transactions from DynamoDB stream for fraud patterns.
    Sends suspicious transactions to SQS queue.

    Args:
        event: DynamoDB stream event
        context: Lambda context

    Returns:
        Processing summary
    """
    suspicious_count = 0
    processed_count = 0

    try:
        for record in event['Records']:
            if record['eventName'] not in ['INSERT', 'MODIFY']:
                continue

            processed_count += 1

            # Extract new image from DynamoDB stream
            new_image = record['dynamodb'].get('NewImage', {})

            if not new_image:
                continue

            # Parse transaction data
            transaction = {
                'transaction_id': new_image.get('transaction_id', {}).get('S', ''),
                'timestamp': int(new_image.get('timestamp', {}).get('N', '0')),
                'amount': float(new_image.get('amount', {}).get('N', '0')),
                'merchant': new_image.get('merchant', {}).get('S', ''),
                'card_number': new_image.get('card_number', {}).get('S', ''),
                'location': new_image.get('location', {}).get('S', '')
            }

            # Fraud detection logic
            is_suspicious = detect_fraud(transaction)

            if is_suspicious:
                suspicious_count += 1
                fraud_reason = get_fraud_reason(transaction)

                # Send to SQS queue
                message = {
                    'transaction_id': transaction['transaction_id'],
                    'timestamp': transaction['timestamp'],
                    'amount': transaction['amount'],
                    'merchant': transaction['merchant'],
                    'card_number': mask_card_number(transaction['card_number']),
                    'location': transaction['location'],
                    'fraud_reason': fraud_reason,
                    'risk_score': calculate_risk_score(transaction)
                }

                sqs = get_sqs_client()
                queue_url = get_queue_url()
                sqs.send_message(
                    QueueUrl=queue_url,
                    MessageBody=json.dumps(message),
                    MessageAttributes={
                        'TransactionId': {
                            'StringValue': transaction['transaction_id'],
                            'DataType': 'String'
                        },
                        'RiskScore': {
                            'StringValue': str(message['risk_score']),
                            'DataType': 'Number'
                        }
                    }
                )

                print(f"Suspicious transaction detected: {transaction['transaction_id']}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': processed_count,
                'suspicious': suspicious_count
            })
        }

    except Exception as e:
        print(f"Error processing fraud detection: {str(e)}")
        raise


def detect_fraud(transaction):
    """
    Detect if transaction is suspicious based on rules.

    Args:
        transaction: Transaction dictionary

    Returns:
        Boolean indicating if transaction is suspicious
    """
    # Rule 1: High-value transactions (over $10,000)
    if transaction['amount'] > 10000:
        return True

    # Rule 2: Suspicious merchants
    suspicious_merchants = ['unknown', 'test', 'fraud']
    if any(merchant in transaction['merchant'].lower() for merchant in suspicious_merchants):
        return True

    # Rule 3: Multiple small transactions pattern (amount ends in .00 and under $50)
    if transaction['amount'] < 50 and transaction['amount'] % 1 == 0:
        return True

    # Rule 4: International locations (basic check)
    high_risk_locations = ['nigeria', 'russia', 'china', 'ukraine']
    location = transaction.get('location', '').lower()
    if any(loc in location for loc in high_risk_locations):
        return True

    return False


def get_fraud_reason(transaction):
    """
    Determine the reason for fraud detection.

    Args:
        transaction: Transaction dictionary

    Returns:
        String describing fraud reason
    """
    reasons = []

    if transaction['amount'] > 10000:
        reasons.append('High-value transaction')

    suspicious_merchants = ['unknown', 'test', 'fraud']
    if any(merchant in transaction['merchant'].lower() for merchant in suspicious_merchants):
        reasons.append('Suspicious merchant')

    if transaction['amount'] < 50 and transaction['amount'] % 1 == 0:
        reasons.append('Small round amount pattern')

    high_risk_locations = ['nigeria', 'russia', 'china', 'ukraine']
    location = transaction.get('location', '').lower()
    if any(loc in location for loc in high_risk_locations):
        reasons.append('High-risk location')

    return ', '.join(reasons) if reasons else 'Unknown'


def calculate_risk_score(transaction):
    """
    Calculate risk score for transaction (0-100).

    Args:
        transaction: Transaction dictionary

    Returns:
        Integer risk score
    """
    score = 0

    # Amount-based scoring
    if transaction['amount'] > 10000:
        score += 40
    elif transaction['amount'] > 5000:
        score += 25
    elif transaction['amount'] < 50:
        score += 15

    # Merchant-based scoring
    suspicious_merchants = ['unknown', 'test', 'fraud']
    if any(merchant in transaction['merchant'].lower() for merchant in suspicious_merchants):
        score += 35

    # Location-based scoring
    high_risk_locations = ['nigeria', 'russia', 'china', 'ukraine']
    location = transaction.get('location', '').lower()
    if any(loc in location for loc in high_risk_locations):
        score += 25

    return min(score, 100)


def mask_card_number(card_number):
    """
    Mask card number for security.

    Args:
        card_number: Full card number

    Returns:
        Masked card number
    """
    if len(card_number) <= 4:
        return card_number
    return '*' * (len(card_number) - 4) + card_number[-4:]
