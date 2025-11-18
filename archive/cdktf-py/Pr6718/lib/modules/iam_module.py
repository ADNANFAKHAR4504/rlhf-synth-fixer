"""
IAM Module - Creates IAM roles and policies for ECS tasks and services.
Implements least privilege principle with environment-specific naming.
"""

from constructs import Construct
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
import json


class IamModule(Construct):
    """
    IAM Module for ECS task and execution roles.
    Creates roles with environment-prefixed names following least privilege.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        workspace: str,
        version: str = "v2",
        **kwargs
    ):
        """
        Initialize IAM module.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Environment suffix for resource naming
            workspace: Workspace name (dev, staging, prod)
            version: Version suffix for resource naming (default: v2)
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.workspace = workspace
        self.version = version

        # ECS Task Execution Role (used by ECS agent)
        self.ecs_execution_role = IamRole(
            self,
            f"ecs-execution-role-{version}-{environment_suffix}",
            name=f"{workspace}-ecs-execution-role-{environment_suffix}-{version}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Name": f"{workspace}-ecs-execution-role-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Attach AWS managed policy for ECS task execution
        IamRolePolicyAttachment(
            self,
            f"ecs-execution-policy-attachment-{version}-{environment_suffix}",
            role=self.ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Additional policy for Secrets Manager access
        IamRolePolicy(
            self,
            f"ecs-execution-secrets-policy-{version}-{environment_suffix}",
            role=self.ecs_execution_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": [
                            f"arn:aws:secretsmanager:*:*:secret:{workspace}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # ECS Task Role (used by the container)
        self.ecs_task_role = IamRole(
            self,
            f"ecs-task-role-{version}-{environment_suffix}",
            name=f"{workspace}-ecs-task-role-{environment_suffix}-{version}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Name": f"{workspace}-ecs-task-role-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Task role policy (least privilege - add specific permissions as needed)
        IamRolePolicy(
            self,
            f"ecs-task-policy-{version}-{environment_suffix}",
            role=self.ecs_task_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::app-bucket-{environment_suffix}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": [
                            f"arn:aws:dynamodb:*:*:table/app-table-{environment_suffix}"
                        ]
                    }
                ]
            })
        )

    def get_execution_role_arn(self) -> str:
        """Return ECS execution role ARN."""
        return self.ecs_execution_role.arn

    def get_task_role_arn(self) -> str:
        """Return ECS task role ARN."""
        return self.ecs_task_role.arn
