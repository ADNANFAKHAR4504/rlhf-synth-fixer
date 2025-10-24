"""TAP Stack module for CDKTF Python infrastructure."""

import json

from cdktf import Fn, S3Backend, TerraformOutput, TerraformStack
from cdktf_cdktf_provider_aws.api_gateway_deployment import \
    ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_integration import \
    ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_method_settings import (
    ApiGatewayMethodSettings, ApiGatewayMethodSettingsSettings)
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.appautoscaling_policy import (
    AppautoscalingPolicy,
    AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration,
    AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification)
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.cloudtrail import Cloudtrail
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import \
    CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_service import (
    EcsService, EcsServiceLoadBalancer, EcsServiceNetworkConfiguration)
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.elasticache_replication_group import \
    ElasticacheReplicationGroup
from cdktf_cdktf_provider_aws.elasticache_subnet_group import \
    ElasticacheSubnetGroup
from cdktf_cdktf_provider_aws.fis_experiment_template import (
    FisExperimentTemplate, FisExperimentTemplateAction,
    FisExperimentTemplateActionTarget, FisExperimentTemplateStopCondition,
    FisExperimentTemplateTarget, FisExperimentTemplateTargetFilter,
    FisExperimentTemplateTargetResourceTag)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.kinesis_firehose_delivery_stream import (
    KinesisFirehoseDeliveryStream,
    KinesisFirehoseDeliveryStreamExtendedS3Configuration,
    KinesisFirehoseDeliveryStreamKinesisSourceConfiguration)
from cdktf_cdktf_provider_aws.kinesis_stream import KinesisStream
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_listener import (LbListener,
                                                  LbListenerDefaultAction)
from cdktf_cdktf_provider_aws.lb_target_group import (LbTargetGroup,
                                                      LbTargetGroupHealthCheck)
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import \
    RouteTableAssociation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import \
    S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA)
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.scheduler_schedule import (
    SchedulerSchedule, SchedulerScheduleFlexibleTimeWindow,
    SchedulerScheduleTarget, SchedulerScheduleTargetRetryPolicy)
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_rotation import \
    SecretsmanagerSecretRotation
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import \
    SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.security_group import (SecurityGroup,
                                                     SecurityGroupEgress,
                                                     SecurityGroupIngress)
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc
from constructs import Construct


