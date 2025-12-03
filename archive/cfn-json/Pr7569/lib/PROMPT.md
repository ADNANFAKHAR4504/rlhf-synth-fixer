Hey team,

We need to build a production Kubernetes infrastructure for our fintech startup's microservices platform. I've been asked to create this using CloudFormation with JSON. The business needs a fully managed EKS cluster that can handle both our stateless API services and stateful database workloads, all while maintaining strict security controls.

The platform is growing fast, and we need automated node management with different instance types for different workload profiles. Security is critical here since we're handling financial data, so everything needs to be locked down with private endpoints and controlled access. We also need to support IAM Roles for Service Accounts so our pods can securely access AWS resources.

Make sure to add an environment suffix to all resource names so we can deploy multiple environments without conflicts. This is production infrastructure, so everything needs to be enterprise-grade and fully observable.

## What we need to build

Create a secure EKS cluster infrastructure using **CloudFormation with JSON** for containerized microservices.

### Core Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS cluster with Kubernetes version 1.28 or higher
   - Configure private API endpoint with public access disabled
   - Enable OIDC identity provider for IAM Roles for Service Accounts
   - Restrict API endpoint access to specific CIDR blocks (10.0.0.0/8)
   - Deploy across 3 availability zones in us-east-1

2. **Managed Node Groups**
   - General workload node group: t3.large instances, 2-6 nodes with auto-scaling
   - Compute-intensive workload node group: c5.xlarge instances, 1-4 nodes with auto-scaling
   - Use Amazon Linux 2 EKS optimized AMIs only
   - Deploy all nodes in private subnets with no direct internet access
   - Configure auto-scaling with minimum 2 and maximum 10 nodes per group

3. **IAM Roles and Permissions**
   - Create IAM roles for node groups with required AWS managed policies
   - Attach AmazonEKSWorkerNodePolicy for EKS node operations
   - Attach AmazonEKS_CNI_Policy for VPC networking
   - Attach AmazonEC2ContainerRegistryReadOnly for pulling container images
   - Follow least privilege principle with no wildcard actions
   - Support IRSA for pod-level IAM permissions

4. **Security Configuration**
   - Configure cluster security group to allow ingress only from 10.0.0.0/8
   - Restrict inter-node communication to required ports only
   - All worker nodes in private subnets
   - VPC with NAT gateways for outbound internet access
   - No direct internet access for worker nodes

5. **Observability and Logging**
   - Enable CloudWatch logging for all EKS control plane components
   - Log api server events
   - Log audit events
   - Log authenticator events
   - Log controllerManager events
   - Log scheduler events

6. **Optional Enhancements**
   - AWS Load Balancer Controller IRSA role for Kubernetes Ingress with ALB/NLB
   - Fargate profile for system pods to reduce operational overhead
   - EBS CSI driver IRSA role for persistent volume support

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **EKS** for managed Kubernetes control plane
- Use **EC2** for managed node groups
- Use **IAM** for roles and policies
- Use **CloudWatch** for control plane logging
- Deploy to **us-east-1** region
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: `resource-type-${EnvironmentSuffix}`
- All resources must have DeletionPolicy to enable cleanup after testing

### Deployment Requirements (CRITICAL)

- All resources must include the EnvironmentSuffix parameter in their names
- The EKS cluster resource must have DeletionPolicy set to Retain for safety
- All other resources should be destroyable (no other Retain policies)
- Template must output cluster endpoint, OIDC issuer URL, and node group ARNs
- Infrastructure must support both VPC CNI plugin and CoreDNS add-ons

### Constraints

- Must use Kubernetes version 1.28 or higher
- Node groups must use Amazon Linux 2 EKS optimized AMIs only
- All worker nodes in private subnets with no direct internet access
- OIDC provider required for IRSA support
- Cluster endpoint must be private with whitelisted CIDR blocks
- Node groups must have auto-scaling enabled
- All IAM roles must follow least privilege principle
- No wildcard actions in IAM policies
- All resources tagged with Environment=Production and ManagedBy=CloudFormation

## Success Criteria

- **Functionality**: EKS cluster deploys successfully with two managed node groups
- **Security**: Private API endpoint, restricted access, proper IAM roles
- **Scalability**: Auto-scaling configured for both node groups
- **Observability**: CloudWatch logging enabled for all control plane components
- **IRSA Support**: OIDC provider configured and functional
- **Resource Naming**: All resources include EnvironmentSuffix for uniqueness
- **Code Quality**: Valid CloudFormation JSON, properly structured, documented

## What to deliver

- Complete CloudFormation JSON template
- EKS cluster with Kubernetes 1.28+
- Two managed node groups (t3.large and c5.xlarge)
- IAM roles with AWS managed policies
- OIDC identity provider configuration
- CloudWatch logging for control plane
- Security group configurations
- Template outputs for cluster endpoint, OIDC issuer, node group ARNs
- Documentation and deployment instructions
