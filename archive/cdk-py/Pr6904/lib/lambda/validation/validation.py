import json
import boto3
import os
from datetime import datetime

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

AUDIT_TABLE = os.environ['AUDIT_TABLE']
DOCUMENT_BUCKET = os.environ['DOCUMENT_BUCKET']

def handler(event, context):
    """Validate uploaded documents."""
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        document_key = body.get('document_key')

        if not document_key:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'document_key is required'})
            }

        # Validate document exists
        try:
            s3_client.head_object(Bucket=DOCUMENT_BUCKET, Key=document_key)
        except s3_client.exceptions.NoSuchKey:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Document not found'})
            }

        # Get document metadata
        response = s3_client.get_object(Bucket=DOCUMENT_BUCKET, Key=document_key)
        content_type = response['ContentType']
        content_length = response['ContentLength']

        # Validation rules
        allowed_types = ['application/pdf', 'application/msword', 'text/plain']
        max_size = 10 * 1024 * 1024  # 10 MB

        validation_result = {
            'valid': True,
            'errors': []
        }

        if content_type not in allowed_types:
            validation_result['valid'] = False
            validation_result['errors'].append(f'Invalid content type: {content_type}')

        if content_length > max_size:
            validation_result['valid'] = False
            validation_result['errors'].append(f'File too large: {content_length} bytes')

        # Log to audit table
        table = dynamodb.Table(AUDIT_TABLE)
        table.put_item(
            Item={
                'requestId': context.request_id,
                'timestamp': datetime.utcnow().isoformat(),
                'action': 'validate_document',
                'document_key': document_key,
                'result': 'success' if validation_result['valid'] else 'failure',
                'details': json.dumps(validation_result)
            }
        )

        return {
            'statusCode': 200 if validation_result['valid'] else 400,
            'body': json.dumps(validation_result)
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
