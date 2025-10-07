"""Lambda function for form validation."""
import json
import os
import re
import uuid
import time
import boto3
from datetime import datetime


def lambda_handler(event, context):
    """
    Lambda function to validate form submissions.
    """
    # Get environment variables
    DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'form-submissions')
    S3_BUCKET = os.environ.get('S3_BUCKET', 'form-attachments')
    SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@example.com')

    # Initialize AWS clients
    dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
    s3 = boto3.client('s3', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

    # Parse the incoming request
    try:
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
    except (KeyError, json.JSONDecodeError) as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid request body'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }

    # Required fields validation
    required_fields = ['email', 'name', 'message']
    missing_fields = [field for field in required_fields if field not in body]
    if missing_fields:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': f'Missing required fields: {", ".join(missing_fields)}'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }

    # Email validation
    email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(email_pattern, body['email']):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid email format'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }

    # Message length validation
    if len(body['message']) > 5000:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Message too long (max 5000 characters)'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }

    # File size validation (if attachment present)
    attachment_url = None
    if 'attachment' in body:
        max_size = 10 * 1024 * 1024  # 10MB
        if body['attachment'].get('size', 0) > max_size:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'File size exceeds 10MB limit'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }

        # Generate presigned URL for file upload
        try:
            file_key = f"attachments/{uuid.uuid4()}/{body['attachment'].get('filename', 'file')}"
            attachment_url = s3.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': S3_BUCKET,
                    'Key': file_key,
                    'ContentType': body['attachment'].get('content_type', 'application/octet-stream')
                },
                ExpiresIn=3600  # 1 hour
            )
        except Exception as e:
            print(f"Error generating presigned URL: {str(e)}")

    # Generate unique submission ID
    submission_id = str(uuid.uuid4())
    timestamp = int(datetime.now().timestamp())

    # Store in DynamoDB
    try:
        table = dynamodb.Table(DYNAMODB_TABLE)
        item = {
            'submission_id': submission_id,
            'timestamp': timestamp,
            'email': body['email'],
            'name': body['name'],
            'message': body['message'],
            'form_type': body.get('form_type', 'general'),
            'status': 'pending',
            'created_at': datetime.now().isoformat()
        }

        if attachment_url:
            item['attachment_url'] = attachment_url

        table.put_item(Item=item)

        # Prepare response
        response_body = {
            'submission_id': submission_id,
            'status': 'received',
            'message': 'Form submission received successfully'
        }

        if attachment_url:
            response_body['upload_url'] = attachment_url

        return {
            'statusCode': 200,
            'body': json.dumps(response_body),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }

    except Exception as e:
        print(f"Error processing form submission: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }


# For backwards compatibility
handler = lambda_handler