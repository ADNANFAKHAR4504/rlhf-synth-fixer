import json
import os
import zipfile

from cdktf import App, Fn, TerraformOutput, TerraformStack
from cdktf_cdktf_provider_aws.apigatewayv2_api import Apigatewayv2Api
from cdktf_cdktf_provider_aws.apigatewayv2_integration import \
    Apigatewayv2Integration
from cdktf_cdktf_provider_aws.apigatewayv2_route import Apigatewayv2Route
from cdktf_cdktf_provider_aws.apigatewayv2_stage import Apigatewayv2Stage
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import \
    CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable, DynamodbTableAttribute, DynamodbTableGlobalSecondaryIndex,
    DynamodbTablePointInTimeRecovery)
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import \
    RouteTableAssociation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_replication_configuration import (
    S3BucketReplicationConfigurationA, S3BucketReplicationConfigurationRule,
    S3BucketReplicationConfigurationRuleDestination)
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA)
from cdktf_cdktf_provider_aws.s3_bucket_versioning import (
    S3BucketVersioningA, S3BucketVersioningVersioningConfiguration)
from cdktf_cdktf_provider_aws.security_group import (SecurityGroup,
                                                     SecurityGroupEgress,
                                                     SecurityGroupIngress)
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.vpc_peering_connection import \
    VpcPeeringConnection
from cdktf_cdktf_provider_aws.vpc_peering_connection_accepter import \
    VpcPeeringConnectionAccepterA
from constructs import Construct


