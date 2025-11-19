
import json
import os
import base64
import boto3
from datetime import datetime
from typing import Dict, List, Any
import logging

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
ssm_client = boto3.client('ssm')

# Environment variables
ENVIRONMENT = os.environ['ENVIRONMENT']
DYNAMODB_TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
S3_BUCKET_NAME = os.environ['S3_BUCKET_NAME']
SSM_API_KEY_PARAM = os.environ['SSM_API_KEY_PARAM']
SSM_CONNECTION_STRING_PARAM = os.environ['SSM_CONNECTION_STRING_PARAM']
REGION = os.environ['REGION']

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Cache for SSM parameters
_ssm_cache = {}


def get_ssm_parameter(parameter_name: str) -> str:
    """
    Get parameter from SSM Parameter Store with caching.

    Args:
        parameter_name: Name of the SSM parameter

    Returns:
        Parameter value
    """
    if parameter_name in _ssm_cache:
        return _ssm_cache[parameter_name]

    try:
        response = ssm_client.get_parameter(
            Name=parameter_name,
            WithDecryption=True
        )
        value = response['Parameter']['Value']
        _ssm_cache[parameter_name] = value
        return value
    except Exception as e:
        logger.error(f"Error fetching SSM parameter {parameter_name}: {str(e)}")
        raise


def calculate_fraud_score(transaction: Dict[str, Any]) -> float:
    """
    Calculate fraud score for a transaction.
    This is a simplified fraud detection algorithm for demonstration.

    Args:
        transaction: Transaction data dictionary

    Returns:
        Fraud score between 0.0 and 1.0
    """
    score = 0.0

    # Check transaction amount
    amount = float(transaction.get('amount', 0))
    if amount > 10000:
        score += 0.3
    elif amount > 5000:
        score += 0.2
    elif amount > 1000:
        score += 0.1

    # Check transaction time (late night transactions are more suspicious)
    hour = int(transaction.get('hour', 12))
    if hour >= 23 or hour <= 5:
        score += 0.2

    # Check location mismatch
    if transaction.get('location_mismatch', False):
        score += 0.3

    # Check velocity (multiple transactions in short time)
    if transaction.get('velocity_flag', False):
        score += 0.25

    # Cap at 1.0
    return min(score, 1.0)


def categorize_fraud_score(score: float) -> str:
    """
    Categorize fraud score into risk levels.

    Args:
        score: Fraud score between 0.0 and 1.0

    Returns:
        Risk category string
    """
    if score >= 0.7:
        return "HIGH"
    elif score >= 0.4:
        return "MEDIUM"
    else:
        return "LOW"


def process_transaction(transaction_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a single transaction and calculate fraud score.

    Args:
        transaction_data: Raw transaction data

    Returns:
        Processed transaction with fraud score
    """
    transaction_id = transaction_data.get('transaction_id', 'unknown')
    timestamp = datetime.utcnow().isoformat()

    # Calculate fraud score
    fraud_score = calculate_fraud_score(transaction_data)
    fraud_category = categorize_fraud_score(fraud_score)

    # Create result object
    result = {
        'transaction_id': transaction_id,
        'timestamp': timestamp,
        'original_data': transaction_data,
        'fraud_score': fraud_score,
        'fraud_score_category': fraud_category,
        'environment': ENVIRONMENT,
        'processed_at': timestamp,
    }

    return result


def save_to_dynamodb(record: Dict[str, Any]) -> None:
    """
    Save processed transaction to DynamoDB.

    Args:
        record: Processed transaction record
    """
    table = dynamodb.Table(DYNAMODB_TABLE_NAME)

    try:
        # Convert float to Decimal for DynamoDB
        from decimal import Decimal
        record_copy = json.loads(json.dumps(record), parse_float=Decimal)

        table.put_item(Item=record_copy)
        logger.info(f"Saved transaction {record['transaction_id']} to DynamoDB")
    except Exception as e:
        logger.error(f"Error saving to DynamoDB: {str(e)}")
        raise


def archive_to_s3(record: Dict[str, Any]) -> None:
    """
    Archive high-risk transactions to S3.

    Args:
        record: Processed transaction record
    """
    # Only archive medium and high risk transactions
    if record['fraud_score_category'] in ['MEDIUM', 'HIGH']:
        try:
            date_prefix = datetime.utcnow().strftime('%Y/%m/%d')
            key = f"fraud-alerts/{date_prefix}/{record['transaction_id']}.json"

            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=key,
                Body=json.dumps(record, indent=2),
                ContentType='application/json'
            )
            logger.info(f"Archived transaction {record['transaction_id']} to S3")
        except Exception as e:
            logger.error(f"Error archiving to S3: {str(e)}")
            # Don't raise - archival is not critical


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for processing Kinesis stream records.

    Args:
        event: Kinesis stream event
        context: Lambda context

    Returns:
        Processing result
    """
    logger.info(f"Processing {len(event['Records'])} records from Kinesis")

    # Load configuration from SSM (with caching)
    try:
        api_key = get_ssm_parameter(SSM_API_KEY_PARAM)
        connection_string = get_ssm_parameter(SSM_CONNECTION_STRING_PARAM)
        logger.info("Successfully loaded configuration from SSM Parameter Store")
    except Exception as e:
        logger.error(f"Failed to load SSM parameters: {str(e)}")
        # Continue processing with default behavior

    processed_count = 0
    failed_count = 0

    for record in event['Records']:
        try:
            # Decode Kinesis record
            payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
            transaction_data = json.loads(payload)

            logger.info(f"Processing transaction: {transaction_data.get('transaction_id', 'unknown')}")

            # Process transaction
            result = process_transaction(transaction_data)

            # Save to DynamoDB
            save_to_dynamodb(result)

            # Archive high-risk transactions to S3
            archive_to_s3(result)

            processed_count += 1

        except Exception as e:
            failed_count += 1
            logger.error(f"Error processing record: {str(e)}")
            # Continue processing other records

    logger.info(f"Completed processing: {processed_count} successful, {failed_count} failed")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': processed_count,
            'failed': failed_count
        })
    }


