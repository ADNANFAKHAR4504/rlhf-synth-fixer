import json
import os
import boto3

def handler(event, context):
    """
    Lambda function to process S3 objects
    """
    bucket_name = os.environ.get('BUCKET_NAME')
    kms_key_id = os.environ.get('KMS_KEY_ID')
    environment = os.environ.get('ENVIRONMENT')
    
    print(f"Processing S3 event for bucket: {bucket_name}")
    print(f"Environment: {environment}")
    
    # Process S3 event
    for record in event.get('Records', []):
        if record.get('eventSource') == 'aws:s3':
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            print(f"Processing object: {key} from bucket: {bucket}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'S3 object processed successfully',
            'environment': environment
        })
    }