from aws_cdk import (
  aws_sqs as sqs,
  aws_s3 as s3,
  RemovalPolicy,
  Duration,
)
from constructs import Construct

class ErrorHandlingConstruct(Construct):
  """
  ErrorHandlingConstruct defines an SQS Dead-Letter Queue for Lambda failures
  and an S3 bucket for archiving malformed log files.
  This is a standard CDK Construct, not a NestedStack.
  """

  def __init__(self, scope: Construct, construct_id: str, 
               queue_name: str = None, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # Use provided queue name or generate one based on construct hierarchy
    actual_queue_name = queue_name or "TestLogPipeline-ErrorHandling-Test-LambdaDLQ"

    # 1. Define the SQS Dead-Letter Queue (DLQ) for Lambda
    self.dlq_queue = sqs.Queue(
        self,
        "LambdaDLQ",
        queue_name=actual_queue_name,
        retention_period=Duration.days(7),
        removal_policy=RemovalPolicy.DESTROY,
    )

    # 2. Define the S3 Bucket for Error Archiving
    self.error_archive_bucket = s3.Bucket(
        self,
        "LogErrorArchiveBucket",
        # Let CDK generate a unique bucket name to avoid token issues
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        versioned=True,
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True,
    )
