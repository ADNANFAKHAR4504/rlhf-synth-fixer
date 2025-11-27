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
    Lambda function to transform data from S3.
    Implements proper error handling with exponential backoff.
    """
    try:
        # Extract job information from event
        body = json.loads(event.get('Payload', {}).get('body', '{}'))
        job_id = body.get('jobId')
        s3_key = body.get('s3Key')

        if not job_id or not s3_key:
            raise ValueError("Missing required parameters: jobId or s3Key")

        # Get data from S3
        response = s3_client.get_object(
            Bucket=BUCKET_NAME,
            Key=s3_key
        )
        raw_data = json.loads(response['Body'].read().decode('utf-8'))

        # Transform data (example transformation)
        transformed_data = {
            'jobId': job_id,
            'originalData': raw_data,
            'transformedAt': int(time.time()),
            'transformations': ['normalized', 'validated', 'enriched']
        }

        # Save transformed data to S3
        transformed_key = s3_key.replace('raw/', 'transformed/')
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=transformed_key,
            Body=json.dumps(transformed_data),
            ContentType='application/json'
        )

        # Update metadata in DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        timestamp = int(time.time())
        table.update_item(
            Key={
                'jobId': job_id,
                'timestamp': body.get('timestamp')
            },
            UpdateExpression='SET #status = :status, transformedKey = :key, transformedAt = :time',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'TRANSFORMED',
                ':key': transformed_key,
                ':time': timestamp
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'jobId': job_id,
                's3Key': s3_key,
                'transformedKey': transformed_key,
                'timestamp': timestamp,
                'status': 'TRANSFORMED'
            })
        }

    except ClientError as e:
        error_message = f"AWS API Error in transform: {str(e)}"
        print(error_message)

        # Publish error to SNS
        try:
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Data Transformation Failed',
                Message=error_message
            )
        except Exception as sns_error:
            print(f"Failed to publish SNS notification: {str(sns_error)}")

        raise

    except Exception as e:
        error_message = f"Unexpected error in transform: {str(e)}"
        print(error_message)
        raise
