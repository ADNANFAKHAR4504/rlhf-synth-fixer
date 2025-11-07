"""
tap_stack.py

Main Pulumi ComponentResource for multi-environment payment processing infrastructure.
Orchestrates all resource creation with environment-specific configurations.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions

from .config import EnvironmentConfig, get_environment_config
from .networking import NetworkingStack
from .database import DatabaseStack
from .compute import ComputeStack
from .api import ApiGatewayStack
from .storage import StorageStack
from .monitoring import MonitoringStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for multi-environment payment processing.

    This component orchestrates the instantiation of all infrastructure components
    including networking, database, compute, API, storage, and monitoring.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
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

        # Get environment-specific configuration
        self.config = get_environment_config(self.environment_suffix)

        # Add environment tag
        all_tags = {
            'Environment': self.config.environment,
            'ManagedBy': 'Pulumi',
            **self.tags
        }

        # Add CostCenter tag for production
        if self.config.environment == 'prod':
            all_tags['CostCenter'] = 'payments-production'

        # Create networking infrastructure
        self.networking = NetworkingStack(
            f"networking-{self.environment_suffix}",
            vpc_cidr=self.config.vpc_cidr,
            environment_suffix=self.environment_suffix,
            tags=all_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create database infrastructure
        self.database = DatabaseStack(
            f"database-{self.environment_suffix}",
            vpc_id=self.networking.vpc_id,
            private_subnet_ids=self.networking.private_subnet_ids,
            instance_class=self.config.db_instance_class,
            enable_encryption=self.config.enable_db_encryption,
            environment_suffix=self.environment_suffix,
            tags=all_tags,
            opts=ResourceOptions(parent=self, depends_on=[self.networking])
        )

        # Create storage infrastructure (S3, DynamoDB)
        self.storage = StorageStack(
            f"storage-{self.environment_suffix}",
            enable_versioning=self.config.enable_s3_versioning,
            lifecycle_days=self.config.s3_lifecycle_days,
            dynamodb_billing_mode=self.config.dynamodb_billing_mode,
            enable_encryption=self.config.enable_storage_encryption,
            environment_suffix=self.environment_suffix,
            tags=all_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create compute infrastructure (Lambda)
        self.compute = ComputeStack(
            f"compute-{self.environment_suffix}",
            vpc_id=self.networking.vpc_id,
            private_subnet_ids=self.networking.private_subnet_ids,
            db_secret_arn=self.database.db_secret_arn,
            dynamodb_table_name=self.storage.dynamodb_table_name,
            reserved_concurrency=self.config.lambda_reserved_concurrency,
            environment_suffix=self.environment_suffix,
            tags=all_tags,
            opts=ResourceOptions(parent=self, depends_on=[self.database, self.storage, self.networking])
        )

        # Create API Gateway
        self.api = ApiGatewayStack(
            f"api-{self.environment_suffix}",
            lambda_function_arn=self.compute.lambda_function_arn,
            lambda_function_name=self.compute.lambda_function_name,
            enable_custom_domain=self.config.enable_custom_domain,
            environment_suffix=self.environment_suffix,
            tags=all_tags,
            opts=ResourceOptions(parent=self, depends_on=[self.compute])
        )

        # Create monitoring infrastructure
        self.monitoring = MonitoringStack(
            f"monitoring-{self.environment_suffix}",
            log_retention_days=self.config.log_retention_days,
            lambda_function_name=self.compute.lambda_function_name,
            api_gateway_id=self.api.api_id,
            api_stage_name=self.api.stage_name,
            environment_suffix=self.environment_suffix,
            tags=all_tags,
            opts=ResourceOptions(parent=self, depends_on=[self.compute, self.api])
        )

        # Register outputs
        self.register_outputs({
            'vpc_id': self.networking.vpc_id,
            'public_subnet_ids': self.networking.public_subnet_ids,
            'private_subnet_ids': self.networking.private_subnet_ids,
            'db_endpoint': self.database.db_endpoint,
            'db_secret_arn': self.database.db_secret_arn,
            's3_bucket_name': self.storage.s3_bucket_name,
            'dynamodb_table_name': self.storage.dynamodb_table_name,
            'lambda_function_arn': self.compute.lambda_function_arn,
            'lambda_function_name': self.compute.lambda_function_name,
            'api_endpoint': self.api.api_endpoint,
            'api_id': self.api.api_id,
        })
