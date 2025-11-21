import json
import boto3
import os

s3_client = boto3.client('s3')
kms_client = boto3.client('kms')

DOCUMENT_BUCKET = os.environ['DOCUMENT_BUCKET']
KMS_KEY_ID = os.environ['KMS_KEY_ID']

def handler(event, context):
    """Encrypt documents using KMS."""
    try:
        body = json.loads(event.get('body', '{}'))
        source_key = body.get('source_key')

        if not source_key:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'source_key is required'})
            }

        # Generate destination key
        dest_key = f"encrypted/{source_key}"

        # Copy object with KMS encryption
        s3_client.copy_object(
            Bucket=DOCUMENT_BUCKET,
            CopySource={'Bucket': DOCUMENT_BUCKET, 'Key': source_key},
            Key=dest_key,
            ServerSideEncryption='aws:kms',
            SSEKMSKeyId=KMS_KEY_ID,
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Document encrypted successfully',
                'encrypted_key': dest_key
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
