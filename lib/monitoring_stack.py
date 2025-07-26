from aws_cdk import (
  Stack,
  CfnOutput,
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

    # Export Monitoring outputs for integration tests
    CfnOutput(self, "LogGroupName",
              value=self.app_log_group.log_group_name,
              description="The CloudWatch Log Group name")

    CfnOutput(self, "LogGroupArn",
              value=self.app_log_group.log_group_arn,
              description="The CloudWatch Log Group ARN")

    CfnOutput(self, "LogRetentionDays",
              value="7",
              description="Log retention in days")
