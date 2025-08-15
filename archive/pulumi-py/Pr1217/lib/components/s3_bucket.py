from typing import Optional
import pulumi
import pulumi_aws as aws


class S3Bucket(pulumi.ComponentResource):
  """
  Component for creating S3 bucket with versioning and Lambda trigger.
  """

  def __init__(self,
               name: str,
               opts: pulumi.ResourceOptions = None):
    super().__init__('custom:aws:S3Bucket', name, {}, opts)

    self.function_name = name

    # Create S3 bucket
    self.bucket_notification: Optional[aws.s3.BucketNotification] = None
    self.bucket = aws.s3.Bucket(
      f"{name}-bucket",
      tags={
        "Name": f"{name}-bucket",
        "Component": "Storage"
      },
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Enable versioning
    self.bucket_versioning = aws.s3.BucketVersioningV2(
      f"{name}-bucket-versioning",
      bucket=self.bucket.id,
      versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
      ),
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Block public access
    self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
      f"{name}-bucket-pab",
      bucket=self.bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Register outputs
    self.register_outputs({
      'bucket_arn': self.bucket.arn,
      'bucket_name': self.bucket.bucket
    })

  def add_lambda_notification(self, lambda_function_arn: pulumi.Input[str], lambda_permission):
    """Add Lambda notification configuration to the bucket."""

    self.bucket_notification = aws.s3.BucketNotification(
      f"{self.function_name}-notification",
      bucket=self.bucket.id,
      lambda_functions=[
        aws.s3.BucketNotificationLambdaFunctionArgs(
          lambda_function_arn=lambda_function_arn,
          events=["s3:ObjectCreated:*"],
        )
      ],
      opts=pulumi.ResourceOptions(
        parent=self,
        depends_on=[lambda_permission]
      )
    )

    return self.bucket_notification
