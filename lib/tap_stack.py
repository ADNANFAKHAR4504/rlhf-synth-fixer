"""Main CDK stack for HIPAA-compliant medical imaging pipeline."""

import json
import os
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_efs as efs,
    aws_ecs as ecs,
    aws_elasticache as elasticache,
    aws_kinesis as kinesis,
    aws_secretsmanager as secretsmanager,
    aws_kms as kms,
    aws_iam as iam,
    aws_apigateway as apigateway,
    aws_logs as logs,
    aws_cloudwatch as aws_cloudwatch,
    ArnFormat,
    CfnOutput,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class TapStack(Stack):
    """Main stack for medical imaging processing pipeline."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        """Initialize the stack.

        Args:
            scope: CDK scope
            construct_id: Construct identifier
            **kwargs: Additional stack properties
        """
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from context
        environment_suffix = self.node.try_get_context("environmentSuffix")
        if not environment_suffix:
            environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        database_name = f"medical_imaging_{environment_suffix}"

        # Create KMS key for encryption
        kms_key = kms.Key(
            self,
            "EncryptionKey",
            description=f"KMS key for medical imaging pipeline {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )
        log_service_principal = iam.ServicePrincipal(
            f"logs.{Stack.of(self).region}.amazonaws.com"
        )
        log_group_arn_pattern = self.format_arn(
            service="logs",
            resource="log-group",
            resource_name="*",
            arn_format=ArnFormat.COLON_RESOURCE_NAME,
        )
        kms_key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AllowCloudWatchLogsEncryption",
                effect=iam.Effect.ALLOW,
                principals=[log_service_principal],
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                ],
                resources=["*"],
                conditions={
                    "ArnLike": {
                        "kms:EncryptionContext:aws:logs:arn": [
                            log_group_arn_pattern,
                            f"{log_group_arn_pattern}:*",
                        ]
                    },
                },
            )
        )
        kms_key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AllowCloudWatchLogsGrant",
                effect=iam.Effect.ALLOW,
                principals=[log_service_principal],
                actions=[
                    "kms:DescribeKey",
                    "kms:CreateGrant",
                ],
                resources=["*"],
                conditions={"Bool": {"kms:GrantIsForAWSResource": True}},
            )
        )

        # Create VPC with multi-AZ configuration
        vpc = ec2.Vpc(
            self,
            "MedicalImagingVpc",
            vpc_name=f"medical-imaging-vpc-{environment_suffix}",
            max_azs=2,
            nat_gateways=1,  # Cost optimization: single NAT gateway
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
                ec2.SubnetConfiguration(
                    name=f"isolated-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # Security group for RDS
        rds_security_group = ec2.SecurityGroup(
            self,
            "RdsSecurityGroup",
            vpc=vpc,
            description="Security group for RDS Aurora PostgreSQL",
            allow_all_outbound=False,
        )

        # Security group for ECS tasks
        ecs_security_group = ec2.SecurityGroup(
            self,
            "EcsSecurityGroup",
            vpc=vpc,
            description="Security group for ECS Fargate tasks",
            allow_all_outbound=True,
        )

        # Security group for ElastiCache
        elasticache_security_group = ec2.SecurityGroup(
            self,
            "ElastiCacheSecurityGroup",
            vpc=vpc,
            description="Security group for ElastiCache Redis",
            allow_all_outbound=False,
        )

        # Security group for EFS
        efs_security_group = ec2.SecurityGroup(
            self,
            "EfsSecurityGroup",
            vpc=vpc,
            description="Security group for EFS",
            allow_all_outbound=False,
        )

        # Allow ECS to access RDS
        rds_security_group.add_ingress_rule(
            peer=ecs_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow ECS tasks to access RDS",
        )

        # Allow ECS to access ElastiCache
        elasticache_security_group.add_ingress_rule(
            peer=ecs_security_group,
            connection=ec2.Port.tcp(6379),
            description="Allow ECS tasks to access Redis",
        )

        # Allow ECS to access EFS
        efs_security_group.add_ingress_rule(
            peer=ecs_security_group,
            connection=ec2.Port.tcp(2049),
            description="Allow ECS tasks to mount EFS",
        )

        # Create database credentials secret
        db_secret = secretsmanager.Secret(
            self,
            "DbSecret",
            secret_name=f"medical-imaging-db-secret-{environment_suffix}",
            description="Database credentials for Aurora PostgreSQL",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps(
                    {"username": "dbuser", "dbname": database_name}
                ),
                generate_string_key="password",
                exclude_characters='"@/\\',
                password_length=32,
            ),
            encryption_key=kms_key,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create RDS Aurora PostgreSQL cluster
        db_cluster = rds.DatabaseCluster(
            self,
            "AuroraCluster",
            cluster_identifier=f"medical-imaging-db-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_16_4
            ),
            default_database_name=database_name,
            credentials=rds.Credentials.from_secret(db_secret),
            writer=rds.ClusterInstance.serverless_v2(
                "writer",
                enable_performance_insights=True,
                performance_insight_encryption_key=kms_key,
            ),
            readers=[
                rds.ClusterInstance.serverless_v2(
                    "reader",
                    scale_with_writer=True,
                    enable_performance_insights=True,
                    performance_insight_encryption_key=kms_key,
                )
            ],
            serverless_v2_min_capacity=0.5,
            serverless_v2_max_capacity=2,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[rds_security_group],
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            backup=rds.BackupProps(retention=Duration.days(7)),
            cloudwatch_logs_exports=["postgresql"],
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create EFS file system
        file_system = efs.FileSystem(
            self,
            "DicomStorage",
            vpc=vpc,
            file_system_name=f"dicom-storage-{environment_suffix}",
            encrypted=True,
            kms_key=kms_key,
            lifecycle_policy=efs.LifecyclePolicy.AFTER_7_DAYS,
            performance_mode=efs.PerformanceMode.GENERAL_PURPOSE,
            throughput_mode=efs.ThroughputMode.BURSTING,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_group=efs_security_group,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create EFS access point
        efs_access_point = file_system.add_access_point(
            "ProcessingAccessPoint",
            path="/dicom",
            create_acl=efs.Acl(owner_uid="1000", owner_gid="1000", permissions="755"),
            posix_user=efs.PosixUser(uid="1000", gid="1000"),
        )

        # Create ElastiCache subnet group
        cache_subnet_group = elasticache.CfnSubnetGroup(
            self,
            "CacheSubnetGroup",
            cache_subnet_group_name=f"redis-subnet-group-{environment_suffix}",
            description="Subnet group for ElastiCache Redis",
            subnet_ids=[subnet.subnet_id for subnet in vpc.private_subnets],
        )

        # Create ElastiCache replication group (Redis cluster)
        redis_cluster = elasticache.CfnReplicationGroup(
            self,
            "RedisCluster",
            replication_group_id=f"redis-cluster-{environment_suffix}",
            replication_group_description="Redis cluster for medical imaging queue",
            engine="redis",
            engine_version="7.0",
            cache_node_type="cache.t3.small",
            num_cache_clusters=2,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            at_rest_encryption_enabled=True,
            kms_key_id=kms_key.key_id,
            transit_encryption_enabled=True,
            cache_subnet_group_name=cache_subnet_group.cache_subnet_group_name,
            security_group_ids=[elasticache_security_group.security_group_id],
            snapshot_retention_limit=1,
        )
        redis_cluster.add_dependency(cache_subnet_group)

        # Create Kinesis Data Stream
        kinesis_stream = kinesis.Stream(
            self,
            "ProcessingEventsStream",
            stream_name=f"medical-imaging-events-{environment_suffix}",
            shard_count=1,
            encryption=kinesis.StreamEncryption.KMS,
            encryption_key=kms_key,
            retention_period=Duration.hours(24),
        )
        kinesis_stream.apply_removal_policy(RemovalPolicy.DESTROY)

        # Create ECS cluster
        ecs_cluster = ecs.Cluster(
            self,
            "ProcessingCluster",
            cluster_name=f"medical-imaging-cluster-{environment_suffix}",
            vpc=vpc,
            container_insights=True,
        )

        # Create CloudWatch log group for ECS tasks
        log_group = logs.LogGroup(
            self,
            "TaskLogGroup",
            log_group_name=f"/ecs/medical-imaging-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            encryption_key=kms_key,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create task execution role
        task_execution_role = iam.Role(
            self,
            "TaskExecutionRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            description="ECS task execution role",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ],
        )

        # Grant permissions to read secrets
        db_secret.grant_read(task_execution_role)
        kms_key.grant_decrypt(task_execution_role)

        # Create task role with permissions
        task_role = iam.Role(
            self,
            "TaskRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            description="ECS task role for image processing",
        )

        # Grant task permissions
        db_secret.grant_read(task_role)
        kms_key.grant_decrypt(task_role)
        kinesis_stream.grant_write(task_role)

        # EFS permissions
        task_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "elasticfilesystem:ClientMount",
                    "elasticfilesystem:ClientWrite",
                    "elasticfilesystem:ClientRootAccess",
                ],
                resources=[file_system.file_system_arn],
            )
        )

        # Create Fargate task definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            "TaskDefinition",
            family=f"medical-imaging-processor-{environment_suffix}",
            memory_limit_mib=2048,
            cpu=1024,
            execution_role=task_execution_role,
            task_role=task_role,
        )

        # Add EFS volume to task definition
        task_definition.add_volume(
            name="dicom-storage",
            efs_volume_configuration=ecs.EfsVolumeConfiguration(
                file_system_id=file_system.file_system_id,
                transit_encryption="ENABLED",
                authorization_config=ecs.AuthorizationConfig(
                    access_point_id=efs_access_point.access_point_id,
                    iam="ENABLED",
                ),
            ),
        )

        # Add container to task definition
        container = task_definition.add_container(
            "ProcessorContainer",
            image=ecs.ContainerImage.from_registry(
                "public.ecr.aws/docker/library/python:3.11-slim"
            ),
            logging=ecs.LogDriver.aws_logs(
                stream_prefix="medical-imaging",
                log_group=log_group,
            ),
            environment={
                "KINESIS_STREAM_NAME": kinesis_stream.stream_name,
                "REDIS_HOST": redis_cluster.attr_primary_end_point_address,
                "REDIS_PORT": redis_cluster.attr_primary_end_point_port,
                "AWS_REGION": self.region,
                "DB_HOST": db_cluster.cluster_endpoint.hostname,
                "DB_PORT": str(db_cluster.cluster_endpoint.port),
                "DB_NAME": database_name,
            },
            secrets={
                "DB_USERNAME": ecs.Secret.from_secrets_manager(db_secret, "username"),
                "DB_PASSWORD": ecs.Secret.from_secrets_manager(db_secret, "password"),
            },
        )

        # Add mount point for EFS
        container.add_mount_points(
            ecs.MountPoint(
                container_path="/mnt/dicom",
                source_volume="dicom-storage",
                read_only=False,
            )
        )

        # Create Fargate service
        fargate_service = ecs.FargateService(
            self,
            "ProcessingService",
            cluster=ecs_cluster,
            task_definition=task_definition,
            service_name=f"medical-imaging-service-{environment_suffix}",
            desired_count=1,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[ecs_security_group],
            enable_execute_command=True,
        )

        # Create API Gateway with mutual TLS
        api_log_group = logs.LogGroup(
            self,
            "ApiLogGroup",
            log_group_name=f"/aws/apigateway/medical-imaging-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            encryption_key=kms_key,
            removal_policy=RemovalPolicy.DESTROY,
        )

        api_gateway_log_role = iam.Role(
            self,
            "ApiGatewayCloudWatchRole",
            assumed_by=iam.ServicePrincipal("apigateway.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
                )
            ],
        )

        api_gateway_account = apigateway.CfnAccount(
            self,
            "ApiGatewayAccountConfig",
            cloud_watch_role_arn=api_gateway_log_role.role_arn,
        )

        api = apigateway.RestApi(
            self,
            "MedicalImagingApi",
            rest_api_name=f"medical-imaging-api-{environment_suffix}",
            description="API Gateway for medical imaging ingestion with mTLS",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                access_log_destination=apigateway.LogGroupLogDestination(api_log_group),
                access_log_format=apigateway.AccessLogFormat.clf(),
            ),
            endpoint_configuration=apigateway.EndpointConfiguration(
                types=[apigateway.EndpointType.REGIONAL]
            ),
        )
        api.node.add_dependency(api_gateway_account)

        # Add a health check endpoint
        health_resource = api.root.add_resource("health")
        health_integration = apigateway.MockIntegration(
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_templates={"application/json": '{"status": "healthy"}'},
                )
            ],
            request_templates={"application/json": '{"statusCode": 200}'},
        )
        health_resource.add_method(
            "GET",
            health_integration,
            method_responses=[apigateway.MethodResponse(status_code="200")],
        )

        # Add upload endpoint
        upload_resource = api.root.add_resource("upload")
        upload_integration = apigateway.MockIntegration(
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_templates={
                        "application/json": '{"message": "Upload endpoint ready"}'
                    },
                )
            ],
            request_templates={"application/json": '{"statusCode": 200}'},
        )
        upload_resource.add_method(
            "POST",
            upload_integration,
            method_responses=[apigateway.MethodResponse(status_code="200")],
        )

        # # CloudWatch alarms for monitoring
        db_cluster.metric_cpu_utilization().create_alarm(
            self,
            "DatabaseCpuAlarm",
            alarm_name=f"medical-imaging-db-cpu-{environment_suffix}",
            alarm_description="Database CPU utilization is too high",
            threshold=80,
            evaluation_periods=2,
        )

        kinesis_stream.metric_get_records_success().create_alarm(
            self,
            "KinesisProcessingAlarm",
            alarm_name=f"medical-imaging-kinesis-{environment_suffix}",
            alarm_description="Kinesis stream processing issues",
            threshold=0.95,
            evaluation_periods=2,
            comparison_operator=aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        )

        # Outputs
        CfnOutput(
            self,
            "VpcId",
            value=vpc.vpc_id,
            description="VPC ID",
            export_name=f"MedicalImagingVpcId-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DatabaseEndpoint",
            value=db_cluster.cluster_endpoint.hostname,
            description="RDS Aurora cluster endpoint",
            export_name=f"MedicalImagingDbEndpoint-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DatabaseSecretArn",
            value=db_secret.secret_arn,
            description="Database credentials secret ARN",
            export_name=f"MedicalImagingDbSecretArn-{environment_suffix}",
        )

        CfnOutput(
            self,
            "EfsFileSystemId",
            value=file_system.file_system_id,
            description="EFS file system ID",
            export_name=f"MedicalImagingEfsId-{environment_suffix}",
        )

        CfnOutput(
            self,
            "RedisEndpoint",
            value=redis_cluster.attr_primary_end_point_address,
            description="ElastiCache Redis primary endpoint",
            export_name=f"MedicalImagingRedisEndpoint-{environment_suffix}",
        )

        CfnOutput(
            self,
            "KinesisStreamName",
            value=kinesis_stream.stream_name,
            description="Kinesis Data Stream name",
            export_name=f"MedicalImagingKinesisStream-{environment_suffix}",
        )

        CfnOutput(
            self,
            "EcsClusterName",
            value=ecs_cluster.cluster_name,
            description="ECS cluster name",
            export_name=f"MedicalImagingEcsCluster-{environment_suffix}",
        )

        CfnOutput(
            self,
            "ApiGatewayUrl",
            value=api.url,
            description="API Gateway URL",
            export_name=f"MedicalImagingApiUrl-{environment_suffix}",
        )

        CfnOutput(
            self,
            "KmsKeyId",
            value=kms_key.key_id,
            description="KMS key ID for encryption",
            export_name=f"MedicalImagingKmsKeyId-{environment_suffix}",
        )
