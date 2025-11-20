"""
EcrConstruct - ECR repositories for container images
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import aws_ecr as ecr


class EcrConstruct(Construct):
    """
    Creates ECR repositories with:
    - Vulnerability scanning on image push
    - Lifecycle policies to retain only last 10 images
    - Encryption at rest
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str
    ):
        super().__init__(scope, construct_id)

        self.repositories = {}
        service_names = ["payment", "order", "notification"]

        for service_name in service_names:
            repo = ecr.Repository(
                self,
                f"Repo{service_name.capitalize()}-{environment_suffix}",
                repository_name=f"{service_name}-service-{environment_suffix}",
                image_scan_on_push=True,
                encryption=ecr.RepositoryEncryption.AES_256,
                removal_policy=cdk.RemovalPolicy.DESTROY,
                auto_delete_images=True,  # Note: deprecated in favor of empty_on_delete in CDK v2.172+
                lifecycle_rules=[
                    ecr.LifecycleRule(
                        description="Keep only last 10 images",
                        max_image_count=10,
                        rule_priority=1
                    )
                ]
            )

            cdk.Tags.of(repo).add("Service", service_name)
            cdk.Tags.of(repo).add("Environment", environment_suffix)

            self.repositories[service_name] = repo
