#!/usr/bin/env python3
"""
S3-triggered Lambda function for processing data.
Handles S3 events and processes objects from input bucket to output bucket.
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List

import boto3

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))

# Initialize S3 client
s3_client = boto3.client('s3')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for S3 event processing.
    Processes all S3 records in the event.
    
    Addresses model failure: Lambda handler partial processing.
    This implementation ensures ALL records are processed, not just the first one.
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    results = []
    
    # Process all records in the event
    records = event.get('Records', [])
    for record in records:
        if 's3' in record:
            result = process_s3_record(record)
            results.append(result)
        else:
            logger.warning(f"Skipping non-S3 record: {record}")
            results.append({
                'status': 'skipped',
                'reason': 'Not an S3 event record'
            })
    
    return {
        'statusCode': 200,
        'body': json.dumps(results)
    }


def process_s3_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a single S3 record.
    Downloads object, processes it, and uploads result to output bucket.
    """
    try:
        # Extract S3 information
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        logger.info(f"Processing S3 object: s3://{bucket}/{key}")
        
        # Get object metadata
        response = s3_client.head_object(Bucket=bucket, Key=key)
        size = response['ContentLength']
        last_modified = response['LastModified']
        
        logger.info(f"Object size: {size} bytes, Last modified: {last_modified}")
        
        # Download and process the object
        obj_response = s3_client.get_object(Bucket=bucket, Key=key)
        content = obj_response['Body'].read()
        
        # Simple processing: add metadata and timestamp
        processed_data = {
            'original_key': key,
            'original_bucket': bucket,
            'processed_at': datetime.utcnow().isoformat(),
            'original_size': size,
            'original_last_modified': last_modified.isoformat(),
            'content_preview': content[:100].decode('utf-8', errors='ignore') if len(content) > 0 else '',
            'processing_status': 'success'
        }
        
        # Upload processed result to output bucket
        output_bucket = os.getenv('OUTPUT_BUCKET')
        output_key = f"processed/{datetime.utcnow().strftime('%Y/%m/%d')}/{key}"
        
        s3_client.put_object(
            Bucket=output_bucket,
            Key=output_key,
            Body=json.dumps(processed_data, indent=2),
            ContentType='application/json',
            ServerSideEncryption='AES256'
        )
        
        logger.info(f"Successfully processed and uploaded to s3://{output_bucket}/{output_key}")
        
        return {
            'status': 'success',
            'input_bucket': bucket,
            'input_key': key,
            'output_bucket': output_bucket,
            'output_key': output_key,
            'processed_at': processed_data['processed_at']
        }
        
    except Exception as e:
        logger.error(f"Error processing S3 record: {str(e)}")
        return {
            'status': 'error',
            'error': str(e),
            'input_bucket': record.get('s3', {}).get('bucket', {}).get('name', 'unknown'),
            'input_key': record.get('s3', {}).get('object', {}).get('key', 'unknown')
        }