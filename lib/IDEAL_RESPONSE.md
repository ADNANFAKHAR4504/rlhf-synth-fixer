# IDEAL RESPONSE: Production-Ready EKS Cluster with Multi-Tenancy

This document describes the ideal infrastructure solution for deploying a production-grade EKS cluster with advanced security and multi-tenancy features using Pulumi Python.

## Architecture Overview

The solution deploys:
- **EKS Cluster**: Kubernetes 1.29 with private endpoint and comprehensive control plane logging
- **VPC**: 3 private subnets + 3 public subnets across 3 AZs with NAT gateways
- **Node Groups**: Bottlerocket AMI with autoscaling (min=3, max=10, desired=5 t3.large instances)
- **IRSA**: OIDC provider enabling IAM roles for service accounts
- **Multi-Tenancy**: 3 isolated tenant namespaces (tenant-a, tenant-b, tenant-c) with Pod Security Standards
- **Network Isolation**: NetworkPolicies enforcing zero inter-namespace traffic
- **Tenant IAM**: Per-tenant IAM roles with S3 bucket prefix-level access
- **Cluster Autoscaler**: Automatic node scaling based on pod requirements
- **AWS Load Balancer Controller**: Service account with required IAM permissions
- **CloudWatch Container Insights**: Enabled via node IAM permissions
- **Envelope Encryption**: KMS key for Kubernetes secrets

## Key Infrastructure Components

### 1. Networking (lib/vpc.py)

```python
def create_vpc(environment_suffix: str, region: str) -> dict:
    """
    Creates VPC with:
    - 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24) for NAT gateways
    - 3 private subnets (10.0.100.0/24, 10.0.101.0/24, 10.0.102.0/24) for EKS nodes
    - Internet Gateway for public subnet routing
    - 3 NAT Gateways (one per AZ) for private subnet outbound traffic
    - Proper EKS tags for subnet discovery
    """
    pass
```

**Critical Details**:
- Each private subnet has its own NAT gateway for high availability
- Proper tagging: `kubernetes.io/cluster/eks-cluster-{suffix}: shared` for private subnets
- Proper tagging: `kubernetes.io/role/elb: 1` for public subnets (ALB)
- Proper tagging: `kubernetes.io/role/internal-elb: 1` for private subnets (internal NLB)

### 2. Security & Encryption (lib/kms.py, lib/iam.py)

```python
def create_kms_key(environment_suffix: str, account_id: str) -> aws.kms.Key:
    """
    Creates KMS key for EKS envelope encryption:
    - Key rotation enabled
    - Policy allows EKS service to use key
    - 7-day deletion window for safety
    """
    pass
```

**IAM Roles**:
- **Cluster Role**: `AmazonEKSClusterPolicy` + `AmazonEKSVPCResourceController`
- **Node Role**: `AmazonEKSWorkerNodePolicy` + `AmazonEKS_CNI_Policy` + `AmazonEC2ContainerRegistryReadOnly` + `AmazonSSMManagedInstanceCore` + Custom CloudWatch policy
- **Cluster Autoscaler Role**: IRSA-based with autoscaling permissions
- **ALB Controller Role**: IRSA-based with comprehensive ELB permissions
- **Tenant Roles**: IRSA-based with S3 prefix-scoped permissions

### 3. EKS Cluster (lib/eks.py)

```python
def create_eks_cluster(...) -> aws.eks.Cluster:
    """
    Creates EKS 1.29 cluster with:
    - Private endpoint access (also public for initial setup)
    - All control plane logs enabled: api, audit, authenticator, controllerManager, scheduler
    - KMS envelope encryption for secrets
    - Deployed in private subnets only
    """
    pass
```

**CRITICAL FIX**: Bottlerocket user data encoding

```python
import base64  # MUST import

def create_user_data(args):
    cluster_name, endpoint, cert_data = args
    toml_config = f"""[settings.kubernetes]
cluster-name = "{cluster_name}"
api-server = "{endpoint}"
cluster-certificate = "{cert_data}"

[settings.kubernetes.node-labels]
"environment" = "{environment_suffix}"
"""
    return base64.b64encode(toml_config.encode('utf-8')).decode('ascii')

user_data = pulumi.Output.all(
    cluster.name,
    cluster.endpoint,
    cluster.certificate_authority.data
).apply(create_user_data)
```

**Key Insight**: Must use `Output.all()` to combine multiple Output values, then `.apply()` with proper base64 encoding.

### 4. OIDC Provider (lib/eks.py)

