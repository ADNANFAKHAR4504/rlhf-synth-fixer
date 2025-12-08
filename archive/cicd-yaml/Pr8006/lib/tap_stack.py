from aws_cdk import Stack
from constructs import Construct
from lib.cicd_pipeline_construct import CicdPipelineConstruct


class TapStack(Stack):
    """
    Main stack that instantiates the CI/CD pipeline construct.

    This stack demonstrates how to use the reusable CicdPipelineConstruct
    to provision a complete CI/CD pipeline for an ECS Fargate application.
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from context
        environment_suffix = self.node.try_get_context("environment_suffix") or "dev"

        # Get application configuration from context
        app_name = self.node.try_get_context("app_name") or "myapp"
        github_owner = self.node.try_get_context("github_owner") or "myorg"
        github_repo = self.node.try_get_context("github_repo") or "myrepo"
        github_branch = self.node.try_get_context("github_branch") or "main"
        github_token_secret = self.node.try_get_context("github_token_secret") or "github_token"

        # ECS configuration
        ecs_cluster_name = self.node.try_get_context("ecs_cluster_name") or f"{app_name}-cluster"
        ecs_service_name = self.node.try_get_context("ecs_service_name") or f"{app_name}-service"

        # Cross-account configuration
        staging_account_id = self.node.try_get_context("staging_account_id") or self.account
        prod_account_id = self.node.try_get_context("prod_account_id") or self.account

        # Notification emails
        notification_emails_str = self.node.try_get_context("notification_emails") or "devops@example.com"
        notification_emails = [email.strip() for email in notification_emails_str.split(",")]

        # Create the CI/CD pipeline construct
        cicd_pipeline = CicdPipelineConstruct(
            self,
            f"CicdPipeline-{environment_suffix}",
            environment_suffix=environment_suffix,
            app_name=app_name,
            github_owner=github_owner,
            github_repo=github_repo,
            github_branch=github_branch,
            github_token_secret_name=github_token_secret,
            ecs_cluster_name=ecs_cluster_name,
            ecs_service_name=ecs_service_name,
            staging_account_id=staging_account_id,
            prod_account_id=prod_account_id,
            notification_emails=notification_emails,
        )
