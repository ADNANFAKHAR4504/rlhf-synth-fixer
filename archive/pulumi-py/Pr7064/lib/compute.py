"""ECS Fargate Cluster and Services"""
import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any
import json

def create_ecs_cluster(
    environment_suffix: str,
    vpc_id: pulumi.Output[str],
    public_subnet_ids: List[pulumi.Output[str]],
    private_subnet_ids: List[pulumi.Output[str]],
    alb_security_group_id: pulumi.Output[str],
    app_security_group_id: pulumi.Output[str],
    database_endpoint: pulumi.Output[str],
    cache_endpoint: pulumi.Output[str],
    queue_url: pulumi.Output[str],
    log_group: Any,
    environment: str,
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """Create ECS cluster with Fargate service and ALB"""

    # Create ECS cluster
    cluster = aws.ecs.Cluster(
        f"transaction-cluster-{environment_suffix}",
        name=f"transaction-cluster-{environment_suffix}",
        settings=[aws.ecs.ClusterSettingArgs(
            name="containerInsights",
            value="enabled"
        )],
        tags={**tags, "Name": f"transaction-cluster-{environment_suffix}"}
    )

    # Create ALB
    alb = aws.lb.LoadBalancer(
        f"payment-alb-{environment_suffix}",
        name=f"payment-alb-{environment_suffix}",
        internal=False,
        load_balancer_type="application",
        security_groups=[alb_security_group_id],
        subnets=public_subnet_ids,
        enable_deletion_protection=False,
        tags={**tags, "Name": f"payment-alb-{environment_suffix}"}
    )

    # Create target group
    target_group = aws.lb.TargetGroup(
        f"payment-tg-{environment_suffix}",
        name=f"payment-tg-{environment_suffix}",
        port=8080,
        protocol="HTTP",
        vpc_id=vpc_id,
        target_type="ip",
        health_check=aws.lb.TargetGroupHealthCheckArgs(
            enabled=True,
            path="/health",
            interval=30,
            timeout=5,
            healthy_threshold=2,
            unhealthy_threshold=3,
            matcher="200"
        ),
        deregistration_delay=30,
        tags={**tags, "Name": f"payment-tg-{environment_suffix}"}
    )

    # Create ALB listener
    listener = aws.lb.Listener(
        f"payment-listener-{environment_suffix}",
        load_balancer_arn=alb.arn,
        port=80,
        protocol="HTTP",
        default_actions=[aws.lb.ListenerDefaultActionArgs(
            type="forward",
            target_group_arn=target_group.arn
        )]
    )

    # Create IAM role for ECS task execution
    task_execution_role = aws.iam.Role(
        f"payment-task-exec-role-{environment_suffix}",
        name=f"payment-task-exec-role-{environment_suffix}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                }
            }]
        }),
        tags=tags
    )

    # Attach execution role policy
    task_execution_policy_attachment = aws.iam.RolePolicyAttachment(
        f"payment-task-exec-policy-{environment_suffix}",
        role=task_execution_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    )

    # Create IAM role for ECS task
    task_role = aws.iam.Role(
        f"payment-task-role-{environment_suffix}",
        name=f"payment-task-role-{environment_suffix}",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                }
            }]
        }),
        tags=tags
    )

    # Create policy for task role
    task_policy = aws.iam.RolePolicy(
        f"payment-task-policy-{environment_suffix}",
        role=task_role.id,
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "*"
                }
            ]
        })
    )

    # Create CloudWatch log group
    log_group = aws.cloudwatch.LogGroup(
        f"payment-logs-{environment_suffix}",
        name=f"/ecs/payment-{environment_suffix}",
        retention_in_days=7,
        tags=tags
    )

    # Create task definition
    task_definition = aws.ecs.TaskDefinition(
        f"payment-task-{environment_suffix}",
        family=f"payment-task-{environment_suffix}",
        cpu="256",
        memory="512",
        network_mode="awsvpc",
        requires_compatibilities=["FARGATE"],
        execution_role_arn=task_execution_role.arn,
        task_role_arn=task_role.arn,
        container_definitions=pulumi.Output.all(
            database_endpoint,
            cache_endpoint,
            queue_url
        ).apply(lambda args: json.dumps([{
            "name": "payment-app",
            "image": "nginx:latest",  # Replace with actual payment app image
            "cpu": 256,
            "memory": 512,
            "essential": True,
            "portMappings": [{
                "containerPort": 8080,
                "protocol": "tcp"
            }],
            "environment": [
                {"name": "DATABASE_ENDPOINT", "value": args[0]},
                {"name": "CACHE_ENDPOINT", "value": args[1]},
                {"name": "QUEUE_URL", "value": args[2]},
                {"name": "ENVIRONMENT", "value": environment}
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": f"/ecs/payment-{environment_suffix}",
                    "awslogs-region": aws.config.region,
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }])),
        tags={**tags, "Name": f"payment-task-{environment_suffix}"}
    )

    # Create ECS service
    service = aws.ecs.Service(
        f"payment-service-{environment_suffix}",
        name=f"payment-service-{environment_suffix}",
        cluster=cluster.arn,
        task_definition=task_definition.arn,
        desired_count=2 if environment == "prod" else 1,
        launch_type="FARGATE",
        network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
            assign_public_ip=False,
            subnets=private_subnet_ids,
            security_groups=[app_security_group_id]
        ),
        load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
            target_group_arn=target_group.arn,
            container_name="payment-app",
            container_port=8080
        )],
        health_check_grace_period_seconds=60,
        tags={**tags, "Name": f"payment-service-{environment_suffix}"},
        opts=pulumi.ResourceOptions(depends_on=[listener])
    )

    # Create auto-scaling target
    autoscaling_target = aws.appautoscaling.Target(
        f"payment-autoscaling-target-{environment_suffix}",
        max_capacity=10,
        min_capacity=1,
        resource_id=pulumi.Output.concat("service/", cluster.name, "/", service.name),
        scalable_dimension="ecs:service:DesiredCount",
        service_namespace="ecs"
    )

    # Create CPU scaling policy
    # pylint: disable=line-too-long
    metric_spec_args = aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
        predefined_metric_type="ECSServiceAverageCPUUtilization"
    )
    config_args = aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
        predefined_metric_specification=metric_spec_args,
        target_value=70.0,
        scale_in_cooldown=300,
        scale_out_cooldown=60
    )
    # pylint: enable=line-too-long
    cpu_scaling_policy = aws.appautoscaling.Policy(
        f"payment-cpu-scaling-{environment_suffix}",
        policy_type="TargetTrackingScaling",
        resource_id=autoscaling_target.resource_id,
        scalable_dimension=autoscaling_target.scalable_dimension,
        service_namespace=autoscaling_target.service_namespace,
        target_tracking_scaling_policy_configuration=config_args
    )

    return {
        "cluster": cluster,
        "alb": alb,
        "target_group": target_group,
        "listener": listener,
        "service": service,
        "task_definition": task_definition,
        "task_execution_role": task_execution_role,
        "task_role": task_role,
        "log_group": log_group,
        "autoscaling_target": autoscaling_target,
        "cpu_scaling_policy": cpu_scaling_policy
    }
