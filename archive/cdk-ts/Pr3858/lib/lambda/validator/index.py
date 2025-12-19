import json
import os
import boto3

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['JOB_TABLE_NAME'])

VALID_EXTENSIONS = ['.doc', '.docx', '.txt', '.rtf']
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB

def handler(event, context):
    print(f"Validating document: {json.dumps(event)}")

    try:
        bucket = event['bucket']
        key = event['key']
        job_id = event['jobId']

        # Get object metadata
        response = s3.head_object(Bucket=bucket, Key=key)
        file_size = response['ContentLength']

        # Validate file extension
        valid_extension = any(key.lower().endswith(ext) for ext in VALID_EXTENSIONS)

        # Validate file size
        valid_size = file_size <= MAX_FILE_SIZE

        is_valid = valid_extension and valid_size

        # Update job status
        table.update_item(
            Key={'jobId': job_id, 'timestamp': event['timestamp']},
            UpdateExpression='SET #status = :status, fileSize = :size, validationResult = :result',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'VALIDATED' if is_valid else 'INVALID',
                ':size': file_size,
                ':result': 'valid' if is_valid else 'invalid'
            }
        )

        return {
            'jobId': job_id,
            'bucket': bucket,
            'key': key,
            'timestamp': event['timestamp'],
            'valid': is_valid,
            'fileSize': file_size
        }

    except Exception as e:
        print(f"Error validating document: {str(e)}")
        raise
