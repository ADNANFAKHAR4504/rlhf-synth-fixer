# EKS Cluster Infrastructure

Production-ready Amazon EKS cluster with managed node groups, OIDC provider for IRSA, and comprehensive security controls.

## Architecture

This CloudFormation template deploys:

- **EKS Cluster**: Kubernetes 1.28+ with private API endpoint
- **Managed Node Groups**: Two auto-scaling groups (general and compute workloads)
- **OIDC Provider**: Enables IAM Roles for Service Accounts (IRSA)
- **IAM Roles**: Cluster role, node group role, and service account roles
- **Security Groups**: Restricts access to 10.0.0.0/8 CIDR
- **CloudWatch Logging**: All control plane components logged
- **Optional**: ALB Controller, EBS CSI Driver, and Fargate profile

## Prerequisites

1. AWS Account with appropriate permissions
2. VPC with private subnets across 3 availability zones
3. NAT gateways configured for outbound internet access
4. AWS CLI 2.x installed and configured

## Parameters

- **EnvironmentSuffix**: Unique suffix for resource naming (default: prod)
- **VpcId**: VPC ID where cluster will be deployed
- **PrivateSubnetIds**: List of 3 private subnet IDs
- **KubernetesVersion**: Kubernetes version (1.28, 1.29, or 1.30)

## Deployment

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name eks-cluster-prod \
  --template-body file://lib/eks-cluster.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-xxx\\,subnet-yyy\\,subnet-zzz" \
    ParameterKey=KubernetesVersion,ParameterValue=1.28 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name eks-cluster-prod \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

### Get Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name eks-cluster-prod \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

## Configure kubectl

After deployment, configure kubectl to access the cluster:

```bash
aws eks update-kubeconfig \
  --name eks-cluster-prod \
  --region us-east-1
```

## Verify Deployment

```bash
# Check cluster status
kubectl get nodes

# Check system pods
kubectl get pods -n kube-system

# Verify OIDC provider
aws eks describe-cluster \
  --name eks-cluster-prod \
  --query 'cluster.identity.oidc.issuer' \
  --region us-east-1
```

## Resources Created

### Core Resources

- EKS Cluster with private API endpoint
- OIDC Identity Provider
- 2 Managed Node Groups (general and compute)
- IAM roles for cluster and node groups
- Security group for cluster control plane

### Optional Resources

- ALB Controller IAM role (for Kubernetes Ingress)
- EBS CSI Driver IAM role (for persistent volumes)
- Fargate profile (for system pods)

## Security Features

- Private API endpoint (no public access)
- Access restricted to 10.0.0.0/8 CIDR blocks
- Node groups in private subnets
- IAM roles following least privilege principle
- CloudWatch logging for all control plane components
- IRSA enabled for pod-level IAM permissions

## Scaling Configuration

### General Node Group

- Instance Type: t3.large
- Min Nodes: 2
- Max Nodes: 6
- Desired: 2

### Compute Node Group

- Instance Type: c5.xlarge
- Min Nodes: 1
- Max Nodes: 4
- Desired: 1

## Cleanup

To delete the stack:

```bash
# First, delete all Kubernetes resources
kubectl delete all --all --all-namespaces

# Then delete the CloudFormation stack
aws cloudformation delete-stack \
  --stack-name eks-cluster-prod \
  --region us-east-1
```

**Note**: The EKS cluster resource has a Retain deletion policy for safety. You may need to manually delete it from the AWS console after verifying all dependent resources are cleaned up.

## Troubleshooting

### Node Group Not Joining

```bash
# Check node group status
aws eks describe-nodegroup \
  --cluster-name eks-cluster-prod \
  --nodegroup-name general-nodegroup-prod \
  --region us-east-1

# Check CloudWatch logs
aws logs tail /aws/eks/eks-cluster-prod/cluster --follow
```

### IRSA Issues

```bash
# Verify OIDC provider is configured
aws iam list-open-id-connect-providers

# Check service account annotations
kubectl describe serviceaccount -n kube-system
```

## Outputs

- **ClusterName**: EKS cluster name
- **ClusterEndpoint**: API server endpoint
- **ClusterArn**: Cluster ARN
- **OIDCIssuerURL**: OIDC issuer URL for IRSA
- **OIDCProviderArn**: OIDC provider ARN
- **GeneralNodeGroupArn**: General workload node group ARN
- **ComputeNodeGroupArn**: Compute workload node group ARN
- **ALBControllerRoleArn**: ALB controller role ARN
- **EBSCSIDriverRoleArn**: EBS CSI driver role ARN
