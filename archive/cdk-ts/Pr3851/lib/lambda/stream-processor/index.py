import json
import base64
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sagemaker_runtime = boto3.client('sagemaker-runtime')

table_name = os.environ['TABLE_NAME']
endpoint_name = os.environ['ENDPOINT_NAME']

table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    processed_records = 0
    failed_records = 0

    for record in event['Records']:
        try:
            payload = base64.b64decode(record['kinesis']['data'])
            data = json.loads(payload)

            user_id = data.get('userId')
            interaction_type = data.get('interactionType', 'view')
            item_id = data.get('itemId')
            timestamp = data.get('timestamp', datetime.utcnow().isoformat())

            if not user_id or not item_id:
                failed_records += 1
                continue

            # Update user profile in DynamoDB
            response = table.update_item(
                Key={'userId': user_id},
                UpdateExpression='SET lastInteraction = :timestamp, interactionCount = if_not_exists(interactionCount, :zero) + :inc, lastItemId = :itemId',
                ExpressionAttributeValues={
                    ':timestamp': timestamp,
                    ':zero': 0,
                    ':inc': 1,
                    ':itemId': item_id
                },
                ReturnValues='UPDATED_NEW'
            )

            processed_records += 1

        except Exception as e:
            print(f"Error processing record: {str(e)}")
            failed_records += 1

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processedRecords': processed_records,
            'failedRecords': failed_records
        })
    }
