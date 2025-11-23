# EKS Cluster with Advanced Container Orchestration

Hey team,

We need to build a production-ready Amazon EKS cluster with advanced container orchestration capabilities for our application deployment platform. I've been asked to create this infrastructure using **Pulumi with TypeScript**. The business wants a comprehensive Kubernetes setup that handles auto-scaling, security, networking, and operational best practices for running containerized workloads at scale.

This is a complex deployment that goes beyond basic EKS setup. We need to demonstrate IRSA (IAM Roles for Service Accounts) for secure pod-level permissions, implement spot instance handling to reduce costs while maintaining availability, and establish proper namespace isolation with RBAC. The cluster should be production-grade with proper monitoring, autoscaling, and security controls in place.

The infrastructure must support multiple deployment environments with isolated namespaces for development and production workloads. We're targeting us-east-2 region for this deployment and need to ensure all resources can be cleanly destroyed for cost management during testing phases.

## What we need to build

Create a production-ready EKS cluster infrastructure using **Pulumi with TypeScript** that provides comprehensive container orchestration capabilities with advanced features for security, scaling, and operational excellence.

### Core Requirements

1. **EKS Cluster Configuration**
   - EKS cluster running Kubernetes version 1.28
   - Private endpoint access for enhanced security
   - Proper VPC networking with public and private subnets
   - OIDC provider configured for IRSA support

2. **Node Groups and Compute**
   - Default managed node group with on-demand instances (t3.medium, 2 desired, 1-4 scaling)
   - Appropriate instance types for general-purpose workloads
   - Auto-scaling configuration with proper IAM roles
   - Spot instance interruption handler installed (AWS Node Termination Handler)

3. **Kubernetes Autoscaling**
   - Kubernetes Cluster Autoscaler deployment
   - Pod disruption budgets to ensure availability during scaling events
   - Proper IAM roles and policies for autoscaler functionality

4. **Ingress and Load Balancing**
   - AWS Load Balancer Controller installed with IRSA
   - Proper IAM roles and service account configuration
   - Integration with EKS cluster for automatic load balancer provisioning

5. **Storage Management**
   - AWS EBS CSI driver installation
   - Encryption enabled for EBS volumes
   - Storage classes configured for dynamic provisioning

6. **DNS and Networking**
   - CoreDNS available in kube-system namespace (EKS managed)
   - Network policies for namespace isolation between dev and prod
   - Note: Node-local DNS cache feature disabled due to compatibility issues

7. **Security and Access Control**
   - Kubernetes RBAC configured with separate dev and prod namespaces
   - Pod security standards enforcement
   - IRSA infrastructure fully configured (IAM roles, policies, service accounts) ready for workload deployment
   - Proper IAM roles and policies following least-privilege principle
   - Note: Demo workloads (IRSA pod, spot demo deployment) are implemented but commented out to ensure fast initial deployment

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Amazon EKS** for managed Kubernetes control plane
- Use **EC2** for worker node compute
- Use **IAM** for authentication, authorization, and IRSA
- Use **VPC** components for networking and security
- Use **EBS** for persistent storage with encryption
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-2** region
- All IAM roles should use assume role policies with OIDC provider conditions where applicable

### Deployment Requirements (CRITICAL)

- **Destroyability**: All resources must be destroyable with no Retain policies. Use appropriate deletion policies (DELETE/DESTROY) for all resources including EBS volumes, security groups, and ENIs
- **environmentSuffix**: All resource names MUST include the environmentSuffix parameter for uniqueness and multi-environment support
- **Regional Configuration**: All resources must be created in us-east-2 region
- **Clean Destruction**: Ensure proper resource dependencies so pulumi destroy works without manual intervention
- **No Account-Level Resources**: Do not create account-level resources like GuardDuty detectors or organization-level configurations

### Constraints

- EKS cluster must use private endpoint access for security
- Spot instances should be configured with proper interruption handling
- All namespaces must have network policies for isolation
- Pod security standards must be enforced at namespace level
- IAM roles must follow least-privilege principle
- All EBS volumes must have encryption enabled
- Node groups must support dynamic scaling based on workload demands
- RBAC policies should separate dev and prod namespace access
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging for Pulumi operations

## Success Criteria

- **Functionality**: Complete EKS cluster with default node group, autoscaling, load balancer controller, EBS CSI driver, and RBAC configured
- **Performance**: Cluster autoscaler responds to pod scheduling demands, node-local DNS cache reduces latency
- **Reliability**: Pod disruption budgets configured for autoscaler, spot interruption handler installed
- **Security**: Private endpoint access, namespace isolation via network policies, IRSA infrastructure fully configured, pod security standards enforced
- **Resource Naming**: All resources include environmentSuffix in their names
- **Code Quality**: Well-structured TypeScript code with proper type definitions, comprehensive inline documentation, modular component design
- **Operational**: Resources can be deployed and destroyed cleanly, proper tagging for cost tracking, fast deployment without scheduling delays

## What to deliver

- Complete Pulumi TypeScript implementation with modular component structure
- EKS cluster with OIDC provider and private endpoint configuration
- Default managed node group with on-demand instances and autoscaling capabilities
- Kubernetes Cluster Autoscaler with pod disruption budgets
- AWS Load Balancer Controller with IRSA integration
- AWS EBS CSI driver with encryption enabled
- CoreDNS managed by EKS (node-local cache disabled for compatibility)
- RBAC configuration with dev and prod namespaces
- Network policies for namespace isolation
- Pod security standards enforcement
- IRSA infrastructure fully configured (IAM role, policy, service account, S3 bucket)
- Spot instance interruption handler installed (AWS Node Termination Handler)
- All necessary IAM roles, policies, and service accounts
- Note: Demo workloads (IRSA test pod, spot demo deployment) are implemented but commented out to avoid initial scheduling delays - they can be enabled after nodes are ready
- Comprehensive documentation in README.md with deployment instructions
- Resource outputs for cluster endpoint, OIDC provider ARN, and cluster details
