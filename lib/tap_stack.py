"""Main TAP Stack orchestrating all EKS infrastructure."""

from cdktf import TerraformStack, TerraformOutput, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.vpc_stack import VpcConstruct
from lib.kms_encryption import KmsEncryptionConstruct
from lib.eks_cluster import EksClusterConstruct
from lib.irsa_roles import IrsaRolesConstruct
from lib.eks_node_groups import NodeGroupsConstruct
from lib.eks_addons import EksAddonsConstruct
from lib.monitoring import MonitoringConstruct
from lib.pod_security import PodSecurityConstruct
from lib.secrets_manager import SecretsManagerConstruct


class TapStack(TerraformStack):
    """CDKTF Python stack for production EKS infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with EKS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # VPC and Networking
        # Determine availability zones based on region
        if aws_region.startswith("us-east-1"):
            azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
        elif aws_region.startswith("us-east-2"):
            azs = ["us-east-2a", "us-east-2b", "us-east-2c"]
        elif aws_region.startswith("us-west-1"):
            azs = ["us-west-1a", "us-west-1b", "us-west-1c"]
        elif aws_region.startswith("us-west-2"):
            azs = ["us-west-2a", "us-west-2b", "us-west-2c"]
        else:
            # Default to appending a, b, c to the region
            azs = [f"{aws_region}a", f"{aws_region}b", f"{aws_region}c"]

        vpc = VpcConstruct(
            self,
            "vpc",
            environment_suffix=environment_suffix,
            cidr_block="10.0.0.0/16",
            availability_zones=azs,
            region=aws_region
        )

        # KMS Encryption Keys
        kms = KmsEncryptionConstruct(
            self,
            "kms",
            environment_suffix=environment_suffix,
            region=aws_region
        )

        # EKS Cluster
        eks_cluster = EksClusterConstruct(
            self,
            "eks-cluster",
            environment_suffix=environment_suffix,
            vpc_id=vpc.vpc_id,
            private_subnet_ids=vpc.private_subnet_ids,
            cluster_version="1.29",
            kms_key_arn=kms.cluster_key_arn,
            logs_kms_key_arn=kms.logs_key_arn
        )

        # IRSA Roles
        irsa = IrsaRolesConstruct(
            self,
            "irsa",
            environment_suffix=environment_suffix,
            oidc_provider_arn=eks_cluster.oidc_provider_arn,
            oidc_provider_url=eks_cluster.oidc_provider_url
        )

        # Node Groups
        node_groups = NodeGroupsConstruct(
            self,
            "node-groups",
            environment_suffix=environment_suffix,
            cluster_name=eks_cluster.cluster_name,
            subnet_ids=vpc.private_subnet_ids,
            node_role_arn=eks_cluster.node_role_arn
        )

        # EKS Managed Addons
        addons = EksAddonsConstruct(
            self,
            "addons",
            environment_suffix=environment_suffix,
            cluster_name=eks_cluster.cluster_name,
            ebs_csi_role_arn=irsa.ebs_csi_role_arn
        )

        # Monitoring
        monitoring = MonitoringConstruct(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            cluster_name=eks_cluster.cluster_name
        )

        # Pod Security Standards
        pod_security = PodSecurityConstruct(
            self,
            "pod-security",
            environment_suffix=environment_suffix
        )

        # Secrets Manager Integration
        secrets_manager = SecretsManagerConstruct(
            self,
            "secrets-manager",
            environment_suffix=environment_suffix,
            oidc_provider_arn=eks_cluster.oidc_provider_arn,
            oidc_provider_url=eks_cluster.oidc_provider_url,
            kms_key_arn=kms.cluster_key_arn
        )

        # Outputs
        TerraformOutput(
            self,
            "cluster_name",
            value=eks_cluster.cluster_name,
            description="EKS cluster name"
        )

        TerraformOutput(
            self,
            "cluster_endpoint",
            value=eks_cluster.endpoint,
            description="EKS cluster endpoint URL"
        )

        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.vpc_id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "cluster_oidc_provider_arn",
            value=eks_cluster.oidc_provider_arn,
            description="OIDC provider ARN"
        )

        TerraformOutput(
            self,
            "cluster_autoscaler_role_arn",
            value=irsa.autoscaler_role_arn,
            description="Cluster autoscaler IAM role ARN"
        )

        TerraformOutput(
            self,
            "alb_controller_role_arn",
            value=irsa.alb_controller_role_arn,
            description="ALB controller IAM role ARN"
        )

        TerraformOutput(
            self,
            "external_dns_role_arn",
            value=irsa.external_dns_role_arn,
            description="External DNS IAM role ARN"
        )

        TerraformOutput(
            self,
            "ebs_csi_role_arn",
            value=irsa.ebs_csi_role_arn,
            description="EBS CSI driver IAM role ARN"
        )

        TerraformOutput(
            self,
            "external_secrets_role_arn",
            value=secrets_manager.external_secrets_role_arn,
            description="External secrets IAM role ARN"
        )

        TerraformOutput(
            self,
            "region",
            value=aws_region,
            description="AWS region"
        )
