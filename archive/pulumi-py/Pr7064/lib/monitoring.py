"""CloudWatch Monitoring and Alarms"""
import pulumi
import pulumi_aws as aws
from typing import Dict, Any

def create_monitoring(
    environment_suffix: str,
    alb_arn: pulumi.Output[str],
    target_group_arn: pulumi.Output[str],
    ecs_cluster_name: pulumi.Output[str],
    ecs_service_name: pulumi.Output[str],
    database_cluster_id: pulumi.Output[str],
    cache_cluster_id: pulumi.Output[str],
    queue_name: pulumi.Output[str],
    sns_topic_arn: pulumi.Output[str],
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """Create CloudWatch alarms and dashboards"""

    # ALB Target Unhealthy alarm
    alb_unhealthy_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-alb-unhealthy-{environment_suffix}",
        name=f"payment-alb-unhealthy-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="UnHealthyHostCount",
        namespace="AWS/ApplicationELB",
        period=60,
        statistic="Average",
        threshold=1,
        alarm_description="Alert when ALB has unhealthy targets",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "LoadBalancer": alb_arn,
            "TargetGroup": target_group_arn
        },
        tags=tags
    )

    # ALB High Response Time alarm
    alb_response_time_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-alb-response-time-{environment_suffix}",
        name=f"payment-alb-response-time-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="TargetResponseTime",
        namespace="AWS/ApplicationELB",
        period=60,
        statistic="Average",
        threshold=1.0,
        alarm_description="Alert when response time exceeds 1 second",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "LoadBalancer": alb_arn
        },
        tags=tags
    )

    # ECS CPU Utilization alarm
    ecs_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-ecs-cpu-{environment_suffix}",
        name=f"payment-ecs-cpu-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/ECS",
        period=60,
        statistic="Average",
        threshold=80,
        alarm_description="Alert when ECS CPU exceeds 80%",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "ClusterName": ecs_cluster_name,
            "ServiceName": ecs_service_name
        },
        tags=tags
    )

    # ECS Memory Utilization alarm
    ecs_memory_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-ecs-memory-{environment_suffix}",
        name=f"payment-ecs-memory-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="MemoryUtilization",
        namespace="AWS/ECS",
        period=60,
        statistic="Average",
        threshold=80,
        alarm_description="Alert when ECS memory exceeds 80%",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "ClusterName": ecs_cluster_name,
            "ServiceName": ecs_service_name
        },
        tags=tags
    )

    # Database CPU alarm
    db_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-db-cpu-{environment_suffix}",
        name=f"payment-db-cpu-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/RDS",
        period=300,
        statistic="Average",
        threshold=80,
        alarm_description="Alert when database CPU exceeds 80%",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "DBClusterIdentifier": database_cluster_id
        },
        tags=tags
    )

    # Database connections alarm
    db_connections_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-db-connections-{environment_suffix}",
        name=f"payment-db-connections-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="DatabaseConnections",
        namespace="AWS/RDS",
        period=300,
        statistic="Average",
        threshold=100,
        alarm_description="Alert when database connections exceed 100",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "DBClusterIdentifier": database_cluster_id
        },
        tags=tags
    )

    # Cache CPU alarm
    cache_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-cache-cpu-{environment_suffix}",
        name=f"payment-cache-cpu-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/ElastiCache",
        period=300,
        statistic="Average",
        threshold=75,
        alarm_description="Alert when cache CPU exceeds 75%",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "CacheClusterId": cache_cluster_id
        },
        tags=tags
    )

    # SQS queue depth alarm
    queue_depth_alarm = aws.cloudwatch.MetricAlarm(
        f"payment-queue-depth-{environment_suffix}",
        name=f"payment-queue-depth-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="ApproximateNumberOfMessagesVisible",
        namespace="AWS/SQS",
        period=300,
        statistic="Average",
        threshold=100,
        alarm_description="Alert when queue depth exceeds 100 messages",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "QueueName": queue_name
        },
        tags=tags
    )

    return {
        "alb_unhealthy_alarm": alb_unhealthy_alarm,
        "alb_response_time_alarm": alb_response_time_alarm,
        "ecs_cpu_alarm": ecs_cpu_alarm,
        "ecs_memory_alarm": ecs_memory_alarm,
        "db_cpu_alarm": db_cpu_alarm,
        "db_connections_alarm": db_connections_alarm,
        "cache_cpu_alarm": cache_cpu_alarm,
        "queue_depth_alarm": queue_depth_alarm
    }
