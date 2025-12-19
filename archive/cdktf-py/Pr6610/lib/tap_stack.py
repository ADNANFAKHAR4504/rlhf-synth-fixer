"""TAP Stack module for CDKTF Python infrastructure - Multi-Region Disaster Recovery."""

from cdktf import TerraformStack, S3Backend, Fn, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup, AutoscalingGroupTag
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record, Route53RecordWeightedRoutingPolicy
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_replication_configuration import (
    S3BucketReplicationConfigurationA,
    S3BucketReplicationConfigurationRule,
    S3BucketReplicationConfigurationRuleDestination,
    S3BucketReplicationConfigurationRuleDestinationReplicationTime,
    S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime,
    S3BucketReplicationConfigurationRuleDestinationMetrics,
    S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold,
    S3BucketReplicationConfigurationRuleFilter
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
import json
import base64
import tempfile
import zipfile
import hashlib


class TapStack(TerraformStack):
    """CDKTF Python stack for Multi-Region Disaster Recovery infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS multi-region DR infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Define regions
        primary_region = "us-east-1"
        secondary_region = "us-east-2"

        # Common tags
        common_tags = {
            "Environment": environment_suffix,
            "Cost-Center": "transaction-processing"
        }

        # Configure Primary AWS Provider
        primary_provider = AwsProvider(
            self,
            "aws_primary",
            region=primary_region,
            default_tags=[default_tags],
            alias="primary"
        )

        # Configure Secondary AWS Provider
        secondary_provider = AwsProvider(
            self,
            "aws_secondary",
            region=secondary_region,
            default_tags=[default_tags],
            alias="secondary"
        )

        # Get account ID
        account_id = DataAwsCallerIdentity(self, "current", provider=primary_provider)

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

        # ====== PRIMARY REGION INFRASTRUCTURE ======

        # Get availability zones for primary region
        primary_azs = DataAwsAvailabilityZones(
            self,
            "primary_azs",
            state="available",
            provider=primary_provider
        )

        # VPC for primary region
        primary_vpc = Vpc(
            self,
            "primary_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"vpc-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # Internet Gateway for primary VPC
        primary_igw = InternetGateway(
            self,
            "primary_igw",
            vpc_id=primary_vpc.id,
            tags={**common_tags, "Name": f"igw-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # Public subnets in primary region
        primary_public_subnet_1 = Subnet(
            self,
            "primary_public_subnet_1",
            vpc_id=primary_vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=Fn.element(primary_azs.names, 0),
            map_public_ip_on_launch=True,
            tags={**common_tags, "Name": f"subnet-public-1-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        primary_public_subnet_2 = Subnet(
            self,
            "primary_public_subnet_2",
            vpc_id=primary_vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=Fn.element(primary_azs.names, 1),
            map_public_ip_on_launch=True,
            tags={**common_tags, "Name": f"subnet-public-2-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # Private subnets for database in primary region
        primary_private_subnet_1 = Subnet(
            self,
            "primary_private_subnet_1",
            vpc_id=primary_vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=Fn.element(primary_azs.names, 0),
            tags={**common_tags, "Name": f"subnet-private-1-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        primary_private_subnet_2 = Subnet(
            self,
            "primary_private_subnet_2",
            vpc_id=primary_vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=Fn.element(primary_azs.names, 1),
            tags={**common_tags, "Name": f"subnet-private-2-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # Route table for public subnets in primary
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
            tags={**common_tags, "Name": f"rt-public-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        RouteTableAssociation(
            self,
            "primary_public_rt_assoc_1",
            subnet_id=primary_public_subnet_1.id,
            route_table_id=primary_public_rt.id,
            provider=primary_provider
        )

        RouteTableAssociation(
            self,
            "primary_public_rt_assoc_2",
            subnet_id=primary_public_subnet_2.id,
            route_table_id=primary_public_rt.id,
            provider=primary_provider
        )

        # ====== SECONDARY REGION INFRASTRUCTURE ======

        # Get availability zones for secondary region
        secondary_azs = DataAwsAvailabilityZones(
            self,
            "secondary_azs",
            state="available",
            provider=secondary_provider
        )

        # VPC for secondary region
        secondary_vpc = Vpc(
            self,
            "secondary_vpc",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"vpc-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # Internet Gateway for secondary VPC
        secondary_igw = InternetGateway(
            self,
            "secondary_igw",
            vpc_id=secondary_vpc.id,
            tags={**common_tags, "Name": f"igw-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # Public subnets in secondary region
        secondary_public_subnet_1 = Subnet(
            self,
            "secondary_public_subnet_1",
            vpc_id=secondary_vpc.id,
            cidr_block="10.1.1.0/24",
            availability_zone=Fn.element(secondary_azs.names, 0),
            map_public_ip_on_launch=True,
            tags={**common_tags, "Name": f"subnet-public-1-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        secondary_public_subnet_2 = Subnet(
            self,
            "secondary_public_subnet_2",
            vpc_id=secondary_vpc.id,
            cidr_block="10.1.2.0/24",
            availability_zone=Fn.element(secondary_azs.names, 1),
            map_public_ip_on_launch=True,
            tags={**common_tags, "Name": f"subnet-public-2-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # Private subnets for database in secondary region
        secondary_private_subnet_1 = Subnet(
            self,
            "secondary_private_subnet_1",
            vpc_id=secondary_vpc.id,
            cidr_block="10.1.11.0/24",
            availability_zone=Fn.element(secondary_azs.names, 0),
            tags={**common_tags, "Name": f"subnet-private-1-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        secondary_private_subnet_2 = Subnet(
            self,
            "secondary_private_subnet_2",
            vpc_id=secondary_vpc.id,
            cidr_block="10.1.12.0/24",
            availability_zone=Fn.element(secondary_azs.names, 1),
            tags={**common_tags, "Name": f"subnet-private-2-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # Route table for public subnets in secondary
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
            tags={**common_tags, "Name": f"rt-public-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        RouteTableAssociation(
            self,
            "secondary_public_rt_assoc_1",
            subnet_id=secondary_public_subnet_1.id,
            route_table_id=secondary_public_rt.id,
            provider=secondary_provider
        )

        RouteTableAssociation(
            self,
            "secondary_public_rt_assoc_2",
            subnet_id=secondary_public_subnet_2.id,
            route_table_id=secondary_public_rt.id,
            provider=secondary_provider
        )

        # ====== AURORA GLOBAL DATABASE ======

        # KMS keys for Aurora encryption in both regions
        primary_kms_key = KmsKey(
            self,
            "primary_kms_key",
            description=f"KMS key for Aurora primary cluster {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={**common_tags, "Name": f"kms-aurora-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        KmsAlias(
            self,
            "primary_kms_alias",
            name=f"alias/aurora-primary-{environment_suffix}",
            target_key_id=primary_kms_key.key_id,
            provider=primary_provider
        )

        secondary_kms_key = KmsKey(
            self,
            "secondary_kms_key",
            description=f"KMS key for Aurora secondary cluster {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={**common_tags, "Name": f"kms-aurora-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        KmsAlias(
            self,
            "secondary_kms_alias",
            name=f"alias/aurora-secondary-{environment_suffix}",
            target_key_id=secondary_kms_key.key_id,
            provider=secondary_provider
        )

        # Global cluster
        global_cluster = RdsGlobalCluster(
            self,
            "global_cluster",
            global_cluster_identifier=f"global-txn-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="transactions",
            storage_encrypted=True,
            provider=primary_provider
        )

        # Security group for primary Aurora cluster
        primary_db_sg = SecurityGroup(
            self,
            "primary_db_sg",
            name=f"db-primary-sg-{environment_suffix}",
            description="Security group for primary Aurora cluster",
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
            tags={**common_tags, "Name": f"db-primary-sg-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # DB subnet group for primary
        primary_db_subnet_group = DbSubnetGroup(
            self,
            "primary_db_subnet_group",
            name=f"dbsubnet-primary-{environment_suffix}",
            subnet_ids=[primary_private_subnet_1.id, primary_private_subnet_2.id],
            tags={**common_tags, "Name": f"dbsubnet-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # Primary Aurora cluster
        primary_cluster = RdsCluster(
            self,
            "primary_cluster",
            cluster_identifier=f"aurora-primary-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="transactions",
            master_username="admin",
            master_password="ChangeMe123!",
            db_subnet_group_name=primary_db_subnet_group.name,
            vpc_security_group_ids=[primary_db_sg.id],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            storage_encrypted=True,
            kms_key_id=primary_kms_key.arn,
            skip_final_snapshot=True,
            apply_immediately=True,
            deletion_protection=False,
            global_cluster_identifier=global_cluster.id,
            tags={**common_tags, "Name": f"aurora-primary-{environment_suffix}", "DR-Role": "primary"},
            lifecycle={
                "ignore_changes": ["master_password", "kms_key_id", "global_cluster_identifier"]
            },
            provider=primary_provider
        )

        # Primary cluster instances
        primary_cluster_instance = RdsClusterInstance(
            self,
            "primary_cluster_instance_1",
            identifier=f"aurora-primary-instance-1-{environment_suffix}",
            cluster_identifier=primary_cluster.id,
            instance_class="db.r6g.large",
            engine=primary_cluster.engine,
            engine_version=primary_cluster.engine_version,
            publicly_accessible=False,
            tags={**common_tags, "Name": f"aurora-primary-instance-1-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # Security group for secondary Aurora cluster
        secondary_db_sg = SecurityGroup(
            self,
            "secondary_db_sg",
            name=f"db-secondary-sg-{environment_suffix}",
            description="Security group for secondary Aurora cluster",
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
            tags={**common_tags, "Name": f"db-secondary-sg-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # DB subnet group for secondary
        secondary_db_subnet_group = DbSubnetGroup(
            self,
            "secondary_db_subnet_group",
            name=f"dbsubnet-secondary-{environment_suffix}",
            subnet_ids=[secondary_private_subnet_1.id, secondary_private_subnet_2.id],
            tags={**common_tags, "Name": f"dbsubnet-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # Secondary Aurora cluster (read replica)
        secondary_cluster = RdsCluster(
            self,
            "secondary_cluster",
            cluster_identifier=f"aurora-secondary-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            master_username="admin",
            master_password="ChangeMe123!",
            db_subnet_group_name=secondary_db_subnet_group.name,
            vpc_security_group_ids=[secondary_db_sg.id],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            storage_encrypted=True,
            kms_key_id=secondary_kms_key.arn,
            skip_final_snapshot=True,
            apply_immediately=True,
            deletion_protection=False,
            global_cluster_identifier=global_cluster.id,
            tags={**common_tags, "Name": f"aurora-secondary-{environment_suffix}", "DR-Role": "secondary"},
            lifecycle={
                "ignore_changes": ["master_password", "kms_key_id", "global_cluster_identifier"]
            },
            provider=secondary_provider,
            depends_on=[primary_cluster]
        )

        # Secondary cluster instances
        secondary_cluster_instance = RdsClusterInstance(
            self,
            "secondary_cluster_instance_1",
            identifier=f"aurora-secondary-instance-1-{environment_suffix}",
            cluster_identifier=secondary_cluster.id,
            instance_class="db.r6g.large",
            engine=secondary_cluster.engine,
            engine_version=secondary_cluster.engine_version,
            publicly_accessible=False,
            tags={**common_tags, "Name": f"aurora-secondary-instance-1-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # ====== SNS TOPICS FOR NOTIFICATIONS ======

        # Primary SNS topic
        primary_sns_topic = SnsTopic(
            self,
            "primary_sns_topic",
            name=f"dr-alerts-primary-{environment_suffix}",
            tags={**common_tags, "Name": f"sns-alerts-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # SNS topic subscription (email)
        SnsTopicSubscription(
            self,
            "primary_sns_subscription",
            topic_arn=primary_sns_topic.arn,
            protocol="email",
            endpoint="ops-team@example.com",
            provider=primary_provider
        )

        # Secondary SNS topic
        secondary_sns_topic = SnsTopic(
            self,
            "secondary_sns_topic",
            name=f"dr-alerts-secondary-{environment_suffix}",
            tags={**common_tags, "Name": f"sns-alerts-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # SNS topic subscription (email)
        SnsTopicSubscription(
            self,
            "secondary_sns_subscription",
            topic_arn=secondary_sns_topic.arn,
            protocol="email",
            endpoint="ops-team@example.com",
            provider=secondary_provider
        )

        # ====== SYSTEMS MANAGER PARAMETERS ======

        # Store database endpoints
        primary_db_endpoint_param = SsmParameter(
            self,
            "primary_db_endpoint_param",
            name=f"/dr/{environment_suffix}/primary/db-endpoint",
            type="String",
            value=primary_cluster.endpoint,
            tags={**common_tags, "Name": f"param-primary-db-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        secondary_db_endpoint_param = SsmParameter(
            self,
            "secondary_db_endpoint_param",
            name=f"/dr/{environment_suffix}/secondary/db-endpoint",
            type="String",
            value=secondary_cluster.endpoint,
            tags={**common_tags, "Name": f"param-secondary-db-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # ====== IAM ROLES ======

        # Lambda execution role for primary region
        lambda_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Effect": "Allow"
            }]
        })

        primary_lambda_role = IamRole(
            self,
            "primary_lambda_role",
            name=f"lambda-healthcheck-primary-{environment_suffix}",
            assume_role_policy=lambda_assume_role_policy,
            tags={**common_tags, "Name": f"role-lambda-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "primary_lambda_basic_execution",
            role=primary_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "primary_lambda_vpc_execution",
            role=primary_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=primary_provider
        )

        # Lambda policy for primary region
        IamRolePolicy(
            self,
            "primary_lambda_policy",
            name=f"lambda-healthcheck-policy-primary-{environment_suffix}",
            role=primary_lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
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
                        "Resource": f"arn:aws:ssm:{primary_region}:*:parameter/dr/{environment_suffix}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": primary_sns_topic.arn
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
            provider=primary_provider
        )

        # Lambda execution role for secondary region
        secondary_lambda_role = IamRole(
            self,
            "secondary_lambda_role",
            name=f"lambda-healthcheck-secondary-{environment_suffix}",
            assume_role_policy=lambda_assume_role_policy,
            tags={**common_tags, "Name": f"role-lambda-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        IamRolePolicyAttachment(
            self,
            "secondary_lambda_basic_execution",
            role=secondary_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            provider=secondary_provider
        )

        IamRolePolicyAttachment(
            self,
            "secondary_lambda_vpc_execution",
            role=secondary_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=secondary_provider
        )

        # Lambda policy for secondary region
        IamRolePolicy(
            self,
            "secondary_lambda_policy",
            name=f"lambda-healthcheck-policy-secondary-{environment_suffix}",
            role=secondary_lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
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
                        "Resource": f"arn:aws:ssm:{secondary_region}:*:parameter/dr/{environment_suffix}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": secondary_sns_topic.arn
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
            provider=secondary_provider
        )

        # EC2 instance role for primary region
        ec2_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {
                    "Service": "ec2.amazonaws.com"
                },
                "Effect": "Allow"
            }]
        })

        primary_ec2_role = IamRole(
            self,
            "primary_ec2_role",
            name=f"ec2-app-primary-{environment_suffix}",
            assume_role_policy=ec2_assume_role_policy,
            tags={**common_tags, "Name": f"role-ec2-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        IamRolePolicy(
            self,
            "primary_ec2_policy",
            name=f"ec2-app-policy-primary-{environment_suffix}",
            role=primary_ec2_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters"
                        ],
                        "Resource": f"arn:aws:ssm:{primary_region}:*:parameter/dr/{environment_suffix}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::dr-app-primary-{environment_suffix}",
                            f"arn:aws:s3:::dr-app-primary-{environment_suffix}/*"
                        ]
                    }
                ]
            }),
            provider=primary_provider
        )

        primary_instance_profile = IamInstanceProfile(
            self,
            "primary_instance_profile",
            name=f"ec2-app-primary-{environment_suffix}",
            role=primary_ec2_role.name,
            provider=primary_provider
        )

        # EC2 instance role for secondary region
        secondary_ec2_role = IamRole(
            self,
            "secondary_ec2_role",
            name=f"ec2-app-secondary-{environment_suffix}",
            assume_role_policy=ec2_assume_role_policy,
            tags={**common_tags, "Name": f"role-ec2-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        IamRolePolicy(
            self,
            "secondary_ec2_policy",
            name=f"ec2-app-policy-secondary-{environment_suffix}",
            role=secondary_ec2_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters"
                        ],
                        "Resource": f"arn:aws:ssm:{secondary_region}:*:parameter/dr/{environment_suffix}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::dr-app-secondary-{environment_suffix}",
                            f"arn:aws:s3:::dr-app-secondary-{environment_suffix}/*"
                        ]
                    }
                ]
            }),
            provider=secondary_provider
        )

        secondary_instance_profile = IamInstanceProfile(
            self,
            "secondary_instance_profile",
            name=f"ec2-app-secondary-{environment_suffix}",
            role=secondary_ec2_role.name,
            provider=secondary_provider
        )

        # S3 replication role
        s3_replication_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {
                    "Service": "s3.amazonaws.com"
                },
                "Effect": "Allow"
            }]
        })

        s3_replication_role = IamRole(
            self,
            "s3_replication_role",
            name=f"s3-replication-{environment_suffix}",
            assume_role_policy=s3_replication_assume_role_policy,
            tags={**common_tags, "Name": f"role-s3-replication-{environment_suffix}"},
            provider=primary_provider
        )

        # ====== S3 BUCKETS WITH REPLICATION ======

        # Primary S3 bucket
        primary_s3_bucket = S3Bucket(
            self,
            "primary_s3_bucket",
            bucket=f"dr-app-primary-{environment_suffix}",
            tags={**common_tags, "Name": f"s3-app-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        primary_s3_versioning = S3BucketVersioningA(
            self,
            "primary_s3_versioning",
            bucket=primary_s3_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            ),
            provider=primary_provider
        )

        # Secondary S3 bucket
        secondary_s3_bucket = S3Bucket(
            self,
            "secondary_s3_bucket",
            bucket=f"dr-app-secondary-{environment_suffix}",
            tags={**common_tags, "Name": f"s3-app-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        secondary_s3_versioning = S3BucketVersioningA(
            self,
            "secondary_s3_versioning",
            bucket=secondary_s3_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            ),
            provider=secondary_provider
        )

        # S3 replication policy
        IamRolePolicy(
            self,
            "s3_replication_policy",
            name=f"s3-replication-policy-{environment_suffix}",
            role=s3_replication_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetReplicationConfiguration",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            primary_s3_bucket.arn,
                            secondary_s3_bucket.arn
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObjectVersionForReplication",
                            "s3:GetObjectVersionAcl",
                            "s3:GetObjectVersionTagging"
                        ],
                        "Resource": [
                            f"{primary_s3_bucket.arn}/*",
                            f"{secondary_s3_bucket.arn}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ReplicateObject",
                            "s3:ReplicateDelete",
                            "s3:ReplicateTags"
                        ],
                        "Resource": [
                            f"{primary_s3_bucket.arn}/*",
                            f"{secondary_s3_bucket.arn}/*"
                        ]
                    }
                ]
            }),
            provider=primary_provider
        )

        # Primary to Secondary replication
        S3BucketReplicationConfigurationA(
            self,
            "primary_to_secondary_replication",
            bucket=primary_s3_bucket.id,
            role=s3_replication_role.arn,
            rule=[
                S3BucketReplicationConfigurationRule(
                    id="replicate-all",
                    status="Enabled",
                    priority=1,
                    filter=S3BucketReplicationConfigurationRuleFilter(
                        prefix=""
                    ),
                    destination=S3BucketReplicationConfigurationRuleDestination(
                        bucket=secondary_s3_bucket.arn,
                        storage_class="STANDARD",
                        replication_time=S3BucketReplicationConfigurationRuleDestinationReplicationTime(
                            status="Enabled",
                            time=S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime(
                                minutes=15
                            )
                        ),
                        metrics=S3BucketReplicationConfigurationRuleDestinationMetrics(
                            status="Enabled",
                            event_threshold=S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold(
                                minutes=15
                            )
                        )
                    ),
                    delete_marker_replication={"status": "Enabled"}
                )
            ],
            provider=primary_provider,
            depends_on=[primary_s3_versioning, secondary_s3_versioning]
        )

        # Secondary to Primary replication
        S3BucketReplicationConfigurationA(
            self,
            "secondary_to_primary_replication",
            bucket=secondary_s3_bucket.id,
            role=s3_replication_role.arn,
            rule=[
                S3BucketReplicationConfigurationRule(
                    id="replicate-all",
                    status="Enabled",
                    priority=1,
                    filter=S3BucketReplicationConfigurationRuleFilter(
                        prefix=""
                    ),
                    destination=S3BucketReplicationConfigurationRuleDestination(
                        bucket=primary_s3_bucket.arn,
                        storage_class="STANDARD",
                        replication_time=S3BucketReplicationConfigurationRuleDestinationReplicationTime(
                            status="Enabled",
                            time=S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime(
                                minutes=15
                            )
                        ),
                        metrics=S3BucketReplicationConfigurationRuleDestinationMetrics(
                            status="Enabled",
                            event_threshold=S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold(
                                minutes=15
                            )
                        )
                    ),
                    delete_marker_replication={"status": "Enabled"}
                )
            ],
            provider=secondary_provider,
            depends_on=[primary_s3_versioning, secondary_s3_versioning]
        )

        # ====== COMPUTE INFRASTRUCTURE (ALB + ASG) ======

        # Get latest Amazon Linux 2 AMI for primary region
        primary_ami = DataAwsAmi(
            self,
            "primary_ami",
            most_recent=True,
            owners=["amazon"],
            filter=[
                DataAwsAmiFilter(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"]
                ),
                DataAwsAmiFilter(
                    name="virtualization-type",
                    values=["hvm"]
                )
            ],
            provider=primary_provider
        )

        # Security group for primary ALB
        primary_alb_sg = SecurityGroup(
            self,
            "primary_alb_sg",
            name=f"alb-primary-sg-{environment_suffix}",
            description="Security group for primary ALB",
            vpc_id=primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
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
            tags={**common_tags, "Name": f"alb-primary-sg-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # Security group for primary EC2 instances
        primary_ec2_sg = SecurityGroup(
            self,
            "primary_ec2_sg",
            name=f"ec2-primary-sg-{environment_suffix}",
            description="Security group for primary EC2 instances",
            vpc_id=primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[primary_alb_sg.id]
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
            tags={**common_tags, "Name": f"ec2-primary-sg-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider,
            depends_on=[primary_alb_sg]
        )

        # Primary ALB
        primary_alb = Lb(
            self,
            "primary_alb",
            name=f"alb-primary-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[primary_alb_sg.id],
            subnets=[primary_public_subnet_1.id, primary_public_subnet_2.id],
            tags={**common_tags, "Name": f"alb-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # Primary Target Group
        primary_tg = LbTargetGroup(
            self,
            "primary_tg",
            name=f"tg-primary-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=primary_vpc.id,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                path="/health",
                timeout=5,
                unhealthy_threshold=2
            ),
            tags={**common_tags, "Name": f"tg-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # Primary ALB Listener
        LbListener(
            self,
            "primary_alb_listener",
            load_balancer_arn=primary_alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=primary_tg.arn
                )
            ],
            provider=primary_provider
        )

        # User data for primary instances
        primary_user_data = base64.b64encode(f"""#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Primary Region - {environment_suffix}</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
""".encode()).decode()

        # Primary Launch Template
        primary_lt = LaunchTemplate(
            self,
            "primary_lt",
            name_prefix=f"lt-primary-{environment_suffix}-",
            image_id=primary_ami.id,
            instance_type="t3.micro",
            iam_instance_profile={"arn": primary_instance_profile.arn},
            vpc_security_group_ids=[primary_ec2_sg.id],
            user_data=primary_user_data,
            tags={**common_tags, "Name": f"lt-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # Primary Auto Scaling Group
        primary_asg = AutoscalingGroup(
            self,
            "primary_asg",
            name=f"asg-primary-{environment_suffix}",
            desired_capacity=2,
            max_size=4,
            min_size=2,
            health_check_type="ELB",
            health_check_grace_period=300,
            target_group_arns=[primary_tg.arn],
            vpc_zone_identifier=[primary_public_subnet_1.id, primary_public_subnet_2.id],
            launch_template={
                "id": primary_lt.id,
                "version": "$Latest"
            },
            tag=[
                AutoscalingGroupTag(
                    key="Name",
                    value=f"asg-primary-{environment_suffix}",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="DR-Role",
                    value="primary",
                    propagate_at_launch=True
                )
            ],
            provider=primary_provider
        )

        # Get latest Amazon Linux 2 AMI for secondary region
        secondary_ami = DataAwsAmi(
            self,
            "secondary_ami",
            most_recent=True,
            owners=["amazon"],
            filter=[
                DataAwsAmiFilter(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"]
                ),
                DataAwsAmiFilter(
                    name="virtualization-type",
                    values=["hvm"]
                )
            ],
            provider=secondary_provider
        )

        # Security group for secondary ALB
        secondary_alb_sg = SecurityGroup(
            self,
            "secondary_alb_sg",
            name=f"alb-secondary-sg-{environment_suffix}",
            description="Security group for secondary ALB",
            vpc_id=secondary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
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
            tags={**common_tags, "Name": f"alb-secondary-sg-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # Security group for secondary EC2 instances
        secondary_ec2_sg = SecurityGroup(
            self,
            "secondary_ec2_sg",
            name=f"ec2-secondary-sg-{environment_suffix}",
            description="Security group for secondary EC2 instances",
            vpc_id=secondary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[secondary_alb_sg.id]
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
            tags={**common_tags, "Name": f"ec2-secondary-sg-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider,
            depends_on=[secondary_alb_sg]
        )

        # Secondary ALB
        secondary_alb = Lb(
            self,
            "secondary_alb",
            name=f"alb-secondary-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[secondary_alb_sg.id],
            subnets=[secondary_public_subnet_1.id, secondary_public_subnet_2.id],
            tags={**common_tags, "Name": f"alb-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # Secondary Target Group
        secondary_tg = LbTargetGroup(
            self,
            "secondary_tg",
            name=f"tg-secondary-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=secondary_vpc.id,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                path="/health",
                timeout=5,
                unhealthy_threshold=2
            ),
            tags={**common_tags, "Name": f"tg-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # Secondary ALB Listener
        LbListener(
            self,
            "secondary_alb_listener",
            load_balancer_arn=secondary_alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=secondary_tg.arn
                )
            ],
            provider=secondary_provider
        )

        # User data for secondary instances (standby mode - minimal capacity)
        secondary_user_data = base64.b64encode(f"""#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Secondary Region - {environment_suffix} (Standby)</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
""".encode()).decode()

        # Secondary Launch Template
        secondary_lt = LaunchTemplate(
            self,
            "secondary_lt",
            name_prefix=f"lt-secondary-{environment_suffix}-",
            image_id=secondary_ami.id,
            instance_type="t3.micro",
            iam_instance_profile={"arn": secondary_instance_profile.arn},
            vpc_security_group_ids=[secondary_ec2_sg.id],
            user_data=secondary_user_data,
            tags={**common_tags, "Name": f"lt-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # Secondary Auto Scaling Group (standby mode - min capacity)
        secondary_asg = AutoscalingGroup(
            self,
            "secondary_asg",
            name=f"asg-secondary-{environment_suffix}",
            desired_capacity=1,
            max_size=4,
            min_size=1,
            health_check_type="ELB",
            health_check_grace_period=300,
            target_group_arns=[secondary_tg.arn],
            vpc_zone_identifier=[secondary_public_subnet_1.id, secondary_public_subnet_2.id],
            launch_template={
                "id": secondary_lt.id,
                "version": "$Latest"
            },
            tag=[
                AutoscalingGroupTag(
                    key="Name",
                    value=f"asg-secondary-{environment_suffix}",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="DR-Role",
                    value="secondary",
                    propagate_at_launch=True
                )
            ],
            provider=secondary_provider
        )

        # ====== ROUTE 53 AND HEALTH CHECKS ======

        # Route 53 Hosted Zone
        # Use a test domain format that won't conflict with reserved domains
        hosted_zone = Route53Zone(
            self,
            "hosted_zone",
            name=f"dr-{environment_suffix}.testing.internal",
            tags={**common_tags, "Name": f"r53-zone-{environment_suffix}"},
            provider=primary_provider
        )

        # Health check for primary ALB
        primary_health_check = Route53HealthCheck(
            self,
            "primary_health_check",
            fqdn=primary_alb.dns_name,
            port=80,
            type="HTTP",
            resource_path="/health",
            failure_threshold=3,
            request_interval=30,
            tags={**common_tags, "Name": f"hc-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # Weighted record for primary region (100% weight)
        Route53Record(
            self,
            "primary_dns_record",
            zone_id=hosted_zone.zone_id,
            name=f"app.dr-{environment_suffix}.testing.internal",
            type="A",
            alias={
                "name": primary_alb.dns_name,
                "zone_id": primary_alb.zone_id,
                "evaluate_target_health": True
            },
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=100
            ),
            set_identifier="primary",
            health_check_id=primary_health_check.id,
            provider=primary_provider
        )

        # Weighted record for secondary region (0% weight - standby)
        Route53Record(
            self,
            "secondary_dns_record",
            zone_id=hosted_zone.zone_id,
            name=f"app.dr-{environment_suffix}.testing.internal",
            type="A",
            alias={
                "name": secondary_alb.dns_name,
                "zone_id": secondary_alb.zone_id,
                "evaluate_target_health": True
            },
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=0
            ),
            set_identifier="secondary",
            provider=primary_provider
        )

        # ====== LAMBDA HEALTH CHECK FUNCTIONS ======

        # Lambda health check code
        lambda_code = """
import boto3
import json
import os
from datetime import datetime

rds = boto3.client('rds')
ssm = boto3.client('ssm')
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')

def lambda_handler(event, context):
    region = os.environ['AWS_REGION']
    env_suffix = os.environ['ENVIRONMENT_SUFFIX']
    dr_role = os.environ['DR_ROLE']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']

    try:
        # Check database connectivity
        db_endpoint_param = f"/dr/{env_suffix}/{dr_role}/db-endpoint"
        db_endpoint = ssm.get_parameter(Name=db_endpoint_param)['Parameter']['Value']

        # Describe Aurora cluster
        cluster_id = f"aurora-{dr_role}-{env_suffix}"
        response = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster_status = response['DBClusters'][0]['Status']

        # Publish health metric
        cloudwatch.put_metric_data(
            Namespace='DR/HealthCheck',
            MetricData=[
                {
                    'MetricName': 'DatabaseHealth',
                    'Value': 1.0 if cluster_status == 'available' else 0.0,
                    'Unit': 'None',
                    'Dimensions': [
                        {'Name': 'Region', 'Value': region},
                        {'Name': 'DRRole', 'Value': dr_role}
                    ]
                }
            ]
        )

        if cluster_status != 'available':
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject=f"Database Health Alert - {dr_role}",
                Message=f"Database cluster {cluster_id} status: {cluster_status}"
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'region': region,
                'dr_role': dr_role,
                'db_status': cluster_status,
                'timestamp': datetime.now().isoformat()
            })
        }
    except Exception as e:
        # Publish failure metric
        cloudwatch.put_metric_data(
            Namespace='DR/HealthCheck',
            MetricData=[
                {
                    'MetricName': 'DatabaseHealth',
                    'Value': 0.0,
                    'Unit': 'None',
                    'Dimensions': [
                        {'Name': 'Region', 'Value': region},
                        {'Name': 'DRRole', 'Value': dr_role}
                    ]
                }
            ]
        )

        sns.publish(
            TopicArn=sns_topic_arn,
            Subject=f"Health Check Failed - {dr_role}",
            Message=f"Error: {str(e)}"
        )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""

        # Primary Lambda function
        # Create temporary ZIP file for primary Lambda
        primary_zip_path = tempfile.mktemp(suffix='.zip')
        with zipfile.ZipFile(primary_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.writestr('index.py', lambda_code)

        # Read ZIP file and compute hash
        with open(primary_zip_path, 'rb') as f:
            primary_zip_data = f.read()
            primary_code_hash = hashlib.sha256(primary_zip_data).hexdigest()

        primary_lambda = LambdaFunction(
            self,
            "primary_lambda_healthcheck",
            function_name=f"dr-healthcheck-primary-{environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=primary_lambda_role.arn,
            filename=primary_zip_path,
            source_code_hash=base64.b64encode(primary_code_hash.encode()).decode(),
            timeout=60,
            environment=LambdaFunctionEnvironment(
                variables={
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "DR_ROLE": "primary",
                    "SNS_TOPIC_ARN": primary_sns_topic.arn
                }
            ),
            tags={**common_tags, "Name": f"lambda-healthcheck-primary-{environment_suffix}", "DR-Role": "primary"},
            provider=primary_provider
        )

        # EventBridge rule for primary Lambda (every 60 seconds)
        primary_event_rule = CloudwatchEventRule(
            self,
            "primary_event_rule",
            name=f"dr-healthcheck-primary-{environment_suffix}",
            description="Trigger health check every 60 seconds",
            schedule_expression="rate(1 minute)",
            provider=primary_provider
        )

        CloudwatchEventTarget(
            self,
            "primary_event_target",
            rule=primary_event_rule.name,
            arn=primary_lambda.arn,
            provider=primary_provider
        )

        LambdaPermission(
            self,
            "primary_lambda_permission",
            statement_id="AllowExecutionFromEventBridge",
            action="lambda:InvokeFunction",
            function_name=primary_lambda.function_name,
            principal="events.amazonaws.com",
            source_arn=primary_event_rule.arn,
            provider=primary_provider
        )

        # Secondary Lambda function
        # Create temporary ZIP file for secondary Lambda
        secondary_zip_path = tempfile.mktemp(suffix='.zip')
        with zipfile.ZipFile(secondary_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.writestr('index.py', lambda_code)

        # Read ZIP file and compute hash
        with open(secondary_zip_path, 'rb') as f:
            secondary_zip_data = f.read()
            secondary_code_hash = hashlib.sha256(secondary_zip_data).hexdigest()

        secondary_lambda = LambdaFunction(
            self,
            "secondary_lambda_healthcheck",
            function_name=f"dr-healthcheck-secondary-{environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=secondary_lambda_role.arn,
            filename=secondary_zip_path,
            source_code_hash=base64.b64encode(secondary_code_hash.encode()).decode(),
            timeout=60,
            environment=LambdaFunctionEnvironment(
                variables={
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "DR_ROLE": "secondary",
                    "SNS_TOPIC_ARN": secondary_sns_topic.arn
                }
            ),
            tags={**common_tags, "Name": f"lambda-healthcheck-secondary-{environment_suffix}", "DR-Role": "secondary"},
            provider=secondary_provider
        )

        # EventBridge rule for secondary Lambda (every 60 seconds)
        secondary_event_rule = CloudwatchEventRule(
            self,
            "secondary_event_rule",
            name=f"dr-healthcheck-secondary-{environment_suffix}",
            description="Trigger health check every 60 seconds",
            schedule_expression="rate(1 minute)",
            provider=secondary_provider
        )

        CloudwatchEventTarget(
            self,
            "secondary_event_target",
            rule=secondary_event_rule.name,
            arn=secondary_lambda.arn,
            provider=secondary_provider
        )

        LambdaPermission(
            self,
            "secondary_lambda_permission",
            statement_id="AllowExecutionFromEventBridge",
            action="lambda:InvokeFunction",
            function_name=secondary_lambda.function_name,
            principal="events.amazonaws.com",
            source_arn=secondary_event_rule.arn,
            provider=secondary_provider
        )

        # ====== CLOUDWATCH DASHBOARD AND ALARMS ======

        # CloudWatch Dashboard
        dashboard_body = json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["DR/HealthCheck", "DatabaseHealth", "DRRole", "primary"],
                            [".", ".", ".", "secondary"]
                        ],
                        "period": 60,
                        "stat": "Average",
                        "region": primary_region,
                        "title": "Database Health Status"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "AuroraGlobalDBReplicationLag", "DBClusterIdentifier", f"aurora-secondary-{environment_suffix}"]
                        ],
                        "period": 60,
                        "stat": "Average",
                        "region": primary_region,
                        "title": "Aurora Global DB Replication Lag (RPO)"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", primary_alb.arn_suffix],
                            [".", ".", ".", secondary_alb.arn_suffix]
                        ],
                        "period": 60,
                        "stat": "Average",
                        "region": primary_region,
                        "title": "ALB Response Time"
                    }
                }
            ]
        })

        CloudwatchDashboard(
            self,
            "dr_dashboard",
            dashboard_name=f"DR-Dashboard-{environment_suffix}",
            dashboard_body=dashboard_body,
            provider=primary_provider
        )

        # CloudWatch Alarm for replication lag (RPO)
        CloudwatchMetricAlarm(
            self,
            "replication_lag_alarm",
            alarm_name=f"dr-replication-lag-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=60000,
            alarm_description="Alert when replication lag exceeds 60 seconds (RPO violation)",
            alarm_actions=[primary_sns_topic.arn],
            dimensions={"DBClusterIdentifier": f"aurora-secondary-{environment_suffix}"},
            provider=primary_provider
        )

        # CloudWatch Alarm for database health
        CloudwatchMetricAlarm(
            self,
            "primary_db_health_alarm",
            alarm_name=f"dr-db-health-primary-{environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseHealth",
            namespace="DR/HealthCheck",
            period=60,
            statistic="Average",
            threshold=1.0,
            alarm_description="Alert when primary database health check fails",
            alarm_actions=[primary_sns_topic.arn],
            dimensions={"DRRole": "primary"},
            provider=primary_provider
        )

        # ====== OUTPUTS ======

        TerraformOutput(
            self,
            "primary_alb_dns",
            value=primary_alb.dns_name,
            description="Primary ALB DNS Name"
        )

        TerraformOutput(
            self,
            "secondary_alb_dns",
            value=secondary_alb.dns_name,
            description="Secondary ALB DNS Name"
        )

        TerraformOutput(
            self,
            "route53_dns",
            value=f"app.dr-{environment_suffix}.testing.internal",
            description="Route53 DNS Name"
        )

        TerraformOutput(
            self,
            "primary_db_endpoint",
            value=primary_cluster.endpoint,
            description="Primary Aurora Cluster Endpoint"
        )

        TerraformOutput(
            self,
            "secondary_db_endpoint",
            value=secondary_cluster.endpoint,
            description="Secondary Aurora Cluster Endpoint"
        )

        TerraformOutput(
            self,
            "primary_s3_bucket_output",
            value=primary_s3_bucket.bucket,
            description="Primary S3 Bucket Name"
        )

        TerraformOutput(
            self,
            "secondary_s3_bucket_output",
            value=secondary_s3_bucket.bucket,
            description="Secondary S3 Bucket Name"
        )

        TerraformOutput(
            self,
            "primary_sns_topic_arn",
            value=primary_sns_topic.arn,
            description="Primary SNS Topic ARN"
        )

        TerraformOutput(
            self,
            "secondary_sns_topic_arn",
            value=secondary_sns_topic.arn,
            description="Secondary SNS Topic ARN"
        )
