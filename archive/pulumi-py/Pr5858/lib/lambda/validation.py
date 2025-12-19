import json
import boto3
import csv
import io
import os
from datetime import datetime
from decimal import Decimal

def handler(event, context):
    # Initialize clients inside handler for proper mocking in tests
    s3_client = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    table_name = os.environ['DYNAMODB_TABLE']
    table = dynamodb.Table(table_name)
    """
    Validates CSV transaction files uploaded to S3
    """
    try:
        # Get bucket and key from S3 event
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = event['Records'][0]['s3']['object']['key']

        print(f"Processing file: {bucket}/{key}")

        # Get object from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        csv_content = response['Body'].read().decode('utf-8')

        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(csv_content))

        processed_count = 0
        error_count = 0

        for row in csv_reader:
            try:
                # Validate required fields
                if not all(k in row for k in ['transaction_id', 'amount', 'merchant_id', 'card_number']):
                    print(f"Missing required fields in row: {row}")
                    error_count += 1
                    continue

                # Validate data types
                amount = Decimal(str(row['amount']))
                timestamp = int(datetime.utcnow().timestamp())

                # Store in DynamoDB
                table.put_item(
                    Item={
                        'transaction_id': row['transaction_id'],
                        'timestamp': timestamp,
                        'amount': amount,
                        'merchant_id': row['merchant_id'],
                        'card_number': row['card_number'][-4:],  # Store only last 4 digits
                        'status': 'validated',
                        'source_file': key
                    }
                )

                processed_count += 1

            except Exception as e:
                print(f"Error processing row {row}: {str(e)}")
                error_count += 1

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'File processed successfully',
                'processed': processed_count,
                'errors': error_count
            })
        }

    except Exception as e:
        print(f"Error processing file: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing file',
                'error': str(e)
            })
        }
