from aws_cdk import (
  Stack,
  RemovalPolicy,
  aws_logs as logs,
)
from constructs import Construct


class MonitoringStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # Create a CloudWatch Log Group
    self.app_log_group = logs.LogGroup(
        self, "AppLogGroup",
        retention=logs.RetentionDays.ONE_WEEK,
        removal_policy=RemovalPolicy.DESTROY
    )
