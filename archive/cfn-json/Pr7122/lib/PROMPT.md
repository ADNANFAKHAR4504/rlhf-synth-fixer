Hey team,

We need to build a production-grade EKS cluster for our financial services microservices platform. The business is migrating from their on-premises Kubernetes setup and needs infrastructure that can handle 500+ pods across multiple availability zones. I've been asked to create this using CloudFormation with JSON format. This is a critical deployment for PCI compliance, so security is paramount.

The cluster needs to support both managed and self-managed node groups because some of our workloads have specific requirements around instance configuration and bootstrap scripts. The infrastructure team wants everything defined in CloudFormation so they can integrate it with their existing CI/CD pipeline that already processes JSON templates.

## What we need to build

Create an EKS cluster infrastructure using **CloudFormation with JSON** that supports mixed node group configurations and meets PCI compliance requirements.

### Core Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS version 1.28 with private endpoint access only
   - Enable all log types to CloudWatch for audit compliance
   - Configure OIDC provider for IRSA (IAM Roles for Service Accounts)
   - Enable envelope encryption using customer managed KMS key

2. **Managed Node Group**
   - Deploy with t3.large instances
   - Auto-scaling configuration: minimum 2, maximum 6 nodes
   - Must use IMDSv2 with hop limit of 1
   - Deploy across multiple availability zones

3. **Self-Managed Node Group**
   - Use launch template with m5.xlarge instances
   - Include user data for EKS bootstrap script
   - Must use IMDSv2 with hop limit of 1
   - Configure proper node instance profile with required EKS permissions

4. **Network Infrastructure**
   - Create dedicated VPC with CIDR range 10.0.0.0/16
   - Deploy 3 private subnets across different availability zones
   - Set up NAT Gateway in each AZ for high availability
   - Disable auto-assign public IP on subnets

5. **Security Configuration**
   - Security groups allowing only port 443 between nodes and control plane
   - Follow least privilege principle with explicit CIDR blocks
   - All IAM roles must use aws:SourceAccount condition for cross-service access
   - KMS key must have automatic rotation enabled

6. **Resource Tagging**
   - Tag all resources with Environment=Production
   - Tag all resources with CostCenter=Engineering
   - Include resource name suffix for environment identification

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Amazon EKS** for Kubernetes control plane
- Use **EC2** for compute nodes (both managed and self-managed)
- Use **VPC** with private subnets and NAT Gateways
- Use **KMS** for encryption at rest
- Use **CloudWatch** for centralized logging
- Use **IAM** for service roles and instance profiles
- Deploy to **us-east-1** region across 3 availability zones
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: `resource-type-{EnvironmentSuffix}`

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no DeletionPolicy: Retain)
- Stack must complete deployment within 30 minutes
- EKS cluster endpoint must be private only with no public access
- All node groups must use IMDSv2 with hop limit of 1
- Security groups must follow least privilege with explicit CIDR blocks
- Subnets must have auto-assign public IP disabled
- VPC must use non-overlapping CIDR range 10.0.0.0/16
- CloudFormation parameters must include EnvironmentSuffix as string input

### Constraints

- EKS cluster endpoint must be private only with no public access
- Launch template must include user data for EKS bootstrap script
- Node instance profiles must have only required EKS permissions
- All IAM roles must use aws:SourceAccount condition
- KMS key must have automatic rotation enabled
- CloudFormation must use JSON format (not YAML)
- No hardcoded account IDs or region names

## Success Criteria

- **Functionality**: EKS cluster deploys successfully with both node group types
- **Performance**: Cluster can handle 500+ pods across node groups
- **Reliability**: High availability with NAT Gateways in each AZ
- **Security**: Private endpoint only, IMDSv2 enforced, least privilege IAM
- **Compliance**: All logging enabled, envelope encryption, PCI-compliant security groups
- **Resource Naming**: All resources include EnvironmentSuffix parameter
- **Destroyability**: All resources can be deleted cleanly (no Retain policies)
- **Code Quality**: Valid JSON CloudFormation, well-structured, documented

## What to deliver

- Complete CloudFormation JSON template
- EKS cluster version 1.28 with private endpoint
- Managed node group with t3.large instances
- Self-managed node group with launch template using m5.xlarge
- Dedicated VPC with 3 private subnets
- NAT Gateways for high availability
- Security groups for node-to-control-plane communication
- KMS key for envelope encryption
- IAM roles for cluster, nodes, and OIDC provider
- CloudWatch log group for EKS logging
- Proper tagging and naming conventions
- Deployment instructions and parameter documentation
