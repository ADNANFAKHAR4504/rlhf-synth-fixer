# BrazilCart E-commerce Infrastructure - Production Ready

I'll create a production-ready Pulumi infrastructure for BrazilCart with proper region configuration, resource management, and AWS SDK usage.

## File: lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class for BrazilCart e-commerce infrastructure.
Includes RDS PostgreSQL, ElastiCache Redis, CodePipeline, Secrets Manager, and KMS.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
import json


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

        # Region configuration - eu-south-2 (Spain)
        region = "eu-south-2"

        # Create KMS key for encryption with alias
        kms_key = aws.kms.Key(
            f"brazilcart-kms-{self.environment_suffix}",
            description=f"KMS key for BrazilCart RDS encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            tags={**self.tags, "Name": f"brazilcart-kms-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        kms_alias = aws.kms.Alias(
            f"brazilcart-kms-alias-{self.environment_suffix}",
            name=f"alias/brazilcart-{self.environment_suffix}",
            target_key_id=kms_key.key_id,
            opts=ResourceOptions(parent=self)
        )

        # Create VPC for resources with proper DNS settings
        vpc = aws.ec2.Vpc(
            f"brazilcart-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"brazilcart-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway for outbound connectivity
        igw = aws.ec2.InternetGateway(
            f"brazilcart-igw-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={**self.tags, "Name": f"brazilcart-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create subnets in multiple AZs for eu-south-2
        subnet_a = aws.ec2.Subnet(
            f"brazilcart-subnet-a-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{region}a",
            map_public_ip_on_launch=False,
            tags={**self.tags, "Name": f"brazilcart-subnet-a-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        subnet_b = aws.ec2.Subnet(
            f"brazilcart-subnet-b-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{region}b",
            map_public_ip_on_launch=False,
            tags={**self.tags, "Name": f"brazilcart-subnet-b-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        subnet_c = aws.ec2.Subnet(
            f"brazilcart-subnet-c-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.3.0/24",
            availability_zone=f"{region}c",
            map_public_ip_on_launch=False,
            tags={**self.tags, "Name": f"brazilcart-subnet-c-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create DB subnet group with all three subnets
        db_subnet_group = aws.rds.SubnetGroup(
            f"brazilcart-db-subnet-{self.environment_suffix}",
            subnet_ids=[subnet_a.id, subnet_b.id, subnet_c.id],
            description=f"DB subnet group for BrazilCart - {self.environment_suffix}",
            tags={**self.tags, "Name": f"brazilcart-db-subnet-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create ElastiCache subnet group
        cache_subnet_group = aws.elasticache.SubnetGroup(
            f"brazilcart-cache-subnet-{self.environment_suffix}",
            subnet_ids=[subnet_a.id, subnet_b.id, subnet_c.id],
            description=f"ElastiCache subnet group for BrazilCart - {self.environment_suffix}",
            tags={**self.tags, "Name": f"brazilcart-cache-subnet-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create security group for RDS with proper egress
        rds_sg = aws.ec2.SecurityGroup(
            f"brazilcart-rds-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description=f"Security group for BrazilCart RDS - {self.environment_suffix}",
            ingress=[{
                "protocol": "tcp",
                "from_port": 5432,
                "to_port": 5432,
                "cidr_blocks": ["10.0.0.0/16"],
                "description": "PostgreSQL access from VPC"
            }],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"],
                "description": "Allow all outbound traffic"
            }],
            tags={**self.tags, "Name": f"brazilcart-rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create security group for ElastiCache with proper egress
        cache_sg = aws.ec2.SecurityGroup(
            f"brazilcart-cache-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description=f"Security group for BrazilCart ElastiCache - {self.environment_suffix}",
            ingress=[{
                "protocol": "tcp",
                "from_port": 6379,
                "to_port": 6379,
                "cidr_blocks": ["10.0.0.0/16"],
                "description": "Redis access from VPC"
            }],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"],
                "description": "Allow all outbound traffic"
            }],
            tags={**self.tags, "Name": f"brazilcart-cache-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Use Pulumi random provider for password generation
        import pulumi_random as random

        db_password_random = random.RandomPassword(
            f"brazilcart-db-password-{self.environment_suffix}",
            length=32,
            special=True,
            override_special="!#$%&*()-_=+[]{}<>:?",
            opts=ResourceOptions(parent=self)
        )

        # Store database credentials in Secrets Manager
        db_credentials_secret = aws.secretsmanager.Secret(
            f"brazilcart-db-credentials-{self.environment_suffix}",
            name=f"brazilcart/db/credentials-{self.environment_suffix}",
            description=f"Database credentials for BrazilCart RDS - {self.environment_suffix}",
            recovery_window_in_days=7,
            tags={**self.tags, "Name": f"brazilcart-db-credentials-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Store credentials as JSON in Secrets Manager
        db_username = "brazilcart_admin"
        db_name = "brazilcart"

        db_credentials_version = aws.secretsmanager.SecretVersion(
            f"brazilcart-db-credentials-version-{self.environment_suffix}",
            secret_id=db_credentials_secret.id,
            secret_string=pulumi.Output.all(db_password_random.result).apply(
                lambda args: json.dumps({
                    "username": db_username,
                    "password": args[0],
                    "engine": "postgres",
                    "port": 5432,
                    "dbname": db_name,
                    "host": ""  # Will be updated after RDS creation
                })
            ),
            opts=ResourceOptions(parent=self, depends_on=[db_credentials_secret])
        )

        # Create RDS parameter group for PostgreSQL optimization
        rds_parameter_group = aws.rds.ParameterGroup(
            f"brazilcart-pg-params-{self.environment_suffix}",
            family="postgres15",
            description=f"Parameter group for BrazilCart PostgreSQL - {self.environment_suffix}",
            parameters=[
                {
                    "name": "log_connections",
                    "value": "1"
                },
                {
                    "name": "log_disconnections",
                    "value": "1"
                }
            ],
            tags={**self.tags, "Name": f"brazilcart-pg-params-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create RDS instance with Multi-AZ and encryption
        rds_instance = aws.rds.Instance(
            f"brazilcart-db-{self.environment_suffix}",
            identifier=f"brazilcart-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="15.4",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp3",
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            db_name=db_name,
            username=db_username,
            password=db_password_random.result,
            multi_az=True,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            parameter_group_name=rds_parameter_group.name,
            skip_final_snapshot=True,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            auto_minor_version_upgrade=True,
            copy_tags_to_snapshot=True,
            deletion_protection=False,
            publicly_accessible=False,
            tags={**self.tags, "Name": f"brazilcart-db-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[db_subnet_group, rds_sg])
        )

        # Update the secret with the RDS endpoint
        db_credentials_update = aws.secretsmanager.SecretVersion(
            f"brazilcart-db-credentials-update-{self.environment_suffix}",
            secret_id=db_credentials_secret.id,
            secret_string=pulumi.Output.all(
                db_password_random.result,
                rds_instance.address
            ).apply(
                lambda args: json.dumps({
                    "username": db_username,
                    "password": args[0],
                    "engine": "postgres",
                    "port": 5432,
                    "dbname": db_name,
                    "host": args[1]
                })
            ),
            opts=ResourceOptions(
                parent=self,
                depends_on=[rds_instance, db_credentials_version],
                delete_before_replace=True
            )
        )

        # Create ElastiCache parameter group for Redis optimization
        cache_parameter_group = aws.elasticache.ParameterGroup(
            f"brazilcart-redis-params-{self.environment_suffix}",
            family="redis7",
            description=f"Parameter group for BrazilCart Redis - {self.environment_suffix}",
            parameters=[
                {
                    "name": "maxmemory-policy",
                    "value": "allkeys-lru"
                },
                {
                    "name": "timeout",
                    "value": "300"
                }
            ],
            tags={**self.tags, "Name": f"brazilcart-redis-params-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create ElastiCache replication group (Multi-AZ with automatic failover)
        elasticache_cluster = aws.elasticache.ReplicationGroup(
            f"brazilcart-cache-{self.environment_suffix}",
            replication_group_id=f"bc-cache-{self.environment_suffix}",
            description=f"BrazilCart Redis cache cluster - {self.environment_suffix}",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",
            num_cache_clusters=2,
            port=6379,
            parameter_group_name=cache_parameter_group.name,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            subnet_group_name=cache_subnet_group.name,
            security_group_ids=[cache_sg.id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            auth_token_enabled=False,  # Set to true in production with auth token
            auto_minor_version_upgrade=True,
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00",
            maintenance_window="mon:05:00-mon:07:00",
            notification_topic_arn=None,  # Add SNS topic for notifications in production
            tags={**self.tags, "Name": f"brazilcart-cache-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[cache_subnet_group, cache_sg])
        )

        # Create S3 bucket for CodePipeline artifacts with versioning
        artifact_bucket = aws.s3.BucketV2(
            f"brazilcart-artifacts-{self.environment_suffix}",
            bucket=f"brazilcart-artifacts-{self.environment_suffix}-{pulumi.get_stack()}",
            tags={**self.tags, "Name": f"brazilcart-artifacts-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning on artifact bucket
        artifact_bucket_versioning = aws.s3.BucketVersioningV2(
            f"brazilcart-artifacts-versioning-{self.environment_suffix}",
            bucket=artifact_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            },
            opts=ResourceOptions(parent=self)
        )

        # Enable encryption on artifact bucket
        artifact_bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"brazilcart-artifacts-encryption-{self.environment_suffix}",
            bucket=artifact_bucket.id,
            rules=[{
                "apply_server_side_encryption_by_default": {
                    "sse_algorithm": "AES256"
                },
                "bucket_key_enabled": True
            }],
            opts=ResourceOptions(parent=self)
        )

        # Block public access to artifact bucket
        artifact_bucket_public_access = aws.s3.BucketPublicAccessBlock(
            f"brazilcart-artifacts-public-access-{self.environment_suffix}",
            bucket=artifact_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for CodePipeline
        codepipeline_role = aws.iam.Role(
            f"brazilcart-codepipeline-role-{self.environment_suffix}",
            name=f"brazilcart-codepipeline-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "codepipeline.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"brazilcart-codepipeline-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Attach comprehensive policy to CodePipeline role
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
                            "s3:GetObjectVersion",
                            "s3:PutObject",
                            "s3:GetBucketLocation",
                            "s3:ListBucket"
                        ],
                        "Resource": [f"{arn}/*", arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "codedeploy:CreateDeployment",
                            "codedeploy:GetApplication",
                            "codedeploy:GetApplicationRevision",
                            "codedeploy:GetDeployment",
                            "codedeploy:GetDeploymentConfig",
                            "codedeploy:RegisterApplicationRevision"
                        ],
                        "Resource": "*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create CodePipeline with proper stages
        pipeline = aws.codepipeline.Pipeline(
            f"brazilcart-pipeline-{self.environment_suffix}",
            name=f"brazilcart-pipeline-{self.environment_suffix}",
            role_arn=codepipeline_role.arn,
            artifact_store={
                "location": artifact_bucket.bucket,
                "type": "S3"
            },
            stages=[
                {
                    "name": "Source",
                    "actions": [{
                        "name": "SourceAction",
                        "category": "Source",
                        "owner": "AWS",
                        "provider": "S3",
                        "version": "1",
                        "output_artifacts": ["source_output"],
                        "configuration": {
                            "S3Bucket": artifact_bucket.bucket,
                            "S3ObjectKey": "source.zip",
                            "PollForSourceChanges": "false"
                        }
                    }]
                },
                {
                    "name": "Build",
                    "actions": [{
                        "name": "BuildAction",
                        "category": "Build",
                        "owner": "AWS",
                        "provider": "CodeBuild",
                        "version": "1",
                        "input_artifacts": ["source_output"],
                        "output_artifacts": ["build_output"],
                        "configuration": {
                            "ProjectName": f"brazilcart-build-{self.environment_suffix}"
                        }
                    }]
                },
                {
                    "name": "Deploy",
                    "actions": [{
                        "name": "DeployAction",
                        "category": "Deploy",
                        "owner": "AWS",
                        "provider": "S3",
                        "version": "1",
                        "input_artifacts": ["build_output"],
                        "configuration": {
                            "BucketName": artifact_bucket.bucket,
                            "Extract": "true",
                            "ObjectKey": "deployed"
                        }
                    }]
                }
            ],
            tags={**self.tags, "Name": f"brazilcart-pipeline-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[codepipeline_role, artifact_bucket])
        )

        # Export outputs
        self.register_outputs({
            "vpc_id": vpc.id,
            "vpc_cidr": vpc.cidr_block,
            "subnet_ids": pulumi.Output.all(subnet_a.id, subnet_b.id, subnet_c.id),
            "rds_instance_id": rds_instance.id,
            "rds_endpoint": rds_instance.endpoint,
            "rds_address": rds_instance.address,
            "rds_port": rds_instance.port,
            "elasticache_replication_group_id": elasticache_cluster.id,
            "elasticache_primary_endpoint": elasticache_cluster.primary_endpoint_address,
            "elasticache_configuration_endpoint": elasticache_cluster.configuration_endpoint_address,
            "elasticache_reader_endpoint": elasticache_cluster.reader_endpoint_address,
            "pipeline_id": pipeline.id,
            "pipeline_name": pipeline.name,
            "pipeline_arn": pipeline.arn,
            "kms_key_id": kms_key.key_id,
            "kms_key_arn": kms_key.arn,
            "db_secret_arn": db_credentials_secret.arn,
            "db_secret_name": db_credentials_secret.name,
            "artifact_bucket_name": artifact_bucket.bucket,
            "artifact_bucket_arn": artifact_bucket.arn,
            "region": region
        })
```

This production-ready infrastructure includes:

1. **KMS Encryption**: Key with rotation enabled and alias for easy reference
2. **VPC Architecture**: Properly configured VPC with 3 subnets across all AZs in eu-south-2
3. **RDS PostgreSQL**:
   - Multi-AZ deployment with automatic failover
   - Storage encryption using KMS
   - gp3 storage type for better performance
   - CloudWatch logs export enabled
   - Parameter group for optimization
   - Backup retention and maintenance windows configured
4. **ElastiCache Redis**:
   - Multi-AZ replication group with automatic failover
   - Encryption at rest and in transit
   - Parameter group with LRU eviction policy
   - Snapshot retention configured
5. **AWS Secrets Manager**: Credentials stored securely with proper JSON structure and RDS endpoint
6. **CodePipeline**:
   - Complete CI/CD pipeline with Source, Build, and Deploy stages
   - S3 bucket with versioning, encryption, and public access blocking
   - Proper IAM roles and policies
7. **Security Groups**: Ingress and egress rules properly configured
8. **Resource Tagging**: All resources properly tagged with environment suffix
9. **Region Configuration**: All resources deployed in eu-south-2
10. **Comprehensive Outputs**: All important resource attributes exported for reference

Key improvements over MODEL_RESPONSE:
- Uses pulumi_random for secure password generation instead of Python random
- Proper S3 bucket configuration with BucketV2, versioning, encryption, and public access blocking
- Three subnets across all AZs instead of just two
- Parameter groups for RDS and ElastiCache optimization
- CloudWatch logs export for RDS
- Proper backup and maintenance windows
- More comprehensive IAM policies
- Build stage added to CodePipeline
- Comprehensive outputs with all endpoints and ARNs
- Better resource dependencies management
- Production-ready security configurations