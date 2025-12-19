"""
Lambda handler for processing campaign events from SQS queue.
This module contains the main handler function for processing marketing campaign events.
"""

import json
import os
from datetime import datetime
import traceback
import uuid

def handler(event, context):
    """
    Process campaign events from SQS queue and log to DynamoDB.

    Args:
        event: SQS event containing campaign messages
        context: Lambda context object

    Returns:
        dict: Processing results with success/failure counts
    """
    import boto3

    dynamodb = boto3.resource('dynamodb')
    table_name = os.environ['DYNAMODB_TABLE_NAME']
    table = dynamodb.Table(table_name)
    batch_results = {
        'successful': 0,
        'failed': 0,
        'records': []
    }

    for record in event.get('Records', []):
        try:
            # Parse SQS message
            message_body = json.loads(record['body'])
            message_id = record['messageId']

            # Process campaign event
            event_id = message_body.get('event_id', str(uuid.uuid4()))
            timestamp = datetime.utcnow().isoformat()

            # Validate required fields
            required_fields = ['campaign_id', 'user_id', 'action_type']
            for field in required_fields:
                if field not in message_body:
                    raise ValueError(f'Missing required field: {field}')

            # Simulate event processing logic
            processed_data = process_campaign_event(message_body)

            # Log successful processing to DynamoDB
            table.put_item(
                Item={
                    'event_id': event_id,
                    'timestamp': timestamp,
                    'status': 'SUCCESS',
                    'message_body': json.dumps(message_body),
                    'message_id': message_id,
                    'campaign_id': message_body.get('campaign_id'),
                    'user_id': message_body.get('user_id'),
                    'action_type': message_body.get('action_type'),
                    'processed_data': json.dumps(processed_data),
                    'processed_at': timestamp
                }
            )

            batch_results['successful'] += 1
            batch_results['records'].append({
                'event_id': event_id,
                'status': 'SUCCESS'
            })

            print(f"Successfully processed event {event_id} for campaign {message_body.get('campaign_id')}")

        except Exception as e:
            error_message = str(e)
            print(f"Error processing record: {error_message}")
            print(traceback.format_exc())

            # Log failed processing to DynamoDB
            try:
                failed_event_id = (
                    message_body.get('event_id', str(uuid.uuid4()))
                    if 'message_body' in locals() else str(uuid.uuid4())
                )
                table.put_item(
                    Item={
                        'event_id': failed_event_id,
                        'timestamp': datetime.utcnow().isoformat(),
                        'status': 'FAILED',
                        'message_body': record.get('body', ''),
                        'error_message': error_message,
                        'message_id': record.get('messageId', 'unknown'),
                        'retry_count': record.get('attributes', {}).get('ApproximateReceiveCount', 0)
                    }
                )
            except Exception as log_error:
                print(f"Failed to log error to DynamoDB: {str(log_error)}")

            batch_results['failed'] += 1
            batch_results['records'].append({
                'event_id': failed_event_id if 'failed_event_id' in locals() else 'unknown',
                'status': 'FAILED',
                'error': error_message
            })

            # Re-raise to trigger retry via DLQ
            raise

    print(f"Batch processing complete. Successful: {batch_results['successful']}, Failed: {batch_results['failed']}")
    return batch_results

def process_campaign_event(event_data):
    """
    Process individual campaign event.

    Args:
        event_data: Campaign event data from SQS message

    Returns:
        dict: Processed event data
    """
    # Simulate campaign event processing
    action_type = event_data.get('action_type', 'unknown')

    processing_result = {
        'action_type': action_type,
        'processed_timestamp': datetime.utcnow().isoformat()
    }

    if action_type == 'email_open':
        processing_result['engagement_score'] = 5
    elif action_type == 'link_click':
        processing_result['engagement_score'] = 10
    elif action_type == 'conversion':
        processing_result['engagement_score'] = 20
    else:
        processing_result['engagement_score'] = 1

    return processing_result
