# EKS Cluster Security, Compliance, and Governance Infrastructure

This CloudFormation template deploys a production-ready Amazon EKS cluster with comprehensive security, compliance, and governance controls.

## Architecture

### Components

1. **VPC Infrastructure**
   - VPC with CIDR 10.0.0.0/16
   - 3 Public Subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across 3 AZs
   - 3 Private Subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) across 3 AZs
   - Internet Gateway for public internet access
   - 3 NAT Gateways (one per AZ) for high availability
   - Route tables for public and private subnets

2. **EKS Cluster**
   - Kubernetes version 1.28+ (configurable)
   - Private endpoint enabled for secure access
   - Public endpoint enabled for administrative access
   - KMS encryption for secrets
   - Comprehensive control plane logging (API, audit, authenticator, controller manager, scheduler)

3. **Node Group**
   - Managed node group with t3.medium instances (configurable)
   - Auto-scaling: 2-6 nodes (configurable)
   - Deployed in private subnets across 3 AZs
   - Amazon Linux 2 AMI

4. **Security**
   - Security groups with least-privilege rules
   - KMS encryption for cluster secrets
   - VPC Flow Logs for network traffic analysis
   - CloudTrail for API call auditing
   - OIDC Provider for IRSA (IAM Roles for Service Accounts)

5. **Monitoring & Logging**
   - CloudWatch Log Groups for EKS control plane logs
   - VPC Flow Logs for network monitoring
   - CloudTrail for governance and compliance
   - Log retention: 7 days (configurable)

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create EKS, VPC, IAM, CloudWatch, and S3 resources
- Sufficient service quotas for NAT Gateways, EIPs, and VPC resources

### Parameters

| Parameter | Description | Default | Allowed Values |
|-----------|-------------|---------|----------------|
| EnvironmentSuffix | Unique suffix for resource naming | dev | Any string |
| ClusterVersion | Kubernetes version | 1.28 | 1.28, 1.29, 1.30 |
| NodeInstanceType | EC2 instance type for nodes | t3.medium | Any valid EC2 type |
| NodeGroupMinSize | Minimum nodes | 2 | >= 1 |
| NodeGroupDesiredSize | Desired nodes | 3 | >= 1 |
| NodeGroupMaxSize | Maximum nodes | 6 | >= 1 |

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name eks-cluster-dev \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=ClusterVersion,ParameterValue=1.28 \
    ParameterKey=NodeInstanceType,ParameterValue=t3.medium \
    ParameterKey=NodeGroupMinSize,ParameterValue=2 \
    ParameterKey=NodeGroupDesiredSize,ParameterValue=3 \
    ParameterKey=NodeGroupMaxSize,ParameterValue=6 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Stack Creation

```bash
aws cloudformation describe-stacks \
  --stack-name eks-cluster-dev \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Configure kubectl

After stack creation completes (approximately 15-20 minutes):

```bash
aws eks update-kubeconfig \
  --name eks-cluster-dev \
  --region us-east-1
```

Verify cluster access:

```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

## Resource Tagging

All resources are tagged for compliance and cost tracking:

- **Name**: Resource-specific name with environment suffix
- **Environment**: Value from EnvironmentSuffix parameter
- **Team**: platform
- **CostCenter**: infrastructure

Additional Kubernetes-specific tags:
- `kubernetes.io/role/elb: 1` - Public subnets for external load balancers
- `kubernetes.io/role/internal-elb: 1` - Private subnets for internal load balancers
- `kubernetes.io/cluster/{cluster-name}: owned` - Node security group

## Security Features

### Network Security
- Cluster deployed in private subnets
- Security groups with least-privilege ingress/egress rules
- VPC Flow Logs for network traffic analysis
- No direct internet access for worker nodes (via NAT Gateways)

### Encryption
- KMS encryption for Kubernetes secrets
- S3 bucket encryption for CloudTrail logs
- EBS encryption for node volumes (handled by node group)

### IAM & Access Control
- OIDC Provider for IRSA support
- Separate IAM roles for cluster and nodes
- Managed policies following least-privilege principle
- CloudTrail for API call auditing

### Logging & Monitoring
- All EKS control plane logs enabled
- VPC Flow Logs for network analysis
- CloudTrail for governance
- CloudWatch Log Groups with retention policies

## IRSA (IAM Roles for Service Accounts)

The template creates an OIDC Provider for IRSA support. To create a service account with IAM permissions:

