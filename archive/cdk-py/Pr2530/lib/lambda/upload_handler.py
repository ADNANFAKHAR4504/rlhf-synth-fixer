import json
import boto3
import base64
import uuid
import os
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
secrets_client = boto3.client('secretsmanager')

# Environment variables
BUCKET_NAME = os.environ['BUCKET_NAME']
SECRETS_ARN = os.environ['SECRETS_ARN']
# AWS_REGION is automatically available as os.environ['AWS_REGION'] in Lambda


def lambda_handler(event, context):
    """
    Handle file upload requests with validation and security checks
    """
    try:
        logger.info(f"Processing upload request: {context.aws_request_id}")
        
        # Get configuration from Secrets Manager
        config = get_secrets()
        
        # Parse and validate request
        request_data = parse_request(event)
        
        # Validate file size and type
        validate_upload(request_data, config)
        
        # Upload file to S3
        upload_result = upload_to_s3(request_data, config)
        
        logger.info(f"Upload successful: {upload_result['key']}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'File uploaded successfully',
                'fileKey': upload_result['key'],
                'uploadId': upload_result['upload_id']
            })
        }
        
    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        return error_response(400, str(e))
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return error_response(500, "Internal server error")


def get_secrets():
    """Retrieve configuration from AWS Secrets Manager"""
    try:
        response = secrets_client.get_secret_value(SecretId=SECRETS_ARN)
        return json.loads(response['SecretString'])
    except Exception as e:
        logger.error(f"Failed to retrieve secrets: {str(e)}")
        raise


def parse_request(event):
    """Parse and extract request data"""
    try:
        # Handle different event formats (API Gateway vs direct invocation)
        if 'body' in event:
            if event.get('isBase64Encoded', False):
                body = base64.b64decode(event['body'])
            else:
                body = event['body']
        else:
            body = json.dumps(event)
        
        # Parse headers
        headers = event.get('headers', {})
        content_type = headers.get('Content-Type', headers.get('content-type', ''))
        content_length = int(headers.get('Content-Length', headers.get('content-length', '0')))
        
        return {
            'body': body,
            'content_type': content_type,
            'content_length': content_length,
            'request_id': event.get('requestContext', {}).get('requestId', str(uuid.uuid4()))
        }
    except Exception as e:
        raise ValueError(f"Invalid request format: {str(e)}")


def validate_upload(request_data, config):
    """Validate file size and MIME type"""
    max_size = int(config['max_file_size'])
    allowed_types = json.loads(config['allowed_mime_types'])
    
    # Check file size
    if request_data['content_length'] > max_size:
        raise ValueError(f"File size {request_data['content_length']} exceeds maximum allowed size of {max_size} bytes")
    
    # Check MIME type
    if request_data['content_type'] not in allowed_types:
        raise ValueError(f"File type {request_data['content_type']} not allowed. Allowed types: {allowed_types}")


def upload_to_s3(request_data, config):
    """Upload file to S3 with metadata"""
    upload_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    # Generate S3 key
    file_extension = get_file_extension(request_data['content_type'])
    s3_key = f"{config['upload_prefix']}{timestamp[:10]}/{upload_id}{file_extension}"
    
    try:
        # Upload to S3
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=request_data['body'],
            ContentType=request_data['content_type'],
            Metadata={
                'upload-id': upload_id,
                'upload-timestamp': timestamp,
                'request-id': request_data['request_id'],
                'original-size': str(request_data['content_length'])
            },
            ServerSideEncryption='AES256'
        )
        
        return {
            'key': s3_key,
            'upload_id': upload_id
        }
        
    except Exception as e:
        logger.error(f"S3 upload failed: {str(e)}")
        raise


def get_file_extension(content_type):
    """Get file extension from MIME type"""
    extensions = {
        'image/png': '.png',
        'image/jpg': '.jpg',
        'image/jpeg': '.jpg'
    }
    return extensions.get(content_type, '.bin')


def error_response(status_code, message):
    """Generate error response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'error': message,
            'timestamp': datetime.utcnow().isoformat()
        })
    }