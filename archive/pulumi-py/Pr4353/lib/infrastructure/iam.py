"""
IAM module for EC2 failure recovery infrastructure.
Implements least-privilege policies for all required services.
"""
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class IAMStack:
    """IAM resources for EC2 failure recovery."""
    
    def __init__(self, config: EC2RecoveryConfig):
        self.config = config
        self.role = self._create_lambda_role()
        self.policy = self._create_lambda_policy()
        self.role_policy_attachment = self._attach_policy_to_role()
    
    def _create_lambda_role(self) -> aws.iam.Role:
        """Create IAM role for Lambda function with least-privilege permissions."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.iam.Role(
            f"{self.config.get_tag_name('lambda-role')}-{random_suffix}",
            name=self.config.iam_role_name,
            assume_role_policy=pulumi.Output.from_input({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags={
                "Name": self.config.get_tag_name("lambda-role"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )
    
    def _create_lambda_policy(self) -> aws.iam.Policy:
        """Create IAM policy with least-privilege permissions for EC2 recovery."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.iam.Policy(
            f"{self.config.get_tag_name('lambda-policy')}-{random_suffix}",
            name=f"{self.config.project_name}-ec2-recovery-policy{self.config.environment_suffix}-{random_suffix}",
            policy=pulumi.Output.from_input({
                "Version": "2012-10-17",
                "Statement": [
                    # CloudWatch Logs permissions
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"arn:aws:logs:{self.config.region}:*:log-group:{self.config.cloudwatch_log_group_name}*"
                    },
                    # EC2 permissions - restricted to tagged instances only
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeInstances",
                            "ec2:DescribeInstanceStatus",
                            "ec2:StartInstances",
                            "ec2:StopInstances"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "StringEquals": {
                                "ec2:ResourceTag/Auto-Recover": "true"
                            }
                        }
                    },
                    # S3 permissions - restricted to specific bucket and prefix
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"arn:aws:s3:::{self.config.s3_bucket_name}/ec2-recovery/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": f"arn:aws:s3:::{self.config.s3_bucket_name}"
                    },
                    # Parameter Store permissions - restricted to specific parameters
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:GetParametersByPath"
                        ],
                        "Resource": f"arn:aws:ssm:{self.config.region}:*:parameter{self.config.parameter_store_prefix}/*"
                    },
                    # SNS permissions - restricted to specific topic
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": f"arn:aws:sns:{self.config.region}:*:{self.config.sns_topic_name}"
                    }
                ]
            }),
            tags={
                "Name": self.config.get_tag_name("lambda-policy"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )
    
    def _attach_policy_to_role(self) -> aws.iam.RolePolicyAttachment:
        """Attach the policy to the Lambda role."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.iam.RolePolicyAttachment(
            f"{self.config.get_tag_name('lambda-policy-attachment')}-{random_suffix}",
            role=self.role.name,
            policy_arn=self.policy.arn
        )
    
    def get_role_arn(self) -> pulumi.Output[str]:
        """Get the IAM role ARN."""
        return self.role.arn
    
    def get_role_name(self) -> pulumi.Output[str]:
        """Get the IAM role name."""
        return self.role.name
