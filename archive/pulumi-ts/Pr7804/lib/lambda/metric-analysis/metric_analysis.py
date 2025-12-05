#!/usr/bin/env python3
"""
Infrastructure Metric Analysis Lambda Function

Analyzes CloudWatch metrics every hour and identifies resources exceeding 80% utilization.
Sends notifications to appropriate SNS topics based on severity.
"""

import os
import json
import boto3
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

# Environment variables
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
SNS_TOPIC_CRITICAL = os.environ['SNS_TOPIC_CRITICAL']
SNS_TOPIC_WARNING = os.environ['SNS_TOPIC_WARNING']
SNS_TOPIC_INFO = os.environ['SNS_TOPIC_INFO']
THRESHOLD_PERCENT = float(os.environ.get('THRESHOLD_PERCENT', '80'))
MONITORING_REGIONS = os.environ.get('MONITORING_REGIONS', 'us-east-1').split(',')


def get_cloudwatch_client(region: str):
    """Get CloudWatch client for specified region."""
    return boto3.client('cloudwatch', region_name=region)


def get_ec2_client(region: str):
    """Get EC2 client for specified region."""
    return boto3.client('ec2', region_name=region)


def get_sns_client():
    """Get SNS client."""
    return boto3.client('sns')


def get_metric_statistics(
    cloudwatch, namespace: str, metric_name: str, dimensions: List[Dict],
    start_time: datetime, end_time: datetime, period: int = 3600
) -> Optional[float]:
    """
    Retrieve metric statistics from CloudWatch.

    Args:
        cloudwatch: CloudWatch client
        namespace: Metric namespace
        metric_name: Name of the metric
        dimensions: Metric dimensions
        start_time: Start time for metric query
        end_time: End time for metric query
        period: Period in seconds

    Returns:
        Average value or None if no data
    """
    try:
        response = cloudwatch.get_metric_statistics(
            Namespace=namespace,
            MetricName=metric_name,
            Dimensions=dimensions,
            StartTime=start_time,
            EndTime=end_time,
            Period=period,
            Statistics=['Average']
        )

        if response['Datapoints']:
            # Get the most recent datapoint
            datapoints = sorted(response['Datapoints'], key=lambda x: x['Timestamp'], reverse=True)
            return datapoints[0]['Average']
        return None
    except Exception as e:
        print(f"Error getting metric statistics: {str(e)}")
        return None


def analyze_ec2_instances(region: str, start_time: datetime, end_time: datetime) -> List[Dict[str, Any]]:
    """
    Analyze EC2 instances for high utilization.

    Args:
        region: AWS region
        start_time: Analysis start time
        end_time: Analysis end time

    Returns:
        List of instances exceeding threshold
    """
    cloudwatch = get_cloudwatch_client(region)
    ec2 = get_ec2_client(region)

    issues = []

    try:
        # Get all running instances
        response = ec2.describe_instances(
            Filters=[{'Name': 'instance-state-name', 'Values': ['running']}]
        )

        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                instance_name = next(
                    (tag['Value'] for tag in instance.get('Tags', []) if tag['Key'] == 'Name'),
                    instance_id
                )

                # Check CPU utilization
                cpu_avg = get_metric_statistics(
                    cloudwatch,
                    'AWS/EC2',
                    'CPUUtilization',
                    [{'Name': 'InstanceId', 'Value': instance_id}],
                    start_time,
                    end_time
                )

                if cpu_avg and cpu_avg > THRESHOLD_PERCENT:
                    issues.append({
                        'region': region,
                        'resource_type': 'EC2 Instance',
                        'resource_id': instance_id,
                        'resource_name': instance_name,
                        'metric': 'CPUUtilization',
                        'value': cpu_avg,
                        'threshold': THRESHOLD_PERCENT,
                        'severity': 'critical' if cpu_avg > 90 else 'warning'
                    })
    except Exception as e:
        print(f"Error analyzing EC2 instances in {region}: {str(e)}")

    return issues


