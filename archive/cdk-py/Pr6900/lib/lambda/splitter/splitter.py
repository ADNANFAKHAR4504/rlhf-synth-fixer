import json
import boto3
import os
from typing import Dict, List, Any

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

CHUNK_SIZE_MB = int(os.environ.get('CHUNK_SIZE_MB', '50'))
CHUNK_SIZE_BYTES = CHUNK_SIZE_MB * 1024 * 1024
STATUS_TABLE = os.environ['STATUS_TABLE']
BUCKET_NAME = os.environ['BUCKET_NAME']


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Split large CSV files into chunks for parallel processing.

    Args:
        event: Event data containing bucket and object information
        context: Lambda context

    Returns:
        Dictionary with file_id and list of chunks
    """
    try:
        # Extract S3 object information
        bucket = event.get('bucket', {}).get('name', BUCKET_NAME)
        key = event.get('object', {}).get('key')

        if not key:
            raise ValueError("Missing object key in event")

        # Get file metadata
        response = s3_client.head_object(Bucket=bucket, Key=key)
        file_size = response['ContentLength']

        # Generate file ID
        file_id = f"{key.replace('/', '-')}-{response['ETag'].strip('\"')}"

        # Calculate number of chunks
        num_chunks = (file_size + CHUNK_SIZE_BYTES - 1) // CHUNK_SIZE_BYTES

        # Create chunk metadata
        chunks = []
        table = dynamodb.Table(STATUS_TABLE)

        for i in range(num_chunks):
            chunk_id = f"chunk-{i:04d}"
            start_byte = i * CHUNK_SIZE_BYTES
            end_byte = min((i + 1) * CHUNK_SIZE_BYTES - 1, file_size - 1)

            chunk_info = {
                'chunk_id': chunk_id,
                'bucket': bucket,
                'key': key,
                'start_byte': start_byte,
                'end_byte': end_byte,
                'size': end_byte - start_byte + 1,
            }

            chunks.append(chunk_info)

            # Record chunk in DynamoDB
            table.put_item(
                Item={
                    'file_id': file_id,
                    'chunk_id': chunk_id,
                    'status': 'pending',
                    'bucket': bucket,
                    'key': key,
                    'start_byte': start_byte,
                    'end_byte': end_byte,
                }
            )

        return {
            'statusCode': 200,
            'file_id': file_id,
            'bucket': bucket,
            'key': key,
            'file_size': file_size,
            'num_chunks': num_chunks,
            'chunks': chunks,
        }

    except Exception as e:
        print(f"Error splitting file: {str(e)}")
        raise
