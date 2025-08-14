# Pulumi AWS Infrastructure Project - Complete Solution

I'll create a comprehensive Pulumi Python project that meets all your requirements. Here's the complete solution with modular architecture and environment separation.

## Project Structure

```
pulumi-aws-infrastructure/
├── __main__.py
├── Pulumi.yaml
├── Pulumi.staging.yaml
├── Pulumi.production.yaml
├── requirements.txt
├── components/
│   ├── __init__.py
│   ├── s3_bucket.py
│   ├── dynamodb_table.py
│   └── iam_role.py
└── README.md
```

## 1. Project Configuration Files

### `Pulumi.yaml`
```yaml
name: aws-infrastructure
runtime: python
description: AWS Infrastructure with staging and production environments
template:
  config:
    aws:region:
      description: The AWS region to deploy to
      default: us-west-2
    environment:
      description: The deployment environment (staging or production)
      default: staging
```

### `Pulumi.staging.yaml`
```yaml
config:
  aws:region: us-west-2
  aws-infrastructure:environment: staging
```

### `Pulumi.production.yaml`
```yaml
config:
  aws:region: us-west-2
  aws-infrastructure:environment: production
```

### `requirements.txt`
```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## 2. Component Classes

### `components/__init__.py`
```python
"""
AWS Infrastructure Components Package
"""

from .s3_bucket import S3BucketComponent
from .dynamodb_table import DynamoDBTableComponent
from .iam_role import IAMRoleComponent

__all__ = [
    "S3BucketComponent",
    "DynamoDBTableComponent", 
    "IAMRoleComponent"
]
```

### `components/s3_bucket.py`
```python
"""
S3 Bucket Component with versioning, KMS encryption, and access logging
"""

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
from typing import Dict, Any, Optional


class S3BucketComponent(ComponentResource):
    """
    A component that creates an S3 bucket with security best practices:
    - Versioning enabled
    - KMS encryption at rest
    - Access logging to a dedicated log bucket
    - Environment-specific naming and tagging
    """

    def __init__(
        self,
        name: str,
        environment: str,
        tags: Optional[Dict[str, str]] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__("custom:aws:S3BucketComponent", name, None, opts)

        # Default tags
        default_tags = {
            "Environment": environment,
            "ManagedBy": "Pulumi",
            "Project": "aws-infrastructure"
        }
        if tags:
            default_tags.update(tags)

        # Create KMS key for bucket encryption
        self.kms_key = aws.kms.Key(
            f"{name}-kms-key",
            description=f"KMS key for {name} S3 bucket encryption",
            tags={**default_tags, "Purpose": "S3Encryption"},
            opts=ResourceOptions(parent=self)
        )

        self.kms_key_alias = aws.kms.Alias(
            f"{name}-kms-key-alias",
            name=f"alias/{environment}-{name}-s3-key",
            target_key_id=self.kms_key.key_id,
            opts=ResourceOptions(parent=self)
        )

        # Create access log bucket
        self.log_bucket = aws.s3.Bucket(
            f"{name}-access-logs",
            bucket=f"{environment}-{name}-access-logs",
            tags={**default_tags, "Purpose": "AccessLogs"},
            opts=ResourceOptions(parent=self)
        )

        # Configure log bucket ACL
        self.log_bucket_acl = aws.s3.BucketAclV2(
            f"{name}-log-bucket-acl",
            bucket=self.log_bucket.id,
            acl="log-delivery-write",
            opts=ResourceOptions(parent=self)
        )

        # Create main S3 bucket
        self.bucket = aws.s3.Bucket(
            f"{name}-bucket",
            bucket=f"{environment}-{name}",
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # Configure bucket versioning
        self.bucket_versioning = aws.s3.BucketVersioningV2(
            f"{name}-versioning",
            bucket=self.bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Configure server-side encryption
        self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"{name}-encryption",
            bucket=self.bucket.id,
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArgs(
                rules=[
                    aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="aws:kms",
                            kms_master_key_id=self.kms_key.arn
                        ),
                        bucket_key_enabled=True
                    )
                ]
            ),
            opts=ResourceOptions(parent=self)
        )

        # Configure access logging
        self.bucket_logging = aws.s3.BucketLoggingV2(
            f"{name}-logging",
            bucket=self.bucket.id,
            target_bucket=self.log_bucket.id,
            target_prefix=f"{name}-access-logs/",
            opts=ResourceOptions(parent=self)
        )

        # Block public access
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"{name}-public-access-block",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "bucket_name": self.bucket.bucket,
            "bucket_arn": self.bucket.arn,
            "kms_key_id": self.kms_key.key_id,
            "log_bucket_name": self.log_bucket.bucket
        })

    @property
    def bucket_name(self) -> pulumi.Output[str]:
        """Returns the bucket name"""
        return self.bucket.bucket

    @property
    def bucket_arn(self) -> pulumi.Output[str]:
        """Returns the bucket ARN"""
        return self.bucket.arn
