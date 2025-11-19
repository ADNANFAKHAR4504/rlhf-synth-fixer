#!/usr/bin/env python3
"""
Multi-Region Disaster Recovery Stack for Payment Processing
Fixed version addressing all issues from MODEL_FAILURES.md
"""
from constructs import Construct
from cdktf import TerraformOutput, TerraformAsset, AssetType
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.security_group import (
    SecurityGroup, SecurityGroupEgress, SecurityGroupIngress
)
from cdktf_cdktf_provider_aws.vpc_peering_connection import VpcPeeringConnection
from cdktf_cdktf_provider_aws.vpc_peering_connection_accepter import VpcPeeringConnectionAccepterA
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable, DynamodbTableAttribute, DynamodbTableReplica,
    DynamodbTableServerSideEncryption, DynamodbTablePointInTimeRecovery
)
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import (
    S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
)
from cdktf_cdktf_provider_aws.s3_bucket_replication_configuration import (
    S3BucketReplicationConfigurationA, S3BucketReplicationConfigurationRule,
    S3BucketReplicationConfigurationRuleDestination,
    S3BucketReplicationConfigurationRuleDestinationReplicationTime,
    S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime,
    S3BucketReplicationConfigurationRuleDestinationMetrics,
    S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold,
    S3BucketReplicationConfigurationRuleDeleteMarkerReplication
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import (
    LambdaFunction, LambdaFunctionVpcConfig, LambdaFunctionEnvironment
)
from cdktf_cdktf_provider_aws.apigatewayv2_api import Apigatewayv2Api
from cdktf_cdktf_provider_aws.apigatewayv2_stage import Apigatewayv2Stage
from cdktf_cdktf_provider_aws.apigatewayv2_integration import Apigatewayv2Integration
from cdktf_cdktf_provider_aws.apigatewayv2_route import Apigatewayv2Route
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
import json
import os
import secrets
import string
import tempfile
import shutil
import hashlib
import time


class MultiRegionDRStack(Construct):
    def __init__(self, scope: Construct, stack_id: str, **kwargs):
        super().__init__(scope, stack_id)

        self.environment_suffix = kwargs.get('environment_suffix', 'test')
        self.primary_region = 'us-east-1'
        self.secondary_region = 'us-east-2'

        # Providers
        self.primary_provider = AwsProvider(
            self, 'aws_primary', 
            region=self.primary_region, 
            alias='primary',
            default_tags=[{
                'tags': {
                    'Environment': self.environment_suffix,
                    'Project': 'payment-dr',
                    'Stack': 'MultiRegionDR'
                }
            }]
        )
        
        self.secondary_provider = AwsProvider(
            self, 'aws_secondary', 
            region=self.secondary_region, 
            alias='secondary',
            default_tags=[{
                'tags': {
                    'Environment': self.environment_suffix,
                    'Project': 'payment-dr',
                    'Stack': 'MultiRegionDR'
                }
            }]
        )

        # Create infrastructure
        self.create_kms_keys()
        self.create_networking()
        self.create_aurora_global()
        self.create_dynamodb_global()
        self.create_s3_replication()
        self.create_lambda_functions()
        self.create_api_gateway()
        self.create_route53_failover()
        self.create_sns_topics()
        self.create_monitoring()
        self.create_outputs()

    def create_kms_keys(self):
        """Create KMS keys for encryption"""
        self.kms_primary = KmsKey(
            self, 'kms_primary', 
            provider=self.primary_provider,
            description=f'DR KMS key primary {self.environment_suffix}',
            deletion_window_in_days=7, 
            enable_key_rotation=True
        )

        KmsAlias(
            self, 'kms_primary_alias', 
            provider=self.primary_provider,
            name=f'alias/dr-primary-{self.environment_suffix}',
            target_key_id=self.kms_primary.key_id
        )

        self.kms_secondary = KmsKey(
            self, 'kms_secondary', 
            provider=self.secondary_provider,
            description=f'DR KMS key secondary {self.environment_suffix}',
            deletion_window_in_days=7, 
            enable_key_rotation=True
        )

        KmsAlias(
            self, 'kms_secondary_alias', 
            provider=self.secondary_provider,
            name=f'alias/dr-secondary-{self.environment_suffix}',
            target_key_id=self.kms_secondary.key_id
        )

    def create_networking(self):
        """Create VPCs and networking with NAT Gateways"""
        # Primary VPC
        self.vpc_primary = Vpc(
            self, 'vpc_primary', 
            provider=self.primary_provider,
            cidr_block='10.0.0.0/16', 
            enable_dns_hostnames=True, 
            enable_dns_support=True,
            tags={'Name': f'vpc-primary-{self.environment_suffix}'}
        )

        self.igw_primary = InternetGateway(
            self, 'igw_primary', 
            provider=self.primary_provider,
            vpc_id=self.vpc_primary.id, 
            tags={'Name': f'igw-primary-{self.environment_suffix}'}
        )

        # Primary PUBLIC subnets (for NAT Gateways)
        self.public_subnets_primary = []
        azs_primary = ['us-east-1a', 'us-east-1b', 'us-east-1c']
        for i, az in enumerate(azs_primary):
            subnet = Subnet(
                self, f'public_subnet_primary_{i}', 
                provider=self.primary_provider,
                vpc_id=self.vpc_primary.id, 
                cidr_block=f'10.0.{i}.0/24',
                availability_zone=az, 
                map_public_ip_on_launch=True,
                tags={'Name': f'public-subnet-primary-{i}-{self.environment_suffix}'}
            )
            self.public_subnets_primary.append(subnet)

        # Primary PRIVATE subnets (for Lambda and RDS)
        self.private_subnets_primary = []
        self.rt_private_primary = []
        self.nat_gateways_primary = []
        for i, az in enumerate(azs_primary):
            subnet = Subnet(
                self, f'private_subnet_primary_{i}', 
                provider=self.primary_provider,
                vpc_id=self.vpc_primary.id, 
                cidr_block=f'10.0.{i+10}.0/24',
                availability_zone=az, 
                map_public_ip_on_launch=False,
                tags={'Name': f'private-subnet-primary-{i}-{self.environment_suffix}'}
            )
            self.private_subnets_primary.append(subnet)

        # Primary route table for public subnets
        self.rt_public_primary = RouteTable(
            self, 'rt_public_primary', 
            provider=self.primary_provider,
            vpc_id=self.vpc_primary.id, 
            tags={'Name': f'rt-public-primary-{self.environment_suffix}'}
        )

        Route(
            self, 'route_primary_igw', 
            provider=self.primary_provider,
            route_table_id=self.rt_public_primary.id, 
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw_primary.id
        )

        for i, subnet in enumerate(self.public_subnets_primary):
            RouteTableAssociation(
                self, f'rta_public_primary_{i}', 
                provider=self.primary_provider,
                subnet_id=subnet.id, 
                route_table_id=self.rt_public_primary.id
            )

        # Create NAT Gateways in primary region
        self.nat_gateways_primary = []
        for i, public_subnet in enumerate(self.public_subnets_primary):
            eip = Eip(
                self, f'nat_eip_primary_{i}',
                provider=self.primary_provider,
                domain='vpc',
                tags={'Name': f'nat-eip-primary-{i}-{self.environment_suffix}'}
            )

            nat = NatGateway(
                self, f'nat_primary_{i}',
                provider=self.primary_provider,
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={'Name': f'nat-primary-{i}-{self.environment_suffix}'}
            )
            self.nat_gateways_primary.append(nat)

            # Create route table for this private subnet
            rt_private = RouteTable(
                self, f'rt_private_primary_{i}',
                provider=self.primary_provider,
                vpc_id=self.vpc_primary.id,
                tags={'Name': f'rt-private-primary-{i}-{self.environment_suffix}'}
            )
            self.rt_private_primary.append(rt_private)

            Route(
                self, f'route_private_nat_primary_{i}',
                provider=self.primary_provider,
                route_table_id=rt_private.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat.id
            )

            RouteTableAssociation(
                self, f'rta_private_primary_{i}',
                provider=self.primary_provider,
                subnet_id=self.private_subnets_primary[i].id,
                route_table_id=rt_private.id
            )

        # Secondary VPC (similar structure)
        self.vpc_secondary = Vpc(
            self, 'vpc_secondary', 
            provider=self.secondary_provider,
            cidr_block='10.1.0.0/16', 
            enable_dns_hostnames=True, 
            enable_dns_support=True,
            tags={'Name': f'vpc-secondary-{self.environment_suffix}'}
        )

        self.igw_secondary = InternetGateway(
            self, 'igw_secondary', 
            provider=self.secondary_provider,
            vpc_id=self.vpc_secondary.id, 
            tags={'Name': f'igw-secondary-{self.environment_suffix}'}
        )

        # Secondary PUBLIC subnets
        self.public_subnets_secondary = []
        azs_secondary = ['us-east-2a', 'us-east-2b', 'us-east-2c']
        for i, az in enumerate(azs_secondary):
            subnet = Subnet(
                self, f'public_subnet_secondary_{i}', 
                provider=self.secondary_provider,
                vpc_id=self.vpc_secondary.id, 
                cidr_block=f'10.1.{i}.0/24',
                availability_zone=az, 
                map_public_ip_on_launch=True,
                tags={'Name': f'public-subnet-secondary-{i}-{self.environment_suffix}'}
            )
            self.public_subnets_secondary.append(subnet)

        # Secondary PRIVATE subnets
        self.private_subnets_secondary = []
        self.rt_private_secondary = []
        self.nat_gateways_secondary = []
        for i, az in enumerate(azs_secondary):
            subnet = Subnet(
                self, f'private_subnet_secondary_{i}', 
                provider=self.secondary_provider,
                vpc_id=self.vpc_secondary.id, 
                cidr_block=f'10.1.{i+10}.0/24',
                availability_zone=az, 
                map_public_ip_on_launch=False,
                tags={'Name': f'private-subnet-secondary-{i}-{self.environment_suffix}'}
            )
            self.private_subnets_secondary.append(subnet)

        # Secondary public route table
        self.rt_public_secondary = RouteTable(
            self, 'rt_public_secondary', 
            provider=self.secondary_provider,
            vpc_id=self.vpc_secondary.id, 
            tags={'Name': f'rt-public-secondary-{self.environment_suffix}'}
        )

        Route(
            self, 'route_secondary_igw', 
            provider=self.secondary_provider,
            route_table_id=self.rt_public_secondary.id, 
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw_secondary.id
        )

        for i, subnet in enumerate(self.public_subnets_secondary):
            RouteTableAssociation(
                self, f'rta_public_secondary_{i}', 
                provider=self.secondary_provider,
                subnet_id=subnet.id, 
                route_table_id=self.rt_public_secondary.id
            )

        # Create NAT Gateways in secondary region
        self.nat_gateways_secondary = []
        for i, public_subnet in enumerate(self.public_subnets_secondary):
            eip = Eip(
                self, f'nat_eip_secondary_{i}',
                provider=self.secondary_provider,
                domain='vpc',
                tags={'Name': f'nat-eip-secondary-{i}-{self.environment_suffix}'}
            )

            nat = NatGateway(
                self, f'nat_secondary_{i}',
                provider=self.secondary_provider,
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={'Name': f'nat-secondary-{i}-{self.environment_suffix}'}
            )
            self.nat_gateways_secondary.append(nat)

            # Create route table for this private subnet
            rt_private = RouteTable(
                self, f'rt_private_secondary_{i}',
                provider=self.secondary_provider,
                vpc_id=self.vpc_secondary.id,
                tags={'Name': f'rt-private-secondary-{i}-{self.environment_suffix}'}
            )
            self.rt_private_secondary.append(rt_private)

            Route(
                self, f'route_private_nat_secondary_{i}',
                provider=self.secondary_provider,
                route_table_id=rt_private.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat.id
            )

            RouteTableAssociation(
                self, f'rta_private_secondary_{i}',
                provider=self.secondary_provider,
                subnet_id=self.private_subnets_secondary[i].id,
                route_table_id=rt_private.id
            )

        # VPC Peering with acceptance
        self.vpc_peering = VpcPeeringConnection(
            self, 'vpc_peering', 
            provider=self.primary_provider,
            vpc_id=self.vpc_primary.id, 
            peer_vpc_id=self.vpc_secondary.id,
            peer_region=self.secondary_region,
            tags={'Name': f'vpc-peering-{self.environment_suffix}'}
        )

        # Accept VPC peering in secondary region
        VpcPeeringConnectionAccepterA(
            self, 'vpc_peering_accepter',
            provider=self.secondary_provider,
            vpc_peering_connection_id=self.vpc_peering.id,
            auto_accept=True,
            tags={'Name': f'vpc-peering-accepter-{self.environment_suffix}'}
        )

        # Add routes for VPC peering in private route tables
        for i in range(len(azs_primary)):
            Route(
                self, f'route_primary_to_secondary_{i}',
                provider=self.primary_provider,
                route_table_id=self.rt_private_primary[i].id,
                destination_cidr_block='10.1.0.0/16',
                vpc_peering_connection_id=self.vpc_peering.id
            )

        for i in range(len(azs_secondary)):
            Route(
                self, f'route_secondary_to_primary_{i}',
                provider=self.secondary_provider,
                route_table_id=self.rt_private_secondary[i].id,
                destination_cidr_block='10.0.0.0/16',
                vpc_peering_connection_id=self.vpc_peering.id
            )

        # Security Groups
        self.sg_lambda_primary = SecurityGroup(
            self, 'sg_lambda_primary', 
            provider=self.primary_provider,
            name=f'lambda-sg-primary-{self.environment_suffix}',
            description='Lambda security group primary',
            vpc_id=self.vpc_primary.id,
            egress=[SecurityGroupEgress(from_port=0, to_port=0, protocol='-1', cidr_blocks=['0.0.0.0/0'])],
            tags={'Name': f'lambda-sg-primary-{self.environment_suffix}'}
        )

        self.sg_rds_primary = SecurityGroup(
            self, 'sg_rds_primary', 
            provider=self.primary_provider,
            name=f'rds-sg-primary-{self.environment_suffix}',
            description='RDS security group primary',
            vpc_id=self.vpc_primary.id,
            ingress=[SecurityGroupIngress(from_port=5432, to_port=5432, protocol='tcp', cidr_blocks=['10.0.0.0/16', '10.1.0.0/16'])],
            egress=[SecurityGroupEgress(from_port=0, to_port=0, protocol='-1', cidr_blocks=['0.0.0.0/0'])],
            tags={'Name': f'rds-sg-primary-{self.environment_suffix}'}
        )

        self.sg_lambda_secondary = SecurityGroup(
            self, 'sg_lambda_secondary', 
            provider=self.secondary_provider,
            name=f'lambda-sg-secondary-{self.environment_suffix}',
            description='Lambda security group secondary',
            vpc_id=self.vpc_secondary.id,
            egress=[SecurityGroupEgress(from_port=0, to_port=0, protocol='-1', cidr_blocks=['0.0.0.0/0'])],
            tags={'Name': f'lambda-sg-secondary-{self.environment_suffix}'}
        )

        self.sg_rds_secondary = SecurityGroup(
            self, 'sg_rds_secondary', 
            provider=self.secondary_provider,
            name=f'rds-sg-secondary-{self.environment_suffix}',
            description='RDS security group secondary',
            vpc_id=self.vpc_secondary.id,
            ingress=[SecurityGroupIngress(from_port=5432, to_port=5432, protocol='tcp', cidr_blocks=['10.0.0.0/16', '10.1.0.0/16'])],
            egress=[SecurityGroupEgress(from_port=0, to_port=0, protocol='-1', cidr_blocks=['0.0.0.0/0'])],
            tags={'Name': f'rds-sg-secondary-{self.environment_suffix}'}
        )

    def generate_secure_password(self, length=32):
        """Generate a secure random password"""
        # RDS password rules: Only printable ASCII characters besides '/', '@', '"', ' '
        # So we exclude those characters from our alphabet
        special_chars = '!#$%^&*()-_=+{}[]|:;<>,.?~'
        alphabet = string.ascii_letters + string.digits + special_chars
        
        # Ensure password has at least one of each type
        password = [
            secrets.choice(string.ascii_uppercase),
            secrets.choice(string.ascii_lowercase), 
            secrets.choice(string.digits),
            secrets.choice(special_chars)
        ]
        
        # Fill the rest with random characters
        for _ in range(length - 4):
            password.append(secrets.choice(alphabet))
        
        # Shuffle the password
        secrets.SystemRandom().shuffle(password)
        return ''.join(password)

    def create_aurora_global(self):
        """Create Aurora Global Database with secure password management"""
        # Generate secure password
        db_password = self.generate_secure_password()

        # Store password in Secrets Manager
        self.db_secret = SecretsmanagerSecret(
            self, 'db_secret',
            provider=self.primary_provider,
            name=f'payment-db-password-{self.environment_suffix}',
            description='Aurora master password for payment processing',
            recovery_window_in_days=7
        )

        SecretsmanagerSecretVersion(
            self, 'db_secret_version',
            provider=self.primary_provider,
            secret_id=self.db_secret.id,
            secret_string=json.dumps({
                'username': 'dbadmin',
                'password': db_password,
                'engine': 'aurora-postgresql',
                'port': 5432
            })
        )

        # DB Subnet Groups
        self.db_subnet_group_primary = DbSubnetGroup(
            self, 'db_subnet_primary', 
            provider=self.primary_provider,
            name=f'payment-db-primary-{self.environment_suffix}',
            subnet_ids=[s.id for s in self.private_subnets_primary],
            tags={'Name': f'db-subnet-primary-{self.environment_suffix}'}
        )

        self.db_subnet_group_secondary = DbSubnetGroup(
            self, 'db_subnet_secondary', 
            provider=self.secondary_provider,
            name=f'payment-db-secondary-{self.environment_suffix}',
            subnet_ids=[s.id for s in self.private_subnets_secondary],
            tags={'Name': f'db-subnet-secondary-{self.environment_suffix}'}
        )

        # Global Cluster
        self.aurora_global = RdsGlobalCluster(
            self, 'aurora_global', 
            provider=self.primary_provider,
            global_cluster_identifier=f'payment-global-{self.environment_suffix}',
            engine='aurora-postgresql', 
            engine_version='14.6',
            database_name='paymentdb', 
            storage_encrypted=True
        )

        # Primary Cluster
        self.aurora_primary = RdsCluster(
            self, 'aurora_primary', 
            provider=self.primary_provider,
            cluster_identifier=f'payment-primary-{self.environment_suffix}',
            engine='aurora-postgresql', 
            engine_version='14.6',
            database_name='paymentdb', 
            master_username='dbadmin',
            master_password=db_password,
            db_subnet_group_name=self.db_subnet_group_primary.name,
            vpc_security_group_ids=[self.sg_rds_primary.id],
            global_cluster_identifier=self.aurora_global.id,
            storage_encrypted=True, 
            kms_key_id=self.kms_primary.arn,
            skip_final_snapshot=True, 
            backup_retention_period=1,
            depends_on=[self.aurora_global],
            lifecycle={'ignore_changes': ['master_password']}
        )

        RdsClusterInstance(
            self, 'aurora_primary_instance_0', 
            provider=self.primary_provider,
            identifier=f'payment-primary-0-{self.environment_suffix}',
            cluster_identifier=self.aurora_primary.id,
            instance_class='db.r6g.large', 
            engine='aurora-postgresql'
        )

        # Secondary Cluster
        self.aurora_secondary = RdsCluster(
            self, 'aurora_secondary', 
            provider=self.secondary_provider,
            cluster_identifier=f'payment-secondary-{self.environment_suffix}',
            engine='aurora-postgresql', 
            engine_version='14.6',
            db_subnet_group_name=self.db_subnet_group_secondary.name,
            vpc_security_group_ids=[self.sg_rds_secondary.id],
            global_cluster_identifier=self.aurora_global.id,
            storage_encrypted=True, 
            kms_key_id=self.kms_secondary.arn,
            skip_final_snapshot=True,
            depends_on=[self.aurora_primary],
            lifecycle={'ignore_changes': ['global_cluster_identifier']}
        )

        RdsClusterInstance(
            self, 'aurora_secondary_instance_0', 
            provider=self.secondary_provider,
            identifier=f'payment-secondary-0-{self.environment_suffix}',
            cluster_identifier=self.aurora_secondary.id,
            instance_class='db.r6g.large', 
            engine='aurora-postgresql'
        )

    def create_dynamodb_global(self):
        """Create DynamoDB Global Table"""
        # Use deterministic suffix based on environment for idempotency
        table_suffix = hashlib.md5(self.environment_suffix.encode()).hexdigest()[:6]
        self.dynamodb_table = DynamodbTable(
            self, 'dynamodb_global', 
            provider=self.primary_provider,
            name=f'payment-sessions-{self.environment_suffix}-{table_suffix}',
            billing_mode='PAY_PER_REQUEST',
            hash_key='sessionId',
            attribute=[DynamodbTableAttribute(name='sessionId', type='S')],
            stream_enabled=True, 
            stream_view_type='NEW_AND_OLD_IMAGES',
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            server_side_encryption=DynamodbTableServerSideEncryption(
                enabled=True, 
                kms_key_arn=self.kms_primary.arn
            ),
            replica=[DynamodbTableReplica(
                region_name=self.secondary_region,
                kms_key_arn=self.kms_secondary.arn,
                point_in_time_recovery=True,
                propagate_tags=True
            )],
            tags={'Name': f'payment-sessions-{self.environment_suffix}'}
        )

    def create_s3_replication(self):
        """Create S3 buckets with cross-region replication"""
        # Generate deterministic unique bucket names based on environment for idempotency
        # Use a fixed prefix to ensure consistency across deployments
        unique_id = hashlib.md5(f"payment-dr-{self.environment_suffix}".encode()).hexdigest()[:8]

        # IAM Role for replication
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "s3.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        self.s3_replication_role = IamRole(
            self, 's3_replication_role', 
            provider=self.primary_provider,
            name=f's3-replication-{self.environment_suffix}',
            assume_role_policy=assume_role_policy
        )

        # S3 Buckets
        self.s3_primary = S3Bucket(
            self, 's3_primary', 
            provider=self.primary_provider,
            bucket=f'payment-data-primary-{self.environment_suffix}-{unique_id}',
            force_destroy=True,
            tags={'Name': f'payment-data-primary-{self.environment_suffix}'}
        )

        self.s3_primary_versioning = S3BucketVersioningA(
            self, 's3_primary_versioning', 
            provider=self.primary_provider,
            bucket=self.s3_primary.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(status='Enabled')
        )

        self.s3_secondary = S3Bucket(
            self, 's3_secondary', 
            provider=self.secondary_provider,
            bucket=f'payment-data-secondary-{self.environment_suffix}-{unique_id}',
            force_destroy=True,
            tags={'Name': f'payment-data-secondary-{self.environment_suffix}'}
        )

        self.s3_secondary_versioning = S3BucketVersioningA(
            self, 's3_secondary_versioning', 
            provider=self.secondary_provider,
            bucket=self.s3_secondary.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(status='Enabled')
        )

        # Replication policy
        policy_doc = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetReplicationConfiguration",
                        "s3:ListBucket"
                    ],
                    "Resource": self.s3_primary.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObjectVersionForReplication",
                        "s3:GetObjectVersionAcl",
                        "s3:GetObjectVersionTagging"
                    ],
                    "Resource": f"{self.s3_primary.arn}/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ReplicateObject",
                        "s3:ReplicateDelete",
                        "s3:ReplicateTags"
                    ],
                    "Resource": f"{self.s3_secondary.arn}/*"
                }
            ]
        })

        replication_policy = IamPolicy(
            self, 's3_replication_policy', 
            provider=self.primary_provider,
            name=f's3-replication-policy-{self.environment_suffix}',
            policy=policy_doc
        )

        IamRolePolicyAttachment(
            self, 's3_replication_attach', 
            provider=self.primary_provider,
            role=self.s3_replication_role.name, 
            policy_arn=replication_policy.arn
        )

        # Replication Configuration with delete marker replication
        self.s3_replication_config = S3BucketReplicationConfigurationA(
            self, 's3_replication_config', 
            provider=self.primary_provider,
            bucket=self.s3_primary.id, 
            role=self.s3_replication_role.arn,
            depends_on=[self.s3_primary_versioning, self.s3_secondary_versioning],
            rule=[S3BucketReplicationConfigurationRule(
                id='replication-rule', 
                status='Enabled', 
                priority=1,
                delete_marker_replication=S3BucketReplicationConfigurationRuleDeleteMarkerReplication(
                    status='Enabled'
                ),
                filter={},
                destination=S3BucketReplicationConfigurationRuleDestination(
                    bucket=self.s3_secondary.arn,
                    replication_time=S3BucketReplicationConfigurationRuleDestinationReplicationTime(
                        status='Enabled',
                        time=S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime(minutes=15)
                    ),
                    metrics=S3BucketReplicationConfigurationRuleDestinationMetrics(
                        status='Enabled',
                        event_threshold=S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold(
                            minutes=15
                        )
                    )
                )
            )]
        )

    def create_lambda_functions(self):
        """Create Lambda functions in both regions"""
        # Create TerraformAsset for Lambda code
        lambda_code_path = os.path.join(os.path.dirname(__file__), "..", "lambda")
        self.lambda_asset = TerraformAsset(
            self, "lambda-asset",
            path=lambda_code_path,
            type=AssetType.ARCHIVE
        )
        
        # Lambda execution roles
        lambda_assume_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        # Primary Lambda role and policies
        self.lambda_role_primary = IamRole(
            self, 'lambda_role_primary', 
            provider=self.primary_provider,
            name=f'lambda-exec-primary-{self.environment_suffix}',
            assume_role_policy=lambda_assume_policy
        )

        IamRolePolicyAttachment(
            self, 'lambda_basic_primary', 
            provider=self.primary_provider,
            role=self.lambda_role_primary.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        )

        IamRolePolicyAttachment(
            self, 'lambda_vpc_primary', 
            provider=self.primary_provider,
            role=self.lambda_role_primary.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
        )

        # Add DynamoDB and RDS access policies
        lambda_db_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": self.dynamodb_table.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue"
                    ],
                    "Resource": self.db_secret.arn
                }
            ]
        })

        lambda_db_policy_primary = IamPolicy(
            self, 'lambda_db_policy_primary',
            provider=self.primary_provider,
            name=f'lambda-db-policy-primary-{self.environment_suffix}',
            policy=lambda_db_policy
        )

        IamRolePolicyAttachment(
            self, 'lambda_db_attach_primary',
            provider=self.primary_provider,
            role=self.lambda_role_primary.name,
            policy_arn=lambda_db_policy_primary.arn
        )

        # Secondary Lambda role
        self.lambda_role_secondary = IamRole(
            self, 'lambda_role_secondary', 
            provider=self.secondary_provider,
            name=f'lambda-exec-secondary-{self.environment_suffix}',
            assume_role_policy=lambda_assume_policy
        )

        IamRolePolicyAttachment(
            self, 'lambda_basic_secondary', 
            provider=self.secondary_provider,
            role=self.lambda_role_secondary.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        )

        IamRolePolicyAttachment(
            self, 'lambda_vpc_secondary', 
            provider=self.secondary_provider,
            role=self.lambda_role_secondary.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
        )

        lambda_db_policy_secondary = IamPolicy(
            self, 'lambda_db_policy_secondary',
            provider=self.secondary_provider,
            name=f'lambda-db-policy-secondary-{self.environment_suffix}',
            policy=lambda_db_policy
        )

        IamRolePolicyAttachment(
            self, 'lambda_db_attach_secondary',
            provider=self.secondary_provider,
            role=self.lambda_role_secondary.name,
            policy_arn=lambda_db_policy_secondary.arn
        )

        # Lambda functions deployed in PRIVATE subnets with NAT Gateway access
        self.lambda_primary = LambdaFunction(
            self, 'lambda_primary', 
            provider=self.primary_provider,
            function_name=f'payment-processor-primary-{self.environment_suffix}',
            runtime='python3.11', 
            handler='payment_processor.lambda_handler',
            role=self.lambda_role_primary.arn,
            filename=self.lambda_asset.path,
            source_code_hash=self.lambda_asset.asset_hash,
            timeout=30, 
            memory_size=512,
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=[s.id for s in self.private_subnets_primary],
                security_group_ids=[self.sg_lambda_primary.id]
            ),
            environment=LambdaFunctionEnvironment(variables={
                'DB_ENDPOINT': self.aurora_primary.endpoint,
                'DYNAMODB_TABLE': self.dynamodb_table.name,
                'REGION': self.primary_region,
                'DB_SECRET_ARN': self.db_secret.arn
            }),
            tags={'Name': f'payment-processor-primary-{self.environment_suffix}'}
        )

        self.lambda_secondary = LambdaFunction(
            self, 'lambda_secondary', 
            provider=self.secondary_provider,
            function_name=f'payment-processor-secondary-{self.environment_suffix}',
            runtime='python3.11', 
            handler='payment_processor.lambda_handler',
            role=self.lambda_role_secondary.arn,
            filename=self.lambda_asset.path,
            source_code_hash=self.lambda_asset.asset_hash,
            timeout=30, 
            memory_size=512,
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=[s.id for s in self.private_subnets_secondary],
                security_group_ids=[self.sg_lambda_secondary.id]
            ),
            environment=LambdaFunctionEnvironment(variables={
                'DB_ENDPOINT': self.aurora_secondary.endpoint,
                'DYNAMODB_TABLE': self.dynamodb_table.name,
                'REGION': self.secondary_region,
                'DB_SECRET_ARN': self.db_secret.arn
            }),
            tags={'Name': f'payment-processor-secondary-{self.environment_suffix}'}
        )

    def create_health_lambda(self):
        """Create a simple health check Lambda function"""
        # Create a temporary directory for health lambda
        import tempfile
        import shutil
        
        health_lambda_dir = tempfile.mkdtemp()
        health_lambda_file = os.path.join(health_lambda_dir, 'index.py')
        
        # Write health check code to file
        health_check_code = """import json

def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'status': 'healthy'})
    }
"""
        
        with open(health_lambda_file, 'w') as f:
            f.write(health_check_code)
        
        # Create asset for health check as archive
        self.health_asset = TerraformAsset(
            self, "health-lambda-asset",
            path=health_lambda_dir,
            type=AssetType.ARCHIVE
        )
        
        # Create health check Lambda in primary region
        self.lambda_health_primary = LambdaFunction(
            self, 'lambda_health_primary',
            provider=self.primary_provider,
            function_name=f'payment-health-primary-{self.environment_suffix}',
            runtime='python3.11',
            handler='index.lambda_handler',
            role=self.lambda_role_primary.arn,
            filename=self.health_asset.path,
            source_code_hash=self.health_asset.asset_hash,
            timeout=5,
            memory_size=128,
            tags={'Name': f'payment-health-primary-{self.environment_suffix}'}
        )

        return self.lambda_health_primary

    def create_api_gateway(self):
        """Create API Gateway in both regions with health endpoint"""
        # Create health check Lambda
        health_lambda = self.create_health_lambda()

        # Primary API
        self.api_primary = Apigatewayv2Api(
            self, 'api_primary', 
            provider=self.primary_provider,
            name=f'payment-api-primary-{self.environment_suffix}',
            protocol_type='HTTP',
            tags={'Name': f'payment-api-primary-{self.environment_suffix}'}
        )

        # Payment processing integration
        integration_primary = Apigatewayv2Integration(
            self, 'api_integration_primary', 
            provider=self.primary_provider,
            api_id=self.api_primary.id, 
            integration_type='AWS_PROXY',
            integration_uri=self.lambda_primary.arn,
            integration_method='POST', 
            payload_format_version='2.0'
        )

        Apigatewayv2Route(
            self, 'api_route_primary', 
            provider=self.primary_provider,
            api_id=self.api_primary.id, 
            route_key='POST /process',
            target=f'integrations/{integration_primary.id}'
        )

        # Health check integration
        integration_health_primary = Apigatewayv2Integration(
            self, 'api_integration_health_primary',
            provider=self.primary_provider,
            api_id=self.api_primary.id,
            integration_type='AWS_PROXY',
            integration_uri=health_lambda.arn,
            integration_method='GET',
            payload_format_version='2.0'
        )

        Apigatewayv2Route(
            self, 'api_route_health_primary',
            provider=self.primary_provider,
            api_id=self.api_primary.id,
            route_key='GET /health',
            target=f'integrations/{integration_health_primary.id}'
        )

        self.api_stage_primary = Apigatewayv2Stage(
            self, 'api_stage_primary', 
            provider=self.primary_provider,
            api_id=self.api_primary.id, 
            name='prod', 
            auto_deploy=True
        )

        LambdaPermission(
            self, 'lambda_permission_primary', 
            provider=self.primary_provider,
            statement_id='AllowAPIGatewayInvoke', 
            action='lambda:InvokeFunction',
            function_name=self.lambda_primary.function_name,
            principal='apigateway.amazonaws.com',
            source_arn=f'{self.api_primary.execution_arn}/*/*'
        )

        LambdaPermission(
            self, 'lambda_permission_health_primary',
            provider=self.primary_provider,
            statement_id='AllowAPIGatewayHealthInvoke',
            action='lambda:InvokeFunction',
            function_name=health_lambda.function_name,
            principal='apigateway.amazonaws.com',
            source_arn=f'{self.api_primary.execution_arn}/*/*'
        )

        # Secondary API
        self.api_secondary = Apigatewayv2Api(
            self, 'api_secondary', 
            provider=self.secondary_provider,
            name=f'payment-api-secondary-{self.environment_suffix}',
            protocol_type='HTTP',
            tags={'Name': f'payment-api-secondary-{self.environment_suffix}'}
        )

        integration_secondary = Apigatewayv2Integration(
            self, 'api_integration_secondary', 
            provider=self.secondary_provider,
            api_id=self.api_secondary.id, 
            integration_type='AWS_PROXY',
            integration_uri=self.lambda_secondary.arn,
            integration_method='POST', 
            payload_format_version='2.0'
        )

        Apigatewayv2Route(
            self, 'api_route_secondary', 
            provider=self.secondary_provider,
            api_id=self.api_secondary.id, 
            route_key='POST /process',
            target=f'integrations/{integration_secondary.id}'
        )

        # Health endpoint for secondary
        Apigatewayv2Route(
            self, 'api_route_health_secondary',
            provider=self.secondary_provider,
            api_id=self.api_secondary.id,
            route_key='GET /health',
            target=f'integrations/{integration_secondary.id}'  # Reuse payment lambda for simplicity
        )

        self.api_stage_secondary = Apigatewayv2Stage(
            self, 'api_stage_secondary', 
            provider=self.secondary_provider,
            api_id=self.api_secondary.id, 
            name='prod', 
            auto_deploy=True
        )

        LambdaPermission(
            self, 'lambda_permission_secondary', 
            provider=self.secondary_provider,
            statement_id='AllowAPIGatewayInvoke', 
            action='lambda:InvokeFunction',
            function_name=self.lambda_secondary.function_name,
            principal='apigateway.amazonaws.com',
            source_arn=f'{self.api_secondary.execution_arn}/*/*'
        )

    def create_route53_failover(self):
        """Create Route 53 failover with health checks and DNS records"""
        # Create hosted zone with non-reserved domain
        self.hosted_zone = Route53Zone(
            self, 'payment_zone',
            provider=self.primary_provider,
            name=f'payment-system-{self.environment_suffix}.internal',
            tags={'Name': f'payment-zone-{self.environment_suffix}'}
        )

        # Create health check for primary region
        self.health_check = Route53HealthCheck(
            self, 'health_check_primary', 
            provider=self.primary_provider,
            type='HTTPS', 
            resource_path='/prod/health',
            fqdn=f'{self.api_primary.id}.execute-api.{self.primary_region}.amazonaws.com',
            port=443, 
            failure_threshold=3, 
            request_interval=30,
            tags={'Name': f'health-check-primary-{self.environment_suffix}'}
        )

        # Primary region DNS record with PRIMARY failover
        Route53Record(
            self, 'api_primary_record',
            provider=self.primary_provider,
            zone_id=self.hosted_zone.zone_id,
            name=f'api.payment-system-{self.environment_suffix}.internal',
            type='CNAME',
            ttl=60,
            records=[f'{self.api_primary.id}.execute-api.{self.primary_region}.amazonaws.com'],
            set_identifier='primary',
            failover_routing_policy={'type': 'PRIMARY'},
            health_check_id=self.health_check.id
        )

        # Secondary region DNS record with SECONDARY failover
        Route53Record(
            self, 'api_secondary_record',
            provider=self.primary_provider,
            zone_id=self.hosted_zone.zone_id,
            name=f'api.payment-system-{self.environment_suffix}.internal',
            type='CNAME',
            ttl=60,
            records=[f'{self.api_secondary.id}.execute-api.{self.secondary_region}.amazonaws.com'],
            set_identifier='secondary',
            failover_routing_policy={'type': 'SECONDARY'}
        )

    def create_monitoring(self):
        """Create CloudWatch monitoring with alarm actions"""
        # Create detailed dashboard
        dashboard_body = json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "CPUUtilization", {"region": self.primary_region}],
                            ["...", {"region": self.secondary_region}]
                        ],
                        "period": 300, 
                        "stat": "Average", 
                        "region": self.primary_region,
                        "title": "Aurora CPU Utilization"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"region": self.primary_region}],
                            ["...", {"region": self.secondary_region}],
                            [".", "Errors", {"region": self.primary_region}],
                            ["...", {"region": self.secondary_region}]
                        ],
                        "period": 60,
                        "stat": "Sum",
                        "region": self.primary_region,
                        "title": "Lambda Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/S3", "ReplicationLatency", {"region": self.primary_region}]
                        ],
                        "period": 300,
                        "stat": "Maximum",
                        "region": self.primary_region,
                        "title": "S3 Replication Lag"
                    }
                }
            ]
        })

        CloudwatchDashboard(
            self, 'dashboard', 
            provider=self.primary_provider,
            dashboard_name=f'payment-dr-{self.environment_suffix}',
            dashboard_body=dashboard_body
        )

        # Create alarm with SNS action
        CloudwatchMetricAlarm(
            self, 'health_alarm', 
            provider=self.primary_provider,
            alarm_name=f'primary-health-alarm-{self.environment_suffix}',
            comparison_operator='LessThanThreshold', 
            evaluation_periods=2,
            metric_name='HealthCheckStatus', 
            namespace='AWS/Route53',
            period=60, 
            statistic='Minimum', 
            threshold=1.0,
            alarm_description='Primary region health check failed',
            alarm_actions=[self.sns_primary.arn],
            ok_actions=[self.sns_primary.arn],
            treat_missing_data='breaching',
            dimensions={'HealthCheckId': self.health_check.id}
        )

        # Aurora replication lag alarm
        CloudwatchMetricAlarm(
            self, 'aurora_lag_alarm',
            provider=self.primary_provider,
            alarm_name=f'aurora-replication-lag-{self.environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='AuroraGlobalDBReplicationLag',
            namespace='AWS/RDS',
            period=60,
            statistic='Maximum',
            threshold=30000,  # 30 seconds in milliseconds
            alarm_description='Aurora replication lag exceeds 30 seconds',
            alarm_actions=[self.sns_primary.arn],
            dimensions={
                'DBClusterIdentifier': self.aurora_primary.cluster_identifier
            }
        )

    def create_sns_topics(self):
        """Create SNS topics for notifications"""
        self.sns_primary = SnsTopic(
            self, 'sns_primary', 
            provider=self.primary_provider,
            name=f'payment-notifications-primary-{self.environment_suffix}',
            display_name='Payment Notifications Primary',
            kms_master_key_id=self.kms_primary.arn,
            tags={'Name': f'payment-notifications-primary-{self.environment_suffix}'}
        )

        self.sns_secondary = SnsTopic(
            self, 'sns_secondary', 
            provider=self.secondary_provider,
            name=f'payment-notifications-secondary-{self.environment_suffix}',
            display_name='Payment Notifications Secondary',
            kms_master_key_id=self.kms_secondary.arn,
            tags={'Name': f'payment-notifications-secondary-{self.environment_suffix}'}
        )

    def create_outputs(self):
        """Create outputs - outputs are now defined at the TapStack level"""
        # Outputs moved to TapStack to avoid prefix issues
        pass
