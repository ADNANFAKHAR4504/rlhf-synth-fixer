# Disaster Recovery Infrastructure - IDEAL RESPONSE

Complete Pulumi Python implementation for active-passive DR across us-east-1 and us-east-2.

## Architecture Overview

Primary Region (us-east-1): Aurora primary, Lambda, API Gateway, S3
DR Region (us-east-2): Aurora secondary, Lambda, API Gateway, S3
Global: Route 53 failover, DynamoDB global tables, CloudWatch cross-region monitoring

All resource names include environment_suffix for deployment isolation.

## Implementation Files

### 1. tap_stack.py - Main ComponentResource

```python
"""
tap_stack.py

Main Pulumi ComponentResource for disaster recovery infrastructure.
Orchestrates primary and DR region deployments with failover capabilities.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
from lib.primary_region import PrimaryRegion, PrimaryRegionArgs
from lib.dr_region import DRRegion, DRRegionArgs
from lib.global_resources import GlobalResources, GlobalResourcesArgs


class TapStackArgs:
    """
    Arguments for TapStack component.

    Args:
        environment_suffix: Deployment environment identifier
        tags: Default tags for all resources
    """
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        # Merge DR-specific tags
        self.tags.update({
            'Environment': 'DR',
            'CostCenter': 'Operations',
            'Criticality': 'High'
        })


class TapStack(pulumi.ComponentResource):
    """
    Main disaster recovery infrastructure stack.

    Implements active-passive DR pattern with:
    - Primary region (us-east-1) with full infrastructure
    - DR region (us-east-2) with standby infrastructure
    - Aurora Global Database for data replication
    - Route 53 failover routing
    - Cross-region S3 replication
    - DynamoDB global tables for session state
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Primary region infrastructure (us-east-1)
        self.primary = PrimaryRegion(
            f"primary-{self.environment_suffix}",
            PrimaryRegionArgs(
                environment_suffix=self.environment_suffix,
                region='us-east-1',
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # DR region infrastructure (us-east-2)
        self.dr = DRRegion(
            f"dr-{self.environment_suffix}",
            DRRegionArgs(
                environment_suffix=self.environment_suffix,
                region='us-east-2',
                primary_cluster_arn=self.primary.aurora_cluster_arn,
                replication_source_bucket=self.primary.bucket_id,
                replication_role_arn=self.primary.replication_role_arn,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # Global resources (Route 53, DynamoDB Global Tables, CloudWatch)
        self.global_resources = GlobalResources(
            f"global-{self.environment_suffix}",
            GlobalResourcesArgs(
                environment_suffix=self.environment_suffix,
                primary_api_endpoint=self.primary.api_endpoint,
                dr_api_endpoint=self.dr.api_endpoint,
                primary_region='us-east-1',
                dr_region='us-east-2',
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # Export outputs
        self.register_outputs({
            'primary_vpc_id': self.primary.vpc_id,
            'primary_cluster_endpoint': self.primary.aurora_cluster_endpoint,
            'primary_api_url': self.primary.api_endpoint,
            'primary_bucket_name': self.primary.bucket_name,
            'dr_vpc_id': self.dr.vpc_id,
            'dr_cluster_endpoint': self.dr.aurora_cluster_endpoint,
            'dr_api_url': self.dr.api_endpoint,
            'dr_bucket_name': self.dr.bucket_name,
            'route53_zone_id': self.global_resources.zone_id,
            'failover_domain': self.global_resources.failover_domain,
            'dynamodb_table_name': self.global_resources.dynamodb_table_name,
            'sns_topic_primary_arn': self.global_resources.sns_topic_primary_arn,
            'sns_topic_dr_arn': self.global_resources.sns_topic_dr_arn
        })
```

### 2. primary_region.py - Primary Region Resources

Complete implementation at `/Users/mayanksethi/Desktop/projects/turing/iac-test-automations/worktree/synth-4xq66w/lib/primary_region.py`

Key resources:
- VPC with private subnets (10.0.0.0/16)
- Aurora Global Database primary cluster (aurora-postgresql 14.6)
- Lambda payment processor function (Python 3.11)
- API Gateway REST API with POST /payment endpoint
- S3 bucket with versioning and AES256 encryption
- IAM roles for Lambda and S3 replication
- Security groups for Aurora and Lambda
- SNS topic for alerts

### 3. dr_region.py - DR Region Resources

Complete implementation at `/Users/mayanksethi/Desktop/projects/turing/iac-test-automations/worktree/synth-4xq66w/lib/dr_region.py`

