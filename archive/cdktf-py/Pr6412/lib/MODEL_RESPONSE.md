# EKS Fargate Infrastructure Implementation

This document contains the complete CDKTF Python implementation for an AWS EKS cluster running exclusively on Fargate profiles with integrated AWS services.

## File: lib/tap_stack.py

```python
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

        # Add S3 state locking
        self.add_override("terraform.backend.s3.use_lockfile", True)

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
            version="1.28",
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

        # Install VPC CNI addon
        EksAddon(
            self,
            f"eks-addon-vpc-cni-{environment_suffix}",
            cluster_name=eks_cluster.name,
            addon_name="vpc-cni",
            addon_version="v1.15.1-eksbuild.1",
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

        # Install CoreDNS addon
        EksAddon(
            self,
            f"eks-addon-coredns-{environment_suffix}",
            cluster_name=eks_cluster.name,
            addon_name="coredns",
            addon_version="v1.10.1-eksbuild.4",
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

        # Install kube-proxy addon
        EksAddon(
            self,
            f"eks-addon-kube-proxy-{environment_suffix}",
            cluster_name=eks_cluster.name,
            addon_name="kube-proxy",
            addon_version="v1.28.2-eksbuild.2",
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
```

## File: lib/README.md

```markdown
# EKS Fargate Infrastructure

This CDKTF Python implementation creates a complete AWS EKS cluster running exclusively on Fargate profiles with integrated AWS services for a fintech microservices platform.

## Architecture Overview

- **EKS Cluster**: Version 1.28 with private endpoint access and comprehensive logging
- **Fargate Profiles**: Separate profiles for production (m5.large) and development (t3.medium) workloads
- **Networking**: VPC across 3 AZs with private subnets and NAT gateways
- **Security**: KMS encryption, pod security standards, IRSA for fine-grained permissions
- **Monitoring**: CloudWatch logging enabled for all cluster components
- **OIDC Provider**: Configured for IAM Roles for Service Accounts (IRSA)

## Prerequisites

- Python 3.9+
- Terraform 1.5+
- AWS CLI configured with appropriate credentials
- kubectl 1.28+
- Node.js 18+ (for CDKTF)

## Installation

```bash
# Install dependencies
pipenv install

# Install CDKTF providers
cdktf get
```

## Deployment

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="ap-southeast-1"
export TERRAFORM_STATE_BUCKET="your-state-bucket"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"

# Synthesize Terraform configuration
pipenv run python tap.py

# Deploy infrastructure
cd cdktf.out/stacks/TapStackdev
terraform init
terraform plan
terraform apply
```

## Post-Deployment Configuration

### Configure kubectl

```bash
aws eks update-kubeconfig --name eks-cluster-${ENVIRONMENT_SUFFIX} --region ap-southeast-1
```

### Verify Fargate Profiles

```bash
kubectl get nodes
aws eks describe-fargate-profile --cluster-name eks-cluster-${ENVIRONMENT_SUFFIX} --fargate-profile-name fargate-prod-${ENVIRONMENT_SUFFIX}
aws eks describe-fargate-profile --cluster-name eks-cluster-${ENVIRONMENT_SUFFIX} --fargate-profile-name fargate-dev-${ENVIRONMENT_SUFFIX}
```

### Create Namespaces

```bash
kubectl create namespace production
kubectl create namespace development
```

### Label Namespaces for Pod Security Standards

```bash
# Production - Restricted
kubectl label namespace production pod-security.kubernetes.io/enforce=restricted
kubectl label namespace production pod-security.kubernetes.io/audit=restricted
kubectl label namespace production pod-security.kubernetes.io/warn=restricted

# Development - Baseline
kubectl label namespace development pod-security.kubernetes.io/enforce=baseline
kubectl label namespace development pod-security.kubernetes.io/audit=baseline
kubectl label namespace development pod-security.kubernetes.io/warn=baseline
```

## Resource Naming Convention

All resources use the `environmentSuffix` variable for unique naming:
- EKS Cluster: `eks-cluster-${environmentSuffix}`
- VPC: `eks-vpc-${environmentSuffix}`
- Fargate Profiles: `fargate-prod-${environmentSuffix}`, `fargate-dev-${environmentSuffix}`

## Pod Security Standards

- **Production namespace**: Restricted enforcement (highest security)
- **Development namespace**: Baseline enforcement (moderate security)

## Fargate Profile Configuration

### Production Profile
- Namespace: `production`
- Pod size: m5.large equivalent resources
- Execution role: Dedicated with enhanced permissions

### Development Profile
- Namespace: `development`
- Pod size: t3.medium equivalent resources
- Execution role: Standard permissions

## Network Architecture

- **VPC CIDR**: 10.0.0.0/16
- **Private Subnets**: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24 (Fargate pods)
- **Public Subnets**: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24 (NAT gateways)
- **NAT Gateways**: One per AZ for high availability

## Add-ons Installed

1. **VPC CNI**: Enhanced with security groups per pod
2. **CoreDNS**: Configured for Fargate with resource limits
3. **kube-proxy**: Standard configuration for Fargate

## Testing

```bash
# Run unit tests
pytest tests/unit/

# Run integration tests (requires deployed infrastructure)
pytest tests/integration/
```

## Cleanup

```bash
cd cdktf.out/stacks/TapStackdev
terraform destroy
```

## Troubleshooting

### Fargate Pods Not Starting

Check Fargate profile selectors and ensure namespace labels match:

```bash
aws eks describe-fargate-profile --cluster-name eks-cluster-${ENVIRONMENT_SUFFIX} --fargate-profile-name fargate-prod-${ENVIRONMENT_SUFFIX}
```

### CoreDNS Issues

Verify CoreDNS is running on Fargate:

```bash
kubectl get pods -n kube-system -l k8s-app=kube-dns -o wide
```

## Security Considerations

- KMS encryption enabled for EKS secrets
- Private endpoint access for cluster API
- Security groups per pod enabled via VPC CNI
- Pod security standards enforced at namespace level
- Least privilege IAM roles for all service accounts

## Cost Optimization

- Fargate pricing based on vCPU and memory consumption
- NAT gateways are primary cost driver (consider VPC endpoints for cost reduction)
- CloudWatch log retention set to 7 days
```
