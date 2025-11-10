# Production-Ready EKS Cluster Deployment

Hey team,

We've been asked to deploy a production-grade Kubernetes cluster on AWS for a fintech startup. They're running microservices architecture and need both CPU-based services and GPU-powered ML workloads for fraud detection. The infrastructure needs to be secure, cost-optimized, and production-ready from day one.

I need to build this using **CDKTF with TypeScript**. The business is very clear about wanting proper security controls, cost management with autoscaling, and all the production features like audit logging and role-based access. They've specified EKS version 1.28 running across three availability zones in the us-east-2 region.

The cluster setup is fairly comprehensive. We need two types of worker nodes: general purpose nodes for regular workloads that can scale between 2-10 nodes using t3.medium and t3.large instances, and a separate GPU node group for their ML services that scales from 0-3 nodes using g4dn.xlarge instances. Both need intelligent autoscaling to keep costs under control.

Security is a big focus here. All worker nodes must run in private subnets with no direct internet access. We need to implement IRSA (IAM Roles for Service Accounts) so pods can get AWS permissions without sharing node credentials. The cluster control plane needs audit logging enabled for compliance requirements. We also need proper security groups that restrict communication to only what's necessary between nodes and the control plane.

## What we need to build

Create a production-ready EKS cluster using **CDKTF with TypeScript** that supports both CPU and GPU workloads with enhanced security and cost optimization.

### Core Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS cluster version 1.28 in us-east-2 region
   - Run across 3 availability zones for high availability
   - Place all worker nodes in private subnets only
   - Configure OIDC provider for IRSA support
   - Enable control plane logging for audit, authenticator, and controllerManager to CloudWatch

2. **Managed Node Groups**
   - General workload node group: 2-10 nodes using t3.medium and t3.large instances
   - GPU workload node group: 0-3 nodes using g4dn.xlarge instances
   - Enable cluster autoscaling for both groups with appropriate policies
   - Configure mixed instance types for cost optimization
   - Use only managed node groups (no self-managed nodes)

3. **EKS Add-ons Management**
   - Configure vpc-cni add-on with version management
   - Configure kube-proxy add-on with version management
   - Configure coredns add-on with version management
   - Use Terraform-managed EKS add-ons

4. **IAM and Security**
   - Set up OIDC provider for the cluster
   - Create IRSA example for S3 access (service account with IAM role)
   - Configure IAM roles and policies for node groups
   - Create aws-auth ConfigMap for user/role access management
   - Implement proper security group rules (nodes to control plane communication)

5. **Networking and Access**
   - Private subnets for worker nodes with NAT gateway connectivity
   - Public subnets for load balancers
   - Proper security group configuration
   - No direct internet access for worker nodes

6. **Outputs and Configuration**
   - Cluster endpoint URL
   - Certificate authority data
   - OIDC provider URL
   - Example kubectl configuration commands

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **Amazon EKS** for Kubernetes cluster management
- Use **VPC** with private and public subnets across 3 availability zones
- Use **EC2** managed node groups for worker nodes
- Use **IAM** for roles, policies, and OIDC provider configuration
- Use **CloudWatch** for control plane logging
- Use **Auto Scaling** for node group capacity management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: eks-cluster-environment-suffix, node-group-environment-suffix
- Deploy to **us-east-2** region
- EKS cluster version must be 1.28 or higher

### Constraints

- Must use EKS version 1.28 or higher with managed node groups only
- All worker nodes must run in private subnets with no direct internet access
- Must implement IRSA (IAM Roles for Service Accounts) with OIDC provider
- Must configure EKS add-ons using Terraform (vpc-cni, kube-proxy, coredns)
- Must enable control plane logging for audit, authenticator, and controllerManager
- Must implement cluster autoscaling with mixed instance types for cost optimization
- Must apply consistent tagging: Environment=production, Team=platform, CostCenter=engineering
- All resources must be destroyable (no Retain policies or DeletionProtection)
- Include proper error handling and logging
- Security groups must allow only necessary communication

## Success Criteria

- **Functionality**: EKS cluster deploys successfully with both CPU and GPU node groups
- **Scalability**: Autoscaling configured properly for both node groups with appropriate min/max values
- **Security**: OIDC provider configured, IRSA example working, proper security groups, audit logging enabled
- **Cost Optimization**: Mixed instance types configured, autoscaling prevents over-provisioning
- **Reliability**: High availability across 3 AZs, managed node groups for easier operations
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Code Quality**: TypeScript, well-tested, modular structure with separate constructs
- **Compliance**: Audit logging enabled, all resources properly tagged

## What to deliver

- Complete CDKTF TypeScript implementation with modular structure
- EKS cluster construct with version 1.28
- VPC and networking configuration (private/public subnets, NAT gateways)
- Two managed node groups (general and GPU workloads)
- OIDC provider and IRSA configuration with S3 access example
- EKS add-ons configuration (vpc-cni, kube-proxy, coredns)
- IAM roles and policies for node groups and service accounts
- Security groups with proper ingress/egress rules
- CloudWatch log groups for control plane logging
- aws-auth ConfigMap for cluster access management
- Outputs for cluster endpoint, certificate authority, OIDC URL
- Unit tests for all components with 90%+ coverage target
- Integration tests using cluster outputs
- Documentation and deployment instructions in README
