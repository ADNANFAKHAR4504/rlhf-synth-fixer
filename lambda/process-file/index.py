import json
import os
import boto3
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')

def handler(event, context):
    """
    Process file from S3 bucket and perform business logic.
    Environment variables:
    - BUCKET_NAME: S3 bucket name
    - DB_ENDPOINT: RDS database endpoint
    """
    bucket_name = os.environ.get('BUCKET_NAME')
    db_endpoint = os.environ.get('DB_ENDPOINT')

    print(f"Processing files from bucket: {bucket_name}")
    print(f"Database endpoint: {db_endpoint}")

    try:
        # List objects in bucket
        response = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=10)

        files = []
        if 'Contents' in response:
            files = [obj['Key'] for obj in response['Contents']]

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'File processing complete',
                'files_found': len(files),
                'files': files[:5]  # Return first 5 files
            })
        }
    except ClientError as e:
        print(f"Error processing files: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing files',
                'error': str(e)
            })
        }
