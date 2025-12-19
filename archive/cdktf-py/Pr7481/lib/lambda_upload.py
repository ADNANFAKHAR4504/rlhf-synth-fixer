import json
import boto3
import os
from datetime import datetime

s3_client = boto3.client('s3')


def handler(event, context):
    bucket_name = os.environ.get('BUCKET_NAME', 'test-bucket')
    try:
        body = json.loads(event.get('body', '{}'))
        transaction_id = body.get('transactionId', f"txn-{datetime.now().timestamp()}")
        file_content = body.get('fileContent', '')

        # Upload to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=f"uploads/{transaction_id}.json",
            Body=file_content,
            ContentType='application/json'
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'File uploaded successfully',
                'transactionId': transaction_id
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
