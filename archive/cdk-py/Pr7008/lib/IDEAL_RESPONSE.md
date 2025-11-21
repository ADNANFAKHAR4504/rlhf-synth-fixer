# Transaction Processing Application Infrastructure - Implementation

This implementation provides a complete AWS CDK Python solution for deploying a containerized transaction processing application with blue-green deployment capabilities, RDS Aurora PostgreSQL database, and comprehensive monitoring.

## File: lib/tap_stack.py

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_rds as rds,
    aws_logs as logs,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
)
from constructs import Construct


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPC with 3 public and 3 private subnets across 3 AZs
        vpc = ec2.Vpc(
            self,
            f"vpc-{environment_suffix}",
            vpc_name=f"transaction-vpc-{environment_suffix}",
            max_azs=3,
            nat_gateways=1,  # Cost optimization: use 1 NAT Gateway instead of per-AZ
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"public-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"private-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
        )

        # Security group for ALB
        alb_security_group = ec2.SecurityGroup(
            self,
            f"alb-sg-{environment_suffix}",
            vpc=vpc,
            security_group_name=f"alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            allow_all_outbound=True,
        )
        alb_security_group.apply_removal_policy(RemovalPolicy.DESTROY)
        alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from anywhere",
        )

        # Security group for ECS tasks
        ecs_security_group = ec2.SecurityGroup(
            self,
            f"ecs-sg-{environment_suffix}",
            vpc=vpc,
            security_group_name=f"ecs-sg-{environment_suffix}",
            description="Security group for ECS tasks",
            allow_all_outbound=True,
        )
        ecs_security_group.apply_removal_policy(RemovalPolicy.DESTROY)
        ecs_security_group.add_ingress_rule(
            alb_security_group,
            ec2.Port.tcp(80),
            "Allow traffic from ALB",
        )

        # Security group for RDS
        rds_security_group = ec2.SecurityGroup(
            self,
            f"rds-sg-{environment_suffix}",
            vpc=vpc,
            security_group_name=f"rds-sg-{environment_suffix}",
            description="Security group for RDS Aurora cluster",
            allow_all_outbound=False,
        )
        rds_security_group.apply_removal_policy(RemovalPolicy.DESTROY)
        rds_security_group.add_ingress_rule(
            ecs_security_group,
            ec2.Port.tcp(5432),
            "Allow PostgreSQL traffic from ECS tasks",
        )

        # RDS Aurora PostgreSQL cluster
        db_cluster = rds.DatabaseCluster(
            self,
            f"aurora-cluster-{environment_suffix}",
            cluster_identifier=f"transaction-db-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_6
            ),
            credentials=rds.Credentials.from_generated_secret(
                username="dbadmin",
                secret_name=f"db-credentials-{environment_suffix}",
            ),
            instance_props=rds.InstanceProps(
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MEDIUM
                ),
                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
                vpc=vpc,
                security_groups=[rds_security_group],
            ),
            instances=2,  # 1 writer + 1 reader
            backup=rds.BackupProps(
                retention=Duration.days(1),  # Minimum retention for fast cleanup
            ),
            removal_policy=RemovalPolicy.DESTROY,
            deletion_protection=False,
            storage_encrypted=True,
        )

        # ECS Cluster
        cluster = ecs.Cluster(
            self,
            f"ecs-cluster-{environment_suffix}",
            cluster_name=f"transaction-cluster-{environment_suffix}",
            vpc=vpc,
        )

        # CloudWatch Log Group for ECS tasks
        log_group = logs.LogGroup(
            self,
            f"ecs-logs-{environment_suffix}",
            log_group_name=f"/ecs/transaction-app-{environment_suffix}",
            retention=logs.RetentionDays.THREE_DAYS,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # IAM role for ECS task execution
        task_execution_role = iam.Role(
            self,
            f"ecs-task-execution-role-{environment_suffix}",
            role_name=f"ecs-task-execution-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                ),
            ],
        )
        task_execution_role.apply_removal_policy(RemovalPolicy.DESTROY)

        # Grant access to RDS credentials secret
        db_cluster.secret.grant_read(task_execution_role)

        # IAM role for ECS task
        task_role = iam.Role(
            self,
            f"ecs-task-role-{environment_suffix}",
            role_name=f"ecs-task-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        )
        task_role.apply_removal_policy(RemovalPolicy.DESTROY)

        # Grant CloudWatch Logs permissions
        task_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=[log_group.log_group_arn],
            )
        )

        # ECS Task Definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"task-def-{environment_suffix}",
            family=f"transaction-app-{environment_suffix}",
            cpu=2048,  # 2 vCPU
            memory_limit_mib=4096,  # 4 GB
            execution_role=task_execution_role,
            task_role=task_role,
        )

        # Container definition
        container = task_definition.add_container(
            f"app-container-{environment_suffix}",
            container_name=f"transaction-app-{environment_suffix}",
            image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"),
            logging=ecs.LogDriver.aws_logs(
                stream_prefix="transaction-app",
                log_group=log_group,
            ),
            environment={
                "DB_HOST": db_cluster.cluster_endpoint.hostname,
                "DB_PORT": "5432",
            },
            secrets={
                "DB_PASSWORD": ecs.Secret.from_secrets_manager(db_cluster.secret, "password"),
                "DB_USERNAME": ecs.Secret.from_secrets_manager(db_cluster.secret, "username"),
            },
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=80, protocol=ecs.Protocol.TCP)
        )

        # Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"alb-{environment_suffix}",
            load_balancer_name=f"transaction-alb-{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        # Blue target group (80% traffic)
        blue_target_group = elbv2.ApplicationTargetGroup(
            self,
            f"blue-tg-{environment_suffix}",
            target_group_name=f"blue-tg-{environment_suffix}",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                enabled=True,
                interval=Duration.seconds(30),
                path="/",
                protocol=elbv2.Protocol.HTTP,
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
                timeout=Duration.seconds(5),
            ),
            deregistration_delay=Duration.seconds(30),
        )

        # Green target group (20% traffic)
        green_target_group = elbv2.ApplicationTargetGroup(
            self,
            f"green-tg-{environment_suffix}",
            target_group_name=f"green-tg-{environment_suffix}",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                enabled=True,
                interval=Duration.seconds(30),
                path="/",
                protocol=elbv2.Protocol.HTTP,
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
                timeout=Duration.seconds(5),
            ),
            deregistration_delay=Duration.seconds(30),
        )

        # ALB Listener with weighted target groups (80% blue, 20% green)
        listener = alb.add_listener(
            f"listener-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.weighted_forward(
                target_groups=[
                    elbv2.WeightedTargetGroup(
                        target_group=blue_target_group,
                        weight=80
                    ),
                    elbv2.WeightedTargetGroup(
                        target_group=green_target_group,
                        weight=20
                    )
                ]
            ),
        )

        # ECS Service (Blue deployment)
        blue_service = ecs.FargateService(
            self,
            f"blue-service-{environment_suffix}",
            service_name=f"transaction-blue-{environment_suffix}",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=2,
            min_healthy_percent=100,
            max_healthy_percent=200,
            assign_public_ip=False,
            security_groups=[ecs_security_group],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        )

        # Attach blue service to blue target group
        blue_service.attach_to_application_target_group(blue_target_group)

        # ECS Service (Green deployment)
        green_service = ecs.FargateService(
            self,
            f"green-service-{environment_suffix}",
            service_name=f"transaction-green-{environment_suffix}",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=1,
            min_healthy_percent=100,
            max_healthy_percent=200,
            assign_public_ip=False,
            security_groups=[ecs_security_group],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        )

        # Attach green service to green target group
        green_service.attach_to_application_target_group(green_target_group)

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            f"dashboard-{environment_suffix}",
            dashboard_name=f"transaction-app-{environment_suffix}",
        )

        # Add ECS task count metric
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ECS Task Count",
                left=[
                    blue_service.metric_cpu_utilization(),
                    green_service.metric_cpu_utilization(),
                ],
                right=[
                    cloudwatch.Metric(
                        namespace="ECS/ContainerInsights",
                        metric_name="RunningTaskCount",
                        dimensions_map={
                            "ServiceName": blue_service.service_name,
                            "ClusterName": cluster.cluster_name,
                        },
                        statistic="Average",
                    ),
                    cloudwatch.Metric(
                        namespace="ECS/ContainerInsights",
                        metric_name="RunningTaskCount",
                        dimensions_map={
                            "ServiceName": green_service.service_name,
                            "ClusterName": cluster.cluster_name,
                        },
                        statistic="Average",
                    ),
                ],
            )
        )

        # Add RDS connections metric
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="RDS Database Connections",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="DatabaseConnections",
                        dimensions_map={
                            "DBClusterIdentifier": db_cluster.cluster_identifier,
                        },
                        statistic="Average",
                    ),
                ],
            )
        )

        # Stack Outputs
        CfnOutput(
            self,
            "VPCId",
            value=vpc.vpc_id,
            description="VPC ID",
            export_name=f"vpc-id-{environment_suffix}",
        )

        CfnOutput(
            self,
            "ALBDNSName",
            value=alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name",
            export_name=f"alb-dns-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DatabaseEndpoint",
            value=db_cluster.cluster_endpoint.hostname,
            description="RDS Aurora Cluster Endpoint",
            export_name=f"db-endpoint-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DatabaseSecretArn",
            value=db_cluster.secret.secret_arn,
            description="RDS Database Credentials Secret ARN",
            export_name=f"db-secret-arn-{environment_suffix}",
        )

        CfnOutput(
            self,
            "ECSClusterName",
            value=cluster.cluster_name,
            description="ECS Cluster Name",
            export_name=f"ecs-cluster-{environment_suffix}",
        )

        CfnOutput(
            self,
            "BlueServiceName",
            value=blue_service.service_name,
            description="Blue ECS Service Name",
            export_name=f"blue-service-{environment_suffix}",
        )

        CfnOutput(
            self,
            "GreenServiceName",
            value=green_service.service_name,
            description="Green ECS Service Name",
            export_name=f"green-service-{environment_suffix}",
        )

        dashboard_url = (
            f"https://console.aws.amazon.com/cloudwatch/home?"
            f"region={self.region}#dashboards:name={dashboard.dashboard_name}"
        )
        CfnOutput(
            self,
            "CloudWatchDashboard",
            value=dashboard_url,
            description="CloudWatch Dashboard URL",
            export_name=f"dashboard-url-{environment_suffix}",
        )
```

## File: tap.py

```python
#!/usr/bin/env python3
"""
CDK application entry point for the Transaction Processing Application infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
from datetime import datetime, timezone

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
pr_number = os.getenv('PR_NUMBER', 'unknown')
team = os.getenv('TEAM', 'unknown')
created_at = datetime.now(timezone.utc).isoformat()

# Apply tags to all stacks in this app
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
Tags.of(app).add('PRNumber', pr_number)
Tags.of(app).add('Team', team)
Tags.of(app).add('CreatedAt', created_at)

# Initialize the stack with proper parameters
TapStack(
    app,
    STACK_NAME,
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION', 'us-east-1')
    ),
    description=f"Transaction Processing Application Infrastructure - {environment_suffix}",
)

app.synth()
```
