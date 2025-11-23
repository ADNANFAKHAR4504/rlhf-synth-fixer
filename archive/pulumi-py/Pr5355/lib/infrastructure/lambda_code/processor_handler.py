"""
CSV processor Lambda function for financial market data pipeline.

This function processes CSV files uploaded to S3, validates data format,
and stores parsed records in DynamoDB.
"""

import csv
import json
import os
from datetime import datetime
from decimal import Decimal
from io import StringIO

import boto3

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


def handler(event, context):
    """
    Process CSV files from S3 and store in DynamoDB.
    
    Args:
        event: S3 event notification
        context: Lambda context
    
    Returns:
        Processing result
    """
    try:
        table_name = os.environ.get('DYNAMODB_TABLE_NAME')
        table = dynamodb.Table(table_name)
        
        for record in event.get('Records', []):
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            print(json.dumps({
                'message': 'Processing CSV file',
                'bucket': bucket,
                'key': key,
                'timestamp': datetime.utcnow().isoformat()
            }))
            
            response = s3.get_object(Bucket=bucket, Key=key)
            csv_content = response['Body'].read().decode('utf-8')
            
            csv_reader = csv.DictReader(StringIO(csv_content))
            
            items_processed = 0
            with table.batch_writer() as batch:
                for row in csv_reader:
                    if not validate_row(row):
                        print(json.dumps({
                            'message': 'Invalid row skipped',
                            'row': row,
                            'timestamp': datetime.utcnow().isoformat()
                        }))
                        continue
                    
                    item = {
                        'symbol': row['symbol'],
                        'timestamp': int(row['timestamp']),
                        'source_file': key,
                        'processed_at': datetime.utcnow().isoformat()
                    }
                    
                    if 'open' in row and row['open']:
                        item['open'] = Decimal(str(row['open']))
                    if 'high' in row and row['high']:
                        item['high'] = Decimal(str(row['high']))
                    if 'low' in row and row['low']:
                        item['low'] = Decimal(str(row['low']))
                    if 'close' in row and row['close']:
                        item['close'] = Decimal(str(row['close']))
                    if 'price' in row and row['price']:
                        item['price'] = Decimal(str(row['price']))
                    if 'volume' in row and row['volume']:
                        item['volume'] = int(row['volume'])
                    
                    batch.put_item(Item=item)
                    items_processed += 1
                    
                    print(json.dumps({
                        'message': 'Item processed',
                        'symbol': row['symbol'],
                        'timestamp': row['timestamp'],
                        'items_processed': items_processed
                    }))
            
            processed_key = key.replace('incoming/', 'processed/')
            s3.copy_object(
                Bucket=bucket,
                CopySource={'Bucket': bucket, 'Key': key},
                Key=processed_key
            )
            s3.delete_object(Bucket=bucket, Key=key)
            
            print(json.dumps({
                'message': 'Processing complete',
                'items_processed': items_processed,
                'source_key': key,
                'processed_key': processed_key,
                'timestamp': datetime.utcnow().isoformat()
            }))
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing complete',
                'records_processed': len(event.get('Records', []))
            })
        }
    
    except Exception as e:
        print(json.dumps({
            'message': 'Processing error',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }))
        raise


def validate_row(row):
    """
    Validate CSV row data format.
    
    Args:
        row: Dictionary representing a CSV row
    
    Returns:
        True if valid, False otherwise
    """
    required_fields = ['symbol', 'timestamp']
    
    for field in required_fields:
        if field not in row or not row[field]:
            return False
    
    try:
        int(row['timestamp'])
        
        if 'price' in row and row['price']:
            float(row['price'])
        if 'open' in row and row['open']:
            float(row['open'])
        if 'high' in row and row['high']:
            float(row['high'])
        if 'low' in row and row['low']:
            float(row['low'])
        if 'close' in row and row['close']:
            float(row['close'])
        if 'volume' in row and row['volume']:
            int(row['volume'])
        
        return True
    except (ValueError, TypeError):
        return False




