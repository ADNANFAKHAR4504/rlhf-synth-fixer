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

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack
from .inventory_serverless import InventoryServerlessStack, InventoryServerlessStackArgs


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
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

        # Example usage of suffix and tags
        # You would replace this with instantiation of imported components like DynamoDBStack
        
        # s3.Bucket(f"tap-bucket-{self.environment_suffix}",
        #           tags=self.tags,
        #           opts=ResourceOptions(parent=self))

        # Instantiate the inventory serverless stack
        config = pulumi.Config()
        notification_email = config.get("notification_email") or "paul.s@turing.com"
        
        self.inventory_serverless = InventoryServerlessStack(
            name="inventory-serverless",
            args=InventoryServerlessStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags,
                notification_email=notification_email
            ),
            opts=ResourceOptions(parent=self)
        )

        # Register outputs from the inventory serverless stack
        self.register_outputs({
            "inventory_api_url": self.inventory_serverless.api_deployment.invoke_url,
            "inventory_items_table": self.inventory_serverless.inventory_items_table.name,
            "inventory_audit_table": self.inventory_serverless.inventory_audit_table.name,
            "inventory_lambda_function": self.inventory_serverless.inventory_api_lambda.name,
            "inventory_sns_topic": self.inventory_serverless.inventory_alerts_topic.arn
        })
