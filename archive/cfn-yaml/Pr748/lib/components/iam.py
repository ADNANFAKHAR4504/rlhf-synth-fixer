"""
IAM module for Lambda execution role with least privilege permissions.
Creates role with necessary permissions for VPC, RDS, and CloudWatch access.
"""

import json
import pulumi
import pulumi_aws as aws


class IAMComponent(pulumi.ComponentResource):
  def __init__(self, name: str, environment: str, opts=None):
    super().__init__("custom:aws:IAM", name, None, opts)

    # Trust policy for Lambda service
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }
        ]
    })

    # Create Lambda execution role
    self.lambda_role = aws.iam.Role(
        f"lambda-role-{environment}",
        name=f"lambda-role-{environment}-blacree",
        assume_role_policy=assume_role_policy,
        tags={
            "Name": f"lambda-role-{environment}",
            "Environment": environment
        },
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Attach basic Lambda execution policy
    aws.iam.RolePolicyAttachment(
        f"lambda-basic-execution-{environment}",
        role=self.lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )

    # Attach VPC access policy for Lambda
    aws.iam.RolePolicyAttachment(
        f"lambda-vpc-access-{environment}",
        role=self.lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
    )

    # Custom policy for RDS access (read-only for security)
    self.rds_policy = aws.iam.Policy(
        f"lambda-rds-policy-{environment}",
        name=f"lambda-rds-policy-{environment}",
        description="Policy for Lambda to access RDS",
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "rds:DescribeDBInstances",
                        "rds:DescribeDBClusters"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:*:*:log-group:/aws/lambda/*"
                }
            ]
        })
    )

    # Attach custom RDS policy
    aws.iam.RolePolicyAttachment(
        f"lambda-rds-policy-attachment-{environment}",
        role=self.lambda_role.name,
        policy_arn=self.rds_policy.arn
    )
    self.register_outputs(
        {
            "lambda_role_arn": self.lambda_role.arn
        }
    )
