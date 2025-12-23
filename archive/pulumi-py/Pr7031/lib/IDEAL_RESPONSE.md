# Ideal Response - Secure Loan Processing Infrastructure

This document contains the corrected and production-ready Pulumi Python infrastructure code for deploying a secure loan processing web application with compliance requirements.

## Architecture Overview

The infrastructure implements a multi-tier architecture with:
- **Network Layer**: Multi-AZ VPC with public/private/database subnets across 3 availability zones
- **Compute Layer**: ECS Fargate cluster with auto-scaling (2-10 tasks)
- **Data Layer**: Aurora MySQL Serverless v2 with encryption and IAM authentication
- **Load Balancing**: Application Load Balancer with HTTP listener and access logging
- **Security**: KMS encryption, security groups, least-privilege IAM roles
- **Monitoring**: CloudWatch logs with 365-day retention
- **Storage**: S3 bucket for ALB logs with lifecycle policies

## Complete Implementation

### Entry Point: `tap.py`

```python
#!/usr/bin/env python3
"""Pulumi application entry point for loan processing infrastructure."""
import os
from datetime import datetime, timezone
import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize configuration
config = Config()
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
pr_number = os.getenv('PR_NUMBER', 'unknown')
team = os.getenv('TEAM', 'unknown')
created_at = datetime.now(timezone.utc).isoformat()

# Default tags for all resources
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'PRNumber': pr_number,
    'Team': team,
    "CreatedAt": created_at,
}

# Configure AWS provider with eu-west-2 region
provider = aws.Provider('aws',
    region=os.getenv('AWS_REGION', 'eu-west-2'),
    default_tags=aws.ProviderDefaultTagsArgs(tags=default_tags)
)

# Create main stack
stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
    opts=ResourceOptions(provider=provider)
)
```

### Main Orchestration: `lib/tap_stack.py`

```python
"""Main TapStack orchestrator for loan processing infrastructure."""
from typing import Optional
import pulumi
from pulumi import ResourceOptions
from .networking_stack import NetworkingStack
from .storage_stack import StorageStack
from .monitoring_stack import MonitoringStack
from .iam_stack import IAMStack
from .database_stack import DatabaseStack
from .alb_stack import ALBStack
from .ecs_stack import ECSStack

class TapStackArgs:
    """Arguments for TapStack component."""
    def __init__(self, environment_suffix: Optional[str] = None,
                 tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {
            'Environment': self.environment_suffix,
            'CostCenter': 'fintech-infrastructure',
            'ComplianceLevel': 'high'
        }

class TapStack(pulumi.ComponentResource):
    """Main stack orchestrating all infrastructure components."""
    
    def __init__(self, name: str, args: TapStackArgs,
                 opts: Optional[ResourceOptions] = None):
        super().__init__('tap:stack:TapStack', name, None, opts)
        
        self.environment_suffix = args.environment_suffix
        self.tags = args.tags
        
        # 1. Create KMS key and S3 bucket for logs
        self.storage = StorageStack(
            f"storage-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # 2. Create VPC and networking components
        self.networking = NetworkingStack(
            f"networking-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # 3. Create CloudWatch log groups
        self.monitoring = MonitoringStack(
            f"monitoring-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # 4. Create IAM roles
        self.iam = IAMStack(
            f"iam-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )
        
        # 5. Create RDS Aurora cluster
        self.database = DatabaseStack(
            f"database-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            vpc_id=self.networking.vpc_id,
            database_subnet_ids=self.networking.database_subnet_ids,
            database_sg_id=self.networking.database_sg_id,
            kms_key_id=self.storage.kms_key_id,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[
                self.networking, self.storage
            ])
        )
        
        # 6. Create Application Load Balancer
        self.alb = ALBStack(
            f"alb-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            vpc_id=self.networking.vpc_id,
            public_subnet_ids=self.networking.public_subnet_ids,
            alb_sg_id=self.networking.alb_sg_id,
            s3_logs_bucket=self.storage.s3_bucket_id,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[
                self.networking, self.storage
            ])
        )
        
        # 7. Create ECS Fargate cluster and service
        self.ecs = ECSStack(
            f"ecs-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            vpc_id=self.networking.vpc_id,
            private_subnet_ids=self.networking.private_subnet_ids,
            ecs_sg_id=self.networking.ecs_sg_id,
            target_group_arn=self.alb.target_group_arn,
            task_execution_role_arn=self.iam.ecs_task_execution_role_arn,
            task_role_arn=self.iam.ecs_task_role_arn,
            log_group_name=self.monitoring.ecs_log_group_name,
            database_endpoint=self.database.cluster_endpoint,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[
                self.networking, self.alb, self.iam,
                self.monitoring, self.database
            ])
        )
        
        # Export outputs
        self.register_outputs({
            "vpc_id": self.networking.vpc_id,
            "alb_dns_name": self.alb.alb_dns_name,
            "cluster_arn": self.ecs.cluster_arn,
            "database_endpoint": self.database.cluster_endpoint
        })
```

