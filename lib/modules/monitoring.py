"""
Monitoring module for CloudTrail setup
"""

from typing import Dict
import pulumi
import pulumi_aws as aws


def setup_cloudtrail(region: str, s3_bucket_name: pulumi.Output[str], tags: Dict,
                     provider: aws.Provider) -> aws.cloudtrail.Trail:
  """Setup CloudTrail for auditing and compliance"""

  # Create CloudWatch Log Group for CloudTrail
  log_group = aws.cloudwatch.LogGroup(
    f"cloudtrail-log-group-{region}",
    name=f"/aws/cloudtrail/{region}",
    retention_in_days=90,
    tags=tags,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Create IAM role for CloudTrail to write to CloudWatch Logs
  cloudtrail_role = aws.iam.Role(
    f"cloudtrail-role-{region}",
    assume_role_policy="""{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "cloudtrail.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }""",
    tags=tags,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  # Attach policy to CloudTrail role
  cloudtrail_policy = pulumi.Output.all(log_group.arn).apply(
    lambda args: f"""{{
      "Version": "2012-10-17",
      "Statement": [
        {{
          "Effect": "Allow",
          "Action": [
              "logs:CreateLogStream",
              "logs:PutLogEvents"
          ],
          "Resource": "{args[0]}:*"
        }},
        {{
          "Effect": "Allow",
          "Action": [
              "logs:DescribeLogGroups",
              "logs:DescribeLogStreams"
          ],
          "Resource": "*"
        }}
      ]
    }}"""
  )

  aws.iam.RolePolicy(
    f"cloudtrail-policy-{region}",
    role=cloudtrail_role.id,
    policy=cloudtrail_policy,
    opts=pulumi.ResourceOptions(provider=provider)
  )

  trail = aws.cloudtrail.Trail(
    f"cloudtrail-{region}",
    name=f"infrastructure-trail-{region}",
    s3_bucket_name=s3_bucket_name,
    s3_key_prefix=f"cloudtrail-logs/{region}",
    include_global_service_events=True,
    is_multi_region_trail=False,
    enable_logging=True,
    cloud_watch_logs_group_arn=log_group.arn,
    cloud_watch_logs_role_arn=cloudtrail_role.arn,
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
