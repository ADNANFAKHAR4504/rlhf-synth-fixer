"""
Monitoring module for CloudTrail setup
"""

from typing import Dict
import pulumi
import pulumi_aws as aws


def setup_cloudtrail(region: str, s3_bucket_name: pulumi.Output[str], tags: Dict,
                     provider: aws.Provider) -> aws.cloudtrail.Trail:
  """Setup CloudTrail for auditing and compliance"""

  trail = aws.cloudtrail.Trail(
    f"cloudtrail-{region}",
    name=f"infrastructure-trail-{region}",
    s3_bucket_name=s3_bucket_name,
    s3_key_prefix=f"cloudtrail-logs/{region}",
    include_global_service_events=True,
    is_multi_region_trail=False,
    enable_logging=True,
    event_selectors=[aws.cloudtrail.TrailEventSelectorArgs(
      read_write_type="All",
      include_management_events=True,
      data_resources=[aws.cloudtrail.TrailEventSelectorDataResourceArgs(
        type="AWS::S3::Object",
        values=[s3_bucket_name.apply(lambda b: f"arn:aws:s3:::{b}/")]
      )]
    )],
    tags=tags,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  return trail
