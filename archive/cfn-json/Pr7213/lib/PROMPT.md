Hey team,

We need to build an EC2 Auto Scaling infrastructure for a fintech startup that's deploying their production microservices platform. They want a hybrid node group architecture that balances managed convenience with self-managed flexibility. The business is focused on security compliance and wants everything locked down with private endpoints only and envelope encryption.

The infrastructure needs to support both managed and self-managed node groups with specific instance types and scaling policies. The managed nodes will handle core application workloads using t3.medium instances, while the self-managed nodes will run data-intensive services on m5.large instances. Security is critical here - we need private API endpoint access only, KMS encryption, and dedicated VPC isolation across multiple availability zones.

This deployment is happening in us-east-1 across 3 availability zones. We're implementing this using **CloudFormation with JSON** for the infrastructure definition.

## What we need to build

Create an EC2 Auto Scaling groups infrastructure using **CloudFormation with JSON** that deploys a production-grade cluster with hybrid node group architecture for a fintech microservices platform.

### Core Requirements

1. **EC2 Cluster Configuration**
   - Deploy EC2 Auto Scaling groups version 1.28
   - Configure private API endpoint access only (no public access)
   - Enable envelope encryption using AWS KMS customer-managed key
   - Configure cluster logging for api, audit, and controllerManager

2. **Managed Node Group**
   - Create one managed node group with t3.medium instances
   - Set minimum capacity to 2 nodes
   - Set maximum capacity to 6 nodes
   - Use Amazon Linux 2 EC2-optimized AMIs

3. **Self-Managed Node Group**
   - Deploy one self-managed node group using Launch Templates
   - Use m5.large instances
   - Use Amazon Linux 2 EC2-optimized AMIs
   - Configure IMDSv2 with hop limit of 1
   - Implement proper Auto Scaling group configuration

4. **IAM and OIDC Configuration**
   - Configure OIDC provider for IRSA (IAM Roles for Service Accounts)
   - Create cluster service role without AdministratorAccess policy
   - Create node instance profiles with least-privilege policies
   - No wildcard permissions in IAM policies

5. **Network Infrastructure**
   - Create dedicated VPC with private subnets only
   - Deploy 3 private subnets across different availability zones
   - Configure proper security groups
   - Deny all ingress except from within the VPC CIDR

6. **Security and Encryption**
   - Create KMS customer-managed key with automatic rotation enabled
   - Enable envelope encryption for cluster secrets
   - Configure security groups to deny external access
   - Implement IMDSv2 for self-managed nodes

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **EC2 Auto Scaling groups** for the cluster
- Use **EC2** for compute instances
- Use **VPC** for networking
- Use **KMS** for encryption
- Use **IAM** for identity and access management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies)

### Constraints

- All node groups must use Amazon Linux 2 EC2-optimized AMIs
- The KMS key must have automatic rotation enabled
- Self-managed nodes must use IMDSv2 with hop limit of 1
- Security groups must deny all ingress except from within the VPC CIDR
- The cluster service role must not have AdministratorAccess policy
- Node instance profiles must use least-privilege policies without wildcards
- No DeletionProtection on any resources
- Include proper error handling and validation

### Deployment Requirements (CRITICAL)

- All named resources (S3 buckets, IAM roles, EC2 clusters, security groups, etc.) MUST include the **environmentSuffix** parameter to ensure uniqueness across parallel deployments
- Resource naming pattern: `resource-name-${EnvironmentSuffix}` using CloudFormation !Sub intrinsic function
- All resources must be fully destroyable - no RemovalPolicy Retain or DeletionProtection enabled
- Security groups should be configurable and tied to the VPC created in the stack
- IMDSv2 requirement must be enforced in Launch Templates for self-managed nodes

## Success Criteria

- **Functionality**: Complete hybrid EC2 Auto Scaling groups deployment with managed and self-managed node groups
- **Security**: Private endpoint access only, KMS encryption enabled, security groups properly configured
- **Networking**: Dedicated VPC with 3 private subnets across availability zones
- **IAM**: OIDC provider configured, least-privilege policies implemented
- **Scalability**: Managed node group can scale from 2 to 6 nodes
- **Compliance**: IMDSv2 enforced, automatic key rotation enabled, proper logging configured
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be deleted cleanly
- **Code Quality**: Valid CloudFormation JSON, well-structured, documented

## What to deliver

- Complete CloudFormation JSON template implementation
- EC2 Auto Scaling groups cluster with version 1.28
- Managed node group with t3.medium instances (2-6 capacity)
- Self-managed node group with m5.large instances using Launch Templates
- VPC with 3 private subnets across availability zones
- KMS key with automatic rotation for envelope encryption
- OIDC provider for IAM Roles for Service Accounts
- Security groups with VPC-only ingress rules
- IAM roles and policies following least-privilege principles
- Cluster logging enabled for api, audit, and controllerManager
- Documentation with deployment instructions and architecture overview