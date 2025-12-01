"""TAP Stack module for CDKTF Python video processing pipeline infrastructure."""

from cdktf import TerraformStack, S3Backend, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.kinesis_stream import KinesisStream
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for video processing pipeline infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
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

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Create VPC for ECS and RDS
        vpc = Vpc(
            self,
            "video_processing_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"video-processing-vpc-{environment_suffix}"}
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "video_processing_igw",
            vpc_id=vpc.id,
            tags={"Name": f"video-processing-igw-{environment_suffix}"}
        )

        # Create public subnets for ECS Fargate (2 AZs for high availability)
        public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
            tags={"Name": f"video-processing-public-subnet-1-{environment_suffix}"}
        )

        public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            map_public_ip_on_launch=True,
            tags={"Name": f"video-processing-public-subnet-2-{environment_suffix}"}
        )

        # Create private subnets for RDS (2 AZs required for RDS)
        private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.10.0/24",
            availability_zone=f"{aws_region}a",
            tags={"Name": f"video-processing-private-subnet-1-{environment_suffix}"}
        )

        private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{aws_region}b",
            tags={"Name": f"video-processing-private-subnet-2-{environment_suffix}"}
        )

        # Create route table for public subnets
        public_route_table = RouteTable(
            self,
            "public_route_table",
            vpc_id=vpc.id,
            tags={"Name": f"video-processing-public-rt-{environment_suffix}"}
        )

        # Add route to internet gateway
        Route(
            self,
            "public_internet_route",
            route_table_id=public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )

        # Associate route table with public subnets
        RouteTableAssociation(
            self,
            "public_subnet_1_association",
            subnet_id=public_subnet_1.id,
            route_table_id=public_route_table.id
        )

        RouteTableAssociation(
            self,
            "public_subnet_2_association",
            subnet_id=public_subnet_2.id,
            route_table_id=public_route_table.id
        )

        # Create security group for ECS tasks
        ecs_security_group = SecurityGroup(
            self,
            "ecs_security_group",
            name=f"video-processing-ecs-sg-{environment_suffix}",
            description="Security group for ECS video processing tasks",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS inbound"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic"
                )
            ],
            tags={"Name": f"video-processing-ecs-sg-{environment_suffix}"}
        )

        # Create security group for RDS
        rds_security_group = SecurityGroup(
            self,
            "rds_security_group",
            name=f"video-processing-rds-sg-{environment_suffix}",
            description="Security group for RDS Aurora Serverless",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[ecs_security_group.id],
                    description="PostgreSQL from ECS tasks"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic"
                )
            ],
            tags={"Name": f"video-processing-rds-sg-{environment_suffix}"}
        )

        # Create CloudWatch Log Group for ECS tasks
        log_group = CloudwatchLogGroup(
            self,
            "ecs_log_group",
            name=f"/ecs/video-processing-{environment_suffix}",
            retention_in_days=7
        )

        # Create Secrets Manager secret for database credentials
        db_secret = SecretsmanagerSecret(
            self,
            "db_credentials_secret",
            name=f"video-processing-db-credentials-{environment_suffix}",
            description="Database credentials for video processing pipeline",
            recovery_window_in_days=0
        )

        # Generate and store database credentials
        db_username = "videoadmin"
        db_password_raw = f"video-processing-db-{environment_suffix}-password"

        db_credentials_json = json.dumps({
            "username": db_username,
            "password": db_password_raw,
            "engine": "postgres",
            "port": 5432
        })

        db_secret_version = SecretsmanagerSecretVersion(
            self,
            "db_credentials_version",
            secret_id=db_secret.id,
            secret_string=db_credentials_json
        )

        # Create DB subnet group for RDS
        db_subnet_group = DbSubnetGroup(
            self,
            "rds_subnet_group",
            name=f"video-processing-rds-subnet-group-{environment_suffix}",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={"Name": f"video-processing-rds-subnet-group-{environment_suffix}"}
        )

        # Create RDS Aurora Serverless v2 cluster
        rds_cluster = RdsCluster(
            self,
            "video_metadata_cluster",
            cluster_identifier=f"video-metadata-{environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            engine_version="15.4",
            database_name="videometadata",
            master_username=db_username,
            master_password=db_password_raw,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_security_group.id],
            skip_final_snapshot=True,
            deletion_protection=False,
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 1.0
            },
            tags={"Name": f"video-metadata-cluster-{environment_suffix}"}
        )

        # Create Kinesis stream for video ingestion
        kinesis_stream = KinesisStream(
            self,
            "video_ingestion_stream",
            name=f"video-ingestion-stream-{environment_suffix}",
            shard_count=2,
            retention_period=24,
            shard_level_metrics=[
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords",
                "WriteProvisionedThroughputExceeded",
                "ReadProvisionedThroughputExceeded"
            ],
            tags={"Name": f"video-ingestion-stream-{environment_suffix}"}
        )

        # Create SQS Dead Letter Queue for failed processing jobs
        dlq = SqsQueue(
            self,
            "video_processing_dlq",
            name=f"video-processing-dlq-{environment_suffix}",
            message_retention_seconds=1209600,
            tags={"Name": f"video-processing-dlq-{environment_suffix}"}
        )

        # Create IAM role for ECS task execution
        task_execution_role = IamRole(
            self,
            "ecs_task_execution_role",
            name=f"video-processing-task-exec-role-{environment_suffix}",
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
            tags={"Name": f"video-processing-task-exec-role-{environment_suffix}"}
        )

        # Attach managed policy for ECS task execution
        IamRolePolicyAttachment(
            self,
            "ecs_task_execution_policy",
            role=task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Add inline policy for Secrets Manager access
        IamRolePolicy(
            self,
            "secrets_manager_policy",
            name="SecretsManagerAccess",
            role=task_execution_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": db_secret.arn
                    }
                ]
            })
        )

        # Create IAM role for ECS tasks
        task_role = IamRole(
            self,
            "ecs_task_role",
            name=f"video-processing-task-role-{environment_suffix}",
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
            tags={"Name": f"video-processing-task-role-{environment_suffix}"}
        )

        # Add inline policy for Kinesis, RDS, and SQS access
        IamRolePolicy(
            self,
            "task_permissions_policy",
            name="VideoProcessingPermissions",
            role=task_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:GetRecords",
                            "kinesis:GetShardIterator",
                            "kinesis:DescribeStream",
                            "kinesis:ListStreams",
                            "kinesis:PutRecord",
                            "kinesis:PutRecords"
                        ],
                        "Resource": kinesis_stream.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage",
                            "sqs:GetQueueAttributes",
                            "sqs:GetQueueUrl"
                        ],
                        "Resource": dlq.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": db_secret.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"{log_group.arn}:*"
                    }
                ]
            })
        )

        # Create ECS cluster
        ecs_cluster = EcsCluster(
            self,
            "video_processing_cluster",
            name=f"video-processing-cluster-{environment_suffix}",
            setting=[
                {
                    "name": "containerInsights",
                    "value": "enabled"
                }
            ],
            tags={"Name": f"video-processing-cluster-{environment_suffix}"}
        )

        # Create ECS task definition
        task_definition = EcsTaskDefinition(
            self,
            "video_processing_task",
            family=f"video-processing-task-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="1024",
            memory="2048",
            execution_role_arn=task_execution_role.arn,
            task_role_arn=task_role.arn,
            container_definitions=json.dumps([
                {
                    "name": "video-processor",
                    "image": "amazon/aws-cli:latest",
                    "essential": True,
                    "environment": [
                        {
                            "name": "KINESIS_STREAM_NAME",
                            "value": kinesis_stream.name
                        },
                        {
                            "name": "DLQ_URL",
                            "value": dlq.url
                        },
                        {
                            "name": "AWS_REGION",
                            "value": aws_region
                        },
                        {
                            "name": "DB_SECRET_ARN",
                            "value": db_secret.arn
                        }
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": log_group.name,
                            "awslogs-region": aws_region,
                            "awslogs-stream-prefix": "video-processor"
                        }
                    }
                }
            ]),
            tags={"Name": f"video-processing-task-{environment_suffix}"}
        )

        # Create ECS service
        ecs_service = EcsService(
            self,
            "video_processing_service",
            name=f"video-processing-service-{environment_suffix}",
            cluster=ecs_cluster.id,
            task_definition=task_definition.arn,
            desired_count=1,
            launch_type="FARGATE",
            network_configuration={
                "subnets": [public_subnet_1.id, public_subnet_2.id],
                "security_groups": [ecs_security_group.id],
                "assign_public_ip": True
            },
            tags={"Name": f"video-processing-service-{environment_suffix}"}
        )

        # Create CloudWatch alarm for Kinesis throttling
        kinesis_alarm = CloudwatchMetricAlarm(
            self,
            "kinesis_throttle_alarm",
            alarm_name=f"video-kinesis-throttle-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="WriteProvisionedThroughputExceeded",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Sum",
            threshold=10.0,
            alarm_description="Alert when Kinesis stream is being throttled",
            dimensions={
                "StreamName": kinesis_stream.name
            },
            treat_missing_data="notBreaching"
        )

        # Create CloudWatch alarm for DLQ messages
        dlq_alarm = CloudwatchMetricAlarm(
            self,
            "dlq_messages_alarm",
            alarm_name=f"video-dlq-messages-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ApproximateNumberOfMessagesVisible",
            namespace="AWS/SQS",
            period=300,
            statistic="Average",
            threshold=0.0,
            alarm_description="Alert when messages appear in the DLQ",
            dimensions={
                "QueueName": dlq.name
            },
            treat_missing_data="notBreaching"
        )
