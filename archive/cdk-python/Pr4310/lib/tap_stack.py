"""
CDK Stack for IoT sensor data processing infrastructure.

This stack implements a HIPAA and ISO 27001 compliant infrastructure for processing
medical device manufacturing sensor data with encryption, monitoring, and audit logging.
"""
from typing import Optional
from dataclasses import dataclass

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    RemovalPolicy,
    Duration,
    Tags,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_rds as rds,
    aws_elasticache as elasticache,
    aws_kinesis as kinesis,
    aws_kms as kms,
    aws_logs as logs,
    aws_iam as iam,
    aws_secretsmanager as secretsmanager,
)
from constructs import Construct


@dataclass
class TapStackProps(cdk.StackProps):
    """Properties for TapStack."""
    environment_suffix: str


class TapStack(Stack):
    """
    Main CDK stack for IoT data processing infrastructure.

    Creates a secure, compliant infrastructure for processing medical device
    sensor data with encryption, monitoring, and proper network isolation.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: TapStackProps,
        **kwargs
    ) -> None:
        """
        Initialize the TapStack with all required resources.

        Args:
            scope: CDK app scope
            construct_id: Unique identifier for this stack
            props: Stack properties including environment_suffix
            **kwargs: Additional stack properties
        """
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = props.environment_suffix

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()

        # Create VPC with public and private subnets
        self.vpc = self._create_vpc()

        # Create security groups
        self.ecs_security_group = self._create_ecs_security_group()
        self.rds_security_group = self._create_rds_security_group()
        self.elasticache_security_group = self._create_elasticache_security_group()

        # Create CloudWatch log groups
        self.ecs_log_group = self._create_log_group("ecs")
        self.app_log_group = self._create_log_group("app")

        # Create Kinesis data stream
        self.kinesis_stream = self._create_kinesis_stream()

        # Create ECS cluster
        self.ecs_cluster = self._create_ecs_cluster()

        # Create Aurora Serverless v2 database
        self.database = self._create_aurora_serverless_database()

        # Create ElastiCache Redis cluster
        self.elasticache_cluster = self._create_elasticache_cluster()

        # Create IAM roles for ECS tasks
        self.ecs_task_role = self._create_ecs_task_role()
        self.ecs_execution_role = self._create_ecs_execution_role()

        # Create stack outputs
        self._create_outputs()

        # Add tags to all resources
        self._add_tags()

    def _create_kms_key(self) -> kms.Key:
        """Create KMS key for encryption at rest."""
        key = kms.Key(
            self,
            "EncryptionKey",
            description=f"KMS key for IoT data encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Allow CloudWatch Logs service to use this key
        key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Enable CloudWatch Logs",
                effect=iam.Effect.ALLOW,
                principals=[
                    iam.ServicePrincipal("logs.amazonaws.com")
                ],
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ],
                resources=["*"],
                conditions={
                    "ArnEquals": {
                        "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.region}:{self.account}:*"
                    }
                }
            )
        )

        return key

    def _create_vpc(self) -> ec2.Vpc:
        """
        Create VPC with public and private subnets.

        Creates a VPC with:
        - Public subnets for NAT Gateway
        - Private subnets for ECS, RDS, and ElastiCache
        - NAT Gateway for outbound connectivity
        - 2 availability zones for high availability
        """
        vpc = ec2.Vpc(
            self,
            "VPC",
            vpc_name=f"iot-vpc-{self.environment_suffix}",
            max_azs=2,
            nat_gateways=1,  # Single NAT Gateway to reduce costs
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
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

        # Add VPC flow logs for security monitoring
        log_group = logs.LogGroup(
            self,
            "VPCFlowLogsGroup",
            log_group_name=f"/aws/vpc/flowlogs-{self.environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY,
        )

        ec2.FlowLog(
            self,
            "VPCFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(log_group),
        )

        return vpc

    def _create_ecs_security_group(self) -> ec2.SecurityGroup:
        """Create security group for ECS tasks."""
        sg = ec2.SecurityGroup(
            self,
            "ECSSecurityGroup",
            vpc=self.vpc,
            description=f"Security group for ECS tasks - {self.environment_suffix}",
            security_group_name=f"ecs-sg-{self.environment_suffix}",
            allow_all_outbound=True,
        )
        return sg

    def _create_rds_security_group(self) -> ec2.SecurityGroup:
        """Create security group for RDS database."""
        sg = ec2.SecurityGroup(
            self,
            "RDSSecurityGroup",
            vpc=self.vpc,
            description=f"Security group for RDS database - {self.environment_suffix}",
            security_group_name=f"rds-sg-{self.environment_suffix}",
            allow_all_outbound=False,
        )

        # Allow inbound PostgreSQL traffic from ECS security group
        sg.add_ingress_rule(
            peer=self.ecs_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL from ECS tasks",
        )

        return sg

    def _create_elasticache_security_group(self) -> ec2.SecurityGroup:
        """Create security group for ElastiCache Redis cluster."""
        sg = ec2.SecurityGroup(
            self,
            "ElastiCacheSecurityGroup",
            vpc=self.vpc,
            description=f"Security group for ElastiCache Redis - {self.environment_suffix}",
            security_group_name=f"elasticache-sg-{self.environment_suffix}",
            allow_all_outbound=False,
        )

        # Allow inbound Redis traffic from ECS security group
        sg.add_ingress_rule(
            peer=self.ecs_security_group,
            connection=ec2.Port.tcp(6379),
            description="Allow Redis from ECS tasks",
        )

        return sg

    def _create_log_group(self, name_suffix: str) -> logs.LogGroup:
        """Create CloudWatch log group."""
        log_group = logs.LogGroup(
            self,
            f"LogGroup{name_suffix.capitalize()}",
            log_group_name=f"/aws/iot/{name_suffix}-{self.environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY,
            encryption_key=self.kms_key,
        )
        return log_group

    def _create_kinesis_stream(self) -> kinesis.Stream:
        """Create Kinesis data stream for IoT data ingestion."""
        stream = kinesis.Stream(
            self,
            "IoTDataStream",
            stream_name=f"iot-data-stream-{self.environment_suffix}",
            shard_count=2,
            retention_period=Duration.hours(24),
            encryption=kinesis.StreamEncryption.KMS,
            encryption_key=self.kms_key,
        )
        return stream

    def _create_ecs_cluster(self) -> ecs.Cluster:
        """Create ECS cluster for data processing applications."""
        cluster = ecs.Cluster(
            self,
            "ProcessingCluster",
            cluster_name=f"iot-processing-{self.environment_suffix}",
            vpc=self.vpc,
            container_insights=True,  # Enable CloudWatch Container Insights
        )
        return cluster

    def _create_aurora_serverless_database(self) -> rds.DatabaseCluster:
        """
        Create Aurora Serverless v2 PostgreSQL database.

        Configured with:
        - Encryption at rest using KMS
        - 30-day backup retention for compliance
        - Private subnet deployment
        - Automated backups enabled
        """
        # Create subnet group for RDS in private subnets
        subnet_group = rds.SubnetGroup(
            self,
            "DBSubnetGroup",
            description=f"Subnet group for Aurora database - {self.environment_suffix}",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create database cluster
        cluster = rds.DatabaseCluster(
            self,
            "AuroraCluster",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_3
            ),
            cluster_identifier=f"iot-db-{self.environment_suffix}",
            writer=rds.ClusterInstance.serverless_v2(
                "Writer",
                scale_with_writer=True,
            ),
            serverless_v2_min_capacity=0.5,
            serverless_v2_max_capacity=2,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            subnet_group=subnet_group,
            security_groups=[self.rds_security_group],
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            backup=rds.BackupProps(
                retention=Duration.days(30),  # HIPAA compliance requirement
            ),
            cloudwatch_logs_exports=["postgresql"],
            cloudwatch_logs_retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY,
            credentials=rds.Credentials.from_generated_secret(
                username="dbadmin",
                secret_name=f"iot-db-credentials-{self.environment_suffix}",
            ),
        )

        return cluster

    def _create_elasticache_cluster(self) -> elasticache.CfnReplicationGroup:
        """
        Create ElastiCache Redis cluster for temporary data caching.

        Configured with:
        - Encryption at rest and in transit
        - Private subnet deployment
        - Automatic failover enabled
        """
        # Create subnet group for ElastiCache
        subnet_group = elasticache.CfnSubnetGroup(
            self,
            "CacheSubnetGroup",
            description=f"Subnet group for Redis cache - {self.environment_suffix}",
            subnet_ids=[
                subnet.subnet_id
                for subnet in self.vpc.select_subnets(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ).subnets
            ],
            cache_subnet_group_name=f"redis-subnet-{self.environment_suffix}",
        )

        # Create Redis replication group
        replication_group = elasticache.CfnReplicationGroup(
            self,
            "RedisCluster",
            replication_group_id=f"redis-{self.environment_suffix}",
            replication_group_description="Redis cluster for IoT data caching",
            engine="redis",
            engine_version="7.0",
            cache_node_type="cache.t3.micro",
            num_cache_clusters=2,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            kms_key_id=self.kms_key.key_id,
            security_group_ids=[self.elasticache_security_group.security_group_id],
            cache_subnet_group_name=subnet_group.cache_subnet_group_name,
            log_delivery_configurations=[
                elasticache.CfnReplicationGroup.LogDeliveryConfigurationRequestProperty(
                    destination_details=(
                        elasticache.CfnReplicationGroup.DestinationDetailsProperty(
                            cloud_watch_logs_details=(
                                elasticache.CfnReplicationGroup
                                .CloudWatchLogsDestinationDetailsProperty(
                                    log_group=f"/aws/elasticache/redis-{self.environment_suffix}"
                                )
                            )
                        )
                    ),
                    destination_type="cloudwatch-logs",
                    log_format="json",
                    log_type="slow-log",
                )
            ],
        )

        replication_group.add_dependency(subnet_group)

        # Create log group for ElastiCache
        logs.LogGroup(
            self,
            "RedisLogGroup",
            log_group_name=f"/aws/elasticache/redis-{self.environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY,
            encryption_key=self.kms_key,
        )

        return replication_group

    def _create_ecs_task_role(self) -> iam.Role:
        """
        Create IAM role for ECS tasks with least privilege permissions.

        Grants permissions to:
        - Read from Kinesis stream
        - Write to CloudWatch Logs
        - Access KMS key for decryption
        - Access RDS database (via security groups)
        - Access ElastiCache (via security groups)
        """
        role = iam.Role(
            self,
            "ECSTaskRole",
            role_name=f"ecs-task-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            description="IAM role for ECS tasks to access AWS services",
        )

        # Kinesis permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kinesis:GetRecords",
                    "kinesis:GetShardIterator",
                    "kinesis:DescribeStream",
                    "kinesis:ListShards",
                ],
                resources=[self.kinesis_stream.stream_arn],
            )
        )

        # CloudWatch Logs permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=[
                    self.ecs_log_group.log_group_arn,
                    self.app_log_group.log_group_arn,
                ],
            )
        )

        # KMS permissions for decryption
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt",
                    "kms:DescribeKey",
                ],
                resources=[self.kms_key.key_arn],
            )
        )

        return role

    def _create_ecs_execution_role(self) -> iam.Role:
        """
        Create IAM role for ECS task execution.

        Grants permissions to:
        - Pull container images from ECR
        - Write logs to CloudWatch
        - Access Secrets Manager for database credentials
        """
        role = iam.Role(
            self,
            "ECSExecutionRole",
            role_name=f"ecs-execution-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ],
            description="IAM role for ECS task execution",
        )

        # Secrets Manager permissions for database credentials
        secret_arn = (
            f"arn:aws:secretsmanager:{self.region}:{self.account}:"
            f"secret:iot-db-credentials-{self.environment_suffix}*"
        )
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "secretsmanager:GetSecretValue",
                ],
                resources=[secret_arn],
            )
        )

        # KMS permissions for secrets decryption
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt",
                    "kms:DescribeKey",
                ],
                resources=[self.kms_key.key_arn],
            )
        )

        return role

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs for important resources."""
        cdk.CfnOutput(
            self,
            "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name=f"VPCId-{self.environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "ECSClusterName",
            value=self.ecs_cluster.cluster_name,
            description="ECS Cluster Name",
            export_name=f"ECSClusterName-{self.environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "ECSClusterArn",
            value=self.ecs_cluster.cluster_arn,
            description="ECS Cluster ARN",
            export_name=f"ECSClusterArn-{self.environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "DatabaseEndpoint",
            value=self.database.cluster_endpoint.hostname,
            description="Aurora Database Endpoint",
            export_name=f"DatabaseEndpoint-{self.environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "DatabaseSecretArn",
            value=self.database.secret.secret_arn,
            description="Database Secret ARN",
            export_name=f"DatabaseSecretArn-{self.environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "RedisEndpoint",
            value=self.elasticache_cluster.attr_primary_end_point_address,
            description="Redis Primary Endpoint",
            export_name=f"RedisEndpoint-{self.environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "RedisPort",
            value=self.elasticache_cluster.attr_primary_end_point_port,
            description="Redis Port",
            export_name=f"RedisPort-{self.environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "KinesisStreamName",
            value=self.kinesis_stream.stream_name,
            description="Kinesis Stream Name",
            export_name=f"KinesisStreamName-{self.environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "KinesisStreamArn",
            value=self.kinesis_stream.stream_arn,
            description="Kinesis Stream ARN",
            export_name=f"KinesisStreamArn-{self.environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "KMSKeyId",
            value=self.kms_key.key_id,
            description="KMS Key ID",
            export_name=f"KMSKeyId-{self.environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "KMSKeyArn",
            value=self.kms_key.key_arn,
            description="KMS Key ARN",
            export_name=f"KMSKeyArn-{self.environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "ECSTaskRoleArn",
            value=self.ecs_task_role.role_arn,
            description="ECS Task Role ARN",
            export_name=f"ECSTaskRoleArn-{self.environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "ECSExecutionRoleArn",
            value=self.ecs_execution_role.role_arn,
            description="ECS Execution Role ARN",
            export_name=f"ECSExecutionRoleArn-{self.environment_suffix}",
        )

    def _add_tags(self) -> None:
        """Add tags to all resources in the stack."""
        Tags.of(self).add("Project", "IoT-Data-Processing")
        Tags.of(self).add("Environment", self.environment_suffix)
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("Compliance", "HIPAA-ISO27001")
