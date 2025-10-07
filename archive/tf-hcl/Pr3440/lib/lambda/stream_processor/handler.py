import json
import base64
import os
import boto3
from datetime import datetime, timedelta
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

USER_PROFILE_TABLE = os.environ['USER_PROFILE_TABLE']
INTERACTIONS_TABLE = os.environ['INTERACTIONS_TABLE']
TRAINING_BUCKET = os.environ['TRAINING_BUCKET']

user_profile_table = dynamodb.Table(USER_PROFILE_TABLE)
interactions_table = dynamodb.Table(INTERACTIONS_TABLE)

def lambda_handler(event, context):
    """Process Kinesis stream records and update DynamoDB"""
    
    success_count = 0
    error_count = 0
    
    for record in event['Records']:
        try:
            # Decode Kinesis data
            payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
            data = json.loads(payload)
            
            # Extract interaction data
            user_id = data.get('user_id')
            item_id = data.get('item_id')
            event_type = data.get('event_type', 'view')
            timestamp = int(datetime.now().timestamp())
            
            # Update user profile
            user_profile_table.update_item(
                Key={'user_id': user_id},
                UpdateExpression='SET last_activity = :timestamp, '
                                'interaction_count = if_not_exists(interaction_count, :zero) + :one',
                ExpressionAttributeValues={
                    ':timestamp': timestamp,
                    ':zero': 0,
                    ':one': 1
                }
            )
            
            # Store interaction
            interactions_table.put_item(
                Item={
                    'user_id': user_id,
                    'timestamp': timestamp,
                    'item_id': item_id,
                    'event_type': event_type,
                    'ttl': int((datetime.now() + timedelta(days=90)).timestamp())
                }
            )
            
            # Export to S3 for training
            s3_key = f"interactions/{datetime.now().strftime('%Y/%m/%d')}/{user_id}-{timestamp}.json"
            s3.put_object(
                Bucket=TRAINING_BUCKET,
                Key=s3_key,
                Body=json.dumps(data),
                ContentType='application/json'
            )
            
            success_count += 1
            
        except Exception as e:
            logger.error(f"Error processing record: {str(e)}")
            error_count += 1
    
    logger.info(f"Processed {success_count} records successfully, {error_count} errors")
    
    return {
        'statusCode': 200,
        'batchItemFailures': []
    }
