import base64
import json
import boto3
import os
from datetime import datetime
import gzip
import logging
import traceback
from typing import Dict, List, Any
from decimal import Decimal

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
cloudwatch = boto3.client('cloudwatch')

# Validate and load environment variables
try:
    BUCKET_NAME = os.environ['S3_BUCKET']
    ENVIRONMENT = os.environ['ENVIRONMENT']
except KeyError as e:
    logger.error(f"Missing required environment variable: {e}")
    raise

# Constants for performance tuning
MAX_PAYLOAD_SIZE = 6 * 1024 * 1024  # 6MB limit for Lambda payload
BATCH_WRITE_THRESHOLD = 50  # Batch multiple records into single S3 object
MAX_RETRIES = 3

class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder for Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def publish_metric(metric_name: str, value: float, unit: str = 'Count'):
    """Publish custom CloudWatch metrics"""
    try:
        cloudwatch.put_metric_data(
            Namespace='LogAnalytics',
            MetricData=[{
                'MetricName': metric_name,
                'Value': value,
                'Unit': unit,
                'Timestamp': datetime.utcnow(),
                'Dimensions': [
                    {'Name': 'Environment', 'Value': ENVIRONMENT}
                ]
            }]
        )
    except Exception as e:
        logger.warning(f"Failed to publish metric {metric_name}: {e}")

