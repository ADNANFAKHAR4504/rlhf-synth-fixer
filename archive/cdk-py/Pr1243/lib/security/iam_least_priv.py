from constructs import Construct
from aws_cdk import (
  aws_iam as iam,
  aws_s3 as s3,
)

class IamLeastPrivilegeExamples(Construct):
  """
  Demonstrates least-privilege roles with tight resource scoping.
  """
  def __init__(self, scope: Construct, id: str, *, bucket: s3.IBucket) -> None:
    super().__init__(scope, id)

    # Example 1: read-only to a single bucket
    self.s3_readonly_role = iam.Role(
      self, "S3ReadOnlyRole",
      assumed_by=iam.ServicePrincipal("ec2.amazonaws.com")
    )
    self.s3_readonly_role.add_to_policy(
      iam.PolicyStatement(
        actions=["s3:GetObject", "s3:ListBucket"],
        resources=[bucket.bucket_arn, bucket.arn_for_objects("*")]
      )
    )

    # Example 2: write-only to a *prefix* in the same bucket (no read)
    self.s3_writer_role = iam.Role(
      self, "S3WriterRole",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com")
    )
    self.s3_writer_role.add_to_policy(
      iam.PolicyStatement(
        actions=["s3:PutObject"],
        resources=[bucket.arn_for_objects("ingest/*")]
      )
    )

    # Example 3: CloudTrail read-only (management plane review)
    self.cloudtrail_read_role = iam.Role(
      self, "CloudTrailReadOnlyRole",
      assumed_by=iam.AccountRootPrincipal()  # adjust to your use-case
    )
    self.cloudtrail_read_role.add_managed_policy(
      iam.ManagedPolicy.from_aws_managed_policy_name("AWSCloudTrail_ReadOnlyAccess")
    )
