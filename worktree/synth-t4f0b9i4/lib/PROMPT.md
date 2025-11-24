Hey team,

We have a financial services company that needs to modernize their monolithic application architecture by moving to microservices on EC2. They require a managed EC2 Auto Scaling solution with strict security controls and automated node management to support their containerized workloads while maintaining compliance with financial regulations.

The business has been running a legacy monolithic system, and they've decided to break it down into microservices using EC2 orchestration. They need production-ready infrastructure that can scale their workloads across multiple availability zones, maintain high availability, and meet their security requirements. The compliance team has mandated strict security controls including encryption at rest, private networking, and least-privilege access patterns.

I've been asked to create this using **CloudFormation with JSON**. The infrastructure needs to be deployed in the us-east-1 region and must be completely destroyable for testing and cost management purposes.

## What we need to build

Create a production-ready EC2 Auto Scaling infrastructure using **CloudFormation with JSON** for hosting microservices workloads on EC2.

### Core Requirements

1. **EC2 Cluster Configuration**
   - Deploy EC2 cluster version 1.28 or higher
   - Deploy cluster in private subnets across 3 availability zones
   - Enable all EC2 control plane logging types to CloudWatch Logs
   - EC2 endpoint must be private with no public access

2. **EC2 Auto Scaling Node Groups**
   - Configure managed node group with 3-6 t3.medium instances
   - Use Amazon Linux 2 EC2 optimized AMIs only
   - Distribute worker nodes across at least 3 availability zones
   - Enable Auto Scaling for dynamic capacity management

3. **Security Configuration**
   - Set up OIDC provider for IAM Roles for Service Accounts (IRSA)
   - Create node security groups allowing only ports 443, 10250, and 53 for pod communication
   - Configure KMS key for EC2 secrets encryption at rest
   - Implement least-privilege IAM roles for cluster and node groups with no wildcard permissions

4. **Resource Management**
   - Tag all resources with Environment=Production and ManagedBy=CloudFormation
   - Set DeletionPolicy to Delete for all resources to enable clean teardown

### Optional Enhancements

- Add EC2 add-ons for CoreDNS, kube-proxy, and vpc-cni
- Implement AWS Load Balancer Controller using IRSA
- Configure Container Insights for cluster monitoring

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **EC2** for EC2 orchestration
- Use **EC2 Auto Scaling Groups** for worker node management
- Use **VPC** with private subnets across 3 availability zones
- Use **KMS** for encryption at rest
- Use **CloudWatch Logs** for control plane logging
- Use **IAM** for OIDC provider and role management
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable with no Retain policies (DeletionPolicy: Delete required)
- Resource naming must include environmentSuffix parameter for multi-environment deployments
- All stack outputs must use environmentSuffix in export names
- EC2 version must be 1.28 or higher
- Control plane logging must enable ALL log types: api, audit, authenticator, controllerManager, scheduler

### Constraints

- EC2 version must be 1.28 or higher
- Control plane must log all types: api, audit, authenticator, controllerManager, scheduler
- Node groups must use Amazon Linux 2 EC2 optimized AMIs only
- All worker nodes must be deployed across at least 3 availability zones
- EC2 endpoint must be private with no public access allowed
- OIDC provider must be configured to enable IRSA
- Node groups must have encryption at rest enabled using AWS managed KMS keys
- Security groups must restrict pod-to-pod communication to necessary ports only
- All IAM roles must follow least privilege principle with no wildcard permissions
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation

## Success Criteria

- Functionality: EC2 cluster deployed with managed node groups across 3 AZs
- Performance: Auto Scaling enabled with 3-6 t3.medium instances
- Reliability: Private subnets with high availability across multiple zones
- Security: OIDC provider configured, KMS encryption enabled, least-privilege IAM roles, restricted security groups
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: CloudFormation JSON template, well-documented, production-ready

## What to deliver

- Complete CloudFormation JSON implementation
- EC2 cluster with version 1.28+ in private subnets
- Managed node group with Auto Scaling (3-6 t3.medium instances)
- OIDC provider for IRSA
- Security groups for node-to-node communication (ports 443, 10250, 53)
- KMS key for secrets encryption
- IAM roles for cluster and nodes (least privilege)
- CloudWatch Logs configuration for control plane
- Resource tagging (Environment=Production, ManagedBy=CloudFormation)
- DeletionPolicy: Delete for all resources
- Documentation and deployment instructions