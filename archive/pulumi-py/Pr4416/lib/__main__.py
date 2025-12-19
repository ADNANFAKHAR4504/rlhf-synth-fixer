"""
Pulumi program for educational platform CI/CD infrastructure
Handles student data with compliance and security requirements
"""
import os
import json
import random
import string
import pulumi
import pulumi_aws as aws
from pulumi import Output, export

# Get environment suffix from environment
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
region = os.getenv("AWS_REGION", "ap-southeast-1")

# Get current AWS account ID
current = aws.get_caller_identity()
account_id = current.account_id

# Create KMS key for encryption at rest
kms_key = aws.kms.Key(
    f"education-platform-key-{environment_suffix}",
    description="KMS key for educational platform data encryption",
    enable_key_rotation=True,
    deletion_window_in_days=10,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "Enable IAM User Permissions",
                "Effect": "Allow",
                "Principal": {
                    "AWS": f"arn:aws:iam::{account_id}:root"
                },
                "Action": "kms:*",
                "Resource": "*"
            },
            {
                "Sid": "Allow CloudWatch Logs",
                "Effect": "Allow",
                "Principal": {
                    "Service": f"logs.{region}.amazonaws.com"
                },
                "Action": [
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:CreateGrant",
                    "kms:DescribeKey"
                ],
                "Resource": "*"
            }
        ]
    }),
    tags={
        "Name": f"EducationPlatformKey-{environment_suffix}",
        "Environment": environment_suffix,
        "Purpose": "DataEncryption"
    }
)

kms_alias = aws.kms.Alias(
    f"education-platform-key-alias-{environment_suffix}",
    name=f"alias/education-platform-{environment_suffix}",
    target_key_id=kms_key.id
)

