import json
import os
import boto3

s3_client = boto3.client('s3')

def handler(event, context):
    """
    Lambda function to process data from S3 buckets.
    This function is identical across all environments.
    """
    environment = os.environ.get('ENVIRONMENT', 'dev')
    bucket_name = os.environ.get('BUCKET_NAME')

    print(f"Processing in environment: {environment}")

    # Process S3 event if present
    if 'Records' in event:
        for record in event['Records']:
            if 's3' in record:
                bucket = record['s3']['bucket']['name']
                key = record['s3']['object']['key']

                print(f"Processing object: {key} from bucket: {bucket}")

                try:
                    # Get object from S3
                    response = s3_client.get_object(Bucket=bucket, Key=key)
                    content = response['Body'].read()

                    # Process the content (example: convert to uppercase)
                    processed_content = content.decode('utf-8').upper()

                    # Write processed content back
                    output_key = f"processed/{key}"
                    s3_client.put_object(
                        Bucket=bucket,
                        Key=output_key,
                        Body=processed_content
                    )

                    print(f"Successfully processed {key}")

                except Exception as e:
                    print(f"Error processing {key}: {str(e)}")
                    raise

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Processing complete',
            'environment': environment
        })
    }
