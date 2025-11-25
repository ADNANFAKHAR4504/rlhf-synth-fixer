#!/usr/bin/env python
# pylint: disable=too-many-lines,duplicate-code
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider

# VPC and Networking
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.vpc_peering_connection import VpcPeeringConnection
from cdktf_cdktf_provider_aws.vpc_peering_connection_accepter import VpcPeeringConnectionAccepterA
from cdktf_cdktf_provider_aws.route import Route

# RDS and Secrets Manager
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias

# Lambda and DynamoDB
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableReplica
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission

# Route 53
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.route53_record import Route53Record

# CloudWatch and SNS
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription

import json


class TapStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        stack_id: str,
        environment_suffix: str,
        state_bucket: str,
        state_bucket_region: str,
        primary_region: str = "us-east-1",
        secondary_region: str = "us-west-2"
    ):
        super().__init__(scope, stack_id)

        self.environment_suffix = environment_suffix

        # S3 Backend for remote state
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{stack_id}/{environment_suffix}/terraform.tfstate",
            region=state_bucket_region,
            encrypt=True
        )

        # Primary region provider (us-east-1)
        self.primary_provider = AwsProvider(
            self,
            "aws_primary",
            region=primary_region,
            alias="primary"
        )

        # Secondary region provider (us-west-2)
        self.secondary_provider = AwsProvider(
            self,
            "aws_secondary",
            region=secondary_region,
            alias="secondary"
        )

        # ===== NETWORKING =====
        # Primary VPC (us-east-1)
        self.primary_vpc = Vpc(
            self,
            "primary_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-v1-primary-vpc-v1-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        # Secondary VPC (us-west-2)
        self.secondary_vpc = Vpc(
            self,
            "secondary_vpc",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-v1-secondary-vpc-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        # Primary region subnets (3 AZs)
        self.primary_private_subnets = []
        primary_azs = [f"{primary_region}a", f"{primary_region}b", f"{primary_region}c"]
        for i, az in enumerate(primary_azs):
            subnet = Subnet(
                self,
                f"primary_private_subnet_{i}",
                vpc_id=self.primary_vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"payment-v1-primary-private-{i}-{environment_suffix}",
                    "Environment": environment_suffix
                },
                provider=self.primary_provider
            )
            self.primary_private_subnets.append(subnet)

        # Secondary region subnets (3 AZs)
        self.secondary_private_subnets = []
        secondary_azs = [f"{secondary_region}a", f"{secondary_region}b", f"{secondary_region}c"]
        for i, az in enumerate(secondary_azs):
            subnet = Subnet(
                self,
                f"secondary_private_subnet_{i}",
                vpc_id=self.secondary_vpc.id,
                cidr_block=f"10.1.{i}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"payment-v1-secondary-private-{i}-{environment_suffix}",
                    "Environment": environment_suffix
                },
                provider=self.secondary_provider
            )
            self.secondary_private_subnets.append(subnet)

        # Internet Gateways
        self.primary_igw = InternetGateway(
            self,
            "primary_igw",
            vpc_id=self.primary_vpc.id,
            tags={
                "Name": f"payment-v1-primary-igw-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        self.secondary_igw = InternetGateway(
            self,
            "secondary_igw",
            vpc_id=self.secondary_vpc.id,
            tags={
                "Name": f"payment-v1-secondary-igw-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        # Route tables
        self.primary_route_table = RouteTable(
            self,
            "primary_route_table",
            vpc_id=self.primary_vpc.id,
            tags={
                "Name": f"payment-v1-primary-rt-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        self.secondary_route_table = RouteTable(
            self,
            "secondary_route_table",
            vpc_id=self.secondary_vpc.id,
            tags={
                "Name": f"payment-v1-secondary-rt-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        # VPC Peering Connection
        self.vpc_peering = VpcPeeringConnection(
            self,
            "vpc_peering",
            vpc_id=self.primary_vpc.id,
            peer_vpc_id=self.secondary_vpc.id,
            peer_region=secondary_region,
            auto_accept=False,
            tags={
                "Name": f"payment-v1-vpc-peering-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        # Accept VPC Peering in secondary region
        self.vpc_peering_accepter = VpcPeeringConnectionAccepterA(
            self,
            "vpc_peering_accepter",
            vpc_peering_connection_id=self.vpc_peering.id,
            auto_accept=True,
            tags={
                "Name": f"payment-v1-vpc-peering-accepter-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        # Routes for VPC peering
        Route(
            self,
            "primary_peering_route",
            route_table_id=self.primary_route_table.id,
            destination_cidr_block="10.1.0.0/16",
            vpc_peering_connection_id=self.vpc_peering.id,
            provider=self.primary_provider
        )

        Route(
            self,
            "secondary_peering_route",
            route_table_id=self.secondary_route_table.id,
            destination_cidr_block="10.0.0.0/16",
            vpc_peering_connection_id=self.vpc_peering.id,
            provider=self.secondary_provider
        )

        # Associate subnets with route tables
        for i, subnet in enumerate(self.primary_private_subnets):
            RouteTableAssociation(
                self,
                f"primary_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=self.primary_route_table.id,
                provider=self.primary_provider
            )

        for i, subnet in enumerate(self.secondary_private_subnets):
            RouteTableAssociation(
                self,
                f"secondary_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=self.secondary_route_table.id,
                provider=self.secondary_provider
            )

        # Security Groups - Primary Region
        self.primary_db_sg = SecurityGroup(
            self,
            "primary_db_sg",
            name=f"payment-v1-primary-db-sg-{environment_suffix}",
            description="Security group for Aurora database in primary region",
            vpc_id=self.primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16", "10.1.0.0/16"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-v1-primary-db-sg-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        self.primary_lambda_sg = SecurityGroup(
            self,
            "primary_lambda_sg",
            name=f"payment-v1-primary-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions in primary region",
            vpc_id=self.primary_vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-v1-primary-lambda-sg-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        # Security Groups - Secondary Region
        self.secondary_db_sg = SecurityGroup(
            self,
            "secondary_db_sg",
            name=f"payment-v1-secondary-db-sg-{environment_suffix}",
            description="Security group for Aurora database in secondary region",
            vpc_id=self.secondary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16", "10.1.0.0/16"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-v1-secondary-db-sg-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        self.secondary_lambda_sg = SecurityGroup(
            self,
            "secondary_lambda_sg",
            name=f"payment-v1-secondary-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions in secondary region",
            vpc_id=self.secondary_vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-v1-secondary-lambda-sg-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        # ===== DATABASE =====
        # KMS Keys for encryption
        self.primary_kms_key = KmsKey(
            self,
            "primary_rds_kms_key",
            description=f"KMS key for RDS encryption in primary region - {environment_suffix}",
            enable_key_rotation=True,
            tags={
                "Name": f"payment-v1-rds-key-primary-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        KmsAlias(
            self,
            "primary_rds_kms_alias",
            name=f"alias/payment-v1-rds-primary-{environment_suffix}",
            target_key_id=self.primary_kms_key.key_id,
            provider=self.primary_provider
        )

        self.secondary_kms_key = KmsKey(
            self,
            "secondary_rds_kms_key",
            description=f"KMS key for RDS encryption in secondary region - {environment_suffix}",
            enable_key_rotation=True,
            tags={
                "Name": f"payment-v1-rds-key-secondary-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        KmsAlias(
            self,
            "secondary_rds_kms_alias",
            name=f"alias/payment-v1-rds-secondary-{environment_suffix}",
            target_key_id=self.secondary_kms_key.key_id,
            provider=self.secondary_provider
        )

        # DB Subnet Groups
        self.primary_subnet_group = DbSubnetGroup(
            self,
            "primary_db_subnet_group",
            name=f"payment-v1-primary-db-subnet-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.primary_private_subnets],
            tags={
                "Name": f"payment-v1-primary-db-subnet-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        self.secondary_subnet_group = DbSubnetGroup(
            self,
            "secondary_db_subnet_group",
            name=f"payment-v1-secondary-db-subnet-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.secondary_private_subnets],
            tags={
                "Name": f"payment-v1-secondary-db-subnet-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        # Aurora Global Cluster
        self.global_cluster = RdsGlobalCluster(
            self,
            "global_cluster",
            global_cluster_identifier=f"payment-v1-global-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            database_name="paymentdb",
            storage_encrypted=True,
            provider=self.primary_provider
        )

        # Primary Secrets Manager secret
        self.primary_secret = SecretsmanagerSecret(
            self,
            "primary_db_secret",
            name=f"payment-v2-primary-db-creds-{environment_suffix}",
            description="Aurora database credentials for primary region",
            tags={
                "Name": f"payment-v2-primary-db-creds-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        db_credentials = {
            "username": "dbadmin",
            "password": "ChangeMe123456!",
            "engine": "postgres",
            "host": "placeholder",
            "port": 5432,
            "dbname": "paymentdb"
        }

        SecretsmanagerSecretVersion(
            self,
            "primary_db_secret_version",
            secret_id=self.primary_secret.id,
            secret_string=json.dumps(db_credentials),
            provider=self.primary_provider
        )

        # Primary Aurora Cluster
        self.primary_cluster = RdsCluster(
            self,
            "primary_cluster",
            cluster_identifier=f"payment-v1-primary-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            database_name="paymentdb",
            master_username="dbadmin",
            master_password="ChangeMe123456!",
            db_subnet_group_name=self.primary_subnet_group.name,
            vpc_security_group_ids=[self.primary_db_sg.id],
            storage_encrypted=True,
            kms_key_id=self.primary_kms_key.arn,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,
            global_cluster_identifier=self.global_cluster.id,
            tags={
                "Name": f"payment-v1-primary-cluster-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        # Primary cluster instances (2 for HA)
        for i in range(2):
            RdsClusterInstance(
                self,
                f"primary_instance_{i}",
                identifier=f"payment-v1-primary-instance-{i}-{environment_suffix}",
                cluster_identifier=self.primary_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-postgresql",
                engine_version="14.6",
                publicly_accessible=False,
                tags={
                    "Name": f"payment-v1-primary-instance-{i}-{environment_suffix}",
                    "Environment": environment_suffix
                },
                provider=self.primary_provider
            )

        # Secondary Secrets Manager secret
        self.secondary_secret = SecretsmanagerSecret(
            self,
            "secondary_db_secret",
            name=f"payment-v2-secondary-db-creds-{environment_suffix}",
            description="Aurora database credentials for secondary region",
            tags={
                "Name": f"payment-v2-secondary-db-creds-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        SecretsmanagerSecretVersion(
            self,
            "secondary_db_secret_version",
            secret_id=self.secondary_secret.id,
            secret_string=json.dumps(db_credentials),
            provider=self.secondary_provider
        )

        # Secondary Aurora Cluster
        self.secondary_cluster = RdsCluster(
            self,
            "secondary_cluster",
            cluster_identifier=f"payment-v1-secondary-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            db_subnet_group_name=self.secondary_subnet_group.name,
            vpc_security_group_ids=[self.secondary_db_sg.id],
            storage_encrypted=True,
            kms_key_id=self.secondary_kms_key.arn,
            skip_final_snapshot=True,
            global_cluster_identifier=self.global_cluster.id,
            depends_on=[self.primary_cluster],
            tags={
                "Name": f"payment-v1-secondary-cluster-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        # Secondary cluster instances (2 for HA)
        for i in range(2):
            RdsClusterInstance(
                self,
                f"secondary_instance_{i}",
                identifier=f"payment-v1-secondary-instance-{i}-{environment_suffix}",
                cluster_identifier=self.secondary_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-postgresql",
                engine_version="14.6",
                publicly_accessible=False,
                tags={
                    "Name": f"payment-v1-secondary-instance-{i}-{environment_suffix}",
                    "Environment": environment_suffix
                },
                provider=self.secondary_provider
            )

        # ===== COMPUTE =====
        # DynamoDB Global Table for session state
        self.dynamodb_table = DynamodbTable(
            self,
            "session_table",
            name=f"payment-v1-sessions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="sessionId",
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            attribute=[
                DynamodbTableAttribute(
                    name="sessionId",
                    type="S"
                )
            ],
            replica=[
                DynamodbTableReplica(
                    region_name=secondary_region
                )
            ],
            tags={
                "Name": f"payment-v1-sessions-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        # IAM Role for Lambda - Primary Region
        lambda_role_primary = IamRole(
            self,
            "lambda_role_primary",
            name=f"payment-v1-lambda-role-primary-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags={
                "Name": f"payment-v1-lambda-role-primary-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_vpc_policy_primary",
            role=lambda_role_primary.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=self.primary_provider
        )

        lambda_policy_primary = IamPolicy(
            self,
            "lambda_policy_primary",
            name=f"payment-v1-lambda-policy-primary-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query"
                        ],
                        "Resource": f"arn:aws:dynamodb:{primary_region}:*:table/payment-sessions-{environment_suffix}"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": self.primary_secret.arn
                    }
                ]
            }),
            provider=self.primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_custom_policy_primary",
            role=lambda_role_primary.name,
            policy_arn=lambda_policy_primary.arn,
            provider=self.primary_provider
        )

        # Payment Processing Lambda - Primary Region
        self.primary_payment_lambda = LambdaFunction(
            self,
            "payment_lambda_primary",
            function_name=f"payment-v1-processor-primary-{environment_suffix}",
            role=lambda_role_primary.arn,
            handler="index.handler",
            runtime="python3.11",
            architectures=["arm64"],
            memory_size=512,
            timeout=30,
            filename="${path.module}/../../../lib/lambda_placeholder.zip",
            environment={
                "variables": {
                    "DYNAMODB_TABLE": self.dynamodb_table.name,
                    "DB_SECRET_ARN": self.primary_secret.arn,
                    "REGION": primary_region
                }
            },
            vpc_config={
                "subnet_ids": [subnet.id for subnet in self.primary_private_subnets],
                "security_group_ids": [self.primary_lambda_sg.id]
            },
            tags={
                "Name": f"payment-v1-processor-primary-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        # IAM Role for Lambda - Secondary Region
        lambda_role_secondary = IamRole(
            self,
            "lambda_role_secondary",
            name=f"payment-v1-lambda-role-secondary-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags={
                "Name": f"payment-v1-lambda-role-secondary-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_vpc_policy_secondary",
            role=lambda_role_secondary.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=self.secondary_provider
        )

        lambda_policy_secondary = IamPolicy(
            self,
            "lambda_policy_secondary",
            name=f"payment-v1-lambda-policy-secondary-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query"
                        ],
                        "Resource": f"arn:aws:dynamodb:{secondary_region}:*:table/payment-sessions-{environment_suffix}"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": self.secondary_secret.arn
                    }
                ]
            }),
            provider=self.secondary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_custom_policy_secondary",
            role=lambda_role_secondary.name,
            policy_arn=lambda_policy_secondary.arn,
            provider=self.secondary_provider
        )

        # Payment Processing Lambda - Secondary Region
        self.secondary_payment_lambda = LambdaFunction(
            self,
            "payment_lambda_secondary",
            function_name=f"payment-v1-processor-secondary-{environment_suffix}",
            role=lambda_role_secondary.arn,
            handler="index.handler",
            runtime="python3.11",
            architectures=["arm64"],
            memory_size=512,
            timeout=30,
            filename="${path.module}/../../../lib/lambda_placeholder.zip",
            environment={
                "variables": {
                    "DYNAMODB_TABLE": self.dynamodb_table.name,
                    "DB_SECRET_ARN": self.secondary_secret.arn,
                    "REGION": secondary_region
                }
            },
            vpc_config={
                "subnet_ids": [subnet.id for subnet in self.secondary_private_subnets],
                "security_group_ids": [self.secondary_lambda_sg.id]
            },
            tags={
                "Name": f"payment-v1-processor-secondary-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        # Backup Verification Lambda - Primary Region
        backup_lambda_role = IamRole(
            self,
            "backup_lambda_role",
            name=f"payment-v1-backup-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags={
                "Name": f"payment-v1-backup-lambda-role-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "backup_lambda_basic_policy",
            role=backup_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            provider=self.primary_provider
        )

        backup_policy = IamPolicy(
            self,
            "backup_lambda_policy",
            name=f"payment-v1-backup-lambda-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBClusters",
                            "rds:DescribeDBClusterSnapshots"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            provider=self.primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "backup_lambda_custom_policy",
            role=backup_lambda_role.name,
            policy_arn=backup_policy.arn,
            provider=self.primary_provider
        )

        self.backup_verification_lambda = LambdaFunction(
            self,
            "backup_verification_lambda",
            function_name=f"payment-v1-backup-verification-{environment_suffix}",
            role=backup_lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            architectures=["arm64"],
            memory_size=256,
            timeout=300,
            filename="${path.module}/../../../lib/lambda_placeholder.zip",
            environment={
                "variables": {
                    "CLUSTER_IDENTIFIER": f"payment-v1-primary-{environment_suffix}",
                    "ENVIRONMENT": environment_suffix
                }
            },
            tags={
                "Name": f"payment-v1-backup-verification-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        # CloudWatch Event Rule for daily backup verification
        backup_schedule_rule = CloudwatchEventRule(
            self,
            "backup_schedule",
            name=f"payment-v1-backup-schedule-{environment_suffix}",
            description="Trigger backup verification daily",
            schedule_expression="rate(1 day)",
            provider=self.primary_provider
        )

        CloudwatchEventTarget(
            self,
            "backup_schedule_target",
            rule=backup_schedule_rule.name,
            arn=self.backup_verification_lambda.arn,
            provider=self.primary_provider
        )

        LambdaPermission(
            self,
            "backup_lambda_permission",
            statement_id="AllowExecutionFromCloudWatch",
            action="lambda:InvokeFunction",
            function_name=self.backup_verification_lambda.function_name,
            principal="events.amazonaws.com",
            source_arn=backup_schedule_rule.arn,
            provider=self.primary_provider
        )

        # ===== DNS =====
        # Route 53 Hosted Zone
        self.hosted_zone = Route53Zone(
            self,
            "hosted_zone",
            name=f"payment-v1-dr-{environment_suffix}.internal.test",
            tags={
                "Name": f"payment-v1-dr-zone-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        primary_function = self.primary_payment_lambda.function_name
        primary_endpoint = f"https://{primary_function}.lambda-url.{primary_region}.on.aws"
        secondary_function = self.secondary_payment_lambda.function_name
        secondary_endpoint = f"https://{secondary_function}.lambda-url.{secondary_region}.on.aws"

        # Health check for primary endpoint
        self.primary_health_check = Route53HealthCheck(
            self,
            "primary_health_check",
            type="HTTPS",
            resource_path="/health",
            fqdn=primary_endpoint.replace("https://", "").replace("/", ""),
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={
                "Name": f"payment-v1-primary-health-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        # Health check for secondary endpoint
        self.secondary_health_check = Route53HealthCheck(
            self,
            "secondary_health_check",
            type="HTTPS",
            resource_path="/health",
            fqdn=secondary_endpoint.replace("https://", "").replace("/", ""),
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={
                "Name": f"payment-v1-secondary-health-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        # Primary DNS record with failover
        Route53Record(
            self,
            "primary_record",
            zone_id=self.hosted_zone.zone_id,
            name=f"api.payment-dr-{environment_suffix}.internal.test",
            type="CNAME",
            ttl=60,
            records=[primary_endpoint.replace("https://", "")],
            set_identifier="primary",
            failover_routing_policy={
                "type": "PRIMARY"
            },
            health_check_id=self.primary_health_check.id,
            provider=self.primary_provider
        )

        # Secondary DNS record with failover
        Route53Record(
            self,
            "secondary_record",
            zone_id=self.hosted_zone.zone_id,
            name=f"api.payment-dr-{environment_suffix}.internal.test",
            type="CNAME",
            ttl=60,
            records=[secondary_endpoint.replace("https://", "")],
            set_identifier="secondary",
            failover_routing_policy={
                "type": "SECONDARY"
            },
            health_check_id=self.secondary_health_check.id,
            provider=self.primary_provider
        )

        # ===== MONITORING =====
        # SNS Topic for alerts
        self.sns_topic = SnsTopic(
            self,
            "alerts_topic",
            name=f"payment-v1-alerts-{environment_suffix}",
            display_name="Payment System Alerts",
            tags={
                "Name": f"payment-v1-alerts-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        # SNS subscription (email)
        SnsTopicSubscription(
            self,
            "alerts_subscription",
            topic_arn=self.sns_topic.arn,
            protocol="email",
            endpoint="ops-team@example.com",
            provider=self.primary_provider
        )

        # Secondary SNS Topic for secondary region alerts
        self.sns_topic_secondary = SnsTopic(
            self,
            "alerts_topic_secondary",
            name=f"payment-v1-alerts-secondary-{environment_suffix}",
            display_name="Payment System Alerts - Secondary Region",
            tags={
                "Name": f"payment-v1-alerts-secondary-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        # Secondary SNS subscription (email)
        SnsTopicSubscription(
            self,
            "alerts_subscription_secondary",
            topic_arn=self.sns_topic_secondary.arn,
            protocol="email",
            endpoint="ops-team@example.com",
            provider=self.secondary_provider
        )

        # Primary Aurora CPU alarm
        CloudwatchMetricAlarm(
            self,
            "primary_db_cpu_alarm",
            alarm_name=f"payment-v1-primary-db-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when primary database CPU exceeds 80%",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": self.primary_cluster.id
            },
            tags={
                "Name": f"payment-v1-primary-db-cpu-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        # Secondary Aurora CPU alarm
        CloudwatchMetricAlarm(
            self,
            "secondary_db_cpu_alarm",
            alarm_name=f"payment-v1-secondary-db-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when secondary database CPU exceeds 80%",
            alarm_actions=[self.sns_topic_secondary.arn],
            dimensions={
                "DBClusterIdentifier": self.secondary_cluster.id
            },
            tags={
                "Name": f"payment-v1-secondary-db-cpu-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        # Primary Lambda errors alarm
        CloudwatchMetricAlarm(
            self,
            "primary_lambda_errors",
            alarm_name=f"payment-v1-primary-lambda-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when primary Lambda errors exceed threshold",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "FunctionName": self.primary_payment_lambda.function_name
            },
            tags={
                "Name": f"payment-v1-primary-lambda-errors-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        # Secondary Lambda errors alarm
        CloudwatchMetricAlarm(
            self,
            "secondary_lambda_errors",
            alarm_name=f"payment-v1-secondary-lambda-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when secondary Lambda errors exceed threshold",
            alarm_actions=[self.sns_topic_secondary.arn],
            dimensions={
                "FunctionName": self.secondary_payment_lambda.function_name
            },
            tags={
                "Name": f"payment-v1-secondary-lambda-errors-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        # DynamoDB read throttle alarm
        CloudwatchMetricAlarm(
            self,
            "dynamodb_read_throttle",
            alarm_name=f"payment-v1-dynamodb-read-throttle-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ReadThrottleEvents",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when DynamoDB read throttling occurs",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "TableName": self.dynamodb_table.name
            },
            tags={
                "Name": f"payment-v1-dynamodb-read-throttle-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.primary_provider
        )

        # Replication lag alarm for Aurora Global Database
        CloudwatchMetricAlarm(
            self,
            "aurora_replication_lag",
            alarm_name=f"payment-v1-aurora-replication-lag-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Maximum",
            threshold=5000,
            alarm_description="Alert when Aurora replication lag exceeds 5 seconds",
            alarm_actions=[self.sns_topic_secondary.arn],
            dimensions={
                "DBClusterIdentifier": self.secondary_cluster.id
            },
            tags={
                "Name": f"payment-v1-aurora-replication-lag-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=self.secondary_provider
        )

        # ===== OUTPUTS =====
        TerraformOutput(
            self,
            "primary_vpc_id",
            value=self.primary_vpc.id
        )

        TerraformOutput(
            self,
            "secondary_vpc_id",
            value=self.secondary_vpc.id
        )

        TerraformOutput(
            self,
            "global_database_id",
            value=self.global_cluster.id
        )

        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=self.dynamodb_table.name
        )

        TerraformOutput(
            self,
            "dns_failover_domain",
            value=f"api.payment-dr-{environment_suffix}.internal.test"
        )

        TerraformOutput(
            self,
            "sns_topic_arn",
            value=self.sns_topic.arn
        )

        TerraformOutput(
            self,
            "environment_suffix",
            value=environment_suffix
        )
