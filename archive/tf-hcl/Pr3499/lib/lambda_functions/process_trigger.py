import json
import os
import boto3
from datetime import datetime

sfn_client = boto3.client('stepfunctions')
STATE_MACHINE_ARN = os.environ['STATE_MACHINE_ARN']

def handler(event, context):
    """Trigger Step Functions execution for new receipt uploads"""

    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        size = record['s3']['object']['size']

        # Extract user ID from key (assumes format: uploads/{user_id}/{filename})
        path_parts = key.split('/')
        user_id = path_parts[1] if len(path_parts) > 1 else 'unknown'

        # Prepare input for Step Functions
        sfn_input = {
            'receiptId': f"{user_id}-{datetime.utcnow().isoformat()}",
            'userId': user_id,
            'bucket': bucket,
            'key': key,
            'size': size,
            'uploadTime': datetime.utcnow().isoformat()
        }

        # Start Step Functions execution
        response = sfn_client.start_execution(
            stateMachineArn=STATE_MACHINE_ARN,
            name=f"receipt-{user_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            input=json.dumps(sfn_input)
        )

        print(f"Started execution: {response['executionArn']}")

    return {
        'statusCode': 200,
        'body': json.dumps('Processing started')
    }