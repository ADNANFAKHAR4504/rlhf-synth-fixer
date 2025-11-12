# CDKTF Python Implementation - Production EKS Cluster

This implementation provides a production-ready Amazon EKS cluster with advanced security, cost optimization, and modular architecture using CDKTF with Python.

## File: lib/tap_stack.py

```python
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
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
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
```

## File: lib/kms_encryption.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias


class KmsEncryption(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # KMS Key for EKS secrets encryption
        self.kms_key = KmsKey(self, "eks_kms_key",
            description=f"KMS key for EKS secrets encryption - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            tags={
                "Name": f"eks-kms-key-{environment_suffix}",
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # KMS Alias for easier reference
        KmsAlias(self, "eks_kms_alias",
            name=f"alias/eks-{environment_suffix}",
            target_key_id=self.kms_key.key_id
        )

    @property
    def kms_key_arn(self) -> str:
        return self.kms_key.arn
```

## File: lib/iam_roles.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
import json


class IamRoles(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # EKS Cluster IAM Role
        self.cluster_role = IamRole(self, "eks_cluster_role",
            name=f"eks-cluster-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "eks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"eks-cluster-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Attach required policies to cluster role
        IamRolePolicyAttachment(self, "cluster_policy",
            role=self.cluster_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
        )

        IamRolePolicyAttachment(self, "vpc_resource_controller",
            role=self.cluster_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
        )

        # EKS Node Group IAM Role
        self.node_role = IamRole(self, "eks_node_role",
            name=f"eks-node-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"eks-node-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Attach required policies to node role
        IamRolePolicyAttachment(self, "worker_node_policy",
            role=self.node_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
        )

        IamRolePolicyAttachment(self, "cni_policy",
            role=self.node_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
        )

        IamRolePolicyAttachment(self, "container_registry_policy",
            role=self.node_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
        )

        # Cluster Autoscaler Policy
        autoscaler_policy = IamPolicy(self, "autoscaler_policy",
            name=f"eks-autoscaler-policy-{environment_suffix}",
            description="Policy for EKS cluster autoscaler",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "autoscaling:DescribeAutoScalingGroups",
                            "autoscaling:DescribeAutoScalingInstances",
                            "autoscaling:DescribeLaunchConfigurations",
                            "autoscaling:DescribeScalingActivities",
                            "autoscaling:DescribeTags",
                            "ec2:DescribeInstanceTypes",
                            "ec2:DescribeLaunchTemplateVersions"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "autoscaling:SetDesiredCapacity",
                            "autoscaling:TerminateInstanceInAutoScalingGroup",
                            "ec2:DescribeImages",
                            "ec2:GetInstanceTypesFromInstanceRequirements",
                            "eks:DescribeNodegroup"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        IamRolePolicyAttachment(self, "autoscaler_policy_attachment",
            role=self.node_role.name,
            policy_arn=autoscaler_policy.arn
        )

    @property
    def cluster_role_arn(self) -> str:
        return self.cluster_role.arn

    @property
    def node_role_arn(self) -> str:
        return self.node_role.arn
```

## File: lib/security_groups.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.data_aws_vpc import DataAwsVpc


class SecurityGroups(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, vpc_id: str, vpc_cidr: str):
        super().__init__(scope, id)

        # Get VPC data source
        vpc = DataAwsVpc(self, "vpc",
            filter=[{
                "name": "cidr",
                "values": [vpc_cidr]
            }]
        )

        # EKS Cluster Security Group
        self.cluster_sg = SecurityGroup(self, "eks_cluster_sg",
            name=f"eks-cluster-sg-{environment_suffix}",
            description="Security group for EKS cluster control plane",
            vpc_id=vpc.id,
            tags={
                "Name": f"eks-cluster-sg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Allow HTTPS ingress from VPC CIDR
        SecurityGroupRule(self, "cluster_ingress_443",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=[vpc_cidr],
            security_group_id=self.cluster_sg.id,
            description="Allow HTTPS from VPC"
        )

        # Allow all egress
        SecurityGroupRule(self, "cluster_egress_all",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.cluster_sg.id,
            description="Allow all outbound traffic"
        )

    @property
    def cluster_security_group_id(self) -> str:
        return self.cluster_sg.id
```

## File: lib/eks_cluster.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.eks_cluster import EksCluster as AwsEksCluster
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.data_aws_subnet import DataAwsSubnet


class EksCluster(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 cluster_role_arn: str, security_group_ids: list,
                 subnet_ids: list, encryption_key_arn: str):
        super().__init__(scope, id)

        # Get subnet data sources
        private_subnets = []
        for idx, subnet_cidr in enumerate(["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]):
            subnet = DataAwsSubnet(self, f"private_subnet_{idx}",
                filter=[{
                    "name": "cidr-block",
                    "values": [subnet_cidr]
                }]
            )
            private_subnets.append(subnet.id)

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
            version="1.28",
            vpc_config={
                "subnet_ids": private_subnets,
                "security_group_ids": security_group_ids,
                "endpoint_private_access": True,
                "endpoint_public_access": False
            },
            encryption_config=[{
                "provider": {
                    "key_arn": encryption_key_arn
                },
                "resources": ["secrets"]
            }],
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
        return self.cluster.identity[0].oidc[0].issuer

    @property
    def cluster_id(self) -> str:
        return self.cluster.id
```

## File: lib/oidc_provider.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.iam_openid_connect_provider import IamOpenidConnectProvider
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
from cdktf import Fn


class OidcProvider(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, cluster_oidc_issuer_url: str):
        super().__init__(scope, id)

        # Extract OIDC issuer without https://
        oidc_issuer = Fn.replace(cluster_oidc_issuer_url, "https://", "")

        # OIDC Provider for IRSA
        self.oidc_provider = IamOpenidConnectProvider(self, "oidc_provider",
            url=cluster_oidc_issuer_url,
            client_id_list=["sts.amazonaws.com"],
            thumbprint_list=[
                "9e99a48a9960b14926bb7f3b02e22da2b0ab7280"  # Root CA thumbprint for EKS
            ],
            tags={
                "Name": f"eks-oidc-provider-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

    @property
    def oidc_provider_arn(self) -> str:
        return self.oidc_provider.arn

    @property
    def oidc_provider_url(self) -> str:
        return self.oidc_provider.url
```

## File: lib/eks_node_groups.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.eks_node_group import EksNodeGroup
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate
from cdktf_cdktf_provider_aws.data_aws_subnet import DataAwsSubnet
import json


class EksNodeGroups(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
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
```

## File: lib/eks_addons.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.eks_addon import EksAddon


class EksAddons(Construct):
    def __init__(self, scope: Construct, id: str, cluster_name: str):
        super().__init__(scope, id)

        # VPC CNI Add-on
        self.vpc_cni = EksAddon(self, "vpc_cni",
            cluster_name=cluster_name,
            addon_name="vpc-cni",
            addon_version="v1.14.0-eksbuild.3",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="PRESERVE",
            tags={
                "Name": "vpc-cni-addon",
                "ManagedBy": "CDKTF"
            }
        )

        # CoreDNS Add-on
        self.coredns = EksAddon(self, "coredns",
            cluster_name=cluster_name,
            addon_name="coredns",
            addon_version="v1.10.1-eksbuild.6",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="PRESERVE",
            tags={
                "Name": "coredns-addon",
                "ManagedBy": "CDKTF"
            }
        )

        # kube-proxy Add-on
        self.kube_proxy = EksAddon(self, "kube_proxy",
            cluster_name=cluster_name,
            addon_name="kube-proxy",
            addon_version="v1.28.2-eksbuild.2",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="PRESERVE",
            tags={
                "Name": "kube-proxy-addon",
                "ManagedBy": "CDKTF"
            }
        )
```

## File: lib/__init__.py

```python
# Package initialization for lib module
```

## File: main.py

```python
#!/usr/bin/env python
from cdktf import App
from lib.tap_stack import TapStack
import os

app = App()

# Get environment suffix from environment variable or use default
environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")

TapStack(app, "tap", environment_suffix=environment_suffix)

app.synth()
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "python3 main.py",
  "projectId": "eks-cluster-project",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {}
}
```

## File: requirements.txt

```text
cdktf>=0.19.0
cdktf-cdktf-provider-aws>=19.0.0
constructs>=10.3.0
```

## File: lib/README.md

```markdown
# Production EKS Cluster - CDKTF Python Implementation

This implementation creates a production-ready Amazon EKS cluster with advanced security and cost optimization features using CDKTF with Python.

## Architecture Overview

The infrastructure is organized into modular constructs:

- **TapStack**: Main orchestration stack
- **KmsEncryption**: KMS key with automatic rotation for secrets encryption
- **IamRoles**: IAM roles for cluster and node groups with autoscaler policies
- **SecurityGroups**: Security groups with restricted ingress (VPC CIDR only)
- **EksCluster**: EKS cluster v1.28 with private endpoint and CloudWatch logging
- **OidcProvider**: OIDC provider for IRSA functionality
- **EksNodeGroups**: Managed node groups (on-demand and spot)
- **EksAddons**: VPC CNI, CoreDNS, and kube-proxy add-ons

## Features

1. **Security**
   - Private API endpoint (no public access)
   - KMS encryption with automatic rotation
   - IMDSv2 enforcement on all nodes
   - EBS encryption enabled
   - Restricted security group rules
   - OIDC provider for IRSA

2. **Cost Optimization**
   - Graviton2 instances (t4g.large, t4g.medium)
   - Spot instances for non-critical workloads
   - Right-sized node groups

3. **Reliability**
   - Multi-AZ deployment across 3 availability zones
   - Managed node groups with auto-scaling
   - Cluster autoscaler IAM policies

4. **Observability**
   - CloudWatch Logs for control plane
   - Detailed monitoring on node instances
   - 7-day log retention

## Prerequisites

- Python 3.8 or higher
- Node.js 16+ and npm (for CDKTF)
- AWS CLI configured
- Terraform 1.5+
- Existing VPC with CIDR 10.0.0.0/16
- Private subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24

## Installation

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install CDKTF CLI
npm install -g cdktf-cli

# Verify installation
cdktf --version
```

## Deployment

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX="your-suffix"

# Synthesize Terraform configuration
cdktf synth

# Deploy infrastructure
cdktf deploy

# View outputs
cdktf output
```

## Configuration

### Environment Variables

- `ENVIRONMENT_SUFFIX`: Unique suffix for resource naming (required)
- `AWS_REGION`: AWS region (defaults to us-east-1)

### Network Configuration

The implementation expects:
- VPC CIDR: 10.0.0.0/16
- Private Subnets:
  - 10.0.1.0/24 (AZ 1)
  - 10.0.2.0/24 (AZ 2)
  - 10.0.3.0/24 (AZ 3)

## Node Groups

### Critical Workloads
- Instance Type: t4g.large (Graviton2)
- Capacity Type: ON_DEMAND
- Min Size: 2
- Max Size: 6
- AMI: AL2_ARM_64

### Non-Critical Workloads
- Instance Type: t4g.medium (Graviton2)
- Capacity Type: SPOT
- Min Size: 1
- Max Size: 10
- AMI: AL2_ARM_64

## EKS Add-ons

- **VPC CNI**: v1.14.0-eksbuild.3
- **CoreDNS**: v1.10.1-eksbuild.6
- **kube-proxy**: v1.28.2-eksbuild.2

## Accessing the Cluster

After deployment, configure kubectl:

```bash
# Get kubeconfig command from outputs
cdktf output kubeconfig_command

# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name eks-cluster-{environment-suffix}

# Verify access
kubectl get nodes
```

## Cluster Autoscaler Setup

The node groups are tagged for cluster autoscaler auto-discovery:

```yaml
k8s.io/cluster-autoscaler/enabled: "true"
k8s.io/cluster-autoscaler/eks-cluster-{environment-suffix}: "owned"
```

Deploy cluster autoscaler with IRSA using the OIDC provider.

## Security Considerations

1. **Private Endpoint**: Cluster API is only accessible from within VPC
2. **KMS Encryption**: All Kubernetes secrets encrypted at rest
3. **IMDSv2**: Required for all EC2 instances
4. **Security Groups**: Only allow traffic from VPC CIDR (10.0.0.0/16)
5. **IAM Least Privilege**: Roles follow least privilege principles

## Monitoring

Control plane logs are sent to CloudWatch:
- `/aws/eks/{environment-suffix}/cluster`
- Log types: api, authenticator
- Retention: 7 days

## Outputs

- `cluster_endpoint`: EKS cluster API endpoint
- `cluster_name`: EKS cluster name
- `oidc_provider_arn`: OIDC provider ARN for IRSA
- `oidc_issuer_url`: OIDC issuer URL
- `critical_node_group_name`: Critical node group name
- `non_critical_node_group_name`: Non-critical node group name
- `kubeconfig_command`: Command to update kubeconfig

## Cleanup

```bash
# Destroy infrastructure
cdktf destroy
```

## Troubleshooting

### Issue: Cluster creation fails
- Verify VPC and subnets exist
- Check IAM role permissions
- Ensure KMS key is in correct region

### Issue: Nodes not joining cluster
- Verify node IAM role has required policies
- Check security group rules
- Review CloudWatch logs

### Issue: Cannot access cluster
- Ensure you're connecting from within VPC
- Verify OIDC provider configuration
- Check IAM authentication

## Testing

See test files in `tests/` directory for unit and integration tests.

## License

This code is part of IaC test automations project.
```
