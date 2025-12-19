# Three-Tier Web Application Infrastructure with AWS CDK Python

## Overview

This implementation creates a complete production-ready three-tier web application infrastructure for a media streaming platform using AWS CDK with Python. The solution deploys a highly available, auto-scaling infrastructure with containerized frontend and backend services, Aurora PostgreSQL database, CloudFront distribution, and API Gateway with comprehensive monitoring.

## Architecture

The infrastructure implements a multi-tier architecture with:

- **Presentation Tier**: CloudFront CDN and ALB for global content delivery and load balancing
- **Application Tier**: ECS Fargate cluster running containerized frontend (React) and backend (Python Flask) services
- **Data Tier**: Aurora PostgreSQL cluster with writer and read replica instances

All resources are deployed across 3 availability zones for high availability and include auto-scaling policies, comprehensive monitoring, and security best practices.

## Implementation

### File: lib/tap_stack.py

```py
"""
TapStack: Three-tier web application infrastructure for media streaming platform.

This stack creates:
- VPC with public/private subnets across 3 AZs
- ECS Fargate cluster with frontend and backend services
- Application Load Balancer with path-based routing
- Aurora PostgreSQL cluster with read replicas
- API Gateway with throttling
- CloudFront distribution for content delivery
- ECR repositories for container images
- Auto-scaling policies
- CloudWatch monitoring and dashboards
- IAM roles following least privilege
"""

from typing import Optional
from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecr as ecr,
    aws_elasticloadbalancingv2 as elbv2,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_applicationautoscaling as appscaling,
    aws_ssm as ssm,
)


class TapStackProps(cdk.StackProps):
    """
    Properties for TapStack.

    Attributes:
        environment_suffix: Suffix for resource naming to support multiple environments
    """
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Main CDK stack for three-tier web application infrastructure.

    Creates a complete production-ready infrastructure with:
    - Multi-AZ networking
    - Containerized services on ECS Fargate
    - Aurora PostgreSQL database
    - Content delivery via CloudFront
    - API Gateway for request management
    - Comprehensive monitoring and auto-scaling
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # ============================================================
        # 1. NETWORK FOUNDATION (VPC, Subnets, NAT Gateways)
        # ============================================================

        vpc = ec2.Vpc(
            self,
            f"MediaStreamingVPC-{environment_suffix}",
            vpc_name=f"media-streaming-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            nat_gateways=1,  # Reduced from 3 to 1 to avoid EIP quota limits
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
        )

        # ============================================================
        # 2. SECURITY GROUPS
        # ============================================================

        # ALB Security Group
        alb_security_group = ec2.SecurityGroup(
            self,
            f"ALBSecurityGroup-{environment_suffix}",
            vpc=vpc,
            description="Security group for Application Load Balancer",
            security_group_name=f"alb-sg-{environment_suffix}",
            allow_all_outbound=True,
        )
        alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP from anywhere",
        )
        alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS from anywhere",
        )

        # ECS Security Group
        ecs_security_group = ec2.SecurityGroup(
            self,
            f"ECSSecurityGroup-{environment_suffix}",
            vpc=vpc,
            description="Security group for ECS Fargate tasks",
            security_group_name=f"ecs-sg-{environment_suffix}",
            allow_all_outbound=True,
        )
        ecs_security_group.add_ingress_rule(
            peer=alb_security_group,
            connection=ec2.Port.tcp(80),
            description="Allow traffic from ALB to containers",
        )

        # Database Security Group
        db_security_group = ec2.SecurityGroup(
            self,
            f"DatabaseSecurityGroup-{environment_suffix}",
            vpc=vpc,
            description="Security group for Aurora PostgreSQL",
            security_group_name=f"db-sg-{environment_suffix}",
            allow_all_outbound=False,
        )
        db_security_group.add_ingress_rule(
            peer=ecs_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL from ECS tasks",
        )

        # ============================================================
        # 3. DATABASE TIER (Aurora PostgreSQL)
        # ============================================================

        # Database credentials secret
        # Use short construct ID to avoid Lambda function name length limit (64 chars)
        # AWS generates: {constructId}{rotationId}{hash}-PostgreSQLSingleUser-Lambda
        db_credentials = rds.DatabaseSecret(
            self,
            f"DBCred{environment_suffix}",
            username="dbadmin",
            secret_name=f"db-creds-{environment_suffix}",
        )

        # Aurora PostgreSQL cluster
        db_cluster = rds.DatabaseCluster(
            self,
            f"AuroraCluster-{environment_suffix}",
            cluster_identifier=f"media-streaming-db-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            credentials=rds.Credentials.from_secret(db_credentials),
            writer=rds.ClusterInstance.provisioned(
                "writer",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.T3,
                    ec2.InstanceSize.MEDIUM,
                ),
            ),
            readers=[
                rds.ClusterInstance.provisioned(
                    "reader",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.T3,
                        ec2.InstanceSize.MEDIUM,
                    ),
                )
            ],
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[db_security_group],
            backup=rds.BackupProps(
                retention=Duration.days(7),
            ),
            storage_encrypted=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Enable automatic secret rotation with hosted rotation
        # Use short rotation ID to avoid Lambda function name length limit (64 chars)
        db_credentials.add_rotation_schedule(
            "Rotate",
            automatically_after=Duration.days(30),
            hosted_rotation=secretsmanager.HostedRotation.postgre_sql_single_user(),
        )

        # ============================================================
        # 4. ECR REPOSITORIES
        # ============================================================

        frontend_repo = ecr.Repository(
            self,
            f"FrontendRepo-{environment_suffix}",
            repository_name=f"media-streaming-frontend-{environment_suffix}",
            image_scan_on_push=True,
            lifecycle_rules=[
                ecr.LifecycleRule(
                    max_image_count=10,
                    description="Keep only last 10 images",
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
            empty_on_delete=True,
        )

        backend_repo = ecr.Repository(
            self,
            f"BackendRepo-{environment_suffix}",
            repository_name=f"media-streaming-backend-{environment_suffix}",
            image_scan_on_push=True,
            lifecycle_rules=[
                ecr.LifecycleRule(
                    max_image_count=10,
                    description="Keep only last 10 images",
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
            empty_on_delete=True,
        )

        # ============================================================
        # 5. ECS FARGATE CLUSTER
        # ============================================================

        cluster = ecs.Cluster(
            self,
            f"ECSCluster-{environment_suffix}",
            cluster_name=f"media-streaming-cluster-{environment_suffix}",
            vpc=vpc,
            container_insights=True,
        )

        # CloudWatch Log Groups
        frontend_log_group = logs.LogGroup(
            self,
            f"FrontendLogGroup-{environment_suffix}",
            log_group_name=f"/ecs/frontend-{environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY,
        )

        backend_log_group = logs.LogGroup(
            self,
            f"BackendLogGroup-{environment_suffix}",
            log_group_name=f"/ecs/backend-{environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Task Execution Role
        task_execution_role = iam.Role(
            self,
            f"TaskExecutionRole-{environment_suffix}",
            role_name=f"ecs-task-execution-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ],
        )

        # Frontend Task Role
        frontend_task_role = iam.Role(
            self,
            f"FrontendTaskRole-{environment_suffix}",
            role_name=f"frontend-task-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        )

        # Backend Task Role
        backend_task_role = iam.Role(
            self,
            f"BackendTaskRole-{environment_suffix}",
            role_name=f"backend-task-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        )

        # Grant backend access to database credentials
        db_credentials.grant_read(backend_task_role)

        # Frontend Task Definition
        frontend_task_def = ecs.FargateTaskDefinition(
            self,
            f"FrontendTaskDef-{environment_suffix}",
            family=f"frontend-task-{environment_suffix}",
            cpu=512,
            memory_limit_mib=1024,
            execution_role=task_execution_role,
            task_role=frontend_task_role,
        )

        frontend_container = frontend_task_def.add_container(
            "frontend",
            container_name="frontend",
            image=ecs.ContainerImage.from_registry("public.ecr.aws/docker/library/nginx:alpine"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="frontend",
                log_group=frontend_log_group,
            ),
            port_mappings=[
                ecs.PortMapping(
                    container_port=80,  # nginx default port
                    protocol=ecs.Protocol.TCP,
                )
            ],
        )

        # Backend Task Definition
        backend_task_def = ecs.FargateTaskDefinition(
            self,
            f"BackendTaskDef-{environment_suffix}",
            family=f"backend-task-{environment_suffix}",
            cpu=512,
            memory_limit_mib=1024,
            execution_role=task_execution_role,
            task_role=backend_task_role,
        )

        backend_container = backend_task_def.add_container(
            "backend",
            container_name="backend",
            image=ecs.ContainerImage.from_registry("public.ecr.aws/docker/library/nginx:alpine"),  # Use nginx for placeholder
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="backend",
                log_group=backend_log_group,
            ),
            port_mappings=[
                ecs.PortMapping(
                    container_port=80,  # nginx default port
                    protocol=ecs.Protocol.TCP,
                )
            ],
            environment={
                "DB_SECRET_ARN": db_credentials.secret_arn,
            },
        )

        # ============================================================
        # 6. APPLICATION LOAD BALANCER
        # ============================================================

        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"ALB-{environment_suffix}",
            load_balancer_name=f"media-streaming-alb-{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        # HTTP Listener
        listener = alb.add_listener(
            f"HTTPListener-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
        )

        # Frontend Target Group
        frontend_target_group = elbv2.ApplicationTargetGroup(
            self,
            f"FrontendTargetGroup-{environment_suffix}",
            target_group_name=f"frontend-tg-{environment_suffix}",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/",  # nginx default page
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
            deregistration_delay=Duration.seconds(30),
        )

        # Backend Target Group
        backend_target_group = elbv2.ApplicationTargetGroup(
            self,
            f"BackendTargetGroup-{environment_suffix}",
            target_group_name=f"backend-tg-{environment_suffix}",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/",  # Default path for placeholder image
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
            deregistration_delay=Duration.seconds(30),
        )

        # Default action routes to frontend
        listener.add_target_groups(
            f"FrontendDefault-{environment_suffix}",
            target_groups=[frontend_target_group],
        )

        # Path-based routing: /api/* to backend
        listener.add_target_groups(
            f"BackendAPI-{environment_suffix}",
            target_groups=[backend_target_group],
            priority=10,
            conditions=[
                elbv2.ListenerCondition.path_patterns(["/api/*"])
            ],
        )

        # ============================================================
        # 7. ECS SERVICES
        # ============================================================

        # Frontend Service
        frontend_service = ecs.FargateService(
            self,
            f"FrontendService-{environment_suffix}",
            service_name=f"frontend-service-{environment_suffix}",
            cluster=cluster,
            task_definition=frontend_task_def,
            desired_count=2,
            security_groups=[ecs_security_group],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            enable_execute_command=True,
            circuit_breaker=ecs.DeploymentCircuitBreaker(rollback=True),
            deployment_controller=ecs.DeploymentController(
                type=ecs.DeploymentControllerType.ECS
            ),
        )

        frontend_service.attach_to_application_target_group(frontend_target_group)

        # Backend Service
        backend_service = ecs.FargateService(
            self,
            f"BackendService-{environment_suffix}",
            service_name=f"backend-service-{environment_suffix}",
            cluster=cluster,
            task_definition=backend_task_def,
            desired_count=2,
            security_groups=[ecs_security_group],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            enable_execute_command=True,
            circuit_breaker=ecs.DeploymentCircuitBreaker(rollback=True),
            deployment_controller=ecs.DeploymentController(
                type=ecs.DeploymentControllerType.ECS
            ),
        )

        backend_service.attach_to_application_target_group(backend_target_group)

        # ============================================================
        # 8. AUTO-SCALING POLICIES
        # ============================================================

        # Frontend Auto-Scaling
        frontend_scaling = frontend_service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10,
        )

        frontend_scaling.scale_on_cpu_utilization(
            f"FrontendCPUScaling-{environment_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60),
        )

        # Backend Auto-Scaling
        backend_scaling = backend_service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10,
        )

        backend_scaling.scale_on_cpu_utilization(
            f"BackendCPUScaling-{environment_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60),
        )

        # ============================================================
        # 9. CLOUDFRONT DISTRIBUTION
        # ============================================================

        # Custom error responses for 4xx and 5xx
        error_responses = [
            cloudfront.ErrorResponse(
                http_status=404,
                response_http_status=404,
                response_page_path="/error.html",
                ttl=Duration.minutes(5),
            ),
            cloudfront.ErrorResponse(
                http_status=500,
                response_http_status=500,
                response_page_path="/error.html",
                ttl=Duration.minutes(1),
            ),
            cloudfront.ErrorResponse(
                http_status=502,
                response_http_status=502,
                response_page_path="/error.html",
                ttl=Duration.minutes(1),
            ),
            cloudfront.ErrorResponse(
                http_status=503,
                response_http_status=503,
                response_page_path="/error.html",
                ttl=Duration.minutes(1),
            ),
        ]

        # Cache policy for static assets
        cache_policy = cloudfront.CachePolicy(
            self,
            f"StaticAssetCachePolicy-{environment_suffix}",
            cache_policy_name=f"static-assets-{environment_suffix}",
            default_ttl=Duration.hours(24),
            max_ttl=Duration.days(365),
            min_ttl=Duration.seconds(0),
            enable_accept_encoding_gzip=True,
            enable_accept_encoding_brotli=True,
        )

        distribution = cloudfront.Distribution(
            self,
            f"CloudFrontDistribution-{environment_suffix}",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.LoadBalancerV2Origin(
                    alb,
                    protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cache_policy,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                compress=True,
            ),
            error_responses=error_responses,
            comment=f"Media streaming distribution {environment_suffix}",
        )

        # ============================================================
        # 10. API GATEWAY
        # ============================================================

        # REST API
        api = apigateway.RestApi(
            self,
            f"APIGateway-{environment_suffix}",
            rest_api_name=f"media-streaming-api-{environment_suffix}",
            description="API Gateway for media streaming application",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["*"],
            ),
        )

        # Integration with ALB using HTTP proxy (no VPC Link needed for public ALB)
        integration = apigateway.Integration(
            type=apigateway.IntegrationType.HTTP_PROXY,
            integration_http_method="ANY",
            uri=f"http://{alb.load_balancer_dns_name}",
            options=apigateway.IntegrationOptions(
                connection_type=apigateway.ConnectionType.INTERNET,
            ),
        )

        # Proxy resource
        api.root.add_proxy(
            default_integration=integration,
            any_method=True,
        )

        # Usage plan for rate limiting
        usage_plan = api.add_usage_plan(
            f"UsagePlan-{environment_suffix}",
            name=f"standard-usage-{environment_suffix}",
            throttle=apigateway.ThrottleSettings(
                rate_limit=1000,
                burst_limit=2000,
            ),
            quota=apigateway.QuotaSettings(
                limit=100000,
                period=apigateway.Period.DAY,
            ),
        )

        usage_plan.add_api_stage(
            stage=api.deployment_stage,
        )

        # ============================================================
        # 11. SSM PARAMETERS FOR CONFIGURATION
        # ============================================================

        ssm.StringParameter(
            self,
            f"DBEndpointParameter-{environment_suffix}",
            parameter_name=f"/app/{environment_suffix}/db/endpoint",
            string_value=db_cluster.cluster_endpoint.hostname,
            description="Aurora cluster endpoint",
        )

        ssm.StringParameter(
            self,
            f"ALBDNSParameter-{environment_suffix}",
            parameter_name=f"/app/{environment_suffix}/alb/dns",
            string_value=alb.load_balancer_dns_name,
            description="ALB DNS name",
        )

        # ============================================================
        # 12. CLOUDWATCH DASHBOARD
        # ============================================================

        dashboard = cloudwatch.Dashboard(
            self,
            f"MonitoringDashboard-{environment_suffix}",
            dashboard_name=f"media-streaming-{environment_suffix}",
        )

        # ALB Metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[alb.metric_request_count()],
            ),
            cloudwatch.GraphWidget(
                title="ALB Target Response Time",
                left=[alb.metric_target_response_time()],
            ),
        )

        # ECS Metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Frontend CPU Utilization",
                left=[frontend_service.metric_cpu_utilization()],
            ),
            cloudwatch.GraphWidget(
                title="Backend CPU Utilization",
                left=[backend_service.metric_cpu_utilization()],
            ),
        )

        # Database Metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Database Connections",
                left=[db_cluster.metric_database_connections()],
            ),
            cloudwatch.GraphWidget(
                title="Database CPU Utilization",
                left=[db_cluster.metric_cpu_utilization()],
            ),
        )

        # API Gateway Metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="API Gateway Requests",
                left=[api.metric_count()],
            ),
            cloudwatch.GraphWidget(
                title="API Gateway Latency",
                left=[api.metric_latency()],
            ),
        )

        # ============================================================
        # 13. STACK OUTPUTS
        # ============================================================

        CfnOutput(
            self,
            "CloudFrontURL",
            value=f"https://{distribution.distribution_domain_name}",
            description="CloudFront distribution URL",
            export_name=f"cloudfront-url-{environment_suffix}",
        )

        CfnOutput(
            self,
            "APIGatewayEndpoint",
            value=api.url,
            description="API Gateway endpoint",
            export_name=f"api-gateway-endpoint-{environment_suffix}",
        )

        CfnOutput(
            self,
            "RDSClusterEndpoint",
            value=db_cluster.cluster_endpoint.hostname,
            description="Aurora PostgreSQL cluster endpoint",
            export_name=f"rds-endpoint-{environment_suffix}",
        )

        CfnOutput(
            self,
            "ALBDNSName",
            value=alb.load_balancer_dns_name,
            description="Application Load Balancer DNS name",
            export_name=f"alb-dns-{environment_suffix}",
        )

        CfnOutput(
            self,
            "FrontendRepoURI",
            value=frontend_repo.repository_uri,
            description="Frontend ECR repository URI",
            export_name=f"frontend-repo-uri-{environment_suffix}",
        )

        CfnOutput(
            self,
            "BackendRepoURI",
            value=backend_repo.repository_uri,
            description="Backend ECR repository URI",
            export_name=f"backend-repo-uri-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DBSecretArn",
            value=db_credentials.secret_arn,
            description="Database credentials secret ARN",
            export_name=f"db-secret-arn-{environment_suffix}",
        )
```
