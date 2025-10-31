"""
Lambda handler for processing S3 object creation events.

This handler receives S3 events from EventBridge (not direct S3 notifications)
and processes the objects, storing metadata in DynamoDB.
"""

import json
import os
import uuid
from datetime import datetime
from decimal import Decimal

import boto3

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')


def lambda_handler(event, context):
    """
    Process S3 object creation events from EventBridge.
    
    EventBridge S3 events have a different structure than direct S3 notifications.
    The event structure is:
    {
        "version": "0",
        "id": "event-id",
        "detail-type": "Object Created",
        "source": "aws.s3",
        "account": "account-id",
        "time": "timestamp",
        "region": "region",
        "resources": ["arn:aws:s3:::bucket-name"],
        "detail": {
            "version": "0",
            "bucket": {
                "name": "bucket-name"
            },
            "object": {
                "key": "object-key",
                "size": 1234,
                "etag": "etag",
                "sequencer": "sequencer"
            },
            "request-id": "request-id",
            "requester": "requester",
            "source-ip-address": "ip",
            "reason": "PutObject"
        }
    }
    
    Args:
        event: EventBridge event containing S3 object details
        context: Lambda context
    
    Returns:
        Response dictionary with statusCode and body
    """
    try:
        table_name = os.environ['DYNAMODB_TABLE']
        environment = os.environ['ENVIRONMENT']
        
        table = dynamodb.Table(table_name)
        
        print(f"Processing event: {json.dumps(event)}")
        
        if event.get('source') == 'aws.s3' and event.get('detail-type') == 'Object Created':
            detail = event.get('detail', {})
            bucket_info = detail.get('bucket', {})
            object_info = detail.get('object', {})
            
            bucket = bucket_info.get('name')
            key = object_info.get('key')
            size = object_info.get('size', 0)
            
            item_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().isoformat()
            
            # Convert size to Decimal for DynamoDB (no float/double allowed)
            item = {
                'id': item_id,
                'timestamp': timestamp,
                'bucket': bucket,
                'key': key,
                'size': Decimal(str(size)),
                'environment': environment,
                'event_time': event.get('time'),
                'region': event.get('region')
            }
            
            table.put_item(Item=item)
            
            print(f"Processed S3 object {key} from bucket {bucket}")
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Processing complete',
                    'item_id': item_id
                })
            }
        else:
            print(f"Unexpected event type: {event.get('detail-type')}")
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Unexpected event type'
                })
            }
    
    except Exception as e:
        error_details = {
            'error': str(e),
            'error_type': type(e).__name__,
            'event': event
        }
        print(f"ERROR processing event: {json.dumps(error_details)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'error_type': type(e).__name__
            })
        }

