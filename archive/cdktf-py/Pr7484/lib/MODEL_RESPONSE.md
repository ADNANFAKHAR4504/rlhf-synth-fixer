# Multi-Region Disaster Recovery Solution - Model Response

This document contains the complete CDKTF Python implementation for a multi-region disaster recovery solution for payment processing.

## Architecture Overview

The solution implements active-passive disaster recovery across two AWS regions (us-east-1 and us-west-2) with the following components:

- **Networking**: VPCs with 3 AZs, public/private subnets, NAT Gateways, VPC peering
- **Database**: RDS Aurora PostgreSQL 14.x Global Database with writer in primary and reader in secondary
- **Compute**: Lambda functions in both regions for payment webhook processing
- **Storage**: DynamoDB global tables for session data with point-in-time recovery
- **DNS**: Route 53 failover routing with health checks
- **Monitoring**: CloudWatch alarms for replication lag and Lambda errors
- **Security**: Secrets Manager with cross-region replication, least-privilege IAM roles

## File: lib/tap_stack.py

```python
"""Multi-region disaster recovery stack for payment processing using CDKTF Python."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.vpc_peering_connection import VpcPeeringConnection
from cdktf_cdktf_provider_aws.vpc_peering_connection_accepter import VpcPeeringConnectionAccepter
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for multi-region disaster recovery infrastructure."""

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
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Define regions
        primary_region = "us-east-1"
        secondary_region = "us-west-2"
        region_suffix = "use1" if aws_region == primary_region else "usw2"

        # Configure primary AWS Provider
        primary_provider = AwsProvider(
            self,
            "aws_primary",
            region=primary_region,
            default_tags=[default_tags],
            alias="primary"
        )

        # Configure secondary AWS Provider
        secondary_provider = AwsProvider(
            self,
            "aws_secondary",
            region=secondary_region,
            default_tags=[default_tags],
            alias="secondary"
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

        # Get availability zones for primary region
        primary_azs = DataAwsAvailabilityZones(
            self,
            "primary_azs",
            state="available",
            provider=primary_provider
        )

        # Get availability zones for secondary region
        secondary_azs = DataAwsAvailabilityZones(
            self,
            "secondary_azs",
            state="available",
            provider=secondary_provider
        )

        # ===== PRIMARY REGION NETWORKING =====

        # Create VPC in primary region
        primary_vpc = Vpc(
            self,
            "primary_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"payment-vpc-use1-{environment_suffix}"},
            provider=primary_provider
        )

        # Create Internet Gateway for primary VPC
        primary_igw = InternetGateway(
            self,
            "primary_igw",
            vpc_id=primary_vpc.id,
            tags={"Name": f"payment-igw-use1-{environment_suffix}"},
            provider=primary_provider
        )

        # Create private subnets in primary region (3 AZs)
        primary_private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"primary_private_subnet_{i}",
                vpc_id=primary_vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=Fn.element(primary_azs.names, i),
                tags={"Name": f"payment-private-subnet-use1-{i}-{environment_suffix}"},
                provider=primary_provider
            )
            primary_private_subnets.append(subnet)

        # Create public subnets in primary region for NAT Gateways
        primary_public_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"primary_public_subnet_{i}",
                vpc_id=primary_vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=Fn.element(primary_azs.names, i),
                map_public_ip_on_launch=True,
                tags={"Name": f"payment-public-subnet-use1-{i}-{environment_suffix}"},
                provider=primary_provider
            )
            primary_public_subnets.append(subnet)

        # Create public route table for primary region
        primary_public_rt = RouteTable(
            self,
            "primary_public_rt",
            vpc_id=primary_vpc.id,
            tags={"Name": f"payment-public-rt-use1-{environment_suffix}"},
            provider=primary_provider
        )

        # Add route to Internet Gateway
        Route(
            self,
            "primary_public_route",
            route_table_id=primary_public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=primary_igw.id,
            provider=primary_provider
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(primary_public_subnets):
            RouteTableAssociation(
                self,
                f"primary_public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=primary_public_rt.id,
                provider=primary_provider
            )

        # Create NAT Gateways in primary region (one per AZ)
        primary_nat_gateways = []
        for i, subnet in enumerate(primary_public_subnets):
            eip = Eip(
                self,
                f"primary_nat_eip_{i}",
                domain="vpc",
                tags={"Name": f"payment-nat-eip-use1-{i}-{environment_suffix}"},
                provider=primary_provider
            )
            nat_gw = NatGateway(
                self,
                f"primary_nat_gw_{i}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={"Name": f"payment-nat-gw-use1-{i}-{environment_suffix}"},
                provider=primary_provider
            )
            primary_nat_gateways.append(nat_gw)

        # Create private route tables and associate with private subnets
        for i, subnet in enumerate(primary_private_subnets):
            private_rt = RouteTable(
                self,
                f"primary_private_rt_{i}",
                vpc_id=primary_vpc.id,
                tags={"Name": f"payment-private-rt-use1-{i}-{environment_suffix}"},
                provider=primary_provider
            )
            Route(
                self,
                f"primary_private_route_{i}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=primary_nat_gateways[i].id,
                provider=primary_provider
            )
            RouteTableAssociation(
                self,
                f"primary_private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                provider=primary_provider
            )

        # ===== SECONDARY REGION NETWORKING =====

        # Create VPC in secondary region
        secondary_vpc = Vpc(
            self,
            "secondary_vpc",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"payment-vpc-usw2-{environment_suffix}"},
            provider=secondary_provider
        )

        # Create Internet Gateway for secondary VPC
        secondary_igw = InternetGateway(
            self,
            "secondary_igw",
            vpc_id=secondary_vpc.id,
            tags={"Name": f"payment-igw-usw2-{environment_suffix}"},
            provider=secondary_provider
        )

        # Create private subnets in secondary region (3 AZs)
        secondary_private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"secondary_private_subnet_{i}",
                vpc_id=secondary_vpc.id,
                cidr_block=f"10.1.{i}.0/24",
                availability_zone=Fn.element(secondary_azs.names, i),
                tags={"Name": f"payment-private-subnet-usw2-{i}-{environment_suffix}"},
                provider=secondary_provider
            )
            secondary_private_subnets.append(subnet)

        # Create public subnets in secondary region for NAT Gateways
        secondary_public_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"secondary_public_subnet_{i}",
                vpc_id=secondary_vpc.id,
                cidr_block=f"10.1.{10+i}.0/24",
                availability_zone=Fn.element(secondary_azs.names, i),
                map_public_ip_on_launch=True,
                tags={"Name": f"payment-public-subnet-usw2-{i}-{environment_suffix}"},
                provider=secondary_provider
            )
            secondary_public_subnets.append(subnet)

        # Create public route table for secondary region
        secondary_public_rt = RouteTable(
            self,
            "secondary_public_rt",
            vpc_id=secondary_vpc.id,
            tags={"Name": f"payment-public-rt-usw2-{environment_suffix}"},
            provider=secondary_provider
        )

        # Add route to Internet Gateway
        Route(
            self,
            "secondary_public_route",
            route_table_id=secondary_public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=secondary_igw.id,
            provider=secondary_provider
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(secondary_public_subnets):
            RouteTableAssociation(
                self,
                f"secondary_public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=secondary_public_rt.id,
                provider=secondary_provider
            )

        # Create NAT Gateways in secondary region (one per AZ)
        secondary_nat_gateways = []
        for i, subnet in enumerate(secondary_public_subnets):
            eip = Eip(
                self,
                f"secondary_nat_eip_{i}",
                domain="vpc",
                tags={"Name": f"payment-nat-eip-usw2-{i}-{environment_suffix}"},
                provider=secondary_provider
            )
            nat_gw = NatGateway(
                self,
                f"secondary_nat_gw_{i}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={"Name": f"payment-nat-gw-usw2-{i}-{environment_suffix}"},
                provider=secondary_provider
            )
            secondary_nat_gateways.append(nat_gw)

        # Create private route tables and associate with private subnets
        for i, subnet in enumerate(secondary_private_subnets):
            private_rt = RouteTable(
                self,
                f"secondary_private_rt_{i}",
                vpc_id=secondary_vpc.id,
                tags={"Name": f"payment-private-rt-usw2-{i}-{environment_suffix}"},
                provider=secondary_provider
            )
            Route(
                self,
                f"secondary_private_route_{i}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=secondary_nat_gateways[i].id,
                provider=secondary_provider
            )
            RouteTableAssociation(
                self,
                f"secondary_private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                provider=secondary_provider
            )

        # ===== VPC PEERING =====

        # Create VPC peering connection from primary to secondary
        vpc_peering = VpcPeeringConnection(
            self,
            "vpc_peering",
            vpc_id=primary_vpc.id,
            peer_vpc_id=secondary_vpc.id,
            peer_region=secondary_region,
            auto_accept=False,
            tags={"Name": f"payment-vpc-peering-{environment_suffix}"},
            provider=primary_provider
        )

        # Accept VPC peering in secondary region
        VpcPeeringConnectionAccepter(
            self,
            "vpc_peering_accepter",
            vpc_peering_connection_id=vpc_peering.id,
            auto_accept=True,
            tags={"Name": f"payment-vpc-peering-accepter-{environment_suffix}"},
            provider=secondary_provider
        )

        # ===== RDS AURORA GLOBAL DATABASE =====

        # Create security group for RDS in primary region
        primary_rds_sg = SecurityGroup(
            self,
            "primary_rds_sg",
            name=f"payment-rds-sg-use1-{environment_suffix}",
            description="Security group for RDS Aurora PostgreSQL in primary region",
            vpc_id=primary_vpc.id,
            tags={"Name": f"payment-rds-sg-use1-{environment_suffix}"},
            provider=primary_provider
        )

        SecurityGroupRule(
            self,
            "primary_rds_sg_ingress",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=[primary_vpc.cidr_block, secondary_vpc.cidr_block],
            security_group_id=primary_rds_sg.id,
            provider=primary_provider
        )

        SecurityGroupRule(
            self,
            "primary_rds_sg_egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=primary_rds_sg.id,
            provider=primary_provider
        )

        # Create DB subnet group in primary region
        primary_db_subnet_group = DbSubnetGroup(
            self,
            "primary_db_subnet_group",
            name=f"payment-db-subnet-group-use1-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in primary_private_subnets],
            tags={"Name": f"payment-db-subnet-group-use1-{environment_suffix}"},
            provider=primary_provider
        )

        # Create security group for RDS in secondary region
        secondary_rds_sg = SecurityGroup(
            self,
            "secondary_rds_sg",
            name=f"payment-rds-sg-usw2-{environment_suffix}",
            description="Security group for RDS Aurora PostgreSQL in secondary region",
            vpc_id=secondary_vpc.id,
            tags={"Name": f"payment-rds-sg-usw2-{environment_suffix}"},
            provider=secondary_provider
        )

        SecurityGroupRule(
            self,
            "secondary_rds_sg_ingress",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=[primary_vpc.cidr_block, secondary_vpc.cidr_block],
            security_group_id=secondary_rds_sg.id,
            provider=secondary_provider
        )

        SecurityGroupRule(
            self,
            "secondary_rds_sg_egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=secondary_rds_sg.id,
            provider=secondary_provider
        )

        # Create DB subnet group in secondary region
        secondary_db_subnet_group = DbSubnetGroup(
            self,
            "secondary_db_subnet_group",
            name=f"payment-db-subnet-group-usw2-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in secondary_private_subnets],
            tags={"Name": f"payment-db-subnet-group-usw2-{environment_suffix}"},
            provider=secondary_provider
        )

        # Create RDS Global Cluster
        global_cluster = RdsGlobalCluster(
            self,
            "global_cluster",
            global_cluster_identifier=f"payment-global-cluster-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.10",
            database_name="payment_db",
            storage_encrypted=True,
            provider=primary_provider
        )

        # Create primary Aurora cluster
        primary_cluster = RdsCluster(
            self,
            "primary_cluster",
            cluster_identifier=f"payment-cluster-use1-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.10",
            database_name="payment_db",
            master_username="dbadmin",
            master_password="ChangeMe123!",  # In production, use Secrets Manager
            db_subnet_group_name=primary_db_subnet_group.name,
            vpc_security_group_ids=[primary_rds_sg.id],
            global_cluster_identifier=global_cluster.id,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,
            tags={"Name": f"payment-cluster-use1-{environment_suffix}"},
            provider=primary_provider,
            depends_on=[global_cluster]
        )

        # Create primary cluster instances
        for i in range(2):
            RdsClusterInstance(
                self,
                f"primary_cluster_instance_{i}",
                identifier=f"payment-instance-use1-{i}-{environment_suffix}",
                cluster_identifier=primary_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-postgresql",
                publicly_accessible=False,
                tags={"Name": f"payment-instance-use1-{i}-{environment_suffix}"},
                provider=primary_provider
            )

        # Create secondary Aurora cluster
        secondary_cluster = RdsCluster(
            self,
            "secondary_cluster",
            cluster_identifier=f"payment-cluster-usw2-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.10",
            db_subnet_group_name=secondary_db_subnet_group.name,
            vpc_security_group_ids=[secondary_rds_sg.id],
            global_cluster_identifier=global_cluster.id,
            skip_final_snapshot=True,
            tags={"Name": f"payment-cluster-usw2-{environment_suffix}"},
            provider=secondary_provider,
            depends_on=[primary_cluster]
        )

        # Create secondary cluster instances
        for i in range(2):
            RdsClusterInstance(
                self,
                f"secondary_cluster_instance_{i}",
                identifier=f"payment-instance-usw2-{i}-{environment_suffix}",
                cluster_identifier=secondary_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-postgresql",
                publicly_accessible=False,
                tags={"Name": f"payment-instance-usw2-{i}-{environment_suffix}"},
                provider=secondary_provider
            )

        # ===== SECRETS MANAGER =====

        # Create secret for database credentials in primary region
        db_secret = SecretsmanagerSecret(
            self,
            "db_secret",
            name=f"payment/db/credentials-{environment_suffix}",
            description="Database credentials for payment processing",
            replica_region=[{
                "region": secondary_region
            }],
            tags={"Name": f"payment-db-secret-{environment_suffix}"},
            provider=primary_provider
        )

        # Store database credentials
        db_credentials = {
            "username": "dbadmin",
            "password": "ChangeMe123!",
            "engine": "postgres",
            "host": primary_cluster.endpoint,
            "port": 5432,
            "dbname": "payment_db"
        }

        SecretsmanagerSecretVersion(
            self,
            "db_secret_version",
            secret_id=db_secret.id,
            secret_string=json.dumps(db_credentials),
            provider=primary_provider
        )

        # ===== IAM ROLES FOR LAMBDA =====

        # Create IAM role for Lambda in primary region
        primary_lambda_role = IamRole(
            self,
            "primary_lambda_role",
            name=f"payment-lambda-role-use1-{environment_suffix}",
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
            tags={"Name": f"payment-lambda-role-use1-{environment_suffix}"},
            provider=primary_provider
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "primary_lambda_basic_execution",
            role=primary_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=primary_provider
        )

        # Create IAM policy for Lambda to access secrets and DynamoDB
        primary_lambda_policy = IamPolicy(
            self,
            "primary_lambda_policy",
            name=f"payment-lambda-policy-use1-{environment_suffix}",
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
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": f"arn:aws:dynamodb:{primary_region}:*:table/payment-sessions-{environment_suffix}"
                    }
                ]
            }),
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "primary_lambda_policy_attachment",
            role=primary_lambda_role.name,
            policy_arn=primary_lambda_policy.arn,
            provider=primary_provider
        )

        # Create Lambda security group in primary region
        primary_lambda_sg = SecurityGroup(
            self,
            "primary_lambda_sg",
            name=f"payment-lambda-sg-use1-{environment_suffix}",
            description="Security group for Lambda functions in primary region",
            vpc_id=primary_vpc.id,
            tags={"Name": f"payment-lambda-sg-use1-{environment_suffix}"},
            provider=primary_provider
        )

        SecurityGroupRule(
            self,
            "primary_lambda_sg_egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=primary_lambda_sg.id,
            provider=primary_provider
        )

        # Create Lambda function in primary region
        primary_lambda = LambdaFunction(
            self,
            "primary_lambda",
            function_name=f"payment-webhook-handler-use1-{environment_suffix}",
            role=primary_lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            memory_size=1024,
            timeout=30,
            filename="lambda_placeholder.zip",  # Will be replaced with actual deployment package
            source_code_hash=Fn.filebase64sha256("lambda_placeholder.zip"),
            environment={
                "variables": {
                    "REGION": primary_region,
                    "DB_SECRET_ARN": db_secret.arn,
                    "DYNAMODB_TABLE": f"payment-sessions-{environment_suffix}",
                    "ENVIRONMENT": environment_suffix
                }
            },
            vpc_config={
                "subnet_ids": [subnet.id for subnet in primary_private_subnets],
                "security_group_ids": [primary_lambda_sg.id]
            },
            tags={"Name": f"payment-webhook-handler-use1-{environment_suffix}"},
            provider=primary_provider,
            lifecycle={
                "ignore_changes": ["filename", "source_code_hash"]
            }
        )

        # Create IAM role for Lambda in secondary region
        secondary_lambda_role = IamRole(
            self,
            "secondary_lambda_role",
            name=f"payment-lambda-role-usw2-{environment_suffix}",
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
            tags={"Name": f"payment-lambda-role-usw2-{environment_suffix}"},
            provider=secondary_provider
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "secondary_lambda_basic_execution",
            role=secondary_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=secondary_provider
        )

        # Create IAM policy for Lambda to access secrets and DynamoDB
        secondary_lambda_policy = IamPolicy(
            self,
            "secondary_lambda_policy",
            name=f"payment-lambda-policy-usw2-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": f"arn:aws:secretsmanager:{secondary_region}:*:secret:payment/db/credentials-{environment_suffix}-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": f"arn:aws:dynamodb:{secondary_region}:*:table/payment-sessions-{environment_suffix}"
                    }
                ]
            }),
            provider=secondary_provider
        )

        IamRolePolicyAttachment(
            self,
            "secondary_lambda_policy_attachment",
            role=secondary_lambda_role.name,
            policy_arn=secondary_lambda_policy.arn,
            provider=secondary_provider
        )

        # Create Lambda security group in secondary region
        secondary_lambda_sg = SecurityGroup(
            self,
            "secondary_lambda_sg",
            name=f"payment-lambda-sg-usw2-{environment_suffix}",
            description="Security group for Lambda functions in secondary region",
            vpc_id=secondary_vpc.id,
            tags={"Name": f"payment-lambda-sg-usw2-{environment_suffix}"},
            provider=secondary_provider
        )

        SecurityGroupRule(
            self,
            "secondary_lambda_sg_egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=secondary_lambda_sg.id,
            provider=secondary_provider
        )

        # Create Lambda function in secondary region
        secondary_lambda = LambdaFunction(
            self,
            "secondary_lambda",
            function_name=f"payment-webhook-handler-usw2-{environment_suffix}",
            role=secondary_lambda_role.arn,
            handler="index.handler",
            runtime="python3.11",
            memory_size=1024,
            timeout=30,
            filename="lambda_placeholder.zip",
            source_code_hash=Fn.filebase64sha256("lambda_placeholder.zip"),
            environment={
                "variables": {
                    "REGION": secondary_region,
                    "DB_SECRET_ARN": f"arn:aws:secretsmanager:{secondary_region}:*:secret:payment/db/credentials-{environment_suffix}-*",
                    "DYNAMODB_TABLE": f"payment-sessions-{environment_suffix}",
                    "ENVIRONMENT": environment_suffix
                }
            },
            vpc_config={
                "subnet_ids": [subnet.id for subnet in secondary_private_subnets],
                "security_group_ids": [secondary_lambda_sg.id]
            },
            tags={"Name": f"payment-webhook-handler-usw2-{environment_suffix}"},
            provider=secondary_provider,
            lifecycle={
                "ignore_changes": ["filename", "source_code_hash"]
            }
        )

        # ===== DYNAMODB GLOBAL TABLE =====

        # Create DynamoDB table in primary region (will be global table)
        dynamodb_table = DynamodbTable(
            self,
            "dynamodb_table",
            name=f"payment-sessions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="session_id",
            attribute=[{
                "name": "session_id",
                "type": "S"
            }],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery={
                "enabled": True
            },
            replica=[{
                "region_name": secondary_region,
                "point_in_time_recovery": True
            }],
            tags={"Name": f"payment-sessions-{environment_suffix}"},
            provider=primary_provider
        )

        # ===== SNS TOPIC FOR ALARMS =====

        # Create SNS topic for CloudWatch alarms
        alarm_topic = SnsTopic(
            self,
            "alarm_topic",
            name=f"payment-alarms-{environment_suffix}",
            tags={"Name": f"payment-alarms-{environment_suffix}"},
            provider=primary_provider
        )

        # Subscribe email to SNS topic (use a placeholder email)
        SnsTopicSubscription(
            self,
            "alarm_email_subscription",
            topic_arn=alarm_topic.arn,
            protocol="email",
            endpoint="admin@example.com",  # Replace with actual email
            provider=primary_provider
        )

        # ===== CLOUDWATCH ALARMS =====

        # Create CloudWatch alarm for replication lag
        CloudwatchMetricAlarm(
            self,
            "replication_lag_alarm",
            alarm_name=f"payment-replication-lag-{environment_suffix}",
            alarm_description="Alert when Aurora replication lag exceeds 1 second",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=1000,  # 1 second in milliseconds
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "DBClusterIdentifier": secondary_cluster.id
            },
            tags={"Name": f"payment-replication-lag-alarm-{environment_suffix}"},
            provider=primary_provider
        )

        # Create alarm for primary Lambda errors
        CloudwatchMetricAlarm(
            self,
            "primary_lambda_error_alarm",
            alarm_name=f"payment-lambda-errors-use1-{environment_suffix}",
            alarm_description="Alert on Lambda errors in primary region",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "FunctionName": primary_lambda.function_name
            },
            tags={"Name": f"payment-lambda-errors-use1-{environment_suffix}"},
            provider=primary_provider
        )

        # Create alarm for secondary Lambda errors
        CloudwatchMetricAlarm(
            self,
            "secondary_lambda_error_alarm",
            alarm_name=f"payment-lambda-errors-usw2-{environment_suffix}",
            alarm_description="Alert on Lambda errors in secondary region",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "FunctionName": secondary_lambda.function_name
            },
            tags={"Name": f"payment-lambda-errors-usw2-{environment_suffix}"},
            provider=primary_provider
        )

        # ===== ROUTE 53 HEALTH CHECKS AND FAILOVER =====

        # Create private hosted zone (in production, use a real domain)
        hosted_zone = Route53Zone(
            self,
            "hosted_zone",
            name=f"payment-{environment_suffix}.internal",
            vpc=[{
                "vpc_id": primary_vpc.id,
                "vpc_region": primary_region
            }],
            tags={"Name": f"payment-zone-{environment_suffix}"},
            provider=primary_provider
        )

        # Create health check for primary Lambda
        primary_health_check = Route53HealthCheck(
            self,
            "primary_health_check",
            type="CLOUDWATCH_METRIC",
            cloudwatch_alarm_name=CloudwatchMetricAlarm(
                self,
                "primary_health_metric_alarm",
                alarm_name=f"payment-primary-health-{environment_suffix}",
                comparison_operator="LessThanThreshold",
                evaluation_periods=1,
                metric_name="Invocations",
                namespace="AWS/Lambda",
                period=60,
                statistic="Sum",
                threshold=1,
                dimensions={
                    "FunctionName": primary_lambda.function_name
                },
                provider=primary_provider
            ).alarm_name,
            cloudwatch_alarm_region=primary_region,
            insufficient_data_health_status="Unhealthy",
            tags={"Name": f"payment-primary-health-{environment_suffix}"},
            provider=primary_provider
        )

        # Create health check for secondary Lambda
        secondary_health_check = Route53HealthCheck(
            self,
            "secondary_health_check",
            type="CLOUDWATCH_METRIC",
            cloudwatch_alarm_name=CloudwatchMetricAlarm(
                self,
                "secondary_health_metric_alarm",
                alarm_name=f"payment-secondary-health-{environment_suffix}",
                comparison_operator="LessThanThreshold",
                evaluation_periods=1,
                metric_name="Invocations",
                namespace="AWS/Lambda",
                period=60,
                statistic="Sum",
                threshold=1,
                dimensions={
                    "FunctionName": secondary_lambda.function_name
                },
                provider=primary_provider
            ).alarm_name,
            cloudwatch_alarm_region=secondary_region,
            insufficient_data_health_status="Unhealthy",
            tags={"Name": f"payment-secondary-health-{environment_suffix}"},
            provider=primary_provider
        )

        # Create Route 53 record for primary region (PRIMARY failover)
        Route53Record(
            self,
            "primary_route53_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.payment-{environment_suffix}.internal",
            type="CNAME",
            ttl=60,
            records=[primary_cluster.endpoint],
            set_identifier="primary",
            failover_routing_policy={
                "type": "PRIMARY"
            },
            health_check_id=primary_health_check.id,
            provider=primary_provider
        )

        # Create Route 53 record for secondary region (SECONDARY failover)
        Route53Record(
            self,
            "secondary_route53_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.payment-{environment_suffix}.internal",
            type="CNAME",
            ttl=60,
            records=[secondary_cluster.endpoint],
            set_identifier="secondary",
            failover_routing_policy={
                "type": "SECONDARY"
            },
            health_check_id=secondary_health_check.id,
            provider=primary_provider
        )

        # ===== OUTPUTS =====

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
            "primary_cluster_endpoint",
            value=primary_cluster.endpoint,
            description="Primary Aurora cluster endpoint"
        )

        TerraformOutput(
            self,
            "secondary_cluster_endpoint",
            value=secondary_cluster.endpoint,
            description="Secondary Aurora cluster endpoint"
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
            "dynamodb_table_name",
            value=dynamodb_table.name,
            description="DynamoDB global table name"
        )

        TerraformOutput(
            self,
            "route53_zone_id",
            value=hosted_zone.zone_id,
            description="Route 53 hosted zone ID"
        )

        TerraformOutput(
            self,
            "failover_endpoint",
            value=f"api.payment-{environment_suffix}.internal",
            description="Route 53 failover endpoint"
        )

        TerraformOutput(
            self,
            "db_secret_arn",
            value=db_secret.arn,
            description="Database credentials secret ARN"
        )

        TerraformOutput(
            self,
            "alarm_topic_arn",
            value=alarm_topic.arn,
            description="SNS topic ARN for alarms"
        )
```

