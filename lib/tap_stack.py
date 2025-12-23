# lib/tap_stack.py

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from .components.networking import NetworkInfrastructure
from .components.user import FrontendInfrastructure
from .components.backend import BackendInfrastructure
from .components.data import DataProcessingInfrastructure
from .components.monitoring import MonitoringInfrastructure

"""
This module defines the TapStack class, the main Pulumi ComponentResource for
the Multi-Tiered Web Application project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

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
      sns_topic_arn=self.monitoring.sns_topic.arn,
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.network, self.monitoring])
    )

    self.data_processing = DataProcessingInfrastructure(
      name=f"{name}-data",
      vpc_id=self.network.vpc.id,
      private_subnet_ids=self.network.private_subnet_ids,
      vpc_endpoint_sg_id=self.network.vpc_endpoint_security_group.id,
      sns_topic_arn=self.monitoring.sns_topic.arn,
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.network, self.monitoring])
    )

    # Skip CloudFront for LocalStack Community (requires Pro)
    import os
    is_localstack = os.environ.get('AWS_ENDPOINT_URL', '').find('localhost') != -1 or \
                    os.environ.get('AWS_ENDPOINT_URL', '').find('4566') != -1

    if not is_localstack:
      self.frontend = FrontendInfrastructure(
        name=f"{name}-frontend",
        tags=self.tags,
        opts=ResourceOptions(parent=self, depends_on=[self.backend])
      )
      cloudfront_dist_id = self.frontend.cloudfront_distribution.id
    else:
      self.frontend = None
      cloudfront_dist_id = None

    self.monitoring.setup_alarms(
      lambda_function_names=[
        self.backend.lambda_function.name,
        self.data_processing.kinesis_processor.name
      ],
      kinesis_stream_name=self.data_processing.kinesis_stream.name,
      cloudfront_distribution_id=cloudfront_dist_id,
      opts=ResourceOptions(parent=self)
    )

    outputs = {
      "vpc_id": self.network.vpc.id,
      "kinesis_stream_name": self.data_processing.kinesis_stream.name,
      "sns_topic_arn": self.monitoring.sns_topic.arn,
    }

    if self.frontend:
      outputs["cloudfront_domain"] = self.frontend.cloudfront_distribution.domain_name

    self.register_outputs(outputs)

    # Export outputs at stack level
    pulumi.export("vpc_id", self.network.vpc.id)
    if self.frontend:
      pulumi.export("cloudfront_domain", self.frontend.cloudfront_distribution.domain_name)
    pulumi.export("kinesis_stream_name", self.data_processing.kinesis_stream.name)
    pulumi.export("sns_topic_arn", self.monitoring.sns_topic.arn)