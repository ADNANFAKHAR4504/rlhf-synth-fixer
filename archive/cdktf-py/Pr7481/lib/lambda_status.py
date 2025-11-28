import json
import boto3
import os

s3_client = boto3.client('s3')


def handler(event, context):
    bucket_name = os.environ.get('BUCKET_NAME', 'test-bucket')
    try:
        transaction_id = event['pathParameters']['transactionId']

        # Check if processed file exists
        try:
            response = s3_client.get_object(
                Bucket=bucket_name,
                Key=f"processed/{transaction_id}.json"
            )
            status_data = json.loads(response['Body'].read().decode('utf-8'))
            return {
                'statusCode': 200,
                'body': json.dumps(status_data)
            }
        except s3_client.exceptions.NoSuchKey:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'transactionId': transaction_id,
                    'status': 'pending'
                })
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