## Key Features Implemented

1. **Multi-AZ VPC** (3 availability zones in eu-west-2)
2. **ECS Fargate** with CPU and memory-based auto-scaling
3. **Aurora Serverless v2** with 0.5-4 ACU scaling
4. **Application Load Balancer** with HTTP listener
5. **CloudWatch Logs** with 365-day retention
6. **S3 Bucket** with versioning and lifecycle to Glacier (90 days)
7. **KMS Encryption** for RDS and S3
8. **IAM Roles** with least-privilege permissions
9. **Security Groups** with minimal required access
10. **Resource Tagging** (Environment, CostCenter, ComplianceLevel)

## Infrastructure Components

### 1. Networking (`lib/networking_stack.py`)
- VPC with CIDR 10.0.0.0/16
- 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
- 3 database subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24)
- 1 NAT Gateway (cost optimization)
- Internet Gateway
- Route tables for each subnet tier
- Security groups for ALB, ECS, and RDS

### 2. Storage (`lib/storage_stack.py`)
- S3 bucket for ALB access logs
- Versioning enabled
- Public access blocked
- Lifecycle policy (90-day transition to Glacier)
- KMS customer-managed key with automatic rotation

### 3. Monitoring (`lib/monitoring_stack.py`)
- CloudWatch Log Group for ECS tasks
- CloudWatch Log Group for RDS
- 365-day retention period

### 4. IAM (`lib/iam_stack.py`)
- ECS Task Execution Role (pull images, write logs)
- ECS Task Role (application permissions, RDS access)
- Least-privilege policies
- RDS IAM authentication enabled

### 5. Database (`lib/database_stack.py`)
- Aurora MySQL Serverless v2
- Scaling: 0.5-4 ACU
- Storage encrypted with KMS
- IAM authentication enabled
- Multi-AZ via Serverless
- Backup retention: 7 days
- skip_final_snapshot: True (for easy cleanup)

### 6. Load Balancer (`lib/alb_stack.py`)
- Application Load Balancer (internet-facing)
- HTTP listener on port 80
- Target group for ECS tasks (port 8080)
- Health checks: /health endpoint
- Access logging to S3

### 7. Compute (`lib/ecs_stack.py`)
- ECS Fargate cluster
- Service with 2-10 tasks
- CPU-based scaling (target 70%)
- Memory-based scaling (target 80%)
- Container: nginx:latest (placeholder for loan app)
- Port 8080
- CloudWatch Container Insights enabled

## Compliance & Security

✅ **Data Residency**: All resources in eu-west-2
✅ **Encryption at Rest**: KMS for RDS, S3
✅ **Encryption in Transit**: HTTPS capable (cert needed)
✅ **Network Isolation**: ECS in private subnets
✅ **IAM Authentication**: Enabled for RDS
✅ **Audit Trails**: CloudWatch logs (365-day retention), S3 access logs
✅ **Access Control**: Least-privilege IAM roles
✅ **Data Protection**: S3 versioning, block public access
✅ **Required Tags**: Environment, CostCenter, ComplianceLevel

## Deployment

```bash
export AWS_REGION="eu-west-2"
export ENVIRONMENT_SUFFIX="dev553"
export PULUMI_CONFIG_PASSPHRASE="<your-passphrase>"

pulumi stack select dev
pulumi config set aws:region eu-west-2
pulumi config set environmentSuffix dev553
pulumi up
```

## Outputs

- `vpc_id`: VPC identifier
- `alb_dns_name`: Load balancer DNS name
- `cluster_arn`: ECS cluster ARN
- `database_endpoint`: Aurora cluster endpoint

## Cost Estimate

Monthly costs (approximate):
- NAT Gateway: $32
- Aurora Serverless v2: $44-$350
- ALB: $23
- ECS Fargate: $15-$75
- S3 + CloudWatch: $5-$10

**Total: $119-$490/month**
