"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of the multi-environment infrastructure.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct

from .multi_env_infrastructure import MultiEnvironmentInfrastructureStack


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


class TapStack(MultiEnvironmentInfrastructureStack):
  """
  Represents the main CDK stack for the Tap project.

  This stack extends the MultiEnvironmentInfrastructureStack to create
  a comprehensive multi-environment AWS infrastructure with Development,
  Staging, and Production environments.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the 
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(self, scope: Construct, construct_id: str,
               props: Optional[TapStackProps] = None, **kwargs):

    # Get environment suffix from props first
    environment_suffix = None
    if props and props.environment_suffix:
      environment_suffix = props.environment_suffix

    # If not from props, default to 'dev'
    # Note: CDK context access is done after super().__init__ to avoid JSII issues
    if not environment_suffix:
      environment_suffix = 'dev'

    # Initialize the multi-environment infrastructure
    super().__init__(scope, construct_id, environment_suffix=environment_suffix, **kwargs)

    # Try to get from context after initialization (if needed for future use)
    try:
      context_suffix = self.node.try_get_context('environmentSuffix')
      if context_suffix and not props:
        # This would require recreation, but we'll log it for now
        pass
    except:
      # Ignore any context access issues
      pass
