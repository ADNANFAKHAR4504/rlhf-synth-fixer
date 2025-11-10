"""Main ComponentResource for payment processing infrastructure."""
import datetime
from typing import Optional

import pulumi
from pulumi import ComponentResource, ResourceOptions

from lib.compute import ComputeStack
from lib.network import NetworkStack
from lib.storage import StorageStack


class PaymentProcessingStack(ComponentResource):
    """ComponentResource that encapsulates the complete payment processing infrastructure."""

    def __init__(
        self,
        name: str,
        environment: str,
        environment_suffix: str,
        vpc_cidr: str,
        region: str,
        cost_center: str,
        enable_multi_az: bool = False,
        db_instance_class: str = "db.t3.micro",
        dynamodb_read_capacity: int = 5,
        dynamodb_write_capacity: int = 5,
        log_retention_days: int = 7,
        opts: Optional[ResourceOptions] = None,
    ):
        super().__init__("custom:infrastructure:PaymentProcessingStack", name, {}, opts)

        # Common tags for all resources
        self.common_tags = {
            "Environment": environment,
            "CostCenter": cost_center,
            "DeploymentTimestamp": datetime.datetime.now().isoformat(),
            "ManagedBy": "Pulumi",
            "Project": "PaymentProcessing",
        }

        # Create network infrastructure
        self.network = NetworkStack(
            name=f"network-{environment}-{environment_suffix}",
            vpc_cidr=vpc_cidr,
            environment=environment,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self),
        )

        # Create storage infrastructure
        self.storage = StorageStack(
            name=f"storage-{environment}-{environment_suffix}",
            environment=environment,
            environment_suffix=environment_suffix,
            vpc_id=self.network.vpc_id,
            private_subnet_ids=self.network.private_subnet_ids,
            db_security_group_id=self.network.db_security_group_id,
            enable_multi_az=enable_multi_az,
            db_instance_class=db_instance_class,
            dynamodb_read_capacity=dynamodb_read_capacity,
            dynamodb_write_capacity=dynamodb_write_capacity,
            log_retention_days=log_retention_days,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self),
        )

        # Create compute infrastructure
        self.compute = ComputeStack(
            name=f"compute-{environment}-{environment_suffix}",
            environment=environment,
            environment_suffix=environment_suffix,
            vpc_id=self.network.vpc_id,
            private_subnet_ids=self.network.private_subnet_ids,
            lambda_security_group_id=self.network.lambda_security_group_id,
            dynamodb_table_name=self.storage.dynamodb_table_name,
            dynamodb_table_arn=self.storage.dynamodb_table_arn,
            rds_endpoint=self.storage.rds_endpoint,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self),
        )

        # Expose outputs
        self.vpc_id = self.network.vpc_id
        self.public_subnet_ids = self.network.public_subnet_ids
        self.private_subnet_ids = self.network.private_subnet_ids
        self.api_gateway_url = self.compute.api_gateway_url
        self.dynamodb_table_name = self.storage.dynamodb_table_name
        self.rds_endpoint = self.storage.rds_endpoint
        self.audit_bucket_name = self.storage.audit_bucket_name
        self.lambda_function_name = self.compute.lambda_function_name

        self.register_outputs({
            "vpc_id": self.vpc_id,
            "public_subnet_ids": self.public_subnet_ids,
            "private_subnet_ids": self.private_subnet_ids,
            "api_gateway_url": self.api_gateway_url,
            "dynamodb_table_name": self.dynamodb_table_name,
            "rds_endpoint": self.rds_endpoint,
            "audit_bucket_name": self.audit_bucket_name,
            "lambda_function_name": self.lambda_function_name,
        })
