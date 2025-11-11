from aws_cdk import (
    Stack,
    aws_iam as iam,
)
from constructs import Construct


class DmsPrerequisitesStack(Stack):
    """Stack for DMS prerequisite resources - imports existing DMS service roles"""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Import the existing DMS VPC management role
        # AWS DMS requires this specific role name to manage VPC resources
        # These roles already exist in the account, so we import them
        self.dms_vpc_role = iam.Role.from_role_name(
            self,
            "dms-vpc-role",
            role_name="dms-vpc-role",
        )

        # Import the existing DMS CloudWatch Logs role
        self.dms_cloudwatch_logs_role = iam.Role.from_role_name(
            self,
            "dms-cloudwatch-logs-role",
            role_name="dms-cloudwatch-logs-role",
        )
