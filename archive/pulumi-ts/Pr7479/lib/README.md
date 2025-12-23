# EKS Auto Scaling Groups Infrastructure

This Pulumi TypeScript project provisions a production-ready Amazon EKS cluster with managed node groups, Fargate profiles, and comprehensive networking configuration.

## Architecture

The infrastructure includes:

- **VPC**: Custom VPC (10.0.0.0/16) with 6 subnets across 3 availability zones
  - 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
  - 3 private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
  - NAT Gateways in each AZ for private subnet internet access

- **EKS Cluster**: Version 1.28 with private endpoint access
  - OIDC provider for IAM Roles for Service Accounts (IRSA)
  - Control plane logging enabled for all components
  - Encryption at rest using AWS-managed KMS keys

- **Managed Node Groups**:
  - General workload node group: 2-10 nodes, m5.large, Bottlerocket AMI
  - Compute-intensive node group: 1-5 nodes, m5.xlarge, Bottlerocket AMI
  - Both with auto-scaling and encryption at rest

- **Fargate Profile**: For kube-system namespace workloads

- **EKS Add-ons**:
  - VPC CNI (v1.15.1)
  - CoreDNS (v1.10.1)
  - kube-proxy (v1.28.2)

- **IAM Roles**:
  - Cluster role with required policies
  - Node role with worker policies
  - Fargate execution role
  - AWS Load Balancer Controller role with OIDC trust policy

## Prerequisites

- Pulumi CLI (v3.x or later)
- Node.js (v18 or later)
- AWS CLI configured with appropriate credentials
- IAM permissions to create VPC, EKS, EC2, and IAM resources

## Deployment

1. Set the environment suffix:
   ```bash
   export ENVIRONMENT_SUFFIX="prod"
   ```

2. Set the AWS region (default: us-east-1):
   ```bash
   export AWS_REGION="us-east-1"
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Preview the deployment:
   ```bash
   pulumi preview
   ```

5. Deploy the infrastructure:
   ```bash
   pulumi up
   ```

6. Get the kubeconfig:
   ```bash
   pulumi stack output kubeconfig --show-secrets > kubeconfig.json
   ```

## Resource Naming

All resources include the environment suffix for uniqueness:
- Format: `{resource-type}-{environment-suffix}`
- Example: `eks-cluster-prod`, `eks-vpc-staging`

## Security Features

- Private cluster endpoint (no public access)
- Bottlerocket AMI for enhanced security
- Encryption at rest for all node groups
- IRSA enabled for fine-grained IAM permissions
- IMDSv2 required for EC2 instances
- Security groups configured for cluster communication

## Outputs

The stack exports the following outputs:

- `vpcId`: The VPC ID
- `clusterName`: The EKS cluster name
- `clusterEndpoint`: The cluster API endpoint
- `clusterCertificateAuthority`: The cluster CA certificate
- `kubeconfig`: Complete kubeconfig for kubectl access

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Note: All resources are configured to be destroyable (no Retain policies).

## Cost Optimization

This configuration uses:
- Fargate for kube-system workloads (pay-per-pod)
- Auto-scaling node groups to match demand
- GP3 EBS volumes for cost-effective storage
- Bottlerocket AMI (free, optimized for containers)

Estimated monthly cost: $200-$500 depending on workload and scaling.
