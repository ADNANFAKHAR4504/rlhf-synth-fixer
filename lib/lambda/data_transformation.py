"""
Lambda function for real-time data transformation during DMS migration.
This function processes DMS change data capture (CDC) events and transforms
data as needed before it reaches the target Aurora database.
"""

import json
import logging
import os
from datetime import datetime
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def decimal_default(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def transform_payment_record(record):
    """
    Transform payment records for AWS Aurora PostgreSQL.

    Args:
        record: Payment record from DMS CDC event

    Returns:
        Transformed record ready for Aurora
    """
    try:
        # Add transformation timestamp
        record['transformation_timestamp'] = datetime.utcnow().isoformat()

        # Normalize currency amounts (ensure decimal precision)
        if 'amount' in record:
            record['amount'] = round(float(record['amount']), 2)

        # Sanitize and validate payment status
        if 'status' in record:
            valid_statuses = ['pending', 'processing', 'completed', 'failed', 'cancelled']
            if record['status'].lower() not in valid_statuses:
                logger.warning(f"Invalid status: {record['status']}, defaulting to 'pending'")
                record['status'] = 'pending'

        # Ensure required fields are present
        required_fields = ['transaction_id', 'amount', 'currency', 'status']
        for field in required_fields:
            if field not in record:
                logger.error(f"Missing required field: {field}")
                raise ValueError(f"Missing required field: {field}")

        # Add environment identifier
        record['environment'] = os.environ.get('ENVIRONMENT_SUFFIX', 'unknown')

        return record
    except Exception as e:
        logger.error(f"Error transforming record: {str(e)}")
        raise

def process_dms_event(event):
    """
    Process DMS CDC event and transform records.

    Args:
        event: DMS CDC event from Lambda trigger

    Returns:
        Processed records
    """
    processed_records = []

    try:
        # Parse DMS CDC event
        for record in event.get('Records', []):
            # Extract operation type (INSERT, UPDATE, DELETE)
            operation = record.get('eventName', 'UNKNOWN')

            # Extract data from the event
            if 'dynamodb' in record:
                # DynamoDB Streams format
                data = record['dynamodb'].get('NewImage', {})
            else:
                # Direct invocation format
                data = record.get('data', {})

            logger.info(f"Processing {operation} operation for record")

            # Transform the record
            transformed_record = transform_payment_record(data)

            processed_records.append({
                'operation': operation,
                'data': transformed_record,
                'processed_at': datetime.utcnow().isoformat()
            })

    except Exception as e:
        logger.error(f"Error processing DMS event: {str(e)}")
        raise

    return processed_records

def lambda_handler(event, context):
    """
    Main Lambda handler for DMS data transformation.

    Args:
        event: Lambda event (DMS CDC event)
        context: Lambda context

    Returns:
        Response with processed records count
    """
    logger.info(f"Received event with {len(event.get('Records', []))} records")

    try:
        # Process the DMS event
        processed_records = process_dms_event(event)

        # Log success
        logger.info(f"Successfully processed {len(processed_records)} records")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed records',
                'records_processed': len(processed_records),
                'timestamp': datetime.utcnow().isoformat()
            }, default=decimal_default)
        }

    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing records',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
        }
