"""
Fraud Detection Lambda Function
Mock ML-based fraud detection for transactions.
"""
import json
import os
import boto3
from datetime import datetime
from decimal import Decimal
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all
import random

# Patch AWS SDK for X-Ray tracing
patch_all()

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

table = dynamodb.Table(DYNAMODB_TABLE)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON serialization."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


@xray_recorder.capture('calculate_fraud_score')
def calculate_fraud_score(transaction):
    """
    Mock ML-based fraud detection algorithm.
    In production, this would call a SageMaker endpoint or ML model.

    Args:
        transaction: Transaction data

    Returns:
        dict: Fraud analysis results
    """
    # Mock fraud detection logic
    amount = float(transaction.get('amount', 0))

    # Risk factors
    risk_score = 0.0
    risk_factors = []

    # High amount increases risk
    if amount > 5000:
        risk_score += 0.3
        risk_factors.append('high_amount')

    # Random factor to simulate ML model variability
    random_risk = random.uniform(0, 0.4)
    risk_score += random_risk

    # Determine fraud status
    if risk_score > 0.7:
        fraud_status = 'high_risk'
    elif risk_score > 0.4:
        fraud_status = 'medium_risk'
    else:
        fraud_status = 'low_risk'

    return {
        'fraud_score': round(risk_score, 2),
        'fraud_status': fraud_status,
        'risk_factors': risk_factors,
        'analyzed_at': datetime.utcnow().isoformat()
    }


@xray_recorder.capture('update_transaction_status')
def update_transaction_status(transaction_id, timestamp, fraud_analysis):
    """
    Update transaction with fraud detection results.

    Args:
        transaction_id: Transaction ID
        timestamp: Transaction timestamp
        fraud_analysis: Fraud analysis results
    """
    table.update_item(
        Key={
            'transaction_id': transaction_id,
            'timestamp': timestamp
        },
        UpdateExpression='SET fraud_analysis = :fa, #st = :status',
        ExpressionAttributeNames={
            '#st': 'status'
        },
        ExpressionAttributeValues={
            ':fa': fraud_analysis,
            ':status': 'analyzed'
        }
    )


@xray_recorder.capture('send_fraud_alert')
def send_fraud_alert(transaction, fraud_analysis):
    """
    Send alert for high-risk transactions.

    Args:
        transaction: Transaction data
        fraud_analysis: Fraud analysis results
    """
    if fraud_analysis['fraud_status'] == 'high_risk':
        message = {
            'alert_type': 'fraud_detection',
            'transaction_id': transaction.get('transaction_id'),
            'amount': float(transaction.get('amount', 0)),
            'fraud_score': fraud_analysis['fraud_score'],
            'risk_factors': fraud_analysis['risk_factors'],
            'timestamp': datetime.utcnow().isoformat()
        }

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject='High Risk Transaction Detected',
            Message=json.dumps(message, indent=2)
        )


def lambda_handler(event, context):
    """
    Main Lambda handler for fraud detection.

    Args:
        event: Step Functions event
        context: Lambda context

    Returns:
        dict: Fraud analysis results
    """
    try:
        # Extract transaction from event
        # Handle both direct invocation and Step Functions payload
        if 'Payload' in event:
            transaction = event['Payload'].get('transaction', {})
            timestamp = event['Payload'].get('timestamp', '')
        else:
            transaction = event.get('transaction', {})
            timestamp = event.get('timestamp', '')

        transaction_id = transaction.get('transaction_id')

        # Perform fraud detection
        fraud_analysis = calculate_fraud_score(transaction)

        # Update transaction status
        update_transaction_status(transaction_id, timestamp, fraud_analysis)

        # Send alert for high-risk transactions
        send_fraud_alert(transaction, fraud_analysis)

        # Return results
        return {
            'statusCode': 200,
            'transaction_id': transaction_id,
            'fraud_analysis': fraud_analysis
        }

    except Exception as e:
        print(f"Error in fraud detection: {str(e)}")
        raise
