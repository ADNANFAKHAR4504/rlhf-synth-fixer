import json
import boto3
import os
import uuid
import logging
from datetime import datetime
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')

# Environment variables
S3_BUCKET_NAME = os.environ['S3_BUCKET_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
REGION = os.environ['REGION']

def lambda_handler(event, context):
    """
    Main Lambda handler for processing async tasks.
    Saves results to S3 and publishes completion notifications to SNS.
    """
    try:
        # Generate unique task ID
        task_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        logger.info(f"Processing task {task_id}")

        # Process the task (placeholder logic)
        task_result = process_task(event, task_id)

        # Save results to S3
        s3_key = save_results_to_s3(task_result, task_id, timestamp)

        # Publish completion notification
        notification_result = publish_completion_notification(task_id, s3_key, task_result['status'])

        # Return success response
        response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Task processed successfully',
                'taskId': task_id,
                's3Key': s3_key,
                'notificationMessageId': notification_result['MessageId']
            })
        }

        logger.info(f"Task {task_id} completed successfully")
        return response

    except Exception as e:
        logger.error(f"Error processing task: {str(e)}")

        # Return error response
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Task processing failed',
                'message': str(e)
            })
        }

def process_task(event, task_id):
    """
    Process the async task (placeholder implementation).
    In production, this would contain your actual business logic.
    """
    logger.info(f"Processing business logic for task {task_id}")

    # Placeholder task processing
    task_data = event.get('taskData', {})

    # Simulate task processing
    result = {
        'taskId': task_id,
        'status': 'completed',
        'inputData': task_data,
        'processedAt': datetime.utcnow().isoformat(),
        'result': {
            'processedItems': len(task_data.get('items', [])),
            'summary': 'Task completed successfully'
        }
    }

    return result

def save_results_to_s3(task_result, task_id, timestamp):
    """
    Save task results to S3 bucket.
    """
    try:
        # Create S3 key with organized structure
        s3_key = f"task-results/{timestamp[:10]}/{task_id}/result.json"

        # Convert result to JSON
        result_json = json.dumps(task_result, indent=2)

        # Upload to S3
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=result_json,
            ContentType='application/json',
            ServerSideEncryption='AES256',
            Metadata={
                'taskId': task_id,
                'processedAt': timestamp,
                'status': task_result['status']
            }
        )

        logger.info(f"Results saved to S3: s3://{S3_BUCKET_NAME}/{s3_key}")
        return s3_key

    except ClientError as e:
        logger.error(f"Failed to save results to S3: {e}")
        raise

def publish_completion_notification(task_id, s3_key, status):
    """
    Publish task completion notification to SNS topic.
    """
    try:
        # Create notification message
        notification_message = {
            'taskId': task_id,
            'status': status,
            'completedAt': datetime.utcnow().isoformat(),
            's3Location': f"s3://{S3_BUCKET_NAME}/{s3_key}",
            'region': REGION
        }

        # Publish to SNS
        response = sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=json.dumps(notification_message, indent=2),
            Subject=f'Task Completion: {task_id}',
            MessageAttributes={
                'taskId': {
                    'DataType': 'String',
                    'StringValue': task_id
                },
                'status': {
                    'DataType': 'String',
                    'StringValue': status
                }
            }
        )

        logger.info(f"Notification published: {response['MessageId']}")
        return response

    except ClientError as e:
        logger.error(f"Failed to publish notification: {e}")
        raise