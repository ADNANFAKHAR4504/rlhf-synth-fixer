from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition
)
from cdktf_cdktf_provider_aws.s3_bucket_replication_configuration import (
    S3BucketReplicationConfigurationA,
    S3BucketReplicationConfigurationRule,
    S3BucketReplicationConfigurationRuleDestination,
    S3BucketReplicationConfigurationRuleDestinationReplicationTime,
    S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime,
    S3BucketReplicationConfigurationRuleDestinationMetrics,
    S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold
)
from constructs import Construct

class StorageModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, secondary_provider,
                 security, environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # Transaction logs bucket - Primary
        self.transaction_logs_primary = S3Bucket(self, "transaction-logs-primary",
            provider=primary_provider,
            bucket=f"payment-transaction-logs-primary-{environment_suffix}",
            tags={
                "Name": f"payment-transaction-logs-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Enable versioning
        S3BucketVersioningA(self, "transaction-logs-primary-versioning",
            provider=primary_provider,
            bucket=self.transaction_logs_primary.id,
            versioning_configuration={"status": "Enabled"}
        )

        # Encryption configuration
        S3BucketServerSideEncryptionConfigurationA(self, "transaction-logs-primary-encryption",
            provider=primary_provider,
            bucket=self.transaction_logs_primary.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=security.primary_kms_key.arn
                ),
                bucket_key_enabled=True
            )]
        )

        # Lifecycle configuration
        S3BucketLifecycleConfiguration(self, "transaction-logs-primary-lifecycle",
            provider=primary_provider,
            bucket=self.transaction_logs_primary.id,
            rule=[S3BucketLifecycleConfigurationRule(
                id="archive-old-logs",
                status="Enabled",
                transition=[S3BucketLifecycleConfigurationRuleTransition(
                    days=90,
                    storage_class="GLACIER"
                )]
            )]
        )

        # ISSUE: Missing cross-region replication configuration
        # Should have S3BucketReplicationConfiguration pointing to secondary bucket

        # Transaction logs bucket - Secondary
        self.transaction_logs_secondary = S3Bucket(self, "transaction-logs-secondary",
            provider=secondary_provider,
            bucket=f"payment-transaction-logs-secondary-{environment_suffix}",
            tags={
                "Name": f"payment-transaction-logs-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Enable versioning on secondary
        S3BucketVersioningA(self, "transaction-logs-secondary-versioning",
            provider=secondary_provider,
            bucket=self.transaction_logs_secondary.id,
            versioning_configuration={"status": "Enabled"}
        )

        # Encryption configuration for secondary
        S3BucketServerSideEncryptionConfigurationA(self, "transaction-logs-secondary-encryption",
            provider=secondary_provider,
            bucket=self.transaction_logs_secondary.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=security.secondary_kms_key.arn
                ),
                bucket_key_enabled=True
            )]
        )

        # Audit trails bucket - Primary
        self.audit_trails_primary = S3Bucket(self, "audit-trails-primary",
            provider=primary_provider,
            bucket=f"payment-audit-trails-primary-{environment_suffix}",
            tags={
                "Name": f"payment-audit-trails-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Enable versioning
        S3BucketVersioningA(self, "audit-trails-primary-versioning",
            provider=primary_provider,
            bucket=self.audit_trails_primary.id,
            versioning_configuration={"status": "Enabled"}
        )

        # Encryption configuration
        S3BucketServerSideEncryptionConfigurationA(self, "audit-trails-primary-encryption",
            provider=primary_provider,
            bucket=self.audit_trails_primary.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=security.primary_kms_key.arn
                ),
                bucket_key_enabled=True
            )]
        )


        # FIXED: Cross-region replication for transaction logs
        S3BucketReplicationConfigurationA(self, "transaction-logs-replication",
            provider=primary_provider,
            bucket=self.transaction_logs_primary.id,
            role=security.s3_replication_role.arn,
            rule=[S3BucketReplicationConfigurationRule(
                id="replicate-all",
                status="Enabled",
                priority=1,
                delete_marker_replication={"status": "Enabled"},
                destination=S3BucketReplicationConfigurationRuleDestination(
                    bucket=self.transaction_logs_secondary.arn,
                    replication_time=S3BucketReplicationConfigurationRuleDestinationReplicationTime(
                        status="Enabled",
                        time=S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime(
                            minutes=15
                        )
                    ),
                    metrics=S3BucketReplicationConfigurationRuleDestinationMetrics(
                        status="Enabled",
                        event_threshold=S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold(
                            minutes=15
                        )
                    )
                ),
                filter={}
            )]
        )

        # Audit trails bucket - Secondary
        self.audit_trails_secondary = S3Bucket(self, "audit-trails-secondary",
            provider=secondary_provider,
            bucket=f"payment-audit-trails-secondary-{environment_suffix}",
            tags={
                "Name": f"payment-audit-trails-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Enable versioning on secondary
        S3BucketVersioningA(self, "audit-trails-secondary-versioning",
            provider=secondary_provider,
            bucket=self.audit_trails_secondary.id,
            versioning_configuration={"status": "Enabled"}
        )

        # Encryption configuration for secondary
        S3BucketServerSideEncryptionConfigurationA(self, "audit-trails-secondary-encryption",
            provider=secondary_provider,
            bucket=self.audit_trails_secondary.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=security.secondary_kms_key.arn
                ),
                bucket_key_enabled=True
            )]
        )

        # Cross-region replication for audit trails
        S3BucketReplicationConfigurationA(self, "audit-trails-replication",
            provider=primary_provider,
            bucket=self.audit_trails_primary.id,
            role=security.s3_replication_role.arn,
            rule=[S3BucketReplicationConfigurationRule(
                id="replicate-all",
                status="Enabled",
                priority=1,
                delete_marker_replication={"status": "Enabled"},
                destination=S3BucketReplicationConfigurationRuleDestination(
                    bucket=self.audit_trails_secondary.arn,
                    replication_time=S3BucketReplicationConfigurationRuleDestinationReplicationTime(
                        status="Enabled",
                        time=S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime(
                            minutes=15
                        )
                    ),
                    metrics=S3BucketReplicationConfigurationRuleDestinationMetrics(
                        status="Enabled",
                        event_threshold=S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold(
                            minutes=15
                        )
                    )
                ),
                filter={}
            )]
        )
