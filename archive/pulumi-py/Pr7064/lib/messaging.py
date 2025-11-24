"""SQS and SNS Messaging Resources"""
import pulumi
import pulumi_aws as aws
from typing import Dict, Any

def create_messaging_resources(
    environment_suffix: str,
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """Create SQS queues and SNS topics"""

    # Create dead letter queue
    dlq = aws.sqs.Queue(
        f"payment-dlq-{environment_suffix}",
        name=f"payment-dlq-{environment_suffix}",
        message_retention_seconds=1209600,  # 14 days
        tags={**tags, "Name": f"payment-dlq-{environment_suffix}"}
    )

    # Create payment processing queue
    payment_queue = aws.sqs.Queue(
        f"payment-queue-{environment_suffix}",
        name=f"payment-queue-{environment_suffix}",
        visibility_timeout_seconds=300,
        message_retention_seconds=345600,  # 4 days
        receive_wait_time_seconds=20,
        redrive_policy=dlq.arn.apply(lambda arn: f'{{"deadLetterTargetArn":"{arn}","maxReceiveCount":3}}'),
        tags={**tags, "Name": f"payment-queue-{environment_suffix}"}
    )

    # Create SNS topic for alerts
    alert_topic = aws.sns.Topic(
        f"payment-alerts-{environment_suffix}",
        name=f"payment-alerts-{environment_suffix}",
        display_name="Payment Processing Alerts",
        tags={**tags, "Name": f"payment-alerts-{environment_suffix}"}
    )

    # Create SNS topic for payment notifications
    notification_topic = aws.sns.Topic(
        f"payment-notifications-{environment_suffix}",
        name=f"payment-notifications-{environment_suffix}",
        display_name="Payment Notifications",
        tags={**tags, "Name": f"payment-notifications-{environment_suffix}"}
    )

    return {
        "payment_queue": payment_queue,
        "dlq": dlq,
        "alert_topic": alert_topic,
        "notification_topic": notification_topic
    }
