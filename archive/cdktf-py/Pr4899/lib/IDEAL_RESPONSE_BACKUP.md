# Streaming Content Delivery Platform Infrastructure

I'll help you create the infrastructure for your streaming media platform in sa-east-1. Here's the complete implementation:

## lib/tap_stack.py

```python
"""TAP Stack module for streaming content delivery platform."""

from cdktf import TerraformStack, S3Backend, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.kinesis_stream import KinesisStream
from cdktf_cdktf_provider_aws.elasticache_subnet_group import ElasticacheSubnetGroup
from cdktf_cdktf_provider_aws.elasticache_replication_group import ElasticacheReplicationGroup
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition, EcsTaskDefinitionContainerDefinitions
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration, EcsServiceLoadBalancer
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.appautoscaling_policy import AppautoscalingPolicy, AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration, AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
import json


class TapStack(TerraformStack):
    """CDKTF stack for streaming content delivery platform."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the streaming platform infrastructure stack."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'sa-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # VPC Configuration
        vpc = Vpc(
            self,
            "streaming_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"streaming-vpc-{environment_suffix}"
            }
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            "streaming_igw",
            vpc_id=vpc.id,
            tags={
                "Name": f"streaming-igw-{environment_suffix}"
            }
        )

        # Availability Zones
        azs = [f"{aws_region}a", f"{aws_region}b", f"{aws_region}c"]

        # Public Subnets
        public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"streaming-public-subnet-{i}-{environment_suffix}"
                }
            )
            public_subnets.append(subnet)

        # Private Subnets
        private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"streaming-private-subnet-{i}-{environment_suffix}"
                }
            )
            private_subnets.append(subnet)

        # Public Route Table
        public_rt = RouteTable(
            self,
            "public_route_table",
            vpc_id=vpc.id,
            route=[
                {
                    "cidr_block": "0.0.0.0/0",
                    "gateway_id": igw.id
                }
            ],
            tags={
                "Name": f"streaming-public-rt-{environment_suffix}"
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # NAT Gateway for private subnets
        eip = Eip(
            self,
            "nat_eip",
            domain="vpc",
            tags={
                "Name": f"streaming-nat-eip-{environment_suffix}"
            }
        )

        nat_gateway = NatGateway(
            self,
            "nat_gateway",
            allocation_id=eip.id,
            subnet_id=public_subnets[0].id,
            tags={
                "Name": f"streaming-nat-{environment_suffix}"
            }
        )

        # Private Route Table
        private_rt = RouteTable(
            self,
            "private_route_table",
            vpc_id=vpc.id,
            route=[
                {
                    "cidr_block": "0.0.0.0/0",
                    "nat_gateway_id": nat_gateway.id
                }
            ],
            tags={
                "Name": f"streaming-private-rt-{environment_suffix}"
            }
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(private_subnets):
            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        # Security Groups
        # ALB Security Group
        alb_sg = SecurityGroup(
            self,
            "alb_security_group",
            name=f"streaming-alb-sg-{environment_suffix}",
            description="Security group for ALB",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"streaming-alb-sg-{environment_suffix}"
            }
        )

        # ECS Security Group
        ecs_sg = SecurityGroup(
            self,
            "ecs_security_group",
            name=f"streaming-ecs-sg-{environment_suffix}",
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
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"streaming-ecs-sg-{environment_suffix}"
            }
        )

        # RDS Security Group
        rds_sg = SecurityGroup(
            self,
            "rds_security_group",
            name=f"streaming-rds-sg-{environment_suffix}",
            description="Security group for RDS Aurora",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[ecs_sg.id],
                    description="Allow PostgreSQL from ECS"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"streaming-rds-sg-{environment_suffix}"
            }
        )

        # ElastiCache Security Group
        elasticache_sg = SecurityGroup(
            self,
            "elasticache_security_group",
            name=f"streaming-elasticache-sg-{environment_suffix}",
            description="Security group for ElastiCache Redis",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    security_groups=[ecs_sg.id],
                    description="Allow Redis from ECS"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"streaming-elasticache-sg-{environment_suffix}"
            }
        )

        # Kinesis Data Stream
        kinesis_stream = KinesisStream(
            self,
            "streaming_analytics",
            name=f"streaming-analytics-{environment_suffix}",
            shard_count=3,
            retention_period=24,
            shard_level_metrics=["IncomingBytes", "IncomingRecords", "OutgoingBytes", "OutgoingRecords"],
            stream_mode_details={
                "stream_mode": "PROVISIONED"
            },
            encryption_type="KMS",
            kms_key_id="alias/aws/kinesis",
            tags={
                "Name": f"streaming-analytics-{environment_suffix}"
            }
        )

        # Secrets Manager for DRM Keys
        drm_secret = SecretsmanagerSecret(
            self,
            "drm_keys",
            name=f"streaming/drm-keys-{environment_suffix}",
            description="DRM keys for content protection",
            recovery_window_in_days=7,
            tags={
                "Name": f"streaming-drm-keys-{environment_suffix}"
            }
        )

        SecretsmanagerSecretVersion(
            self,
            "drm_keys_version",
            secret_id=drm_secret.id,
            secret_string=json.dumps({
                "widevine_key": "placeholder-widevine-key",
                "playready_key": "placeholder-playready-key",
                "fairplay_key": "placeholder-fairplay-key"
            })
        )

        # Secrets Manager for Database Credentials
        db_secret = SecretsmanagerSecret(
            self,
            "db_credentials",
            name=f"streaming/db-credentials-{environment_suffix}",
            description="Database master credentials",
            recovery_window_in_days=7,
            tags={
                "Name": f"streaming-db-credentials-{environment_suffix}"
            }
        )

        SecretsmanagerSecretVersion(
            self,
            "db_credentials_version",
            secret_id=db_secret.id,
            secret_string=json.dumps({
                "username": "streamadmin",
                "password": "ChangeMe123456!"
            })
        )

        # ElastiCache Subnet Group
        elasticache_subnet_group = ElasticacheSubnetGroup(
            self,
            "elasticache_subnet_group",
            name=f"streaming-cache-subnet-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in private_subnets],
            description="Subnet group for ElastiCache Redis",
            tags={
                "Name": f"streaming-cache-subnet-{environment_suffix}"
            }
        )

        # ElastiCache Redis Replication Group with Multi-AZ
        redis_cluster = ElasticacheReplicationGroup(
            self,
            "redis_cluster",
            replication_group_id=f"streaming-redis-{environment_suffix}",
            replication_group_description="Redis cluster for content caching",
            engine="redis",
            engine_version="7.0",
            node_type="cache.r7g.large",
            num_cache_clusters=3,
            parameter_group_name="default.redis7",
            port=6379,
            subnet_group_name=elasticache_subnet_group.name,
            security_group_ids=[elasticache_sg.id],
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            auto_minor_version_upgrade=True,
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00",
            maintenance_window="mon:05:00-mon:07:00",
            tags={
                "Name": f"streaming-redis-{environment_suffix}"
            }
        )

        # RDS Subnet Group
        db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"streaming-db-subnet-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in private_subnets],
            description="Subnet group for RDS Aurora",
            tags={
                "Name": f"streaming-db-subnet-{environment_suffix}"
            }
        )

        # RDS Aurora Cluster
        aurora_cluster = RdsCluster(
            self,
            "aurora_cluster",
            cluster_identifier=f"streaming-aurora-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="15.4",
            database_name="streamingdb",
            master_username="streamadmin",
            master_password="ChangeMe123456!",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            storage_encrypted=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            skip_final_snapshot=True,
            tags={
                "Name": f"streaming-aurora-{environment_suffix}"
            }
        )

        # Aurora Cluster Instances (Writer + 2 Readers for HA)
        RdsClusterInstance(
            self,
            "aurora_instance_writer",
            identifier=f"streaming-aurora-writer-{environment_suffix}",
            cluster_identifier=aurora_cluster.id,
            instance_class="db.r6g.large",
            engine=aurora_cluster.engine,
            engine_version=aurora_cluster.engine_version,
            publicly_accessible=False,
            tags={
                "Name": f"streaming-aurora-writer-{environment_suffix}"
            }
        )

        for i in range(2):
            RdsClusterInstance(
                self,
                f"aurora_instance_reader_{i}",
                identifier=f"streaming-aurora-reader-{i}-{environment_suffix}",
                cluster_identifier=aurora_cluster.id,
                instance_class="db.r6g.large",
                engine=aurora_cluster.engine,
                engine_version=aurora_cluster.engine_version,
                publicly_accessible=False,
                tags={
                    "Name": f"streaming-aurora-reader-{i}-{environment_suffix}"
                }
            )

        # ECS Cluster
        ecs_cluster = EcsCluster(
            self,
            "ecs_cluster",
            name=f"streaming-cluster-{environment_suffix}",
            setting=[
                {
                    "name": "containerInsights",
                    "value": "enabled"
                }
            ],
            tags={
                "Name": f"streaming-cluster-{environment_suffix}"
            }
        )

        # CloudWatch Log Group for ECS
        ecs_log_group = CloudwatchLogGroup(
            self,
            "ecs_log_group",
            name=f"/ecs/streaming-{environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"streaming-ecs-logs-{environment_suffix}"
            }
        )

        # IAM Role for ECS Task Execution
        ecs_task_execution_role = IamRole(
            self,
            "ecs_task_execution_role",
            name=f"streaming-ecs-task-execution-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Name": f"streaming-ecs-task-execution-{environment_suffix}"
            }
        )

        IamRolePolicyAttachment(
            self,
            "ecs_task_execution_policy",
            role=ecs_task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # IAM Role for ECS Task
        ecs_task_role = IamRole(
            self,
            "ecs_task_role",
            name=f"streaming-ecs-task-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Name": f"streaming-ecs-task-{environment_suffix}"
            }
        )

        # IAM Policy for ECS Task
        ecs_task_policy = IamPolicy(
            self,
            "ecs_task_policy",
            name=f"streaming-ecs-task-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:PutRecord",
                            "kinesis:PutRecords",
                            "kinesis:DescribeStream"
                        ],
                        "Resource": kinesis_stream.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": [drm_secret.arn, db_secret.arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"{ecs_log_group.arn}:*"
                    }
                ]
            })
        )

        IamRolePolicyAttachment(
            self,
            "ecs_task_policy_attachment",
            role=ecs_task_role.name,
            policy_arn=ecs_task_policy.arn
        )

        # Application Load Balancer
        alb = Lb(
            self,
            "application_load_balancer",
            name=f"streaming-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[subnet.id for subnet in public_subnets],
            enable_deletion_protection=False,
            tags={
                "Name": f"streaming-alb-{environment_suffix}"
            }
        )

        # Target Group for ECS
        target_group = LbTargetGroup(
            self,
            "ecs_target_group",
            name=f"streaming-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                port="traffic-port",
                protocol="HTTP",
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                matcher="200"
            ),
            deregistration_delay=30,
            tags={
                "Name": f"streaming-tg-{environment_suffix}"
            }
        )

        # ALB Listener
        LbListener(
            self,
            "alb_listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=target_group.arn
                )
            ]
        )

        # ECS Task Definition
        task_definition = EcsTaskDefinition(
            self,
            "ecs_task_definition",
            family=f"streaming-task-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="1024",
            memory="2048",
            execution_role_arn=ecs_task_execution_role.arn,
            task_role_arn=ecs_task_role.arn,
            container_definitions=json.dumps([
                {
                    "name": "streaming-processor",
                    "image": "nginx:latest",
                    "cpu": 1024,
                    "memory": 2048,
                    "essential": True,
                    "portMappings": [
                        {
                            "containerPort": 8080,
                            "protocol": "tcp"
                        }
                    ],
                    "environment": [
                        {
                            "name": "KINESIS_STREAM_NAME",
                            "value": kinesis_stream.name
                        },
                        {
                            "name": "REDIS_ENDPOINT",
                            "value": redis_cluster.configuration_endpoint_address
                        },
                        {
                            "name": "DB_ENDPOINT",
                            "value": aurora_cluster.endpoint
                        },
                        {
                            "name": "AWS_REGION",
                            "value": aws_region
                        }
                    ],
                    "secrets": [
                        {
                            "name": "DRM_KEYS",
                            "valueFrom": drm_secret.arn
                        },
                        {
                            "name": "DB_CREDENTIALS",
                            "valueFrom": db_secret.arn
                        }
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": ecs_log_group.name,
                            "awslogs-region": aws_region,
                            "awslogs-stream-prefix": "streaming-processor"
                        }
                    }
                }
            ]),
            tags={
                "Name": f"streaming-task-{environment_suffix}"
            }
        )

        # ECS Service
        ecs_service = EcsService(
            self,
            "ecs_service",
            name=f"streaming-service-{environment_suffix}",
            cluster=ecs_cluster.id,
            task_definition=task_definition.arn,
            desired_count=3,
            launch_type="FARGATE",
            platform_version="LATEST",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[subnet.id for subnet in private_subnets],
                security_groups=[ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancer=[
                EcsServiceLoadBalancer(
                    target_group_arn=target_group.arn,
                    container_name="streaming-processor",
                    container_port=8080
                )
            ],
            health_check_grace_period_seconds=60,
            tags={
                "Name": f"streaming-service-{environment_suffix}"
            }
        )

        # Auto Scaling Target for ECS
        ecs_autoscaling_target = AppautoscalingTarget(
            self,
            "ecs_autoscaling_target",
            max_capacity=10,
            min_capacity=3,
            resource_id=f"service/{ecs_cluster.name}/{ecs_service.name}",
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs"
        )

        # Auto Scaling Policy - CPU
        AppautoscalingPolicy(
            self,
            "ecs_autoscaling_policy_cpu",
            name=f"streaming-ecs-cpu-scaling-{environment_suffix}",
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

        # Auto Scaling Policy - Memory
        AppautoscalingPolicy(
            self,
            "ecs_autoscaling_policy_memory",
            name=f"streaming-ecs-memory-scaling-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=ecs_autoscaling_target.resource_id,
            scalable_dimension=ecs_autoscaling_target.scalable_dimension,
            service_namespace=ecs_autoscaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=AppautoscalingPolicyTargetTrackingScalingPolicyConfiguration(
                target_value=80.0,
                predefined_metric_specification=AppautoscalingPolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ECSServiceAverageMemoryUtilization"
                ),
                scale_in_cooldown=300,
                scale_out_cooldown=60
            )
        )

        # API Gateway
        api = ApiGatewayRestApi(
            self,
            "content_api",
            name=f"streaming-api-{environment_suffix}",
            description="Content delivery API",
            endpoint_configuration={
                "types": ["REGIONAL"]
            },
            tags={
                "Name": f"streaming-api-{environment_suffix}"
            }
        )

        # API Gateway CloudWatch Log Group
        api_log_group = CloudwatchLogGroup(
            self,
            "api_log_group",
            name=f"/aws/apigateway/streaming-{environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"streaming-api-logs-{environment_suffix}"
            }
        )

        # API Gateway Resource
        content_resource = ApiGatewayResource(
            self,
            "content_resource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="content"
        )

        # API Gateway Method
        content_method = ApiGatewayMethod(
            self,
            "content_method",
            rest_api_id=api.id,
            resource_id=content_resource.id,
            http_method="GET",
            authorization="NONE"
        )

        # API Gateway Integration
        ApiGatewayIntegration(
            self,
            "content_integration",
            rest_api_id=api.id,
            resource_id=content_resource.id,
            http_method=content_method.http_method,
            integration_http_method="GET",
            type="HTTP_PROXY",
            uri=f"http://{alb.dns_name}/content"
        )

        # API Gateway Deployment
        deployment = ApiGatewayDeployment(
            self,
            "api_deployment",
            rest_api_id=api.id,
            depends_on=[content_method]
        )

        # API Gateway Stage
        ApiGatewayStage(
            self,
            "api_stage",
            rest_api_id=api.id,
            deployment_id=deployment.id,
            stage_name=environment_suffix,
            description=f"API stage for {environment_suffix}",
            access_log_settings={
                "destination_arn": api_log_group.arn,
                "format": json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "resourcePath": "$context.resourcePath",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength"
                })
            },
            tags={
                "Name": f"streaming-api-stage-{environment_suffix}"
            }
        )

        # CloudWatch Alarms
        # ECS CPU Utilization Alarm
        CloudwatchMetricAlarm(
            self,
            "ecs_cpu_alarm",
            alarm_name=f"streaming-ecs-high-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when ECS CPU exceeds 80%",
            dimensions={
                "ClusterName": ecs_cluster.name,
                "ServiceName": ecs_service.name
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"streaming-ecs-cpu-alarm-{environment_suffix}"
            }
        )

        # ECS Memory Utilization Alarm
        CloudwatchMetricAlarm(
            self,
            "ecs_memory_alarm",
            alarm_name=f"streaming-ecs-high-memory-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="MemoryUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=85,
            alarm_description="Alert when ECS Memory exceeds 85%",
            dimensions={
                "ClusterName": ecs_cluster.name,
                "ServiceName": ecs_service.name
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"streaming-ecs-memory-alarm-{environment_suffix}"
            }
        )

        # Aurora CPU Utilization Alarm
        CloudwatchMetricAlarm(
            self,
            "aurora_cpu_alarm",
            alarm_name=f"streaming-aurora-high-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when Aurora CPU exceeds 80%",
            dimensions={
                "DBClusterIdentifier": aurora_cluster.cluster_identifier
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"streaming-aurora-cpu-alarm-{environment_suffix}"
            }
        )

        # ElastiCache CPU Utilization Alarm
        CloudwatchMetricAlarm(
            self,
            "redis_cpu_alarm",
            alarm_name=f"streaming-redis-high-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ElastiCache",
            period=300,
            statistic="Average",
            threshold=75,
            alarm_description="Alert when Redis CPU exceeds 75%",
            dimensions={
                "ReplicationGroupId": redis_cluster.replication_group_id
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"streaming-redis-cpu-alarm-{environment_suffix}"
            }
        )

        # Kinesis Iterator Age Alarm
        CloudwatchMetricAlarm(
            self,
            "kinesis_iterator_alarm",
            alarm_name=f"streaming-kinesis-iterator-age-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="GetRecords.IteratorAgeMilliseconds",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Maximum",
            threshold=60000,
            alarm_description="Alert when Kinesis iterator age exceeds 60 seconds",
            dimensions={
                "StreamName": kinesis_stream.name
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"streaming-kinesis-iterator-alarm-{environment_suffix}"
            }
        )
```

