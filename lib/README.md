# Production-Ready Amazon EKS Cluster

This CloudFormation template deploys a production-ready Amazon EKS cluster with managed node groups, VPC networking, and comprehensive security configurations.

## Architecture

The solution creates:

- **VPC**: A new VPC with 3 public and 3 private subnets across 3 availability zones
- **EKS Cluster**: Kubernetes 1.28 cluster with full logging enabled
- **Managed Node Group**: Auto-scaling node group (2-10 nodes) with m5.large instances
- **NAT Gateways**: One NAT Gateway per AZ for high availability
- **IAM Roles**: Least-privilege roles for cluster and node groups
- **OIDC Provider**: For IAM Roles for Service Accounts (IRSA)
- **Launch Template**: Enforces IMDSv2 for enhanced security
- **CloudWatch Logging**: All cluster logs sent to CloudWatch

## Prerequisites

- AWS CLI 2.x or later
- kubectl 1.28.x or later
- AWS account with appropriate permissions
- Sufficient service quotas for VPC, EKS, and EC2 resources

## Parameters

- **EnvironmentSuffix**: Environment identifier (e.g., dev, staging, prod)
- **VpcCIDR**: CIDR block for VPC (default: 10.0.0.0/16)
- **PublicSubnet1/2/3CIDR**: CIDR blocks for public subnets
- **PrivateSubnet1/2/3CIDR**: CIDR blocks for private subnets
- **KubernetesVersion**: Kubernetes version (default: 1.28)
- **NodeInstanceType**: EC2 instance type for nodes (default: m5.large)
- **NodeGroupMinSize**: Minimum nodes (default: 2)
- **NodeGroupMaxSize**: Maximum nodes (default: 10)
- **NodeGroupDesiredSize**: Desired nodes (default: 3)

## Deployment

### Step 1: Deploy the CloudFormation Stack

```bash
aws cloudformation create-stack \
  --stack-name eks-cluster-prod \
  --template-body file://TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 2: Wait for Stack Creation

```bash
aws cloudformation wait stack-create-complete \
  --stack-name eks-cluster-prod \
  --region us-east-1
```

This typically takes 15-20 minutes.

### Step 3: Configure kubectl

```bash
# Get cluster name from outputs
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name eks-cluster-prod \
  --query "Stacks[0].Outputs[?OutputKey=='EKSClusterName'].OutputValue" \
  --output text \
  --region us-east-1)

# Update kubeconfig
aws eks update-kubeconfig \
  --name $CLUSTER_NAME \
  --region us-east-1
```

### Step 4: Verify Cluster

```bash
# Check cluster status
kubectl get nodes

# Check system pods
kubectl get pods -n kube-system

# Check cluster info
kubectl cluster-info
```

## Security Features

1. **IMDSv2 Enforcement**: All nodes use IMDSv2 with hop limit of 1
2. **Private Node Placement**: Nodes deployed in private subnets
3. **Least Privilege IAM**: Minimal IAM permissions for cluster and nodes
4. **Comprehensive Logging**: All 5 log types enabled (api, audit, authenticator, controllerManager, scheduler)
5. **OIDC Provider**: Enables IRSA for pod-level IAM permissions
6. **Encrypted EBS**: Node volumes encrypted with AWS managed keys
7. **Security Groups**: Dedicated security group for cluster control plane

## Networking

- **VPC**: 10.0.0.0/16
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- **Private Subnets**: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- **NAT Gateways**: One per AZ for high availability
- **Internet Gateway**: For public subnet internet access

## Auto-Scaling

The managed node group automatically scales between 2-10 nodes based on resource demands. You can configure Cluster Autoscaler or Karpenter for advanced scaling policies.

## Outputs

The stack provides these outputs:

- **EKSClusterEndpoint**: API server endpoint URL
- **OIDCIssuerURL**: OIDC provider issuer URL for IRSA
- **NodeGroupArn**: ARN of the managed node group
- **VPCId**: VPC identifier
- **PublicSubnets**: Comma-separated public subnet IDs
- **PrivateSubnets**: Comma-separated private subnet IDs

## Cleanup

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name eks-cluster-prod \
  --region us-east-1

aws cloudformation wait stack-delete-complete \
  --stack-name eks-cluster-prod \
  --region us-east-1
```

## Cost Considerations

Primary cost drivers:

1. **EKS Cluster**: $0.10/hour (~$73/month)
2. **EC2 Instances**: 3 x m5.large (~$300/month)
3. **NAT Gateways**: 3 x $0.045/hour (~$100/month)
4. **EBS Volumes**: 3 x 20GB gp3 (~$6/month)
5. **Data Transfer**: Variable based on usage

Total estimated cost: ~$480-500/month for base infrastructure.

## Troubleshooting

### Nodes Not Joining Cluster

1. Check node IAM role has correct policies
2. Verify security group rules allow node-to-control-plane communication
3. Check CloudWatch logs for node bootstrap errors

### kubectl Connection Issues

1. Verify kubeconfig is correct: `kubectl config view`
2. Check AWS credentials: `aws sts get-caller-identity`
3. Verify cluster endpoint is accessible

### OIDC Provider Issues

1. Verify thumbprint is correct
2. Check OIDC provider ARN in IAM console
3. Ensure trust relationship in service account roles references correct OIDC provider

## Best Practices

1. **Use IRSA**: Assign IAM roles to service accounts instead of node-level permissions
2. **Enable Pod Security Standards**: Use PSS admission controller
3. **Monitor Logs**: Review CloudWatch logs regularly
4. **Update Regularly**: Keep cluster and nodes updated to latest versions
5. **Use Secrets Manager**: Store sensitive data in AWS Secrets Manager, not ConfigMaps
6. **Implement Network Policies**: Control pod-to-pod communication
7. **Enable Container Insights**: For enhanced monitoring

## Additional Add-ons

Consider installing these add-ons:

1. **AWS Load Balancer Controller**: For Ingress and Service load balancing
2. **EBS CSI Driver**: For persistent volume support
3. **Cluster Autoscaler**: For automatic node scaling
4. **Metrics Server**: For HPA and resource metrics
5. **CoreDNS**: Already installed for service discovery

## References

- [Amazon EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [IAM Roles for Service Accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
