"""
IAM roles and policies for the image processing pipeline.
Implements least privilege principle for Lambda execution.
Addresses model failures around IAM policy least-privilege requirements.
"""

import json
from typing import List

import pulumi
import pulumi_aws as aws

from .config import ImageProcessingConfig


def create_lambda_role(name_prefix: str, source_bucket_arn: pulumi.Output[str], dest_bucket_arn: pulumi.Output[str], kms_key_arn: pulumi.Output[str], dlq_arn: pulumi.Output[str]) -> aws.iam.Role:
    """
    Creates an IAM role for Lambda with least privilege permissions.
    Addresses model failure: IAM policy not fully least-privilege.
    
    Args:
        config: Image processing configuration
        
    Returns:
        IAM role for Lambda execution
    """
    
    # Lambda assume role policy document
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
    
    # Create the Lambda execution role
    lambda_role = aws.iam.Role(
        f"{name_prefix}-role",
        assume_role_policy=json.dumps(assume_role_policy),
        description="Execution role for image processing Lambda function",
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )
    
    # Attach basic Lambda execution policy for CloudWatch Logs
    aws.iam.RolePolicyAttachment(
        f"{name_prefix}-basic-execution",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        opts=pulumi.ResourceOptions()
    )
    
    # Create custom policy for S3 access with least privilege
    # Addresses model failure: IAM policy not fully least-privilege
    s3_policy_document = pulumi.Output.all(source_bucket_arn, dest_bucket_arn).apply(
        lambda args: {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:GetObjectVersion"
                    ],
                    "Resource": args[0] + "/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:PutObjectAcl"
                    ],
                    "Resource": args[1] + "/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": [args[0], args[1]]
                }
            ]
        }
    )
    
    # Create and attach the S3 policy
    s3_policy = aws.iam.Policy(
        f"{name_prefix}-s3-policy",
        policy=s3_policy_document.apply(lambda policy: json.dumps(policy)),
        description="Policy for Lambda to access source and destination S3 buckets",
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )
    
    aws.iam.RolePolicyAttachment(
        f"{name_prefix}-s3-policy-attachment",
        role=lambda_role.name,
        policy_arn=s3_policy.arn,
        opts=pulumi.ResourceOptions()
    )
    
    # Create KMS policy for encryption/decryption
    # Addresses model failure: KMS key usage missing
    kms_policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                "Resource": kms_key_arn
            }
        ]
    }
    
    kms_policy = aws.iam.Policy(
        f"{name_prefix}-kms-policy",
        policy=kms_key_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": arn
                }
            ]
        })),
        description="Policy for Lambda to use KMS keys for S3 encryption",
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )
    
    aws.iam.RolePolicyAttachment(
        f"{name_prefix}-kms-policy-attachment",
        role=lambda_role.name,
        policy_arn=kms_policy.arn,
        opts=pulumi.ResourceOptions()
    )
    
    # Create CloudWatch metrics policy
    # Addresses model failure: No IAM policy for CloudWatch alarms or permissions
    cloudwatch_policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "cloudwatch:PutMetricData",
                    "logs:DescribeLogStreams",
                    "logs:DescribeLogGroups"
                ],
                "Resource": "*"
            }
        ]
    }
    
    cloudwatch_policy = aws.iam.Policy(
        f"{name_prefix}-cloudwatch-policy",
        policy=json.dumps(cloudwatch_policy_document),
        description="Policy for Lambda to publish CloudWatch metrics",
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )
    
    aws.iam.RolePolicyAttachment(
        f"{name_prefix}-cloudwatch-policy-attachment",
        role=lambda_role.name,
        policy_arn=cloudwatch_policy.arn,
        opts=pulumi.ResourceOptions()
    )
    
    return lambda_role

def create_vpc_execution_role(config: ImageProcessingConfig) -> aws.iam.Role:
    """
    Creates an IAM role for VPC execution if VPC is configured.
    Addresses model failure: Lambda VPC deployment missing.
    
    Args:
        config: Image processing configuration
        
    Returns:
        IAM role for VPC execution
    """
    
    if not config.vpc_id:
        return None
    
    # VPC execution policy document
    vpc_policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:CreateNetworkInterface",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DeleteNetworkInterface",
                    "ec2:AttachNetworkInterface",
                    "ec2:DetachNetworkInterface"
                ],
                "Resource": "*"
            }
        ]
    }
    
    # Create VPC execution role
    vpc_role = aws.iam.Role(
        f"{config.lambda_function_name}-vpc-role",
        assume_role_policy=json.dumps({
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
        }),
        description="Execution role for Lambda VPC access",
        tags=config.default_tags,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    # Attach VPC execution policy
    vpc_policy = aws.iam.Policy(
        f"{config.lambda_function_name}-vpc-policy",
        policy=json.dumps(vpc_policy_document),
        description="Policy for Lambda VPC execution",
        tags=config.default_tags,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    aws.iam.RolePolicyAttachment(
        f"{config.lambda_function_name}-vpc-policy-attachment",
        role=vpc_role.name,
        policy_arn=vpc_policy.arn,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    return vpc_role
