"""Multi-region disaster recovery TAP Stack for payment processing system."""

import json
import os

from cdktf import Fn, S3Backend, TerraformOutput, TerraformStack
from cdktf_cdktf_provider_aws.backup_plan import (BackupPlan, BackupPlanRule,
                                                  BackupPlanRuleLifecycle)
from cdktf_cdktf_provider_aws.backup_selection import (
    BackupSelection, BackupSelectionSelectionTag)
from cdktf_cdktf_provider_aws.backup_vault import BackupVault
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import \
    CloudwatchEventTarget
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import \
    CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.route53_record import Route53Record
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import \
    RouteTableAssociation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_replication_configuration import (
    S3BucketReplicationConfigurationA, S3BucketReplicationConfigurationRule,
    S3BucketReplicationConfigurationRuleDestination,
    S3BucketReplicationConfigurationRuleFilter)
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.security_group import (SecurityGroup,
                                                     SecurityGroupEgress,
                                                     SecurityGroupIngress)
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import \
    SnsTopicSubscription
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.vpc_peering_connection import \
    VpcPeeringConnection
from cdktf_cdktf_provider_aws.vpc_peering_connection_accepter import \
    VpcPeeringConnectionAccepterA
from constructs import Construct


class TapStack(TerraformStack):
    """Multi-region disaster recovery CDKTF stack for payment processing."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the multi-region disaster recovery stack."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        primary_region = kwargs.get('primary_region', 'us-east-1')
        secondary_region = kwargs.get('secondary_region', 'us-west-2')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Add required tags from PROMPT
        required_tags = {
            "tags": {
                **default_tags.get("tags", {}),
                "Environment": "DR",
                "CostCenter": "Finance",
                "EnvironmentSuffix": environment_suffix,
            }
        }

        # Configure PRIMARY AWS Provider
        primary_provider = AwsProvider(
            self,
            "aws_primary",
            alias="primary",
            region=primary_region,
            default_tags=[required_tags],
        )

        # Configure SECONDARY AWS Provider
        secondary_provider = AwsProvider(
            self,
            "aws_secondary",
            alias="secondary",
            region=secondary_region,
            default_tags=[required_tags],
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

        # ========================================
        # PRIMARY REGION INFRASTRUCTURE (us-east-1)
        # ========================================

        # VPC for Primary Region
        primary_vpc = Vpc(
            self,
            "primary_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"dr-primary-vpc-{environment_suffix}",
                "Region": primary_region,
            },
            provider=primary_provider,
        )

        # Internet Gateway for Primary VPC
        primary_igw = InternetGateway(
            self,
            "primary_igw",
            vpc_id=primary_vpc.id,
            tags={
                "Name": f"dr-primary-igw-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # Private Subnets for Primary Region (for databases and Lambda)
        primary_private_subnet_1 = Subnet(
            self,
            "primary_private_subnet_1",
            vpc_id=primary_vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{primary_region}a",
            tags={
                "Name": f"dr-primary-private-subnet-1-{environment_suffix}",
            },
            provider=primary_provider,
        )

        primary_private_subnet_2 = Subnet(
            self,
            "primary_private_subnet_2",
            vpc_id=primary_vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{primary_region}b",
            tags={
                "Name": f"dr-primary-private-subnet-2-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # Public Subnets for Primary Region (for NAT, ALB if needed)
        primary_public_subnet_1 = Subnet(
            self,
            "primary_public_subnet_1",
            vpc_id=primary_vpc.id,
            cidr_block="10.0.10.0/24",
            availability_zone=f"{primary_region}a",
            map_public_ip_on_launch=True,
            tags={
                "Name": f"dr-primary-public-subnet-1-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # Route Table for Public Subnets in Primary
        primary_public_rt = RouteTable(
            self,
            "primary_public_rt",
            vpc_id=primary_vpc.id,
            tags={
                "Name": f"dr-primary-public-rt-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # Add internet gateway route to primary public route table
        Route(
            self,
            "primary_public_igw_route",
            route_table_id=primary_public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=primary_igw.id,
            provider=primary_provider,
        )

        RouteTableAssociation(
            self,
            "primary_public_rta_1",
            subnet_id=primary_public_subnet_1.id,
            route_table_id=primary_public_rt.id,
            provider=primary_provider,
        )

        # Security Group for Aurora in Primary
        primary_aurora_sg = SecurityGroup(
            self,
            "primary_aurora_sg",
            name=f"dr-primary-aurora-sg-{environment_suffix}",
            description="Security group for Aurora primary cluster",
            vpc_id=primary_vpc.id,
            ingress=[SecurityGroupIngress(
                from_port=3306,
                to_port=3306,
                protocol="tcp",
                cidr_blocks=["10.0.0.0/16", "10.1.0.0/16"],  # Allow from both VPCs
                description="MySQL access from VPCs",
            )],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound",
            )],
            tags={
                "Name": f"dr-primary-aurora-sg-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # Security Group for Lambda in Primary
        primary_lambda_sg = SecurityGroup(
            self,
            "primary_lambda_sg",
            name=f"dr-primary-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=primary_vpc.id,
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound",
            )],
            tags={
                "Name": f"dr-primary-lambda-sg-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # ========================================
        # SECONDARY REGION INFRASTRUCTURE (us-west-2)
        # ========================================

        # VPC for Secondary Region
        secondary_vpc = Vpc(
            self,
            "secondary_vpc",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"dr-secondary-vpc-{environment_suffix}",
                "Region": secondary_region,
            },
            provider=secondary_provider,
        )

        # Internet Gateway for Secondary VPC
        secondary_igw = InternetGateway(
            self,
            "secondary_igw",
            vpc_id=secondary_vpc.id,
            tags={
                "Name": f"dr-secondary-igw-{environment_suffix}",
            },
            provider=secondary_provider,
        )

        # Private Subnets for Secondary Region
        secondary_private_subnet_1 = Subnet(
            self,
            "secondary_private_subnet_1",
            vpc_id=secondary_vpc.id,
            cidr_block="10.1.1.0/24",
            availability_zone=f"{secondary_region}a",
            tags={
                "Name": f"dr-secondary-private-subnet-1-{environment_suffix}",
            },
            provider=secondary_provider,
        )

        secondary_private_subnet_2 = Subnet(
            self,
            "secondary_private_subnet_2",
            vpc_id=secondary_vpc.id,
            cidr_block="10.1.2.0/24",
            availability_zone=f"{secondary_region}b",
            tags={
                "Name": f"dr-secondary-private-subnet-2-{environment_suffix}",
            },
            provider=secondary_provider,
        )

        # Public Subnets for Secondary Region
        secondary_public_subnet_1 = Subnet(
            self,
            "secondary_public_subnet_1",
            vpc_id=secondary_vpc.id,
            cidr_block="10.1.10.0/24",
            availability_zone=f"{secondary_region}a",
            map_public_ip_on_launch=True,
            tags={
                "Name": f"dr-secondary-public-subnet-1-{environment_suffix}",
            },
            provider=secondary_provider,
        )

        # Route Table for Public Subnets in Secondary
        secondary_public_rt = RouteTable(
            self,
            "secondary_public_rt",
            vpc_id=secondary_vpc.id,
            tags={
                "Name": f"dr-secondary-public-rt-{environment_suffix}",
            },
            provider=secondary_provider,
        )

        # Add internet gateway route to secondary public route table
        Route(
            self,
            "secondary_public_igw_route",
            route_table_id=secondary_public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=secondary_igw.id,
            provider=secondary_provider,
        )

        RouteTableAssociation(
            self,
            "secondary_public_rta_1",
            subnet_id=secondary_public_subnet_1.id,
            route_table_id=secondary_public_rt.id,
            provider=secondary_provider,
        )

        # Security Group for Aurora in Secondary
        secondary_aurora_sg = SecurityGroup(
            self,
            "secondary_aurora_sg",
            name=f"dr-secondary-aurora-sg-{environment_suffix}",
            description="Security group for Aurora secondary cluster",
            vpc_id=secondary_vpc.id,
            ingress=[SecurityGroupIngress(
                from_port=3306,
                to_port=3306,
                protocol="tcp",
                cidr_blocks=["10.0.0.0/16", "10.1.0.0/16"],
                description="MySQL access from VPCs",
            )],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound",
            )],
            tags={
                "Name": f"dr-secondary-aurora-sg-{environment_suffix}",
            },
            provider=secondary_provider,
        )

        # Security Group for Lambda in Secondary
        secondary_lambda_sg = SecurityGroup(
            self,
            "secondary_lambda_sg",
            name=f"dr-secondary-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=secondary_vpc.id,
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound",
            )],
            tags={
                "Name": f"dr-secondary-lambda-sg-{environment_suffix}",
            },
            provider=secondary_provider,
        )

        # ========================================
        # VPC PEERING BETWEEN REGIONS
        # ========================================

        # Create VPC Peering Connection from Primary to Secondary
        vpc_peering = VpcPeeringConnection(
            self,
            "vpc_peering",
            vpc_id=primary_vpc.id,
            peer_vpc_id=secondary_vpc.id,
            peer_region=secondary_region,
            auto_accept=False,
            tags={
                "Name": f"dr-vpc-peering-{environment_suffix}",
                "Side": "Requester",
            },
            provider=primary_provider,
        )

        # Accept the peering connection in Secondary region
        vpc_peering_accepter = VpcPeeringConnectionAccepterA(
            self,
            "vpc_peering_accepter",
            vpc_peering_connection_id=vpc_peering.id,
            auto_accept=True,
            tags={
                "Name": f"dr-vpc-peering-accepter-{environment_suffix}",
                "Side": "Accepter",
            },
            provider=secondary_provider,
        )

        # Add routes for peering in Primary VPC (to reach Secondary)
        Route(
            self,
            "primary_to_secondary_route",
            route_table_id=primary_public_rt.id,
            destination_cidr_block="10.1.0.0/16",
            vpc_peering_connection_id=vpc_peering.id,
            provider=primary_provider,
            depends_on=[vpc_peering_accepter],
        )

        # Add routes for peering in Secondary VPC (to reach Primary)
        Route(
            self,
            "secondary_to_primary_route",
            route_table_id=secondary_public_rt.id,
            destination_cidr_block="10.0.0.0/16",
            vpc_peering_connection_id=vpc_peering.id,
            provider=secondary_provider,
            depends_on=[vpc_peering_accepter],
        )

        # ========================================
        # AURORA GLOBAL DATABASE
        # ========================================

        # Global Cluster
        global_cluster = RdsGlobalCluster(
            self,
            "aurora_global_cluster",
            global_cluster_identifier=f"dr-payment-global-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="paymentdb",
            deletion_protection=False,  # Must be destroyable
            provider=primary_provider,
        )

        # DB Subnet Group for Primary
        primary_db_subnet_group = DbSubnetGroup(
            self,
            "primary_db_subnet_group",
            name=f"dr-primary-db-subnet-{environment_suffix}",
            subnet_ids=[
                primary_private_subnet_1.id,
                primary_private_subnet_2.id,
            ],
            tags={
                "Name": f"dr-primary-db-subnet-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # Primary Aurora Cluster
        primary_aurora_cluster = RdsCluster(
            self,
            "primary_aurora_cluster",
            cluster_identifier=f"dr-payment-primary-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="paymentdb",
            master_username="admin",
            master_password="ChangeMe123456!",  # Should use Secrets Manager in production
            db_subnet_group_name=primary_db_subnet_group.name,
            vpc_security_group_ids=[primary_aurora_sg.id],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,  # Must be destroyable
            deletion_protection=False,  # Must be destroyable
            global_cluster_identifier=global_cluster.id,
            provider=primary_provider,
            depends_on=[global_cluster],
            tags={
                "Name": f"dr-payment-primary-cluster-{environment_suffix}",
                "Backup": "daily",
            },
            lifecycle={
                "ignore_changes": ["global_cluster_identifier"]
            }
        )

        # Primary Aurora Instance
        primary_aurora_instance = RdsClusterInstance(
            self,
            "primary_aurora_instance",
            identifier=f"dr-payment-primary-inst-{environment_suffix}",
            cluster_identifier=primary_aurora_cluster.id,
            instance_class="db.r6g.large",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            publicly_accessible=False,
            provider=primary_provider,
            tags={
                "Name": f"dr-payment-primary-instance-{environment_suffix}",
            },
        )

        # DB Subnet Group for Secondary
        secondary_db_subnet_group = DbSubnetGroup(
            self,
            "secondary_db_subnet_group",
            name=f"dr-secondary-db-subnet-{environment_suffix}",
            subnet_ids=[
                secondary_private_subnet_1.id,
                secondary_private_subnet_2.id,
            ],
            tags={
                "Name": f"dr-secondary-db-subnet-{environment_suffix}",
            },
            provider=secondary_provider,
        )

        # Secondary Aurora Cluster
        secondary_aurora_cluster = RdsCluster(
            self,
            "secondary_aurora_cluster",
            cluster_identifier=f"dr-payment-secondary-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            db_subnet_group_name=secondary_db_subnet_group.name,
            vpc_security_group_ids=[secondary_aurora_sg.id],
            skip_final_snapshot=True,
            deletion_protection=False,
            global_cluster_identifier=global_cluster.id,
            provider=secondary_provider,
            depends_on=[primary_aurora_cluster],
            tags={
                "Name": f"dr-payment-secondary-cluster-{environment_suffix}",
            },
            lifecycle={
                "ignore_changes": ["global_cluster_identifier"]
            }
        )

        # Secondary Aurora Instance
        secondary_aurora_instance = RdsClusterInstance(
            self,
            "secondary_aurora_instance",
            identifier=f"dr-payment-secondary-inst-{environment_suffix}",
            cluster_identifier=secondary_aurora_cluster.id,
            instance_class="db.r6g.large",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            publicly_accessible=False,
            provider=secondary_provider,
            tags={
                "Name": f"dr-payment-secondary-instance-{environment_suffix}",
            },
        )

        # ========================================
        # DYNAMODB GLOBAL TABLE
        # ========================================

        # DynamoDB Table in Primary (Global Table)
        dynamodb_table = DynamodbTable(
            self,
            "payment_sessions_table",
            name=f"dr-payment-sessions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="sessionId",
            range_key="timestamp",
            attribute=[
                {"name": "sessionId", "type": "S"},
                {"name": "timestamp", "type": "N"},
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery={"enabled": True},
            replica=[{
                "regionName": secondary_region,
                "pointInTimeRecovery": True,
            }],
            tags={
                "Name": f"dr-payment-sessions-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # ========================================
        # S3 BUCKETS WITH CROSS-REGION REPLICATION
        # ========================================

        # IAM Role for S3 Replication
        s3_replication_role = IamRole(
            self,
            "s3_replication_role",
            name=f"dr-s3-replication-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"dr-s3-replication-role-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # Primary S3 Bucket
        primary_bucket = S3Bucket(
            self,
            "primary_payment_docs_bucket",
            bucket=f"dr-payment-docs-primary-{environment_suffix}",
            tags={
                "Name": f"dr-payment-docs-primary-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # Enable versioning on Primary bucket
        S3BucketVersioningA(
            self,
            "primary_bucket_versioning",
            bucket=primary_bucket.id,
            versioning_configuration={"status": "Enabled"},
            provider=primary_provider,
        )

        # Secondary S3 Bucket
        secondary_bucket = S3Bucket(
            self,
            "secondary_payment_docs_bucket",
            bucket=f"dr-payment-docs-secondary-{environment_suffix}",
            tags={
                "Name": f"dr-payment-docs-secondary-{environment_suffix}",
            },
            provider=secondary_provider,
        )

        # Enable versioning on Secondary bucket
        S3BucketVersioningA(
            self,
            "secondary_bucket_versioning",
            bucket=secondary_bucket.id,
            versioning_configuration={"status": "Enabled"},
            provider=secondary_provider,
        )

        # IAM Policy for S3 Replication
        s3_replication_policy = IamPolicy(
            self,
            "s3_replication_policy",
            name=f"dr-s3-replication-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetReplicationConfiguration",
                            "s3:ListBucket"
                        ],
                        "Resource": [primary_bucket.arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObjectVersionForReplication",
                            "s3:GetObjectVersionAcl",
                            "s3:GetObjectVersionTagging"
                        ],
                        "Resource": [f"{primary_bucket.arn}/*"]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ReplicateObject",
                            "s3:ReplicateDelete",
                            "s3:ReplicateTags"
                        ],
                        "Resource": [f"{secondary_bucket.arn}/*"]
                    }
                ]
            }),
            provider=primary_provider,
        )

        IamRolePolicyAttachment(
            self,
            "s3_replication_policy_attachment",
            role=s3_replication_role.name,
            policy_arn=s3_replication_policy.arn,
            provider=primary_provider,
        )

        # Configure S3 Replication
        S3BucketReplicationConfigurationA(
            self,
            "primary_bucket_replication",
            bucket=primary_bucket.id,
            role=s3_replication_role.arn,
            rule=[S3BucketReplicationConfigurationRule(
                id="ReplicateAll",
                status="Enabled",
                priority=1,
                delete_marker_replication={"status": "Enabled"},
                filter=S3BucketReplicationConfigurationRuleFilter(prefix=""),
                destination=S3BucketReplicationConfigurationRuleDestination(
                    bucket=secondary_bucket.arn,
                    storage_class="STANDARD",
                    replication_time={"status": "Enabled", "time": {"minutes": 15}},
                    metrics={"status": "Enabled", "event_threshold": {"minutes": 15}},
                ),
            )],
            provider=primary_provider,
            depends_on=[s3_replication_policy],
        )

        # ========================================
        # IAM ROLE FOR LAMBDA
        # ========================================

        lambda_role = IamRole(
            self,
            "lambda_execution_role",
            name=f"dr-lambda-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"dr-lambda-execution-role-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # Attach Lambda VPC execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_vpc_execution_policy",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=primary_provider,
        )

        # Attach Lambda basic execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_basic_execution_policy",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            provider=primary_provider,
        )

        # Lambda Policy for DynamoDB and RDS access
        lambda_custom_policy = IamPolicy(
            self,
            "lambda_custom_policy",
            name=f"dr-lambda-custom-policy-{environment_suffix}",
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
                        "Resource": [dynamodb_table.arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds-data:ExecuteStatement",
                            "rds-data:BatchExecuteStatement"
                        ],
                        "Resource": [
                            primary_aurora_cluster.arn,
                            secondary_aurora_cluster.arn
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": [
                            f"{primary_bucket.arn}/*",
                            f"{secondary_bucket.arn}/*"
                        ]
                    }
                ]
            }),
            provider=primary_provider,
        )

        IamRolePolicyAttachment(
            self,
            "lambda_custom_policy_attachment",
            role=lambda_role.name,
            policy_arn=lambda_custom_policy.arn,
            provider=primary_provider,
        )

        # ========================================
        # LAMBDA FUNCTIONS (both regions)
        # ========================================

        # Lambda function code (inline for simplicity)
        lambda_code = """
