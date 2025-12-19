import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['JOB_TABLE_NAME'])

def handler(event, context):
    print(f"Initializing job: {json.dumps(event)}")

    try:
        job_id = event['jobId']

        # Create job record in DynamoDB
        table.put_item(
            Item={
                'jobId': job_id,
                'timestamp': event['timestamp'],
                'status': 'INITIALIZED',
                'bucket': event['bucket'],
                'key': event['key'],
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat()
            }
        )

        # Pass through input to next state
        return {
            'jobId': job_id,
            'bucket': event['bucket'],
            'key': event['key'],
            'timestamp': event['timestamp'],
            'status': 'INITIALIZED'
        }

    except Exception as e:
        print(f"Error initializing job: {str(e)}")
        raise
