import json
import logging
import os
from datetime import datetime, timezone
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
table_name = os.environ.get('DYNAMODB_TABLE', 'payment-transactions')
sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
table = dynamodb.Table(table_name)

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def format_notification_message(transaction):
    """
    Format transaction details for notification.
    """
    amount = float(transaction.get('amount', 0))
    currency = transaction.get('currency', 'USD')
    risk_level = transaction.get('risk_level', 'unknown')
    fraud_score = float(transaction.get('fraud_score', 0))
    
    message = f"""
Payment Transaction Processed

Transaction ID: {transaction.get('transaction_id')}
Merchant ID: {transaction.get('merchant_id')}
Customer ID: {transaction.get('customer_id')}
Amount: {currency} {amount:.2f}
Card: {transaction.get('card_number_masked', 'N/A')}

Fraud Detection Results:
- Risk Level: {risk_level.upper()}
- Fraud Score: {fraud_score:.2%}
- Status: {transaction.get('state', 'Unknown')}

Timestamp: {datetime.now(timezone.utc).isoformat()}

{"⚠️ HIGH RISK - Manual review recommended" if risk_level == 'high' else "✅ Transaction approved for processing"}
"""
    return message

def lambda_handler(event, context):
    """
    Sends notifications for processed payment transactions.
    """
    try:
        logger.info(f"Processing {len(event['Records'])} records for notification")
        batch_item_failures = []
        
        for record in event['Records']:
            message_id = record['messageId']
            try:
                # Parse SQS message
                body = json.loads(record['body'])
                transaction_id = body.get('transaction_id')
                
                if not transaction_id:
                    raise ValueError("Missing transaction_id in message")
                
                logger.info(f"Sending notification for transaction: {transaction_id}")
                
                # Retrieve full transaction details from DynamoDB
                response = table.get_item(Key={'transaction_id': transaction_id})
                
                if 'Item' not in response:
                    raise ValueError(f"Transaction {transaction_id} not found in database")
                
                transaction = response['Item']
                
                # Format notification message
                notification_message = format_notification_message(transaction)
                
                # Determine subject based on risk level
                risk_level = transaction.get('risk_level', 'unknown')
                if risk_level == 'high':
                    subject = f"⚠️ HIGH RISK Payment Alert - Transaction {transaction_id}"
                elif risk_level == 'medium':
                    subject = f"Payment Processed - Medium Risk - Transaction {transaction_id}"
                else:
                    subject = f"✅ Payment Processed Successfully - Transaction {transaction_id}"
                
                # Publish to SNS
                sns_response = sns.publish(
                    TopicArn=sns_topic_arn,
                    Subject=subject,
                    Message=notification_message,
                    MessageAttributes={
                        'transaction_id': {
                            'DataType': 'String',
                            'StringValue': transaction_id
                        },
                        'risk_level': {
                            'DataType': 'String',
                            'StringValue': risk_level
                        },
                        'amount': {
                            'DataType': 'Number',
                            'StringValue': str(transaction.get('amount', 0))
                        }
                    }
                )
                
                # Update transaction state to notified
                table.update_item(
                    Key={'transaction_id': transaction_id},
                    UpdateExpression='SET #state = :state, notification_timestamp = :timestamp, notification_message_id = :msg_id',
                    ExpressionAttributeNames={
                        '#state': 'state'
                    },
                    ExpressionAttributeValues={
                        ':state': 'notified',
                        ':timestamp': datetime.now(timezone.utc).isoformat(),
                        ':msg_id': sns_response['MessageId']
                    }
                )
                
                logger.info(f"Notification sent for transaction {transaction_id}. SNS MessageId: {sns_response['MessageId']}")
                
            except (ValueError, KeyError) as e:
                logger.error(f"Validation error for message {message_id}: {str(e)}")
                batch_item_failures.append({"itemIdentifier": message_id})
            except ClientError as e:
                logger.error(f"AWS service error for message {message_id}: {str(e)}")
                batch_item_failures.append({"itemIdentifier": message_id})
            except Exception as e:
                logger.error(f"Unexpected error for message {message_id}: {str(e)}")
                batch_item_failures.append({"itemIdentifier": message_id})
        
        # Return batch item failures for partial batch response
        if batch_item_failures:
            return {"batchItemFailures": batch_item_failures}
        
        return {"statusCode": 200, "body": "All notifications sent successfully"}
        
    except Exception as e:
        logger.error(f"Critical error in lambda handler: {str(e)}")
        raise