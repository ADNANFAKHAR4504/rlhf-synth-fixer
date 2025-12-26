"""
This module defines the TapStack class, the main Pulumi ComponentResource for
the Multi-Tiered Web Application project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""
# lib/tap_stack.py

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from .components.network import NetworkInfrastructure
from .components.frontend import FrontendInfrastructure
from .components.backend import BackendInfrastructure
from .components.data_processing import DataProcessingInfrastructure
from .components.monitoring import MonitoringInfrastructure

class TapStackArgs:
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags

class TapStack(pulumi.ComponentResource):
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__('tap:stack:TapStack', name, None, opts)
        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        self.network = NetworkInfrastructure(
            name=f"{name}-network",
            environment=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        self.monitoring = MonitoringInfrastructure(
            name=f"{name}-monitoring",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        self.backend = BackendInfrastructure(
            name=f"{name}-backend",
            vpc_id=self.network.vpc.id,
            private_subnet_ids=self.network.private_subnet_ids,
            vpc_endpoint_sg_id=self.network.vpc_endpoint_security_group.id,
            sns_topic_arn=self.monitoring.sns_topic_arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.network, self.monitoring])
        )

        self.data_processing = DataProcessingInfrastructure(
            name=f"{name}-data",
            vpc_id=self.network.vpc.id,
            private_subnet_ids=self.network.private_subnet_ids,
            vpc_endpoint_sg_id=self.network.vpc_endpoint_security_group.id,
            sns_topic_arn=self.monitoring.sns_topic_arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.network, self.monitoring])
        )

        self.frontend = FrontendInfrastructure(
            name=f"{name}-frontend",
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.backend])
        )

        # Setup alarms (only works in AWS/LocalStack Pro, no-op in Community)
        self.monitoring.setup_alarms(
            lambda_function_names=[
                self.backend.lambda_function.name,
                self.data_processing.data_processor.name
            ],
            kinesis_stream_name=None,  # Kinesis removed for LocalStack Community
            cloudfront_distribution_id=None,  # CloudFront removed for LocalStack Community
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            "vpc_id": self.network.vpc.id,
            "website_url": self.frontend.website_url,
            "sns_topic_arn": self.monitoring.sns_topic_arn,
            "backend_data_bucket": self.backend.data_bucket.id,
            "processing_input_bucket": self.data_processing.input_bucket.id,
        })

        # Export outputs at stack level
        pulumi.export("vpc_id", self.network.vpc.id)
        pulumi.export("website_url", self.frontend.website_url)
        pulumi.export("sns_topic_arn", self.monitoring.sns_topic_arn)
        pulumi.export("backend_data_bucket", self.backend.data_bucket.id)
        pulumi.export("processing_input_bucket", self.data_processing.input_bucket.id)