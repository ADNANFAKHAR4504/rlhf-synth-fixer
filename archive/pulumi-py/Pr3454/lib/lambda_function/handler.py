"""
handler.py

Lambda function for IoT anomaly detection using SageMaker.
"""

import json
import os
import boto3
import time
from datetime import datetime
from decimal import Decimal


# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
sns = boto3.client('sns')
sagemaker = boto3.client('sagemaker-runtime')

# Environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
SAGEMAKER_ENDPOINT = os.environ.get('SAGEMAKER_ENDPOINT')

# Get DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)


def lambda_handler(event, context):
    """
    Process IoT sensor data for anomaly detection.
    """
    try:
        # Process each record
        for record in event.get('Records', [event]):
            # Extract sensor data
            if 'kinesis' in record:
                # From Kinesis
                payload = json.loads(
                    boto3.client('kinesis').get_records(
                        ShardIterator=record['kinesis']['sequenceNumber']
                    )['Records'][0]['Data']
                )
            else:
                # Direct from IoT Rule
                payload = record

            # Extract sensor metrics
            device_id = payload.get('device_id', 'unknown')
            timestamp = payload.get('timestamp', int(time.time() * 1000))
            temperature = payload.get('temperature', 0)
            vibration = payload.get('vibration', 0)
            pressure = payload.get('pressure', 0)
            humidity = payload.get('humidity', 0)

            # Prepare data for anomaly detection
            sensor_data = {
                'temperature': temperature,
                'vibration': vibration,
                'pressure': pressure,
                'humidity': humidity
            }

            # Call SageMaker endpoint for anomaly detection (if configured)
            is_anomaly = False
            anomaly_score = 0.0

            if SAGEMAKER_ENDPOINT:
                try:
                    response = sagemaker.invoke_endpoint(
                        EndpointName=SAGEMAKER_ENDPOINT,
                        ContentType='application/json',
                        Body=json.dumps(sensor_data)
                    )
                    result = json.loads(response['Body'].read())
                    is_anomaly = result.get('is_anomaly', False)
                    anomaly_score = result.get('anomaly_score', 0.0)
                except Exception as e:
                    print(f"SageMaker inference error: {str(e)}")
                    # Fallback to rule-based detection
                    is_anomaly = temperature > 100 or vibration > 50
                    anomaly_score = 1.0 if is_anomaly else 0.0
            else:
                # Rule-based anomaly detection
                is_anomaly = temperature > 100 or vibration > 50
                anomaly_score = 1.0 if is_anomaly else 0.0

            # Store in DynamoDB
            date_str = datetime.fromtimestamp(timestamp / 1000).strftime('%Y-%m-%d')

            item = {
                'device_id': device_id,
                'timestamp': timestamp,
                'date': date_str,
                'temperature': Decimal(str(temperature)),
                'vibration': Decimal(str(vibration)),
                'pressure': Decimal(str(pressure)),
                'humidity': Decimal(str(humidity)),
                'is_anomaly': is_anomaly,
                'anomaly_score': Decimal(str(anomaly_score)),
                'processed_at': int(time.time() * 1000)
            }

            table.put_item(Item=item)

            # Store raw data in S3 (partitioned by device and date)
            s3_key = f"raw-data/device_id={device_id}/year={date_str[:4]}/month={date_str[5:7]}/day={date_str[8:10]}/{timestamp}.json"
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=json.dumps(payload),
                ContentType='application/json'
            )

            # Send SNS alert if anomaly detected
            if is_anomaly:
                sns_topic_arn = f"arn:aws:sns:us-west-1:{boto3.client('sts').get_caller_identity()['Account']}:AnomalyAlerts-{ENVIRONMENT}"
                message = {
                    'device_id': device_id,
                    'timestamp': timestamp,
                    'anomaly_score': float(anomaly_score),
                    'metrics': sensor_data,
                    'alert_time': datetime.utcnow().isoformat()
                }

                sns.publish(
                    TopicArn=sns_topic_arn,
                    Message=json.dumps(message),
                    Subject=f"Anomaly Detected: Device {device_id}"
                )

                print(f"Anomaly detected for device {device_id} with score {anomaly_score}")

        return {
            'statusCode': 200,
            'body': json.dumps('Successfully processed sensor data')
        }

    except Exception as e:
        print(f"Error processing sensor data: {str(e)}")
        raise e