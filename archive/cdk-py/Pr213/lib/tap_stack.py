from typing import Optional

import aws_cdk as cdk
from constructs import Construct

from .metadata_stack import ServerlessStack


class TapStackProps(cdk.StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[TapStackProps] = None,
      **kwargs
  ):
    super().__init__(scope, construct_id, **kwargs)

    self.environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context("environmentSuffix") or "dev"

    self.serverless_stack = ServerlessStack(self, "ServerlessStack")
