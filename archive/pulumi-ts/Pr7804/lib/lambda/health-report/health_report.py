#!/usr/bin/env python3
"""
Infrastructure Health Report Lambda Function

Generates weekly infrastructure health reports in JSON format.
Includes metrics, recommendations, and cost analysis.
"""

import os
import json
import boto3
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Environment variables
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
SNS_TOPIC_INFO = os.environ['SNS_TOPIC_INFO']
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


def collect_ec2_metrics(region: str, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
    """
    Collect EC2 metrics for the region.

    Args:
        region: AWS region
        start_time: Start time for metrics
        end_time: End time for metrics

    Returns:
        Dictionary containing EC2 metrics
    """
    cloudwatch = get_cloudwatch_client(region)
    ec2 = get_ec2_client(region)

    metrics = {
        'region': region,
        'instance_count': 0,
        'running_instances': 0,
        'stopped_instances': 0,
        'avg_cpu_utilization': 0,
        'instances': []
    }

    try:
        response = ec2.describe_instances()

        total_cpu = 0
        cpu_count = 0

        for reservation in response['Reservations']:
            metrics['instance_count'] += len(reservation['Instances'])

            for instance in reservation['Instances']:
                state = instance['State']['Name']
                instance_id = instance['InstanceId']

                if state == 'running':
                    metrics['running_instances'] += 1
                elif state == 'stopped':
                    metrics['stopped_instances'] += 1

                # Get CPU utilization for running instances
                if state == 'running':
                    try:
                        cpu_response = cloudwatch.get_metric_statistics(
                            Namespace='AWS/EC2',
                            MetricName='CPUUtilization',
                            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
                            StartTime=start_time,
                            EndTime=end_time,
                            Period=3600,
                            Statistics=['Average']
                        )

                        if cpu_response['Datapoints']:
                            avg_cpu = sum(dp['Average'] for dp in cpu_response['Datapoints']) / len(cpu_response['Datapoints'])
                            total_cpu += avg_cpu
                            cpu_count += 1

                            metrics['instances'].append({
                                'instance_id': instance_id,
                                'state': state,
                                'avg_cpu': round(avg_cpu, 2)
                            })
                    except Exception as e:
                        print(f"Error getting CPU metrics for {instance_id}: {str(e)}")

        if cpu_count > 0:
            metrics['avg_cpu_utilization'] = round(total_cpu / cpu_count, 2)

    except Exception as e:
        print(f"Error collecting EC2 metrics in {region}: {str(e)}")

    return metrics


def collect_lambda_metrics(region: str, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
    """
    Collect Lambda metrics for the region.

    Args:
        region: AWS region
        start_time: Start time for metrics
        end_time: End time for metrics

    Returns:
        Dictionary containing Lambda metrics
    """
    cloudwatch = get_cloudwatch_client(region)
    lambda_client = boto3.client('lambda', region_name=region)

    metrics = {
        'region': region,
        'function_count': 0,
        'total_invocations': 0,
        'total_errors': 0,
        'error_rate': 0,
        'functions': []
    }

    try:
        paginator = lambda_client.get_paginator('list_functions')

        for page in paginator.paginate():
            metrics['function_count'] += len(page['Functions'])

            for function in page['Functions']:
                function_name = function['FunctionName']

                try:
                    # Get invocation count
                    inv_response = cloudwatch.get_metric_statistics(
                        Namespace='AWS/Lambda',
                        MetricName='Invocations',
                        Dimensions=[{'Name': 'FunctionName', 'Value': function_name}],
                        StartTime=start_time,
                        EndTime=end_time,
                        Period=3600,
                        Statistics=['Sum']
                    )

                    invocations = sum(dp['Sum'] for dp in inv_response['Datapoints']) if inv_response['Datapoints'] else 0

                    # Get error count
                    err_response = cloudwatch.get_metric_statistics(
                        Namespace='AWS/Lambda',
                        MetricName='Errors',
                        Dimensions=[{'Name': 'FunctionName', 'Value': function_name}],
                        StartTime=start_time,
                        EndTime=end_time,
                        Period=3600,
                        Statistics=['Sum']
                    )

                    errors = sum(dp['Sum'] for dp in err_response['Datapoints']) if err_response['Datapoints'] else 0

                    metrics['total_invocations'] += invocations
                    metrics['total_errors'] += errors

                    if invocations > 0:
                        metrics['functions'].append({
                            'function_name': function_name,
                            'invocations': int(invocations),
                            'errors': int(errors),
                            'error_rate': round((errors / invocations) * 100, 2)
                        })
                except Exception as e:
                    print(f"Error getting metrics for function {function_name}: {str(e)}")

        if metrics['total_invocations'] > 0:
            metrics['error_rate'] = round((metrics['total_errors'] / metrics['total_invocations']) * 100, 2)

    except Exception as e:
        print(f"Error collecting Lambda metrics in {region}: {str(e)}")

    return metrics


def collect_cloudwatch_alarms(region: str) -> Dict[str, Any]:
    """
    Collect CloudWatch alarm states.

    Args:
        region: AWS region

    Returns:
        Dictionary containing alarm states
    """
    cloudwatch = get_cloudwatch_client(region)

    alarm_stats = {
        'region': region,
        'total_alarms': 0,
        'alarm_count': 0,
        'ok_count': 0,
        'insufficient_data_count': 0,
        'alarms': []
    }

    try:
        paginator = cloudwatch.get_paginator('describe_alarms')

        for page in paginator.paginate():
            for alarm in page['MetricAlarms']:
                alarm_stats['total_alarms'] += 1
                state = alarm['StateValue']

                if state == 'ALARM':
                    alarm_stats['alarm_count'] += 1
                elif state == 'OK':
                    alarm_stats['ok_count'] += 1
                else:
                    alarm_stats['insufficient_data_count'] += 1

                if state == 'ALARM':
                    alarm_stats['alarms'].append({
                        'alarm_name': alarm['AlarmName'],
                        'state': state,
                        'reason': alarm.get('StateReason', 'Unknown')
                    })
    except Exception as e:
        print(f"Error collecting alarm data in {region}: {str(e)}")

    return alarm_stats


def generate_recommendations(ec2_metrics: List[Dict], lambda_metrics: List[Dict]) -> List[str]:
    """
    Generate recommendations based on collected metrics.

    Args:
        ec2_metrics: List of EC2 metrics per region
        lambda_metrics: List of Lambda metrics per region

    Returns:
        List of recommendations
    """
    recommendations = []

    # EC2 recommendations
    for region_metrics in ec2_metrics:
        if region_metrics['stopped_instances'] > 0:
            recommendations.append(
                f"Consider terminating {region_metrics['stopped_instances']} stopped instances in {region_metrics['region']} to reduce costs"
            )

        if region_metrics['avg_cpu_utilization'] < 20:
            recommendations.append(
                f"Average CPU utilization in {region_metrics['region']} is {region_metrics['avg_cpu_utilization']}%. Consider downsizing instances."
            )

    # Lambda recommendations
    for region_metrics in lambda_metrics:
        if region_metrics['error_rate'] > 5:
            recommendations.append(
                f"Lambda error rate in {region_metrics['region']} is {region_metrics['error_rate']}%. Review function logs and fix errors."
            )

    if not recommendations:
        recommendations.append("No optimization recommendations at this time. Infrastructure is running efficiently.")

    return recommendations


def handler(event, context):
    """
    Lambda handler function.

    Generates a comprehensive weekly infrastructure health report.
    """
    print(f"Generating weekly health report for environment: {ENVIRONMENT_SUFFIX}")

    # Define time range (last 7 days)
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=7)

    # Collect metrics from all regions
    ec2_metrics = []
    lambda_metrics = []
    alarm_stats = []

    for region in MONITORING_REGIONS:
        print(f"Collecting metrics for region: {region}")

        ec2_metrics.append(collect_ec2_metrics(region, start_time, end_time))
        lambda_metrics.append(collect_lambda_metrics(region, start_time, end_time))
        alarm_stats.append(collect_cloudwatch_alarms(region))

    # Generate recommendations
    recommendations = generate_recommendations(ec2_metrics, lambda_metrics)

    # Build health report
    health_report = {
        'report_metadata': {
            'environment': ENVIRONMENT_SUFFIX,
            'generated_at': datetime.utcnow().isoformat(),
            'report_period': {
                'start': start_time.isoformat(),
                'end': end_time.isoformat()
            },
            'regions': MONITORING_REGIONS
        },
        'ec2_metrics': ec2_metrics,
        'lambda_metrics': lambda_metrics,
        'alarm_stats': alarm_stats,
        'recommendations': recommendations,
        'summary': {
            'total_ec2_instances': sum(m['instance_count'] for m in ec2_metrics),
            'total_lambda_functions': sum(m['function_count'] for m in lambda_metrics),
            'total_alarms': sum(a['total_alarms'] for a in alarm_stats),
            'active_alarms': sum(a['alarm_count'] for a in alarm_stats),
            'recommendation_count': len(recommendations)
        }
    }

    # Send report to SNS
    sns = get_sns_client()

    try:
        sns.publish(
            TopicArn=SNS_TOPIC_INFO,
            Subject=f"Weekly Infrastructure Health Report - {ENVIRONMENT_SUFFIX}",
            Message=json.dumps(health_report, indent=2, default=str)
        )
        print("Health report sent successfully")
    except Exception as e:
        print(f"Error sending health report: {str(e)}")

    print("Health report generation complete")

    return {
        'statusCode': 200,
        'body': json.dumps(health_report)
    }
