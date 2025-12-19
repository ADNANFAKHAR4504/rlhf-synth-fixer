"""
IAM Stack - Roles and Policies for ECS Tasks
"""

import json
from typing import Dict

import pulumi
import pulumi_aws as aws


class IamStackArgs:
    """Arguments for IamStack"""

    def __init__(
        self,
        environment_suffix: str,
        db_cluster_arn: pulumi.Input[str],
        kms_key_arn: pulumi.Input[str],
        tags: Dict[str, str] = None
    ):
        self.environment_suffix = environment_suffix
        self.db_cluster_arn = db_cluster_arn
        self.kms_key_arn = kms_key_arn
        self.tags = tags or {}


class IamStack(pulumi.ComponentResource):
    """
    IAM roles and policies with least-privilege access.
    """

    def __init__(
        self,
        name: str,
        args: IamStackArgs,
        opts: pulumi.ResourceOptions = None
    ):
        super().__init__("custom:iam:IamStack", name, {}, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # ECS Task Execution Role (for Fargate to pull images and write logs)
        self.execution_role = aws.iam.Role(
            f"loan-ecs-execution-role-{self.environment_suffix}",
            name=f"loan-ecs-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"loan-ecs-execution-role-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        self.ecs_task_execution_role_arn = self.execution_role.arn

        # Attach AWS managed policy for ECS task execution
        aws.iam.RolePolicyAttachment(
            f"loan-execution-policy-{self.environment_suffix}",
            role=self.execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # ECS Task Role (for application to access AWS services)
        self.task_role = aws.iam.Role(
            f"loan-ecs-task-role-{self.environment_suffix}",
            name=f"loan-ecs-task-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"loan-ecs-task-role-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        self.ecs_task_role_arn = self.task_role.arn

        # Policy for RDS IAM authentication
        self.rds_policy = aws.iam.Policy(
            f"loan-rds-access-policy-{self.environment_suffix}",
            name=f"loan-rds-access-policy-{self.environment_suffix}",
            description="Allow ECS tasks to authenticate to RDS using IAM",
            policy=pulumi.Output.all(args.db_cluster_arn).apply(lambda vals: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds-db:connect"
                        ],
                        "Resource": vals[0]
                    }
                ]
            })),
            tags={**self.tags, "Name": f"loan-rds-access-policy-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"loan-task-rds-policy-{self.environment_suffix}",
            role=self.task_role.name,
            policy_arn=self.rds_policy.arn,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Policy for KMS decryption
        self.kms_policy = aws.iam.Policy(
            f"loan-kms-policy-{self.environment_suffix}",
            name=f"loan-kms-policy-{self.environment_suffix}",
            description="Allow ECS tasks to decrypt with KMS",
            policy=pulumi.Output.all(args.kms_key_arn).apply(lambda vals: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": vals[0]
                    }
                ]
            })),
            tags={**self.tags, "Name": f"loan-kms-policy-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"loan-task-kms-policy-{self.environment_suffix}",
            role=self.task_role.name,
            policy_arn=self.kms_policy.arn,
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.register_outputs({
            "execution_role_arn": self.execution_role.arn,
            "task_role_arn": self.task_role.arn
        })