# Create VPC
vpc = aws.ec2.Vpc(
    f"education-vpc-{environment_suffix}",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": f"education-vpc-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create Internet Gateway
igw = aws.ec2.InternetGateway(
    f"education-igw-{environment_suffix}",
    vpc_id=vpc.id,
    tags={
        "Name": f"education-igw-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create public subnets in 2 AZs
public_subnet_1 = aws.ec2.Subnet(
    f"education-public-subnet-1-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    availability_zone=f"{region}a",
    map_public_ip_on_launch=True,
    tags={
        "Name": f"education-public-subnet-1-{environment_suffix}",
        "Environment": environment_suffix,
        "Type": "Public"
    }
)

public_subnet_2 = aws.ec2.Subnet(
    f"education-public-subnet-2-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.2.0/24",
    availability_zone=f"{region}b",
    map_public_ip_on_launch=True,
    tags={
        "Name": f"education-public-subnet-2-{environment_suffix}",
        "Environment": environment_suffix,
        "Type": "Public"
    }
)

# Create private subnets in 2 AZs
private_subnet_1 = aws.ec2.Subnet(
    f"education-private-subnet-1-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.10.0/24",
    availability_zone=f"{region}a",
    tags={
        "Name": f"education-private-subnet-1-{environment_suffix}",
        "Environment": environment_suffix,
        "Type": "Private"
    }
)

private_subnet_2 = aws.ec2.Subnet(
    f"education-private-subnet-2-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.11.0/24",
    availability_zone=f"{region}b",
    tags={
        "Name": f"education-private-subnet-2-{environment_suffix}",
        "Environment": environment_suffix,
        "Type": "Private"
    }
)

# Allocate Elastic IP for NAT Gateway
eip = aws.ec2.Eip(
    f"education-nat-eip-{environment_suffix}",
    domain="vpc",
    tags={
        "Name": f"education-nat-eip-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create NAT Gateway in public subnet
nat_gateway = aws.ec2.NatGateway(
    f"education-nat-{environment_suffix}",
    allocation_id=eip.id,
    subnet_id=public_subnet_1.id,
    tags={
        "Name": f"education-nat-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(depends_on=[igw])
)

# Create route table for public subnets
public_route_table = aws.ec2.RouteTable(
    f"education-public-rt-{environment_suffix}",
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )
    ],
    tags={
        "Name": f"education-public-rt-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Associate public subnets with public route table
public_rt_assoc_1 = aws.ec2.RouteTableAssociation(
    f"education-public-rt-assoc-1-{environment_suffix}",
    subnet_id=public_subnet_1.id,
    route_table_id=public_route_table.id
)

public_rt_assoc_2 = aws.ec2.RouteTableAssociation(
    f"education-public-rt-assoc-2-{environment_suffix}",
    subnet_id=public_subnet_2.id,
    route_table_id=public_route_table.id
)

# Create route table for private subnets
private_route_table = aws.ec2.RouteTable(
    f"education-private-rt-{environment_suffix}",
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateway.id
        )
    ],
    tags={
        "Name": f"education-private-rt-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Associate private subnets with private route table
private_rt_assoc_1 = aws.ec2.RouteTableAssociation(
    f"education-private-rt-assoc-1-{environment_suffix}",
    subnet_id=private_subnet_1.id,
    route_table_id=private_route_table.id
)

private_rt_assoc_2 = aws.ec2.RouteTableAssociation(
    f"education-private-rt-assoc-2-{environment_suffix}",
    subnet_id=private_subnet_2.id,
    route_table_id=private_route_table.id
)

# Create security group for RDS
rds_security_group = aws.ec2.SecurityGroup(
    f"education-rds-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for RDS MySQL instance",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=3306,
            to_port=3306,
            cidr_blocks=["10.0.0.0/16"],
            description="Allow MySQL access from VPC"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic"
        )
    ],
    tags={
        "Name": f"education-rds-sg-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create security group for ElastiCache
elasticache_security_group = aws.ec2.SecurityGroup(
    f"education-elasticache-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for ElastiCache Redis cluster",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=6379,
            to_port=6379,
            cidr_blocks=["10.0.0.0/16"],
            description="Allow Redis access from VPC"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic"
        )
    ],
    tags={
        "Name": f"education-elasticache-sg-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create DB subnet group
db_subnet_group = aws.rds.SubnetGroup(
    f"education-db-subnet-group-{environment_suffix}",
    name=f"education-db-subnet-group-{environment_suffix}",
    subnet_ids=[private_subnet_1.id, private_subnet_2.id],
    tags={
        "Name": f"education-db-subnet-group-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create database credentials in Secrets Manager with automatic rotation
# Generate a secure random password
def generate_password():
    chars = string.ascii_letters + string.digits + "!@#$%^&*()"
    # Ensure password meets MySQL requirements
    password = ''.join(random.choice(chars) for _ in range(32))
    return password

db_password = generate_password()
db_username = "admin"

# Create secret for database credentials
db_secret = aws.secretsmanager.Secret(
    f"education-platform-db-secret-{environment_suffix}",
    name=f"education-platform-db-credentials-{environment_suffix}",
    description="Database credentials for educational platform",
    kms_key_id=kms_key.id,
    recovery_window_in_days=0,  # Allows immediate deletion for testing
    tags={
        "Name": f"education-platform-db-secret-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Store the credentials in the secret
db_secret_version = aws.secretsmanager.SecretVersion(
    f"education-platform-db-secret-version-{environment_suffix}",
    secret_id=db_secret.id,
    secret_string=json.dumps({
        "username": db_username,
        "password": db_password
    })
)

# Create RDS MySQL instance with encryption at rest
rds_instance = aws.rds.Instance(
    f"education-rds-{environment_suffix}",
    identifier=f"education-db-{environment_suffix}",
    engine="mysql",
    engine_version="8.0.39",
    instance_class="db.t3.micro",
    allocated_storage=20,
    storage_encrypted=True,
    kms_key_id=kms_key.arn,
    db_name="educationdb",
    username=db_username,
    password=Output.secret(db_password),
    db_subnet_group_name=db_subnet_group.name,
    vpc_security_group_ids=[rds_security_group.id],
    backup_retention_period=1,
    backup_window="03:00-04:00",
    maintenance_window="mon:04:00-mon:05:00",
    skip_final_snapshot=True,
    publicly_accessible=False,
    multi_az=False,
    enabled_cloudwatch_logs_exports=["error", "general", "slowquery"],
    tags={
        "Name": f"education-rds-{environment_suffix}",
        "Environment": environment_suffix,
        "DataClassification": "Sensitive"
    }
)

# Create ElastiCache subnet group
elasticache_subnet_group = aws.elasticache.SubnetGroup(
    f"education-elasticache-subnet-group-{environment_suffix}",
    name=f"education-elasticache-subnet-group-{environment_suffix}",
    subnet_ids=[private_subnet_1.id, private_subnet_2.id],
    tags={
        "Name": f"education-elasticache-subnet-group-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create ElastiCache Redis cluster for session management
elasticache_cluster = aws.elasticache.Cluster(
    f"education-redis-{environment_suffix}",
    cluster_id=f"education-redis-{environment_suffix}",
    engine="redis",
    engine_version="7.0",
    node_type="cache.t3.micro",
    num_cache_nodes=1,
    parameter_group_name="default.redis7",
    port=6379,
    subnet_group_name=elasticache_subnet_group.name,
    security_group_ids=[elasticache_security_group.id],
    snapshot_retention_limit=1,
    snapshot_window="03:00-05:00",
    tags={
        "Name": f"education-redis-{environment_suffix}",
        "Environment": environment_suffix,
        "Purpose": "SessionManagement"
    }
)

# Create CloudWatch Log Group for pipeline
pipeline_log_group = aws.cloudwatch.LogGroup(
    f"education-pipeline-logs-{environment_suffix}",
    name=f"/aws/codepipeline/education-platform-{environment_suffix}",
    retention_in_days=14,
    kms_key_id=kms_key.arn,
    tags={
        "Name": f"education-pipeline-logs-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create S3 bucket for pipeline artifacts
artifact_bucket = aws.s3.Bucket(
    f"education-artifacts-{environment_suffix}",
    bucket=f"education-artifacts-{environment_suffix}-{region}",
    force_destroy=True,
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=(
                aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=kms_key.arn
                )
            ),
            bucket_key_enabled=True
        )
    ),
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True
    ),
    tags={
        "Name": f"education-artifacts-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Block public access to artifact bucket
artifact_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    f"education-artifacts-public-access-block-{environment_suffix}",
    bucket=artifact_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)

# Create IAM role for CodePipeline
codepipeline_role = aws.iam.Role(
    f"education-codepipeline-role-{environment_suffix}",
    name=f"education-codepipeline-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "codepipeline.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }),
    tags={
        "Name": f"education-codepipeline-role-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create IAM policy for CodePipeline
codepipeline_policy = aws.iam.Policy(
    f"education-codepipeline-policy-{environment_suffix}",
    name=f"education-codepipeline-policy-{environment_suffix}",
    policy=Output.all(artifact_bucket.arn, kms_key.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:PutObject"
                    ],
                    "Resource": [
                        f"{args[0]}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        args[0]
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                        "kms:Encrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*"
                    ],
                    "Resource": [
                        args[1]
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "codebuild:BatchGetBuilds",
                        "codebuild:StartBuild"
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
                    "Resource": "*"
                }
            ]
        })
    )
)

# Attach policy to CodePipeline role
codepipeline_policy_attachment = aws.iam.RolePolicyAttachment(
    f"education-codepipeline-policy-attachment-{environment_suffix}",
    role=codepipeline_role.name,
    policy_arn=codepipeline_policy.arn
)

# Create IAM role for CodeBuild
codebuild_role = aws.iam.Role(
    f"education-codebuild-role-{environment_suffix}",
    name=f"education-codebuild-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "codebuild.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }),
    tags={
        "Name": f"education-codebuild-role-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create IAM policy for CodeBuild
codebuild_policy = aws.iam.Policy(
    f"education-codebuild-policy-{environment_suffix}",
    name=f"education-codebuild-policy-{environment_suffix}",
    policy=Output.all(artifact_bucket.arn, kms_key.arn, pipeline_log_group.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    "Resource": [
                        f"{args[0]}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                        "kms:Encrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*"
                    ],
                    "Resource": [
                        args[1]
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": [
                        args[2],
                        f"{args[2]}:*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue"
                    ],
                    "Resource": f"arn:aws:secretsmanager:{region}:{account_id}:secret:education-platform-*"
                }
            ]
        })
    )
)

# Attach policy to CodeBuild role
codebuild_policy_attachment = aws.iam.RolePolicyAttachment(
    f"education-codebuild-policy-attachment-{environment_suffix}",
    role=codebuild_role.name,
    policy_arn=codebuild_policy.arn
)

# Create CodeBuild project for staging
codebuild_staging = aws.codebuild.Project(
    f"education-build-staging-{environment_suffix}",
    name=f"education-build-staging-{environment_suffix}",
    description="Build project for staging environment",
    service_role=codebuild_role.arn,
    artifacts=aws.codebuild.ProjectArtifactsArgs(
        type="CODEPIPELINE"
    ),
    environment=aws.codebuild.ProjectEnvironmentArgs(
        compute_type="BUILD_GENERAL1_SMALL",
        image="aws/codebuild/standard:7.0",
        type="LINUX_CONTAINER",
        environment_variables=[
            aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                name="ENVIRONMENT",
                value="staging"
            ),
            aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                name="DB_ENDPOINT",
                value=rds_instance.endpoint
            ),
            aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                name="REDIS_ENDPOINT",
                value=elasticache_cluster.cache_nodes[0].address
            )
        ]
    ),
    source=aws.codebuild.ProjectSourceArgs(
        type="CODEPIPELINE",
        buildspec="buildspec-staging.yml"
    ),
    logs_config=aws.codebuild.ProjectLogsConfigArgs(
        cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
            group_name=pipeline_log_group.name,
            stream_name="staging-build"
        )
    ),
    tags={
        "Name": f"education-build-staging-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create CodeBuild project for production
codebuild_production = aws.codebuild.Project(
    f"education-build-production-{environment_suffix}",
    name=f"education-build-production-{environment_suffix}",
    description="Build project for production environment",
    service_role=codebuild_role.arn,
    artifacts=aws.codebuild.ProjectArtifactsArgs(
        type="CODEPIPELINE"
    ),
    environment=aws.codebuild.ProjectEnvironmentArgs(
        compute_type="BUILD_GENERAL1_SMALL",
        image="aws/codebuild/standard:7.0",
        type="LINUX_CONTAINER",
        environment_variables=[
            aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                name="ENVIRONMENT",
                value="production"
            ),
            aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                name="DB_ENDPOINT",
                value=rds_instance.endpoint
            ),
            aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                name="REDIS_ENDPOINT",
                value=elasticache_cluster.cache_nodes[0].address
            )
        ]
    ),
    source=aws.codebuild.ProjectSourceArgs(
        type="CODEPIPELINE",
        buildspec="buildspec-production.yml"
    ),
    logs_config=aws.codebuild.ProjectLogsConfigArgs(
        cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
            group_name=pipeline_log_group.name,
            stream_name="production-build"
        )
    ),
    tags={
        "Name": f"education-build-production-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create SNS topic for manual approval notifications
approval_topic = aws.sns.Topic(
    f"education-pipeline-approval-{environment_suffix}",
    name=f"education-pipeline-approval-{environment_suffix}",
    kms_master_key_id=kms_key.id,
    tags={
        "Name": f"education-pipeline-approval-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Create CodePipeline
pipeline = aws.codepipeline.Pipeline(
    f"education-pipeline-{environment_suffix}",
    name=f"education-pipeline-{environment_suffix}",
    role_arn=codepipeline_role.arn,
    artifact_stores=[aws.codepipeline.PipelineArtifactStoreArgs(
        location=artifact_bucket.bucket,
        type="S3",
        encryption_key=aws.codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
            id=kms_key.arn,
            type="KMS"
        )
    )],
    stages=[
        aws.codepipeline.PipelineStageArgs(
            name="Source",
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name="Source",
                    category="Source",
                    owner="AWS",
                    provider="S3",
                    version="1",
                    output_artifacts=["source_output"],
                    configuration={
                        "S3Bucket": artifact_bucket.bucket,
                        "S3ObjectKey": "source.zip",
                        "PollForSourceChanges": "false"
                    }
                )
            ]
        ),
        aws.codepipeline.PipelineStageArgs(
            name="Staging",
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name="Build",
                    category="Build",
                    owner="AWS",
                    provider="CodeBuild",
                    version="1",
                    input_artifacts=["source_output"],
                    output_artifacts=["staging_output"],
                    configuration={
                        "ProjectName": codebuild_staging.name
                    }
                )
            ]
        ),
        aws.codepipeline.PipelineStageArgs(
            name="ManualApproval",
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name="ApproveProduction",
                    category="Approval",
                    owner="AWS",
                    provider="Manual",
                    version="1",
                    configuration={
                        "NotificationArn": approval_topic.arn,
                        "CustomData": "Please review staging deployment and approve for production"
                    }
                )
            ]
        ),
        aws.codepipeline.PipelineStageArgs(
            name="Production",
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name="Build",
                    category="Build",
                    owner="AWS",
                    provider="CodeBuild",
                    version="1",
                    input_artifacts=["source_output"],
                    output_artifacts=["production_output"],
                    configuration={
                        "ProjectName": codebuild_production.name
                    }
                )
            ]
        )
    ],
    tags={
        "Name": f"education-pipeline-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(depends_on=[codepipeline_policy_attachment])
)

