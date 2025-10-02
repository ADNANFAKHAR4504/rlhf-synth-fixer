"""processor.py
Lambda function for processing shipment files uploaded to S3.
"""

import json
import os
import time
import boto3
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb_client = boto3.client('dynamodb')
cloudwatch_client = boto3.client('cloudwatch')

# Environment variables
METADATA_TABLE = os.environ['METADATA_TABLE']
ENVIRONMENT = os.environ['ENVIRONMENT']
METRICS_NAMESPACE = os.environ['METRICS_NAMESPACE']


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process shipment files uploaded to S3.

    Args:
        event: S3 event notification
        context: Lambda context object

    Returns:
        Response with processing status
    """
    start_time = time.time()

    try:
        # Parse S3 event
        for record in event['Records']:
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']
            object_size = record['s3']['object']['size']

            logger.info("Processing file: s3://%s/%s", bucket_name, object_key)
            logger.info("File size: %s bytes", object_size)

            # Get file from S3
            try:
                response = s3_client.get_object(
                    Bucket=bucket_name,
                    Key=object_key
                )
                file_content = response['Body'].read()

                # Process file content (placeholder for actual processing logic)
                processed_records = process_shipment_data(file_content)

                # Calculate processing duration
                processing_duration = time.time() - start_time

                # Store metadata in DynamoDB
                store_metadata(
                    filename=object_key,
                    upload_timestamp=datetime.utcnow().isoformat(),
                    processing_status='SUCCESS',
                    processing_duration=processing_duration,
                    records_processed=processed_records,
                    file_size=object_size
                )

                # Send success metric
                send_metric('ProcessingSuccess', 1)

                logger.info("Successfully processed %s in %.2f seconds", object_key, processing_duration)

            except Exception as e:
                logger.error("Error processing file %s: %s", object_key, str(e))

                # Store failure metadata
                processing_duration = time.time() - start_time
                store_metadata(
                    filename=object_key,
                    upload_timestamp=datetime.utcnow().isoformat(),
                    processing_status='FAILED',
                    processing_duration=processing_duration,
                    error_message=str(e),
                    file_size=object_size
                )

                # Send failure metric
                send_metric('ProcessingFailure', 1)

                raise

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'File processed successfully',
                'processingTime': time.time() - start_time
            })
        }

    except Exception as e:
        logger.error("Unexpected error: %s", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }


def process_shipment_data(file_content: bytes) -> int:
    """
    Process shipment data from file content.

    Args:
        file_content: Raw file content

    Returns:
        Number of records processed
    """
    try:
        # Decode content
        content_str = file_content.decode('utf-8')

        # Parse as JSON (assuming JSON format for shipment data)
        data = json.loads(content_str)

        # Process each shipment record
        records_processed = 0
        if isinstance(data, list):
            for record in data:
                # Validate required fields
                if all(field in record for field in ['shipment_id', 'status', 'timestamp']):
                    # Process record (placeholder for actual business logic)
                    logger.debug("Processing shipment: %s", record.get('shipment_id'))
                    records_processed += 1
        elif isinstance(data, dict):
            # Single record
            if all(field in data for field in ['shipment_id', 'status', 'timestamp']):
                logger.debug("Processing shipment: %s", data.get('shipment_id'))
                records_processed = 1

        return records_processed

    except json.JSONDecodeError as e:
        logger.warning("File is not valid JSON, attempting CSV processing: %s", str(e))
        # Fallback to CSV processing
        lines = content_str.split('\n')
        return len([line for line in lines if line.strip()])
    except Exception as e:
        logger.error("Error processing shipment data: %s", str(e))
        raise


def store_metadata(filename: str, upload_timestamp: str, processing_status: str,
                  processing_duration: float, **kwargs) -> None:
    """
    Store file metadata in DynamoDB.

    Args:
        filename: Name of the processed file
        upload_timestamp: ISO format timestamp
        processing_status: SUCCESS or FAILED
        processing_duration: Time taken to process in seconds
        **kwargs: Additional metadata fields
    """
    try:
        item = {
            'filename': {'S': filename},
            'upload_timestamp': {'S': upload_timestamp},
            'processing_status': {'S': processing_status},
            'processing_duration': {'N': str(processing_duration)},
            'environment': {'S': ENVIRONMENT}
        }

        # Add optional fields
        for key, value in kwargs.items():
            if value is not None:
                if isinstance(value, (int, float)):
                    item[key] = {'N': str(value)}
                else:
                    item[key] = {'S': str(value)}

        dynamodb_client.put_item(
            TableName=METADATA_TABLE,
            Item=item
        )

        logger.info("Metadata stored for %s", filename)

    except Exception as e:
        logger.error("Error storing metadata: %s", str(e))
        raise


def send_metric(metric_name: str, value: float, unit: str = 'Count') -> None:
    """
    Send custom metric to CloudWatch.

    Args:
        metric_name: Name of the metric
        value: Metric value
        unit: Unit of measurement
    """
    try:
        cloudwatch_client.put_metric_data(
            Namespace=METRICS_NAMESPACE,
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': ENVIRONMENT
                        }
                    ]
                }
            ]
        )

        logger.debug("Metric sent: %s=%s", metric_name, value)

    except Exception as e:
        logger.error("Error sending metric: %s", str(e))
