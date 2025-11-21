"""
IAM module for roles and policies
"""

from typing import Dict, Any
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


def create_iam_roles(
    environment: str,
    environment_suffix: str,
    iam_mode: str = "read-only",
    tags: Dict[str, str] = None,
    opts: ResourceOptions = None,
) -> Dict[str, Any]:
    """
    Create IAM roles for ECS tasks with environment-appropriate permissions.
    
    Args:
        iam_mode: 'read-only' (dev), 'limited-write' (staging), 'full-access' (prod)
    """
    
    tags = tags or {}
    
    # ECS Task Execution Role (for pulling images, logging)
    execution_role = aws.iam.Role(
        f"{environment}-ecs-execution-role-{environment_suffix}",
        name=f"{environment}-ecs-execution-role-{environment_suffix}",
        assume_role_policy=json.dumps(
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                        "Action": "sts:AssumeRole",
                    }
                ],
            }
        ),
        tags={**tags, "Name": f"{environment}-ecs-execution-role-{environment_suffix}"},
        opts=opts,
    )
    
    # Attach AWS managed policy for ECS task execution
    execution_policy_attachment = aws.iam.RolePolicyAttachment(
        f"{environment}-ecs-execution-policy-{environment_suffix}",
        role=execution_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
        opts=ResourceOptions(parent=execution_role),
    )
    
    # ECS Task Role (for application permissions)
    task_role = aws.iam.Role(
        f"{environment}-ecs-task-role-{environment_suffix}",
        name=f"{environment}-ecs-task-role-{environment_suffix}",
        assume_role_policy=json.dumps(
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                        "Action": "sts:AssumeRole",
                    }
                ],
            }
        ),
        tags={**tags, "Name": f"{environment}-ecs-task-role-{environment_suffix}"},
        opts=opts,
    )
    
    # Create environment-specific policies
    if iam_mode == "read-only":
        # Dev environment: read-only access
        task_policy = aws.iam.RolePolicy(
            f"{environment}-ecs-task-policy-{environment_suffix}",
            role=task_role.id,
            policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:GetItem",
                                "dynamodb:Query",
                                "dynamodb:Scan",
                                "dynamodb:BatchGetItem",
                            ],
                            "Resource": "*",
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "rds:DescribeDBClusters",
                                "rds:DescribeDBInstances",
                            ],
                            "Resource": "*",
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "cloudwatch:PutMetricData",
                            ],
                            "Resource": "*",
                        },
                    ],
                }
            ),
            opts=ResourceOptions(parent=task_role),
        )
    
    elif iam_mode == "limited-write":
        # Staging environment: limited write access
        task_policy = aws.iam.RolePolicy(
            f"{environment}-ecs-task-policy-{environment_suffix}",
            role=task_role.id,
            policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:GetItem",
                                "dynamodb:Query",
                                "dynamodb:Scan",
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:BatchGetItem",
                                "dynamodb:BatchWriteItem",
                            ],
                            "Resource": "*",
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "rds:DescribeDBClusters",
                                "rds:DescribeDBInstances",
                            ],
                            "Resource": "*",
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "cloudwatch:PutMetricData",
                            ],
                            "Resource": "*",
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                            ],
                            "Resource": "*",
                        },
                    ],
                }
            ),
            opts=ResourceOptions(parent=task_role),
        )
    
    else:  # full-access for prod
        # Production environment: full access with audit logging
        task_policy = aws.iam.RolePolicy(
            f"{environment}-ecs-task-policy-{environment_suffix}",
            role=task_role.id,
            policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:*",
                            ],
                            "Resource": "*",
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "rds:*",
                            ],
                            "Resource": "*",
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "cloudwatch:PutMetricData",
                            ],
                            "Resource": "*",
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:*",
                            ],
                            "Resource": "*",
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "sns:Publish",
                            ],
                            "Resource": "*",
                        },
                    ],
                }
            ),
            opts=ResourceOptions(parent=task_role),
        )
    
    return {
        "ecs_task_role_arn": task_role.arn,
        "ecs_task_role_name": task_role.name,
        "ecs_execution_role_arn": execution_role.arn,
        "ecs_execution_role_name": execution_role.name,
    }
