import json
import os
import boto3
import hashlib
import hmac
import base64
from datetime import datetime

# Optional X-Ray tracing
try:
    from aws_xray_sdk.core import xray_recorder
    from aws_xray_sdk.core import patch_all
    patch_all()
except ImportError:
    # X-Ray SDK not available, continue without tracing
    pass

# Initialize AWS clients
s3_client = boto3.client('s3')
lambda_client = boto3.client('lambda')
secrets_client = boto3.client('secretsmanager')

# Environment variables
PROVIDER_NAME = os.environ['PROVIDER_NAME']
PROVIDER_SECRET_ARN = os.environ['PROVIDER_SECRET_ARN']
S3_BUCKET = os.environ['S3_BUCKET']
PROCESSOR_FUNCTION_ARN = os.environ['PROCESSOR_FUNCTION_ARN']
ENVIRONMENT = os.environ['ENVIRONMENT']

# Cache webhook secret
webhook_secret = None


def get_webhook_secret():
    """Retrieve webhook signing secret from Secrets Manager (cached)"""
    global webhook_secret
    if webhook_secret is None:
        response = secrets_client.get_secret_value(SecretId=PROVIDER_SECRET_ARN)
        secret_data = json.loads(response['SecretString'])
        webhook_secret = secret_data['signing_secret']
    return webhook_secret


def verify_square_signature(payload_body, signature_header, webhook_url):
    """Verify Square webhook signature"""
    try:
        secret = get_webhook_secret()

        # Square signature format: combine webhook URL + body + secret
        string_to_sign = webhook_url + payload_body + secret

        # Compute HMAC-SHA256
        expected_signature = base64.b64encode(
            hmac.new(
                secret.encode('utf-8'),
                string_to_sign.encode('utf-8'),
                hashlib.sha256
            ).digest()
        ).decode('utf-8')

        # Compare signatures
        return hmac.compare_digest(expected_signature, signature_header)

    except Exception as e:
        print(f"Error verifying signature: {str(e)}")
        return False


@xray_recorder.capture('store_raw_payload')
def store_raw_payload(transaction_id, payload):
    """Store raw webhook payload to S3"""
    try:
        # Organize by provider/year/month/day
        now = datetime.utcnow()
        s3_key = f"{PROVIDER_NAME}/{now.year}/{now.month:02d}/{now.day:02d}/{transaction_id}.json"

        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=json.dumps(payload),
            ContentType='application/json',
            Metadata={
                'provider': PROVIDER_NAME,
                'transaction_id': transaction_id,
                'environment': ENVIRONMENT
            }
        )

        return s3_key

    except Exception as e:
        print(f"Error storing raw payload: {str(e)}")
        raise


@xray_recorder.capture('invoke_processor')
def invoke_processor(event_data):
    """Asynchronously invoke processor Lambda function"""
    try:
        lambda_client.invoke(
            FunctionName=PROCESSOR_FUNCTION_ARN,
            InvocationType='Event',  # Async invocation
            Payload=json.dumps(event_data)
        )
        print(f"Processor function invoked for transaction: {event_data.get('transaction_id')}")

    except Exception as e:
        print(f"Error invoking processor: {str(e)}")


def lambda_handler(event, context):
    """
    Square webhook validator Lambda handler

    Validates Square webhook signature and stores raw payload
    """
    try:
        # Add X-Ray annotations
        xray_recorder.put_annotation('provider', PROVIDER_NAME)
        xray_recorder.put_annotation('environment', ENVIRONMENT)

        # Parse request
        body = event.get('body', '{}')
        headers = event.get('headers', {})

        # Get Square signature header (case-insensitive)
        signature_header = None
        for key, value in headers.items():
            if key.lower() == 'x-square-signature':
                signature_header = value
                break

        if not signature_header:
            print("ERROR: Missing X-Square-Signature header")
            xray_recorder.put_annotation('validation_status', 'missing_signature')
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Missing signature header'})
            }

        # Get webhook URL from request context
        request_context = event.get('requestContext', {})
        domain_name = request_context.get('domainName', '')
        path = request_context.get('path', '')
        webhook_url = f"https://{domain_name}{path}"

        # Verify signature
        if not verify_square_signature(body, signature_header, webhook_url):
            print("ERROR: Invalid signature")
            xray_recorder.put_annotation('validation_status', 'invalid_signature')
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Invalid signature'})
            }

        # Parse webhook payload
        webhook_data = json.loads(body)

        # Extract transaction ID from Square event
        event_id = webhook_data.get('event_id', 'unknown')
        event_type = webhook_data.get('type', 'unknown')

        xray_recorder.put_annotation('transaction_id', event_id)
        xray_recorder.put_annotation('event_type', event_type)

        # Store raw payload to S3
        s3_key = store_raw_payload(event_id, webhook_data)

        # Prepare data for processor
        processor_event = {
            'provider': PROVIDER_NAME,
            'transaction_id': event_id,
            'event_type': event_type,
            'raw_payload_s3_key': s3_key,
            'raw_payload': webhook_data,
            'timestamp': datetime.utcnow().isoformat()
        }

        # Invoke processor asynchronously
        invoke_processor(processor_event)

        # Return 200 OK immediately to Square
        print(f"Webhook validated successfully: {event_id}")
        xray_recorder.put_annotation('validation_status', 'success')

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'received',
                'event_id': event_id
            })
        }

    except Exception as e:
        print(f"ERROR: Unexpected error: {str(e)}")
        xray_recorder.put_annotation('validation_status', 'error')
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
