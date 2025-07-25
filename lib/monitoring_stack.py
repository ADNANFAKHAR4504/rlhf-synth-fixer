from aws_cdk import (
    Stack,
    Duration,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
)
from constructs import Construct

class MonitoringStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # ✅ Example 1: Create a CloudWatch Log Group
        self.app_log_group = logs.LogGroup(
            self, "AppLogGroup",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=None  # Can be set to RemovalPolicy.DESTROY for dev
        )