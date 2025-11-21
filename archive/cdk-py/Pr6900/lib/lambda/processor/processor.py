import json
import boto3
import os
import csv
from io import StringIO
from decimal import Decimal
from typing import Dict, Any

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

STATUS_TABLE = os.environ['STATUS_TABLE']
BUCKET_NAME = os.environ['BUCKET_NAME']


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process a single CSV chunk.

    Args:
        event: Event data with chunk information
        context: Lambda context

    Returns:
        Processing result
    """
    try:
        file_id = event['file_id']
        chunk = event['chunk']
        chunk_id = chunk['chunk_id']
        bucket = chunk['bucket']
        key = chunk['key']
        start_byte = chunk['start_byte']
        end_byte = chunk['end_byte']

        table = dynamodb.Table(STATUS_TABLE)

        # Update status to processing
        table.update_item(
            Key={'file_id': file_id, 'chunk_id': chunk_id},
            UpdateExpression='SET #status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'processing'},
        )

        # Read chunk data
        response = s3_client.get_object(
            Bucket=bucket,
            Key=key,
            Range=f'bytes={start_byte}-{end_byte}'
        )

        chunk_data = response['Body'].read().decode('utf-8')

        # Process CSV data
        csv_reader = csv.DictReader(StringIO(chunk_data))
        rows_processed = 0
        total_amount = Decimal('0')

        for row in csv_reader:
            rows_processed += 1
            if 'amount' in row:
                try:
                    total_amount += Decimal(str(row['amount']))
                except (ValueError, KeyError):
                    pass

        # Write processed results
        output_key = key.replace('incoming/', 'processed/')
        output_key = f"{output_key}-{chunk_id}.json"

        result_data = {
            'file_id': file_id,
            'chunk_id': chunk_id,
            'rows_processed': rows_processed,
            'total_amount': str(total_amount),
            'status': 'completed',
        }

        s3_client.put_object(
            Bucket=bucket,
            Key=output_key,
            Body=json.dumps(result_data),
            ContentType='application/json',
        )

        # Update status to completed
        table.update_item(
            Key={'file_id': file_id, 'chunk_id': chunk_id},
            UpdateExpression='SET #status = :status, rows_processed = :rows, output_key = :output',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'completed',
                ':rows': rows_processed,
                ':output': output_key,
            },
        )

        return {
            'statusCode': 200,
            'file_id': file_id,
            'chunk_id': chunk_id,
            'rows_processed': rows_processed,
            'output_key': output_key,
        }

    except Exception as e:
        # Update status to failed
        try:
            table.update_item(
                Key={'file_id': file_id, 'chunk_id': chunk_id},
                UpdateExpression='SET #status = :status, error_message = :error',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'failed',
                    ':error': str(e),
                },
            )
        except Exception:
            pass

        print(f"Processing error: {str(e)}")
        raise
