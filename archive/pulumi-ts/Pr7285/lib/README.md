# Production-Ready EKS Cluster for Microservices

This Pulumi TypeScript project deploys a complete, production-grade Amazon EKS cluster optimized for microservices workloads in a fintech environment.

## Architecture Overview

The infrastructure creates a highly available, secure EKS cluster with:

- VPC with public and private subnets across 3 availability zones
- EKS cluster v1.28 with private endpoint access only
- Two managed node groups using ARM Graviton3 instances
- OIDC provider enabled for IAM Roles for Service Accounts (IRSA)
- All five EKS control plane log types streaming to CloudWatch
- Essential EKS add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI driver)
- IAM roles configured for cluster autoscaler
- Comprehensive security groups and network isolation

## Prerequisites

- Pulumi CLI 3.x or higher
- Node.js 18+ with npm
- AWS CLI v2 configured with appropriate credentials
- AWS account with permissions to create EKS, VPC, IAM, and EC2 resources
- TypeScript 4.x or higher

## Project Structure

```
.
├── bin/
│   └── tap.ts              # Entry point with AWS provider configuration
├── lib/
│   ├── tap-stack.ts        # Main EKS infrastructure stack
│   ├── PROMPT.md           # Human-readable requirements
│   ├── MODEL_RESPONSE.md   # Complete implementation documentation
│   ├── IDEAL_RESPONSE.md   # Production-ready implementation summary
│   ├── MODEL_FAILURES.md   # Issues and resolutions
│   └── README.md           # This file
├── package.json            # Node.js dependencies
├── tsconfig.json           # TypeScript configuration
└── Pulumi.yaml             # Pulumi project configuration
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Pulumi Stack

```bash
# Initialize a new stack (e.g., dev, staging, prod)
pulumi stack init dev

# Set AWS region
pulumi config set aws:region us-east-1

# Set environment suffix (optional, defaults to 'dev')
export ENVIRONMENT_SUFFIX=dev
```

### 3. Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy the stack
pulumi up
```

### 4. Access the Cluster

After deployment, retrieve the kubeconfig:

```bash
# Get kubeconfig output
pulumi stack output kubeconfig --show-secrets > ~/.kube/config-eks-dev

# Set KUBECONFIG environment variable
export KUBECONFIG=~/.kube/config-eks-dev

# Verify cluster access
kubectl get nodes
```

## Infrastructure Components

### VPC and Networking

- **VPC CIDR**: 10.0.0.0/16
- **Public Subnets**: 3 subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
  - Used for NAT Gateways and load balancers
  - Internet Gateway for outbound internet access
- **Private Subnets**: 3 subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
  - Used for EKS worker nodes
  - NAT Gateways for outbound connectivity
  - No direct internet access
- **High Availability**: 3 NAT Gateways (one per AZ) for redundancy

### EKS Cluster

- **Version**: 1.28
- **Endpoint Access**: Private only (no public API access)
- **Control Plane Logging**:
  - API server logs
  - Audit logs
  - Authenticator logs
  - Controller Manager logs
  - Scheduler logs
- **Log Retention**: 30 days in CloudWatch Logs
- **OIDC Provider**: Enabled for IRSA functionality

### Node Groups

#### 1. General Purpose Node Group
- **Instance Type**: t4g.medium (2 vCPU, 4 GB RAM)
- **Architecture**: ARM64 (Graviton3)
- **Capacity**: 2-10 nodes (autoscaling)
- **AMI**: Amazon Linux 2 ARM64
- **Labels**:
  - node-type: general
  - workload: stateless
- **Use Case**: General workloads, stateless applications

#### 2. Compute Intensive Node Group
- **Instance Type**: c7g.large (2 vCPU, 4 GB RAM)
- **Architecture**: ARM64 (Graviton3)
- **Capacity**: 2-10 nodes (autoscaling)
- **AMI**: Amazon Linux 2 ARM64
- **Labels**:
  - node-type: compute
  - workload: compute-intensive
- **Use Case**: CPU-intensive workloads, batch processing

### EKS Add-ons

1. **VPC CNI** (v1.15.1): Pod networking
2. **CoreDNS** (v1.10.1): Service discovery
3. **kube-proxy** (v1.28.2): Network proxy
4. **EBS CSI Driver** (v1.25.0): Persistent volume support with encryption

### IAM and IRSA

#### Cluster Role
- AmazonEKSClusterPolicy
- AmazonEKSVPCResourceController

