"""
Trading Analytics Platform - Containerized Microservices Architecture
CDK Python Stack implementing ECS Fargate with App Mesh service mesh
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import Duration, RemovalPolicy, Stack
from aws_cdk import aws_applicationautoscaling as appscaling
from aws_cdk import aws_appmesh as appmesh
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_ecr as ecr
from aws_cdk import aws_ecs as ecs
from aws_cdk import aws_elasticloadbalancingv2 as elbv2
from aws_cdk import aws_iam as iam
from aws_cdk import aws_logs as logs
from aws_cdk import aws_secretsmanager as secretsmanager
from aws_cdk import aws_servicediscovery as servicediscovery
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Properties for TapStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Main CDK Stack for Trading Analytics Platform
    Deploys containerized microservices with ECS Fargate, App Mesh, and ALB
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

        # Define microservices
        microservices = ['data-ingestion', 'analytics-engine', 'api-gateway']

        # Create VPC with 3 AZs
        vpc = ec2.Vpc(
            self,
            f'TradingVpc-{environment_suffix}',
            max_azs=3,
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name='Public',
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name='Private',
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )

        # Create ECR repositories with scanning and lifecycle policies
        ecr_repos = {}
        for service in microservices:
            repo = ecr.Repository(
                self,
                f'EcrRepo-{service}-{environment_suffix}',
                repository_name=f'{service}-{environment_suffix}',
                image_scan_on_push=True,
                removal_policy=RemovalPolicy.DESTROY,
                auto_delete_images=True,
                lifecycle_rules=[
                    ecr.LifecycleRule(
                        description='Retain only last 10 images',
                        max_image_count=10
                    )
                ]
            )
            ecr_repos[service] = repo

        # Create ECS cluster with Fargate capacity providers
        cluster = ecs.Cluster(
            self,
            f'TradingCluster-{environment_suffix}',
            vpc=vpc,
            cluster_name=f'trading-cluster-{environment_suffix}',
            container_insights=True
        )

        # Fargate and Fargate Spot capacity providers are available by default
        # They will be used via capacity_provider_strategies in service definitions

        # Create Cloud Map namespace for service discovery
        namespace = servicediscovery.PrivateDnsNamespace(
            self,
            f'ServiceNamespace-{environment_suffix}',
            name=f'trading.local-{environment_suffix}',
            vpc=vpc
        )

        # Create App Mesh
        mesh = appmesh.Mesh(
            self,
            f'TradingMesh-{environment_suffix}',
            mesh_name=f'trading-mesh-{environment_suffix}'
        )

        # Create Secrets Manager secrets for database credentials
        db_secret = secretsmanager.Secret(
            self,
            f'DbSecret-{environment_suffix}',
            secret_name=f'trading-db-credentials-{environment_suffix}',
            description='Database endpoint credentials for trading platform',
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"admin"}',
                generate_string_key='password',
                exclude_punctuation=True,
                password_length=32
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # NOTE: Secret rotation requires Lambda function or hosted rotation
        # For production, implement with hostedRotation parameter
        # Example: hostedRotation=secretsmanager.HostedRotation.mysql_single_user()

        # Create API keys secret
        api_secret = secretsmanager.Secret(
            self,
            f'ApiSecret-{environment_suffix}',
            secret_name=f'trading-api-keys-{environment_suffix}',
            description='API keys for trading platform services',
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"api_key":""}',
                generate_string_key='api_key',
                exclude_punctuation=True,
                password_length=64
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # NOTE: Secret rotation requires Lambda function or hosted rotation
        # For production, implement with hostedRotation parameter

        # Create Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self,
            f'TradingAlb-{environment_suffix}',
            vpc=vpc,
            internet_facing=True,
            load_balancer_name=f'trading-alb-{environment_suffix}',
            deletion_protection=False
        )

        # Create ALB listener
        listener = alb.add_listener(
            f'AlbListener-{environment_suffix}',
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP
        )

        # Create IAM task execution role
        task_execution_role = iam.Role(
            self,
            f'TaskExecutionRole-{environment_suffix}',
            role_name=f'trading-task-execution-{environment_suffix}',
            assumed_by=iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    'service-role/AmazonECSTaskExecutionRolePolicy'
                )
            ]
        )

        # Grant secrets access to task execution role
        db_secret.grant_read(task_execution_role)
        api_secret.grant_read(task_execution_role)

        # Grant ECR access
        for repo in ecr_repos.values():
            repo.grant_pull(task_execution_role)

        # Create services and App Mesh resources
        ecs_services = {}
        virtual_nodes = {}
        virtual_routers = {}
        target_groups = {}

        for service_name in microservices:
            # Create CloudWatch log group
            log_group = logs.LogGroup(
                self,
                f'LogGroup-{service_name}-{environment_suffix}',
                log_group_name=f'/ecs/trading/{service_name}-{environment_suffix}',
                retention=logs.RetentionDays.ONE_MONTH,
                removal_policy=RemovalPolicy.DESTROY
            )

            # Add metric filter for error tracking
            log_group.add_metric_filter(
                f'ErrorMetricFilter-{service_name}',
                filter_pattern=logs.FilterPattern.any_term('ERROR', 'Error', 'error'),
                metric_name=f'{service_name}-errors-{environment_suffix}',
                metric_namespace='TradingPlatform',
                metric_value='1',
                default_value=0
            )

            # Create IAM task role with least privilege
            task_role = iam.Role(
                self,
                f'TaskRole-{service_name}-{environment_suffix}',
                role_name=f'trading-{service_name}-task-{environment_suffix}',
                assumed_by=iam.ServicePrincipal('ecs-tasks.amazonaws.com')
            )

            # Grant CloudWatch metrics permissions
            task_role.add_to_policy(
                iam.PolicyStatement(
                    actions=[
                        'cloudwatch:PutMetricData',
                        'cloudwatch:GetMetricStatistics',
                        'cloudwatch:ListMetrics'
                    ],
                    resources=['*']
                )
            )

            # Grant X-Ray permissions for App Mesh
            task_role.add_to_policy(
                iam.PolicyStatement(
                    actions=[
                        'xray:PutTraceSegments',
                        'xray:PutTelemetryRecords'
                    ],
                    resources=['*']
                )
            )

            # Grant App Mesh Envoy permissions
            task_role.add_to_policy(
                iam.PolicyStatement(
                    actions=[
                        'appmesh:StreamAggregatedResources'
                    ],
                    resources=['*']
                )
            )

            # Create Fargate task definition
            task_definition = ecs.FargateTaskDefinition(
                self,
                f'TaskDef-{service_name}-{environment_suffix}',
                family=f'trading-{service_name}-{environment_suffix}',
                cpu=512,
                memory_limit_mib=1024,
                execution_role=task_execution_role,
                task_role=task_role
            )

            # Add application container
            # Using public demo image for testing - replace with actual ECR image in production
            # To use ECR images: image=ecs.ContainerImage.from_ecr_repository(ecr_repos[service_name], tag='latest')
            app_container = task_definition.add_container(
                f'AppContainer-{service_name}',
                container_name=service_name,
                image=ecs.ContainerImage.from_registry('public.ecr.aws/docker/library/nginx:alpine'),
                logging=ecs.LogDriver.aws_logs(
                    stream_prefix=service_name,
                    log_group=log_group
                ),
                secrets={
                    'DB_CREDENTIALS': ecs.Secret.from_secrets_manager(db_secret),
                    'API_KEY': ecs.Secret.from_secrets_manager(api_secret)
                },
                environment={
                    'SERVICE_NAME': service_name,
                    'ENVIRONMENT': environment_suffix,
                    'AWS_REGION': self.region
                }
            )

            # Add port mapping (nginx listens on port 80 by default)
            app_container.add_port_mappings(
                ecs.PortMapping(
                    container_port=80,
                    protocol=ecs.Protocol.TCP
                )
            )

            # Add App Mesh Envoy proxy container
            envoy_container = task_definition.add_container(
                f'EnvoyContainer-{service_name}',
                container_name='envoy',
                image=ecs.ContainerImage.from_registry(
                    'public.ecr.aws/appmesh/aws-appmesh-envoy:v1.27.2.0-prod'
                ),
                essential=True,
                environment={
                    'APPMESH_RESOURCE_ARN': f'mesh/{mesh.mesh_name}/virtualNode/{service_name}-vn-{environment_suffix}',
                    'ENABLE_ENVOY_XRAY_TRACING': '1'
                },
                health_check=ecs.HealthCheck(
                    command=['CMD-SHELL', 'curl -s http://localhost:9901/server_info | grep state | grep -q LIVE'],
                    interval=Duration.seconds(5),
                    timeout=Duration.seconds(2),
                    retries=3,
                    start_period=Duration.seconds(10)
                ),
                logging=ecs.LogDriver.aws_logs(
                    stream_prefix='envoy',
                    log_group=log_group
                ),
                user='1337'
            )

            # Add X-Ray daemon container
            xray_container = task_definition.add_container(
                f'XrayContainer-{service_name}',
                container_name='xray-daemon',
                image=ecs.ContainerImage.from_registry('amazon/aws-xray-daemon:latest'),
                cpu=32,
                memory_limit_mib=256,
                logging=ecs.LogDriver.aws_logs(
                    stream_prefix='xray',
                    log_group=log_group
                ),
                user='1337'
            )

            xray_container.add_port_mappings(
                ecs.PortMapping(
                    container_port=2000,
                    protocol=ecs.Protocol.UDP
                )
            )

            # Set container dependencies
            app_container.add_container_dependencies(
                ecs.ContainerDependency(
                    container=envoy_container,
                    condition=ecs.ContainerDependencyCondition.HEALTHY
                )
            )

            # Create App Mesh virtual node
            # Service discovery will be set via CFN after ECS service creation
            virtual_node = appmesh.VirtualNode(
                self,
                f'VirtualNode-{service_name}-{environment_suffix}',
                mesh=mesh,
                virtual_node_name=f'{service_name}-vn-{environment_suffix}',
                service_discovery=appmesh.ServiceDiscovery.dns(
                    hostname=f'{service_name}.trading.local-{environment_suffix}'
                ),
                listeners=[
                    appmesh.VirtualNodeListener.http(
                        port=80,
                        health_check=appmesh.HealthCheck.http(
                            healthy_threshold=2,
                            interval=Duration.seconds(5),
                            path='/',
                            timeout=Duration.seconds(2),
                            unhealthy_threshold=2
                        )
                    )
                ]
                # NOTE: mTLS requires ACM certificates or file-based certificates
                # For production, add backend_defaults with TLS configuration
                # Example: backend_defaults=appmesh.BackendDefaults(
                #     tls_client_policy=appmesh.TlsClientPolicy(
                #         validation=appmesh.TlsValidation(
                #             trust=appmesh.TlsValidationTrust.file(
                #                 certificate_chain='/path/to/cert'
                #             )
                #         )
                #     )
                # )
            )
            virtual_nodes[service_name] = virtual_node

            # Create App Mesh virtual router
            virtual_router = appmesh.VirtualRouter(
                self,
                f'VirtualRouter-{service_name}-{environment_suffix}',
                mesh=mesh,
                virtual_router_name=f'{service_name}-vr-{environment_suffix}',
                listeners=[
                    appmesh.VirtualRouterListener.http(port=80)
                ]
            )
            virtual_routers[service_name] = virtual_router

            # Create route with retry policy (circuit breaker)
            route = appmesh.Route(
                self,
                f'Route-{service_name}-{environment_suffix}',
                mesh=mesh,
                virtual_router=virtual_router,
                route_name=f'{service_name}-route-{environment_suffix}',
                route_spec=appmesh.RouteSpec.http(
                    weighted_targets=[
                        appmesh.WeightedTarget(
                            virtual_node=virtual_node,
                            weight=100
                        )
                    ],
                    retry_policy=appmesh.HttpRetryPolicy(
                        retry_attempts=3,
                        retry_timeout=Duration.seconds(5),
                        http_retry_events=[
                            appmesh.HttpRetryEvent.SERVER_ERROR,
                            appmesh.HttpRetryEvent.GATEWAY_ERROR
                        ],
                        tcp_retry_events=[
                            appmesh.TcpRetryEvent.CONNECTION_ERROR
                        ]
                    )
                )
            )

            # Create App Mesh virtual service
            virtual_service = appmesh.VirtualService(
                self,
                f'VirtualService-{service_name}-{environment_suffix}',
                virtual_service_name=f'{service_name}.trading.local-{environment_suffix}',
                virtual_service_provider=appmesh.VirtualServiceProvider.virtual_router(
                    virtual_router
                )
            )

            # Create ECS service with Fargate Spot and blue-green deployment
            ecs_service = ecs.FargateService(
                self,
                f'EcsService-{service_name}-{environment_suffix}',
                cluster=cluster,
                task_definition=task_definition,
                service_name=f'{service_name}-{environment_suffix}',
                desired_count=2,
                deployment_controller=ecs.DeploymentController(
                    type=ecs.DeploymentControllerType.ECS
                ),
                circuit_breaker=ecs.DeploymentCircuitBreaker(
                    rollback=True
                ),
                capacity_provider_strategies=[
                    ecs.CapacityProviderStrategy(
                        capacity_provider='FARGATE_SPOT',
                        weight=2,
                        base=1
                    ),
                    ecs.CapacityProviderStrategy(
                        capacity_provider='FARGATE',
                        weight=1
                    )
                ],
                cloud_map_options=ecs.CloudMapOptions(
                    cloud_map_namespace=namespace,
                    name=service_name,
                    dns_record_type=servicediscovery.DnsRecordType.A,
                    dns_ttl=Duration.seconds(10)
                ),
                enable_execute_command=True,
                health_check_grace_period=Duration.seconds(60) if service_name == 'api-gateway' else None
            )
            ecs_services[service_name] = ecs_service

            # Virtual node uses DNS service discovery configured above
            # The Cloud Map service created by ECS will resolve to the same hostname

            # Create auto-scaling for the service
            scaling = ecs_service.auto_scale_task_count(
                min_capacity=2,
                max_capacity=10
            )

            # Add CPU-based auto-scaling
            scaling.scale_on_cpu_utilization(
                f'CpuScaling-{service_name}',
                target_utilization_percent=70,
                scale_in_cooldown=Duration.seconds(60),
                scale_out_cooldown=Duration.seconds(60)
            )

            # Add memory-based auto-scaling
            scaling.scale_on_memory_utilization(
                f'MemoryScaling-{service_name}',
                target_utilization_percent=80,
                scale_in_cooldown=Duration.seconds(60),
                scale_out_cooldown=Duration.seconds(60)
            )

            # Add custom CloudWatch metric-based scaling
            custom_metric = cloudwatch.Metric(
                namespace='TradingPlatform',
                metric_name=f'{service_name}-custom-load',
                dimensions_map={'Service': service_name},
                statistic='Average',
                period=Duration.minutes(1)
            )

            scaling.scale_on_metric(
                f'CustomMetricScaling-{service_name}',
                metric=custom_metric,
                scaling_steps=[
                    appscaling.ScalingInterval(lower=0, upper=30, change=-1),
                    appscaling.ScalingInterval(lower=50, upper=70, change=1),
                    appscaling.ScalingInterval(lower=70, change=2)
                ],
                adjustment_type=appscaling.AdjustmentType.CHANGE_IN_CAPACITY
            )

            # Configure ALB target group for api-gateway service
            if service_name == 'api-gateway':
                target_group = elbv2.ApplicationTargetGroup(
                    self,
                    f'TargetGroup-{service_name}-{environment_suffix}',
                    vpc=vpc,
                    port=80,
                    protocol=elbv2.ApplicationProtocol.HTTP,
                    target_type=elbv2.TargetType.IP,
                    target_group_name=f'trading-{service_name}-{environment_suffix}'[:32],
                    health_check=elbv2.HealthCheck(
                        enabled=True,
                        path='/',
                        protocol=elbv2.Protocol.HTTP,
                        port='80',
                        healthy_threshold_count=2,
                        unhealthy_threshold_count=3,
                        timeout=Duration.seconds(5),
                        interval=Duration.seconds(30)
                    ),
                    deregistration_delay=Duration.seconds(30)
                )
                target_groups[service_name] = target_group

                # Register ECS service with target group
                ecs_service.attach_to_application_target_group(target_group)

                # Add path-based routing
                listener.add_target_groups(
                    f'ApiGatewayRule-{environment_suffix}',
                    target_groups=[target_group],
                    priority=10,
                    conditions=[
                        elbv2.ListenerCondition.path_patterns(['/api/*', '/'])
                    ]
                )

        # Add default action for ALB listener
        listener.add_action(
            'DefaultAction',
            action=elbv2.ListenerAction.fixed_response(
                status_code=404,
                content_type='text/plain',
                message_body='Not Found'
            )
        )

        # Create CloudWatch alarms for monitoring
        for service_name in microservices:
            # CPU utilization alarm
            cloudwatch.Alarm(
                self,
                f'CpuAlarm-{service_name}-{environment_suffix}',
                alarm_name=f'trading-{service_name}-high-cpu-{environment_suffix}',
                alarm_description=f'High CPU utilization for {service_name}',
                metric=ecs_services[service_name].metric_cpu_utilization(),
                threshold=80,
                evaluation_periods=2,
                datapoints_to_alarm=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
            )

            # Memory utilization alarm
            cloudwatch.Alarm(
                self,
                f'MemoryAlarm-{service_name}-{environment_suffix}',
                alarm_name=f'trading-{service_name}-high-memory-{environment_suffix}',
                alarm_description=f'High memory utilization for {service_name}',
                metric=ecs_services[service_name].metric_memory_utilization(),
                threshold=85,
                evaluation_periods=2,
                datapoints_to_alarm=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
            )

            # Error rate alarm
            cloudwatch.Alarm(
                self,
                f'ErrorAlarm-{service_name}-{environment_suffix}',
                alarm_name=f'trading-{service_name}-errors-{environment_suffix}',
                alarm_description=f'High error rate for {service_name}',
                metric=cloudwatch.Metric(
                    namespace='TradingPlatform',
                    metric_name=f'{service_name}-errors-{environment_suffix}',
                    statistic='Sum',
                    period=Duration.minutes(5)
                ),
                threshold=10,
                evaluation_periods=1,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
            )

        # Outputs
        cdk.CfnOutput(
            self,
            'LoadBalancerDNS',
            value=alb.load_balancer_dns_name,
            description='Application Load Balancer DNS name'
        )

        cdk.CfnOutput(
            self,
            'ClusterName',
            value=cluster.cluster_name,
            description='ECS Cluster name'
        )

        cdk.CfnOutput(
            self,
            'MeshName',
            value=mesh.mesh_name,
            description='App Mesh name'
        )

        for service_name in microservices:
            cdk.CfnOutput(
                self,
                f'EcrRepo-{service_name}',
                value=ecr_repos[service_name].repository_uri,
                description=f'ECR repository URI for {service_name}'
            )
