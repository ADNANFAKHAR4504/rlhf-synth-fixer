"""
Notification handler Lambda function
Handles error notifications and alerts
"""

import json
import boto3
from datetime import datetime
from typing import Dict, Any
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
sns = boto3.client('sns')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for processing notification events
    """
    try:
        logger.info(f"Processing notification: {json.dumps(event)}")

        # Extract event details
        detail = event.get('detail', {})
        detail_type = event.get('detail-type', '')
        error_type = detail.get('error_type', 'unknown')
        error_message = detail.get('error_message', '')

        # Determine severity and appropriate topic
        is_critical = detail_type == 'Critical Error' or error_type == 'critical'

        # Send notification (will be configured by infrastructure)
        send_sns_notification(
            topic_arn="",  # Will be configured by infrastructure
            subject=f"{'CRITICAL' if is_critical else 'INFO'}: {detail_type}",
            message=format_notification_message(detail, detail_type, error_message),
            is_critical=is_critical
        )

        logger.info(f"Successfully processed notification")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': True,
                'detail_type': detail_type,
                'is_critical': is_critical
            })
        }

    except Exception as e:
        logger.error(f"Error processing notification: {str(e)}", exc_info=True)
        raise


def format_notification_message(detail: Dict, detail_type: str, error_message: str) -> str:
    """
    Format notification message for SNS
    """
    message = {
        'timestamp': datetime.utcnow().isoformat(),
        'environment': 'dev',  # Will be configured by infrastructure
        'detail_type': detail_type,
        'error_message': error_message,
        'details': detail
    }

    return json.dumps(message, indent=2, default=str)


def send_sns_notification(topic_arn: str, subject: str, message: str, is_critical: bool) -> None:
    """
    Send notification to SNS topic
    """
    # This will be configured by the infrastructure layer
    # For now, just log the notification
    logger.info(f"Would send notification to {topic_arn} with subject: {subject}")

