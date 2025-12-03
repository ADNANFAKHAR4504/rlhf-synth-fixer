"""
tap_stack.py

BrazilCart E-commerce CI/CD Pipeline Infrastructure
Comprehensive implementation with VPC, RDS, ElastiCache, CodePipeline, and security services
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Environment suffix (e.g., 'dev', 'prod').
        tags (Optional[dict]): Default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    BrazilCart CI/CD Pipeline Infrastructure Stack

    Creates comprehensive AWS infrastructure including:
    - Multi-AZ VPC with public/private subnets
    - RDS PostgreSQL with encryption and Multi-AZ
    - ElastiCache Redis with authentication
    - CodePipeline with CodeCommit and CodeBuild
    - KMS keys for encryption
    - Secrets Manager for credentials
    - CloudWatch logging and monitoring
    - IAM roles with least privilege
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        # Store instance variables
        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        env = args.environment_suffix
        default_tags = {
            "Environment": env,
            "Project": "BrazilCart",
            "ManagedBy": "Pulumi",
            **args.tags
        }

        # ====== KMS Keys ======
        self.kms_key = aws.kms.Key(
            f"brazilcart-kms-{env}",
            description=f"KMS key for BrazilCart {env} encryption",
            enable_key_rotation=True,
            tags={**default_tags, "Name": f"brazilcart-kms-{env}"},
            opts=ResourceOptions(parent=self)
        )

        self.kms_alias = aws.kms.Alias(
            f"brazilcart-kms-alias-{env}",
            target_key_id=self.kms_key.id,
            name=f"alias/brazilcart-{env}",
            opts=ResourceOptions(parent=self)
        )

        # ====== VPC Configuration ======
        self.vpc = aws.ec2.Vpc(
            f"brazilcart-vpc-{env}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**default_tags, "Name": f"brazilcart-vpc-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"brazilcart-igw-{env}",
            vpc_id=self.vpc.id,
            tags={**default_tags, "Name": f"brazilcart-igw-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # Availability Zones
        azs = aws.get_availability_zones(state="available")
        az_names = azs.names[:3]  # Use first 3 AZs

        # Public Subnets
        self.public_subnets = []
        for i, az in enumerate(az_names):
            subnet = aws.ec2.Subnet(
                f"brazilcart-public-subnet-{i}-{env}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**default_tags, "Name": f"brazilcart-public-{i}-{env}", "Type": "Public"},
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Private Subnets
        self.private_subnets = []
        for i, az in enumerate(az_names):
            subnet = aws.ec2.Subnet(
                f"brazilcart-private-subnet-{i}-{env}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={**default_tags, "Name": f"brazilcart-private-{i}-{env}", "Type": "Private"},
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Elastic IPs for NAT Gateways
        self.eips = []
        for i in range(len(az_names)):
            eip = aws.ec2.Eip(
                f"brazilcart-nat-eip-{i}-{env}",
                domain="vpc",
                tags={**default_tags, "Name": f"brazilcart-nat-eip-{i}-{env}"},
                opts=ResourceOptions(parent=self)
            )
            self.eips.append(eip)

        # NAT Gateways
        self.nat_gateways = []
        for i, (subnet, eip) in enumerate(zip(self.public_subnets, self.eips)):
            nat = aws.ec2.NatGateway(
                f"brazilcart-nat-{i}-{env}",
                subnet_id=subnet.id,
                allocation_id=eip.id,
                tags={**default_tags, "Name": f"brazilcart-nat-{i}-{env}"},
                opts=ResourceOptions(parent=self)
            )
            self.nat_gateways.append(nat)

        # Public Route Table
        self.public_rt = aws.ec2.RouteTable(
            f"brazilcart-public-rt-{env}",
            vpc_id=self.vpc.id,
            tags={**default_tags, "Name": f"brazilcart-public-rt-{env}"},
            opts=ResourceOptions(parent=self)
        )

        aws.ec2.Route(
            f"brazilcart-public-route-{env}",
            route_table_id=self.public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"brazilcart-public-rta-{i}-{env}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Private Route Tables (one per NAT Gateway for HA)
        for i, (nat, subnet) in enumerate(zip(self.nat_gateways, self.private_subnets)):
            rt = aws.ec2.RouteTable(
                f"brazilcart-private-rt-{i}-{env}",
                vpc_id=self.vpc.id,
                tags={**default_tags, "Name": f"brazilcart-private-rt-{i}-{env}"},
                opts=ResourceOptions(parent=self)
            )

            aws.ec2.Route(
                f"brazilcart-private-route-{i}-{env}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat.id,
                opts=ResourceOptions(parent=self)
            )

            aws.ec2.RouteTableAssociation(
                f"brazilcart-private-rta-{i}-{env}",
                subnet_id=subnet.id,
                route_table_id=rt.id,
                opts=ResourceOptions(parent=self)
            )

        # VPC Flow Logs
        flow_logs_role = aws.iam.Role(
            f"brazilcart-flow-logs-role-{env}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={**default_tags, "Name": f"brazilcart-flow-logs-role-{env}"},
            opts=ResourceOptions(parent=self)
        )

        flow_logs_policy = aws.iam.RolePolicy(
            f"brazilcart-flow-logs-policy-{env}",
            role=flow_logs_role.id,
            policy="""{
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
                    "Resource": "*"
                }]
            }""",
            opts=ResourceOptions(parent=self)
        )

        flow_logs_log_group = aws.cloudwatch.LogGroup(
            f"brazilcart-vpc-flow-logs-{env}",
            name=f"/aws/vpc/brazilcart-{env}",
            retention_in_days=7,
            kms_key_id=self.kms_key.arn,
            tags={**default_tags, "Name": f"brazilcart-vpc-flow-logs-{env}"},
            opts=ResourceOptions(parent=self)
        )

        flow_log = aws.ec2.FlowLog(
            f"brazilcart-flow-log-{env}",
            vpc_id=self.vpc.id,
            traffic_type="ALL",
            iam_role_arn=flow_logs_role.arn,
            log_destination_type="cloud-watch-logs",
            log_destination=flow_logs_log_group.arn,
            tags={**default_tags, "Name": f"brazilcart-flow-log-{env}"},
            opts=ResourceOptions(parent=self, depends_on=[flow_logs_policy])
        )

        # ====== RDS Security Group ======
        self.rds_sg = aws.ec2.SecurityGroup(
            f"brazilcart-rds-sg-{env}",
            vpc_id=self.vpc.id,
            description="Security group for RDS PostgreSQL",
            ingress=[{
                "protocol": "tcp",
                "from_port": 5432,
                "to_port": 5432,
                "cidr_blocks": ["10.0.0.0/16"]
            }],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"]
            }],
            tags={**default_tags, "Name": f"brazilcart-rds-sg-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # ====== RDS Subnet Group ======
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"brazilcart-db-subnet-group-{env}",
            subnet_ids=[s.id for s in self.private_subnets],
            tags={**default_tags, "Name": f"brazilcart-db-subnet-group-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # ====== Secrets Manager for RDS Password ======
        # CRITICAL FIX: Use password_length instead of length
        rds_password = aws.secretsmanager.get_random_password(
            password_length=32,
            exclude_punctuation=True,
            exclude_characters="/@\" '\\"
        )

        self.db_secret = aws.secretsmanager.Secret(
            f"brazilcart-db-secret-{env}",
            name=f"brazilcart-db-password-{env}",
            kms_key_id=self.kms_key.id,
            description="RDS PostgreSQL master password",
            tags={**default_tags, "Name": f"brazilcart-db-secret-{env}"},
            opts=ResourceOptions(parent=self)
        )

        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"brazilcart-db-secret-version-{env}",
            secret_id=self.db_secret.id,
            secret_string=rds_password.random_password,
            opts=ResourceOptions(parent=self)
        )

        # ====== RDS PostgreSQL Instance ======
        self.rds_instance = aws.rds.Instance(
            f"brazilcart-db-{env}",
            identifier=f"brazilcart-db-{env}",
            engine="postgres",
            engine_version="15.4",
            instance_class="db.t3.medium",
            allocated_storage=100,
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            db_name="brazilcart_production",
            username="brazilcart_admin",
            password=rds_password.random_password,
            multi_az=True,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            skip_final_snapshot=True,
            publicly_accessible=False,
            tags={**default_tags, "Name": f"brazilcart-db-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # ====== ElastiCache Security Group ======
        self.elasticache_sg = aws.ec2.SecurityGroup(
            f"brazilcart-elasticache-sg-{env}",
            vpc_id=self.vpc.id,
            description="Security group for ElastiCache Redis",
            ingress=[{
                "protocol": "tcp",
                "from_port": 6379,
                "to_port": 6379,
                "cidr_blocks": ["10.0.0.0/16"]
            }],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"]
            }],
            tags={**default_tags, "Name": f"brazilcart-elasticache-sg-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # ====== ElastiCache Subnet Group ======
        self.cache_subnet_group = aws.elasticache.SubnetGroup(
            f"brazilcart-cache-subnet-group-{env}",
            subnet_ids=[s.id for s in self.private_subnets],
            tags={**default_tags, "Name": f"brazilcart-cache-subnet-group-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # ====== Auth Token for ElastiCache ======
        redis_auth_token = aws.secretsmanager.get_random_password(
            password_length=32,
            exclude_punctuation=True,
            exclude_characters="/@\" '\\"
        )

        self.redis_secret = aws.secretsmanager.Secret(
            f"brazilcart-redis-secret-{env}",
            name=f"brazilcart-redis-auth-token-{env}",
            kms_key_id=self.kms_key.id,
            description="ElastiCache Redis auth token",
            tags={**default_tags, "Name": f"brazilcart-redis-secret-{env}"},
            opts=ResourceOptions(parent=self)
        )

        self.redis_secret_version = aws.secretsmanager.SecretVersion(
            f"brazilcart-redis-secret-version-{env}",
            secret_id=self.redis_secret.id,
            secret_string=redis_auth_token.random_password,
            opts=ResourceOptions(parent=self)
        )

        # ====== ElastiCache Replication Group ======
        # CRITICAL FIX: Remove auth_token_enabled parameter (doesn't exist in Pulumi)
        # Auth token is enabled by providing auth_token parameter
        self.elasticache_replication_group = aws.elasticache.ReplicationGroup(
            f"brazilcart-redis-{env}",
            replication_group_id=f"brazilcart-redis-{env}",
            description="BrazilCart Redis cluster with Multi-AZ",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",
            num_cache_clusters=2,
            parameter_group_name="default.redis7",
            port=6379,
            subnet_group_name=self.cache_subnet_group.name,
            security_group_ids=[self.elasticache_sg.id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            auth_token=redis_auth_token.random_password,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00",
            tags={**default_tags, "Name": f"brazilcart-redis-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # ====== S3 Bucket for CodePipeline Artifacts ======
        self.artifact_bucket = aws.s3.Bucket(
            f"brazilcart-pipeline-artifacts-{env}",
            bucket=f"brazilcart-pipeline-artifacts-{env}-{pulumi.get_stack()}",
            force_destroy=True,
            tags={**default_tags, "Name": f"brazilcart-pipeline-artifacts-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning
        bucket_versioning = aws.s3.BucketVersioningV2(
            f"brazilcart-pipeline-artifacts-versioning-{env}",
            bucket=self.artifact_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Server-side encryption
        encryption_args = aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="aws:kms",
            kms_master_key_id=self.kms_key.arn
        )
        bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"brazilcart-pipeline-artifacts-encryption-{env}",
            bucket=self.artifact_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=encryption_args
            )],
            opts=ResourceOptions(parent=self)
        )

        # Block public access
        bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"brazilcart-pipeline-artifacts-public-access-{env}",
            bucket=self.artifact_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # ====== CodeCommit Repository ======
        self.codecommit_repo = aws.codecommit.Repository(
            f"brazilcart-app-{env}",
            repository_name=f"brazilcart-app-{env}",
            description="BrazilCart application source code",
            default_branch="main",
            tags={**default_tags, "Name": f"brazilcart-app-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # ====== IAM Role for CodeBuild ======
        self.codebuild_role = aws.iam.Role(
            f"brazilcart-codebuild-role-{env}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "codebuild.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={**default_tags, "Name": f"brazilcart-codebuild-role-{env}"},
            opts=ResourceOptions(parent=self)
        )

        codebuild_policy = aws.iam.RolePolicy(
            f"brazilcart-codebuild-policy-{env}",
            role=self.codebuild_role.id,
            policy=pulumi.Output.all(
                self.artifact_bucket.arn,
                self.kms_key.arn
            ).apply(lambda args: f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": "{args[0]}/*"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "{args[1]}"
                    }}
                ]
            }}"""),
            opts=ResourceOptions(parent=self)
        )

        # ====== CloudWatch Log Group for CodeBuild ======
        self.codebuild_log_group = aws.cloudwatch.LogGroup(
            f"brazilcart-codebuild-logs-{env}",
            name=f"/aws/codebuild/brazilcart-{env}",
            retention_in_days=7,
            kms_key_id=self.kms_key.arn,
            tags={**default_tags, "Name": f"brazilcart-codebuild-logs-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # ====== CodeBuild Project ======
        self.codebuild_project = aws.codebuild.Project(
            f"brazilcart-build-{env}",
            name=f"brazilcart-build-{env}",
            description="BrazilCart application build project",
            service_role=self.codebuild_role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type="CODEPIPELINE"
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type="BUILD_GENERAL1_SMALL",
                image="aws/codebuild/standard:7.0",
                type="LINUX_CONTAINER",
                privileged_mode=True,
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="AWS_DEFAULT_REGION",
                        value=aws.get_region().name
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="ENVIRONMENT",
                        value=env
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type="CODEPIPELINE",
                buildspec="""version: 0.2
phases:
  install:
    commands:
      - echo "Installing dependencies..."
      - npm install
  build:
    commands:
      - echo "Building application..."
      - npm run build
      - echo "Running tests..."
      - npm test
artifacts:
  files:
    - '**/*'
"""
            ),
            logs_config=aws.codebuild.ProjectLogsConfigArgs(
                cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
                    group_name=self.codebuild_log_group.name,
                    status="ENABLED"
                )
            ),
            encryption_key=self.kms_key.arn,
            tags={**default_tags, "Name": f"brazilcart-build-{env}"},
            opts=ResourceOptions(parent=self, depends_on=[codebuild_policy])
        )

        # ====== IAM Role for CodePipeline ======
        self.codepipeline_role = aws.iam.Role(
            f"brazilcart-codepipeline-role-{env}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "codepipeline.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={**default_tags, "Name": f"brazilcart-codepipeline-role-{env}"},
            opts=ResourceOptions(parent=self)
        )

        codepipeline_policy = aws.iam.RolePolicy(
            f"brazilcart-codepipeline-policy-{env}",
            role=self.codepipeline_role.id,
            policy=pulumi.Output.all(
                self.artifact_bucket.arn,
                self.codecommit_repo.arn,
                self.codebuild_project.arn,
                self.kms_key.arn
            ).apply(lambda args: f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": "{args[0]}/*"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "codecommit:GetBranch",
                            "codecommit:GetCommit",
                            "codecommit:UploadArchive",
                            "codecommit:GetUploadArchiveStatus"
                        ],
                        "Resource": "{args[1]}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "codebuild:BatchGetBuilds",
                            "codebuild:StartBuild"
                        ],
                        "Resource": "{args[2]}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "{args[3]}"
                    }}
                ]
            }}"""),
            opts=ResourceOptions(parent=self)
        )

        # ====== CloudWatch Log Group for CodePipeline ======
        self.codepipeline_log_group = aws.cloudwatch.LogGroup(
            f"brazilcart-codepipeline-logs-{env}",
            name=f"/aws/codepipeline/brazilcart-{env}",
            retention_in_days=7,
            kms_key_id=self.kms_key.arn,
            tags={**default_tags, "Name": f"brazilcart-codepipeline-logs-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # ====== CodePipeline ======
        # CRITICAL FIX: Use artifact_stores (plural) not artifact_store
        self.codepipeline = aws.codepipeline.Pipeline(
            f"brazilcart-pipeline-{env}",
            name=f"brazilcart-pipeline-{env}",
            role_arn=self.codepipeline_role.arn,
            artifact_stores=[aws.codepipeline.PipelineArtifactStoreArgs(
                location=self.artifact_bucket.bucket,
                type="S3",
                encryption_key=aws.codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
                    id=self.kms_key.arn,
                    type="KMS"
                )
            )],
            stages=[
                # Source Stage
                aws.codepipeline.PipelineStageArgs(
                    name="Source",
                    actions=[aws.codepipeline.PipelineStageActionArgs(
                        name="Source",
                        category="Source",
                        owner="AWS",
                        provider="CodeCommit",
                        version="1",
                        output_artifacts=["SourceOutput"],
                        configuration={
                            "RepositoryName": self.codecommit_repo.repository_name,
                            "BranchName": "main",
                            "PollForSourceChanges": "false"
                        }
                    )]
                ),
                # Build Stage
                aws.codepipeline.PipelineStageArgs(
                    name="Build",
                    actions=[aws.codepipeline.PipelineStageActionArgs(
                        name="Build",
                        category="Build",
                        owner="AWS",
                        provider="CodeBuild",
                        version="1",
                        input_artifacts=["SourceOutput"],
                        output_artifacts=["BuildOutput"],
                        configuration={
                            "ProjectName": self.codebuild_project.name
                        }
                    )]
                ),
                # Deploy Stage with Manual Approval
                aws.codepipeline.PipelineStageArgs(
                    name="Deploy",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="ManualApproval",
                            category="Approval",
                            owner="AWS",
                            provider="Manual",
                            version="1",
                            configuration={
                                "CustomData": "Please review and approve production deployment"
                            }
                        )
                    ]
                )
            ],
            tags={**default_tags, "Name": f"brazilcart-pipeline-{env}"},
            opts=ResourceOptions(parent=self, depends_on=[codepipeline_policy])
        )

        # ====== CloudWatch Alarms ======
        # RDS CPU Alarm
        self.rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"brazilcart-rds-cpu-alarm-{env}",
            name=f"brazilcart-rds-cpu-{env}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="RDS CPU utilization too high",
            dimensions={
                "DBInstanceIdentifier": self.rds_instance.id
            },
            tags={**default_tags, "Name": f"brazilcart-rds-cpu-alarm-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # ElastiCache Memory Alarm
        self.redis_memory_alarm = aws.cloudwatch.MetricAlarm(
            f"brazilcart-redis-memory-alarm-{env}",
            name=f"brazilcart-redis-memory-{env}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseMemoryUsagePercentage",
            namespace="AWS/ElastiCache",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="ElastiCache memory utilization too high",
            dimensions={
                "ReplicationGroupId": self.elasticache_replication_group.id
            },
            tags={**default_tags, "Name": f"brazilcart-redis-memory-alarm-{env}"},
            opts=ResourceOptions(parent=self)
        )

        # ====== Exports ======
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "rds_endpoint": self.rds_instance.endpoint,
            "rds_secret_arn": self.db_secret.arn,
            "redis_endpoint": self.elasticache_replication_group.configuration_endpoint_address,
            "redis_secret_arn": self.redis_secret.arn,
            "codecommit_clone_url_http": self.codecommit_repo.clone_url_http,
            "codepipeline_name": self.codepipeline.name,
            "artifact_bucket": self.artifact_bucket.bucket
        })
