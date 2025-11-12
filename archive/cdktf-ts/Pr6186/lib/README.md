# Production-Ready EKS Cluster on AWS

This infrastructure code deploys a production-ready Amazon EKS cluster using CDKTF with TypeScript, featuring enhanced security, cost optimization, and high availability.

## Architecture

### Components

- **VPC Infrastructure**: Custom VPC with public and private subnets across 3 availability zones
- **EKS Cluster**: Version 1.28 with private endpoint access and control plane logging
- **Managed Node Groups**:
  - General workload nodes: 2-10 nodes (t3.medium, t3.large)
  - GPU workload nodes: 0-3 nodes (g4dn.xlarge)
- **OIDC Provider**: Configured for IRSA (IAM Roles for Service Accounts)
- **EKS Add-ons**: vpc-cni, kube-proxy, coredns
- **Security**: Proper security groups, IAM roles, and CloudWatch logging

### Network Design

- **VPC CIDR**: 10.0.0.0/16
- **Public Subnets**: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
- **Private Subnets**: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24
- **NAT Gateways**: One per availability zone for high availability
- **Internet Gateway**: For public subnet internet access

## Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- CDKTF CLI installed: `npm install -g cdktf-cli`
- Terraform 1.5+
- kubectl installed

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Set the environment suffix for resource naming:

```bash
export ENVIRONMENT_SUFFIX="prod"
```

### 3. Deploy Infrastructure

```bash
# Synthesize Terraform configuration
cdktf synth

# Deploy the stack
cdktf deploy
```

The deployment will create:
- VPC with networking components (10-15 minutes)
- EKS cluster (15-20 minutes)
- Node groups (5-10 minutes)
- OIDC provider and IAM roles
- EKS add-ons

Total deployment time: ~30-40 minutes

### 4. Configure kubectl

After deployment, configure kubectl using the output command:

```bash
aws eks update-kubeconfig --region us-east-2 --name eks-cluster-<environmentSuffix>
```

Verify cluster access:

```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

## IRSA Example - S3 Access

The infrastructure includes an example IRSA configuration for S3 access. To use it:

### 1. Create Service Account

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: s3-access-sa
  namespace: default
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::<account-id>:role/s3-access-irsa-role-<environmentSuffix>
```

Apply the service account:

```bash
kubectl apply -f service-account.yaml
```

### 2. Use in Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: s3-test-pod
  namespace: default
spec:
  serviceAccountName: s3-access-sa
  containers:
  - name: aws-cli
    image: amazon/aws-cli
    command: ["sleep", "3600"]
```

### 3. Verify IRSA

```bash
kubectl exec -it s3-test-pod -- aws sts get-caller-identity
kubectl exec -it s3-test-pod -- aws s3 ls
```

## Cluster Autoscaler

The node groups are tagged for cluster autoscaler support. To deploy cluster autoscaler:

### 1. Create IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:DescribeLaunchConfigurations",
        "autoscaling:DescribeScalingActivities",
        "autoscaling:DescribeTags",
        "ec2:DescribeInstanceTypes",
        "ec2:DescribeLaunchTemplateVersions"
      ],
      "Resource": ["*"]
    },
    {
      "Effect": "Allow",
      "Action": [
        "autoscaling:SetDesiredCapacity",
        "autoscaling:TerminateInstanceInAutoScalingGroup",
        "ec2:DescribeImages",
        "ec2:GetInstanceTypesFromInstanceRequirements",
        "eks:DescribeNodegroup"
      ],
      "Resource": ["*"]
    }
  ]
}
```

