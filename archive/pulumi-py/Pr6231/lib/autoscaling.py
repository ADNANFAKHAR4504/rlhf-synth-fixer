"""
Auto-scaling Configuration
Creates auto-scaling policies and CloudWatch alarms for ECS service
"""

import pulumi
import pulumi_aws as aws

def create_autoscaling_policy(environment_suffix: str, cluster, service):
    """
    Create auto-scaling policies for ECS service
    """

    # Create auto-scaling target
    autoscaling_target = aws.appautoscaling.Target(
        f"ecs-target-{environment_suffix}",
        service_namespace="ecs",
        resource_id=pulumi.Output.all(cluster.name, service.name).apply(
            lambda args: f"service/{args[0]}/{args[1]}"
        ),
        scalable_dimension="ecs:service:DesiredCount",
        min_capacity=2,
        max_capacity=10
    )

    # Create scale-up policy
    predefined_metric = (
        aws.appautoscaling
        .PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
            predefined_metric_type="ECSServiceAverageCPUUtilization"
        )
    )

    target_tracking_config = (
        aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
            predefined_metric_specification=predefined_metric,
            target_value=70.0,
            scale_in_cooldown=300,
            scale_out_cooldown=300
        )
    )

    scale_up_policy = aws.appautoscaling.Policy(
        f"ecs-scale-up-{environment_suffix}",
        name=f"ecs-scale-up-{environment_suffix}",
        service_namespace=autoscaling_target.service_namespace,
        resource_id=autoscaling_target.resource_id,
        scalable_dimension=autoscaling_target.scalable_dimension,
        policy_type="TargetTrackingScaling",
        target_tracking_scaling_policy_configuration=target_tracking_config
    )

    # Create CloudWatch alarm for high CPU
    high_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"ecs-high-cpu-{environment_suffix}",
        name=f"ecs-high-cpu-{environment_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/ECS",
        period=60,
        statistic="Average",
        threshold=70.0,
        alarm_description="Triggers when ECS service CPU exceeds 70%",
        dimensions={
            "ClusterName": cluster.name,
            "ServiceName": service.name
        },
        tags={
            "Name": f"ecs-high-cpu-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create CloudWatch alarm for low CPU
    low_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"ecs-low-cpu-{environment_suffix}",
        name=f"ecs-low-cpu-{environment_suffix}",
        comparison_operator="LessThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/ECS",
        period=60,
        statistic="Average",
        threshold=30.0,
        alarm_description="Triggers when ECS service CPU below 30%",
        dimensions={
            "ClusterName": cluster.name,
            "ServiceName": service.name
        },
        tags={
            "Name": f"ecs-low-cpu-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    return {
        "autoscaling_target": autoscaling_target,
        "scale_up_policy": scale_up_policy,
        "high_cpu_alarm": high_cpu_alarm,
        "low_cpu_alarm": low_cpu_alarm
    }
