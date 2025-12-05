"""Notification Handler Lambda for fraud alerts."""
import json
import os
import boto3
from datetime import datetime


def get_sns_client():
    """Get SNS client."""
    return boto3.client('sns')


def get_topic_arn():
    """Get SNS topic ARN."""
    return os.environ.get('SNS_TOPIC_ARN', 'arn:aws:sns:us-east-1:123456789012:test-topic')


def lambda_handler(event, context):
    """
    Process suspicious transactions from SQS and send SNS notifications.

    Args:
        event: SQS event with suspicious transactions
        context: Lambda context

    Returns:
        Processing summary
    """
    processed_count = 0
    error_count = 0

    try:
        for record in event['Records']:
            try:
                # Parse SQS message
                message_body = json.loads(record['body'])

                # Create fraud alert notification
                notification_message = create_notification_message(message_body)

                # Send SNS notification
                sns = get_sns_client()
                topic_arn = get_topic_arn()
                sns.publish(
                    TopicArn=topic_arn,
                    Subject=f"FRAUD ALERT: Transaction {message_body['transaction_id']}",
                    Message=notification_message,
                    MessageAttributes={
                        'TransactionId': {
                            'StringValue': message_body['transaction_id'],
                            'DataType': 'String'
                        },
                        'RiskScore': {
                            'StringValue': str(message_body.get('risk_score', 0)),
                            'DataType': 'Number'
                        },
                        'AlertType': {
                            'StringValue': 'FRAUD_DETECTION',
                            'DataType': 'String'
                        }
                    }
                )

                processed_count += 1
                print(f"Fraud alert sent for transaction: {message_body['transaction_id']}")

            except Exception as e:
                error_count += 1
                print(f"Error processing message: {str(e)}")
                continue

        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': processed_count,
                'errors': error_count
            })
        }

    except Exception as e:
        print(f"Error in notification handler: {str(e)}")
        raise


def create_notification_message(transaction):
    """
    Create formatted notification message for fraud alert.

    Args:
        transaction: Suspicious transaction dictionary

    Returns:
        Formatted notification string
    """
    timestamp = datetime.fromtimestamp(transaction['timestamp'] / 1000).strftime('%Y-%m-%d %H:%M:%S UTC')

    message = f"""
FRAUD ALERT - SUSPICIOUS TRANSACTION DETECTED

Transaction Details:
- Transaction ID: {transaction['transaction_id']}
- Timestamp: {timestamp}
- Amount: ${transaction['amount']:.2f}
- Merchant: {transaction['merchant']}
- Card Number: {transaction['card_number']}
- Location: {transaction.get('location', 'N/A')}

Fraud Analysis:
- Risk Score: {transaction.get('risk_score', 0)}/100
- Reason: {transaction.get('fraud_reason', 'Unknown')}

Action Required:
Please review this transaction immediately and take appropriate action.

This is an automated fraud detection alert. Do not reply to this email.
    """

    return message.strip()


def get_severity_level(risk_score):
    """
    Determine severity level based on risk score.

    Args:
        risk_score: Risk score (0-100)

    Returns:
        Severity level string
    """
    if risk_score >= 80:
        return 'CRITICAL'
    if risk_score >= 60:
        return 'HIGH'
    if risk_score >= 40:
        return 'MEDIUM'
    return 'LOW'
