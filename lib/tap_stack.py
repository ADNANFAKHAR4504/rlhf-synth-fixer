"""
tap_stack.py

This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project. It orchestrates the instantiation
of other resource-specific stacks and manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct

# Import your stacks here
from .metadata_stack import SecureInfrastructureStack


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
      props (Optional[TapStackProps]): Optional properties for configuring the stack.
      **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
      environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[TapStackProps] = None,
      **kwargs,
  ):
    super().__init__(scope, construct_id, **kwargs)

    # Determine environment suffix
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context("environmentSuffix") or "dev"

    # Nested stack class to instantiate SecureInfrastructureStack
    class NestedSecureInfrastructureStack(NestedStack):
      def __init__(self,
                   nested_scope: Construct,
                   nested_id: str,
                   nested_props=None, **nested_kwargs):
        super().__init__(nested_scope, nested_id, **nested_kwargs)
        self.metadata_stack = SecureInfrastructureStack(
            self,
            "SecureInfrastructureStack",
            env=nested_props.env if nested_props else None,
        )

    # Instantiate the nested stack
    self.nested_stack = NestedSecureInfrastructureStack(
        self,
        f"SecureInfrastructureStack{environment_suffix}",
        nested_props=props,
    )
