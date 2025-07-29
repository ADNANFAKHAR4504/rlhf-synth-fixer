from aws_cdk import (
  aws_s3 as s3,
  RemovalPolicy,
)
from constructs import Construct

class S3SourceConstruct(Construct):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
    # Define the S3 bucket for raw log files
    self.s3_bucket = s3.Bucket(
        self,
        "LogSourceBucket",
        # Let CDK generate a unique bucket name
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        versioned=True,
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True,
    )
