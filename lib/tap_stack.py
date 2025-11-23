from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, LocalBackend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_vpc import DataAwsVpc
from cdktf_cdktf_provider_aws.data_aws_subnets import DataAwsSubnets
from cdktf_cdktf_provider_aws.eks_cluster import (
    EksCluster,
    EksClusterVpcConfig,
    EksClusterEncryptionConfig,
    EksClusterEncryptionConfigProvider
)
from cdktf_cdktf_provider_aws.eks_node_group import EksNodeGroup, EksNodeGroupScalingConfig, EksNodeGroupRemoteAccess
from cdktf_cdktf_provider_aws.eks_addon import EksAddon
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_openid_connect_provider import IamOpenidConnectProvider
import json


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, stack_id: str, environment_suffix: str):
        super().__init__(scope, stack_id)

        # CRITICAL: Use LocalBackend instead of S3Backend
        LocalBackend(self, path="terraform.tfstate")

        # AWS Provider
        AwsProvider(self, "AWS", region="us-east-1")

        # Common tags
        common_tags = {
            "Environment": "Production",
            "ManagedBy": "CDKTF"
        }

        # Get default VPC and private subnets
        vpc = DataAwsVpc(self, "vpc",
            default=True
        )

        # Get subnets for the VPC
        private_subnets = DataAwsSubnets(self, "private_subnets",
            filter=[{
                "name": "vpc-id",
                "values": [vpc.id]
            }]
        )

        # CloudWatch Log Group for EKS cluster logs
        log_group = CloudwatchLogGroup(self, "eks_log_group",
            name=f"/aws/eks/eks-cluster-{environment_suffix}",
            retention_in_days=30,
            tags=common_tags
        )

        # IAM Role for EKS Cluster
        cluster_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "eks.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        })

        cluster_role = IamRole(self, "eks_cluster_role",
            name=f"eks-cluster-role-{environment_suffix}",
            assume_role_policy=cluster_assume_role_policy,
            tags=common_tags
        )

        # Attach required policies to cluster role
        IamRolePolicyAttachment(self, "eks_cluster_policy",
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
            role=cluster_role.name
        )

        IamRolePolicyAttachment(self, "eks_vpc_resource_controller",
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSVPCResourceController",
            role=cluster_role.name
        )

        # EKS Cluster
        eks_cluster = EksCluster(self, "eks_cluster",
            name=f"eks-cluster-{environment_suffix}",
            role_arn=cluster_role.arn,
            version="1.28",
            vpc_config=EksClusterVpcConfig(
                subnet_ids=private_subnets.ids,
                endpoint_private_access=True,
                endpoint_public_access=True
            ),
            enabled_cluster_log_types=["api", "audit", "authenticator", "controllerManager", "scheduler"],
            tags=common_tags,
            depends_on=[log_group]
        )

        # OIDC Provider for IRSA
        # Note: CDKTF Python has limitations accessing nested list values from tokens
        # The thumbprint_list requires a static value
        # Using string interpolation to access the OIDC issuer URL
        oidc_provider = IamOpenidConnectProvider(self, "eks_oidc_provider",
            url=f"${{{{aws_eks_cluster.eks_cluster.identity[0].oidc[0].issuer}}}}",
            client_id_list=["sts.amazonaws.com"],
            thumbprint_list=["9e99a48a9960b14926bb7f3b02e22da2b0ab7280"],  # AWS EKS standard thumbprint
            tags=common_tags
        )

        # IAM Role for Node Groups
        node_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "ec2.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        })

        node_role = IamRole(self, "eks_node_role",
            name=f"eks-node-role-{environment_suffix}",
            assume_role_policy=node_assume_role_policy,
            tags=common_tags
        )

        # Attach required policies to node role
        IamRolePolicyAttachment(self, "eks_worker_node_policy",
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
            role=node_role.name
        )

        IamRolePolicyAttachment(self, "eks_cni_policy",
            policy_arn="arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
            role=node_role.name
        )

        IamRolePolicyAttachment(self, "eks_container_registry_policy",
            policy_arn="arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
            role=node_role.name
        )

        # On-Demand Node Group
        on_demand_node_group = EksNodeGroup(self, "on_demand_node_group",
            cluster_name=eks_cluster.name,
            node_group_name=f"node-group-od-{environment_suffix}",
            node_role_arn=node_role.arn,
            subnet_ids=private_subnets.ids,
            capacity_type="ON_DEMAND",
            instance_types=["t3.medium"],
            scaling_config=EksNodeGroupScalingConfig(
                desired_size=2,
                min_size=2,
                max_size=5
            ),
            tags=common_tags,
            depends_on=[eks_cluster]
        )

        # Spot Node Group
        spot_node_group = EksNodeGroup(self, "spot_node_group",
            cluster_name=eks_cluster.name,
            node_group_name=f"node-group-spot-{environment_suffix}",
            node_role_arn=node_role.arn,
            subnet_ids=private_subnets.ids,
            capacity_type="SPOT",
            instance_types=["t3.medium"],
            scaling_config=EksNodeGroupScalingConfig(
                desired_size=3,
                min_size=3,
                max_size=10
            ),
            tags=common_tags,
            depends_on=[eks_cluster]
        )

        # VPC CNI Addon with prefix delegation
        vpc_cni_addon = EksAddon(self, "vpc_cni_addon",
            cluster_name=eks_cluster.name,
            addon_name="vpc-cni",
            addon_version="v1.15.1-eksbuild.1",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="OVERWRITE",
            configuration_values=json.dumps({
                "env": {
                    "ENABLE_PREFIX_DELEGATION": "true",
                    "WARM_PREFIX_TARGET": "1"
                }
            }),
            tags=common_tags,
            depends_on=[on_demand_node_group, spot_node_group]
        )

        # Outputs
        TerraformOutput(self, "cluster_endpoint",
            value=eks_cluster.endpoint,
            description="EKS Cluster endpoint"
        )

        TerraformOutput(self, "cluster_name",
            value=eks_cluster.name,
            description="EKS Cluster name"
        )

        TerraformOutput(self, "oidc_provider_arn",
            value=oidc_provider.arn,
            description="OIDC provider ARN for IRSA"
        )

        TerraformOutput(self, "oidc_issuer_url",
            value=f"${{{{aws_eks_cluster.eks_cluster.identity[0].oidc[0].issuer}}}}",
            description="OIDC issuer URL"
        )

        TerraformOutput(self, "kubectl_config_command",
            value=f"aws eks update-kubeconfig --region us-east-1 --name {eks_cluster.name}",
            description="Command to configure kubectl"
        )

        TerraformOutput(self, "on_demand_node_group_name",
            value=on_demand_node_group.node_group_name,
            description="On-Demand node group name"
        )

        TerraformOutput(self, "spot_node_group_name",
            value=spot_node_group.node_group_name,
            description="Spot node group name"
        )



# When run directly, synthesize the stack
if __name__ == "__main__":
    app = App()
    TapStack(app, "tap", environment_suffix="prod")
    app.synth()
