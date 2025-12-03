"""TAP Stack module for CDKTF Python infrastructure - Zero-downtime migration orchestration."""

import json
import os

from cdktf import (AssetType, Fn, S3Backend, TerraformAsset, TerraformStack,
                   Token)
from cdktf_cdktf_provider_aws.api_gateway_authorizer import \
    ApiGatewayAuthorizer
from cdktf_cdktf_provider_aws.api_gateway_deployment import \
    ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_integration import \
    ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_log_metric_filter import \
    CloudwatchLogMetricFilter
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import \
    CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.dms_endpoint import DmsEndpoint
from cdktf_cdktf_provider_aws.dms_replication_instance import \
    DmsReplicationInstance
from cdktf_cdktf_provider_aws.dms_replication_subnet_group import \
    DmsReplicationSubnetGroup
from cdktf_cdktf_provider_aws.dms_replication_task import DmsReplicationTask
from cdktf_cdktf_provider_aws.ec2_transit_gateway import Ec2TransitGateway
from cdktf_cdktf_provider_aws.ec2_transit_gateway_vpc_attachment import \
    Ec2TransitGatewayVpcAttachment
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import \
    RouteTableAssociation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import \
    S3BucketServerSideEncryptionConfigurationA
from cdktf_cdktf_provider_aws.s3_bucket_versioning import (
    S3BucketVersioningA, S3BucketVersioningVersioningConfiguration)
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_rotation import \
    SecretsmanagerSecretRotation
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import \
    SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.security_group import (SecurityGroup,
                                                     SecurityGroupEgress,
                                                     SecurityGroupIngress)
from cdktf_cdktf_provider_aws.sfn_state_machine import SfnStateMachine
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import \
    SnsTopicSubscription
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_random.password import Password
from cdktf_cdktf_provider_random.provider import RandomProvider
from constructs import Construct


