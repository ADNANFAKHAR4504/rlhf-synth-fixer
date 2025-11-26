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
    Lambda function to load processed data.
    Implements proper error handling with exponential backoff.
    """
    try:
        # Extract job information from event
        body = json.loads(event.get('Payload', {}).get('body', '{}'))
        job_id = body.get('jobId')
        transformed_key = body.get('transformedKey')

        if not job_id or not transformed_key:
            raise ValueError("Missing required parameters: jobId or transformedKey")

        # Get transformed data from S3
        response = s3_client.get_object(
            Bucket=BUCKET_NAME,
            Key=transformed_key
        )
        transformed_data = json.loads(response['Body'].read().decode('utf-8'))

        # Load data (example: update DynamoDB with final results)
        table = dynamodb.Table(TABLE_NAME)
        timestamp = int(time.time())

        table.update_item(
            Key={
                'jobId': job_id,
                'timestamp': body.get('timestamp')
            },
            UpdateExpression='SET #status = :status, loadedAt = :time, processedData = :data',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'LOADED',
                ':time': timestamp,
                ':data': json.dumps(transformed_data)
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'jobId': job_id,
                'timestamp': timestamp,
                'status': 'LOADED'
            })
        }

    except ClientError as e:
        error_message = f"AWS API Error in load: {str(e)}"
        print(error_message)

        # Publish error to SNS
        try:
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Data Loading Failed',
                Message=error_message
            )
        except Exception as sns_error:
            print(f"Failed to publish SNS notification: {str(sns_error)}")

        raise

    except Exception as e:
        error_message = f"Unexpected error in load: {str(e)}"
        print(error_message)
        raise
