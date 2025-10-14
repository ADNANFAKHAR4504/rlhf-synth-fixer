"""compute_construct.py
ECS Fargate service with Application Load Balancer.
"""

from typing import Optional
from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_ecs as ecs,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_logs as logs,
    aws_iam as iam,
    aws_s3 as s3,
    aws_rds as rds,
    aws_sns as sns
)


class ComputeConstruct(Construct):
    """
    Creates ECS Fargate service with Application Load Balancer for healthcare application.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc: ec2.Vpc,
        alb_security_group: ec2.SecurityGroup,
        ecs_security_group: ec2.SecurityGroup,
        data_bucket: s3.Bucket,
        db_cluster: rds.DatabaseCluster,
        alarm_topic: sns.Topic,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Create ECS cluster
        self.ecs_cluster = ecs.Cluster(
            self,
            f"ECSCluster-{environment_suffix}",
            cluster_name=f"healthcare-cluster-{environment_suffix}",
            vpc=vpc,
            container_insights=True
        )

        # Create task execution role
        task_execution_role = iam.Role(
            self,
            f"TaskExecutionRole-{environment_suffix}",
            role_name=f"ecs-task-execution-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ]
        )

        # Grant secrets access to execution role
        db_cluster.secret.grant_read(task_execution_role)

        # Create task role
        task_role = iam.Role(
            self,
            f"TaskRole-{environment_suffix}",
            role_name=f"ecs-task-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
        )

        # Grant S3 access to task role
        data_bucket.grant_read_write(task_role)

        # Create log group for ECS tasks
        log_group = logs.LogGroup(
            self,
            f"ECSLogGroup-{environment_suffix}",
            log_group_name=f"/ecs/healthcare-app-{environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Create Fargate task definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"TaskDefinition-{environment_suffix}",
            family=f"healthcare-task-{environment_suffix}",
            cpu=256,
            memory_limit_mib=512,
            execution_role=task_execution_role,
            task_role=task_role
        )

        # Add container to task definition
        container = task_definition.add_container(
            f"AppContainer-{environment_suffix}",
            container_name="healthcare-app",
            image=ecs.ContainerImage.from_registry("nginx:latest"),  # Placeholder
            logging=ecs.LogDriver.aws_logs(
                stream_prefix="healthcare-app",
                log_group=log_group
            ),
            environment={
                "ENVIRONMENT": environment_suffix,
                "BUCKET_NAME": data_bucket.bucket_name,
                "DB_ENDPOINT": db_cluster.cluster_endpoint.hostname
            },
            secrets={
                "DB_SECRET_ARN": ecs.Secret.from_secrets_manager(db_cluster.secret)
            },
            health_check=ecs.HealthCheck(
                command=["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
                interval=cdk.Duration.seconds(30),
                timeout=cdk.Duration.seconds(5),
                retries=3,
                start_period=cdk.Duration.seconds(60)
            )
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=8080, protocol=ecs.Protocol.TCP)
        )

        # Create Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            f"ALB-{environment_suffix}",
            load_balancer_name=f"healthcare-alb-{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            deletion_protection=False
        )

        # Create target group
        target_group = elbv2.ApplicationTargetGroup(
            self,
            f"TargetGroup-{environment_suffix}",
            target_group_name=f"healthcare-tg-{environment_suffix}",
            port=8080,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=vpc,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                enabled=True,
                path="/health",
                protocol=elbv2.Protocol.HTTP,
                port="8080",
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
                timeout=cdk.Duration.seconds(5),
                interval=cdk.Duration.seconds(30)
            ),
            deregistration_delay=cdk.Duration.seconds(30)
        )

        # Add listener to ALB
        listener = self.alb.add_listener(
            f"HTTPListener-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )

        # Create ECS Fargate service
        self.ecs_service = ecs.FargateService(
            self,
            f"FargateService-{environment_suffix}",
            service_name=f"healthcare-service-{environment_suffix}",
            cluster=self.ecs_cluster,
            task_definition=task_definition,
            desired_count=2,
            security_groups=[ecs_security_group],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            assign_public_ip=False,
            health_check_grace_period=cdk.Duration.seconds(60),
            enable_execute_command=True
        )

        # Attach service to target group
        self.ecs_service.attach_to_application_target_group(target_group)

        # Configure auto-scaling
        scaling = self.ecs_service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10
        )

        scaling.scale_on_cpu_utilization(
            f"CPUScaling-{environment_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=cdk.Duration.seconds(60),
            scale_out_cooldown=cdk.Duration.seconds(60)
        )

        scaling.scale_on_memory_utilization(
            f"MemoryScaling-{environment_suffix}",
            target_utilization_percent=80,
            scale_in_cooldown=cdk.Duration.seconds(60),
            scale_out_cooldown=cdk.Duration.seconds(60)
        )
