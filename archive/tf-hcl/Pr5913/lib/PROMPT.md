Hey team,

We need to build a production-ready Amazon EKS cluster for our fintech startup's microservices deployment. I've been asked to create this infrastructure using Terraform with HCL. The business needs a secure, cost-optimized Kubernetes platform that can handle auto-scaling workloads while meeting strict security requirements.

The architecture needs to support our microservices with advanced features like IRSA for fine-grained permissions, encryption for all secrets, and mixed instance types for cost savings. We're deploying across multiple availability zones in us-east-1 for high availability.

## What we need to build

Create a production-grade EKS cluster infrastructure using **Terraform with HCL** for deploying microservices on AWS.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 3 public and 3 private subnets across different availability zones
   - NAT gateways for outbound connectivity from private subnets
   - Internet gateway for public subnet access
   - Route tables configured appropriately for each subnet type

2. **EKS Cluster Configuration**
   - EKS cluster with private API endpoint accessible only from within the VPC
   - Kubernetes version 1.28 or higher
   - OIDC provider configuration for IAM Roles for Service Accounts (IRSA)
   - CloudWatch log groups for all control plane logs (api, audit, authenticator, controllerManager, scheduler)

3. **Node Groups with Cost Optimization**
   - Managed node groups using mixed instance types (t3.medium and t3.large)
   - Spot instances with on-demand fallback for cost optimization
   - Nodes deployed across at least 3 availability zones in private subnets
   - Auto-scaling capabilities with appropriate min/max settings

4. **Security Features**
   - KMS key for envelope encryption of Kubernetes secrets
   - Proper key policies for KMS access control
   - Security groups allowing inter-node communication
   - Security groups allowing ingress from load balancers
   - IRSA implementation with sample IAM role for pods

5. **IAM and Permissions**
   - EKS cluster IAM role with required policies
   - Node group IAM role with EC2, ECR, and CNI policies
   - Cluster autoscaler IAM role with appropriate permissions
   - OIDC provider for pod-level IAM permissions

6. **Monitoring and Logging**
   - CloudWatch log groups for EKS control plane logs
   - All log types enabled (api, audit, authenticator, controllerManager, scheduler)
   - Appropriate retention policies for cost management

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **Amazon EKS** for Kubernetes cluster management
- Use **EC2** for worker nodes in managed node groups
- Use **AWS KMS** for secrets encryption
- Use **CloudWatch** for logging and monitoring
- Use **IAM** for access control and OIDC integration
- Resource names must include **environment_suffix** variable for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **us-east-1** region
- Terraform version 1.5 or higher required
- AWS provider version 5.x required

### Constraints

- EKS cluster API endpoint must be private (accessible only from VPC)
- Node groups must use Spot instances for cost optimization
- Enable all EKS cluster logging types to CloudWatch
- Use AWS KMS customer-managed key for secrets encryption
- Configure OIDC provider for the EKS cluster
- Node groups must span at least 3 availability zones
- Implement cluster autoscaler with appropriate IAM permissions
- All resources must be destroyable (no Retain policies or DeletionProtection)
- Use variables for cluster name, Kubernetes version, and node group sizes
- Create modular configuration with separate files for organization

### File Structure

The configuration should be organized into:
- vpc.tf - Network infrastructure (VPC, subnets, gateways, routes)
- eks.tf - EKS cluster configuration and logging
- nodes.tf - Node group configuration with mixed instances
- iam.tf - IAM roles and policies for cluster, nodes, and IRSA
- security.tf - Security groups and KMS keys
- outputs.tf - Cluster endpoint, certificate authority, OIDC provider URL
- variables.tf - Input variables for customization
- provider.tf already exists with AWS provider configuration

## Success Criteria

- **Functionality**: EKS cluster deployed successfully with private API endpoint
- **Performance**: Node groups auto-scale based on workload demands
- **Reliability**: Multi-AZ deployment for high availability
- **Security**: KMS encryption enabled, IRSA configured, security groups properly restricted
- **Cost Optimization**: Mixed instance types with Spot instances reduce infrastructure costs
- **Monitoring**: All control plane logs flowing to CloudWatch
- **Resource Naming**: All resources include environment_suffix variable
- **Code Quality**: HCL, modular structure, well-documented

## What to deliver

- Complete Terraform HCL implementation
- VPC with public and private subnets across 3 AZs
- EKS cluster with private API endpoint
- Managed node groups with Spot instances
- IAM roles for cluster, nodes, autoscaler, and IRSA
- KMS key for secrets encryption
- Security groups for cluster and nodes
- CloudWatch log groups for control plane logs
- OIDC provider configuration
- Output values for cluster endpoint, certificate authority, and OIDC URL
- Variables for customization (cluster name, K8s version, node sizes)
