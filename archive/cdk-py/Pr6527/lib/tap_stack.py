#!/usr/bin/env python3
"""
CDK Stack for TAP (Test Automation Platform) infrastructure.
Provisions over-provisioned development environment for video streaming platform.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import Duration, RemovalPolicy, Stack, Tags
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_ecs as ecs
from aws_cdk import aws_ecs_patterns as ecs_patterns
from aws_cdk import aws_elasticache as elasticache
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_logs as logs
from aws_cdk import aws_rds as rds
from aws_cdk import aws_s3 as s3
from constructs import Construct


class TapStackProps:
    """Properties for TapStack initialization."""

    def __init__(self, environment_suffix: str, env: Optional[cdk.Environment] = None):
        self.environment_suffix = environment_suffix
        self.env = env


class TapStack(Stack):
    """
    Main stack for TAP infrastructure.
    Creates over-provisioned resources for optimization testing.
    """

    def __init__(self, scope: Construct, construct_id: str, props: TapStackProps) -> None:
        super().__init__(scope, construct_id, env=props.env)

        self.environment_suffix = props.environment_suffix

        # Create VPC with public and private subnets across 3 AZs
        vpc = self._create_vpc()

        # Create security groups
        aurora_sg, redis_sg, ecs_sg, lambda_sg = self._create_security_groups(vpc)

        # Create Aurora Serverless v2 PostgreSQL cluster
        aurora_cluster = self._create_aurora_cluster(vpc, aurora_sg)

        # Create ElastiCache Redis cluster
        redis_cluster = self._create_redis_cluster(vpc, redis_sg)

        # Create ECS Fargate service with ALB
        ecs_cluster, alb = self._create_ecs_service(vpc, ecs_sg)

        # Create DynamoDB table
        dynamodb_table = self._create_dynamodb_table()

        # Create Lambda functions
        lambda_functions = self._create_lambda_functions(vpc, lambda_sg)

        # Create S3 buckets with Intelligent-Tiering
        s3_buckets = self._create_s3_buckets()

        # Output important resource ARNs and IDs
        resources = {
            'aurora_cluster': aurora_cluster,
            'redis_cluster': redis_cluster,
            'ecs_cluster': ecs_cluster,
            'dynamodb_table': dynamodb_table,
            'lambda_functions': lambda_functions,
            's3_buckets': s3_buckets,
            'alb': alb
        }
        self._create_outputs(resources)

        # Apply tags to all resources
        Tags.of(self).add("Environment", self.environment_suffix)
        Tags.of(self).add("Project", "TAP")
        Tags.of(self).add("Purpose", "VideoStreamingPlatform")
        Tags.of(self).add("OptimizationCandidate", "true")

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets."""
        return ec2.Vpc(
            self, f"TapVpc-{self.environment_suffix}",
            vpc_name=f"tap-vpc-{self.environment_suffix}",
            max_azs=3,
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Database",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

    def _create_security_groups(self, vpc: ec2.Vpc) -> tuple:
        """Create security groups for different services."""
        aurora_sg = ec2.SecurityGroup(
            self, f"AuroraSG-{self.environment_suffix}",
            vpc=vpc,
            description="Security group for Aurora cluster",
            allow_all_outbound=True
        )

        redis_sg = ec2.SecurityGroup(
            self, f"RedisSG-{self.environment_suffix}",
            vpc=vpc,
            description="Security group for Redis cluster",
            allow_all_outbound=True
        )

        ecs_sg = ec2.SecurityGroup(
            self, f"EcsSG-{self.environment_suffix}",
            vpc=vpc,
            description="Security group for ECS tasks",
            allow_all_outbound=True
        )

        lambda_sg = ec2.SecurityGroup(
            self, f"LambdaSG-{self.environment_suffix}",
            vpc=vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True
        )

        # Allow connections between services
        aurora_sg.add_ingress_rule(ecs_sg, ec2.Port.tcp(5432))
        aurora_sg.add_ingress_rule(lambda_sg, ec2.Port.tcp(5432))
        redis_sg.add_ingress_rule(ecs_sg, ec2.Port.tcp(6379))
        redis_sg.add_ingress_rule(lambda_sg, ec2.Port.tcp(6379))

        return aurora_sg, redis_sg, ecs_sg, lambda_sg

    def _create_aurora_cluster(self, vpc: ec2.Vpc, security_group: ec2.SecurityGroup) -> rds.DatabaseCluster:
        """Create Aurora Serverless v2 PostgreSQL cluster."""
        # Username must match pattern ^[a-zA-Z]{1}[a-zA-Z0-9_]*$
        username = f"auroraadmin{self.environment_suffix.replace('-', '')}"

        cluster = rds.DatabaseCluster(
            self, f"AuroraCluster-{self.environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_6
            ),
            credentials=rds.Credentials.from_username(
                username,
                exclude_characters="/@\" '",
            ),
            default_database_name="tapdb",
            cluster_identifier=f"tap-aurora-{self.environment_suffix}",
            serverless_v2_min_capacity=4,  # Over-provisioned: 4 ACUs minimum
            serverless_v2_max_capacity=16,  # Over-provisioned: 16 ACUs maximum
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[security_group],
            backup=rds.BackupProps(
                retention=Duration.days(35),  # Over-provisioned: 35 days retention
                preferred_window="03:00-04:00"
            ),
            deletion_protection=False,  # For dev environment
            removal_policy=RemovalPolicy.DESTROY,
            enable_data_api=True,
            storage_encrypted=True,
            monitoring_interval=Duration.seconds(60),
            cloudwatch_logs_exports=["postgresql"],
            writer=rds.ClusterInstance.serverless_v2(
                f"writer-{self.environment_suffix}",
                enable_performance_insights=True
            ),
            readers=[
                rds.ClusterInstance.serverless_v2(
                    f"reader-1-{self.environment_suffix}",
                    scale_with_writer=True
                ),
                rds.ClusterInstance.serverless_v2(
                    f"reader-2-{self.environment_suffix}",
                    scale_with_writer=True
                )
            ]
        )

        # Apply removal policy to secret
        cluster.secret.apply_removal_policy(RemovalPolicy.DESTROY)

        return cluster

    def _create_redis_cluster(self, vpc: ec2.Vpc, security_group: ec2.SecurityGroup) -> elasticache.CfnReplicationGroup:
        """Create ElastiCache Redis cluster."""
        # Create CloudWatch log group for Redis
        log_group = logs.LogGroup(
            self, f"RedisLogGroup-{self.environment_suffix}",
            log_group_name=f"/aws/elasticache/tap-redis-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        subnet_group = elasticache.CfnSubnetGroup(
            self, f"RedisSubnetGroup-{self.environment_suffix}",
            description="Subnet group for Redis cluster",
            subnet_ids=[subnet.subnet_id for subnet in vpc.private_subnets],
            cache_subnet_group_name=f"tap-redis-subnet-{self.environment_suffix}"
        )

        redis_cluster = elasticache.CfnReplicationGroup(
            self, f"RedisCluster-{self.environment_suffix}",
            replication_group_id=f"tap-redis-{self.environment_suffix}",
            replication_group_description="Redis cluster for TAP platform",
            cache_node_type="cache.r6g.xlarge",  # Over-provisioned
            num_node_groups=5,  # Over-provisioned: 5 nodes
            replicas_per_node_group=1,
            multi_az_enabled=True,
            automatic_failover_enabled=True,
            cache_subnet_group_name=subnet_group.cache_subnet_group_name,
            security_group_ids=[security_group.security_group_id],
            engine="redis",
            engine_version="7.0",
            port=6379,
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00",
            preferred_maintenance_window="sun:05:00-sun:06:00",
            auto_minor_version_upgrade=True,
            log_delivery_configurations=[
                elasticache.CfnReplicationGroup.LogDeliveryConfigurationRequestProperty(
                    destination_details=elasticache.CfnReplicationGroup.DestinationDetailsProperty(
                        cloud_watch_logs_details=elasticache.CfnReplicationGroup.CloudWatchLogsDestinationDetailsProperty(
                            log_group=log_group.log_group_name
                        )
                    ),
                    destination_type="cloudwatch-logs",
                    log_format="json",
                    log_type="slow-log"
                )
            ],
            tags=[
                cdk.CfnTag(key="Environment", value=self.environment_suffix),
                cdk.CfnTag(key="Service", value="Redis")
            ]
        )

        redis_cluster.add_dependency(subnet_group)
        redis_cluster.add_dependency(log_group.node.default_child)
        return redis_cluster

    def _create_ecs_service(self, vpc: ec2.Vpc, security_group: ec2.SecurityGroup) -> tuple:
        """Create ECS Fargate service with ALB."""
        cluster = ecs.Cluster(
            self, f"EcsCluster-{self.environment_suffix}",
            vpc=vpc,
            cluster_name=f"tap-ecs-{self.environment_suffix}",
            container_insights=True
        )

        task_definition = ecs.FargateTaskDefinition(
            self, f"TaskDef-{self.environment_suffix}",
            memory_limit_mib=2048,  # Over-provisioned
            cpu=1024,  # Over-provisioned
            family=f"tap-task-{self.environment_suffix}"
        )

        container = task_definition.add_container(
            f"AppContainer-{self.environment_suffix}",
            image=ecs.ContainerImage.from_registry("public.ecr.aws/nginx/nginx:latest"),
            memory_limit_mib=2048,
            cpu=1024,
            logging=ecs.LogDriver.aws_logs(
                stream_prefix="tap",
                log_group=logs.LogGroup(
                    self, f"EcsLogGroup-{self.environment_suffix}",
                    log_group_name=f"/ecs/tap/{self.environment_suffix}",
                    retention=logs.RetentionDays.ONE_WEEK,
                    removal_policy=RemovalPolicy.DESTROY
                )
            ),
            environment={
                "ENVIRONMENT": self.environment_suffix,
                "SERVICE": "video-streaming"
            }
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=80, protocol=ecs.Protocol.TCP)
        )

        fargate_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self, f"FargateService-{self.environment_suffix}",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=8,  # Over-provisioned: 8 tasks
            public_load_balancer=True,
            service_name=f"tap-service-{self.environment_suffix}",
            health_check_grace_period=Duration.seconds(60),
            enable_ecs_managed_tags=True,
            propagate_tags=ecs.PropagatedTagSource.SERVICE,
            domain_zone=None,
            assign_public_ip=False,
            security_groups=[security_group]
        )

        # Configure auto-scaling (for appearance, but set high to maintain over-provisioning)
        scalable_target = fargate_service.service.auto_scale_task_count(
            min_capacity=8,
            max_capacity=20
        )

        scalable_target.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(300),
            scale_out_cooldown=Duration.seconds(60)
        )

        return cluster, fargate_service.load_balancer

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with provisioned capacity."""
        table = dynamodb.Table(
            self, f"DynamoTable-{self.environment_suffix}",
            table_name=f"tap-table-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="sk",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=500,  # Over-provisioned
            write_capacity=500,  # Over-provisioned
            point_in_time_recovery=True,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            contributor_insights_enabled=True
        )

        # Add GSI
        table.add_global_secondary_index(
            index_name="gsi1",
            partition_key=dynamodb.Attribute(
                name="gsi1pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="gsi1sk",
                type=dynamodb.AttributeType.STRING
            ),
            read_capacity=100,
            write_capacity=100,
            projection_type=dynamodb.ProjectionType.ALL
        )

        return table

    def _create_lambda_functions(self, vpc: ec2.Vpc, security_group: ec2.SecurityGroup) -> list:
        """Create Lambda functions with over-provisioned settings."""
        lambda_functions = []

        # Create shared Lambda execution role with comprehensive permissions
        lambda_role = iam.Role(
            self, f"LambdaRole-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess")
            ]
        )

        # Add additional permissions for resource access
        lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "xray:PutTelemetryRecords",
                "xray:PutTraceSegments"
            ],
            resources=["*"]
        ))

        function_configs = [
            {"name": "processor", "handler": "index.handler"},
            {"name": "analyzer", "handler": "index.handler"},
            {"name": "reporter", "handler": "index.handler"}
        ]

        for config in function_configs:
            func = lambda_.Function(
                self, f"Lambda-{config['name']}-{self.environment_suffix}",
                function_name=f"tap-{config['name']}-{self.environment_suffix}",
                runtime=lambda_.Runtime.PYTHON_3_11,
                handler=config["handler"],
                code=lambda_.Code.from_inline("""
