Hey team,

We need to build a secure CI/CD pipeline infrastructure for HealthTech Solutions' new patient management system. They're launching a healthcare SaaS platform that processes sensitive patient data, and compliance with healthcare regulations is absolutely critical. I've been asked to create this infrastructure using CloudFormation with YAML templates. The business requires strict security controls, proper audit trails, and a deployment pipeline that can handle both containerized applications and database updates safely.

The system needs to deploy to Amazon ECS for running the containerized patient management applications, with an RDS PostgreSQL database for storing patient records. All of this must be orchestrated through AWS CodePipeline to ensure consistent, auditable deployments. Since we're dealing with healthcare data, all credentials must be managed through AWS Secrets Manager with automatic rotation, and we need proper network isolation with private subnets.

The deployment target is the eu-south-1 region, and we need to ensure that ECS tasks running in private subnets can still reach external services through NAT Gateway for things like pulling container images and accessing AWS services. We also need Amazon EFS for persistent storage that survives container restarts.

## What we need to build

Create a secure healthcare CI/CD infrastructure using **CloudFormation with YAML** for deploying containerized applications and managing database updates with strict security controls.

### Core Requirements

1. **Network Infrastructure**
   - VPC with public and private subnets across multiple availability zones
   - NAT Gateway in public subnet for outbound internet access from private subnets
   - Internet Gateway for public subnet connectivity
   - Route tables properly configured for public and private subnet traffic

2. **Container Orchestration**
   - Amazon ECS cluster for running containerized applications
   - ECS task definitions with proper resource allocation
   - ECS tasks must run in private subnets only
   - ECS service with auto-scaling capabilities

3. **Database Infrastructure**
   - Amazon RDS PostgreSQL instance for patient data storage
   - RDS instance must be in private subnets
   - Database credentials stored in AWS Secrets Manager
   - Automatic credential rotation every 30 days
   - Encrypted at rest using KMS

4. **CI/CD Pipeline**
   - AWS CodePipeline for automated deployments
   - Pipeline stages for source, build, and deploy
   - Integration with ECS for container deployments
   - Database migration capabilities

5. **Persistent Storage**
   - Amazon EFS file system for application data
   - EFS mount targets in private subnets
   - Encryption at rest enabled

6. **Security and Secrets Management**
   - AWS Secrets Manager for database credentials
   - Reference existing secrets (don't create new ones in template)
   - KMS encryption keys for data at rest
   - Proper IAM roles with least privilege access
   - Security groups with minimal required access

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **Amazon ECS** for container orchestration
- Use **Amazon RDS (PostgreSQL)** for database
- Use **AWS CodePipeline** for CI/CD automation
- Use **Amazon EFS** for persistent file storage
- Use **AWS Secrets Manager** for credential management
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: `ResourceName${EnvironmentSuffix}`
- Deploy to **eu-south-1** region
- Use CloudFormation intrinsic functions: !Ref, !Sub, !GetAtt, !Join, etc.

### Constraints

- All database credentials must be stored in Secrets Manager and rotated every 30 days
- ECS tasks must run in private subnets with outbound internet through NAT Gateway only
- No hardcoded credentials or sensitive data in templates
- All data must be encrypted at rest using KMS
- All data must be encrypted in transit using TLS
- All resources must be destroyable (no DeletionPolicy: Retain)
- Include proper error handling and CloudWatch logging
- Security groups must follow least privilege principle
- All resources must be properly tagged

### Security Best Practices

- Enable VPC Flow Logs for network monitoring
- Use separate security groups for each service layer
- Enable CloudWatch Logs for all services
- Use IAM roles for service authentication (no access keys)
- Enable deletion protection only through parameters (not hardcoded)

## Success Criteria

- **Functionality**: Complete CI/CD pipeline that deploys to ECS and manages RDS
- **Performance**: ECS tasks can scale based on demand
- **Reliability**: Multi-AZ deployment for high availability
- **Security**: All credentials in Secrets Manager, encrypted at rest and in transit
- **Resource Naming**: All resources include EnvironmentSuffix parameter
- **Code Quality**: Valid CloudFormation YAML, well-documented, comprehensive tests
- **Compliance**: Network isolation with private subnets, audit trails through CloudWatch

## What to deliver

- Complete CloudFormation YAML implementation in TapStack.yml
- VPC with public and private subnets, NAT Gateway, and Internet Gateway
- ECS cluster with task definitions and service configuration
- RDS PostgreSQL instance with security group and parameter group
- CodePipeline with source, build, and deploy stages
- EFS file system with mount targets in private subnets
- IAM roles and policies for all services (ECS tasks, CodePipeline, RDS)
- Security groups for each service layer (ECS, RDS, EFS)
- KMS keys for encryption
- CloudWatch Log Groups for all services
- Unit tests achieving 90% or higher code coverage
- Integration tests that validate deployed resources
- Documentation with deployment instructions and architecture overview
