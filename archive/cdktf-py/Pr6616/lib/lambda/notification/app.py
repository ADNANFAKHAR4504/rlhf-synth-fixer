"""Lambda function for sending processing notifications to SNS."""

import json
import os
from typing import Dict, Any
from datetime import datetime
import boto3
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

sns_client = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')

SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
STATUS_TABLE = dynamodb.Table(os.environ['STATUS_TABLE'])


@xray_recorder.capture('get_processing_status')
def get_processing_status(request_id: str) -> Dict[str, Any]:
    """Retrieve processing status from DynamoDB."""
    try:
        response = STATUS_TABLE.query(
            KeyConditionExpression='transaction_id = :rid',
            ExpressionAttributeValues={
                ':rid': request_id
            },
            ScanIndexForward=False,  # Get latest first
            Limit=1
        )

        if response['Items']:
            return response['Items'][0]

        return None

    except Exception as e:
        print(f"Error retrieving status: {str(e)}")
        return None


@xray_recorder.capture('lambda_handler')
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for sending processing notifications.

    Retrieves processing status and sends notification to SNS topic
    for downstream consumers.
    """
    try:
        # Extract request information
        request_id = event.get('request_id')
        transformed_count = event.get('transformed_count', 0)

        if not request_id:
            raise ValueError("Missing required event parameter: request_id")

        # Get processing status
        status_info = get_processing_status(request_id)

        # Prepare notification message
        notification = {
            'request_id': request_id,
            'status': 'completed',
            'transformed_count': transformed_count,
            'timestamp': datetime.utcnow().isoformat(),
            'details': status_info if status_info else 'Status not available'
        }

        # Send notification to SNS
        response = sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=json.dumps(notification),
            Subject=f'Transaction Processing Complete - {request_id}',
            MessageAttributes={
                'request_id': {
                    'DataType': 'String',
                    'StringValue': request_id
                },
                'status': {
                    'DataType': 'String',
                    'StringValue': 'completed'
                }
            }
        )

        print(f"Notification sent successfully: {response['MessageId']}")

        return {
            'statusCode': 200,
            'status': 'success',
            'message_id': response['MessageId'],
            'request_id': request_id
        }

    except Exception as e:
        print(f"Error sending notification: {str(e)}")
        raise
