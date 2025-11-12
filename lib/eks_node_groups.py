from constructs import Construct
from cdktf_cdktf_provider_aws.eks_node_group import EksNodeGroup
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate
from cdktf_cdktf_provider_aws.data_aws_subnet import DataAwsSubnet
import json


class EksNodeGroups(Construct):
    def __init__(self, scope: Construct, id: str, *,  # pylint: disable=redefined-builtin,too-many-positional-arguments
                 environment_suffix: str,
                 cluster_name: str, node_role_arn: str, subnet_ids: list):
        super().__init__(scope, id)

        # Get subnet data sources
        private_subnets = []
        for idx, subnet_cidr in enumerate(["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]):
            subnet = DataAwsSubnet(self, f"node_subnet_{idx}",
                filter=[{
                    "name": "cidr-block",
                    "values": [subnet_cidr]
                }]
            )
            private_subnets.append(subnet.id)

        # Launch Template for Critical Node Group
        critical_lt = LaunchTemplate(self, "critical_launch_template",
            name=f"eks-critical-lt-{environment_suffix}",
            description="Launch template for critical workloads node group",
            metadata_options={
                "http_endpoint": "enabled",
                "http_tokens": "required",  # IMDSv2
                "http_put_response_hop_limit": 1
            },
            block_device_mappings=[{
                "device_name": "/dev/xvda",
                "ebs": {
                    "volume_size": 20,
                    "volume_type": "gp3",
                    "encrypted": True,
                    "delete_on_termination": True
                }
            }],
            monitoring={
                "enabled": True
            },
            tag_specifications=[{
                "resource_type": "instance",
                "tags": {
                    "Name": f"eks-critical-node-{environment_suffix}",
                    "Environment": environment_suffix,
                    "NodeGroup": "critical"
                }
            }],
            tags={
                "Name": f"eks-critical-lt-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Launch Template for Non-Critical Node Group
        non_critical_lt = LaunchTemplate(self, "non_critical_launch_template",
            name=f"eks-non-critical-lt-{environment_suffix}",
            description="Launch template for non-critical workloads node group",
            metadata_options={
                "http_endpoint": "enabled",
                "http_tokens": "required",  # IMDSv2
                "http_put_response_hop_limit": 1
            },
            block_device_mappings=[{
                "device_name": "/dev/xvda",
                "ebs": {
                    "volume_size": 20,
                    "volume_type": "gp3",
                    "encrypted": True,
                    "delete_on_termination": True
                }
            }],
            monitoring={
                "enabled": True
            },
            tag_specifications=[{
                "resource_type": "instance",
                "tags": {
                    "Name": f"eks-non-critical-node-{environment_suffix}",
                    "Environment": environment_suffix,
                    "NodeGroup": "non-critical"
                }
            }],
            tags={
                "Name": f"eks-non-critical-lt-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Critical Workloads Node Group (On-Demand t4g.large)
        self.critical_node_group = EksNodeGroup(self, "critical_node_group",
            cluster_name=cluster_name,
            node_group_name=f"critical-{environment_suffix}",
            node_role_arn=node_role_arn,
            subnet_ids=private_subnets,
            scaling_config={
                "desired_size": 2,
                "min_size": 2,
                "max_size": 6
            },
            instance_types=["t4g.large"],
            capacity_type="ON_DEMAND",
            ami_type="AL2_ARM_64",
            launch_template={
                "id": critical_lt.id,
                "version": "$Latest"
            },
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
            subnet_ids=private_subnets,
            scaling_config={
                "desired_size": 1,
                "min_size": 1,
                "max_size": 10
            },
            instance_types=["t4g.medium"],
            capacity_type="SPOT",
            ami_type="AL2_ARM_64",
            launch_template={
                "id": non_critical_lt.id,
                "version": "$Latest"
            },
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