```python
def create_oidc_provider(cluster: aws.eks.Cluster, environment_suffix: str) -> tuple:
    """
    Creates OIDC provider for IRSA:
    - Extracts issuer URL from cluster
    - Uses standard EKS root CA thumbprint: 9e99a48a9960b14926bb7f3b02e22da2b0ab7280
    - Client ID: sts.amazonaws.com
    
    Returns: (provider, provider_arn, provider_url)
    """
    pass
```

### 5. Node Groups (lib/eks.py)

```python
def create_node_group(...) -> aws.eks.NodeGroup:
    """
    Creates managed node group with:
    - Bottlerocket AMI (ami_type="BOTTLEROCKET_x86_64")
    - Launch template with custom user data
    - t3.large instances
    - min=3, max=10, desired=5
    - Autoscaler tags for discovery
    """
    pass
```

**CRITICAL FIX**: Proper Output handling in tags

```python
def create_node_tags(cluster_name_value):
    return {
        "Name": f"eks-node-group-{environment_suffix}",
        f"k8s.io/cluster-autoscaler/{cluster_name_value}": "owned",
        "k8s.io/cluster-autoscaler/enabled": "true",
    }

tags=cluster.name.apply(create_node_tags)
```

**Key Insight**: When using Output values in dictionary keys, must use `.apply()` to create entire dictionary.

### 6. Kubernetes Resources (lib/kubernetes_resources.py)

```python
def create_tenant_namespace(tenant_name, environment_suffix, k8s_provider):
    """
    Creates namespace with Pod Security Standards:
    - pod-security.kubernetes.io/enforce: restricted
    - pod-security.kubernetes.io/audit: restricted
    - pod-security.kubernetes.io/warn: restricted
    """
    pass

def create_network_policy(tenant_name, environment_suffix, namespace, k8s_provider):
    """
    Creates NetworkPolicy denying inter-namespace traffic:
    - Allows traffic within same namespace
    - Allows DNS to kube-system
    - Allows egress to internet (AWS services)
    - Blocks metadata service (169.254.169.254/32)
    """
    pass

def create_cluster_autoscaler(environment_suffix, cluster_name, autoscaler_role, k8s_provider, region):
    """
    Deploys Cluster Autoscaler with:
    - RBAC: ClusterRole + ClusterRoleBinding
    - ServiceAccount with IRSA annotation
    - Deployment with registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.0
    - Node group auto-discovery via tags
    - Pod Security Context (non-root, read-only filesystem, no privilege escalation)
    """
    pass
```

**CRITICAL FIX**: Proper Output handling in Cluster Autoscaler command

```python
def create_cluster_autoscaler(
    environment_suffix: str,
    cluster_name: pulumi.Output[str],  # MUST be Output[str]
    ...
):
    def create_autoscaler_command(name):
        return [
            "./cluster-autoscaler",
            f"--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/{name}",
            ...
        ]
    
    deployment = k8s.apps.v1.Deployment(
        ...,
        spec=k8s.apps.v1.DeploymentSpecArgs(
            template=k8s.core.v1.PodTemplateSpecArgs(
                spec=k8s.core.v1.PodSpecArgs(
                    containers=[
                        k8s.core.v1.ContainerArgs(
                            command=cluster_name.apply(create_autoscaler_command),  # Proper apply
                        )
                    ]
                )
            )
        )
    )
```

**Key Insight**: Function signature must accept `Output[str]`, then use `.apply()` to transform into command list.

### 7. Multi-Tenant IAM (lib/iam.py)

```python
def create_tenant_irsa_role(
    tenant_name: str,
    environment_suffix: str,
    oidc_provider_arn: pulumi.Output[str],
    oidc_provider_url: pulumi.Output[str],
    s3_bucket_name: pulumi.Output[str]  # MUST be Output[str]
) -> aws.iam.Role:
    """
    Creates tenant IAM role with:
    - Trust policy: OIDC-based, scoped to specific ServiceAccount
    - S3 policy: List bucket with prefix condition, Get/Put/Delete objects in prefix
    """
    pass
```

**CRITICAL FIX**: Proper Output handling in IAM policy

```python
def create_s3_policy(bucket_name):
    return json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": ["s3:ListBucket"],
                "Resource": f"arn:aws:s3:::{bucket_name}",
                "Condition": {"StringLike": {"s3:prefix": [f"{tenant_name}/*"]}}
            },
            {
                "Effect": "Allow",
                "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
                "Resource": f"arn:aws:s3:::{bucket_name}/{tenant_name}/*"
            }
        ]
    })

tenant_iam_policy = aws.iam.Policy(
    f"eks-{tenant_name}-s3-policy-{environment_suffix}",
    policy=s3_bucket_name.apply(create_s3_policy),  # Proper apply
    ...
)
```

