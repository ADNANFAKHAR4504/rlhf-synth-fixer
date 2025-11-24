# EKS Cluster with Auto Scaling Node Groups for Microservices

This CloudFormation template deploys a production-ready Amazon EKS (Elastic Kubernetes Service) cluster with Auto Scaling managed node groups for hosting microservices workloads.

## Architecture

The infrastructure includes:

- **EKS Cluster**: Version 1.28+ deployed in private subnets across 3 availability zones
- **Managed Node Group**: Auto Scaling group with 3-6 t3.medium instances using Amazon Linux 2 EKS optimized AMIs
- **Security**: KMS encryption for secrets, OIDC provider for IRSA, security groups for pod communication
- **Logging**: CloudWatch Logs for all EKS control plane log types (api, audit, authenticator, controllerManager, scheduler)
- **IAM**: Least-privilege roles for cluster and node groups
- **Networking**: Private cluster endpoint with no public access

## Prerequisites

Before deploying this stack, you need:

1. **VPC**: An existing VPC with at least 3 private subnets across 3 availability zones
2. **IAM Permissions**: Permissions to create EKS clusters, IAM roles, KMS keys, and security groups
3. **AWS CLI**: Configured with appropriate credentials

## Parameters

### Required Parameters

- **VpcId**: The ID of the VPC where the EKS cluster will be deployed
- **PrivateSubnetIds**: List of at least 3 private subnet IDs across different availability zones

### Optional Parameters

- **EnvironmentSuffix**: Environment identifier (default: `dev`)
- **EksVersion**: EKS cluster version (default: `1.28`, allowed: 1.28, 1.29, 1.30)
- **NodeInstanceType**: EC2 instance type for worker nodes (default: `t3.medium`)
- **NodeGroupMinSize**: Minimum number of nodes (default: `3`)
- **NodeGroupMaxSize**: Maximum number of nodes (default: `6`)
- **NodeGroupDesiredSize**: Desired number of nodes (default: `3`)

## Deployment

### Using AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name eks-microservices-dev \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxxxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-xxx,subnet-yyy,subnet-zzz" \
    ParameterKey=EksVersion,ParameterValue=1.28 \
    ParameterKey=NodeInstanceType,ParameterValue=t3.medium \
    ParameterKey=NodeGroupMinSize,ParameterValue=3 \
    ParameterKey=NodeGroupMaxSize,ParameterValue=6 \
    ParameterKey=NodeGroupDesiredSize,ParameterValue=3 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name eks-microservices-dev \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

### Wait for Completion

```bash
aws cloudformation wait stack-create-complete \
  --stack-name eks-microservices-dev \
  --region us-east-1
```

## Post-Deployment Configuration

### 1. Configure kubectl Access

```bash
# Get cluster name from outputs
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name eks-microservices-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`EksClusterName`].OutputValue' \
  --output text \
  --region us-east-1)

# Update kubeconfig
aws eks update-kubeconfig \
  --name $CLUSTER_NAME \
  --region us-east-1
```

### 2. Verify Cluster Access

```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

### 3. Configure OIDC Provider for IRSA

The cluster automatically creates an OIDC issuer URL. To enable IRSA for your pods:

```bash
# Get OIDC issuer URL
OIDC_URL=$(aws cloudformation describe-stacks \
  --stack-name eks-microservices-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`EksOidcIssuer`].OutputValue' \
  --output text \
  --region us-east-1)

# Create OIDC provider (if not already created)
eksctl utils associate-iam-oidc-provider \
  --cluster $CLUSTER_NAME \
  --region us-east-1 \
  --approve
```

### 4. Install EKS Add-ons (Optional)

```bash
# Install CoreDNS
aws eks create-addon \
  --cluster-name $CLUSTER_NAME \
  --addon-name coredns \
  --region us-east-1

# Install kube-proxy
aws eks create-addon \
  --cluster-name $CLUSTER_NAME \
  --addon-name kube-proxy \
  --region us-east-1

# Install VPC CNI
aws eks create-addon \
  --cluster-name $CLUSTER_NAME \
  --addon-name vpc-cni \
  --region us-east-1
