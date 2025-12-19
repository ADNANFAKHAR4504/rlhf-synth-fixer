import json
import os
import boto3
import uuid
from datetime import datetime

stepfunctions = boto3.client('stepfunctions')
sqs = boto3.client('sqs')

STATE_MACHINE_ARN = os.environ['STATE_MACHINE_ARN']
PROCESSING_QUEUE_URL = os.environ['PROCESSING_QUEUE_URL']

def handler(event, context):
    print(f"Received event: {json.dumps(event)}")

    try:
        # Process S3 event
        for record in event.get('Records', []):
            if 's3' in record:
                bucket = record['s3']['bucket']['name']
                key = record['s3']['object']['key']

                # Generate job ID
                job_id = str(uuid.uuid4())

                # Send message to SQS
                sqs.send_message(
                    QueueUrl=PROCESSING_QUEUE_URL,
                    MessageBody=json.dumps({
                        'jobId': job_id,
                        'bucket': bucket,
                        'key': key,
                        'timestamp': datetime.utcnow().isoformat()
                    })
                )

                # Start Step Functions execution
                execution_input = {
                    'jobId': job_id,
                    'bucket': bucket,
                    'key': key,
                    'timestamp': int(datetime.utcnow().timestamp())
                }

                response = stepfunctions.start_execution(
                    stateMachineArn=STATE_MACHINE_ARN,
                    name=job_id,
                    input=json.dumps(execution_input)
                )

                print(f"Started execution: {response['executionArn']}")

        return {
            'statusCode': 200,
            'body': json.dumps('Processing initiated')
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise
