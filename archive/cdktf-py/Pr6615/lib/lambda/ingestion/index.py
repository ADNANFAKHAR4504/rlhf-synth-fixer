"""Data ingestion Lambda function for IoT sensor data."""

import json
import boto3
import os
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
ssm = boto3.client('ssm')

RAW_TABLE_NAME = os.environ['RAW_TABLE_NAME']
QUEUE_URL = os.environ['QUEUE_URL']
API_KEY_PARAM = os.environ['API_KEY_PARAM']


@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    """
    Data ingestion Lambda function that receives raw sensor data
    and stores it in DynamoDB while sending to SQS for processing.
    """
    try:
        # Parse the incoming request
        body = json.loads(event.get('body', '{}'))

        device_id = body.get('device_id')
        sensor_data = body.get('sensor_data', {})

        if not device_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'device_id is required'})
            }

        timestamp = int(datetime.utcnow().timestamp() * 1000)

        # Store in DynamoDB
        table = dynamodb.Table(RAW_TABLE_NAME)
        item = {
            'device_id': device_id,
            'timestamp': timestamp,
            'sensor_data': sensor_data,
            'received_at': datetime.utcnow().isoformat()
        }

        table.put_item(Item=item)

        # Send to SQS for processing
        sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(item)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data ingested successfully',
                'device_id': device_id,
                'timestamp': timestamp
            })
        }

    except Exception as e:
        print(f"Error ingesting data: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
