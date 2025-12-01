from typing import Optional
from aws_cdk import (
    Stack,
    StackProps,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_rds as rds,
    aws_elasticache as elasticache,
    aws_efs as efs,
    aws_apigateway as apigateway,
    aws_secretsmanager as secretsmanager,
    aws_iam as iam,
    RemovalPolicy,
    CfnOutput,
    Duration,
)
from constructs import Construct


class TapStackProps(StackProps):
    """Properties for TapStack"""
    def __init__(
        self,
        environment_suffix: str = "dev",
        **kwargs
    ) -> None:
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    def __init__(
        self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs
    ) -> None:
        # Extract environment_suffix from props or kwargs
        if props:
            environment_suffix = props.environment_suffix
            # Convert TapStackProps to dict for StackProps
            stack_props = {
                k: v for k, v in vars(props).items()
                if k != 'environment_suffix' and not k.startswith('_')
            }
            super().__init__(scope, construct_id, **stack_props, **kwargs)
        else:
            environment_suffix = kwargs.pop("environment_suffix", "dev")
            super().__init__(scope, construct_id, **kwargs)

        # VPC with multi-AZ configuration
        self.vpc = ec2.Vpc(
            self,
            f"vpc-{environment_suffix}",
            max_azs=2,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # Security Groups
        self.ecs_security_group = ec2.SecurityGroup(
            self,
            f"ecs-sg-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for ECS tasks",
            allow_all_outbound=True,
        )

        self.rds_security_group = ec2.SecurityGroup(
            self,
            f"rds-sg-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for RDS PostgreSQL",
            allow_all_outbound=False,
        )

        self.elasticache_security_group = ec2.SecurityGroup(
            self,
            f"elasticache-sg-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for ElastiCache Redis",
            allow_all_outbound=False,
        )

        self.efs_security_group = ec2.SecurityGroup(
            self,
            f"efs-sg-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for EFS",
            allow_all_outbound=False,
        )

        # Allow ECS to access RDS
        self.rds_security_group.add_ingress_rule(
            peer=self.ecs_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow ECS tasks to access PostgreSQL",
        )

        # Allow ECS to access ElastiCache
        self.elasticache_security_group.add_ingress_rule(
            peer=self.ecs_security_group,
            connection=ec2.Port.tcp(6379),
            description="Allow ECS tasks to access Redis",
        )

        # Allow ECS to access EFS
        self.efs_security_group.add_ingress_rule(
            peer=self.ecs_security_group,
            connection=ec2.Port.tcp(2049),
            description="Allow ECS tasks to access EFS",
        )

        # Secrets Manager - Database credentials
        self.db_secret = secretsmanager.Secret(
            self,
            f"db-secret-{environment_suffix}",
            description="RDS PostgreSQL credentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "postgres"}',
                generate_string_key="password",
                exclude_characters='/@" \\\'',
                password_length=32,
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Secrets Manager - API Gateway key
        self.api_secret = secretsmanager.Secret(
            self,
            f"api-secret-{environment_suffix}",
            description="API Gateway API key",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                exclude_characters='/@" \\\'',
                password_length=32,
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # RDS PostgreSQL - Multi-AZ
        self.rds_instance = rds.DatabaseInstance(
            self,
            f"rds-postgresql-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_3
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM
            ),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[self.rds_security_group],
            multi_az=True,
            allocated_storage=100,
            storage_type=rds.StorageType.GP3,
            credentials=rds.Credentials.from_secret(self.db_secret),
            database_name="videometadata",
            backup_retention=Duration.days(7),
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # ElastiCache Subnet Group
        self.elasticache_subnet_group = elasticache.CfnSubnetGroup(
            self,
            f"elasticache-subnet-group-{environment_suffix}",
            description="Subnet group for ElastiCache Redis",
            subnet_ids=[
                subnet.subnet_id
                for subnet in self.vpc.select_subnets(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
                ).subnets
            ],
        )

        # ElastiCache Redis - Multi-node cluster
        self.elasticache_cluster = elasticache.CfnReplicationGroup(
            self,
            f"elasticache-redis-{environment_suffix}",
            replication_group_description="Redis cluster for caching video metadata",
            engine="redis",
            engine_version="7.0",
            cache_node_type="cache.t3.micro",
            num_cache_clusters=2,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            cache_subnet_group_name=self.elasticache_subnet_group.ref,
            security_group_ids=[self.elasticache_security_group.security_group_id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
        )

        # EFS File System
        self.efs_file_system = efs.FileSystem(
            self,
            f"efs-{environment_suffix}",
            vpc=self.vpc,
            security_group=self.efs_security_group,
            encrypted=True,
            lifecycle_policy=efs.LifecyclePolicy.AFTER_7_DAYS,
            performance_mode=efs.PerformanceMode.GENERAL_PURPOSE,
            throughput_mode=efs.ThroughputMode.BURSTING,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # ECS Cluster
        self.ecs_cluster = ecs.Cluster(
            self,
            f"ecs-cluster-{environment_suffix}",
            vpc=self.vpc,
            cluster_name=f"video-processing-{environment_suffix}",
            container_insights=True,
        )

        # ECS Task Execution Role
        self.task_execution_role = iam.Role(
            self,
            f"ecs-task-execution-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ],
        )

        # Grant secrets access to task execution role
        self.db_secret.grant_read(self.task_execution_role)
        self.api_secret.grant_read(self.task_execution_role)

        # ECS Task Role
        self.task_role = iam.Role(
            self,
            f"ecs-task-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        )

        # Grant RDS access to task role
        self.rds_instance.grant_connect(self.task_role)

        # ECS Task Definition
        self.task_definition = ecs.FargateTaskDefinition(
            self,
            f"ecs-task-def-{environment_suffix}",
            memory_limit_mib=2048,
            cpu=1024,
            execution_role=self.task_execution_role,
            task_role=self.task_role,
            volumes=[
                ecs.Volume(
                    name="efs-storage",
                    efs_volume_configuration=ecs.EfsVolumeConfiguration(
                        file_system_id=self.efs_file_system.file_system_id,
                        transit_encryption="ENABLED",
                        authorization_config=ecs.AuthorizationConfig(
                            access_point_id=None, iam="ENABLED"
                        ),
                    ),
                )
            ],
        )

        # Container Definition (placeholder - replace with actual image)
        self.container = self.task_definition.add_container(
            f"video-processor-{environment_suffix}",
            image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"),
            logging=ecs.LogDrivers.aws_logs(stream_prefix="video-processor"),
            environment={
                "REGION": self.region,
                "REDIS_ENDPOINT": self.elasticache_cluster.attr_primary_end_point_address,
                "REDIS_PORT": self.elasticache_cluster.attr_primary_end_point_port,
            },
            secrets={
                "DB_HOST": ecs.Secret.from_secrets_manager(
                    self.db_secret, "host"
                ),
                "DB_USERNAME": ecs.Secret.from_secrets_manager(
                    self.db_secret, "username"
                ),
                "DB_PASSWORD": ecs.Secret.from_secrets_manager(
                    self.db_secret, "password"
                ),
            },
        )

        self.container.add_mount_points(
            ecs.MountPoint(
                container_path="/mnt/efs",
                source_volume="efs-storage",
                read_only=False,
            )
        )

        # API Gateway REST API
        self.api = apigateway.RestApi(
            self,
            f"api-gateway-{environment_suffix}",
            rest_api_name=f"video-metadata-api-{environment_suffix}",
            description="API for accessing video metadata",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=100,
                throttling_burst_limit=200,
            ),
        )

        # API Gateway resource and method (placeholder integration)
        metadata_resource = self.api.root.add_resource("metadata")

        # Mock integration for demonstration
        metadata_resource.add_method(
            "GET",
            apigateway.MockIntegration(
                integration_responses=[
                    apigateway.IntegrationResponse(
                        status_code="200",
                        response_templates={
                            "application/json": '{"message": "Video metadata endpoint"}'
                        },
                    )
                ],
                request_templates={
                    "application/json": '{"statusCode": 200}'
                },
            ),
            method_responses=[
                apigateway.MethodResponse(status_code="200")
            ],
        )

        # API Key
        self.api_key = apigateway.ApiKey(
            self,
            f"api-key-{environment_suffix}",
            api_key_name=f"video-metadata-key-{environment_suffix}",
        )

        # Usage Plan
        self.usage_plan = self.api.add_usage_plan(
            f"usage-plan-{environment_suffix}",
            name=f"video-metadata-plan-{environment_suffix}",
            throttle=apigateway.ThrottleSettings(
                rate_limit=100,
                burst_limit=200,
            ),
        )

        self.usage_plan.add_api_key(self.api_key)
        self.usage_plan.add_api_stage(
            stage=self.api.deployment_stage,
        )

        # Outputs
        CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID",
        )

        CfnOutput(
            self,
            "EcsClusterName",
            value=self.ecs_cluster.cluster_name,
            description="ECS Cluster Name",
        )

        CfnOutput(
            self,
            "RdsEndpoint",
            value=self.rds_instance.db_instance_endpoint_address,
            description="RDS PostgreSQL Endpoint",
        )

        CfnOutput(
            self,
            "RedisEndpoint",
            value=self.elasticache_cluster.attr_primary_end_point_address,
            description="ElastiCache Redis Primary Endpoint",
        )

        CfnOutput(
            self,
            "EfsFileSystemId",
            value=self.efs_file_system.file_system_id,
            description="EFS File System ID",
        )

        CfnOutput(
            self,
            "ApiEndpoint",
            value=self.api.url,
            description="API Gateway Endpoint",
        )

        CfnOutput(
            self,
            "DbSecretArn",
            value=self.db_secret.secret_arn,
            description="Database Secret ARN",
        )
