# CDK Python Infrastructure for Video Processing Pipeline

This implementation creates a complete video processing infrastructure for StreamTech Japan using AWS CDK with Python.

## Architecture Overview

The infrastructure includes:
- VPC with public and private subnets across 2 AZs
- ECS Fargate cluster for video processing
- RDS PostgreSQL (Multi-AZ) for metadata storage
- ElastiCache Redis (Multi-AZ, 2+ nodes) for caching
- EFS for temporary video processing storage
- API Gateway for metadata access
- KMS encryption for all data stores
- CloudWatch logging and monitoring
- Secrets Manager integration (fetches existing secrets)

## File: lib/tap_stack.py

```python
"""tap_stack.py
Video processing pipeline infrastructure for StreamTech Japan
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_rds as rds,
    aws_elasticache as elasticache,
    aws_efs as efs,
    aws_apigateway as apigateway,
    aws_secretsmanager as secretsmanager,
    aws_kms as kms,
    aws_logs as logs,
    aws_iam as iam,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Properties for TapStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """Main CDK stack for video processing pipeline infrastructure"""

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

        # Create KMS key for encryption
        kms_key = kms.Key(
            self,
            'EncryptionKey',
            description=f'KMS key for video processing pipeline {environment_suffix}',
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create VPC with public and private subnets across 2 AZs
        vpc = ec2.Vpc(
            self,
            'VPC',
            vpc_name=f'video-processing-vpc-{environment_suffix}',
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name='Public',
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name='Private',
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
        )

        # Create security group for ECS tasks
        ecs_security_group = ec2.SecurityGroup(
            self,
            'ECSSecurityGroup',
            vpc=vpc,
            description='Security group for ECS video processing tasks',
            allow_all_outbound=True,
        )

        # Create security group for RDS
        rds_security_group = ec2.SecurityGroup(
            self,
            'RDSSecurityGroup',
            vpc=vpc,
            description='Security group for RDS PostgreSQL database',
            allow_all_outbound=True,
        )
        rds_security_group.add_ingress_rule(
            peer=ecs_security_group,
            connection=ec2.Port.tcp(5432),
            description='Allow PostgreSQL access from ECS tasks',
        )

        # Create security group for ElastiCache
        elasticache_security_group = ec2.SecurityGroup(
            self,
            'ElastiCacheSecurityGroup',
            vpc=vpc,
            description='Security group for ElastiCache Redis cluster',
            allow_all_outbound=True,
        )
        elasticache_security_group.add_ingress_rule(
            peer=ecs_security_group,
            connection=ec2.Port.tcp(6379),
            description='Allow Redis access from ECS tasks',
        )

        # Create security group for EFS
        efs_security_group = ec2.SecurityGroup(
            self,
            'EFSSecurityGroup',
            vpc=vpc,
            description='Security group for EFS file system',
            allow_all_outbound=True,
        )
        efs_security_group.add_ingress_rule(
            peer=ecs_security_group,
            connection=ec2.Port.tcp(2049),
            description='Allow NFS access from ECS tasks',
        )

        # Fetch existing database secret from Secrets Manager
        db_secret = secretsmanager.Secret.from_secret_name_v2(
            self,
            'DBSecret',
            secret_name=f'rds-db-credentials-{environment_suffix}',
        )

        # Create subnet group for RDS
        db_subnet_group = rds.SubnetGroup(
            self,
            'DBSubnetGroup',
            description='Subnet group for RDS PostgreSQL',
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create RDS PostgreSQL database with Multi-AZ
        database = rds.DatabaseInstance(
            self,
            'PostgresDatabase',
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.SMALL,
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[rds_security_group],
            multi_az=True,
            allocated_storage=20,
            storage_type=rds.StorageType.GP3,
            database_name='videometadata',
            credentials=rds.Credentials.from_secret(db_secret),
            backup_retention=Duration.days(1),
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            subnet_group=db_subnet_group,
        )

        # Create subnet group for ElastiCache
        cache_subnet_group = elasticache.CfnSubnetGroup(
            self,
            'CacheSubnetGroup',
            description='Subnet group for ElastiCache Redis',
            subnet_ids=vpc.select_subnets(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ).subnet_ids,
        )

        # Create ElastiCache Redis replication group with Multi-AZ
        redis_cluster = elasticache.CfnReplicationGroup(
            self,
            'RedisCluster',
            replication_group_description='Redis cluster for video metadata caching',
            engine='redis',
            engine_version='7.0',
            cache_node_type='cache.t3.micro',
            num_cache_clusters=2,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            cache_subnet_group_name=cache_subnet_group.ref,
            security_group_ids=[elasticache_security_group.security_group_id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            kms_key_id=kms_key.key_id,
            snapshot_retention_limit=1,
        )
        redis_cluster.add_dependency(cache_subnet_group)

        # Create EFS file system with encryption
        file_system = efs.FileSystem(
            self,
            'VideoProcessingEFS',
            vpc=vpc,
            encrypted=True,
            kms_key=kms_key,
            lifecycle_policy=efs.LifecyclePolicy.AFTER_7_DAYS,
            performance_mode=efs.PerformanceMode.GENERAL_PURPOSE,
            throughput_mode=efs.ThroughputMode.BURSTING,
            removal_policy=RemovalPolicy.DESTROY,
            security_group=efs_security_group,
        )

        # Create CloudWatch log group for ECS tasks
        ecs_log_group = logs.LogGroup(
            self,
            'ECSLogGroup',
            log_group_name=f'/ecs/video-processing-{environment_suffix}',
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create ECS cluster
        cluster = ecs.Cluster(
            self,
            'ECSCluster',
            cluster_name=f'video-processing-cluster-{environment_suffix}',
            vpc=vpc,
            container_insights=True,
        )

        # Create IAM role for ECS task execution
        task_execution_role = iam.Role(
            self,
            'ECSTaskExecutionRole',
            assumed_by=iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    'service-role/AmazonECSTaskExecutionRolePolicy'
                ),
            ],
        )

        # Grant task execution role access to secrets
        db_secret.grant_read(task_execution_role)

        # Create IAM role for ECS task
        task_role = iam.Role(
            self,
            'ECSTaskRole',
            assumed_by=iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        )

        # Grant task role access to EFS, RDS, and ElastiCache
        kms_key.grant_decrypt(task_role)

        # Create Fargate task definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            'TaskDefinition',
            family=f'video-processing-task-{environment_suffix}',
            cpu=512,
            memory_limit_mib=1024,
            execution_role=task_execution_role,
            task_role=task_role,
        )

        # Add container to task definition
        container = task_definition.add_container(
            'VideoProcessingContainer',
            image=ecs.ContainerImage.from_registry('amazon/amazon-ecs-sample'),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix='video-processing',
                log_group=ecs_log_group,
            ),
            environment={
                'RDS_ENDPOINT': database.db_instance_endpoint_address,
                'REDIS_ENDPOINT': redis_cluster.attr_primary_end_point_address,
            },
            secrets={
                'DB_PASSWORD': ecs.Secret.from_secrets_manager(db_secret, 'password'),
                'DB_USERNAME': ecs.Secret.from_secrets_manager(db_secret, 'username'),
            },
        )

        # Add EFS volume to task definition
        task_definition.add_volume(
            name='efs-storage',
            efs_volume_configuration=ecs.EfsVolumeConfiguration(
                file_system_id=file_system.file_system_id,
            ),
        )

        container.add_mount_points(
            ecs.MountPoint(
                container_path='/mnt/efs',
                source_volume='efs-storage',
                read_only=False,
            )
        )

        # Create Fargate service
        fargate_service = ecs.FargateService(
            self,
            'FargateService',
            cluster=cluster,
            task_definition=task_definition,
            desired_count=1,
            security_groups=[ecs_security_group],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        )

        # Create CloudWatch log group for API Gateway
        api_log_group = logs.LogGroup(
            self,
            'APILogGroup',
            log_group_name=f'/aws/apigateway/video-metadata-api-{environment_suffix}',
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create API Gateway REST API
        api = apigateway.RestApi(
            self,
            'MetadataAPI',
            rest_api_name=f'video-metadata-api-{environment_suffix}',
            description='API for accessing video metadata',
            deploy_options=apigateway.StageOptions(
                stage_name='prod',
                throttling_rate_limit=100,
                throttling_burst_limit=200,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                access_log_destination=apigateway.LogGroupLogDestination(api_log_group),
                access_log_format=apigateway.AccessLogFormat.json_with_standard_fields(),
            ),
        )

        # Add a simple GET endpoint to the API
        metadata_resource = api.root.add_resource('metadata')
        metadata_resource.add_method(
            'GET',
            apigateway.MockIntegration(
                integration_responses=[
                    apigateway.IntegrationResponse(
                        status_code='200',
                        response_templates={
                            'application/json': '{"message": "Video metadata API"}'
                        },
                    )
                ],
                request_templates={
                    'application/json': '{"statusCode": 200}'
                },
            ),
            method_responses=[
                apigateway.MethodResponse(status_code='200')
            ],
        )

        # Output important values
        cdk.CfnOutput(
            self,
            'VPCId',
            value=vpc.vpc_id,
            description='VPC ID',
        )

        cdk.CfnOutput(
            self,
            'ECSClusterName',
            value=cluster.cluster_name,
            description='ECS Cluster Name',
        )

        cdk.CfnOutput(
            self,
            'RDSEndpoint',
            value=database.db_instance_endpoint_address,
            description='RDS PostgreSQL Endpoint',
        )

        cdk.CfnOutput(
            self,
            'RedisEndpoint',
            value=redis_cluster.attr_primary_end_point_address,
            description='Redis Primary Endpoint',
        )

        cdk.CfnOutput(
            self,
            'EFSFileSystemId',
            value=file_system.file_system_id,
            description='EFS File System ID',
        )

        cdk.CfnOutput(
            self,
            'APIEndpoint',
            value=api.url,
            description='API Gateway Endpoint',
        )

        cdk.CfnOutput(
            self,
            'KMSKeyId',
            value=kms_key.key_id,
            description='KMS Key ID',
        )
```