# Create CloudWatch alarm for pipeline failures
pipeline_alarm = aws.cloudwatch.MetricAlarm(
    f"education-pipeline-failure-alarm-{environment_suffix}",
    name=f"education-pipeline-failure-alarm-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=1,
    metric_name="PipelineExecutionFailure",
    namespace="AWS/CodePipeline",
    period=300,
    statistic="Sum",
    threshold=0,
    alarm_description="Alert when pipeline execution fails",
    dimensions={
        "PipelineName": pipeline.name
    },
    treat_missing_data="notBreaching",
    tags={
        "Name": f"education-pipeline-failure-alarm-{environment_suffix}",
        "Environment": environment_suffix
    }
)

# Export outputs
export("vpc_id", vpc.id)
export("public_subnet_1_id", public_subnet_1.id)
export("public_subnet_2_id", public_subnet_2.id)
export("private_subnet_1_id", private_subnet_1.id)
export("private_subnet_2_id", private_subnet_2.id)
export("nat_gateway_id", nat_gateway.id)
export("rds_endpoint", rds_instance.endpoint)
export("rds_address", rds_instance.address)
export("rds_arn", rds_instance.arn)
export("elasticache_endpoint", elasticache_cluster.cache_nodes[0].address)
export("elasticache_port", elasticache_cluster.cache_nodes[0].port)
export("kms_key_id", kms_key.id)
export("kms_key_arn", kms_key.arn)
export("artifact_bucket_name", artifact_bucket.bucket)
export("artifact_bucket_arn", artifact_bucket.arn)
export("pipeline_name", pipeline.name)
export("pipeline_arn", pipeline.arn)
export("codebuild_staging_name", codebuild_staging.name)
export("codebuild_production_name", codebuild_production.name)
export("approval_topic_arn", approval_topic.arn)
export("pipeline_log_group_name", pipeline_log_group.name)
export("db_secret_arn", db_secret.arn)