import json
import time

def handler(event, context):
    # Simulate some processing
    time.sleep(0.5)
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Function executed successfully',
            'event': event
        })
    }
                """),
                memory_size=3008,  # Over-provisioned: 3008 MB
                timeout=Duration.seconds(900),  # Over-provisioned: 15 minutes
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
                security_groups=[security_group],
                role=lambda_role,
                environment={
                    "ENVIRONMENT": self.environment_suffix,
                    "FUNCTION_NAME": config["name"]
                },
                tracing=lambda_.Tracing.ACTIVE,
                log_retention=logs.RetentionDays.ONE_WEEK
            )

            lambda_functions.append(func)

        return lambda_functions

    def _create_s3_buckets(self) -> list:
        """Create S3 buckets with Intelligent-Tiering."""
        buckets = []
        bucket_purposes = ["media", "logs", "backups"]

        for purpose in bucket_purposes:
            bucket = s3.Bucket(
                self, f"S3Bucket-{purpose}-{self.environment_suffix}",
                bucket_name=f"tap-{purpose}-{self.environment_suffix}-{self.account}",
                versioned=True,
                encryption=s3.BucketEncryption.S3_MANAGED,
                block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
                removal_policy=RemovalPolicy.DESTROY,
                auto_delete_objects=True,
                lifecycle_rules=[
                    s3.LifecycleRule(
                        id=f"intelligent-tiering-{purpose}",
                        enabled=True,
                        transitions=[
                            s3.Transition(
                                storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                                transition_after=Duration.days(0)
                            )
                        ]
                    )
                ],
                metrics=[
                    s3.BucketMetrics(
                        id=f"all-objects-{purpose}",
                        prefix=""
                    )
                ],
                intelligent_tiering_configurations=[
                    s3.IntelligentTieringConfiguration(
                        name=f"archive-config-{purpose}",
                        archive_access_tier_time=Duration.days(90),
                        deep_archive_access_tier_time=Duration.days(180)
                    )
                ]
            )

            buckets.append(bucket)

        return buckets

    def _create_outputs(self, resources):
        """Create CloudFormation outputs."""
        aurora_cluster = resources['aurora_cluster']
        redis_cluster = resources['redis_cluster']
        ecs_cluster = resources['ecs_cluster']
        dynamodb_table = resources['dynamodb_table']
        lambda_functions = resources['lambda_functions']
        s3_buckets = resources['s3_buckets']
        alb = resources['alb']

        # VPC outputs
        cdk.CfnOutput(
            self, "VPCId",
            value=ecs_cluster.vpc.vpc_id,
            export_name=f"tap-vpc-id-{self.environment_suffix}"
        )

        # Aurora outputs
        cdk.CfnOutput(
            self, "AuroraClusterArn",
            value=aurora_cluster.cluster_arn,
            export_name=f"tap-aurora-arn-{self.environment_suffix}"
        )

        cdk.CfnOutput(
            self, "AuroraClusterEndpoint",
            value=aurora_cluster.cluster_endpoint.hostname,
            export_name=f"tap-aurora-endpoint-{self.environment_suffix}"
        )

        cdk.CfnOutput(
            self, "DatabaseSecretArn",
            value=aurora_cluster.secret.secret_arn,
            export_name=f"tap-db-secret-arn-{self.environment_suffix}"
        )

        # Redis outputs
        cdk.CfnOutput(
            self, "RedisClusterId",
            value=redis_cluster.replication_group_id,
            export_name=f"tap-redis-id-{self.environment_suffix}"
        )

        cdk.CfnOutput(
            self, "RedisEndpoint",
            value=f"master.{redis_cluster.replication_group_id}.{self.region}.cache.amazonaws.com",
            export_name=f"tap-redis-endpoint-{self.environment_suffix}"
        )

        # ECS outputs
        cdk.CfnOutput(
            self, "EcsClusterName",
            value=ecs_cluster.cluster_name,
            export_name=f"tap-ecs-cluster-{self.environment_suffix}"
        )

        cdk.CfnOutput(
            self, "ECSServiceName",
            value=f"tap-service-{self.environment_suffix}",
            export_name=f"tap-ecs-service-{self.environment_suffix}"
        )

        cdk.CfnOutput(
            self, "ECSClusterName",
            value=ecs_cluster.cluster_name,
            export_name=f"tap-ecs-cluster-alt-{self.environment_suffix}",
            description="ECS Cluster Name (alternative output)"
        )

        # DynamoDB outputs
        cdk.CfnOutput(
            self, "DynamoTableName",
            value=dynamodb_table.table_name,
            export_name=f"tap-dynamo-table-{self.environment_suffix}"
        )

        cdk.CfnOutput(
            self, "DynamoDBTableName",
            value=dynamodb_table.table_name,
            export_name=f"tap-dynamodb-table-alt-{self.environment_suffix}",
            description="DynamoDB Table Name (alternative output)"
        )

        cdk.CfnOutput(
            self, "DynamoDBTableArn",
            value=dynamodb_table.table_arn,
            export_name=f"tap-dynamo-arn-{self.environment_suffix}"
        )

        # ALB outputs
        cdk.CfnOutput(
            self, "ALBDnsName",
            value=alb.load_balancer_dns_name,
            export_name=f"tap-alb-dns-{self.environment_suffix}"
        )

        cdk.CfnOutput(
            self, "LoadBalancerDNS",
            value=alb.load_balancer_dns_name,
            export_name=f"tap-lb-dns-{self.environment_suffix}"
        )

        cdk.CfnOutput(
            self, "LoadBalancerURL",
            value=f"http://{alb.load_balancer_dns_name}",
            export_name=f"tap-lb-url-{self.environment_suffix}",
            description="ALB URL with HTTP protocol"
        )

        cdk.CfnOutput(
            self, "AuroraReadEndpoint",
            value=aurora_cluster.cluster_read_endpoint.hostname,
            export_name=f"tap-aurora-read-endpoint-{self.environment_suffix}",
            description="Aurora cluster read-only endpoint"
        )

        # Lambda outputs
        for i, func in enumerate(lambda_functions):
            cdk.CfnOutput(
                self, f"LambdaFunction{i}Name",
                value=func.function_name,
                export_name=f"tap-lambda-{i}-{self.environment_suffix}"
            )

            cdk.CfnOutput(
                self, f"LambdaFunction{i}Arn",
                value=func.function_arn,
                export_name=f"tap-lambda-{i}-arn-{self.environment_suffix}"
            )

        # S3 outputs
        for i, bucket in enumerate(s3_buckets):
            cdk.CfnOutput(
                self, f"S3Bucket{i}Name",
                value=bucket.bucket_name,
                export_name=f"tap-s3-{i}-{self.environment_suffix}"
            )
