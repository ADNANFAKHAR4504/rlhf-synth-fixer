Hey team,

We have a fintech startup that needs to build a payment processing system with identical infrastructure across dev, staging, and production environments. The business requirement is strict consistency - features tested in lower environments need to behave exactly the same in production. At the same time, they want to optimize costs and scale appropriately for each environment.

This is a multi-environment challenge where we need to avoid code duplication while allowing environment-specific configurations for things like RDS instance sizes, Lambda memory allocations, and CloudWatch log retention. The company needs confidence that what works in dev will work in prod, with no surprises from infrastructure differences.

The existing pattern I see in many organizations is to copy-paste infrastructure code for each environment, which leads to drift and maintenance nightmares. We need something cleaner using modules and variable files.

## What we need to build

Create a multi-environment payment processing infrastructure using **Terraform with HCL** that maintains consistency across dev, staging, and production environments while allowing environment-specific scaling.

### Core Requirements

1. **Module Structure**
   - Create reusable Terraform modules that accept environment-specific variables
   - All environments must use identical module code with no duplication
   - Module structure should promote consistency and maintainability

2. **Lambda Functions**
   - Deploy Lambda functions for payment processing
   - Environment-specific memory allocations: dev (256MB), staging (512MB), prod (1024MB)
   - Environment-specific timeout settings appropriate for workload
   - All Lambda function names must include environmentSuffix for uniqueness

3. **RDS PostgreSQL Database**
   - Provision RDS PostgreSQL instances with environment-appropriate sizing
   - Instance classes: dev (t3.micro), staging (t3.small), prod (t3.medium)
   - Each environment requires separate database instance
   - Database names must include environmentSuffix

4. **VPC Networking**
   - Configure VPCs with consistent subnet patterns but different CIDR blocks per environment
   - Each environment has its own VPC with public/private subnets across 2 availability zones
   - CIDR blocks must not overlap between environments
   - All VPC resources must include environmentSuffix

5. **IAM Roles and Policies**
   - Implement least-privilege IAM roles that are environment-aware
   - Lambda execution roles with minimal required permissions
   - RDS access policies scoped to specific database instances
   - All IAM resources must include environmentSuffix

6. **CloudWatch Log Groups**
   - Set up log groups with environment-specific retention periods
   - Retention: dev (7 days), staging (30 days), prod (90 days)
   - Log groups for Lambda functions and RDS
   - All log group names must include environmentSuffix

7. **Security Groups**
   - Create security groups with environment-appropriate ingress rules
   - Dev allows broader access for testing, prod is restrictive
   - Proper security group associations for Lambda and RDS
   - All security groups must include environmentSuffix

8. **Remote State Backend**
   - Configure remote state with separate S3 buckets per environment
   - DynamoDB tables for state locking per environment
   - Backend configuration must be environment-aware
   - All state backend resources must include environmentSuffix

9. **Resource Tagging**
   - Implement consistent tagging across all environments
   - Required tags: Environment, Project, ManagedBy
   - Tags should be passed as variables to modules
   - Tagging must be enforced across all AWS resources

10. **Environment Configuration**
    - Use .tfvars files to manage environment-specific configurations
    - Separate tfvars files: dev.tfvars, staging.tfvars, prod.tfvars
    - Variables should include instance types, CIDR blocks, retention periods, memory allocations
    - No hardcoded environment values in module code

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **AWS Lambda** for payment processing functions
- Use **Amazon RDS PostgreSQL** for transaction storage
- Use **Amazon VPC** for network isolation
- Use **AWS IAM** for access control
- Use **Amazon CloudWatch** for logging and monitoring
- Use **Amazon S3** for Terraform state storage
- Use **Amazon DynamoDB** for state locking
- Resource naming convention: {project}-{environment}-{resource-type}-{identifier}
- All resource names must include **environmentSuffix** for uniqueness
- Deploy to **us-east-1** region

### Constraints

- All environments must use identical module structures with no code duplication
- Environment-specific variables must be isolated in separate .tfvars files
- RDS instance classes must follow specification: dev (t3.micro), staging (t3.small), prod (t3.medium)
- Lambda memory allocations must follow specification: dev (256MB), staging (512MB), prod (1024MB)
- CloudWatch log retention must follow specification: dev (7 days), staging (30 days), prod (90 days)
- All resources must be tagged with Environment, Project, and ManagedBy tags
- State files must be stored in separate S3 buckets per environment with DynamoDB locking
- Each environment must have its own VPC with identical patterns but different CIDR ranges
- Security group rules must be environment-aware
- All resources must be destroyable without manual intervention (no retention policies)
- No RemovalPolicy RETAIN or deletion_protection true flags
- Include proper error handling and logging

### Deployment Requirements (CRITICAL)

- All resource names must include **environmentSuffix** parameter to prevent naming conflicts
- Follow naming pattern: {project}-{environment-suffix}-{resource-type}
- All resources must be fully destroyable (skip_final_snapshot = true for RDS)
- No DeletionProtection or Retain policies allowed
- RDS instances must use minimal backup retention (1 day) for faster deployment

## Success Criteria

- Functionality: Infrastructure deploys successfully in all three environments (dev, staging, prod) with appropriate configurations
- Performance: RDS and Lambda resources scale appropriately per environment
- Reliability: State management works correctly with locking, no state corruption
- Security: Least-privilege IAM roles, proper security group rules, VPC isolation per environment
- Resource Naming: All resources include environmentSuffix for uniqueness across parallel deployments
- Code Quality: HCL modules are reusable, well-documented, no code duplication
- Maintainability: Single module codebase with clear separation of environment configurations

## What to deliver

- Complete Terraform HCL implementation with module structure
- Reusable modules for Lambda, RDS, VPC, IAM, CloudWatch, Security Groups
- Environment-specific .tfvars files (dev.tfvars, staging.tfvars, prod.tfvars)
- Backend configuration for S3 state storage with DynamoDB locking
- Main configuration that orchestrates all modules
- Variables file with all configurable parameters
- Outputs file with key resource identifiers
- Documentation on how to deploy to each environment
