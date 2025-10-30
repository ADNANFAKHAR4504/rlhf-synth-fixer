"""
Lambda handler for processing S3 CSV files.

This handler is triggered by S3 events when CSV files are uploaded to the incoming/ prefix.
It processes the CSV data and stores results in DynamoDB.
"""

import csv
import json
import os
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List

import boto3
from botocore.exceptions import ClientError

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process S3 CSV file upload events.
    
    Args:
        event: S3 event notification
        context: Lambda context
        
    Returns:
        Response with status and processing details
    """
    print(f"Processing event: {json.dumps(event)}")
    
    try:
        # Get DynamoDB table name from environment
        table_name = os.environ.get('DYNAMODB_TABLE_NAME')
        if not table_name:
            raise ValueError("DYNAMODB_TABLE_NAME environment variable not set")
        
        table = dynamodb.Table(table_name)
        
        # Process each S3 record
        processed_records = []
        
        for record in event.get('Records', []):
            # Extract S3 bucket and key
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            print(f"Processing file: s3://{bucket}/{key}")
            
            # Download and process CSV file
            items = process_csv_file(bucket, key)
            
            # Store items in DynamoDB
            stored_count = store_items_in_dynamodb(table, items)
            
            # Move processed file to processed/ prefix
            move_to_processed(bucket, key)
            
            processed_records.append({
                'bucket': bucket,
                'key': key,
                'items_stored': stored_count
            })
        
        print(f"Successfully processed {len(processed_records)} files")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing completed successfully',
                'processed_records': processed_records
            })
        }
        
    except Exception as e:
        error_details = {
            'error': str(e),
            'error_type': type(e).__name__,
            'event': event
        }
        print(f"ERROR processing event: {json.dumps(error_details)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'error_type': type(e).__name__
            })
        }


def process_csv_file(bucket: str, key: str) -> List[Dict[str, Any]]:
    """
    Download and parse CSV file from S3.
    
    Args:
        bucket: S3 bucket name
        key: S3 object key
        
    Returns:
        List of parsed items
    """
    try:
        # Download file from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        
        # Parse CSV
        items = []
        csv_reader = csv.DictReader(content.splitlines())
        
        for row in csv_reader:
            # Convert numeric values to Decimal for DynamoDB
            item = {
                'symbol': row.get('symbol', ''),
                'timestamp': Decimal(str(row.get('timestamp', 0))),
                'price': Decimal(str(row.get('price', 0))),
                'volume': Decimal(str(row.get('volume', 0))),
                'source_file': key,
                'processed_at': Decimal(str(datetime.utcnow().timestamp()))
            }
            items.append(item)
        
        print(f"Parsed {len(items)} items from CSV")
        return items
        
    except Exception as e:
        print(f"Error processing CSV file: {str(e)}")
        raise


def store_items_in_dynamodb(table: Any, items: List[Dict[str, Any]]) -> int:
    """
    Store items in DynamoDB using batch write.
    
    Args:
        table: DynamoDB table resource
        items: List of items to store
        
    Returns:
        Number of items stored
    """
    try:
        stored_count = 0
        
        # Batch write items (max 25 per batch)
        with table.batch_writer() as batch:
            for item in items:
                batch.put_item(Item=item)
                stored_count += 1
        
        print(f"Stored {stored_count} items in DynamoDB")
        return stored_count
        
    except ClientError as e:
        print(f"Error storing items in DynamoDB: {str(e)}")
        raise


def move_to_processed(bucket: str, key: str) -> None:
    """
    Move processed file to processed/ prefix.
    
    Args:
        bucket: S3 bucket name
        key: S3 object key
    """
    try:
        # Generate new key with processed/ prefix
        filename = key.split('/')[-1]
        new_key = f"processed/{filename}"
        
        # Copy object to new location
        s3_client.copy_object(
            Bucket=bucket,
            CopySource={'Bucket': bucket, 'Key': key},
            Key=new_key
        )
        
        # Delete original object
        s3_client.delete_object(Bucket=bucket, Key=key)
        
        print(f"Moved file from {key} to {new_key}")
        
    except Exception as e:
        print(f"Error moving file: {str(e)}")
        # Don't raise - this is not critical