```

### `components/dynamodb_table.py`
```python
"""
DynamoDB Table Component with on-demand capacity and proper tagging
"""

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
from typing import Dict, Any, Optional, List


class DynamoDBTableComponent(ComponentResource):
    """
    A component that creates a DynamoDB table with:
    - On-demand capacity mode
    - Environment-specific naming and tagging
    - Configurable attributes and keys
    """

    def __init__(
        self,
        name: str,
        environment: str,
        hash_key: str,
        range_key: Optional[str] = None,
        attributes: Optional[List[Dict[str, str]]] = None,
        tags: Optional[Dict[str, str]] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__("custom:aws:DynamoDBTableComponent", name, None, opts)

        # Default tags
        default_tags = {
            "Environment": environment,
            "ManagedBy": "Pulumi",
            "Project": "aws-infrastructure"
        }
        if tags:
            default_tags.update(tags)

        # Default attributes if none provided
        if attributes is None:
            attributes = [
                {"name": hash_key, "type": "S"}
            ]
            if range_key:
                attributes.append({"name": range_key, "type": "S"})

        # Create DynamoDB table
        table_args = {
            "name": f"{environment}-{name}",
            "billing_mode": "PAY_PER_REQUEST",  # On-demand capacity
            "hash_key": hash_key,
            "attributes": [
                aws.dynamodb.TableAttributeArgs(
                    name=attr["name"],
                    type=attr["type"]
                ) for attr in attributes
            ],
            "tags": default_tags
        }

        if range_key:
            table_args["range_key"] = range_key

        self.table = aws.dynamodb.Table(
            f"{name}-table",
            **table_args,
            opts=ResourceOptions(parent=self)
        )

        # Enable point-in-time recovery
        self.point_in_time_recovery = aws.dynamodb.TablePointInTimeRecovery(
            f"{name}-pitr",
            table_name=self.table.name,
            point_in_time_recovery_enabled=True,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "table_name": self.table.name,
            "table_arn": self.table.arn
        })

    @property
    def table_name(self) -> pulumi.Output[str]:
        """Returns the table name"""
        return self.table.name

    @property
    def table_arn(self) -> pulumi.Output[str]:
        """Returns the table ARN"""
        return self.table.arn
```

### `components/iam_role.py`
```python
"""
IAM Role Component with minimum necessary permissions
"""

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
from typing import Dict, Any, Optional, List
import json


