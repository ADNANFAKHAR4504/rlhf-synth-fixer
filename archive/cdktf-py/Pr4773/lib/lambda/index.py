"""Lambda function to process IoT sensor data from Kinesis stream."""

import json
import base64
import boto3
import os
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']


def lambda_handler(event, context):
    """
    Process sensor data from Kinesis stream.

    Args:
        event: Kinesis event with sensor data records
        context: Lambda context object

    Returns:
        dict: Processing result with success/failure counts
    """
    table = dynamodb.Table(DYNAMODB_TABLE)

    processed_count = 0
    failed_count = 0

    for record in event['Records']:
        try:
            # Decode Kinesis data
            payload = base64.b64decode(record['kinesis']['data'])
            sensor_data = json.loads(payload)

            # Extract sensor information
            device_id = sensor_data.get('device_id', 'unknown')
            timestamp = sensor_data.get('timestamp', int(datetime.now().timestamp()))
            temperature = sensor_data.get('temperature')
            vibration = sensor_data.get('vibration')
            pressure = sensor_data.get('pressure')

            # Store processed metrics in DynamoDB
            item = {
                'device_id': device_id,
                'timestamp': Decimal(str(timestamp)),
                'temperature': Decimal(str(temperature)) if temperature else None,
                'vibration': Decimal(str(vibration)) if vibration else None,
                'pressure': Decimal(str(pressure)) if pressure else None,
                'processed_at': Decimal(str(int(datetime.now().timestamp())))
            }

            # Remove None values
            item = {k: v for k, v in item.items() if v is not None}

            table.put_item(Item=item)

            # Archive raw data to S3
            s3_key = f"raw-data/{device_id}/{datetime.fromtimestamp(timestamp).strftime('%Y/%m/%d')}/{timestamp}.json"
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=json.dumps(sensor_data),
                ContentType='application/json'
            )

            processed_count += 1

            # Log anomaly detection (simple threshold-based)
            if temperature and float(temperature) > 100:
                print(f"ALERT: High temperature detected for device {device_id}: {temperature}°C")

            if vibration and float(vibration) > 50:
                print(f"ALERT: High vibration detected for device {device_id}: {vibration} Hz")

        except Exception as e:
            print(f"Error processing record: {str(e)}")
            print(f"Record data: {record}")
            failed_count += 1
            continue

    result = {
        'statusCode': 200,
        'body': json.dumps({
            'processed': processed_count,
            'failed': failed_count,
            'total': len(event['Records'])
        })
    }

    print(f"Processing complete: {processed_count} succeeded, {failed_count} failed")

    return result
