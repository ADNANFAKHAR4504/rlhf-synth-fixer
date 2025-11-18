"""
IAM infrastructure module.
Creates IAM roles and policies with least-privilege access.
"""
from typing import Dict, Any
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class IAMStack:
    """Creates IAM roles and policies."""

    def __init__(self,
                 name: str,
                 data_bucket_arn: Output[str],
                 logs_bucket_arn: Output[str],
                 environment_suffix: str,
                 tags: Dict[str, str],
                 opts: ResourceOptions = None):
        """
        Initialize IAM infrastructure.

        Args:
            name: Resource name prefix
            data_bucket_arn: Data bucket ARN
            logs_bucket_arn: Logs bucket ARN
            environment_suffix: Environment suffix
            tags: Common tags
            opts: Pulumi resource options
        """
        self.environment_suffix = environment_suffix
        self.tags = tags

        # EC2 assume role policy
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "ec2.amazonaws.com"
                }
            }]
        })

        # EC2 IAM Role
        self.ec2_role = aws.iam.Role(
            f"ec2-role-{environment_suffix}",
            name=f"ec2-role-{environment_suffix}",
            assume_role_policy=assume_role_policy,
            tags={**tags, "Name": f"ec2-role-{environment_suffix}"},
            opts=opts
        )

        # S3 access policy for EC2
        s3_policy_document = pulumi.Output.all(data_bucket_arn, logs_bucket_arn).apply(
            lambda arns: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": [
                            f"{arns[0]}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            arns[0]
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject"
                        ],
                        "Resource": [
                            f"{arns[1]}/*"
                        ]
                    }
                ]
            })
        )

        self.s3_policy = aws.iam.RolePolicy(
            f"ec2-s3-policy-{environment_suffix}",
            role=self.ec2_role.id,
            policy=s3_policy_document,
            opts=ResourceOptions(parent=self.ec2_role)
        )

        # CloudWatch Logs policy for EC2
        cloudwatch_policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": f"arn:aws:logs:us-east-1:*:log-group:/aws/ec2/{environment_suffix}/*"
                }
            ]
        })

        self.cloudwatch_policy = aws.iam.RolePolicy(
            f"ec2-cloudwatch-policy-{environment_suffix}",
            role=self.ec2_role.id,
            policy=cloudwatch_policy_document,
            opts=ResourceOptions(parent=self.ec2_role)
        )

        # EC2 Instance Profile
        self.instance_profile = aws.iam.InstanceProfile(
            f"ec2-instance-profile-{environment_suffix}",
            name=f"ec2-instance-profile-{environment_suffix}",
            role=self.ec2_role.name,
            opts=ResourceOptions(parent=self.ec2_role)
        )
