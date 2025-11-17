"""Data processor Lambda function for IoT sensor data."""

import json
import boto3
import os
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
ssm = boto3.client('ssm')

PROCESSED_TABLE_NAME = os.environ['PROCESSED_TABLE_NAME']
ALERT_TOPIC_ARN = os.environ['ALERT_TOPIC_ARN']


@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    """
    Data processor Lambda function that transforms and enriches
    sensor data and stores it in the processed data table.
    """
    error_count = 0
    success_count = 0

    try:
        for record in event['Records']:
            try:
                # Parse SQS message
                body = json.loads(record['body'])

                device_id = body['device_id']
                timestamp = body['timestamp']
                sensor_data = body.get('sensor_data', {})

                # Transform and enrich data
                processed_data = {
                    'device_id': device_id,
                    'event_date': datetime.utcnow().strftime('%Y-%m-%d'),
                    'timestamp': timestamp,
                    'temperature': sensor_data.get('temperature'),
                    'humidity': sensor_data.get('humidity'),
                    'pressure': sensor_data.get('pressure'),
                    'processed_at': datetime.utcnow().isoformat(),
                    'status': 'processed'
                }

                # Add enrichment
                if processed_data['temperature']:
                    processed_data['temperature_celsius'] = processed_data['temperature']
                    processed_data['temperature_fahrenheit'] = (processed_data['temperature'] * 9/5) + 32

                # Store in processed data table
                table = dynamodb.Table(PROCESSED_TABLE_NAME)
                table.put_item(Item=processed_data)

                success_count += 1

            except Exception as e:
                error_count += 1
                print(f"Error processing record: {str(e)}")

        # Send alert if error threshold exceeded
        if error_count > 5:
            sns.publish(
                TopicArn=ALERT_TOPIC_ARN,
                Subject='IoT Processing Errors Exceeded Threshold',
                Message=f'Processing errors: {error_count}, Successes: {success_count}'
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': success_count,
                'errors': error_count
            })
        }

    except Exception as e:
        print(f"Critical error in processor: {str(e)}")
        sns.publish(
            TopicArn=ALERT_TOPIC_ARN,
            Subject='IoT Processor Critical Error',
            Message=f'Critical error: {str(e)}'
        )
        raise
