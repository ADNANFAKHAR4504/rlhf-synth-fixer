"""Fraud detection Lambda function."""
import json
import os
import time
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError


# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
sqs = boto3.client('sqs')

# Get environment variables
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'transaction-state-dev')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')
DLQ_URL = os.environ.get('DLQ_URL', '')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal objects to native Python types."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def detect_fraud(transaction):
    """
    Detect fraud in transaction data.

    Args:
        transaction: Transaction data dictionary

    Returns:
        dict: Fraud detection result
    """
    fraud_score = 0
    fraud_indicators = []

    # Check amount patterns
    amount = float(transaction.get('amount', 0))

    # High amount transactions are suspicious
    if amount > 10000:
        fraud_score += 30
        fraud_indicators.append('high_amount')

    # Round number amounts can be suspicious
    if amount % 1000 == 0:
        fraud_score += 10
        fraud_indicators.append('round_amount')

    # Check for rapid transactions (if timestamp provided)
    if 'last_transaction_time' in transaction:
        last_time = int(transaction['last_transaction_time'])
        current_time = int(time.time())
        time_diff = current_time - last_time

        # Less than 1 minute between transactions
        if time_diff < 60:
            fraud_score += 40
            fraud_indicators.append('rapid_transactions')

    # Check merchant patterns
    merchant_id = transaction.get('merchant_id', '')
    if merchant_id.startswith('TEST') or merchant_id.startswith('TEMP'):
        fraud_score += 20
        fraud_indicators.append('suspicious_merchant')

    # Check customer patterns
    customer_id = transaction.get('customer_id', '')
    if customer_id.startswith('GUEST') or customer_id.startswith('ANON'):
        fraud_score += 15
        fraud_indicators.append('anonymous_customer')

    # Check for international transactions
    if transaction.get('merchant_country') != transaction.get('customer_country'):
        fraud_score += 10
        fraud_indicators.append('international_transaction')

    # Determine fraud status
    is_fraud = fraud_score >= 50
    risk_level = 'LOW'

    if fraud_score >= 75:
        risk_level = 'CRITICAL'
    elif fraud_score >= 50:
        risk_level = 'HIGH'
    elif fraud_score >= 25:
        risk_level = 'MEDIUM'

    return {
        "is_fraud": is_fraud,
        "fraud_score": fraud_score,
        "risk_level": risk_level,
        "fraud_indicators": fraud_indicators,
        "detection_timestamp": int(time.time())
    }


def store_fraud_result(transaction_id, fraud_result):
    """
    Store fraud detection result in DynamoDB.

    Args:
        transaction_id: Transaction ID
        fraud_result: Fraud detection result
    """
    table = dynamodb.Table(DYNAMODB_TABLE)

    item = {
        'transaction_id': transaction_id,
        'timestamp': int(time.time() * 1000),  # Milliseconds
        'state': 'FRAUD_CHECKED',
        'environment': ENVIRONMENT,
        'fraud_data': json.dumps(fraud_result, cls=DecimalEncoder)
    }

    table.put_item(Item=item)


def send_fraud_alert(transaction_id, fraud_result, transaction):
    """
    Send fraud alert to SNS topic.

    Args:
        transaction_id: Transaction ID
        fraud_result: Fraud detection result
        transaction: Original transaction data
    """
    if not SNS_TOPIC_ARN:
        print("SNS topic ARN not configured")
        return

    try:
        subject = f"FRAUD ALERT: Transaction {transaction_id}"
        message = {
            'alert_type': 'FRAUD_DETECTION',
            'transaction_id': transaction_id,
            'fraud_score': fraud_result['fraud_score'],
            'risk_level': fraud_result['risk_level'],
            'indicators': fraud_result['fraud_indicators'],
            'amount': transaction.get('amount'),
            'currency': transaction.get('currency'),
            'merchant_id': transaction.get('merchant_id'),
            'customer_id': transaction.get('customer_id'),
            'timestamp': int(time.time()),
            'environment': ENVIRONMENT
        }

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=json.dumps(message, cls=DecimalEncoder, indent=2)
        )

        print(f"Fraud alert sent for transaction: {transaction_id}")

    except ClientError as e:
        print(f"Error sending fraud alert: {str(e)}")


def send_to_dlq(event, error_message):
    """
    Send failed transaction to dead letter queue.

    Args:
        event: Original event
        error_message: Error message
    """
    if not DLQ_URL:
        print("DLQ URL not configured")
        return

    try:
        message_body = {
            'event': event,
            'error': error_message,
            'timestamp': int(time.time()),
            'stage': 'fraud_detection'
        }

        sqs.send_message(
            QueueUrl=DLQ_URL,
            MessageBody=json.dumps(message_body, cls=DecimalEncoder)
        )
        print(f"Sent failed transaction to DLQ")
    except ClientError as e:
        print(f"Error sending to DLQ: {str(e)}")


def lambda_handler(event, context):
    """
    Lambda handler for fraud detection.

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        dict: Fraud detection result
    """
    print(f"Detecting fraud: {json.dumps(event, cls=DecimalEncoder)}")

    try:
        # Extract transaction data
        # Handle both direct invocation and Step Functions invocation
        if 'Payload' in event:
            payload = event['Payload']
        else:
            payload = event

        # Get transaction from payload
        transaction = payload.get('transaction', payload)

        # Detect fraud
        fraud_result = detect_fraud(transaction)

        # Store fraud result
        store_fraud_result(transaction['transaction_id'], fraud_result)

        # Send alert if fraud detected
        if fraud_result['is_fraud']:
            send_fraud_alert(transaction['transaction_id'], fraud_result, transaction)
            print(f"FRAUD DETECTED: Transaction {transaction['transaction_id']}")
        else:
            print(f"Transaction passed fraud detection: {transaction['transaction_id']}")

        # Return result
        result = {
            'statusCode': 200,
            'transaction_id': transaction['transaction_id'],
            'fraud_detection': fraud_result,
            'transaction': transaction,
            'stage': 'fraud_detection'
        }

        # Include validation result if present
        if 'validation' in payload:
            result['validation'] = payload['validation']

        return result

    except KeyError as e:
        error_message = f"Missing required field: {str(e)}"
        print(error_message)

        # Send to DLQ
        send_to_dlq(event, error_message)

        # Re-raise for Step Functions to handle
        raise Exception(error_message)

    except Exception as e:
        error_message = f"Unexpected error: {str(e)}"
        print(error_message)

        # Send to DLQ
        send_to_dlq(event, error_message)

        # Re-raise for Step Functions to handle
        raise Exception(error_message)
