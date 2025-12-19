from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider, AwsProviderConfig
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableReplica, DynamodbTablePointInTimeRecovery
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record, Route53RecordFailoverRoutingPolicy
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.cloudwatch_event_bus import CloudwatchEventBus
from cdktf_cdktf_provider_aws.backup_vault import BackupVault
from cdktf_cdktf_provider_aws.backup_plan import BackupPlan, BackupPlanRule, BackupPlanRuleLifecycle, BackupPlanRuleCopyAction, BackupPlanRuleCopyActionLifecycle
from cdktf_cdktf_provider_aws.backup_selection import BackupSelection, BackupSelectionSelectionTag
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
import json
import os
import zipfile
import tempfile
import hashlib
import base64


class TapStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        stack_id: str,
        environment_suffix: str = None,
        state_bucket: str = None,
        state_bucket_region: str = None,
        aws_region: str = None,
        default_tags: dict = None
    ):
        super().__init__(scope, stack_id)

        # Get environment suffix from parameter or environment variable
        environment_suffix = environment_suffix or os.environ.get('ENVIRONMENT_SUFFIX', 'test')
        state_bucket = state_bucket or os.environ.get('TERRAFORM_STATE_BUCKET')
        state_bucket_region = state_bucket_region or os.environ.get('TERRAFORM_STATE_BUCKET_REGION', 'us-east-1')

        # Configure S3 backend for remote state (if state_bucket is provided)
        # Note: DynamoDB table for locking is not included to avoid ResourceNotFoundException
        # State locking can be added later if needed by setting TERRAFORM_STATE_LOCK_TABLE env var
        if state_bucket:
            S3Backend(
                self,
                bucket=state_bucket,
                key=f"tap/{environment_suffix}/terraform.tfstate",
                region=state_bucket_region,
                encrypt=True
            )
            print(f'✅ Configured S3 backend: s3://{state_bucket}/tap/{environment_suffix}/terraform.tfstate')

        # Define regions
        primary_region = "us-east-1"
        secondary_region = "us-west-2"

        # Primary provider
        primary_provider = AwsProvider(
            self,
            "aws_primary",
            region=primary_region,
            alias="primary"
        )

        # Secondary provider
        secondary_provider = AwsProvider(
            self,
            "aws_secondary",
            region=secondary_region,
            alias="secondary"
        )

        # Get account ID
        caller_identity = DataAwsCallerIdentity(
            self,
            "current",
            provider=primary_provider
        )

        # ==================== PRIMARY REGION RESOURCES ====================

        # VPC in primary region
        primary_vpc = Vpc(
            self,
            "primary_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-primary-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Internet Gateway for primary VPC
        primary_igw = InternetGateway(
            self,
            "primary_igw",
            vpc_id=primary_vpc.id,
            tags={
                "Name": f"payment-igw-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        # Public subnets in primary region (for NAT gateways)
        primary_public_subnet_1 = Subnet(
            self,
            "primary_public_subnet_1",
            vpc_id=primary_vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{primary_region}a",
            map_public_ip_on_launch=True,
            tags={
                "Name": f"payment-public-subnet-1-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        # Private subnets in primary region (3 AZs)
        primary_private_subnet_1 = Subnet(
            self,
            "primary_private_subnet_1",
            vpc_id=primary_vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{primary_region}a",
            tags={
                "Name": f"payment-private-subnet-1-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        primary_private_subnet_2 = Subnet(
            self,
            "primary_private_subnet_2",
            vpc_id=primary_vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=f"{primary_region}b",
            tags={
                "Name": f"payment-private-subnet-2-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        primary_private_subnet_3 = Subnet(
            self,
            "primary_private_subnet_3",
            vpc_id=primary_vpc.id,
            cidr_block="10.0.13.0/24",
            availability_zone=f"{primary_region}c",
            tags={
                "Name": f"payment-private-subnet-3-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        # Public route table for primary region
        primary_public_rt = RouteTable(
            self,
            "primary_public_rt",
            vpc_id=primary_vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=primary_igw.id
                )
            ],
            tags={
                "Name": f"payment-public-rt-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        RouteTableAssociation(
            self,
            "primary_public_rt_assoc",
            subnet_id=primary_public_subnet_1.id,
            route_table_id=primary_public_rt.id,
            provider=primary_provider
        )

        # EIP and NAT Gateway for primary region
        primary_nat_eip = Eip(
            self,
            "primary_nat_eip",
            domain="vpc",
            tags={
                "Name": f"payment-nat-eip-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        primary_nat = NatGateway(
            self,
            "primary_nat",
            allocation_id=primary_nat_eip.id,
            subnet_id=primary_public_subnet_1.id,
            tags={
                "Name": f"payment-nat-primary-{environment_suffix}"
            },
            provider=primary_provider,
            depends_on=[primary_igw]
        )

        # Private route table for primary region
        primary_private_rt = RouteTable(
            self,
            "primary_private_rt",
            vpc_id=primary_vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=primary_nat.id
                )
            ],
            tags={
                "Name": f"payment-private-rt-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        RouteTableAssociation(
            self,
            "primary_private_rt_assoc_1",
            subnet_id=primary_private_subnet_1.id,
            route_table_id=primary_private_rt.id,
            provider=primary_provider
        )

        RouteTableAssociation(
            self,
            "primary_private_rt_assoc_2",
            subnet_id=primary_private_subnet_2.id,
            route_table_id=primary_private_rt.id,
            provider=primary_provider
        )

        RouteTableAssociation(
            self,
            "primary_private_rt_assoc_3",
            subnet_id=primary_private_subnet_3.id,
            route_table_id=primary_private_rt.id,
            provider=primary_provider
        )

        # ==================== SECONDARY REGION RESOURCES ====================

        # VPC in secondary region
        secondary_vpc = Vpc(
            self,
            "secondary_vpc",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-secondary-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        # Internet Gateway for secondary VPC
        secondary_igw = InternetGateway(
            self,
            "secondary_igw",
            vpc_id=secondary_vpc.id,
            tags={
                "Name": f"payment-igw-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        # Public subnets in secondary region
        secondary_public_subnet_1 = Subnet(
            self,
            "secondary_public_subnet_1",
            vpc_id=secondary_vpc.id,
            cidr_block="10.1.1.0/24",
            availability_zone=f"{secondary_region}a",
            map_public_ip_on_launch=True,
            tags={
                "Name": f"payment-public-subnet-1-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        # Private subnets in secondary region (3 AZs)
        secondary_private_subnet_1 = Subnet(
            self,
            "secondary_private_subnet_1",
            vpc_id=secondary_vpc.id,
            cidr_block="10.1.11.0/24",
            availability_zone=f"{secondary_region}a",
            tags={
                "Name": f"payment-private-subnet-1-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        secondary_private_subnet_2 = Subnet(
            self,
            "secondary_private_subnet_2",
            vpc_id=secondary_vpc.id,
            cidr_block="10.1.12.0/24",
            availability_zone=f"{secondary_region}b",
            tags={
                "Name": f"payment-private-subnet-2-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        secondary_private_subnet_3 = Subnet(
            self,
            "secondary_private_subnet_3",
            vpc_id=secondary_vpc.id,
            cidr_block="10.1.13.0/24",
            availability_zone=f"{secondary_region}c",
            tags={
                "Name": f"payment-private-subnet-3-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        # Public route table for secondary region
        secondary_public_rt = RouteTable(
            self,
            "secondary_public_rt",
            vpc_id=secondary_vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=secondary_igw.id
                )
            ],
            tags={
                "Name": f"payment-public-rt-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        RouteTableAssociation(
            self,
            "secondary_public_rt_assoc",
            subnet_id=secondary_public_subnet_1.id,
            route_table_id=secondary_public_rt.id,
            provider=secondary_provider
        )

        # EIP and NAT Gateway for secondary region
        secondary_nat_eip = Eip(
            self,
            "secondary_nat_eip",
            domain="vpc",
            tags={
                "Name": f"payment-nat-eip-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        secondary_nat = NatGateway(
            self,
            "secondary_nat",
            allocation_id=secondary_nat_eip.id,
            subnet_id=secondary_public_subnet_1.id,
            tags={
                "Name": f"payment-nat-secondary-{environment_suffix}"
            },
            provider=secondary_provider,
            depends_on=[secondary_igw]
        )

        # Private route table for secondary region
        secondary_private_rt = RouteTable(
            self,
            "secondary_private_rt",
            vpc_id=secondary_vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=secondary_nat.id
                )
            ],
            tags={
                "Name": f"payment-private-rt-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        RouteTableAssociation(
            self,
            "secondary_private_rt_assoc_1",
            subnet_id=secondary_private_subnet_1.id,
            route_table_id=secondary_private_rt.id,
            provider=secondary_provider
        )

        RouteTableAssociation(
            self,
            "secondary_private_rt_assoc_2",
            subnet_id=secondary_private_subnet_2.id,
            route_table_id=secondary_private_rt.id,
            provider=secondary_provider
        )

        RouteTableAssociation(
            self,
            "secondary_private_rt_assoc_3",
            subnet_id=secondary_private_subnet_3.id,
            route_table_id=secondary_private_rt.id,
            provider=secondary_provider
        )

        # ==================== KMS KEYS FOR ENCRYPTION ====================

        # KMS key for primary region (Aurora encryption)
        primary_kms_key = KmsKey(
            self,
            "primary_kms_key",
            description=f"KMS key for Aurora encryption in primary region - {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={
                "Name": f"payment-kms-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        KmsAlias(
            self,
            "primary_kms_alias",
            name=f"alias/payment-aurora-primary-{environment_suffix}",
            target_key_id=primary_kms_key.key_id,
            provider=primary_provider
        )

        # KMS key for secondary region (Aurora encryption)
        secondary_kms_key = KmsKey(
            self,
            "secondary_kms_key",
            description=f"KMS key for Aurora encryption in secondary region - {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={
                "Name": f"payment-kms-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        KmsAlias(
            self,
            "secondary_kms_alias",
            name=f"alias/payment-aurora-secondary-{environment_suffix}",
            target_key_id=secondary_kms_key.key_id,
            provider=secondary_provider
        )

        # ==================== AURORA GLOBAL DATABASE ====================

        # Security group for RDS in primary region
        primary_rds_sg = SecurityGroup(
            self,
            "primary_rds_sg",
            name=f"payment-rds-sg-primary-{environment_suffix}",
            description="Security group for Aurora cluster in primary region",
            vpc_id=primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"]
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
                "Name": f"payment-rds-sg-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        # Security group for RDS in secondary region
        secondary_rds_sg = SecurityGroup(
            self,
            "secondary_rds_sg",
            name=f"payment-rds-sg-secondary-{environment_suffix}",
            description="Security group for Aurora cluster in secondary region",
            vpc_id=secondary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    cidr_blocks=["10.1.0.0/16"]
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
                "Name": f"payment-rds-sg-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        # DB subnet group for primary region
        primary_db_subnet_group = DbSubnetGroup(
            self,
            "primary_db_subnet_group",
            name=f"payment-db-subnet-group-primary-{environment_suffix}",
            subnet_ids=[
                primary_private_subnet_1.id,
                primary_private_subnet_2.id,
                primary_private_subnet_3.id
            ],
            tags={
                "Name": f"payment-db-subnet-group-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        # DB subnet group for secondary region
        secondary_db_subnet_group = DbSubnetGroup(
            self,
            "secondary_db_subnet_group",
            name=f"payment-db-subnet-group-secondary-{environment_suffix}",
            subnet_ids=[
                secondary_private_subnet_1.id,
                secondary_private_subnet_2.id,
                secondary_private_subnet_3.id
            ],
            tags={
                "Name": f"payment-db-subnet-group-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        # Aurora Global Database
        # Use a valid Aurora MySQL engine version that supports global clusters
        # Aurora MySQL 8.0.mysql_aurora.3.04.0 and later support global clusters
        global_cluster = RdsGlobalCluster(
            self,
            "global_cluster",
            global_cluster_identifier=f"payment-global-cluster-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="payments",
            storage_encrypted=True,
            provider=primary_provider
        )

        # Primary Aurora cluster
        primary_cluster = RdsCluster(
            self,
            "primary_cluster",
            cluster_identifier=f"payment-cluster-primary-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="payments",
            master_username="admin",
            master_password="ChangeMe123456!",  # In production, use Secrets Manager
            db_subnet_group_name=primary_db_subnet_group.name,
            vpc_security_group_ids=[primary_rds_sg.id],
            global_cluster_identifier=global_cluster.id,
            skip_final_snapshot=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            # Note: backtrack_window is not supported for Aurora Global Databases
            # Use point-in-time recovery and cross-region backups for rollback capability
            storage_encrypted=True,
            kms_key_id=primary_kms_key.arn,
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            tags={
                "Name": f"payment-cluster-primary-{environment_suffix}",
                "Backup": "daily"
            },
            provider=primary_provider,
            depends_on=[global_cluster]
        )

        # Primary Aurora instance (writer)
        primary_instance = RdsClusterInstance(
            self,
            "primary_instance",
            identifier=f"payment-instance-primary-{environment_suffix}",
            cluster_identifier=primary_cluster.id,
            instance_class="db.r5.large",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            publicly_accessible=False,
            tags={
                "Name": f"payment-instance-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        # Secondary Aurora cluster (read replica)
        # Note: For encrypted cross-region replica, kms_key_id must be explicitly specified
        secondary_cluster = RdsCluster(
            self,
            "secondary_cluster",
            cluster_identifier=f"payment-cluster-secondary-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            db_subnet_group_name=secondary_db_subnet_group.name,
            vpc_security_group_ids=[secondary_rds_sg.id],
            global_cluster_identifier=global_cluster.id,
            skip_final_snapshot=True,
            storage_encrypted=True,
            kms_key_id=secondary_kms_key.arn,  # Required for encrypted cross-region replica
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            tags={
                "Name": f"payment-cluster-secondary-{environment_suffix}"
            },
            provider=secondary_provider,
            depends_on=[primary_instance]
        )
        
        # Add lifecycle block to ignore changes to global_cluster_identifier
        # This prevents Terraform from trying to modify global_cluster_identifier after initial creation
        # IMPORTANT: If the secondary cluster already exists as a standalone cluster (without global_cluster_identifier),
        # it must be manually deleted first before it can be added to the global cluster.
        # AWS does not allow adding existing standalone clusters to global clusters.
        # After deletion, Terraform will create a new cluster as part of the global cluster.
        secondary_cluster.add_override("lifecycle", {
            "ignore_changes": ["global_cluster_identifier"]
        })

        # Secondary Aurora instance (reader)
        secondary_instance = RdsClusterInstance(
            self,
            "secondary_instance",
            identifier=f"payment-instance-secondary-{environment_suffix}",
            cluster_identifier=secondary_cluster.id,
            instance_class="db.r5.large",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            publicly_accessible=False,
            tags={
                "Name": f"payment-instance-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        # ==================== DYNAMODB GLOBAL TABLE ====================

        # DynamoDB table with global replication
        session_table = DynamodbTable(
            self,
            "session_table",
            name=f"payment-sessions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="sessionId",
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            attribute=[
                DynamodbTableAttribute(name="sessionId", type="S")
            ],
            replica=[
                DynamodbTableReplica(region_name=secondary_region)
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            tags={
                "Name": f"payment-sessions-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # ==================== IAM ROLES ====================

        # Lambda execution role for primary region
        lambda_role_primary = IamRole(
            self,
            "lambda_role_primary",
            name=f"payment-lambda-role-primary-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-lambda-role-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_role_primary_basic",
            role=lambda_role_primary.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_role_primary_vpc",
            role=lambda_role_primary.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=primary_provider
        )

        # Lambda custom policy for primary region
        lambda_policy_primary = IamPolicy(
            self,
            "lambda_policy_primary",
            name=f"payment-lambda-policy-primary-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": session_table.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBClusters",
                            "rds:DescribeDBInstances"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters"
                        ],
                        "Resource": f"arn:aws:ssm:{primary_region}:{caller_identity.account_id}:parameter/payment/*"
                    }
                ]
            }),
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_role_primary_custom",
            role=lambda_role_primary.name,
            policy_arn=lambda_policy_primary.arn,
            provider=primary_provider
        )

        # Lambda execution role for secondary region
        lambda_role_secondary = IamRole(
            self,
            "lambda_role_secondary",
            name=f"payment-lambda-role-secondary-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-lambda-role-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_role_secondary_basic",
            role=lambda_role_secondary.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            provider=secondary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_role_secondary_vpc",
            role=lambda_role_secondary.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=secondary_provider
        )

        # Lambda custom policy for secondary region
        lambda_policy_secondary = IamPolicy(
            self,
            "lambda_policy_secondary",
            name=f"payment-lambda-policy-secondary-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": f"{session_table.arn}*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBClusters",
                            "rds:DescribeDBInstances"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters"
                        ],
                        "Resource": f"arn:aws:ssm:{secondary_region}:{caller_identity.account_id}:parameter/payment/*"
                    }
                ]
            }),
            provider=secondary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_role_secondary_custom",
            role=lambda_role_secondary.name,
            policy_arn=lambda_policy_secondary.arn,
            provider=secondary_provider
        )

        # DR automation role with cross-region assume role
        dr_automation_role = IamRole(
            self,
            "dr_automation_role",
            name=f"payment-dr-automation-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    },
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "events.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Name": f"payment-dr-automation-role-{environment_suffix}"
            },
            provider=primary_provider
        )

        dr_automation_policy = IamPolicy(
            self,
            "dr_automation_policy",
            name=f"payment-dr-automation-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:FailoverGlobalCluster",
                            "rds:DescribeGlobalClusters",
                            "rds:DescribeDBClusters"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "route53:ChangeResourceRecordSets",
                            "route53:GetHealthCheckStatus"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": "sts:AssumeRole",
                        "Resource": f"arn:aws:iam::{caller_identity.account_id}:role/*"
                    }
                ]
            }),
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "dr_automation_role_custom",
            role=dr_automation_role.name,
            policy_arn=dr_automation_policy.arn,
            provider=primary_provider
        )

        # ==================== LAMBDA FUNCTIONS ====================

        # Security group for Lambda in primary region
        primary_lambda_sg = SecurityGroup(
            self,
            "primary_lambda_sg",
            name=f"payment-lambda-sg-primary-{environment_suffix}",
            description="Security group for Lambda functions in primary region",
            vpc_id=primary_vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-lambda-sg-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        # Security group for Lambda in secondary region
        secondary_lambda_sg = SecurityGroup(
            self,
            "secondary_lambda_sg",
            name=f"payment-lambda-sg-secondary-{environment_suffix}",
            description="Security group for Lambda functions in secondary region",
            vpc_id=secondary_vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-lambda-sg-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        # Create Lambda deployment package using Python's zipfile
        # Read the existing Lambda code
        lambda_code_path = os.path.join(os.path.dirname(__file__), "lambda", "payment_processor.py")
        
        # Read Lambda code content
        if os.path.exists(lambda_code_path):
            with open(lambda_code_path, "r") as f:
                lambda_code_content = f.read()
        else:
            # Fallback code if file doesn't exist
            lambda_code_content = """
import json
import os
import boto3
from botocore.exceptions import ClientError

def handler(event, context):
    try:
        db_endpoint = os.environ.get('DB_ENDPOINT')
        dynamodb_table = os.environ.get('DYNAMODB_TABLE')
        region = os.environ.get('AWS_REGION')
        payment_id = event.get('payment_id', 'unknown')
        amount = event.get('amount', 0)
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'payment_id': payment_id,
                'amount': amount,
                'region': region,
                'db_endpoint': db_endpoint
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""
        
        # Create ZIP file for Lambda deployment
        lambda_zip_path = os.path.join(os.path.dirname(__file__), "lambda_function.zip")
        
        # Create the ZIP file
        with zipfile.ZipFile(lambda_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Write the Lambda code as index.py
            zipf.writestr("index.py", lambda_code_content)
        
        # Calculate SHA256 hash for source_code_hash
        with open(lambda_zip_path, 'rb') as f:
            zip_hash = hashlib.sha256(f.read()).digest()
            zip_hash_base64 = base64.b64encode(zip_hash).decode('utf-8')

        # Primary Lambda function
        primary_lambda = LambdaFunction(
            self,
            "primary_lambda",
            function_name=f"payment-processor-primary-{environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=lambda_role_primary.arn,
            memory_size=1024,
            timeout=60,
            environment={
                "variables": {
                    "DB_ENDPOINT": primary_cluster.endpoint,
                    "DYNAMODB_TABLE": session_table.name,
                    "ENVIRONMENT": environment_suffix
                }
            },
            vpc_config={
                "subnet_ids": [
                    primary_private_subnet_1.id,
                    primary_private_subnet_2.id,
                    primary_private_subnet_3.id
                ],
                "security_group_ids": [primary_lambda_sg.id]
            },
            filename=lambda_zip_path,
            source_code_hash=zip_hash_base64,
            tags={
                "Name": f"payment-processor-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        # Secondary Lambda function
        secondary_lambda = LambdaFunction(
            self,
            "secondary_lambda",
            function_name=f"payment-processor-secondary-{environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=lambda_role_secondary.arn,
            memory_size=1024,
            timeout=60,
            environment={
                "variables": {
                    "DB_ENDPOINT": secondary_cluster.endpoint,
                    "DYNAMODB_TABLE": session_table.name,
                    "ENVIRONMENT": environment_suffix
                }
            },
            vpc_config={
                "subnet_ids": [
                    secondary_private_subnet_1.id,
                    secondary_private_subnet_2.id,
                    secondary_private_subnet_3.id
                ],
                "security_group_ids": [secondary_lambda_sg.id]
            },
            filename=lambda_zip_path,
            source_code_hash=zip_hash_base64,
            tags={
                "Name": f"payment-processor-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        # ==================== SYSTEMS MANAGER PARAMETERS ====================

        # Store database endpoints in Parameter Store - Primary region
        SsmParameter(
            self,
            "ssm_primary_db_endpoint",
            name=f"/payment/{environment_suffix}/db/primary/endpoint",
            type="String",
            value=primary_cluster.endpoint,
            description="Primary Aurora cluster endpoint",
            tags={
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        SsmParameter(
            self,
            "ssm_primary_db_reader_endpoint",
            name=f"/payment/{environment_suffix}/db/primary/reader-endpoint",
            type="String",
            value=primary_cluster.reader_endpoint,
            description="Primary Aurora cluster reader endpoint",
            tags={
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Store database endpoints in Parameter Store - Secondary region
        SsmParameter(
            self,
            "ssm_secondary_db_endpoint",
            name=f"/payment/{environment_suffix}/db/secondary/endpoint",
            type="String",
            value=secondary_cluster.endpoint,
            description="Secondary Aurora cluster endpoint",
            tags={
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        SsmParameter(
            self,
            "ssm_secondary_db_reader_endpoint",
            name=f"/payment/{environment_suffix}/db/secondary/reader-endpoint",
            type="String",
            value=secondary_cluster.reader_endpoint,
            description="Secondary Aurora cluster reader endpoint",
            tags={
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        # Store API keys (placeholder for secure string)
        SsmParameter(
            self,
            "ssm_api_key_primary",
            name=f"/payment/{environment_suffix}/api/key",
            type="SecureString",
            value="placeholder-api-key-change-in-production",
            description="API key for payment processing",
            tags={
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        SsmParameter(
            self,
            "ssm_api_key_secondary",
            name=f"/payment/{environment_suffix}/api/key",
            type="SecureString",
            value="placeholder-api-key-change-in-production",
            description="API key for payment processing",
            tags={
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        # ==================== ROUTE 53 ====================

        # Route 53 hosted zone
        # Use a non-reserved domain name (example.com is reserved by AWS)
        # Use a domain that can be configured via environment variable or use a test domain
        route53_domain = os.environ.get('ROUTE53_DOMAIN', f"payment-{environment_suffix}.internal")
        hosted_zone = Route53Zone(
            self,
            "hosted_zone",
            name=route53_domain,
            comment="Hosted zone for payment processing DR",
            tags={
                "Name": route53_domain
            },
            provider=primary_provider
        )

        # Health check for primary region
        # Extract domain from route53_domain (e.g., "payment-pr7325.internal" -> "internal")
        domain_suffix = route53_domain.split('.', 1)[1] if '.' in route53_domain else 'internal'
        primary_health_check = Route53HealthCheck(
            self,
            "primary_health_check",
            type="HTTPS",
            resource_path="/health",
            fqdn=f"primary-{environment_suffix}.{domain_suffix}",
            port=443,
            request_interval=30,
            failure_threshold=3,
            tags={
                "Name": f"payment-primary-health-check-{environment_suffix}"
            },
            provider=primary_provider
        )

        # Health check for secondary region
        secondary_health_check = Route53HealthCheck(
            self,
            "secondary_health_check",
            type="HTTPS",
            resource_path="/health",
            fqdn=f"secondary-{environment_suffix}.{domain_suffix}",
            port=443,
            request_interval=30,
            failure_threshold=3,
            tags={
                "Name": f"payment-secondary-health-check-{environment_suffix}"
            },
            provider=primary_provider
        )

        # Route 53 record with failover routing - Primary
        Route53Record(
            self,
            "route53_primary",
            zone_id=hosted_zone.zone_id,
            name=f"api.{route53_domain}",
            type="A",
            set_identifier="primary",
            failover_routing_policy=Route53RecordFailoverRoutingPolicy(
                type="PRIMARY"
            ),
            health_check_id=primary_health_check.id,
            ttl=60,
            records=[primary_nat_eip.public_ip],
            provider=primary_provider
        )

        # Route 53 record with failover routing - Secondary
        Route53Record(
            self,
            "route53_secondary",
            zone_id=hosted_zone.zone_id,
            name=f"api.{route53_domain}",
            type="A",
            set_identifier="secondary",
            failover_routing_policy=Route53RecordFailoverRoutingPolicy(
                type="SECONDARY"
            ),
            health_check_id=secondary_health_check.id,
            ttl=60,
            records=[secondary_nat_eip.public_ip],
            provider=primary_provider
        )

        # ==================== EVENTBRIDGE ====================

        # EventBridge rule in primary region
        primary_event_rule = CloudwatchEventRule(
            self,
            "primary_event_rule",
            name=f"payment-events-primary-{environment_suffix}",
            description="Capture payment processing events in primary region",
            event_pattern=json.dumps({
                "source": ["custom.payment"],
                "detail-type": ["Payment Processed", "Payment Failed"]
            }),
            tags={
                "Name": f"payment-events-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        # EventBridge rule in secondary region
        secondary_event_rule = CloudwatchEventRule(
            self,
            "secondary_event_rule",
            name=f"payment-events-secondary-{environment_suffix}",
            description="Capture payment processing events in secondary region",
            event_pattern=json.dumps({
                "source": ["custom.payment"],
                "detail-type": ["Payment Processed", "Payment Failed"]
            }),
            tags={
                "Name": f"payment-events-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        # EventBridge custom event bus for cross-region replication - Primary
        primary_event_bus = CloudwatchEventBus(
            self,
            "primary_event_bus",
            name=f"payment-event-bus-primary-{environment_suffix}",
            tags={
                "Name": f"payment-event-bus-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        # EventBridge custom event bus for cross-region replication - Secondary
        secondary_event_bus = CloudwatchEventBus(
            self,
            "secondary_event_bus",
            name=f"payment-event-bus-secondary-{environment_suffix}",
            tags={
                "Name": f"payment-event-bus-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        # ==================== AWS BACKUP ====================

        # Backup vault in primary region
        primary_backup_vault = BackupVault(
            self,
            "primary_backup_vault",
            name=f"payment-backup-vault-primary-{environment_suffix}",
            tags={
                "Name": f"payment-backup-vault-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        # Backup vault in secondary region
        secondary_backup_vault = BackupVault(
            self,
            "secondary_backup_vault",
            name=f"payment-backup-vault-secondary-{environment_suffix}",
            tags={
                "Name": f"payment-backup-vault-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        # Backup IAM role
        backup_role = IamRole(
            self,
            "backup_role",
            name=f"payment-backup-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "backup.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-backup-role-{environment_suffix}"
            },
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "backup_role_policy",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "backup_role_restore_policy",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores",
            provider=primary_provider
        )

        # Backup plan with cross-region copy
        backup_plan = BackupPlan(
            self,
            "backup_plan",
            name=f"payment-backup-plan-{environment_suffix}",
            rule=[
                BackupPlanRule(
                    rule_name="daily-backup",
                    target_vault_name=primary_backup_vault.name,
                    schedule="cron(0 3 * * ? *)",  # Daily at 3 AM UTC
                    start_window=60,
                    completion_window=120,
                    lifecycle=BackupPlanRuleLifecycle(
                        delete_after=7
                    ),
                    copy_action=[
                        BackupPlanRuleCopyAction(
                            destination_vault_arn=secondary_backup_vault.arn,
                            lifecycle=BackupPlanRuleCopyActionLifecycle(
                                delete_after=7
                            )
                        )
                    ]
                )
            ],
            tags={
                "Name": f"payment-backup-plan-{environment_suffix}"
            },
            provider=primary_provider
        )

        # Backup selection
        BackupSelection(
            self,
            "backup_selection",
            name=f"payment-backup-selection-{environment_suffix}",
            plan_id=backup_plan.id,
            iam_role_arn=backup_role.arn,
            selection_tag=[
                BackupSelectionSelectionTag(
                    type="STRINGEQUALS",
                    key="Backup",
                    value="daily"
                )
            ],
            provider=primary_provider
        )

        # ==================== CLOUDWATCH ALARMS ====================

        # CloudWatch alarm for replication lag in primary region
        CloudwatchMetricAlarm(
            self,
            "primary_replication_lag_alarm",
            alarm_name=f"payment-replication-lag-primary-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=60000,  # 60 seconds in milliseconds
            alarm_description="Alert when Aurora replication lag exceeds 60 seconds",
            dimensions={
                "DBClusterIdentifier": primary_cluster.cluster_identifier
            },
            tags={
                "Name": f"payment-replication-lag-primary-{environment_suffix}"
            },
            provider=primary_provider
        )

        # CloudWatch alarm for replication lag in secondary region
        CloudwatchMetricAlarm(
            self,
            "secondary_replication_lag_alarm",
            alarm_name=f"payment-replication-lag-secondary-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=60000,  # 60 seconds in milliseconds
            alarm_description="Alert when Aurora replication lag exceeds 60 seconds",
            dimensions={
                "DBClusterIdentifier": secondary_cluster.cluster_identifier
            },
            tags={
                "Name": f"payment-replication-lag-secondary-{environment_suffix}"
            },
            provider=secondary_provider
        )

        # ==================== CLOUDWATCH DASHBOARDS ====================

        # Primary region dashboard
        primary_dashboard_body = json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
                            [".", "DatabaseConnections", {"stat": "Sum"}],
                            [".", "AuroraGlobalDBReplicationLag", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": primary_region,
                        "title": "RDS Metrics - Primary"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                            [".", "Errors", {"stat": "Sum"}],
                            [".", "Duration", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": primary_region,
                        "title": "Lambda Metrics - Primary"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                            [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": primary_region,
                        "title": "DynamoDB Metrics - Primary"
                    }
                }
            ]
        })

        CloudwatchDashboard(
            self,
            "primary_dashboard",
            dashboard_name=f"payment-dashboard-primary-{environment_suffix}",
            dashboard_body=primary_dashboard_body,
            provider=primary_provider
        )

        # Secondary region dashboard
        secondary_dashboard_body = json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
                            [".", "DatabaseConnections", {"stat": "Sum"}],
                            [".", "AuroraGlobalDBReplicationLag", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": secondary_region,
                        "title": "RDS Metrics - Secondary"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                            [".", "Errors", {"stat": "Sum"}],
                            [".", "Duration", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": secondary_region,
                        "title": "Lambda Metrics - Secondary"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                            [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": secondary_region,
                        "title": "DynamoDB Metrics - Secondary"
                    }
                }
            ]
        })

        CloudwatchDashboard(
            self,
            "secondary_dashboard",
            dashboard_name=f"payment-dashboard-secondary-{environment_suffix}",
            dashboard_body=secondary_dashboard_body,
            provider=secondary_provider
        )

        # ==================== OUTPUTS ====================

        TerraformOutput(
            self,
            "primary_vpc_id",
            value=primary_vpc.id,
            description="Primary VPC ID"
        )

        TerraformOutput(
            self,
            "secondary_vpc_id",
            value=secondary_vpc.id,
            description="Secondary VPC ID"
        )

        TerraformOutput(
            self,
            "global_cluster_id",
            value=global_cluster.id,
            description="Aurora Global Database Cluster ID"
        )

        TerraformOutput(
            self,
            "primary_cluster_endpoint",
            value=primary_cluster.endpoint,
            description="Primary Aurora cluster writer endpoint"
        )

        TerraformOutput(
            self,
            "secondary_cluster_endpoint",
            value=secondary_cluster.endpoint,
            description="Secondary Aurora cluster reader endpoint"
        )

        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=session_table.name,
            description="DynamoDB global table name"
        )

        TerraformOutput(
            self,
            "primary_lambda_arn",
            value=primary_lambda.arn,
            description="Primary Lambda function ARN"
        )

        TerraformOutput(
            self,
            "secondary_lambda_arn",
            value=secondary_lambda.arn,
            description="Secondary Lambda function ARN"
        )

        TerraformOutput(
            self,
            "route53_zone_id",
            value=hosted_zone.zone_id,
            description="Route 53 hosted zone ID"
        )

        TerraformOutput(
            self,
            "api_endpoint",
            value=f"api.{route53_domain}",
            description="API endpoint with failover routing"
        )

        TerraformOutput(
            self,
            "primary_backup_vault_name",
            value=primary_backup_vault.name,
            description="Primary backup vault name"
        )

        TerraformOutput(
            self,
            "secondary_backup_vault_name",
            value=secondary_backup_vault.name,
            description="Secondary backup vault name"
        )
