Hey team,

We have a fintech startup that's ready to modernize their infrastructure. They're currently running microservices on on-premise EC2 instances, and they want to migrate to a production-grade EKS cluster on AWS. This is a critical migration that requires strict security controls, proper network segmentation, and enterprise-level operational capabilities.

The business drivers are clear: they need container orchestration for their microservices, better resource utilization through Kubernetes, and the ability to scale workloads independently. But they also have strict security requirements since they're in the fintech space, handling sensitive financial data and transactions.

The current on-premise setup has taught them what they need. They've identified three distinct workload types that need separate node groups: system workloads that need to be stable and always available, application workloads that handle user traffic and need to scale, and spot instances for batch processing jobs that can tolerate interruptions. Each workload type needs its own resource allocation and scheduling rules.

## What we need to build

Create a production-ready EKS cluster using **Terraform with HCL** that provides enterprise-grade security, networking, and operational capabilities for a fintech microservices architecture.

### Core Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS cluster version 1.28
   - Configure private API endpoint access only for security
   - Enable comprehensive control plane logging for api, audit, authenticator, controllerManager, and scheduler
   - Implement KMS encryption for EKS secrets with customer-managed key rotation

2. **Node Group Architecture**
   - Create three distinct managed node groups with specific instance types and workload isolation
   - System node group: t3.medium instances for core cluster services
   - Application node group: m5.large instances for application workloads
   - Spot node group: m5.large spot instances for cost-effective batch processing
   - Configure distinct taints and labels for each node group to control pod scheduling

3. **Security and Access Control**
   - Implement pod security standards with baseline enforcement for all namespaces
   - Enable IRSA (IAM Roles for Service Accounts) with OIDC provider configuration
   - Set up aws-load-balancer-controller with proper IAM role for ALB/NLB provisioning
   - Ensure all resources follow principle of least privilege

4. **Storage Configuration**
   - Install and configure aws-ebs-csi-driver addon
   - Create encrypted GP3 storage class as default
   - Enable EBS volume encryption with KMS

5. **Auto Scaling and Operations**
   - Configure cluster autoscaler with proper IAM permissions
   - Add required node group tags for autoscaler discovery
   - Ensure scaling works correctly with spot and on-demand instances

6. **Network Architecture**
   - Implement network segmentation with dedicated subnets for each node group
   - Configure proper VPC networking for private EKS cluster
   - Ensure pod networking works correctly across availability zones

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **EKS** for Kubernetes cluster management
- Use **EC2** for managed node groups with different instance types
- Use **VPC** for network segmentation and subnet isolation
- Use **IAM** for IRSA, service accounts, and role-based access control
- Use **KMS** for encryption of secrets and EBS volumes
- Use **EBS** for persistent storage with CSI driver
- Use **CloudWatch** for control plane logging
- Use **Auto Scaling** for cluster autoscaler functionality
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-{environment-suffix}`
- All resources must be destroyable with no Retain policies

### Deployment Requirements (CRITICAL)

- Add **environment** variable to variables.tf with proper validation
- Use **var.environment** in all resource labels and tags (NO hardcoded "production" or other environment values)
- All infrastructure must support parameterized environments (dev, staging, production)
- Resource naming must use **var.environment_suffix** to ensure uniqueness
- All EBS volumes and storage must have encryption enabled
- KMS keys must support automatic key rotation
- All IAM roles must follow least privilege principle

### Constraints

- Private API endpoint only for enhanced security
- No public access to EKS control plane
- Spot instances must have proper fallback to on-demand if unavailable
- Node groups must support scaling from minimum to maximum capacity
- All secrets and sensitive data must be encrypted at rest
- Control plane logs must be retained for audit compliance
- All resources must be destroyable for testing and development environments
- IAM policies must grant only necessary permissions for each component

## Success Criteria

- **Functionality**: EKS cluster deploys successfully with all three node groups operational
- **Security**: Private API endpoint, KMS encryption, IRSA enabled, pod security standards enforced
- **Networking**: Network segmentation implemented, dedicated subnets per node group
- **Storage**: EBS CSI driver installed, encrypted GP3 storage class as default
- **Scaling**: Cluster autoscaler configured with proper permissions and tags
- **Monitoring**: Control plane logging enabled for all log types
- **Load Balancing**: AWS Load Balancer Controller installed with IAM role
- **Resource Naming**: All resources include environmentSuffix and use var.environment in labels
- **Environment Parameterization**: No hardcoded environment values anywhere in code
- **Code Quality**: Well-structured HCL code, properly organized files, comprehensive variable definitions

## What to deliver

- Complete Terraform HCL implementation organized in lib/ directory
- provider.tf: AWS provider configuration with required versions
- variables.tf: All input variables including environment and environment_suffix (REQUIRED)
- main.tf: VPC, networking, subnets, and KMS key configuration
- eks-cluster.tf: EKS cluster, OIDC provider, control plane logging, and addons
- node-groups.tf: Three managed node groups with taints, labels using var.environment (NO hardcoded values)
- outputs.tf: Essential outputs for cluster access and verification
- All EKS-related AWS services properly configured
- Proper error handling and validation
- Clear variable descriptions and sensible defaults
- Documentation in comments where needed
