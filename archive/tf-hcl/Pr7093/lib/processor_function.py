import json
import os
import boto3
import uuid
import time
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sqs_client = boto3.client('sqs')

# Environment variables
DYNAMODB_TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
SQS_QUEUE_URL = os.environ['SQS_QUEUE_URL']

# Get DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

# Transaction schema for validation
TRANSACTION_SCHEMA = {
    'csv': ['transaction_id', 'amount', 'currency', 'sender', 'receiver', 'type'],
    'json': {
        'required': ['transaction_id', 'amount', 'currency', 'sender', 'receiver', 'type'],
        'types': {
            'transaction_id': str,
            'amount': (int, float),
            'currency': str,
            'sender': str,
            'receiver': str,
            'type': str
        }
    }
}

def lambda_handler(event, context):
    """
    Process transaction files uploaded to S3
    """
    print(f"Processing event: {json.dumps(event)}")
    
    for record in event.get('Records', []):
        try:
            # Extract S3 object details
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']
            
            print(f"Processing file: s3://{bucket_name}/{object_key}")
            
            # Determine file type
            file_extension = object_key.split('.')[-1].lower()
            
            if file_extension not in ['csv', 'json']:
                raise ValueError(f"Unsupported file type: {file_extension}")
            
            # Get file from S3
            response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
            file_content = response['Body'].read().decode('utf-8')
            
            # Process based on file type
            if file_extension == 'csv':
                transactions = process_csv_file(file_content)
            else:  # json
                transactions = process_json_file(file_content)
            
            # Validate and store transactions
            successful = 0
            failed = 0
            
            for transaction in transactions:
                try:
                    # Validate transaction
                    validate_transaction(transaction, file_extension)
                    
                    # Add metadata
                    transaction['timestamp'] = int(datetime.now().timestamp() * 1000)
                    transaction['status'] = 'processed'
                    transaction['source_file'] = object_key
                    transaction['processed_at'] = datetime.now().isoformat()
                    
                    # Convert floats to Decimal for DynamoDB
                    if 'amount' in transaction:
                        transaction['amount'] = Decimal(str(transaction['amount']))
                    
                    # Store in DynamoDB
                    table.put_item(Item=transaction)
                    successful += 1
                    
                    print(f"Stored transaction: {transaction['transaction_id']}")
                    
                except Exception as e:
                    failed += 1
                    print(f"Failed to process transaction: {str(e)}")
                    
                    # Send failed transaction to DLQ
                    send_to_dlq(transaction, str(e), object_key)
            
            print(f"Processing complete. Successful: {successful}, Failed: {failed}")
            
        except Exception as e:
            print(f"Error processing record: {str(e)}")
            
            # Send entire file processing error to DLQ
            error_message = {
                'error': str(e),
                'bucket': bucket_name,
                'key': object_key,
                'timestamp': datetime.now().isoformat()
            }
            
            sqs_client.send_message(
                QueueUrl=SQS_QUEUE_URL,
                MessageBody=json.dumps(error_message)
            )
            
            raise e
    
    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete')
    }

def process_csv_file(content):
    """
    Process CSV file and extract transactions
    """
    import csv
    from io import StringIO
    
    transactions = []
    reader = csv.DictReader(StringIO(content))
    
    for row in reader:
        # Clean and convert data
        transaction = {}
        for key, value in row.items():
            if key and value:
                # Try to convert numeric values
                if key == 'amount':
                    try:
                        transaction[key] = float(value)
                    except ValueError:
                        transaction[key] = value
                else:
                    transaction[key] = value.strip()
        
        transactions.append(transaction)
    
    return transactions

def process_json_file(content):
    """
    Process JSON file and extract transactions
    """
    data = json.loads(content)
    
    # Handle both single transaction and array of transactions
    if isinstance(data, dict):
        transactions = [data]
    elif isinstance(data, list):
        transactions = data
    else:
        raise ValueError("Invalid JSON structure")
    
    return transactions

def validate_transaction(transaction, file_type):
    """
    Validate transaction against schema
    """
    if file_type == 'csv':
        # Check required fields
        required_fields = TRANSACTION_SCHEMA['csv']
        for field in required_fields:
            if field not in transaction or not transaction[field]:
                raise ValueError(f"Missing required field: {field}")
    
    else:  # json
        # Check required fields
        required_fields = TRANSACTION_SCHEMA['json']['required']
        for field in required_fields:
            if field not in transaction:
                raise ValueError(f"Missing required field: {field}")
        
        # Check types
        for field, expected_type in TRANSACTION_SCHEMA['json']['types'].items():
            if field in transaction:
                if not isinstance(transaction[field], expected_type):
                    raise ValueError(f"Invalid type for field {field}")
    
    # Additional business validation
    if 'amount' in transaction:
        amount = float(transaction['amount']) if isinstance(transaction['amount'], str) else transaction['amount']
        if amount <= 0:
            raise ValueError("Transaction amount must be positive")
    
    # Validate currency code
    if 'currency' in transaction:
        if len(transaction['currency']) != 3:
            raise ValueError("Currency must be a 3-letter code")
    
    return True

def send_to_dlq(transaction, error_message, source_file):
    """
    Send failed transaction to DLQ for manual review
    """
    message = {
        'transaction': transaction,
        'error': error_message,
        'source_file': source_file,
        'timestamp': datetime.now().isoformat(),
        'retry_count': 0
    }
    
    sqs_client.send_message(
        QueueUrl=SQS_QUEUE_URL,
        MessageBody=json.dumps(message, default=str)
    )
    
    print(f"Sent to DLQ: {transaction.get('transaction_id', 'unknown')}")