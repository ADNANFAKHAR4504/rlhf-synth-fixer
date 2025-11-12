from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.eks_cluster import EksCluster
from lib.eks_node_groups import EksNodeGroups
from lib.eks_addons import EksAddons
from lib.iam_roles import IamRoles
from lib.kms_encryption import KmsEncryption
from lib.security_groups import SecurityGroups
from lib.oidc_provider import OidcProvider


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, *, environment_suffix: str):  # pylint: disable=redefined-builtin
        super().__init__(scope, id)

        # AWS Provider
        AwsProvider(self, "aws",
            region="us-east-1"
        )

        self.environment_suffix = environment_suffix

        # KMS Key for EKS secrets encryption
        kms = KmsEncryption(self, "kms", environment_suffix=environment_suffix)

        # IAM Roles for EKS cluster and node groups
        iam = IamRoles(self, "iam", environment_suffix=environment_suffix)

        # Security Groups for EKS cluster
        security_groups = SecurityGroups(
            self, "security_groups",
            environment_suffix=environment_suffix,
            vpc_id="vpc-placeholder",  # Will use data source
            vpc_cidr="10.0.0.0/16"
        )

        # EKS Cluster
        eks_cluster = EksCluster(
            self, "eks_cluster",
            environment_suffix=environment_suffix,
            cluster_role_arn=iam.cluster_role_arn,
            security_group_ids=[security_groups.cluster_security_group_id],
            subnet_ids=["subnet-placeholder-1", "subnet-placeholder-2", "subnet-placeholder-3"],
            encryption_key_arn=kms.kms_key_arn
        )

        # OIDC Provider for IRSA
        oidc = OidcProvider(
            self, "oidc",
            environment_suffix=environment_suffix,
            cluster_oidc_issuer_url=eks_cluster.cluster_oidc_issuer_url
        )

        # EKS Node Groups
        node_groups = EksNodeGroups(
            self, "node_groups",
            environment_suffix=environment_suffix,
            cluster_name=eks_cluster.cluster_name,
            node_role_arn=iam.node_role_arn,
            subnet_ids=["subnet-placeholder-1", "subnet-placeholder-2", "subnet-placeholder-3"]
        )

        # EKS Add-ons
        addons = EksAddons(
            self, "addons",
            cluster_name=eks_cluster.cluster_name
        )

        # Outputs
        TerraformOutput(self, "cluster_endpoint",
            value=eks_cluster.cluster_endpoint,
            description="EKS cluster endpoint URL"
        )

        TerraformOutput(self, "cluster_name",
            value=eks_cluster.cluster_name,
            description="EKS cluster name"
        )

        TerraformOutput(self, "oidc_provider_arn",
            value=oidc.oidc_provider_arn,
            description="OIDC provider ARN for IRSA"
        )

        TerraformOutput(self, "oidc_issuer_url",
            value=eks_cluster.cluster_oidc_issuer_url,
            description="OIDC issuer URL"
        )

        TerraformOutput(self, "critical_node_group_name",
            value=node_groups.critical_node_group_name,
            description="Critical workloads node group name"
        )

        TerraformOutput(self, "non_critical_node_group_name",
            value=node_groups.non_critical_node_group_name,
            description="Non-critical workloads node group name"
        )

        TerraformOutput(self, "kubeconfig_command",
            value=f"aws eks update-kubeconfig --region us-east-1 --name {eks_cluster.cluster_name}",
            description="Command to update kubeconfig"
        )
