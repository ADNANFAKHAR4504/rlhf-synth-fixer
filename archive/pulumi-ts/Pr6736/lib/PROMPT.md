Hey team,

We need to build a production-grade EKS cluster infrastructure for deploying containerized applications. I've been asked to create this in TypeScript using Pulumi. The business wants a highly available Kubernetes environment that can handle both stable workloads and burst capacity efficiently.

The current requirement is to establish a complete EKS cluster with proper networking, security, and operational capabilities. This needs to support both on-demand workloads for production stability and spot instances for cost-effective scaling. We also need to integrate AWS Load Balancer Controller for ingress management and ensure proper IAM role-based access control for different environments.

## What we need to build

Create a complete EKS cluster infrastructure using **Pulumi with TypeScript** for deploying containerized applications on AWS.

### Core Requirements

1. **VPC Networking**
   - VPC with 3 public subnets and 3 private subnets across 3 availability zones
   - Proper subnet tagging for EKS and load balancer discovery
   - Internet Gateway and NAT Gateways for outbound connectivity

2. **EKS Cluster Configuration**
   - EKS cluster version 1.28
   - OIDC provider for IRSA (IAM Roles for Service Accounts)
   - Both public and private endpoint access enabled
   - Proper cluster encryption and logging

3. **Node Groups**
   - On-demand node group: t3.medium instances with scaling 2-6 nodes (desired 3)
   - Spot node group: t3.large instances with scaling 1-4 nodes (desired 2)
   - Both node groups in private subnets

4. **Security Configuration**
   - Security Groups for Pods using VPC CNI addon
   - CNI addon configuration with POD_SECURITY_GROUP_ENFORCING_MODE set to 'standard'
   - Proper IAM roles for node groups with required policies

5. **Cluster Add-ons**
   - Cluster autoscaler with IRSA configuration for automatic node scaling
   - AWS Load Balancer Controller with IRSA for ingress management
   - CoreDNS with custom forwarding configured to forward requests to 10.0.0.2
   - kube-proxy and VPC CNI addons

6. **IAM Roles and RBAC**
   - Create three IAM roles: dev-role, staging-role, and prod-role
   - Map these roles to Kubernetes RBAC groups using cluster roleMappings
   - Each role should have appropriate EKS access policies

7. **Fargate Profile**
   - Fargate profile for kube-system namespace
   - Dedicated IAM role for Fargate pod execution

8. **Outputs**
   - Cluster name and endpoint
   - OIDC provider URL and ARN
   - VPC and subnet IDs
   - Node group names and IAM role ARNs

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **@pulumi/eks** package for EKS cluster creation
- Use **@pulumi/aws** for AWS resources
- Use **@pulumi/kubernetes** for Kubernetes resources
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-environment-suffix`
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

**Environment Suffix**: ALL resource names must include environmentSuffix parameter for uniqueness. This is mandatory for parallel deployments. Use pattern: `resource-name-${environmentSuffix}`

**Destroyability**: All resources must be destroyable after testing. Do not use RemovalPolicy RETAIN or DeletionProtection flags. The infrastructure must support clean teardown.

**IAM Role Handling**: When working with IAM role outputs, use `pulumi.output(aws.getCallerIdentity())` and chain with `.apply()` method correctly to handle the Promise-based nature of Pulumi outputs.

**CoreDNS Configuration**: Use `kubernetes.core.v1.ConfigMapPatch` to modify the CoreDNS Corefile ConfigMap after cluster creation. Add custom forwarding rule to forward DNS queries to 10.0.0.2.

**Node Group and Fargate IAM Roles**: Create explicit IAM roles with proper policies. Do not rely on automatically generated roles or non-existent properties.

**EKS RBAC Mapping**: Use the EKS cluster's `roleMappings` parameter to map IAM roles to Kubernetes groups. This integrates IAM authentication with Kubernetes RBAC.

**Endpoint Access**: Cluster must have both public and private endpoint access enabled for operational flexibility.

### Constraints

- Use latest stable versions of Pulumi packages
- Follow AWS EKS best practices for production workloads
- All IAM policies should follow least privilege principle
- Proper error handling and logging must be included
- All resources must be destroyable (no Retain policies)
- Include proper tags for resource management

## Success Criteria

- **Functionality**: Complete EKS cluster with working node groups and Fargate profile
- **Security**: Proper IAM roles, security groups, and pod security enforcement
- **Networking**: Working VPC with public/private subnet separation
- **Scalability**: Cluster autoscaler configured and operational
- **Access Control**: IAM roles properly mapped to Kubernetes RBAC groups
- **DNS**: CoreDNS configured with custom forwarding to 10.0.0.2
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript code, well-structured, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/index.ts
- EKS cluster with OIDC provider and endpoint access
- Two managed node groups (on-demand and spot)
- VPC CNI addon with security group for pods configuration
- Cluster autoscaler with IRSA
- AWS Load Balancer Controller with IRSA
- CoreDNS custom forwarding configuration
- IAM roles (dev/staging/prod) with K8s RBAC mapping
- Fargate profile for kube-system namespace
- Complete outputs for cluster access and resource references
