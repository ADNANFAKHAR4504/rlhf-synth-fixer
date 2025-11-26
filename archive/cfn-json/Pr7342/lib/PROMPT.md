Hey team,

We need to build a production-grade Kubernetes cluster for a financial services company that is moving their trading applications to containers. The business requirement is clear: they need a managed EKS environment that can handle variable trading volumes throughout the day with strict security controls. I have been asked to implement this using CloudFormation with JSON for the infrastructure definition.

The trading platform currently experiences significant load variations. During market open and close, they see 5x traffic spikes, which means we need robust auto-scaling. They also have strict compliance requirements around security and audit trails, so we need comprehensive logging and proper IAM configurations.

## What we need to build

Create a production-ready Amazon EKS cluster using **CloudFormation with JSON** for containerized microservices deployment.

### Core Requirements

1. **EKS Cluster Configuration**
   - Create EKS cluster running Kubernetes version 1.28
   - Configure managed node group with auto-scaling (min: 2, max: 10, desired: 3 nodes)
   - Deploy nodes across 3 availability zones (us-east-1a, us-east-1b, us-east-1c) for high availability
   - Use m5.large instance type for worker nodes

2. **Security and IAM**
   - Create IAM roles with least-privilege policies for cluster and node groups
   - Create OIDC provider for the cluster to support IRSA (IAM Roles for Service Accounts)
   - Use launch template that enforces IMDSv2 and blocks IMDSv1 for enhanced security
   - Configure cluster endpoint for public access with CIDR restrictions

3. **Logging and Observability**
   - Enable all cluster logging types (api, audit, authenticator, controllerManager, scheduler)
   - Send all logs to CloudWatch for centralized monitoring
   - Tag all resources with Environment=Production and ManagedBy=CloudFormation

4. **Outputs and Integration**
   - Output cluster endpoint for kubectl configuration
   - Output OIDC issuer URL for service account integration
   - Output node group ARN for reference and automation

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Amazon EKS** for managed Kubernetes cluster
- Use **EC2 Managed Node Groups** with Amazon Linux 2 EKS-optimized AMIs
- Use **Launch Templates** to enforce IMDSv2 metadata service configuration
- Use **CloudWatch** for cluster logging
- Use **IAM** for roles, policies, and OIDC provider configuration
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness and environment isolation
- Follow naming convention: {resource-type}-{environment-suffix}
- All resources must be destroyable (use DeletionPolicy: Delete, no Retain policies)
- Include proper resource dependencies and error handling

### Deployment Requirements (CRITICAL)

- All resources must include environmentSuffix parameter in naming
- All resources must have DeletionPolicy: Delete (no Retain policies)
- VPC configuration must support 3 public and 3 private subnets across 3 AZs
- Launch template must enforce IMDSv2 with HttpTokens: required and HttpPutResponseHopLimit: 1
- Node group must use the launch template for all instances
- IAM roles must follow least-privilege principle with specific service principals

### Constraints

- Managed node groups must auto-scale between 2-10 nodes based on load
- All nodes must use Amazon Linux 2 EKS-optimized AMIs
- Node instances must be m5.large with appropriate EBS volumes
- Cluster must enable all five logging types for audit compliance
- OIDC provider is mandatory for IRSA support
- IMDSv1 must be completely disabled on all nodes
- All resources must support clean teardown without manual intervention

## Success Criteria

- **Functionality**: EKS cluster deploys successfully with managed node groups across 3 AZs
- **Performance**: Auto-scaling responds to load between 2-10 nodes
- **Reliability**: High availability through multi-AZ deployment
- **Security**: IMDSv2 enforced, least-privilege IAM roles, comprehensive logging enabled
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be deleted via stack deletion without errors
- **Code Quality**: Valid CloudFormation JSON, well-structured, includes comprehensive outputs

## What to deliver

- Complete CloudFormation JSON template implementation in lib/TapStack.json
- Amazon EKS cluster with version 1.28
- Managed node group with auto-scaling configuration
- Launch template with IMDSv2 enforcement
- IAM roles for EKS cluster and node groups
- OIDC provider for IRSA support
- CloudWatch log group for cluster logs
- VPC networking with 3 public and 3 private subnets across 3 AZs
- All required outputs (cluster endpoint, OIDC issuer URL, node group ARN)
- README documentation with deployment instructions
