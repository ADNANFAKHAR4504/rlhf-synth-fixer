import json
import boto3
import csv
import os
from io import StringIO

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """
    Parses CSV file from S3 and stores transactions in DynamoDB.
    Returns parsed transaction count and reconciliation ID.
    """
    try:
        bucket = event['bucket']
        key = event['key']
        
        # Download CSV file from S3
        response = s3.get_object(Bucket=bucket, Key=key)
        csv_content = response['Body'].read().decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(StringIO(csv_content))
        transactions = list(csv_reader)
        
        # Store in DynamoDB
        table_name = os.environ['TRANSACTION_TABLE']
        table = dynamodb.Table(table_name)
        
        reconciliation_id = f"{bucket}/{key}"
        transaction_count = 0
        
        with table.batch_writer() as batch:
            for transaction in transactions:
                transaction_id = transaction.get('transaction_id', '')
                if transaction_id:
                    batch.put_item(Item={
                        'transaction_id': transaction_id,
                        'reconciliation_id': reconciliation_id,
                        'amount': transaction.get('amount', '0'),
                        'provider': transaction.get('provider', ''),
                        'timestamp': transaction.get('timestamp', ''),
                        'status': 'pending'
                    })
                    transaction_count += 1
        
        return {
            'statusCode': 200,
            'reconciliation_id': reconciliation_id,
            'transaction_count': transaction_count,
            'bucket': bucket,
            'key': key
        }
        
    except Exception as e:
        print(f"Error parsing file: {str(e)}")
        raise
