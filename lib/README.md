# EKS Cluster with Hybrid Node Groups - CloudFormation

This CloudFormation template deploys a production-grade Amazon EKS cluster with hybrid node group architecture, featuring both managed and self-managed node groups with comprehensive security controls.

## Architecture Overview

The infrastructure includes:

- **EKS Cluster v1.28** with private endpoint access only
- **VPC** with 3 private subnets across availability zones (us-east-1a, us-east-1b, us-east-1c)
- **Managed Node Group** with t3.medium instances (2-6 capacity)
- **Self-Managed Node Group** with m5.large instances using Launch Templates
- **KMS Customer-Managed Key** with automatic rotation for envelope encryption
- **OIDC Provider** for IAM Roles for Service Accounts (IRSA)
- **Security Groups** with VPC-only ingress rules
- **IMDSv2** enforcement on self-managed nodes

## Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create EKS clusters, EC2 instances, VPCs, IAM roles, and KMS keys
- An AWS account with sufficient service quotas for EKS

## Deployment

### Step 1: Validate the Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.json
```

### Step 2: Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name eks-hybrid-cluster-<your-suffix> \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=<your-unique-suffix> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

Replace `<your-unique-suffix>` with a unique identifier (e.g., your initials or a short random string).

### Step 3: Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name eks-hybrid-cluster-<your-suffix> \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

Deployment typically takes 15-20 minutes to complete.

### Step 4: Retrieve Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name eks-hybrid-cluster-<your-suffix> \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Configuration

### Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| EnvironmentSuffix | String | Unique suffix for resource naming to avoid conflicts | Yes |

### Resource Naming Convention

All resources follow the pattern: `{resource-type}-{EnvironmentSuffix}`

Examples:
- EKS Cluster: `eks-cluster-${EnvironmentSuffix}`
- VPC: `eks-vpc-${EnvironmentSuffix}`
- Security Groups: `cluster-sg-${EnvironmentSuffix}`, `node-sg-${EnvironmentSuffix}`
- KMS Key Alias: `alias/eks-encryption-${EnvironmentSuffix}`

## Security Features

### Network Security
- All subnets are private (no internet gateway)
- Security groups restrict ingress to VPC CIDR only
- Separate security groups for cluster control plane and worker nodes
- Node-to-node communication enabled through self-ingress rules

### IAM Security
- Cluster role uses least-privilege managed policies
- Node role includes only necessary permissions:
  - AmazonEKSWorkerNodePolicy
  - AmazonEKS_CNI_Policy
  - AmazonEC2ContainerRegistryReadOnly
  - AmazonSSMManagedInstanceCore (for troubleshooting)
- OIDC provider enables pod-level IAM roles (IRSA)

### Encryption
- KMS customer-managed key for EKS envelope encryption
- Automatic key rotation enabled
- Secrets encrypted at rest

### Instance Metadata
- IMDSv2 enforced on self-managed nodes (hop limit = 1)
- Protects against SSRF attacks

## Outputs

| Output | Description |
|--------|-------------|
| ClusterName | Name of the EKS cluster |
| ClusterEndpoint | Endpoint for EKS API server |
| ClusterArn | ARN of the EKS cluster |
| VPCId | VPC ID |
| PrivateSubnetIds | Comma-separated list of private subnet IDs |
| OIDCProviderArn | ARN of the OIDC provider for IRSA |
| NodeRoleArn | ARN of the node IAM role |
| EncryptionKeyArn | ARN of the KMS encryption key |

## Accessing the Cluster

### Configure kubectl

Since the cluster has private endpoint access only, you must access it from within the VPC (e.g., via a bastion host or VPN).

```bash
aws eks update-kubeconfig \
  --name eks-cluster-<your-suffix> \
  --region us-east-1
```

### Verify Cluster Access

```bash
kubectl get nodes
kubectl get pods -A
```

## Node Groups

### Managed Node Group
- **Instance Type**: t3.medium
- **Capacity**: Min 2, Max 6, Desired 2
- **AMI**: Amazon Linux 2 EKS-optimized
- **Availability**: Deployed across 3 AZs

### Self-Managed Node Group
- **Instance Type**: m5.large
- **Capacity**: Min 1, Max 3, Desired 1
- **AMI**: Amazon Linux 2 EKS-optimized (ami-0c55b159cbfafe1f0)
- **IMDSv2**: Enforced with hop limit 1
- **Availability**: Deployed across 3 AZs

## Monitoring

### Cluster Logging
The following log types are enabled:
- API server logs
- Audit logs
- Controller manager logs

Access logs via CloudWatch Logs:
```bash
aws logs tail /aws/eks/eks-cluster-<your-suffix>/cluster --follow
```

## Troubleshooting

### Node Access
Use AWS Systems Manager Session Manager to access nodes:
```bash
aws ssm start-session --target <instance-id>
```

### Common Issues

1. **Cluster creation fails**: Check IAM permissions and service quotas
2. **Nodes not joining cluster**: Verify security groups allow cluster-to-node communication
3. **Private endpoint unreachable**: Ensure you're accessing from within the VPC

## Cost Optimization

- Managed nodes use t3.medium (cost-effective for application workloads)
- Self-managed nodes use m5.large (better performance for data workloads)
- No NAT Gateways (private-only architecture reduces costs)
- Aurora Serverless pattern not applicable (EKS-specific infrastructure)

## Cleanup

To avoid ongoing charges, delete the stack when no longer needed:

```bash
aws cloudformation delete-stack \
  --stack-name eks-hybrid-cluster-<your-suffix> \
  --region us-east-1
```

Monitor deletion:
```bash
aws cloudformation describe-stacks \
  --stack-name eks-hybrid-cluster-<your-suffix> \
  --region us-east-1
```

All resources are configured for deletion (no retain policies).

## Compliance

This infrastructure meets the following compliance requirements:
- Private endpoint access only (no public exposure)
- Envelope encryption with KMS customer-managed keys
- Automatic key rotation enabled
- IMDSv2 enforcement on EC2 instances
- Security groups deny external ingress
- Least-privilege IAM policies

## References

- [Amazon EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [IAM Roles for Service Accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
- [EKS Security Best Practices](https://aws.github.io/aws-eks-best-practices/security/docs/)

## Support

For issues with this infrastructure:
1. Check CloudFormation stack events for error details
2. Review CloudWatch Logs for cluster and node logs
3. Verify IAM permissions and service quotas
4. Consult AWS EKS documentation

## License

This infrastructure code is provided as-is for educational and demonstration purposes.
