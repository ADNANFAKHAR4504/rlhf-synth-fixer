from aws_cdk import (
  Stack,
  RemovalPolicy,
  aws_kms as kms,
)
from constructs import Construct


class KmsStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    self.key = kms.Key(self, "AppKey",
                       enable_key_rotation=True,
                       removal_policy=RemovalPolicy.DESTROY
                       )