## File: lib/lambda/index.py

```python
"""Lambda function for payment webhook processing."""

import json
import os
import boto3
from botocore.exceptions import ClientError


# Initialize AWS clients
secretsmanager = boto3.client('secretsmanager')
dynamodb = boto3.resource('dynamodb')


def get_database_credentials():
    """Retrieve database credentials from Secrets Manager."""
    secret_arn = os.environ['DB_SECRET_ARN']

    try:
        response = secretsmanager.get_secret_value(SecretId=secret_arn)
        return json.loads(response['SecretString'])
    except ClientError as e:
        print(f"Error retrieving secret: {e}")
        raise


def store_session_data(session_id, payment_data):
    """Store payment session data in DynamoDB."""
    table_name = os.environ['DYNAMODB_TABLE']
    table = dynamodb.Table(table_name)

    try:
        response = table.put_item(
            Item={
                'session_id': session_id,
                'payment_data': json.dumps(payment_data),
                'region': os.environ['REGION'],
                'environment': os.environ['ENVIRONMENT']
            }
        )
        return response
    except ClientError as e:
        print(f"Error storing session data: {e}")
        raise


def handler(event, context):
    """
    Lambda handler for payment webhook processing.

    This function processes incoming payment webhooks, stores session data
    in DynamoDB, and can interact with the Aurora database if needed.
    """
    print(f"Processing webhook in region: {os.environ['REGION']}")
    print(f"Environment: {os.environ['ENVIRONMENT']}")

    try:
        # Parse incoming webhook payload
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Extract session ID and payment data
        session_id = body.get('session_id', 'unknown')
        payment_data = body.get('payment_data', {})

        print(f"Processing session: {session_id}")

        # Store session data in DynamoDB global table
        store_session_data(session_id, payment_data)

        # In production, you would also:
        # 1. Get database credentials
        # 2. Connect to Aurora database
        # 3. Process payment transaction
        # 4. Update payment status

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment webhook processed successfully',
                'session_id': session_id,
                'region': os.environ['REGION']
            })
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing payment webhook',
                'error': str(e)
            })
        }
```

