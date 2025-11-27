"""container_stack.py
ECR repositories for container images with vulnerability scanning.
"""

import aws_cdk as cdk
from constructs import Construct
from aws_cdk import aws_ecr as ecr, NestedStack, RemovalPolicy


class ContainerStackProps:
    """Properties for ContainerStack."""
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class ContainerStack(NestedStack):
    """Creates ECR repositories with vulnerability scanning."""

    def __init__(self, scope: Construct, construct_id: str, props: ContainerStackProps, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # Payment API repository
        self.payment_api_repo = ecr.Repository(
            self, f"PaymentAPIRepo{env_suffix}",
            repository_name=f"payment-api-{env_suffix}",
            image_scan_on_push=True,
            lifecycle_rules=[ecr.LifecycleRule(description="Keep last 10 images", max_image_count=10)],
            removal_policy=RemovalPolicy.DESTROY,
            empty_on_delete=True
        )

        # Transaction Processor repository
        self.transaction_processor_repo = ecr.Repository(
            self, f"TransactionProcessorRepo{env_suffix}",
            repository_name=f"transaction-processor-{env_suffix}",
            image_scan_on_push=True,
            lifecycle_rules=[ecr.LifecycleRule(description="Keep last 10 images", max_image_count=10)],
            removal_policy=RemovalPolicy.DESTROY,
            empty_on_delete=True
        )

        # Notification Service repository
        self.notification_service_repo = ecr.Repository(
            self, f"NotificationServiceRepo{env_suffix}",
            repository_name=f"notification-service-{env_suffix}",
            image_scan_on_push=True,
            lifecycle_rules=[ecr.LifecycleRule(description="Keep last 10 images", max_image_count=10)],
            removal_policy=RemovalPolicy.DESTROY,
            empty_on_delete=True
        )

        cdk.CfnOutput(self, f"PaymentAPIRepoURI{env_suffix}", value=self.payment_api_repo.repository_uri)
        cdk.CfnOutput(self, f"TransactionProcessorRepoURI{env_suffix}", value=self.transaction_processor_repo.repository_uri)
        cdk.CfnOutput(self, f"NotificationServiceRepoURI{env_suffix}", value=self.notification_service_repo.repository_uri)