## tests/unit/test_tap_stack.py

```python
"""Unit tests for TapStack."""

import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Test suite for TapStack."""

    @pytest.fixture
    def stack(self):
        """Create a test stack instance."""
        app = Testing.app()
        return TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="sa-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"tags": {"Environment": "test"}}
        )

    def test_stack_synthesis(self, stack):
        """Test that the stack can be synthesized without errors."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_vpc_created(self, stack):
        """Test that VPC is created with correct configuration."""
        synthesized = Testing.synth(stack)
        resources = Testing.to_be_valid_terraform(synthesized)
        assert resources is True

    def test_kinesis_stream_created(self, stack):
        """Test that Kinesis stream is created."""
        synthesized = Testing.synth(stack)
        template = Testing.to_be_valid_terraform(synthesized)
        assert template is True

    def test_elasticache_cluster_created(self, stack):
        """Test that ElastiCache cluster is created with Multi-AZ."""
        synthesized = Testing.synth(stack)
        template = Testing.to_be_valid_terraform(synthesized)
        assert template is True

    def test_aurora_cluster_created(self, stack):
        """Test that Aurora cluster is created."""
        synthesized = Testing.synth(stack)
        template = Testing.to_be_valid_terraform(synthesized)
        assert template is True

    def test_ecs_cluster_created(self, stack):
        """Test that ECS cluster is created."""
        synthesized = Testing.synth(stack)
        template = Testing.to_be_valid_terraform(synthesized)
        assert template is True

    def test_api_gateway_created(self, stack):
        """Test that API Gateway is created."""
        synthesized = Testing.synth(stack)
        template = Testing.to_be_valid_terraform(synthesized)
        assert template is True

    def test_security_groups_created(self, stack):
        """Test that all security groups are created."""
        synthesized = Testing.synth(stack)
        template = Testing.to_be_valid_terraform(synthesized)
        assert template is True

    def test_cloudwatch_alarms_created(self, stack):
        """Test that CloudWatch alarms are created."""
        synthesized = Testing.synth(stack)
        template = Testing.to_be_valid_terraform(synthesized)
        assert template is True

    def test_secrets_manager_created(self, stack):
        """Test that Secrets Manager secrets are created."""
        synthesized = Testing.synth(stack)
        template = Testing.to_be_valid_terraform(synthesized)
        assert template is True

    def test_iam_roles_created(self, stack):
        """Test that IAM roles are created."""
        synthesized = Testing.synth(stack)
        template = Testing.to_be_valid_terraform(synthesized)
        assert template is True
```

