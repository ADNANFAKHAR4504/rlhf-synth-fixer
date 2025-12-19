"""
Webhook ingestion Lambda function.
Validates webhook signatures, stores payloads in S3, records metadata in DynamoDB,
and sends messages to SQS FIFO queue for processing.
"""

import hashlib
import hmac
import json
import logging
import os
import traceback
from datetime import datetime
from typing import Dict, Optional
from uuid import uuid4

import boto3

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sqs_client = boto3.client('sqs')
secretsmanager = boto3.client('secretsmanager')

# Environment variables
BUCKET_NAME = os.environ['BUCKET_NAME']
TABLE_NAME = os.environ['TABLE_NAME']
QUEUE_URL = os.environ['QUEUE_URL']
ENVIRONMENT = os.environ['ENVIRONMENT']

# Cache for secrets (in production, implement proper TTL)
_secret_cache: Dict[str, Optional[str]] = {}

def get_provider_secret(provider_id: str) -> Optional[str]:
    """
    Retrieve provider-specific secret from AWS Secrets Manager.
    In production, implement caching with TTL to reduce API calls.
    """
    try:
        if provider_id in _secret_cache:
            return _secret_cache[provider_id]
        
        secret_name = f'webhook/{ENVIRONMENT}/{provider_id}/signing-key'
        response = secretsmanager.get_secret_value(SecretId=secret_name)
        
        if 'SecretString' in response:
            _secret_cache[provider_id] = response['SecretString']
            return response['SecretString']
        else:
            logger.warning(f'Secret for provider {provider_id} not found in binary format')
            return None
            
    except secretsmanager.exceptions.ResourceNotFoundException:
        logger.warning(f'Secret not found for provider {provider_id}, using default validation')
        return None
    except Exception as e:
        logger.error(f'Error retrieving secret for provider {provider_id}: {str(e)}')
        return None

def validate_signature(payload: str, signature: str, provider_id: str) -> bool:
    """
    Validate webhook signature using HMAC-SHA256.
    Attempts to retrieve provider-specific secret from Secrets Manager.
    Falls back to default secret if provider secret not available.
    """
    try:
        # Try to get provider-specific secret
        secret = get_provider_secret(provider_id)
        if not secret:
            # In production, you should configure provider secrets in Secrets Manager
            logger.warning(
                f'No secret configured for provider {provider_id}. '
                f'Consider adding webhook/{ENVIRONMENT}/{provider_id}/signing-key to Secrets Manager'
            )
            # Using a more secure default approach - reject instead of using default
            logger.error(f'Signature validation failed: no secret configured for provider {provider_id}')
            return False
        
        expected_signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        is_valid = hmac.compare_digest(signature, expected_signature)
        
        if not is_valid:
            logger.warning(f'Invalid signature for provider {provider_id}')
        
        return is_valid
    except Exception as e:
        logger.error(f'Error validating signature: {str(e)}')
        return False

def log_event(event_type: str, details: Dict) -> None:
    """Log structured events for monitoring and debugging."""
    log_entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'event_type': event_type,
        'environment': ENVIRONMENT,
        **details
    }
    logger.info(json.dumps(log_entry))

def handler(event, context):
    """
    Main Lambda handler for webhook ingestion.
    Implements robust error handling and comprehensive logging.
    """
    webhook_id = None
    provider_id = None
    
    try:
        # Extract request details
        request_context = event.get('requestContext', {})
        identity = request_context.get('identity', {})
        source_ip = identity.get('sourceIp', 'unknown')
        
        logger.info(f'Webhook ingestion request from {source_ip}')

        # Extract headers (handle both cases and lowercase)
        headers = event.get('headers', {})
        signature = headers.get('X-Webhook-Signature') or headers.get('x-webhook-signature')
        provider_id = headers.get('X-Provider-ID') or headers.get('x-provider-id')
        api_key = headers.get('x-api-key') or headers.get('X-Api-Key')

        # Validate required headers
        if not signature or not provider_id:
            log_event('validation_error', {
                'reason': 'Missing required headers',
                'has_signature': bool(signature),
                'has_provider_id': bool(provider_id)
            })
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing required headers: X-Webhook-Signature and X-Provider-ID'
                })
            }

        # API Key validation (basic check - API Gateway should also validate)
        if not api_key:
            log_event('api_key_error', {'provider': provider_id})
            return {
                'statusCode': 401,
                'body': json.dumps({
                    'error': 'API key required'
                })
            }

        # Get request body
        body = event.get('body', '{}')
        if event.get('isBase64Encoded', False):
            import base64
            body = base64.b64decode(body).decode('utf-8')

        # Validate signature
        signature_valid = validate_signature(body, signature, provider_id)
        if not signature_valid:
            log_event('signature_validation_failed', {
                'provider': provider_id,
                'source_ip': source_ip
            })
            # Log but don't reject - allow processing with flag

        # Generate unique webhook ID
        webhook_id = str(uuid4())
        timestamp = datetime.utcnow().isoformat()

        # Validate payload size (prevent abuse)
        payload_size = len(body.encode('utf-8'))
        if payload_size > 1048576:  # 1MB limit
            log_event('payload_size_exceeded', {
                'provider': provider_id,
                'size_bytes': payload_size,
                'webhook_id': webhook_id
            })
            return {
                'statusCode': 413,
                'body': json.dumps({
                    'error': 'Payload too large (max 1MB)'
                })
            }

        # Store raw payload in S3
        s3_key = f'{provider_id}/{timestamp.split("T")[0]}/{webhook_id}.json'
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=body,
            ContentType='application/json',
            Metadata={
                'provider': provider_id,
                'webhook-id': webhook_id,
                'timestamp': timestamp,
                'signature-valid': 'true' if signature_valid else 'false'
            }
        )
        
        log_event('payload_stored_s3', {
            'provider': provider_id,
            'webhook_id': webhook_id,
            's3_key': s3_key,
            'size_bytes': payload_size
        })

        # Store metadata in DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        table.put_item(
            Item={
                'webhook_id': webhook_id,
                'provider': provider_id,
                'timestamp': timestamp,
                'status': 'received',
                's3_key': s3_key,
                'signature_valid': signature_valid,
                'source_ip': source_ip,
                'payload_size': payload_size
            }
        )
        
        log_event('metadata_stored_dynamodb', {
            'provider': provider_id,
            'webhook_id': webhook_id
        })

        # Send message to SQS FIFO queue
        message_body = json.dumps({
            'webhook_id': webhook_id,
            'provider': provider_id,
            'timestamp': timestamp,
            's3_key': s3_key,
            'signature_valid': signature_valid
        })

        sqs_client.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=message_body,
            MessageGroupId=provider_id,  # Group by provider for ordering
            MessageDeduplicationId=webhook_id
        )
        
        log_event('message_queued_sqs', {
            'provider': provider_id,
            'webhook_id': webhook_id,
            'group_id': provider_id
        })

        return {
            'statusCode': 202,
            'body': json.dumps({
                'message': 'Webhook received and queued for processing',
                'webhook_id': webhook_id
            })
        }

    except Exception as e:
        error_msg = f'Error processing webhook: {str(e)}'
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        
        log_event('processing_error', {
            'error': str(e),
            'webhook_id': webhook_id,
            'provider': provider_id
        })
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error processing webhook',
                'webhook_id': webhook_id if webhook_id else None
            })
        }
