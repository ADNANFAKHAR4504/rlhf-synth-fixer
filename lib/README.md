# EKS Cluster with Advanced Container Orchestration

This infrastructure code deploys a production-ready Amazon EKS cluster with advanced container orchestration features using Pulumi with TypeScript.

## Architecture

The deployment includes:

1. **VPC Infrastructure**: Custom VPC with public and private subnets across 2 availability zones
2. **EKS Cluster**: Kubernetes v1.28 cluster with private endpoint access and OIDC provider for IRSA
3. **Node Groups**: Two managed node groups:
   - Spot instances (t3.medium/t3a.medium) for cost optimization
   - On-demand instances (t3.medium) for critical workloads
4. **Storage**: AWS EBS CSI driver with encryption enabled
5. **Load Balancing**: AWS Load Balancer Controller with IRSA for automatic ingress provisioning
6. **Auto-scaling**: Kubernetes Cluster Autoscaler with pod disruption budgets
7. **DNS Optimization**: CoreDNS with node-local DNS cache for reduced latency
8. **Security**:
   - RBAC with separate dev and prod namespaces
   - Pod security standards enforcement (baseline for dev, restricted for prod)
   - Network policies for namespace isolation
   - IRSA for pod-level AWS permissions
9. **Operational Excellence**:
   - Spot instance interruption handling
   - Pod disruption budgets for high availability
   - IRSA demonstration with sample workload

## Prerequisites

- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Node.js and npm installed
- kubectl installed (for cluster interaction)

## Deployment

### 1. Install Dependencies

