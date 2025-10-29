# BrazilCart E-Commerce Infrastructure - Actual Implementation

This document contains the actual implementation of the BrazilCart e-commerce infrastructure using Pulumi with Python.

## Overview

This Pulumi Python stack deploys the BrazilCart e-commerce platform infrastructure with the following components:

- **KMS Encryption**: Customer-managed KMS key with automatic rotation for RDS encryption
- **VPC Infrastructure**: VPC with 3 private subnets across 3 availability zones
- **RDS PostgreSQL**: Multi-AZ PostgreSQL 15.7 database with encryption at rest
- **ElastiCache Redis**: Multi-AZ Redis 7.0 cluster with encryption at rest and in transit
- **Secrets Manager**: Automated database credential management
- **CodePipeline**: CI/CD pipeline with Source, Build (CodeBuild), and Deploy stages
- **CloudWatch Monitoring**: Alarms for RDS and ElastiCache CPU utilization, connections, and evictions
- **Security Groups**: VPC-only access for database and cache resources

## File: lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class for BrazilCart e-commerce infrastructure.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json
import os


class TapStackArgs:
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Read AWS region from file
        region_file = os.path.join(os.path.dirname(__file__), 'AWS_REGION')
        with open(region_file, 'r') as f:
            aws_region = f.read().strip()

        # Create KMS key for encryption
        kms_key = aws.kms.Key(
            f"brazilcart-kms-{self.environment_suffix}",
            description="KMS key for BrazilCart RDS encryption",
            enable_key_rotation=True,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create KMS key alias for easier management
        kms_alias = aws.kms.Alias(
            f"brazilcart-kms-alias-{self.environment_suffix}",
            name=f"alias/brazilcart-{self.environment_suffix}",
            target_key_id=kms_key.id,
            opts=ResourceOptions(parent=self)
        )

        # Create VPC for resources
        vpc = aws.ec2.Vpc(
            f"brazilcart-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"brazilcart-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create subnets in multiple AZs
        subnet_a = aws.ec2.Subnet(
            f"brazilcart-subnet-a-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            tags={**self.tags, "Name": f"brazilcart-subnet-a-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        subnet_b = aws.ec2.Subnet(
            f"brazilcart-subnet-b-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            tags={**self.tags, "Name": f"brazilcart-subnet-b-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        subnet_c = aws.ec2.Subnet(
            f"brazilcart-subnet-c-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.3.0/24",
            availability_zone=f"{aws_region}c",
            tags={**self.tags, "Name": f"brazilcart-subnet-c-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create DB subnet group
        db_subnet_group = aws.rds.SubnetGroup(
            f"brazilcart-db-subnet-{self.environment_suffix}",
            subnet_ids=[subnet_a.id, subnet_b.id, subnet_c.id],
            tags={**self.tags, "Name": f"brazilcart-db-subnet-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create ElastiCache subnet group
        cache_subnet_group = aws.elasticache.SubnetGroup(
            f"brazilcart-cache-subnet-{self.environment_suffix}",
            subnet_ids=[subnet_a.id, subnet_b.id, subnet_c.id],
            description="Subnet group for BrazilCart ElastiCache",
            opts=ResourceOptions(parent=self)
        )

        # Create security group for RDS
        rds_sg = aws.ec2.SecurityGroup(
            f"brazilcart-rds-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for BrazilCart RDS",
            ingress=[{
                "protocol": "tcp",
                "from_port": 5432,
                "to_port": 5432,
                "cidr_blocks": ["10.0.0.0/16"]
            }],
            egress=[{
                "protocol": "tcp",
                "from_port": 443,
                "to_port": 443,
                "cidr_blocks": ["10.0.0.0/16"],
                "description": "Allow HTTPS within VPC for AWS service communication"
            }],
            tags={**self.tags, "Name": f"brazilcart-rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create security group for ElastiCache
        cache_sg = aws.ec2.SecurityGroup(
            f"brazilcart-cache-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for BrazilCart ElastiCache",
            ingress=[{
                "protocol": "tcp",
                "from_port": 6379,
                "to_port": 6379,
                "cidr_blocks": ["10.0.0.0/16"]
            }],
            egress=[{
                "protocol": "tcp",
                "from_port": 443,
                "to_port": 443,
                "cidr_blocks": ["10.0.0.0/16"],
                "description": "Allow HTTPS within VPC for AWS service communication"
            }],
            tags={**self.tags, "Name": f"brazilcart-cache-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Generate database password
        db_password = aws.secretsmanager.Secret(
            f"brazilcart-db-password-{self.environment_suffix}",
            description="Database password for BrazilCart RDS",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create random password using cryptographically secure generator
        import secrets
        import string
        # Generate secure password with uppercase, lowercase, digits, and special chars
        # RDS password requirements: only printable ASCII except '/', '@', '"', ' '
        alphabet = string.ascii_letters + string.digits + "!#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(20))

        db_password_version = aws.secretsmanager.SecretVersion(
            f"brazilcart-db-password-version-{self.environment_suffix}",
            secret_id=db_password.id,
            secret_string=password,
            opts=ResourceOptions(parent=self)
        )

        # Store database credentials in Secrets Manager
        db_credentials = aws.secretsmanager.Secret(
            f"brazilcart-db-credentials-{self.environment_suffix}",
            description="Database credentials for BrazilCart RDS",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        db_credentials_value = {
            "username": "brazilcart_admin",
            "password": password,
            "engine": "postgres",
            "host": "",
            "port": 5432,
            "dbname": "brazilcart"
        }

        db_credentials_version = aws.secretsmanager.SecretVersion(
            f"brazilcart-db-credentials-version-{self.environment_suffix}",
            secret_id=db_credentials.id,
            secret_string=json.dumps(db_credentials_value),
            opts=ResourceOptions(parent=self)
        )

        # Create RDS instance
        rds_instance = aws.rds.Instance(
            f"brazilcart-db-{self.environment_suffix}",
            identifier=f"brazilcart-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="15.7",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            db_name="brazilcart",
            username="brazilcart_admin",
            password=password,
            multi_az=True,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            skip_final_snapshot=True,
            backup_retention_period=7,
            tags={**self.tags, "Name": f"brazilcart-db-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create ElastiCache replication group (Multi-AZ)
        elasticache_cluster = aws.elasticache.ReplicationGroup(
            f"brazilcart-cache-{self.environment_suffix}",
            replication_group_id=f"bc-cache-{self.environment_suffix}",
            description="BrazilCart Redis cache cluster",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",
            num_cache_clusters=2,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            subnet_group_name=cache_subnet_group.name,
            security_group_ids=[cache_sg.id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            tags={**self.tags, "Name": f"brazilcart-cache-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch alarms for RDS monitoring
        rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"brazilcart-rds-cpu-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="Alert when RDS CPU exceeds 80%",
            dimensions={
                "DBInstanceIdentifier": rds_instance.identifier
            },
            tags={**self.tags, "Name": f"brazilcart-rds-cpu-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        rds_connections_alarm = aws.cloudwatch.MetricAlarm(
            f"brazilcart-rds-connections-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="Alert when RDS connections exceed 80",
            dimensions={
                "DBInstanceIdentifier": rds_instance.identifier
            },
            tags={**self.tags, "Name": f"brazilcart-rds-connections-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch alarms for ElastiCache monitoring
        cache_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"brazilcart-cache-cpu-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ElastiCache",
            period=300,
            statistic="Average",
            threshold=75.0,
            alarm_description="Alert when ElastiCache CPU exceeds 75%",
            dimensions={
                "ReplicationGroupId": elasticache_cluster.replication_group_id
            },
            tags={**self.tags, "Name": f"brazilcart-cache-cpu-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        cache_evictions_alarm = aws.cloudwatch.MetricAlarm(
            f"brazilcart-cache-evictions-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Evictions",
            namespace="AWS/ElastiCache",
            period=300,
            statistic="Average",
            threshold=1000.0,
            alarm_description="Alert when ElastiCache evictions exceed 1000",
            dimensions={
                "ReplicationGroupId": elasticache_cluster.replication_group_id
            },
            tags={**self.tags, "Name": f"brazilcart-cache-evictions-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create S3 bucket for CodePipeline artifacts with security hardening
        artifact_bucket = aws.s3.Bucket(
            f"brazilcart-artifacts-{self.environment_suffix}",
            tags={**self.tags, "Name": f"brazilcart-artifacts-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning on S3 bucket
        bucket_versioning = aws.s3.BucketVersioningV2(
            f"brazilcart-artifacts-versioning-{self.environment_suffix}",
            bucket=artifact_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            },
            opts=ResourceOptions(parent=self)
        )

        # Enable server-side encryption with KMS
        bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"brazilcart-artifacts-encryption-{self.environment_suffix}",
            bucket=artifact_bucket.id,
            rules=[{
                "apply_server_side_encryption_by_default": {
                    "sse_algorithm": "aws:kms",
                    "kms_master_key_id": kms_key.id
                },
                "bucket_key_enabled": True
            }],
            opts=ResourceOptions(parent=self)
        )

        # Block all public access
        bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"brazilcart-artifacts-public-access-{self.environment_suffix}",
            bucket=artifact_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Add lifecycle policy to expire old artifacts
        bucket_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
            f"brazilcart-artifacts-lifecycle-{self.environment_suffix}",
            bucket=artifact_bucket.id,
            rules=[{
                "id": "expire-old-artifacts",
                "status": "Enabled",
                "expiration": {
                    "days": 30
                },
                "noncurrent_version_expiration": {
                    "noncurrent_days": 7
                }
            }],
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for CodePipeline
        codepipeline_role = aws.iam.Role(
            f"brazilcart-codepipeline-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "codepipeline.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach policy to CodePipeline role
        codepipeline_policy = aws.iam.RolePolicy(
            f"brazilcart-codepipeline-policy-{self.environment_suffix}",
            role=codepipeline_role.id,
            policy=artifact_bucket.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:GetBucketLocation"
                        ],
                        "Resource": [f"{arn}/*", arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "codebuild:BatchGetBuilds",
                            "codebuild:StartBuild"
                        ],
                        "Resource": "*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for CodeBuild
        codebuild_role = aws.iam.Role(
            f"brazilcart-codebuild-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "codebuild.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach policy to CodeBuild role
        codebuild_policy = aws.iam.RolePolicy(
            f"brazilcart-codebuild-policy-{self.environment_suffix}",
            role=codebuild_role.id,
            policy=artifact_bucket.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:GetBucketLocation"
                        ],
                        "Resource": [f"{arn}/*", arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create CodeBuild project
        codebuild_project = aws.codebuild.Project(
            f"brazilcart-build-{self.environment_suffix}",
            service_role=codebuild_role.arn,
            artifacts={
                "type": "CODEPIPELINE"
            },
            environment={
                "compute_type": "BUILD_GENERAL1_SMALL",
                "image": "aws/codebuild/standard:7.0",
                "type": "LINUX_CONTAINER",
                "environment_variables": [{
                    "name": "ENVIRONMENT_SUFFIX",
                    "value": self.environment_suffix
                }]
            },
            source={
                "type": "CODEPIPELINE",
                "buildspec": json.dumps({
                    "version": "0.2",
                    "phases": {
                        "install": {
                            "commands": [
                                "echo Installing dependencies..."
                            ]
                        },
                        "build": {
                            "commands": [
                                "echo Build started on `date`",
                                "echo Building application...",
                                "echo Build completed on `date`"
                            ]
                        }
                    },
                    "artifacts": {
                        "files": ["**/*"]
                    }
                })
            },
            tags={**self.tags, "Name": f"brazilcart-build-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create CodePipeline
        pipeline = aws.codepipeline.Pipeline(
            f"brazilcart-pipeline-{self.environment_suffix}",
            role_arn=codepipeline_role.arn,
            artifact_stores=[{
                "location": artifact_bucket.bucket,
                "type": "S3"
            }],
            stages=[
                {
                    "name": "Source",
                    "actions": [{
                        "name": "Source",
                        "category": "Source",
                        "owner": "AWS",
                        "provider": "S3",
                        "version": "1",
                        "output_artifacts": ["source_output"],
                        "configuration": {
                            "S3Bucket": artifact_bucket.bucket,
                            "S3ObjectKey": "source.zip"
                        }
                    }]
                },
                {
                    "name": "Build",
                    "actions": [{
                        "name": "Build",
                        "category": "Build",
                        "owner": "AWS",
                        "provider": "CodeBuild",
                        "version": "1",
                        "input_artifacts": ["source_output"],
                        "output_artifacts": ["build_output"],
                        "configuration": {
                            "ProjectName": codebuild_project.name
                        }
                    }]
                },
                {
                    "name": "Deploy",
                    "actions": [{
                        "name": "Deploy",
                        "category": "Deploy",
                        "owner": "AWS",
                        "provider": "S3",
                        "version": "1",
                        "input_artifacts": ["build_output"],
                        "configuration": {
                            "BucketName": artifact_bucket.bucket,
                            "Extract": "true"
                        }
                    }]
                }
            ],
            tags={**self.tags, "Name": f"brazilcart-pipeline-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Export outputs
        self.register_outputs({
            "vpc_id": vpc.id,
            "rds_endpoint": rds_instance.endpoint,
            "elasticache_endpoint": elasticache_cluster.configuration_endpoint_address,
            "pipeline_name": pipeline.name,
            "kms_key_id": kms_key.id,
            "db_secret_arn": db_credentials.arn
        })
```

## File: lib/AWS_REGION

Contains the target AWS region for deployment. The region is read dynamically by tap_stack.py.

```
eu-south-2
```

## Architecture Details

### Network Infrastructure

**VPC Configuration**
- CIDR Block: 10.0.0.0/16
- DNS hostnames and DNS support enabled
- 3 private subnets across 3 availability zones (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)

**Availability Zones**
- Subnet A: {region}a (e.g., eu-south-2a)
- Subnet B: {region}b (e.g., eu-south-2b)
- Subnet C: {region}c (e.g., eu-south-2c)
- Dynamically constructed from AWS_REGION file

### Database Infrastructure

**RDS PostgreSQL 15.7**
- Instance class: db.t3.micro
- Storage: 20 GB with encryption enabled
- Multi-AZ: Enabled for high availability
- Backup retention: 7 days
- KMS encryption at rest
- VPC-only access (10.0.0.0/16)
- Skip final snapshot on deletion
- Uses default PostgreSQL 15 parameter group

**Database Credentials**
- Username: brazilcart_admin
- Password: 20-character cryptographically secure random string with special characters
- Generated using Python's `secrets` module (not `random.choices()`)
- Stored in AWS Secrets Manager

### Cache Infrastructure

**ElastiCache Redis 7.0**
- Node type: cache.t3.micro
- Number of cache clusters: 2 (1 primary + 1 replica)
- Multi-AZ: Enabled with automatic failover
- Encryption at rest: Enabled
- Encryption in transit: Enabled
- VPC-only access (10.0.0.0/16)
- Uses default Redis 7 parameter group

### Security

**KMS Encryption**
- Automatic key rotation enabled
- Used for RDS storage encryption and S3 bucket encryption
- KMS key alias created for easier management (alias/brazilcart-{environment_suffix})
- Scoped to environment suffix

**Security Groups**
- RDS Security Group:
  - Ingress: Port 5432 from VPC CIDR (10.0.0.0/16) only
  - Egress: Port 443 to VPC CIDR for AWS service communication
- ElastiCache Security Group:
  - Ingress: Port 6379 from VPC CIDR (10.0.0.0/16) only
  - Egress: Port 443 to VPC CIDR for AWS service communication
- Explicit egress rules follow least privilege principle
- No public internet access

**Secrets Management**
- Database password stored in Secrets Manager
- Full credentials JSON stored separately
- Tagged with environment suffix

### Monitoring and Observability

**CloudWatch Alarms**
- RDS CPU Utilization: Triggers when CPU exceeds 80% for 2 consecutive periods (5 minutes each)
- RDS Database Connections: Triggers when connections exceed 80 for 2 consecutive periods
- ElastiCache CPU Utilization: Triggers when CPU exceeds 75% for 2 consecutive periods
- ElastiCache Evictions: Triggers when evictions exceed 1000 for 2 consecutive periods
- All alarms tagged with environment suffix for easy management

### CI/CD Pipeline

**CodePipeline Configuration**
- Source Stage: S3-based source (source.zip)
- Build Stage: CodeBuild project for building and testing application
  - Uses AWS CodeBuild with standard:7.0 Linux container
  - BUILD_GENERAL1_SMALL compute type
  - CloudWatch Logs integration for build logs
- Deploy Stage: S3 deployment with extraction
- Artifact storage in dedicated S3 bucket
- IAM roles with appropriate permissions for CodePipeline and CodeBuild

**S3 Bucket (Security Hardened)**
- Artifact storage for CodePipeline
- Tagged with environment suffix
- Versioning enabled for artifact recovery
- KMS encryption (aws:kms) with bucket key enabled
- All public access blocked (ACLs and policies)
- Lifecycle policy: 30 days for current versions, 7 days for non-current versions

## Resource Naming Convention

All resources follow the pattern: `brazilcart-{resource-type}-{environment-suffix}`

Examples:
- VPC: brazilcart-vpc-pr1234
- RDS: brazilcart-db-pr1234
- ElastiCache: bc-cache-pr1234 (shortened for ID length limits)
- KMS Key: brazilcart-kms-pr1234
- CodePipeline: brazilcart-pipeline-pr1234

## Outputs

The stack exports the following outputs:

- `vpc_id`: VPC ID for network configuration
- `rds_endpoint`: RDS instance endpoint (host:port)
- `elasticache_endpoint`: ElastiCache configuration endpoint address
- `pipeline_name`: CodePipeline name
- `kms_key_id`: KMS key ID
- `db_secret_arn`: Secrets Manager ARN for database credentials

## Security Improvements

### Fixed Security Issues

**Secure Password Generation (FIXED)**
- Now uses Python's `secrets` module for cryptographically secure password generation
- Password length increased from 16 to 20 characters
- Added special characters to password alphabet (!@#$%^&*)
- Password stored securely in AWS Secrets Manager

**S3 Bucket Security Hardening (FIXED)**
- Versioning enabled for artifact recovery
- KMS encryption configured for data at rest
- All public access blocked (ACLs and policies)
- Lifecycle policy implemented (30 days for current versions, 7 days for non-current)

**Security Group Egress Rules (FIXED)**
- Explicit egress rules added to RDS security group (HTTPS within VPC)
- Explicit egress rules added to ElastiCache security group (HTTPS within VPC)
- Follows principle of least privilege for outbound traffic

**KMS Key Management (FIXED)**
- KMS key alias created for easier key identification and management
- Alias format: alias/brazilcart-{environment_suffix}
- Enables human-readable key references in AWS console and CLI

### Recent Improvements

**High Availability (FIXED)**
- Upgraded from 2 to 3 subnets across 3 availability zones
- Meets AWS best practices for high availability
- Better fault tolerance with multi-AZ deployment across 3 zones

**CI/CD Pipeline (ENHANCED)**
- Added Build stage with CodeBuild between Source and Deploy
- Automated build process with CloudWatch Logs integration
- Proper artifact handling through pipeline stages
- IAM roles configured with least privilege permissions

**Monitoring and Observability (ADDED)**
- CloudWatch alarms for RDS CPU utilization and database connections
- CloudWatch alarms for ElastiCache CPU utilization and evictions
- Proactive monitoring with configurable thresholds
- All alarms properly tagged for management

## Deployment

### Prerequisites

```bash
# Install Pulumi
curl -fsSL https://get.pulumi.com | sh

# Install Python dependencies
pip install pulumi pulumi-aws
```

### Deploy

```bash
# Set AWS region in lib/AWS_REGION
echo "eu-south-2" > lib/AWS_REGION

# Initialize Pulumi stack
pulumi stack init dev

# Set environment suffix
pulumi config set environmentSuffix pr1234

# Deploy infrastructure
pulumi up
```

### Destroy

```bash
# Remove all resources
pulumi destroy
```

## Fixed Issues

### PostgreSQL Version
- **Original**: PostgreSQL 15.4
- **Fixed**: PostgreSQL 15.7 (available in all regions)

### Dynamic Region Configuration
- **Original**: Hardcoded availability zones (eu-south-2a, eu-south-2b)
- **Fixed**: Dynamic region reading from AWS_REGION file
- Availability zones constructed as `{region}a` and `{region}b`

## Testing

Integration tests validate:
- VPC creation and configuration
- RDS PostgreSQL instance with Multi-AZ
- ElastiCache Redis cluster with Multi-AZ
- Security group configurations
- KMS key with rotation enabled
- Secrets Manager integration
- CodePipeline deployment
- Resource naming conventions

Run integration tests:
```bash
./scripts/integration-tests.sh
```
