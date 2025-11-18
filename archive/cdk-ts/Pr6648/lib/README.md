# Production EKS Cluster for Payment Processing Platform

This CDK TypeScript application deploys a production-ready Amazon EKS cluster designed for a payment processing platform with comprehensive security, scalability, and compliance features suitable for PCI DSS requirements.

## Architecture Overview

The infrastructure creates:

- **VPC**: Custom VPC spanning 3 availability zones with public and private subnets
- **EKS Cluster**: Version 1.28 with private endpoint access only
- **Managed Node Groups**: Bottlerocket OS-based nodes with auto-scaling (3-15 nodes)
- **IRSA**: IAM Roles for Service Accounts with OIDC provider
- **Security**: Private networking, Systems Manager access, comprehensive IAM policies
- **Observability**: Complete control plane logging to CloudWatch

## Key Features

### Security
- **Private Cluster**: Endpoint accessible only from within VPC
- **Bottlerocket OS**: Security-hardened, minimal-footprint operating system
- **IRSA**: Pod-level AWS permissions via OIDC provider
- **Systems Manager**: Secure node access without SSH keys
- **IAM Least Privilege**: Minimal permissions for all roles
- **Control Plane Logging**: All 5 log types enabled (API, Audit, Authenticator, Controller Manager, Scheduler)

### High Availability
- 3 Availability Zones deployment
- Auto-scaling node groups (3-15 nodes)
- Private subnets for node placement
- Cluster autoscaler IAM permissions configured

### Compliance
- PCI DSS-ready architecture
- Comprehensive audit logging
- Resource tagging (Environment=Production, Project=PaymentPlatform)
- Private networking with no public endpoints

### Cost Optimization
- Single NAT Gateway (instead of one per AZ)
- CloudWatch logs retention: 7 days
- On-demand instances with auto-scaling
- Bottlerocket OS (reduced data transfer)

## Prerequisites

- **Node.js**: 18.x or later
- **AWS CLI**: v2.x configured with credentials
- **kubectl**: Latest stable version
- **AWS CDK CLI**: `npm install -g aws-cdk`
- **IAM Permissions**: Sufficient permissions to create EKS, VPC, IAM resources

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Bootstrap CDK (First Time Only)

```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

### 3. Deploy Infrastructure

```bash
cdk deploy --context environmentSuffix=<your-unique-suffix>
```

Example:
```bash
cdk deploy --context environmentSuffix=prod-001
```

### 4. Configure kubectl

After successful deployment, configure kubectl to access your cluster:

```bash
aws eks update-kubeconfig --name payment-cluster-<your-suffix> --region us-east-1
```

### 5. Verify Deployment

```bash
# Check cluster info
kubectl cluster-info

# List nodes
kubectl get nodes

# Check system pods
kubectl get pods -n kube-system
```

## Post-Deployment Configuration

### Deploy Cluster Autoscaler

1. Deploy the autoscaler:
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml
```

2. Annotate the service account with the IAM role (get ARN from stack outputs):
```bash
kubectl -n kube-system annotate serviceaccount cluster-autoscaler \
  eks.amazonaws.com/role-arn=arn:aws:iam::ACCOUNT-ID:role/eks-cluster-autoscaler-role-<suffix>
```

3. Edit the deployment to set cluster name:
```bash
kubectl -n kube-system edit deployment cluster-autoscaler
```

Add the following to the container args:
```yaml
- --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/payment-cluster-<suffix>
- --balance-similar-node-groups
- --skip-nodes-with-system-pods=false
```

### Verify Pod Security Standards

```bash
# Check pod security policies
kubectl get psp

# Test pod security
kubectl auth can-i use psp/restricted --as=system:serviceaccount:default:default
```

### Test Systems Manager Access

Get an instance ID from the node group:
```bash
aws ec2 describe-instances --filters "Name=tag:Name,Values=bottlerocket-node-*" --query 'Reservations[0].Instances[0].InstanceId' --output text
```

Start a session:
```bash
aws ssm start-session --target <instance-id>
```

## Stack Outputs

The deployment provides the following outputs:

