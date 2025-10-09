import json
import boto3
import gzip
import base64
import os
from datetime import datetime

s3_client = boto3.client('s3')
logs_client = boto3.client('logs')

S3_BUCKET = os.environ['S3_BUCKET']
S3_PREFIX = os.environ['S3_PREFIX']
KMS_KEY_ID = os.environ['KMS_KEY_ID']

def handler(event, context):
    """
    Process CloudWatch Logs and archive to S3 with Object Lock
    """
    try:
        # Decode and decompress CloudWatch Logs data
        compressed_payload = base64.b64decode(event['awslogs']['data'])
        uncompressed_payload = gzip.decompress(compressed_payload)
        log_data = json.loads(uncompressed_payload)

        # Process each log event
        processed_events = []
        for log_event in log_data['logEvents']:
            try:
                # Try to parse as JSON
                message = json.loads(log_event['message'])
            except json.JSONDecodeError:
                # If not JSON, keep as string
                message = log_event['message']

            processed_event = {
                'timestamp': log_event['timestamp'],
                'message': message,
                'ingestionTime': log_event.get('ingestionTime'),
                'logGroup': log_data['logGroup'],
                'logStream': log_data['logStream']
            }
            processed_events.append(processed_event)

        # Generate S3 key based on timestamp
        timestamp = datetime.utcnow()
        s3_key = f"{S3_PREFIX}/{timestamp.year}/{timestamp.month:02d}/{timestamp.day:02d}/{timestamp.strftime('%Y%m%d-%H%M%S')}-{context.request_id}.json.gz"

        # Compress processed events
        compressed_data = gzip.compress(
            json.dumps(processed_events, indent=2).encode('utf-8')
        )

        # Upload to S3 with encryption
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=compressed_data,
            ServerSideEncryption='aws:kms',
            SSEKMSKeyId=KMS_KEY_ID,
            ContentType='application/json',
            ContentEncoding='gzip',
            Metadata={
                'log-group': log_data['logGroup'],
                'log-stream': log_data['logStream'],
                'event-count': str(len(processed_events))
            }
        )

        print(f"Successfully processed {len(processed_events)} events and stored to {s3_key}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed logs',
                'eventCount': len(processed_events),
                's3Key': s3_key
            })
        }

    except Exception as e:
        print(f"Error processing logs: {str(e)}")
        raise