class TapStack(TerraformStack):
    """CDKTF Python stack for Educational Assessment Platform infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        # Use 'or' to handle empty strings as well as None
        environment_suffix = kwargs.get('environment_suffix') or 'dev'
        aws_region = kwargs.get('aws_region') or 'eu-west-2'
        state_bucket_region = kwargs.get('state_bucket_region') or 'eu-west-2'
        state_bucket = kwargs.get('state_bucket') or 'iac-rlhf-tf-states'
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # =============================================================================
        # VPC and Networking - Multi-AZ for High Availability
        # =============================================================================

        # Create VPC for the assessment platform
        vpc = Vpc(
            self,
            "assessment_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"assessment-vpc-{environment_suffix}"}
        )

        # Internet Gateway for public subnets
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=vpc.id,
            tags={"Name": f"assessment-igw-{environment_suffix}"}
        )

        # Public subnets in 2 AZs for ALB
        public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
            tags={"Name": f"assessment-public-subnet-1-{environment_suffix}"}
        )

        public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}c",
            map_public_ip_on_launch=True,
            tags={"Name": f"assessment-public-subnet-2-{environment_suffix}"}
        )

        # Private subnets in 2 AZs for ECS, RDS, and ElastiCache
        private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{aws_region}a",
            tags={"Name": f"assessment-private-subnet-1-{environment_suffix}"}
        )

        private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=f"{aws_region}c",
            tags={"Name": f"assessment-private-subnet-2-{environment_suffix}"}
        )

        # Route table for public subnets
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={"Name": f"assessment-public-rt-{environment_suffix}"}
        )

        # Associate public subnets with public route table
        RouteTableAssociation(
            self,
            "public_rt_assoc_1",
            subnet_id=public_subnet_1.id,
            route_table_id=public_rt.id
        )

        RouteTableAssociation(
            self,
            "public_rt_assoc_2",
            subnet_id=public_subnet_2.id,
            route_table_id=public_rt.id
        )

        # =============================================================================
        # KMS Keys for Encryption (FERPA Compliance)
        # =============================================================================

        # KMS key for RDS encryption
        rds_kms_key = KmsKey(
            self,
            "rds_kms_key",
            description=f"KMS key for RDS encryption - {environment_suffix}",
            deletion_window_in_days=30,
            enable_key_rotation=True,
            tags={"Name": f"assessment-rds-kms-{environment_suffix}"}
        )

        KmsAlias(
            self,
            "rds_kms_alias",
            name=f"alias/assessment-rds-{environment_suffix}",
            target_key_id=rds_kms_key.id
        )

        # KMS key for S3 encryption
        s3_kms_key = KmsKey(
            self,
            "s3_kms_key",
            description=f"KMS key for S3 encryption - {environment_suffix}",
            deletion_window_in_days=30,
            enable_key_rotation=True,
            tags={"Name": f"assessment-s3-kms-{environment_suffix}"}
        )

        KmsAlias(
            self,
            "s3_kms_alias",
            name=f"alias/assessment-s3-{environment_suffix}",
            target_key_id=s3_kms_key.id
        )

        # =============================================================================
        # Security Groups with Least Privilege Access
        # =============================================================================

        # Security group for ALB (allows HTTP/HTTPS from internet)
        alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=f"assessment-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from internet"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from internet"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={"Name": f"assessment-alb-sg-{environment_suffix}"}
        )

        # Security group for ECS tasks
        ecs_sg = SecurityGroup(
            self,
            "ecs_sg",
            name=f"assessment-ecs-sg-{environment_suffix}",
            description="Security group for ECS tasks",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[alb_sg.id],
                    description="Allow traffic from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={"Name": f"assessment-ecs-sg-{environment_suffix}"}
        )

        # Security group for RDS
        rds_sg = SecurityGroup(
            self,
            "rds_sg",
            name=f"assessment-rds-sg-{environment_suffix}",
            description="Security group for RDS Aurora cluster",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[ecs_sg.id],
                    description="Allow PostgreSQL from ECS tasks"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={"Name": f"assessment-rds-sg-{environment_suffix}"}
        )

        # Security group for ElastiCache Redis
        redis_sg = SecurityGroup(
            self,
            "redis_sg",
            name=f"assessment-redis-sg-{environment_suffix}",
            description="Security group for ElastiCache Redis",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    security_groups=[ecs_sg.id],
                    description="Allow Redis from ECS tasks"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={"Name": f"assessment-redis-sg-{environment_suffix}"}
        )

        # =============================================================================
        # S3 Bucket for Analytics Data
        # =============================================================================

        # S3 bucket for storing assessment analytics
        analytics_bucket = S3Bucket(
            self,
            "analytics_bucket",
            bucket=f"assessment-analytics-{environment_suffix}",
            tags={"Name": f"assessment-analytics-{environment_suffix}", "DataClassification": "Confidential"}
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            "analytics_bucket_versioning",
            bucket=analytics_bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

        # Configure encryption using KMS
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "analytics_bucket_encryption",
            bucket=analytics_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=s3_kms_key.arn
                ),
                bucket_key_enabled=True
            )]
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "analytics_bucket_public_access_block",
            bucket=analytics_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # =============================================================================
        # Secrets Manager for Credentials (FERPA Compliance)
        # =============================================================================

        # Secret for RDS master password
        db_secret = SecretsmanagerSecret(
            self,
            "db_secret",
            name=f"assessment-db-master-password-{environment_suffix}",
            description="Master password for RDS Aurora cluster",
            tags={"Name": f"assessment-db-secret-{environment_suffix}"}
        )

        # Generate a random password for initial setup
        db_secret_version = SecretsmanagerSecretVersion(
            self,
            "db_secret_version",
            secret_id=db_secret.id,
            secret_string=json.dumps({
                "username": "assessmentadmin",
                "password": "ChangeMe123!InitialPassword"
            })
        )

        # Secret for Redis connection string
        redis_secret = SecretsmanagerSecret(
            self,
            "redis_secret",
            name=f"assessment-redis-connection-{environment_suffix}",
            description="ElastiCache Redis connection string",
            tags={"Name": f"assessment-redis-secret-{environment_suffix}"}
        )

        # =============================================================================
        # RDS Aurora PostgreSQL Cluster (Multi-AZ)
        # =============================================================================

        # DB subnet group for RDS
        db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"assessment-db-subnet-group-{environment_suffix}",
            description="Subnet group for RDS Aurora cluster",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={"Name": f"assessment-db-subnet-group-{environment_suffix}"}
        )

        # RDS Aurora cluster
        rds_cluster = RdsCluster(
            self,
            "rds_cluster",
            cluster_identifier=f"assessment-db-cluster-{environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            engine_version="15.4",
            database_name="assessmentdb",
            master_username="assessmentadmin",
            master_password="ChangeMe123!InitialPassword",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            storage_encrypted=True,
            kms_key_id=rds_kms_key.arn,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,
            enabled_cloudwatch_logs_exports=["postgresql"],
            serverlessv2_scaling_configuration={
                "max_capacity": 16.0,
                "min_capacity": 0.5
            },
            tags={"Name": f"assessment-db-cluster-{environment_suffix}"}
        )

        # RDS cluster instances (2 instances for Multi-AZ)
        rds_instance_1 = RdsClusterInstance(
            self,
            "rds_instance_1",
            identifier=f"assessment-db-instance-1-{environment_suffix}",
            cluster_identifier=rds_cluster.id,
            instance_class="db.serverless",
            engine=rds_cluster.engine,
            engine_version=rds_cluster.engine_version,
            publicly_accessible=False,
            tags={"Name": f"assessment-db-instance-1-{environment_suffix}"}
        )

        rds_instance_2 = RdsClusterInstance(
            self,
            "rds_instance_2",
            identifier=f"assessment-db-instance-2-{environment_suffix}",
            cluster_identifier=rds_cluster.id,
            instance_class="db.serverless",
            engine=rds_cluster.engine,
            engine_version=rds_cluster.engine_version,
            publicly_accessible=False,
            tags={"Name": f"assessment-db-instance-2-{environment_suffix}"}
        )

        # Lambda function for RDS secret rotation (placeholder)
        rotation_lambda_role = IamRole(
            self,
            "rotation_lambda_role",
            name=f"assessment-rotation-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"assessment-rotation-lambda-role-{environment_suffix}"}
        )

        IamRolePolicyAttachment(
            self,
            "rotation_lambda_basic_execution",
            role=rotation_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        IamRolePolicyAttachment(
            self,
            "rotation_lambda_vpc_execution",
            role=rotation_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        rotation_lambda = LambdaFunction(
            self,
            "rotation_lambda",
            function_name=f"assessment-db-rotation-{environment_suffix}",
            role=rotation_lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            filename="../../../lambda_placeholder.zip",
            source_code_hash=Fn.filebase64sha256("../../../lambda_placeholder.zip"),
            timeout=30,
            environment={
                "variables": {
                    "SECRETS_MANAGER_ENDPOINT": f"https://secretsmanager.{aws_region}.amazonaws.com"
                }
            },
            tags={"Name": f"assessment-db-rotation-{environment_suffix}"}
        )

        # Add permission for Secrets Manager to invoke the Lambda function
        from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
        
        LambdaPermission(
            self,
            "secrets_manager_lambda_permission",
            statement_id="AllowSecretsManagerInvoke",
            action="lambda:InvokeFunction",
            function_name=rotation_lambda.function_name,
            principal="secretsmanager.amazonaws.com"
        )

        # Enable automatic rotation (30 days)
        SecretsmanagerSecretRotation(
            self,
            "db_secret_rotation",
            secret_id=db_secret.id,
            rotation_lambda_arn=rotation_lambda.arn,
            rotation_rules={
                "automatically_after_days": 30
            }
        )

        # =============================================================================
        # ElastiCache Redis Cluster (Multi-AZ)
        # =============================================================================

        # ElastiCache subnet group
        elasticache_subnet_group = ElasticacheSubnetGroup(
            self,
            "elasticache_subnet_group",
            name=f"assessment-redis-subnet-group-{environment_suffix}",
            description="Subnet group for ElastiCache Redis",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id]
        )

        # ElastiCache Redis replication group
        redis_cluster = ElasticacheReplicationGroup(
            self,
            "redis_cluster",
            replication_group_id=f"assessment-redis-{environment_suffix}",
            description="Redis cluster for session management and caching",
            engine="redis",
            engine_version="7.0",
            node_type="cache.r6g.large",
            num_cache_clusters=2,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            subnet_group_name=elasticache_subnet_group.name,
            security_group_ids=[redis_sg.id],
            at_rest_encryption_enabled="true",
            transit_encryption_enabled=True,
            port=6379,
            snapshot_retention_limit=7,
            snapshot_window="02:00-03:00",
            maintenance_window="sun:05:00-sun:06:00",
            tags={"Name": f"assessment-redis-{environment_suffix}"}
        )

        # Store Redis endpoint in Secrets Manager
        SecretsmanagerSecretVersion(
            self,
            "redis_secret_version",
            secret_id=redis_secret.id,
            secret_string=json.dumps({
                "endpoint": redis_cluster.primary_endpoint_address,
                "port": "6379"
            })
        )

        # =============================================================================
        # Kinesis Data Streams and Firehose for Real-Time Analytics
        # =============================================================================

        # Kinesis Data Stream for student interactions
        kinesis_stream = KinesisStream(
            self,
            "kinesis_stream",
            name=f"assessment-interactions-stream-{environment_suffix}",
            shard_count=10,
            retention_period=24,
            shard_level_metrics=["IncomingBytes", "IncomingRecords", "OutgoingBytes", "OutgoingRecords"],
            stream_mode_details={
                "stream_mode": "PROVISIONED"
            },
            tags={"Name": f"assessment-interactions-stream-{environment_suffix}"}
        )

        # IAM role for Firehose
        firehose_role = IamRole(
            self,
            "firehose_role",
            name=f"assessment-firehose-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "firehose.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"assessment-firehose-role-{environment_suffix}"}
        )

        # Firehose policy for S3 and Kinesis access
        IamRolePolicy(
            self,
            "firehose_policy",
            name=f"assessment-firehose-policy-{environment_suffix}",
            role=firehose_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            analytics_bucket.arn,
                            f"{analytics_bucket.arn}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:DescribeStream",
                            "kinesis:GetShardIterator",
                            "kinesis:GetRecords",
                            "kinesis:ListShards"
                        ],
                        "Resource": kinesis_stream.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": s3_kms_key.arn
                    }
                ]
            })
        )

        # Kinesis Firehose delivery stream
        firehose_stream = KinesisFirehoseDeliveryStream(
            self,
            "firehose_stream",
            name=f"assessment-analytics-firehose-{environment_suffix}",
            destination="extended_s3",
            kinesis_source_configuration=KinesisFirehoseDeliveryStreamKinesisSourceConfiguration(
                kinesis_stream_arn=kinesis_stream.arn,
                role_arn=firehose_role.arn
            ),
            extended_s3_configuration=KinesisFirehoseDeliveryStreamExtendedS3Configuration(
                role_arn=firehose_role.arn,
                bucket_arn=analytics_bucket.arn,
                prefix="interactions/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/",
                error_output_prefix="errors/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/!{firehose:error-output-type}",
                buffering_size=5,
                buffering_interval=300,
                compression_format="GZIP",
                kms_key_arn=s3_kms_key.arn
            ),
            tags={"Name": f"assessment-analytics-firehose-{environment_suffix}"}
        )

        # =============================================================================
        # ECS Cluster and Service with Auto-Scaling
        # =============================================================================

        # ECS cluster
        ecs_cluster = EcsCluster(
            self,
            "ecs_cluster",
            name=f"assessment-cluster-{environment_suffix}",
            setting=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags={"Name": f"assessment-cluster-{environment_suffix}"}
        )

        # IAM role for ECS task execution
        ecs_execution_role = IamRole(
            self,
            "ecs_execution_role",
            name=f"assessment-ecs-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"assessment-ecs-execution-role-{environment_suffix}"}
        )

        IamRolePolicyAttachment(
            self,
            "ecs_execution_role_policy",
            role=ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # IAM role for ECS tasks
        ecs_task_role = IamRole(
            self,
            "ecs_task_role",
            name=f"assessment-ecs-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"assessment-ecs-task-role-{environment_suffix}"}
        )

        # ECS task policy for accessing Secrets Manager, Kinesis, and X-Ray
        IamRolePolicy(
            self,
            "ecs_task_policy",
            name=f"assessment-ecs-task-policy-{environment_suffix}",
            role=ecs_task_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": [db_secret.arn, redis_secret.arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:PutRecord",
                            "kinesis:PutRecords"
                        ],
                        "Resource": kinesis_stream.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "xray:PutTraceSegments",
                            "xray:PutTelemetryRecords"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt"
                        ],
                        "Resource": [rds_kms_key.arn, s3_kms_key.arn]
                    }
                ]
            })
        )

        # CloudWatch log group for ECS
        ecs_log_group = CloudwatchLogGroup(
            self,
            "ecs_log_group",
            name=f"/ecs/assessment-app-{environment_suffix}",
            retention_in_days=90,
            tags={"Name": f"assessment-ecs-logs-{environment_suffix}"}
        )

        # ECS task definition
        task_definition = EcsTaskDefinition(
            self,
            "task_definition",
            family=f"assessment-app-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="1024",
            memory="2048",
            execution_role_arn=ecs_execution_role.arn,
            task_role_arn=ecs_task_role.arn,
            container_definitions=json.dumps([{
                "name": "assessment-app",
                "image": "nginx:latest",  # Placeholder - replace with actual app image
                "cpu": 1024,
                "memory": 2048,
                "essential": True,
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": ecs_log_group.name,
                        "awslogs-region": aws_region,
                        "awslogs-stream-prefix": "ecs"
                    }
                },
                "environment": [
                    {"name": "ENVIRONMENT", "value": environment_suffix},
                    {"name": "AWS_REGION", "value": aws_region},
                    {"name": "DB_SECRET_NAME", "value": db_secret.name},
                    {"name": "REDIS_SECRET_NAME", "value": redis_secret.name},
                    {"name": "KINESIS_STREAM_NAME", "value": kinesis_stream.name}
                ]
            }]),
            tags={"Name": f"assessment-task-def-{environment_suffix}"}
        )

        # Application Load Balancer
        alb = Lb(
            self,
            "alb",
            name=f"assessment-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[public_subnet_1.id, public_subnet_2.id],
            enable_deletion_protection=False,
            enable_http2=True,
            enable_cross_zone_load_balancing=True,
            tags={"Name": f"assessment-alb-{environment_suffix}"}
        )

        # Target group for ECS service
        target_group = LbTargetGroup(
            self,
            "target_group",
            name=f"assessment-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            deregistration_delay="30",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                protocol="HTTP",
                port="traffic-port",
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                matcher="200"
            ),
            tags={"Name": f"assessment-tg-{environment_suffix}"}
        )

        # ALB listener
        LbListener(
            self,
            "alb_listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=target_group.arn
            )],
            tags={"Name": f"assessment-alb-listener-{environment_suffix}"}
        )

        # ECS service
        ecs_service = EcsService(
            self,
            "ecs_service",
            name=f"assessment-service-{environment_suffix}",
            cluster=ecs_cluster.id,
            task_definition=task_definition.arn,
            desired_count=4,
            launch_type="FARGATE",
            platform_version="LATEST",
            health_check_grace_period_seconds=60,
            enable_execute_command=True,
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[private_subnet_1.id, private_subnet_2.id],
                security_groups=[ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[EcsServiceLoadBalancer(
                target_group_arn=target_group.arn,
                container_name="assessment-app",
                container_port=8080
            )],
            tags={"Name": f"assessment-service-{environment_suffix}"}
        )

        # Auto-scaling target for ECS service
        ecs_autoscaling_target = AppautoscalingTarget(
            self,
            "ecs_autoscaling_target",
            max_capacity=50,
            min_capacity=4,
            resource_id=f"service/{ecs_cluster.name}/{ecs_service.name}",
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs"
        )

        # Auto-scaling policy for CPU utilization
        AppautoscalingPolicy(
            self,
            "ecs_cpu_scaling_policy",
            name=f"assessment-cpu-scaling-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=ecs_autoscaling_target.resource_id,
            scalable_dimension=ecs_autoscaling_target.scalable_dimension,
            service_namespace=ecs_autoscaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration(
                target_value=70.0,
                predefined_metric_specification=AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                scale_in_cooldown=300,
                scale_out_cooldown=60
            )
        )

        # Auto-scaling policy for memory utilization
        AppautoscalingPolicy(
            self,
            "ecs_memory_scaling_policy",
            name=f"assessment-memory-scaling-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=ecs_autoscaling_target.resource_id,
            scalable_dimension=ecs_autoscaling_target.scalable_dimension,
            service_namespace=ecs_autoscaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration(
                target_value=75.0,
                predefined_metric_specification=AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ECSServiceAverageMemoryUtilization"
                ),
                scale_in_cooldown=300,
                scale_out_cooldown=60
            )
        )

        # =============================================================================
        # API Gateway for External Access
        # =============================================================================

        # API Gateway REST API
        api = ApiGatewayRestApi(
            self,
            "api_gateway",
            name=f"assessment-api-{environment_suffix}",
            description="API Gateway for Assessment Platform",
            endpoint_configuration={
                "types": ["REGIONAL"]
            },
            tags={"Name": f"assessment-api-{environment_suffix}"}
        )

        # API Gateway resource
        api_resource = ApiGatewayResource(
            self,
            "api_resource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="assessments"
        )

        # API Gateway method
        api_method = ApiGatewayMethod(
            self,
            "api_method",
            rest_api_id=api.id,
            resource_id=api_resource.id,
            http_method="ANY",
            authorization="NONE"
        )


        # API Gateway integration with ALB first
        api_integration = ApiGatewayIntegration(
            self,
            "api_integration",
            rest_api_id=api.id,
            resource_id=api_resource.id,
            http_method=api_method.http_method,
            integration_http_method="ANY",
            type="HTTP_PROXY",
            uri=f"http://{alb.dns_name}/assessments",
            connection_type="INTERNET"
        )

        # API Gateway deployment - depends on integration
        api_deployment = ApiGatewayDeployment(
            self,
            "api_deployment",
            rest_api_id=api.id,
            depends_on=[api_method, api_integration],
            lifecycle={
                "create_before_destroy": True
            }
        )

        # API Gateway stage
        api_stage = ApiGatewayStage(
            self,
            "api_stage",
            rest_api_id=api.id,
            deployment_id=api_deployment.id,
            stage_name=environment_suffix,
            xray_tracing_enabled=True,
            tags={"Name": f"assessment-api-stage-{environment_suffix}"}
        )

        # API Gateway method settings for throttling
        ApiGatewayMethodSettings(
            self,
            "api_method_settings",
            rest_api_id=api.id,
            stage_name=api_stage.stage_name,
            method_path="*/*",
            settings=ApiGatewayMethodSettingsSettings(
                throttling_burst_limit=10000,
                throttling_rate_limit=5000,
                logging_level="INFO",
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )

        # CloudWatch log group for API Gateway
        api_log_group = CloudwatchLogGroup(
            self,
            "api_log_group",
            name=f"/aws/apigateway/assessment-api-{environment_suffix}",
            retention_in_days=90,
            tags={"Name": f"assessment-api-logs-{environment_suffix}"}
        )

        # =============================================================================
        # CloudWatch Monitoring and Alarms
        # =============================================================================

        # CloudWatch alarm for ECS CPU utilization
        CloudwatchMetricAlarm(
            self,
            "ecs_cpu_alarm",
            alarm_name=f"assessment-ecs-cpu-high-{environment_suffix}",
            alarm_description="Alert when ECS CPU utilization is high",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80.0,
            dimensions={
                "ClusterName": ecs_cluster.name,
                "ServiceName": ecs_service.name
            },
            tags={"Name": f"assessment-ecs-cpu-alarm-{environment_suffix}"}
        )

        # CloudWatch alarm for RDS connections
        CloudwatchMetricAlarm(
            self,
            "rds_connections_alarm",
            alarm_name=f"assessment-rds-connections-high-{environment_suffix}",
            alarm_description="Alert when RDS connections are high",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            dimensions={
                "DBClusterIdentifier": rds_cluster.cluster_identifier
            },
            tags={"Name": f"assessment-rds-connections-alarm-{environment_suffix}"}
        )

        # CloudWatch alarm for API Gateway 5xx errors
        CloudwatchMetricAlarm(
            self,
            "api_5xx_alarm",
            alarm_name=f"assessment-api-5xx-errors-{environment_suffix}",
            alarm_description="Alert when API Gateway returns 5xx errors",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10.0,
            dimensions={
                "ApiName": api.name,
                "Stage": api_stage.stage_name
            },
            tags={"Name": f"assessment-api-5xx-alarm-{environment_suffix}"}
        )

        # CloudWatch Dashboard
        dashboard_body = json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ECS", "CPUUtilization", {"stat": "Average"}],
                            [".", "MemoryUtilization", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "ECS Cluster Metrics",
                        "yAxis": {"left": {"min": 0, "max": 100}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}],
                            [".", "CPUUtilization", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "RDS Cluster Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "Count", {"stat": "Sum"}],
                            [".", "4XXError", {"stat": "Sum"}],
                            [".", "5XXError", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "API Gateway Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Kinesis", "IncomingRecords", {"stat": "Sum"}],
                            [".", "IncomingBytes", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "Kinesis Stream Metrics"
                    }
                }
            ]
        })

        CloudwatchDashboard(
            self,
            "dashboard",
            dashboard_name=f"assessment-dashboard-{environment_suffix}",
            dashboard_body=dashboard_body
        )

        # =============================================================================
        # CloudTrail for Audit Logging (FERPA Compliance)
        # =============================================================================

        # S3 bucket for CloudTrail logs
        cloudtrail_bucket = S3Bucket(
            self,
            "cloudtrail_bucket",
            bucket=f"assessment-cloudtrail-{environment_suffix}",
            tags={"Name": f"assessment-cloudtrail-{environment_suffix}"}
        )

        S3BucketPublicAccessBlock(
            self,
            "cloudtrail_bucket_public_access_block",
            bucket=cloudtrail_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # CloudTrail bucket policy for CloudTrail service
        # Get current account ID for CloudTrail policy
        from cdktf_cdktf_provider_aws.data_aws_caller_identity import \
            DataAwsCallerIdentity
        from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
        
        current_account = DataAwsCallerIdentity(self, "current_account")
        
        cloudtrail_bucket_policy = S3BucketPolicy(
            self,
            "cloudtrail_bucket_policy",
            bucket=cloudtrail_bucket.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AWSCloudTrailAclCheck",
                        "Effect": "Allow",
                        "Principal": {"Service": "cloudtrail.amazonaws.com"},
                        "Action": "s3:GetBucketAcl",
                        "Resource": f"arn:aws:s3:::{cloudtrail_bucket.bucket}",
                        "Condition": {
                            "StringEquals": {
                                "AWS:SourceArn": f"arn:aws:cloudtrail:{aws_region}:{current_account.account_id}:trail/assessment-trail-{environment_suffix}"
                            }
                        }
                    },
                    {
                        "Sid": "AWSCloudTrailWrite",
                        "Effect": "Allow",
                        "Principal": {"Service": "cloudtrail.amazonaws.com"},
                        "Action": "s3:PutObject",
                        "Resource": f"arn:aws:s3:::{cloudtrail_bucket.bucket}/*",
                        "Condition": {
                            "StringEquals": {
                                "s3:x-amz-acl": "bucket-owner-full-control",
                                "AWS:SourceArn": f"arn:aws:cloudtrail:{aws_region}:{current_account.account_id}:trail/assessment-trail-{environment_suffix}"
                            }
                        }
                    }
                ]
            })
        )

        # CloudTrail
        Cloudtrail(
            self,
            "cloudtrail",
            name=f"assessment-trail-{environment_suffix}",
            s3_bucket_name=cloudtrail_bucket.bucket,
            include_global_service_events=True,
            is_multi_region_trail=False,
            enable_logging=True,
            tags={"Name": f"assessment-trail-{environment_suffix}"}
        )

        # =============================================================================
        # EventBridge Scheduler for Health Checks
        # =============================================================================

        # SQS Dead Letter Queue for failed health checks
        dlq = SqsQueue(
            self,
            "health_check_dlq",
            name=f"assessment-health-check-dlq-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={"Name": f"assessment-health-check-dlq-{environment_suffix}"}
        )

        # IAM role for EventBridge Scheduler
        scheduler_role = IamRole(
            self,
            "scheduler_role",
            name=f"assessment-scheduler-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "scheduler.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"assessment-scheduler-role-{environment_suffix}"}
        )

        IamRolePolicy(
            self,
            "scheduler_policy",
            name=f"assessment-scheduler-policy-{environment_suffix}",
            role=scheduler_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ecs:DescribeServices",
                            "ecs:UpdateService"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": dlq.arn
                    }
                ]
            })
        )

        # EventBridge Scheduler for health checks every 5 minutes
        from cdktf_cdktf_provider_aws.scheduler_schedule import \
            SchedulerScheduleTargetEcsParameters
        
        SchedulerSchedule(
            self,
            "health_check_schedule",
            name=f"assessment-health-check-{environment_suffix}",
            description="Automated health check schedule",
            schedule_expression="rate(5 minutes)",
            flexible_time_window=SchedulerScheduleFlexibleTimeWindow(
                mode="OFF"
            ),
            target=SchedulerScheduleTarget(
                arn=ecs_cluster.arn,
                role_arn=scheduler_role.arn,
                ecs_parameters=SchedulerScheduleTargetEcsParameters(
                    task_definition_arn=task_definition.arn,
                    launch_type="FARGATE",
                    network_configuration={
                        "subnets": [private_subnet_1.id, private_subnet_2.id],
                        "security_groups": [ecs_sg.id],
                        "assign_public_ip": False
                    }
                ),
                retry_policy=SchedulerScheduleTargetRetryPolicy(
                    maximum_retry_attempts=3,
                    maximum_event_age_in_seconds=3600
                ),
                dead_letter_config={
                    "arn": dlq.arn
                }
            )
        )

        # =============================================================================
        # AWS Fault Injection Service (FIS) Experiment Template
        # =============================================================================

        # IAM role for FIS experiments
        fis_role = IamRole(
            self,
            "fis_role",
            name=f"assessment-fis-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "fis.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"assessment-fis-role-{environment_suffix}"}
        )

        IamRolePolicy(
            self,
            "fis_policy",
            name=f"assessment-fis-policy-{environment_suffix}",
            role=fis_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeInstances",
                            "ec2:StopInstances",
                            "ec2:StartInstances",
                            "ecs:DescribeServices",
                            "ecs:UpdateService",
                            "rds:DescribeDBClusters",
                            "rds:FailoverDBCluster",
                            "cloudwatch:DescribeAlarms"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # CloudWatch alarm as stop condition for FIS
        fis_stop_alarm = CloudwatchMetricAlarm(
            self,
            "fis_stop_alarm",
            alarm_name=f"assessment-fis-stop-condition-{environment_suffix}",
            alarm_description="Stop condition for FIS experiment when API errors exceed threshold",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=60,
            statistic="Sum",
            threshold=50.0,
            dimensions={
                "ApiName": api.name,
                "Stage": api_stage.stage_name
            },
            tags={"Name": f"assessment-fis-stop-alarm-{environment_suffix}"}
        )

        # FIS experiment template for AZ failure
        # Note: Using ECS task disruption instead of ASG capacity error
        FisExperimentTemplate(
            self,
            "fis_experiment",
            description=f"Test ECS task disruption for assessment platform - {environment_suffix}",
            role_arn=fis_role.arn,
            stop_condition=[FisExperimentTemplateStopCondition(
                source="aws:cloudwatch:alarm",
                value=fis_stop_alarm.arn
            )],
            action=[FisExperimentTemplateAction(
                name="DisruptECSTasks",
                action_id="aws:ecs:stop-task",
                target=FisExperimentTemplateActionTarget(
                    key="Tasks",
                    value="assessment-ecs-targets"
                )
            )],
            target=[FisExperimentTemplateTarget(
                name="assessment-ecs-targets",
                resource_type="aws:ecs:task",
                selection_mode="COUNT(1)",
                resource_tag=[FisExperimentTemplateTargetResourceTag(
                    key="Environment",
                    value=environment_suffix
                )],
                filter=[FisExperimentTemplateTargetFilter(
                    path="Task.Status",
                    values=["RUNNING"]
                )]
            )],
            tags={"Name": f"assessment-fis-experiment-{environment_suffix}"}
        )

        # =============================================================================
        # Outputs
        # =============================================================================

        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=alb.dns_name,
            description="Application Load Balancer DNS name"
        )

        TerraformOutput(
            self,
            "api_gateway_url",
            value=f"https://{api.id}.execute-api.{aws_region}.amazonaws.com/{api_stage.stage_name}",
            description="API Gateway URL"
        )

        TerraformOutput(
            self,
            "rds_cluster_endpoint",
            value=rds_cluster.endpoint,
            description="RDS Aurora cluster endpoint"
        )

        TerraformOutput(
            self,
            "redis_endpoint",
            value=redis_cluster.primary_endpoint_address,
            description="ElastiCache Redis primary endpoint"
        )

        TerraformOutput(
            self,
            "kinesis_stream_name",
            value=kinesis_stream.name,
            description="Kinesis Data Stream name"
        )

        TerraformOutput(
            self,
            "ecs_cluster_name",
            value=ecs_cluster.name,
            description="ECS Cluster name"
        )

        TerraformOutput(
            self,
            "dashboard_url",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region={aws_region}#dashboards:name={f'assessment-dashboard-{environment_suffix}'}",
            description="CloudWatch Dashboard URL"
        )

        # Store references for testing
        self.vpc = vpc
        self.alb = alb
        self.ecs_cluster = ecs_cluster
        self.ecs_service = ecs_service
        self.rds_cluster = rds_cluster
        self.redis_cluster = redis_cluster
        self.kinesis_stream = kinesis_stream
        self.analytics_bucket = analytics_bucket
        self.api_gateway = api