def analyze_lambda_functions(region: str, start_time: datetime, end_time: datetime) -> List[Dict[str, Any]]:
    """
    Analyze Lambda functions for high error rates.

    Args:
        region: AWS region
        start_time: Analysis start time
        end_time: Analysis end time

    Returns:
        List of Lambda functions with high error rates
    """
    cloudwatch = get_cloudwatch_client(region)
    lambda_client = boto3.client('lambda', region_name=region)

    issues = []

    try:
        # Get all Lambda functions
        paginator = lambda_client.get_paginator('list_functions')
        for page in paginator.paginate():
            for function in page['Functions']:
                function_name = function['FunctionName']

                # Check error rate
                errors = get_metric_statistics(
                    cloudwatch,
                    'AWS/Lambda',
                    'Errors',
                    [{'Name': 'FunctionName', 'Value': function_name}],
                    start_time,
                    end_time
                )

                invocations = get_metric_statistics(
                    cloudwatch,
                    'AWS/Lambda',
                    'Invocations',
                    [{'Name': 'FunctionName', 'Value': function_name}],
                    start_time,
                    end_time
                )

                if errors and invocations and invocations > 0:
                    error_rate = (errors / invocations) * 100
                    if error_rate > 5:  # 5% error rate threshold
                        issues.append({
                            'region': region,
                            'resource_type': 'Lambda Function',
                            'resource_id': function_name,
                            'resource_name': function_name,
                            'metric': 'ErrorRate',
                            'value': error_rate,
                            'threshold': 5,
                            'severity': 'critical' if error_rate > 10 else 'warning'
                        })
    except Exception as e:
        print(f"Error analyzing Lambda functions in {region}: {str(e)}")

    return issues


def send_notification(sns_client, topic_arn: str, subject: str, message: Dict[str, Any]):
    """
    Send notification to SNS topic.

    Args:
        sns_client: SNS client
        topic_arn: SNS topic ARN
        subject: Email subject
        message: Message payload
    """
    try:
        sns_client.publish(
            TopicArn=topic_arn,
            Subject=subject,
            Message=json.dumps(message, indent=2, default=str)
        )
        print(f"Notification sent to {topic_arn}")
    except Exception as e:
        print(f"Error sending notification: {str(e)}")


def handler(event, context):
    """
    Lambda handler function.

    Analyzes infrastructure metrics and sends notifications for resources
    exceeding utilization thresholds.
    """
    print(f"Starting infrastructure metric analysis for environment: {ENVIRONMENT_SUFFIX}")

    # Define time range (last hour)
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=1)

    all_issues = []

    # Analyze resources in all monitored regions
    for region in MONITORING_REGIONS:
        print(f"Analyzing region: {region}")

        # Analyze EC2 instances
        ec2_issues = analyze_ec2_instances(region, start_time, end_time)
        all_issues.extend(ec2_issues)

        # Analyze Lambda functions
        lambda_issues = analyze_lambda_functions(region, start_time, end_time)
        all_issues.extend(lambda_issues)

    # Group issues by severity
    critical_issues = [issue for issue in all_issues if issue['severity'] == 'critical']
    warning_issues = [issue for issue in all_issues if issue['severity'] == 'warning']

    # Send notifications
    sns = get_sns_client()

    if critical_issues:
        send_notification(
            sns,
            SNS_TOPIC_CRITICAL,
            f"CRITICAL: Infrastructure Issues Detected - {ENVIRONMENT_SUFFIX}",
            {
                'environment': ENVIRONMENT_SUFFIX,
                'timestamp': datetime.utcnow().isoformat(),
                'severity': 'CRITICAL',
                'issue_count': len(critical_issues),
                'issues': critical_issues
            }
        )

    if warning_issues:
        send_notification(
            sns,
            SNS_TOPIC_WARNING,
            f"WARNING: Infrastructure Issues Detected - {ENVIRONMENT_SUFFIX}",
            {
                'environment': ENVIRONMENT_SUFFIX,
                'timestamp': datetime.utcnow().isoformat(),
                'severity': 'WARNING',
                'issue_count': len(warning_issues),
                'issues': warning_issues
            }
        )

    # Send summary to info topic
    summary = {
        'environment': ENVIRONMENT_SUFFIX,
        'timestamp': datetime.utcnow().isoformat(),
        'analysis_period': {
            'start': start_time.isoformat(),
            'end': end_time.isoformat()
        },
        'regions_analyzed': MONITORING_REGIONS,
        'total_issues': len(all_issues),
        'critical_issues': len(critical_issues),
        'warning_issues': len(warning_issues)
    }

    send_notification(
        sns,
        SNS_TOPIC_INFO,
        f"Infrastructure Analysis Summary - {ENVIRONMENT_SUFFIX}",
        summary
    )

    print(f"Analysis complete. Found {len(all_issues)} issues ({len(critical_issues)} critical, {len(warning_issues)} warning)")

    return {
        'statusCode': 200,
        'body': json.dumps(summary)
    }