```

## Security Features

### Network Security

- **Private Cluster Endpoint**: No public API access
- **Security Groups**: Restricted pod-to-pod communication on ports 443, 10250, and 53
- **Private Subnets**: All nodes deployed in private subnets

### Encryption

- **KMS Encryption**: EKS secrets encrypted at rest using AWS KMS
- **Key Rotation**: Automatic KMS key rotation enabled

### IAM

- **Least Privilege**: IAM roles follow least privilege principle with no wildcard permissions
- **IRSA Support**: OIDC provider configured for pod-level IAM authentication
- **Managed Policies**: Uses AWS managed policies for EKS cluster and node roles

### Logging

- **Control Plane Logs**: All log types enabled (api, audit, authenticator, controllerManager, scheduler)
- **CloudWatch Integration**: Logs streamed to CloudWatch for monitoring and analysis

## Resource Naming

All resources are named with the `environmentSuffix` parameter for multi-environment deployments:

- EKS Cluster: `eks-cluster-{environmentSuffix}`
- Node Group: `eks-node-group-{environmentSuffix}`
- Security Groups: `eks-cluster-sg-{environmentSuffix}`, `eks-node-sg-{environmentSuffix}`
- IAM Roles: `eks-cluster-role-{environmentSuffix}`, `eks-node-role-{environmentSuffix}`
- KMS Key: `eks-kms-key-{environmentSuffix}`

## Outputs

The stack exports the following outputs:

- **EksClusterName**: Name of the EKS cluster
- **EksClusterArn**: ARN of the EKS cluster
- **EksClusterEndpoint**: API endpoint of the EKS cluster
- **EksClusterSecurityGroupId**: Security group ID for control plane
- **EksNodeSecurityGroupId**: Security group ID for worker nodes
- **EksKmsKeyId**: KMS key ID for secrets encryption
- **EksKmsKeyArn**: KMS key ARN for secrets encryption
- **EksOidcIssuer**: OIDC issuer URL for IRSA
- **EksNodeGroupName**: Name of the managed node group
- **EksClusterRoleArn**: ARN of the EKS cluster IAM role
- **EksNodeRoleArn**: ARN of the EKS node IAM role
- **EnvironmentSuffix**: Environment suffix used for deployment

## Cleanup

To delete the stack and all resources:

```bash
aws cloudformation delete-stack \
  --stack-name eks-microservices-dev \
  --region us-east-1
```

**Note**: All resources have `DeletionPolicy: Delete` set, so they will be permanently removed when the stack is deleted.

## Troubleshooting

### Node Group Creation Fails

- Ensure subnets are in private subnets with NAT Gateway access
- Verify IAM role has correct permissions
- Check security group rules allow kubelet communication

### Cannot Access Cluster

- Verify you have the correct IAM permissions
- Ensure your AWS CLI is configured with the correct profile
- Check that the cluster endpoint is accessible from your network

### Pods Cannot Communicate

- Verify security group rules for ports 443, 10250, and 53
- Check that the VPC CNI plugin is running correctly
- Ensure nodes have proper networking configuration

## Cost Optimization

- **Instance Type**: Uses t3.medium instances (2 vCPU, 4 GB RAM)
- **Auto Scaling**: Scales from 3 to 6 nodes based on demand
- **Log Retention**: CloudWatch logs retained for 7 days only
- **Delete Policy**: All resources can be deleted to avoid ongoing costs

## Compliance

This infrastructure meets the following compliance requirements:

- **Encryption**: All secrets encrypted at rest using KMS
- **Private Networking**: No public endpoints exposed
- **Least Privilege**: IAM roles follow least privilege principle
- **Audit Logging**: All control plane activities logged
- **High Availability**: Resources distributed across 3 availability zones

## Tags

All resources are tagged with:

- **Environment**: Production
- **ManagedBy**: CloudFormation
- **Name**: Resource-specific name with environment suffix

## Support

For issues or questions:

1. Check CloudFormation stack events for error messages
2. Review CloudWatch logs for EKS control plane issues
3. Verify IAM permissions and security group configurations
4. Consult AWS EKS documentation: https://docs.aws.amazon.com/eks/

## Version History

- **v1.0**: Initial production-ready EKS cluster with Auto Scaling node groups
