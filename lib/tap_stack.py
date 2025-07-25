"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


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

    # class NestedDynamoDBStack(NestedStack):
    #   def __init__(self, scope, id, props=None, **kwargs):
    #     super().__init__(scope, id, **kwargs)
    #     # Use the original DynamoDBStack logic here
    #     self.ddb_stack = DynamoDBStack(self, "Resource", props=props)
    #     self.table = self.ddb_stack.table

    # db_props = DynamoDBStackProps(
    #     environment_suffix=environment_suffix
    # )

    # dynamodb_stack = NestedDynamoDBStack(
    #     self,
    #     f"DynamoDBStack{environment_suffix}",
    #     props=db_props
    # )

    # # Make the table available as a property of this stack
    # self.table = dynamodb_stack.table
