from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_kubernetes.provider import KubernetesProvider

from .vpc_stack import VpcConstruct
from .eks_cluster import EksClusterConstruct
from .eks_node_groups import NodeGroupsConstruct
from .kms_encryption import KmsEncryptionConstruct
from .irsa_roles import IrsaRolesConstruct
from .eks_addons import EksAddonsConstruct
from .monitoring import MonitoringConstruct
from .pod_security import PodSecurityConstruct
from .secrets_manager import SecretsManagerConstruct


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, ns: str, environment_suffix: str,
                 state_bucket: str = None, state_bucket_region: str = None,
                 aws_region: str = "us-east-2", default_tags: dict = None):
        super().__init__(scope, ns)

        self.environment_suffix = environment_suffix
        self.region = aws_region

        # Use provided default_tags or fallback to defaults
        if default_tags is None:
            default_tags = {
                "tags": {
                    "Environment": environment_suffix,
                    "ManagedBy": "CDKTF",
                    "Project": "EKS-MultiTenant"
                }
            }

        # AWS Provider
        AwsProvider(self, "aws",
            region=self.region,
            default_tags=[default_tags]
        )

        # VPC and Networking
        self.vpc = VpcConstruct(self, "vpc",
            environment_suffix=environment_suffix,
            cidr_block="10.0.0.0/16",
            availability_zones=["us-east-2a", "us-east-2b", "us-east-2c"],
            region=self.region
        )

        # KMS Encryption Keys
        self.kms = KmsEncryptionConstruct(self, "kms",
            environment_suffix=environment_suffix
        )

        # EKS Cluster
        self.eks_cluster = EksClusterConstruct(self, "eks-cluster",
            environment_suffix=environment_suffix,
            vpc_id=self.vpc.vpc_id,
            private_subnet_ids=self.vpc.private_subnet_ids,
            cluster_version="1.28",
            kms_key_arn=self.kms.cluster_key_arn
        )

        # Configure Kubernetes Provider
        KubernetesProvider(self, "kubernetes",
            host=self.eks_cluster.endpoint,
            cluster_ca_certificate=self.eks_cluster.ca_cert,
            token=self.eks_cluster.token,
            exec=[{
                "apiVersion": "client.authentication.k8s.io/v1beta1",
                "command": "aws",
                "args": ["eks", "get-token", "--cluster-name", self.eks_cluster.cluster_name]
            }]
        )

        # IRSA Roles
        self.irsa = IrsaRolesConstruct(self, "irsa",
            environment_suffix=environment_suffix,
            oidc_provider_arn=self.eks_cluster.oidc_provider_arn,
            oidc_provider_url=self.eks_cluster.oidc_provider_url
        )

        # Node Groups
        self.node_groups = NodeGroupsConstruct(self, "node-groups",
            environment_suffix=environment_suffix,
            cluster_name=self.eks_cluster.cluster_name,
            subnet_ids=self.vpc.private_subnet_ids,
            node_role_arn=self.eks_cluster.node_role_arn
        )

        # EKS Managed Addons
        self.addons = EksAddonsConstruct(self, "addons",
            environment_suffix=environment_suffix,
            cluster_name=self.eks_cluster.cluster_name,
            ebs_csi_role_arn=self.irsa.ebs_csi_role_arn
        )

        # Monitoring
        self.monitoring = MonitoringConstruct(self, "monitoring",
            environment_suffix=environment_suffix,
            cluster_name=self.eks_cluster.cluster_name
        )

        # Pod Security Standards
        self.pod_security = PodSecurityConstruct(self, "pod-security",
            environment_suffix=environment_suffix
        )

        # Secrets Manager Integration
        self.secrets_manager = SecretsManagerConstruct(self, "secrets-manager",
            environment_suffix=environment_suffix,
            oidc_provider_arn=self.eks_cluster.oidc_provider_arn,
            oidc_provider_url=self.eks_cluster.oidc_provider_url,
            kms_key_arn=self.kms.cluster_key_arn
        )

        # Outputs
        TerraformOutput(self, "cluster_name",
            value=self.eks_cluster.cluster_name,
            description="EKS cluster name"
        )

        TerraformOutput(self, "cluster_endpoint",
            value=self.eks_cluster.endpoint,
            description="EKS cluster endpoint URL"
        )

        TerraformOutput(self, "vpc_id",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )

        TerraformOutput(self, "cluster_oidc_provider_arn",
            value=self.eks_cluster.oidc_provider_arn,
            description="OIDC provider ARN"
        )

        TerraformOutput(self, "cluster_autoscaler_role_arn",
            value=self.irsa.autoscaler_role_arn,
            description="Cluster autoscaler IAM role ARN"
        )

        TerraformOutput(self, "alb_controller_role_arn",
            value=self.irsa.alb_controller_role_arn,
            description="ALB controller IAM role ARN"
        )

        TerraformOutput(self, "external_dns_role_arn",
            value=self.irsa.external_dns_role_arn,
            description="External DNS IAM role ARN"
        )

        TerraformOutput(self, "ebs_csi_role_arn",
            value=self.irsa.ebs_csi_role_arn,
            description="EBS CSI driver IAM role ARN"
        )

        TerraformOutput(self, "external_secrets_role_arn",
            value=self.secrets_manager.external_secrets_role_arn,
            description="External secrets IAM role ARN"
        )

        TerraformOutput(self, "cluster_security_group_id",
            value=self.eks_cluster.cluster_sg.id,
            description="EKS cluster security group ID"
        )

        TerraformOutput(self, "region",
            value=self.region,
            description="AWS region"
        )