1. Create an IAM role with trust policy referencing the OIDC Provider
2. Annotate your Kubernetes service account with the IAM role ARN
3. Pods using that service account will automatically assume the IAM role

Example:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-service-account
  namespace: default
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/my-iam-role
```

## Cost Optimization

### Current Configuration Costs (us-east-1, approximate):
- NAT Gateways (3): ~$97.20/month ($0.045/hour each)
- EKS Cluster: $73/month ($0.10/hour)
- EC2 Nodes (3 x t3.medium): ~$100/month ($0.0416/hour each)
- **Total**: ~$270/month (excluding data transfer and storage)

### Optimization Options:
1. **Single NAT Gateway**: Reduce from 3 to 1 NAT Gateway (saves ~$65/month, reduces HA)
2. **Smaller Nodes**: Use t3.small for non-production (saves ~$50/month)
3. **Spot Instances**: Enable spot instances for node group (saves 50-70% on compute)
4. **Reduce Node Count**: Set min=1, desired=2 for dev environments

## Cleanup

To delete all resources:

```bash
# Delete any LoadBalancer services first (to remove ELBs)
kubectl delete svc --all --all-namespaces

# Wait a few minutes for ELBs to be removed

# Delete the CloudFormation stack
aws cloudformation delete-stack \
  --stack-name eks-cluster-dev \
  --region us-east-1

# Monitor deletion
aws cloudformation describe-stacks \
  --stack-name eks-cluster-dev \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

**Note**: Deletion may take 15-20 minutes. The stack uses `DeletionPolicy: Delete` (default) for all resources, ensuring complete cleanup.

## Troubleshooting

### Stack Creation Fails

Check CloudFormation events:
```bash
aws cloudformation describe-stack-events \
  --stack-name eks-cluster-dev \
  --region us-east-1 \
  --max-items 20
```

Common issues:
- **Insufficient permissions**: Ensure IAM user/role has required permissions
- **Service quotas**: Check VPC, EC2, and EKS service limits
- **Resource naming conflicts**: Change EnvironmentSuffix parameter

### Cannot Connect to Cluster

Verify AWS credentials and cluster:
```bash
aws sts get-caller-identity
aws eks describe-cluster --name eks-cluster-dev --region us-east-1
```

Update kubeconfig:
```bash
aws eks update-kubeconfig --name eks-cluster-dev --region us-east-1
```

Check kubectl configuration:
```bash
kubectl config current-context
kubectl cluster-info
```

### Nodes Not Joining Cluster

Check node group status:
```bash
aws eks describe-nodegroup \
  --cluster-name eks-cluster-dev \
  --nodegroup-name eks-nodegroup-dev \
  --region us-east-1
```

Check EKS logs in CloudWatch:
```bash
aws logs tail /aws/eks/eks-cluster-dev/cluster --follow
```

## Compliance Considerations

### Audit Logging
- EKS control plane logs enabled for all log types
- CloudTrail captures all API calls
- VPC Flow Logs capture all network traffic
- All logs retained for 7 days (configurable)

### Access Control
- Cluster IAM role has only required AWS managed policies
- Node IAM role includes CloudWatch agent for Container Insights
- OIDC Provider enables fine-grained pod-level permissions
- Security groups implement least-privilege network access

### Data Protection
- KMS encryption for Kubernetes secrets at rest
- S3 bucket encryption for CloudTrail logs
- Versioning enabled on CloudTrail bucket
- Public access blocked on S3 bucket

### High Availability
- Multi-AZ deployment (3 availability zones)
- NAT Gateway per AZ for network redundancy
- Auto-scaling node group spans all AZs
- Private subnets protect worker nodes

## cfn-lint Validation

This template has been validated with cfn-lint and passes with zero warnings:

```bash
cfn-lint lib/TapStack.json
```

All known issues have been pre-emptively fixed:
- Dynamic availability zone selection using Fn::GetAZs
- Proper handling of IpProtocol "-1" without FromPort/ToPort
- Removal of redundant DependsOn declarations

See `lib/MODEL_FAILURES.md` for detailed documentation of fixes applied.

## References

- [Amazon EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [EKS Security Best Practices](https://docs.aws.amazon.com/eks/latest/userguide/best-practices-security.html)
- [IRSA Documentation](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
- [EKS Logging](https://docs.aws.amazon.com/eks/latest/userguide/control-plane-logs.html)
