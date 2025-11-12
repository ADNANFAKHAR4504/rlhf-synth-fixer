"""TAP Stack module for CDKTF Python EKS Fargate infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupEgress
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_openid_connect_provider import IamOpenidConnectProvider
from cdktf_cdktf_provider_aws.eks_cluster import EksCluster, EksClusterVpcConfig
from cdktf_cdktf_provider_aws.eks_fargate_profile import EksFargateProfile, EksFargateProfileSelector
from cdktf_cdktf_provider_aws.eks_addon import EksAddon
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
import json

class TapStack(TerraformStack):
    """CDKTF Python stack for EKS Fargate infrastructure."""
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the EKS Fargate stack."""
        super().__init__(scope, construct_id)
        
        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'ap-southeast-1')
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
        
        # Get current AWS account ID
        current_account = DataAwsCallerIdentity(self, "current")
        
        # Configure S3 Backend
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )
        
        # Define availability zones
        azs = [f"{aws_region}a", f"{aws_region}b", f"{aws_region}c"]
        
        # Create VPC
        vpc = Vpc(
            self,
            f"eks-vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"eks-vpc-{environment_suffix}",
                f"kubernetes.io/cluster/eks-cluster-{environment_suffix}": "shared"
            }
        )
        
        # Create Internet Gateway
        igw = InternetGateway(
            self,
            f"eks-igw-{environment_suffix}",
            vpc_id=vpc.id,
            tags={"Name": f"eks-igw-{environment_suffix}"}
        )
        
        # Create private subnets for Fargate
        private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"eks-private-subnet-{i}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"eks-private-subnet-{i}-{environment_suffix}",
                    f"kubernetes.io/cluster/eks-cluster-{environment_suffix}": "shared",
                    "kubernetes.io/role/internal-elb": "1"
                }
            )
            private_subnets.append(subnet)
        
        # Create public subnets for NAT gateways
        public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"eks-public-subnet-{i}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"eks-public-subnet-{i}-{environment_suffix}",
                    f"kubernetes.io/cluster/eks-cluster-{environment_suffix}": "shared",
                    "kubernetes.io/role/elb": "1"
                }
            )
            public_subnets.append(subnet)
        
        # Create public route table
        public_rt = RouteTable(
            self,
            f"eks-public-rt-{environment_suffix}",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={"Name": f"eks-public-rt-{environment_suffix}"}
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"eks-public-rta-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )
        
        # Create NAT Gateways and EIPs
        nat_gateways = []
        for i, subnet in enumerate(public_subnets):
            eip = Eip(
                self,
                f"eks-nat-eip-{i}-{environment_suffix}",
                domain="vpc",
                tags={"Name": f"eks-nat-eip-{i}-{environment_suffix}"}
            )
            
            nat_gw = NatGateway(
                self,
                f"eks-nat-gw-{i}-{environment_suffix}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={"Name": f"eks-nat-gw-{i}-{environment_suffix}"}
            )
            nat_gateways.append(nat_gw)
        
        # Create private route tables with NAT gateway routes
        for i, (subnet, nat_gw) in enumerate(zip(private_subnets, nat_gateways)):
            private_rt = RouteTable(
                self,
                f"eks-private-rt-{i}-{environment_suffix}",
                vpc_id=vpc.id,
                route=[RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gw.id
                )],
                tags={"Name": f"eks-private-rt-{i}-{environment_suffix}"}
            )
            
            RouteTableAssociation(
                self,
                f"eks-private-rta-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )
        
        # Create KMS key for EKS encryption
        kms_key = KmsKey(
            self,
            f"eks-kms-key-{environment_suffix}",
            description=f"EKS cluster encryption key for {environment_suffix}",
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {"AWS": f"arn:aws:iam::{current_account.account_id}:root"},
                        "Action": "kms:*",
                        "Resource": "*"
                    }
                ]
            }),
            tags={"Name": f"eks-kms-key-{environment_suffix}"}
        )
        
        KmsAlias(
            self,
            f"eks-kms-alias-{environment_suffix}",
            name=f"alias/eks-cluster-{environment_suffix}",
            target_key_id=kms_key.id
        )
        
        # Create CloudWatch log group for EKS
        CloudwatchLogGroup(
            self,
            f"eks-log-group-{environment_suffix}",
            name=f"/aws/eks/eks-cluster-{environment_suffix}/cluster",
            retention_in_days=7,
            tags={"Name": f"eks-log-group-{environment_suffix}"}
        )
        
        # Create EKS cluster IAM role
        eks_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "eks.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })
        
        eks_cluster_role = IamRole(
            self,
            f"eks-cluster-role-{environment_suffix}",
            name=f"eks-cluster-role-{environment_suffix}",
            assume_role_policy=eks_assume_role_policy,
            tags={"Name": f"eks-cluster-role-{environment_suffix}"}
        )
        
        IamRolePolicyAttachment(
            self,
            f"eks-cluster-policy-{environment_suffix}",
            role=eks_cluster_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
        )
        
        IamRolePolicyAttachment(
            self,
            f"eks-vpc-resource-controller-{environment_suffix}",
            role=eks_cluster_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
        )
        
        # Create cluster security group
        cluster_sg = SecurityGroup(
            self,
            f"eks-cluster-sg-{environment_suffix}",
            name=f"eks-cluster-sg-{environment_suffix}",
            description="EKS cluster security group",
            vpc_id=vpc.id,
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={"Name": f"eks-cluster-sg-{environment_suffix}"}
        )
        
        # Create EKS cluster
        eks_cluster = EksCluster(
            self,
            f"eks-cluster-{environment_suffix}",
            name=f"eks-cluster-{environment_suffix}",
            role_arn=eks_cluster_role.arn,
            version="1.29",
            vpc_config=EksClusterVpcConfig(
                subnet_ids=[subnet.id for subnet in private_subnets],
                endpoint_private_access=True,
                endpoint_public_access=True,
                security_group_ids=[cluster_sg.id]
            ),
            enabled_cluster_log_types=["api", "audit", "authenticator", "controllerManager", "scheduler"],
            tags={"Name": f"eks-cluster-{environment_suffix}"}
        )
        
        # Create OIDC provider for IRSA
        oidc_thumbprint = "9e99a48a9960b14926bb7f3b02e22da2b0ab7280"
        # Extract OIDC issuer URL without https://
        oidc_issuer = Fn.replace(eks_cluster.identity.get(0).oidc.get(0).issuer, "https://", "")
        
        oidc_provider = IamOpenidConnectProvider(
            self,
            f"eks-oidc-provider-{environment_suffix}",
            url=eks_cluster.identity.get(0).oidc.get(0).issuer,
            client_id_list=["sts.amazonaws.com"],
            thumbprint_list=[oidc_thumbprint],
            tags={"Name": f"eks-oidc-provider-{environment_suffix}"}
        )
        
        # Create Fargate pod execution role
        fargate_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "eks-fargate-pods.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })
        
        # Production Fargate role
        fargate_prod_role = IamRole(
            self,
            f"eks-fargate-prod-role-{environment_suffix}",
            name=f"eks-fargate-prod-role-{environment_suffix}",
            assume_role_policy=fargate_assume_role_policy,
            tags={"Name": f"eks-fargate-prod-role-{environment_suffix}"}
        )
        
        IamRolePolicyAttachment(
            self,
            f"fargate-prod-policy-{environment_suffix}",
            role=fargate_prod_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
        )
        
        # Development Fargate role
        fargate_dev_role = IamRole(
            self,
            f"eks-fargate-dev-role-{environment_suffix}",
            name=f"eks-fargate-dev-role-{environment_suffix}",
            assume_role_policy=fargate_assume_role_policy,
            tags={"Name": f"eks-fargate-dev-role-{environment_suffix}"}
        )
        
        IamRolePolicyAttachment(
            self,
            f"fargate-dev-policy-{environment_suffix}",
            role=fargate_dev_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
        )
        
        # Create Fargate profile for kube-system (for CoreDNS)
        fargate_profile_system = EksFargateProfile(
            self,
            f"eks-fargate-system-{environment_suffix}",
            cluster_name=eks_cluster.name,
            fargate_profile_name=f"fargate-system-{environment_suffix}",
            pod_execution_role_arn=fargate_prod_role.arn,
            subnet_ids=[subnet.id for subnet in private_subnets],
            selector=[
                EksFargateProfileSelector(
                    namespace="kube-system",
                    labels={}
                )
            ],
            tags={"Name": f"eks-fargate-system-{environment_suffix}"}
        )
        
        # Create Fargate profile for production namespace
        fargate_profile_prod = EksFargateProfile(
            self,
            f"eks-fargate-prod-{environment_suffix}",
            cluster_name=eks_cluster.name,
            fargate_profile_name=f"fargate-prod-{environment_suffix}",
            pod_execution_role_arn=fargate_prod_role.arn,
            subnet_ids=[subnet.id for subnet in private_subnets],
            selector=[EksFargateProfileSelector(
                namespace="production",
                labels={}
            )],
            tags={"Name": f"eks-fargate-prod-{environment_suffix}"}
        )
        
        # Create Fargate profile for development namespace
        fargate_profile_dev = EksFargateProfile(
            self,
            f"eks-fargate-dev-{environment_suffix}",
            cluster_name=eks_cluster.name,
            fargate_profile_name=f"fargate-dev-{environment_suffix}",
            pod_execution_role_arn=fargate_dev_role.arn,
            subnet_ids=[subnet.id for subnet in private_subnets],
            selector=[EksFargateProfileSelector(
                namespace="development",
                labels={}
            )],
            tags={"Name": f"eks-fargate-dev-{environment_suffix}"}
        )
        
        # Install VPC CNI addon - UPDATED VERSION FOR EKS 1.29
        EksAddon(
            self,
            f"eks-addon-vpc-cni-{environment_suffix}",
            cluster_name=eks_cluster.name,
            addon_name="vpc-cni",
            addon_version="v1.20.4-eksbuild.1",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="OVERWRITE",
            configuration_values=json.dumps({
                "env": {
                    "ENABLE_POD_ENI": "true",
                    "ENABLE_PREFIX_DELEGATION": "true",
                    "POD_SECURITY_GROUP_ENFORCING_MODE": "standard"
                }
            }),
            tags={"Name": f"eks-addon-vpc-cni-{environment_suffix}"}
        )
        
        # Install CoreDNS addon - UPDATED VERSION FOR EKS 1.29
        EksAddon(
            self,
            f"eks-addon-coredns-{environment_suffix}",
            cluster_name=eks_cluster.name,
            addon_name="coredns",
            addon_version="v1.11.1-eksbuild.9",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="OVERWRITE",
            configuration_values=json.dumps({
                "resources": {
                    "limits": {"cpu": "200m", "memory": "256Mi"},
                    "requests": {"cpu": "100m", "memory": "128Mi"}
                }
            }),
            tags={"Name": f"eks-addon-coredns-{environment_suffix}"},
            depends_on=[fargate_profile_system]
        )
        
        # Install kube-proxy addon - UPDATED VERSION FOR EKS 1.29
        EksAddon(
            self,
            f"eks-addon-kube-proxy-{environment_suffix}",
            cluster_name=eks_cluster.name,
            addon_name="kube-proxy",
            addon_version="v1.29.7-eksbuild.9",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="OVERWRITE",
            tags={"Name": f"eks-addon-kube-proxy-{environment_suffix}"}
        )
        
        # Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )
        
        TerraformOutput(
            self,
            "eks_cluster_name",
            value=eks_cluster.name,
            description="EKS cluster name"
        )
        
        TerraformOutput(
            self,
            "eks_cluster_endpoint",
            value=eks_cluster.endpoint,
            description="EKS cluster endpoint"
        )
        
        TerraformOutput(
            self,
            "eks_cluster_version",
            value=eks_cluster.version,
            description="EKS cluster version"
        )
        
        TerraformOutput(
            self,
            "fargate_profile_prod_id",
            value=fargate_profile_prod.id,
            description="Production Fargate profile ID"
        )
        
        TerraformOutput(
            self,
            "fargate_profile_dev_id",
            value=fargate_profile_dev.id,
            description="Development Fargate profile ID"
        )
        
        TerraformOutput(
            self,
            "oidc_provider_arn",
            value=oidc_provider.arn,
            description="OIDC provider ARN for IRSA"
        )
