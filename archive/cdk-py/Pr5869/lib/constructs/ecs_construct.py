"""ecs_construct.py

Custom CDK construct for ECS Fargate with ALB.
"""

from aws_cdk import (
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_iam as iam,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class EcsConstruct(Construct):
    """Custom construct for ECS Fargate service."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        environment_suffix: str,
        min_capacity: int,
        max_capacity: int,
        security_group: ec2.SecurityGroup,
        database: rds.DatabaseCluster,
        session_table: dynamodb.Table,
        queue: sqs.Queue,
        **kwargs
    ):
        super().__init__(scope, construct_id)

        self.cluster = ecs.Cluster(
            self,
            f"PaymentCluster-{environment_suffix}",
            cluster_name=f"payment-cluster-{environment_suffix}",
            vpc=vpc,
            container_insights=True
        )

        execution_role = iam.Role(
            self,
            f"TaskExecutionRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ]
        )

        task_role = iam.Role(
            self,
            f"TaskRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
        )

        database.secret.grant_read(task_role)
        session_table.grant_read_write_data(task_role)
        queue.grant_send_messages(task_role)
        queue.grant_consume_messages(task_role)

        log_group = logs.LogGroup(
            self,
            f"PaymentLogGroup-{environment_suffix}",
            log_group_name=f"/ecs/payment-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY
        )

        task_definition = ecs.FargateTaskDefinition(
            self,
            f"PaymentTaskDef-{environment_suffix}",
            memory_limit_mib=2048,
            cpu=1024,
            execution_role=execution_role,
            task_role=task_role
        )

        container = task_definition.add_container(
            f"PaymentContainer-{environment_suffix}",
            image=ecs.ContainerImage.from_registry("public.ecr.aws/docker/library/nginx:latest"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="payment",
                log_group=log_group
            ),
            environment={
                "ENVIRONMENT": environment_suffix,
                "QUEUE_URL": queue.queue_url,
                "SESSION_TABLE": session_table.table_name
            },
            secrets={
                "DB_HOST": ecs.Secret.from_secrets_manager(database.secret, "host"),
                "DB_USERNAME": ecs.Secret.from_secrets_manager(database.secret, "username"),
                "DB_PASSWORD": ecs.Secret.from_secrets_manager(database.secret, "password")
            }
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=80, protocol=ecs.Protocol.TCP)
        )

        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            f"PaymentALB-{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            load_balancer_name=f"payment-alb-{environment_suffix}"
        )

        target_group = elbv2.ApplicationTargetGroup(
            self,
            f"PaymentTargetGroup-{environment_suffix}",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            )
        )

        self.alb.add_listener(
            f"PaymentListener-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )

        self.service = ecs.FargateService(
            self,
            f"PaymentService-{environment_suffix}",
            cluster=self.cluster,
            task_definition=task_definition,
            desired_count=min_capacity,
            assign_public_ip=False,
            security_groups=[security_group],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            service_name=f"payment-service-{environment_suffix}"
        )

        self.service.attach_to_application_target_group(target_group)

        scaling = self.service.auto_scale_task_count(
            min_capacity=min_capacity,
            max_capacity=max_capacity
        )

        scaling.scale_on_cpu_utilization(
            f"CpuScaling-{environment_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )

        scaling.scale_on_memory_utilization(
            f"MemoryScaling-{environment_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )