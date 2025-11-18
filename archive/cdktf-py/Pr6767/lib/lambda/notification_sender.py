"""
Notification Sender Lambda Function
Sends fraud alerts to customers via SNS (email and SMS).
"""
import json
import boto3
import logging
from typing import Dict, Any
import os

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize boto3 clients
sns_client = boto3.client('sns')
ssm_client = boto3.client('ssm')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Send fraud alert notifications to customers.
    
    Args:
        event: Lambda event containing fraud analysis result
        context: Lambda context
        
    Returns:
        Dict containing notification result
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Extract transaction data
        transaction = event.get('transaction', {})
        
        if not transaction:
            return {
                'statusCode': 400,
                'status': 'NOTIFICATION_FAILED',
                'error': 'No transaction data provided'
            }
        
        # Only send notifications for fraud or high-risk transactions
        is_fraud = transaction.get('is_fraud', False)
        risk_level = transaction.get('risk_level', 'LOW')
        
        if not is_fraud and risk_level != 'HIGH':
            logger.info(f"Transaction {transaction.get('transaction_id')} does not require notification")
            return {
                'statusCode': 200,
                'status': 'NOTIFICATION_SKIPPED',
                'reason': 'Transaction not flagged for notification'
            }
        
        # Store transaction result in DynamoDB
        notification_result = _store_transaction_result(transaction)
        
        # Send fraud alert notification
        notification_sent = _send_fraud_alert(transaction)
        
        logger.info(f"Notification processing completed for transaction {transaction.get('transaction_id')}")
        
        return {
            'statusCode': 200,
            'status': 'NOTIFICATION_COMPLETED',
            'transaction_stored': notification_result,
            'notification_sent': notification_sent,
            'transaction_id': transaction.get('transaction_id')
        }
        
    except Exception as e:
        logger.error(f"Notification error: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'NOTIFICATION_ERROR',
            'error': str(e)
        }

def _store_transaction_result(transaction: Dict[str, Any]) -> bool:
    """
    Store transaction analysis result in DynamoDB.
    
    Args:
        transaction: Transaction data with analysis results
        
    Returns:
        bool indicating success
    """
    try:
        table_name = os.environ.get('DYNAMODB_TABLE_NAME')
        if not table_name:
            logger.warning("DynamoDB table name not configured")
            return False
        
        table = dynamodb.Table(table_name)
        
        # Prepare item for storage
        item = {
            'transaction_id': transaction.get('transaction_id'),
            'timestamp': transaction.get('timestamp'),
            'amount': str(transaction.get('amount', 0)),  # Store as string to avoid decimal issues
            'merchant': transaction.get('merchant'),
            'card_last_four': transaction.get('card_number', '')[-4:] if transaction.get('card_number') else '',
            'fraud_score': str(transaction.get('fraud_score', 0)),
            'is_fraud': transaction.get('is_fraud', False),
            'risk_level': transaction.get('risk_level', 'UNKNOWN'),
            'model_version': transaction.get('model_version', 'unknown'),
            'analysis_timestamp': transaction.get('analysis_timestamp'),
            'factors_analyzed': json.dumps(transaction.get('factors_analyzed', {}))
        }
        
        # Store in DynamoDB
        table.put_item(Item=item)
        
        logger.info(f"Transaction {transaction.get('transaction_id')} stored in DynamoDB")
        return True
        
    except Exception as e:
        logger.error(f"Error storing transaction in DynamoDB: {str(e)}")
        return False

def _send_fraud_alert(transaction: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send fraud alert notification via SNS.
    
    Args:
        transaction: Transaction data
        
    Returns:
        Dict with notification details
    """
    try:
        # Get SNS topic ARN from environment
        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
        if not sns_topic_arn:
            logger.warning("SNS topic ARN not configured")
            return {'sent': False, 'reason': 'SNS topic not configured'}
        
        # Get notification template from Parameter Store
        template = _get_notification_template()
        
        # Format the message
        message = template['message'].format(
            transaction_id=transaction.get('transaction_id', 'UNKNOWN'),
            amount=transaction.get('amount', 0),
            merchant=transaction.get('merchant', 'UNKNOWN'),
            fraud_score=transaction.get('fraud_score', 0),
            risk_level=transaction.get('risk_level', 'UNKNOWN')
        )
        
        subject = template['subject']
        
        # Send notification
        response = sns_client.publish(
            TopicArn=sns_topic_arn,
            Message=message,
            Subject=subject,
            MessageAttributes={
                'transaction_id': {
                    'DataType': 'String',
                    'StringValue': transaction.get('transaction_id', 'UNKNOWN')
                },
                'fraud_score': {
                    'DataType': 'String', 
                    'StringValue': str(transaction.get('fraud_score', 0))
                },
                'risk_level': {
                    'DataType': 'String',
                    'StringValue': transaction.get('risk_level', 'UNKNOWN')
                }
            }
        )
        
        logger.info(f"Fraud alert sent for transaction {transaction.get('transaction_id')}")
        
        return {
            'sent': True,
            'message_id': response.get('MessageId'),
            'subject': subject,
            'transaction_id': transaction.get('transaction_id')
        }
        
    except Exception as e:
        logger.error(f"Error sending fraud alert: {str(e)}")
        return {'sent': False, 'error': str(e)}

def _get_notification_template() -> Dict[str, str]:
    """
    Get notification template from Parameter Store or use default.
    
    Returns:
        Dict containing subject and message template
    """
    try:
        template_param = os.environ.get('NOTIFICATION_TEMPLATE_PARAM')
        if template_param:
            response = ssm_client.get_parameter(
                Name=template_param,
                WithDecryption=True
            )
            return json.loads(response['Parameter']['Value'])
    except Exception as e:
        logger.warning(f"Could not retrieve notification template: {str(e)}")
    
    # Default template
    return {
        'subject': 'Potential Fraud Alert - Immediate Action Required',
        'message': '''
FRAUD ALERT: Suspicious transaction detected on your account.

Transaction Details:
- Transaction ID: {transaction_id}
- Amount: ${amount}
- Merchant: {merchant}
- Risk Score: {fraud_score}
- Risk Level: {risk_level}

If you did not authorize this transaction, please contact us immediately at:
- Phone: 1-800-FRAUD-HELP
- Email: fraud@yourbank.com

For your security, consider:
1. Reviewing your recent transactions
2. Changing your card PIN
3. Monitoring your account closely

This is an automated message. Please do not reply to this notification.
        '''
    }