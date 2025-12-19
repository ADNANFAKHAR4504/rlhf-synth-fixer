"""
SQS Consumer Lambda
Processes webhook events from SQS and writes to DynamoDB
"""
import json
import logging
import os
import boto3
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')


def lambda_handler(event, context):
    """
    Process messages from SQS and write to DynamoDB
    """
    try:
        logger.info(f"SQS consumer event: {json.dumps(event)}")

        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        successful = 0
        failed = 0

        for record in event['Records']:
            try:
                # Parse the message
                message_body = json.loads(record['body'])

                # Write to DynamoDB
                table.put_item(
                    Item={
                        'eventId': message_body['eventId'],
                        'timestamp': Decimal(str(message_body['timestamp'])),
                        'provider': message_body['provider'],
                        'type': message_body['type'],
                        'payload': message_body['payload'],
                        'processedAt': Decimal(str(int(record['attributes']['ApproximateFirstReceiveTimestamp']) / 1000))
                    }
                )
                successful += 1
                logger.info(f"Successfully processed event: {message_body['eventId']}")

            except Exception as e:
                failed += 1
                logger.error(f"Failed to process record: {str(e)}")
                # Re-raise to trigger retry mechanism
                raise

        logger.info(f"Processed {successful} messages successfully, {failed} failed")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'successful': successful,
                'failed': failed
            })
        }

    except Exception as e:
        logger.error(f"Error in SQS consumer: {str(e)}")
        raise
