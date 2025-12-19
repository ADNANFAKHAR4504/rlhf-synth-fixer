import json
import boto3
import os
import time
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
    Lambda function to validate ingested data.
    Implements proper error handling with exponential backoff.
    """
    try:
        # Extract job information from event
        body = json.loads(event.get('Payload', {}).get('body', '{}'))
        job_id = body.get('jobId')
        s3_key = body.get('s3Key')

        if not job_id or not s3_key:
            raise ValueError("Missing required parameters: jobId or s3Key")

        # Verify data exists in S3
        try:
            response = s3_client.head_object(
                Bucket=BUCKET_NAME,
                Key=s3_key
            )
            data_size = response['ContentLength']
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                raise ValueError(f"Data not found in S3: {s3_key}")
            raise

        # Verify metadata in DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        response = table.get_item(
            Key={
                'jobId': job_id,
                'timestamp': body.get('timestamp')
            }
        )

        if 'Item' not in response:
            raise ValueError(f"Metadata not found for jobId: {job_id}")

        # Validation passed
        timestamp = int(time.time())
        table.update_item(
            Key={
                'jobId': job_id,
                'timestamp': body.get('timestamp')
            },
            UpdateExpression='SET #status = :status, validatedAt = :time',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'VALIDATED',
                ':time': timestamp
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'jobId': job_id,
                's3Key': s3_key,
                'timestamp': timestamp,
                'status': 'VALIDATED',
                'dataSize': data_size
            })
        }

    except ClientError as e:
        error_message = f"AWS API Error in validate: {str(e)}"
        print(error_message)

        # Publish error to SNS
        try:
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Data Validation Failed',
                Message=error_message
            )
        except Exception as sns_error:
            print(f"Failed to publish SNS notification: {str(sns_error)}")

        raise

    except Exception as e:
        error_message = f"Unexpected error in validate: {str(e)}"
        print(error_message)
        raise
