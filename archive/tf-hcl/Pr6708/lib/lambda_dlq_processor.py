import json
import boto3
import os
import logging
from datetime import datetime
from collections import defaultdict

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
sns = boto3.client('sns')

# Environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
DLQ_URL = os.environ['DLQ_URL']

# DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)

def handler(event, context):
    """
    Process failed messages from the dead letter queue for investigation and alerting
    """
    logger.info(f"Processing DLQ with {len(event.get('Records', []))} messages")
    
    failure_patterns = defaultdict(list)
    processed_messages = []
    
    for record in event.get('Records', []):
        try:
            # Parse message
            message_body = json.loads(record['body'])
            message_id = record['messageId']
            receipt_handle = record['receiptHandle']
            
            # Extract message attributes
            attributes = record.get('attributes', {})
            approximate_receive_count = int(attributes.get('ApproximateReceiveCount', 0))
            sent_timestamp = attributes.get('SentTimestamp')
            
            # Log detailed failure information
            failure_details = {
                'message_id': message_id,
                'transaction_id': message_body.get('transaction_id', 'unknown'),
                'receive_count': approximate_receive_count,
                'sent_timestamp': sent_timestamp,
                'original_message': message_body,
                'dlq_timestamp': datetime.utcnow().isoformat()
            }
            
            logger.error(f"DLQ Message Analysis: {json.dumps(failure_details)}")
            
            # Analyze failure pattern
            transaction_id = message_body.get('transaction_id')
            if transaction_id:
                # Query DynamoDB for transaction history
                try:
                    response = table.get_item(
                        Key={'transaction_id': transaction_id}
                    )
                    
                    if 'Item' in response:
                        item = response['Item']
                        failure_reason = item.get('details', {}).get('error', 'Unknown error')
                        failure_patterns[failure_reason].append(transaction_id)
                        
                        # Update DynamoDB with DLQ status
                        table.update_item(
                            Key={'transaction_id': transaction_id},
                            UpdateExpression='SET dlq_status = :status, dlq_timestamp = :ts, dlq_analysis = :analysis',
                            ExpressionAttributeValues={
                                ':status': 'IN_DLQ',
                                ':ts': datetime.utcnow().isoformat(),
                                ':analysis': json.dumps(failure_details)
                            }
                        )
                except Exception as e:
                    logger.error(f"Error querying DynamoDB for transaction {transaction_id}: {str(e)}")
            
            # Check if message should be retried or permanently failed
            if approximate_receive_count >= 5:
                # Too many retries - mark as permanently failed
                logger.error(f"Message {message_id} exceeded retry limit, marking as permanently failed")
                
                if transaction_id:
                    table.update_item(
                        Key={'transaction_id': transaction_id},
                        UpdateExpression='SET payment_status = :status, final_failure_reason = :reason',
                        ExpressionAttributeValues={
                            ':status': 'PERMANENTLY_FAILED',
                            ':reason': f'Exceeded retry limit after {approximate_receive_count} attempts'
                        }
                    )
                
                # Delete from DLQ after processing
                sqs.delete_message(
                    QueueUrl=DLQ_URL,
                    ReceiptHandle=receipt_handle
                )
                
            processed_messages.append(message_id)
            
        except Exception as e:
            logger.error(f"Error processing DLQ message: {str(e)}", exc_info=True)
    
    # Analyze and alert on failure patterns
    if failure_patterns:
        alert_message = generate_alert_message(failure_patterns, processed_messages)
        logger.warning(f"Failure pattern analysis: {alert_message}")
        
        # Send alert via SNS if configured
        try:
            if 'SNS_TOPIC_ARN' in os.environ:
                sns.publish(
                    TopicArn=os.environ['SNS_TOPIC_ARN'],
                    Subject='Payment Processing DLQ Alert',
                    Message=alert_message
                )
        except Exception as e:
            logger.error(f"Failed to send SNS alert: {str(e)}")
    
    # Return summary
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed_messages': len(processed_messages),
            'failure_patterns': dict(failure_patterns),
            'timestamp': datetime.utcnow().isoformat()
        })
    }

def generate_alert_message(failure_patterns, processed_messages):
    """
    Generate detailed alert message for operations team
    """
    message_parts = [
        f"DLQ Alert: {len(processed_messages)} failed messages detected",
        f"Timestamp: {datetime.utcnow().isoformat()}",
        "\nFailure Pattern Analysis:"
    ]
    
    for reason, transaction_ids in failure_patterns.items():
        message_parts.append(f"\n- {reason}: {len(transaction_ids)} transactions")
        if len(transaction_ids) <= 5:
            message_parts.append(f"  Transaction IDs: {', '.join(transaction_ids)}")
        else:
            message_parts.append(f"  Sample Transaction IDs: {', '.join(transaction_ids[:5])} (and {len(transaction_ids)-5} more)")
    
    message_parts.append("\nAction Required: Please investigate these failures immediately.")
    message_parts.append("Check CloudWatch Logs for detailed error information.")
    
    return '\n'.join(message_parts)

def retry_message(message_body, transaction_id):
    """
    Attempt to retry a failed message with additional validation
    """
    try:
        # Add retry metadata
        message_body['retry_attempt'] = True
        message_body['retry_timestamp'] = datetime.utcnow().isoformat()
        
        # Send back to main queue with new message group ID to avoid deduplication
        response = sqs.send_message(
            QueueUrl=os.environ.get('MAIN_QUEUE_URL', ''),
            MessageBody=json.dumps(message_body),
            MessageGroupId=f"{transaction_id}-retry-{datetime.utcnow().timestamp()}",
            MessageDeduplicationId=f"{transaction_id}-retry-{datetime.utcnow().timestamp()}"
        )
        
        logger.info(f"Successfully retried message for transaction {transaction_id}")
        return response['MessageId']
        
    except Exception as e:
        logger.error(f"Failed to retry message: {str(e)}")
        return None