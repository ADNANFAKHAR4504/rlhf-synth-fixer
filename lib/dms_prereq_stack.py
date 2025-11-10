from aws_cdk import (
    Stack,
    aws_iam as iam,
)
from constructs import Construct


class DmsPrerequisitesStack(Stack):
    """Stack for DMS prerequisite resources that must exist before DMS resources"""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create the required DMS VPC management role
        # AWS DMS requires this specific role name to manage VPC resources
        self.dms_vpc_role = iam.Role(
            self,
            "dms-vpc-role",
            role_name="dms-vpc-role",
            assumed_by=iam.ServicePrincipal("dms.amazonaws.com"),
            description="IAM role for DMS to manage VPC resources",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonDMSVPCManagementRole"
                )
            ],
        )

        # Create the DMS CloudWatch Logs role (also commonly required)
        self.dms_cloudwatch_logs_role = iam.Role(
            self,
            "dms-cloudwatch-logs-role",
            role_name="dms-cloudwatch-logs-role",
            assumed_by=iam.ServicePrincipal("dms.amazonaws.com"),
            description="IAM role for DMS to write to CloudWatch Logs",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonDMSCloudWatchLogsRole"
                )
            ],
        )


