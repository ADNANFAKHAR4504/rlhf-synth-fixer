"""IAM module implementing least privilege access control."""
import pulumi
import pulumi_aws as aws
import json


class IAMManager:
  """Manages IAM roles and policies with least privilege principle."""

  def __init__(self, project_name: str, environment: str):
    self.project_name = project_name
    self.environment = environment

  def create_cloudtrail_role(
          self,
          s3_bucket_arn: pulumi.Output[str]) -> aws.iam.Role:
    """Create IAM role for CloudTrail with minimal required permissions."""

    # Trust policy for CloudTrail
    assume_role_policy = {
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
    }

    cloudtrail_role = aws.iam.Role(
        f"{self.project_name}-cloudtrail-role",
        name=f"{self.project_name}-cloudtrail-role",
        assume_role_policy=json.dumps(assume_role_policy),
        tags={
            "Name": f"{self.project_name}-cloudtrail-role",
            "Environment": self.environment,
            "Purpose": "cloudtrail-logging",
            "ManagedBy": "pulumi"
        }
    )

    # Policy for CloudTrail to write to S3
    cloudtrail_policy = s3_bucket_arn.apply(
        lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetBucketAcl"
                    ],
                    "Resource": [
                        arn,
                        f"{arn}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetBucketLocation"
                    ],
                    "Resource": arn
                }
            ]
        })
    )

    aws.iam.RolePolicy(
        f"{self.project_name}-cloudtrail-policy",
        name=f"{self.project_name}-cloudtrail-policy",
        role=cloudtrail_role.id,
        policy=cloudtrail_policy
    )

    return cloudtrail_role

  def create_vpc_flow_logs_role(
          self, log_group_arn: pulumi.Output[str]) -> aws.iam.Role:
    """Create IAM role for VPC Flow Logs with minimal permissions."""

    assume_role_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "vpc-flow-logs.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }

    flow_logs_role = aws.iam.Role(
        f"{self.project_name}-vpc-flow-logs-role",
        name=f"{self.project_name}-vpc-flow-logs-role",
        assume_role_policy=json.dumps(assume_role_policy),
        tags={
            "Name": f"{self.project_name}-vpc-flow-logs-role",
            "Environment": self.environment,
            "Purpose": "vpc-flow-logs",
            "ManagedBy": "pulumi"
        }
    )

    # Policy for VPC Flow Logs to write to CloudWatch
    flow_logs_policy = log_group_arn.apply(
        lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": arn
                }
            ]
        })
    )

    aws.iam.RolePolicy(
        f"{self.project_name}-vpc-flow-logs-policy",
        name=f"{self.project_name}-vpc-flow-logs-policy",
        role=flow_logs_role.id,
        policy=flow_logs_policy
    )

    return flow_logs_role
