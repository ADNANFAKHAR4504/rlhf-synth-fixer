Hey team,

We need to build a production-grade Kubernetes infrastructure for our containerized workloads. The business has decided to go with Amazon EKS to get managed Kubernetes with AWS integration, and we need a robust setup that can handle enterprise-level requirements. I've been asked to create this infrastructure using **CloudFormation with yaml** to maintain consistency with our infrastructure-as-code practices.

The platform team needs a fully functional EKS cluster that can support multiple applications across different environments. We're looking at a multi-availability zone deployment with proper networking isolation, security controls, and monitoring built in from day one. The cluster needs to be production-ready with managed node groups that can scale based on workload demands.

Our operations team has emphasized the importance of having proper IAM roles configured, CloudWatch logging enabled, and security groups that follow the principle of least privilege. We also need to ensure all resources are properly tagged and named with an environment suffix so we can deploy this template across dev, staging, and production environments without conflicts.

## What we need to build

Create a production-ready EKS cluster infrastructure using **CloudFormation with yaml** that provides a complete Kubernetes environment with advanced networking and security configurations.

### Core Requirements

1. **EKS Cluster Setup**
   - Deploy an Amazon EKS cluster with the latest stable Kubernetes version
   - Enable control plane logging for audit, api, authenticator, controller manager, and scheduler
   - Configure proper IAM roles for cluster management
   - Enable private endpoint access for enhanced security

2. **Managed Node Groups**
   - Create managed node groups with appropriate instance types for general workloads
   - Configure auto-scaling capabilities (min, max, desired capacity)
   - Use AL2 (Amazon Linux 2) based AMI for nodes
   - Set up proper IAM roles for node group with required policies

3. **Networking Infrastructure**
   - Create a VPC with CIDR block supporting growth
   - Deploy subnets across at least 2 availability zones for high availability
   - Set up both public and private subnets for proper network segmentation
   - Configure Internet Gateway for public subnet connectivity
   - Deploy NAT Gateways in public subnets for private subnet outbound access
   - Set up route tables for public and private subnets

4. **Security Configuration**
   - Create security groups for cluster control plane
   - Configure security groups for worker nodes with appropriate ingress and egress rules
   - Enable encryption at rest using KMS where applicable
   - Implement least privilege IAM policies for all roles
   - Configure security group rules for node-to-node and node-to-control-plane communication

5. **Monitoring and Logging**
   - Enable CloudWatch logging for EKS control plane
   - Set up log groups with appropriate retention policies
   - Configure metrics collection for cluster health monitoring

### Technical Requirements

- All infrastructure defined using **CloudFormation with yaml**
- Use **Amazon EKS** for Kubernetes cluster management
- Use **EKS Managed Node Groups** for worker node provisioning
- Use **VPC** for network isolation with multi-AZ deployment
- Use **IAM Roles and Policies** for security and access control
- Use **CloudWatch** for logging and monitoring
- Use **KMS** for encryption key management
- Use **Security Groups** for network-level security
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **us-east-1** region by default
- All resources must support multiple availability zones for high availability

### Constraints

- No hardcoded credentials or sensitive data in templates
- All resources must be destroyable (no Retain deletion policies)
- Use latest stable EKS version compatible with managed node groups
- Node groups must support at least 2 availability zones
- Implement proper security group rules without overly permissive access
- Include proper error handling through CloudFormation conditions and dependencies
- All outputs should be clearly labeled for easy reference

## Success Criteria

- **Functionality**: EKS cluster deploys successfully with managed node groups ready to accept pod workloads
- **High Availability**: Resources distributed across multiple availability zones with proper failover capabilities
- **Security**: All IAM roles follow least privilege, encryption enabled, security groups properly configured
- **Networking**: VPC with proper subnet segmentation, routing configured for public and private access
- **Monitoring**: CloudWatch logs capturing control plane activities, metrics available for cluster health
- **Resource Naming**: All resources include environmentSuffix parameter for environment isolation
- **Code Quality**: CloudFormation yaml template that is well-structured, properly indented, and includes helpful comments
- **Deployability**: Template can be deployed via AWS CLI or Console without manual interventions

## What to deliver

- Complete CloudFormation yaml implementation in TapStack.yml
- EKS cluster with control plane logging enabled
- Managed node groups with auto-scaling configuration
- VPC with public and private subnets across multiple availability zones
- Security groups for cluster and node communication
- IAM roles and policies for EKS cluster and node groups
- CloudWatch log groups for control plane logs
- KMS key for encryption (optional but recommended)
- Parameters for environmentSuffix and other configurable values
- Outputs for cluster endpoint, node group ARN, VPC ID, and other key identifiers
- Documentation comments within the template explaining key configurations