- **ClusterName**: EKS cluster name
- **ClusterArn**: EKS cluster ARN
- **ClusterEndpoint**: Private cluster endpoint URL
- **ClusterSecurityGroupId**: Cluster security group ID
- **VpcId**: VPC identifier
- **OidcProviderArn**: OIDC provider ARN for IRSA
- **NodeGroupName**: Managed node group name
- **ClusterAutoscalerRoleArn**: IAM role ARN for cluster autoscaler
- **WorkloadServiceAccountRoleArn**: Example workload service account IAM role

View outputs:
```bash
aws cloudformation describe-stacks --stack-name TapStack<suffix> --query 'Stacks[0].Outputs'
```

## Monitoring and Logging

### CloudWatch Logs

Control plane logs are available in CloudWatch Logs:
```bash
aws logs tail /aws/eks/payment-cluster-<suffix>/cluster --follow
```

Log groups created:
- `/aws/eks/payment-cluster-<suffix>/cluster` - All control plane logs

### CloudWatch Metrics

View EKS cluster metrics in the AWS Console:
- Navigate to CloudWatch > Metrics > EKS
- Select your cluster to view CPU, memory, and networking metrics

## Security Considerations

### Network Security
- Cluster endpoint is private (no public access)
- Nodes deployed in private subnets
- NAT Gateway for outbound internet access
- Security groups restrict traffic between components

### IAM Security
- Cluster role has minimal EKS permissions
- Node role includes Systems Manager for secure access
- Service accounts use IRSA for pod-level permissions
- Cluster autoscaler has scoped permissions

### Compliance
- All control plane API calls logged
- Audit logging enabled
- Bottlerocket OS provides minimal attack surface
- Pod security standards enforce baseline restrictions

## Troubleshooting

### Cluster Not Accessible

If kubectl cannot connect:
1. Verify you're on a machine with VPC access (cluster is private)
2. Check kubeconfig: `kubectl config view`
3. Verify IAM permissions: `aws sts get-caller-identity`

### Node Group Not Scaling

1. Check autoscaler logs:
```bash
kubectl logs -n kube-system deployment/cluster-autoscaler
```

2. Verify IAM role permissions
3. Check node group scaling configuration:
```bash
aws eks describe-nodegroup --cluster-name payment-cluster-<suffix> --nodegroup-name bottlerocket-ng-<suffix>
```

### Systems Manager Access Issues

1. Verify SSM agent is running on nodes (Bottlerocket includes it by default)
2. Check IAM role has `AmazonSSMManagedInstanceCore` policy
3. Verify node has outbound internet access for SSM endpoints

## Cost Estimation

Approximate monthly costs (us-east-1, on-demand pricing):

- **EKS Control Plane**: $73/month
- **NAT Gateway**: $32/month + data transfer
- **EC2 Instances**: 3x t3.large = ~$150/month (minimum)
- **CloudWatch Logs**: ~$5-10/month (7 day retention)
- **Total Base Cost**: ~$260-275/month (can scale up to $1,500/month at max 15 nodes)

## Cleanup

To destroy all resources:

```bash
cdk destroy --context environmentSuffix=<your-suffix>
```

**Note**: Ensure all Kubernetes workloads and LoadBalancers are deleted before destroying the stack to avoid orphaned resources.

## File Structure

```
.
├── bin/
│   └── tap.ts              # CDK app entry point
├── lib/
│   ├── tap-stack.ts        # Main EKS infrastructure stack
│   ├── PROMPT.md           # Original requirements
│   ├── MODEL_RESPONSE.md   # Implementation documentation
│   └── README.md           # This file
├── package.json            # Node.js dependencies
├── tsconfig.json           # TypeScript configuration
└── cdk.json               # CDK configuration
```

## AWS Services Used

- **Amazon EKS**: Managed Kubernetes control plane
- **Amazon VPC**: Network isolation
- **Amazon EC2**: Worker node instances (t3.large)
- **AWS IAM**: Identity and access management
- **AWS Systems Manager**: Secure node access
- **Amazon CloudWatch**: Logging and monitoring
- **Elastic Load Balancing**: (via Kubernetes services)
- **Auto Scaling**: Node group auto-scaling

## References

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Bottlerocket OS](https://aws.amazon.com/bottlerocket/)
- [EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [IRSA Documentation](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)

## Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review EKS cluster events: `kubectl get events --all-namespaces`
3. Verify IAM permissions and security group rules
4. Consult AWS EKS documentation

## License

This infrastructure code is provided as-is for deployment of payment processing infrastructure on AWS EKS.
