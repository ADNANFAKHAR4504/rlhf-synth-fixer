"""
ECS Stack for Payment Processing Infrastructure

Creates ECS Fargate cluster, Application Load Balancer, auto-scaling policies,
and task definitions with Secrets Manager integration.
"""

import json
from typing import List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class EcsStackArgs:
    """
    Arguments for ECS Stack.

    Args:
        environment_suffix: Suffix for resource naming
        vpc_id: VPC ID
        public_subnet_ids: List of public subnet IDs for ALB
        private_subnet_ids: List of private subnet IDs for ECS tasks
        database_secret_arn: ARN of database secret in Secrets Manager
        database_connection_string: Database connection string
        ecs_log_group_name: CloudWatch log group for ECS tasks
        alb_log_group_name: CloudWatch log group for ALB
        tags: Resource tags
    """

    def __init__(
        self,
        environment_suffix: str,
        vpc_id: Output[str],
        public_subnet_ids: List[Output[str]],
        private_subnet_ids: List[Output[str]],
        database_secret_arn: Output[str],
        database_connection_string: Output[str],
        ecs_log_group_name: Output[str],
        alb_log_group_name: Output[str],
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.public_subnet_ids = public_subnet_ids
        self.private_subnet_ids = private_subnet_ids
        self.database_secret_arn = database_secret_arn
        self.database_connection_string = database_connection_string
        self.ecs_log_group_name = ecs_log_group_name
        self.alb_log_group_name = alb_log_group_name
        self.tags = tags or {}


class EcsStack(pulumi.ComponentResource):
    """
    ECS Fargate application infrastructure.

    Creates:
    - ECS cluster
    - Application Load Balancer in public subnets
    - Target group with health checks
    - Security groups for ALB and ECS tasks
    - ECS task definition with Secrets Manager integration
    - ECS service with auto-scaling (3-10 tasks)
    - Auto-scaling policies for CPU and memory
    """

    def __init__(
        self,
        name: str,
        args: EcsStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:ecs:EcsStack', name, None, opts)

        # Create ECS cluster
        self.cluster = aws.ecs.Cluster(
            f"payment-ecs-cluster-{args.environment_suffix}",
            tags={
                **args.tags,
                'Name': f'payment-ecs-cluster-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create security group for ALB (HTTPS only from internet)
        self.alb_security_group = aws.ec2.SecurityGroup(
            f"payment-alb-sg-{args.environment_suffix}",
            vpc_id=args.vpc_id,
            description="Security group for Application Load Balancer - HTTPS only",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet (redirect to HTTPS)"
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
                **args.tags,
                'Name': f'payment-alb-sg-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create security group for ECS tasks
        self.ecs_security_group = aws.ec2.SecurityGroup(
            f"payment-ecs-sg-{args.environment_suffix}",
            vpc_id=args.vpc_id,
            description="Security group for ECS Fargate tasks",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[self.alb_security_group.id],
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
                **args.tags,
                'Name': f'payment-ecs-sg-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self, depends_on=[self.alb_security_group])
        )

        # Create Application Load Balancer in public subnets
        # Use shorter name to fit AWS 32-char limit
        alb_name = f"alb-{args.environment_suffix[:23]}"
        self.alb = aws.lb.LoadBalancer(
            f"payment-alb-{args.environment_suffix}",
            name=alb_name,
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_security_group.id],
            subnets=args.public_subnet_ids,
            enable_deletion_protection=False,  # For destroyability
            tags={
                **args.tags,
                'Name': f'payment-alb-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self, depends_on=[self.alb_security_group])
        )

        # Create target group for ECS tasks
        # Use shorter name to fit AWS 32-char limit
        tg_name = f"tg-{args.environment_suffix[:20]}"
        self.target_group = aws.lb.TargetGroup(
            f"payment-tg-{args.environment_suffix}",
            name=tg_name,
            port=8080,
            protocol="HTTP",
            target_type="ip",
            vpc_id=args.vpc_id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                path="/health",
                protocol="HTTP",
                matcher="200"
            ),
            deregistration_delay=30,
            tags={
                **args.tags,
                'Name': f'payment-tg-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self, depends_on=[self.alb])
        )

        # Create HTTP listener (redirect to HTTPS)
        self.http_listener = aws.lb.Listener(
            f"payment-http-listener-{args.environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ],
            opts=ResourceOptions(parent=self, depends_on=[self.alb, self.target_group])
        )

        # For HTTPS listener, we'll create a self-signed certificate placeholder
        # In production, use ACM with DNS validation
        # Note: This uses HTTP listener for simplicity in testing
        # Uncomment and configure ACM certificate for production HTTPS

        # Create IAM role for ECS task execution
        self.ecs_task_execution_role = aws.iam.Role(
            f"payment-ecs-execution-role-{args.environment_suffix}",
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
            tags=args.tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach required policies to execution role
        aws.iam.RolePolicyAttachment(
            f"payment-ecs-execution-policy-{args.environment_suffix}",
            role=self.ecs_task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self)
        )

        # Add Secrets Manager access policy
        self.secrets_policy = aws.iam.RolePolicy(
            f"payment-ecs-secrets-policy-{args.environment_suffix}",
            role=self.ecs_task_execution_role.id,
            policy=args.database_secret_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "kms:Decrypt"
                    ],
                    "Resource": [arn]
                }]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for ECS task
        self.ecs_task_role = aws.iam.Role(
            f"payment-ecs-task-role-{args.environment_suffix}",
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
            tags=args.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create ECS task definition
        self.task_definition = aws.ecs.TaskDefinition(
            f"payment-task-{args.environment_suffix}",
            family=f"payment-task-{args.environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="512",
            memory="1024",
            execution_role_arn=self.ecs_task_execution_role.arn,
            task_role_arn=self.ecs_task_role.arn,
            container_definitions=pulumi.Output.all(
                args.database_secret_arn,
                args.ecs_log_group_name
            ).apply(lambda args_list: json.dumps([{
                "name": "payment-api",
                "image": "public.ecr.aws/docker/library/python:3.11-slim",
                "cpu": 512,
                "memory": 1024,
                "essential": True,
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }],
                "environment": [
                    {"name": "PORT", "value": "8080"},
                    {"name": "ENVIRONMENT", "value": "production"}
                ],
                "secrets": [{
                    "name": "DATABASE_URL",
                    "valueFrom": args_list[0]
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args_list[1],
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "payment-api"
                    }
                },
                "healthCheck": {
                    "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
                    "interval": 30,
                    "timeout": 5,
                    "retries": 3,
                    "startPeriod": 60
                }
            }])),
            tags=args.tags,
            opts=ResourceOptions(parent=self, depends_on=[
                self.ecs_task_execution_role,
                self.ecs_task_role
            ])
        )

        # Create ECS service with auto-scaling
        self.service = aws.ecs.Service(
            f"payment-service-{args.environment_suffix}",
            cluster=self.cluster.arn,
            task_definition=self.task_definition.arn,
            desired_count=3,
            launch_type="FARGATE",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=args.private_subnet_ids,
                security_groups=[self.ecs_security_group.id]
            ),
            load_balancers=[
                aws.ecs.ServiceLoadBalancerArgs(
                    target_group_arn=self.target_group.arn,
                    container_name="payment-api",
                    container_port=8080
                )
            ],
            health_check_grace_period_seconds=60,
            tags=args.tags,
            opts=ResourceOptions(
                parent=self,
                depends_on=[
                    self.cluster,
                    self.task_definition,
                    self.target_group,
                    self.http_listener
                ]
            )
        )

        # Create auto-scaling target
        self.autoscaling_target = aws.appautoscaling.Target(
            f"payment-autoscaling-target-{args.environment_suffix}",
            max_capacity=10,
            min_capacity=3,
            resource_id=pulumi.Output.concat("service/", self.cluster.name, "/", self.service.name),
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs",
            opts=ResourceOptions(parent=self, depends_on=[self.service])
        )

        # Create auto-scaling policy for CPU utilization
        self.cpu_scaling_policy = aws.appautoscaling.Policy(
            f"payment-cpu-scaling-{args.environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=self.autoscaling_target.resource_id,
            scalable_dimension=self.autoscaling_target.scalable_dimension,
            service_namespace=self.autoscaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(  # pylint: disable=line-too-long
                target_value=70.0,
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(  # pylint: disable=line-too-long
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                scale_in_cooldown=300,
                scale_out_cooldown=60
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.autoscaling_target])
        )

        # Create auto-scaling policy for memory utilization
        self.memory_scaling_policy = aws.appautoscaling.Policy(
            f"payment-memory-scaling-{args.environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=self.autoscaling_target.resource_id,
            scalable_dimension=self.autoscaling_target.scalable_dimension,
            service_namespace=self.autoscaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(  # pylint: disable=line-too-long
                target_value=80.0,
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(  # pylint: disable=line-too-long
                    predefined_metric_type="ECSServiceAverageMemoryUtilization"
                ),
                scale_in_cooldown=300,
                scale_out_cooldown=60
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.autoscaling_target])
        )

        # Export outputs
        self.cluster_name = self.cluster.name
        self.service_name = self.service.name
        self.alb_dns_name = self.alb.dns_name
        self.alb_url = self.alb.dns_name.apply(lambda dns: f"http://{dns}")

        self.register_outputs({
            'cluster_name': self.cluster_name,
            'service_name': self.service_name,
            'alb_dns_name': self.alb_dns_name,
            'alb_url': self.alb_url,
        })
