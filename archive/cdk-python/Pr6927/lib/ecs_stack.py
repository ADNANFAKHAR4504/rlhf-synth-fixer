"""ecs_stack.py
ECS services stack with auto-scaling policies.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_ecs as ecs,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_logs as logs,
)
from constructs import Construct


class EcsStackProps:
    """Properties for ECS Stack."""

    def __init__(
        self,
        environment_suffix: str,
        environment: str,
        vpc: ec2.IVpc
    ):
        self.environment_suffix = environment_suffix
        self.environment = environment
        self.vpc = vpc


class EcsStack(cdk.Stack):
    """
    ECS Stack implementing automatic scaling policies.
    Requirement 8: Implement automatic scaling policies for ECS services based on CPU/memory metrics
    Requirement 6: Configure CloudWatch Log Groups with 7-day retention
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: EcsStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = props.environment_suffix
        environment = props.environment

        # Cost allocation tags
        tags = {
            "Environment": environment,
            "Team": "payments",
            "CostCenter": "engineering",
            "Project": "payment-processing"
        }

        # Create ECS cluster
        self.cluster = ecs.Cluster(
            self,
            f"{environment}-payment-cluster-main",
            vpc=props.vpc,
            cluster_name=f"{environment}-payment-cluster"
        )

        # Create CloudWatch Log Group with 7-day retention (Requirement 6)
        log_group = logs.LogGroup(
            self,
            f"{environment}-payment-log-ecs",
            # 7-day retention (Requirement 6)
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Create Fargate task definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"{environment}-payment-task-api",
            cpu=256,
            memory_limit_mib=512
        )

        # Add container to task definition
        container = task_definition.add_container(
            "PaymentApiContainer",
            image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="payment-api",
                log_group=log_group
            )
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=80)
        )

        # Create Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"{environment}-payment-alb-main",
            vpc=props.vpc,
            internet_facing=True
        )

        # Create Fargate service
        service = ecs.FargateService(
            self,
            f"{environment}-payment-service-api",
            cluster=self.cluster,
            task_definition=task_definition,
            desired_count=2,
            service_name=f"{environment}-payment-service"
        )

        # Add target group and listener
        listener = alb.add_listener(
            "Listener",
            port=80,
            open=True
        )

        listener.add_targets(
            "ECS",
            port=80,
            targets=[service]
        )

        # Implement auto-scaling policies (Requirement 8)
        scaling = service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10
        )

        # CPU-based auto-scaling (Requirement 8)
        scaling.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=70,
            scale_in_cooldown=cdk.Duration.seconds(60),
            scale_out_cooldown=cdk.Duration.seconds(60)
        )

        # Memory-based auto-scaling (Requirement 8)
        scaling.scale_on_memory_utilization(
            "MemoryScaling",
            target_utilization_percent=80,
            scale_in_cooldown=cdk.Duration.seconds(60),
            scale_out_cooldown=cdk.Duration.seconds(60)
        )

        # Apply cost allocation tags
        for key, value in tags.items():
            cdk.Tags.of(self.cluster).add(key, value)
            cdk.Tags.of(service).add(key, value)

        # Outputs
        cdk.CfnOutput(
            self,
            "ClusterName",
            value=self.cluster.cluster_name,
            export_name=f"{environment}-payment-cluster-name"
        )

        cdk.CfnOutput(
            self,
            "ServiceName",
            value=service.service_name,
            export_name=f"{environment}-payment-service-name"
        )

        cdk.CfnOutput(
            self,
            "LoadBalancerDns",
            value=alb.load_balancer_dns_name,
            export_name=f"{environment}-payment-alb-dns"
        )
