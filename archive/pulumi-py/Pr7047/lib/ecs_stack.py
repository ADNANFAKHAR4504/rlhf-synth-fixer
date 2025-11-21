"""
ecs_stack.py

ECS Fargate cluster with cost-optimized configuration and auto-scaling.
Implements right-sized tasks, Fargate Spot capacity, and aggressive scaling policies.
"""

from typing import Optional, List
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class EcsStack(pulumi.ComponentResource):
    """
    ECS Fargate stack with cost optimization features.

    Cost optimizations:
    - Right-sized tasks (256 CPU / 512 MB default)
    - Fargate Spot capacity provider (70% cost savings)
    - Aggressive auto-scaling (scale-in and scale-out)
    - 7-day CloudWatch log retention
    - Container Insights enabled

    Performance features:
    - Fast health checks
    - Quick scale-out (target 1-2 minutes)
    - Optimized startup configuration

    Args:
        name (str): Resource name
        vpc_id (Output[str]): VPC ID
        private_subnet_ids (List[Output[str]]): Private subnet IDs
        alb_target_group_arn (Output[str]): ALB target group ARN
        alb_security_group_id (Output[str]): ALB security group ID
        environment_suffix (str): Environment identifier
        task_cpu (int): CPU units (default 256)
        task_memory (int): Memory in MB (default 512)
        desired_count (int): Desired task count (default 2)
        use_spot (bool): Use Fargate Spot (default True)
        opts (ResourceOptions): Pulumi options
    """

    def __init__(
        self,
        name: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        alb_target_group_arn: Output[str],
        alb_security_group_id: Output[str],
        environment_suffix: str,
        task_cpu: int = 256,
        task_memory: int = 512,
        desired_count: int = 2,
        use_spot: bool = True,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:ecs:EcsStack', name, None, opts)

        # Create ECS cluster with Container Insights
        self.cluster = aws.ecs.Cluster(
            f"ecs-cluster-{environment_suffix}",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled"
                )
            ],
            tags={
                "Name": f"ecs-cluster-{environment_suffix}",
                "Environment": environment_suffix,
                "CostCenter": "payment-processing"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Fargate capacity provider (Spot for cost savings)
        if use_spot:
            self.capacity_provider_spot = aws.ecs.ClusterCapacityProviders(
                f"ecs-cp-{environment_suffix}",
                cluster_name=self.cluster.name,
                capacity_providers=["FARGATE_SPOT", "FARGATE"],
                default_capacity_provider_strategies=[
                    aws.ecs.ClusterCapacityProvidersDefaultCapacityProviderStrategyArgs(
                        capacity_provider="FARGATE_SPOT",
                        weight=1,
                        base=0
                    )
                ],
                opts=ResourceOptions(parent=self)
            )

        # Create CloudWatch log group (7-day retention for cost optimization)
        self.log_group = aws.cloudwatch.LogGroup(
            f"ecs-logs-{environment_suffix}",
            name=f"/ecs/payment-service-{environment_suffix}",
            retention_in_days=7,  # Cost optimization
            tags={
                "Name": f"ecs-logs-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create ECS task execution role
        self.task_execution_role = aws.iam.Role(
            f"ecs-task-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"ecs-task-execution-role-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach execution role policy
        aws.iam.RolePolicyAttachment(
            f"ecs-task-execution-policy-{environment_suffix}",
            role=self.task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self)
        )

        # Create ECS task role (for application permissions)
        self.task_role = aws.iam.Role(
            f"ecs-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"ecs-task-role-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create ECS task definition
        self.task_definition = aws.ecs.TaskDefinition(
            f"payment-task-{environment_suffix}",
            family=f"payment-task-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu=str(task_cpu),
            memory=str(task_memory),
            execution_role_arn=self.task_execution_role.arn,
            task_role_arn=self.task_role.arn,
            container_definitions=pulumi.Output.all(self.log_group.name).apply(
                lambda args: json.dumps([{
                    "name": "payment-service",
                    "image": "nginx:alpine",  # Placeholder - replace with actual image
                    "essential": True,
                    "portMappings": [{
                        "containerPort": 80,
                        "protocol": "tcp"
                    }],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": args[0],
                            "awslogs-region": "us-east-1",
                            "awslogs-stream-prefix": "payment"
                        }
                    },
                    "healthCheck": {
                        "command": ["CMD-SHELL", "curl -f http://localhost/health || exit 1"],
                        "interval": 30,
                        "timeout": 5,
                        "retries": 3,
                        "startPeriod": 60
                    },
                    "environment": [
                        {"name": "ENVIRONMENT", "value": environment_suffix},
                        {"name": "AWS_REGION", "value": "us-east-1"}
                    ]
                }])
            ),
            tags={
                "Name": f"payment-task-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create security group for ECS tasks
        self.ecs_security_group = aws.ec2.SecurityGroup(
            f"ecs-tasks-sg-{environment_suffix}",
            vpc_id=vpc_id,
            description="Security group for ECS tasks",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    security_groups=[alb_security_group_id],
                    description="Allow traffic from ALB"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"ecs-tasks-sg-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create ECS service
        self.service = aws.ecs.Service(
            f"payment-service-{environment_suffix}",
            cluster=self.cluster.arn,
            desired_count=desired_count,
            launch_type="FARGATE" if not use_spot else None,
            task_definition=self.task_definition.arn,
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=private_subnet_ids,
                security_groups=[self.ecs_security_group.id]
            ),
            load_balancers=[
                aws.ecs.ServiceLoadBalancerArgs(
                    target_group_arn=alb_target_group_arn,
                    container_name="payment-service",
                    container_port=80
                )
            ],
            health_check_grace_period_seconds=60,
            deployment_minimum_healthy_percent=100,
            deployment_maximum_percent=200,
            capacity_provider_strategies=[
                aws.ecs.ServiceCapacityProviderStrategyArgs(
                    capacity_provider="FARGATE_SPOT" if use_spot else "FARGATE",
                    weight=1,
                    base=0
                )
            ] if use_spot else None,
            tags={
                "Name": f"payment-service-{environment_suffix}",
                "Environment": environment_suffix,
                "CostCenter": "payment-processing"
            },
            opts=ResourceOptions(parent=self, depends_on=[self.capacity_provider_spot] if use_spot else [])
        )

        # Create auto-scaling target
        self.scaling_target = aws.appautoscaling.Target(
            f"ecs-scaling-target-{environment_suffix}",
            max_capacity=10,
            min_capacity=2,
            resource_id=pulumi.Output.concat("service/", self.cluster.name, "/", self.service.name),
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs",
            opts=ResourceOptions(parent=self)
        )

        # Auto-scaling policy - CPU based
        cpu_metric_spec = (
            aws.appautoscaling
            .PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                predefined_metric_type="ECSServiceAverageCPUUtilization"
            )
        )
        cpu_config = aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
            target_value=70.0,  # Scale at 70% CPU
            predefined_metric_specification=cpu_metric_spec,
            scale_in_cooldown=60,  # Aggressive scale-in
            scale_out_cooldown=30  # Quick scale-out
        )
        self.scaling_policy_cpu = aws.appautoscaling.Policy(
            f"ecs-scaling-cpu-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=self.scaling_target.resource_id,
            scalable_dimension=self.scaling_target.scalable_dimension,
            service_namespace=self.scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=cpu_config,
            opts=ResourceOptions(parent=self)
        )

        # Auto-scaling policy - Memory based
        memory_metric_spec = (
            aws.appautoscaling
            .PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                predefined_metric_type="ECSServiceAverageMemoryUtilization"
            )
        )
        memory_config = aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
            target_value=80.0,  # Scale at 80% memory
            predefined_metric_specification=memory_metric_spec,
            scale_in_cooldown=60,
            scale_out_cooldown=30
        )
        self.scaling_policy_memory = aws.appautoscaling.Policy(
            f"ecs-scaling-memory-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=self.scaling_target.resource_id,
            scalable_dimension=self.scaling_target.scalable_dimension,
            service_namespace=self.scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=memory_config,
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({})
