import json
import boto3
import os
from datetime import datetime

# Initialize clients as None - will be created in handler or get_clients
dynamodb = None
s3 = None

def get_clients():
    """Initialize AWS clients."""
    global dynamodb, s3
    region = os.environ.get('AWS_REGION', 'us-east-1')
    if dynamodb is None:
        dynamodb = boto3.resource('dynamodb', region_name=region)
    if s3 is None:
        s3 = boto3.client('s3', region_name=region)
    return dynamodb, s3

MODERATION_TABLE = os.environ['MODERATION_TABLE']
CONTENT_BUCKET = os.environ['CONTENT_BUCKET']

def handler(event, context):
    """Process and finalize moderation results."""
    global dynamodb, s3
    dynamodb, s3 = get_clients()

    try:
        moderation_result = event.get('moderationResult', {})
        content_id = moderation_result.get('contentId')

        # Update DynamoDB with final status
        table = dynamodb.Table(MODERATION_TABLE)

        # Get current item
        response = table.get_item(
            Key={
                'contentId': content_id,
                'timestamp': moderation_result.get('timestamp')
            }
        )

        if 'Item' in response:
            # Update with final processing status
            table.update_item(
                Key={
                    'contentId': content_id,
                    'timestamp': moderation_result.get('timestamp')
                },
                UpdateExpression='SET processingStatus = :status, completedAt = :completed',
                ExpressionAttributeValues={
                    ':status': 'completed',
                    ':completed': datetime.utcnow().isoformat()
                }
            )

        # Move content to processed folder if approved
        if moderation_result.get('reviewStatus') == 'approved':
            s3_location = moderation_result.get('s3Location', '')
            if s3_location:
                # Parse S3 location
                parts = s3_location.replace('s3://', '').split('/', 1)
                if len(parts) == 2:
                    source_bucket = parts[0]
                    source_key = parts[1]
                    dest_key = f"processed/{source_key}"

                    # Copy to processed folder
                    s3.copy_object(
                        Bucket=CONTENT_BUCKET,
                        CopySource={'Bucket': source_bucket, 'Key': source_key},
                        Key=dest_key
                    )

        return {
            'statusCode': 200,
            'message': 'Result processed successfully',
            'contentId': content_id
        }

    except Exception as e:
        print(f"Error processing result: {str(e)}")
        raise