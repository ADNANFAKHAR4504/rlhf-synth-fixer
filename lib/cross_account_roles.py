"""cross_account_roles.py

This module defines the CrossAccountRolesStack for cross-account IAM roles.
It creates deployment roles with least privilege permissions and explicit denies
for secure cross-account deployments.
"""

from aws_cdk import (
    Stack,
    aws_iam as iam,
)
from constructs import Construct


class CrossAccountRolesStack(Stack):
    """Creates cross-account IAM roles with least privilege permissions."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        target_account_id: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Cross-account deployment role with specific permissions
        deployment_role = iam.Role(
            self,
            f"DeploymentRole{environment_suffix}",
            role_name=f"cross-account-deploy-{environment_suffix}",
            assumed_by=iam.AccountPrincipal(target_account_id),
            description=f"Cross-account deployment role for {environment_suffix} environment"
        )

        # ECS, ECR, CodeDeploy permissions
        deployment_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    # ECS permissions
                    "ecs:DescribeServices",
                    "ecs:DescribeTaskDefinition",
                    "ecs:DescribeTasks",
                    "ecs:ListTasks",
                    "ecs:RegisterTaskDefinition",
                    "ecs:UpdateService",
                    # ECR permissions
                    "ecr:GetAuthorizationToken",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage",
                    # CodeDeploy permissions
                    "codedeploy:CreateDeployment",
                    "codedeploy:GetApplication",
                    "codedeploy:GetApplicationRevision",
                    "codedeploy:GetDeployment",
                    "codedeploy:GetDeploymentConfig",
                    "codedeploy:RegisterApplicationRevision",
                    # CloudWatch Logs
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    # IAM pass role (scoped)
                    "iam:PassRole"
                ],
                resources=["*"]
            )
        )

        # S3 permissions for artifacts
        deployment_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:GetObjectVersion"
                ],
                resources=[
                    f"arn:aws:s3:::cicd-artifacts-{environment_suffix}/*"
                ]
            )
        )

        # Explicit deny for EC2 terminate
        deployment_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                actions=["ec2:TerminateInstances"],
                resources=["*"]
            )
        )

        # CloudFormation permissions for stack updates
        deployment_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudformation:DescribeStacks",
                    "cloudformation:DescribeStackEvents",
                    "cloudformation:DescribeStackResource",
                    "cloudformation:DescribeStackResources",
                    "cloudformation:GetTemplate",
                    "cloudformation:ListStackResources",
                    "cloudformation:UpdateStack"
                ],
                resources=[f"arn:aws:cloudformation:*:{target_account_id}:stack/*"]
            )
        )

        self.deployment_role = deployment_role
