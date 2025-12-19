"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

import os
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from . import vpc, kms, iam, eks, kubernetes_resources


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None,
                 tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.

    Note:
        - DO NOT create resources directly here unless they are truly global.
        - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags
        region = os.getenv('AWS_REGION', 'ap-southeast-1')

        # Get AWS account ID
        account_id = aws.get_caller_identity().account_id

        # Create VPC with 3 private subnets
        vpc_resources = vpc.create_vpc(self.environment_suffix, region)

        # Extract subnet IDs from subnet resources
        private_subnet_ids = [subnet.id for subnet in vpc_resources['private_subnets']]

        # Create KMS key for envelope encryption
        kms_key = kms.create_kms_key(self.environment_suffix, account_id)

        # Create IAM roles
        cluster_role = iam.create_eks_cluster_role(self.environment_suffix)
        node_role = iam.create_eks_node_role(self.environment_suffix)

        # Create EKS cluster
        cluster = eks.create_eks_cluster(
            self.environment_suffix,
            cluster_role,
            private_subnet_ids,
            kms_key
        )

        # Create OIDC provider for IRSA
        oidc_provider, oidc_provider_arn, oidc_provider_url = eks.create_oidc_provider(
            cluster,
            self.environment_suffix
        )

        # Create node group
        node_group = eks.create_node_group(
            self.environment_suffix,
            cluster,
            node_role,
            private_subnet_ids,
            region
        )

        # Create Cluster Autoscaler IAM role
        autoscaler_role = iam.create_cluster_autoscaler_role(
            self.environment_suffix,
            oidc_provider_arn,
            oidc_provider_url,
            cluster.name
        )

        # Create ALB Controller IAM role
        alb_role = iam.create_alb_controller_role(
            self.environment_suffix,
            oidc_provider_arn,
            oidc_provider_url
        )

        # Create S3 bucket for tenant data
        tenant_bucket = aws.s3.Bucket(
            f"eks-tenant-data-{self.environment_suffix}",
            bucket=f"eks-tenant-data-{self.environment_suffix}",
            tags={
                "Name": f"eks-tenant-data-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Configure server-side encryption (separate resource to avoid deprecation warning)
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"tenant-bucket-sse-{self.environment_suffix}",
            bucket=tenant_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=\
                        aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="AES256"
                        )
                )
            ],
            opts=ResourceOptions(parent=tenant_bucket)
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"tenant-bucket-pab-{self.environment_suffix}",
            bucket=tenant_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=tenant_bucket)
        )

        # Create tenant IAM roles
        tenant_roles = {}
        for tenant in ["tenant-a", "tenant-b", "tenant-c"]:
            # Pass just the bucket name, tenant name will be appended in IAM policy
            tenant_roles[tenant] = iam.create_tenant_irsa_role(
                tenant,
                self.environment_suffix,
                oidc_provider_arn,
                oidc_provider_url,
                tenant_bucket.bucket
            )

        # Create Kubernetes provider and resources
        k8s_provider = kubernetes_resources.create_k8s_provider(
            cluster,
            node_group,
            self.environment_suffix
        )

        # Create tenant namespaces with NetworkPolicies and ServiceAccounts
        namespaces = {}
        for tenant in ["tenant-a", "tenant-b", "tenant-c"]:
            tenant_ns = kubernetes_resources.create_tenant_namespace(
                tenant,
                self.environment_suffix,
                k8s_provider
            )

            tenant_np = kubernetes_resources.create_network_policy(
                tenant,
                self.environment_suffix,
                tenant_ns,
                k8s_provider
            )

            tenant_sa = kubernetes_resources.create_service_account(
                tenant,
                self.environment_suffix,
                tenant_ns,
                tenant_roles[tenant],
                k8s_provider
            )

            namespaces[tenant] = {
                'namespace': tenant_ns,
                'network_policy': tenant_np,
                'service_account': tenant_sa
            }

        # Deploy Cluster Autoscaler
        autoscaler = kubernetes_resources.create_cluster_autoscaler(
            self.environment_suffix,
            cluster.name,
            autoscaler_role,
            k8s_provider,
            region
        )

        # Create ALB Controller ServiceAccount
        alb_sa = kubernetes_resources.create_alb_controller_sa(
            self.environment_suffix,
            alb_role,
            k8s_provider
        )

        # Export outputs
        self.cluster_endpoint = cluster.endpoint
        self.oidc_issuer_url = cluster.identities[0].oidcs[0].issuer
        self.cluster_name = cluster.name
        self.vpc_id = vpc_resources['vpc'].id
        self.tenant_bucket_name = tenant_bucket.bucket
        self.kubeconfig_command = pulumi.Output.all(
            cluster.name, region
        ).apply(
            lambda args: f"aws eks update-kubeconfig --name {args[0]} --region {args[1]}"
        )

        # Register outputs
        self.register_outputs({
            'cluster_endpoint': self.cluster_endpoint,
            'oidc_issuer_url': self.oidc_issuer_url,
            'cluster_name': self.cluster_name,
            'vpc_id': self.vpc_id,
            'tenant_bucket_name': self.tenant_bucket_name,
            'kubeconfig_command': self.kubeconfig_command
        })
