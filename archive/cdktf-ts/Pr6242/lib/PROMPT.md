Hey team,

We have a fintech startup that is struggling with infrastructure consistency across their environments. They are running a payment processing platform and they keep hitting the same problem - their development environment works fine, but when they push to staging or production, things break. Configuration drift between environments is causing deployment failures and security inconsistencies. This is a serious issue for a payment platform where consistency and reliability are critical.

The root problem is that they have been manually configuring infrastructure in each environment, and over time, the environments have diverged. They need a way to maintain identical infrastructure across development, staging, and production while still allowing for environment-specific variations like instance sizes and retention policies. We need to solve this using infrastructure as code that can be reliably applied to any environment.

The business needs this infrastructure deployed to the us-west-2 region with three completely isolated environments. Each environment should be functionally identical but sized appropriately for its purpose.

## What we need to build

Create a multi-environment infrastructure management system using **CDKTF with ts** for the fintech payment processing platform. The solution must support three isolated environments (dev, staging, prod) in the us-west-2 region with consistent configuration across all environments.

### Core Requirements

1. **Multi-Environment Architecture**
   - Deploy three isolated environments: dev, staging, and prod
   - Use Terraform workspaces to manage environment state separation
   - Each environment must have its own isolated VPC with no cross-environment connectivity
   - VPC peering between environments is explicitly forbidden
   - All resource names must include environmentSuffix parameter for uniqueness
   - Follow consistent naming convention: resource-type-environment-suffix

2. **Network Infrastructure**
   - VPC with 2 private subnets and 2 public subnets per environment
   - Single NAT gateway for outbound traffic from private subnets (cost optimized)
   - VPC endpoints for S3 and ECR access (cost optimization)
   - Application Load Balancers with security groups allowing HTTPS traffic only
   - Proper subnet distribution across availability zones

3. **Database Layer**
   - RDS PostgreSQL 14.x instances with encrypted storage
   - Customer-managed KMS keys for encryption
   - Environment-specific instance sizing:
     - dev: db.t3.micro
     - staging: db.t3.small
     - prod: db.m5.large
   - Database passwords stored in AWS Secrets Manager
   - Use data sources to reference secrets (not hardcoded values)

4. **Compute Layer**
   - ECS Fargate clusters for container workloads
   - Environment-specific task counts:
     - dev: 1 task
     - staging: 2 tasks
     - prod: 4 tasks
   - CloudWatch log groups with appropriate retention periods per environment

5. **Storage Layer**
   - S3 buckets for application assets
   - Versioning enabled on all buckets
   - Environment-specific lifecycle policies:
     - dev: 7 day retention
     - staging: 30 day retention
     - prod: 90 day retention

6. **State Management**
   - Remote state configuration in S3
   - DynamoDB table for state locking
   - Proper state isolation between environments using workspaces

### Technical Requirements

- All infrastructure defined using **CDKTF with ts**
- Use Terraform 1.5+ with AWS provider 5.x
- All resources must be modular and reusable
- Resource names must include environmentSuffix for uniqueness
- Deploy to us-west-2 region
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and validation
- Comprehensive inline documentation

### Tagging Strategy

Implement consistent tagging across all resources:
- Environment tag with environment name (dev/staging/prod)
- Project tag identifying the payment platform
- ManagedBy tag indicating infrastructure as code tool

### Security Requirements

- All sensitive values in AWS Secrets Manager
- RDS instances must use encrypted storage with customer-managed KMS keys
- Security groups must follow least privilege principle
- S3 buckets must have encryption enabled
- No hardcoded credentials or secrets in code

### Constraints

- No VPC peering between environments
- All environments must be completely isolated
- Must use Terraform workspaces for environment separation
- Database passwords cannot be hardcoded
- All resources must support destruction without manual intervention
- Instance sizes must match specified requirements per environment
- Lifecycle policies must match specified retention periods

## Success Criteria

- Functionality: Successfully deploy identical infrastructure to all three environments
- Consistency: All environments have the same resources with environment-specific sizing
- Security: All sensitive data in Secrets Manager, encrypted storage enabled
- Isolation: No connectivity between environments
- Destroyability: All resources can be destroyed cleanly via terraform destroy
- Resource Naming: All resources include environmentSuffix in their names
- Code Quality: ts code is well-structured, modular, and documented
- State Management: Remote state with locking working correctly

## What to deliver

- Complete CDKTF ts implementation
- Modular stack supporting multiple environments via configuration
- VPC with subnets, NAT gateways, and VPC endpoints
- RDS PostgreSQL instances with KMS encryption
- ECS Fargate clusters with environment-specific capacity
- Application Load Balancers with security groups
- S3 buckets with versioning and lifecycle policies
- CloudWatch log groups with retention policies
- Remote state backend configuration with locking
- AWS Secrets Manager integration for sensitive data
- Comprehensive tagging strategy implementation
- Documentation explaining deployment process and environment configuration