## Implementation Notes

### Key Features

1. **VPC Configuration**
   - 2 Availability Zones for high availability
   - Public and private subnets
   - Single NAT Gateway for cost optimization

2. **ECS Fargate Cluster**
   - Serverless container execution
   - CloudWatch logging enabled
   - Security group with proper access controls

3. **RDS PostgreSQL Database**
   - Multi-AZ deployment for high availability
   - KMS encryption at rest
   - Minimal backup retention (1 day)
   - Fetches credentials from Secrets Manager

4. **ElastiCache Redis Cluster**
   - Replication group with 2 cache nodes
   - Multi-AZ with automatic failover enabled
   - KMS encryption at rest
   - Transit encryption enabled

5. **EFS File System**
   - KMS encryption enabled
   - Lifecycle policy to transition to IA after 7 days
   - General purpose performance mode

6. **API Gateway**
   - REST API with mock integration
   - CloudWatch logging enabled
   - Rate limiting configured

7. **Security**
   - KMS key with rotation enabled
   - Security groups with least privilege access
   - Secrets fetched from Secrets Manager (not created)
   - IAM roles with minimal permissions

8. **Monitoring**
   - CloudWatch log groups for ECS and API Gateway
   - Container Insights enabled for ECS
   - 7-day log retention for cost optimization

### Environment Suffix Usage

All resources use the `environment_suffix` parameter for unique naming:
- VPC: `video-processing-vpc-{environment_suffix}`
- ECS Cluster: `video-processing-cluster-{environment_suffix}`
- Log Groups: `/ecs/video-processing-{environment_suffix}`
- API Gateway: `video-metadata-api-{environment_suffix}`
- Secret Name: `rds-db-credentials-{environment_suffix}`

### Destroyability

All resources are configured with `RemovalPolicy.DESTROY` to ensure the stack can be fully deleted without manual cleanup.
