"""IAM module implementing least privilege access control."""
import json

import pulumi
import pulumi_aws.iam as iam  # clearer import


class IAMManager:
    """Manages IAM roles and policies with least privilege principle."""

    def __init__(self, project_name: str, environment: str):
        self.project_name = project_name
        self.environment = environment

    def create_cloudtrail_role(self, s3_bucket_arn: pulumi.Output[str]) -> iam.Role:
        """Create IAM role for CloudTrail with minimal required permissions."""

        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "cloudtrail.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }

        role = iam.Role(
            f"{self.project_name}-cloudtrail-role",
            # Avoid collisions by including environment in name
            name=f"{self.project_name}-{self.environment}-cloudtrail-role",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"{self.project_name}-cloudtrail-role",
                "Environment": self.environment,
                "Purpose": "cloudtrail-logging",
                "ManagedBy": "pulumi"
            }
        )

        policy_doc = s3_bucket_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["s3:PutObject", "s3:GetBucketAcl"],
                    "Resource": [f"{arn}/AWSLogs/*"]
                },
                {
                    "Effect": "Allow",
                    "Action": ["s3:GetBucketLocation"],
                    "Resource": arn
                }
            ]
        }))

        iam.RolePolicy(
            f"{self.project_name}-cloudtrail-policy",
            name=f"{self.project_name}-{self.environment}-cloudtrail-policy",
            role=role.id,
            policy=policy_doc
        )

        pulumi.export("cloudtrail_role_name", role.name)
        pulumi.export("cloudtrail_role_arn", role.arn)

        return role

    def create_vpc_flow_logs_role(self, log_group_arn: pulumi.Output[str]) -> iam.Role:
        """Create IAM role for VPC Flow Logs with minimal permissions."""

        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }

        role = iam.Role(
            f"{self.project_name}-vpc-flow-logs-role",
            name=f"{self.project_name}-{self.environment}-vpc-flow-logs-role",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"{self.project_name}-vpc-flow-logs-role",
                "Environment": self.environment,
                "Purpose": "vpc-flow-logs",
                "ManagedBy": "pulumi"
            }
        )

        policy_doc = log_group_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                ],
                "Resource": [arn, f"{arn}:*"]
            }]
        }))

        iam.RolePolicy(
            f"{self.project_name}-vpc-flow-logs-policy",
            name=f"{self.project_name}-{self.environment}-vpc-flow-logs-policy",
            role=role.id,
            policy=policy_doc
        )

        pulumi.export("vpc_flow_logs_role_name", role.name)
        pulumi.export("vpc_flow_logs_role_arn", role.arn)

        return role
