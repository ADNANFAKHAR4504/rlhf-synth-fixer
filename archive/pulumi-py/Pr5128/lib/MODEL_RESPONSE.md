# BrazilCart E-commerce Infrastructure

I'll help you create the Pulumi infrastructure for BrazilCart. Here's the complete setup:

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


class TapStackArgs:
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


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

        # Create KMS key for encryption
        kms_key = aws.kms.Key(
            f"brazilcart-kms-{self.environment_suffix}",
            description="KMS key for BrazilCart RDS encryption",
            enable_key_rotation=True,
            tags=self.tags,
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
            availability_zone="eu-south-2a",
            tags={**self.tags, "Name": f"brazilcart-subnet-a-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        subnet_b = aws.ec2.Subnet(
            f"brazilcart-subnet-b-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="eu-south-2b",
            tags={**self.tags, "Name": f"brazilcart-subnet-b-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create DB subnet group
        db_subnet_group = aws.rds.SubnetGroup(
            f"brazilcart-db-subnet-{self.environment_suffix}",
            subnet_ids=[subnet_a.id, subnet_b.id],
            tags={**self.tags, "Name": f"brazilcart-db-subnet-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create ElastiCache subnet group
        cache_subnet_group = aws.elasticache.SubnetGroup(
            f"brazilcart-cache-subnet-{self.environment_suffix}",
            subnet_ids=[subnet_a.id, subnet_b.id],
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

        # Create random password
        import random
        import string
        password = ''.join(random.choices(string.ascii_letters + string.digits, k=16))

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
            engine_version="15.4",
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
            replication_group_description="BrazilCart Redis cache cluster",
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

        # Create S3 bucket for CodePipeline artifacts
        artifact_bucket = aws.s3.Bucket(
            f"brazilcart-artifacts-{self.environment_suffix}",
            tags={**self.tags, "Name": f"brazilcart-artifacts-{self.environment_suffix}"},
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
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:GetBucketLocation"
                    ],
                    "Resource": [f"{arn}/*", arn]
                }]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create CodePipeline
        pipeline = aws.codepipeline.Pipeline(
            f"brazilcart-pipeline-{self.environment_suffix}",
            role_arn=codepipeline_role.arn,
            artifact_store={
                "location": artifact_bucket.bucket,
                "type": "S3"
            },
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
                    "name": "Deploy",
                    "actions": [{
                        "name": "Deploy",
                        "category": "Deploy",
                        "owner": "AWS",
                        "provider": "S3",
                        "version": "1",
                        "input_artifacts": ["source_output"],
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

This infrastructure includes:
- KMS key for RDS encryption
- VPC with multi-AZ subnets in eu-south-2
- RDS PostgreSQL instance with Multi-AZ, encryption at rest
- ElastiCache Redis replication group with Multi-AZ and automatic failover
- AWS Secrets Manager for database credentials
- CodePipeline for CI/CD automation
- All resources properly tagged and named with environment suffix