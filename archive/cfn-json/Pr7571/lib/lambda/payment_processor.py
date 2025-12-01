import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Get environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']
KMS_KEY_ID = os.environ['KMS_KEY_ID']

# Initialize DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)


def lambda_handler(event, context):
    """
    Process encrypted payment files from S3 and store transaction records in DynamoDB.

    This function is triggered by S3 events or can be invoked directly.
    It reads payment data from S3, validates it, and stores transaction records
    in DynamoDB with encryption at rest.

    Args:
        event: AWS Lambda event object
        context: AWS Lambda context object

    Returns:
        dict: Response with statusCode and body
    """

    try:
        # Log the incoming event (without sensitive data)
        print(f"Processing payment event at {datetime.utcnow().isoformat()}")

        # Handle S3 event trigger
        if 'Records' in event:
            for record in event['Records']:
                if 's3' in record:
                    bucket = record['s3']['bucket']['name']
                    key = record['s3']['object']['key']

                    # Process the payment file
                    process_payment_file(bucket, key)

        # Handle direct invocation with payment data
        elif 'payment_data' in event:
            process_payment_data(event['payment_data'])

        else:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Invalid event format',
                    'message': 'Event must contain either S3 Records or payment_data'
                })
            }

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'timestamp': datetime.utcnow().isoformat()
            })
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Payment processing failed',
                'message': str(e)
            })
        }


def process_payment_file(bucket, key):
    """
    Read and process a payment file from S3.

    Args:
        bucket (str): S3 bucket name
        key (str): S3 object key
    """
    print(f"Reading payment file from s3://{bucket}/{key}")

    # Get the encrypted file from S3
    response = s3_client.get_object(
        Bucket=bucket,
        Key=key
    )

    # Read and parse the payment data
    file_content = response['Body'].read().decode('utf-8')
    payment_data = json.loads(file_content)

    # Process the payment data
    process_payment_data(payment_data)


def process_payment_data(payment_data):
    """
    Validate and store payment transaction data in DynamoDB.

    Args:
        payment_data (dict): Payment transaction data
    """
    # Validate required fields
    required_fields = ['transactionId', 'amount', 'currency', 'cardLast4']
    for field in required_fields:
        if field not in payment_data:
            raise ValueError(f"Missing required field: {field}")

    # Prepare transaction record
    timestamp = int(datetime.utcnow().timestamp() * 1000)

    transaction_record = {
        'transactionId': payment_data['transactionId'],
        'timestamp': timestamp,
        'amount': Decimal(str(payment_data['amount'])),
        'currency': payment_data['currency'],
        'cardLast4': payment_data['cardLast4'],
        'status': 'processed',
        'processedAt': datetime.utcnow().isoformat(),
        'metadata': payment_data.get('metadata', {})
    }

    # Store in DynamoDB (encrypted at rest with KMS)
    print(f"Storing transaction {payment_data['transactionId']} in DynamoDB")

    table.put_item(Item=transaction_record)

    print(f"Transaction {payment_data['transactionId']} processed successfully")


def query_transactions(transaction_id):
    """
    Query transaction records from DynamoDB.

    Args:
        transaction_id (str): Transaction ID to query

    Returns:
        list: List of transaction records
    """
    response = table.query(
        KeyConditionExpression='transactionId = :tid',
        ExpressionAttributeValues={
            ':tid': transaction_id
        }
    )

    return response.get('Items', [])