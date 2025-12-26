import json
import csv
import boto3
import os
from datetime import datetime
from io import StringIO
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
sqs_client = boto3.client('sqs')

# Environment variables
OUTPUT_BUCKET = os.environ.get('OUTPUT_BUCKET')
AUDIT_BUCKET = os.environ.get('AUDIT_BUCKET')
DLQ_URL = os.environ.get('DLQ_URL')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX')


def handler(event, context):
    """
    Lambda handler to process banking transaction files from S3.

    Args:
        event: EventBridge event containing S3 object details
        context: Lambda context object

    Returns:
        dict: Processing result with status and metadata
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Extract S3 details from EventBridge event
        bucket_name = event['detail']['bucket']['name']
        object_key = event['detail']['object']['key']

        logger.info(f"Processing file: s3://{bucket_name}/{object_key}")

        # Download the file from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        file_content = response['Body'].read().decode('utf-8')

        # Process the transaction file
        result = process_transactions(file_content, object_key)

        # Save processed data to output bucket
        save_processed_data(result['processed_transactions'], object_key)

        # Save audit log
        save_audit_log(result['audit_data'], object_key)

        logger.info(f"Successfully processed {result['total_records']} records")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing completed successfully',
                'records_processed': result['total_records'],
                'records_valid': result['valid_records'],
                'records_invalid': result['invalid_records']
            })
        }

    except Exception as e:
        logger.error(f"Error processing file: {str(e)}", exc_info=True)

        # Send error to DLQ
        try:
            send_to_dlq(event, str(e))
        except Exception as dlq_error:
            logger.error(f"Failed to send message to DLQ: {str(dlq_error)}")

        raise


def process_transactions(file_content, object_key):
    """
    Process transaction file content and validate records.

    Args:
        file_content: Raw file content string
        object_key: S3 object key

    Returns:
        dict: Processing results with statistics
    """
    processed_transactions = []
    invalid_records = []
    total_records = 0
    valid_records = 0

    # Determine file format (CSV or JSON)
    if object_key.endswith('.json'):
        transactions = process_json_format(file_content)
    else:
        transactions = process_csv_format(file_content)

    # Process each transaction
    for idx, transaction in enumerate(transactions):
        total_records += 1

        try:
            # Validate transaction
            validated_transaction = validate_transaction(transaction, idx)

            # Calculate aggregations
            enriched_transaction = enrich_transaction(validated_transaction)

            processed_transactions.append(enriched_transaction)
            valid_records += 1

        except ValueError as e:
            logger.warning(f"Invalid transaction at row {idx}: {str(e)}")
            invalid_records.append({
                'row': idx,
                'data': transaction,
                'error': str(e)
            })

    # Generate audit data
    audit_data = {
        'file': object_key,
        'timestamp': datetime.utcnow().isoformat(),
        'total_records': total_records,
        'valid_records': valid_records,
        'invalid_records': len(invalid_records),
        'invalid_details': invalid_records
    }

    return {
        'processed_transactions': processed_transactions,
        'audit_data': audit_data,
        'total_records': total_records,
        'valid_records': valid_records,
        'invalid_records': len(invalid_records)
    }


def process_csv_format(file_content):
    """Parse CSV format transaction file."""
    csv_reader = csv.DictReader(StringIO(file_content))
    return list(csv_reader)


def process_json_format(file_content):
    """Parse JSON format transaction file."""
    data = json.loads(file_content)

    # Handle both array of transactions and object with transactions field
    if isinstance(data, list):
        return data
    elif isinstance(data, dict) and 'transactions' in data:
        return data['transactions']
    else:
        raise ValueError("Invalid JSON format: expected array or object with 'transactions' field")


def validate_transaction(transaction, row_index):
    """
    Validate a single transaction record.

    Args:
        transaction: Transaction record dict
        row_index: Row index for error reporting

    Returns:
        dict: Validated transaction

    Raises:
        ValueError: If transaction is invalid
    """
    required_fields = ['transaction_id', 'amount', 'account_id', 'timestamp']

    # Check required fields
    for field in required_fields:
        if field not in transaction or not transaction[field]:
            raise ValueError(f"Missing required field: {field}")

    # Validate amount is numeric
    try:
        amount = float(transaction['amount'])
        if amount < 0:
            raise ValueError("Amount cannot be negative")
    except (ValueError, TypeError):
        raise ValueError("Invalid amount format")

    # Validate transaction_id is not empty
    if not str(transaction['transaction_id']).strip():
        raise ValueError("Transaction ID cannot be empty")

    # Validate account_id format (simple check)
    if not str(transaction['account_id']).strip():
        raise ValueError("Account ID cannot be empty")

    return transaction


def enrich_transaction(transaction):
    """
    Enrich transaction with calculated fields and metadata.

    Args:
        transaction: Validated transaction dict

    Returns:
        dict: Enriched transaction
    """
    enriched = transaction.copy()

    # Add processing metadata
    enriched['processed_at'] = datetime.utcnow().isoformat()
    enriched['environment'] = ENVIRONMENT_SUFFIX

    # Convert amount to float for calculations
    amount = float(enriched['amount'])
    enriched['amount_float'] = amount

    # Add transaction type based on amount
    enriched['transaction_type'] = 'credit' if amount >= 0 else 'debit'

    # Add categorization (simple example)
    enriched['category'] = categorize_transaction(enriched)

    return enriched


def categorize_transaction(transaction):
    """
    Categorize transaction based on amount and description.
    Simple example categorization logic.
    """
    amount = abs(float(transaction['amount']))

    if amount < 50:
        return 'small'
    elif amount < 1000:
        return 'medium'
    else:
        return 'large'


def save_processed_data(transactions, object_key):
    """
    Save processed transactions to output bucket with date partitioning.

    Args:
        transactions: List of processed transactions
        object_key: Original S3 object key
    """
    if not transactions:
        logger.warning("No valid transactions to save")
        return

    # Create date partition
    now = datetime.utcnow()
    partition = f"year={now.year}/month={now.month:02d}/day={now.day:02d}"

    # Generate output file name
    file_name = os.path.basename(object_key)
    output_key = f"{partition}/processed_{file_name}.json"

    # Save to S3
    s3_client.put_object(
        Bucket=OUTPUT_BUCKET,
        Key=output_key,
        Body=json.dumps(transactions, indent=2),
        ContentType='application/json',
        ServerSideEncryption='AES256'
    )

    logger.info(f"Saved processed data to s3://{OUTPUT_BUCKET}/{output_key}")


def save_audit_log(audit_data, object_key):
    """
    Save processing audit log to audit bucket.

    Args:
        audit_data: Audit data dictionary
        object_key: Original S3 object key
    """
    # Generate audit file name
    file_name = os.path.basename(object_key)
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    audit_key = f"audit_logs/{timestamp}_{file_name}_audit.json"

    # Save to S3
    s3_client.put_object(
        Bucket=AUDIT_BUCKET,
        Key=audit_key,
        Body=json.dumps(audit_data, indent=2),
        ContentType='application/json',
        ServerSideEncryption='AES256'
    )

    logger.info(f"Saved audit log to s3://{AUDIT_BUCKET}/{audit_key}")


def send_to_dlq(event, error_message):
    """
    Send failed event to dead letter queue.

    Args:
        event: Original event that failed processing
        error_message: Error message describing the failure
    """
    message_body = {
        'event': event,
        'error': error_message,
        'timestamp': datetime.utcnow().isoformat(),
        'environment': ENVIRONMENT_SUFFIX
    }

    sqs_client.send_message(
        QueueUrl=DLQ_URL,
        MessageBody=json.dumps(message_body)
    )

    logger.info(f"Sent message to DLQ: {DLQ_URL}")
