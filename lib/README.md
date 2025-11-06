# EKS Cluster with Managed Node Groups

This CDK stack deploys a production-grade Amazon EKS cluster with managed node groups, IRSA support, and essential add-ons.

## Architecture Overview

The infrastructure includes:

1. VPC with 3 public and 3 private subnets across 3 availability zones
2. EKS Cluster version 1.28 with full control plane logging
3. OIDC Provider automatically configured for IRSA
4. Managed Node Group with t4g.medium (ARM64) instances with auto-scaling (3-9 nodes)
5. EBS CSI Driver installed as EKS add-on with IRSA role
6. AWS Load Balancer Controller IRSA role pre-configured
7. Launch Templates with IMDSv2 enforced and no SSH access
8. Tags for all resources: Environment=production and ManagedBy=CDK

## Prerequisites

- Node.js 18.x or later
- AWS CDK CLI 2.100.0 or later
- AWS CLI v2 configured with appropriate credentials
- kubectl 1.28+ (for cluster access)
- IAM permissions to create EKS clusters, VPCs, IAM roles, and related resources

## Installation

```bash
npm install
```

## Configuration

The stack uses an `environmentSuffix` parameter to support multiple environments:

```bash
# Set via CDK context
cdk deploy -c environmentSuffix=prod

# Or via environment variable
export ENVIRONMENT_SUFFIX=prod
cdk deploy
```

## Deployment

### Synthesize CloudFormation template

```bash
npm run build
cdk synth
```

### Deploy the stack

```bash
cdk deploy
```

The deployment will:
- Create a VPC with public and private subnets
- Deploy an EKS cluster with version 1.28
- Configure OIDC provider for IRSA
- Create a managed node group with t4g.medium instances
- Install EBS CSI driver add-on
- Set up IAM roles for EBS CSI and ALB Controller

### Configure kubectl

After deployment, use the output command to configure kubectl:

```bash
aws eks update-kubeconfig --region ap-southeast-1 --name eks-cluster-<suffix>
```

## Stack Outputs

The stack provides the following outputs:

- ClusterName: EKS cluster name
- ClusterEndpoint: EKS cluster API endpoint
- OidcProviderArn: OIDC provider ARN for IRSA
- KubectlConfigCommand: Command to configure kubectl
- VpcId: VPC ID
- NodeGroupName: Managed node group name
- EbsCsiRoleArn: IAM role ARN for EBS CSI driver
- AlbControllerRoleArn: IAM role ARN for AWS Load Balancer Controller
- ClusterSecurityGroupId: EKS cluster security group ID

## Post-Deployment Steps

### Install AWS Load Balancer Controller

```bash
# Add the EKS Helm repository
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install the controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=eks-cluster-<suffix> \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=<AlbControllerRoleArn>
```

### Verify EBS CSI Driver

```bash
kubectl get pods -n kube-system | grep ebs-csi
```

### Create a test PVC

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ebs-claim
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 4Gi
```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

## Security Features

- IMDSv2 Enforced: All EC2 instances require IMDSv2
- No SSH Access: Launch templates configured without SSH keys
- IRSA: IAM roles for service accounts enabled
- Control Plane Logging: All log types enabled
- Private Subnets: Node groups run in private subnets
- Systems Manager: SSM agent enabled for secure node access

## Cost Optimization

- Graviton Instances: t4g.medium for better price-performance
- Auto-scaling: Scales between 3-9 nodes based on demand
- Managed Node Groups: Reduced operational overhead

## Cleanup

To avoid ongoing charges, destroy the stack when no longer needed:

```bash
cdk destroy
```

Note: Ensure all Kubernetes resources (LoadBalancers, PersistentVolumes) are deleted before destroying the stack to avoid orphaned AWS resources.

## Troubleshooting

### Node group not scaling

Check the Cluster Autoscaler logs:
```bash
kubectl logs -n kube-system deployment/cluster-autoscaler
```

### EBS CSI driver issues

Verify the IRSA role:
```bash
kubectl describe sa ebs-csi-controller-sa -n kube-system
```

### OIDC provider issues

Verify the OIDC provider exists:
```bash
aws iam list-open-id-connect-providers
```

## Architecture Decisions

1. 3 NAT Gateways: High availability across all AZs (can be reduced to 1 for cost savings)
2. t4g.medium: ARM64 instances for cost optimization
3. Managed Node Groups: Simplified operations and updates
4. EKS 1.28: Stable version with long-term support
5. Launch Templates: Custom configurations for IMDSv2 and security

## License

This code is provided as-is for infrastructure deployment purposes.