class TapStack(TerraformStack):
    def __init__(
        self, 
        scope: Construct, 
        ns: str,
        environment_suffix: str = "dev-001",
        state_bucket: str = None,
        state_bucket_region: str = None,
        aws_region: str = None,
        default_tags: dict = None
    ):
        super().__init__(scope, ns)

        # Environment suffix for resource naming (use passed parameter or default)
        self.environment_suffix = environment_suffix

        # Create a minimal Lambda function zip if it doesn't exist
        # Use the Lambda function zip from lib folder (same directory as this file)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        lambda_zip_path = os.path.join(script_dir, "lambda_function.zip")
        
        if not os.path.exists(lambda_zip_path):
            lambda_code = '''import json

def handler(event, context):
    """Lambda function handler for payment processing"""
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Payment processor lambda function'})
    }
'''
            with zipfile.ZipFile(lambda_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                zipf.writestr('index.py', lambda_code)

        # Common tags
        common_tags = {
            "Environment": "development",
            "ManagedBy": "CDKTF",
            "Project": "PaymentMigration"
        }

        # Provider configurations
        provider_us_east_1 = AwsProvider(
            self,
            "aws-eu-central-2",
            region="eu-central-2",
            alias="eu_central_2"
        )

        provider_eu_west_1 = AwsProvider(
            self,
            "aws-eu-west-1",
            region="eu-west-1",
            alias="eu_west_1"
        )

        # ==================== EU-SOUTH-1 VPC Infrastructure ====================

        vpc_eu_central = Vpc(
            self,
            "vpc-eu-central-2",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **common_tags,
                "Name": f"payment-vpc-eu-central-2-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        # Public subnets in eu-central-2
        subnet_eu_central_public_1a = Subnet(
            self,
            "subnet-eu-south-public-1a",
            vpc_id=vpc_eu_central.id,
            cidr_block="10.0.1.0/24",
            availability_zone="eu-central-2a",
            map_public_ip_on_launch=True,
            tags={
                **common_tags,
                "Name": f"payment-public-1a-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        subnet_eu_central_public_1b = Subnet(
            self,
            "subnet-eu-south-public-1b",
            vpc_id=vpc_eu_central.id,
            cidr_block="10.0.2.0/24",
            availability_zone="eu-central-2b",
            map_public_ip_on_launch=True,
            tags={
                **common_tags,
                "Name": f"payment-public-1b-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        # Private subnets in eu-central-2
        subnet_eu_central_private_1a = Subnet(
            self,
            "subnet-eu-south-private-1a",
            vpc_id=vpc_eu_central.id,
            cidr_block="10.0.11.0/24",
            availability_zone="eu-central-2a",
            tags={
                **common_tags,
                "Name": f"payment-private-1a-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        subnet_eu_central_private_1b = Subnet(
            self,
            "subnet-eu-south-private-1b",
            vpc_id=vpc_eu_central.id,
            cidr_block="10.0.12.0/24",
            availability_zone="eu-central-2b",
            tags={
                **common_tags,
                "Name": f"payment-private-1b-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        # Internet Gateway for eu-central-2
        igw_eu_central = InternetGateway(
            self,
            "igw-eu-central-2",
            vpc_id=vpc_eu_central.id,
            tags={
                **common_tags,
                "Name": f"payment-igw-eu-central-2-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        # NAT Gateway for eu-central-2
        eip_eu_central_nat = Eip(
            self,
            "eip-eu-south-nat",
            domain="vpc",
            tags={
                **common_tags,
                "Name": f"payment-nat-eip-us-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        nat_eu_central = NatGateway(
            self,
            "nat-eu-central-2",
            allocation_id=eip_eu_central_nat.id,
            subnet_id=subnet_eu_central_public_1a.id,
            tags={
                **common_tags,
                "Name": f"payment-nat-us-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        # Route tables for eu-central-2
        rt_eu_central_public = RouteTable(
            self,
            "rt-eu-south-public",
            vpc_id=vpc_eu_central.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw_eu_central.id
                )
            ],
            tags={
                **common_tags,
                "Name": f"payment-rt-public-us-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        rt_eu_central_private = RouteTable(
            self,
            "rt-eu-south-private",
            vpc_id=vpc_eu_central.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_eu_central.id
                )
            ],
            tags={
                **common_tags,
                "Name": f"payment-rt-private-us-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        # Route table associations for eu-central-2
        RouteTableAssociation(
            self,
            "rta-eu-south-public-1a",
            subnet_id=subnet_eu_central_public_1a.id,
            route_table_id=rt_eu_central_public.id,
            provider=provider_us_east_1
        )

        RouteTableAssociation(
            self,
            "rta-eu-south-public-1b",
            subnet_id=subnet_eu_central_public_1b.id,
            route_table_id=rt_eu_central_public.id,
            provider=provider_us_east_1
        )

        RouteTableAssociation(
            self,
            "rta-eu-south-private-1a",
            subnet_id=subnet_eu_central_private_1a.id,
            route_table_id=rt_eu_central_private.id,
            provider=provider_us_east_1
        )

        RouteTableAssociation(
            self,
            "rta-eu-south-private-1b",
            subnet_id=subnet_eu_central_private_1b.id,
            route_table_id=rt_eu_central_private.id,
            provider=provider_us_east_1
        )

        # ==================== EU-WEST-1 VPC Infrastructure ====================

        vpc_eu = Vpc(
            self,
            "vpc-eu-west-1",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **common_tags,
                "Name": f"payment-vpc-eu-west-1-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # Public subnets in eu-west-1
        subnet_eu_public_1a = Subnet(
            self,
            "subnet-eu-public-1a",
            vpc_id=vpc_eu.id,
            cidr_block="10.1.1.0/24",
            availability_zone="eu-west-1a",
            map_public_ip_on_launch=True,
            tags={
                **common_tags,
                "Name": f"payment-public-1a-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        subnet_eu_public_1b = Subnet(
            self,
            "subnet-eu-public-1b",
            vpc_id=vpc_eu.id,
            cidr_block="10.1.2.0/24",
            availability_zone="eu-west-1b",
            map_public_ip_on_launch=True,
            tags={
                **common_tags,
                "Name": f"payment-public-1b-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # Private subnets in eu-west-1
        subnet_eu_private_1a = Subnet(
            self,
            "subnet-eu-private-1a",
            vpc_id=vpc_eu.id,
            cidr_block="10.1.11.0/24",
            availability_zone="eu-west-1a",
            tags={
                **common_tags,
                "Name": f"payment-private-1a-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        subnet_eu_private_1b = Subnet(
            self,
            "subnet-eu-private-1b",
            vpc_id=vpc_eu.id,
            cidr_block="10.1.12.0/24",
            availability_zone="eu-west-1b",
            tags={
                **common_tags,
                "Name": f"payment-private-1b-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # Internet Gateway for eu-west-1
        igw_eu = InternetGateway(
            self,
            "igw-eu-west-1",
            vpc_id=vpc_eu.id,
            tags={
                **common_tags,
                "Name": f"payment-igw-eu-west-1-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # NAT Gateway for eu-west-1
        eip_eu_nat = Eip(
            self,
            "eip-eu-nat",
            domain="vpc",
            tags={
                **common_tags,
                "Name": f"payment-nat-eip-eu-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        nat_eu = NatGateway(
            self,
            "nat-eu-west-1",
            allocation_id=eip_eu_nat.id,
            subnet_id=subnet_eu_public_1a.id,
            tags={
                **common_tags,
                "Name": f"payment-nat-eu-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # Route tables for eu-west-1
        rt_eu_public = RouteTable(
            self,
            "rt-eu-public",
            vpc_id=vpc_eu.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw_eu.id
                )
            ],
            tags={
                **common_tags,
                "Name": f"payment-rt-public-eu-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        rt_eu_private = RouteTable(
            self,
            "rt-eu-private",
            vpc_id=vpc_eu.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_eu.id
                )
            ],
            tags={
                **common_tags,
                "Name": f"payment-rt-private-eu-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # Route table associations for eu-west-1
        RouteTableAssociation(
            self,
            "rta-eu-public-1a",
            subnet_id=subnet_eu_public_1a.id,
            route_table_id=rt_eu_public.id,
            provider=provider_eu_west_1
        )

        RouteTableAssociation(
            self,
            "rta-eu-public-1b",
            subnet_id=subnet_eu_public_1b.id,
            route_table_id=rt_eu_public.id,
            provider=provider_eu_west_1
        )

        RouteTableAssociation(
            self,
            "rta-eu-private-1a",
            subnet_id=subnet_eu_private_1a.id,
            route_table_id=rt_eu_private.id,
            provider=provider_eu_west_1
        )

        RouteTableAssociation(
            self,
            "rta-eu-private-1b",
            subnet_id=subnet_eu_private_1b.id,
            route_table_id=rt_eu_private.id,
            provider=provider_eu_west_1
        )

        # ==================== VPC Peering ====================

        vpc_peering = VpcPeeringConnection(
            self,
            "vpc-peering-eu-south-eu-west",
            vpc_id=vpc_eu_central.id,
            peer_vpc_id=vpc_eu.id,
            peer_region="eu-west-1",
            auto_accept=False,
            tags={
                **common_tags,
                "Name": f"payment-peering-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        vpc_peering_accepter = VpcPeeringConnectionAccepterA(
            self,
            "vpc-peering-accepter",
            vpc_peering_connection_id=vpc_peering.id,
            auto_accept=True,
            tags={
                **common_tags,
                "Name": f"payment-peering-accepter-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # Add peering routes to eu-central-2 private route table
        rt_eu_central_private_peering = RouteTable(
            self,
            "rt-eu-south-private-with-peering",
            vpc_id=vpc_eu_central.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_eu_central.id
                ),
                RouteTableRoute(
                    cidr_block="10.1.0.0/16",
                    vpc_peering_connection_id=vpc_peering.id
                )
            ],
            tags={
                **common_tags,
                "Name": f"payment-rt-private-eu-south-peering-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        # Add peering routes to eu-west-1 private route table
        rt_eu_private_peering = RouteTable(
            self,
            "rt-eu-private-with-peering",
            vpc_id=vpc_eu.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_eu.id
                ),
                RouteTableRoute(
                    cidr_block="10.0.0.0/16",
                    vpc_peering_connection_id=vpc_peering.id
                )
            ],
            tags={
                **common_tags,
                "Name": f"payment-rt-private-eu-peering-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # ==================== KMS Keys ====================

        kms_key_rds = KmsKey(
            self,
            "kms-rds",
            description=f"KMS key for RDS encryption - {environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags={
                **common_tags,
                "Name": f"payment-rds-kms-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        KmsAlias(
            self,
            "kms-alias-rds",
            name=f"alias/payment-rds-{environment_suffix}-kl",
            target_key_id=kms_key_rds.key_id,
            provider=provider_eu_west_1
        )

        # ==================== Security Groups ====================

        sg_rds = SecurityGroup(
            self,
            "sg-rds",
            name=f"payment-rds-sg-{environment_suffix}-kl",
            description="Security group for RDS PostgreSQL",
            vpc_id=vpc_eu.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
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
                **common_tags,
                "Name": f"payment-rds-sg-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        sg_lambda = SecurityGroup(
            self,
            "sg-lambda",
            name=f"payment-lambda-sg-{environment_suffix}-kl",
            description="Security group for Lambda functions",
            vpc_id=vpc_eu.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                **common_tags,
                "Name": f"payment-lambda-sg-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # ==================== RDS PostgreSQL ====================

        db_subnet_group = DbSubnetGroup(
            self,
            "db-subnet-group",
            name=f"payment-db-subnet-{environment_suffix}-kl",
            subnet_ids=[subnet_eu_private_1a.id, subnet_eu_private_1b.id],
            tags={
                **common_tags,
                "Name": f"payment-db-subnet-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        rds_instance = DbInstance(
            self,
            "rds-postgresql",
            identifier=f"payment-db-{environment_suffix}-kl",
            engine="postgres",
            engine_version="17.4",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_encrypted=True,
            kms_key_id=kms_key_rds.arn,
            db_name="paymentdb",
            username="dbadmin",
            password="ChangeMe123!",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[sg_rds.id],
            multi_az=True,
            backup_retention_period=7,
            skip_final_snapshot=True,
            tags={
                **common_tags,
                "Name": f"payment-db-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # ==================== DynamoDB Tables ====================

        dynamodb_transactions = DynamodbTable(
            self,
            "dynamodb-transactions",
            name=f"payment-transactions-{environment_suffix}-kl",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transactionId",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(
                    name="transactionId",
                    type="S"
                ),
                DynamodbTableAttribute(
                    name="timestamp",
                    type="N"
                ),
                DynamodbTableAttribute(
                    name="customerId",
                    type="S"
                ),
                DynamodbTableAttribute(
                    name="status",
                    type="S"
                )
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="CustomerIndex",
                    hash_key="customerId",
                    range_key="timestamp",
                    projection_type="ALL"
                ),
                DynamodbTableGlobalSecondaryIndex(
                    name="StatusIndex",
                    hash_key="status",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(
                enabled=True
            ),
            tags={
                **common_tags,
                "Name": f"payment-transactions-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # ==================== S3 Buckets ====================

        s3_bucket_us = S3Bucket(
            self,
            "s3-bucket-us",
            bucket=f"payment-data-eu-central-2-{environment_suffix}-kl",
            tags={
                **common_tags,
                "Name": f"payment-data-eu-central-2-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        s3_versioning_us = S3BucketVersioningA(
            self,
            "s3-versioning-us",
            bucket=s3_bucket_us.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            ),
            provider=provider_us_east_1
        )

        S3BucketServerSideEncryptionConfigurationA(
            self,
            "s3-encryption-us",
            bucket=s3_bucket_us.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="AES256"
                    )
                )
            ],
            provider=provider_us_east_1
        )

        s3_bucket_eu = S3Bucket(
            self,
            "s3-bucket-eu",
            bucket=f"payment-data-eu-west-1-{environment_suffix}-kl",
            tags={
                **common_tags,
                "Name": f"payment-data-eu-west-1-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        s3_versioning_eu = S3BucketVersioningA(
            self,
            "s3-versioning-eu",
            bucket=s3_bucket_eu.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            ),
            provider=provider_eu_west_1
        )

        S3BucketServerSideEncryptionConfigurationA(
            self,
            "s3-encryption-eu",
            bucket=s3_bucket_eu.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="AES256"
                    )
                )
            ],
            provider=provider_eu_west_1
        )

        # S3 Replication IAM Role
        replication_role = IamRole(
            self,
            "s3-replication-role",
            name=f"payment-s3-replication-{environment_suffix}-kl",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                **common_tags,
                "Name": f"payment-s3-replication-{environment_suffix}-kl",
                "Region": "eu-central-2",
                "MigrationBatch": "batch-1"
            },
            provider=provider_us_east_1
        )

        IamRolePolicy(
            self,
            "s3-replication-policy",
            role=replication_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetReplicationConfiguration",
                            "s3:ListBucket"
                        ],
                        "Resource": s3_bucket_us.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObjectVersionForReplication",
                            "s3:GetObjectVersionAcl"
                        ],
                        "Resource": f"{s3_bucket_us.arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ReplicateObject",
                            "s3:ReplicateDelete"
                        ],
                        "Resource": f"{s3_bucket_eu.arn}/*"
                    },
                    {
                        "Effect": "Deny",
                        "Action": "s3:DeleteBucket",
                        "Resource": "*"
                    }
                ]
            }),
            provider=provider_us_east_1
        )

        S3BucketReplicationConfigurationA(
            self,
            "s3-replication",
            bucket=s3_bucket_us.id,
            role=replication_role.arn,
            rule=[
                S3BucketReplicationConfigurationRule(
                    id="ReplicateAll",
                    status="Enabled",
                    destination=S3BucketReplicationConfigurationRuleDestination(
                        bucket=s3_bucket_eu.arn,
                        storage_class="STANDARD"
                    )
                )
            ],
            depends_on=[s3_versioning_us, s3_versioning_eu],
            provider=provider_us_east_1
        )

        # ==================== Lambda Functions ====================

        lambda_role = IamRole(
            self,
            "lambda-role",
            name=f"payment-lambda-role-{environment_suffix}-kl",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                **common_tags,
                "Name": f"payment-lambda-role-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        IamRolePolicyAttachment(
            self,
            "lambda-vpc-execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=provider_eu_west_1
        )

        IamRolePolicy(
            self,
            "lambda-custom-policy",
            role=lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query"
                        ],
                        "Resource": dynamodb_transactions.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Deny",
                        "Action": [
                            "dynamodb:DeleteTable",
                            "dynamodb:DeleteItem"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            provider=provider_eu_west_1
        )

        lambda_function = LambdaFunction(
            self,
            "lambda-payment-processor",
            function_name=f"payment-processor-{environment_suffix}-kl",
            role=lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            filename="../../../lib/lambda_function.zip",
            source_code_hash=Fn.filebase64sha256("../../../lib/lambda_function.zip"),
            timeout=30,
            memory_size=256,
            reserved_concurrent_executions=10,
            vpc_config={
                "subnet_ids": [subnet_eu_private_1a.id, subnet_eu_private_1b.id],
                "security_group_ids": [sg_lambda.id]
            },
            environment={
                "variables": {
                    "DYNAMODB_TABLE": dynamodb_transactions.name,
                    "RDS_ENDPOINT": rds_instance.endpoint
                }
            },
            tags={
                **common_tags,
                "Name": f"payment-processor-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # Lambda CloudWatch Log Group
        lambda_log_group = CloudwatchLogGroup(
            self,
            "lambda-log-group",
            name=f"/aws/lambda/{lambda_function.function_name}",
            retention_in_days=30,
            tags={
                **common_tags,
                "Name": f"payment-lambda-logs-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # ==================== API Gateway ====================

        api_gateway = Apigatewayv2Api(
            self,
            "api-gateway",
            name=f"payment-api-{environment_suffix}-kl",
            protocol_type="HTTP",
            tags={
                **common_tags,
                "Name": f"payment-api-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        api_integration = Apigatewayv2Integration(
            self,
            "api-integration",
            api_id=api_gateway.id,
            integration_type="AWS_PROXY",
            integration_method="POST",
            integration_uri=lambda_function.invoke_arn,
            payload_format_version="2.0",
            provider=provider_eu_west_1
        )

        Apigatewayv2Route(
            self,
            "api-route",
            api_id=api_gateway.id,
            route_key="POST /payment",
            target=f"integrations/{api_integration.id}",
            provider=provider_eu_west_1
        )

        api_stage = Apigatewayv2Stage(
            self,
            "api-stage",
            api_id=api_gateway.id,
            name="prod",
            auto_deploy=True,
            tags={
                **common_tags,
                "Name": f"payment-api-prod-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        LambdaPermission(
            self,
            "lambda-permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=lambda_function.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api_gateway.execution_arn}/*/*",
            provider=provider_eu_west_1
        )

        # API Gateway CloudWatch Log Group
        CloudwatchLogGroup(
            self,
            "api-log-group",
            name=f"/aws/apigateway/{api_gateway.name}-kl",
            retention_in_days=30,
            tags={
                **common_tags,
                "Name": f"payment-api-logs-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # ==================== CloudWatch Dashboard ====================

        CloudwatchDashboard(
            self,
            "cloudwatch-dashboard",
            dashboard_name=f"payment-dashboard-{environment_suffix}-kl",
            dashboard_body=json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Lambda Invocations"}],
                                [".", "Errors", {"stat": "Sum", "label": "Lambda Errors"}],
                                [".", "Duration", {"stat": "Average", "label": "Lambda Duration"}]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "eu-west-1",
                            "title": "Lambda Metrics"
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/RDS", "CPUUtilization", {"stat": "Average", "label": "RDS CPU"}],
                                [".", "DatabaseConnections", {"stat": "Sum", "label": "DB Connections"}]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "eu-west-1",
                            "title": "RDS Metrics"
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum", "label": "Read Capacity"}],
                                [".", "ConsumedWriteCapacityUnits", {"stat": "Sum", "label": "Write Capacity"}]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "eu-west-1",
                            "title": "DynamoDB Metrics"
                        }
                    }
                ]
            }),
            provider=provider_eu_west_1
        )

        # ==================== CloudWatch Alarms ====================

        CloudwatchMetricAlarm(
            self,
            "lambda-error-alarm",
            alarm_name=f"payment-lambda-errors-{environment_suffix}-kl",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when Lambda errors exceed threshold",
            dimensions={
                "FunctionName": lambda_function.function_name
            },
            tags={
                **common_tags,
                "Name": f"payment-lambda-errors-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        CloudwatchMetricAlarm(
            self,
            "rds-cpu-alarm",
            alarm_name=f"payment-rds-cpu-{environment_suffix}-kl",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when RDS CPU exceeds 80%",
            dimensions={
                "DBInstanceIdentifier": rds_instance.identifier
            },
            tags={
                **common_tags,
                "Name": f"payment-rds-cpu-{environment_suffix}-kl",
                "Region": "eu-west-1",
                "MigrationBatch": "batch-1"
            },
            provider=provider_eu_west_1
        )

        # ==================== Outputs ====================

        TerraformOutput(
            self,
            "vpc_eu_central_id",
            value=vpc_eu_central.id,
            description="VPC ID in eu-central-2"
        )

        TerraformOutput(
            self,
            "vpc_eu_id",
            value=vpc_eu.id,
            description="VPC ID in eu-west-1"
        )

        TerraformOutput(
            self,
            "rds_endpoint",
            value=rds_instance.endpoint,
            description="RDS PostgreSQL endpoint"
        )

        TerraformOutput(
            self,
            "dynamodb_table",
            value=dynamodb_transactions.name,
            description="DynamoDB transactions table name"
        )

        TerraformOutput(
            self,
            "lambda_function_arn",
            value=lambda_function.arn,
            description="Lambda function ARN"
        )

        TerraformOutput(
            self,
            "api_gateway_endpoint",
            value=api_gateway.api_endpoint,
            description="API Gateway endpoint URL"
        )

        TerraformOutput(
            self,
            "s3_bucket_eu_central",
            value=s3_bucket_us.bucket,
            description="S3 bucket name in eu-central-2"
        )

        TerraformOutput(
            self,
            "s3_bucket_eu",
            value=s3_bucket_eu.bucket,
            description="S3 bucket name in eu-west-1"
        )


app = App()
TapStack(app, "tap")
app.synth()