class TapStack(TerraformStack):
    """CDKTF Python stack for zero-downtime migration orchestration."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        RandomProvider(self, "random")

        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        self.add_override("terraform.backend.s3.use_lockfile", True)

        availability_zones = [f"{aws_region}a", f"{aws_region}b", f"{aws_region}c"]
        # Allow disabling transit gateway creation (avoids account TGW limits during testing)
        create_transit_gateway = kwargs.get(
            'enable_transit_gateway',
            os.getenv('ENABLE_TRANSIT_GATEWAY', 'false').lower() == 'true'
        )

        production_vpc = Vpc(
            self,
            f"production_vpc_{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"production-vpc-{environment_suffix}"}
        )

        migration_vpc = Vpc(
            self,
            f"migration_vpc_{environment_suffix}",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"migration-vpc-{environment_suffix}"}
        )

        prod_public_subnets = []
        prod_private_subnets = []
        prod_dms_subnets = []

        for i, az in enumerate(availability_zones):
            public_subnet = Subnet(
                self,
                f"prod_public_subnet_{i}_{environment_suffix}",
                vpc_id=production_vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"public-subnet-{i}-{environment_suffix}"}
            )
            prod_public_subnets.append(public_subnet)

            private_subnet = Subnet(
                self,
                f"prod_private_subnet_{i}_{environment_suffix}",
                vpc_id=production_vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={"Name": f"private-subnet-{i}-{environment_suffix}"}
            )
            prod_private_subnets.append(private_subnet)

            dms_subnet = Subnet(
                self,
                f"prod_dms_subnet_{i}_{environment_suffix}",
                vpc_id=production_vpc.id,
                cidr_block=f"10.0.{i+20}.0/24",
                availability_zone=az,
                tags={"Name": f"dms-subnet-{i}-{environment_suffix}"}
            )
            prod_dms_subnets.append(dms_subnet)

        mig_public_subnets = []
        mig_private_subnets = []
        mig_dms_subnets = []

        for i, az in enumerate(availability_zones):
            public_subnet = Subnet(
                self,
                f"mig_public_subnet_{i}_{environment_suffix}",
                vpc_id=migration_vpc.id,
                cidr_block=f"10.1.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"mig-public-subnet-{i}-{environment_suffix}"}
            )
            mig_public_subnets.append(public_subnet)

            private_subnet = Subnet(
                self,
                f"mig_private_subnet_{i}_{environment_suffix}",
                vpc_id=migration_vpc.id,
                cidr_block=f"10.1.{i+10}.0/24",
                availability_zone=az,
                tags={"Name": f"mig-private-subnet-{i}-{environment_suffix}"}
            )
            mig_private_subnets.append(private_subnet)

            dms_subnet = Subnet(
                self,
                f"mig_dms_subnet_{i}_{environment_suffix}",
                vpc_id=migration_vpc.id,
                cidr_block=f"10.1.{i+20}.0/24",
                availability_zone=az,
                tags={"Name": f"mig-dms-subnet-{i}-{environment_suffix}"}
            )
            mig_dms_subnets.append(dms_subnet)

        prod_igw = InternetGateway(
            self,
            f"prod_igw_{environment_suffix}",
            vpc_id=production_vpc.id,
            tags={"Name": f"igw-{environment_suffix}"}
        )

        mig_igw = InternetGateway(
            self,
            f"mig_igw_{environment_suffix}",
            vpc_id=migration_vpc.id,
            tags={"Name": f"mig-igw-{environment_suffix}"}
        )

        prod_public_rt = RouteTable(
            self,
            f"prod_public_rt_{environment_suffix}",
            vpc_id=production_vpc.id,
            tags={"Name": f"public-rt-{environment_suffix}"}
        )

        Route(
            self,
            f"prod_public_route_{environment_suffix}",
            route_table_id=prod_public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=prod_igw.id
        )

        for i, subnet in enumerate(prod_public_subnets):
            RouteTableAssociation(
                self,
                f"prod_public_rt_assoc_{i}_{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=prod_public_rt.id
            )

        mig_public_rt = RouteTable(
            self,
            f"mig_public_rt_{environment_suffix}",
            vpc_id=migration_vpc.id,
            tags={"Name": f"mig-public-rt-{environment_suffix}"}
        )

        Route(
            self,
            f"mig_public_route_{environment_suffix}",
            route_table_id=mig_public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=mig_igw.id
        )

        for i, subnet in enumerate(mig_public_subnets):
            RouteTableAssociation(
                self,
                f"mig_public_rt_assoc_{i}_{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=mig_public_rt.id
            )

        prod_nat_eip = Eip(
            self,
            f"prod_nat_eip_{environment_suffix}",
            domain="vpc",
            tags={"Name": f"nat-eip-{environment_suffix}"}
        )

        prod_nat = NatGateway(
            self,
            f"prod_nat_{environment_suffix}",
            allocation_id=prod_nat_eip.id,
            subnet_id=prod_public_subnets[0].id,
            tags={"Name": f"nat-{environment_suffix}"}
        )

        mig_nat_eip = Eip(
            self,
            f"mig_nat_eip_{environment_suffix}",
            domain="vpc",
            tags={"Name": f"mig-nat-eip-{environment_suffix}"}
        )

        mig_nat = NatGateway(
            self,
            f"mig_nat_{environment_suffix}",
            allocation_id=mig_nat_eip.id,
            subnet_id=mig_public_subnets[0].id,
            tags={"Name": f"mig-nat-{environment_suffix}"}
        )

        prod_private_rt = RouteTable(
            self,
            f"prod_private_rt_{environment_suffix}",
            vpc_id=production_vpc.id,
            tags={"Name": f"private-rt-{environment_suffix}"}
        )

        Route(
            self,
            f"prod_private_route_{environment_suffix}",
            route_table_id=prod_private_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=prod_nat.id
        )

        for i, subnet in enumerate(prod_private_subnets):
            RouteTableAssociation(
                self,
                f"prod_private_rt_assoc_{i}_{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=prod_private_rt.id
            )

        mig_private_rt = RouteTable(
            self,
            f"mig_private_rt_{environment_suffix}",
            vpc_id=migration_vpc.id,
            tags={"Name": f"mig-private-rt-{environment_suffix}"}
        )

        Route(
            self,
            f"mig_private_route_{environment_suffix}",
            route_table_id=mig_private_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=mig_nat.id
        )

        for i, subnet in enumerate(mig_private_subnets):
            RouteTableAssociation(
                self,
                f"mig_private_rt_assoc_{i}_{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=mig_private_rt.id
            )

        if create_transit_gateway:
            transit_gateway = Ec2TransitGateway(
                self,
                f"transit_gateway_{environment_suffix}",
                description=f"Transit Gateway for migration - {environment_suffix}",
                default_route_table_association="enable",
                default_route_table_propagation="enable",
                tags={"Name": f"migration-tgw-{environment_suffix}"}
            )

            prod_tgw_attachment = Ec2TransitGatewayVpcAttachment(
                self,
                f"prod_tgw_attachment_{environment_suffix}",
                subnet_ids=[s.id for s in prod_private_subnets],
                transit_gateway_id=transit_gateway.id,
                vpc_id=production_vpc.id,
                tags={"Name": f"tgw-attachment-{environment_suffix}"}
            )

            mig_tgw_attachment = Ec2TransitGatewayVpcAttachment(
                self,
                f"mig_tgw_attachment_{environment_suffix}",
                subnet_ids=[s.id for s in mig_private_subnets],
                transit_gateway_id=transit_gateway.id,
                vpc_id=migration_vpc.id,
                tags={"Name": f"mig-tgw-attachment-{environment_suffix}"}
            )

        db_security_group = SecurityGroup(
            self,
            f"db_security_group_{environment_suffix}",
            name=f"db-sg-{environment_suffix}",
            description="Security group for Aurora PostgreSQL",
            vpc_id=migration_vpc.id,
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
            tags={"Name": f"db-sg-{environment_suffix}"}
        )

        db_subnet_group = DbSubnetGroup(
            self,
            f"db_subnet_group_{environment_suffix}",
            name=f"aurora-subnet-group-{environment_suffix}",
            subnet_ids=[s.id for s in mig_private_subnets],
            tags={"Name": f"aurora-subnet-group-{environment_suffix}"}
        )

        db_master_secret = SecretsmanagerSecret(
            self,
            f"db_master_secret_{environment_suffix}",
            name=f"migration/aurora/master-{environment_suffix}",
            description=f"Master credentials for Aurora PostgreSQL - {environment_suffix}",
            recovery_window_in_days=0
        )

        db_password = Password(
            self,
            f"db_master_password_{environment_suffix}",
            length=32,
            special=True,
            override_special="!#$&*()-_=[]{}:?"
        )

        db_credentials = {
            "username": "migrationadmin",
            "password": db_password.result,
            "engine": "postgres",
            "port": 5432,
            "dbname": "payments"
        }

        SecretsmanagerSecretVersion(
            self,
            f"db_master_secret_version_{environment_suffix}",
            secret_id=db_master_secret.id,
            secret_string=Fn.jsonencode(db_credentials)
        )

        aurora_cluster = RdsCluster(
            self,
            f"aurora_cluster_{environment_suffix}",
            cluster_identifier=f"aurora-cluster-{environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            database_name="payments",
            master_username=db_credentials["username"],
            master_password=db_credentials["password"],
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[db_security_group.id],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            storage_encrypted=True,
            skip_final_snapshot=True,
            enabled_cloudwatch_logs_exports=["postgresql"],
            tags={"Name": f"aurora-cluster-{environment_suffix}"}
        )

        for i in range(2):
            RdsClusterInstance(
                self,
                f"aurora_instance_{i}_{environment_suffix}",
                identifier=f"aurora-instance-{i}-{environment_suffix}",
                cluster_identifier=aurora_cluster.id,
                instance_class="db.r6g.large",
                engine=aurora_cluster.engine,
                publicly_accessible=False,
                tags={"Name": f"aurora-instance-{i}-{environment_suffix}"}
            )

        dms_security_group = SecurityGroup(
            self,
            f"dms_security_group_{environment_suffix}",
            name=f"dms-sg-{environment_suffix}",
            description="Security group for DMS replication instances",
            vpc_id=migration_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
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
            tags={"Name": f"dms-sg-{environment_suffix}"}
        )

        # Create IAM role and attach the AmazonDMSVPCManagementRole before creating DMS subnet group
        dms_role = IamRole(
            self,
            f"dms_role_{environment_suffix}",
            name=f"dms-vpc-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "dms.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"dms-vpc-role-{environment_suffix}"}
        )

        dms_vpc_policy_attachment = IamRolePolicyAttachment(
            self,
            f"dms_vpc_policy_{environment_suffix}",
            role=dms_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole"
        )

        # Add inline policy for VPC management if needed
        dms_vpc_inline_policy = IamRolePolicy(
            self,
            f"dms_vpc_inline_policy_{environment_suffix}",
            name=f"dms-vpc-inline-policy-{environment_suffix}",
            role=dms_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:CreateNetworkInterface",
                            "ec2:DescribeNetworkInterfaces",
                            "ec2:DeleteNetworkInterface",
                            "ec2:DescribeSubnets",
                            "ec2:DescribeSecurityGroups",
                            "ec2:DescribeVpcs",
                            "ec2:ModifyNetworkInterfaceAttribute"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # DMS subnet group must be created AFTER the role/policy attachments so DMS can validate
        dms_subnet_group = DmsReplicationSubnetGroup(
            self,
            f"dms_subnet_group_{environment_suffix}",
            replication_subnet_group_id=f"dms-subnet-group-{environment_suffix}",
            replication_subnet_group_description=f"DMS subnet group - {environment_suffix}",
            subnet_ids=[s.id for s in mig_dms_subnets],
            tags={"Name": f"dms-subnet-group-{environment_suffix}"},
            depends_on=[dms_vpc_policy_attachment, dms_vpc_inline_policy]
        )

        dms_instance = DmsReplicationInstance(
            self,
            f"dms_instance_{environment_suffix}",
            replication_instance_id=f"dms-instance-{environment_suffix}",
            replication_instance_class="dms.c5.xlarge",
            allocated_storage=100,
            vpc_security_group_ids=[dms_security_group.id],
            replication_subnet_group_id=dms_subnet_group.replication_subnet_group_id,
            publicly_accessible=False,
            multi_az=True,
            tags={"Name": f"dms-instance-{environment_suffix}"},
            depends_on=[dms_subnet_group]
        )

        source_password = Password(
            self,
            f"source_db_password_{environment_suffix}",
            length=32,
            special=True,
            override_special="!#$&*()-_=[]{}:?"
        )

        source_endpoint = DmsEndpoint(
            self,
            f"dms_source_endpoint_{environment_suffix}",
            endpoint_id=f"source-endpoint-{environment_suffix}",
            endpoint_type="source",
            engine_name="postgres",
            server_name="source-db.onpremises.local",
            port=5432,
            database_name="payments",
            username="sourceuser",
            password=source_password.result,
            ssl_mode="require",
            tags={"Name": f"source-endpoint-{environment_suffix}"},
            depends_on=[dms_instance]
        )

        target_endpoint = DmsEndpoint(
            self,
            f"dms_target_endpoint_{environment_suffix}",
            endpoint_id=f"target-endpoint-{environment_suffix}",
            endpoint_type="target",
            engine_name="aurora-postgresql",
            server_name=aurora_cluster.endpoint,
            port=5432,
            database_name="payments",
            username=db_credentials["username"],
            password=db_credentials["password"],
            ssl_mode="require",
            tags={"Name": f"target-endpoint-{environment_suffix}"},
            depends_on=[dms_instance, aurora_cluster]
        )

        dms_task = DmsReplicationTask(
            self,
            f"dms_task_{environment_suffix}",
            replication_task_id=f"dms-task-{environment_suffix}",
            replication_instance_arn=dms_instance.replication_instance_arn,
            source_endpoint_arn=source_endpoint.endpoint_arn,
            target_endpoint_arn=target_endpoint.endpoint_arn,
            migration_type="full-load-and-cdc",
            table_mappings=json.dumps({
                "rules": [{
                    "rule-type": "selection",
                    "rule-id": "1",
                    "rule-name": "1",
                    "object-locator": {
                        "schema-name": "public",
                        "table-name": "%"
                    },
                    "rule-action": "include"
                }]
            }),
            replication_task_settings=json.dumps({
                "TargetMetadata": {
                    "SupportLobs": True,
                    "FullLobMode": False,
                    "LobChunkSize": 64,
                    "LimitedSizeLobMode": True,
                    "LobMaxSize": 32
                },
                "FullLoadSettings": {
                    "TargetTablePrepMode": "DROP_AND_CREATE",
                    "MaxFullLoadSubTasks": 8
                },
                "Logging": {
                    "EnableLogging": True,
                    "LogComponents": [{
                        "Id": "TRANSFORMATION",
                        "Severity": "LOGGER_SEVERITY_DEFAULT"
                    }, {
                        "Id": "SOURCE_CAPTURE",
                        "Severity": "LOGGER_SEVERITY_INFO"
                    }, {
                        "Id": "TARGET_APPLY",
                        "Severity": "LOGGER_SEVERITY_INFO"
                    }]
                },
                "ChangeProcessingTuning": {
                    "BatchApplyTimeoutMin": 1,
                    "BatchApplyTimeoutMax": 30,
                    "MinTransactionSize": 1000,
                    "CommitTimeout": 1,
                    "MemoryLimitTotal": 1024,
                    "MemoryKeepTime": 60,
                    "StatementCacheSize": 50
                }
            }),
            tags={"Name": f"dms-task-{environment_suffix}"}
        )

        migration_bucket = S3Bucket(
            self,
            f"migration_bucket_{environment_suffix}",
            bucket=f"migration-checkpoints-{environment_suffix}",
            force_destroy=True,
            tags={"Name": f"migration-checkpoints-{environment_suffix}"}
        )

        S3BucketVersioningA(
            self,
            f"migration_bucket_versioning_{environment_suffix}",
            bucket=migration_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        S3BucketServerSideEncryptionConfigurationA(
            self,
            f"migration_bucket_encryption_{environment_suffix}",
            bucket=migration_bucket.id,
            rule=[{
                "apply_server_side_encryption_by_default": {
                    "sse_algorithm": "AES256"
                },
                "bucket_key_enabled": True
            }]
        )

        lambda_role = IamRole(
            self,
            f"lambda_role_{environment_suffix}",
            name=f"lambda-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"lambda-execution-role-{environment_suffix}"}
        )

        IamRolePolicyAttachment(
            self,
            f"lambda_basic_execution_{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        IamRolePolicyAttachment(
            self,
            f"lambda_vpc_execution_{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        lambda_policy = IamRolePolicy(
            self,
            f"lambda_policy_{environment_suffix}",
            name=f"lambda-migration-policy-{environment_suffix}",
            role=lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": f"arn:aws:secretsmanager:{aws_region}:*:secret:migration/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:PutParameter"
                        ],
                        "Resource": f"arn:aws:ssm:{aws_region}:*:parameter/migration/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            migration_bucket.arn,
                            f"{migration_bucket.arn}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": f"arn:aws:sns:{aws_region}:*:migration-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dms:DescribeReplicationTasks",
                            "dms:StopReplicationTask"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"arn:aws:logs:{aws_region}:*:log-group:/aws/lambda/*"
                    }
                ]
            })
        )

        lambda_sg = SecurityGroup(
            self,
            f"lambda_sg_{environment_suffix}",
            name=f"lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=migration_vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={"Name": f"lambda-sg-{environment_suffix}"}
        )

        validator_asset = TerraformAsset(
            self,
            f"validator_asset_{environment_suffix}",
            path=os.path.join(os.path.dirname(__file__), "lambda"),
            type=AssetType.ARCHIVE
        )

        validator_lambda = LambdaFunction(
            self,
            f"validator_lambda_{environment_suffix}",
            function_name=f"data-validator-{environment_suffix}",
            role=lambda_role.arn,
            handler="data_validator.lambda_handler",
            runtime="python3.11",
            timeout=300,
            memory_size=512,
            filename=validator_asset.path,
            source_code_hash=validator_asset.asset_hash,
            environment={
                "variables": {
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "REGION": aws_region
                }
            },
            vpc_config={
                "subnet_ids": [s.id for s in mig_private_subnets],
                "security_group_ids": [lambda_sg.id]
            },
            tags={"Name": f"data-validator-{environment_suffix}"}
        )

        authorizer_asset = TerraformAsset(
            self,
            f"authorizer_asset_{environment_suffix}",
            path=os.path.join(os.path.dirname(__file__), "lambda"),
            type=AssetType.ARCHIVE
        )

        authorizer_lambda = LambdaFunction(
            self,
            f"authorizer_lambda_{environment_suffix}",
            function_name=f"api-authorizer-{environment_suffix}",
            role=lambda_role.arn,
            handler="api_authorizer.lambda_handler",
            runtime="python3.11",
            timeout=30,
            memory_size=256,
            filename=authorizer_asset.path,
            source_code_hash=authorizer_asset.asset_hash,
            environment={
                "variables": {
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "REGION": aws_region
                }
            },
            tags={"Name": f"api-authorizer-{environment_suffix}"}
        )

        rollback_asset = TerraformAsset(
            self,
            f"rollback_asset_{environment_suffix}",
            path=os.path.join(os.path.dirname(__file__), "lambda"),
            type=AssetType.ARCHIVE
        )

        rollback_lambda = LambdaFunction(
            self,
            f"rollback_lambda_{environment_suffix}",
            function_name=f"rollback-handler-{environment_suffix}",
            role=lambda_role.arn,
            handler="rollback_handler.lambda_handler",
            runtime="python3.11",
            timeout=300,
            memory_size=512,
            filename=rollback_asset.path,
            source_code_hash=rollback_asset.asset_hash,
            environment={
                "variables": {
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "REGION": aws_region
                }
            },
            tags={"Name": f"rollback-handler-{environment_suffix}"}
        )

        validator_log_group = CloudwatchLogGroup(
            self,
            f"validator_log_group_{environment_suffix}",
            name=f"/aws/lambda/data-validator-{environment_suffix}",
            retention_in_days=7,
            tags={"Name": f"validator-logs-{environment_suffix}"}
        )

        CloudwatchLogMetricFilter(
            self,
            f"validation_failures_{environment_suffix}",
            name=f"validation-failures-{environment_suffix}",
            log_group_name=validator_log_group.name,
            pattern="[validation_passed = false]",
            metric_transformation={
                "name": "ValidationFailures",
                "namespace": f"Migration/{environment_suffix}",
                "value": "1"
            }
        )

        sns_topic = SnsTopic(
            self,
            f"migration_topic_{environment_suffix}",
            name=f"migration-alerts-{environment_suffix}",
            display_name=f"Migration Alerts - {environment_suffix}",
            tags={"Name": f"migration-alerts-{environment_suffix}"}
        )

        SnsTopicSubscription(
            self,
            f"migration_email_sub_{environment_suffix}",
            topic_arn=sns_topic.arn,
            protocol="email",
            endpoint="ops-team@example.com"
        )

        CloudwatchMetricAlarm(
            self,
            f"replication_lag_alarm_{environment_suffix}",
            alarm_name=f"dms-replication-lag-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CDCLatencySource",
            namespace="AWS/DMS",
            period=300,
            statistic="Average",
            threshold=5.0,
            alarm_description="Alert when DMS replication lag exceeds 5 seconds",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "ReplicationInstanceIdentifier": dms_instance.replication_instance_id,
                "ReplicationTaskIdentifier": dms_task.replication_task_id
            },
            tags={"Name": f"replication-lag-alarm-{environment_suffix}"}
        )

        CloudwatchMetricAlarm(
            self,
            f"validation_failure_alarm_{environment_suffix}",
            alarm_name=f"validation-failures-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ValidationFailures",
            namespace=f"Migration/{environment_suffix}",
            period=300,
            statistic="Sum",
            threshold=0,
            alarm_description="Alert when data validation fails",
            alarm_actions=[sns_topic.arn],
            tags={"Name": f"validation-failure-alarm-{environment_suffix}"}
        )

        dashboard_body = json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DMS", "CDCLatencySource", {"stat": "Average"}],
                            [".", "CDCLatencyTarget", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "DMS Replication Lag"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            [f"Migration/{environment_suffix}", "ValidationFailures", {"stat": "Sum"}],
                            [".", "RowCountMatches", {"stat": "Sum"}],
                            [".", "RowCountMismatches", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "Validation Results"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
                            [".", "DatabaseConnections", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "Aurora Cluster Health"
                    }
                }
            ]
        })

        CloudwatchDashboard(
            self,
            f"migration_dashboard_{environment_suffix}",
            dashboard_name=f"migration-dashboard-{environment_suffix}",
            dashboard_body=dashboard_body
        )

        sfn_role = IamRole(
            self,
            f"sfn_role_{environment_suffix}",
            name=f"stepfunctions-migration-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "states.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"stepfunctions-migration-role-{environment_suffix}"}
        )

        IamRolePolicy(
            self,
            f"sfn_policy_{environment_suffix}",
            name=f"stepfunctions-migration-policy-{environment_suffix}",
            role=sfn_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "lambda:InvokeFunction"
                        ],
                        "Resource": [
                            validator_lambda.arn,
                            rollback_lambda.arn
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dms:StartReplicationTask",
                            "dms:StopReplicationTask",
                            "dms:DescribeReplicationTasks"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": sns_topic.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"arn:aws:logs:{aws_region}:*:log-group:/aws/vendedlogs/states/*"
                    }
                ]
            })
        )

        state_machine_definition = {
            "Comment": "Zero-downtime migration orchestration state machine",
            "StartAt": "Initialize",
            "States": {
                "Initialize": {
                    "Type": "Pass",
                    "Result": {
                        "phase": "initialize",
                        "status": "started"
                    },
                    "Next": "StartReplication"
                },
                "StartReplication": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::aws-sdk:databasemigration:startReplicationTask",
                    "Parameters": {
                        "ReplicationTaskArn": dms_task.replication_task_arn,
                        "StartReplicationTaskType": "start-replication"
                    },
                    "Next": "WaitForReplication",
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "NotifyFailure"
                    }]
                },
                "WaitForReplication": {
                    "Type": "Wait",
                    "Seconds": 300,
                    "Next": "ValidateData"
                },
                "ValidateData": {
                    "Type": "Task",
                    "Resource": validator_lambda.arn,
                    "Parameters": {
                        "source_secret_name": "migration/source/db",
                        "target_secret_name.$": "$.target_secret_name",
                        "source_endpoint": "source-db.onpremises.local",
                        "target_endpoint.$": "$.target_endpoint",
                        "tables": ["transactions", "accounts", "payments"],
                        "validation_type": "both",
                        "environment_suffix": environment_suffix
                    },
                    "Next": "CheckValidationResult",
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "ExecuteRollback"
                    }]
                },
                "CheckValidationResult": {
                    "Type": "Choice",
                    "Choices": [{
                        "Variable": "$.body.validation_passed",
                        "BooleanEquals": True,
                        "Next": "NotifySuccess"
                    }],
                    "Default": "ExecuteRollback"
                },
                "ExecuteRollback": {
                    "Type": "Task",
                    "Resource": rollback_lambda.arn,
                    "Parameters": {
                        "checkpoint_bucket": migration_bucket.bucket,
                        "reason": "Validation failed or error occurred",
                        "dms_task_arns": [dms_task.replication_task_arn],
                        "environment_suffix": environment_suffix
                    },
                    "Next": "NotifyRollback"
                },
                "NotifySuccess": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sns:publish",
                    "Parameters": {
                        "TopicArn": sns_topic.arn,
                        "Subject": f"Migration Success - {environment_suffix}",
                        "Message": "Migration completed successfully. All validation checks passed."
                    },
                    "End": True
                },
                "NotifyRollback": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sns:publish",
                    "Parameters": {
                        "TopicArn": sns_topic.arn,
                        "Subject": f"Migration Rollback Executed - {environment_suffix}",
                        "Message": "Migration was rolled back due to validation failure or error."
                    },
                    "End": True
                },
                "NotifyFailure": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sns:publish",
                    "Parameters": {
                        "TopicArn": sns_topic.arn,
                        "Subject": f"Migration Failed - {environment_suffix}",
                        "Message": "Migration process failed. Manual intervention required."
                    },
                    "End": True
                }
            }
        }

        SfnStateMachine(
            self,
            f"migration_state_machine_{environment_suffix}",
            name=f"migration-orchestration-{environment_suffix}",
            role_arn=sfn_role.arn,
            definition=Fn.jsonencode(state_machine_definition),
            tags={"Name": f"migration-orchestration-{environment_suffix}"}
        )

        api_gateway = ApiGatewayRestApi(
            self,
            f"api_gateway_{environment_suffix}",
            name=f"migration-api-{environment_suffix}",
            description=f"API Gateway for migration traffic routing - {environment_suffix}",
            tags={"Name": f"migration-api-{environment_suffix}"}
        )

        api_authorizer = ApiGatewayAuthorizer(
            self,
            f"api_authorizer_{environment_suffix}",
            name=f"custom-authorizer-{environment_suffix}",
            rest_api_id=api_gateway.id,
            authorizer_uri=authorizer_lambda.invoke_arn,
            authorizer_credentials=lambda_role.arn,
            type="TOKEN",
            identity_source="method.request.header.Authorization"
        )

        LambdaPermission(
            self,
            f"api_authorizer_permission_{environment_suffix}",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=authorizer_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api_gateway.execution_arn}/*/*"
        )

        payment_resource = ApiGatewayResource(
            self,
            f"payment_resource_{environment_suffix}",
            rest_api_id=api_gateway.id,
            parent_id=api_gateway.root_resource_id,
            path_part="payment"
        )

        payment_method = ApiGatewayMethod(
            self,
            f"payment_method_{environment_suffix}",
            rest_api_id=api_gateway.id,
            resource_id=payment_resource.id,
            http_method="POST",
            authorization="CUSTOM",
            authorizer_id=api_authorizer.id
        )

        ApiGatewayIntegration(
            self,
            f"payment_integration_{environment_suffix}",
            rest_api_id=api_gateway.id,
            resource_id=payment_resource.id,
            http_method=payment_method.http_method,
            integration_http_method="POST",
            type="HTTP_PROXY",
            uri="http://backend.example.com/payment"
        )

        api_deployment = ApiGatewayDeployment(
            self,
            f"api_deployment_{environment_suffix}",
            rest_api_id=api_gateway.id,
            depends_on=[payment_method]
        )

        ApiGatewayStage(
            self,
            f"api_stage_{environment_suffix}",
            stage_name="prod",
            rest_api_id=api_gateway.id,
            deployment_id=api_deployment.id,
            tags={"Name": f"api-stage-{environment_suffix}"}
        )

        SsmParameter(
            self,
            f"routing_param_{environment_suffix}",
            name=f"/migration/{environment_suffix}/routing/target",
            type="String",
            value="source",
            description="Current routing target (source or target)",
            tags={"Name": f"routing-target-{environment_suffix}"}
        )

        SsmParameter(
            self,
            f"api_secret_param_{environment_suffix}",
            name=f"/migration/{environment_suffix}/api/secret",
            type="SecureString",
            value="change-me-in-production",
            description="API authorization secret",
            tags={"Name": f"api-secret-{environment_suffix}"}
        )

        SsmParameter(
            self,
            f"sns_topic_param_{environment_suffix}",
            name=f"/migration/{environment_suffix}/sns/topic-arn",
            type="String",
            value=sns_topic.arn,
            description="SNS topic ARN for notifications",
            tags={"Name": f"sns-topic-arn-{environment_suffix}"}
        )