**Key Insight**: When IAM policy JSON needs Output values, use `.apply()` to generate JSON string.

### 8. S3 Tenant Bucket (lib/tap_stack.py)

**CRITICAL FIX**: Use current (non-deprecated) S3 API pattern

```python
# Create bucket first
tenant_bucket = aws.s3.Bucket(
    f"eks-tenant-data-{environment_suffix}",
    bucket=f"eks-tenant-data-{environment_suffix}",
    tags={...}
)

# Then configure encryption separately (current best practice)
aws.s3.BucketServerSideEncryptionConfiguration(
    f"tenant-bucket-sse-{environment_suffix}",
    bucket=tenant_bucket.id,
    rules=[
        aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=\
                aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
        )
    ]
)

# Block public access
aws.s3.BucketPublicAccessBlock(
    f"tenant-bucket-pab-{environment_suffix}",
    bucket=tenant_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)
```

**Key Insight**: Don't use deprecated inline `server_side_encryption_configuration` parameter.

## Critical Pulumi Patterns

### Pattern 1: Module Path Setup

```python
# tap.py (main entry point)
import os
import sys

# MUST add current directory to Python path for Pulumi
sys.path.insert(0, os.path.dirname(__file__))

import pulumi
from lib.tap_stack import TapStack, TapStackArgs
```

### Pattern 2: Output.all() for Multiple Outputs

```python
# When combining multiple Output values
user_data = pulumi.Output.all(
    cluster.name,
    cluster.endpoint,
    cluster.certificate_authority.data
).apply(lambda args: process_all_values(args[0], args[1], args[2]))
```

### Pattern 3: Output.apply() for Single Output

```python
# When transforming a single Output value
policy = bucket_name.apply(lambda name: create_policy_json(name))
tags = cluster_name.apply(lambda name: create_tags_dict(name))
```

### Pattern 4: Type Signatures

```python
# Function accepting Output must declare it
def my_function(value: pulumi.Output[str]) -> ResourceType:
    pass

# Not: def my_function(value: str)  # WRONG if called with Output
```

## Stack Outputs

The stack exports:
- `cluster_endpoint`: EKS API endpoint URL
- `oidc_issuer_url`: OIDC provider URL for IRSA
- `cluster_name`: EKS cluster name
- `vpc_id`: VPC ID
- `tenant_bucket_name`: S3 bucket for tenant data
- `kubeconfig_command`: AWS CLI command to configure kubectl

## Deployment Commands

```bash
# Set environment variables
export PULUMI_CONFIG_PASSPHRASE="pulumi"
export ENVIRONMENT_SUFFIX="synth5r9lo0"
export AWS_REGION="ap-southeast-1"

# Initialize stack
pipenv run pulumi stack init synth5r9lo0

# Preview
pipenv run pulumi preview --stack synth5r9lo0

# Deploy
pipenv run pulumi up --stack synth5r9lo0 --yes

# Get outputs
pipenv run pulumi stack output --stack synth5r9lo0 --json > cfn-outputs/flat-outputs.json

# Destroy
pipenv run pulumi destroy --stack synth5r9lo0 --yes
```

## Validation Checklist

- [x] Pulumi preview passes without errors or warnings
- [x] All resources include environmentSuffix in names
- [x] Proper Output handling (no "__str__ on Output[T]" warnings)
- [x] Base64 encoding uses proper Python `base64` module
- [x] S3 encryption uses current (non-deprecated) API
- [x] IAM policies use `.apply()` for Output values
- [x] Kubernetes resources have proper security contexts
- [x] Network policies isolate tenants
- [x] Pod Security Standards enforced
- [x] All control plane logs enabled
- [x] KMS envelope encryption configured
- [x] Module imports correct and complete

## Testing Strategy

### Unit Tests
- Test each module function independently
- Mock Pulumi resource creation
- Validate resource properties and configurations
- Test Output transformations with Pulumi test decorators

### Integration Tests
- Deploy to actual AWS account
- Validate EKS cluster is accessible
- Test tenant namespace isolation
- Verify IRSA roles work correctly
- Validate autoscaler functionality
- Test S3 access per tenant

## Success Criteria

1. ✅ Infrastructure deploys successfully
2. ✅ EKS cluster becomes healthy and accessible
3. ✅ Node groups launch and join cluster
4. ✅ Tenant namespaces created with Pod Security Standards
5. ✅ Network policies prevent inter-namespace communication
6. ✅ IRSA works for all service accounts
7. ✅ Cluster Autoscaler deployment succeeds
8. ✅ All resources properly tagged with environmentSuffix
9. ✅ CloudWatch logs show control plane events
10. ✅ Infrastructure can be cleanly destroyed
