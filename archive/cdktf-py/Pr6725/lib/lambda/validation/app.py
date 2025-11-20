"""Transaction validation Lambda function."""
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


def validate_transaction(transaction):
    """
    Validate transaction data.

    Args:
        transaction: Transaction data dictionary

    Returns:
        dict: Validation result

    Raises:
        ValueError: If transaction data is invalid
    """
    required_fields = ['transaction_id', 'amount', 'currency', 'merchant_id', 'customer_id']

    # Check required fields
    for field in required_fields:
        if field not in transaction:
            raise ValueError(f"Missing required field: {field}")

    # Validate amount
    amount = float(transaction['amount'])
    if amount <= 0:
        raise ValueError("Transaction amount must be positive")

    if amount > 1000000:
        raise ValueError("Transaction amount exceeds maximum limit")

    # Validate currency
    valid_currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD']
    if transaction['currency'] not in valid_currencies:
        raise ValueError(f"Invalid currency: {transaction['currency']}")

    # Validate IDs
    if not transaction['transaction_id'] or len(transaction['transaction_id']) < 10:
        raise ValueError("Invalid transaction ID")

    if not transaction['merchant_id'] or len(transaction['merchant_id']) < 5:
        raise ValueError("Invalid merchant ID")

    if not transaction['customer_id'] or len(transaction['customer_id']) < 5:
        raise ValueError("Invalid customer ID")

    return {
        "valid": True,
        "checks_passed": len(required_fields) + 3,
        "validation_timestamp": int(time.time())
    }


def store_transaction_state(transaction_id, state_data):
    """
    Store transaction state in DynamoDB.

    Args:
        transaction_id: Transaction ID
        state_data: State data to store
    """
    table = dynamodb.Table(DYNAMODB_TABLE)

    item = {
        'transaction_id': transaction_id,
        'timestamp': int(time.time() * 1000),  # Milliseconds
        'state': 'VALIDATED',
        'environment': ENVIRONMENT,
        'validation_data': json.dumps(state_data, cls=DecimalEncoder)
    }

    table.put_item(Item=item)


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
            'stage': 'validation'
        }

        sqs.send_message(
            QueueUrl=DLQ_URL,
            MessageBody=json.dumps(message_body, cls=DecimalEncoder)
        )
        print(f"Sent failed transaction to DLQ: {event.get('transaction_id', 'unknown')}")
    except ClientError as e:
        print(f"Error sending to DLQ: {str(e)}")


def lambda_handler(event, context):
    """
    Lambda handler for transaction validation.

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        dict: Validation result
    """
    print(f"Validating transaction: {json.dumps(event, cls=DecimalEncoder)}")

    try:
        # Extract transaction data
        # Handle both direct invocation and Step Functions invocation
        if 'Payload' in event:
            transaction = event['Payload']
        else:
            transaction = event

        # Validate transaction
        validation_result = validate_transaction(transaction)

        # Store transaction state
        store_transaction_state(
            transaction['transaction_id'],
            {
                'transaction': transaction,
                'validation_result': validation_result
            }
        )

        print(f"Transaction validated successfully: {transaction['transaction_id']}")

        # Return result
        return {
            'statusCode': 200,
            'transaction_id': transaction['transaction_id'],
            'validation': validation_result,
            'transaction': transaction,
            'stage': 'validation'
        }

    except ValueError as e:
        error_message = f"Validation failed: {str(e)}"
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
