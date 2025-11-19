import os

from cdktf import S3Backend, TerraformOutput, TerraformStack
from cdktf_cdktf_provider_aws.provider import AwsProvider
from constructs import Construct

from .compute import ComputeModule
from .database import DatabaseModule
from .dns import DnsModule
from .monitoring import MonitoringModule
from .networking import NetworkingModule
from .security import SecurityModule
from .storage import StorageModule


class PaymentMigrationStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.migration_phase = migration_phase

        # Configure S3 backend for state using environment variables
        use_s3_backend = os.getenv("USE_S3_BACKEND", "true").lower() == "true"
        if use_s3_backend:
            state_bucket = os.getenv("STATE_BUCKET", os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states"))
            state_bucket_region = os.getenv("STATE_BUCKET_REGION", os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1"))
            state_bucket_key = os.getenv("STATE_BUCKET_KEY", os.getenv("TERRAFORM_STATE_BUCKET_KEY", environment_suffix))
            
            S3Backend(self,
                bucket=state_bucket,
                key=f"{state_bucket_key}/{id}.tfstate",
                region=state_bucket_region,
                encrypt=True
            )
            
            # Add S3 state locking using escape hatch (dynamodb_table is deprecated)
            self.add_override("terraform.backend.s3.use_lockfile", True)

        # Primary region provider
        self.primary_provider = AwsProvider(self, "aws-primary",
            region="us-east-1",
            alias="primary",
            default_tags=[{
                "tags": {
                    "Environment": migration_phase,
                    "Project": "payment-migration",
                    "MigrationPhase": migration_phase,
                    "Suffix": environment_suffix
                }
            }]
        )

        # Secondary region provider
        self.secondary_provider = AwsProvider(self, "aws-secondary",
            region="us-east-2",
            alias="secondary",
            default_tags=[{
                "tags": {
                    "Environment": migration_phase,
                    "Project": "payment-migration",
                    "MigrationPhase": migration_phase,
                    "Suffix": environment_suffix
                }
            }]
        )

        # Security module (KMS, IAM) - ISSUE: Missing environmentSuffix in KMS key aliases
        self.security = SecurityModule(self, "security",
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # Networking module - ISSUE: Missing environmentSuffix in VPC names
        self.networking = NetworkingModule(self, "networking",
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # Database module
        self.database = DatabaseModule(self, "database",
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            networking=self.networking,
            security=self.security,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # Storage module - ISSUE: Missing cross-region replication configuration
        self.storage = StorageModule(self, "storage",
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            security=self.security,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # Compute module
        self.compute = ComputeModule(self, "compute",
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            networking=self.networking,
            security=self.security,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # Monitoring module - ISSUE: Missing critical alarms for replication lag
        self.monitoring = MonitoringModule(self, "monitoring",
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            database=self.database,
            compute=self.compute,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # DNS module
        self.dns = DnsModule(self, "dns",
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            compute=self.compute,
            environment_suffix=environment_suffix,
            migration_phase=migration_phase
        )

        # Outputs
        TerraformOutput(self, "primary_vpc_id",
            value=self.networking.primary_vpc.id
        )

        TerraformOutput(self, "secondary_vpc_id",
            value=self.networking.secondary_vpc.id
        )

        TerraformOutput(self, "database_endpoint_primary",
            value=self.database.primary_cluster.endpoint
        )
        
        TerraformOutput(self, "database_endpoint_secondary",
            value=self.database.secondary_cluster.endpoint
        )

        TerraformOutput(self, "primary_alb_dns",
            value=self.compute.primary_alb.dns_name
        )
        
        TerraformOutput(self, "secondary_alb_dns",
            value=self.compute.secondary_alb.dns_name
        )
        
        TerraformOutput(self, "route53_zone_id",
            value=self.dns.hosted_zone.zone_id
        )
