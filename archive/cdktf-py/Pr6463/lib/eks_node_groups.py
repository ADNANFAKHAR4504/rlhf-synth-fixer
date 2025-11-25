from constructs import Construct
from cdktf_cdktf_provider_aws.eks_node_group import EksNodeGroup
from cdktf_cdktf_provider_aws.data_aws_ssm_parameter import DataAwsSsmParameter


class NodeGroupsConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 cluster_name: str, subnet_ids: list, node_role_arn: str):
        super().__init__(scope, id)

        # Get Bottlerocket AMI
        # Error: Hardcoded AMI parameter path might not exist
        bottlerocket_ami = DataAwsSsmParameter(self, "bottlerocket-ami",
            name="/aws/service/bottlerocket/aws-k8s-1.29/x86_64/latest/image_id"
        )

        # Critical Node Group - On-Demand
        self.critical_ng = EksNodeGroup(self, "critical-ng",
            cluster_name=cluster_name,
            node_group_name=f"critical-{environment_suffix}",
            node_role_arn=node_role_arn,
            subnet_ids=subnet_ids,
            scaling_config={
                "desired_size": 2,
                "max_size": 5,
                "min_size": 1
            },
            instance_types=["m5.large"],
            capacity_type="ON_DEMAND",
            labels={
                "workload-type": "critical",
                "node-group": "critical"
            },
            taint=[{
                "key": "workload",
                "value": "critical",
                "effect": "NO_SCHEDULE"
            }],
            tags={
                "Name": f"eks-critical-ng-{environment_suffix}",
                "node-group": "critical"
            }
        )

        # General Node Group - On-Demand (mixed with spot requires multiple instance types)
        self.general_ng = EksNodeGroup(self, "general-ng",
            cluster_name=cluster_name,
            node_group_name=f"general-{environment_suffix}",
            node_role_arn=node_role_arn,
            subnet_ids=subnet_ids,
            scaling_config={
                "desired_size": 3,
                "max_size": 10,
                "min_size": 2
            },
            instance_types=["t3.medium", "t3a.medium"],
            capacity_type="SPOT",  # Using SPOT for cost optimization as per requirement
            labels={
                "workload-type": "general",
                "node-group": "general"
            },
            tags={
                "Name": f"eks-general-ng-{environment_suffix}",
                "node-group": "general"
            }
        )

        # Batch Node Group - Spot Only
        self.batch_ng = EksNodeGroup(self, "batch-ng",
            cluster_name=cluster_name,
            node_group_name=f"batch-{environment_suffix}",
            node_role_arn=node_role_arn,
            subnet_ids=subnet_ids,
            scaling_config={
                "desired_size": 0,
                "max_size": 20,
                "min_size": 0
            },
            instance_types=["c5.large"],
            capacity_type="SPOT",
            labels={
                "workload-type": "batch",
                "node-group": "batch"
            },
            taint=[{
                "key": "workload",
                "value": "batch",
                "effect": "NO_SCHEDULE"
            }],
            tags={
                "Name": f"eks-batch-ng-{environment_suffix}",
                "node-group": "batch"
            }
        )
