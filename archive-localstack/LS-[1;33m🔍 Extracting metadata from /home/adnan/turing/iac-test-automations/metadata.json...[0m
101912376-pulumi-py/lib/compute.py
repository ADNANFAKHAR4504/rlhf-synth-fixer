"""
Compute module for ECS cluster, ALB, and ECS Fargate services
"""

from typing import Dict, Any, List
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


def create_ecs_cluster_and_service(
    environment: str,
    region: str,
    environment_suffix: str,
    vpc_id: Output[str],
    public_subnet_ids: List[Output[str]],
    private_subnet_ids: List[Output[str]],
    alb_security_group_id: Output[str],
    ecs_security_group_id: Output[str],
    ecs_task_role_arn: Output[str],
    ecs_execution_role_arn: Output[str],
    cpu: int = 256,
    memory: int = 512,
    container_image: str = "nginx:latest",
    desired_count: int = 2,
    aurora_endpoint: Output[str] = None,
    dynamodb_table_name: Output[str] = None,
    tags: Dict[str, str] = None,
    opts: ResourceOptions = None,
) -> Dict[str, Any]:
    """
    Create ECS cluster, ALB, task definition, and Fargate service.
    """
    
    tags = tags or {}
    
    # Create ECS Cluster
    cluster = aws.ecs.Cluster(
        f"{environment}-{region}-ecs-cluster-{environment_suffix}",
        name=f"{environment}-{region}-ecs-cluster-{environment_suffix}",
        settings=[
            aws.ecs.ClusterSettingArgs(
                name="containerInsights",
                value="enabled",
            )
        ],
        tags={**tags, "Name": f"{environment}-{region}-ecs-cluster-{environment_suffix}"},
        opts=opts,
    )
    
    # Create Application Load Balancer
    alb = aws.lb.LoadBalancer(
        f"{environment}-{region}-alb-{environment_suffix}",
        name=f"{environment}-{region}-alb-{environment_suffix}"[:32],
        load_balancer_type="application",
        subnets=public_subnet_ids,
        security_groups=[alb_security_group_id],
        tags={**tags, "Name": f"{environment}-{region}-alb-{environment_suffix}"},
        opts=opts,
    )
    
    # Create Target Group
    target_group = aws.lb.TargetGroup(
        f"{environment}-{region}-tg-{environment_suffix}",
        name=f"{environment}-{region}-tg-{environment_suffix}"[:32],
        port=8080,
        protocol="HTTP",
        target_type="ip",
        vpc_id=vpc_id,
        health_check=aws.lb.TargetGroupHealthCheckArgs(
            enabled=True,
            path="/health",
            protocol="HTTP",
            matcher="200",
            interval=30,
            timeout=5,
            healthy_threshold=2,
            unhealthy_threshold=3,
        ),
        deregistration_delay=30,
        tags={**tags, "Name": f"{environment}-{region}-tg-{environment_suffix}"},
        opts=opts,
    )
    
    # Create ALB Listener
    listener = aws.lb.Listener(
        f"{environment}-{region}-alb-listener-{environment_suffix}",
        load_balancer_arn=alb.arn,
        port=80,
        protocol="HTTP",
        default_actions=[
            aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=target_group.arn,
            )
        ],
        tags={**tags, "Name": f"{environment}-{region}-alb-listener-{environment_suffix}"},
        opts=ResourceOptions(parent=alb),
    )
    
    # Create CloudWatch Log Group
    log_group = aws.cloudwatch.LogGroup(
        f"{environment}-{region}-ecs-logs-{environment_suffix}",
        name=f"/ecs/{environment}-{region}-fraud-detection-{environment_suffix}",
        retention_in_days=7,
        tags={**tags, "Name": f"{environment}-{region}-ecs-logs-{environment_suffix}"},
        opts=opts,
    )
    
    # Create Task Definition
    container_definitions = Output.all(
        aurora_endpoint, dynamodb_table_name, log_group.name
    ).apply(
        lambda args: json.dumps(
            [
                {
                    "name": f"fraud-detection-{environment}",
                    "image": container_image,
                    "cpu": cpu,
                    "memory": memory,
                    "essential": True,
                    "portMappings": [
                        {
                            "containerPort": 8080,
                            "protocol": "tcp",
                        }
                    ],
                    "environment": [
                        {"name": "ENVIRONMENT", "value": environment},
                        {"name": "REGION", "value": region},
                        {"name": "AURORA_ENDPOINT", "value": args[0] or ""},
                        {"name": "DYNAMODB_TABLE", "value": args[1] or ""},
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": args[2],
                            "awslogs-region": region,
                            "awslogs-stream-prefix": "fraud-detection",
                        },
                    },
                    "healthCheck": {
                        "command": [
                            "CMD-SHELL",
                            "curl -f http://localhost:8080/health || exit 1",
                        ],
                        "interval": 30,
                        "timeout": 5,
                        "retries": 3,
                        "startPeriod": 60,
                    },
                }
            ]
        )
    )
    
    task_definition = aws.ecs.TaskDefinition(
        f"{environment}-{region}-task-def-{environment_suffix}",
        family=f"{environment}-{region}-fraud-detection-{environment_suffix}",
        cpu=str(cpu),
        memory=str(memory),
        network_mode="awsvpc",
        requires_compatibilities=["FARGATE"],
        execution_role_arn=ecs_execution_role_arn,
        task_role_arn=ecs_task_role_arn,
        container_definitions=container_definitions,
        tags={**tags, "Name": f"{environment}-{region}-task-def-{environment_suffix}"},
        opts=opts,
    )
    
    # Create ECS Service
    service = aws.ecs.Service(
        f"{environment}-{region}-ecs-service-{environment_suffix}",
        name=f"{environment}-{region}-fraud-service-{environment_suffix}",
        cluster=cluster.arn,
        task_definition=task_definition.arn,
        desired_count=desired_count,
        launch_type="FARGATE",
        network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
            assign_public_ip=False,
            subnets=private_subnet_ids,
            security_groups=[ecs_security_group_id],
        ),
        load_balancers=[
            aws.ecs.ServiceLoadBalancerArgs(
                target_group_arn=target_group.arn,
                container_name=f"fraud-detection-{environment}",
                container_port=8080,
            )
        ],
        # deployment_configuration removed due to API compatibility issues
        deployment_maximum_percent=200,
        deployment_minimum_healthy_percent=100,
        enable_execute_command=True,
        tags={**tags, "Name": f"{environment}-{region}-ecs-service-{environment_suffix}"},
        opts=ResourceOptions(parent=cluster, depends_on=[listener]),
    )
    
    # Auto Scaling for ECS Service
    scaling_target = aws.appautoscaling.Target(
        f"{environment}-{region}-ecs-scaling-target-{environment_suffix}",
        max_capacity=10,
        min_capacity=desired_count,
        resource_id=Output.concat("service/", cluster.name, "/", service.name),
        scalable_dimension="ecs:service:DesiredCount",
        service_namespace="ecs",
        opts=ResourceOptions(parent=service),
    )
    
    # CPU-based auto scaling policy
    cpu_scaling_policy = aws.appautoscaling.Policy(
        f"{environment}-{region}-ecs-cpu-scaling-{environment_suffix}",
        policy_type="TargetTrackingScaling",
        resource_id=scaling_target.resource_id,
        scalable_dimension=scaling_target.scalable_dimension,
        service_namespace=scaling_target.service_namespace,
        target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
            predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                predefined_metric_type="ECSServiceAverageCPUUtilization",
            ),
            target_value=70.0,
            scale_in_cooldown=300,
            scale_out_cooldown=60,
        ),
        opts=ResourceOptions(parent=scaling_target),
    )
    
    return {
        "cluster_arn": cluster.arn,
        "cluster_name": cluster.name,
        "service_name": service.name,
        "service_arn": service.id,
        "alb_arn": alb.arn,
        "alb_dns_name": alb.dns_name,
        "target_group_arn": target_group.arn,
        "task_definition_arn": task_definition.arn,
    }
