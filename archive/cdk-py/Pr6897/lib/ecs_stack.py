"""ecs_stack.py
ECS cluster, services, ALB, and service discovery configuration.
"""

import aws_cdk as cdk
from constructs import Construct
from aws_cdk import (
    aws_ec2 as ec2, aws_ecs as ecs, aws_ecr as ecr,
    aws_elasticloadbalancingv2 as elbv2, aws_servicediscovery as servicediscovery,
    aws_iam as iam, aws_kms as kms, aws_secretsmanager as secretsmanager,
    aws_logs as logs, NestedStack, RemovalPolicy, Duration
)


class EcsStackProps:
    """Properties for EcsStack."""
    def __init__(self, environment_suffix: str, vpc: ec2.Vpc,
                 alb_security_group: ec2.SecurityGroup, ecs_security_group: ec2.SecurityGroup,
                 kms_key: kms.Key, db_secret: secretsmanager.Secret, api_secret: secretsmanager.Secret,
                 payment_api_repo: ecr.Repository, transaction_processor_repo: ecr.Repository,
                 notification_service_repo: ecr.Repository):
        self.environment_suffix = environment_suffix
        self.vpc = vpc
        self.alb_security_group = alb_security_group
        self.ecs_security_group = ecs_security_group
        self.kms_key = kms_key
        self.db_secret = db_secret
        self.api_secret = api_secret
        self.payment_api_repo = payment_api_repo
        self.transaction_processor_repo = transaction_processor_repo
        self.notification_service_repo = notification_service_repo


