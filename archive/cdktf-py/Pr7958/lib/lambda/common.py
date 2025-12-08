"""Common utilities for Lambda functions."""

import os
import json
import boto3
from datetime import datetime

# Environment variables
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'prod')
PRIMARY_REGION = os.environ.get('PRIMARY_REGION', 'us-east-1')
SECONDARY_REGION = os.environ.get('SECONDARY_REGION', 'us-east-2')
PRIMARY_ALB_ARN = os.environ.get('PRIMARY_ALB_ARN', '')
SECONDARY_ALB_ARN = os.environ.get('SECONDARY_ALB_ARN', '')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')

# AWS clients
primary_elb_client = boto3.client('elbv2', region_name=PRIMARY_REGION)
secondary_elb_client = boto3.client('elbv2', region_name=SECONDARY_REGION)
primary_rds_client = boto3.client('rds', region_name=PRIMARY_REGION)
secondary_rds_client = boto3.client('rds', region_name=SECONDARY_REGION)
route53_client = boto3.client('route53')
sns_client = boto3.client('sns')


def get_target_group_arn(alb_arn: str, region: str):
    """Get target group ARN from ALB."""
    elb_client = (primary_elb_client if region == PRIMARY_REGION
                  else secondary_elb_client)

    try:
        listeners = elb_client.describe_listeners(LoadBalancerArn=alb_arn)

        if listeners['Listeners']:
            default_actions = listeners['Listeners'][0]['DefaultActions']
            if default_actions and 'TargetGroupArn' in default_actions[0]:
                return default_actions[0]['TargetGroupArn']

        raise RuntimeError(f"No target group found for ALB: {alb_arn}")

    except (RuntimeError, ValueError, TypeError) as e:
        print(f"Error getting target group for region {region}: {str(e)}")
        raise


def send_sns_notification(subject: str, message: str):
    """Send SNS notification."""
    try:
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
    except (RuntimeError, ValueError, TypeError) as e:
        print(f"Error sending SNS notification: {str(e)}")


def get_current_timestamp():
    """Get current UTC timestamp."""
    return datetime.utcnow().isoformat()
