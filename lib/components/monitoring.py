import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class CloudTrailComponent(pulumi.ComponentResource):
  def __init__(self, name: str, bucket_id: str, region_suffix: str, opts: ResourceOptions = None):
    super().__init__("custom:component:CloudTrailComponent", name, None, opts)

    # S3 bucket for CloudTrail logs
    bucket = aws.s3.Bucket(
        f"{name}-bucket", acl="private", opts=ResourceOptions(parent=self))

    # CloudTrail trail
    trail = aws.cloudtrail.Trail(
        f"{name}-trail-{region_suffix}",
        s3_bucket_name=bucket_id,
        enable_logging=True,
        opts=ResourceOptions(parent=self)
    )