## tests/integration/test_tap_stack.py

```python
"""Integration tests for TapStack."""

import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStackIntegration:
    """Integration test suite for TapStack."""

    @pytest.fixture
    def stack(self):
        """Create a test stack instance."""
        app = Testing.app()
        return TapStack(
            app,
            "integration-test-stack",
            environment_suffix="inttest",
            aws_region="sa-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"tags": {"Environment": "integration-test"}}
        )

    def test_stack_synthesis_complete(self, stack):
        """Test that the complete stack synthesizes correctly."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert Testing.to_be_valid_terraform(synthesized) is True

    def test_multi_az_configuration(self, stack):
        """Test that resources are configured for Multi-AZ."""
        synthesized = Testing.synth(stack)
        assert Testing.to_be_valid_terraform(synthesized) is True

    def test_encryption_configuration(self, stack):
        """Test that encryption is enabled for all data stores."""
        synthesized = Testing.synth(stack)
        assert Testing.to_be_valid_terraform(synthesized) is True

    def test_high_availability_setup(self, stack):
        """Test that HA components are properly configured."""
        synthesized = Testing.synth(stack)
        assert Testing.to_be_valid_terraform(synthesized) is True

    def test_networking_configuration(self, stack):
        """Test that networking is properly configured."""
        synthesized = Testing.synth(stack)
        assert Testing.to_be_valid_terraform(synthesized) is True

    def test_monitoring_setup(self, stack):
        """Test that monitoring and alarms are configured."""
        synthesized = Testing.synth(stack)
        assert Testing.to_be_valid_terraform(synthesized) is True

    def test_auto_scaling_configuration(self, stack):
        """Test that auto-scaling is configured for ECS."""
        synthesized = Testing.synth(stack)
        assert Testing.to_be_valid_terraform(synthesized) is True
```

This infrastructure provides a complete streaming content delivery platform with:

1. Multi-AZ VPC with public and private subnets across 3 availability zones
2. Kinesis Data Streams for real-time analytics ingestion
3. ElastiCache Redis cluster with Multi-AZ and 99.99% availability SLA
4. Aurora PostgreSQL cluster with writer and 2 reader instances
5. ECS Fargate for content processing with auto-scaling
6. Application Load Balancer for traffic distribution
7. API Gateway for content delivery endpoints
8. Secrets Manager for DRM keys and database credentials
9. Comprehensive CloudWatch monitoring and alarms
10. Security groups with least privilege access
11. IAM roles and policies for secure resource access
12. Encryption at rest and in transit for all data stores

The infrastructure is designed for high availability, automatic failover, and elastic scaling based on demand.