import json
import boto3
import os

s3_client = boto3.client('s3')


def handler(event, context):
    bucket_name = os.environ.get('BUCKET_NAME', 'test-bucket')
    try:
        transaction_id = event['pathParameters']['transactionId']

        # Get file from S3
        response = s3_client.get_object(
            Bucket=bucket_name,
            Key=f"uploads/{transaction_id}.json"
        )
        file_content = response['Body'].read().decode('utf-8')

        # Process transaction (simple example)
        transaction_data = json.loads(file_content)
        processed_data = {
            'transactionId': transaction_id,
            'status': 'processed',
            'data': transaction_data
        }

        # Save processed result
        s3_client.put_object(
            Bucket=bucket_name,
            Key=f"processed/{transaction_id}.json",
            Body=json.dumps(processed_data),
            ContentType='application/json'
        )

        return {
            'statusCode': 200,
            'body': json.dumps(processed_data)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