#### Node Role
- AmazonEKSWorkerNodePolicy
- AmazonEKS_CNI_Policy
- AmazonEC2ContainerRegistryReadOnly

#### Cluster Autoscaler Role (IRSA)
- Custom policy for autoscaling operations
- Trust policy for kube-system:cluster-autoscaler service account
- Scoped to resources with proper tags

#### EBS CSI Driver Role (IRSA)
- AmazonEBSCSIDriverPolicy
- Trust policy for kube-system:ebs-csi-controller-sa service account

### Security

- Private endpoint access only
- Worker nodes in private subnets
- Security groups with least privilege principles
- IRSA for pod-level AWS permissions
- No static credentials

## Cluster Autoscaler Setup

To deploy the cluster autoscaler:

```bash
# Create service account
kubectl create serviceaccount cluster-autoscaler -n kube-system

# Annotate with IAM role ARN (get from Pulumi output)
ROLE_ARN=$(pulumi stack output clusterAutoscalerRoleArn)
kubectl annotate serviceaccount cluster-autoscaler -n kube-system \
  eks.amazonaws.com/role-arn=$ROLE_ARN

# Deploy cluster autoscaler
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

# Edit deployment to add cluster name
CLUSTER_NAME=$(pulumi stack output clusterName)
kubectl -n kube-system edit deployment.apps/cluster-autoscaler
# Add --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/${CLUSTER_NAME}
```

## Outputs

The stack exports the following outputs:

- **vpcId**: VPC identifier
- **clusterName**: EKS cluster name
- **clusterEndpoint**: EKS API server endpoint URL
- **clusterOidcProviderUrl**: OIDC provider URL for IRSA
- **clusterOidcProviderArn**: OIDC provider ARN
- **kubeconfig**: Complete kubeconfig in JSON string format
- **kubeconfigJson**: Kubeconfig as a JSON object
- **generalNodeGroupName**: General purpose node group name
- **computeNodeGroupName**: Compute intensive node group name
- **clusterAutoscalerRoleArn**: IAM role ARN for cluster autoscaler

## Resource Tagging

All resources are tagged with:

- **Environment**: production
- **Team**: platform
- **CostCenter**: engineering
- **Repository**: (from CI/CD)
- **Author**: (from CI/CD)
- **PRNumber**: (from CI/CD)
- **CreatedAt**: ISO timestamp
- **ManagedBy**: Pulumi

## Cost Optimization

- ARM Graviton3 instances provide better price/performance
- Autoscaling reduces costs during low utilization
- Managed node groups reduce operational overhead
- 30-day log retention (not indefinite)
- Spot instances can be enabled for non-critical workloads

## Monitoring and Observability

### CloudWatch Logs
All EKS control plane logs are streamed to CloudWatch with 30-day retention:
- `/aws/eks/cluster-{environmentSuffix}/logs`

### Kubernetes Metrics
Use AWS Container Insights or Prometheus for node and pod metrics:

```bash
# Install metrics-server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# View node metrics
kubectl top nodes

# View pod metrics
kubectl top pods -A
```

## Security Best Practices

1. Private API endpoint (no public access)
2. Worker nodes in private subnets
3. IRSA for pod-level permissions
4. Security groups with minimal rules
5. Encrypted EBS volumes
6. Control plane audit logging enabled
7. Regular AMI updates for worker nodes
8. Network policies for pod-to-pod communication

## Troubleshooting

### Cannot connect to cluster
- Ensure you're connecting from a network that can reach the private endpoint
- Verify kubeconfig is correctly configured
- Check security group rules

### Nodes not joining cluster
- Check CloudWatch Logs for kubelet errors
- Verify IAM role has required policies
- Ensure NAT Gateways are functioning

### Pods cannot pull images
- Verify ECR permissions in node IAM role
- Check VPC endpoints for ECR if using private subnets

### Autoscaler not scaling
- Verify cluster autoscaler role ARN is correct
- Check cluster autoscaler logs: `kubectl logs -n kube-system -l app=cluster-autoscaler`
- Ensure node groups have proper tags

## Cleanup

To destroy all resources:

```bash
# Preview destruction
pulumi destroy --preview-only

# Destroy the stack
pulumi destroy

# Remove the stack
pulumi stack rm dev
```

Warning: This will delete all resources including the EKS cluster, VPC, and associated resources.

## Support and Documentation

- [Pulumi EKS Documentation](https://www.pulumi.com/docs/guides/crosswalk/aws/eks/)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

## License

This infrastructure code is part of the TAP (Test Automation Platform) project.
