import json
import boto3
import os
import base64
from datetime import datetime
from typing import List, Dict, Any

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
sns = boto3.client('sns')
secretsmanager = boto3.client('secretsmanager')

# Environment variables
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', '')
ALERT_TOPIC_ARN = os.environ.get('ALERT_TOPIC_ARN', '')
PROCESSED_BUCKET = os.environ.get('PROCESSED_BUCKET', '')
API_SECRET_NAME = os.environ.get('API_SECRET_NAME', '')
AWS_REGION = os.environ.get('AWS_REGION', 'eu-central-1')

# Anomaly detection thresholds
TEMPERATURE_THRESHOLD = 100.0
PRESSURE_THRESHOLD = 150.0
VIBRATION_THRESHOLD = 5.0


def get_credentials():
    """Retrieve API credentials from existing Secrets Manager secret."""
    try:
        response = secretsmanager.get_secret_value(SecretId=API_SECRET_NAME)
        return json.loads(response['SecretString'])
    except Exception as e:
        print(f"Error retrieving credentials: {str(e)}")
        return {}


def detect_anomaly(sensor_data: Dict[str, Any]) -> bool:
    """Detect anomalies in sensor data."""
    try:
        sensor_type = sensor_data.get('sensor_type', '')
        value = float(sensor_data.get('value', 0))

        if sensor_type == 'temperature' and value > TEMPERATURE_THRESHOLD:
            return True
        elif sensor_type == 'pressure' and value > PRESSURE_THRESHOLD:
            return True
        elif sensor_type == 'vibration' and value > VIBRATION_THRESHOLD:
            return True

        return False
    except Exception as e:
        print(f"Error in anomaly detection: {str(e)}")
        return False


def send_alert(sensor_data: Dict[str, Any], anomaly_type: str):
    """Send alert notification via SNS."""
    try:
        message = {
            'timestamp': sensor_data.get('timestamp'),
            'sensor_id': sensor_data.get('sensor_id'),
            'sensor_type': sensor_data.get('sensor_type'),
            'value': sensor_data.get('value'),
            'anomaly_type': anomaly_type,
            'severity': 'HIGH'
        }

        sns.publish(
            TopicArn=ALERT_TOPIC_ARN,
            Subject=f'Anomaly Detected: {anomaly_type}',
            Message=json.dumps(message, indent=2)
        )
    except Exception as e:
        print(f"Error sending alert: {str(e)}")


def write_to_dynamodb(records: List[Dict[str, Any]]):
    """Write processed records to DynamoDB."""
    try:
        table = dynamodb.Table(DYNAMODB_TABLE)
        
        with table.batch_writer() as batch:
            for record in records:
                # Prepare DynamoDB item
                item = {
                    'sensor_id': str(record.get('sensor_id', 'unknown')),
                    'timestamp': str(record.get('timestamp', datetime.now().timestamp())),
                    'sensor_type': str(record.get('sensor_type', 'unknown')),
                    'production_line': str(record.get('production_line', 'unknown')),
                    'value': float(record.get('value', 0)),
                    'anomaly_detected': record.get('anomaly_detected', False),
                    'processed_at': datetime.now().isoformat()
                }
                
                batch.put_item(Item=item)

        print(f"Successfully wrote {len(records)} records to DynamoDB")
    except Exception as e:
        print(f"Error writing to DynamoDB: {str(e)}")
        raise


def store_processed_data(records: List[Dict[str, Any]]):
    """Store processed data in S3 for analytics."""
    try:
        timestamp = datetime.now()
        key = f"processed/{timestamp.year}/{timestamp.month:02d}/{timestamp.day:02d}/{timestamp.hour:02d}/{timestamp.timestamp()}.json"

        s3.put_object(
            Bucket=PROCESSED_BUCKET,
            Key=key,
            Body=json.dumps(records, indent=2),
            ContentType='application/json',
            ServerSideEncryption='aws:kms'
        )
        print(f"Stored processed data to s3://{PROCESSED_BUCKET}/{key}")
    except Exception as e:
        print(f"Error storing processed data: {str(e)}")


def handler(event, context):
    """Process IoT sensor data from Kinesis stream."""
    try:
        processed_records = []
        anomalies_detected = 0

        # Get credentials (cached for performance)
        credentials = get_credentials()

        for kinesis_record in event['Records']:
            try:
                # Decode Kinesis data
                payload = base64.b64decode(kinesis_record['kinesis']['data'])
                sensor_data = json.loads(payload)

                # Add processing metadata
                sensor_data['processed_at'] = datetime.now().isoformat()
                sensor_data['processing_version'] = '1.0'

                # Detect anomalies
                if detect_anomaly(sensor_data):
                    sensor_data['anomaly_detected'] = True
                    anomalies_detected += 1
                    send_alert(sensor_data, 'threshold_exceeded')
                else:
                    sensor_data['anomaly_detected'] = False

                processed_records.append(sensor_data)

            except Exception as e:
                print(f"Error processing record: {str(e)}")
                continue

        # Write to DynamoDB for fast queries
        if processed_records:
            write_to_dynamodb(processed_records)

        # Store processed data in S3
        if processed_records:
            store_processed_data(processed_records)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed_records': len(processed_records),
                'anomalies_detected': anomalies_detected
            })
        }

    except Exception as e:
        print(f"Error in handler: {str(e)}")
        raise
