from aws_cdk import (
    Stack,
    aws_iam as iam,
)
from constructs import Construct


class DmsPrerequisitesStack(Stack):
    """Stack for DMS prerequisite resources - creates required DMS service roles"""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create DMS VPC management role
        # AWS DMS requires this specific role name to manage VPC resources
        # Note: Using regional service principal for DMS resources
        self.dms_vpc_role = iam.Role(
            self,
            "dms-vpc-role",
            role_name="dms-vpc-role",
            assumed_by=iam.ServicePrincipal(f"dms.{self.region}.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonDMSVPCManagementRole"
                )
            ],
        )

        # Create DMS CloudWatch Logs role
        # Note: Using regional service principal for DMS resources
        self.dms_cloudwatch_logs_role = iam.Role(
            self,
            "dms-cloudwatch-logs-role",
            role_name="dms-cloudwatch-logs-role",
            assumed_by=iam.ServicePrincipal(f"dms.{self.region}.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonDMSCloudWatchLogsRole"
                )
            ],
        )
