import json
import os
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sqs_client = boto3.client('sqs')

# Environment variables
ERRORS_TABLE_NAME = os.environ['ERRORS_TABLE_NAME']

# Get DynamoDB table
errors_table = dynamodb.Table(ERRORS_TABLE_NAME)

def lambda_handler(event, context):
    """
    Process messages from the Dead Letter Queue
    """
    print(f"Processing {len(event.get('Records', []))} DLQ messages")
    
    processed_count = 0
    error_count = 0
    
    for record in event.get('Records', []):
        try:
            # Parse SQS message
            message_body = json.loads(record['body'])
            receipt_handle = record['receiptHandle']
            
            print(f"Processing DLQ message: {record['messageId']}")
            
            # Extract error details
            error_record = extract_error_details(message_body, record)
            
            # Store in errors table
            store_error_record(error_record)
            
            # Delete message from queue after successful processing
            # (This is handled automatically by Lambda-SQS integration)
            
            processed_count += 1
            print(f"Stored error record: {error_record['error_id']}")
            
        except Exception as e:
            error_count += 1
            print(f"Failed to process DLQ message: {str(e)}")
            print(f"Message content: {json.dumps(record)}")
            
            # Log the error but don't raise to avoid re-processing
            # Message will return to DLQ after visibility timeout
    
    print(f"DLQ processing complete. Processed: {processed_count}, Errors: {error_count}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': processed_count,
            'errors': error_count
        })
    }

def extract_error_details(message_body, sqs_record):
    """
    Extract and analyze error details from DLQ message
    """
    error_record = {
        'error_id': str(uuid.uuid4()),
        'timestamp': int(datetime.now().timestamp() * 1000),
        'message_id': sqs_record.get('messageId'),
        'received_at': datetime.now().isoformat()
    }
    
    # Extract transaction data if present
    if 'transaction' in message_body:
        transaction = message_body['transaction']
        error_record['transaction_id'] = transaction.get('transaction_id', 'unknown')
        error_record['transaction_data'] = json.dumps(transaction, default=str)
    else:
        error_record['transaction_id'] = 'unknown'
    
    # Extract error information
    if 'error' in message_body:
        error_record['error_message'] = message_body['error']
        error_record['error_type'] = classify_error(message_body['error'])
    
    # Extract source file information
    if 'source_file' in message_body:
        error_record['source_file'] = message_body['source_file']
    elif 'key' in message_body:
        error_record['source_file'] = message_body['key']
    
    # Add retry information
    if 'retry_count' in message_body:
        error_record['retry_count'] = message_body['retry_count']
    
    # Extract S3 bucket if present
    if 'bucket' in message_body:
        error_record['bucket'] = message_body['bucket']
    
    # Add SQS message attributes
    if 'attributes' in sqs_record:
        attributes = sqs_record['attributes']
        error_record['approximate_receive_count'] = attributes.get('ApproximateReceiveCount', '0')
        error_record['sent_timestamp'] = attributes.get('SentTimestamp')
        error_record['first_receive_timestamp'] = attributes.get('ApproximateFirstReceiveTimestamp')
    
    # Calculate time in queue
    if 'sent_timestamp' in error_record and error_record['sent_timestamp']:
        sent_time = int(error_record['sent_timestamp'])
        current_time = int(datetime.now().timestamp() * 1000)
        error_record['time_in_queue_ms'] = current_time - sent_time
    
    # Add context information
    error_record['processing_context'] = {
        'dlq_processor_version': '1.0.0',
        'runtime': context.function_name if context else 'local',
        'request_id': context.aws_request_id if context else str(uuid.uuid4())
    }
    
    return error_record

def classify_error(error_message):
    """
    Classify error type based on error message
    """
    error_lower = error_message.lower()
    
    if 'missing required field' in error_lower:
        return 'VALIDATION_ERROR'
    elif 'invalid type' in error_lower:
        return 'TYPE_ERROR'
    elif 'amount must be positive' in error_lower:
        return 'BUSINESS_RULE_VIOLATION'
    elif 'currency must be' in error_lower:
        return 'FORMAT_ERROR'
    elif 'timeout' in error_lower:
        return 'TIMEOUT_ERROR'
    elif 'throttl' in error_lower:
        return 'THROTTLING_ERROR'
    elif 'connection' in error_lower or 'network' in error_lower:
        return 'NETWORK_ERROR'
    elif 'permission' in error_lower or 'unauthorized' in error_lower:
        return 'AUTHORIZATION_ERROR'
    else:
        return 'UNKNOWN_ERROR'

def store_error_record(error_record):
    """
    Store error record in DynamoDB errors table
    """
    # Convert any float values to Decimal for DynamoDB
    for key, value in error_record.items():
        if isinstance(value, float):
            error_record[key] = Decimal(str(value))
        elif isinstance(value, dict):
            error_record[key] = json.dumps(value, default=str)
    
    # Store in DynamoDB
    errors_table.put_item(Item=error_record)
    
    # Log summary for monitoring
    print(json.dumps({
        'action': 'error_stored',
        'error_id': error_record['error_id'],
        'transaction_id': error_record.get('transaction_id'),
        'error_type': error_record.get('error_type'),
        'source_file': error_record.get('source_file')
    }))
    
    # Check if this is a critical error that needs immediate attention
    if error_record.get('error_type') in ['AUTHORIZATION_ERROR', 'UNKNOWN_ERROR']:
        print(f"CRITICAL ERROR DETECTED: {error_record['error_type']}")
        # In production, this could trigger additional alerts
    
    return error_record