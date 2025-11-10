"""
Dead Letter Queue Processor Lambda
Archives failed webhooks to S3 and logs failures
"""
import json
import logging
import os
import boto3
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')


def lambda_handler(event, context):
    """
    Process failed messages from DLQ and archive to S3
    """
    try:
        logger.info(f"DLQ processor event: {json.dumps(event)}")

        bucket_name = os.environ['BUCKET_NAME']

        for record in event['Records']:
            try:
                # Parse the failed message
                message_body = json.loads(record['body'])
                provider = message_body.get('provider', 'unknown')
                event_id = message_body.get('eventId', 'unknown')

                # Create S3 key with provider and date organization
                now = datetime.now()
                s3_key = f"{provider}/{now.year}/{now.month:02d}/{now.day:02d}/{event_id}.json"

                # Prepare failure metadata
                failure_data = {
                    'originalMessage': message_body,
                    'failureTime': now.isoformat(),
                    'receiveCount': record['attributes'].get('ApproximateReceiveCount', 'unknown'),
                    'messageId': record['messageId']
                }

                # Write to S3
                s3_client.put_object(
                    Bucket=bucket_name,
                    Key=s3_key,
                    Body=json.dumps(failure_data, indent=2),
                    ContentType='application/json'
                )

                logger.info(f"Archived failed webhook to S3: {s3_key}")

            except Exception as e:
                logger.error(f"Failed to process DLQ record: {str(e)}")
                # Continue processing other records
                continue

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'DLQ processing completed'})
        }

    except Exception as e:
        logger.error(f"Error in DLQ processor: {str(e)}")
        # Don't raise - we don't want failed DLQ processing to re-queue
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
