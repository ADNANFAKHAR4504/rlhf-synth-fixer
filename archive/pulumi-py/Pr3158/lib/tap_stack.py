"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import s3  # example import for any AWS resource

# Import infrastructure modules
from .infrastructure import main as infrastructure_main


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.o
     
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.

    Note:
        - DO NOT create resources directly here unless they are truly global.
        - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

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

        # Bootstrap the serverless infrastructure
        self.infrastructure = infrastructure_main.create_serverless_infrastructure()

        # Register outputs
        self.register_outputs({
            "lambda_function_name": self.infrastructure["lambda_function"].name,
            "lambda_function_arn": self.infrastructure["lambda_function"].arn,
            "api_gateway_id": self.infrastructure["api_gateway"].id,
            "api_gateway_url": self.infrastructure["api_gateway"].id.apply(lambda api_id: "https://" + api_id + ".execute-api.us-east-1.amazonaws.com/dev/api"),
            "s3_bucket_name": self.infrastructure["logs_bucket"].id,
            "s3_bucket_arn": self.infrastructure["logs_bucket"].arn,
            "dlq_url": self.infrastructure["dlq"].id,
            "dlq_arn": self.infrastructure["dlq"].arn,
            "sns_topic_arn": self.infrastructure["sns_topic"].arn,
            "environment_variables": self.infrastructure["lambda_function"].environment.variables,
            "failover_function_name": self.infrastructure["failover_function"].name,
            "failover_function_arn": self.infrastructure["failover_function"].arn,
            "parameter_prefix": self.infrastructure["lambda_function"].name.apply(lambda name: "/" + name),
            "dashboard_url": self.infrastructure["dashboard"].dashboard_name
        })
