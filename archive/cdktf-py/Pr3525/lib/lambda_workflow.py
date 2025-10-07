"""Lambda function for workflow processing."""
import json
import os
import boto3
from datetime import datetime


def lambda_handler(event, context):
    """
    Lambda function to handle workflow processing for different form types.
    """
    try:
        action = event.get('action', 'process_general')
        data = event.get('data', {})

        if action == 'process_contact':
            return process_contact_form(data)
        if action == 'process_support':
            return process_support_form(data)
        if action == 'generate_presigned_url':
            return generate_presigned_url(data)
        return process_general_form(data)

    except Exception as e:
        print(f"Error in workflow: {str(e)}")
        raise


def process_contact_form(data):
    """Process contact form submissions."""
    print(f"Processing contact form: {json.dumps(data)}")

    # Add business logic for contact form processing
    return {
        'statusCode': 200,
        'action': 'process_contact',
        'processed': True,
        'priority': 'normal',
        'timestamp': datetime.now().isoformat()
    }


def process_support_form(data):
    """Process support form submissions."""
    print(f"Processing support form: {json.dumps(data)}")

    # Determine priority based on severity
    severity = data.get('severity', 'low')
    priority = 'high' if severity == 'high' else 'normal'

    return {
        'statusCode': 200,
        'action': 'process_support',
        'processed': True,
        'priority': priority,
        'timestamp': datetime.now().isoformat()
    }


def generate_presigned_url(data):
    """Generate presigned URL for file uploads."""
    s3 = boto3.client('s3', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

    bucket = data.get('bucket', os.environ.get('S3_BUCKET', 'default-bucket'))
    key = data.get('key', 'uploads/file')

    try:
        url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket,
                'Key': key
            },
            ExpiresIn=3600
        )

        return {
            'statusCode': 200,
            'action': 'generate_presigned_url',
            'presigned_url': url,
            'expires_in': 3600
        }
    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        return {
            'statusCode': 500,
            'action': 'generate_presigned_url',
            'error': str(e)
        }


def process_general_form(data):
    """Process general form submissions."""
    print(f"Processing general form: {json.dumps(data)}")

    return {
        'statusCode': 200,
        'action': 'general',
        'processed': True,
        'timestamp': datetime.now().isoformat()
    }


# For backwards compatibility
handler = lambda_handler