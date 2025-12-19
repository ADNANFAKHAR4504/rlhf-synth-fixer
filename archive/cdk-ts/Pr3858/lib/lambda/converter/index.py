import json
import os
import boto3
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

table = dynamodb.Table(os.environ['JOB_TABLE_NAME'])
OUTPUT_BUCKET = os.environ['OUTPUT_BUCKET']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def handler(event, context):
    print(f"Converting document: {json.dumps(event)}")

    try:
        bucket = event['bucket']
        key = event['key']
        job_id = event['jobId']

        # Download file from S3
        download_path = f'/tmp/{os.path.basename(key)}'
        s3.download_file(bucket, key, download_path)

        # Simulate conversion process
        # In production, this would use a library like python-docx, PyPDF2, etc.
        output_key = f"converted/{job_id}/{os.path.splitext(os.path.basename(key))[0]}.pdf"

        # For demonstration, just copy the file
        # In production, perform actual conversion here
        upload_path = f'/tmp/{job_id}.pdf'

        # Placeholder for conversion logic
        with open(download_path, 'rb') as input_file:
            content = input_file.read()
            with open(upload_path, 'wb') as output_file:
                # This is where actual conversion would happen
                output_file.write(b'%PDF-1.4 Mock PDF Content\n')
                output_file.write(content[:1000])  # Write sample content

        # Upload converted file
        s3.upload_file(upload_path, OUTPUT_BUCKET, output_key)

        # Update job status
        table.update_item(
            Key={'jobId': job_id, 'timestamp': event['timestamp']},
            UpdateExpression='SET #status = :status, outputKey = :outputKey, completedAt = :completedAt',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'COMPLETED',
                ':outputKey': output_key,
                ':completedAt': datetime.utcnow().isoformat()
            }
        )

        return {
            'jobId': job_id,
            'bucket': bucket,
            'key': key,
            'timestamp': event['timestamp'],
            'outputKey': output_key,
            'status': 'COMPLETED'
        }

    except Exception as e:
        print(f"Error converting document: {str(e)}")

        # Update job status to failed
        table.update_item(
            Key={'jobId': job_id, 'timestamp': event['timestamp']},
            UpdateExpression='SET #status = :status, errorMessage = :error',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'FAILED',
                ':error': str(e)
            }
        )

        raise