Key resources:
- VPC with private subnets (10.1.0.0/16)
- Aurora secondary cluster in global database
- Lambda payment processor function (identical to primary)
- API Gateway REST API (identical configuration)
- S3 bucket as replication target with versioning and encryption
- IAM roles for Lambda
- Security groups
- SNS topic for alerts

### 4. global_resources.py - Global Resources

Complete implementation at `/Users/mayanksethi/Desktop/projects/turing/iac-test-automations/worktree/synth-4xq66w/lib/global_resources.py`

Key resources:
- Route 53 hosted zone (dr-payments-{suffix}.test.local)
- DNS records for primary and DR regions
- DynamoDB global table for sessions (replicated to both regions)
- CloudWatch dashboard aggregating metrics from both regions
- Cross-region monitoring

### 5. tap.py - Entry Point

```python
"""
tap.py

Entry point for Pulumi disaster recovery infrastructure.
"""

import os
import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Get environment suffix from environment variable
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Create the disaster recovery stack
stack = TapStack(
    f'tap-{environment_suffix}',
    TapStackArgs(
        environment_suffix=environment_suffix
    )
)

# Export all stack outputs
pulumi.export('primary_vpc_id', stack.primary.vpc_id)
pulumi.export('primary_cluster_endpoint', stack.primary.aurora_cluster_endpoint)
pulumi.export('primary_api_url', stack.primary.api_endpoint)
pulumi.export('primary_bucket_name', stack.primary.bucket_name)
pulumi.export('dr_vpc_id', stack.dr.vpc_id)
pulumi.export('dr_cluster_endpoint', stack.dr.aurora_cluster_endpoint)
pulumi.export('dr_api_url', stack.dr.api_endpoint)
pulumi.export('dr_bucket_name', stack.dr.bucket_name)
pulumi.export('route53_zone_id', stack.global_resources.zone_id)
pulumi.export('failover_domain', stack.global_resources.failover_domain)
pulumi.export('dynamodb_table_name', stack.global_resources.dynamodb_table_name)
pulumi.export('sns_topic_primary_arn', stack.global_resources.sns_topic_primary_arn)
pulumi.export('sns_topic_dr_arn', stack.global_resources.sns_topic_dr_arn)
```

## Key Features Implemented

1. **Multi-Region Architecture**: Complete infrastructure in us-east-1 and us-east-2 using Pulumi providers
2. **Aurora Global Database**: Primary cluster with 7-day backups, secondary cluster for replication
3. **ComponentResource Pattern**: Organized code with PrimaryRegion, DRRegion, GlobalResources components
4. **Environment Suffix**: All resources include environment_suffix for isolation
5. **VPC Isolation**: Separate VPCs per region with private subnets for databases
6. **Lambda Functions**: Identical payment processor functions in both regions
7. **API Gateway**: REST APIs with custom domain capabilities
8. **S3 Encryption**: AES256 encryption enabled on all buckets
9. **DynamoDB Global Tables**: Session state replicated across regions
10. **CloudWatch Monitoring**: Dashboard with cross-region metrics
11. **Proper Tagging**: Environment=DR, CostCenter=Operations, Criticality=High
12. **No Retention Policies**: All resources can be destroyed (skip_final_snapshot=True)

## AWS Services Used

1. Amazon Aurora PostgreSQL (Global Database)
2. AWS Lambda
3. Amazon API Gateway
4. Amazon Route 53
5. Amazon S3
6. Amazon DynamoDB (Global Tables)
7. Amazon CloudWatch
8. Amazon SNS
9. AWS IAM
10. Amazon VPC

## Design Decisions

1. **db.r5.large instances**: Supports RPO < 1 minute with sufficient performance
2. **Python 3.11 runtime**: Latest stable Python for Lambda
3. **ComponentResource pattern**: Clean separation of concerns
4. **Private subnets**: Databases isolated from internet
5. **Security groups**: Restricted ingress (PostgreSQL port 5432 only from VPC)
6. **Skip final snapshots**: Enables easy cleanup for testing
7. **Hardcoded password**: Noted for production use of Secrets Manager
8. **Versioning enabled**: S3 buckets support point-in-time recovery
9. **Pay-per-request DynamoDB**: Cost-effective for variable workloads
10. **CloudWatch aggregation**: Single dashboard for both regions

## Compliance

- Resource naming: All resources include environment_suffix
- Tags: Environment=DR, CostCenter=Operations, Criticality=High
- Encryption: S3 buckets use AES256
- Regions: us-east-1 (primary), us-east-2 (DR)
- No Retain policies: All resources deletable
- RPO target: < 1 minute (Aurora global database replication)
- RTO target: < 5 minutes (Route 53 health checks + failover)
