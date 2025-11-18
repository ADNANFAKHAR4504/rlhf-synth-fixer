# Production EKS Cluster for Payment Processing Platform

Hey team,

We've got a fintech startup that needs to deploy their microservices architecture on AWS EKS. Their payment processing system needs to meet PCI compliance requirements, which means we're looking at a production-grade Kubernetes cluster with strict network isolation, automated management, and comprehensive observability. The business has made it clear that security and reliability are non-negotiable here.

I've been asked to create this infrastructure using **AWS CDK with TypeScript**. The technical requirements are pretty specific around EKS version 1.28, private networking, and Bottlerocket for the node OS. They're also focused on meeting compliance standards, so we need proper logging, IRSA for pod-level permissions, and pod security policies in place.

The deployment needs to be across three availability zones for high availability, and they want automatic scaling capabilities to handle variable transaction loads. Everything needs to be properly tagged for cost tracking and compliance auditing.

## What we need to build

Create a production-ready EKS cluster infrastructure using **AWS CDK with TypeScript** for a payment processing platform that meets PCI compliance requirements.

### Core Requirements

1. **Network Infrastructure**
   - Create a new VPC with private subnets spanning exactly 3 availability zones
   - Deploy NAT gateways for outbound internet access from private subnets
   - Configure appropriate security groups for cluster and node communication

2. **EKS Cluster Configuration**
   - Deploy EKS cluster version 1.28
   - Configure private endpoint access only (no public endpoint access)
   - Enable all control plane logging types: api, audit, authenticator, controllerManager, scheduler
   - Set up IRSA (IAM Roles for Service Accounts) with OIDC provider for pod-level AWS permissions

3. **Node Group Configuration**
   - Create managed node groups using Bottlerocket AMI
   - Use t3.large instance types
   - Configure automatic scaling with minimum 3 nodes and maximum 15 nodes
   - Enable AWS Systems Manager for secure node access without SSH

4. **Security and Compliance**
   - Apply pod security standards with restricted baseline enforcement
   - Create necessary IAM roles and policies for node groups
   - Create service account IAM roles for workload permissions
   - Configure cluster autoscaler permissions for dynamic scaling

5. **Resource Tagging**
   - Tag all resources with Environment=Production
   - Tag all resources with Project=PaymentPlatform

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **Amazon EKS** for Kubernetes cluster
- Use **Amazon VPC** with private subnets and NAT gateways
- Use **IAM** for roles, policies, and OIDC provider configuration
- Use **AWS Systems Manager** for secure node access
- Use **CloudWatch Logs** for control plane logging
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `resource-type-${environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies, no DeletionProtection)

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: ALL named resources must include environmentSuffix parameter for uniqueness
- **Destroyability**: NO RemovalPolicy.RETAIN, NO deletion_protection=true anywhere in code
- **NAT Gateway Cost**: NAT Gateways are expensive (~$32/month each). Consider using one NAT Gateway instead of one per AZ for synthetic task, or use VPC endpoints where possible
- **EKS Control Plane Logging**: All five log types must be explicitly enabled
- **Private Endpoint Only**: Cluster must NOT have public endpoint access enabled
- **OIDC Provider**: Required for IRSA functionality, must be associated with cluster

### Constraints

- EKS cluster version must be 1.28
- Use Bottlerocket AMI for managed node groups (enhanced security)
- Private endpoint access only with no public access
- Deploy across exactly 3 availability zones
- Node groups must scale between 3 and 15 nodes
- Instance type must be t3.large
- Pod security standards with restricted baseline enforcement
- All resources must be destroyable (no Retain policies)
- Include proper error handling and IAM least privilege
- All control plane logs must be sent to CloudWatch Logs

## Success Criteria

- **Functionality**: EKS 1.28 cluster deploys successfully with private endpoint access
- **Networking**: VPC with private subnets across 3 AZs, appropriate security groups
- **Security**: IRSA configured, pod security standards enforced, Bottlerocket nodes with SSM access
- **Scaling**: Managed node groups scale automatically between 3 and 15 nodes
- **Observability**: All control plane logging enabled and sent to CloudWatch
- **Compliance**: Resources tagged for Environment and Project, meets PCI requirements
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: Stack can be deleted without manual intervention
- **Code Quality**: TypeScript with proper types, well-tested, documented

## What to deliver

- Complete AWS CDK TypeScript implementation
- VPC with private subnets across 3 availability zones
- EKS 1.28 cluster with private endpoint access
- Managed node groups with Bottlerocket AMI and t3.large instances
- OIDC provider for IRSA configuration
- IAM roles and policies for cluster, nodes, and service accounts
- CloudWatch log groups for all control plane logging
- Cluster autoscaler permissions
- AWS Systems Manager configuration for node access
- Appropriate security groups and network ACLs
- Unit tests for all infrastructure components
- Documentation with deployment instructions and architecture overview