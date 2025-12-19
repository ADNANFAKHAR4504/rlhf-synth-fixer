import json
import csv
import boto3
import os
from datetime import datetime
from io import StringIO
from urllib.parse import unquote_plus

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

DYNAMODB_TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

def handler(event, context):
    """
    Process CSV files uploaded to S3.
    Extract transaction summaries and data quality metrics.
    """
    try:
        # Get bucket and key from S3 event
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = unquote_plus(record['s3']['object']['key'])

            print(f"Processing file: {bucket}/{key}")

            # Download CSV file from S3
            response = s3_client.get_object(Bucket=bucket, Key=key)
            csv_content = response['Body'].read().decode('utf-8')

            # Process CSV file
            csv_reader = csv.DictReader(StringIO(csv_content))
            rows = list(csv_reader)

            # Extract metrics
            total_rows = len(rows)
            file_id = key.split('/')[-1].replace('.csv', '')
            timestamp = int(datetime.now().timestamp())

            # Calculate data quality metrics
            complete_rows = sum(1 for row in rows if all(row.values()))
            completeness_rate = (complete_rows / total_rows * 100) if total_rows > 0 else 0

            # Extract transaction summary (example: sum of amounts if present)
            transaction_summary = {
                'total_records': total_rows,
                'complete_records': complete_rows,
                'completeness_percentage': round(completeness_rate, 2),
                'columns': list(rows[0].keys()) if rows else [],
            }

            # Store results in DynamoDB
            table.put_item(
                Item={
                    'fileId': file_id,
                    'timestamp': timestamp,
                    'bucket': bucket,
                    'key': key,
                    'metrics': transaction_summary,
                    'status': 'completed',
                    'processedAt': datetime.now().isoformat(),
                }
            )

            print(f"Successfully processed {key}")
            print(f"Metrics: {json.dumps(transaction_summary)}")

        return {
            'statusCode': 200,
            'body': json.dumps('Processing completed successfully')
        }

    except Exception as e:
        print(f"Error processing file: {str(e)}")
        raise
