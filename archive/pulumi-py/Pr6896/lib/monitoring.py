"""
Monitoring module for CloudWatch dashboards and SNS alerting
"""

from typing import Dict, Any
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


def create_cloudwatch_dashboard(
    environment: str,
    region: str,
    environment_suffix: str,
    ecs_cluster_name: Output[str],
    ecs_service_name: Output[str],
    alb_arn: Output[str],
    target_group_arn: Output[str],
    aurora_cluster_id: Output[str],
    dynamodb_table_name: Output[str],
    sns_topic_arn: Output[str],
    cpu_threshold: int = 80,
    error_rate_threshold: int = 5,
    tags: Dict[str, str] = None,
    opts: ResourceOptions = None,
) -> Dict[str, Any]:
    """
    Create CloudWatch dashboard with metrics from all resources.
    """
    
    tags = tags or {}
    
    # Extract ALB name and target group name from ARNs
    alb_full_name = alb_arn.apply(lambda arn: arn.split(":loadbalancer/")[-1])
    tg_full_name = target_group_arn.apply(lambda arn: arn.split(":")[-1])
    
    # Create dashboard body
    dashboard_body = Output.all(
        ecs_cluster_name,
        ecs_service_name,
        alb_full_name,
        tg_full_name,
        aurora_cluster_id,
        dynamodb_table_name,
    ).apply(
        lambda args: json.dumps(
            {
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                [
                                    "AWS/ECS",
                                    "CPUUtilization",
                                    "ClusterName",
                                    args[0],
                                    "ServiceName",
                                    args[1],
                                    {"stat": "Average"},
                                ],
                                [".", "MemoryUtilization", ".", ".", ".", ".", {"stat": "Average"}],
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": region,
                            "title": f"ECS Service Metrics - {environment}",
                            "yAxis": {"left": {"min": 0, "max": 100}},
                        },
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                [
                                    "AWS/ApplicationELB",
                                    "TargetResponseTime",
                                    "LoadBalancer",
                                    args[2],
                                    {"stat": "Average"},
                                ],
                                [".", "RequestCount", ".", ".", {"stat": "Sum"}],
                                [".", "HTTPCode_Target_5XX_Count", ".", ".", {"stat": "Sum"}],
                                [".", "HTTPCode_Target_4XX_Count", ".", ".", {"stat": "Sum"}],
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": region,
                            "title": f"ALB Metrics - {environment}",
                        },
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                [
                                    "AWS/RDS",
                                    "CPUUtilization",
                                    "DBClusterIdentifier",
                                    args[4],
                                    {"stat": "Average"},
                                ],
                                [".", "DatabaseConnections", ".", ".", {"stat": "Sum"}],
                                [".", "ReadLatency", ".", ".", {"stat": "Average"}],
                                [".", "WriteLatency", ".", ".", {"stat": "Average"}],
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": region,
                            "title": f"Aurora Metrics - {environment}",
                        },
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                [
                                    "AWS/DynamoDB",
                                    "ConsumedReadCapacityUnits",
                                    "TableName",
                                    args[5],
                                    {"stat": "Sum"},
                                ],
                                [".", "ConsumedWriteCapacityUnits", ".", ".", {"stat": "Sum"}],
                                [".", "UserErrors", ".", ".", {"stat": "Sum"}],
                                [".", "SystemErrors", ".", ".", {"stat": "Sum"}],
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": region,
                            "title": f"DynamoDB Metrics - {environment}",
                        },
                    },
                ]
            }
        )
    )
    
    # Create CloudWatch Dashboard
    dashboard = aws.cloudwatch.Dashboard(
        f"{environment}-{region}-dashboard-{environment_suffix}",
        dashboard_name=f"{environment}-{region}-fraud-detection-{environment_suffix}",
        dashboard_body=dashboard_body,
        opts=opts,
    )
    
    # Create CloudWatch Alarms
    
    # ECS CPU Utilization Alarm
    ecs_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"{environment}-ecs-cpu-alarm-{environment_suffix}",
        name=f"{environment}-ecs-cpu-alarm-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/ECS",
        period=300,
        statistic="Average",
        threshold=cpu_threshold,
        alarm_description=f"Alert when ECS CPU exceeds {cpu_threshold}%",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "ClusterName": ecs_cluster_name,
            "ServiceName": ecs_service_name,
        },
        tags={**tags, "Name": f"{environment}-ecs-cpu-alarm-{environment_suffix}"},
        opts=opts,
    )
    
    # ALB 5XX Error Alarm
    alb_error_alarm = aws.cloudwatch.MetricAlarm(
        f"{environment}-alb-error-alarm-{environment_suffix}",
        name=f"{environment}-alb-error-alarm-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="HTTPCode_Target_5XX_Count",
        namespace="AWS/ApplicationELB",
        period=300,
        statistic="Sum",
        threshold=error_rate_threshold,
        alarm_description=f"Alert when 5XX errors exceed {error_rate_threshold}",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "LoadBalancer": alb_full_name,
        },
        treat_missing_data="notBreaching",
        tags={**tags, "Name": f"{environment}-alb-error-alarm-{environment_suffix}"},
        opts=opts,
    )
    
    # Aurora CPU Utilization Alarm
    aurora_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"{environment}-aurora-cpu-alarm-{environment_suffix}",
        name=f"{environment}-aurora-cpu-alarm-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/RDS",
        period=300,
        statistic="Average",
        threshold=cpu_threshold,
        alarm_description=f"Alert when Aurora CPU exceeds {cpu_threshold}%",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "DBClusterIdentifier": aurora_cluster_id,
        },
        tags={**tags, "Name": f"{environment}-aurora-cpu-alarm-{environment_suffix}"},
        opts=opts,
    )
    
    return {
        "dashboard_name": dashboard.dashboard_name,
        "dashboard_arn": dashboard.dashboard_arn,
        "ecs_cpu_alarm_arn": ecs_cpu_alarm.arn,
        "alb_error_alarm_arn": alb_error_alarm.arn,
        "aurora_cpu_alarm_arn": aurora_cpu_alarm.arn,
    }


def create_sns_alerting(
    environment: str,
    environment_suffix: str,
    alert_email: str,
    tags: Dict[str, str] = None,
    opts: ResourceOptions = None,
) -> Dict[str, Any]:
    """
    Create SNS topic and subscription for alerting.
    """
    
    tags = tags or {}
    
    # Create SNS Topic
    topic = aws.sns.Topic(
        f"{environment}-alerts-topic-{environment_suffix}",
        name=f"{environment}-fraud-detection-alerts-{environment_suffix}",
        display_name=f"Fraud Detection Alerts - {environment}",
        tags={**tags, "Name": f"{environment}-alerts-topic-{environment_suffix}"},
        opts=opts,
    )
    
    # Subscribe email to topic
    subscription = aws.sns.TopicSubscription(
        f"{environment}-alerts-subscription-{environment_suffix}",
        topic=topic.arn,
        protocol="email",
        endpoint=alert_email,
        opts=ResourceOptions(parent=topic),
    )
    
    return {
        "topic_arn": topic.arn,
        "topic_name": topic.name,
        "subscription_arn": subscription.arn,
    }
