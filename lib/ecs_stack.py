"""ecs_stack.py

This module defines the EcsStack for Amazon ECS Fargate infrastructure.
It creates VPC, ECS cluster, Fargate services, ALB, and target groups for
blue/green deployments with proper health checks and auto-scaling.
"""

import os
from aws_cdk import (
    Stack,
    Duration,
    aws_ecs as ecs,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_codedeploy as codedeploy,
    aws_iam as iam,
    aws_logs as logs,
    RemovalPolicy,
)
from constructs import Construct


class EcsStack(Stack):
    """Creates ECS Fargate infrastructure with VPC, ALB, and blue/green deployment support."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # VPC with 2 NAT gateways for high availability
        vpc = ec2.Vpc(
            self,
            f"Vpc{environment_suffix}",
            max_azs=2,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )

        # ECS Cluster with Container Insights
        cluster = ecs.Cluster(
            self,
            f"Cluster{environment_suffix}",
            cluster_name=f"app-cluster-{environment_suffix}",
            vpc=vpc,
            container_insights=True
        )

        # CloudWatch log group with retention
        log_group = logs.LogGroup(
            self,
            f"AppLogGroup{environment_suffix}",
            log_group_name=f"/ecs/app-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Task execution role
        execution_role = iam.Role(
            self,
            f"TaskExecutionRole{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ]
        )

        # Task definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"TaskDef{environment_suffix}",
            memory_limit_mib=512,
            cpu=256,
            execution_role=execution_role
        )

        # Get container image from context or environment variable
        container_image = self.node.try_get_context('containerImage') or \
            os.environ.get('CONTAINER_IMAGE', 'nginx:latest')

        # Container with health check
        container = task_definition.add_container(
            "AppContainer",
            image=ecs.ContainerImage.from_registry(container_image),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="app",
                log_group=log_group
            ),
            environment={
                "ENV": environment_suffix,
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            health_check=ecs.HealthCheck(
                command=["CMD-SHELL", "curl -f http://localhost/ || exit 1"],
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                retries=3,
                start_period=Duration.seconds(60)
            )
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=80, protocol=ecs.Protocol.TCP)
        )

        # Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"ALB{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            deletion_protection=False
        )

        # Blue target group for production traffic
        blue_target_group = elbv2.ApplicationTargetGroup(
            self,
            f"BlueTargetGroup{environment_suffix}",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            deregistration_delay=Duration.seconds(30),
            health_check=elbv2.HealthCheck(
                path="/",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            )
        )

        # Green target group for blue/green deployment
        green_target_group = elbv2.ApplicationTargetGroup(
            self,
            f"GreenTargetGroup{environment_suffix}",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            deregistration_delay=Duration.seconds(30),
            health_check=elbv2.HealthCheck(
                path="/",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            )
        )

        # Production listener (blue)
        listener = alb.add_listener(
            "Listener",
            port=80,
            default_target_groups=[blue_target_group]
        )

        # Test listener (green)
        test_listener = alb.add_listener(
            "TestListener",
            port=8080,
            default_target_groups=[green_target_group]
        )

        # Fargate service with CodeDeploy deployment controller for blue/green
        # Note: circuit_breaker is not compatible with CODE_DEPLOY controller
        service = ecs.FargateService(
            self,
            f"Service{environment_suffix}",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=2,
            deployment_controller=ecs.DeploymentController(
                type=ecs.DeploymentControllerType.CODE_DEPLOY
            ),
            assign_public_ip=False,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            enable_execute_command=True
        )

        # Attach to blue target group
        service.attach_to_application_target_group(blue_target_group)

        # Auto-scaling configuration
        scaling = service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10
        )

        scaling.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )

        scaling.scale_on_memory_utilization(
            "MemoryScaling",
            target_utilization_percent=80,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )

        # CodeDeploy Application for ECS
        application = codedeploy.EcsApplication(
            self,
            f"EcsApplication{environment_suffix}",
            application_name=f"ecs-app-{environment_suffix}"
        )

        # CodeDeploy Deployment Group for blue/green deployment
        deployment_group = codedeploy.EcsDeploymentGroup(
            self,
            f"EcsDeploymentGroup{environment_suffix}",
            application=application,
            deployment_group_name=f"ecs-deployment-{environment_suffix}",
            service=service,
            blue_green_deployment_config=codedeploy.EcsBlueGreenDeploymentConfig(
                blue_target_group=blue_target_group,
                green_target_group=green_target_group,
                listener=listener,
                test_listener=test_listener,
                termination_wait_time=Duration.minutes(5)
            ),
            deployment_config=codedeploy.EcsDeploymentConfig.LINEAR_10_PERCENT_EVERY_1_MINUTES,
            auto_rollback=codedeploy.AutoRollbackConfig(
                failed_deployment=True
            )
        )

        # Export values
        self.cluster = cluster
        self.service = service
        self.blue_target_group = blue_target_group
        self.green_target_group = green_target_group
        self.alb = alb
        self.listener = listener
        self.test_listener = test_listener
        self.application = application
        self.deployment_group = deployment_group
        self.task_definition = task_definition
