"""IAM roles and policies for ECS tasks."""

from constructs import Construct
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
import json


class IamRolesStack(Construct):
    """IAM roles for ECS task execution and task roles."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        environment_suffix: str,
        aws_region: str,
        log_group_arns: list,
    ):
        super().__init__(scope, construct_id)

        # Task Execution Role - for ECS to pull images and write logs
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        })

        self.task_execution_role = IamRole(
            self,
            "task_execution_role",
            name=f"ecs-task-execution-role-{environment_suffix}",
            assume_role_policy=assume_role_policy,
            tags={
                "Name": f"ecs-task-execution-role-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Task execution policy - ECR and CloudWatch permissions
        # Convert log group ARNs to include wildcard for log streams
        log_stream_arns = [f"{arn}:*" for arn in log_group_arns]

        execution_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "ecr:GetAuthorizationToken",
                        "ecr:BatchCheckLayerAvailability",
                        "ecr:GetDownloadUrlForLayer",
                        "ecr:BatchGetImage"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": log_stream_arns
                }
            ]
        })

        IamRolePolicy(
            self,
            "task_execution_policy",
            role=self.task_execution_role.id,
            policy=execution_policy,
        )

        # Task Role - for application code permissions
        self.task_role = IamRole(
            self,
            "task_role",
            name=f"ecs-task-role-{environment_suffix}",
            assume_role_policy=assume_role_policy,
            tags={
                "Name": f"ecs-task-role-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Task policy - minimal permissions for application
        task_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": log_stream_arns
                }
            ]
        })

        IamRolePolicy(
            self,
            "task_policy",
            role=self.task_role.id,
            policy=task_policy,
        )

    @property
    def task_execution_role_arn(self):
        return self.task_execution_role.arn

    @property
    def task_role_arn(self):
        return self.task_role.arn
