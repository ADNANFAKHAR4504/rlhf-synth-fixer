import json
import boto3
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
  """
  Lambda function triggered by S3 object creation events.
  Processes the S3 event and logs information about the uploaded object.
  """
  try:
    # Parse S3 event
    for record in event['Records']:
      bucket_name = record['s3']['bucket']['name']
      object_key = record['s3']['object']['key']
      event_name = record['eventName']

      logger.info(f"Event: {event_name}")
      logger.info(f"Bucket: {bucket_name}")
      logger.info(f"Object: {object_key}")

      # Example processing - you can add your business logic here
      s3_client = boto3.client('s3')

      # Get object metadata
      response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
      object_size = response['ContentLength']

      logger.info(f"Object size: {object_size} bytes")

    return {
      'statusCode': 200,
      'body': json.dumps({
        'message': 'Successfully processed S3 event',
        'processed_objects': len(event['Records'])
      })
    }

  except Exception as e:
    logger.error(f"Error processing S3 event: {str(e)}")
    raise e