import json
import os

def handler(event, context):
    \"\"\"Process payment webhook events.\"\"\"
    print(f"Processing payment event in region: {os.environ.get('AWS_REGION')}")
    print(f"Event: {json.dumps(event)}")

    # Extract payment details
    payment_id = event.get('detail', {}).get('paymentId', 'unknown')
    amount = event.get('detail', {}).get('amount', 0)

    # Process payment logic here
    result = {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Payment processed successfully',
            'paymentId': payment_id,
            'amount': amount,
            'region': os.environ.get('AWS_REGION')
        })
    }

    return result
"""

        # Get absolute path to lambda zip file
        lambda_zip_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "lambda", "lambda_function.zip")
        )

        # Primary Lambda Function
        primary_lambda = LambdaFunction(
            self,
            "primary_payment_processor",
            function_name=f"dr-payment-processor-primary-{environment_suffix}",
            role=lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            memory_size=1024,
            timeout=60,
            filename=lambda_zip_path,  # Would be created by build process
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            vpc_config={
                "subnet_ids": [
                    primary_private_subnet_1.id,
                    primary_private_subnet_2.id,
                ],
                "security_group_ids": [primary_lambda_sg.id],
            },
            environment={
                "variables": {
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "REGION": primary_region,
                    "DYNAMODB_TABLE": dynamodb_table.name,
                    "AURORA_ENDPOINT": primary_aurora_cluster.endpoint,
                    "S3_BUCKET": primary_bucket.bucket,
                }
            },
            tags={
                "Name": f"dr-payment-processor-primary-{environment_suffix}",
            },
            provider=primary_provider,
            lifecycle={
                "ignore_changes": ["filename", "source_code_hash"]
            }
        )

        # Secondary Lambda Function (identical configuration)
        secondary_lambda = LambdaFunction(
            self,
            "secondary_payment_processor",
            function_name=f"dr-payment-processor-secondary-{environment_suffix}",
            role=lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            memory_size=1024,
            timeout=60,
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            vpc_config={
                "subnet_ids": [
                    secondary_private_subnet_1.id,
                    secondary_private_subnet_2.id,
                ],
                "security_group_ids": [secondary_lambda_sg.id],
            },
            environment={
                "variables": {
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "REGION": secondary_region,
                    "DYNAMODB_TABLE": dynamodb_table.name,
                    "AURORA_ENDPOINT": secondary_aurora_cluster.endpoint,
                    "S3_BUCKET": secondary_bucket.bucket,
                }
            },
            tags={
                "Name": f"dr-payment-processor-secondary-{environment_suffix}",
            },
            provider=secondary_provider,
            lifecycle={
                "ignore_changes": ["filename", "source_code_hash"]
            }
        )

        # ========================================
        # SNS TOPICS FOR ALERTS
        # ========================================

        primary_sns_topic = SnsTopic(
            self,
            "primary_alerts_topic",
            name=f"dr-operational-alerts-primary-{environment_suffix}",
            tags={
                "Name": f"dr-operational-alerts-primary-{environment_suffix}",
            },
            provider=primary_provider,
        )

        secondary_sns_topic = SnsTopic(
            self,
            "secondary_alerts_topic",
            name=f"dr-operational-alerts-secondary-{environment_suffix}",
            tags={
                "Name": f"dr-operational-alerts-secondary-{environment_suffix}",
            },
            provider=secondary_provider,
        )

        # ========================================
        # CLOUDWATCH ALARMS FOR AURORA LAG
        # ========================================

        primary_lag_alarm = CloudwatchMetricAlarm(
            self,
            "primary_aurora_lag_alarm",
            alarm_name=f"dr-aurora-lag-primary-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=60000,  # 60 seconds in milliseconds
            alarm_description="Aurora replication lag exceeds 60 seconds",
            alarm_actions=[primary_sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": primary_aurora_cluster.cluster_identifier,
            },
            tags={
                "Name": f"dr-aurora-lag-primary-{environment_suffix}",
            },
            provider=primary_provider,
        )

        secondary_lag_alarm = CloudwatchMetricAlarm(
            self,
            "secondary_aurora_lag_alarm",
            alarm_name=f"dr-aurora-lag-secondary-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=60000,
            alarm_description="Aurora replication lag exceeds 60 seconds",
            alarm_actions=[secondary_sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": secondary_aurora_cluster.cluster_identifier,
            },
            tags={
                "Name": f"dr-aurora-lag-secondary-{environment_suffix}",
            },
            provider=secondary_provider,
        )

        # ========================================
        # EVENTBRIDGE RULES FOR PAYMENT EVENTS
        # ========================================

        primary_event_rule = CloudwatchEventRule(
            self,
            "primary_payment_event_rule",
            name=f"dr-payment-event-rule-primary-{environment_suffix}",
            description="Trigger Lambda on payment events",
            event_pattern=json.dumps({
                "source": ["payment.service"],
                "detail-type": ["Payment Transaction"],
            }),
            tags={
                "Name": f"dr-payment-event-rule-primary-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # Lambda permission for EventBridge in Primary
        LambdaPermission(
            self,
            "primary_lambda_eventbridge_permission",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function_name=primary_lambda.function_name,
            principal="events.amazonaws.com",
            source_arn=primary_event_rule.arn,
            provider=primary_provider,
        )

        CloudwatchEventTarget(
            self,
            "primary_payment_event_target",
            rule=primary_event_rule.name,
            arn=primary_lambda.arn,
            provider=primary_provider,
        )

        secondary_event_rule = CloudwatchEventRule(
            self,
            "secondary_payment_event_rule",
            name=f"dr-payment-event-rule-secondary-{environment_suffix}",
            description="Trigger Lambda on payment events",
            event_pattern=json.dumps({
                "source": ["payment.service"],
                "detail-type": ["Payment Transaction"],
            }),
            tags={
                "Name": f"dr-payment-event-rule-secondary-{environment_suffix}",
            },
            provider=secondary_provider,
        )

        # Lambda permission for EventBridge in Secondary
        LambdaPermission(
            self,
            "secondary_lambda_eventbridge_permission",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function_name=secondary_lambda.function_name,
            principal="events.amazonaws.com",
            source_arn=secondary_event_rule.arn,
            provider=secondary_provider,
        )

        CloudwatchEventTarget(
            self,
            "secondary_payment_event_target",
            rule=secondary_event_rule.name,
            arn=secondary_lambda.arn,
            provider=secondary_provider,
        )

        # ========================================
        # AWS BACKUP PLAN
        # ========================================

        # Backup Vault
        backup_vault = BackupVault(
            self,
            "aurora_backup_vault",
            name=f"dr-aurora-backup-vault-{environment_suffix}",
            tags={
                "Name": f"dr-aurora-backup-vault-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # IAM Role for AWS Backup
        backup_role = IamRole(
            self,
            "backup_role",
            name=f"dr-backup-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "backup.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"dr-backup-role-{environment_suffix}",
            },
            provider=primary_provider,
        )

        IamRolePolicyAttachment(
            self,
            "backup_policy_attachment",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
            provider=primary_provider,
        )

        IamRolePolicyAttachment(
            self,
            "backup_restore_policy_attachment",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores",
            provider=primary_provider,
        )

        # Backup Plan
        backup_plan = BackupPlan(
            self,
            "aurora_backup_plan",
            name=f"dr-aurora-backup-plan-{environment_suffix}",
            rule=[BackupPlanRule(
                rule_name="DailyBackup",
                target_vault_name=backup_vault.name,
                schedule="cron(0 3 * * ? *)",  # Daily at 3 AM UTC
                lifecycle=BackupPlanRuleLifecycle(
                    delete_after=7,
                ),
                recovery_point_tags={
                    "Environment": "DR",
                    "CostCenter": "Finance",
                },
            )],
            tags={
                "Name": f"dr-aurora-backup-plan-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # Backup Selection
        BackupSelection(
            self,
            "aurora_backup_selection",
            name=f"dr-aurora-backup-selection-{environment_suffix}",
            plan_id=backup_plan.id,
            iam_role_arn=backup_role.arn,
            selection_tag=[BackupSelectionSelectionTag(
                type="STRINGEQUALS",
                key="Backup",
                value="daily",
            )],
            provider=primary_provider,
        )

        # ========================================
        # ROUTE 53 HEALTH CHECKS AND FAILOVER
        # ========================================

        # Create a hosted zone (using a test domain)
        hosted_zone = Route53Zone(
            self,
            "payment_hosted_zone",
            name=f"payment-{environment_suffix}-dr-test.com",
            comment="Hosted zone for DR payment system",
            tags={
                "Name": f"payment-{environment_suffix}-dr-test.com",
            },
            provider=primary_provider,
        )

        # Health Check for Primary Region
        primary_health_check = Route53HealthCheck(
            self,
            "primary_health_check",
            type="HTTPS_STR_MATCH",
            resource_path="/health",
            fqdn=primary_aurora_cluster.endpoint,
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            search_string="OK",
            tags={
                "Name": f"dr-primary-health-check-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # Health Check for Secondary Region
        secondary_health_check = Route53HealthCheck(
            self,
            "secondary_health_check",
            type="HTTPS_STR_MATCH",
            resource_path="/health",
            fqdn=secondary_aurora_cluster.endpoint,
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            search_string="OK",
            tags={
                "Name": f"dr-secondary-health-check-{environment_suffix}",
            },
            provider=primary_provider,
        )

        # Primary Record with Failover Routing
        Route53Record(
            self,
            "primary_failover_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.payment-{environment_suffix}-dr-test.com",
            type="CNAME",
            ttl=60,
            records=[primary_aurora_cluster.endpoint],
            set_identifier="primary",
            failover_routing_policy={"type": "PRIMARY"},
            health_check_id=primary_health_check.id,
            provider=primary_provider,
        )

        # Secondary Record with Failover Routing
        Route53Record(
            self,
            "secondary_failover_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.payment-{environment_suffix}-dr-test.com",
            type="CNAME",
            ttl=60,
            records=[secondary_aurora_cluster.endpoint],
            set_identifier="secondary",
            failover_routing_policy={"type": "SECONDARY"},
            health_check_id=secondary_health_check.id,
            provider=primary_provider,
        )

        # ========================================
        # OUTPUTS
        # ========================================

        TerraformOutput(
            self,
            "primary_vpc_id",
            value=primary_vpc.id,
            description="Primary VPC ID",
        )

        TerraformOutput(
            self,
            "secondary_vpc_id",
            value=secondary_vpc.id,
            description="Secondary VPC ID",
        )

        TerraformOutput(
            self,
            "vpc_peering_connection_id",
            value=vpc_peering.id,
            description="VPC Peering Connection ID",
        )

        TerraformOutput(
            self,
            "global_cluster_id",
            value=global_cluster.id,
            description="Aurora Global Cluster ID",
        )

        TerraformOutput(
            self,
            "primary_cluster_endpoint",
            value=primary_aurora_cluster.endpoint,
            description="Primary Aurora Cluster Endpoint",
        )

        TerraformOutput(
            self,
            "secondary_cluster_endpoint",
            value=secondary_aurora_cluster.endpoint,
            description="Secondary Aurora Cluster Endpoint",
        )

        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=dynamodb_table.name,
            description="DynamoDB Global Table Name",
        )

        TerraformOutput(
            self,
            "primary_bucket_name",
            value=primary_bucket.bucket,
            description="Primary S3 Bucket Name",
        )

        TerraformOutput(
            self,
            "secondary_bucket_name",
            value=secondary_bucket.bucket,
            description="Secondary S3 Bucket Name",
        )

        TerraformOutput(
            self,
            "primary_lambda_arn",
            value=primary_lambda.arn,
            description="Primary Lambda Function ARN",
        )

        TerraformOutput(
            self,
            "secondary_lambda_arn",
            value=secondary_lambda.arn,
            description="Secondary Lambda Function ARN",
        )

        TerraformOutput(
            self,
            "primary_sns_topic_arn",
            value=primary_sns_topic.arn,
            description="Primary SNS Topic ARN",
        )

        TerraformOutput(
            self,
            "secondary_sns_topic_arn",
            value=secondary_sns_topic.arn,
            description="Secondary SNS Topic ARN",
        )

        TerraformOutput(
            self,
            "backup_vault_name",
            value=backup_vault.name,
            description="Backup Vault Name",
        )

        TerraformOutput(
            self,
            "route53_zone_id",
            value=hosted_zone.zone_id,
            description="Route 53 Hosted Zone ID",
        )

        TerraformOutput(
            self,
            "api_endpoint",
            value=f"api.payment-{environment_suffix}-dr-test.com",
            description="API Endpoint with Failover",
        )