## Deployment Instructions

### Prerequisites

1. Install CDKTF CLI: `npm install -g cdktf-cli@0.19.0`
2. Install Python 3.9+
3. Install Pipenv: `pip install pipenv`
4. Configure AWS credentials with appropriate permissions

### Installation

```bash
# Install Python dependencies
pipenv install

# Generate CDKTF constructs
cdktf get
```

### Deployment

```bash
# Synthesize the stack
cdktf synth

# Deploy to AWS
cdktf deploy

# View outputs
cdktf output
```

### Lambda Deployment

To deploy the actual Lambda function code:

```bash
# Package Lambda function
cd lib/lambda
zip -r ../../lambda_deployment.zip .
cd ../..

# Update Lambda functions
aws lambda update-function-code \
  --function-name payment-webhook-handler-use1-dev \
  --zip-file fileb://lambda_deployment.zip

aws lambda update-function-code \
  --function-name payment-webhook-handler-usw2-dev \
  --zip-file fileb://lambda_deployment.zip
```

### Testing Failover

To test the disaster recovery failover:

1. Monitor the Route 53 health checks in the AWS Console
2. Simulate primary region failure by stopping the primary Lambda function
3. Verify traffic automatically fails over to the secondary region
4. Check CloudWatch alarms for notifications

### Clean Up

```bash
# Destroy all resources
cdktf destroy
```

## Key Features Implemented

1. Multi-region VPC setup with 3 AZs per region
2. VPC peering for cross-region communication
3. NAT Gateways for outbound internet access
4. RDS Aurora PostgreSQL 14.x Global Database
5. Lambda functions in both regions with 1GB memory
6. DynamoDB global tables with point-in-time recovery
7. Route 53 failover routing with health checks
8. CloudWatch alarms for replication lag and Lambda errors
9. SNS topics for email notifications
10. Secrets Manager with cross-region replication
11. Least-privilege IAM roles
12. Consistent resource naming with region suffixes and environmentSuffix
