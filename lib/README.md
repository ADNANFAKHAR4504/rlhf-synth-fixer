# Production-Ready Amazon EKS Cluster

This Terraform configuration deploys a production-grade Amazon EKS cluster with multiple node groups, comprehensive IAM roles, EKS add-ons, and CloudWatch monitoring.

## Architecture Overview

The infrastructure includes:

- **VPC**: Custom VPC with public and private subnets across 3 availability zones
- **EKS Cluster**: Kubernetes 1.28 cluster with OIDC provider and KMS encryption
- **Node Groups**:
  - System nodes: m5.large instances for core Kubernetes components (on-demand)
  - Application nodes: Mixed instance types with spot instances for cost optimization
  - GPU nodes: g4dn.xlarge instances for ML workloads (on-demand)
- **IAM Roles for Service Accounts (IRSA)**:
  - Cluster Autoscaler
  - AWS Load Balancer Controller
  - External Secrets Operator
  - EBS CSI Driver
- **EKS Add-ons**:
  - VPC CNI
  - kube-proxy
  - CoreDNS
  - EBS CSI Driver
- **Monitoring**: CloudWatch Container Insights
- **Security**: Pod Security Standards, RBAC, security groups

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- kubectl installed for cluster access

## Deployment Instructions

### 1. Configure Variables

Edit `terraform.tfvars` to set your desired configuration:

```hcl
aws_region         = "ap-southeast-1"
environment_suffix = "prod"  # Change this for different environments
cluster_name       = "eks-cluster"
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review Planned Changes

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

### 5. Configure kubectl

After successful deployment, configure kubectl to access your cluster:

```bash
aws eks update-kubeconfig --region ap-southeast-1 --name eks-cluster-prod
```

### 6. Verify Cluster Access

```bash
kubectl get nodes
kubectl get namespaces
```

### 7. Apply Kubernetes Manifests

Apply the RBAC and namespace configurations:

```bash
kubectl apply -f kubernetes-manifests/namespaces.yaml
kubectl apply -f kubernetes-manifests/rbac-dev.yaml
kubectl apply -f kubernetes-manifests/rbac-staging.yaml
kubectl apply -f kubernetes-manifests/rbac-production.yaml
```

Create service accounts for IRSA (replace role ARNs from Terraform outputs):

```bash
# Get role ARNs from Terraform outputs
export CLUSTER_AUTOSCALER_ROLE=$(terraform output -raw cluster_autoscaler_role_arn)
export ALB_CONTROLLER_ROLE=$(terraform output -raw alb_controller_role_arn)
export EXTERNAL_SECRETS_ROLE=$(terraform output -raw external_secrets_role_arn)

# Update service account manifests with role ARNs
sed "s|\${cluster_autoscaler_role_arn}|$CLUSTER_AUTOSCALER_ROLE|g" kubernetes-manifests/cluster-autoscaler-sa.yaml | kubectl apply -f -
sed "s|\${alb_controller_role_arn}|$ALB_CONTROLLER_ROLE|g" kubernetes-manifests/alb-controller-sa.yaml | kubectl apply -f -
sed "s|\${external_secrets_role_arn}|$EXTERNAL_SECRETS_ROLE|g" kubernetes-manifests/external-secrets-sa.yaml | kubectl apply -f -
```

## Node Groups

### System Node Group
- **Purpose**: Core Kubernetes components (CoreDNS, kube-proxy, etc.)
- **Instance Type**: m5.large
- **Capacity**: 2-4 nodes (on-demand)
- **AMI**: Bottlerocket

### Application Node Group
- **Purpose**: Application workloads
- **Instance Types**: t3.large, t3a.large, t2.large (mixed)
- **Capacity**: 2-10 nodes (spot instances)
- **AMI**: Bottlerocket

### GPU Node Group
- **Purpose**: ML/AI workloads requiring GPU acceleration
- **Instance Type**: g4dn.xlarge
- **Capacity**: 0-3 nodes (on-demand, starts at 0)
- **AMI**: Bottlerocket with NVIDIA drivers
- **Taints**: nvidia.com/gpu=true:NoSchedule

## IAM Roles for Service Accounts (IRSA)

The following IRSA roles are configured:

1. **Cluster Autoscaler**: Automatically scales node groups based on pod demands
2. **AWS Load Balancer Controller**: Manages ALB/NLB for Kubernetes services
3. **External Secrets Operator**: Syncs secrets from AWS Secrets Manager
4. **EBS CSI Driver**: Manages EBS volumes for persistent storage

## Security Features

- **Encryption**: EKS secrets encrypted with KMS
- **Pod Security Standards**: Enforced at namespace level
  - Dev/Staging: Baseline enforcement
  - Production: Restricted enforcement
- **Network Security**: Security groups for cluster and node communication
- **RBAC**: Role-based access control for each namespace
- **VPC Endpoints**: Private connectivity to AWS services (S3, ECR, EC2, CloudWatch, STS)

## Monitoring

CloudWatch Container Insights is enabled for:
- Cluster-level metrics
- Node-level metrics
- Pod-level metrics
- Application logs

Access metrics in CloudWatch console under Container Insights.

## Cost Optimization

- **Spot Instances**: Application node group uses spot instances (up to 90% cost savings)
- **VPC Endpoints**: Reduces NAT Gateway data transfer costs
- **Right-sizing**: Mixed instance types for optimal cost-performance
- **Auto-scaling**: Automatic scaling based on actual demand

## Scaling

### Manual Scaling

Scale node groups manually:

```bash
# Scale application node group
aws eks update-nodegroup-config \
  --cluster-name eks-cluster-prod \
  --nodegroup-name application-prod \
  --scaling-config desiredSize=5
```

### Automatic Scaling

Cluster Autoscaler automatically adjusts node group sizes based on pod resource requests.

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted to confirm.

**Warning**: This will delete all resources including the EKS cluster and VPC.

## Troubleshooting

### Node Not Ready

Check node status:
```bash
kubectl describe node <node-name>
```

### Pod Scheduling Issues

Check pod events:
```bash
kubectl describe pod <pod-name> -n <namespace>
```

### IRSA Not Working

Verify service account annotations:
```bash
kubectl get sa <service-account-name> -n <namespace> -o yaml
```

## Outputs

Key outputs from this Terraform configuration:

- `eks_cluster_endpoint`: EKS cluster API endpoint
- `eks_cluster_name`: Name of the EKS cluster
- `configure_kubectl_command`: Command to configure kubectl
- `cluster_autoscaler_role_arn`: IAM role ARN for cluster autoscaler
- `alb_controller_role_arn`: IAM role ARN for ALB controller
- `external_secrets_role_arn`: IAM role ARN for external secrets
- `ebs_csi_driver_role_arn`: IAM role ARN for EBS CSI driver

View all outputs:
```bash
terraform output
```

## Additional Resources

- [Amazon EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Bottlerocket OS](https://github.com/bottlerocket-os/bottlerocket)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)
