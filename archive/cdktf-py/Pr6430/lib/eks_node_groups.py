from constructs import Construct
from cdktf_cdktf_provider_aws.eks_node_group import EksNodeGroup


class EksNodeGroups(Construct):
    def __init__(self, scope: Construct, id: str, *,  # pylint: disable=redefined-builtin,too-many-positional-arguments
                 environment_suffix: str,
                 cluster_name: str, node_role_arn: str, subnet_ids: list):
        super().__init__(scope, id)

        # Critical Workloads Node Group (On-Demand t4g.large)
        self.critical_node_group = EksNodeGroup(self, "critical_node_group",
            cluster_name=cluster_name,
            node_group_name=f"critical-{environment_suffix}",
            node_role_arn=node_role_arn,
            subnet_ids=subnet_ids,
            scaling_config={
                "desired_size": 2,
                "min_size": 2,
                "max_size": 6
            },
            instance_types=["t4g.large"],
            capacity_type="ON_DEMAND",
            ami_type="AL2_ARM_64",
            disk_size=20,
            tags={
                "Name": f"eks-critical-ng-{environment_suffix}",
                "Environment": environment_suffix,
                "k8s.io/cluster-autoscaler/enabled": "true",
                f"k8s.io/cluster-autoscaler/eks-cluster-{environment_suffix}": "owned"
            }
        )

        # Non-Critical Workloads Node Group (Spot t4g.medium)
        self.non_critical_node_group = EksNodeGroup(self, "non_critical_node_group",
            cluster_name=cluster_name,
            node_group_name=f"non-critical-{environment_suffix}",
            node_role_arn=node_role_arn,
            subnet_ids=subnet_ids,
            scaling_config={
                "desired_size": 1,
                "min_size": 1,
                "max_size": 10
            },
            instance_types=["t4g.medium"],
            capacity_type="SPOT",
            ami_type="AL2_ARM_64",
            disk_size=20,
            tags={
                "Name": f"eks-non-critical-ng-{environment_suffix}",
                "Environment": environment_suffix,
                "k8s.io/cluster-autoscaler/enabled": "true",
                f"k8s.io/cluster-autoscaler/eks-cluster-{environment_suffix}": "owned"
            }
        )

    @property
    def critical_node_group_name(self) -> str:
        return self.critical_node_group.node_group_name

    @property
    def non_critical_node_group_name(self) -> str:
        return self.non_critical_node_group.node_group_name
