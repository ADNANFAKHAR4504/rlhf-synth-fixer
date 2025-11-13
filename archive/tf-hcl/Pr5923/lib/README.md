# Production EKS Cluster with Graviton2 Node Groups

This Terraform configuration deploys a production-ready Amazon EKS cluster with managed node groups using Graviton2 ARM instances in the us-east-2 region.

## Features

- **EKS Cluster**: Kubernetes 1.28 with private and public endpoint access
- **Graviton2 Nodes**: Cost-optimized t4g.medium ARM instances
- **Auto Scaling**: Managed node group scaling from 3 to 15 nodes
- **High Availability**: Distributed across 3 availability zones
- **VPC CNI Prefix Delegation**: Enhanced pod density per node
- **OIDC Provider**: Configured for IAM Roles for Service Accounts (IRSA)
- **Cluster Autoscaler**: IAM role with proper trust policy
- **Selective Logging**: API and audit logs to CloudWatch
- **Encryption**: EBS volumes and Kubernetes secrets encrypted with KMS
- **Optimized Storage**: gp3 volumes with 3000 IOPS and 125 MiB/s throughput

## Architecture

```
VPC (10.0.0.0/16)
├── 3 Public Subnets (with NAT Gateways)
├── 3 Private Subnets (EKS nodes)
├── Internet Gateway
└── 3 NAT Gateways (one per AZ)

EKS Cluster
├── Control Plane (managed by AWS)
├── OIDC Provider (for IRSA)
├── Managed Node Group
│   ├── t4g.medium instances (Graviton2 ARM)
│   ├── Amazon Linux 2 EKS-optimized AMI
│   ├── gp3 100GB encrypted root volumes
│   └── Auto scaling: 3-15 nodes
└── Add-ons
    ├── VPC CNI (with prefix delegation)
    ├── CoreDNS
    └── kube-proxy
```

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- kubectl (for cluster management)
- Permissions to create EKS clusters, VPCs, IAM roles, and related resources

## Usage

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Review and Customize Variables

Create a `terraform.tfvars` file:

```hcl
environment_suffix       = "prod"
region                   = "us-east-2"
cluster_version          = "1.28"
node_instance_type       = "t4g.medium"
node_min_size            = 3
node_max_size            = 15
node_desired_size        = 3
authorized_cidr_blocks   = ["10.0.0.0/8", "172.16.0.0/12"]

common_tags = {
  Environment = "production"
  ManagedBy   = "terraform"
  Project     = "eks-cluster"
}
```

### 3. Plan the Deployment

```bash
terraform plan
```

### 4. Deploy the Infrastructure

```bash
terraform apply
```

### 5. Configure kubectl

After deployment completes, configure kubectl to access your cluster:

```bash
aws eks update-kubeconfig --region us-east-2 --name eks-cluster-prod
```

Verify cluster access:

```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

### 6. Deploy Cluster Autoscaler

Create a Kubernetes ServiceAccount and Deployment for the cluster autoscaler:

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: $(terraform output -raw cluster_autoscaler_role_arn)
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - image: registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.2
        name: cluster-autoscaler
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/eks-cluster-prod
        - --balance-similar-node-groups
        - --skip-nodes-with-system-pods=false
EOF
```

## VPC CNI Prefix Delegation

This configuration enables VPC CNI prefix delegation for increased pod density. To verify it's enabled:

```bash
kubectl get daemonset aws-node -n kube-system -o yaml | grep ENABLE_PREFIX_DELEGATION
```

Expected output:
```
- name: ENABLE_PREFIX_DELEGATION
  value: "true"
```

## Monitoring and Logging

### View Control Plane Logs

```bash
aws logs tail /aws/eks/eks-cluster-prod/cluster --follow --region us-east-2
```

### Check Node Status

```bash
kubectl get nodes -o wide
kubectl top nodes
```

### View Cluster Autoscaler Logs

```bash
kubectl logs -f deployment/cluster-autoscaler -n kube-system
```

## Cost Optimization

This configuration uses several cost-optimization strategies:

1. **Graviton2 instances**: t4g.medium provides ~20% cost savings vs x86
2. **Managed node groups**: No additional cost for EKS-managed infrastructure
3. **Selective logging**: Only api and audit logs to minimize CloudWatch costs
4. **Auto scaling**: Scales down to minimum 3 nodes during low usage
5. **Spot instances**: Can be added by modifying the node group configuration

## Security Features

- Private subnets for all worker nodes
- Encrypted EBS volumes using KMS
- Encrypted Kubernetes secrets using KMS
- IMDSv2 required on all instances
- Security group restrictions on cluster access
- OIDC provider for fine-grained IAM permissions
- Principle of least privilege for all IAM roles

## Maintenance

### Update Cluster Version

```bash
# Update variable
terraform apply -var="cluster_version=1.29"
```

### Scale Node Group

```bash
# Update variables
terraform apply -var="node_desired_size=5"
```

### Rotate Nodes

```bash
# Update launch template, then force node replacement
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
kubectl delete node <node-name>
```

## Troubleshooting

### Nodes Not Joining Cluster

Check node IAM role and security groups:

```bash
kubectl get nodes
aws eks describe-cluster --name eks-cluster-prod --region us-east-2
```

### VPC CNI Issues

Restart the VPC CNI DaemonSet:

```bash
kubectl rollout restart daemonset aws-node -n kube-system
```

### Autoscaler Not Scaling

Check autoscaler logs and IAM permissions:

```bash
kubectl logs -f deployment/cluster-autoscaler -n kube-system
```

## Cleanup

To destroy all resources:

```bash
# Delete all Kubernetes resources first
kubectl delete all --all --all-namespaces

# Destroy Terraform-managed resources
terraform destroy
```

**Note**: Ensure all LoadBalancer services and PersistentVolumes are deleted before running `terraform destroy` to avoid orphaned AWS resources.

## Outputs

After successful deployment, the following outputs are available:

- `cluster_name`: EKS cluster name
- `cluster_endpoint`: EKS API server endpoint
- `cluster_oidc_issuer_url`: OIDC provider URL for IRSA
- `kubectl_config_command`: Command to configure kubectl
- `cluster_autoscaler_role_arn`: IAM role ARN for cluster autoscaler
- `vpc_id`: VPC ID
- `private_subnet_ids`: Private subnet IDs
- `public_subnet_ids`: Public subnet IDs

## References

- [Amazon EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [VPC CNI Plugin](https://github.com/aws/amazon-vpc-cni-k8s)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)
- [IAM Roles for Service Accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
