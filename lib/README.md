# Production-Ready EKS Cluster with Pulumi TypeScript

This project deploys a production-ready Amazon EKS cluster with advanced security configurations, monitoring, and automated node management using Pulumi and TypeScript.

## Features

- **EKS Cluster**: Version 1.28 with private endpoint access and encrypted secrets
- **VPC**: Custom VPC with public and private subnets across 3 availability zones
- **Managed Node Groups**: Mixed instance types (t3.medium, t3.large) using Spot capacity
- **IRSA**: IAM Roles for Service Accounts with OIDC provider
- **Security**: KMS encryption, pod security standards, private endpoints
- **Monitoring**: CloudWatch Container Insights with enhanced metrics
- **Access**: AWS Systems Manager Session Manager for secure node access
- **Autoscaling**: Cluster Autoscaler with Spot instance awareness
- **Add-ons**: CoreDNS v1.10.1, kube-proxy v1.28.1, vpc-cni v1.14.1

## Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI installed (v3.x)
- Node.js 20+ and npm 10+
- kubectl installed

## Configuration

Set the environment suffix for resource naming:

```bash
pulumi config set environmentSuffix dev
```

## Deployment

1. Install dependencies:

```bash
npm install
```

2. Deploy the stack:

```bash
pulumi up
```

3. Save the kubeconfig:

```bash
pulumi stack output kubeconfig > kubeconfig.json
export KUBECONFIG=./kubeconfig.json
```

4. Verify cluster access:

```bash
kubectl get nodes
kubectl get pods -A
```

## Accessing Nodes via SSM

To access a node using Session Manager:

```bash
# List nodes
kubectl get nodes

# Get instance ID from node
aws ec2 describe-instances --filters "Name=tag:Name,Values=eks-node-*" --query 'Reservations[*].Instances[*].[InstanceId,Tags[?Key==`Name`].Value|[0]]' --output table

# Start session
aws ssm start-session --target <instance-id>
```

## Service Accounts with IRSA

Two service accounts are created with IAM role bindings:

1. **s3-access-sa**: Read access to S3 buckets
2. **dynamodb-access-sa**: Read access to DynamoDB tables

Example pod using service account:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: s3-app
  namespace: default
spec:
  serviceAccountName: s3-access-sa
  containers:
  - name: app
    image: amazon/aws-cli
    command: ['sh', '-c', 'aws s3 ls && sleep 3600']
```

## Cluster Autoscaler

The Cluster Autoscaler is automatically configured and deployed. It will:

- Scale node groups based on pending pods
- Remove underutilized nodes
- Handle Spot instance interruptions
- Balance similar node groups

## Monitoring

CloudWatch Container Insights is enabled for comprehensive monitoring:

- Container and pod metrics
- Node performance metrics
- Cluster-level insights
- Log aggregation

View metrics in the AWS Console under CloudWatch > Container Insights.

## Security Features

1. **Encryption**:
   - EKS secrets encrypted with KMS
   - EBS volumes encrypted
   - Automatic key rotation enabled

2. **Network Security**:
   - Private endpoint access only
   - Nodes in private subnets
   - Security groups with least privilege

3. **Pod Security**:
   - Restricted baseline enforced on default namespace
   - Pod Security Standards configured

4. **IAM**:
   - IRSA for pod-level permissions
   - SSM access for secure node management
   - Least privilege IAM policies

## Resource Naming

All resources include the environment suffix for uniqueness and easy identification:

- EKS Cluster: `eks-cluster-{environmentSuffix}`
- VPC: `eks-vpc-{environmentSuffix}`
- Node Groups: `eks-nodegroup-{environmentSuffix}`
- KMS Key: `eks-secrets-key-{environmentSuffix}`

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Cost Optimization

This deployment uses several cost-optimization strategies:

1. **Spot Instances**: Primary node capacity uses Spot instances
2. **Auto-scaling**: Nodes scale down during low usage
3. **Efficient Instance Types**: t3.medium as primary instance type
4. **NAT Gateway**: One per AZ (can be reduced to one for dev environments)

## Troubleshooting

### Cluster Autoscaler not scaling

Check logs:
```bash
kubectl logs -n kube-system deployment/cluster-autoscaler
```

### Pod cannot assume IAM role

Verify service account annotation:
```bash
kubectl describe sa <service-account-name> -n <namespace>
```

Check OIDC provider:
```bash
aws iam list-open-id-connect-providers
```

### Cannot access cluster

Ensure kubeconfig is current:
```bash
pulumi stack output kubeconfig > kubeconfig.json
export KUBECONFIG=./kubeconfig.json
kubectl cluster-info
```

## Outputs

- `clusterName`: EKS cluster name
- `clusterEndpoint`: EKS cluster endpoint
- `oidcIssuerUrl`: OIDC provider URL for IRSA
- `kubeconfig`: Complete kubeconfig for kubectl access
- `kmsKeyArn`: KMS key ARN for encryption
- `vpcId`: VPC ID
- `privateSubnetIds`: Private subnet IDs
- `publicSubnetIds`: Public subnet IDs

## Tags

All resources are tagged with:

- `Environment`: production
- `ManagedBy`: pulumi
- `CostCenter`: engineering
- `Project`: eks-cluster-{environmentSuffix}

## References

- [Amazon EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [Pulumi AWS EKS Documentation](https://www.pulumi.com/docs/clouds/aws/guides/eks/)
- [Kubernetes Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)
- [IAM Roles for Service Accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
