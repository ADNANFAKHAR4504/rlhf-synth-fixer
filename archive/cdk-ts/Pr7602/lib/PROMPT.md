Hey team,

We need to build a secure CI/CD pipeline for HealthTech Solutions' new patient management system. This system is processing sensitive patient data, so we have to be really careful about security and compliance with healthcare regulations. The business wants us to deploy containerized applications to ECS and handle database updates for their PostgreSQL database, all while maintaining strict access controls and keeping detailed audit trails.

The challenge here is that we need to automate deployments but also make sure we're not exposing any sensitive information in the process. Healthcare data is serious business, and we need to demonstrate that we're handling credentials properly and that our deployment process is secure from end to end.

I've been asked to create this infrastructure using AWS CDK with TypeScript. The team wants everything defined as code so we can version control the infrastructure and make it repeatable across environments.

## What we need to build

Create a secure CI/CD pipeline infrastructure using **AWS CDK with TypeScript** that deploys containerized healthcare applications to ECS and manages PostgreSQL database updates with proper security controls.

### Core Requirements

1. **CI/CD Pipeline**
   - Set up AWS CodePipeline for automated deployments
   - Pipeline should trigger on code commits
   - Include build and deployment stages
   - Support both application and database updates
   - Pipeline must run in secure environment with proper IAM permissions

2. **Container Orchestration**
   - Deploy applications using Amazon ECS
   - Use Fargate launch type for serverless container management
   - ECS tasks must run in private subnets only
   - No direct internet access for containers
   - Outbound internet access only through NAT Gateway

3. **Database Infrastructure**
   - Amazon RDS PostgreSQL database
   - Store all database credentials in AWS Secrets Manager
   - Enable automatic credential rotation every 30 days
   - Database must be in private subnets
   - Enable encryption at rest
   - Enable automated backups with appropriate retention

4. **Persistent Storage**
   - Amazon EFS for shared persistent storage
   - EFS must be accessible from ECS tasks
   - Enable encryption at rest
   - Configure appropriate security groups

5. **Network Security**
   - VPC with public and private subnets
   - NAT Gateway for outbound internet access from private subnets
   - Security groups with least privilege access
   - Private subnets for ECS tasks and RDS
   - Public subnets only for NAT Gateway and Load Balancer

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **AWS CodePipeline** for CI/CD orchestration
- Use **Amazon ECS with Fargate** for container orchestration
- Use **Amazon RDS PostgreSQL** for database
- Use **AWS Secrets Manager** for credential management with 30-day rotation
- Use **Amazon EFS** for persistent storage
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies, no deletion protection)

### Deployment Requirements (CRITICAL)

- **Credential Rotation**: Secrets Manager must enable automatic rotation with 30-day rotation schedule
- **Network Isolation**: ECS tasks MUST run in private subnets with NO direct internet access
- **Outbound Access**: Use NAT Gateway for outbound internet connectivity from private subnets
- **Resource Naming**: ALL named resources must include environmentSuffix to prevent conflicts
- **Destroyability**: No RemovalPolicy.RETAIN, no deletionProtection: true, all resources must be fully destroyable
- **RDS Settings**: skip_final_snapshot should be enabled for test environments

### Constraints

- Database credentials stored only in AWS Secrets Manager, never in code or environment variables
- Automatic credential rotation every 30 days is mandatory
- ECS tasks must run in private subnets with outbound internet access through NAT Gateway only
- No ECS tasks should have direct internet access
- All resources must be fully destroyable for test environment cleanup
- Include proper error handling and logging
- Follow AWS security best practices for healthcare data

## Success Criteria

- **Functionality**: Complete CI/CD pipeline that can deploy containers and update database
- **Security**: All credentials in Secrets Manager with 30-day rotation, ECS tasks isolated in private subnets
- **Network Isolation**: ECS tasks accessible only through load balancer, database accessible only from ECS
- **Storage**: EFS accessible from ECS tasks with proper encryption
- **Resource Naming**: All resources include environmentSuffix for parallel deployments
- **Destroyability**: All resources can be completely destroyed without manual intervention
- **Code Quality**: Well-structured TypeScript code, properly typed, documented

## What to deliver

- Complete AWS CDK TypeScript implementation
- AWS CodePipeline for CI/CD automation
- Amazon ECS with Fargate for container orchestration
- Amazon RDS PostgreSQL with Secrets Manager integration
- Amazon EFS for persistent storage
- VPC with proper subnet isolation and NAT Gateway
- Security groups with least privilege access
- Unit tests for all infrastructure components
- Documentation with deployment instructions
- All resources tagged with environmentSuffix