def sanitize_and_enrich_log(payload: bytes, kinesis_metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize, validate, and enrich log data with metadata
    """
    # Check payload size
    if len(payload) > MAX_PAYLOAD_SIZE:
        raise ValueError(f"Payload size {len(payload)} exceeds maximum {MAX_PAYLOAD_SIZE}")

    # Try to parse as JSON with multiple encodings
    log_data = None
    parse_error = None

    for encoding in ['utf-8', 'latin-1', 'ascii']:
        try:
            decoded = payload.decode(encoding)
            log_data = json.loads(decoded)
            break
        except (UnicodeDecodeError, json.JSONDecodeError) as e:
            parse_error = e
            continue

    # Fallback to raw data if parsing fails
    if log_data is None:
        try:
            log_data = {
                "raw": payload.decode('utf-8', errors='replace'),
                "parse_error": str(parse_error)
            }
        except Exception as e:
            log_data = {
                "raw": base64.b64encode(payload).decode('ascii'),
                "encoding": "base64",
                "parse_error": str(e)
            }

    # Enrich with comprehensive metadata
    log_data['_metadata'] = {
        'processed_at': datetime.utcnow().isoformat(),
        'environment': ENVIRONMENT,
        'kinesis': {
            'sequence_number': kinesis_metadata['sequenceNumber'],
            'partition_key': kinesis_metadata.get('partitionKey', 'unknown'),
            'approximate_arrival_timestamp': kinesis_metadata.get('approximateArrivalTimestamp', 0),
            'shard_id': kinesis_metadata.get('kinesisSchemaVersion', 'unknown')
        },
        'payload_size_bytes': len(payload)
    }

    return log_data

def write_batch_to_s3(records: List[Dict[str, Any]], batch_id: str) -> None:
    """
    Write multiple records as a single compressed file to S3
    """
    try:
        # Combine records with newline delimiter for JSONL format
        jsonl_data = '\n'.join([json.dumps(record, cls=DecimalEncoder) for record in records])
        compressed_data = gzip.compress(jsonl_data.encode('utf-8'))

        # Generate S3 key with time-based partitioning
        now = datetime.utcnow()
        s3_key = (f"logs/year={now.year}/month={now.month:02d}/day={now.day:02d}/"
                 f"hour={now.hour:02d}/{batch_id}.jsonl.gz")

        # Upload to S3 with retry logic
        retry_count = 0
        last_exception = None

        while retry_count < MAX_RETRIES:
            try:
                s3_client.put_object(
                    Bucket=BUCKET_NAME,
                    Key=s3_key,
                    Body=compressed_data,
                    ContentType='application/x-ndjson',
                    ContentEncoding='gzip',
                    Metadata={
                        'record_count': str(len(records)),
                        'environment': ENVIRONMENT,
                        'batch_id': batch_id
                    }
                )

                # Success - publish metrics
                publish_metric('S3BatchWrites', 1)
                publish_metric('RecordsPerBatch', len(records))
                publish_metric('CompressedSizeBytes', len(compressed_data), 'Bytes')

                logger.info(f"Successfully wrote batch {batch_id} with {len(records)} records to S3: {s3_key}")
                return

            except Exception as e:
                last_exception = e
                retry_count += 1
                if retry_count < MAX_RETRIES:
                    logger.warning(f"S3 write attempt {retry_count} failed for batch {batch_id}: {e}")
                    # Exponential backoff would go here in production
                    continue

        # All retries exhausted
        raise Exception(f"Failed to write batch {batch_id} after {MAX_RETRIES} attempts: {last_exception}")

    except Exception as e:
        logger.error(f"Error writing batch to S3: {e}")
        raise

def handler(event, context):
    """
    Process Kinesis stream records with robust error handling and batch optimization
    """
    start_time = datetime.utcnow()

    logger.info(f"Processing batch of {len(event.get('Records', []))} records")

    processed_records = 0
    failed_records = []
    batch_buffer = []

    # Get request ID for batch identification
    request_id = context.request_id

    for idx, record in enumerate(event.get('Records', [])):
        sequence_number = None

        try:
            # Extract Kinesis metadata
            kinesis_data = record.get('kinesis', {})
            sequence_number = kinesis_data.get('sequenceNumber')

            if not sequence_number:
                raise ValueError("Missing sequence number in Kinesis record")

            # Decode Kinesis data
            encoded_data = kinesis_data.get('data', '')
            payload = base64.b64decode(encoded_data)

            # Sanitize and enrich log data
            log_data = sanitize_and_enrich_log(payload, kinesis_data)

            # Add to batch buffer
            batch_buffer.append(log_data)
            processed_records += 1

            # Write batch if threshold reached or last record
            if len(batch_buffer) >= BATCH_WRITE_THRESHOLD or idx == len(event['Records']) - 1:
                batch_id = f"{request_id}_{idx}_{datetime.utcnow().timestamp()}"
                write_batch_to_s3(batch_buffer, batch_id)
                batch_buffer = []  # Clear buffer after successful write

        except Exception as e:
            error_msg = str(e)
            stack_trace = traceback.format_exc()

            logger.error(
                f"Error processing record {sequence_number}: {error_msg}",
                extra={
                    'sequence_number': sequence_number,
                    'error': error_msg,
                    'stack_trace': stack_trace
                }
            )

            # Add to failed records for partial batch failure handling
            if sequence_number:
                failed_records.append({
                    'sequence_number': sequence_number,
                    'error': error_msg,
                    'error_type': type(e).__name__
                })

            # Clear batch buffer on error to avoid reprocessing
            batch_buffer = []

            # Publish error metrics
            publish_metric('ProcessingErrors', 1)

    # Calculate processing metrics
    end_time = datetime.utcnow()
    processing_duration = (end_time - start_time).total_seconds()

    # Log summary with structured data
    logger.info(
        "Batch processing complete",
        extra={
            'processed': processed_records,
            'failed': len(failed_records),
            'duration_seconds': processing_duration,
            'records_per_second': processed_records / processing_duration if processing_duration > 0 else 0
        }
    )

    # Publish success metrics
    publish_metric('ProcessedRecords', processed_records)
    publish_metric('FailedRecords', len(failed_records))
    publish_metric('ProcessingDuration', processing_duration * 1000, 'Milliseconds')

    # Return batch item failures for Kinesis to retry
    return {
        'batchItemFailures': [
            {'itemIdentifier': r['sequence_number']} for r in failed_records
        ]
    }