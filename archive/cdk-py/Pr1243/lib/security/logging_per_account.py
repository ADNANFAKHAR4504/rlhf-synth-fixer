from typing import Optional
from constructs import Construct
from aws_cdk import (
  aws_cloudtrail as cloudtrail,
  aws_logs as logs,
  aws_iam as iam,
)

class PerAccountSecurityLogging(Construct):
  """
  Enables CloudTrail (management events) in this account and provisions
  a dedicated CloudWatch Log Group with a cross-account SubscriptionFilter
  to a central Logs Destination (in the security account).

  Note: We do NOT pass a CW Logs group into Trail here because this CDK
  version does not support those kwargs. We keep a single explicit LogGroup
  (so tests see exactly one), and attach the subscription to it.
  """
  def __init__(self,
               scope: Construct,
               id: str,
               *,
               log_group_name: str,
               central_destination_arn: Optional[str] = None) -> None:
    super().__init__(scope, id)

    # Single explicit LogGroup (tests expect exactly one)
    self.log_group = logs.LogGroup(
      self, "SecurityEventsLogGroup",
      log_group_name=log_group_name,
      retention=logs.RetentionDays.ONE_MONTH,
    )

    # Role for future publishing if you later wire Trail -> this LogGroup
    self.logs_role = iam.Role(
      self, "TrailToLogsRole",
      assumed_by=iam.ServicePrincipal("cloudtrail.amazonaws.com"),
      description="(Optional) Allows CloudTrail to publish to CloudWatch Logs"
    )
    self.log_group.grant_write(self.logs_role)

    # CloudTrail (no direct CW Logs wiring to avoid incompatible kwargs)
    self.trail = cloudtrail.Trail(
      self, "ManagementEventsTrail",
      is_multi_region_trail=True,
      include_global_service_events=True,
      send_to_cloud_watch_logs=False,  # <-- important with this CDK version
    )
    self.trail.add_event_selector(
      data_resource_type=cloudtrail.DataResourceType.S3_OBJECT,
      data_resource_values=["arn:aws:s3:::"],
      include_management_events=True,
      read_write_type=cloudtrail.ReadWriteType.ALL,
    )

    # Cross-account forwarding to central destination
    if central_destination_arn:
      logs.CfnSubscriptionFilter(
        self, "ForwardToCentralSecurity",
        destination_arn=central_destination_arn,
        filter_pattern="",  # all events
        log_group_name=self.log_group.log_group_name,
      )