class EcsStack(NestedStack):
    """Creates ECS cluster, services, ALB, and service discovery."""

    def __init__(self, scope: Construct, construct_id: str, props: EcsStackProps, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # ECS Cluster
        self.cluster = ecs.Cluster(
            self, f"PaymentProcessingCluster{env_suffix}",
            cluster_name=f"payment-processing-cluster-{env_suffix}",
            vpc=props.vpc,
            container_insights=True,
            enable_fargate_capacity_providers=True
        )

        # Cloud Map namespace
        self.namespace = servicediscovery.PrivateDnsNamespace(
            self, f"ServiceDiscoveryNamespace{env_suffix}",
            name=f"payment-processing-{env_suffix}.local",
            vpc=props.vpc
        )

        # ALB
        self.alb = elbv2.ApplicationLoadBalancer(
            self, f"PaymentALB{env_suffix}",
            load_balancer_name=f"payment-alb-{env_suffix}",
            vpc=props.vpc,
            internet_facing=True,
            security_group=props.alb_security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            deletion_protection=False
        )

        # ALB Listener
        self.alb_listener = self.alb.add_listener(
            f"ALBListener{env_suffix}", port=80,
            default_action=elbv2.ListenerAction.fixed_response(404, content_type="text/plain", message_body="Not Found")
        )

        # Create target groups for blue-green
        self.payment_api_target_group = self._create_target_group("PaymentAPIBlue", env_suffix, props.vpc, 8080, "/health")
        self.payment_api_target_group_green = self._create_target_group("PaymentAPIGreen", env_suffix, props.vpc, 8080, "/health")
        self.transaction_processor_target_group = self._create_target_group("TxnProcessorBlue", env_suffix, props.vpc, 8081, "/health")
        self.transaction_processor_target_group_green = self._create_target_group("TxnProcessorGreen", env_suffix, props.vpc, 8081, "/health")
        self.notification_service_target_group = self._create_target_group("NotificationBlue", env_suffix, props.vpc, 8082, "/health")
        self.notification_service_target_group_green = self._create_target_group("NotificationGreen", env_suffix, props.vpc, 8082, "/health")

        # Path-based routing
        self.alb_listener.add_target_groups(
            f"PaymentAPIRule{env_suffix}", target_groups=[self.payment_api_target_group],
            priority=10, conditions=[elbv2.ListenerCondition.path_patterns(["/api/payments/*"])]
        )
        self.alb_listener.add_target_groups(
            f"TxnProcessorRule{env_suffix}", target_groups=[self.transaction_processor_target_group],
            priority=20, conditions=[elbv2.ListenerCondition.path_patterns(["/api/transactions/*"])]
        )
        self.alb_listener.add_target_groups(
            f"NotificationRule{env_suffix}", target_groups=[self.notification_service_target_group],
            priority=30, conditions=[elbv2.ListenerCondition.path_patterns(["/api/notifications/*"])]
        )

        # Create services - pass ALB listener for dependency
        self.payment_api_service = self._create_service("payment-api", props.payment_api_repo, 2048, 4096, env_suffix, props, self.payment_api_target_group, 8080, False, self.alb_listener)
        self.transaction_processor_service = self._create_service("transaction-processor", props.transaction_processor_repo, 1024, 2048, env_suffix, props, self.transaction_processor_target_group, 8081, False, self.alb_listener)
        self.notification_service = self._create_service("notification-service", props.notification_service_repo, 1024, 2048, env_suffix, props, self.notification_service_target_group, 8082, True, self.alb_listener)

        cdk.CfnOutput(self, f"LoadBalancerDNS{env_suffix}", value=self.alb.load_balancer_dns_name)

    def _create_target_group(self, name: str, env_suffix: str, vpc: ec2.Vpc, port: int, health_path: str):
        """Create ALB target group."""
        return elbv2.ApplicationTargetGroup(
            self, f"{name}TG{env_suffix}",
            target_group_name=f"{name.lower()}-tg-{env_suffix}"[:32],
            vpc=vpc, port=port, protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path=health_path, interval=Duration.seconds(30), timeout=Duration.seconds(5),
                healthy_threshold_count=2, unhealthy_threshold_count=3
            ),
            deregistration_delay=Duration.seconds(30)
        )

    def _create_service(self, service_name: str, repo: ecr.Repository, cpu: int, memory: int,
                        env_suffix: str, props: EcsStackProps, target_group: elbv2.ApplicationTargetGroup,
                        port: int, use_spot: bool, listener_rule: elbv2.ApplicationListenerRule) -> ecs.FargateService:
        """Create ECS service with all configurations."""

        # Task execution role
        execution_role = iam.Role(
            self, f"{service_name}ExecutionRole{env_suffix}",
            role_name=f"{service_name}-exec-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonECSTaskExecutionRolePolicy")]
        )

        # Add explicit IAM policies instead of using grant methods to avoid circular dependencies
        execution_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=["secretsmanager:GetSecretValue"],
            resources=[props.db_secret.secret_arn, props.api_secret.secret_arn]
        ))
        execution_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=["ecr:GetAuthorizationToken"],
            resources=["*"]
        ))
        execution_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage"
            ],
            resources=[repo.repository_arn]
        ))
        execution_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=["kms:Decrypt"],
            resources=[props.kms_key.key_arn]
        ))

        # Task role
        task_role = iam.Role(
            self, f"{service_name}TaskRole{env_suffix}",
            role_name=f"{service_name}-task-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
        )
        task_role.add_managed_policy(iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess"))

        # Log group
        log_group = logs.LogGroup(
            self, f"{service_name}LogGroup{env_suffix}",
            log_group_name=f"/ecs/payment-processing/{service_name}-{env_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Task definition
        task_definition = ecs.FargateTaskDefinition(
            self, f"{service_name}TaskDef{env_suffix}",
            family=f"{service_name}-{env_suffix}",
            cpu=cpu, memory_limit_mib=memory,
            execution_role=execution_role, task_role=task_role
        )

        # Application container
        app_container = task_definition.add_container(
            f"{service_name}Container",
            container_name=service_name,
            image=ecs.ContainerImage.from_ecr_repository(repo, "latest"),
            logging=ecs.LogDriver.aws_logs(stream_prefix=service_name, log_group=log_group),
            environment={"SERVICE_NAME": service_name, "ENVIRONMENT": env_suffix, "AWS_XRAY_DAEMON_ADDRESS": "localhost:2000"},
            secrets={"DB_SECRET": ecs.Secret.from_secrets_manager(props.db_secret), "API_SECRET": ecs.Secret.from_secrets_manager(props.api_secret)},
            health_check=ecs.HealthCheck(
                command=["CMD-SHELL", f"curl -f http://localhost:{port}/health || exit 1"],
                interval=Duration.seconds(30), timeout=Duration.seconds(5), retries=3, start_period=Duration.seconds(60)
            )
        )
        app_container.add_port_mappings(ecs.PortMapping(container_port=port, protocol=ecs.Protocol.TCP))

        # X-Ray sidecar
        xray_container = task_definition.add_container(
            f"{service_name}XRayContainer",
            container_name=f"{service_name}-xray",
            image=ecs.ContainerImage.from_registry("public.ecr.aws/xray/aws-xray-daemon:latest"),
            logging=ecs.LogDriver.aws_logs(stream_prefix=f"{service_name}-xray", log_group=log_group),
            cpu=32, memory_limit_mib=256
        )
        xray_container.add_port_mappings(ecs.PortMapping(container_port=2000, protocol=ecs.Protocol.UDP))

        # Capacity provider strategy
        if use_spot:
            capacity_provider_strategies = [
                ecs.CapacityProviderStrategy(capacity_provider="FARGATE_SPOT", weight=4, base=0),
                ecs.CapacityProviderStrategy(capacity_provider="FARGATE", weight=1, base=1)
            ]
        else:
            capacity_provider_strategies = [ecs.CapacityProviderStrategy(capacity_provider="FARGATE", weight=1, base=1)]

        # Fargate service with CODE_DEPLOY controller for blue-green deployments
        service = ecs.FargateService(
            self, f"{service_name}Service{env_suffix}",
            service_name=f"{service_name}-{env_suffix}",
            cluster=self.cluster, task_definition=task_definition,
            desired_count=2,
            security_groups=[props.ecs_security_group],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            capacity_provider_strategies=capacity_provider_strategies,
            enable_execute_command=True,
            deployment_controller=ecs.DeploymentController(type=ecs.DeploymentControllerType.CODE_DEPLOY),
            cloud_map_options=ecs.CloudMapOptions(
                name=service_name, cloud_map_namespace=self.namespace, dns_record_type=servicediscovery.DnsRecordType.A
            )
        )

        # Note: Target group attachment is managed by CodeDeploy for blue-green deployments
        # However, we need to set the initial load balancer configuration at the CFN level
        cfn_service = service.node.default_child
        cfn_service.add_property_override('LoadBalancers', [{
            'ContainerName': service_name,
            'ContainerPort': port,
            'TargetGroupArn': target_group.target_group_arn
        }])

        # Ensure service depends on listener rule being created
        service.node.add_dependency(listener_rule)

        # Auto-scaling
        scaling = service.auto_scale_task_count(min_capacity=2, max_capacity=10)
        scaling.scale_on_cpu_utilization(f"{service_name}CpuScaling{env_suffix}", target_utilization_percent=70, scale_in_cooldown=Duration.seconds(60), scale_out_cooldown=Duration.seconds(30))
        scaling.scale_on_memory_utilization(f"{service_name}MemoryScaling{env_suffix}", target_utilization_percent=80, scale_in_cooldown=Duration.seconds(60), scale_out_cooldown=Duration.seconds(30))
        scaling.scale_on_request_count(f"{service_name}RequestScaling{env_suffix}", requests_per_target=1000, target_group=target_group, scale_in_cooldown=Duration.seconds(60), scale_out_cooldown=Duration.seconds(30))

        return service
