# Production-Ready EKS Cluster for Microservices

Hey team,

We've got an exciting project for a fintech company that's ready to modernize their payment processing system. They're moving from a monolithic architecture to microservices, and they need a rock-solid Kubernetes foundation to make it happen. The business is serious about this - they want production-grade infrastructure with strict security, automated node management, and full integration with their monitoring stack.

The interesting part is they need to support both stateful and stateless workloads with different resource requirements. Think payment processors that need consistent performance alongside batch jobs that can scale up and down. They're also cost-conscious, so we're going with ARM-based Graviton3 instances to optimize their spend.

I've been asked to build this using **Pulumi with TypeScript** to give them the full power of a real programming language for their infrastructure. The business has made it clear they want everything auditable, secure, and ready for production from day one.

## What we need to build

Create a production-ready Amazon EKS cluster using **Pulumi with TypeScript** that can handle microservices workloads for a fintech payment processing system.

### Core Requirements

1. **EKS Cluster Foundation**
   - Deploy EKS cluster version 1.28 or higher
   - Enable OIDC provider for IAM Roles for Service Accounts (IRSA)
   - Configure private endpoint access only (no public API access)
   - Set up security groups to restrict API server access
   - Deploy in us-east-1 region across multiple availability zones

2. **Node Groups for Different Workloads**
   - Create general-purpose node group using t4g.medium (ARM Graviton3)
   - Create compute-intensive node group using c7g.large (ARM Graviton3)
   - Configure autoscaling: minimum 2 nodes, maximum 10 nodes per group
   - Use private subnets only - no direct internet access for nodes
   - Enable managed node groups for automated updates

3. **Security and IAM Configuration**
   - Implement IRSA (IAM Roles for Service Accounts) for pod-level permissions
   - Create IAM roles and policies for cluster autoscaler
   - Configure proper IAM permissions for EKS control plane
   - Set up service account roles for workload identity

4. **Control Plane Logging**
   - Enable all five EKS control plane log types: api, audit, authenticator, controllerManager, scheduler
   - Stream logs to CloudWatch Logs
   - Set 30-day retention policy on log groups
   - Ensure logs are available for compliance and debugging

5. **Essential EKS Add-ons**
   - VPC CNI for pod networking
   - CoreDNS for service discovery
   - kube-proxy for networking rules
   - AWS EBS CSI Driver with encryption enabled for persistent volumes

6. **Storage and Persistence**
   - Configure EBS CSI driver for dynamic volume provisioning
   - Enable encryption at rest for all EBS volumes
   - Support both stateful and stateless workloads

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Amazon EKS** for managed Kubernetes service
- Use **EC2 Auto Scaling** for node group scaling
- Use **AWS IAM** for authentication and authorization
- Use **Amazon CloudWatch** for logging and monitoring
- Use **Amazon VPC** for networking isolation
- Use **AWS EBS** for persistent storage
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `eks-cluster-{environmentSuffix}`, `nodegroup-general-{environmentSuffix}`
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** in their names for multi-environment support
- All resources must be destroyable - use RemovalPolicy.DESTROY (no RETAIN policies)
- Implement proper resource tagging: Environment=production, Team=platform, CostCenter=engineering
- Output cluster endpoint and kubeconfig data for AWS CLI access
- Include comprehensive error handling and validation

### Constraints

- EKS cluster must be version 1.28 or higher
- Node groups MUST use ARM-based Graviton3 instances (t4g.medium and c7g.large)
- Worker nodes must use private subnets only
- API server must have private endpoint access only (no public access)
- All EBS volumes must be encrypted
- OIDC provider must be enabled for IRSA functionality
- Cluster autoscaler must scale between 2-10 nodes per group
- All resources must follow AWS tagging best practices

## Success Criteria

- **Functionality**: EKS cluster 1.28+ deployed with OIDC provider and private endpoint
- **Node Groups**: Two managed node groups (t4g.medium and c7g.large) with autoscaling
- **Logging**: All five control plane log types streaming to CloudWatch with 30-day retention
- **Security**: IRSA configured, private subnets only, proper security groups
- **Add-ons**: VPC CNI, CoreDNS, kube-proxy, and EBS CSI driver installed
- **Storage**: EBS CSI driver with encryption enabled
- **Outputs**: Cluster endpoint and kubeconfig available for AWS CLI access
- **Tagging**: All resources tagged with Environment, Team, and CostCenter
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript, well-tested, fully documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- VPC with public and private subnets across 3 availability zones
- EKS cluster with OIDC provider and private endpoint
- Two managed node groups (general and compute-intensive)
- IAM roles and policies for cluster autoscaler with IRSA
- All five control plane log types enabled
- CloudWatch log group with 30-day retention
- All required EKS add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI driver)
- Security groups for cluster and node access
- Comprehensive outputs (cluster endpoint, OIDC provider URL, kubeconfig)
- Unit tests for all components
- README with deployment instructions and architecture overview
