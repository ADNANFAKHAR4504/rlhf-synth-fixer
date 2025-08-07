"""
TAP (Test Automation Platform) Infrastructure Stack
Enterprise-grade, security-first cloud infrastructure implementation
"""

import json
from typing import Any, Dict, Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, Output, ResourceOptions


class TapStackArgs:
    """Arguments for the TapStack component."""
    
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class TapStack(ComponentResource):
    """
    Enterprise-grade infrastructure stack with multi-region redundancy,
    TLS enforcement, IAM least privilege, comprehensive logging, and
    automated compliance monitoring.
    """
    
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__("tap:infrastructure:TapStack", name, {}, opts)
        
        self.environment_suffix = args.environment_suffix
        self.regions = ["us-east-1", "us-west-2", "ap-south-1"]
        self.primary_region = "us-east-1"
        
        # Get current AWS account ID (this is a plain string, not Output)
        self.current_identity = aws.get_caller_identity()
        self.account_id = self.current_identity.account_id
        
        # Standard enterprise tags
        self.standard_tags = {
            "Environment": f"PROD-{self.environment_suffix}",
            "Owner": "DevOps-Team",
            "CostCenter": "Infrastructure",
            "Project": "IaC-AWS-Nova-Model-Breaking",
            "ManagedBy": "Pulumi",
            "SecurityLevel": "High"
        }
        
        # Initialize infrastructure components
        self._create_kms_infrastructure()
        self._create_iam_foundation()
        self._create_logging_infrastructure()
        self._create_network_infrastructure()
        self._create_secrets_management()
        self._create_storage_infrastructure()
        self._create_database_infrastructure()
        self._create_compute_infrastructure()
        self._create_monitoring_infrastructure()
        self._create_compliance_infrastructure()
        
        # Register stack outputs
        self.register_outputs({
            "primary_vpc_id": self.primary_vpc.id,
            "primary_kms_key_arn": self.primary_kms_key.arn,
            "secrets_manager_arn": self.secrets_manager.arn,
            "cloudtrail_arn": self.cloudtrail.arn
        })
    
    def _create_kms_infrastructure(self):
        """Create KMS keys for encryption across all regions."""
        self.kms_keys = {}
        self.kms_aliases = {}
        
        for region in self.regions:
            provider = aws.Provider(
                f"kms-provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            # KMS key with comprehensive policy (fix: use self.account_id directly)
            kms_key = aws.kms.Key(
                f"PROD-kms-key-{region}-{self.environment_suffix}",
                description=f"Master encryption key for {region} region - {self.environment_suffix}",
                deletion_window_in_days=10,
                enable_key_rotation=True,
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "Enable IAM User Permissions",
                            "Effect": "Allow",
                            "Principal": {"AWS": f"arn:aws:iam::{self.account_id}:root"},
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow CloudTrail",
                            "Effect": "Allow",
                            "Principal": {"Service": "cloudtrail.amazonaws.com"},
                            "Action": [
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow CloudWatch Logs",
                            "Effect": "Allow",
                            "Principal": {"Service": f"logs.{region}.amazonaws.com"},
                            "Action": [
                                "kms:Encrypt",
                                "kms:Decrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*"
                        }
                    ]
                }),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # KMS alias for easy reference
            kms_alias = aws.kms.Alias(
                f"PROD-kms-alias-{region}-{self.environment_suffix}",
                name=f"alias/PROD-{region}-{self.environment_suffix}",
                target_key_id=kms_key.key_id,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            self.kms_keys[region] = kms_key
            self.kms_aliases[region] = kms_alias
        
        # Reference to primary region KMS key
        self.primary_kms_key = self.kms_keys[self.primary_region]
    
    def _create_iam_foundation(self):
        """Create IAM roles and policies following least privilege principles."""
        
        # EC2 Instance Role with minimal permissions
        self.ec2_role = aws.iam.Role(
            f"PROD-ec2-role-{self.environment_suffix}",
            name=f"PROD-ec2-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "ec2.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda Execution Role
        self.lambda_role = aws.iam.Role(
            f"PROD-lambda-role-{self.environment_suffix}",
            name=f"PROD-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self)
        )
        
        # RDS Monitoring Role
        self.rds_monitoring_role = aws.iam.Role(
            f"PROD-rds-monitoring-role-{self.environment_suffix}",
            name=f"PROD-rds-monitoring-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "monitoring.rds.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Attach minimal required policies
        aws.iam.RolePolicyAttachment(
            f"PROD-ec2-ssm-policy-{self.environment_suffix}",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            opts=ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"PROD-lambda-basic-policy-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"PROD-rds-monitoring-policy-{self.environment_suffix}",
            role=self.rds_monitoring_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
            opts=ResourceOptions(parent=self)
        )
        
        # EC2 Instance Profile
        self.ec2_instance_profile = aws.iam.InstanceProfile(
            f"PROD-ec2-instance-profile-{self.environment_suffix}",
            name=f"PROD-ec2-instance-profile-{self.environment_suffix}",
            role=self.ec2_role.name,
            opts=ResourceOptions(parent=self)
        )
    
    def _create_logging_infrastructure(self):
        """Create comprehensive logging infrastructure."""
        
        # S3 bucket for CloudTrail logs (primary region only) - fix: use self.account_id directly
        self.cloudtrail_bucket = aws.s3.Bucket(
            f"PROD-cloudtrail-{self.environment_suffix}",
            bucket=f"prod-cloudtrail-{self.environment_suffix}-{self.account_id}",
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self)
        )
        
        # CloudTrail bucket versioning
        aws.s3.BucketVersioning(
            f"PROD-cloudtrail-versioning-{self.environment_suffix}",
            bucket=self.cloudtrail_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )
        
        # CloudTrail bucket encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"PROD-cloudtrail-encryption-{self.environment_suffix}",
            bucket=self.cloudtrail_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.primary_kms_key.arn
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=ResourceOptions(parent=self)
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"PROD-cloudtrail-public-access-block-{self.environment_suffix}",
            bucket=self.cloudtrail_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )
        
        # CloudTrail bucket policy (fix: use Output.all properly)
        cloudtrail_policy = aws.s3.BucketPolicy(
            f"PROD-cloudtrail-policy-{self.environment_suffix}",
            bucket=self.cloudtrail_bucket.id,
            policy=self.cloudtrail_bucket.arn.apply(
                lambda bucket_arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AWSCloudTrailAclCheck",
                            "Effect": "Allow",
                            "Principal": {"Service": "cloudtrail.amazonaws.com"},
                            "Action": "s3:GetBucketAcl",
                            "Resource": bucket_arn,
                            "Condition": {
                                "StringEquals": {
                                    "AWS:SourceArn": f"arn:aws:cloudtrail:us-east-1:{self.account_id}:trail/PROD-cloudtrail-{self.environment_suffix}"
                                }
                            }
                        },
                        {
                            "Sid": "AWSCloudTrailWrite",
                            "Effect": "Allow",
                            "Principal": {"Service": "cloudtrail.amazonaws.com"},
                            "Action": "s3:PutObject",
                            "Resource": f"{bucket_arn}/*",
                            "Condition": {
                                "StringEquals": {
                                    "s3:x-amz-acl": "bucket-owner-full-control",
                                    "AWS:SourceArn": f"arn:aws:cloudtrail:us-east-1:{self.account_id}:trail/PROD-cloudtrail-{self.environment_suffix}"
                                }
                            }
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self)
        )
        
        # CloudTrail for multi-region logging
        self.cloudtrail = aws.cloudtrail.Trail(
            f"PROD-cloudtrail-{self.environment_suffix}",
            name=f"PROD-cloudtrail-{self.environment_suffix}",
            s3_bucket_name=self.cloudtrail_bucket.id,
            is_multi_region_trail=True,
            enable_log_file_validation=True,
            kms_key_id=self.primary_kms_key.arn,
            include_global_service_events=True,
            is_organization_trail=False,
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self, depends_on=[cloudtrail_policy])
        )
    
    def _create_network_infrastructure(self):
        """Create VPC infrastructure with IPv6 and dual-stack support."""
        self.vpcs = {}
        self.subnets = {}
        self.internet_gateways = {}
        self.route_tables = {}
        
        for region in self.regions:
            provider = aws.Provider(
                f"network-provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            # VPC with IPv6 support
            vpc = aws.ec2.Vpc(
                f"PROD-vpc-{region}-{self.environment_suffix}",
                cidr_block="10.0.0.0/16",
                assign_generated_ipv6_cidr_block=True,
                enable_dns_hostnames=True,
                enable_dns_support=True,
                tags={
                    **self.standard_tags,
                    "Name": f"PROD-vpc-{region}-{self.environment_suffix}",
                    "Region": region
                },
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Internet Gateway
            igw = aws.ec2.InternetGateway(
                f"PROD-igw-{region}-{self.environment_suffix}",
                vpc_id=vpc.id,
                tags={
                    **self.standard_tags,
                    "Name": f"PROD-igw-{region}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Get availability zones
            azs = aws.get_availability_zones(
                state="available",
                opts=pulumi.InvokeOptions(provider=provider)
            )
            
            # Create subnets in first two AZs
            public_subnets = []
            private_subnets = []
            
            for i in range(2):  # Create 2 subnets per type
                az = azs.names[i]
                
                # Public subnet with IPv6 (fix: proper IPv6 CIDR calculation)
                public_subnet = aws.ec2.Subnet(
                    f"PROD-public-subnet-{region}-{i+1}-{self.environment_suffix}",
                    vpc_id=vpc.id,
                    cidr_block=f"10.0.{i+1}.0/24",
                    ipv6_cidr_block=vpc.ipv6_cidr_block.apply(
                        lambda cidr: f"{cidr[:-2]}{i+1:x}::/64" if cidr else None
                    ),
                    availability_zone=az,
                    map_public_ip_on_launch=True,
                    assign_ipv6_address_on_creation=True,
                    tags={
                        **self.standard_tags,
                        "Name": f"PROD-public-subnet-{region}-{i+1}-{self.environment_suffix}",
                        "Type": "Public"
                    },
                    opts=ResourceOptions(parent=self, provider=provider)
                )
                public_subnets.append(public_subnet)
                
                # Private subnet with IPv6
                private_subnet = aws.ec2.Subnet(
                    f"PROD-private-subnet-{region}-{i+1}-{self.environment_suffix}",
                    vpc_id=vpc.id,
                    cidr_block=f"10.0.{i+10}.0/24",
                    ipv6_cidr_block=vpc.ipv6_cidr_block.apply(
                        lambda cidr: f"{cidr[:-2]}{i+10:x}::/64" if cidr else None
                    ),
                    availability_zone=az,
                    assign_ipv6_address_on_creation=True,
                    tags={
                        **self.standard_tags,
                        "Name": f"PROD-private-subnet-{region}-{i+1}-{self.environment_suffix}",
                        "Type": "Private"
                    },
                    opts=ResourceOptions(parent=self, provider=provider)
                )
                private_subnets.append(private_subnet)
            
            # Route table for public subnets
            public_rt = aws.ec2.RouteTable(
                f"PROD-public-rt-{region}-{self.environment_suffix}",
                vpc_id=vpc.id,
                tags={
                    **self.standard_tags,
                    "Name": f"PROD-public-rt-{region}-{self.environment_suffix}",
                    "Type": "Public"
                },
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # IPv4 and IPv6 routes for public subnets
            aws.ec2.Route(
                f"PROD-public-route-ipv4-{region}-{self.environment_suffix}",
                route_table_id=public_rt.id,
                destination_cidr_block="0.0.0.0/0",
                gateway_id=igw.id,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            aws.ec2.Route(
                f"PROD-public-route-ipv6-{region}-{self.environment_suffix}",
                route_table_id=public_rt.id,
                destination_ipv6_cidr_block="::/0",
                gateway_id=igw.id,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Associate public subnets with route table
            for i, subnet in enumerate(public_subnets):
                aws.ec2.RouteTableAssociation(
                    f"PROD-public-rta-{region}-{i+1}-{self.environment_suffix}",
                    subnet_id=subnet.id,
                    route_table_id=public_rt.id,
                    opts=ResourceOptions(parent=self, provider=provider)
                )
            
            # VPC Flow Logs
            flow_log_role = aws.iam.Role(
                f"PROD-flowlog-role-{region}-{self.environment_suffix}",
                name=f"PROD-flowlog-role-{region}-{self.environment_suffix}",
                assume_role_policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            aws.iam.RolePolicyAttachment(
                f"PROD-flowlog-policy-{region}-{self.environment_suffix}",
                role=flow_log_role.name,
                policy_arn="arn:aws:iam::aws:policy/service-role/VPCFlowLogsDeliveryRolePolicy",
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # CloudWatch Log Group for Flow Logs
            flow_log_group = aws.cloudwatch.LogGroup(
                f"PROD-flowlog-group-{region}-{self.environment_suffix}",
                name=f"/aws/vpc/flowlogs-{region}-{self.environment_suffix}",
                retention_in_days=30,
                kms_key_id=self.kms_keys[region].arn,
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # VPC Flow Log
            aws.ec2.FlowLog(
                f"PROD-vpc-flowlog-{region}-{self.environment_suffix}",
                iam_role_arn=flow_log_role.arn,
                log_destination=flow_log_group.arn,
                log_destination_type="cloud-watch-logs",
                resource_id=vpc.id,
                resource_type="VPC",
                traffic_type="ALL",
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Store references
            self.vpcs[region] = vpc
            self.subnets[region] = {
                "public": public_subnets,
                "private": private_subnets
            }
            self.internet_gateways[region] = igw
            self.route_tables[region] = {"public": public_rt}
        
        # Primary VPC reference
        self.primary_vpc = self.vpcs[self.primary_region]
    
    def _create_secrets_management(self):
        """Create AWS Secrets Manager for automated secrets management."""
        # Primary secrets manager
        self.secrets_manager = aws.secretsmanager.Secret(
            f"PROD-secrets-{self.environment_suffix}",
            name=f"PROD-secrets-{self.environment_suffix}",
            description="Centralized secrets management for TAP infrastructure",
            kms_key_id=self.primary_kms_key.arn,
            replica_regions=[
                aws.secretsmanager.SecretReplicaRegionArgs(
                    region=region,
                    kms_key_id=self.kms_keys[region].arn
                ) for region in self.regions[1:]
            ],
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Store secrets
        aws.secretsmanager.SecretVersion(
            f"PROD-secrets-version-{self.environment_suffix}",
            secret_id=self.secrets_manager.id,
            secret_string=json.dumps({
                "database_password": "SecureP@ssw0rd123!",
                "api_keys": {
                    "external_service_a": "api_key_value_a",
                    "external_service_b": "api_key_value_b"
                },
                "encryption_keys": {
                    "application_key": "app_encryption_key_value"
                }
            }),
            opts=ResourceOptions(parent=self)
        )
    
    def _create_storage_infrastructure(self):
        """Create S3 buckets with encryption and versioning across regions."""
        self.s3_buckets = {}
        
        for region in self.regions:
            provider = aws.Provider(
                f"storage-provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            # S3 bucket with unique naming (fix: use self.account_id directly)
            bucket = aws.s3.Bucket(
                f"PROD-storage-{region}-{self.environment_suffix}",
                bucket=f"prod-storage-{region}-{self.environment_suffix}-{self.account_id}",
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Versioning
            aws.s3.BucketVersioning(
                f"PROD-storage-versioning-{region}-{self.environment_suffix}",
                bucket=bucket.id,
                versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                    status="Enabled"
                ),
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Server-side encryption
            aws.s3.BucketServerSideEncryptionConfiguration(
                f"PROD-storage-encryption-{region}-{self.environment_suffix}",
                bucket=bucket.id,
                rules=[
                    aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="aws:kms",
                            kms_master_key_id=self.kms_keys[region].arn
                        ),
                        bucket_key_enabled=True
                    )
                ],
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Block public access
            aws.s3.BucketPublicAccessBlock(
                f"PROD-storage-public-access-block-{region}-{self.environment_suffix}",
                bucket=bucket.id,
                block_public_acls=True,
                block_public_policy=True,
                ignore_public_acls=True,
                restrict_public_buckets=True,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            self.s3_buckets[region] = bucket
    
    def _create_database_infrastructure(self):
        """Create RDS instances with encryption and multi-AZ support."""
        self.rds_instances = {}
        self.rds_subnet_groups = {}
        
        for region in self.regions:
            provider = aws.Provider(
                f"database-provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            # DB subnet group
            db_subnet_group = aws.rds.SubnetGroup(
                f"PROD-rds-subnet-group-{region}-{self.environment_suffix}",
                name=f"prod-rds-subnet-group-{region}-{self.environment_suffix}",
                subnet_ids=[subnet.id for subnet in self.subnets[region]["private"]],
                tags={
                    **self.standard_tags,
                    "Name": f"PROD-rds-subnet-group-{region}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Security group for RDS
            rds_sg = aws.ec2.SecurityGroup(
                f"PROD-rds-sg-{region}-{self.environment_suffix}",
                name=f"PROD-rds-sg-{region}-{self.environment_suffix}",
                vpc_id=self.vpcs[region].id,
                description="Security group for RDS PostgreSQL instances",
                ingress=[
                    aws.ec2.SecurityGroupIngressArgs(
                        description="PostgreSQL from VPC",
                        from_port=5432,
                        to_port=5432,
                        protocol="tcp",
                        cidr_blocks=["10.0.0.0/16"]
                    )
                ],
                egress=[
                    aws.ec2.SecurityGroupEgressArgs(
                        description="All outbound traffic",
                        from_port=0,
                        to_port=0,
                        protocol="-1",
                        cidr_blocks=["0.0.0.0/0"]
                    )
                ],
                tags={
                    **self.standard_tags,
                    "Name": f"PROD-rds-sg-{region}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # RDS parameter group for PostgreSQL 15 with TLS enforcement
            parameter_group = aws.rds.ParameterGroup(
                f"PROD-rds-param-group-{region}-{self.environment_suffix}",
                family="postgres15",
                name=f"prod-rds-param-group-{region}-{self.environment_suffix}",
                description="Parameter group for PostgreSQL 15 with TLS enforcement",
                parameters=[
                    aws.rds.ParameterGroupParameterArgs(
                        name="ssl",
                        value="1"
                    ),
                    aws.rds.ParameterGroupParameterArgs(
                        name="log_statement",
                        value="all"
                    )
                ],
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # RDS instance
            rds_instance = aws.rds.Instance(
                f"PROD-rds-{region}-{self.environment_suffix}",
                identifier=f"prod-rds-{region}-{self.environment_suffix}",
                engine="postgres",
                engine_version="15.4",
                instance_class="db.t3.micro",
                allocated_storage=20,
                max_allocated_storage=100,
                storage_type="gp3",
                storage_encrypted=True,
                kms_key_id=self.kms_keys[region].arn,
                db_name="tapdb",
                username="tapuser",
                manage_master_user_password=True,
                master_user_secret_kms_key_id=self.kms_keys[region].arn,
                vpc_security_group_ids=[rds_sg.id],
                db_subnet_group_name=db_subnet_group.name,
                parameter_group_name=parameter_group.name,
                multi_az=True if region == self.primary_region else False,
                backup_retention_period=7,
                backup_window="03:00-04:00",
                maintenance_window="sun:04:00-sun:05:00",
                monitoring_interval=60,
                monitoring_role_arn=self.rds_monitoring_role.arn,
                enabled_cloudwatch_logs_exports=["postgresql"],
                deletion_protection=True,
                skip_final_snapshot=False,
                final_snapshot_identifier=f"prod-rds-final-snapshot-{region}-{self.environment_suffix}",
                copy_tags_to_snapshot=True,
                tags={
                    **self.standard_tags,
                    "Name": f"PROD-rds-{region}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            self.rds_subnet_groups[region] = db_subnet_group
            self.rds_instances[region] = rds_instance
    
    def _create_compute_infrastructure(self):
        """Create EC2 instances and Lambda functions."""
        self.ec2_instances = {}
        self.lambda_functions = {}
        
        # Lambda function code
        lambda_code = """
import json
import boto3
import os

def lambda_handler(event, context):
    '''
    Secure Lambda function with environment-specific configuration
    '''
    environment = os.environ.get('ENVIRONMENT', 'unknown')
    region = os.environ.get('AWS_REGION', 'unknown')
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
        },
        'body': json.dumps({
            'message': 'Secure TAP Lambda Function',
            'environment': environment,
            'region': region,
            'timestamp': context.aws_request_id
        })
    }
"""
        
        for region in self.regions:
            provider = aws.Provider(
                f"compute-provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            # Get latest Amazon Linux 2 AMI
            ami = aws.ec2.get_ami(
                most_recent=True,
                owners=["amazon"],
                filters=[
                    aws.ec2.GetAmiFilterArgs(
                        name="name", 
                        values=["amzn2-ami-hvm-*-x86_64-gp2"]
                    ),
                    aws.ec2.GetAmiFilterArgs(
                        name="virtualization-type", 
                        values=["hvm"]
                    )
                ],
                opts=pulumi.InvokeOptions(provider=provider)
            )
            
            # Security group for EC2
            ec2_sg = aws.ec2.SecurityGroup(
                f"PROD-ec2-sg-{region}-{self.environment_suffix}",
                name=f"PROD-ec2-sg-{region}-{self.environment_suffix}",
                vpc_id=self.vpcs[region].id,
                description="Security group for EC2 instances with TLS-only access",
                ingress=[
                    aws.ec2.SecurityGroupIngressArgs(
                        description="HTTPS",
                        from_port=443,
                        to_port=443,
                        protocol="tcp",
                        cidr_blocks=["0.0.0.0/0"]
                    )
                ],
                egress=[
                    aws.ec2.SecurityGroupEgressArgs(
                        description="All outbound traffic",
                        from_port=0,
                        to_port=0,
                        protocol="-1",
                        cidr_blocks=["0.0.0.0/0"]
                    )
                ],
                tags={
                    **self.standard_tags,
                    "Name": f"PROD-ec2-sg-{region}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # User data for EC2 with TLS configuration
            user_data = f"""#!/bin/bash
yum update -y
yum install -y amazon-ssm-agent

# Start SSM agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Configure TLS 1.2 minimum
echo 'MinProtocol = TLSv1.2' >> /etc/ssl/openssl.cnf
echo 'CipherString = ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS' >> /etc/ssl/openssl.cnf

# Install CloudWatch agent
wget https://amazoncloudwatch-agent.s3.amazonaws.com/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
"""
            
            # EC2 instance
            ec2_instance = aws.ec2.Instance(
                f"PROD-ec2-{region}-{self.environment_suffix}",
                instance_type="t3.micro",
                ami=ami.id,
                subnet_id=self.subnets[region]["public"][0].id,
                vpc_security_group_ids=[ec2_sg.id],
                iam_instance_profile=self.ec2_instance_profile.name,
                user_data=user_data,
                root_block_device=aws.ec2.InstanceRootBlockDeviceArgs(
                    volume_type="gp3",
                    volume_size=20,
                    encrypted=True,
                    kms_key_id=self.kms_keys[region].arn,
                    delete_on_termination=True
                ),
                metadata_options=aws.ec2.InstanceMetadataOptionsArgs(
                    http_endpoint="enabled",
                    http_tokens="required",
                    http_put_response_hop_limit=2,
                    instance_metadata_tags="enabled"
                ),
                tags={
                    **self.standard_tags,
                    "Name": f"PROD-ec2-{region}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Lambda function
            lambda_function = aws.lambda_.Function(
                f"PROD-lambda-{region}-{self.environment_suffix}",
                name=f"PROD-lambda-{region}-{self.environment_suffix}",
                runtime="python3.11",
                code=pulumi.AssetArchive({
                    "lambda_function.py": pulumi.StringAsset(lambda_code)
                }),
                handler="lambda_function.lambda_handler",
                role=self.lambda_role.arn,
                kms_key_arn=self.kms_keys[region].arn,
                timeout=30,
                memory_size=128,
                environment=aws.lambda_.FunctionEnvironmentArgs(
                    variables={
                        "ENVIRONMENT": self.environment_suffix,
                        "REGION": region
                    }
                ),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            self.ec2_instances[region] = ec2_instance
            self.lambda_functions[region] = lambda_function
    
    def _create_monitoring_infrastructure(self):
        """Create comprehensive monitoring and alerting."""
        self.log_groups = {}
        self.alarms = {}
        
        for region in self.regions:
            provider = aws.Provider(
                f"monitoring-provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            # Application log group
            log_group = aws.cloudwatch.LogGroup(
                f"PROD-app-logs-{region}-{self.environment_suffix}",
                name=f"/aws/application/tap-{region}-{self.environment_suffix}",
                retention_in_days=30,
                kms_key_id=self.kms_keys[region].arn,
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # SNS topic for alerts
            sns_topic = aws.sns.Topic(
                f"PROD-alerts-topic-{region}-{self.environment_suffix}",
                name=f"PROD-alerts-{region}-{self.environment_suffix}",
                kms_master_key_id=self.kms_keys[region].arn,
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # CloudWatch Alarms
            # High CPU alarm
            cpu_alarm = aws.cloudwatch.MetricAlarm(
                f"PROD-high-cpu-alarm-{region}-{self.environment_suffix}",
                alarm_name=f"PROD-high-cpu-{region}-{self.environment_suffix}",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                metric_name="CPUUtilization",
                namespace="AWS/EC2",
                period=300,
                statistic="Average",
                threshold=80,
                alarm_description="This metric monitors EC2 CPU utilization",
                alarm_actions=[sns_topic.arn],
                dimensions={
                    "InstanceId": self.ec2_instances[region].id
                },
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # RDS connection alarm
            rds_alarm = aws.cloudwatch.MetricAlarm(
                f"PROD-rds-connections-alarm-{region}-{self.environment_suffix}",
                alarm_name=f"PROD-rds-connections-{region}-{self.environment_suffix}",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                metric_name="DatabaseConnections",
                namespace="AWS/RDS",
                period=300,
                statistic="Average",
                threshold=40,
                alarm_description="This metric monitors RDS database connections",
                alarm_actions=[sns_topic.arn],
                dimensions={
                    "DBInstanceIdentifier": self.rds_instances[region].id
                },
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            self.log_groups[region] = log_group
            self.alarms[region] = {
                "cpu": cpu_alarm,
                "rds": rds_alarm
            }
    
    def _create_compliance_infrastructure(self):
        """Create automated compliance monitoring and alerting."""
        self.compliance_topics = {}
        self.compliance_rules = {}
        
        for region in self.regions:
            provider = aws.Provider(
                f"compliance-provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            # SNS topic for compliance notifications
            compliance_topic = aws.sns.Topic(
                f"PROD-compliance-topic-{region}-{self.environment_suffix}",
                name=f"PROD-compliance-{region}-{self.environment_suffix}",
                kms_master_key_id=self.kms_keys[region].arn,
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # EventBridge rule for API call monitoring
            api_monitoring_rule = aws.cloudwatch.EventRule(
                f"PROD-api-monitoring-rule-{region}-{self.environment_suffix}",
                name=f"PROD-api-monitoring-{region}-{self.environment_suffix}",
                description="Monitor critical API calls for compliance violations",
                event_pattern=json.dumps({
                    "source": ["aws.iam", "aws.kms", "aws.s3"],
                    "detail-type": ["AWS API Call via CloudTrail"],
                    "detail": {
                        "eventName": [
                            "DeleteRole",
                            "DeletePolicy", 
                            "PutBucketPolicy",
                            "DisableKey",
                            "ScheduleKeyDeletion"
                        ]
                    }
                }),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # EventBridge target to SNS
            aws.cloudwatch.EventTarget(
                f"PROD-compliance-target-{region}-{self.environment_suffix}",
                rule=api_monitoring_rule.name,
                arn=compliance_topic.arn,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # SNS topic policy for EventBridge
            aws.sns.TopicPolicy(
                f"PROD-compliance-topic-policy-{region}-{self.environment_suffix}",
                arn=compliance_topic.arn,
                policy=compliance_topic.arn.apply(
                    lambda topic_arn: json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Sid": "AllowEventBridgePublish",
                                "Effect": "Allow",
                                "Principal": {"Service": "events.amazonaws.com"},
                                "Action": "sns:Publish",
                                "Resource": topic_arn
                            }
                        ]
                    })
                ),
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            self.compliance_topics[region] = compliance_topic
            self.compliance_rules[region] = api_monitoring_rule


# Usage example
def create_tap_stack():
    """Create the TAP infrastructure stack."""
    args = TapStackArgs(environment_suffix="v1")
    stack = TapStack("tap-infrastructure", args)
    
    return {
        "primary_vpc_id": stack.primary_vpc.id,
        "primary_kms_key_arn": stack.primary_kms_key.arn,
        "secrets_manager_arn": stack.secrets_manager.arn,
        "cloudtrail_arn": stack.cloudtrail.arn,
        "regions": stack.regions
    }
