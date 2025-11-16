# EKS Multi-Tenant Cluster with Advanced Security

This Pulumi Python program deploys a production-ready Amazon EKS cluster with advanced security and multi-tenancy features.

## Architecture Overview

The infrastructure includes:

1. **VPC Infrastructure**: 3 private subnets across different availability zones with NAT gateways
2. **EKS Cluster**: Version 1.29 with private endpoint access and control plane logging
3. **Node Groups**: Managed node groups using Bottlerocket AMI (t3.large, min=3, max=10, desired=5)
4. **Security**: KMS envelope encryption, Pod Security Standards, NetworkPolicies
5. **IRSA**: OIDC provider for IAM Roles for Service Accounts
6. **Multi-Tenancy**: Three isolated tenant namespaces with dedicated IAM roles and S3 access
7. **Auto-Scaling**: Cluster Autoscaler with proper IAM and RBAC configuration
8. **Load Balancing**: AWS Load Balancer Controller setup with IAM role
9. **Monitoring**: CloudWatch Container Insights enabled

## Requirements

- AWS CLI configured with appropriate credentials
- Pulumi CLI (v3.x or later)
- Python 3.9 or later
- AWS account with permissions to create EKS, VPC, IAM, and related resources

## Project Structure

```
.
├── __main__.py                    # Entry point
├── requirements.txt               # Python dependencies
├── Pulumi.yaml                    # Pulumi project configuration
└── lib/
    ├── __init__.py
    ├── tap_stack.py               # Main orchestration
    ├── vpc.py                     # VPC and networking
    ├── kms.py                     # KMS encryption
    ├── iam.py                     # IAM roles and policies
    ├── eks.py                     # EKS cluster and node groups
    └── kubernetes_resources.py    # K8s resources (namespaces, policies, etc.)
```

## Deployment

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Pulumi Stack

```bash
pulumi stack init dev
pulumi config set aws:region ap-southeast-1
pulumi config set environmentSuffix <unique-suffix>
```

### 3. Deploy Infrastructure

```bash
pulumi up
```

### 4. Configure kubectl

After deployment, configure kubectl to access your cluster:

```bash
aws eks update-kubeconfig --region ap-southeast-1 --name $(pulumi stack output cluster_name)
```

## Features Implemented

### 1. EKS Cluster Configuration
- Kubernetes version 1.28
- Private endpoint access enabled
- Control plane logging enabled for all log types (api, audit, authenticator, controllerManager, scheduler)
- Envelope encryption for Kubernetes secrets using AWS KMS

### 2. Networking
- VPC with CIDR 10.0.0.0/16
- 3 private subnets (10.0.100.0/24, 10.0.101.0/24, 10.0.102.0/24) across different AZs
- 3 public subnets for NAT Gateways
- Proper EKS tagging for subnet discovery

### 3. Node Groups
- Bottlerocket AMI for enhanced security
- Instance type: t3.large
- Scaling: min=3, max=10, desired=5
- Distributed across 3 availability zones
- CloudWatch logging enabled

### 4. IRSA (IAM Roles for Service Accounts)
- OIDC provider created and linked to cluster
- IAM roles with web identity trust policies
- Automatic credential injection via service account annotations

### 5. Cluster Autoscaler
- Deployed in kube-system namespace
- ServiceAccount with IRSA annotation
- Comprehensive RBAC permissions
- IAM policy for auto-scaling operations
- Node group auto-discovery enabled

### 6. Multi-Tenant Isolation

#### Namespaces
- tenant-a
- tenant-b
- tenant-c

Each namespace has:
- Pod Security Standards set to 'restricted'
- NetworkPolicy denying inter-namespace traffic
- Dedicated ServiceAccount with IRSA
- IAM role with S3 bucket prefix access

#### NetworkPolicy Rules
- Allow traffic within same namespace
- Allow DNS queries to kube-system
- Deny traffic to other namespaces
- Allow egress to internet (except metadata service)

#### S3 Access Control
Each tenant has:
- IAM role with assume role policy for their service account
- S3 policy limiting access to `s3://bucket-name/{tenant-name}/*`
- ListBucket permission with prefix condition

### 7. AWS Load Balancer Controller
- ServiceAccount created with IRSA annotation
- IAM role with comprehensive ALB/NLB permissions
- Ready for Helm chart installation

### 8. CloudWatch Container Insights
- Log group created for cluster
- Node IAM role includes CloudWatch permissions
- Metrics and logs collection enabled

## Outputs

The stack exports the following outputs:

- `cluster_endpoint`: EKS cluster API endpoint
- `oidc_issuer_url`: OIDC provider issuer URL
- `kubeconfig_command`: Command to configure kubectl
- `cluster_name`: Name of the EKS cluster
- `vpc_id`: VPC ID
- `private_subnet_ids`: List of private subnet IDs
- `node_group_name`: Name of the managed node group
- `tenant_bucket_name`: S3 bucket for tenant data
- `tenant-a_role_arn`: IAM role ARN for tenant-a
- `tenant-b_role_arn`: IAM role ARN for tenant-b
- `tenant-c_role_arn`: IAM role ARN for tenant-c
- `cluster_autoscaler_role_arn`: IAM role ARN for Cluster Autoscaler
- `alb_controller_role_arn`: IAM role ARN for ALB Controller
- `kms_key_arn`: KMS key ARN for encryption

## Verification

### 1. Verify Cluster Access

```bash
kubectl get nodes
kubectl get namespaces
```

### 2. Verify Tenant Namespaces

```bash
kubectl get namespace tenant-a -o yaml
kubectl get namespace tenant-b -o yaml
kubectl get namespace tenant-c -o yaml
```

### 3. Verify NetworkPolicies

```bash
kubectl get networkpolicy -n tenant-a
kubectl get networkpolicy -n tenant-b
kubectl get networkpolicy -n tenant-c
```

### 4. Verify Cluster Autoscaler

```bash
kubectl get deployment cluster-autoscaler -n kube-system
kubectl logs -n kube-system -l app=cluster-autoscaler
```

### 5. Verify ServiceAccounts

```bash
kubectl get sa -n tenant-a
kubectl describe sa tenant-a-sa -n tenant-a
```

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Security Considerations

1. **Principle of Least Privilege**: Each IAM role has minimal permissions
2. **Network Isolation**: NetworkPolicies enforce namespace boundaries
3. **Encryption**: KMS encryption for secrets at rest
4. **Pod Security**: Restricted Pod Security Standards enforced
5. **Private Subnets**: Nodes deployed in private subnets with no direct internet access
6. **Bottlerocket**: Minimal attack surface with purpose-built OS

## Troubleshooting

### Cluster Autoscaler Not Scaling

Check logs:
```bash
kubectl logs -n kube-system -l app=cluster-autoscaler --tail=50
```

Verify IAM role:
```bash
kubectl describe sa cluster-autoscaler -n kube-system
```

### Tenant Pods Cannot Start

Check Pod Security Standards:
```bash
kubectl get pod <pod-name> -n tenant-a -o yaml
kubectl describe pod <pod-name> -n tenant-a
```

### NetworkPolicy Issues

Verify policy:
```bash
kubectl describe networkpolicy -n tenant-a
```

Test connectivity:
```bash
kubectl run test -n tenant-a -it --rm --image=busybox -- sh
```

## License

This infrastructure code is provided as-is for deployment purposes.
