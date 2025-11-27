"""Rollback Lambda function for failed migration scenarios."""

import json
import os
import boto3
from typing import Dict, Any
from botocore.exceptions import ClientError


def update_route53_weights(
    hosted_zone_id: str,
    domain_name: str,
    old_weight: int,
    new_weight: int
) -> Dict[str, Any]:
    """Update Route53 weighted routing policy to rollback traffic.

    Args:
        hosted_zone_id: Route53 hosted zone ID
        domain_name: Domain name for the records
        old_weight: Weight for old system (on-prem)
        new_weight: Weight for new system (AWS)

    Returns:
        Dictionary with update results
    """
    route53 = boto3.client('route53')

    try:
        # Update old system weight to 100%
        response_old = route53.change_resource_record_sets(
            HostedZoneId=hosted_zone_id,
            ChangeBatch={
                'Comment': 'Rollback traffic to old system',
                'Changes': [
                    {
                        'Action': 'UPSERT',
                        'ResourceRecordSet': {
                            'Name': domain_name,
                            'Type': 'A',
                            'SetIdentifier': 'old-system',
                            'Weight': old_weight,
                            'AliasTarget': {
                                'HostedZoneId': 'Z1234567890ABC',  # Replace with actual
                                'DNSName': 'old-system.example.com',  # Replace with actual
                                'EvaluateTargetHealth': True
                            }
                        }
                    }
                ]
            }
        )

        # Update new system weight to 0%
        response_new = route53.change_resource_record_sets(
            HostedZoneId=hosted_zone_id,
            ChangeBatch={
                'Comment': 'Rollback traffic from new system',
                'Changes': [
                    {
                        'Action': 'UPSERT',
                        'ResourceRecordSet': {
                            'Name': domain_name,
                            'Type': 'A',
                            'SetIdentifier': 'new-system',
                            'Weight': new_weight,
                            'AliasTarget': {
                                'HostedZoneId': os.environ.get('ALB_ZONE_ID', 'Z2O1EMRO9K5GLX'),
                                'DNSName': os.environ.get('ALB_DNS_NAME', 'alb.example.com'),
                                'EvaluateTargetHealth': True
                            }
                        }
                    }
                ]
            }
        )

        return {
            'success': True,
            'old_system_change_id': response_old['ChangeInfo']['Id'],
            'new_system_change_id': response_new['ChangeInfo']['Id']
        }

    except ClientError as e:
        print(f"Error updating Route53: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def stop_dms_replication(task_arn: str) -> Dict[str, Any]:
    """Stop DMS replication task.

    Args:
        task_arn: ARN of the DMS replication task

    Returns:
        Dictionary with stop results
    """
    dms = boto3.client('dms')

    try:
        response = dms.stop_replication_task(
            ReplicationTaskArn=task_arn
        )

        return {
            'success': True,
            'status': response['ReplicationTask']['Status'],
            'task_arn': task_arn
        }

    except ClientError as e:
        print(f"Error stopping DMS task: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def publish_rollback_metrics(rollback_reason: str, environment: str) -> None:
    """Publish rollback metrics to CloudWatch.

    Args:
        rollback_reason: Reason for rollback
        environment: Environment suffix
    """
    cloudwatch = boto3.client('cloudwatch')

    try:
        cloudwatch.put_metric_data(
            Namespace='PaymentMigration',
            MetricData=[
                {
                    'MetricName': 'RollbackInitiated',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': environment
                        },
                        {
                            'Name': 'Reason',
                            'Value': rollback_reason
                        }
                    ]
                }
            ]
        )
    except ClientError as e:
        print(f"Error publishing metrics: {e}")


def send_notification(topic_arn: str, message: str, subject: str) -> None:
    """Send SNS notification about rollback.

    Args:
        topic_arn: SNS topic ARN
        message: Notification message
        subject: Notification subject
    """
    sns = boto3.client('sns')

    try:
        sns.publish(
            TopicArn=topic_arn,
            Message=message,
            Subject=subject
        )
    except ClientError as e:
        print(f"Error sending notification: {e}")


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler for migration rollback.

    Args:
        event: Lambda event object containing:
            - rollback_reason: Reason for rollback
            - hosted_zone_id: Route53 hosted zone ID
            - domain_name: Domain name
            - dms_task_arn: DMS task ARN (optional)
        context: Lambda context object

    Returns:
        Dictionary with rollback results
    """
    print(f"Rollback initiated: {json.dumps(event)}")

    # Get parameters from event
    rollback_reason = event.get('rollback_reason', 'Manual rollback')
    hosted_zone_id = event.get('hosted_zone_id')
    domain_name = event.get('domain_name')
    dms_task_arn = event.get('dms_task_arn')

    # Get environment variables
    environment = os.environ['ENVIRONMENT']

    results = {
        'rollback_initiated': True,
        'environment': environment,
        'reason': rollback_reason,
        'actions': []
    }

    try:
        # Step 1: Update Route53 to route 100% traffic to old system
        if hosted_zone_id and domain_name:
            print("Updating Route53 weights...")
            route53_result = update_route53_weights(
                hosted_zone_id=hosted_zone_id,
                domain_name=domain_name,
                old_weight=100,
                new_weight=0
            )
            results['actions'].append({
                'action': 'route53_update',
                'result': route53_result
            })

        # Step 2: Stop DMS replication task
        if dms_task_arn:
            print("Stopping DMS replication...")
            dms_result = stop_dms_replication(dms_task_arn)
            results['actions'].append({
                'action': 'dms_stop',
                'result': dms_result
            })

        # Step 3: Publish rollback metrics
        print("Publishing rollback metrics...")
        publish_rollback_metrics(rollback_reason, environment)

        # Step 4: Send notification (if SNS topic ARN provided)
        if 'SNS_TOPIC_ARN' in os.environ:
            notification_message = f"""
            Migration Rollback Initiated

            Environment: {environment}
            Reason: {rollback_reason}
            Timestamp: {context.aws_request_id}

            Actions Taken:
            {json.dumps(results['actions'], indent=2)}

            Please investigate the issue and plan next steps.
            """

            send_notification(
                topic_arn=os.environ['SNS_TOPIC_ARN'],
                message=notification_message,
                subject=f"URGENT: Migration Rollback - {environment}"
            )

        results['status'] = 'COMPLETED'
        results['statusCode'] = 200

        print(f"Rollback completed successfully: {json.dumps(results)}")
        return results

    except Exception as e:
        print(f"Rollback error: {str(e)}")
        results['status'] = 'FAILED'
        results['statusCode'] = 500
        results['error'] = str(e)
        return results