### 2. Deploy Cluster Autoscaler

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml
```

Edit the deployment to set cluster name:

```bash
kubectl -n kube-system edit deployment cluster-autoscaler
```

Add cluster name to container command:
```
--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/eks-cluster-<environmentSuffix>
```

## Security Features

### Control Plane Logging

Control plane logs are sent to CloudWatch Logs:
- Audit logs: API server audit logs
- Authenticator logs: Authentication attempts
- Controller Manager logs: Controller operations

Access logs:

```bash
aws logs tail /aws/eks/eks-cluster-<environmentSuffix>/cluster --follow
```

### Security Groups

- **Cluster Security Group**: Controls traffic to/from control plane
- **Node Security Group**: Controls traffic to/from worker nodes
- **Rules**:
  - Nodes can communicate with control plane on 443
  - Control plane can communicate with nodes on 443 and 10250
  - Nodes can communicate with each other on all ports

### Network Isolation

- Worker nodes run in private subnets with no direct internet access
- Outbound internet access via NAT gateways
- Load balancers use public subnets

## Cost Optimization

### Strategies Implemented

1. **Mixed Instance Types**: t3.medium and t3.large for general workloads
2. **GPU Auto-Scaling**: GPU nodes scale to zero when not in use
3. **Cluster Autoscaler**: Automatically adjusts node count based on demand
4. **7-Day Log Retention**: CloudWatch logs retained for 7 days

### Cost Estimates (us-east-2)

- **Minimum (2 t3.medium nodes)**: ~$60/month
- **Typical (5 t3.large nodes)**: ~$370/month
- **Maximum (10 t3.large + 3 g4dn.xlarge)**: ~$1,870/month

Additional costs:
- EKS cluster: $0.10/hour (~$73/month)
- NAT gateways: $0.045/hour x 3 (~$97/month)
- CloudWatch logs: Minimal (<$5/month)

## Monitoring

### CloudWatch Logs

Control plane logs are available in CloudWatch:

```bash
aws logs describe-log-streams --log-group-name /aws/eks/eks-cluster-<environmentSuffix>/cluster
```

### Cluster Health

```bash
# Check cluster status
aws eks describe-cluster --name eks-cluster-<environmentSuffix> --region us-east-2

# Check node group status
aws eks describe-nodegroup --cluster-name eks-cluster-<environmentSuffix> --nodegroup-name general-node-group-<environmentSuffix> --region us-east-2

# Check add-ons
aws eks list-addons --cluster-name eks-cluster-<environmentSuffix> --region us-east-2
```

### Kubernetes Monitoring

```bash
# Node status
kubectl get nodes -o wide

# Pod status across all namespaces
kubectl get pods --all-namespaces

# Check system pods
kubectl get pods -n kube-system

# Describe node
kubectl describe node <node-name>
```

## Troubleshooting

### Nodes Not Joining Cluster

Check node IAM role and security groups:

```bash
# Verify node role
aws iam get-role --role-name eks-node-role-<environmentSuffix>

# Verify security group rules
aws ec2 describe-security-groups --group-ids <node-sg-id>
```

### Add-on Issues

Check add-on status:

```bash
aws eks describe-addon --cluster-name eks-cluster-<environmentSuffix> --addon-name vpc-cni --region us-east-2
```

Update add-on if needed:

```bash
aws eks update-addon --cluster-name eks-cluster-<environmentSuffix> --addon-name vpc-cni --resolve-conflicts OVERWRITE --region us-east-2
```

### IRSA Not Working

Verify OIDC provider configuration:

```bash
aws iam list-open-id-connect-providers

# Verify service account annotation
kubectl describe sa s3-access-sa -n default

# Check pod identity
kubectl exec -it <pod-name> -- env | grep AWS
```

## Cleanup

To destroy all resources:

```bash
# Destroy the infrastructure
cdktf destroy

# Confirm destruction
```

**Warning**: This will delete:
- EKS cluster and all workloads
- VPC and networking components
- NAT gateways, internet gateway
- CloudWatch log groups
- IAM roles and policies

Ensure you have backed up any critical data before destroying.

## Outputs

After deployment, the following outputs are available:

- `cluster-endpoint`: EKS cluster API endpoint
- `cluster-certificate-authority`: Certificate authority data (sensitive)
- `oidc-provider-url`: OIDC provider URL for IRSA
- `cluster-name`: Name of the EKS cluster
- `region`: AWS region
- `vpc-id`: VPC identifier
- `kubectl-config-command`: Command to configure kubectl

Access outputs:

```bash
cdktf output
```

## Additional Resources

- [EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [IRSA Documentation](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)
- [EKS Add-ons](https://docs.aws.amazon.com/eks/latest/userguide/eks-add-ons.html)

## Support

For issues or questions:
1. Check CloudWatch logs for control plane issues
2. Review security group rules
3. Verify IAM roles and policies
4. Check node group status in AWS console
