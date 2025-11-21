"""
IAM Component for Payment Processing.
Creates IAM roles with least-privilege policies.
"""

from typing import Optional, Dict
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
from lib.environment_config import EnvironmentConfig


class IAMComponentArgs:
    """Arguments for IAM Component."""

    def __init__(
        self,
        environment_suffix: str,
        env_config: EnvironmentConfig,
        dynamodb_table_arn: Output[str],
        s3_bucket_arn: Output[str],
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.env_config = env_config
        self.dynamodb_table_arn = dynamodb_table_arn
        self.s3_bucket_arn = s3_bucket_arn
        self.tags = tags or {}


class IAMComponent(pulumi.ComponentResource):
    """
    Reusable IAM component with least-privilege policies.
    Creates roles that restrict cross-environment access.
    """

    def __init__(
        self,
        name: str,
        args: IAMComponentArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:security:IAMComponent', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Lambda execution role
        self.lambda_role = aws.iam.Role(
            f"payment-lambda-role-{args.environment_suffix}",
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'sts:AssumeRole',
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'lambda.amazonaws.com'
                    }
                }]
            }),
            tags={
                **args.tags,
                'Name': f"payment-lambda-role-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"payment-lambda-basic-execution-{args.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=child_opts
        )

        # Create custom policy for DynamoDB and S3 access (least-privilege)
        self.lambda_policy = aws.iam.Policy(
            f"payment-lambda-policy-{args.environment_suffix}",
            policy=Output.all(
                dynamodb_arn=args.dynamodb_table_arn,
                s3_arn=args.s3_bucket_arn
            ).apply(lambda vals: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'dynamodb:PutItem',
                            'dynamodb:GetItem',
                            'dynamodb:Query',
                            'dynamodb:UpdateItem'
                        ],
                        'Resource': [
                            vals['dynamodb_arn'],
                            f"{vals['dynamodb_arn']}/index/*"
                        ],
                        'Condition': {
                            'StringEquals': {
                                'aws:RequestedRegion': args.env_config.region
                            }
                        }
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            's3:PutObject',
                            's3:GetObject'
                        ],
                        'Resource': f"{vals['s3_arn']}/*",
                        'Condition': {
                            'StringEquals': {
                                'aws:RequestedRegion': args.env_config.region
                            }
                        }
                    }
                ]
            })),
            tags=args.tags,
            opts=child_opts
        )

        # Attach custom policy to Lambda role
        aws.iam.RolePolicyAttachment(
            f"payment-lambda-custom-policy-{args.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn=self.lambda_policy.arn,
            opts=child_opts
        )

        # Register outputs
        self.register_outputs({
            'lambda_role_arn': self.lambda_role.arn,
            'lambda_role_name': self.lambda_role.name,
        })
