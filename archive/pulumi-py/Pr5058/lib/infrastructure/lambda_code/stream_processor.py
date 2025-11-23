"""
Stream Processor Lambda function.

Processes DynamoDB stream events and sends notifications.
"""

import json
import os
from typing import Any, Dict

import boto3
from botocore.config import Config

# Configure boto3 with retries
boto_config = Config(
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

# Initialize AWS clients
sns_client = boto3.client('sns', config=boto_config)

# Get environment variables
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for DynamoDB stream events.
    
    Processes stream records and sends notifications for changes.
    
    Args:
        event: DynamoDB stream event
        context: Lambda context
        
    Returns:
        Processing result
    """
    print(f"Received {len(event.get('Records', []))} stream records")
    
    processed = 0
    errors = 0
    
    # Process each stream record
    for record in event.get('Records', []):
        try:
            event_name = record.get('eventName')
            
            # Extract item data
            if event_name == 'INSERT':
                new_image = record['dynamodb'].get('NewImage', {})
                item_id = new_image.get('item_id', {}).get('S', 'unknown')
                status = new_image.get('status', {}).get('S', 'unknown')
                
                message = f"New item created: {item_id} with status: {status}"
                print(message)
                
                # Send notification
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="DynamoDB Stream: INSERT",
                    Message=message
                )
                
            elif event_name == 'MODIFY':
                old_image = record['dynamodb'].get('OldImage', {})
                new_image = record['dynamodb'].get('NewImage', {})
                item_id = new_image.get('item_id', {}).get('S', 'unknown')
                old_status = old_image.get('status', {}).get('S', 'unknown')
                new_status = new_image.get('status', {}).get('S', 'unknown')
                
                message = f"Item modified: {item_id} status changed from {old_status} to {new_status}"
                print(message)
                
                # Send notification
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="DynamoDB Stream: MODIFY",
                    Message=message
                )
                
            elif event_name == 'REMOVE':
                old_image = record['dynamodb'].get('OldImage', {})
                item_id = old_image.get('item_id', {}).get('S', 'unknown')
                
                message = f"Item removed: {item_id}"
                print(message)
                
                # Send notification
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="DynamoDB Stream: REMOVE",
                    Message=message
                )
            
            processed += 1
            
        except Exception as e:
            print(f"Error processing record: {str(e)}")
            errors += 1
            
            # Send error notification
            try:
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="Stream Processing Error",
                    Message=f"Error processing stream record: {str(e)}"
                )
            except Exception as sns_error:
                print(f"Error sending SNS notification: {str(sns_error)}")
    
    print(f"Processed {processed} records, {errors} errors")
    
    return {
        'statusCode': 200 if errors == 0 else 500,
        'processed': processed,
        'errors': errors
    }

