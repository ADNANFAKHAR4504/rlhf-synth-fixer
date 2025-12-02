"""
Webhook processing Lambda function.
Processes messages from SQS FIFO queue and publishes events to EventBridge.
Implements robust error handling and structured logging for production use.
"""

import json
import logging
import os
import traceback
from datetime import datetime
from typing import Dict, List

import boto3

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
events_client = boto3.client('events')
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Environment variables
EVENT_BUS_NAME = os.environ['EVENT_BUS_NAME']
ENVIRONMENT = os.environ['ENVIRONMENT']
BUCKET_NAME = os.environ.get('BUCKET_NAME', '')
TABLE_NAME = os.environ.get('TABLE_NAME', '')

def log_event(event_type: str, details: Dict) -> None:
    """Log structured events for monitoring and debugging."""
    log_entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'event_type': event_type,
        'environment': ENVIRONMENT,
        **details
    }
    logger.info(json.dumps(log_entry))

def process_webhook(message_body: Dict) -> Dict:
    """
    Process individual webhook message.
    In production, this would:
    - Retrieve payload from S3
    - Validate webhook content
    - Transform data
    - Update DynamoDB status
    """
    webhook_id = message_body.get('webhook_id')
    provider = message_body.get('provider')
    timestamp = message_body.get('timestamp')
    s3_key = message_body.get('s3_key')
    signature_valid = message_body.get('signature_valid', False)
    
    try:
        logger.info(f'Processing webhook {webhook_id} from provider {provider}')
        
        # Retrieve payload from S3 if available
        payload_content = None
        if BUCKET_NAME and s3_key:
            try:
                response = s3_client.get_object(Bucket=BUCKET_NAME, Key=s3_key)
                payload_content = response['Body'].read().decode('utf-8')
                logger.info(f'Retrieved payload from S3: {s3_key}')
            except Exception as e:
                logger.warning(f'Could not retrieve payload from S3: {str(e)}')
        
        # Update status in DynamoDB if available
        if TABLE_NAME:
            try:
                table = dynamodb.Table(TABLE_NAME)
                table.update_item(
                    Key={'webhook_id': webhook_id},
                    UpdateExpression='SET #status = :status, processed_at = :timestamp',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':status': 'processing',
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                )
                logger.info(f'Updated webhook status to processing: {webhook_id}')
            except Exception as e:
                logger.warning(f'Could not update DynamoDB status: {str(e)}')
        
        # Build event detail
        event_detail = {
            'webhook_id': webhook_id,
            'provider': provider,
            'timestamp': timestamp,
            's3_key': s3_key,
            'processed_at': datetime.utcnow().isoformat(),
            'status': 'processed',
            'signature_valid': signature_valid,
            'payload_summary': {
                'has_content': payload_content is not None,
                'size_bytes': len(payload_content.encode('utf-8')) if payload_content else 0
            }
        }
        
        return event_detail
        
    except Exception as e:
        logger.error(f'Error processing webhook {webhook_id}: {str(e)}')
        logger.error(traceback.format_exc())
        raise

def handler(event, context):
    """
    Main Lambda handler for processing webhooks from SQS.
    Implements comprehensive error handling and structured logging.
    """
    if 'Records' not in event or not event['Records']:
        log_event('invalid_event', {'reason': 'No records in event'})
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'No records to process'})
        }
    
    records = event['Records']
    successful_count = 0
    failed_count = 0
    failed_ids: List[str] = []
    
    try:
        log_event('batch_processing_started', {
            'record_count': len(records),
            'request_id': context.aws_request_id if context else 'unknown'
        })

        for idx, record in enumerate(records):
            webhook_id = None
            provider = None
            
            try:
                # Parse message body
                message_body = json.loads(record['body'])
                webhook_id = message_body.get('webhook_id')
                provider = message_body.get('provider')
                
                log_event('processing_message', {
                    'record_index': idx,
                    'webhook_id': webhook_id,
                    'provider': provider
                })

                # Process webhook
                event_detail = process_webhook(message_body)

                # Publish event to EventBridge
                response = events_client.put_events(
                    Entries=[
                        {
                            'Source': 'webhook.processor',
                            'DetailType': 'Webhook Processed',
                            'Detail': json.dumps(event_detail),
                            'EventBusName': EVENT_BUS_NAME
                        }
                    ]
                )
                
                if response['FailedEntryCount'] > 0:
                    logger.error(f'Failed to publish event for webhook {webhook_id}')
                    failed_count += 1
                    failed_ids.append(webhook_id)
                else:
                    log_event('event_published_eventbridge', {
                        'webhook_id': webhook_id,
                        'provider': provider
                    })
                    successful_count += 1

            except json.JSONDecodeError as e:
                logger.error(f'Invalid JSON in message body at index {idx}: {str(e)}')
                failed_count += 1
                failed_ids.append(webhook_id or f'unknown_{idx}')
            except Exception as e:
                logger.error(f'Error processing message at index {idx}: {str(e)}')
                logger.error(traceback.format_exc())
                failed_count += 1
                failed_ids.append(webhook_id or f'unknown_{idx}')
                # Don't re-raise immediately - process remaining messages

        # Log batch completion
        log_event('batch_processing_completed', {
            'total_records': len(records),
            'successful': successful_count,
            'failed': failed_count,
            'failed_ids': failed_ids
        })

        # Return summary
        return {
            'statusCode': 200 if failed_count == 0 else 206,  # 206 = Partial Content
            'body': json.dumps({
                'message': f'Processed {successful_count}/{len(records)} webhooks',
                'successful': successful_count,
                'failed': failed_count,
                'failed_ids': failed_ids
            })
        }

    except Exception as e:
        error_msg = f'Error in batch processing: {str(e)}'
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        
        log_event('batch_processing_error', {
            'error': str(e),
            'request_id': context.aws_request_id if context else 'unknown'
        })
        
        # Trigger SQS retry mechanism for transient failures
        raise
