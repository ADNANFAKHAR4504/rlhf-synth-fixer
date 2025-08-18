"""
IAM module for creating roles with least privilege policies
"""

import pulumi_aws as aws
from typing import Dict


def create_iam_roles(tags: Dict) -> Dict:
  """Create IAM roles with least privilege policies"""

  # EC2 instance role
  ec2_role = aws.iam.Role(
    "ec2-instance-role",
    assume_role_policy="""{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
          }
        ]
      }""",
    tags=tags
  )

  # Attach minimal EC2 policies
  aws.iam.RolePolicyAttachment(
    "ec2-ssm-policy",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  )

  # Lambda execution role
  lambda_role = aws.iam.Role(
    "lambda-execution-role",
    assume_role_policy="""{
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
        }""",
    tags=tags
  )

  # Attach basic Lambda execution policy
  aws.iam.RolePolicyAttachment(
    "lambda-basic-execution",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  )

  # Create instance profile for EC2
  instance_profile = aws.iam.InstanceProfile(
    "ec2-instance-profile",
    role=ec2_role.name,
    tags=tags
  )

  return {
    "ec2_role": ec2_role,
    "lambda_role": lambda_role,
    "instance_profile": instance_profile
  }