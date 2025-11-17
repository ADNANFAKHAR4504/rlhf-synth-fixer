Hey team,

We need to build a production-ready EKS cluster infrastructure for hosting microservices. The business has been running containers locally but wants to move to a managed Kubernetes solution on AWS. I've been asked to create this using CloudFormation with YAML so it can be integrated into our existing infrastructure workflows.

The operations team needs a complete cluster setup that includes networking, security, and compute resources. This will be deployed to the ap-southeast-1 region to support our APAC customers. The cluster needs to handle multiple microservices with different resource requirements, so we need flexible node groups and proper networking isolation.

Security is a big concern here. The security team wants KMS encryption for secrets, strict IAM policies following least privilege, and proper VPC segmentation. We also need CloudWatch integration so the ops team can monitor cluster health and troubleshoot issues quickly.

## What we need to build

Create a complete EKS cluster infrastructure using **CloudFormation with YAML** for hosting microservices in production.

### Core Requirements

1. **Network Infrastructure**
   - Create a new VPC with public and private subnets across multiple availability zones
   - Set up Internet Gateway for public subnet access
   - Configure NAT Gateway for private subnet egress
   - Implement proper route tables and subnet associations
   - Use CIDR blocks that support cluster growth

2. **EKS Cluster**
   - Deploy managed EKS cluster with Kubernetes version 1.28 or later
   - Enable cluster endpoint access (both public and private)
   - Configure cluster security group with appropriate ingress/egress rules
   - Enable control plane logging to CloudWatch for audit and troubleshooting
   - Support for multiple node groups with different instance types

3. **Node Groups**
   - Create managed node group for general workloads
   - Configure auto-scaling with min/max/desired capacity
   - Use appropriate instance types (t3.medium or larger)
   - Deploy nodes in private subnets for security
   - Set up proper IAM role with required policies for node operations

4. **Security Configuration**
   - Enable KMS encryption for EKS secrets
   - Create custom KMS key with proper key policy
   - Implement IAM roles with least privilege access
   - Configure security groups to restrict cluster access
   - Set up pod security policies or standards

5. **Monitoring and Logging**
   - Enable CloudWatch logging for EKS control plane
   - Log API server, audit, authenticator, controller manager, and scheduler events
   - Configure CloudWatch log group with retention policies
   - Enable CloudWatch Container Insights for metrics

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **Amazon EKS** for managed Kubernetes cluster
- Use **Amazon VPC** for network isolation
- Use **AWS KMS** for encryption at rest
- Use **CloudWatch** for logging and monitoring
- Use **IAM** for access control and service permissions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **ap-southeast-1** region

### Constraints

- All resources must be in ap-southeast-1 region
- No production data should be stored in cluster during testing
- Follow AWS Well-Architected Framework principles
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and validation
- Cluster must support horizontal scaling of workloads
- Network design must support future expansion

## Success Criteria

- **Functionality**: EKS cluster deploys successfully and can run containerized workloads
- **Performance**: Node groups can auto-scale based on workload demands
- **Reliability**: Cluster spans multiple AZs for high availability
- **Security**: KMS encryption enabled, IAM roles follow least privilege, VPC isolation in place
- **Monitoring**: CloudWatch logs capture control plane events and metrics
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: Clean YAML, well-organized resources, includes comments for complex configurations

## What to deliver

- Complete CloudFormation YAML template implementation
- VPC with public and private subnets across multiple availability zones
- EKS cluster with control plane logging enabled
- Managed node group with auto-scaling configuration
- IAM roles and policies for cluster and node operations
- KMS key for EKS secret encryption
- Security groups for cluster and node communication
- CloudWatch log groups for control plane logs
- Stack parameters for environment suffix and configuration options
- Stack outputs for cluster endpoint, security groups, and other key resources
