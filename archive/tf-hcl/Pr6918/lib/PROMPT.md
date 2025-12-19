Hey team,

We need to build a complete CI/CD pipeline infrastructure for our containerized payment gateway application using **Terraform with HCL**. The financial services company we're working with has strict PCI compliance requirements, so we need to implement this with security and governance at the forefront. They want a fully automated pipeline that supports blue-green deployments with zero downtime and manual approval gates before production releases.

This is a critical piece of infrastructure that will handle automated builds, testing, and deployments for their containerized applications. The system needs to be deployed across multiple availability zones for high availability and must include comprehensive encryption, logging, and access controls. We're targeting the us-east-1 region with a multi-AZ setup.

The business has been clear that they want CodePipeline orchestrating everything, with CodeCommit as the source control (they want to keep everything in AWS), CodeBuild for container image builds, and ECS for running the actual containerized applications. They also need WAF protection on the load balancer and customer-managed encryption keys for all artifacts and container images.

## What we need to build

Create a comprehensive CI/CD pipeline infrastructure using **Terraform with HCL** for deploying containerized applications with blue-green deployment capabilities, manual approval workflows, and strict security controls.

### Core Requirements

1. **Pipeline Orchestration**
   - Set up CodePipeline with complete workflow: source, build, manual approval, and deploy stages
   - Configure pipeline to use S3 bucket for artifact storage with versioning enabled
   - Implement lifecycle policies on artifact bucket for cost optimization
   - All pipeline artifacts must be encrypted with customer-managed KMS keys

2. **Source Control**
   - Configure CodeCommit repository as the source
   - Enable branch protection rules on main branch
   - Integrate repository as pipeline source stage

3. **Build Infrastructure**
   - Create CodeBuild project for Docker image builds
   - Use BUILD_GENERAL1_SMALL compute type for cost optimization
   - Configure build to push images to ECR repository
   - Implement CloudWatch Log Groups with EXACTLY 30-day retention for build logs
   - Encrypt build artifacts with customer-managed KMS keys

4. **Container Runtime**
   - Set up ECS cluster for running containerized applications
   - Create ECS task definitions using launch type with platform version LATEST
   - Configure ECS service for blue-green deployments
   - Deploy tasks in private subnets across multiple AZs

5. **Load Balancing and Traffic Management**
   - Configure Application Load Balancer in public subnets
   - Implement target group switching for zero-downtime blue-green deployments
   - Attach WAF web ACL to ALB for DDoS protection
   - Configure health checks on target groups

6. **Approval Workflow**
   - Set up manual approval stage in pipeline before production deployment
   - Configure SNS topic for approval notifications
   - Send notifications to designated approvers

7. **Security and Access Control**
   - Create all necessary IAM roles and policies following least privilege principle
   - NO wildcard actions in IAM policies (explicitly forbidden)
   - Implement customer-managed KMS keys for encrypting build artifacts and ECR images
   - Configure KMS key policies with appropriate access controls

8. **Networking**
   - Deploy VPC with multi-AZ configuration across 3 availability zones
   - Create private subnets for ECS tasks
   - Create public subnets for Application Load Balancer
   - Configure appropriate security groups and network ACLs

9. **Container Registry**
   - Set up ECR repository for Docker images
   - Enable encryption at rest using customer-managed KMS keys
   - Configure image scanning and lifecycle policies

10. **Logging and Monitoring**
    - Create CloudWatch Log Groups for CodeBuild with 30-day retention
    - Configure logging for ECS tasks
    - Enable CloudWatch logging for pipeline execution

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use Terraform 1.5+ with AWS provider 5.x
- Deploy to **us-east-1** region
- Multi-AZ deployment across 3 availability zones
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{environmentSuffix}
- Use **CodePipeline** for CI/CD orchestration
- Use **CodeCommit** as source repository with branch protection
- Use **CodeBuild** with BUILD_GENERAL1_SMALL compute type
- Use **ECS** with launch type and platform version LATEST
- Use **Application Load Balancer** with target groups for blue-green deployments
- Use **ECR** for container image storage
- Use **KMS** customer-managed keys for encryption
- Use **WAF** web ACL for ALB protection
- Use **S3** with versioning for artifact storage
- Use **CloudWatch Logs** with 30-day retention for builds
- Use **SNS** for approval notifications
- Use **IAM** roles with least privilege and NO wildcard actions

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (DeletionPolicy: Delete, RemovalPolicy: DESTROY)
- NO resources with Retain policies that would block cleanup
- Resource names MUST include environmentSuffix variable for uniqueness
- All IAM policies MUST follow least privilege with NO wildcard actions
- Build logs MUST retain for EXACTLY 30 days in CloudWatch
- CodeBuild compute type MUST be BUILD_GENERAL1_SMALL
- ECS platform version MUST be LATEST
- S3 artifact bucket MUST have versioning enabled
- All encryption MUST use customer-managed KMS keys (NOT AWS managed)
- ALB MUST have WAF web ACL attached
- CodeCommit main branch MUST have protection rules enabled
- Pipeline MUST include manual approval stage before deployment

### Constraints

- Security: All IAM roles must follow least privilege with NO wildcard actions allowed
- Encryption: Use customer-managed KMS keys for all artifacts and ECR images
- Compliance: Meet PCI compliance requirements with encryption and access controls
- Cost: Use BUILD_GENERAL1_SMALL compute type for CodeBuild to optimize costs
- Networking: ECS tasks in private subnets, ALB in public subnets
- Protection: WAF web ACL required on Application Load Balancer
- Logging: CloudWatch Log Groups for CodeBuild with EXACTLY 30-day retention
- Versioning: S3 artifact bucket must have versioning enabled
- Approval: Manual approval stage required before production deployment
- Repository: CodeCommit with branch protection on main branch
- All resources must be fully destroyable with no Retain policies

## Success Criteria

- **Functionality**: Complete CI/CD pipeline from source to deployment with manual approval
- **Performance**: Multi-AZ deployment with zero-downtime blue-green deployments
- **Reliability**: High availability across 3 availability zones
- **Security**: Customer-managed encryption, least privilege IAM, WAF protection, no wildcard permissions
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Compliance**: Meet PCI requirements with encryption, logging, and access controls
- **Cost Optimization**: Use BUILD_GENERAL1_SMALL compute type
- **Code Quality**: Clean Terraform HCL code, modular structure, well-documented

## What to deliver

- Complete Terraform HCL implementation with modular structure
- VPC with multi-AZ networking (private and public subnets)
- CodePipeline with source, build, approval, and deploy stages
- CodeCommit repository with branch protection
- CodeBuild project with BUILD_GENERAL1_SMALL compute type
- ECS cluster, task definitions, and service for blue-green deployments
- Application Load Balancer with target groups
- WAF web ACL for DDoS protection
- ECR repository with encryption
- Customer-managed KMS keys for artifacts and ECR
- IAM roles and policies with least privilege (NO wildcards)
- S3 bucket for artifacts with versioning and lifecycle policies
- CloudWatch Log Groups with 30-day retention
- SNS topic for approval notifications
- Security groups and network configurations
- Complete documentation in README
- Deployment instructions
