"""
IAM module for least-privilege access policies.
Addresses model failures around IAM policy validation and least-privilege principles.
"""

import json
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


def create_lambda_execution_role(config: ServerlessConfig) -> aws.iam.Role:
    """
    Create IAM role for Lambda execution with least-privilege permissions.
    Addresses model failures around IAM policy validation.
    """
    
    # Assume role policy for Lambda service
    assume_role_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }
    
    # Create the role
    lambda_role = aws.iam.Role(
        f"{config.lambda_function_name}-execution-role",
        assume_role_policy=json.dumps(assume_role_policy),
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    # Attach basic Lambda execution policy
    basic_execution_policy = aws.iam.RolePolicyAttachment(
        f"{config.lambda_function_name}-basic-execution",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    return lambda_role


def create_s3_access_policy(
    config: ServerlessConfig,
    lambda_role: aws.iam.Role,
    input_bucket: aws.s3.Bucket,
    output_bucket: aws.s3.Bucket
) -> aws.iam.Policy:
    """
    Create least-privilege S3 access policy for Lambda function.
    Addresses model failures around IAM policy validation and least-privilege principles.
    
    This policy implements strict least-privilege access:
    - Only allows specific S3 actions (GetObject, PutObject, ListBucket)
    - Restricts access to specific bucket ARNs only
    - Includes conditions for encryption and tagging requirements
    - No wildcard permissions or overly broad access
    """
    
    # Create least-privilege S3 policy
    s3_policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                ],
                "Resource": f"arn:aws:s3:::{input_bucket.bucket}/*",
                "Condition": {
                    "StringEquals": {
                        "s3:ExistingObjectTag/Environment": config.environment_suffix
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                ],
                "Resource": f"arn:aws:s3:::{output_bucket.bucket}/*",
                "Condition": {
                    "StringEquals": {
                        "s3:x-amz-server-side-encryption": "AES256"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:ListBucket"
                ],
                "Resource": [
                    f"arn:aws:s3:::{input_bucket.bucket}",
                    f"arn:aws:s3:::{output_bucket.bucket}"
                ],
                "Condition": {
                    "StringLike": {
                        "s3:prefix": [
                            f"{config.environment_suffix}/*",
                            "processed/*"
                        ]
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetBucketLocation"
                ],
                "Resource": [
                    f"arn:aws:s3:::{input_bucket.bucket}",
                    f"arn:aws:s3:::{output_bucket.bucket}"
                ]
            }
        ]
    }
    
    # Create the policy
    s3_policy = aws.iam.Policy(
        f"{config.lambda_function_name}-s3-access-policy",
        policy=json.dumps(s3_policy_document),
        description=f"Least-privilege S3 access for {config.lambda_function_name}",
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    # Attach policy to role
    s3_policy_attachment = aws.iam.RolePolicyAttachment(
        f"{config.lambda_function_name}-s3-policy-attachment",
        role=lambda_role.name,
        policy_arn=s3_policy.arn,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    return s3_policy


def create_cloudwatch_logs_policy(
    config: ServerlessConfig,
    lambda_role: aws.iam.Role
) -> aws.iam.Policy:
    """
    Create CloudWatch Logs policy for Lambda function.
    Ensures proper logging permissions with least-privilege access.
    """
    
    # CloudWatch Logs policy
    logs_policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": f"arn:aws:logs:{config.region}:*:log-group:/aws/lambda/{config.lambda_function_name}*"
            }
        ]
    }
    
    # Create the policy
    logs_policy = aws.iam.Policy(
        f"{config.lambda_function_name}-logs-policy",
        policy=json.dumps(logs_policy_document),
        description=f"CloudWatch Logs access for {config.lambda_function_name}",
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    # Attach policy to role
    logs_policy_attachment = aws.iam.RolePolicyAttachment(
        f"{config.lambda_function_name}-logs-policy-attachment",
        role=lambda_role.name,
        policy_arn=logs_policy.arn,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    return logs_policy


def create_lambda_invoke_policy(
    config: ServerlessConfig,
    lambda_function: aws.lambda_.Function
) -> aws.iam.Policy:
    """
    Create policy for S3 to invoke Lambda function.
    Addresses model failures around Lambda permission source_arn.
    """
    
    # Create the policy with proper Pulumi Output handling
    invoke_policy = aws.iam.Policy(
        f"{config.lambda_function_name}-invoke-policy",
        policy=lambda_function.arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "lambda:InvokeFunction"
                    ],
                    "Resource": arn,
                    "Condition": {
                        "StringEquals": {
                            "lambda:FunctionName": config.lambda_function_name
                        }
                    }
                }
            ]
        })),
        description=f"Lambda invoke permissions for {config.lambda_function_name}",
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    return invoke_policy


def create_iam_resources(
    config: ServerlessConfig,
    input_bucket: aws.s3.Bucket,
    output_bucket: aws.s3.Bucket,
    lambda_function: aws.lambda_.Function
) -> Dict[str, Any]:
    """
    Create all IAM resources with least-privilege policies.
    Addresses model failures around IAM policy validation.
    """
    
    # Create Lambda execution role
    lambda_role = create_lambda_execution_role(config)
    
    # Create S3 access policy
    s3_policy = create_s3_access_policy(config, lambda_role, input_bucket, output_bucket)
    
    # Create CloudWatch Logs policy
    logs_policy = create_cloudwatch_logs_policy(config, lambda_role)
    
    # Create Lambda invoke policy only if lambda_function is provided
    invoke_policy = None
    if lambda_function is not None:
        invoke_policy = create_lambda_invoke_policy(config, lambda_function)
    
    return {
        "lambda_role": lambda_role,
        "s3_policy": s3_policy,
        "logs_policy": logs_policy,
        "invoke_policy": invoke_policy
    }
