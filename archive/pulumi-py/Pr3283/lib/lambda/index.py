import boto3
import os
import json
import time
from datetime import datetime, timedelta
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

logs_client = boto3.client('logs')
s3_client = boto3.client('s3')

def handler(event, context):
    """
    Lambda function to export CloudWatch Logs to S3
    """
    try:
        log_group_name = os.environ['LOG_GROUP_NAME']
        bucket_name = os.environ['S3_BUCKET_NAME']

        # Calculate time range (export last 24 hours of logs)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=1)

        # Convert to milliseconds since epoch
        start_timestamp = int(start_time.timestamp() * 1000)
        end_timestamp = int(end_time.timestamp() * 1000)

        # Create destination prefix with date
        destination_prefix = f"logs/{end_time.strftime('%Y/%m/%d')}/"

        # Create export task
        response = logs_client.create_export_task(
            logGroupName=log_group_name,
            fromTime=start_timestamp,
            to=end_timestamp,
            destination=bucket_name,
            destinationPrefix=destination_prefix
        )

        task_id = response.get('taskId')
        logger.info(f"Created export task: {task_id}")

        # Monitor export task status
        max_attempts = 30
        attempt = 0

        while attempt < max_attempts:
            task_status = logs_client.describe_export_tasks(taskId=task_id)
            status = task_status['exportTasks'][0]['status']['code']

            if status == 'COMPLETED':
                logger.info(f"Export task {task_id} completed successfully")
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Log export completed successfully',
                        'taskId': task_id,
                        'destination': f"{bucket_name}/{destination_prefix}"
                    })
                }
            elif status in ['CANCELLED', 'FAILED']:
                error_msg = f"Export task {task_id} failed with status: {status}"
                logger.error(error_msg)
                return {
                    'statusCode': 500,
                    'body': json.dumps({
                        'error': error_msg,
                        'taskId': task_id
                    })
                }

            attempt += 1
            time.sleep(10)  # Wait 10 seconds before checking again

        # Timeout reached
        logger.warning(f"Export task {task_id} timed out")
        return {
            'statusCode': 202,
            'body': json.dumps({
                'message': 'Export task still running',
                'taskId': task_id
            })
        }

    except Exception as e:
        logger.error(f"Error exporting logs: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }