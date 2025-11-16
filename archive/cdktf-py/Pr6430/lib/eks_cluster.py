from constructs import Construct
from cdktf_cdktf_provider_aws.eks_cluster import EksCluster as AwsEksCluster
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup


class EksCluster(Construct):
    def __init__(self, scope: Construct, id: str, *,  # pylint: disable=redefined-builtin,too-many-positional-arguments
                 environment_suffix: str,
                 cluster_role_arn: str, security_group_ids: list,
                 subnet_ids: list, encryption_key_arn: str):
        super().__init__(scope, id)

        # CloudWatch Log Group for EKS logs
        log_group = CloudwatchLogGroup(self, "eks_log_group",
            name=f"/aws/eks/{environment_suffix}/cluster",
            retention_in_days=7,
            tags={
                "Name": f"eks-logs-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # EKS Cluster
        self.cluster = AwsEksCluster(self, "eks_cluster",
            name=f"eks-cluster-{environment_suffix}",
            role_arn=cluster_role_arn,
            version="1.29",
            vpc_config={
                "subnet_ids": subnet_ids,
                "security_group_ids": security_group_ids,
                "endpoint_private_access": True,
                "endpoint_public_access": False
            },
            encryption_config={
                "provider": {
                    "key_arn": encryption_key_arn
                },
                "resources": ["secrets"]
            },
            enabled_cluster_log_types=["api", "authenticator"],
            tags={
                "Name": f"eks-cluster-{environment_suffix}",
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            },
            depends_on=[log_group]
        )

    @property
    def cluster_name(self) -> str:
        return self.cluster.name

    @property
    def cluster_endpoint(self) -> str:
        return self.cluster.endpoint

    @property
    def cluster_oidc_issuer_url(self) -> str:
        return self.cluster.identity.get(0).oidc.get(0).issuer

    @property
    def cluster_id(self) -> str:
        return self.cluster.id
