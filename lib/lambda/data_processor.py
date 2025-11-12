import json
import boto3
import os

s3_client = boto3.client('s3')
kms_client = boto3.client('kms')

def handler(event, context):
    """
    Process data from S3 bucket with encryption
    """
    bucket_name = os.environ['BUCKET_NAME']
    kms_key_id = os.environ['KMS_KEY_ID']

    try:
        # Example: List objects in bucket
        response = s3_client.list_objects_v2(Bucket=bucket_name)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processing completed',
                'objects': response.get('Contents', [])
            })
        }
    except Exception as e:
        print(f"Error processing data: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
