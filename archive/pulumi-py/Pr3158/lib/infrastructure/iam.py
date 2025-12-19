"""
iam.py

IAM module for creating least-privilege roles and policies.
Addresses model failures: IAM roles not least-privilege, DLQ permissions missing.
"""

import json

import pulumi
import pulumi_aws as aws

from .config import config


def create_lambda_execution_role(name: str, s3_bucket_arn: str, dlq_arn: str):
    """
    Create a minimal privilege IAM role for Lambda function.
    Addresses model failure: IAM roles not least-privilege.
    """
    
    # Create the Lambda execution role with proper assume role policy
    lambda_role = aws.iam.Role(
        f"{name}-lambda-role",
        name=f"{name}-lambda-role",
        assume_role_policy=pulumi.Output.from_input({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }]
        }).apply(lambda x: json.dumps(x)),
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Attach basic Lambda execution policy for CloudWatch logs
    aws.iam.RolePolicyAttachment(
        f"{name}-lambda-basic-execution",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Attach X-Ray tracing policy
    aws.iam.RolePolicyAttachment(
        f"{name}-lambda-xray",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess",
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create custom policy for S3 access (least privilege)
    s3_access_policy = aws.iam.Policy(
        f"{name}-s3-access",
        name=f"{name}-s3-access",
        description="Allow Lambda to access the specific S3 bucket for logs",
        policy=pulumi.Output.all(s3_bucket_arn).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    "Resource": args[0] + "/*"
                }, {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": args[0]
                }]
            })
        ),
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create custom policy for Parameter Store access (least privilege)
    ssm_access_policy = aws.iam.Policy(
        f"{name}-ssm-access",
        name=f"{name}-ssm-access",
        description="Allow Lambda to access Parameter Store for configuration",
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                ],
                "Resource": f"arn:aws:ssm:{config.aws_region}:*:parameter/{name}/*"
            }]
        }),
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create custom policy for DLQ access (addresses model failure: DLQ permissions missing)
    dlq_access_policy = aws.iam.Policy(
        f"{name}-dlq-access",
        name=f"{name}-dlq-access",
        description="Allow Lambda to send messages to Dead Letter Queue",
        policy=pulumi.Output.all(dlq_arn).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage"
                    ],
                    "Resource": args[0]
                }]
            })
        ),
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Attach all custom policies
    aws.iam.RolePolicyAttachment(
        f"{name}-s3-policy-attachment",
        role=lambda_role.name,
        policy_arn=s3_access_policy.arn,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    aws.iam.RolePolicyAttachment(
        f"{name}-ssm-policy-attachment",
        role=lambda_role.name,
        policy_arn=ssm_access_policy.arn,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    aws.iam.RolePolicyAttachment(
        f"{name}-dlq-policy-attachment",
        role=lambda_role.name,
        policy_arn=dlq_access_policy.arn,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    return lambda_role


def create_api_gateway_role(name: str):
    """
    Create IAM role for API Gateway to invoke Lambda.
    """
    
    api_gateway_role = aws.iam.Role(
        f"{name}-apigw-role",
        name=f"{name}-apigw-role",
        assume_role_policy=pulumi.Output.from_input({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "apigateway.amazonaws.com"
                }
            }]
        }).apply(lambda x: json.dumps(x)),
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Attach policy for API Gateway to invoke Lambda
    api_gateway_policy = aws.iam.Policy(
        f"{name}-apigw-policy",
        name=f"{name}-apigw-policy",
        description="Allow API Gateway to invoke Lambda function",
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "lambda:InvokeFunction"
                ],
                "Resource": f"arn:aws:lambda:{config.aws_region}:*:function:{name}*"
            }]
        }),
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    aws.iam.RolePolicyAttachment(
        f"{name}-apigw-policy-attachment",
        role=api_gateway_role.name,
        policy_arn=api_gateway_policy.arn,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    return api_gateway_role
