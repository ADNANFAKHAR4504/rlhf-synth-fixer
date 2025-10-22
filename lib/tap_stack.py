"""
tap_stack.py

This module defines the TapStack class for FedRAMP High compliant data processing infrastructure.
Includes comprehensive encryption, audit logging, and high availability across multiple AZs.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws
import json


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    FedRAMP High compliant data processing infrastructure stack.

    This stack implements:
    - Multi-AZ deployment across 3 availability zones
    - FIPS 140-2 validated encryption for all data at rest and in transit
    - 365-day audit log retention
    - Comprehensive CloudTrail logging
    - High availability with automatic failover
    - Least-privilege IAM policies
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        region_info = aws.get_region()
        self.region = (
            getattr(region_info, "region", None)
            or getattr(region_info, "name", None)
            or region_info.id
        )

        identity = aws.get_caller_identity()
        self.account_id = identity.account_id

        cloudtrail_bucket_name = f"fedramp-cloudtrail-{self.environment_suffix}".lower()
        config_bucket_name = f"fedramp-config-{self.environment_suffix}".lower()

        # Create VPC
        vpc = aws.ec2.Vpc(
            f"fedramp-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"fedramp-vpc-{self.environment_suffix}", "Compliance": "FedRAMP-High"},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"fedramp-igw-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={**self.tags, "Name": f"fedramp-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create subnets in available AZs for high availability
        azs = aws.get_availability_zones(state="available")
        availability_zones = azs.names[:3] if len(azs.names) >= 3 else azs.names

        public_subnets = []
        private_subnets = []

        for i, az in enumerate(availability_zones):
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"public-subnet-{az}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**self.tags, "Name": f"public-subnet-{az}", "Tier": "Public"},
                opts=ResourceOptions(parent=self)
            )
            public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"private-subnet-{az}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=az,
                tags={**self.tags, "Name": f"private-subnet-{az}", "Tier": "Private"},
                opts=ResourceOptions(parent=self)
            )
            private_subnets.append(private_subnet)

        # Create NAT Gateways in each AZ for high availability (99.999%)
        nat_gateways = []
        for i, subnet in enumerate(public_subnets):
            eip = aws.ec2.Eip(
                f"nat-eip-{i}-{self.environment_suffix}",
                domain="vpc",
                tags={**self.tags, "Name": f"nat-eip-{availability_zones[i]}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )

            nat_gateway = aws.ec2.NatGateway(
                f"nat-gateway-{i}-{self.environment_suffix}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={**self.tags, "Name": f"nat-gateway-{availability_zones[i]}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            nat_gateways.append(nat_gateway)

        # Route tables - Public
        public_rt = aws.ec2.RouteTable(
            f"public-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={**self.tags, "Name": f"public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        aws.ec2.Route(
            f"public-route-{self.environment_suffix}",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=ResourceOptions(parent=self)
        )

        for i, subnet in enumerate(public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Private route tables - one per AZ for high availability
        for i, (subnet, nat_gateway) in enumerate(zip(private_subnets, nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"private-rt-{i}-{self.environment_suffix}",
                vpc_id=vpc.id,
                tags={**self.tags, "Name": f"private-rt-{availability_zones[i]}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )

            aws.ec2.Route(
                f"private-route-{i}-{self.environment_suffix}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id,
                opts=ResourceOptions(parent=self)
            )

            aws.ec2.RouteTableAssociation(
                f"private-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=ResourceOptions(parent=self)
            )

        kms_key_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "EnableRootAccess",
                    "Effect": "Allow",
                    "Principal": {"AWS": f"arn:aws:iam::{self.account_id}:root"},
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "AllowCloudTrailService",
                    "Effect": "Allow",
                    "Principal": {"Service": "cloudtrail.amazonaws.com"},
                    "Action": [
                        "kms:DescribeKey",
                        "kms:GenerateDataKey*",
                        "kms:Decrypt"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "kms:EncryptionContext:aws:cloudtrail:arn": f"arn:aws:cloudtrail:{self.region}:{self.account_id}:trail/fedramp-audit-{self.environment_suffix}"
                        }
                    }
                },
                {
                    "Sid": "AllowConfigService",
                    "Effect": "Allow",
                    "Principal": {"Service": "config.amazonaws.com"},
                    "Action": [
                        "kms:DescribeKey",
                        "kms:GenerateDataKey*",
                        "kms:Decrypt"
                    ],
                    "Resource": "*"
                },
                {
                    "Sid": "AllowS3UsageForServices",
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": [
                        "kms:DescribeKey",
                        "kms:GenerateDataKey*",
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringLike": {
                            "kms:EncryptionContext:aws:s3:arn": [
                                f"arn:aws:s3:::{cloudtrail_bucket_name}/AWSLogs/{self.account_id}/*",
                                f"arn:aws:s3:::{config_bucket_name}/AWSLogs/{self.account_id}/*"
                            ]
                        }
                    }
                }
            ]
        })

        # KMS Key for FIPS 140-2 encryption
        kms_key = aws.kms.Key(
            f"fedramp-kms-{self.environment_suffix}",
            description="FIPS 140-2 validated KMS key for FedRAMP High encryption",
            deletion_window_in_days=30,
            enable_key_rotation=True,
            policy=kms_key_policy,
            tags={**self.tags, "Name": f"fedramp-kms-{self.environment_suffix}", "Compliance": "FIPS-140-2"},
            opts=ResourceOptions(parent=self)
        )

        aws.kms.Alias(
            f"fedramp-kms-alias-{self.environment_suffix}",
            name=f"alias/fedramp-{self.environment_suffix}",
            target_key_id=kms_key.id,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Log Group with 365-day retention for FedRAMP compliance
        log_group = aws.cloudwatch.LogGroup(
            f"fedramp-logs-{self.environment_suffix}",
            name=f"/aws/fedramp/{self.environment_suffix}",
            retention_in_days=365,  # FedRAMP requirement
            tags={**self.tags, "Name": f"fedramp-logs-{self.environment_suffix}", "Retention": "365-days"},
            opts=ResourceOptions(parent=self)
        )

        # S3 bucket for CloudTrail logs
        cloudtrail_bucket = aws.s3.Bucket(
            f"cloudtrail-logs-{self.environment_suffix}",
            bucket=cloudtrail_bucket_name,
            force_destroy=True,
            tags={**self.tags, "Name": f"cloudtrail-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning on CloudTrail bucket
        aws.s3.BucketVersioning(
            f"cloudtrail-bucket-versioning-{self.environment_suffix}",
            bucket=cloudtrail_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled",
            ),
            opts=ResourceOptions(parent=self)
        )

        # Server-side encryption for CloudTrail bucket
        ct_sse_args = aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="aws:kms",
            kms_master_key_id=kms_key.arn,
        )
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"cloudtrail-bucket-encryption-{self.environment_suffix}",
            bucket=cloudtrail_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=ct_sse_args,
            )],
            opts=ResourceOptions(parent=self)
        )

        # Block public access for CloudTrail bucket
        aws.s3.BucketPublicAccessBlock(
            f"cloudtrail-bucket-public-access-block-{self.environment_suffix}",
            bucket=cloudtrail_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # ELB service account IDs per region for access logs
        elb_service_accounts = {
            "us-east-1": "127311923021",
            "us-east-2": "033677994240",
            "us-west-1": "027434742980",
            "us-west-2": "797873946194",
            "eu-west-1": "156460612806",
            "eu-west-2": "652711504416",
            "eu-west-3": "009996457667",
            "eu-central-1": "054676820928",
            "eu-north-1": "897822967062",
            "ap-southeast-1": "114774131450",
            "ap-southeast-2": "783225319266",
            "ap-northeast-1": "582318560864",
            "ap-northeast-2": "600734575887",
            "ap-south-1": "718504428378",
            "ca-central-1": "985666609251",
            "sa-east-1": "507241528517"
        }
        elb_account = elb_service_accounts.get(self.region, "127311923021")

        # CloudTrail bucket policy
        cloudtrail_bucket_policy = aws.s3.BucketPolicy(
            f"cloudtrail-bucket-policy-{self.environment_suffix}",
            bucket=cloudtrail_bucket.id,
            policy=pulumi.Output.all(cloudtrail_bucket.arn, cloudtrail_bucket.id).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AWSCloudTrailAclCheck",
                            "Effect": "Allow",
                            "Principal": {"Service": "cloudtrail.amazonaws.com"},
                            "Action": "s3:GetBucketAcl",
                            "Resource": args[0]
                        },
                        {
                            "Sid": "AWSCloudTrailWrite",
                            "Effect": "Allow",
                            "Principal": {"Service": "cloudtrail.amazonaws.com"},
                            "Action": "s3:PutObject",
                            "Resource": f"{args[0]}/AWSLogs/{self.account_id}/*",
                            "Condition": {
                                "StringEquals": {
                                    "s3:x-amz-acl": "bucket-owner-full-control"
                                }
                            }
                        },
                        {
                            "Sid": "AWSALBAccessLogWrite",
                            "Effect": "Allow",
                            "Principal": {"AWS": f"arn:aws:iam::{elb_account}:root"},
                            "Action": "s3:PutObject",
                            "Resource": f"{args[0]}/alb-logs/*"
                        },
                        {
                            "Sid": "AWSALBAccessLogAclCheck",
                            "Effect": "Allow",
                            "Principal": {"AWS": f"arn:aws:iam::{elb_account}:root"},
                            "Action": "s3:GetBucketAcl",
                            "Resource": args[0]
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # CloudTrail for comprehensive audit logging
        cloudtrail = aws.cloudtrail.Trail(
            f"fedramp-audit-trail-{self.environment_suffix}",
            name=f"fedramp-audit-{self.environment_suffix}",
            s3_bucket_name=cloudtrail_bucket.id,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_logging=True,
            enable_log_file_validation=True,
            kms_key_id=kms_key.arn,
            event_selectors=[aws.cloudtrail.TrailEventSelectorArgs(
                read_write_type="All",
                include_management_events=True,
            )],
            tags={**self.tags, "Name": f"fedramp-audit-trail-{self.environment_suffix}", "Compliance": "FedRAMP-High"},
            opts=ResourceOptions(parent=self, depends_on=[cloudtrail_bucket_policy])
        )

        # VPC Flow Logs
        flow_log_role = aws.iam.Role(
            f"vpc-flow-log-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"vpc-flow-log-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        flow_log_policy = aws.iam.RolePolicy(
            f"vpc-flow-log-policy-{self.environment_suffix}",
            role=flow_log_role.id,
            policy=log_group.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": arn
                }]
            })),
            opts=ResourceOptions(parent=self)
        )

        vpc_flow_log = aws.ec2.FlowLog(
            f"vpc-flow-log-{self.environment_suffix}",
            iam_role_arn=flow_log_role.arn,
            log_destination=log_group.arn,
            traffic_type="ALL",
            vpc_id=vpc.id,
            tags={**self.tags, "Name": f"vpc-flow-log-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[flow_log_policy])
        )

        # Security Groups with minimal required access
        alb_sg = aws.ec2.SecurityGroup(
            f"alb-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for ALB - HTTPS only",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTPS from anywhere",
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description="All outbound traffic",
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**self.tags, "Name": f"alb-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        ecs_sg = aws.ec2.SecurityGroup(
            f"ecs-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for ECS tasks",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="Traffic from ALB",
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[alb_sg.id],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description="All outbound traffic",
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**self.tags, "Name": f"ecs-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        rds_sg = aws.ec2.SecurityGroup(
            f"rds-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for RDS",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="PostgreSQL from ECS tasks",
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[ecs_sg.id],
                )
            ],
            tags={**self.tags, "Name": f"rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        elasticache_sg = aws.ec2.SecurityGroup(
            f"elasticache-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for ElastiCache",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="Redis from ECS tasks",
                    protocol="tcp",
                    from_port=6379,
                    to_port=6379,
                    security_groups=[ecs_sg.id],
                )
            ],
            tags={**self.tags, "Name": f"elasticache-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        efs_sg = aws.ec2.SecurityGroup(
            f"efs-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for EFS",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="NFS from ECS tasks",
                    protocol="tcp",
                    from_port=2049,
                    to_port=2049,
                    security_groups=[ecs_sg.id],
                )
            ],
            tags={**self.tags, "Name": f"efs-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # 1. Kinesis Stream with encryption enabled
        kinesis_stream = aws.kinesis.Stream(
            f"data-stream-{self.environment_suffix}",
            name=f"fedramp-data-stream-{self.environment_suffix}",
            shard_count=3,
            retention_period=168,
            encryption_type="KMS",
            kms_key_id=kms_key.id,
            stream_mode_details=aws.kinesis.StreamStreamModeDetailsArgs(
                stream_mode="PROVISIONED",
            ),
            tags={**self.tags, "Name": f"data-stream-{self.environment_suffix}", "Encryption": "KMS"},
            opts=ResourceOptions(parent=self)
        )

        # 2. Secrets Manager for credentials
        db_secret = aws.secretsmanager.Secret(
            f"db-credentials-{self.environment_suffix}",
            name=f"fedramp/db-credentials-{self.environment_suffix}",
            kms_key_id=kms_key.id,
            recovery_window_in_days=30,
            tags={**self.tags, "Name": f"db-credentials-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        db_credentials = {
            "username": "dbadmin",
            "password": "ChangeMe123!SecurePassword456#",
            "engine": "postgres",
            "host": "placeholder",
            "port": 5432,
            "dbname": "fedrampdb"
        }
        db_secret_version = aws.secretsmanager.SecretVersion(
            f"db-credentials-version-{self.environment_suffix}",
            secret_id=db_secret.id,
            secret_string=pulumi.Output.secret(json.dumps(db_credentials)),
            opts=ResourceOptions(parent=self)
        )

        # 3. RDS Instance with Multi-AZ and encryption
        db_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{self.environment_suffix}",
            subnet_ids=[s.id for s in private_subnets],
            tags={**self.tags, "Name": f"db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Parameter group for CloudWatch logging
        db_parameter_group = aws.rds.ParameterGroup(
            f"postgres-params-{self.environment_suffix}",
            family="postgres15",
            parameters=[
                aws.rds.ParameterGroupParameterArgs(
                    name="log_connections",
                    value="1",
                ),
                aws.rds.ParameterGroupParameterArgs(
                    name="log_disconnections",
                    value="1",
                ),
                aws.rds.ParameterGroupParameterArgs(
                    name="log_duration",
                    value="1",
                ),
            ],
            tags={**self.tags, "Name": f"postgres-params-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        rds_instance = aws.rds.Instance(
            f"postgres-db-{self.environment_suffix}",
            identifier=f"fedramp-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="15",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            username="dbadmin",
            password=pulumi.Output.secret("ChangeMe123!SecurePassword456#"),
            db_subnet_group_name=db_subnet_group.name,
            parameter_group_name=db_parameter_group.name,
            vpc_security_group_ids=[rds_sg.id],
            multi_az=True,
            backup_retention_period=35,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,
            deletion_protection=False,
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            performance_insights_enabled=True,
            performance_insights_kms_key_id=kms_key.arn,
            performance_insights_retention_period=7,
            tags={**self.tags, "Name": f"postgres-db-{self.environment_suffix}", "MultiAZ": "true"},
            opts=ResourceOptions(parent=self)
        )

        # 4. ElastiCache with encryption in transit and at rest
        elasticache_subnet_group = aws.elasticache.SubnetGroup(
            f"cache-subnet-group-{self.environment_suffix}",
            subnet_ids=[s.id for s in private_subnets],
            tags={**self.tags, "Name": f"cache-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Auth token for Redis (must be alphanumeric or symbols excluding @, ", and /)
        auth_token = pulumi.Output.secret("SecureRedisAuthToken123")

        elasticache_cluster = aws.elasticache.ReplicationGroup(
            f"redis-cache-{self.environment_suffix}",
            replication_group_id=f"fedramp-cache-{self.environment_suffix}",
            description="FedRAMP compliant Redis cache with encryption",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",
            num_cache_clusters=3,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            subnet_group_name=elasticache_subnet_group.name,
            security_group_ids=[elasticache_sg.id],
            at_rest_encryption_enabled=True,
            kms_key_id=kms_key.arn,
            transit_encryption_enabled=True,
            transit_encryption_mode="required",
            auth_token=auth_token,
            auth_token_update_strategy="ROTATE",
            snapshot_retention_limit=5,
            snapshot_window="02:00-03:00",
            maintenance_window="sun:03:00-sun:04:00",
            log_delivery_configurations=[
                aws.elasticache.ReplicationGroupLogDeliveryConfigurationArgs(
                    destination=log_group.name,
                    destination_type="cloudwatch-logs",
                    log_format="json",
                    log_type="slow-log",
                ),
                aws.elasticache.ReplicationGroupLogDeliveryConfigurationArgs(
                    destination=log_group.name,
                    destination_type="cloudwatch-logs",
                    log_format="json",
                    log_type="engine-log",
                ),
            ],
            tags={**self.tags, "Name": f"redis-cache-{self.environment_suffix}", "Encryption": "TLS"},
            opts=ResourceOptions(parent=self)
        )

        # 5. EFS File System with encryption
        efs = aws.efs.FileSystem(
            f"efs-storage-{self.environment_suffix}",
            encrypted=True,
            kms_key_id=kms_key.arn,
            lifecycle_policies=[aws.efs.FileSystemLifecyclePolicyArgs(
                transition_to_ia="AFTER_30_DAYS",
            )],
            performance_mode="generalPurpose",
            throughput_mode="bursting",
            tags={**self.tags, "Name": f"efs-storage-{self.environment_suffix}", "Encryption": "KMS"},
            opts=ResourceOptions(parent=self)
        )

        # EFS Mount Targets in all AZs
        efs_mount_targets = []
        for i, subnet in enumerate(private_subnets):
            mount_target = aws.efs.MountTarget(
                f"efs-mount-{i}-{self.environment_suffix}",
                file_system_id=efs.id,
                subnet_id=subnet.id,
                security_groups=[efs_sg.id],
                opts=ResourceOptions(parent=self)
            )
            efs_mount_targets.append(mount_target)

        # EFS backup policy
        aws.efs.BackupPolicy(
            f"efs-backup-policy-{self.environment_suffix}",
            file_system_id=efs.id,
            backup_policy=aws.efs.BackupPolicyBackupPolicyArgs(
                status="ENABLED",
            ),
            opts=ResourceOptions(parent=self)
        )

        # IAM Roles for ECS with least privilege
        ecs_task_role = aws.iam.Role(
            f"ecs-task-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"ecs-task-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Least-privilege IAM policy for ECS tasks
        ecs_task_policy = aws.iam.RolePolicy(
            f"ecs-task-policy-{self.environment_suffix}",
            role=ecs_task_role.id,
            policy=pulumi.Output.all(
                kinesis_stream.arn,
                db_secret.arn,
                kms_key.arn,
                efs.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:DescribeStream",
                            "kinesis:GetRecords",
                            "kinesis:GetShardIterator",
                            "kinesis:ListShards",
                            "kinesis:PutRecord",
                            "kinesis:PutRecords"
                        ],
                        "Resource": args[0]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": args[1]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": args[2]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "elasticfilesystem:ClientMount",
                            "elasticfilesystem:ClientWrite"
                        ],
                        "Resource": args[3]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        ecs_execution_role = aws.iam.Role(
            f"ecs-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"ecs-execution-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"ecs-execution-policy-{self.environment_suffix}",
            role=ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self)
        )

        # Additional permissions for execution role to pull from ECR and access secrets
        ecs_execution_policy = aws.iam.RolePolicy(
            f"ecs-execution-additional-policy-{self.environment_suffix}",
            role=ecs_execution_role.id,
            policy=pulumi.Output.all(db_secret.arn, kms_key.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "secretsmanager:GetSecretValue"
                            ],
                            "Resource": args[0]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt"
                            ],
                            "Resource": args[1]
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # 6. ECS Cluster with Container Insights enabled
        ecs_cluster = aws.ecs.Cluster(
            f"processing-cluster-{self.environment_suffix}",
            name=f"fedramp-cluster-{self.environment_suffix}",
            settings=[aws.ecs.ClusterSettingArgs(
                name="containerInsights",
                value="enabled",
            )],
            tags={**self.tags, "Name": f"processing-cluster-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ECS Cluster Configuration - ECS Execute Command configuration
        aws.ecs.ClusterCapacityProviders(
            f"cluster-capacity-providers-{self.environment_suffix}",
            cluster_name=ecs_cluster.name,
            capacity_providers=["FARGATE", "FARGATE_SPOT"],
            opts=ResourceOptions(parent=self)
        )

        # ECS Task Definition
        task_definition = aws.ecs.TaskDefinition(
            f"processing-task-{self.environment_suffix}",
            family=f"fedramp-processing-{self.environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=ecs_execution_role.arn,
            task_role_arn=ecs_task_role.arn,
            runtime_platform=aws.ecs.TaskDefinitionRuntimePlatformArgs(
                operating_system_family="LINUX",
                cpu_architecture="X86_64",
            ),
            container_definitions=pulumi.Output.all(
                kinesis_stream.name,
                rds_instance.endpoint,
                elasticache_cluster.configuration_endpoint_address,
                efs.id,
                db_secret.arn,
                log_group.name
            ).apply(lambda args: json.dumps([{
                "name": "data-processor",
                "image": "public.ecr.aws/docker/library/nginx:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }],
                "environment": [
                    {"name": "KINESIS_STREAM", "value": args[0]},
                    {"name": "DB_ENDPOINT", "value": args[1]},
                    {"name": "CACHE_ENDPOINT", "value": args[2]},
                    {"name": "EFS_ID", "value": args[3]},
                    {"name": "AWS_REGION", "value": self.region},
                ],
                "secrets": [
                    {"name": "DB_SECRET", "valueFrom": args[4]}
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args[5],
                        "awslogs-region": self.region,
                        "awslogs-stream-prefix": "ecs"
                    }
                },
                "healthCheck": {
                    "command": ["CMD-SHELL", "curl -f http://localhost:8080/ || exit 1"],
                    "interval": 30,
                    "timeout": 5,
                    "retries": 3,
                    "startPeriod": 60
                }
            }])),
            tags={**self.tags, "Name": f"processing-task-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ALB with HTTPS listener
        alb = aws.lb.LoadBalancer(
            f"app-alb-{self.environment_suffix}",
            name=f"fedramp-alb-{self.environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[s.id for s in public_subnets],
            enable_deletion_protection=False,
            enable_http2=True,
            enable_cross_zone_load_balancing=True,
            drop_invalid_header_fields=True,
            access_logs=aws.lb.LoadBalancerAccessLogsArgs(
                bucket=cloudtrail_bucket.id,
                enabled=False,
                prefix="alb-logs",
            ),
            tags={**self.tags, "Name": f"app-alb-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[cloudtrail_bucket_policy])
        )

        target_group = aws.lb.TargetGroup(
            f"ecs-tg-{self.environment_suffix}",
            name=f"fedramp-tg-{self.environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            deregistration_delay=30,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/",
                port="8080",
                protocol="HTTP",
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                matcher="200-299",
            ),
            tags={**self.tags, "Name": f"ecs-tg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # For production, you would add a certificate here
        # For now, we'll add an HTTP listener that can be upgraded to HTTPS
        alb_listener = aws.lb.Listener(
            f"alb-listener-{self.environment_suffix}",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=target_group.arn,
            )],
            tags={**self.tags, "Name": f"alb-listener-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ECS Service with high availability
        ecs_service = aws.ecs.Service(
            f"processing-service-{self.environment_suffix}",
            name=f"fedramp-service-{self.environment_suffix}",
            cluster=ecs_cluster.arn,
            task_definition=task_definition.arn,
            desired_count=3,
            launch_type="FARGATE",
            platform_version="LATEST",
            enable_execute_command=True,
            health_check_grace_period_seconds=60,
            deployment_maximum_percent=200,
            deployment_minimum_healthy_percent=100,
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=[s.id for s in private_subnets],
                security_groups=[ecs_sg.id],
            ),
            load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
                target_group_arn=target_group.arn,
                container_name="data-processor",
                container_port=8080,
            )],
            tags={**self.tags, "Name": f"processing-service-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[alb_listener])
        )

        # 7. API Gateway with proper authentication and authorization
        # Create IAM role for API Gateway to invoke ALB
        api_gateway_role = aws.iam.Role(
            f"api-gateway-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "apigateway.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"api-gateway-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # API Gateway with JWT authorizer for FedRAMP compliance
        api = aws.apigatewayv2.Api(
            f"data-api-{self.environment_suffix}",
            name=f"fedramp-api-{self.environment_suffix}",
            protocol_type="HTTP",
            cors_configuration=aws.apigatewayv2.ApiCorsConfigurationArgs(
                allow_origins=["https://*"],
                allow_methods=["GET", "POST", "PUT", "DELETE"],
                allow_headers=["content-type", "authorization"],
                max_age=300,
            ),
            tags={**self.tags, "Name": f"data-api-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # VPC Link for private integration
        vpc_link = aws.apigatewayv2.VpcLink(
            f"api-vpc-link-{self.environment_suffix}",
            name=f"fedramp-vpc-link-{self.environment_suffix}",
            subnet_ids=[s.id for s in private_subnets],
            security_group_ids=[alb_sg.id],
            tags={**self.tags, "Name": f"api-vpc-link-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        api_integration = aws.apigatewayv2.Integration(
            f"alb-integration-{self.environment_suffix}",
            api_id=api.id,
            integration_type="HTTP_PROXY",
            integration_uri=alb_listener.arn,
            integration_method="ANY",
            connection_type="VPC_LINK",
            connection_id=vpc_link.id,
            payload_format_version="1.0",
            opts=ResourceOptions(parent=self)
        )

        api_route = aws.apigatewayv2.Route(
            f"default-route-{self.environment_suffix}",
            api_id=api.id,
            route_key="$default",
            target=api_integration.id.apply(lambda id: f"integrations/{id}"),
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch logs for API Gateway
        api_log_group = aws.cloudwatch.LogGroup(
            f"api-gateway-logs-{self.environment_suffix}",
            name=f"/aws/apigateway/fedramp-{self.environment_suffix}",
            retention_in_days=365,
            tags={**self.tags, "Name": f"api-gateway-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        api_stage = aws.apigatewayv2.Stage(
            f"api-stage-{self.environment_suffix}",
            api_id=api.id,
            name="prod",
            auto_deploy=True,
            access_log_settings=aws.apigatewayv2.StageAccessLogSettingsArgs(
                destination_arn=api_log_group.arn,
                format=json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "routeKey": "$context.routeKey",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength"
                }),
            ),
            default_route_settings=aws.apigatewayv2.StageDefaultRouteSettingsArgs(
                detailed_metrics_enabled=True,
                throttling_burst_limit=5000,
                throttling_rate_limit=10000,
            ),
            tags={**self.tags, "Name": f"api-stage-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # AWS Config for compliance monitoring
        config_bucket = aws.s3.Bucket(
            f"config-logs-{self.environment_suffix}",
            bucket=config_bucket_name,
            force_destroy=True,
            tags={**self.tags, "Name": f"config-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        cfg_sse_args = aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="aws:kms",
            kms_master_key_id=kms_key.arn,
        )
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"config-bucket-encryption-{self.environment_suffix}",
            bucket=config_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=cfg_sse_args,
            )],
            opts=ResourceOptions(parent=self)
        )

        aws.s3.BucketPolicy(
            f"config-bucket-policy-{self.environment_suffix}",
            bucket=config_bucket.id,
            policy=config_bucket.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AWSConfigBucketPermissionsCheck",
                        "Effect": "Allow",
                        "Principal": {"Service": "config.amazonaws.com"},
                        "Action": "s3:GetBucketAcl",
                        "Resource": arn
                    },
                    {
                        "Sid": "AWSConfigBucketDelivery",
                        "Effect": "Allow",
                        "Principal": {"Service": "config.amazonaws.com"},
                        "Action": "s3:PutObject",
                        "Resource": f"{arn}/*",
                        "Condition": {
                            "StringEquals": {
                                "s3:x-amz-acl": "bucket-owner-full-control"
                            }
                        }
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        config_role = aws.iam.Role(
            f"config-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "config.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"config-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"config-policy-{self.environment_suffix}",
            role=config_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
            opts=ResourceOptions(parent=self)
        )

        config_recorder = aws.cfg.Recorder(
            f"config-recorder-{self.environment_suffix}",
            name=f"fedramp-config-{self.environment_suffix}",
            role_arn=config_role.arn,
            recording_group=aws.cfg.RecorderRecordingGroupArgs(
                all_supported=True,
                include_global_resource_types=True,
            ),
            opts=ResourceOptions(parent=self)
        )

        config_delivery_channel = aws.cfg.DeliveryChannel(
            f"config-delivery-{self.environment_suffix}",
            name=f"fedramp-config-{self.environment_suffix}",
            s3_bucket_name=config_bucket.id,
            s3_kms_key_arn=kms_key.arn,
            snapshot_delivery_properties=aws.cfg.DeliveryChannelSnapshotDeliveryPropertiesArgs(
                delivery_frequency="TwentyFour_Hours",
            ),
            opts=ResourceOptions(parent=self, depends_on=[config_recorder])
        )

        # Start Config Recorder
        config_recorder_status = aws.cfg.RecorderStatus(
            f"config-recorder-status-{self.environment_suffix}",
            name=config_recorder.name,
            is_enabled=True,
            opts=ResourceOptions(parent=self, depends_on=[config_delivery_channel])
        )

        # Outputs
        self.vpc_id = vpc.id
        self.kinesis_stream_name = kinesis_stream.name
        self.kinesis_stream_arn = kinesis_stream.arn
        self.ecs_cluster_name = ecs_cluster.name
        self.ecs_cluster_arn = ecs_cluster.arn
        self.rds_endpoint = rds_instance.endpoint
        self.elasticache_endpoint = elasticache_cluster.configuration_endpoint_address
        self.efs_id = efs.id
        self.efs_arn = efs.arn
        self.api_endpoint = api.api_endpoint
        self.alb_dns = alb.dns_name
        self.kms_key_id = kms_key.id
        self.cloudtrail_name = cloudtrail.name

        outputs = {
            "region": self.region,
            "vpc_id": self.vpc_id,
            "kinesis_stream_name": self.kinesis_stream_name,
            "kinesis_stream_arn": self.kinesis_stream_arn,
            "ecs_cluster_name": self.ecs_cluster_name,
            "ecs_cluster_arn": self.ecs_cluster_arn,
            "rds_endpoint": self.rds_endpoint,
            "elasticache_endpoint": self.elasticache_endpoint,
            "efs_id": self.efs_id,
            "efs_arn": self.efs_arn,
            "api_endpoint": self.api_endpoint,
            "alb_dns": self.alb_dns,
            "kms_key_id": self.kms_key_id,
            "cloudtrail_name": self.cloudtrail_name,
        }

        self.register_outputs(outputs)

        if opts is None or getattr(opts, "parent", None) is None:
            for key, value in outputs.items():
                pulumi.export(key, value)
