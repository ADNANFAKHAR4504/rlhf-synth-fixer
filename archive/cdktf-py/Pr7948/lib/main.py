#!/usr/bin/env python3
"""
Multi-Region Disaster Recovery Solution using CDKTF with Python
Task: 64457522
Platform: CDKTF
Language: Python
Regions: us-east-1 (primary), us-east-2 (secondary)
"""

import os
from cdktf import App, TerraformStack, TerraformOutput, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from stacks.network_stack import NetworkStack
from stacks.compute_stack import ComputeStack
from stacks.api_stack import ApiStack
from stacks.database_stack import DatabaseStack
from stacks.storage_stack import StorageStack
from stacks.routing_stack import RoutingStack
from stacks.events_stack import EventsStack
from stacks.backup_stack import BackupStack
from stacks.monitoring_stack import MonitoringStack
from stacks.replication_stack import ReplicationStack


class DisasterRecoveryStack(TerraformStack):
    """Main stack orchestrating multi-region disaster recovery infrastructure"""

    def __init__(self, scope: Construct, stack_id: str, region: str, environment_suffix: str):
        super().__init__(scope, stack_id)

        self.region = region
        self.environment_suffix = environment_suffix
        self.is_primary = region == "us-east-1"
        self.dr_region_tag = "primary" if self.is_primary else "secondary"

        # AWS Provider
        self.provider = AwsProvider(
            self,
            "aws",
            region=region,
            default_tags=[{
                "tags": {
                    "DR-Region": self.dr_region_tag,
                    "EnvironmentSuffix": environment_suffix,
                    "ManagedBy": "CDKTF",
                    "Task": "64457522"
                }
            }]
        )

        # Deploy stacks in proper order
        self.network_stack = NetworkStack(self, f"network-{region}", region, environment_suffix)

        self.database_stack = DatabaseStack(
            self, f"database-{region}",
            region, environment_suffix, self.is_primary, self.network_stack
        )

        self.storage_stack = StorageStack(
            self, f"storage-{region}",
            region, environment_suffix, self.is_primary
        )

        self.compute_stack = ComputeStack(
            self, f"compute-{region}",
            region, environment_suffix,
            self.network_stack.vpc,
            self.network_stack.private_subnets,
            self.network_stack.lambda_security_group,
            self.database_stack.dynamodb_table,
            self.database_stack.aurora_cluster
        )

        self.api_stack = ApiStack(
            self, f"api-{region}",
            region, environment_suffix,
            self.compute_stack.payment_processor_lambda
        )

        self.events_stack = EventsStack(
            self, f"events-{region}",
            region, environment_suffix, self.is_primary
        )

        if self.is_primary:
            self.backup_stack = BackupStack(
                self, f"backup-{region}",
                region, environment_suffix,
                self.database_stack.aurora_cluster
            )

        self.monitoring_stack = MonitoringStack(
            self, f"monitoring-{region}",
            region, environment_suffix,
            self.api_stack.api_gateway,
            self.database_stack.dynamodb_table,
            self.database_stack.aurora_cluster,
            self.storage_stack.bucket
        )

        # Outputs
        TerraformOutput(
            self, f"api_endpoint_{region.replace('-', '_')}",
            value=self.api_stack.api_endpoint,
            description=f"API Gateway endpoint in {region}"
        )

        TerraformOutput(
            self, f"health_check_url_{region.replace('-', '_')}",
            value=f"{self.api_stack.api_endpoint}/health",
            description=f"Health check URL in {region}"
        )

        if self.database_stack.dynamodb_table:
            TerraformOutput(
                self, f"dynamodb_table_{region.replace('-', '_')}",
                value=self.database_stack.dynamodb_table.name,
                description=f"DynamoDB table name in {region}"
            )

        TerraformOutput(
            self, f"aurora_endpoint_{region.replace('-', '_')}",
            value=self.database_stack.aurora_cluster.endpoint,
            description=f"Aurora cluster endpoint in {region}"
        )

        TerraformOutput(
            self, f"s3_bucket_{region.replace('-', '_')}",
            value=self.storage_stack.bucket.bucket,
            description=f"S3 bucket name in {region}"
        )


