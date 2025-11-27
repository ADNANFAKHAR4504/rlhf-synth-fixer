import json
import boto3
import os
import time
from datetime import datetime
from botocore.config import Config
from botocore.exceptions import ClientError

# Configure boto3 with exponential backoff retry
config = Config(
    retries={
        'max_attempts': 10,
        'mode': 'adaptive'
    }
)

s3_client = boto3.client('s3', config=config)
dynamodb = boto3.resource('dynamodb', config=config)
sns_client = boto3.client('sns', config=config)

BUCKET_NAME = os.environ['BUCKET_NAME']
TABLE_NAME = os.environ['TABLE_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']


def handler(event, context):
    """
    Lambda function to ingest raw data into S3 and track metadata in DynamoDB.
    Implements proper error handling with exponential backoff.
    """
    try:
        # Extract data from event
        job_id = event.get('jobId', f"job-{int(time.time())}")
        data_content = event.get('data', '')

        # Create S3 key with timestamp
        timestamp = int(time.time())
        s3_key = f"raw/{datetime.now().strftime('%Y/%m/%d')}/{job_id}.json"

        # Upload data to S3 with retry logic
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=json.dumps(data_content),
            ContentType='application/json',
            Metadata={
                'jobId': job_id,
                'ingestedAt': str(timestamp)
            }
        )

        # Track metadata in DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        table.put_item(
            Item={
                'jobId': job_id,
                'timestamp': timestamp,
                'status': 'INGESTED',
                's3Key': s3_key,
                'ingestedAt': timestamp,
                'dataSize': len(json.dumps(data_content))
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'jobId': job_id,
                's3Key': s3_key,
                'timestamp': timestamp,
                'status': 'INGESTED'
            })
        }

    except ClientError as e:
        error_message = f"AWS API Error in ingest: {str(e)}"
        print(error_message)

        # Publish error to SNS
        try:
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Data Ingestion Failed',
                Message=error_message
            )
        except Exception as sns_error:
            print(f"Failed to publish SNS notification: {str(sns_error)}")

        raise

    except Exception as e:
        error_message = f"Unexpected error in ingest: {str(e)}"
        print(error_message)
        raise