class IAMRoleComponent(ComponentResource):
    """
    A component that creates an IAM role with:
    - Minimum necessary permissions
    - Environment-specific naming and tagging
    - Configurable trust policy and permissions
    """

    def __init__(
        self,
        name: str,
        environment: str,
        trusted_services: Optional[List[str]] = None,
        s3_bucket_arn: Optional[pulumi.Output[str]] = None,
        dynamodb_table_arn: Optional[pulumi.Output[str]] = None,
        tags: Optional[Dict[str, str]] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__("custom:aws:IAMRoleComponent", name, None, opts)

        # Default tags
        default_tags = {
            "Environment": environment,
            "ManagedBy": "Pulumi",
            "Project": "aws-infrastructure"
        }
        if tags:
            default_tags.update(tags)

        # Default trusted services
        if trusted_services is None:
            trusted_services = ["ec2.amazonaws.com", "lambda.amazonaws.com"]

        # Create trust policy
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": trusted_services
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        # Create IAM role
        self.role = aws.iam.Role(
            f"{name}-role",
            name=f"{environment}-{name}-role",
            assume_role_policy=json.dumps(trust_policy),
            tags=default_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create policy for S3 and DynamoDB access if ARNs provided
        if s3_bucket_arn or dynamodb_table_arn:
            policy_statements = []

            if s3_bucket_arn:
                # S3 permissions - minimum necessary
                s3_statement = {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        s3_bucket_arn,
                        pulumi.Output.concat(s3_bucket_arn, "/*")
                    ]
                }
                policy_statements.append(s3_statement)

            if dynamodb_table_arn:
                # DynamoDB permissions - minimum necessary
                dynamodb_statement = {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": dynamodb_table_arn
                }
                policy_statements.append(dynamodb_statement)

            # Create the policy document
            policy_document = {
                "Version": "2012-10-17",
                "Statement": policy_statements
            }

            # Create and attach the policy
            self.policy = aws.iam.RolePolicy(
                f"{name}-policy",
                name=f"{environment}-{name}-policy",
                role=self.role.id,
                policy=pulumi.Output.json_dumps(policy_document),
                opts=ResourceOptions(parent=self)
            )

        # Create instance profile for EC2 if ec2 is in trusted services
        if "ec2.amazonaws.com" in trusted_services:
            self.instance_profile = aws.iam.InstanceProfile(
                f"{name}-instance-profile",
                name=f"{environment}-{name}-instance-profile",
                role=self.role.name,
                opts=ResourceOptions(parent=self)
            )

        # Register outputs
        outputs = {
            "role_name": self.role.name,
            "role_arn": self.role.arn
        }
        
        if hasattr(self, 'instance_profile'):
            outputs["instance_profile_name"] = self.instance_profile.name

        self.register_outputs(outputs)

    @property
    def role_name(self) -> pulumi.Output[str]:
        """Returns the role name"""
        return self.role.name

    @property
    def role_arn(self) -> pulumi.Output[str]:
        """Returns the role ARN"""
        return self.role.arn
```

## 3. Main Infrastructure Code

### `__main__.py`
```python
"""
Main Pulumi program for AWS infrastructure deployment
Supports staging and production environments with complete isolation
"""

import pulumi
import pulumi_aws as aws
import os
from components import S3BucketComponent, DynamoDBTableComponent, IAMRoleComponent


def main():
    # Get configuration
    config = pulumi.Config()
    
    # Determine environment from config or environment variable
    environment = config.get("environment") or os.getenv("PULUMI_ENVIRONMENT", "staging")
    
    # Validate environment
    if environment not in ["staging", "production"]:
        raise ValueError(f"Invalid environment: {environment}. Must be 'staging' or 'production'")

    # Set AWS region
    aws_config = pulumi.Config("aws")
    region = aws_config.get("region") or "us-west-2"

    # Common tags for all resources
    common_tags = {
        "Environment": environment,
        "Project": "aws-infrastructure",
        "ManagedBy": "Pulumi",
        "Region": region,
        "CostCenter": f"{environment}-infrastructure"
    }

    # Create S3 bucket component
    s3_bucket = S3BucketComponent(
        name="app-data",
        environment=environment,
        tags={
            **common_tags,
            "Purpose": "ApplicationData",
            "BackupRequired": "true" if environment == "production" else "false"
        }
    )

    # Create DynamoDB table component
    dynamodb_table = DynamoDBTableComponent(
        name="app-table",
        environment=environment,
        hash_key="id",
        range_key="timestamp",
        attributes=[
            {"name": "id", "type": "S"},
            {"name": "timestamp", "type": "S"},
            {"name": "user_id", "type": "S"}
        ],
        tags={
            **common_tags,
            "Purpose": "ApplicationData",
            "DataClassification": "Internal"
        }
    )

    # Create IAM role component with access to S3 and DynamoDB
    iam_role = IAMRoleComponent(
        name="app-service",
        environment=environment,
        trusted_services=["ec2.amazonaws.com", "lambda.amazonaws.com"],
        s3_bucket_arn=s3_bucket.bucket_arn,
        dynamodb_table_arn=dynamodb_table.table_arn,
        tags={
            **common_tags,
            "Purpose": "ServiceRole",
            "AccessLevel": "ReadWrite"
        }
    )

    # Export important values
    pulumi.export("environment", environment)
    pulumi.export("region", region)
    
    # S3 exports
    pulumi.export("s3_bucket_name", s3_bucket.bucket_name)
    pulumi.export("s3_bucket_arn", s3_bucket.bucket_arn)
    
    # DynamoDB exports
    pulumi.export("dynamodb_table_name", dynamodb_table.table_name)
    pulumi.export("dynamodb_table_arn", dynamodb_table.table_arn)
    
    # IAM exports
    pulumi.export("iam_role_name", iam_role.role_name)
    pulumi.export("iam_role_arn", iam_role.role_arn)

    # Environment-specific outputs
    if environment == "production":
        pulumi.export("production_ready", True)
        pulumi.export("backup_enabled", True)
    else:
        pulumi.export("development_mode", True)
        pulumi.export("cost_optimized", True)


if __name__ == "__main__":
    main()
```

## 4. Documentation

### `README.md`
```markdown
# Pulumi AWS Infrastructure Project

This project manages AWS infrastructure across staging and production environments using Pulumi Python SDK.

## Architecture

The project uses a modular architecture with the following components:
- **S3BucketComponent**: S3 bucket with versioning, KMS encryption, and access logging
- **DynamoDBTableComponent**: DynamoDB table with on-demand capacity
- **IAMRoleComponent**: IAM role with minimum necessary permissions

## Prerequisites

1. Install Pulumi CLI
2. Configure AWS credentials
3. Install Python dependencies: `pip install -r requirements.txt`

## Environment Setup

### Staging Environment
```bash
pulumi stack init staging
pulumi config set aws:region us-west-2
pulumi config set aws-infrastructure:environment staging
```

### Production Environment
```bash
pulumi stack init production
pulumi config set aws:region us-west-2
pulumi config set aws-infrastructure:environment production
```

## Deployment

### Deploy to Staging
```bash
pulumi stack select staging
pulumi up
```

### Deploy to Production
```bash
pulumi stack select production
pulumi up
```

## Environment Variables

You can also use environment variables:
```bash
export PULUMI_ENVIRONMENT=staging
pulumi up
```

## Security Features

- **S3 Buckets**: KMS encryption, versioning, access logging, public access blocked
- **DynamoDB**: Point-in-time recovery enabled
- **IAM**: Minimum necessary permissions, environment-specific roles
- **Isolation**: Complete separation between staging and production

## Resource Naming Convention

All resources follow the pattern: `{environment}-{component-name}`

Examples:
- Staging S3 bucket: `staging-app-data`
- Production DynamoDB table: `production-app-table`
- Staging IAM role: `staging-app-service-role`

## Cost Management

All resources are tagged with:
- Environment
- Project
- ManagedBy
- CostCenter

## Cleanup

To destroy resources:
```bash
pulumi stack select <environment>
pulumi destroy
```
```

## 5. Usage Instructions

### Initial Setup
```bash
# 1. Initialize the project
mkdir pulumi-aws-infrastructure
cd pulumi-aws-infrastructure

# 2. Create all the files as shown above

# 3. Install dependencies
pip install -r requirements.txt

# 4. Initialize Pulumi stacks
pulumi stack init staging
pulumi stack init production
```

### Deploy Staging Environment
```bash
pulumi stack select staging
pulumi config set aws:region us-west-2
pulumi config set aws-infrastructure:environment staging
pulumi up
```

### Deploy Production Environment
```bash
pulumi stack select production
pulumi config set aws:region us-west-2
pulumi config set aws-infrastructure:environment production
pulumi up
```

## Key Features Implemented

✅ **Modular Architecture**: Each AWS resource is implemented as a class in the `components` package  
✅ **Environment Separation**: Complete isolation between staging and production  
✅ **S3 Security**: Versioning, KMS encryption, access logging, public access blocked  
✅ **DynamoDB**: On-demand capacity mode with point-in-time recovery  
✅ **IAM Security**: Minimum necessary permissions with environment-specific roles  
✅ **Comprehensive Tagging**: All resources tagged for cost tracking and management  
✅ **Environment Variables**: Support for environment switching via config and env vars  
✅ **Best Practices**: Follows Pulumi and AWS security best practices  

This solution provides a production-ready, secure, and maintainable infrastructure setup that can be easily extended and modified as needed.