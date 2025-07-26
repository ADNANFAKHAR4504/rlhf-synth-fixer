from aws_cdk import (
  Stack,
  CfnOutput,
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

    # Export KMS outputs for integration tests
    CfnOutput(self, "KmsKeyId",
              value=self.key.key_id,
              description="The KMS key ID")

    CfnOutput(self, "KmsKeyArn",
              value=self.key.key_arn,
              description="The KMS key ARN")
