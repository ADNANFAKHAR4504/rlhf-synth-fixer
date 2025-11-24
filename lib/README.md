# Multi-OS EKS Cluster - CloudFormation Template

Production-ready Amazon EKS cluster with enhanced security controls for financial services applications. Supports both Linux and Windows workloads with private endpoints, KMS encryption, and IMDSv2 enforcement.

## Architecture

- **EKS Cluster**: Version 1.28+ with private API endpoint only
- **Node Groups**:
  - Linux (Amazon Linux 2): t3.medium, 2-10 nodes, Spot instances
  - Windows (Server 2022): t3.large, 1-5 nodes, Spot instances
- **Security**: KMS encryption, IMDSv2 enforcement, private endpoints
- **IRSA**: OIDC provider configured for IAM Roles for Service Accounts
- **Add-ons**: VPC CNI (with prefix delegation), CoreDNS, kube-proxy

## Prerequisites

1. **AWS Account** with appropriate permissions (EKS, EC2, IAM, KMS)
2. **VPC Infrastructure**:
   - VPC with private subnets across 3 availability zones
   - NAT gateways configured for outbound internet access
   - VPC ID and subnet IDs ready
3. **AWS CLI** v2.x configured with credentials
4. **kubectl** (optional, for post-deployment verification)

## Deployment

### Step 1: Validate Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.json \
  --region us-east-1
```

### Step 2: Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name eks-cluster-prod \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxxxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-aaa\\,subnet-bbb\\,subnet-ccc" \
    ParameterKey=EksVersion,ParameterValue=1.28 \
    ParameterKey=LinuxInstanceType,ParameterValue=t3.medium \
    ParameterKey=WindowsInstanceType,ParameterValue=t3.large \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 3: Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name eks-cluster-prod \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

Wait for status: `CREATE_COMPLETE` (typically 15-20 minutes)

### Step 4: Configure kubectl

```bash
aws eks update-kubeconfig \
  --name eks-cluster-prod \
  --region us-east-1
```

### Step 5: Verify Deployment

```bash
# Check cluster info
kubectl cluster-info

# Check nodes
kubectl get nodes -o wide

# Check system pods
kubectl get pods -A
```

## Parameters

| Parameter | Type | Description | Default | Required |
|-----------|------|-------------|---------|----------|
| EnvironmentSuffix | String | Unique suffix for resource naming | prod | Yes |
| VpcId | AWS::EC2::VPC::Id | VPC ID for cluster deployment | - | Yes |
| PrivateSubnetIds | List<AWS::EC2::Subnet::Id> | Private subnet IDs (3 AZs) | - | Yes |
| EksVersion | String | EKS cluster version | 1.28 | No |
| LinuxInstanceType | String | Linux node instance type | t3.medium | No |
| WindowsInstanceType | String | Windows node instance type | t3.large | No |

## Outputs

| Output | Description |
|--------|-------------|
| ClusterName | EKS cluster name |
| ClusterEndpoint | EKS API endpoint URL (private) |
| ClusterArn | EKS cluster ARN |
| OidcIssuerUrl | OIDC issuer URL for IRSA |
| OidcProviderArn | OIDC provider ARN |
| LinuxNodeGroupArn | Linux node group ARN |
| WindowsNodeGroupArn | Windows node group ARN |
| KmsKeyArn | KMS key ARN for encryption |
| ClusterSecurityGroupId | Cluster security group ID |

## Security Features

1. **Private Endpoint**: Cluster API accessible only from within VPC
2. **KMS Encryption**: Secrets and logs encrypted with customer-managed key
3. **IMDSv2 Enforcement**: All EC2 instances require IMDSv2 (hop limit 1)
4. **Control Plane Logging**: All log types enabled (api, audit, authenticator, controllerManager, scheduler)
5. **Spot Instances**: Cost-optimized with 100% Spot capacity
6. **IRSA Ready**: OIDC provider configured for pod-level IAM permissions

## Post-Deployment Configuration

### Enable IRSA for Pods

```bash
# Example: Create IAM role for service account
eksctl create iamserviceaccount \
  --name my-service-account \
  --namespace default \
  --cluster eks-cluster-prod \
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess \
  --approve \
  --region us-east-1
```

### Deploy Windows Workload

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: windows-pod
spec:
  nodeSelector:
    kubernetes.io/os: windows
  containers:
  - name: windows-container
    image: mcr.microsoft.com/windows/servercore:ltsc2022
```

## Cleanup

```bash
# Delete stack
aws cloudformation delete-stack \
  --stack-name eks-cluster-prod \
  --region us-east-1

# Monitor deletion
aws cloudformation describe-stacks \
  --stack-name eks-cluster-prod \
  --region us-east-1
```

## Design Decisions

1. **100% Spot Instances**: CloudFormation's AWS::EKS::Nodegroup doesn't support mixed instance policies. Template uses 100% Spot (exceeds 50% requirement) for maximum cost savings.

2. **VPC as Parameter**: VPC and subnets passed as parameters for flexibility. Create VPC separately using VPC CloudFormation template or AWS Console.

3. **DeletionPolicy: Delete**: All resources cleanly deletable for testing and development. Review before production use.

4. **Windows Node Dependency**: Windows node group depends on Linux node group to ensure CoreDNS is running (requires Linux nodes).

## Troubleshooting

### Cluster Creation Fails
- Verify VPC and subnet IDs are correct
- Ensure subnets are in at least 2 availability zones
- Check IAM permissions for CloudFormation, EKS, EC2

### Nodes Not Joining
- Verify NAT gateways are configured for private subnets
- Check security group rules
- Review node group IAM role permissions

### Windows Nodes Not Ready
- Ensure Linux node group is healthy first
- Check CoreDNS pods are running
- Verify Windows AMI is available in region

## Cost Optimization

- Spot instances provide 50-90% cost savings vs On-Demand
- t3.medium Linux nodes: ~$0.0125/hour (Spot)
- t3.large Windows nodes: ~$0.0374/hour (Spot)
- Estimated monthly cost (3 Linux + 2 Windows running 24/7): ~$50-100

## Compliance

- ✅ Private endpoints only
- ✅ KMS encryption enabled
- ✅ IMDSv2 enforced
- ✅ All resources tagged
- ✅ Control plane logging enabled
- ✅ IRSA configured

## Support

For issues or questions:
1. Review CloudFormation events in AWS Console
2. Check EKS cluster logs in CloudWatch
3. Verify node group status in EKS Console
4. Consult AWS EKS documentation
