from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_ecr as ecr,
    aws_ecr_assets as ecr_assets,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    aws_cloudwatch as cloudwatch,
    aws_iam as iam,
    aws_applicationautoscaling as autoscaling,
    aws_logs as logs,
    CfnOutput,
    Duration,
    RemovalPolicy,
)
from constructs import Construct


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPC with public and private subnets across 3 AZs
        vpc = ec2.Vpc(
            self,
            f"vpc-{environment_suffix}",
            max_azs=3,
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"public-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"private-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"isolated-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # ECR Repository with lifecycle rules
        ecr_repository = ecr.Repository(
            self,
            f"ecr-repository-{environment_suffix}",
            repository_name=f"flask-api-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            lifecycle_rules=[
                ecr.LifecycleRule(
                    description="Keep only last 10 images",
                    max_image_count=10,
                    rule_priority=1,
                )
            ],
        )

        # Build Flask Docker image
        flask_image = ecr_assets.DockerImageAsset(
            self,
            f"flask-image-{environment_suffix}",
            directory="lib/container",
        )

        # RDS Aurora PostgreSQL cluster
        db_security_group = ec2.SecurityGroup(
            self,
            f"db-sg-{environment_suffix}",
            vpc=vpc,
            description="Security group for Aurora PostgreSQL cluster",
            allow_all_outbound=True,
        )

        aurora_cluster = rds.DatabaseCluster(
            self,
            f"aurora-cluster-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.of("15.8", "15")
            ),
            writer=rds.ClusterInstance.serverless_v2(
                f"writer-{environment_suffix}",
            ),
            readers=[
                rds.ClusterInstance.serverless_v2(
                    f"reader-{environment_suffix}",
                    scale_with_writer=True,
                )
            ],
            serverless_v2_min_capacity=0.5,
            serverless_v2_max_capacity=2,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[db_security_group],
            default_database_name="productdb",
            storage_encrypted=True,
            backup=rds.BackupProps(
                retention=Duration.days(7),
                preferred_window="03:00-04:00",
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Store database connection string in Secrets Manager
        db_connection_secret = secretsmanager.Secret(
            self,
            f"db-connection-secret-{environment_suffix}",
            secret_name=f"flask-api-db-connection-{environment_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "postgres"}',
                generate_string_key="password",
                exclude_punctuation=True,
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # ECS Cluster with Container Insights
        cluster = ecs.Cluster(
            self,
            f"ecs-cluster-{environment_suffix}",
            cluster_name=f"flask-api-cluster-{environment_suffix}",
            vpc=vpc,
            container_insights=True,
        )

        # Add Fargate capacity providers with Spot at 70% weight
        cluster.enable_fargate_capacity_providers()

        # Application Load Balancer
        alb_security_group = ec2.SecurityGroup(
            self,
            f"alb-sg-{environment_suffix}",
            vpc=vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True,
        )
        alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from internet",
        )

        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"alb-{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        # Task execution role
        task_execution_role = iam.Role(
            self,
            f"task-execution-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchLogsFullAccess"),
            ],
        )

        # Grant task execution role access to secrets
        db_connection_secret.grant_read(task_execution_role)
        aurora_cluster.secret.grant_read(task_execution_role)

        # Task role for application
        task_role = iam.Role(
            self,
            f"task-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess"),
            ],
        )

        # Grant task role access to secrets
        db_connection_secret.grant_read(task_role)

        # Task definition with Flask container and X-Ray sidecar
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"task-definition-{environment_suffix}",
            memory_limit_mib=1024,
            cpu=512,
            execution_role=task_execution_role,
            task_role=task_role,
        )

        # CloudWatch Logs for containers
        flask_log_group = logs.LogGroup(
            self,
            f"flask-logs-{environment_suffix}",
            log_group_name=f"/ecs/flask-api-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
        )

        xray_log_group = logs.LogGroup(
            self,
            f"xray-logs-{environment_suffix}",
            log_group_name=f"/ecs/xray-daemon-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Flask application container
        flask_container = task_definition.add_container(
            f"flask-app-{environment_suffix}",
            image=ecs.ContainerImage.from_docker_image_asset(flask_image),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="flask",
                log_group=flask_log_group,
            ),
            environment={
                "AWS_REGION": self.region,
                "AWS_XRAY_DAEMON_ADDRESS": "localhost:2000",
            },
            secrets={
                "DB_CONNECTION_STRING": ecs.Secret.from_secrets_manager(db_connection_secret),
                "DB_PASSWORD": ecs.Secret.from_secrets_manager(aurora_cluster.secret, "password"),
                "DB_HOST": ecs.Secret.from_secrets_manager(aurora_cluster.secret, "host"),
                "DB_PORT": ecs.Secret.from_secrets_manager(aurora_cluster.secret, "port"),
                "DB_NAME": ecs.Secret.from_secrets_manager(aurora_cluster.secret, "dbname"),
                "DB_USERNAME": ecs.Secret.from_secrets_manager(aurora_cluster.secret, "username"),
            },
        )

        flask_container.add_port_mappings(
            ecs.PortMapping(container_port=5000, protocol=ecs.Protocol.TCP)
        )

        # X-Ray daemon sidecar container
        xray_container = task_definition.add_container(
            f"xray-daemon-{environment_suffix}",
            image=ecs.ContainerImage.from_registry("public.ecr.aws/xray/aws-xray-daemon:latest"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="xray",
                log_group=xray_log_group,
            ),
            cpu=32,
            memory_reservation_mib=256,
        )

        xray_container.add_port_mappings(
            ecs.PortMapping(container_port=2000, protocol=ecs.Protocol.UDP)
        )

        # ECS Service security group
        service_security_group = ec2.SecurityGroup(
            self,
            f"service-sg-{environment_suffix}",
            vpc=vpc,
            description="Security group for ECS service",
            allow_all_outbound=True,
        )

        # Allow ALB to reach ECS tasks
        service_security_group.add_ingress_rule(
            alb_security_group,
            ec2.Port.tcp(5000),
            "Allow traffic from ALB",
        )

        # Allow ECS tasks to reach Aurora
        db_security_group.add_ingress_rule(
            service_security_group,
            ec2.Port.tcp(5432),
            "Allow traffic from ECS tasks",
        )

        # ECS Service with Fargate Spot
        service = ecs.FargateService(
            self,
            f"flask-service-{environment_suffix}",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=2,
            min_healthy_percent=50,
            max_healthy_percent=200,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[service_security_group],
            capacity_provider_strategies=[
                ecs.CapacityProviderStrategy(
                    capacity_provider="FARGATE_SPOT",
                    weight=70,
                    base=0,
                ),
                ecs.CapacityProviderStrategy(
                    capacity_provider="FARGATE",
                    weight=30,
                    base=1,
                ),
            ],
            enable_execute_command=True,
        )

        # Target group for API traffic
        api_target_group = elbv2.ApplicationTargetGroup(
            self,
            f"api-tg-{environment_suffix}",
            vpc=vpc,
            port=5000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
            deregistration_delay=Duration.seconds(30),
        )

        # Register ECS service with target group
        service.attach_to_application_target_group(api_target_group)

        # ALB Listener with path-based routing
        listener = alb.add_listener(
            f"listener-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.fixed_response(
                status_code=404,
                content_type="text/plain",
                message_body="Not Found",
            ),
        )

        # Route /api/* to API target group
        listener.add_action(
            f"api-route-{environment_suffix}",
            priority=10,
            conditions=[elbv2.ListenerCondition.path_patterns(["/api/*"])],
            action=elbv2.ListenerAction.forward([api_target_group]),
        )

        # Route /health to API target group
        listener.add_action(
            f"health-route-{environment_suffix}",
            priority=20,
            conditions=[elbv2.ListenerCondition.path_patterns(["/health"])],
            action=elbv2.ListenerAction.forward([api_target_group]),
        )

        # Auto Scaling - CPU based
        scaling = service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10,
        )

        scaling.scale_on_cpu_utilization(
            f"cpu-scaling-{environment_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60),
        )

        # CloudWatch Alarms
        # High CPU Alarm
        high_cpu_alarm = cloudwatch.Alarm(
            self,
            f"high-cpu-alarm-{environment_suffix}",
            metric=service.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alert when CPU utilization exceeds 80%",
        )

        # Low task count alarm
        low_task_alarm = cloudwatch.Alarm(
            self,
            f"low-task-alarm-{environment_suffix}",
            metric=service.metric("RunningTaskCount", statistic="Average"),
            threshold=2,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            alarm_description="Alert when running task count is less than 2",
        )

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            f"dashboard-{environment_suffix}",
            dashboard_name=f"flask-api-dashboard-{environment_suffix}",
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ECS Service CPU Utilization",
                left=[service.metric_cpu_utilization()],
            ),
            cloudwatch.GraphWidget(
                title="ECS Service Memory Utilization",
                left=[service.metric_memory_utilization()],
            ),
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Target Response Time",
                left=[
                    api_target_group.metric_target_response_time(
                        statistic="Average"
                    )
                ],
            ),
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[alb.metric_request_count(statistic="Sum")],
            ),
        )

        dashboard.add_widgets(
            cloudwatch.SingleValueWidget(
                title="Running Tasks",
                metrics=[service.metric("RunningTaskCount", statistic="Average")],
            ),
            cloudwatch.SingleValueWidget(
                title="Target Health Count",
                metrics=[
                    api_target_group.metric_healthy_host_count(statistic="Average")
                ],
            ),
        )

        # Stack Outputs
        CfnOutput(
            self,
            "ALBDnsName",
            value=alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name",
            export_name=f"alb-dns-name-{environment_suffix}",
        )

        CfnOutput(
            self,
            "ECRRepositoryUri",
            value=ecr_repository.repository_uri,
            description="ECR Repository URI",
            export_name=f"ecr-repository-uri-{environment_suffix}",
        )

        CfnOutput(
            self,
            "CloudWatchDashboardUrl",
            value=(
                f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}"
                f"#dashboards:name={dashboard.dashboard_name}"
            ),
            description="CloudWatch Dashboard URL",
            export_name=f"dashboard-url-{environment_suffix}",
        )

        CfnOutput(
            self,
            "ECSClusterName",
            value=cluster.cluster_name,
            description="ECS Cluster Name",
            export_name=f"ecs-cluster-name-{environment_suffix}",
        )

        CfnOutput(
            self,
            "ECSServiceName",
            value=service.service_name,
            description="ECS Service Name",
            export_name=f"ecs-service-name-{environment_suffix}",
        )

        CfnOutput(
            self,
            "AuroraDatabaseEndpoint",
            value=aurora_cluster.cluster_endpoint.hostname,
            description="Aurora Database Endpoint",
            export_name=f"aurora-endpoint-{environment_suffix}",
        )

        CfnOutput(
            self,
            "VpcId",
            value=vpc.vpc_id,
            description="VPC ID",
            export_name=f"vpc-id-{environment_suffix}",
        )
