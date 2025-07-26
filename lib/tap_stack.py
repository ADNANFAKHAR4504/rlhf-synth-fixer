"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import NestedStack, CfnOutput
from constructs import Construct

# Import your stacks here
from .metadata_stack import MultiRegionStack


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the 
    deployment environment (e.g., 'dev', 'prod').
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
  It determines the environment suffix from the provided properties, 
    CDK context, or defaults to 'dev'.
  Note:
    - Do NOT create AWS resources directly in this stack.
    - Instead, instantiate separate stacks for each resource type within this stack.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the 
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create separate stacks for each resource type
    # Create the DynamoDB stack as a nested stack

    # ! DO not create resources directly in this stack.
    # ! Instead, instantiate separate stacks for each resource type.

    class NestedMultiRegionStack(NestedStack):
      """Nested stack for multi-region deployments."""
      def __init__(self, scope, construct_id, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        # Deploy to multiple regions for high availability
        regions = ["us-east-1", "us-west-1"]
        self.region_stacks = {}
        for region in regions:
          region_stack = MultiRegionStack(self, f"MultiRegionStack-{region}", region=region)
          self.region_stacks[region] = region_stack

    # db_props = DynamoDBStackProps(
    #     environment_suffix=environment_suffix
    # )

    # Create multi-region deployment
    NestedMultiRegionStack(
      self,
      f"MultiRegionStack{environment_suffix}"
    )
    
    # Add outputs that aggregate nested stack information
    CfnOutput(self, "MainStackName", value=self.stack_name)
    CfnOutput(self, "EnvironmentSuffix", value=environment_suffix)
    CfnOutput(self, "DeployedRegions", value=",".join(["us-east-1", "us-west-1"]))
    
    # Note: Comprehensive outputs are available in nested stacks
    # The CI/CD pipeline will collect outputs from all CloudFormation stacks
    # including nested stacks created by this main stack

    # # Make the table available as a property of this stack
    # self.table = dynamodb_stack.table
