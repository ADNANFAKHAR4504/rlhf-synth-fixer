"""
Fraud Detection Lambda Handler

This Lambda function is triggered by SQS messages and performs fraud detection
using pattern matching. It stores processed transactions in DynamoDB and sends
alerts for suspicious transactions via SNS.
"""

import json
import os
import boto3
from datetime import datetime, timezone
from decimal import Decimal
from botocore.exceptions import ClientError

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Environment variables
TRANSACTION_TABLE_NAME = os.environ['TRANSACTION_TABLE_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

# Fraud detection thresholds
HIGH_AMOUNT_THRESHOLD = 5000
SUSPICIOUS_KEYWORDS = ['test', 'fake', 'dummy']

def lambda_handler(event, context):
    """
    Performs fraud detection on transactions from SQS queue.

    Args:
        event: SQS event containing transaction messages
        context: Lambda context

    Returns:
        Processing results
    """
    results = []

    for record in event['Records']:
        try:
            # Parse SQS message
            message_body = json.loads(record['body'])

            transaction_id = message_body['transaction_id']
            merchant_id = message_body['merchant_id']
            amount = Decimal(str(message_body['amount']))
            currency = message_body.get('currency', 'USD')
            merchant_name = message_body.get('merchant_name', 'Unknown')

            # Perform fraud detection
            fraud_score = 0
            fraud_reasons = []

            # Check 1: High amount transaction
            if float(amount) > HIGH_AMOUNT_THRESHOLD:
                fraud_score += 30
                fraud_reasons.append(f'High amount: {amount}')

            # Check 2: Suspicious merchant name
            merchant_name_lower = merchant_name.lower()
            if any(keyword in merchant_name_lower for keyword in SUSPICIOUS_KEYWORDS):
                fraud_score += 40
                fraud_reasons.append(f'Suspicious merchant name: {merchant_name}')

            # Check 3: Unusual currency
            if currency not in ['USD', 'EUR', 'GBP']:
                fraud_score += 20
                fraud_reasons.append(f'Unusual currency: {currency}')

            # Check 4: Rapid transaction pattern (simplified)
            # In production, would check time-based patterns
            if float(amount) % 1000 == 0:  # Round amounts are suspicious
                fraud_score += 10
                fraud_reasons.append('Round amount pattern')

            # Determine fraud status
            if fraud_score >= 50:
                fraud_status = 'FRAUD_SUSPECTED'
            elif fraud_score >= 30:
                fraud_status = 'REVIEW_REQUIRED'
            else:
                fraud_status = 'APPROVED'

            # Store transaction in DynamoDB
            transaction_table = dynamodb.Table(TRANSACTION_TABLE_NAME)
            timestamp = datetime.now(timezone.utc).isoformat()

            transaction_table.put_item(
                Item={
                    'transaction_id': transaction_id,
                    'timestamp': timestamp,
                    'merchant_id': merchant_id,
                    'merchant_name': merchant_name,
                    'amount': amount,
                    'currency': currency,
                    'fraud_score': fraud_score,
                    'fraud_status': fraud_status,
                    'fraud_reasons': fraud_reasons,
                    'processed_at': timestamp
                }
            )

            # Send SNS alert for suspected fraud
            if fraud_status in ['FRAUD_SUSPECTED', 'REVIEW_REQUIRED']:
                alert_message = {
                    'transaction_id': transaction_id,
                    'merchant_id': merchant_id,
                    'merchant_name': merchant_name,
                    'amount': str(amount),
                    'currency': currency,
                    'fraud_score': fraud_score,
                    'fraud_status': fraud_status,
                    'fraud_reasons': fraud_reasons,
                    'timestamp': timestamp
                }

                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject=f'Fraud Alert: {fraud_status} - Transaction {transaction_id}',
                    Message=json.dumps(alert_message, indent=2)
                )

            results.append({
                'transaction_id': transaction_id,
                'status': 'processed',
                'fraud_status': fraud_status,
                'fraud_score': fraud_score
            })

        except Exception as e:
            print(f"Error processing transaction: {e}")
            results.append({
                'transaction_id': message_body.get('transaction_id', 'unknown'),
                'status': 'error',
                'error': str(e)
            })

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': len(results),
            'results': results
        })
    }