class GlobalResourcesStack(TerraformStack):
    """Stack for global resources (Route 53, Global Accelerator)"""

    def __init__(
        self,
        scope: Construct,
        stack_id: str,
        environment_suffix: str,
        primary_api_endpoint: str,
        secondary_api_endpoint: str
    ):
        super().__init__(scope, stack_id)

        self.environment_suffix = environment_suffix

        # AWS Provider for global resources (us-east-1)
        self.provider = AwsProvider(
            self,
            "aws",
            region="us-east-1",
            default_tags=[{
                "tags": {
                    "DR-Region": "global",
                    "EnvironmentSuffix": environment_suffix,
                    "ManagedBy": "CDKTF",
                    "Task": "64457522"
                }
            }]
        )

        # Deploy global routing infrastructure
        self.routing_stack = RoutingStack(
            self, "global-routing",
            environment_suffix,
            primary_api_endpoint,
            secondary_api_endpoint
        )

        # Outputs
        TerraformOutput(
            self, "global_accelerator_dns",
            value=self.routing_stack.global_accelerator_dns,
            description="Global Accelerator DNS name for traffic routing"
        )

        TerraformOutput(
            self, "route53_failover_domain",
            value=self.routing_stack.failover_domain,
            description="Route 53 failover domain name"
        )


class S3ReplicationStack(TerraformStack):
    """Stack for S3 cross-region replication configuration

    This stack must be deployed AFTER both regional stacks
    to ensure the destination bucket exists.
    """

    def __init__(
        self,
        scope: Construct,
        stack_id: str,
        environment_suffix: str
    ):
        super().__init__(scope, stack_id)

        self.environment_suffix = environment_suffix

        # AWS Provider (us-east-1 for primary bucket replication config)
        self.provider = AwsProvider(
            self,
            "aws",
            region="us-east-1",
            default_tags=[{
                "tags": {
                    "DR-Region": "primary",
                    "EnvironmentSuffix": environment_suffix,
                    "ManagedBy": "CDKTF",
                    "Task": "64457522"
                }
            }]
        )

        # S3 Cross-Region Replication configuration
        self.replication_stack = ReplicationStack(
            self, "s3-replication",
            environment_suffix,
            primary_bucket_id=f"dr-payment-data-us-east-1-{environment_suffix}",
            primary_bucket_arn=f"arn:aws:s3:::dr-payment-data-us-east-1-{environment_suffix}",
            secondary_bucket_arn=f"arn:aws:s3:::dr-payment-data-us-east-2-{environment_suffix}"
        )


# Unique suffix to avoid resource naming conflicts
UNIQUE_SUFFIX = "r6k3"


def main():
    """Main entry point for CDKTF application"""
    app = App()

    # Get environment suffix from environment variable or use default
    # Add unique suffix to avoid naming conflicts
    base_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
    environment_suffix = f"{base_suffix}-{UNIQUE_SUFFIX}"

    # Deploy primary region stack first
    primary_stack = DisasterRecoveryStack(
        app,
        "disaster-recovery-primary",
        region="us-east-1",
        environment_suffix=environment_suffix
    )

    # Deploy secondary region stack after primary
    # This ensures destination S3 bucket versioning is enabled before replication config
    # and global Aurora cluster exists before secondary cluster joins
    secondary_stack = DisasterRecoveryStack(
        app,
        "disaster-recovery-secondary",
        region="us-east-2",
        environment_suffix=environment_suffix
    )
    # Add dependency: secondary stack depends on primary stack
    secondary_stack.add_dependency(primary_stack)

    # Deploy S3 replication stack after both regional stacks
    # This ensures destination bucket exists before replication is configured
    replication_stack = S3ReplicationStack(
        app,
        "disaster-recovery-replication",
        environment_suffix=environment_suffix
    )
    # Replication stack depends on both regional stacks
    replication_stack.add_dependency(primary_stack)
    replication_stack.add_dependency(secondary_stack)

    # Deploy global resources
    # Note: In real implementation, you would reference outputs from regional stacks
    global_stack = GlobalResourcesStack(
        app,
        "disaster-recovery-global",
        environment_suffix=environment_suffix,
        primary_api_endpoint="https://api-primary.internal",
        secondary_api_endpoint="https://api-secondary.internal"
    )

    app.synth()


if __name__ == "__main__":
    main()
