from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
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
    def __init__(self, scope: Construct, stack_id: str, environment_suffix: str,
                 state_bucket: str = None, state_bucket_region: str = None,
                 aws_region: str = "us-east-1", default_tags: dict = None):
        super().__init__(scope, stack_id)

        # Use S3Backend for remote state storage
        S3Backend(self,
            bucket=state_bucket,
            key=f"{stack_id}/{environment_suffix}/terraform.tfstate",
            region=state_bucket_region,
            encrypt=True
        )

        # Extract tags from default_tags if provided
        tags = default_tags.get("tags", {}) if default_tags else {}

        # AWS Provider with default tags
        AwsProvider(self, "AWS", region=aws_region, default_tags=[{"tags": tags}] if tags else None)

        # Common tags
        common_tags = {
            "Environment": "Production",
            "ManagedBy": "CDKTF"
        }

        # Get available availability zones
        azs = DataAwsAvailabilityZones(self, "available_azs",
            state="available"
        )

        # Create VPC
        vpc = Vpc(self, "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"eks-vpc-v1-{environment_suffix}"}
        )

        # Create Internet Gateway
        igw = InternetGateway(self, "igw",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"eks-igw-v1-{environment_suffix}"}
        )

        # Create public subnets in multiple AZs
        public_subnet_1 = Subnet(self, "public_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"${{data.aws_availability_zones.{azs.friendly_unique_id}.names[0]}}",
            map_public_ip_on_launch=True,
            tags={**common_tags, "Name": f"eks-public-subnet-1-v1-{environment_suffix}", "kubernetes.io/role/elb": "1"}
        )

        public_subnet_2 = Subnet(self, "public_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"${{data.aws_availability_zones.{azs.friendly_unique_id}.names[1]}}",
            map_public_ip_on_launch=True,
            tags={**common_tags, "Name": f"eks-public-subnet-2-v1-{environment_suffix}", "kubernetes.io/role/elb": "1"}
        )

        # Create route table for public subnets
        public_route_table = RouteTable(self, "public_route_table",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"eks-public-rt-v1-{environment_suffix}"}
        )

        # Create route to internet gateway
        Route(self, "public_route",
            route_table_id=public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )

        # Associate public subnets with public route table
        RouteTableAssociation(self, "public_subnet_1_association",
            subnet_id=public_subnet_1.id,
            route_table_id=public_route_table.id
        )

        RouteTableAssociation(self, "public_subnet_2_association",
            subnet_id=public_subnet_2.id,
            route_table_id=public_route_table.id
        )

        # Use public subnets for EKS (simplified for testing)
        subnet_ids = [public_subnet_1.id, public_subnet_2.id]

        # CloudWatch Log Group for EKS cluster logs
        log_group = CloudwatchLogGroup(self, "eks_log_group",
            name=f"/aws/eks/eks-cluster-v1-{environment_suffix}",
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
            name=f"eks-cluster-role-v1-{environment_suffix}",
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
            name=f"eks-cluster-v1-{environment_suffix}",
            role_arn=cluster_role.arn,
            version="1.29",
            vpc_config=EksClusterVpcConfig(
                subnet_ids=subnet_ids,
                endpoint_private_access=True,
                endpoint_public_access=True
            ),
            enabled_cluster_log_types=["api", "audit", "authenticator", "controllerManager", "scheduler"],
            tags=common_tags,
            depends_on=[log_group]
        )

        # OIDC Provider for IRSA
        # Using Terraform token system to access the OIDC issuer URL
        # eks_cluster.identity returns a list, we need to access the first element's oidc issuer
        # The correct way to access the OIDC issuer URL is through the identity attribute
        oidc_issuer_url = f"${{aws_eks_cluster.{eks_cluster.friendly_unique_id}.identity[0].oidc[0].issuer}}"

        oidc_provider = IamOpenidConnectProvider(self, "eks_oidc_provider",
            url=oidc_issuer_url,
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
            name=f"eks-node-role-v1-{environment_suffix}",
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
            node_group_name=f"node-group-od-v1-{environment_suffix}",
            node_role_arn=node_role.arn,
            subnet_ids=subnet_ids,
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
            node_group_name=f"node-group-spot-v1-{environment_suffix}",
            node_role_arn=node_role.arn,
            subnet_ids=subnet_ids,
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
        # Using latest compatible version for EKS 1.29
        vpc_cni_addon = EksAddon(self, "vpc_cni_addon",
            cluster_name=eks_cluster.name,
            addon_name="vpc-cni",
            addon_version="v1.18.1-eksbuild.3",
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
            value=oidc_issuer_url,
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
